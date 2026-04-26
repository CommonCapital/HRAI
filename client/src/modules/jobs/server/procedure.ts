import { TRPCError } from "@trpc/server";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { createTRPCRouter, protectedProcedure, baseProcedure } from "@/trpc/init";
import { applications, jobListings, notifications } from "@/db/schema";
import { inngest } from "@/inngest/client";

// ─── Shared validators ────────────────────────────────────────────────────────

const employmentTypeSchema = z.enum([
  "full_time",
  "part_time",
  "contract",
  "internship",
  "temporary",
]);

const workplaceTypeSchema = z.enum(["on_site", "remote", "hybrid"]);

const jobFormSchema = z.object({
  title:               z.string().min(1, "Title is required").max(200),
  description:         z.string().min(1, "Description is required"),
  location:            z.string().min(1, "Location is required").max(200),
  employmentType:      employmentTypeSchema,
  workplaceType:       workplaceTypeSchema,
  salaryMin:           z.number().int().positive().nullable().optional(),
  salaryMax:           z.number().int().positive().nullable().optional(),
  salaryCurrency:      z.string().default("USD"),
  tags:                z.array(z.string()).optional(),
  autoCloseOnAccept:   z.boolean().optional().default(false),
  agentId:             z.string().optional(),
  autoOrchestrate:     z.boolean().optional().default(false),
  applicationDeadline: z.date().nullable().optional(),
  topCandidateLimit:   z.number().int().min(1).default(10),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function buildSearchText(input: {
  title: string;
  description: string;
  location: string;
  tags: string[];
}): string {
  return [
    input.title,
    stripHtml(input.description),
    input.location,
    input.tags.join(" "),
  ]
    .join(" ")
    .toLowerCase();
}

function normalizeTags(tags?: string[]): string[] {
  return (tags ?? [])
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0);
}

async function requireOwner(jobId: string, userId: string) {
  const [job] = await db
    .select()
    .from(jobListings)
    .where(eq(jobListings.id, jobId));
  if (!job) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Job not found." });
  }
  if (job.postedByUserId !== userId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You can only manage jobs you posted.",
    });
  }
  return job;
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const jobsRouter = createTRPCRouter({

  myJobs: protectedProcedure
    .input(
      z.object({
        includeClosed: z.boolean().optional().default(false),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(jobListings.postedByUserId, ctx.auth.user.id)];
      if (!input.includeClosed) {
        conditions.push(eq(jobListings.isActive, true));
      }
      return db
        .select()
        .from(jobListings)
        .where(and(...conditions))
        .orderBy(desc(jobListings.createdAt));
    }),

  getById: baseProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ input }) => {
      const [job] = await db
        .select()
        .from(jobListings)
        .where(eq(jobListings.id, input.jobId));
      if (!job) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Job not found." });
      }
      return job;
    }),

  create: protectedProcedure
    .input(jobFormSchema)
    .mutation(async ({ ctx, input }) => {
      if (
        input.salaryMin != null &&
        input.salaryMax != null &&
        input.salaryMin > input.salaryMax
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Minimum salary cannot exceed maximum.",
        });
      }

      const tags = normalizeTags(input.tags);

      const [inserted] = await db
        .insert(jobListings)
        .values({
          companyId:         null as any,
          companyName:       "",
          title:             input.title.trim(),
          description:       input.description.trim(),
          location:          input.location.trim(),
          employmentType:    input.employmentType,
          workplaceType:     input.workplaceType,
          salaryMin:         input.salaryMin ?? null,
          salaryMax:         input.salaryMax ?? null,
          salaryCurrency:    input.salaryCurrency,
          tags,
          searchText:        buildSearchText({
            title:       input.title,
            description: input.description,
            location:    input.location,
            tags,
          }),
          isActive:          true,
          featured:          false,
          autoCloseOnAccept: input.autoCloseOnAccept ?? false,
          applicationCount:  0,
          postedByUserId:    ctx.auth.user.id,
          agentId:             input.agentId        ?? null,
          autoOrchestrate:     input.autoOrchestrate ?? false,
          applicationDeadline: input.applicationDeadline ?? null,
          topCandidateLimit:   input.topCandidateLimit ?? 10,
        })
        .returning({ id: jobListings.id });

      // Schedule deadline trigger if deadline is set
      if (input.applicationDeadline) {
        await inngest.send({
          name: "job/deadline.reached",
          data: { jobId: inserted.id },
          runAt: input.applicationDeadline,
        });
      }

      return {
        id:              inserted.id,
        title:           input.title.trim(),
        autoOrchestrate: input.autoOrchestrate ?? false,
      };
    }),

  update: protectedProcedure
    .input(
      z
        .object({
          jobId:    z.string(),
          isActive: z.boolean().optional(),
        })
        .merge(jobFormSchema.partial()),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await requireOwner(input.jobId, ctx.auth.user.id);

      const resolvedMin = input.salaryMin ?? existing.salaryMin ?? undefined;
      const resolvedMax = input.salaryMax ?? existing.salaryMax ?? undefined;
      if (
        resolvedMin !== undefined &&
        resolvedMax !== undefined &&
        resolvedMin > resolvedMax
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Minimum salary cannot exceed maximum.",
        });
      }

      const tags        = input.tags        ? normalizeTags(input.tags) : existing.tags;
      const title       = input.title       ?? existing.title;
      const description = input.description ?? existing.description;
      const location    = input.location    ?? existing.location;

      const patch: Record<string, unknown> = {
        tags,
        searchText: buildSearchText({ title, description, location, tags }),
        updatedAt:  new Date(),
      };

      if (input.title             !== undefined) patch.title             = input.title.trim();
      if (input.description       !== undefined) patch.description       = input.description.trim();
      if (input.location          !== undefined) patch.location          = input.location.trim();
      if (input.employmentType    !== undefined) patch.employmentType    = input.employmentType;
      if (input.workplaceType     !== undefined) patch.workplaceType     = input.workplaceType;
      if (input.salaryMin         !== undefined) patch.salaryMin         = input.salaryMin;
      if (input.salaryMax         !== undefined) patch.salaryMax         = input.salaryMax;
      if (input.salaryCurrency    !== undefined) patch.salaryCurrency    = input.salaryCurrency;
      if (input.autoCloseOnAccept !== undefined) patch.autoCloseOnAccept = input.autoCloseOnAccept;
      if (input.isActive          !== undefined) {
        patch.isActive = input.isActive;
        if (!input.isActive) patch.closedAt = new Date();
      }
      if (input.agentId !== undefined) {
        patch.agentId = input.agentId || null;
        if (!input.agentId) patch.autoOrchestrate = false;
      }
      if (input.autoOrchestrate !== undefined) {
        const effectiveAgent = input.agentId ?? existing.agentId;
        patch.autoOrchestrate = input.autoOrchestrate && !!effectiveAgent;
      }
      if (input.applicationDeadline !== undefined) patch.applicationDeadline = input.applicationDeadline;
      if (input.topCandidateLimit   !== undefined) patch.topCandidateLimit   = input.topCandidateLimit;

      await db
        .update(jobListings)
        .set(patch)
        .where(eq(jobListings.id, input.jobId));

      // Re-schedule deadline trigger if deadline changed
      if (input.applicationDeadline && input.applicationDeadline.getTime() !== existing.applicationDeadline?.getTime()) {
        await inngest.send({
          name: "job/deadline.reached",
          data: { jobId: input.jobId },
          runAt: input.applicationDeadline,
        });
      }

      return { success: true };
    }),

  close: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await requireOwner(input.jobId, ctx.auth.user.id);
      const now = new Date();

      await db
        .update(jobListings)
        .set({ isActive: false, closedAt: now, updatedAt: now })
        .where(eq(jobListings.id, input.jobId));

      try {
        const pending = await db
          .select({ applicantUserId: applications.applicantUserId })
          .from(applications)
          .where(
            and(
              eq(applications.jobId, input.jobId),
              or(
                eq(applications.status, "submitted"),
                eq(applications.status, "in_review"),
              ),
            ),
          );

        const validApplicants = pending.filter(
          (a): a is { applicantUserId: string } => a.applicantUserId !== null,
        );

        if (validApplicants.length > 0 && notifications) {
          await db.insert(notifications).values(
            validApplicants.map((a) => ({
              userId:   a.applicantUserId,
              type:     "job_closed" as const,
              title:    "Job listing closed",
              message:  "This job listing is no longer accepting applications.",
              linkUrl:  "/applications",
              metadata: { jobId: input.jobId },
              isRead:   false,
            })),
          );
        }
      } catch (notifyErr) {
        console.warn("[jobs.close] Notification insert failed (non-fatal):", notifyErr);
      }

      return { success: true };
    }),

  toggleAutoClose: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const job = await requireOwner(input.jobId, ctx.auth.user.id);
      const next = !job.autoCloseOnAccept;

      await db
        .update(jobListings)
        .set({ autoCloseOnAccept: next, updatedAt: new Date() })
        .where(eq(jobListings.id, input.jobId));

      return { autoCloseOnAccept: next };
    }),

  search: baseProcedure
    .input(
      z.object({
        searchText:     z.string().optional(),
        location:       z.string().optional(),
        workplaceType:  workplaceTypeSchema.optional(),
        employmentType: employmentTypeSchema.optional(),
        minSalary:      z.number().optional(),
        tags:           z.array(z.string()).optional(),
        limit:          z.number().min(1).max(100).optional().default(20),
        offset:         z.number().min(0).optional().default(0),
      }),
    )
    .query(async ({ input }) => {
      const conditions = [eq(jobListings.isActive, true)];

      if (input.searchText?.trim())
        conditions.push(ilike(jobListings.searchText, `%${input.searchText.trim()}%`));
      if (input.workplaceType)
        conditions.push(eq(jobListings.workplaceType, input.workplaceType));
      if (input.employmentType)
        conditions.push(eq(jobListings.employmentType, input.employmentType));
      if (input.location)
        conditions.push(ilike(jobListings.location, `%${input.location}%`));
      if (input.minSalary !== undefined)
        conditions.push(
          sql`COALESCE(${jobListings.salaryMax}, ${jobListings.salaryMin}, 0) >= ${input.minSalary}`,
        );
      if (input.tags?.length) {
        const normalized = normalizeTags(input.tags);
        conditions.push(
          sql`${jobListings.tags} @> ARRAY[${sql.join(
            normalized.map((t) => sql`${t}`),
            sql`, `,
          )}]::text[]`,
        );
      }

      return db
        .select()
        .from(jobListings)
        .where(and(...conditions))
        .orderBy(desc(jobListings.createdAt))
        .limit(input.limit)
        .offset(input.offset);
    }),

  // ─── AI Auto-fill ─────────────────────────────────────────────────────────
  autoFill: protectedProcedure
    .input(z.object({ 
      title: z.string().optional(),
      description: z.string().optional(),
      location: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      if (!process.env.OPENAI_API_KEY) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "OPENAI_API_KEY not set." });
      }

      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are an expert technical recruiter. Based on the provided partial job information, generate a professional, high-quality, and complete job listing. If the description is already provided, improve it to be more professional and thorough. Return only valid JSON.",
          },
          {
            role: "user",
            content: `Complete/Improve this job listing:
Title: ${input.title || "Unknown"}
Current Description: ${input.description || "None"}
Current Location: ${input.location || "None"}

Return ONLY a valid JSON object with these exact fields:
{
  "title": "Improved/Confirmed title",
  "description": "Thorough, professional job description (3-4 paragraphs). Use best practices. No HTML.",
  "location": "Specific city and country",
  "employmentType": "one of: full_time | part_time | contract | internship | temporary",
  "workplaceType": "one of: on_site | remote | hybrid",
  "salaryMin": integer annual USD or null,
  "salaryMax": integer annual USD or null,
  "salaryCurrency": "USD",
  "tags": ["5-8 lowercase skill tags"]
}`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens:  2000,
      });

      const raw = completion.choices[0].message.content ?? "{}";

      try {
        const data = JSON.parse(raw);
        const validEmpTypes = ["full_time", "part_time", "contract", "internship", "temporary"];
        const validWpTypes  = ["on_site", "remote", "hybrid"];

        return {
          title:          typeof data.title          === "string" ? data.title          : input.title || "",
          description:    typeof data.description    === "string" ? data.description    : input.description || "",
          location:       typeof data.location       === "string" ? data.location       : input.location || "",
          employmentType: validEmpTypes.includes(data.employmentType) ? data.employmentType as any : "full_time",
          workplaceType:  validWpTypes.includes(data.workplaceType)   ? data.workplaceType  as any : "hybrid",
          salaryMin:      typeof data.salaryMin === "number" ? data.salaryMin : null,
          salaryMax:      typeof data.salaryMax === "number" ? data.salaryMax : null,
          salaryCurrency: typeof data.salaryCurrency === "string" ? data.salaryCurrency : "USD",
          tags:           Array.isArray(data.tags)
            ? (data.tags as any[]).filter((t) => typeof t === "string").slice(0, 10)
            : [],
        };
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI returned invalid response." });
      }
    }),

  // ─── AI Candidate Matching ────────────────────────────────────────────────
  // Fetches all applications for a job. Builds a rich candidate profile from
  // the application row itself — fullName, currentRole, experienceYears,
  // skills (free-text), education (jsonb), motivation, locationCity — then
  // asks gpt-4o to rank and score every candidate against the job.
  // Returns candidates ordered best → worst with score + explanation.

  matchCandidates: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!process.env.OPENAI_API_KEY) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "OPENAI_API_KEY not set." });
      }

      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      // 1. Verify ownership + get job details
      const job = await requireOwner(input.jobId, ctx.auth.user.id);

      // 2. Get all applications
      const apps = await db
        .select()
        .from(applications)
        
        .orderBy(desc(applications.createdAt));

      if (apps.length === 0) {
        return { matches: [], total: 0 };
      }

      // 3. Build compact candidate summaries from application fields only
      const candidateList = apps.map((app) => {
        const educationSummary =
          Array.isArray(app.education) && app.education.length > 0
            ? app.education
                .map(
                  (e) =>
                    `${e.degree} in ${e.field} from ${e.institution} (${e.graduationYear})`,
                )
                .join("; ")
            : null;

        return {
          id:              app.id,
          name:            app.fullName,
          currentRole:     app.currentRole,
          experienceYears: app.experienceYears, // "0-1" | "1-3" | "3-5" | "5-10" | "10+"
          location:        app.locationCity,
          skills:          app.skills,           // free-text from the application form
          education:       educationSummary,
          motivation:      app.motivation?.substring(0, 300) ?? null,
          status:          app.status,
        };
      });

      // 4. Build prompt
      const jobSummary = `
Title: ${job.title}
Location: ${job.location} | ${job.employmentType} | ${job.workplaceType}
Salary: ${
        job.salaryMin
          ? `${job.salaryMin.toLocaleString()}–${job.salaryMax?.toLocaleString() ?? "?"} ${job.salaryCurrency}`
          : "Undisclosed"
      }
Required skills / tags: ${job.tags.join(", ") || "None specified"}
Description: ${stripHtml(job.description).substring(0, 600)}
`.trim();

      const prompt = `You are a senior recruiter AI. Score and rank every candidate below against this job.

JOB:
${jobSummary}

CANDIDATES:
${JSON.stringify(candidateList, null, 2)}

Scoring weights: skill overlap 40%, experience level 30%, role/title relevance 20%, motivation quality 10%.

Return ONLY valid JSON — no markdown, no backticks:
{
  "ranked": ["<app id best>", "<app id 2nd>", ...ALL ids best to worst],
  "results": {
    "<app id>": {
      "score": <integer 0-100>,
      "recommendation": "<Strong Hire|Hire|Interview|Maybe|Pass>",
      "explanation": "<2 sentences explaining fit or lack thereof for THIS specific role>",
      "strengths": ["<strength 1>", "<strength 2>"],
      "gaps": ["<gap 1>", "<gap 2 if any>"]
    }
  }
}

Include EVERY candidate id in ranked.`;

      const completion = await openai.chat.completions.create({
        model:           "gpt-4o",
        messages:        [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature:     0.1,
        max_tokens:      4096,
      });

      const raw = (completion.choices[0].message.content ?? "{}").trim();

      try {
        const { ranked, results } = JSON.parse(raw) as {
          ranked: string[];
          results: Record<
            string,
            {
              score:          number;
              recommendation: string;
              explanation:    string;
              strengths:      string[];
              gaps:           string[];
            }
          >;
        };

        const appMap    = new Map(apps.map((a) => [a.id, a]));
        const candMap   = new Map(candidateList.map((c) => [c.id, c]));
        const validRecs = ["Strong Hire", "Hire", "Interview", "Maybe", "Pass"];

        const matches = ranked
          .map((appId) => {
            const cand   = candMap.get(appId);
            const result = results[appId];
            const app    = appMap.get(appId);
            if (!cand || !result || !app) return null;

            return {
              applicationId:     appId,
              candidateName:     cand.name,
              currentRole:       cand.currentRole,
              experienceYears:   cand.experienceYears,
              location:          cand.location,
              skills:            cand.skills,
              score:             Math.min(100, Math.max(0, result.score ?? 0)),
              recommendation:    validRecs.includes(result.recommendation)
                ? result.recommendation
                : "Maybe",
              explanation:       result.explanation ?? "",
              strengths:         Array.isArray(result.strengths)
                ? result.strengths.slice(0, 3)
                : [],
              gaps:              Array.isArray(result.gaps)
                ? result.gaps.slice(0, 2)
                : [],
              applicationStatus: app.status,
            };
          })
          .filter(Boolean);

        return { matches, total: matches.length };
      } catch {
        throw new TRPCError({
          code:    "INTERNAL_SERVER_ERROR",
          message: "AI returned invalid ranking. Try again.",
        });
      }
    }),
});