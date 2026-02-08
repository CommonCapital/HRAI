import { db } from "@/db";
import { agents, meetings, user } from "@/db/schema";
import {inngest} from "@/inngest/client";
import { StreamTranscriptItem } from "@/modules/meetings/types";
import { eq, inArray } from "drizzle-orm";
import JSONL from "jsonl-parse-stringify";
import {createAgent, openai, TextMessage} from "@inngest/agent-kit";
const dataReport = createAgent({
name: "Data Report",
system: `Generate a data report, according to the following prompt: ${agents.instructions2}`.trim(), 
model: openai({ model: "gpt-4o", apiKey:process.env.OPENAI_API_KEY}),
});
export const meetingsProcessing = inngest.createFunction(
    {id: "meetings/processing"},
    {event: "meetings/processing"},
async ({event, step}) => {
console.log("Processing meeting:", event.data.meetingId)
const response = await step.run("fetch-transcript", async() => {
// If transcript is provided directly, skip fetching
if (event.data.transcript) {
    return event.data.transcript;
}
return fetch(event.data.transcriptUrl).then((res) => res.text())
        });
const transcript = await step.run("parse-transcript", async() => {
// If response is already an array, use it directly
if (Array.isArray(response)) {
    return response as StreamTranscriptItem[];
}
return JSONL.parse<StreamTranscriptItem>(response);
        });
const transcriptWithSpeakers = await step.run("add-speakers", async() => {
const speakerIds = [
...new Set(transcript.map((item) => item.speaker_id))
            ];
const userSpeakers = await db.select().from(user).where(inArray(user.id, speakerIds)).then((users) => users.map((user) => ({
...user,
            }))
        );
const agentSpeakers = await db.select().from(agents).where(inArray(agents.id, speakerIds)).then((agents) => 
agents.map((agent) => ({
...agent,
        })));
const speakers = [...userSpeakers, ...agentSpeakers];
return transcript.map((item) => {
const speaker = speakers.find(
                (speaker) => speaker.id === item.speaker_id
            );
if (!speaker) {
return {
...item,
user: {
name: "Unknown",
                    },
                };
            }
return {
...item,
user: {
name: speaker.name,
                }
            }
        })
    });
const {output} = await dataReport.run(
"Generate the data report for the following transcript:" + JSON.stringify(transcriptWithSpeakers)
    );
await step.run("save-summary", async () => {
await db.update(meetings).set({
summary: (output[0] as TextMessage).content as string,
status: "completed"
        }).where(eq(meetings.id, event.data.meetingId))
    })
    }
)