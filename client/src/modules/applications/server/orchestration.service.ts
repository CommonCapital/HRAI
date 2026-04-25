// src/modules/applications/server/orchestration.service.ts
//
// All imports verified against actual codebase files.
// DB insert shape copied exactly from candidates router analyzeCV mutation.

import { db } from "@/db";
import { applications, jobListings, cvAnalysis, meetings, agents, meetingTypes } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { extractTextFromPDF, extractCandidateInfo, analyzeCVWithAI } from "@/modules/candidates/services/ai.services";
import { storeFile, deleteFile } from "@/modules/candidates/services/file-storage";
import { sanitizeAnalysisData } from "@/modules/candidates/controllers/cv.controllers";
import { streamVideo } from "@/lib/stream-video";
import { GeneratdAvatarUri } from "@/lib/avatar";
import { sendEmail, buildInterviewInviteEmail } from "@/lib/plunk";

const AUTO_INTERVIEW_THRESHOLD = new Set(["Strong Hire", "Hire", "Interview"]);

export interface OrchestrationResult {
  ranPipeline:    boolean;
  cvAnalysisId:   string | null;
  meetingId:      string | null;
  meetingLink:    string | null;
  emailSent:      boolean;
  skipReason?:    string;
}

export async function runOrchestrationPipeline(params: {
  applicationId:  string;
  jobId:          string;
  candidateName:  string;
  candidateEmail: string;
  cvUrl:          string;
  recruiterId:    string;
}): Promise<OrchestrationResult> {
  const NOOP: OrchestrationResult = {
    ranPipeline: false, cvAnalysisId: null,
    meetingId: null, meetingLink: null, emailSent: false,
  };

  try {
    // ── 0. Load job + check flags ─────────────────────────────────────────────
    const [job] = await db.select().from(jobListings).where(eq(jobListings.id, params.jobId));

    if (!job)                return { ...NOOP, skipReason: "job_not_found" };
    if (!job.autoOrchestrate) return { ...NOOP, skipReason: "auto_orchestrate_off" };
    if (!job.agentId)         return { ...NOOP, skipReason: "no_agent_assigned" };

    console.log(`[orchestration] Starting pipeline for application ${params.applicationId}`);

    // ── 0b. Load agent early — its instructions feed into CV evaluation ────────
    const [agent] = await db.select().from(agents).where(eq(agents.id, job.agentId!));
    if (!agent) {
      console.error("[orchestration] Agent not found:", job.agentId);
      return { ...NOOP, skipReason: "agent_not_found" };
    }
    console.log(`[orchestration] Agent loaded: ${agent.name}`);

    // ── 1. Fetch CV from URL + store in memory cache for extractTextFromPDF ───
    let cvText = "";
    try {
      console.log(`[orchestration] Fetching CV from: ${params.cvUrl}`);

      // Guard: cvUrl must be an absolute HTTP(S) URL.
      // If your upload returns a local path or blob URL, fetch() will fail here.
      if (!params.cvUrl.startsWith("http://") && !params.cvUrl.startsWith("https://")) {
        throw new Error(
          `cvUrl is not an absolute URL: "${params.cvUrl}". ` +
          `Make sure your file upload service returns a full https:// URL, not a local path.`
        );
      }

      const cvResponse = await fetch(params.cvUrl);
      if (!cvResponse.ok) {
        throw new Error(`CV fetch failed — HTTP ${cvResponse.status} from ${params.cvUrl}`);
      }

      const buffer = Buffer.from(await cvResponse.arrayBuffer());
      console.log(`[orchestration] CV fetched: ${buffer.length} bytes`);

      if (buffer.length < 100) {
        throw new Error(`CV buffer suspiciously small (${buffer.length} bytes) — likely empty or fetch failed`);
      }

      const fileKey = `cv:orchestration:${params.applicationId}:${Date.now()}`;
      storeFile(fileKey, buffer, 3600);
      cvText = await extractTextFromPDF(fileKey);
      deleteFile(fileKey);

      console.log(`[orchestration] CV text extracted: ${cvText.length} chars`);

      if (cvText.trim().length < 100) {
        console.warn(`[orchestration] Very little text extracted (${cvText.length} chars). ` +
          `PDF may be image-based — Vision fallback will attempt extraction.`);
      }
    } catch (err: any) {
      console.error("[orchestration] CV extraction failed:", err.message);
      return { ...NOOP, skipReason: "cv_extraction_failed", ranPipeline: true };
    }

    // ── 2. Build criteria string — job fields + agent instructions ──────────────
    const criteriaText = buildCriteriaFromJob(job, agent);

    // ── 3. Extract candidate info + run AI analysis ───────────────────────────
    let analysis: any;
    try {
      const candidateInfo = await extractCandidateInfo(cvText);

      let raw = await analyzeCVWithAI(cvText, criteriaText);
      raw = sanitizeAnalysisData(raw);

      if (!raw.recommendation) raw.recommendation = "Pass";
      if (!raw.overallScore && raw.overallScore !== 0) raw.overallScore = 50;
      if (!raw.summary) raw.summary = "Auto-analysis completed.";

      analysis = { ...raw, candidateInfo };
    } catch (err: any) {
      console.error("[orchestration] AI analysis failed:", err.message);
      return { ...NOOP, skipReason: "ai_analysis_failed", ranPipeline: true };
    }

    // ── 4. Save cvAnalysis row — shape copied from candidates router exactly ──
    let savedAnalysisId: string | null = null;
    try {
      const candidateInfo = analysis.candidateInfo ?? {};
      const pageCount = (cvText.match(/━━━ PAGE \d+ START ━━━/g) || []).length || 1;

      const [savedAnalysis] = await db
        .insert(cvAnalysis)
        .values({
          userId:        params.recruiterId,
          cvText:        cvText,
          candidateName: analysis.overview?.candidateName || candidateInfo.name || params.candidateName,
          currentRole:   candidateInfo.currentRole || analysis.overview?.currentRole || "Unknown",
          industry:      candidateInfo.industry || analysis.overview?.industry || "Unknown",

          inputs: {
            cvSource:        "Auto — job application",
            dateReceived:    new Date(),
            pageCount:       pageCount,
            jobCriteriaUsed: `${job.title} — Auto job criteria`,
          },

          missingCriticalInfo: analysis.missingCriticalInfo || [],
          completenessScore:   analysis.completenessScore   || 0,

          overview:         analysis.overview         || {},
          careerTrajectory: analysis.careerTrajectory || {},
          workHistory:      analysis.workHistory      || {},
          experienceMatch:  analysis.experienceMatch  || { score: 0 },
          skills:           analysis.skills           || {},
          education:        analysis.education        || {},
          redFlags:         analysis.redFlags         || { critical: [], moderate: [], minor: [] },
          roleAlignment:    analysis.roleAlignment    || {
            score: 0, hiringRecommendation: "", requirementsAssessment: "", strengths: [], gaps: [],
          },
          compensation: analysis.compensation || {},
          nextSteps:    analysis.nextSteps    || [],

          recommendation: analysis.recommendation,
          summary:        analysis.summary,
          overallScore:   analysis.overallScore || 0,
          aiModel:        "gpt-4o",
          language:       "en",
        })
        .returning();

      savedAnalysisId = savedAnalysis.id;

      // Update application: link analysis + move status to in_review
      await db
        .update(applications)
        .set({ cvAnalysisId: savedAnalysisId, status: "in_review" })
        .where(eq(applications.id, params.applicationId));

      console.log(`[orchestration] CV analysis saved: ${savedAnalysisId}, status → in_review`);
    } catch (err: any) {
      console.error("[orchestration] Save analysis failed:", err.message);
    }

    // ── 5. Check recommendation threshold ────────────────────────────────────
    if (!AUTO_INTERVIEW_THRESHOLD.has(analysis.recommendation)) {
      console.log(`[orchestration] Recommendation "${analysis.recommendation}" — no interview.`);
      await db.update(applications).set({ autoHandled: true }).where(eq(applications.id, params.applicationId));
      return {
        ranPipeline: true, cvAnalysisId: savedAnalysisId,
        meetingId: null, meetingLink: null, emailSent: false,
        skipReason: `recommendation_${analysis.recommendation.toLowerCase().replace(/ /g, "_")}`,
      };
    }

    // ── 6. Determine Scheduling Link (Replacement for direct meeting) ────────
    let meetingLink: string | null = null;
    let savedMeetingId: string | null = null; // Will remain null as we don't create meeting yet

    try {
      // Find the recruiter's default meeting type to send a scheduling link
      const [mt] = await db
        .select()
        .from(meetingTypes)
        .where(
          and(
            eq(meetingTypes.hostId, params.recruiterId),
            eq(meetingTypes.isDefault, true)
          )
        );

      if (mt) {
        meetingLink = `${process.env.NEXT_PUBLIC_APP_URL}/schedule/${mt.slug}`;
        console.log(`[orchestration] Scheduling link generated: ${meetingLink}`);
      } else {
          // Fallback to searching for the first available meeting type if no default is marked
          const [firstMt] = await db
            .select()
            .from(meetingTypes)
            .where(eq(meetingTypes.hostId, params.recruiterId));
          
          if (firstMt) {
            meetingLink = `${process.env.NEXT_PUBLIC_APP_URL}/schedule/${firstMt.slug}`;
            console.log(`[orchestration] Fallback scheduling link generated: ${meetingLink}`);
          } else {
            console.warn(`[orchestration] No meeting types found for recruiter ${params.recruiterId}. Cannot send scheduling link.`);
          }
      }

      await db
        .update(applications)
        .set({ autoHandled: true })
        .where(eq(applications.id, params.applicationId));
    } catch (err: any) {
      console.error("[orchestration] Scheduling link generation failed:", err.message);
    }

    // ── 8. Send Plunk email ───────────────────────────────────────────────────
    let emailSent = false;
    if (meetingLink && params.candidateEmail) {
      try {
        const { subject, body } = buildInterviewInviteEmail({
          candidateName: params.candidateName,
          jobTitle:      job.title,
          meetingLink,
          companyName:   job.companyName || undefined,
        });
        const result = await sendEmail({ to: params.candidateEmail, subject, body });
        emailSent = result.success;
        if (!result.success) console.warn("[orchestration] Email failed:", result.error);
        else console.log(`[orchestration] Interview invite sent to ${params.candidateEmail}`);
      } catch (err: any) {
        console.error("[orchestration] Email error:", err.message);
      }
    }

    await db.update(applications).set({ autoHandled: true }).where(eq(applications.id, params.applicationId));

    return { ranPipeline: true, cvAnalysisId: savedAnalysisId, meetingId: savedMeetingId, meetingLink, emailSent };

  } catch (err: any) {
    console.error("[orchestration] Unexpected error:", err);
    return { ...NOOP, skipReason: "unexpected_error", ranPipeline: true };
  }
}

// ── Build criteria text from job listing fields ───────────────────────────────
// Passed as criteriaText to analyzeCVWithAI — plain text format the AI understands.

function buildCriteriaFromJob(job: any, agent?: any): string {
  const parts: string[] = [];
  parts.push(`Job Title: ${job.title}`);
  if (job.description)    parts.push(`Description:\n${job.description}`);
  if (job.location)       parts.push(`Location: ${job.location}`);
  if (job.employmentType) parts.push(`Employment Type: ${job.employmentType.replace(/_/g, " ")}`);
  if (job.workplaceType)  parts.push(`Workplace: ${job.workplaceType.replace(/_/g, " ")}`);
  if (job.salaryMin || job.salaryMax) {
    const curr = job.salaryCurrency ?? "USD";
    if (job.salaryMin && job.salaryMax)
      parts.push(`Salary Range: ${job.salaryMin.toLocaleString()} – ${job.salaryMax.toLocaleString()} ${curr}`);
    else
      parts.push(`Salary: ${(job.salaryMin ?? job.salaryMax).toLocaleString()} ${curr}`);
  }
  if (job.tags?.length) parts.push(`Required Skills / Tags: ${job.tags.join(", ")}`);

  // Agent instructions — recruiter's custom screening criteria, persona, and deal-breakers
  if (agent?.instructions?.trim()) {
    parts.push(`\n--- SCREENING INSTRUCTIONS FROM HIRING MANAGER ---\n${agent.instructions.trim()}\n--- END SCREENING INSTRUCTIONS ---`);
  }

  return parts.join("\n");
}