import {
    MessageNewEvent,
    CallEndedEvent,
    CallRecordingReadyEvent,
    CallSessionParticipantLeftEvent,
    CallSessionStartedEvent,
    CallTranscriptionReadyEvent
} from "@stream-io/node-sdk";
import { GeneratdAvatarUri } from "@/lib/avatar";
import {and, eq, not} from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { agents, cvAnalysis, meetings, processedWebhooks } from "@/db/schema";
import {streamVideo} from "@/lib/stream-video";
import { inngest } from "@/inngest/client";
import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { streamChat } from "@/lib/stream-chat";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

// FastAPI backend URL
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

function verifySignatureWithSDK(body: string, signature: string): boolean{
    return streamVideo.verifyWebhook(body, signature);
}

export async function POST(req: NextRequest) {
    console.log("Webhook received");
    const signature = req.headers.get("x-signature");
    const apiKEY = req.headers.get("x-api-key");

    if (!signature || !apiKEY) {
        return NextResponse.json(
            { error: "Missing signature or API Key"},
            {status: 400}
        );
    } 

    const body = await req.text();

    if (!verifySignatureWithSDK(body, signature)) {
        return NextResponse.json({error: "Invalid signature"}, {status: 401});
    }

    let payload: unknown;
    try {
        payload = JSON.parse(body) as Record<string, unknown>;
    } catch (error) {
        return NextResponse.json({error: "Invalid payload"}, {status: 400})
    };

    const eventType = (payload as Record<string, unknown>)?.type;

    if (eventType === "call.session_started") {
    const event = payload as CallSessionStartedEvent;
    const meetingId = event.call.custom?.meetingId;

    if (!meetingId) {
        return NextResponse.json({error: "Missing meetingId"}, {status: 400});
    }

    // ✅ ATOMIC UPDATE - Only succeeds if status was NOT active
    const updateResult = await db.update(meetings).set({
        status: "active", 
        startedAt: new Date()
    }).where(
        and(
            eq(meetings.id, meetingId),
            not(eq(meetings.status, "active")),
            not(eq(meetings.status, "completed")),
            not(eq(meetings.status, "cancelled")),
            not(eq(meetings.status, "processing"))
        )
    ).returning();

    if (updateResult.length === 0) {
        console.log(`⚠️ Meeting ${meetingId} already active or not found - ignoring duplicate webhook`);
        return NextResponse.json({status: "Already active"}, {status: 200});
    }

    const existingMeeting = updateResult[0];

    // Fetch agent WITH agentType
    const [existingAgent] = await db.select().from(agents).where(
        eq(agents.id, existingMeeting.agentId)
    );

    if (!existingAgent) {
        return NextResponse.json({error: "Agent not found"}, {status: 404})
    };

    console.log(`📊 Agent Details:`);
    console.log(`   Name: ${existingAgent.name}`);
    console.log(`   Type: ${existingAgent.agentType}`);
    console.log(`   ID: ${existingAgent.id}`);

    // ✅ Base instructions from agent
    let instructions = typeof existingAgent.instructions === "string"
        ? existingAgent.instructions
        : "You are a rational and critical HR Interviewer...";

    // 🆕 If PASSIVE agent, prepend silence instructions
    if (existingAgent.agentType === 'passive') {
        console.log(`📝 Agent is PASSIVE - prepending silence instructions`);
        
        const passivePrefix = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔇 PASSIVE ASSISTANT MODE - CRITICAL INSTRUCTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are "${existingAgent.name}", a PASSIVE meeting assistant.

🚨 CRITICAL RULES - FOLLOW EXACTLY:

1. YOU MUST STAY COMPLETELY SILENT unless explicitly addressed
2. You are addressed when someone says:
   - "${existingAgent.name}" (your exact name)
   - "AI" (the word AI)
3. DO NOT respond to general conversation between participants
4. DO NOT acknowledge anything participants say to each other
5. DO NOT interrupt or volunteer information
6. DO NOT explain that you're staying silent
7. If unsure whether to speak: DON'T SPEAK

📋 Your ONLY Job:
- Listen to everything silently
- Take comprehensive notes
- Wait patiently for explicit questions
- Transcribe all conversations

💬 When You ARE Triggered (by name or "AI"):
- Answer the question concisely
- Base your answer ONLY on meeting context
- Be professional and helpful
- Return to complete silence immediately after

❌ NEVER DO:
- "I'm here to help!" (unprompted)
- "Let me know if you need anything" (unprompted)
- Respond to "What do you think?" (not addressing you)
- Acknowledge side conversations

✅ ONLY RESPOND TO:
- "Hey ${existingAgent.name}, what are the action items?"
- "AI, can you summarize what we discussed?"
- "${existingAgent.name}, did anyone mention the budget?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
        
        instructions = passivePrefix + "\n\n" + instructions;
        console.log(`✅ Passive instructions prepended (${passivePrefix.length} chars)`);
    } else {
        console.log(`🎙️ Agent is ACTIVE - no silence instructions needed`);
    }

    // ✅ If meeting has a linked CV analysis, inject it as HR interview context
    if (existingMeeting.cvAnalysisId) {
        console.log(`📋 Meeting has CV analysis linked: ${existingMeeting.cvAnalysisId}`);

        const [cv] = await db
            .select()
            .from(cvAnalysis)
            .where(eq(cvAnalysis.id, existingMeeting.cvAnalysisId));

        if (cv) {
            console.log(`✅ CV analysis found for candidate: ${cv.candidateName}`);

            // Build a structured, readable context block for the AI
            const cvContext = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 HR INTERVIEW CONTEXT — CANDIDATE CV ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${existingAgent.agentType === 'active' 
    ? 'You are conducting an HR interview. The candidate has submitted a CV that has been pre-analyzed.' 
    : 'When asked about the candidate, reference this pre-analyzed CV data.'}

Use the data below to:
${existingAgent.agentType === 'active' 
    ? `1. Ask informed, targeted follow-up questions based on the candidate's background
2. Probe any gaps, short tenures, or unclear transitions in their work history
3. Identify and gently challenge any inconsistencies between what the candidate says and their CV
4. Reference the suggested interview focus areas when steering the conversation` 
    : `1. Answer questions about the candidate's background accurately
2. Provide context from their CV when asked
3. Highlight relevant strengths and concerns when queried
4. Reference specific data points from the analysis`}

--- CANDIDATE OVERVIEW ---
Name: ${cv.candidateName ?? "Unknown"}
Current Role: ${cv.currentRole ?? "Unknown"}
Industry: ${cv.industry ?? "Unknown"}
Overall Score: ${cv.overallScore}/100
Recommendation: ${cv.recommendation}
Summary: ${cv.summary}

--- ROLE ALIGNMENT ---
${JSON.stringify(cv.roleAlignment, null, 2)}

--- WORK HISTORY ---
${JSON.stringify(cv.workHistory, null, 2)}

--- SKILLS ---
${JSON.stringify(cv.skills, null, 2)}

--- EDUCATION ---
${JSON.stringify(cv.education, null, 2)}

--- RED FLAGS ---
${JSON.stringify(cv.redFlags, null, 2)}

--- CAREER TRAJECTORY ---
${JSON.stringify(cv.careerTrajectory, null, 2)}

--- NEXT STEPS & INTERVIEW FOCUS ---
${JSON.stringify(cv.nextSteps, null, 2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${existingAgent.agentType === 'active' 
    ? 'Begin the interview naturally. Do not reveal internal scoring or red flags directly — use them to guide your questions.' 
    : 'When asked, provide insights based on this data. Do not volunteer this information unprompted.'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

            instructions = instructions + "\n\n" + cvContext;
            console.log(`✅ CV context injected into agent instructions (${cvContext.length} chars)`);
        } else {
            console.warn(`⚠️ CV analysis ${existingMeeting.cvAnalysisId} not found in DB — proceeding without context`);
        }
    } else {
        console.log(`ℹ️ No CV analysis linked to this meeting — standard agent instructions used`);
    }

    try {
        console.log(`🚀 Starting AI agent via FastAPI for meeting: ${meetingId}`);
        console.log(`   Agent Name: ${existingAgent.name}`);
        console.log(`   Agent Type: ${existingAgent.agentType}`);
        console.log(`   Agent ID: ${existingAgent.id}`);
        console.log(`   CV Context: ${existingMeeting.cvAnalysisId ? '✅ Included' : '❌ Not included'}`);
        console.log(`   Instructions Length: ${instructions.length} chars`);
        
        const response = await fetch(`${FASTAPI_URL}/meetings/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                call_id: meetingId,
                agent_name: existingAgent.name,
                agent_type: existingAgent.agentType,    // 🆕 NEW: Send agent type
                agent_instructions: instructions,        // Includes passive prefix + CV context
                agent_id: existingAgent.id
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Failed to start AI agent:', error);
            return NextResponse.json({
                error: `Failed to start AI agent: ${error.detail || 'Unknown error'}`
            }, {status: 500});
        }

        const data = await response.json();
        console.log(`✅ ${existingAgent.agentType.toUpperCase()} agent started successfully`);

        // Initialize chat channel for post-meeting Q&A
        try {
            const channel = streamChat.channel("messaging", meetingId, {
                created_by_id: existingAgent.id,
                members: [existingAgent.id],
            });
            await channel.watch();
            console.log("✅ Chat channel initialized");
        } catch (error) {
            console.error("Failed to initialize chat channel:", error);
        }

    } catch (error) {
        console.error('Error calling FastAPI backend:', error);
        return NextResponse.json({
            error: `Failed to start AI agent: ${error instanceof Error ? error.message : 'Unknown error'}`
        }, {status: 500});
    }
} else if (eventType === "call.session_participant_left") {
        const event = payload as CallSessionParticipantLeftEvent;
        const meetingId = event.call_cid.split(":")[1];

        if (!meetingId) {
            return NextResponse.json({error: "Missing meetingID"}, {status: 400});
        }

    } else if (eventType === "call.session_ended") {
        const event = payload as CallEndedEvent;
        const meetingId = event.call.custom?.meetingId;

        if (!meetingId) {
            return NextResponse.json({error: "Missing meetingId"}, {status: 400});
        }

        let transcriptData: any = null;
        let transformedTranscript: any[] = [];

        try {
            console.log(`📝 Fetching transcript from FastAPI for meeting: ${meetingId}`);
            
            const transcriptResponse = await fetch(
                `${FASTAPI_URL}/meetings/${meetingId}/transcript`,
                { method: 'GET' }
            );

            if (transcriptResponse.ok) {
                transcriptData = await transcriptResponse.json();
                console.log(`✅ Retrieved ${transcriptData.total_entries} transcript entries from FastAPI`);

                transformedTranscript = transcriptData.transcript.map((entry: any, index: number) => {
                    const timestamp = new Date(entry.timestamp);
                    const startMs = timestamp.getTime();
                    
                    return {
                        speaker_id: entry.speaker,
                        text: entry.text,
                        start_ts: startMs,
                        end_ts: startMs + 1000,
                        type: entry.type || 'user'
                    };
                });
                
                console.log(`✅ Transformed ${transformedTranscript.length} transcript entries`);
            } else {
                console.warn(`⚠️ Failed to fetch transcript from FastAPI`);
            }
        } catch (error) {
            console.error('❌ Error fetching transcript from FastAPI:', error);
        }

        try {
            console.log(`🛑 Stopping AI agent for meeting: ${meetingId}`);
            
            const response = await fetch(`${FASTAPI_URL}/meetings/${meetingId}/stop`, {
                method: 'POST',
            });

            if (response.ok) {
                const data = await response.json();
                console.log(`✅ AI agent stopped:`, data);
            } else {
                console.warn('⚠️ Failed to stop AI agent, it may have already stopped');
            }
        } catch (error) {
            console.error('❌ Error stopping AI agent:', error);
        }

        await db.update(meetings).set({
            status: "processing", 
            endedAt: new Date(),
            transcriptUrl: transformedTranscript.length > 0 
                ? JSON.stringify(transformedTranscript)
                : null
        }).where(
            and(
                eq(meetings.id, meetingId), 
                eq(meetings.status, "active")
            )
        );
        console.log("✅ Meeting status updated to processing with transformed transcript");

        try {
            console.log("🔁 Sending to Inngest with transformed transcript data...");
            
            await inngest.send({
                name: "meetings/processing",
                data: {
                    meetingId: meetingId,
                    transcript: transformedTranscript,
                    transcriptText: JSON.stringify(transformedTranscript),
                    transcriptEntries: transformedTranscript.length
                },
            }); 
            
            console.log("✅ Inngest function triggered successfully with transformed transcript");
        } catch (error) {
            console.error("❌ Failed to trigger Inngest function:", error);
        }

    } else if (eventType === "call.transcription_ready") {
        console.log("📝 Stream transcription is ready (may be empty if using Gemini)");
        const event = payload as CallTranscriptionReadyEvent;
        const meetingId = event.call_cid.split(":")[1];
        console.log("Stream transcript URL:", event.call_transcription);

    } else if (eventType === "call.recording_ready") {
        const event = payload as CallRecordingReadyEvent;
        const meetingId = event.call_cid.split(":")[1];

        await db.update(meetings).set({
            recordingUrl: event.call_recording.url
        }).where(eq(meetings.id, meetingId));
        
        console.log("✅ Recording URL saved");

    } else if (eventType === "message.new") {
        const event = payload as MessageNewEvent;

        const userId = event.user?.id;
        const channelId = event.channel_id;
        const text = event.message?.text;
        const messageId = event.message?.id;

        if (!userId || !channelId || !text) {
            return NextResponse.json(
                {error: "Missing userId, channelId or text"},
                {status: 400}
            );
        }

        const [existingMeeting] = await db.select().from(meetings).where(
            and(
                eq(meetings.id, channelId), 
                eq(meetings.status, "completed")
            )
        );

        if (!existingMeeting) {
            return NextResponse.json({error: "Meeting not found"}, {status: 404})
        }

        const [existingAgent] = await db.select().from(agents).where(
            eq(agents.id, existingMeeting.agentId)
        );

        if (!existingAgent) {
            return NextResponse.json({error: "Agent not found"}, {status:404});
        }

        if (!messageId) return NextResponse.json({status: "No message ID"});
    
        const [existing] = await db.select()
            .from(processedWebhooks)
            .where(eq(processedWebhooks.webhookId, messageId));
        
        if (existing) {
            console.log(`⚠️ Duplicate webhook for message ${messageId} - ignoring`);
            return NextResponse.json({status: "Already processed"});
        }
        
        await db.insert(processedWebhooks).values({
            webhookId: messageId,
            eventType: "message.new",
        });

        if (userId !== existingAgent.id) {
            const instructions = `
You are an AI assistant that helps the user to revisit a recently completed meeting.
Below is a data report of the meeting. Use it to answer his/her questions:
${existingMeeting.summary}

The following data are your uploaded trained data:
${existingAgent.instructions}

The client may ask questions about the meeting, request clarifications, or ask for follow-up actions.
Always base your responses on the meeting summary above.

You also have access to the recent conversation history between you and the user. Use the context of previous messages to provide relevant, coherent, and helpful responses. If the user's question refers to something discussed earlier, make sure to take that into account and maintain continuity in the conversation.

If the summary does not contain enough information to answer a question, politely let the user know.

Be concise, helpful, and focus on providing accurate information from the meeting and the ongoing conversation.
            `;

            const channel = streamChat.channel("messaging", channelId);
            await channel.watch();

            const previousMessages = channel.state.messages
                .slice(-5)
                .filter((msg) => msg.text && msg.text.trim() !== "")
                .map<ChatCompletionMessageParam>((message) => ({
                    role: message.user?.id === existingAgent.id ? "assistant" : "user",
                    content: message.text || "",
                }));

            try {
                const chatCompletion = await openai.chat.completions.create({
                    model: "gpt-4o",
                    messages: [
                        { role: "system", content: instructions },
                        ...previousMessages,
                        { role: "user", content: text },
                    ],
                    temperature: 1,
                    top_p: 1,
                    stream: true,
                });

                let fullResponse = "";

                for await (const chunk of chatCompletion) {
                    const token = chunk.choices?.[0]?.delta?.content || "";
                    fullResponse += token;
                }

                const avatarUrl = GeneratdAvatarUri({
                    seed: existingAgent.name,
                    variant: "initials",
                });

                await streamChat.upsertUser({
                    id: existingAgent.id,
                    name: existingAgent.name,
                    image: avatarUrl,
                });

                await channel.sendMessage({
                    text: fullResponse,
                    user: {
                        id: existingAgent.id,
                        name: existingAgent.name,
                        image: avatarUrl,
                    }
                });

                return NextResponse.json({ status: "Success" });

            } catch (error) {
                console.error("OpenAI Streaming Error:", error);
                return NextResponse.json({ error: "Error from OpenAI" }, { status: 500 });
            }
        }
    }

    return NextResponse.json({status: "Success"})
}