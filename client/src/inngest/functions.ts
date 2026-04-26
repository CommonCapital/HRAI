import { db } from "@/db";
import { agents, meetings, user } from "@/db/schema";
import {inngest} from "@/inngest/client";
import { StreamTranscriptItem } from "@/modules/meetings/types";
import { eq, inArray } from "drizzle-orm";
import JSONL from "jsonl-parse-stringify";
import {createAgent, openai, TextMessage} from "@inngest/agent-kit";
import { runOrchestrationPipeline } from "@/modules/applications/server/orchestration.service";
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
);


export const orchestrateApplication = inngest.createFunction(
  {
    id:      "orchestrate-application",
    name:    "Orchestrate Application Pipeline",
    retries: 2,  // retry up to 2 times on failure
  },
  { event: "application/submitted" },

  async ({ event, step }) => {
    const {
      applicationId,
      jobId,
      candidateName,
      candidateEmail,
      cvUrl,
      recruiterId,
    } = event.data;

    // step.run gives you retries, logging, and a named step in the Inngest dashboard
    const result = await step.run("run-orchestration-pipeline", async () => {
      return runOrchestrationPipeline({
        applicationId,
        jobId,
        candidateName,
        candidateEmail,
        cvUrl,
        recruiterId,
      });
    });

    // Log the outcome as a named step so it shows in the dashboard
    await step.run("log-result", async () => {
      if (!result.ranPipeline) {
        console.log(`[inngest] Pipeline skipped: ${result.skipReason}`);
        return { skipped: true, reason: result.skipReason };
      }

      console.log(
        `[inngest] Pipeline complete for ${applicationId}:`,
        `analysis=${result.cvAnalysisId}`,
        `meeting=${result.meetingId}`,
        `email=${result.emailSent}`,
      );

      return {
        skipped:      false,
        cvAnalysisId: result.cvAnalysisId,
        meetingId:    result.meetingId,
        emailSent:    result.emailSent,
      };
    });

    return result;
  },
);

export const jobDeadlineReached = inngest.createFunction(
  {
    id:   "job-deadline-reached",
    name: "Job Deadline Reached - Send Invitations",
  },
  { event: "job/deadline.reached" },
  async ({ event, step }) => {
    const { jobId } = event.data;

    // 1. Fetch job details
    const job = await step.run("fetch-job", async () => {
      const { jobListings: jobListingsTable } = await import("@/db/schema");
      const [j] = await db
        .select()
        .from(jobListingsTable)
        .where(eq(jobListingsTable.id, jobId));
      return j;
    });

    if (!job) return { success: false, reason: "Job not found" };

    // 2. Fetch all candidates for this job and their scores
    const topCandidates = await step.run("fetch-top-candidates", async () => {
      const { applications: appsTable, cvAnalysis: cvTable } = await import("@/db/schema");
      const { desc, getTableColumns } = await import("drizzle-orm");
      
      return db
        .select({
          ...getTableColumns(appsTable),
          score: cvTable.overallScore,
        })
        .from(appsTable)
        .leftJoin(cvTable, eq(appsTable.cvAnalysisId, cvTable.id))
        .where(eq(appsTable.jobId, jobId))
        .orderBy(desc(cvTable.overallScore))
        .limit(job.topCandidateLimit ?? 10);
    });

    // 3. For each top candidate, trigger orchestration (which creates meeting + sends email)
    // Actually, orchestration pipeline might have already run for some.
    // If it hasn't run, we run it. If it has, we check if they got an invite.
    const results = [];
    for (const cand of topCandidates) {
      const result = await step.run(`process-candidate-${cand.id}`, async () => {
        // If they already have a meetingId, we don't need to do anything
        if (cand.meetingId) {
          return { id: cand.id, skipped: true, reason: "Already invited" };
        }

        // Run the orchestration pipeline for this candidate
        return runOrchestrationPipeline({
          applicationId:  cand.id,
          jobId:          cand.jobId,
          candidateName:  cand.fullName,
          candidateEmail: cand.email,
          cvUrl:          cand.cvUrl,
          recruiterId:    job.postedByUserId!,
        });
      });
      results.push(result);
    }

    return {
      success: true,
      processed: topCandidates.length,
      results,
    };
  }
);