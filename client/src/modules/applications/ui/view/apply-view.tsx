// app/apply/[jobId]/_views/apply-view.tsx  ← PUBLIC CLIENT COMPONENT
"use client";

import { useState, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useTRPC } from "@/trpc/client";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import {
  User, Mail, Phone, MapPin, Briefcase, Award,
  Linkedin, Globe, Target, Lightbulb, Code, BookOpen,
  FileText, CheckCircle2, AlertCircle, Plus, Trash2, Upload, X,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type EducationEntry = {
  institution:    string;
  degree:         string;
  field:          string;
  graduationYear: string;
};

type FormValues = {
  fullName:       string;
  email:          string;
  phone:          string;
  locationCity:   string;
  currentRole:    string;
  experienceYears: "0-1" | "1-3" | "3-5" | "5-10" | "10+";
  linkedin:       string;
  portfolio:      string;
  motivation:     string;
  skills:         string;
  education:      EducationEntry[];
  terms:          boolean;
};

const EMPTY_EDUCATION: EducationEntry = {
  institution: "", degree: "", field: "", graduationYear: "",
};

const EXP_OPTIONS = [
  { value: "0-1",  label: "0–1 years"  },
  { value: "1-3",  label: "1–3 years"  },
  { value: "3-5",  label: "3–5 years"  },
  { value: "5-10", label: "5–10 years" },
  { value: "10+",  label: "10+ years"  },
] as const;

// ─── File uploader hook ───────────────────────────────────────────────────────

function useFileUpload() {
  const [file,       setFile]       = useState<File | null>(null);
  const [uploading,  setUploading]  = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error,      setError]      = useState<string | null>(null);
  const [dragOver,   setDragOver]   = useState(false);

  const upload = useCallback(async (f: File): Promise<string | null> => {
    setFile(f);
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Upload failed");
      }
      const { url } = await res.json();
      setUploadedUrl(url);
      return url;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  const clear = () => { setFile(null); setUploadedUrl(null); setError(null); };

  return { file, uploading, uploadedUrl, error, dragOver, setDragOver, upload, clear };
}

// ─── FileDropZone component ───────────────────────────────────────────────────

function FileDropZone({
  label, required, uploader,
}: {
  label: string; required?: boolean; uploader: ReturnType<typeof useFileUpload>;
}) {
  const { file, uploading, uploadedUrl, error, dragOver, setDragOver, upload, clear } = uploader;

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) await upload(f);
  };

  return (
    <div className="az-field">
      <label className="az-label">{label}{required && <span className="az-req"> *</span>}</label>
      {uploadedUrl ? (
        <div className="az-file-done">
          <CheckCircle2 size={16} className="az-file-done-icon" />
          <span className="az-file-done-name">{file?.name}</span>
          <button type="button" className="az-file-clear" onClick={clear}><X size={14} /></button>
        </div>
      ) : (
        <label
          className={`az-dropzone ${dragOver ? "az-dropzone--over" : ""} ${uploading ? "az-dropzone--uploading" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            className="az-dropzone-input"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }}
          />
          <div className="az-dropzone-inner">
            {uploading ? (
              <div className="az-dropzone-spin" />
            ) : (
              <Upload size={22} className="az-dropzone-icon" />
            )}
            <p className="az-dropzone-text">
              {uploading ? "Uploading…" : "Drop your file here or click to browse"}
            </p>
            <p className="az-dropzone-hint">PDF or Word · max 10 MB</p>
          </div>
        </label>
      )}
      {error && <p className="az-err">{error}</p>}
    </div>
  );
}

// ─── Apply view ───────────────────────────────────────────────────────────────

export function ApplyView({ jobId }: { jobId: string }) {
  const trpc = useTRPC();

  const { data: job } = useSuspenseQuery(trpc.jobs.getById.queryOptions({ jobId }));

  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg,     setErrorMsg]     = useState("");
  const [appId,        setAppId]        = useState("");

  const cvUploader  = useFileUpload();
  const clUploader  = useFileUpload(); // cover letter

  const submitApplication = useMutation(
    trpc.applications.submit.mutationOptions({
      onSuccess: (data) => {
        setAppId(data.applicationId);
        setSubmitStatus("success");
        window.scrollTo({ top: 0, behavior: "smooth" });
      },
      onError: (e) => {
        setErrorMsg(e.message);
        setSubmitStatus("error");
        window.scrollTo({ top: 0, behavior: "smooth" });
      },
    }),
  );

  const form = useForm<FormValues>({
    defaultValues: {
      fullName: "", email: "", phone: "", locationCity: "",
      currentRole: "", experienceYears: "1-3", linkedin: "", portfolio: "",
      motivation: "", skills: "", education: [], terms: false,
    },
  });

  const { fields: eduFields, append: eduAppend, remove: eduRemove } = useFieldArray({
    control: form.control,
    name: "education",
  });

  const isSubmitting = submitApplication.isPending;

  async function onSubmit(values: FormValues) {
    setErrorMsg("");
    setSubmitStatus("idle");

    if (!cvUploader.uploadedUrl) {
      setErrorMsg("Please upload your CV before submitting.");
      setSubmitStatus("error");
      return;
    }
    if (!values.terms) {
      setErrorMsg("You must accept the terms and conditions.");
      setSubmitStatus("error");
      return;
    }

    await submitApplication.mutateAsync({
      jobId,
      fullName:       values.fullName.trim(),
      email:          values.email.trim(),
      phone:          values.phone.trim() || undefined,
      locationCity:   values.locationCity.trim(),
      currentRole:    values.currentRole.trim(),
      experienceYears: values.experienceYears,
      linkedin:       values.linkedin.trim() || undefined,
      portfolio:      values.portfolio.trim() || undefined,
      motivation:     values.motivation.trim(),
      skills:         values.skills.trim(),
      education:      values.education.filter((e) => e.institution.trim()),
      cvUrl:          cvUploader.uploadedUrl!,
      coverLetterUrl: clUploader.uploadedUrl || undefined,
      termsAccepted:  true,
    });
  }

  const isActive = job.isActive;

  return (
    <>
      <style>{css}</style>
      <div className="az-root">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="az-header">
          <div className="az-header-inner">
            <div className="az-brand">
              <span className="az-brand-name">{process.env.NEXT_PUBLIC_APP_NAME ?? "Hiring"}</span>
              <span className="az-brand-badge">Now Hiring</span>
            </div>
          </div>
        </header>

        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <div className="az-hero">
          <div className="az-hero-inner">
            <p className="az-hero-eyebrow">Open Position</p>
            <h1 className="az-hero-title">{job.title}</h1>
            <div className="az-hero-meta">
              {job.location && (
                <span className="az-hero-chip">
                  <MapPin size={12} className="inline mr-1" />{job.location}
                </span>
              )}
              <span className="az-hero-chip">{WP_MAP[job.workplaceType] ?? job.workplaceType}</span>
              <span className="az-hero-chip">{EMP_MAP[job.employmentType] ?? job.employmentType}</span>
              {!isActive && <span className="az-hero-chip az-hero-chip--closed">Closed</span>}
            </div>
            {!isActive && (
              <p className="az-hero-closed-msg">
                This position is no longer accepting applications.
              </p>
            )}
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="az-body">

          {/* Status banners */}
          {submitStatus === "success" && (
            <div className="az-banner az-banner--success">
              <CheckCircle2 size={20} className="az-banner-icon" />
              <div>
                <p className="az-banner-title">Application submitted!</p>
                <p className="az-banner-msg">
                  We'll review your application and get back to you. Your reference ID:{" "}
                  <code className="az-banner-code">{appId}</code>
                </p>
              </div>
            </div>
          )}
          {submitStatus === "error" && (
            <div className="az-banner az-banner--error">
              <AlertCircle size={20} className="az-banner-icon" />
              <div>
                <p className="az-banner-title">Couldn't submit</p>
                <p className="az-banner-msg">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Form */}
          {isActive && submitStatus !== "success" && (
            <div className="az-card">
              <form onSubmit={form.handleSubmit(onSubmit)} noValidate>

                {/* ── 01 Personal information ──────────────────────────── */}
                <AzSection icon={<User size={18} />} title="Personal Information" num="01">
                  <div className="az-grid-2">
                    <AzField label="Full name" required error={form.formState.errors.fullName?.message}>
                      <AzInput icon={<User size={16} />} placeholder="Jane Doe"
                        {...form.register("fullName", { required: "Required." })} />
                    </AzField>
                    <AzField label="Email address" required error={form.formState.errors.email?.message}>
                      <AzInput icon={<Mail size={16} />} type="email" placeholder="jane@example.com"
                        {...form.register("email", { required: "Required.", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email." } })} />
                    </AzField>
                    <AzField label="Phone number" error={form.formState.errors.phone?.message}>
                      <AzInput icon={<Phone size={16} />} type="tel" placeholder="+1 (555) 000-0000"
                        {...form.register("phone")} />
                    </AzField>
                    <AzField label="Location" required error={form.formState.errors.locationCity?.message}>
                      <AzInput icon={<MapPin size={16} />} placeholder="City, Country"
                        {...form.register("locationCity", { required: "Required." })} />
                    </AzField>
                  </div>
                </AzSection>

                {/* ── 02 Professional background ───────────────────────── */}
                <AzSection icon={<Briefcase size={18} />} title="Professional Background" num="02">
                  <div className="az-grid-2">
                    <AzField label="Current role / title" required error={form.formState.errors.currentRole?.message}>
                      <AzInput icon={<Award size={16} />} placeholder="Senior Software Engineer"
                        {...form.register("currentRole", { required: "Required." })} />
                    </AzField>
                    <AzField label="Years of experience" required>
                      <select className="az-select"
                        {...form.register("experienceYears", { required: true })}>
                        {EXP_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </AzField>
                    <AzField label="LinkedIn profile" error={form.formState.errors.linkedin?.message}>
                      <AzInput icon={<Linkedin size={16} />} type="url" placeholder="https://linkedin.com/in/you"
                        {...form.register("linkedin", {
                          validate: (v) => !v || /^https?:\/\//.test(v) || "Must start with https://",
                        })} />
                    </AzField>
                    <AzField label="Portfolio / website" error={form.formState.errors.portfolio?.message}>
                      <AzInput icon={<Globe size={16} />} type="url" placeholder="https://yourportfolio.com"
                        {...form.register("portfolio", {
                          validate: (v) => !v || /^https?:\/\//.test(v) || "Must start with https://",
                        })} />
                    </AzField>
                  </div>
                </AzSection>

                {/* ── 03 Education ─────────────────────────────────────── */}
                <AzSection icon={<BookOpen size={18} />} title="Education" num="03">
                  {eduFields.length === 0 && (
                    <p className="az-edu-empty">No education entries yet. Add one below.</p>
                  )}
                  {eduFields.map((field, i) => (
                    <div key={field.id} className="az-edu-entry">
                      <div className="az-edu-entry-header">
                        <span className="az-edu-entry-num">#{i + 1}</span>
                        <button type="button" className="az-edu-remove" onClick={() => eduRemove(i)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="az-grid-2">
                        <AzField label="Institution">
                          <input className="az-input" placeholder="MIT, Stanford…"
                            {...form.register(`education.${i}.institution`)} />
                        </AzField>
                        <AzField label="Degree">
                          <input className="az-input" placeholder="Bachelor's, Master's…"
                            {...form.register(`education.${i}.degree`)} />
                        </AzField>
                        <AzField label="Field of study">
                          <input className="az-input" placeholder="Computer Science"
                            {...form.register(`education.${i}.field`)} />
                        </AzField>
                        <AzField label="Graduation year">
                          <input className="az-input" placeholder="2022"
                            {...form.register(`education.${i}.graduationYear`)} />
                        </AzField>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="az-edu-add"
                    onClick={() => eduAppend({ ...EMPTY_EDUCATION })}
                  >
                    <Plus size={15} className="mr-2" /> Add education
                  </button>
                </AzSection>

                {/* ── 04 Application details ────────────────────────────── */}
                <AzSection icon={<Target size={18} />} title="Application Details" num="04">
                  <AzField
                    label="Why this role?"
                    required
                    hint="Tell us what excites you about this position"
                    error={form.formState.errors.motivation?.message}
                  >
                    <div className="az-icon-textarea-wrap">
                      <Lightbulb size={15} className="az-textarea-icon" />
                      <textarea
                        className="az-textarea az-textarea--icon"
                        rows={5}
                        placeholder="I'm excited about this opportunity because…"
                        {...form.register("motivation", {
                          required: "Required.",
                          minLength: { value: 30, message: "Please write at least a few sentences." },
                        })}
                      />
                    </div>
                  </AzField>
                  <AzField
                    label="Key skills & technologies"
                    required
                    hint="List your main skills, tools, and areas of expertise"
                    error={form.formState.errors.skills?.message}
                  >
                    <div className="az-icon-textarea-wrap">
                      <Code size={15} className="az-textarea-icon" />
                      <textarea
                        className="az-textarea az-textarea--icon"
                        rows={4}
                        placeholder="React, TypeScript, Node.js, PostgreSQL, system design…"
                        {...form.register("skills", {
                          required: "Required.",
                          minLength: { value: 10, message: "Please list at least a few skills." },
                        })}
                      />
                    </div>
                  </AzField>
                </AzSection>

                {/* ── 05 Documents ─────────────────────────────────────── */}
                <AzSection icon={<FileText size={18} />} title="Documents" num="05" alt>
                  <FileDropZone label="Resume / CV" required uploader={cvUploader} />
                  <FileDropZone label="Cover letter (optional)" uploader={clUploader} />
                </AzSection>

                {/* ── Terms & submit ────────────────────────────────────── */}
                <div className="az-terms-section">
                  <label className="az-terms-label">
                    <input
                      type="checkbox"
                      className="az-checkbox"
                      {...form.register("terms", { required: "You must accept to submit." })}
                    />
                    <span>
                      I agree to the processing of my personal data for recruitment purposes and
                      consent to this platform storing my application.
                      <span className="az-req"> *</span>
                    </span>
                  </label>
                  {form.formState.errors.terms && (
                    <p className="az-err az-err--terms">{form.formState.errors.terms.message}</p>
                  )}

                  <button type="submit" disabled={isSubmitting} className="az-submit-btn">
                    {isSubmitting ? (
                      <span className="az-submit-spin-row">
                        <span className="az-submit-spin" />
                        Submitting…
                      </span>
                    ) : "Submit Application →"}
                  </button>
                  <p className="az-submit-note">
                    We review every application and aim to respond within 5 business days.
                  </p>
                </div>

              </form>
            </div>
          )}

        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <footer className="az-footer">
          <p>{process.env.NEXT_PUBLIC_APP_NAME ?? "Platform"} · Powered by an AI interview platform</p>
        </footer>

      </div>
    </>
  );
}

// ─── Small sub-components ─────────────────────────────────────────────────────

function AzSection({ icon, title, num, alt = false, children }: {
  icon: React.ReactNode; title: string; num: string; alt?: boolean; children: React.ReactNode;
}) {
  return (
    <div className={`az-section ${alt ? "az-section--alt" : ""}`}>
      <div className="az-section-head">
        <div className="az-section-icon">{icon}</div>
        <div>
          <p className="az-section-num">Section {num}</p>
          <h2 className="az-section-title">{title}</h2>
        </div>
      </div>
      <div className="az-section-body">{children}</div>
    </div>
  );
}

function AzField({ label, required, hint, error, children }: {
  label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="az-field">
      <label className="az-field-label">{label}{required && <span className="az-req"> *</span>}</label>
      {children}
      {hint && !error && <p className="az-field-hint">{hint}</p>}
      {error && <p className="az-err">{error}</p>}
    </div>
  );
}

const AzInput = ({ icon, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode }) => (
  <div className="az-input-wrap">
    {icon && <span className="az-input-icon">{icon}</span>}
    <input className={`az-input ${icon ? "az-input--icon" : ""}`} {...props} />
  </div>
);

// ─── Maps ─────────────────────────────────────────────────────────────────────

const WP_MAP: Record<string, string>  = { on_site: "On-site", remote: "Remote", hybrid: "Hybrid" };
const EMP_MAP: Record<string, string> = {
  full_time: "Full-time", part_time: "Part-time", contract: "Contract",
  internship: "Internship", temporary: "Temporary",
};

// ─── CSS ──────────────────────────────────────────────────────────────────────

const css = `
  .az-root {
    --o:    #FF6A00;
    --o10:  rgba(255,106,0,0.10);
    --o20:  rgba(255,106,0,0.20);
    --o30:  rgba(255,106,0,0.30);
    --g50:  #f9fafb;
    --g100: #f3f4f6;
    --g200: #e5e7eb;
    --g700: #374151;
    --g900: #111827;
    --fd: 'DM Serif Display', Georgia, serif;
    --fb: 'DM Sans', system-ui, sans-serif;
    --fm: 'DM Mono', monospace;
    min-height:100vh; background:var(--g50); font-family:var(--fb); color:var(--g900);
  }

  /* Header */
  .az-header { background:#fff; border-bottom:1px solid var(--g200); position:sticky; top:0; z-index:50; }
  .az-header-inner { max-width:960px; margin:0 auto; padding:16px 24px; display:flex; justify-content:space-between; align-items:center; }
  .az-brand { display:flex; align-items:center; gap:12px; }
  .az-brand-name { font-family:var(--fd); font-size:20px; color:var(--o); letter-spacing:-0.02em; }
  .az-brand-badge { background:var(--o10); color:var(--o); border:1px solid var(--o20); border-radius:99px; padding:3px 10px; font-size:11px; font-weight:600; letter-spacing:0.06em; }

  /* Hero */
  .az-hero { background:linear-gradient(135deg, var(--o) 0%, #c83c00 100%); color:#fff; padding:64px 24px; }
  .az-hero-inner { max-width:720px; margin:0 auto; text-align:center; }
  .az-hero-eyebrow { font-family:var(--fm); font-size:11px; letter-spacing:0.16em; text-transform:uppercase; opacity:0.7; margin-bottom:14px; }
  .az-hero-title { font-family:var(--fd); font-size:clamp(28px,5vw,52px); font-weight:400; letter-spacing:-0.02em; margin:0 0 20px; line-height:1.1; }
  .az-hero-meta { display:flex; flex-wrap:wrap; justify-content:center; gap:8px; }
  .az-hero-chip { background:rgba(255,255,255,0.15); border:1px solid rgba(255,255,255,0.25); border-radius:99px; padding:4px 14px; font-size:12px; font-weight:500; }
  .az-hero-chip--closed { background:rgba(0,0,0,0.2); border-color:rgba(0,0,0,0.1); }
  .az-hero-closed-msg { margin-top:20px; background:rgba(0,0,0,0.15); border-radius:8px; padding:12px 20px; font-size:14px; display:inline-block; }

  /* Body */
  .az-body { max-width:860px; margin:-32px auto 0; padding:0 24px 80px; position:relative; z-index:1; }

  /* Banners */
  .az-banner { display:flex; align-items:flex-start; gap:14px; padding:20px 24px; border-radius:12px; border:2px solid; margin-bottom:24px; }
  .az-banner--success { background:#f0fdf4; border-color:#bbf7d0; }
  .az-banner--success .az-banner-icon { color:#16a34a; }
  .az-banner--error   { background:#fef2f2; border-color:#fecaca; }
  .az-banner--error   .az-banner-icon { color:#dc2626; }
  .az-banner-title { font-weight:700; font-size:15px; margin-bottom:3px; }
  .az-banner-msg   { font-size:13px; opacity:0.8; line-height:1.6; }
  .az-banner-code  { font-family:var(--fm); font-size:12px; background:rgba(0,0,0,0.06); padding:1px 6px; border-radius:4px; }

  /* Card */
  .az-card { background:#fff; border-radius:16px; box-shadow:0 8px 40px rgba(0,0,0,0.08); overflow:hidden; }

  /* Sections */
  .az-section { padding:40px 48px; border-bottom:1px solid var(--g100); }
  .az-section--alt { background:var(--g50); }
  .az-section:last-child { border-bottom:none; }
  .az-section-head { display:flex; align-items:flex-start; gap:14px; margin-bottom:28px; }
  .az-section-icon { width:42px; height:42px; background:var(--o); border-radius:10px; display:flex; align-items:center; justify-content:center; color:#fff; flex-shrink:0; }
  .az-section-num { font-family:var(--fm); font-size:10px; color:var(--o30); letter-spacing:0.1em; margin-bottom:3px; }
  .az-section-title { font-size:20px; font-weight:700; color:var(--g900); margin:0; }
  .az-section-body { display:flex; flex-direction:column; gap:20px; }

  /* Grid */
  .az-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:20px; }

  /* Fields */
  .az-field { display:flex; flex-direction:column; gap:7px; }
  .az-field-label { font-size:13px; font-weight:600; color:var(--g700); }
  .az-field-hint { font-size:11px; color:#9ca3af; margin:0; }
  .az-req { color:var(--o); }
  .az-err { font-size:12px; color:#dc2626; font-weight:600; margin:0; }
  .az-err--terms { margin-top:6px; }

  /* Inputs */
  .az-input-wrap { position:relative; }
  .az-input-icon { position:absolute; left:14px; top:50%; transform:translateY(-50%); color:#9ca3af; pointer-events:none; }
  .az-input { width:100%; height:46px; padding:0 14px; background:var(--g50); border:2px solid var(--g200); border-radius:10px; font-family:var(--fb); font-size:14px; color:var(--g900); outline:none; box-sizing:border-box; transition:border-color 0.15s, background 0.15s; }
  .az-input--icon { padding-left:44px; }
  .az-input::placeholder { color:#9ca3af; }
  .az-input:focus { border-color:var(--o); background:#fff; }
  .az-select { width:100%; height:46px; padding:0 14px; background:var(--g50); border:2px solid var(--g200); border-radius:10px; font-family:var(--fb); font-size:14px; color:var(--g900); outline:none; cursor:pointer; transition:border-color 0.15s; appearance:none; }
  .az-select:focus { border-color:var(--o); }

  /* Textarea */
  .az-icon-textarea-wrap { position:relative; }
  .az-textarea-icon { position:absolute; left:14px; top:14px; color:#9ca3af; pointer-events:none; }
  .az-textarea { width:100%; padding:12px 14px; background:var(--g50); border:2px solid var(--g200); border-radius:10px; font-family:var(--fb); font-size:14px; color:var(--g900); outline:none; resize:vertical; box-sizing:border-box; transition:border-color 0.15s, background 0.15s; line-height:1.6; }
  .az-textarea--icon { padding-left:38px; }
  .az-textarea::placeholder { color:#9ca3af; }
  .az-textarea:focus { border-color:var(--o); background:#fff; }

  /* Education */
  .az-edu-empty { font-size:13px; color:#9ca3af; font-style:italic; }
  .az-edu-entry { border:1px solid var(--g200); border-radius:10px; padding:20px; margin-bottom:12px; background:#fff; }
  .az-edu-entry-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
  .az-edu-entry-num { font-family:var(--fm); font-size:11px; color:var(--o30); letter-spacing:0.08em; }
  .az-edu-remove { background:none; border:none; cursor:pointer; color:#9ca3af; padding:4px; border-radius:4px; transition:color 0.12s; }
  .az-edu-remove:hover { color:#dc2626; }
  .az-edu-add { display:flex; align-items:center; height:40px; padding:0 18px; border:2px dashed var(--g200); border-radius:10px; background:none; font-family:var(--fb); font-size:13px; color:#9ca3af; cursor:pointer; transition:all 0.15s; width:100%; justify-content:center; }
  .az-edu-add:hover { border-color:var(--o); color:var(--o); background:var(--o10); }

  /* File dropzone */
  .az-dropzone { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; height:120px; border:2px dashed var(--g200); border-radius:10px; cursor:pointer; transition:all 0.15s; position:relative; }
  .az-dropzone--over { border-color:var(--o); background:var(--o10); }
  .az-dropzone--uploading { opacity:0.7; pointer-events:none; }
  .az-dropzone:hover { border-color:var(--o); background:var(--o10); }
  .az-dropzone-input { position:absolute; inset:0; opacity:0; cursor:pointer; width:100%; height:100%; }
  .az-dropzone-inner { display:flex; flex-direction:column; align-items:center; gap:6px; pointer-events:none; }
  .az-dropzone-icon { color:var(--o); opacity:0.6; }
  .az-dropzone-text { font-size:14px; color:var(--g700); font-weight:500; }
  .az-dropzone-hint { font-size:11px; color:#9ca3af; }
  .az-dropzone-spin { width:28px; height:28px; border:3px solid var(--g200); border-top-color:var(--o); border-radius:50%; animation:az-spin 0.7s linear infinite; }
  @keyframes az-spin { to { transform:rotate(360deg); } }
  .az-file-done { display:flex; align-items:center; gap:10px; padding:12px 16px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; }
  .az-file-done-icon { color:#16a34a; flex-shrink:0; }
  .az-file-done-name { font-size:13px; color:var(--g700); flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .az-file-clear { background:none; border:none; cursor:pointer; color:#9ca3af; padding:2px; transition:color 0.12s; }
  .az-file-clear:hover { color:#dc2626; }

  /* Terms & submit */
  .az-terms-section { padding:40px 48px; background:#fff; }
  .az-terms-label { display:flex; align-items:flex-start; gap:12px; font-size:13px; color:var(--g700); line-height:1.6; cursor:pointer; margin-bottom:28px; }
  .az-checkbox { width:18px; height:18px; flex-shrink:0; margin-top:2px; cursor:pointer; accent-color:var(--o); }
  .az-submit-btn { width:100%; height:56px; background:var(--o); color:#fff; border:none; border-radius:12px; font-family:var(--fb); font-size:16px; font-weight:700; cursor:pointer; transition:all 0.15s; letter-spacing:0.02em; }
  .az-submit-btn:hover:not(:disabled) { background:#c83c00; transform:translateY(-1px); box-shadow:0 4px 16px rgba(255,106,0,0.35); }
  .az-submit-btn:disabled { background:var(--g200); cursor:not-allowed; transform:none; }
  .az-submit-spin-row { display:flex; align-items:center; justify-content:center; gap:10px; }
  .az-submit-spin { width:20px; height:20px; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:az-spin 0.7s linear infinite; }
  .az-submit-note { text-align:center; font-size:12px; color:#9ca3af; margin-top:14px; }

  /* Footer */
  .az-footer { background:var(--g900); color:rgba(255,255,255,0.5); text-align:center; padding:32px 24px; font-size:12px; }

  @media (max-width:680px) {
    .az-section { padding:28px 20px; }
    .az-terms-section { padding:28px 20px; }
    .az-grid-2 { grid-template-columns:1fr; }
    .az-hero { padding:48px 20px; }
    .az-body { padding:0 16px 60px; }
  }
`;