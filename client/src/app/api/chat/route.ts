// app/api/chat/route.ts
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { cvAnalysis } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;
    console.log("✅ User authenticated:", userId);

    // Parse request body - useChat sends messages in UI format with parts
    const { messages, id }: {
      messages: Array<{
        role: "user" | "assistant";
        parts?: Array<{
          type: string;
          text?: string;
        }>;
      }>;
      id: string;
    } = await req.json();

    console.log("📨 Messages received:", messages.length);
    console.log("📋 CV Analysis ID:", id);

    // Convert UI messages to OpenAI format (same as SEO reports)
    const safeMessages = messages.map(m => ({
      role: m.role,
      content: m.parts
        ?.filter(p => p.type === 'text')
        .map(p => p.text)
        .join('') ?? ''
    }));

    console.log("🔄 Converted to OpenAI format:", safeMessages.length, "messages");

    let cvAnalysisData = null;
    let systemPrompt = `You are an expert HR AI assistant that helps recruiters and hiring managers understand CV/resume analysis results.
Provide helpful insights, answer questions, and give recommendations based on the candidate's profile and analysis data.
Be professional, concise, and data-driven in your responses.`;

    // Fetch CV analysis data if ID provided
    if (id) {
      try {
        const [analysis] = await db
          .select()
          .from(cvAnalysis)
          .where(
            and(
              eq(cvAnalysis.id, id),
              eq(cvAnalysis.userId, userId)
            )
          )
          .limit(1);

       if (analysis) {
          cvAnalysisData = analysis;
          const candidateName = analysis.candidateName || 'the candidate';
          const currentRole = analysis.currentRole || 'Unknown Role';
          const recommendation = analysis.recommendation || 'Unknown';
          const overallScore = analysis.overallScore || 0;

          systemPrompt += `\n\nCURRENT SEO REPORT DATA:\n\n${JSON.stringify(cvAnalysisData, null, 2)}
            You have access to comprehensive CV report data of candidate ${candidateName} who is applying for the job position (${currentRole}).
            Here are some information: recommendations: ${recommendation}; overallScore: ${overallScore}.
            -Follow this instruction:
            -Use this data to provide accurate and relevant responses to user queries.
            -Use the web_search tool to answer questions about the SEO report if it will help you provide a better answer.
            -Provide specific data-driven insights based on the actual report data. When referencing metrics, use the exact numbers from the report. Be conversational but informative.
            -On any of the outputs you ship, let's make sure verbally, it is Managing Partner / CFO tone, voice and feel. No over using dashes or em dashes — it looks like ai slop. Should feel like a top tier, human IC is presenting it. Avoid any sign of it being ai. That's the key to people's trust.  
            -Avoid making up data or hallucinating information. If the report data does not contain the answer, respond with "The SEO report data does not provide information on that topic. Do you want me to use the web_search tool to find more information?"
`;
        } else {
          systemPrompt += `\n\n⚠️ Note: CV analysis with ID ${id} not found or you don't have access to it.`;
        }
      } catch (error) {
        console.error("❌ Error fetching CV analysis:", error);
        systemPrompt += `\n\n⚠️ Note: Unable to fetch CV analysis data for ID ${id}.`;
      }
    }

    console.log("🤖 Calling OpenAI with", safeMessages.length, "messages");

    // Stream response from OpenAI
    const result = await streamText({
      model: openai("gpt-4o"),
      messages: safeMessages,  // ✅ Use converted messages!
      system: systemPrompt,
      tools: {
        web_search: openai.tools.webSearch({ searchContextSize: 'high' }) as any,
      },
    });

    console.log("✅ Streaming response started");

    return result.toUIMessageStreamResponse();
    
  } catch (error) {
    console.error("❌ Error in CV chat API:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process chat request" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}