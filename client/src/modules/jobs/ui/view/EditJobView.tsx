// app/company/jobs/[jobId]/edit/_views/edit-job-view.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { 
  ArrowLeft, Check, ChevronDown, Zap, Search, Sparkles, Brain, 
  ChevronUp, Mail, User, MapPin, Briefcase, Clock
} from "lucide-react";
import { CommandSelect } from "@/components/command-select";
import { GeneratedAvatar } from "@/components/generated-avatar";

// ─── Types ────────────────────────────────────────────────────────────────────

type JobFormValues = {
  title:               string;
  description:       string;
  location:          string;
  employmentType:    "full_time" | "part_time" | "contract" | "internship" | "temporary";
  workplaceType:     "on_site" | "remote" | "hybrid";
  salaryMin:         string;
  salaryMax:         string;
  salaryCurrency:    string;
  tags:              string;
  autoCloseOnAccept: boolean;
  agentId:           string;
  autoOrchestrate:   boolean;
  applicationDeadline: string; // ISO date string or empty
  topCandidateLimit:   string; // number as string
};

const EMP_LABELS: Record<string, string> = {
  full_time: "Full-time", part_time: "Part-time", contract: "Contract",
  internship: "Internship", temporary: "Temporary",
};
const WP_LABELS: Record<string, string> = {
  on_site: "On-site", remote: "Remote", hybrid: "Hybrid",
};

// ─── View ─────────────────────────────────────────────────────────────────────

export function EditJobView({ jobId }: { jobId: string }) {
  const router      = useRouter();
  const trpc        = useTRPC();
  const queryClient = useQueryClient();

  const [saved,       setSaved]       = useState(false);
  const [feedback,    setFeedback]    = useState<string | null>(null);
  const [agentSearch, setAgentSearch] = useState("");

  // ── Data ─────────────────────────────────────────────────────────────────
  const { data: job } = useSuspenseQuery(
    trpc.jobs.getById.queryOptions({ jobId }),
  );

  const agents = useQuery(
    trpc.agents.getMany.queryOptions({ pageSize: 100, search: agentSearch }),
  );

  // ── Form ─────────────────────────────────────────────────────────────────
  const form = useForm<JobFormValues>({
    defaultValues: {
      title:             "",
      description:       "",
      location:          "",
      employmentType:    "full_time",
      workplaceType:     "hybrid",
      salaryMin:         "",
      salaryMax:         "",
      salaryCurrency:    "USD",
      tags:              "",
      autoCloseOnAccept: false,
      agentId:           "",
      autoOrchestrate:   false,
      applicationDeadline: "",
      topCandidateLimit:   "10",
    },
  });

  // Pre-fill when job data arrives
  useEffect(() => {
    if (!job) return;
    form.reset({
      title:             job.title             ?? "",
      description:       job.description       ?? "",
      location:          job.location          ?? "",
      employmentType:    (job.employmentType   ?? "full_time") as any,
      workplaceType:     (job.workplaceType    ?? "hybrid")    as any,
      salaryMin:         job.salaryMin  != null ? String(job.salaryMin)  : "",
      salaryMax:         job.salaryMax  != null ? String(job.salaryMax)  : "",
      salaryCurrency:    job.salaryCurrency ?? "USD",
      tags:              (job.tags ?? []).join(", "),
      autoCloseOnAccept: job.autoCloseOnAccept ?? false,
      agentId:           (job as any).agentId           ?? "",
      autoOrchestrate:   (job as any).autoOrchestrate   ?? false,
      applicationDeadline: (job as any).applicationDeadline ? new Date((job as any).applicationDeadline).toISOString().split('T')[0] : "",
      topCandidateLimit:   String((job as any).topCandidateLimit ?? 10),
    });
  }, [job]);

  const autoClose       = form.watch("autoCloseOnAccept");
  const autoOrchestrate = form.watch("autoOrchestrate");
  const selectedAgentId = form.watch("agentId");
  const selEmp          = form.watch("employmentType");
  const selWp           = form.watch("workplaceType");
  const currency        = form.watch("salaryCurrency") || "USD";

  // ── AI Matching State ───────────────────────────────────────────────────
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchData, setMatchData] = useState<any[] | null>(null);
  const [matchExpanded, setMatchExpanded] = useState(false);

  const matchCandidates = useMutation(
    trpc.jobs.matchCandidates.mutationOptions()
  );

  const handleMatch = async () => {
    setMatchLoading(true);
    setMatchExpanded(true);
    try {
      const res = await matchCandidates.mutateAsync({ jobId });
      setMatchData(res.matches);
    } catch (e: any) {
      setFeedback("Match failed: " + e.message);
    } finally {
      setMatchLoading(false);
    }
  };

  const handleAgentSelect = (val: string) => {
    form.setValue("agentId", val);
    if (!val) form.setValue("autoOrchestrate", false);
  };

  // ── Mutation ──────────────────────────────────────────────────────────────
  const updateJob = useMutation(
    trpc.jobs.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.jobs.getById.queryOptions({ jobId }));
        await queryClient.invalidateQueries(trpc.jobs.myJobs.queryOptions({ includeClosed: false }));
        await queryClient.invalidateQueries(trpc.jobs.myJobs.queryOptions({ includeClosed: true }));
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        setFeedback(null);
      },
      onError: (e) => setFeedback(e.message),
    }),
  );

  const autoFillJob = useMutation(
    trpc.jobs.autoFill.mutationOptions(),
  );

  async function onSubmit(values: JobFormValues) {
    setFeedback(null);
    updateJob.mutate({
      jobId:             jobId,
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
      agentId:           values.agentId || undefined,
      autoOrchestrate:   values.agentId ? values.autoOrchestrate : false,
      applicationDeadline: values.applicationDeadline ? new Date(values.applicationDeadline) : undefined,
      topCandidateLimit:   values.topCandidateLimit ? Number(values.topCandidateLimit) : 10,
    });
  }

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
      <div className="ej-root">

        {/* Header */}
        <div className="ej-header">
          <button className="ej-back-btn" onClick={() => router.push("/jobs")}>
            <ArrowLeft size={15} strokeWidth={1.5} className="mr-1.5 inline" />
            Back to listings
          </button>

          <div className="ej-header-body">
            <div>
              <p className="ej-eyebrow">Edit listing</p>
              <h1 className="ej-title">{job?.title ?? "…"}</h1>
              <p className="ej-sub">
                {job?.isActive
                  ? <><span className="ej-dot ej-dot--on" />Active — receiving applications</>
                  : <><span className="ej-dot ej-dot--off" />Closed</>
                }
                {(job as any)?.autoOrchestrate && (
                  <>
                    <span className="ej-sep">·</span>
                    <span className="ej-auto-chip">
                      <Zap size={10} className="inline mr-0.5" />Auto-interview on
                    </span>
                  </>
                )}
              </p>
            </div>

            <div className="ej-header-save">
              {saved && (
                <span className="ej-saved-badge">
                  <Check size={13} strokeWidth={2} className="mr-1 inline" />Saved
                </span>
              )}
              {feedback && <p className="ej-feedback">{feedback}</p>}
              <button 
                type="button" 
                className="ej-match-trigger-btn"
                onClick={handleMatch}
              >
                <Brain size={14} className="mr-2" />
                Pull from DB
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="ej-form">

          <EjSection num="01" title="The Role">
            <EjField 
              label="Job title" 
              required 
              error={form.formState.errors.title?.message}
              rightSlot={
                <button
                  type="button"
                  className="ej-ai-fill-btn"
                  onClick={async () => {
                    const title = form.getValues("title");
                    if (!title) {
                      setFeedback("Enter a job title first for AI auto-fill.");
                      return;
                    }
                    const promise = autoFillJob.mutateAsync({ 
                      title,
                      description: form.getValues("description"),
                      location: form.getValues("location")
                    });
                    setFeedback("AI is analyzing and drafting...");
                    try {
                      const data = await promise;
                      form.setValue("description", data.description);
                      form.setValue("location", data.location);
                      form.setValue("employmentType", data.employmentType);
                      form.setValue("workplaceType", data.workplaceType);
                      if (data.salaryMin) form.setValue("salaryMin", String(data.salaryMin));
                      if (data.salaryMax) form.setValue("salaryMax", String(data.salaryMax));
                      if (data.tags.length > 0) form.setValue("tags", data.tags.join(", "));
                      if (data.title) form.setValue("title", data.title);
                      setFeedback(null);
                      setSaved(true);
                      setTimeout(() => setSaved(false), 3000);
                    } catch (e: any) {
                      setFeedback("Auto-fill failed: " + e.message);
                    }
                  }}
                >
                  ✨ Smart AI-autofill
                </button>
              }
            >
              <input className="ej-input" placeholder="e.g. Senior Product Designer"
                {...form.register("title", { required: "Required." })} />
            </EjField>
            <EjField label="Description" required error={form.formState.errors.description?.message}>
              <textarea className="ej-input ej-textarea" rows={6}
                placeholder="Role overview, responsibilities, requirements..."
                {...form.register("description", { required: "Required." })} />
            </EjField>
          </EjSection>

          <EjSection num="02" title="Details">
            <EjField label="Location" required error={form.formState.errors.location?.message}>
              <input className="ej-input" placeholder="San Francisco, CA"
                {...form.register("location", { required: "Required." })} />
            </EjField>
            <EjField label="Employment type">
              <div className="ej-pills">
                {Object.entries(EMP_LABELS).map(([v, l]) => (
                  <button key={v} type="button"
                    className={`ej-pill ${selEmp === v ? "ej-pill--on" : ""}`}
                    onClick={() => form.setValue("employmentType", v as any)}>{l}</button>
                ))}
              </div>
            </EjField>
            <EjField label="Workplace type">
              <div className="ej-pills">
                {Object.entries(WP_LABELS).map(([v, l]) => (
                  <button key={v} type="button"
                    className={`ej-pill ${selWp === v ? "ej-pill--on" : ""}`}
                    onClick={() => form.setValue("workplaceType", v as any)}>{l}</button>
                ))}
              </div>
            </EjField>
          </EjSection>

          <EjSection num="03" title="Compensation">
            <div className="ej-grid-3">
              <EjField label={`Min (${currency})`}>
                <input className="ej-input" placeholder="80,000" inputMode="numeric" {...form.register("salaryMin")} />
              </EjField>
              <EjField label={`Max (${currency})`}>
                <input className="ej-input" placeholder="120,000" inputMode="numeric" {...form.register("salaryMax")} />
              </EjField>
              <EjField label="Currency">
                <input className="ej-input" placeholder="USD" maxLength={5} {...form.register("salaryCurrency")} />
              </EjField>
            </div>
          </EjSection>

          <EjSection num="04" title="Tags">
            <EjField label="Tags" hint="Comma-separated">
              <input className="ej-input" placeholder="typescript, react, saas" {...form.register("tags")} />
            </EjField>
          </EjSection>

          <EjSection num="05" title="Settings">
            <button type="button"
              className={`ej-toggle-card ${autoClose ? "ej-toggle-card--on" : ""}`}
              onClick={() => form.setValue("autoCloseOnAccept", !autoClose)}
            >
              <div>
                <p className="ej-toggle-name">Auto-close on first accept</p>
                <p className="ej-toggle-desc">
                  Closes listing and notifies all pending applicants when you accept someone.
                </p>
              </div>
              <div className={`ej-switch ej-switch--sm ${autoClose ? "ej-switch--on" : ""}`}>
                <span className="ej-switch-thumb" />
              </div>
            </button>
          </EjSection>

          {/* ── Section 06 — Automation ──────────────────────────────────── */}
          <EjSection num="06" title="Automation">
            <div className="ej-auto-section">

              {/* Info banner */}
              <div className="ej-auto-intro">
                <Zap size={15} className="ej-auto-intro-icon" />
                <p className="ej-auto-intro-text">
                  Assign an AI agent to automatically screen CVs and send
                  interview invitations to qualified candidates — no manual
                  review needed.
                </p>
              </div>

              {/* Agent picker */}
              <EjField label="AI interview agent">
                <CommandSelect
                  options={[
                    {
                      id: "__none__",
                      value: "__none__",
                      children: (
                        <span className="text-sm text-orange-300 italic">
                          No agent — manual review only
                        </span>
                      ),
                    },
                    ...agentOptions,
                  ]}
                  onSelect={(val) => handleAgentSelect(val === "__none__" ? "" : val)}
                  onSearch={setAgentSearch}
                  value={selectedAgentId || "__none__"}
                  placeholder="Select AI agent…"
                />
              </EjField>

              {/* Current agent indicator */}
              {selectedAgentId && (
                <div className="ej-agent-active-chip">
                  <Check size={12} strokeWidth={2} className="mr-1 inline text-orange-500" />
                  Agent assigned — new applications will use this agent for screening.
                </div>
              )}

              {/* Auto-orchestrate toggle */}
              <button
                type="button"
                disabled={!selectedAgentId}
                className={`ej-toggle-card ej-toggle-card--auto ${autoOrchestrate ? "ej-toggle-card--on" : ""} ${!selectedAgentId ? "ej-toggle-card--disabled" : ""}`}
                onClick={() => selectedAgentId && form.setValue("autoOrchestrate", !autoOrchestrate)}
              >
                <div>
                  <p className="ej-toggle-name">
                    <Zap size={13} className="inline mr-1" />
                    Full auto-orchestration
                  </p>
                  <p className="ej-toggle-desc">
                    {selectedAgentId
                      ? autoOrchestrate
                        ? "ON — CVs are analysed automatically. Candidates scoring Strong Hire / Hire / Interview receive a meeting link via email instantly."
                        : "OFF — Agent is assigned but screening is manual. Toggle on to fully automate."
                      : "Select an AI agent above to enable this option."
                    }
                  </p>
                </div>
                <div className={`ej-switch ej-switch--sm ${autoOrchestrate ? "ej-switch--on" : ""}`}>
                  <span className="ej-switch-thumb" />
                </div>
              </button>

              {/* Warning: existing applications won't be retroactively processed */}
              {autoOrchestrate && (selectedAgentId !== ((job as any)?.agentId ?? "") || !((job as any)?.autoOrchestrate)) && (
                <div className="ej-auto-warn">
                  ⚠ Auto-orchestration applies to <strong>new submissions only</strong>.
                  Existing applications will not be retroactively processed.
                  Use the "Run AI screening" button in the Attendees view to
                  process them individually.
                </div>
              )}

              {/* Turned off warning */}
              {!autoOrchestrate && (job as any)?.autoOrchestrate && (
                <div className="ej-auto-warn ej-auto-warn--off">
                  Auto-orchestration will be <strong>disabled</strong> after saving.
                  In-flight pipelines for already-submitted CVs will still complete.
                </div>
              )}

              {/* 🆕 Deadline and Limit */}
              <div className="ej-grid-2">
                <EjField label="Application Deadline" hint="Auto-trigger invites after this date">
                  <input type="date" className="ej-input" {...form.register("applicationDeadline")} />
                </EjField>
                <EjField label="Top-N Candidates" hint="Limit for auto-invitations">
                  <input type="number" className="ej-input" placeholder="10" {...form.register("topCandidateLimit")} />
                </EjField>
              </div>
            </div>
          </EjSection>

          {/* Submit */}
          <div className="ej-submit-row">
            <button type="button" className="ej-cancel-btn"
              onClick={() => router.push("/jobs")}>
              Cancel
            </button>
            <button type="submit" className="ej-submit-btn" disabled={updateJob.isPending}>
              {updateJob.isPending
                ? <><span className="ej-spinner" />Saving…</>
                : saved
                  ? <><Check size={14} strokeWidth={2} className="mr-1.5 inline" />Saved!</>
                  : "Save changes →"
              }
            </button>
          </div>
        </form>

        {/* ── AI Match Results Panel ──────────────────────────────────── */}
        {matchExpanded && (
          <div className="ej-match-panel">
            <div className="ej-match-head">
              <div className="flex items-center gap-2">
                <Brain size={16} className="text-orange-500" />
                <h3 className="ej-match-title">Database Matches</h3>
                {matchData && <span className="ej-match-count">{matchData.length} found</span>}
              </div>
              <button className="ej-match-close" onClick={() => setMatchExpanded(false)}>
                <ChevronDown size={18} />
              </button>
            </div>

            <div className="ej-match-body">
              {matchLoading ? (
                <div className="ej-match-loading">
                  <div className="ej-match-spinner" />
                  Searching global database for candidates...
                </div>
              ) : matchData && matchData.length === 0 ? (
                <div className="ej-match-empty">No matching candidates found in database.</div>
              ) : (
                <div className="ej-match-list">
                  {matchData?.map((m, idx) => (
                    <div key={m.applicationId} className="ej-match-card">
                      <div className="ej-match-card-top">
                        <div className="flex items-center gap-3">
                          <span className="ej-match-rank">#{idx + 1}</span>
                          <span className="ej-match-name">{m.candidateName}</span>
                          <span className={`ej-match-rec ej-match-rec--${m.recommendation.toLowerCase().replace(" ", "-")}`}>
                            {m.recommendation}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="ej-match-score">{m.score}%</span>
                          <button 
                            className="ej-match-view-btn"
                            onClick={() => router.push(`/attendees?jobId=${jobId}&applicationId=${m.applicationId}`)}
                          >
                            View
                          </button>
                        </div>
                      </div>
                      
                      <p className="ej-match-exp-text">{m.explanation}</p>
                      
                      <div className="ej-match-meta">
                        {m.currentRole && <span className="ej-match-meta-item"><Briefcase size={12} />{m.currentRole}</span>}
                        {m.location && <span className="ej-match-meta-item"><MapPin size={12} />{m.location}</span>}
                        {m.experienceYears && <span className="ej-match-meta-item"><Clock size={12} />{m.experienceYears} yrs</span>}
                      </div>

                      <div className="ej-match-tags">
                        {m.strengths?.slice(0, 3).map((s: string) => (
                          <span key={s} className="ej-match-tag ej-match-tag--plus">✓ {s}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EjSection({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div className="ej-section">
      <div className="ej-section-head">
        <span className="ej-section-num">{num}</span>
        <span className="ej-section-title">{title}</span>
      </div>
      <div className="ej-section-body">{children}</div>
    </div>
  );
}

function EjField({ label, error, hint, required, rightSlot, children }: {
  label: string; error?: string; hint?: string; required?: boolean; rightSlot?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="ej-field">
      <div className="flex items-center justify-between">
        <label className="ej-label">
          {label}{required && <span className="ej-req"> *</span>}
        </label>
        {rightSlot}
      </div>
      {children}
      {hint  && !error && <p className="ej-hint">{hint}</p>}
      {error && <p className="ej-err">{error}</p>}
    </div>
  );
}

// ─── CSS ──────────────────────────────────────────────────────────────────────

const css = `
  .ej-root {
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
    max-width: 640px;
    margin: 0 auto;
    padding: 40px 24px 100px;
    font-family: var(--fb);
    color: var(--o);
    background: linear-gradient(to bottom, #fff, var(--o05));
  }
  .ej-ai-fill-btn { background:none; border:none; font-family:var(--fm); font-size:10px; color:var(--o); cursor:pointer; padding:0; letter-spacing:0.04em; text-transform:uppercase; transition:opacity 0.1s; }
  .ej-ai-fill-btn:hover { opacity:0.7; }
  .ej-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  /* Header */
  .ej-back-btn { background:none; border:none; font-family:var(--fb); font-size:12px; color:var(--o40); cursor:pointer; padding:0; margin-bottom:28px; display:inline-flex; align-items:center; transition:color 0.12s; }
  .ej-back-btn:hover { color:var(--o); }
  .ej-header { margin-bottom:36px; }
  .ej-header-body { display:flex; align-items:flex-start; justify-content:space-between; gap:20px; }
  .ej-eyebrow { font-family:var(--fm); font-size:11px; color:var(--o30); letter-spacing:0.14em; text-transform:uppercase; margin:0 0 8px; }
  .ej-title { font-family:var(--fd); font-size:clamp(24px,4vw,38px); font-weight:400; letter-spacing:-0.02em; margin:0 0 8px; }
  .ej-sub { font-size:13px; color:var(--o40); margin:0; display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
  .ej-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; display:inline-block; }
  .ej-dot--on  { background:var(--o); }
  .ej-dot--off { background:var(--o20); }
  .ej-sep { color:var(--o20); }
  .ej-auto-chip { background:var(--o08); border:1px solid var(--o20); border-radius:2px; padding:1px 8px; font-family:var(--fm); font-size:10px; color:var(--o); letter-spacing:0.04em; }
  .ej-header-save { text-align:right; min-width:100px; }
  .ej-saved-badge { display:inline-flex; align-items:center; background:var(--o08); border:1px solid var(--o20); border-radius:2px; padding:4px 12px; font-family:var(--fm); font-size:11px; color:var(--o); letter-spacing:0.06em; animation:ej-pop 0.2s ease; }
  @keyframes ej-pop { from{transform:scale(0.9);opacity:0} to{transform:scale(1);opacity:1} }
  .ej-feedback { font-size:12px; color:var(--o); font-style:italic; margin:6px 0 0; }
  /* Form */
  .ej-form { display:flex; flex-direction:column; }
  .ej-section { padding-bottom:28px; margin-bottom:28px; border-bottom:1px solid var(--o08); }
  .ej-section:last-of-type { border-bottom:none; }
  .ej-section-head { display:flex; align-items:baseline; gap:12px; margin-bottom:18px; }
  .ej-section-num { font-family:var(--fm); font-size:10px; color:var(--o20); letter-spacing:0.08em; }
  .ej-section-title { font-size:14px; font-weight:600; color:var(--o); }
  .ej-section-body { display:flex; flex-direction:column; gap:16px; }
  .ej-field { display:flex; flex-direction:column; gap:6px; }
  .ej-label { font-size:11px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:var(--o); }
  .ej-req { color:var(--o); }
  .ej-hint { font-size:11px; color:var(--o30); margin:0; }
  .ej-err  { font-size:11px; color:var(--o); font-weight:600; margin:0; }
  .ej-input { width:100%; height:42px; padding:0 13px; background:#fff; border:1px solid var(--o20); border-radius:2px; font-family:var(--fb); font-size:13px; color:var(--o); outline:none; box-sizing:border-box; transition:border-color 0.12s,box-shadow 0.12s; }
  .ej-input::placeholder { color:var(--o30); }
  .ej-input:focus { border-color:var(--o); box-shadow:0 0 0 3px var(--o08); }
  .ej-textarea { height:auto; padding:10px 13px; resize:vertical; line-height:1.6; }
  .ej-grid-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; }
  .ej-pills { display:flex; flex-wrap:wrap; gap:6px; }
  .ej-pill { height:30px; padding:0 13px; border:1px solid var(--o20); border-radius:2px; background:#fff; font-family:var(--fb); font-size:12px; font-weight:500; color:var(--o40); cursor:pointer; transition:all 0.1s; }
  .ej-pill:hover { border-color:var(--o); color:var(--o); }
  .ej-pill--on { background:var(--o); border-color:var(--o); color:#fff; }
  .ej-toggle-card { display:flex; align-items:flex-start; justify-content:space-between; gap:20px; padding:16px; border:1px solid var(--o20); border-radius:2px; background:#fff; cursor:pointer; text-align:left; transition:all 0.12s; width:100%; }
  .ej-toggle-card:hover:not(.ej-toggle-card--disabled) { border-color:var(--o); box-shadow:0 2px 8px var(--o08); }
  .ej-toggle-card--on { border-color:var(--o); background:var(--o05); }
  .ej-toggle-card--disabled { opacity:0.4; cursor:not-allowed; }
  .ej-toggle-card--auto { border-style:dashed; }
  .ej-toggle-card--auto.ej-toggle-card--on { border-style:solid; background:var(--o08); }
  .ej-toggle-name { font-size:13px; font-weight:600; color:var(--o); margin-bottom:3px; }
  .ej-toggle-desc { font-size:11px; color:var(--o40); line-height:1.5; }
  .ej-switch { width:40px; height:22px; border:1px solid var(--o20); border-radius:11px; background:#fff; position:relative; flex-shrink:0; transition:all 0.2s; margin-top:2px; pointer-events:none; }
  .ej-switch--on { background:var(--o); border-color:var(--o); }
  .ej-switch-thumb { position:absolute; top:3px; left:3px; width:14px; height:14px; border-radius:50%; background:var(--o20); transition:transform 0.2s,background 0.2s; display:block; }
  .ej-switch--on .ej-switch-thumb { transform:translateX(18px); background:#fff; }
  .ej-switch--sm { width:36px; height:20px; }
  .ej-switch--sm .ej-switch-thumb { width:12px; height:12px; }
  .ej-switch--sm.ej-switch--on .ej-switch-thumb { transform:translateX(16px); }
  /* Automation extras */
  .ej-auto-section { display:flex; flex-direction:column; gap:14px; }
  .ej-auto-intro { display:flex; align-items:flex-start; gap:10px; padding:12px 14px; background:var(--o05); border:1px solid var(--o12); border-radius:2px; }
  .ej-auto-intro-icon { color:var(--o); flex-shrink:0; margin-top:1px; }
  .ej-auto-intro-text { font-size:12px; color:var(--o40); line-height:1.6; margin:0; }
  .ej-agent-active-chip { font-size:12px; color:var(--o); background:var(--o05); border:1px solid var(--o12); border-radius:2px; padding:7px 12px; }
  .ej-auto-warn { font-size:12px; color:var(--o40); background:rgba(255,200,100,0.08); border:1px solid rgba(255,180,0,0.2); border-radius:2px; padding:10px 14px; line-height:1.6; }
  .ej-auto-warn--off { background:rgba(200,60,0,0.04); border-color:rgba(200,60,0,0.2); }
  /* Submit row */
  .ej-submit-row { display:flex; align-items:center; justify-content:flex-end; gap:12px; padding-top:20px; border-top:1px solid var(--o08); position:sticky; bottom:0; background:#fff; padding-bottom:4px; }
  .ej-cancel-btn { height:44px; padding:0 22px; border:1px solid var(--o20); border-radius:2px; background:#fff; font-family:var(--fb); font-size:12px; font-weight:500; color:var(--o40); cursor:pointer; transition:all 0.12s; }
  .ej-cancel-btn:hover { border-color:var(--o); color:var(--o); }
  .ej-submit-btn { height:44px; padding:0 28px; background:var(--o); color:#fff; border:1px solid var(--o); border-radius:2px; font-family:var(--fb); font-size:12px; font-weight:600; letter-spacing:0.07em; text-transform:uppercase; cursor:pointer; display:inline-flex; align-items:center; transition:all 0.12s; }
  .ej-submit-btn:hover:not(:disabled) { background:#fff; color:var(--o); }
  .ej-submit-btn:disabled { opacity:0.5; cursor:not-allowed; }
  .ej-spinner { width:14px; height:14px; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:ej-spin 0.6s linear infinite; margin-right:8px; }
  @keyframes ej-spin { to{transform:rotate(360deg)} }
  @media(max-width:600px) {
    .ej-root { padding:24px 16px 80px; }
    .ej-grid-3 { grid-template-columns:1fr 1fr; }
    .ej-header-body { flex-direction:column; gap:12px; }
  }
    font-size:12px; font-weight:700; color:var(--o); background:#fff;
    border:1px solid var(--o20); border-radius:12px; height:42px; padding:0 18px;
    cursor:pointer; transition:all 0.2s; display:flex; align-items:center;
    box-shadow:0 2px 8px var(--o10); margin-top:8px;
  }
  .ej-match-trigger-btn:hover { background:var(--o); color:#fff; box-shadow:0 4px 12px var(--o20); transform:translateY(-1px); }

  /* Match Panel */
  .ej-match-panel { margin-top:40px; background:#fff; border-radius:20px; border:1px solid var(--g200); overflow:hidden; box-shadow:0 12px 48px rgba(0,0,0,0.08); }
  .ej-match-head { padding:20px 24px; background:linear-gradient(to right, var(--g50), #fff); border-bottom:1px solid var(--g100); display:flex; align-items:center; justify-content:space-between; }
  .ej-match-title { font-family:var(--fd); font-size:18px; color:var(--g900); margin:0; }
  .ej-match-count { font-size:11px; background:var(--o10); color:var(--o); padding:2px 8px; border-radius:99px; font-weight:600; }
  .ej-match-close { background:none; border:none; color:var(--g700); cursor:pointer; opacity:0.5; transition:opacity 0.2s; }
  .ej-match-close:hover { opacity:1; }
  .ej-match-body { padding:24px; max-height:600px; overflow-y:auto; }
  .ej-match-loading { padding:60px 0; text-align:center; color:var(--g700); font-size:14px; display:flex; flex-direction:column; align-items:center; gap:16px; }
  .ej-match-spinner { width:30px; height:30px; border:3px solid var(--o10); border-top-color:var(--o); border-radius:50%; animation:ej-spin 0.8s linear infinite; }
  @keyframes ej-spin { to { transform:rotate(360deg); } }
  .ej-match-empty { padding:60px 0; text-align:center; color:var(--g700); font-style:italic; }
  .ej-match-card { padding:20px; border-radius:14px; border:1px solid var(--g100); margin-bottom:16px; transition:transform 0.2s, border-color 0.2s; }
  .ej-match-card:hover { border-color:var(--o30); transform:translateX(4px); }
  .ej-match-card-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
  .ej-match-rank { font-family:var(--fm); font-size:12px; color:var(--o30); }
  .ej-match-name { font-weight:700; font-size:15px; color:var(--g900); }
  .ej-match-score { font-family:var(--fm); font-size:14px; font-weight:700; color:var(--o); }
  .ej-match-view-btn { font-size:11px; font-weight:700; color:var(--o); background:#fff; border:1px solid var(--o20); border-radius:6px; padding:4px 10px; cursor:pointer; transition:all 0.2s; }
  .ej-match-view-btn:hover { background:var(--o); color:#fff; border-color:var(--o); }
  .ej-match-rec { font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.05em; padding:2px 8px; border-radius:4px; }
  .ej-match-rec--strong-hire { background:#dcfce7; color:#166534; }
  .ej-match-rec--hire        { background:#f0fdf4; color:#15803d; }
  .ej-match-rec--interview   { background:#fefce8; color:#854d0e; }
  .ej-match-rec--maybe       { background:#f9fafb; color:#4b5563; }
  .ej-match-rec--pass        { background:#fef2f2; color:#991b1b; }
  .ej-match-exp-text { font-size:13px; color:var(--g700); line-height:1.6; margin:0 0 14px; }
  .ej-match-meta { display:flex; flex-wrap:wrap; gap:16px; margin-bottom:12px; }
  .ej-match-meta-item { display:flex; align-items:center; gap:6px; font-size:11px; color:var(--g700); opacity:0.7; }
  .ej-match-tags { display:flex; flex-wrap:wrap; gap:6px; }
  .ej-match-tag { font-size:10px; font-weight:600; padding:2px 8px; border-radius:99px; }
  .ej-match-tag--plus { background:var(--o10); color:var(--o); }

  @media (max-width: 640px) {
    .ej-header-body { flex-direction:column; align-items:flex-start; gap:20px; }
    .ej-match-trigger-btn { width:100%; justify-content:center; }
  }
`;