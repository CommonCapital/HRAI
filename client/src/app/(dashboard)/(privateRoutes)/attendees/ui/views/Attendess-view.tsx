// app/(dashboard)/(privateRoutes)/attendees/_views/attendees-view.tsx
"use client";

import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { useTRPC } from "@/trpc/client";
import { skipToken, useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Brain, Check, ChevronLeft, ChevronRight, Copy, ExternalLink,
  FileText, Loader2, MailCheck, User, Zap, ZapOff,
} from "lucide-react";
import { toast } from "sonner";

// ─── Helpers ──────────────────────────────────────────────────────────────────

type AppStatus = "submitted" | "in_review" | "shortlisted" | "rejected" | "accepted";

const STATUS_LABELS: Record<AppStatus, string> = {
  submitted:   "Submitted",
  in_review:   "In Review",
  shortlisted: "Shortlisted",
  rejected:    "Rejected",
  accepted:    "Accepted",
};
const STATUS_COLORS: Record<AppStatus, string> = {
  submitted:   "at-status--submitted",
  in_review:   "at-status--review",
  shortlisted: "at-status--shortlisted",
  rejected:    "at-status--rejected",
  accepted:    "at-status--accepted",
};

const SCORE_CLASS = (s: number) =>
  s >= 70 ? "at-score--green" : s < 50 ? "at-score--red" : "at-score--yellow";

const REC_COLORS: Record<string, string> = {
  "Strong Hire": "at-rec--strong",
  "Hire":        "at-rec--hire",
  "Interview":   "at-rec--interview",
  "Maybe":       "at-rec--maybe",
  "Pass":        "at-rec--pass",
};

const EXP_LABELS: Record<string, string> = {
  "0-1":  "0-1 yrs", "1-3": "1-3 yrs", "3-5": "3-5 yrs",
  "5-10": "5-10 yrs", "10+": "10+ yrs",
};

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// ─── Main view ────────────────────────────────────────────────────────────────

export function AttendeesView() {
  const trpc        = useTRPC();
  const router      = useRouter();
  const queryClient = useQueryClient();

  // Parsers inlined here — avoids any import-chain type resolution issue.
  // parseAsString.withDefault("") → always string, parseAsInteger.withDefault(1) → always number
  const [jobId,  setJobId]  = useQueryState("jobId",  parseAsString.withDefault(""));
  const [page,   setPage]   = useQueryState("page",   parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", parseAsString.withDefault(""));
  const [status, setStatus] = useQueryState("status", parseAsString.withDefault(""));

  const [detailId, setDetailId] = useState<string | null>(null);
  const [notesText, setNotesText] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);

  // ── Queries ─────────────────────────────────────────────────────────────
  const { data: myJobs } = useSuspenseQuery(
    trpc.applications.myJobsWithCounts.queryOptions(),
  );

  // jobId/page/search/status are concrete types (never {}) because parsers use withDefault.
  // Use skipToken so tRPC never receives empty strings when no job is selected.
  const { data: listData, isLoading: listLoading } = useQuery(
    trpc.applications.listForJob.queryOptions(
      jobId
        ? { jobId, page, pageSize: 12, search: search || undefined, status: (status as AppStatus) || undefined }
        : skipToken,
    ),
  );

  const { data: detail, isLoading: detailLoading } = useQuery(
    trpc.applications.getOne.queryOptions(
      detailId ? { applicationId: detailId } : skipToken,
    ),
  );

  // Sync notes textarea when detail changes
  useEffect(() => {
    if (detail) setNotesText(detail.recruiterNotes ?? "");
  }, [detail?.id]);

  // ── Mutations ─────────────────────────────────────────────────────────
  const updateStatus = useMutation(
    trpc.applications.updateStatus.mutationOptions({
      onSuccess: () => {
        if (jobId) {
          queryClient.invalidateQueries(
            trpc.applications.listForJob.queryOptions({ jobId, page, pageSize: 12 }),
          );
        }
        if (detailId) {
          queryClient.invalidateQueries(
            trpc.applications.getOne.queryOptions({ applicationId: detailId }),
          );
        }
      },
    }),
  );

  const saveNotes = useMutation(
    trpc.applications.updateStatus.mutationOptions({
      onSuccess: () => toast.success("Notes saved"),
      onError:   () => toast.error("Failed to save notes"),
    }),
  );

  const triggerOrchestration = useMutation(
    trpc.applications.triggerOrchestration.mutationOptions({
      onSuccess: (result) => {
        if (detailId) {
          queryClient.invalidateQueries(
            trpc.applications.getOne.queryOptions({ applicationId: detailId }),
          );
        }
        if (jobId) {
          queryClient.invalidateQueries(
            trpc.applications.listForJob.queryOptions({ jobId, page, pageSize: 12 }),
          );
        }

        if (result.meetingId && result.emailSent) {
          toast.success("AI screening complete — interview invite sent to candidate.");
        } else if (result.meetingId) {
          toast.success("AI screening complete — meeting created. Email could not be sent.");
        } else if (result.cvAnalysisId) {
          toast("AI screening complete", {
            description: `Recommendation: ${result.skipReason ?? "see analysis"} — no interview created.`,
          });
        } else {
          toast.error(result.skipReason ?? "Pipeline failed — check logs.");
        }
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  const selectedJob = myJobs.find((j) => j.id === jobId) ?? null;
  const items       = listData?.items ?? [];
  const total       = listData?.total ?? 0;
  const totalPages  = listData?.totalPages ?? 1;
  const currentPage = page ?? 1;

  const copyMeetingLink = (meetingId: string) => {
    const link = `${process.env.NEXT_PUBLIC_APP_URL}/meeting-call/${meetingId}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <>
      <style>{css}</style>
      <div className="at-root">

        {/* ════ PAGE HEADER ════════════════════════════════════════════════ */}
        <div className="at-page-header">
          <p className="at-eyebrow">Applicant Tracking</p>
          <h1 className="at-page-title">CRM</h1>
        </div>

        {/* ════ JOB SELECTOR ═══════════════════════════════════════════════ */}
        <div className="at-job-bar">
          <button
            className={`at-job-chip ${!jobId ? "at-job-chip--on" : ""}`}
            onClick={() => { setJobId(null); setPage(1); }}
          >All listings</button>

          {myJobs.map((j) => (
            <button
              key={j.id}
              className={`at-job-chip ${jobId === j.id ? "at-job-chip--on" : ""}`}
              onClick={() => { setJobId(j.id); setPage(1); setSearch(""); setStatus(""); }}
            >
              {j.title}
              <span className="at-job-count">{j.applicationCount}</span>
              {j.autoOrchestrate && (
                <Zap size={10} className="at-job-zap" />
              )}
            </button>
          ))}
        </div>

        {/* ════ EMPTY — no job selected ════════════════════════════════════ */}
        {!jobId && (
          <div className="at-empty">
            <span className="at-empty-icon">↑</span>
            <p>Select a job listing above to view its applicants.</p>
          </div>
        )}

        {/* ════ SELECTED JOB VIEW ══════════════════════════════════════════ */}
        {jobId && (
          <>
            {/* Toolbar */}
            <div className="at-toolbar">
              <div className="at-search-wrap">
                <input
                  ref={searchRef}
                  className="at-search"
                  placeholder="Search by name, email, role…"
                  value={search ?? ""}
                  onChange={(e) => { setSearch(e.target.value || ""); setPage(1); }}
                />
              </div>

              <div className="at-status-chips">
                {["", "submitted", "in_review", "shortlisted", "rejected", "accepted"].map((s) => (
                  <button
                    key={s || "all"}
                    className={`at-status-chip ${(status ?? "") === s ? "at-status-chip--on" : ""}`}
                    onClick={() => { setStatus(s || ""); setPage(1); }}
                  >
                    {s ? STATUS_LABELS[s as AppStatus] : "All"}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="at-stats">
              {listLoading
                ? <span className="at-stats-loading"><Loader2 size={13} className="animate-spin mr-1.5 inline" />Loading…</span>
                : <span className="at-stats-text">{total} applicant{total !== 1 ? "s" : ""}</span>
              }
              {selectedJob?.autoOrchestrate && (
                <span className="at-auto-active-chip">
                  <Zap size={11} className="mr-1 inline" />Auto-orchestration active
                </span>
              )}
            </div>

            {/* ── TABLE ─────────────────────────────────────────────────── */}
            <div className="at-table-wrap">
              <table className="at-table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Role</th>
                    <th>Exp.</th>
                    <th>Location</th>
                    <th>AI Score</th>
                    <th>Applied</th>
                    <th>Status</th>
                    <th>CV</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {!listLoading && items.length === 0 && (
                    <tr>
                      <td colSpan={9} className="at-table-empty">
                        No applicants match your filters.
                      </td>
                    </tr>
                  )}
                  {items.map((app) => (
                    <tr key={app.id} className="at-table-row">
                      <td>
                        <div className="at-candidate-cell">
                          <span className="at-avatar">{initials(app.fullName)}</span>
                          <div>
                            <p className="at-candidate-name">{app.fullName}</p>
                            <p className="at-candidate-email">{app.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="at-cell-secondary">{app.currentRole}</td>
                      <td className="at-cell-secondary">{EXP_LABELS[app.experienceYears] ?? app.experienceYears}</td>
                      <td className="at-cell-secondary">{app.locationCity}</td>

                      {/* AI Score chip */}
                      <td>
                        {app.cvAnalysisId
                          ? (
                            <div className="flex flex-col gap-1">
                              <span className="at-ai-chip at-ai-chip--done">
                                <Brain size={10} className="mr-0.5 inline" />
                                { (app as any).aiScore ?? "Done" }
                              </span>
                              { (app as any).aiScore != null && (
                                <div className="w-full bg-orange-100 h-1 rounded-full overflow-hidden">
                                  <div 
                                    className="bg-orange-500 h-full transition-all duration-500" 
                                    style={{ width: `${(app as any).aiScore}%` }} 
                                  />
                                </div>
                              )}
                            </div>
                          )
                          : app.autoHandled
                            ? <span className="at-ai-chip at-ai-chip--skipped">Skipped</span>
                            : <span className="at-ai-chip at-ai-chip--pending">Pending</span>
                        }
                      </td>

                      <td className="at-cell-secondary">
                        {new Date(app.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </td>

                      {/* Inline status dropdown */}
                      <td>
                        <StatusDropdown
                          value={app.status as AppStatus}
                          onChange={(s) => updateStatus.mutate({ applicationId: app.id, status: s })}
                        />
                      </td>

                      <td>
                        <a href={app.cvUrl} target="_blank" rel="noreferrer" className="at-cv-link">
                          <FileText size={14} strokeWidth={1.5} />
                        </a>
                      </td>

                      <td>
                        <button className="at-view-btn" onClick={() => setDetailId(app.id)}>
                          View →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="at-pagination">
                <button className="at-page-btn" disabled={currentPage <= 1}
                  onClick={() => setPage(currentPage - 1)}>
                  <ChevronLeft size={15} strokeWidth={1.5} />
                </button>
                <span className="at-page-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button className="at-page-btn" disabled={currentPage >= totalPages}
                  onClick={() => setPage(currentPage + 1)}>
                  <ChevronRight size={15} strokeWidth={1.5} />
                </button>
              </div>
            )}
          </>
        )}

        {/* ════ DETAIL DRAWER ══════════════════════════════════════════════ */}
        {detailId && (
          <>
            <div className="at-backdrop" onClick={() => setDetailId(null)} />
            <aside className="at-drawer">
              <div className="at-drawer-inner">

                {detailLoading && (
                  <div className="at-drawer-loading">
                    <Loader2 size={24} className="animate-spin text-orange-400" />
                  </div>
                )}

                {detail && !detailLoading && (
                  <>
                    {/* Drawer header */}
                    <div className="at-drawer-header">
                      <div className="at-drawer-avatar">{initials(detail.fullName)}</div>
                      <div className="at-drawer-name-block">
                        <h2 className="at-drawer-name">{detail.fullName}</h2>
                        <p className="at-drawer-role">{detail.currentRole}</p>
                        <p className="at-drawer-location">{detail.locationCity}</p>
                      </div>
                      <button className="at-drawer-close" onClick={() => setDetailId(null)}>✕</button>
                    </div>

                    {/* ── AI ANALYSIS PANEL ──────────────────────────────── */}
                    <AIAnalysisPanel
                      application={detail}
                      jobHasAgent={!!selectedJob?.agentId}
                      isTriggering={triggerOrchestration.isPending}
                      copiedLink={copiedLink}
                      onTrigger={() => triggerOrchestration.mutate({ applicationId: detail.id })}
                      onCopyLink={copyMeetingLink}
                    />

                    {/* Contact */}
                    <DrawerSection title="Contact">
                      <DrawerRow label="Email"    value={detail.email} />
                      <DrawerRow label="Phone"    value={detail.phone ?? "—"} />
                      {detail.linkedin  && <DrawerRow label="LinkedIn"  value={<a href={detail.linkedin} target="_blank" rel="noreferrer" className="at-link">{detail.linkedin}</a>} />}
                      {detail.portfolio && <DrawerRow label="Portfolio" value={<a href={detail.portfolio} target="_blank" rel="noreferrer" className="at-link">{detail.portfolio}</a>} />}
                    </DrawerSection>

                    {/* Professional */}
                    <DrawerSection title="Professional">
                      <DrawerRow label="Experience" value={EXP_LABELS[detail.experienceYears] ?? detail.experienceYears} />
                      <DrawerRow label="Skills"     value={detail.skills} />
                    </DrawerSection>

                    {/* Motivation */}
                    <DrawerSection title="Motivation">
                      <p className="at-drawer-motivation">{detail.motivation}</p>
                    </DrawerSection>

                    {/* Education */}
                    {detail.education && (detail.education as any[]).length > 0 && (
                      <DrawerSection title="Education">
                        {(detail.education as any[]).map((e, i) => (
                          <div key={i} className="at-edu-row">
                            <p className="at-edu-inst">{e.institution}</p>
                            <p className="at-edu-deg">{e.degree} in {e.field} · {e.graduationYear}</p>
                          </div>
                        ))}
                      </DrawerSection>
                    )}

                    {/* Documents */}
                    <DrawerSection title="Documents">
                      <div className="at-docs-row">
                        <a href={detail.cvUrl} target="_blank" rel="noreferrer" className="at-doc-btn">
                          <FileText size={14} strokeWidth={1.5} className="mr-1.5 inline" />CV
                        </a>
                        {detail.coverLetterUrl && (
                          <a href={detail.coverLetterUrl} target="_blank" rel="noreferrer" className="at-doc-btn">
                            <FileText size={14} strokeWidth={1.5} className="mr-1.5 inline" />Cover Letter
                          </a>
                        )}
                      </div>
                    </DrawerSection>

                    {/* Status controls */}
                    <DrawerSection title="Status">
                      <div className="at-status-btns">
                        {(Object.keys(STATUS_LABELS) as AppStatus[]).map((s) => (
                          <button
                            key={s}
                            className={`at-status-action-btn ${detail.status === s ? "at-status-action-btn--on" : ""}`}
                            onClick={() => updateStatus.mutate({ applicationId: detail.id, status: s })}
                            disabled={updateStatus.isPending}
                          >
                            {STATUS_LABELS[s]}
                          </button>
                        ))}
                      </div>
                    </DrawerSection>

                    {/* Recruiter notes */}
                    <DrawerSection title="Recruiter notes">
                      <textarea
                        className="at-notes"
                        rows={4}
                        placeholder="Internal notes — not visible to candidate…"
                        value={notesText}
                        onChange={(e) => setNotesText(e.target.value)}
                      />
                      <button className="at-save-notes-btn"
                        onClick={() => saveNotes.mutate({ applicationId: detail.id, recruiterNotes: notesText })}
                        disabled={saveNotes.isPending}
                      >
                        {saveNotes.isPending ? "Saving…" : "Save notes"}
                      </button>
                    </DrawerSection>
                  </>
                )}
              </div>
            </aside>
          </>
        )}
      </div>
    </>
  );
}

// ─── AI Analysis Panel ────────────────────────────────────────────────────────
// Shows inside the drawer. Three states:
//   a) Analysis done + meeting created  → scores + meeting link
//   b) Analysis done, no meeting        → scores + "no interview" reason
//   c) No analysis yet                  → run button (if job has agent)

function AIAnalysisPanel({
  application,
  jobHasAgent,
  isTriggering,
  copiedLink,
  onTrigger,
  onCopyLink,
}: {
  application:  any;
  jobHasAgent:  boolean;
  isTriggering: boolean;
  copiedLink:   boolean;
  onTrigger:    () => void;
  onCopyLink:   (id: string) => void;
}) {
  const trpc = useTRPC();

  // Fetch the linked cvAnalysis if present
  // Uses getCVAnalysisById (matches your candidates router) with skipToken guard
  const { data: analysis } = useQuery(
    trpc.candidates.getCVAnalysisById.queryOptions(
      application.cvAnalysisId
        ? { id: application.cvAnalysisId }
        : skipToken,
    ),
  );

  const meetingLink = application.meetingId
    ? `${process.env.NEXT_PUBLIC_APP_URL}/meeting-call/${application.meetingId}`
    : null;

  // ── Case C: no analysis, pipeline not yet run ───────────────────────────
  if (!application.cvAnalysisId && !application.autoHandled) {
    return (
      <div className="at-ai-panel at-ai-panel--pending">
        <div className="at-ai-panel-head">
          <Brain size={15} className="at-ai-panel-icon" />
          <span className="at-ai-panel-title">AI Screening</span>
          <span className="at-ai-panel-status at-ai-panel-status--pending">Pending</span>
        </div>
        <p className="at-ai-panel-desc">
          {jobHasAgent
            ? "This CV hasn't been screened yet. Run AI screening to analyse the candidate and optionally send an interview invite."
            : "No AI agent is assigned to this job listing. Edit the listing to add one, then return here to run screening."}
        </p>
        {jobHasAgent && (
          <button
            className="at-ai-run-btn"
            onClick={onTrigger}
            disabled={isTriggering}
          >
            {isTriggering
              ? <><Loader2 size={13} className="animate-spin mr-1.5 inline" />Screening…</>
              : <><Zap size={13} className="mr-1.5 inline" />Run AI screening</>
            }
          </button>
        )}
      </div>
    );
  }

  // ── Case B/A: analysis exists ───────────────────────────────────────────
  if (application.cvAnalysisId) {
    return (
      <div className="at-ai-panel at-ai-panel--done">
        <div className="at-ai-panel-head">
          <Brain size={15} className="at-ai-panel-icon" />
          <span className="at-ai-panel-title">AI Screening</span>
          <span className="at-ai-panel-status at-ai-panel-status--done">Complete</span>
          {application.autoHandled && (
            <span className="at-ai-auto-tag"><Zap size={9} className="mr-0.5 inline" />Auto</span>
          )}
        </div>

        {/* Score row */}
        {analysis && (
          <>
            <div className="at-ai-scores">
              <div className={`at-ai-score-block ${SCORE_CLASS(analysis.overallScore ?? 0)}`}>
                <span className="at-ai-score-val">{analysis.overallScore ?? "—"}</span>
                <span className="at-ai-score-label">Overall</span>
              </div>
              {analysis.roleAlignment?.score != null && (
                <div className={`at-ai-score-block ${SCORE_CLASS((analysis.roleAlignment.score / 10) * 100)}`}>
                  <span className="at-ai-score-val">{analysis.roleAlignment.score}<span className="at-ai-score-denom">/10</span></span>
                  <span className="at-ai-score-label">Role Fit</span>
                </div>
              )}
              {analysis.experienceMatch?.score != null && (
                <div className={`at-ai-score-block ${SCORE_CLASS((analysis.experienceMatch.score / 10) * 100)}`}>
                  <span className="at-ai-score-val">{analysis.experienceMatch.score}<span className="at-ai-score-denom">/10</span></span>
                  <span className="at-ai-score-label">Exp. Match</span>
                </div>
              )}
              {analysis.recommendation && (
                <div className={`at-ai-rec-block ${REC_COLORS[analysis.recommendation] ?? ""}`}>
                  <span className="at-ai-rec-val">{analysis.recommendation}</span>
                  <span className="at-ai-score-label">Recommendation</span>
                </div>
              )}
            </div>

            {analysis.summary && (
              <p className="at-ai-summary">{analysis.summary}</p>
            )}

            <a
              href={`/candidate/${application.cvAnalysisId}`}
              target="_blank"
              rel="noreferrer"
              className="at-ai-full-link"
            >
              <ExternalLink size={12} strokeWidth={1.5} className="mr-1 inline" />
              View full analysis
            </a>
          </>
        )}

        {/* Meeting block */}
        {meetingLink ? (
          <div className="at-meeting-block">
            <div className="at-meeting-block-head">
              <MailCheck size={13} className="mr-1.5 inline text-green-600" />
              <span className="at-meeting-block-title">Interview meeting created</span>
              {application.autoHandled && (
                <span className="at-meeting-auto-tag">auto-sent</span>
              )}
            </div>
            <div className="at-meeting-link-row">
              <code className="at-meeting-link-code">{meetingLink}</code>
              <button className="at-meeting-copy-btn" onClick={() => onCopyLink(application.meetingId)}>
                {copiedLink
                  ? <Check size={13} strokeWidth={2} className="text-orange-500" />
                  : <Copy size={13} strokeWidth={1.5} />
                }
              </button>
              <a href={meetingLink} target="_blank" rel="noreferrer" className="at-meeting-open-btn">
                <ExternalLink size={13} strokeWidth={1.5} />
              </a>
            </div>
          </div>
        ) : (
          <div className="at-no-meeting-block">
            <ZapOff size={13} className="mr-1.5 inline opacity-40" />
            <span className="at-no-meeting-text">
              No interview created
              {analysis?.recommendation
                ? ` — recommendation was "${analysis.recommendation}"`
                : ""
              }
            </span>
            {/* Manual trigger — only if job has agent */}
            {jobHasAgent && (
              <button
                className="at-ai-run-btn at-ai-run-btn--sm"
                onClick={onTrigger}
                disabled={isTriggering}
              >
                {isTriggering
                  ? <><Loader2 size={11} className="animate-spin mr-1 inline" />Running…</>
                  : <><Zap size={11} className="mr-1 inline" />Create interview & send invite</>
                }
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── Skipped (autoHandled=true, no analysis) ─────────────────────────────
  return (
    <div className="at-ai-panel at-ai-panel--skipped">
      <div className="at-ai-panel-head">
        <Brain size={15} className="at-ai-panel-icon" />
        <span className="at-ai-panel-title">AI Screening</span>
        <span className="at-ai-panel-status at-ai-panel-status--skipped">Skipped</span>
      </div>
      <p className="at-ai-panel-desc">
        The pipeline ran but was skipped — CV extraction may have failed or no agent was configured at submission time.
      </p>
      {jobHasAgent && (
        <button className="at-ai-run-btn" onClick={onTrigger} disabled={isTriggering}>
          {isTriggering
            ? <><Loader2 size={13} className="animate-spin mr-1.5 inline" />Running…</>
            : <><Zap size={13} className="mr-1.5 inline" />Retry AI screening</>
          }
        </button>
      )}
    </div>
  );
}

// ─── Drawer helpers ───────────────────────────────────────────────────────────

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="at-drawer-section">
      <p className="at-drawer-section-label">{title}</p>
      {children}
    </div>
  );
}

function DrawerRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="at-drawer-row">
      <span className="at-drawer-row-label">{label}</span>
      <span className="at-drawer-row-value">{value}</span>
    </div>
  );
}

function StatusDropdown({ value, onChange }: { value: AppStatus; onChange: (s: AppStatus) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="at-status-dd">
      <button
        className={`at-status-badge ${STATUS_COLORS[value]}`}
        onClick={() => setOpen((v) => !v)}
      >
        {STATUS_LABELS[value]} ▾
      </button>
      {open && (
        <div className="at-status-dd-menu">
          {(Object.keys(STATUS_LABELS) as AppStatus[]).map((s) => (
            <button key={s} className="at-status-dd-item"
              onClick={() => { onChange(s); setOpen(false); }}>
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── CSS ──────────────────────────────────────────────────────────────────────

const css = `
  .at-root {
    --o:   #FF6A00;
    --o05: rgba(255,106,0,0.05);
    --o08: rgba(255,106,0,0.08);
    --o12: rgba(255,106,0,0.12);
    --o20: rgba(255,106,0,0.20);
    --o30: rgba(255,106,0,0.30);
    --o40: rgba(255,106,0,0.40);
    --fd:  'DM Serif Display',Georgia,serif;
    --fb:  'DM Sans',system-ui,sans-serif;
    --fm:  'DM Mono','Fira Code',monospace;
    padding: 40px 40px 80px;
    font-family: var(--fb);
    color: var(--o);
    min-height: 100vh;
  }
  /* Page header */
  .at-page-header { margin-bottom: 28px; }
  .at-eyebrow { font-family:var(--fm); font-size:11px; color:var(--o30); letter-spacing:0.14em; text-transform:uppercase; margin:0 0 6px; }
  .at-page-title { font-family:var(--fd); font-size:clamp(26px,4vw,42px); font-weight:400; letter-spacing:-0.02em; margin:0; }
  /* Job selector */
  .at-job-bar { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:24px; padding-bottom:24px; border-bottom:1px solid var(--o08); }
  .at-job-chip { display:inline-flex; align-items:center; gap:6px; height:32px; padding:0 14px; border:1px solid var(--o20); border-radius:2px; background:#fff; font-family:var(--fb); font-size:12px; font-weight:500; color:var(--o40); cursor:pointer; transition:all 0.12s; }
  .at-job-chip:hover { border-color:var(--o); color:var(--o); }
  .at-job-chip--on { background:var(--o); border-color:var(--o); color:#fff; }
  .at-job-count { font-family:var(--fm); font-size:10px; background:rgba(255,255,255,0.25); padding:1px 6px; border-radius:2px; }
  .at-job-chip--on .at-job-count { background:rgba(255,255,255,0.2); }
  .at-job-zap { color:var(--o40); }
  .at-job-chip--on .at-job-zap { color:rgba(255,255,255,0.8); }
  /* Empty */
  .at-empty { display:flex; flex-direction:column; align-items:center; gap:12px; padding:80px 20px; color:var(--o20); font-size:13px; text-align:center; }
  .at-empty-icon { font-size:32px; }
  /* Toolbar */
  .at-toolbar { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:16px; flex-wrap:wrap; }
  .at-search-wrap { flex:1; min-width:200px; max-width:340px; }
  .at-search { width:100%; height:38px; padding:0 13px; border:1px solid var(--o20); border-radius:2px; font-family:var(--fb); font-size:13px; color:var(--o); background:#fff; outline:none; box-sizing:border-box; transition:border-color 0.12s; }
  .at-search::placeholder { color:var(--o30); }
  .at-search:focus { border-color:var(--o); box-shadow:0 0 0 3px var(--o05); }
  .at-status-chips { display:flex; flex-wrap:wrap; gap:6px; }
  .at-status-chip { height:28px; padding:0 12px; border:1px solid var(--o12); border-radius:2px; background:#fff; font-family:var(--fb); font-size:11px; color:var(--o40); cursor:pointer; transition:all 0.1s; }
  .at-status-chip:hover { border-color:var(--o); color:var(--o); }
  .at-status-chip--on { background:var(--o); border-color:var(--o); color:#fff; }
  /* Stats */
  .at-stats { display:flex; align-items:center; gap:12px; margin-bottom:12px; }
  .at-stats-text,.at-stats-loading { font-family:var(--fm); font-size:12px; color:var(--o30); letter-spacing:0.06em; }
  .at-auto-active-chip { display:inline-flex; align-items:center; background:var(--o08); border:1px solid var(--o20); border-radius:2px; padding:2px 10px; font-family:var(--fm); font-size:10px; color:var(--o); letter-spacing:0.04em; }
  /* Table */
  .at-table-wrap { border:1px solid var(--o12); border-radius:3px; overflow-x:auto; margin-bottom:24px; }
  .at-table { width:100%; border-collapse:collapse; font-family:var(--fb); font-size:13px; }
  .at-table thead tr { background:var(--o05); border-bottom:1px solid var(--o12); }
  .at-table th { padding:10px 14px; text-align:left; font-family:var(--fm); font-size:10px; letter-spacing:0.1em; text-transform:uppercase; color:var(--o40); font-weight:500; white-space:nowrap; }
  .at-table-row { border-bottom:1px solid var(--o08); transition:background 0.1s; }
  .at-table-row:last-child { border-bottom:none; }
  .at-table-row:hover { background:var(--o05); }
  .at-table td { padding:12px 14px; vertical-align:middle; }
  .at-table-empty { text-align:center; padding:40px; color:var(--o30); font-style:italic; }
  .at-candidate-cell { display:flex; align-items:center; gap:10px; }
  .at-avatar { width:32px; height:32px; border-radius:50%; background:var(--o12); border:1px solid var(--o20); display:inline-flex; align-items:center; justify-content:center; font-family:var(--fm); font-size:11px; font-weight:600; color:var(--o); flex-shrink:0; }
  .at-candidate-name { font-weight:600; color:var(--o); font-size:13px; line-height:1.2; }
  .at-candidate-email { font-size:11px; color:var(--o40); line-height:1.2; }
  .at-cell-secondary { color:var(--o40); font-size:12px; }
  /* AI chip in table */
  .at-ai-chip { font-family:var(--fm); font-size:10px; border-radius:2px; padding:2px 8px; letter-spacing:0.04em; border:1px solid; }
  .at-ai-chip--done    { background:var(--o08); border-color:var(--o20); color:var(--o); }
  .at-ai-chip--pending { background:rgba(200,200,200,0.08); border-color:rgba(0,0,0,0.1); color:#9ca3af; }
  .at-ai-chip--skipped { background:rgba(200,100,0,0.05); border-color:rgba(200,100,0,0.15); color:#c87700; }
  /* Status dropdown */
  .at-status-dd { position:relative; display:inline-block; }
  .at-status-badge { border:none; border-radius:2px; padding:3px 10px; font-family:var(--fm); font-size:10px; letter-spacing:0.06em; cursor:pointer; font-weight:600; transition:opacity 0.1s; }
  .at-status-badge:hover { opacity:0.8; }
  .at-status--submitted   { background:rgba(100,150,255,0.12); color:#4466dd; }
  .at-status--review      { background:rgba(255,180,0,0.12);   color:#c87700; }
  .at-status--shortlisted { background:var(--o08);              color:var(--o); }
  .at-status--rejected    { background:rgba(200,60,0,0.08);    color:#c83c00; }
  .at-status--accepted    { background:rgba(0,180,80,0.1);     color:#0a7a3a; }
  .at-status-dd-menu { position:absolute; top:calc(100%+4px); left:0; z-index:50; background:#fff; border:1px solid var(--o20); border-radius:3px; box-shadow:0 4px 20px rgba(255,106,0,0.12); min-width:120px; overflow:hidden; }
  .at-status-dd-item { display:block; width:100%; padding:8px 14px; text-align:left; background:none; border:none; font-family:var(--fb); font-size:12px; color:var(--o40); cursor:pointer; transition:background 0.1s; }
  .at-status-dd-item:hover { background:var(--o05); color:var(--o); }
  /* CV link */
  .at-cv-link { color:var(--o40); transition:color 0.1s; }
  .at-cv-link:hover { color:var(--o); }
  /* View btn */
  .at-view-btn { height:28px; padding:0 12px; border:1px solid var(--o20); border-radius:2px; background:#fff; font-family:var(--fm); font-size:10px; letter-spacing:0.06em; color:var(--o40); cursor:pointer; transition:all 0.1s; white-space:nowrap; }
  .at-view-btn:hover { border-color:var(--o); color:var(--o); }
  /* Pagination */
  .at-pagination { display:flex; align-items:center; gap:12px; justify-content:center; padding:16px 0; }
  .at-page-btn { width:32px; height:32px; border:1px solid var(--o20); border-radius:2px; background:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; color:var(--o40); transition:all 0.1s; }
  .at-page-btn:hover:not(:disabled) { border-color:var(--o); color:var(--o); }
  .at-page-btn:disabled { opacity:0.3; cursor:not-allowed; }
  .at-page-info { font-family:var(--fm); font-size:11px; color:var(--o40); letter-spacing:0.06em; }
  /* Backdrop */
  .at-backdrop { position:fixed; inset:0; background:rgba(255,106,0,0.05); backdrop-filter:blur(2px); z-index:40; }
  /* Drawer */
  .at-drawer { position:fixed; top:0; right:0; bottom:0; width:480px; max-width:95vw; background:#fff; border-left:1px solid var(--o12); z-index:50; overflow-y:auto; box-shadow:-8px 0 32px rgba(255,106,0,0.08); animation:at-slide 0.22s ease; }
  @keyframes at-slide { from{transform:translateX(100%)} to{transform:translateX(0)} }
  .at-drawer::-webkit-scrollbar { width:4px; }
  .at-drawer::-webkit-scrollbar-thumb { background:var(--o12); border-radius:2px; }
  .at-drawer-inner { padding:28px 28px 60px; }
  .at-drawer-loading { display:flex; align-items:center; justify-content:center; height:100%; padding:80px 0; }
  /* Drawer header */
  .at-drawer-header { display:flex; align-items:flex-start; gap:14px; margin-bottom:28px; padding-bottom:22px; border-bottom:1px solid var(--o08); }
  .at-drawer-avatar { width:48px; height:48px; border-radius:50%; background:var(--o12); border:2px solid var(--o20); display:flex; align-items:center; justify-content:center; font-family:var(--fm); font-size:15px; font-weight:700; color:var(--o); flex-shrink:0; }
  .at-drawer-name-block { flex:1; min-width:0; }
  .at-drawer-name { font-family:var(--fd); font-size:22px; font-weight:400; letter-spacing:-0.02em; margin:0 0 3px; }
  .at-drawer-role { font-size:13px; color:var(--o40); margin:0 0 2px; }
  .at-drawer-location { font-size:12px; color:var(--o30); font-family:var(--fm); margin:0; }
  .at-drawer-close { background:none; border:none; font-size:18px; color:var(--o30); cursor:pointer; padding:0; line-height:1; margin-top:-2px; flex-shrink:0; transition:color 0.1s; }
  .at-drawer-close:hover { color:var(--o); }
  /* ── AI Panel ── */
  .at-ai-panel { border:1px solid var(--o20); border-radius:3px; padding:16px; margin-bottom:20px; }
  .at-ai-panel--done    { border-color:var(--o20); background:var(--o05); }
  .at-ai-panel--pending { border-color:var(--o12); background:#fff; }
  .at-ai-panel--skipped { border-color:rgba(200,150,0,0.2); background:rgba(255,200,0,0.03); }
  .at-ai-panel-head { display:flex; align-items:center; gap:8px; margin-bottom:10px; }
  .at-ai-panel-icon { color:var(--o); flex-shrink:0; }
  .at-ai-panel-title { font-size:13px; font-weight:600; color:var(--o); flex:1; }
  .at-ai-panel-status { font-family:var(--fm); font-size:10px; letter-spacing:0.06em; border-radius:2px; padding:2px 8px; border:1px solid; }
  .at-ai-panel-status--pending { background:rgba(150,150,150,0.08); border-color:rgba(0,0,0,0.1); color:#9ca3af; }
  .at-ai-panel-status--done    { background:var(--o08); border-color:var(--o20); color:var(--o); }
  .at-ai-panel-status--skipped { background:rgba(200,150,0,0.08); border-color:rgba(200,150,0,0.2); color:#c87700; }
  .at-ai-auto-tag { font-family:var(--fm); font-size:9px; background:var(--o12); border-radius:2px; padding:1px 6px; color:var(--o); letter-spacing:0.06em; display:inline-flex; align-items:center; }
  .at-ai-panel-desc { font-size:12px; color:var(--o40); line-height:1.6; margin:0 0 12px; }
  /* Scores grid */
  .at-ai-scores { display:grid; grid-template-columns:repeat(auto-fit,minmax(70px,1fr)); gap:8px; margin-bottom:12px; }
  .at-ai-score-block,.at-ai-rec-block { border:1px solid var(--o12); border-radius:2px; padding:8px 10px; display:flex; flex-direction:column; align-items:center; gap:3px; background:#fff; }
  .at-ai-score-val { font-family:var(--fd); font-size:18px; font-weight:400; line-height:1; }
  .at-ai-score-denom { font-size:11px; opacity:0.5; }
  .at-ai-score-label { font-family:var(--fm); font-size:9px; letter-spacing:0.08em; text-transform:uppercase; color:var(--o40); }
  .at-ai-rec-val { font-family:var(--fm); font-size:11px; font-weight:700; letter-spacing:0.04em; white-space:nowrap; }
  .at-score--green { color:#0a7a3a; border-color:rgba(0,180,80,0.2); }
  .at-score--yellow { color:#c87700; border-color:rgba(200,150,0,0.2); }
  .at-score--red { color:#c83c00; border-color:rgba(200,60,0,0.2); }
  .at-rec--strong,.at-rec--hire   { color:#0a7a3a; }
  .at-rec--interview              { color:#1a4acc; }
  .at-rec--maybe                  { color:#c87700; }
  .at-rec--pass                   { color:#c83c00; }
  .at-ai-summary { font-size:11px; color:var(--o40); line-height:1.65; margin:0 0 10px; font-style:italic; }
  .at-ai-full-link { font-family:var(--fm); font-size:11px; color:var(--o40); text-decoration:none; letter-spacing:0.04em; transition:color 0.1s; }
  .at-ai-full-link:hover { color:var(--o); }
  /* Run button */
  .at-ai-run-btn { margin-top:12px; display:inline-flex; align-items:center; height:34px; padding:0 16px; background:var(--o); color:#fff; border:none; border-radius:2px; font-family:var(--fb); font-size:12px; font-weight:600; cursor:pointer; transition:opacity 0.12s; }
  .at-ai-run-btn:hover:not(:disabled) { opacity:0.85; }
  .at-ai-run-btn:disabled { opacity:0.4; cursor:not-allowed; }
  .at-ai-run-btn--sm { height:28px; padding:0 12px; font-size:11px; margin-top:8px; }
  /* Meeting block */
  .at-meeting-block { margin-top:14px; padding:12px; background:#fff; border:1px solid rgba(0,180,80,0.2); border-radius:2px; }
  .at-meeting-block-head { display:flex; align-items:center; gap:6px; margin-bottom:8px; }
  .at-meeting-block-title { font-size:12px; font-weight:600; color:#0a7a3a; flex:1; }
  .at-meeting-auto-tag { font-family:var(--fm); font-size:9px; background:rgba(0,180,80,0.08); border:1px solid rgba(0,180,80,0.2); border-radius:2px; padding:1px 6px; color:#0a7a3a; letter-spacing:0.06em; }
  .at-meeting-link-row { display:flex; align-items:center; gap:6px; }
  .at-meeting-link-code { flex:1; font-family:var(--fm); font-size:10px; color:var(--o40); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; background:var(--o05); padding:4px 8px; border-radius:2px; border:1px solid var(--o12); }
  .at-meeting-copy-btn,.at-meeting-open-btn { width:28px; height:28px; border:1px solid var(--o12); border-radius:2px; background:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; color:var(--o40); transition:all 0.1s; }
  .at-meeting-copy-btn:hover,.at-meeting-open-btn:hover { border-color:var(--o); color:var(--o); }
  .at-meeting-open-btn { text-decoration:none; }
  /* No meeting block */
  .at-no-meeting-block { margin-top:14px; padding:10px 12px; background:rgba(200,60,0,0.03); border:1px solid rgba(200,60,0,0.12); border-radius:2px; display:flex; flex-direction:column; gap:2px; }
  .at-no-meeting-text { font-size:11px; color:var(--o40); }
  /* Drawer sections */
  .at-drawer-section { padding:16px 0; border-bottom:1px solid var(--o08); }
  .at-drawer-section:last-child { border-bottom:none; }
  .at-drawer-section-label { font-family:var(--fm); font-size:10px; letter-spacing:0.12em; text-transform:uppercase; color:var(--o30); margin:0 0 10px; }
  .at-drawer-row { display:flex; align-items:flex-start; gap:12px; margin-bottom:6px; }
  .at-drawer-row:last-child { margin-bottom:0; }
  .at-drawer-row-label { font-family:var(--fm); font-size:11px; color:var(--o30); min-width:72px; flex-shrink:0; letter-spacing:0.04em; padding-top:1px; }
  .at-drawer-row-value { font-size:13px; color:var(--o); line-height:1.5; flex:1; word-break:break-word; }
  .at-link { color:var(--o40); text-decoration:none; font-family:var(--fm); font-size:11px; transition:color 0.1s; }
  .at-link:hover { color:var(--o); text-decoration:underline; }
  .at-drawer-motivation { font-size:13px; color:var(--o40); line-height:1.7; margin:0; }
  .at-edu-row { margin-bottom:8px; padding:10px 12px; background:var(--o05); border:1px solid var(--o08); border-radius:2px; }
  .at-edu-row:last-child { margin-bottom:0; }
  .at-edu-inst { font-size:13px; font-weight:600; color:var(--o); margin:0 0 2px; }
  .at-edu-deg  { font-size:12px; color:var(--o40); margin:0; }
  .at-docs-row { display:flex; gap:8px; flex-wrap:wrap; }
  .at-doc-btn  { display:inline-flex; align-items:center; height:32px; padding:0 14px; border:1px solid var(--o20); border-radius:2px; font-family:var(--fb); font-size:12px; color:var(--o40); text-decoration:none; transition:all 0.1s; }
  .at-doc-btn:hover { border-color:var(--o); color:var(--o); }
  .at-status-btns { display:flex; flex-wrap:wrap; gap:6px; }
  .at-status-action-btn { height:30px; padding:0 13px; border:1px solid var(--o12); border-radius:2px; background:#fff; font-family:var(--fb); font-size:11px; color:var(--o40); cursor:pointer; transition:all 0.1s; }
  .at-status-action-btn:hover { border-color:var(--o); color:var(--o); }
  .at-status-action-btn--on { background:var(--o); border-color:var(--o); color:#fff; }
  .at-notes { width:100%; padding:10px 13px; border:1px solid var(--o20); border-radius:2px; font-family:var(--fb); font-size:13px; color:var(--o); background:#fff; outline:none; resize:vertical; box-sizing:border-box; transition:border-color 0.12s; }
  .at-notes::placeholder { color:var(--o30); }
  .at-notes:focus { border-color:var(--o); box-shadow:0 0 0 3px var(--o08); }
  .at-save-notes-btn { margin-top:8px; height:32px; padding:0 16px; border:1px solid var(--o20); border-radius:2px; background:#fff; font-family:var(--fm); font-size:11px; letter-spacing:0.06em; color:var(--o40); cursor:pointer; transition:all 0.1s; }
  .at-save-notes-btn:hover:not(:disabled) { border-color:var(--o); color:var(--o); }
  .at-save-notes-btn:disabled { opacity:0.4; cursor:not-allowed; }
  @media(max-width:700px) {
    .at-root { padding:20px 16px 60px; }
    .at-toolbar { flex-direction:column; align-items:stretch; }
    .at-search-wrap { max-width:100%; }
    .at-drawer { width:100%; }
  }
`;