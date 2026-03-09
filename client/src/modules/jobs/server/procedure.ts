import { TRPCError } from "@trpc/server";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { createTRPCRouter, protectedProcedure, baseProcedure } from "@/trpc/init";
import { applications, jobListings, notifications } from "@/db/schema";

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
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required"),
  location: z.string().min(1, "Location is required").max(200),
  employmentType: employmentTypeSchema,
  workplaceType: workplaceTypeSchema,
  salaryMin: z.number().int().positive().nullable().optional(),
  salaryMax: z.number().int().positive().nullable().optional(),
  salaryCurrency: z.string().default("USD"),
  tags: z.array(z.string()).optional(),
  autoCloseOnAccept: z.boolean().optional().default(false),
  agentId:         z.string().optional(),
  autoOrchestrate: z.boolean().optional().default(false),
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
      const conditions = [
        eq(jobListings.postedByUserId, ctx.auth.user.id),
      ];
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
          agentId:           input.agentId         ?? null,
          autoOrchestrate:   input.autoOrchestrate ?? false,
        })
        .returning({ id: jobListings.id });

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

      await db
        .update(jobListings)
        .set(patch)
        .where(eq(jobListings.id, input.jobId));

      return { success: true };
    }),

  close: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await requireOwner(input.jobId, ctx.auth.user.id);
      const now = new Date();

      // Close the listing — simple update, no transaction dependency on notifications
      await db
        .update(jobListings)
        .set({ isActive: false, closedAt: now, updatedAt: now })
        .where(eq(jobListings.id, input.jobId));

      // Best-effort: notify applicants if notifications table exists
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
              message:  `This job listing is no longer accepting applications.`,
              linkUrl:  "/applications",
              metadata: { jobId: input.jobId },
              isRead:   false,
            })),
          );
        }
      } catch (notifyErr) {
        // Non-fatal — close succeeded even if notifications fail
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
});