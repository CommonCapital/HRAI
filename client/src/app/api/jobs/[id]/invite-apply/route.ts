import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { applications, jobListings } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const { candidateIds } = await req.json();
    if (!candidateIds?.length) return NextResponse.json({ error: "No candidates" }, { status: 400 });

    const [job] = await db.select().from(jobListings).where(eq(jobListings.id, jobId)).limit(1);
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const cands = await db.select().from(applications).where(inArray(applications.id, candidateIds));
    const applyLink = `${process.env.NEXT_PUBLIC_APP_URL}/apply/${jobId}`;
    const results = [];

    for (const cand of cands) {
      if (!cand.email) {
        results.push({ candidateId: cand.id, emailSent: false, error: "No email on file" });
        continue;
      }
      try {
        const { error } = await resend.emails.send({
          from: "HRAi <onboarding@resend.dev>",
          to: cand.email,
          subject: `You're invited to apply — ${job.title}`,
          html: buildInviteEmail({ candidateName: cand.fullName ?? "there", jobTitle: job.title, applyLink, companyName: job.companyName ?? undefined }),
        });
        results.push({ candidateId: cand.id, emailSent: !error, error: error?.message });
      } catch (err: any) {
        results.push({ candidateId: cand.id, emailSent: false, error: err.message });
      }
    }

    const sent = results.filter(r => r.emailSent).length;
    return NextResponse.json({ results, summary: { sent, failed: results.length - sent, total: results.length } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function buildInviteEmail({ candidateName, jobTitle, applyLink, companyName }: {
  candidateName: string; jobTitle: string; applyLink: string; companyName?: string;
}) {
  const company = companyName ?? "Our Team";
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'DM Sans',system-ui,sans-serif;color:#111827;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#FF6A00,#c83c00);padding:36px 40px;">
      <p style="font-size:22px;font-weight:700;color:#ffffff;margin:0;letter-spacing:-0.02em;">You're Invited to Apply</p>
      <p style="font-size:13px;color:rgba(255,255,255,0.75);margin:6px 0 0;">${jobTitle}</p>
    </div>
    <div style="padding:36px 40px;">
      <p style="font-size:18px;font-weight:600;margin:0 0 16px;">Hi ${candidateName},</p>
      <p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 20px;">
        We think you'd be a great fit for the <strong>${jobTitle}</strong> position and would love for you to apply.
        The application takes just a few minutes to complete.
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${applyLink}" style="display:inline-block;background:#FF6A00;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 32px;border-radius:8px;">
          Apply Now →
        </a>
      </div>
      <p style="font-size:12px;color:#9ca3af;word-break:break-all;text-align:center;">${applyLink}</p>
      <hr style="border:none;border-top:1px solid #f3f4f6;margin:28px 0;"/>
      <p style="font-size:13px;color:#6b7280;">Best regards,<br/><strong>${company}</strong></p>
    </div>
    <div style="padding:20px 40px;background:#f9fafb;border-top:1px solid #f3f4f6;">
      <p style="font-size:12px;color:#9ca3af;text-align:center;margin:0;">You received this invitation from ${company}.</p>
    </div>
  </div>
</body></html>`;
}