import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { db } from "@/db";
import { agents, meetings } from "@/db/schema";
import { TRPCError } from "@trpc/server";
import { agentsInsertSchema, agentsUpdateSchema } from "../schemas";
import { z } from "zod";
import { and, count, desc, eq, getTableColumns, ilike } from "drizzle-orm";
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
} from "@/constants";
export const agentsRouter = createTRPCRouter({
  update: protectedProcedure
    .input(agentsUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const [updatedAgent] = await db
        .update(agents)
        .set(input)
        .where(
          and(eq(agents.id, input.id), eq(agents.userId, ctx.auth.user.id))
        ).returning();
        if (!updatedAgent) {
            throw new TRPCError({
          code: "NOT_FOUND",
          message: "Agent not found ",
        });
        }
          return updatedAgent
          }),
  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [removedAgent] = await db
        .delete(agents)
        .where(
          and(eq(agents.id, input.id), eq(agents.userId, ctx.auth.user.id))
        )
        .returning();

      if (!removedAgent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Agent not found ",
        });
      }
      return removedAgent;
    }),
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const [existingAgent] = await db
        .select({
          ...getTableColumns(agents),
         meetingCount: db.$count(meetings, eq(agents.id, meetings.agentId)),
        })
        .from(agents)
        .where(
          and(eq(agents.id, input.id), eq(agents.userId, ctx.auth.user.id))
        );
      if (!existingAgent) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }
      //await new Promise((resolve) => setTimeout(resolve, 5000))
      //throw new TRPCError({code: "BAD_REQUEST"})
      return existingAgent;
    }),
  getMany: protectedProcedure
    .input(
      z.object({
        page: z.number().default(DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(MIN_PAGE_SIZE)
          .max(MAX_PAGE_SIZE)
          .default(DEFAULT_PAGE_SIZE),
        search: z.string().nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { search, page, pageSize } = input;
      const data = await db
        .select({
          ...getTableColumns(agents),
            meetingCount: db.$count(meetings, eq(agents.id, meetings.agentId)),
          
        })
        .from(agents)
        .where(
          and(
            eq(agents.userId, ctx.auth.session.userId),
            search ? ilike(agents.name, `%${search}`) : undefined
          )
        )
        .orderBy(desc(agents.createdAt), desc(agents.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      const [total] = await db
        .select({ count: count() })
        .from(agents)
        .where(
          and(
            eq(agents.userId, ctx.auth.session.userId),
            search ? ilike(agents.name, `%${search}`) : undefined
          )
        );
      //await new Promise((resolve) => setTimeout(resolve, 5000))
      //throw new TRPCError({code: "BAD_REQUEST"})
      const totalPages = Math.ceil(total.count / pageSize);
      return {
        items: data,
        total: total.count,
        totalPages,
      };
    }),

  create: protectedProcedure
    .input(agentsInsertSchema)
    .mutation(async ({ input, ctx }) => {
      const {auth} = ctx;
      const [createdAgent] = await db
        .insert(agents)
        .values({
          ...input,
          userId: ctx.auth.user.id,
        })
        .returning();

      return createdAgent;
    }),

  autoFill: protectedProcedure
    .input(z.object({ 
      name: z.string().optional(),
      instructions: z.string().optional(),
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
              "You are an expert AI persona designer. Based on the agent name and any partial instructions, generate a detailed, professional set of instructions for an HR AI agent. The instructions should define the agent's tone, goals, and specific evaluation criteria for candidate screening. Return only valid JSON.",
          },
          {
            role: "user",
            content: `Complete/Improve these agent instructions:
Name: ${input.name || "HR Assistant"}
Current Instructions: ${input.instructions || "None"}

Return ONLY a valid JSON object with these exact fields:
{
  "name": "Improved agent name",
  "instructions": "Comprehensive instructions for the AI agent (2-3 paragraphs). Focus on evaluation style, tone of voice, and what to look for in candidates."
}`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens:  1000,
      });

      const raw = completion.choices[0].message.content ?? "{}";

      try {
        const data = JSON.parse(raw);
        return {
          name:         typeof data.name         === "string" ? data.name         : input.name || "",
          instructions: typeof data.instructions === "string" ? data.instructions : input.instructions || "",
        };
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI returned invalid response." });
      }
    }),
});
