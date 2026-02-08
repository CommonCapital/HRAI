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
import { agents, meetings } from "@/db/schema";
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
    ).returning();  // ← Returns affected rows

    // If no rows updated, meeting was already active or doesn't exist
    if (updateResult.length === 0) {
        console.log(`⚠️ Meeting ${meetingId} already active or not found - ignoring duplicate webhook`);
        return NextResponse.json({status: "Already active"}, {status: 200});
    }

    const existingMeeting = updateResult[0];

    // Now fetch agent and start AI agent
    const [existingAgent] = await db.select().from(agents).where(
        eq(agents.id, existingMeeting.agentId)
    );

    if (!existingAgent) {
        return NextResponse.json({error: "Agent not found"}, {status: 404})
    };

    // Rest of your code...
    const instructions = typeof existingAgent.instructions === "string"
        ? existingAgent.instructions
        : "You are a rational and critical Venture Capitalist analyst...";

    try {
        console.log(`🚀 Starting AI agent via FastAPI for meeting: ${meetingId}`);
        
        const response = await fetch(`${FASTAPI_URL}/meetings/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                call_id: meetingId,
                agent_name: existingAgent.name,
                agent_instructions: instructions,
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
            console.log(`✅ AI agent started successfully:`, data);

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

        // 🔥 GET TRANSCRIPT FROM FASTAPI BEFORE STOPPING
        // 🔥 GET TRANSCRIPT FROM FASTAPI BEFORE STOPPING
let transcriptData: any = null;
// ❌ DELETE THIS LINE:
// let formattedTranscript = "";

try {
    console.log(`📝 Fetching transcript from FastAPI for meeting: ${meetingId}`);
    
    const transcriptResponse = await fetch(
        `${FASTAPI_URL}/meetings/${meetingId}/transcript`,
        { method: 'GET' }
    );

    if (transcriptResponse.ok) {
        transcriptData = await transcriptResponse.json();
        console.log(`✅ Retrieved ${transcriptData.total_entries} transcript entries from FastAPI`);
        
        // ❌ DELETE THESE LINES:
        // formattedTranscript = transcriptData.transcript
        //     .map((entry: any) => `[${entry.speaker}]: ${entry.text}`)
        //     .join('\n');
        // console.log(`✅ Formatted transcript (${formattedTranscript.length} characters)`);
    } else {
        console.warn(`⚠️ Failed to fetch transcript from FastAPI`);
    }
} catch (error) {
    console.error('❌ Error fetching transcript from FastAPI:', error);
}

        // 🔥 STOP THE AI AGENT
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

        // 🔥 UPDATE DATABASE WITH TRANSCRIPT
       // 🔥 UPDATE DATABASE WITH TRANSCRIPT DATA (as JSON string)
await db.update(meetings).set({
    status: "processing", 
    endedAt: new Date(),
    transcriptUrl: transcriptData ? JSON.stringify(transcriptData.transcript) : null  // ✅ Store as JSON
}).where(
    and(
        eq(meetings.id, meetingId), 
        eq(meetings.status, "active")
    )
);
        console.log("✅ Meeting status updated to processing");

        // 🔥 SEND TO INNGEST WITH TRANSCRIPT DATA
        try {
            console.log("🔁 Sending to Inngest with transcript data...");
            
            await inngest.send({
                name: "meetings/processing",
                data: {
                    meetingId: meetingId,
                    transcript: transcriptData?.transcript || [],
                    transcriptText: JSON.stringify(transcriptData.transcript),
                    transcriptEntries: transcriptData?.total_entries || 0
                },
            }); 
            
            console.log("✅ Inngest function triggered successfully with transcript");
        } catch (error) {
            console.error("❌ Failed to trigger Inngest function:", error);
        }

    } else if (eventType === "call.transcription_ready") {
        console.log("📝 Stream transcription is ready (may be empty if using Gemini)");
        const event = payload as CallTranscriptionReadyEvent;
        const meetingId = event.call_cid.split(":")[1];

        // This event still fires but Stream's transcript will be empty
        // We're using Gemini's transcript instead
        console.log("Stream transcript URL:", event.call_transcription.url);

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
                    model: "chatgpt-4o-latest",
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