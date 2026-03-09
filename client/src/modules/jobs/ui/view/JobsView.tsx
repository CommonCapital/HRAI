// app/company/jobs/_views/jobs-view.tsx  ← CLIENT COMPONENT
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Brain, Check, ChevronDown, Copy, ExternalLink, PlusCircle, Sparkles, Users, Zap, ZapOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CommandSelect } from "@/components/command-select";
import { GeneratedAvatar } from "@/components/generated-avatar";

// ─── Types ────────────────────────────────────────────────────────────────────

type RightPanel = "create" | "detail" | "created";

type MatchResult = {
  applicationId:     string;
  candidateName:     string;
  currentRole:       string | null;
  experienceYears:   string | null;   // "0-1" | "1-3" | "3-5" | "5-10" | "10+"
  location:          string | null;
  skills:            string;          // free-text string from the application form
  score:             number;
  recommendation:    string;
  explanation:       string;
  strengths:         string[];
  gaps:              string[];
  applicationStatus: string;
};


type JobFormValues = {
  title:             string;
  description:       string;
  location:          string;
  employmentType:    "full_time" | "part_time" | "contract" | "internship" | "temporary";
  workplaceType:     "on_site" | "remote" | "hybrid";
  salaryMin:         string;
  salaryMax:         string;
  salaryCurrency:    string;
  tags:              string;
  autoCloseOnAccept: boolean;
  // ── NEW ──
  agentId:           string;
  autoOrchestrate:   boolean;
};

const DEFAULT_FORM: JobFormValues = {
  title: "", description: "", location: "",
  employmentType: "full_time", workplaceType: "hybrid",
  salaryMin: "", salaryMax: "", salaryCurrency: "USD",
  tags: "", autoCloseOnAccept: false,
  agentId: "", autoOrchestrate: false,
};

const EMP_LABELS: Record<string, string> = {
  full_time: "Full-time", part_time: "Part-time", contract: "Contract",
  internship: "Internship", temporary: "Temporary",
};
const WP_LABELS: Record<string, string> = {
  on_site: "On-site", remote: "Remote", hybrid: "Hybrid",
};

// ─── View ─────────────────────────────────────────────────────────────────────

export function JobsView() {
  const router      = useRouter();
  const trpc        = useTRPC();
  const queryClient = useQueryClient();
const EXP_LABELS: Record<string, string> = {
  "0-1":  "0–1 yrs",
  "1-3":  "1–3 yrs",
  "3-5":  "3–5 yrs",
  "5-10": "5–10 yrs",
  "10+":  "10+ yrs",
};
  const [showClosed,    setShowClosed]    = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [rightPanel,    setRightPanel]    = useState<RightPanel>("create");
  const [feedback,      setFeedback]      = useState<string | null>(null);
  const [pendingId,     setPendingId]     = useState<string | null>(null);
  const [agentSearch,   setAgentSearch]   = useState("");

  // AI auto-fill state
  const [autoFilling, setAutoFilling] = useState(false);

  // AI match state
  const [matchLoading,  setMatchLoading]  = useState(false);
  const [matchData,     setMatchData]     = useState<MatchResult[] | null>(null);
  const [matchJobId,    setMatchJobId]    = useState<string | null>(null);
  const [matchExpanded, setMatchExpanded] = useState(true);

  // After-creation state
  const [createdJobId,       setCreatedJobId]       = useState<string | null>(null);
  const [createdAutoEnabled, setCreatedAutoEnabled] = useState(false);
  const [applyLink,          setApplyLink]          = useState("");
  const [copied,             setCopied]             = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(applyLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: jobs } = useSuspenseQuery(
    trpc.jobs.myJobs.queryOptions({ includeClosed: showClosed }),
  );

  const agents = useQuery(
    trpc.agents.getMany.queryOptions({ pageSize: 100, search: agentSearch }),
  );

  const selectedJob = jobs.find((j) => j.id === selectedJobId) ?? null;

  const invalidateJobs = () => {
    queryClient.invalidateQueries(trpc.jobs.myJobs.queryOptions({ includeClosed: false }));
    queryClient.invalidateQueries(trpc.jobs.myJobs.queryOptions({ includeClosed: true }));
  };

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createJob = useMutation(
    trpc.jobs.create.mutationOptions({
      onSuccess: (data) => {
        invalidateJobs();
        setCreatedJobId(data.id);
        setCreatedAutoEnabled(!!(data as any).autoOrchestrate);
        setApplyLink(`${process.env.NEXT_PUBLIC_APP_URL}/apply/${data.id}`);
        setRightPanel("created");
        form.reset(DEFAULT_FORM);
      },
      onError: (e) => setFeedback(e.message),
    }),
  );

  const closeJob = useMutation(
    trpc.jobs.close.mutationOptions({
      onSuccess: () => { invalidateJobs(); setFeedback("Listing closed."); setPendingId(null); },
      onError:   (e) => { setFeedback(`Error: ${e.message}`); setPendingId(null); console.error("[closeJob]", e); },
    }),
  );

  const reopenJob = useMutation(
    trpc.jobs.update.mutationOptions({
      onSuccess: () => { invalidateJobs(); setFeedback("Listing reopened."); setPendingId(null); },
      onError:   (e) => { setFeedback(e.message); setPendingId(null); },
    }),
  );

  const toggleAutoClose = useMutation(
    trpc.jobs.toggleAutoClose.mutationOptions({
      onSuccess: ({ autoCloseOnAccept }) => {
        invalidateJobs();
        setFeedback(autoCloseOnAccept ? "Auto-close on." : "Auto-close off.");
        setPendingId(null);
      },
      onError: (e) => { setFeedback(e.message); setPendingId(null); },
    }),
  );

  // ── AI auto-fill ──────────────────────────────────────────────────────────
  const autoFillMutation = useMutation(trpc.jobs.autoFill.mutationOptions());

  async function handleAutoFill() {
    const title = form.getValues("title").trim();
    if (!title) { setFeedback("Enter a job title first to use AI fill."); return; }
    setAutoFilling(true);
    setFeedback(null);
    try {
      const data = await autoFillMutation.mutateAsync({ title });
      form.setValue("description",    data.description);
      form.setValue("location",       data.location);
      form.setValue("employmentType", data.employmentType);
      form.setValue("workplaceType",  data.workplaceType);
      form.setValue("salaryCurrency", data.salaryCurrency);
      form.setValue("tags",           data.tags.join(", "));
      if (data.salaryMin) form.setValue("salaryMin", String(data.salaryMin));
      if (data.salaryMax) form.setValue("salaryMax", String(data.salaryMax));
    } catch (e: any) {
      setFeedback(`AI fill failed: ${e.message}`);
    } finally {
      setAutoFilling(false);
    }
  }

  // ── AI candidate matching ─────────────────────────────────────────────────
  const matchMutation = useMutation(trpc.jobs.matchCandidates.mutationOptions());

  async function handleMatch(jobId: string) {
    setMatchLoading(true);
    setMatchData(null);
    setMatchJobId(jobId);
    setMatchExpanded(true);
    try {
      const result = await matchMutation.mutateAsync({ jobId });
      setMatchData(result.matches as MatchResult[]);
    } catch (e: any) {
      setFeedback(`Match failed: ${e.message}`);
    } finally {
      setMatchLoading(false);
    }
  }

  // ── Create form ───────────────────────────────────────────────────────────
  const form = useForm<JobFormValues>({ defaultValues: DEFAULT_FORM });
  const autoClose       = form.watch("autoCloseOnAccept");
  const autoOrchestrate = form.watch("autoOrchestrate");
  const selectedAgentId = form.watch("agentId");
  const selEmp          = form.watch("employmentType");
  const selWp           = form.watch("workplaceType");
  const currency        = form.watch("salaryCurrency") || "USD";

  // If agent is cleared, force autoOrchestrate off
  const handleAgentSelect = (val: string) => {
    form.setValue("agentId", val);
    if (!val) form.setValue("autoOrchestrate", false);
  };

  async function onSubmit(values: JobFormValues) {
    setFeedback(null);
    await createJob.mutateAsync({
      title:             values.title.trim(),
      description:       values.description.trim(),
      location:          values.location.trim(),
      employmentType:    values.employmentType,
      workplaceType:     values.workplaceType,
      salaryMin:         values.salaryMin  ? Number(values.salaryMin)  : undefined,
      salaryMax:         values.salaryMax  ? Number(values.salaryMax)  : undefined,
      salaryCurrency:    values.salaryCurrency || "USD",
      tags:              values.tags.split(",").map((t) => t.trim()).filter(Boolean),
      autoCloseOnAccept: values.autoCloseOnAccept,
      // ── NEW ──
      agentId:           values.agentId || undefined,
      autoOrchestrate:   values.agentId ? values.autoOrchestrate : false,
    });
  }

  const activeCount = jobs.filter((j) => j.isActive).length;
  const closedCount = jobs.filter((j) => !j.isActive).length;

  const agentOptions = (agents.data?.items ?? []).map((agent) => ({
    id:    agent.id,
    value: agent.id,
    children: (
      <div className="flex items-center gap-2">
        <GeneratedAvatar seed={agent.name} variant="initials" className="size-6 border border-orange-200" />
        <span className="text-sm">{agent.name}</span>
      </div>
    ),
  }));

  return (
    <>
      <style>{css}</style>
      <div className="crm-root">

        {/* ════ LEFT ════════════════════════════════════════════════════════ */}
        <aside className="crm-left">
          <div className="crm-left-header">
            <div className="crm-left-title-row">
              <h1 className="crm-left-title">Jobs</h1>
              <button className="crm-new-btn" onClick={() => {
                setRightPanel("create"); setSelectedJobId(null);
                setFeedback(null); setCreatedJobId(null);
                form.reset(DEFAULT_FORM);
              }}>+ New</button>
            </div>

            <div className="crm-left-stats">
              <span className="crm-stat">{activeCount}<em>active</em></span>
              <span className="crm-stat-sep" />
              <span className="crm-stat crm-stat--dim">{closedCount}<em>closed</em></span>
            </div>

            <button
              className={`crm-toggle-closed ${showClosed ? "crm-toggle-closed--on" : ""}`}
              onClick={() => setShowClosed((v) => !v)}
            >
              <span className="crm-toggle-track"><span className="crm-toggle-thumb" /></span>
              Show closed
            </button>
          </div>

          <div className="crm-list">
            {jobs.length === 0 ? (
              <div className="crm-list-empty">
                <span className="crm-list-empty-icon">◻</span>
                <p>No listings yet.<br />Post your first job →</p>
              </div>
            ) : (
              jobs.map((job) => {
                const isSelected = selectedJobId === job.id;
                return (
                  <button
                    key={job.id}
                    className={`crm-list-item ${isSelected ? "crm-list-item--selected" : ""} ${!job.isActive ? "crm-list-item--closed" : ""}`}
                    onClick={() => { setSelectedJobId(job.id); setRightPanel("detail"); setFeedback(null); if (matchJobId !== job.id) { setMatchData(null); setMatchJobId(null); } }}
                  >
                    <div className="crm-item-top">
                      <span className="crm-item-title">{job.title}</span>
                      <span className={`crm-item-dot ${job.isActive ? "crm-item-dot--active" : "crm-item-dot--closed"}`} />
                    </div>
                    <div className="crm-item-meta">
                      <span>{job.location}</span>
                      <span className="crm-item-sep">·</span>
                      <span>{WP_LABELS[job.workplaceType]}</span>
                    </div>
                    <div className="crm-item-footer">
                      <span className="crm-item-apps">
                        {job.applicationCount} applicant{job.applicationCount !== 1 ? "s" : ""}
                      </span>
                      <div className="crm-item-badges">
                        {(job as any).autoOrchestrate && (
                          <span className="crm-item-badge crm-item-badge--auto">
                            <Zap size={8} className="inline mr-0.5" />Auto
                          </span>
                        )}
                        {job.autoCloseOnAccept && (
                          <span className="crm-item-badge">Auto-close</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ════ RIGHT ═══════════════════════════════════════════════════════ */}
        <main className="crm-right">

          {/* ── CREATED SUCCESS ───────────────────────────────────────────── */}
          {rightPanel === "created" && createdJobId && (
            <div className="crm-success">
              <div className="crm-success-check">
                <Check strokeWidth={1.5} className="crm-success-check-icon" />
              </div>

              <div className="crm-success-copy">
                <h2 className="crm-success-title">Job Listed</h2>
                {createdAutoEnabled ? (
                  <div className="crm-auto-badge">
                    <Zap size={13} className="inline mr-1" />
                    Full automation enabled — CVs will be analysed and qualified
                    candidates receive an interview invite automatically.
                  </div>
                ) : (
                  <p className="crm-success-sub">
                    Share this link so candidates can submit their application.
                  </p>
                )}
              </div>

              <div className="crm-success-url-row">
                <Input value={applyLink} readOnly className="crm-success-input" />
                <Button variant="outline" className="crm-success-copy-btn" onClick={handleCopyLink}>
                  {copied
                    ? <Check size={17} strokeWidth={1.5} className="crm-icon-orange" />
                    : <Copy size={17} strokeWidth={1.5} className="crm-icon-orange" />
                  }
                </Button>
              </div>

              <div className="crm-success-actions">
                <Button className="crm-success-btn-primary" onClick={() => window.open(applyLink, "_blank")}>
                  <ExternalLink size={17} strokeWidth={1.5} className="mr-2" />
                  Preview form
                </Button>
                <Button variant="outline" className="crm-success-btn-secondary"
                  onClick={() => router.push(`/attendees?jobId=${createdJobId}`)}>
                  <Users size={17} strokeWidth={1.5} className="mr-2" />
                  View applicants
                </Button>
                <Button variant="outline" className="crm-success-btn-secondary"
                  onClick={() => { setRightPanel("create"); setCreatedJobId(null); form.reset(DEFAULT_FORM); }}>
                  <PlusCircle size={17} strokeWidth={1.5} className="mr-2" />
                  New listing
                </Button>
              </div>
            </div>
          )}

          {/* ── DETAIL ────────────────────────────────────────────────────── */}
          {rightPanel === "detail" && selectedJob && (
            <div className="crm-detail">
              <div className="crm-detail-header">
                <div>
                  <p className="crm-detail-eyebrow">
                    {selectedJob.isActive ? "Active listing" : "Closed listing"}
                    <span className={`crm-detail-status ${selectedJob.isActive ? "crm-detail-status--on" : "crm-detail-status--off"}`} />
                  </p>
                  <h2 className="crm-detail-title">{selectedJob.title}</h2>
                  <p className="crm-detail-sub">
                    {selectedJob.location}
                    <span className="crm-sep">·</span>
                    {WP_LABELS[selectedJob.workplaceType]}
                    <span className="crm-sep">·</span>
                    {EMP_LABELS[selectedJob.employmentType]}
                    {(selectedJob as any).autoOrchestrate && (
                      <>
                        <span className="crm-sep">·</span>
                        <span className="crm-detail-auto-badge">
                          <Zap size={10} className="inline mr-0.5" />Auto-interview
                        </span>
                      </>
                    )}
                  </p>
                </div>
                <div className="crm-detail-header-actions">
                  <button className="crm-edit-btn"
                    onClick={() => router.push(`/company/jobs/${selectedJob.id}/edit`)}>
                    Edit listing →
                  </button>
                  <button className="crm-applicants-btn"
                    onClick={() => router.push(`/attendees?jobId=${selectedJob.id}`)}>
                    <Users size={14} strokeWidth={1.5} className="mr-1 inline" />
                    Applicants ({selectedJob.applicationCount})
                  </button>
                  <button
                    className="crm-match-btn"
                    disabled={matchLoading && matchJobId === selectedJob.id}
                    onClick={() => handleMatch(selectedJob.id)}
                  >
                    <Brain size={14} strokeWidth={1.5} className="mr-1 inline" />
                    {matchLoading && matchJobId === selectedJob.id ? "Matching…" : "AI Match"}
                  </button>
                </div>
              </div>

              <div className="crm-metrics">
                <div className="crm-metric">
                  <span className="crm-metric-val">{selectedJob.applicationCount}</span>
                  <span className="crm-metric-label">Applicants</span>
                </div>
                <div className="crm-metric">
                  <span className="crm-metric-val">
                    {formatSalary(selectedJob.salaryMin, selectedJob.salaryMax, selectedJob.salaryCurrency)}
                  </span>
                  <span className="crm-metric-label">Salary range</span>
                </div>
                <div className="crm-metric">
                  <span className="crm-metric-val">
                    {new Date(selectedJob.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  <span className="crm-metric-label">Posted</span>
                </div>
              </div>

              {/* ── AI Match Results ──────────────────────────────────── */}
              {(matchLoading && matchJobId === selectedJob.id) || (matchData && matchJobId === selectedJob.id) ? (
                <div className="crm-match-panel">
                  <button
                    className="crm-match-panel-header"
                    onClick={() => setMatchExpanded((v) => !v)}
                  >
                    <span className="crm-match-panel-title">
                      <Brain size={14} className="inline mr-2 text-orange-500" />
                      AI Candidate Ranking
                      {matchData && (
                        <span className="crm-match-count">{matchData.length} candidates</span>
                      )}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`crm-match-chevron ${matchExpanded ? "crm-match-chevron--open" : ""}`}
                    />
                  </button>

                  {matchExpanded && (
                    <div className="crm-match-body">
                      {matchLoading ? (
                        <div className="crm-match-loading">
                          <span className="crm-match-spinner" />
                          Analyzing {selectedJob.applicationCount} candidates against job requirements…
                        </div>
                      ) : matchData && matchData.length === 0 ? (
                        <p className="crm-match-empty">No applications yet to rank.</p>
                      ) : (
                        <div className="crm-match-list">
                          {matchData?.map((m, idx) => (
                            <div key={m.applicationId} className="crm-match-card">
  <div className="crm-match-rank">#{idx + 1}</div>
  <div className="crm-match-info">
    <div className="crm-match-top">
      <span className="crm-match-name">{m.candidateName}</span>
      {m.currentRole && (
        <span className="crm-match-role">{m.currentRole}</span>
      )}
      {m.experienceYears && (
        <span className="crm-match-exp">{EXP_LABELS[m.experienceYears] ?? m.experienceYears}</span>
      )}
      <span className={`crm-match-rec crm-match-rec--${m.recommendation.toLowerCase().replace(" ", "-")}`}>
        {m.recommendation}
      </span>
    </div>
    <p className="crm-match-explanation">{m.explanation}</p>
    {(m.strengths.length > 0 || m.gaps.length > 0) && (
      <div className="crm-match-tags-row">
        {m.strengths.map((s) => (
          <span key={s} className="crm-match-tag crm-match-tag--strength">✓ {s}</span>
        ))}
        {m.gaps.map((g) => (
          <span key={g} className="crm-match-tag crm-match-tag--gap">✗ {g}</span>
        ))}
      </div>
    )}
  </div>
  <div className="crm-match-score-wrap">
    <svg viewBox="0 0 36 36" className="crm-match-score-ring">
      <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,106,0,0.1)" strokeWidth="3" />
      <circle
        cx="18" cy="18" r="15.9" fill="none"
        stroke={m.score >= 70 ? "#FF6A00" : m.score >= 50 ? "#f97316" : "rgba(255,106,0,0.3)"}
        strokeWidth="3"
        strokeDasharray={`${m.score} 100`}
        strokeLinecap="round"
        transform="rotate(-90 18 18)"
      />
    </svg>
    <span className="crm-match-score-num">{m.score}</span>
  </div>
</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : null}

              {/* Apply link */}
              <div className="crm-detail-section">
                <p className="crm-detail-section-label">Application link</p>
                <div className="crm-apply-link-row">
                  <code className="crm-apply-link-url">
                    {`${process.env.NEXT_PUBLIC_APP_URL}/apply/${selectedJob.id}`}
                  </code>
                  <button className="crm-apply-copy-btn" onClick={() =>
                    navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_APP_URL}/apply/${selectedJob.id}`)}>
                    <Copy size={13} strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              {selectedJob.tags.length > 0 && (
                <div className="crm-detail-section">
                  <p className="crm-detail-section-label">Tags</p>
                  <div className="crm-detail-tags">
                    {selectedJob.tags.map((t) => <span key={t} className="crm-detail-tag">{t}</span>)}
                  </div>
                </div>
              )}

              {/* Settings */}
              <div className="crm-detail-section">
                <p className="crm-detail-section-label">Settings</p>
                <div className="crm-settings-list">
                  <div className="crm-setting-row">
                    <div>
                      <p className="crm-setting-name">Auto-close on accept</p>
                      <p className="crm-setting-desc">
                        Closes listing and notifies all pending applicants when you accept someone.
                      </p>
                    </div>
                    <button
                      className={`crm-switch ${selectedJob.autoCloseOnAccept ? "crm-switch--on" : ""}`}
                      disabled={pendingId === selectedJob.id}
                      onClick={() => { setPendingId(selectedJob.id); toggleAutoClose.mutate({ jobId: selectedJob.id }); }}
                    ><span className="crm-switch-thumb" /></button>
                  </div>

                  {/* Auto-orchestrate indicator (read-only in detail — change via Edit) */}
                  <div className="crm-setting-row">
                    <div>
                      <p className="crm-setting-name">
                        {(selectedJob as any).autoOrchestrate ? (
                          <><Zap size={13} className="inline mr-1 text-orange-500" />Auto-orchestration active</>
                        ) : (
                          <><ZapOff size={13} className="inline mr-1 opacity-40" />Auto-orchestration off</>
                        )}
                      </p>
                      <p className="crm-setting-desc">
                        {(selectedJob as any).autoOrchestrate
                          ? "Submitted CVs are auto-analysed. Qualified candidates receive a meeting link via email."
                          : 'Enable in "Edit listing" by assigning an AI agent and toggling automation on.'}
                      </p>
                    </div>
                    <span className={`crm-switch crm-switch--readonly ${(selectedJob as any).autoOrchestrate ? "crm-switch--on" : ""}`}>
                      <span className="crm-switch-thumb" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="crm-detail-section crm-danger-zone">
                <p className="crm-detail-section-label">Actions</p>
                <div className="crm-danger-btns">
                  {selectedJob.isActive ? (
                    <button className="crm-danger-btn"
                      disabled={pendingId === selectedJob.id}
                      onClick={() => { setPendingId(selectedJob.id); closeJob.mutate({ jobId: selectedJob.id }); }}>
                      Close listing
                    </button>
                  ) : (
                    <button className="crm-reopen-btn"
                      disabled={pendingId === selectedJob.id}
                      onClick={() => { setPendingId(selectedJob.id); reopenJob.mutate({ jobId: selectedJob.id, isActive: true }); }}>
                      Reopen listing
                    </button>
                  )}
                </div>
                {feedback && <p className="crm-feedback">{feedback}</p>}
              </div>

              <p className="crm-timestamps">
                Created {new Date(selectedJob.createdAt).toLocaleDateString()}
                <span className="crm-sep">·</span>
                Updated {new Date(selectedJob.updatedAt).toLocaleDateString()}
              </p>
            </div>
          )}

          {/* ── CREATE ────────────────────────────────────────────────────── */}
          {rightPanel === "create" && (
            <div className="crm-create">
              <div className="crm-create-header">
                <p className="crm-create-eyebrow">New listing</p>
                <h2 className="crm-create-title">Post a job</h2>
                <p className="crm-create-sub">
                  Goes live immediately. A shareable application link is generated on creation.
                </p>
              </div>

              <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="crm-form">

                <CrmSection num="01" title="The Role">
                  <CrmField label="Job title" required error={form.formState.errors.title?.message}>
                    <div className="crm-title-row">
                      <input className="crm-input" placeholder="e.g. Senior Product Designer"
                        {...form.register("title", { required: "Required." })} />
                      <button
                        type="button"
                        className={`crm-autofill-btn ${autoFilling ? "crm-autofill-btn--loading" : ""}`}
                        disabled={autoFilling}
                        onClick={handleAutoFill}
                        title="AI fill — generates description, location, salary, and tags from your title"
                      >
                        <Sparkles size={13} className="mr-1 inline" />
                        {autoFilling ? "Filling…" : "AI fill"}
                      </button>
                    </div>
                  </CrmField>
                  <CrmField label="Description" required error={form.formState.errors.description?.message}>
                    <textarea className="crm-input crm-textarea" rows={5}
                      placeholder="Role overview, responsibilities, requirements..."
                      {...form.register("description", { required: "Required." })} />
                  </CrmField>
                </CrmSection>

                <CrmSection num="02" title="Details">
                  <CrmField label="Location" required error={form.formState.errors.location?.message}>
                    <input className="crm-input" placeholder="San Francisco, CA"
                      {...form.register("location", { required: "Required." })} />
                  </CrmField>
                  <CrmField label="Employment type">
                    <div className="crm-pills">
                      {Object.entries(EMP_LABELS).map(([v, l]) => (
                        <button key={v} type="button"
                          className={`crm-pill ${selEmp === v ? "crm-pill--on" : ""}`}
                          onClick={() => form.setValue("employmentType", v as any)}>{l}</button>
                      ))}
                    </div>
                  </CrmField>
                  <CrmField label="Workplace type">
                    <div className="crm-pills">
                      {Object.entries(WP_LABELS).map(([v, l]) => (
                        <button key={v} type="button"
                          className={`crm-pill ${selWp === v ? "crm-pill--on" : ""}`}
                          onClick={() => form.setValue("workplaceType", v as any)}>{l}</button>
                      ))}
                    </div>
                  </CrmField>
                </CrmSection>

                <CrmSection num="03" title="Compensation">
                  <div className="crm-grid-3">
                    <CrmField label={`Min (${currency})`}>
                      <input className="crm-input" placeholder="80,000" inputMode="numeric" {...form.register("salaryMin")} />
                    </CrmField>
                    <CrmField label={`Max (${currency})`}>
                      <input className="crm-input" placeholder="120,000" inputMode="numeric" {...form.register("salaryMax")} />
                    </CrmField>
                    <CrmField label="Currency">
                      <input className="crm-input" placeholder="USD" maxLength={5} {...form.register("salaryCurrency")} />
                    </CrmField>
                  </div>
                </CrmSection>

                <CrmSection num="04" title="Tags">
                  <CrmField label="Tags" hint="Comma-separated">
                    <input className="crm-input" placeholder="typescript, react, saas" {...form.register("tags")} />
                  </CrmField>
                </CrmSection>

                <CrmSection num="05" title="Settings">
                  <button type="button"
                    className={`crm-toggle-card ${autoClose ? "crm-toggle-card--on" : ""}`}
                    onClick={() => form.setValue("autoCloseOnAccept", !autoClose)}
                  >
                    <div>
                      <p className="crm-toggle-name">Auto-close on first accept</p>
                      <p className="crm-toggle-desc">
                        Closes listing and notifies all pending applicants when you accept someone.
                      </p>
                    </div>
                    <div className={`crm-switch crm-switch--sm ${autoClose ? "crm-switch--on" : ""}`}>
                      <span className="crm-switch-thumb" />
                    </div>
                  </button>
                </CrmSection>

                {/* ── Section 06 — Automation (NEW) ────────────────────── */}
                <CrmSection num="06" title="Automation">
                  <div className="crm-auto-section">
                    <div className="crm-auto-intro">
                      <Zap size={15} className="crm-auto-intro-icon" />
                      <p className="crm-auto-intro-text">
                        Assign an AI agent to automatically screen CVs and send interview
                        invitations to qualified candidates — no manual review needed.
                      </p>
                    </div>

                    {/* Agent picker */}
                    <CrmField label="AI interview agent">
                      <CommandSelect
                        options={[
                          {
                            id: "__none__",
                            value: "__none__",
                            children: (
                              <span className="text-sm text-orange-300 italic">No agent — manual review only</span>
                            ),
                          },
                          ...agentOptions,
                        ]}
                        onSelect={(val) => handleAgentSelect(val === "__none__" ? "" : val)}
                        onSearch={setAgentSearch}
                        value={selectedAgentId || "__none__"}
                        placeholder="Select AI agent…"
                      />
                    </CrmField>

                    {/* Auto-orchestrate toggle — disabled when no agent */}
                    <button
                      type="button"
                      disabled={!selectedAgentId}
                      className={`crm-toggle-card crm-toggle-card--auto ${autoOrchestrate ? "crm-toggle-card--on" : ""} ${!selectedAgentId ? "crm-toggle-card--disabled" : ""}`}
                      onClick={() => selectedAgentId && form.setValue("autoOrchestrate", !autoOrchestrate)}
                    >
                      <div>
                        <p className="crm-toggle-name">
                          <Zap size={13} className="inline mr-1" />
                          Full auto-orchestration
                        </p>
                        <p className="crm-toggle-desc">
                          {selectedAgentId
                            ? "When on: CV is analysed automatically on submission. Candidates scoring Strong Hire / Hire / Interview receive a meeting link via email with no recruiter action."
                            : "Select an AI agent above to enable this option."}
                        </p>
                      </div>
                      <div className={`crm-switch crm-switch--sm ${autoOrchestrate ? "crm-switch--on" : ""}`}>
                        <span className="crm-switch-thumb" />
                      </div>
                    </button>
                  </div>
                </CrmSection>

                <div className="crm-submit-row">
                  {feedback && <p className="crm-feedback">{feedback}</p>}
                  <button type="submit" className="crm-submit-btn" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Publishing…" : "Publish listing →"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {rightPanel === "detail" && !selectedJob && (
            <div className="crm-right-empty">
              <span className="crm-right-empty-icon">←</span>
              <p>Select a listing from the left to review it.</p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CrmSection({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div className="crm-section">
      <div className="crm-section-head">
        <span className="crm-section-num">{num}</span>
        <span className="crm-section-title">{title}</span>
      </div>
      <div className="crm-section-body">{children}</div>
    </div>
  );
}

function CrmField({ label, error, hint, required, children }: {
  label: string; error?: string; hint?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="crm-field">
      <label className="crm-label">{label}{required && <span className="crm-req"> *</span>}</label>
      {children}
      {hint  && !error && <p className="crm-hint">{hint}</p>}
      {error && <p className="crm-err">{error}</p>}
    </div>
  );
}

function formatSalary(min?: number | null, max?: number | null, currency?: string | null) {
  const c = currency ?? "USD";
  if (!min && !max) return "Undisclosed";
  if (min && max)   return `${min.toLocaleString()} – ${max.toLocaleString()} ${c}`;
  return `${(min ?? max ?? 0).toLocaleString()} ${c}`;
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
// (Same base tokens as before — only new automation rules added at the bottom)

const css = `
  .crm-root {
    --o:    #FF6A00;
    --o05:  rgba(255,106,0,0.05);
    --o08:  rgba(255,106,0,0.08);
    --o12:  rgba(255,106,0,0.12);
    --o20:  rgba(255,106,0,0.20);
    --o30:  rgba(255,106,0,0.30);
    --o40:  rgba(255,106,0,0.40);
    --white:#ffffff;
    --fd:'DM Serif Display',Georgia,serif;
    --fb:'DM Sans',system-ui,sans-serif;
    --fm:'DM Mono','Fira Code',monospace;
    display:flex;height:100vh;overflow:hidden;
    background:var(--white);font-family:var(--fb);color:var(--o);
  }
  /* LEFT */
  .crm-left{width:300px;min-width:300px;border-right:1px solid var(--o12);display:flex;flex-direction:column;overflow:hidden;}
  .crm-left-header{padding:28px 20px 16px;border-bottom:1px solid var(--o08);flex-shrink:0;}
  .crm-left-title-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;}
  .crm-left-title{font-family:var(--fd);font-size:22px;font-weight:400;letter-spacing:-0.02em;margin:0;}
  .crm-new-btn{height:28px;padding:0 12px;background:var(--o);color:var(--white);border:none;border-radius:2px;font-family:var(--fb);font-size:11px;font-weight:600;letter-spacing:0.04em;cursor:pointer;transition:opacity 0.12s;}
  .crm-new-btn:hover{opacity:0.85;}
  .crm-left-stats{display:flex;align-items:center;gap:10px;margin-bottom:12px;}
  .crm-stat{font-family:var(--fm);font-size:12px;color:var(--o);display:flex;align-items:baseline;gap:4px;}
  .crm-stat em{font-style:normal;font-size:10px;color:var(--o40);letter-spacing:0.06em;}
  .crm-stat--dim{color:var(--o40);}
  .crm-stat-sep{width:1px;height:10px;background:var(--o20);}
  .crm-toggle-closed{display:inline-flex;align-items:center;gap:8px;background:none;border:none;font-family:var(--fb);font-size:11px;color:var(--o40);cursor:pointer;padding:0;transition:color 0.12s;}
  .crm-toggle-closed:hover,.crm-toggle-closed--on{color:var(--o);}
  .crm-toggle-track{width:28px;height:16px;border:1px solid var(--o20);border-radius:8px;background:var(--white);position:relative;flex-shrink:0;transition:background 0.2s,border-color 0.2s;}
  .crm-toggle-closed--on .crm-toggle-track{background:var(--o);border-color:var(--o);}
  .crm-toggle-thumb{position:absolute;top:2px;left:2px;width:10px;height:10px;border-radius:50%;background:var(--o30);transition:transform 0.2s,background 0.2s;display:block;}
  .crm-toggle-closed--on .crm-toggle-thumb{transform:translateX(12px);background:var(--white);}
  .crm-list{flex:1;overflow-y:auto;padding:8px;display:flex;flex-direction:column;gap:2px;}
  .crm-list::-webkit-scrollbar{width:4px;}
  .crm-list::-webkit-scrollbar-thumb{background:var(--o12);border-radius:2px;}
  .crm-list-empty{display:flex;flex-direction:column;align-items:center;gap:8px;padding:48px 16px;text-align:center;color:var(--o30);font-size:12px;line-height:1.6;}
  .crm-list-empty-icon{font-size:24px;}
  .crm-list-item{width:100%;text-align:left;background:none;border:1px solid transparent;border-radius:3px;padding:10px 12px;cursor:pointer;font-family:var(--fb);transition:background 0.1s,border-color 0.1s;}
  .crm-list-item:hover{background:var(--o05);border-color:var(--o12);}
  .crm-list-item--selected{background:var(--o08);border-color:var(--o20);}
  .crm-list-item--closed{opacity:0.5;}
  .crm-item-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:3px;}
  .crm-item-title{font-size:13px;font-weight:600;color:var(--o);line-height:1.3;}
  .crm-item-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;margin-top:4px;}
  .crm-item-dot--active{background:var(--o);}
  .crm-item-dot--closed{background:var(--o20);}
  .crm-item-meta{font-size:11px;color:var(--o40);margin-bottom:5px;display:flex;align-items:center;gap:5px;}
  .crm-item-sep{color:var(--o20);}
  .crm-item-footer{display:flex;align-items:center;justify-content:space-between;gap:6px;}
  .crm-item-apps{font-family:var(--fm);font-size:10px;color:var(--o30);letter-spacing:0.04em;}
  .crm-item-badges{display:flex;gap:4px;}
  .crm-item-badge{font-family:var(--fm);font-size:9px;letter-spacing:0.06em;color:var(--o40);border:1px solid var(--o20);border-radius:2px;padding:1px 5px;}
  .crm-item-badge--auto{background:var(--o08);color:var(--o);border-color:var(--o20);}
  /* RIGHT */
  .crm-right{flex:1;overflow-y:auto;min-width:0;}
  .crm-right::-webkit-scrollbar{width:4px;}
  .crm-right::-webkit-scrollbar-thumb{background:var(--o12);border-radius:2px;}
  /* SUCCESS */
  .crm-success{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;min-height:100%;padding:80px 40px;animation:crm-fade 0.25s ease;}
  .crm-success-check{width:80px;height:80px;border:2px solid var(--o20);background:var(--o05);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
  .crm-success-check-icon{width:40px;height:40px;color:var(--o);}
  .crm-success-copy{text-align:center;}
  .crm-success-title{font-family:var(--fd);font-size:28px;font-weight:400;letter-spacing:-0.02em;margin:0 0 8px;}
  .crm-success-sub{font-size:13px;color:var(--o40);margin:0;}
  .crm-auto-badge{display:inline-flex;align-items:center;gap:4px;background:var(--o08);border:1px solid var(--o20);border-radius:2px;padding:7px 14px;font-size:12px;color:var(--o);font-weight:500;line-height:1.5;text-align:center;max-width:380px;}
  .crm-success-url-row{display:flex;gap:0;max-width:480px;width:100%;}
  .crm-success-input{border-radius:0;border-right:0;border-color:var(--o20);font-family:var(--fm);font-size:12px;}
  .crm-success-copy-btn{border-radius:0;border:1px solid var(--o20);padding:0 14px;}
  .crm-icon-orange{color:var(--o);}
  .crm-success-actions{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;padding-top:8px;border-top:1px solid var(--o08);max-width:480px;width:100%;}
  .crm-success-btn-primary{background:var(--o);color:var(--white);border:1px solid var(--o);border-radius:2px;height:44px;padding:0 24px;font-size:12px;font-weight:600;letter-spacing:0.06em;}
  .crm-success-btn-primary:hover{background:var(--white);color:var(--o);}
  .crm-success-btn-secondary{border:1px solid var(--o20);border-radius:2px;height:44px;padding:0 20px;font-size:12px;color:var(--o);}
  .crm-success-btn-secondary:hover{border-color:var(--o);background:var(--o05);}
  @keyframes crm-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  /* DETAIL */
  .crm-detail{padding:40px 48px 80px;max-width:680px;animation:crm-fade 0.2s ease;}
  .crm-detail-header{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:36px;}
  .crm-detail-header-actions{display:flex;flex-direction:column;gap:8px;align-items:flex-end;flex-shrink:0;}
  .crm-detail-eyebrow{display:flex;align-items:center;gap:8px;font-family:var(--fm);font-size:11px;color:var(--o40);letter-spacing:0.1em;text-transform:uppercase;margin:0 0 8px;}
  .crm-detail-status{width:7px;height:7px;border-radius:50%;}
  .crm-detail-status--on{background:var(--o);}
  .crm-detail-status--off{background:var(--o20);}
  .crm-detail-title{font-family:var(--fd);font-size:clamp(22px,3vw,34px);font-weight:400;letter-spacing:-0.02em;margin:0 0 8px;}
  .crm-detail-sub{font-size:13px;color:var(--o40);margin:0;display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
  .crm-detail-auto-badge{background:var(--o08);border:1px solid var(--o20);border-radius:2px;padding:1px 7px;font-family:var(--fm);font-size:10px;color:var(--o);letter-spacing:0.04em;}
  .crm-sep{color:var(--o20);}
  .crm-edit-btn,.crm-applicants-btn{height:36px;padding:0 16px;border:1px solid var(--o);border-radius:2px;font-family:var(--fb);font-size:12px;font-weight:600;letter-spacing:0.05em;cursor:pointer;transition:all 0.12s;white-space:nowrap;}
  .crm-edit-btn{background:var(--o);color:var(--white);}
  .crm-edit-btn:hover{background:var(--white);color:var(--o);}
  .crm-applicants-btn{background:var(--white);color:var(--o);}
  .crm-applicants-btn:hover{background:var(--o05);}
  .crm-apply-link-row{display:flex;align-items:center;gap:8px;background:var(--o05);border:1px solid var(--o12);padding:10px 14px;border-radius:2px;}
  .crm-apply-link-url{font-family:var(--fm);font-size:11px;color:var(--o40);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .crm-apply-copy-btn{background:none;border:none;cursor:pointer;color:var(--o40);padding:2px;transition:color 0.12s;}
  .crm-apply-copy-btn:hover{color:var(--o);}
  .crm-metrics{display:flex;gap:0;border:1px solid var(--o12);border-radius:2px;margin-bottom:36px;overflow:hidden;}
  .crm-metric{flex:1;padding:16px 20px;border-right:1px solid var(--o12);display:flex;flex-direction:column;gap:4px;}
  .crm-metric:last-child{border-right:none;}
  .crm-metric-val{font-family:var(--fd);font-size:20px;color:var(--o);letter-spacing:-0.01em;}
  .crm-metric-label{font-family:var(--fm);font-size:10px;color:var(--o30);letter-spacing:0.08em;text-transform:uppercase;}
  .crm-detail-section{margin-bottom:32px;padding-bottom:32px;border-bottom:1px solid var(--o08);}
  .crm-detail-section:last-of-type{border-bottom:none;}
  .crm-detail-section-label{font-family:var(--fm);font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:var(--o30);margin:0 0 12px;}
  .crm-detail-tags{display:flex;flex-wrap:wrap;gap:6px;}
  .crm-detail-tag{height:24px;padding:0 10px;border:1px solid var(--o12);border-radius:2px;font-family:var(--fm);font-size:10px;color:var(--o40);letter-spacing:0.04em;display:inline-flex;align-items:center;}
  .crm-settings-list{display:flex;flex-direction:column;}
  .crm-setting-row{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;padding:14px 0;border-bottom:1px solid var(--o08);}
  .crm-setting-row:last-child{border-bottom:none;}
  .crm-setting-name{font-size:13px;font-weight:600;color:var(--o);margin:0 0 3px;}
  .crm-setting-desc{font-size:11px;color:var(--o40);line-height:1.5;margin:0;max-width:340px;}
  .crm-switch{width:40px;height:22px;border:1px solid var(--o20);border-radius:11px;background:var(--white);position:relative;flex-shrink:0;cursor:pointer;transition:all 0.2s;margin-top:2px;}
  .crm-switch--on{background:var(--o);border-color:var(--o);}
  .crm-switch--readonly{cursor:default;pointer-events:none;opacity:0.7;}
  .crm-switch-thumb{position:absolute;top:3px;left:3px;width:14px;height:14px;border-radius:50%;background:var(--o20);transition:transform 0.2s,background 0.2s;display:block;}
  .crm-switch--on .crm-switch-thumb{transform:translateX(18px);background:var(--white);}
  .crm-switch:disabled{opacity:0.4;cursor:not-allowed;}
  .crm-switch--sm{width:36px;height:20px;}
  .crm-switch--sm .crm-switch-thumb{width:12px;height:12px;}
  .crm-switch--sm.crm-switch--on .crm-switch-thumb{transform:translateX(16px);}
  .crm-danger-btns{display:flex;gap:8px;margin-bottom:12px;}
  .crm-danger-btn{height:36px;padding:0 16px;border:1px solid rgba(200,60,0,0.3);border-radius:2px;background:var(--white);color:#c83c00;font-family:var(--fb);font-size:12px;font-weight:500;cursor:pointer;transition:all 0.12s;}
  .crm-danger-btn:hover:not(:disabled){background:rgba(200,60,0,0.05);border-color:#c83c00;}
  .crm-danger-btn:disabled,.crm-reopen-btn:disabled{opacity:0.4;cursor:not-allowed;}
  .crm-reopen-btn{height:36px;padding:0 16px;border:1px solid var(--o20);border-radius:2px;background:var(--white);color:var(--o);font-family:var(--fb);font-size:12px;font-weight:500;cursor:pointer;transition:all 0.12s;}
  .crm-reopen-btn:hover:not(:disabled){background:var(--o);color:var(--white);}
  .crm-timestamps{font-family:var(--fm);font-size:11px;color:var(--o20);letter-spacing:0.04em;display:flex;align-items:center;gap:8px;margin-top:24px;}
  .crm-feedback{font-size:12px;color:var(--o40);font-style:italic;} .crm-feedback--error{color:#ef4444;font-style:normal;font-weight:500;}
  /* CREATE */
  .crm-create{padding:40px 48px 80px;max-width:620px;animation:crm-fade 0.2s ease;}
  .crm-create-header{margin-bottom:36px;}
  .crm-create-eyebrow{font-family:var(--fm);font-size:11px;color:var(--o30);letter-spacing:0.14em;text-transform:uppercase;margin-bottom:8px;}
  .crm-create-title{font-family:var(--fd);font-size:clamp(24px,3.5vw,38px);font-weight:400;letter-spacing:-0.02em;margin:0 0 10px;}
  .crm-create-sub{font-size:13px;color:var(--o40);line-height:1.6;margin:0;}
  .crm-form{display:flex;flex-direction:column;}
  .crm-section{padding-bottom:28px;margin-bottom:28px;border-bottom:1px solid var(--o08);}
  .crm-section:last-of-type{border-bottom:none;}
  .crm-section-head{display:flex;align-items:baseline;gap:12px;margin-bottom:18px;}
  .crm-section-num{font-family:var(--fm);font-size:10px;color:var(--o20);letter-spacing:0.08em;}
  .crm-section-title{font-size:14px;font-weight:600;color:var(--o);letter-spacing:0.01em;}
  .crm-section-body{display:flex;flex-direction:column;gap:16px;}
  .crm-field{display:flex;flex-direction:column;gap:6px;}
  .crm-label{font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:var(--o);}
  .crm-req{color:var(--o);}
  .crm-hint{font-size:11px;color:var(--o30);margin:0;}
  .crm-err{font-size:11px;color:var(--o);font-weight:600;margin:0;}
  .crm-input{width:100%;height:42px;padding:0 13px;background:var(--white);border:1px solid var(--o20);border-radius:2px;font-family:var(--fb);font-size:13px;color:var(--o);outline:none;box-sizing:border-box;transition:border-color 0.12s,box-shadow 0.12s;}
  .crm-input::placeholder{color:var(--o30);}
  .crm-input:focus{border-color:var(--o);box-shadow:0 0 0 3px var(--o08);}
  .crm-textarea{height:auto;padding:10px 13px;resize:vertical;line-height:1.6;}
  .crm-grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;}
  .crm-pills{display:flex;flex-wrap:wrap;gap:6px;}
  .crm-pill{height:30px;padding:0 13px;border:1px solid var(--o20);border-radius:2px;background:var(--white);font-family:var(--fb);font-size:12px;font-weight:500;color:var(--o40);cursor:pointer;transition:all 0.1s;}
  .crm-pill:hover{border-color:var(--o);color:var(--o);}
  .crm-pill--on{background:var(--o);border-color:var(--o);color:var(--white);}
  .crm-toggle-card{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;padding:16px;border:1px solid var(--o20);border-radius:2px;background:var(--white);cursor:pointer;text-align:left;transition:all 0.12s;width:100%;}
  .crm-toggle-card:hover:not(.crm-toggle-card--disabled){border-color:var(--o);box-shadow:0 2px 8px var(--o08);}
  .crm-toggle-card--on{border-color:var(--o);background:var(--o05);}
  .crm-toggle-card--disabled{opacity:0.4;cursor:not-allowed;}
  .crm-toggle-name{font-size:13px;font-weight:600;color:var(--o);margin-bottom:3px;}
  .crm-toggle-desc{font-size:11px;color:var(--o40);line-height:1.5;}
  /* Automation section extras */
  .crm-auto-section{display:flex;flex-direction:column;gap:14px;}
  .crm-auto-intro{display:flex;align-items:flex-start;gap:10px;padding:12px 14px;background:var(--o05);border:1px solid var(--o12);border-radius:2px;}
  .crm-auto-intro-icon{color:var(--o);flex-shrink:0;margin-top:1px;}
  .crm-auto-intro-text{font-size:12px;color:var(--o40);line-height:1.6;margin:0;}
  .crm-toggle-card--auto{border-style:dashed;}
  .crm-toggle-card--auto.crm-toggle-card--on{border-style:solid;background:var(--o08);}
  .crm-submit-row{padding-top:20px;display:flex;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid var(--o08);position:sticky;bottom:0;background:var(--white);padding-bottom:4px;}
  .crm-submit-btn{height:44px;padding:0 28px;background:var(--o);color:var(--white);border:1px solid var(--o);border-radius:2px;font-family:var(--fb);font-size:12px;font-weight:600;letter-spacing:0.07em;text-transform:uppercase;cursor:pointer;transition:all 0.12s;margin-left:auto;}
  .crm-submit-btn:hover:not(:disabled){background:var(--white);color:var(--o);}
  .crm-submit-btn:disabled{opacity:0.4;cursor:not-allowed;}
  .crm-right-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;height:100%;color:var(--o20);font-size:13px;text-align:center;}
  .crm-right-empty-icon{font-size:28px;}
  @media(max-width:820px){
    .crm-root{flex-direction:column;height:auto;overflow:visible;}
    .crm-left{width:100%;min-width:0;border-right:none;border-bottom:1px solid var(--o12);max-height:40vh;}
    .crm-right{min-height:60vh;}
    .crm-detail,.crm-create{padding:24px 20px 60px;}
    .crm-grid-3{grid-template-columns:1fr 1fr;}
    .crm-detail-header{flex-direction:column;gap:16px;}
    .crm-detail-header-actions{flex-direction:row;align-items:center;}
    .crm-metrics{flex-wrap:wrap;}
    .crm-success{padding:40px 20px;}
  }
  /* AI auto-fill */
  .crm-title-row{display:flex;gap:8px;align-items:center;}
  .crm-title-row .crm-input{flex:1;}
  .crm-autofill-btn{height:42px;padding:0 14px;background:var(--o05);border:1px solid var(--o20);border-radius:2px;font-family:var(--fb);font-size:11px;font-weight:600;color:var(--o);cursor:pointer;white-space:nowrap;transition:all 0.12s;letter-spacing:0.04em;flex-shrink:0;}
  .crm-autofill-btn:hover:not(:disabled){background:var(--o);color:var(--white);border-color:var(--o);}
  .crm-autofill-btn:disabled{opacity:0.5;cursor:not-allowed;}
  .crm-autofill-btn--loading{opacity:0.7;}
  /* AI match button */
  .crm-match-btn{height:36px;padding:0 14px;border:1px solid var(--o20);border-radius:2px;font-family:var(--fb);font-size:12px;font-weight:600;color:var(--o);background:var(--o05);cursor:pointer;white-space:nowrap;transition:all 0.12s;}
  .crm-match-btn:hover:not(:disabled){background:var(--o);color:var(--white);border-color:var(--o);}
  .crm-match-btn:disabled{opacity:0.5;cursor:not-allowed;}
  /* AI match panel */
  .crm-match-panel{border:1px solid var(--o20);border-radius:2px;margin-bottom:32px;overflow:hidden;}
  .crm-match-panel-header{width:100%;display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--o05);border:none;cursor:pointer;font-family:var(--fb);}
  .crm-match-panel-header:hover{background:var(--o08);}
  .crm-match-panel-title{display:flex;align-items:center;font-size:12px;font-weight:600;color:var(--o);letter-spacing:0.04em;}
  .crm-match-count{font-family:var(--fm);font-size:10px;color:var(--o40);margin-left:8px;font-weight:400;}
  .crm-match-chevron{color:var(--o40);transition:transform 0.2s;flex-shrink:0;}
  .crm-match-chevron--open{transform:rotate(180deg);}
  .crm-match-body{padding:12px 0;}
  .crm-match-loading{display:flex;align-items:center;gap:10px;padding:20px 16px;font-size:12px;color:var(--o40);}
  .crm-match-spinner{width:16px;height:16px;border:2px solid var(--o12);border-top-color:var(--o);border-radius:50%;animation:crm-spin 0.7s linear infinite;flex-shrink:0;}
  @keyframes crm-spin{to{transform:rotate(360deg)}}
  .crm-match-empty{padding:20px 16px;font-size:12px;color:var(--o30);font-style:italic;}
  .crm-match-list{display:flex;flex-direction:column;}
  .crm-match-card{display:flex;align-items:flex-start;gap:12px;padding:12px 16px;border-bottom:1px solid var(--o08);transition:background 0.1s;}
  .crm-match-card:last-child{border-bottom:none;}
  .crm-match-card:hover{background:var(--o05);}
  .crm-match-rank{font-family:var(--fm);font-size:10px;color:var(--o30);width:24px;flex-shrink:0;padding-top:3px;}
  .crm-match-info{flex:1;min-width:0;}
  .crm-match-top{display:flex;align-items:baseline;flex-wrap:wrap;gap:6px;margin-bottom:4px;}
  .crm-match-name{font-size:13px;font-weight:600;color:var(--o);}
  .crm-match-role{font-size:11px;color:var(--o40);}
  .crm-match-rec{font-family:var(--fm);font-size:9px;letter-spacing:0.08em;padding:2px 6px;border-radius:2px;font-weight:600;}
  .crm-match-rec--strong-hire,.crm-match-rec--hire{background:rgba(22,163,74,0.1);color:#15803d;border:1px solid rgba(22,163,74,0.2);}
  .crm-match-rec--interview{background:var(--o08);color:var(--o);border:1px solid var(--o20);}
  .crm-match-rec--maybe{background:rgba(234,179,8,0.1);color:#a16207;border:1px solid rgba(234,179,8,0.2);}
  .crm-match-rec--pass{background:rgba(239,68,68,0.08);color:#dc2626;border:1px solid rgba(239,68,68,0.15);}
  .crm-match-explanation{font-size:12px;color:rgba(10,31,51,0.65);line-height:1.55;margin:0 0 6px;}
  .crm-match-tags-row{display:flex;flex-wrap:wrap;gap:4px;}
  .crm-match-tag{font-family:var(--fm);font-size:10px;padding:2px 7px;border-radius:2px;letter-spacing:0.03em;}
  .crm-match-tag--strength{background:rgba(22,163,74,0.08);color:#15803d;border:1px solid rgba(22,163,74,0.15);}
  .crm-match-tag--gap{background:rgba(239,68,68,0.06);color:#dc2626;border:1px solid rgba(239,68,68,0.12);}
  .crm-match-score-wrap{position:relative;width:44px;height:44px;flex-shrink:0;}
  .crm-match-score-ring{width:44px;height:44px;}
  .crm-match-score-num{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:var(--fm);font-size:11px;font-weight:600;color:var(--o);}
`;