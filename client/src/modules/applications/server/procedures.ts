// src/modules/applications/server/procedures.ts
// Wire into root router as:  applications: applicationsRouter
import { waitUntil } from "@vercel/functions";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { db } from "@/db";
import { applications, jobListings, cvAnalysis } from "@/db/schema";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, count, desc, eq, getTableColumns, ilike, or } from "drizzle-orm";
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
} from "@/constants";
import { runOrchestrationPipeline } from "./orchestration.service";
import { inngest } from "@/inngest/client";

// ─── Shared schemas ───────────────────────────────────────────────────────────

const educationEntrySchema = z.object({
  institution: z.string(),
  degree: z.string(),
  field: z.string(),
  graduationYear: z.string(),
});

const experienceYearsSchema = z.enum(["0-1", "1-3", "3-5", "5-10", "10+"]);

const applicationStatusSchema = z.enum([
  "submitted",
  "in_review",
  "shortlisted",
  "rejected",
  "accepted",
]);

// ─── Router ───────────────────────────────────────────────────────────────────

export const applicationsRouter = createTRPCRouter({

  // ── submit — public, no auth ──────────────────────────────────────────────
  submit: baseProcedure
    .input(z.object({
      jobId: z.string().min(1),

      fullName: z.string().min(1, "Full name is required"),
      email: z.string().email("Valid email required"),
      phone: z.string().optional(),
      locationCity: z.string().min(1, "Location is required"),

      currentRole: z.string().min(1, "Current role is required"),
      experienceYears: experienceYearsSchema,
      linkedin: z.string().url().optional().or(z.literal("")),
      portfolio: z.string().url().optional().or(z.literal("")),

      motivation: z.string().min(30, "Please write at least a few sentences"),
      skills: z.string().min(10, "Please list your key skills"),
      education: z.array(educationEntrySchema).optional(),

      cvUrl: z.string().min(1, "CV upload is required"),
      coverLetterUrl: z.string().optional(),

      termsAccepted: z.literal(true, {
        errorMap: () => ({ message: "You must accept the terms to submit" }),
      }),
    }))
    .mutation(async ({ input }) => {
      // Verify job exists and is active
      const [job] = await db
        .select()
        .from(jobListings)
        .where(eq(jobListings.id, input.jobId));

      if (!job) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Job listing not found." });
      }
      if (!job.isActive) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This position is no longer accepting applications.",
        });
      }

      // Prevent duplicate submissions from same email
      const [duplicate] = await db
        .select({ id: applications.id })
        .from(applications)
        .where(and(
          eq(applications.jobId, input.jobId),
          eq(applications.email, input.email.toLowerCase()),
        ));

      if (duplicate) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You have already submitted an application for this position.",
        });
      }

      // Save application
      const [inserted] = await db
        .insert(applications)
        .values({
          jobId: input.jobId,
          applicantUserId: null,
          fullName: input.fullName.trim(),
          email: input.email.toLowerCase().trim(),
          phone: input.phone?.trim() ?? null,
          locationCity: input.locationCity.trim(),
          currentRole: input.currentRole.trim(),
          experienceYears: input.experienceYears,
          linkedin: input.linkedin || null,
          portfolio: input.portfolio || null,
          motivation: input.motivation.trim(),
          skills: input.skills.trim(),
          education: input.education ?? null,
          cvUrl: input.cvUrl,
          coverLetterUrl: input.coverLetterUrl || null,
          status: "submitted",
          termsAccepted: true,
          autoHandled: false,
        })
        .returning();

      // ── Fire orchestration pipeline (non-blocking — never throws) ──────────
      // Run after response is sent so candidate doesn't wait for AI analysis.
      // Use setImmediate so the mutation returns first, pipeline runs after.
      if (job.autoOrchestrate && job.agentId) {
        await inngest.send({
          name: "application/submitted",
          data: {
            applicationId: inserted.id,
            jobId: input.jobId,
            candidateName: inserted.fullName,
            candidateEmail: inserted.email,
            cvUrl: inserted.cvUrl,
            recruiterId: job.postedByUserId!,
          },
        });
      }

      return {
        applicationId: inserted.id,
        jobTitle: job.title,
        autoOrchestrate: job.autoOrchestrate,
      };
    }),

  // ── listForJob — protected, owner only ───────────────────────────────────
  listForJob: protectedProcedure
    .input(z.object({
      jobId: z.string(),
      page: z.number().default(DEFAULT_PAGE),
      pageSize: z.number().min(MIN_PAGE_SIZE).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
      search: z.string().nullish(),
      status: applicationStatusSchema.nullish(),
    }))
    .query(async ({ ctx, input }) => {
      const [job] = await db
        .select({ id: jobListings.id, title: jobListings.title, postedByUserId: jobListings.postedByUserId })
        .from(jobListings)
        .where(eq(jobListings.id, input.jobId));

      if (!job) throw new TRPCError({ code: "NOT_FOUND" });
      if (job.postedByUserId !== ctx.auth.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      const { page, pageSize, search, status } = input;
      const conditions = [eq(applications.jobId, input.jobId)];

      if (search?.trim()) {
        conditions.push(or(
          ilike(applications.fullName, `%${search}%`),
          ilike(applications.email, `%${search}%`),
          ilike(applications.currentRole, `%${search}%`),
        )!);
      }
      if (status) conditions.push(eq(applications.status, status));

      const data = await db
        .select({
          ...getTableColumns(applications),
          aiScore: cvAnalysis.overallScore,
        })
        .from(applications)
        .leftJoin(cvAnalysis, eq(applications.cvAnalysisId, cvAnalysis.id))
        .where(and(...conditions))
        .orderBy(desc(cvAnalysis.overallScore), desc(applications.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      const [total] = await db
        .select({ count: count() })
        .from(applications)
        .where(and(...conditions));

      return {
        items: data,
        total: total.count,
        totalPages: Math.ceil(total.count / pageSize),
        job: { id: job.id, title: job.title },
      };
    }),

  // ── getOne — protected, owner only ───────────────────────────────────────
  getOne: protectedProcedure
    .input(z.object({ applicationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [application] = await db
        .select()
        .from(applications)
        .where(eq(applications.id, input.applicationId));

      if (!application) throw new TRPCError({ code: "NOT_FOUND" });

      const [job] = await db
        .select({ postedByUserId: jobListings.postedByUserId })
        .from(jobListings)
        .where(eq(jobListings.id, application.jobId));

      if (!job || job.postedByUserId !== ctx.auth.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return application;
    }),

  // ── updateStatus — protected, owner only ─────────────────────────────────
  updateStatus: protectedProcedure
    .input(z.object({
      applicationId: z.string(),
      status: applicationStatusSchema.optional(),
      recruiterNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [application] = await db
        .select({ jobId: applications.jobId })
        .from(applications)
        .where(eq(applications.id, input.applicationId));

      if (!application) throw new TRPCError({ code: "NOT_FOUND" });

      const [job] = await db
        .select({ postedByUserId: jobListings.postedByUserId })
        .from(jobListings)
        .where(eq(jobListings.id, application.jobId));

      if (!job || job.postedByUserId !== ctx.auth.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const patch: Record<string, unknown> = { updatedAt: new Date() };
      if (input.status !== undefined) patch.status = input.status;
      if (input.recruiterNotes !== undefined) patch.recruiterNotes = input.recruiterNotes;

      const [updated] = await db
        .update(applications)
        .set(patch)
        .where(eq(applications.id, input.applicationId))
        .returning();

      return updated;
    }),

  // ── triggerOrchestration — manual trigger from Attendees drawer ──────────
  // Used when autoOrchestrate was off at time of submission but recruiter
  // wants to run the pipeline manually for a specific application.
  triggerOrchestration: protectedProcedure
    .input(z.object({ applicationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [application] = await db
        .select()
        .from(applications)
        .where(eq(applications.id, input.applicationId));

      if (!application) throw new TRPCError({ code: "NOT_FOUND" });

      const [job] = await db
        .select()
        .from(jobListings)
        .where(eq(jobListings.id, application.jobId));

      if (!job || job.postedByUserId !== ctx.auth.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      if (!job.agentId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No AI agent is assigned to this job listing. Edit the listing to add one.",
        });
      }

      // Run pipeline synchronously so the mutation can return the result
      const result = await runOrchestrationPipeline({
        applicationId: application.id,
        jobId: application.jobId,
        candidateName: application.fullName,
        candidateEmail: application.email,
        cvUrl: application.cvUrl,
        recruiterId: ctx.auth.user.id,
      });

      return result;
    }),

  // ── myJobsWithCounts — for the job selector in Attendees ─────────────────
  myJobsWithCounts: protectedProcedure
    .query(async ({ ctx }) => {
      const result = await db
        .select({
          id: jobListings.id,
          title: jobListings.title,
          agentId: jobListings.agentId,
          autoOrchestrate: jobListings.autoOrchestrate,
          applicationCount: count(applications.id),
        })
        .from(jobListings)
        .leftJoin(applications, eq(applications.jobId, jobListings.id))
        .where(eq(jobListings.postedByUserId, ctx.auth.user.id))
        .groupBy(jobListings.id)
        .orderBy(desc(jobListings.createdAt));

      return result;
    }),

  autoFill: baseProcedure
    .input(z.object({
      jobId: z.string(),
      currentRole: z.string().optional(),
      skills: z.string().optional(),
      motivation: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { jobId, currentRole, skills, motivation } = input;

      const [job] = await db.select().from(jobListings).where(eq(jobListings.id, jobId));
      if (!job) throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });

      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert career coach helping a candidate apply for a job. Based on the job title and the candidate's current role/skills, improve their motivation statement and refine their skill list. Be professional, concise, and persuasive. Return only JSON.",
          },
          {
            role: "user",
            content: `Candidate applying for: ${job.title}
Current Role: ${currentRole || "Not specified"}
Current Skills: ${skills || "Not specified"}
Current Motivation: ${motivation || "Not specified"}

Return ONLY a valid JSON object:
{
  "motivation": "Improved motivation statement (2-3 sentences)",
  "skills": "Refined, comma-separated skill list"
}`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const raw = completion.choices[0].message.content ?? "{}";
      try {
        const data = JSON.parse(raw);
        return {
          motivation: typeof data.motivation === "string" ? data.motivation : motivation || "",
          skills: typeof data.skills === "string" ? data.skills : skills || "",
        };
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI failed to generate content." });
      }
    }),
});