// src/lib/plunk.ts

const PLUNK_API = "https://api.useplunk.com/v1/send"; // hardcoded — NOT from env

export interface PlunkEmailPayload {
  to:     string;
  subject: string;
  body:    string;
  name?:   string;
}

export interface PlunkResult {
  success:    boolean;
  messageId?: string;
  error?:     string;
}

export async function sendEmail(payload: PlunkEmailPayload): Promise<PlunkResult> {
  const key = process.env.PLUNK_SECRET_KEY; // ✅ Secret key for server-side sending

if (!key) {
  console.warn("[plunk] PLUNK_SECRET_KEY is not set — email skipped.");
  return { success: false, error: "PLUNK_SECRET_KEY not configured" };
}

  try {
    const res = await fetch(PLUNK_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:  `Bearer ${key}`,
      },
      body: JSON.stringify({
        to:         payload.to,
        subject:    payload.subject,
        body:       payload.body,
        subscribed: true, // required by Plunk — omitting causes 400
        ...(payload.name ? { name: payload.name } : {}),
      }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("[plunk] send failed:", res.status, json);
      return { success: false, error: json?.message ?? `HTTP ${res.status}` };
    }

    return { success: true, messageId: json?.id };
  } catch (err: any) {
    console.error("[plunk] network error:", err);
    return { success: false, error: err.message };
  }
}

// ── Email templates ───────────────────────────────────────────────────────────

export function buildInterviewInviteEmail(params: {
  candidateName: string;
  jobTitle:      string;
  meetingLink:   string;
  companyName?:  string;
}): { subject: string; body: string } {
  const company = params.companyName ?? "The Hiring Team";
  const subject = `Interview Invitation — ${params.jobTitle}`;

  const body = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { margin: 0; padding: 0; background: #f9fafb; font-family: 'DM Sans', system-ui, sans-serif; color: #111827; }
    .wrap { max-width: 560px; margin: 40px auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #FF6A00, #c83c00); padding: 36px 40px; }
    .header-title { font-size: 22px; font-weight: 700; color: #ffffff; margin: 0; letter-spacing: -0.02em; }
    .header-sub { font-size: 13px; color: rgba(255,255,255,0.75); margin: 6px 0 0; }
    .body { padding: 36px 40px; }
    .greeting { font-size: 18px; font-weight: 600; margin: 0 0 16px; }
    .text { font-size: 14px; color: #374151; line-height: 1.7; margin: 0 0 20px; }
    .btn-wrap { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background: #FF6A00; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 32px; border-radius: 8px; }
    .link-fallback { font-size: 12px; color: #9ca3af; word-break: break-all; text-align: center; margin-top: 12px; }
    .divider { height: 1px; background: #f3f4f6; margin: 28px 0; }
    .footer { padding: 20px 40px; background: #f9fafb; border-top: 1px solid #f3f4f6; }
    .footer-text { font-size: 12px; color: #9ca3af; text-align: center; margin: 0; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <p class="header-title">Interview Invitation</p>
      <p class="header-sub">${params.jobTitle}</p>
    </div>
    <div class="body">
      <p class="greeting">Hi ${params.candidateName},</p>
      <p class="text">
        We've reviewed your application and are excited to invite you to an
        AI-powered interview for the <strong>${params.jobTitle}</strong> position.
      </p>
      <p class="text">
        The interview is conducted by our AI interviewer and typically takes
        <strong>20–30 minutes</strong>. You can join at any time — no scheduling required.
      </p>
      <div class="btn-wrap">
        <a href="${params.meetingLink}" class="btn">Start Your Interview →</a>
      </div>
      <p class="link-fallback">
        Or copy this link:<br />${params.meetingLink}
      </p>
      <div class="divider"></div>
      <p class="text" style="font-size:13px;color:#6b7280;">
        Best regards,<br /><strong>${company}</strong>
      </p>
    </div>
    <div class="footer">
      <p class="footer-text">You received this because you applied for a position on our platform.</p>
    </div>
  </div>
</body>
</html>`.trim();

  return { subject, body };
}