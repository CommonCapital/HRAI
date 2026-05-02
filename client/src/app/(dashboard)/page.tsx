'use client';
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  Play,
  Pause,
  FileText,
  Calendar,
  MessageSquare,
  BarChart3,
  CheckCircle2,
  Shield,
  Target,
  Zap,
  TrendingUp,
  Users,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";

// ─── Pipeline event stream ────────────────────────────────────────────────────
const pipelineEvents = [
  { t: "00:00", type: "apply",     label: "Application received",      sub: "Jane D. · Senior Engineer",          score: null },
  { t: "00:03", type: "cv",        label: "AI parsed & analysed",      sub: "94 data-points extracted",            score: null },
  { t: "00:08", type: "score",     label: "AI score computed",         sub: "Role fit · Experience · Culture",     score: 88  },
  { t: "00:12", type: "decision",  label: "Smart deferral active",     sub: "Waiting for deadline...",             score: null },
  { t: "00:15", type: "meeting",   label: "Past talent matched",       sub: "3 high-fit profiles found",           score: null },
  { t: "00:18", type: "interview", label: "Deadline reached",          sub: "Top 5 candidates selected",           score: null },
  { t: "00:22", type: "rank",      label: "Invites dispatched",        sub: "Interview links sent automatically",  score: null },
];

const eventIcon: Record<string, any> = {
  apply:     FileText,
  cv:        FileText,
  score:     BarChart3,
  decision:  CheckCircle2,
  meeting:   Calendar,
  interview: MessageSquare,
  rank:      TrendingUp,
};

// ─── Animated metric counter ──────────────────────────────────────────────────
const MetricCounter = ({ end, label, prefix = "", suffix = "" }: any) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const duration = 2000;
    const increment = end / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, 16);
    return () => clearInterval(timer);
  }, [end]);
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
      <div className="font-mono text-3xl md:text-5xl font-semibold text-primary">{prefix}{count}{suffix}</div>
      <div className="text-[10px] md:text-xs font-light tracking-widest uppercase opacity-60 mt-1">{label}</div>
    </motion.div>
  );
};

// ─── Pipeline step ────────────────────────────────────────────────────────────
const PipelineStep = ({ number, title, description, tag, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, x: -40 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5 }}
    whileHover={{ x: 6 }}
    className="flex gap-5 md:gap-8 group cursor-default"
  >
    <div className="flex-shrink-0 flex flex-col items-center gap-2">
      <motion.div
        className="w-10 h-10 md:w-12 md:h-12 border-2 border-primary flex items-center justify-center font-mono text-base md:text-lg font-semibold"
        whileHover={{ scale: 1.1, rotate: 4 }}
      >
        {number}
      </motion.div>
      {number !== "06" && <div className="w-px flex-1 bg-primary/20 min-h-[32px]" />}
    </div>
    <div className="pb-8 md:pb-10 flex-1">
      <div className="flex items-center gap-3 flex-wrap">
        <h3 className="text-lg md:text-xl font-semibold tracking-tight">{title}</h3>
        <span className="px-2 py-0.5 border border-primary/30 text-[9px] md:text-[10px] tracking-widest uppercase font-light text-primary">{tag}</span>
      </div>
      <p className="text-sm font-light leading-relaxed opacity-75 mt-1.5">{description}</p>
    </div>
  </motion.div>
);

// ─── Diff table row ───────────────────────────────────────────────────────────
const DiffRow = ({ feature, hrai, them, delay }: any) => (
  <motion.tr
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay }}
    className="border-b border-primary/10 hover:bg-primary/3 transition-colors"
  >
    <td className="py-3 md:py-4 pr-6 text-xs md:text-sm font-light">{feature}</td>
    <td className="py-3 md:py-4 pr-6 text-center">
      <span className="text-primary font-semibold text-base md:text-lg">✓</span>
    </td>
    <td className="py-3 md:py-4 text-center">
      <span className="opacity-30 text-base md:text-lg">—</span>
    </td>
  </motion.tr>
);

// ─── Main component ───────────────────────────────────────────────────────────
export default function HRAILanding() {
  const [playing, setPlaying] = useState(true);
  const [step, setStep]       = useState(0);
  const { scrollYProgress }   = useScroll();
  const heroOpacity           = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const router                = useRouter();

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setStep(p => (p + 1) % pipelineEvents.length), 2800);
    return () => clearInterval(t);
  }, [playing]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Scroll progress bar */}
      <motion.div className="fixed top-0 left-0 right-0 h-[3px] bg-primary origin-left z-50" style={{ scaleX: scrollYProgress }} />

      {/* ─── HERO ──────────────────────────────────────────────────────────── */}
      <section className="min-h-screen flex items-center justify-center px-4 md:px-6 py-16 md:py-0 relative">
        {/* grid bg */}
        <motion.div className="absolute inset-0 pointer-events-none" style={{ opacity: heroOpacity }}>
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(to right,rgba(255,106,0,.07) 1px,transparent 1px),
                              linear-gradient(to bottom,rgba(255,106,0,.07) 1px,transparent 1px)`,
            backgroundSize: "72px 72px",
          }} />
        </motion.div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 md:gap-20 items-center relative z-10 w-full">

          {/* LEFT — value prop */}
          <div className="space-y-7 md:space-y-9">
            <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
              <motion.div
                className="inline-block px-3 md:px-4 py-2 border border-primary/30 text-[10px] md:text-xs tracking-widest uppercase font-light"
                animate={{ letterSpacing: ["0.1em","0.16em","0.1em"] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              >
                The AI-First Recruitment Engine
              </motion.div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-semibold leading-none mt-5 tracking-tight">
                <motion.span initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                  Discover. Rank.
                </motion.span>
                <br />
                <motion.span initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.38 }} className="italic font-light">
                  Invite.
                </motion.span>
              </h1>

              <motion.p
                className="text-base md:text-lg font-light leading-relaxed max-w-xl opacity-80 mt-5"
                initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} transition={{ delay: 0.55 }}
              >
                Assign an AI agent to a job listing and walk away. HRAI parses CVs, scores 
                candidates against your exact criteria, discovers hidden gems in your talent pool, 
                and automatically dispatches interview invites to the absolute best candidates when the deadline hits.
              </motion.p>
            </motion.div>

            {/* CTA row */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 pt-2"
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}
            >
              <motion.button
                onClick={() => router.push("/waitlist")}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                className="w-full sm:w-auto px-7 md:px-9 h-12 bg-[#FF6A00] text-white text-xs md:text-sm tracking-widest uppercase font-light border-2 border-[#FF6A00] hover:bg-white hover:text-[#FF6A00] transition-colors"
              >
                Get Early Access
              </motion.button>
              <motion.button
                onClick={() => window.open("https://drive.google.com/file/d/1Mq85la6DwwXF-eKkMNTP-4PmBYZyhQbg/view?usp=sharing", "_blank")}
                whileHover={{ scale: 1.04, backgroundColor: "#FF6A00", color: "#FFFFFF" }} whileTap={{ scale: 0.96 }}
                className="w-full sm:w-auto px-7 md:px-9 h-12 border-2 border-[#FF6A00] text-[#FF6A00] text-xs md:text-sm tracking-widest uppercase font-light transition-all"
              >
                Watch Demo
              </motion.button>
            </motion.div>

            {/* KPIs */}
            <motion.div
              className="grid grid-cols-3 gap-4 md:gap-6 pt-6 md:pt-8 border-t border-primary/10"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.95 }}
            >
              {[
                { val: "Hours", sub: "Not weeks" },
                { val: "100%", sub: "Traceable" },
                { val: "0",    sub: "Manual steps" },
              ].map(({ val, sub }, i) => (
                <div key={i} className={`text-center ${i > 0 ? "border-l border-primary/10" : ""}`}>
                  <div className="font-mono text-xl md:text-2xl font-semibold">{val}</div>
                  <div className="text-[10px] md:text-xs uppercase tracking-wide opacity-60 mt-1">{sub}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* RIGHT — live pipeline feed */}
          <motion.div
            initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.75, delay: 0.3 }}
            className="relative"
          >
            <div className="border-2 border-primary/20 shadow-orange-xl bg-white p-4 md:p-8">
              {/* header */}
              <div className="flex items-center justify-between pb-3 md:pb-4 border-b border-primary/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] md:text-xs uppercase tracking-widest font-light">Live Pipeline · Senior Engineer</span>
                </div>
                <button onClick={() => setPlaying(p => !p)} className="p-1.5 hover:bg-primary/5 transition-colors">
                  {playing ? <Pause size={14} /> : <Play size={14} />}
                </button>
              </div>

              {/* event stream */}
              <div className="space-y-2.5 md:space-y-3 mt-5 min-h-[340px] md:min-h-[420px]">
                <AnimatePresence>
                  {pipelineEvents.slice(0, step + 1).map((ev, i) => {
                    const Icon = eventIcon[ev.type];
                    const isLatest = i === step;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 14, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.28 }}
                        className={`flex items-start gap-3 p-3 md:p-4 border transition-all ${isLatest ? "border-primary/40 bg-primary/5" : "border-primary/10"}`}
                      >
                        <Icon size={15} className={`mt-0.5 flex-shrink-0 ${isLatest ? "text-primary" : "opacity-40"}`} strokeWidth={1.5} />
                        <div className="flex-1 min-w-0">
                          <div className={`text-xs md:text-sm font-${isLatest ? "semibold" : "light"} truncate`}>{ev.label}</div>
                          <div className="text-[10px] md:text-xs opacity-55 mt-0.5 truncate">{ev.sub}</div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {ev.score && (
                            <span className="font-mono text-sm md:text-base font-semibold text-primary">{ev.score}</span>
                          )}
                          <span className="font-mono text-[9px] md:text-[10px] opacity-40">{ev.t}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* progress */}
              <div className="mt-5 md:mt-7 pt-4 border-t border-primary/10">
                <div className="flex justify-between text-[10px] md:text-xs mb-2">
                  <span className="uppercase tracking-widest opacity-55">Pipeline progress</span>
                  <span className="font-mono">{Math.round(((step + 1) / pipelineEvents.length) * 100)}%</span>
                </div>
                <div className="h-1 bg-primary/10 overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    animate={{ width: `${((step + 1) / pipelineEvents.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </div>

            {/* floating badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}
              className="absolute -bottom-4 md:-bottom-6 -right-4 md:-right-6 bg-primary text-white p-4 md:p-6 shadow-orange-xl"
            >
              <div className="text-[10px] md:text-xs uppercase tracking-widest opacity-80">Time elapsed</div>
              <div className="font-mono text-2xl md:text-3xl font-semibold mt-1">22 sec</div>
              <div className="text-[10px] md:text-xs mt-1.5 opacity-80">Full pipeline complete</div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section className="py-16 md:py-32 px-4 md:px-6 bg-primary/5">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14 md:mb-20">
            <div className="inline-block px-3 md:px-4 py-2 border border-primary/30 text-[10px] md:text-xs tracking-widest uppercase font-light">
              End-to-end orchestration
            </div>
            <h2 className="text-3xl md:text-5xl font-semibold mt-4 tracking-tight">Configure once.<br />Hire forever.</h2>
            <p className="text-base md:text-lg font-light opacity-75 max-w-2xl mx-auto mt-5">
              The job listing is your orchestration unit. Assign an agent, set your criteria — HRAI handles every candidate from first click to final report.
            </p>
          </motion.div>

          <div>
            <PipelineStep number="01" title="Define & Discover" tag="One-time setup" delay={0}
              description="Create a job listing, assign an AI agent, and instantly discover matching candidates from your past talent pool." />
            <PipelineStep number="02" title="Automated Ingestion" tag="Automatic" delay={0.08}
              description="Every inbound CV is parsed, validated against your job description, and assigned an AI Score based on role fit and experience." />
            <PipelineStep number="03" title="Instant Sorting" tag="Automatic" delay={0.16}
              description="Candidates are instantly ranked top-to-bottom. No manual screening or keyword matching required — genuine comprehension." />
            <PipelineStep number="04" title="Smart Deferral" tag="Automatic" delay={0.24}
              description="Invitations are intelligently held back until your job deadline hits, ensuring the entire candidate pool is evaluated fairly." />
            <PipelineStep number="05" title="Top-N Batching" tag="Automatic" delay={0.32}
              description="Once the deadline arrives, the system selects only the absolute best candidates according to your predefined limit." />
            <PipelineStep number="06" title="Automated Scheduling" tag="Recruiter reviews" delay={0.4}
              description="The top candidates automatically receive personalized booking links for interviews. You just show up to the calls." />
          </div>
        </div>
      </section>

      {/* ─── LIVE ACTIVITY ─────────────────────────────────────────────────── */}
      <section className="py-16 md:py-32 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14 md:mb-20">
            <div className="inline-block px-3 md:px-4 py-2 border border-primary/30 text-[10px] md:text-xs tracking-widest uppercase font-light">
              Parallel execution
            </div>
            <h2 className="text-3xl md:text-5xl font-semibold mt-4">Scale without headcount</h2>
            <p className="text-base md:text-lg font-light opacity-75 max-w-2xl mx-auto mt-5">
              Every job listing runs its own pipeline concurrently. One recruiter can oversee hundreds of positions simultaneously.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="border-2 border-primary/20 shadow-orange-lg p-5 md:p-10"
          >
            <div className="flex items-center justify-between mb-7 md:mb-10">
              <h3 className="text-lg md:text-2xl font-semibold">Active pipelines</h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] md:text-xs uppercase tracking-widest font-light">Real-time</span>
              </div>
            </div>

            <div className="space-y-3 md:space-y-4">
              {[
                { role: "Senior Engineer",   stage: "Booked",      candidate: "Jane D.",     score: 88, progress: 90 },
                { role: "Product Designer",  stage: "AI Scoring",  candidate: "Marcus T.",   score: null, progress: 35 },
                { role: "Data Scientist",    stage: "Deferred",    candidate: "Priya K.",    score: null, progress: 15 },
                { role: "Backend Developer", stage: "Ranked",      candidate: "Omar F.",     score: 74, progress: 100 },
                { role: "DevOps Engineer",   stage: "Matched",     candidate: "Lena W.",     score: null, progress: 60 },
              ].map((row, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ x: 5 }}
                  className="grid grid-cols-[1fr_auto] md:grid-cols-[2fr_1fr_1fr_auto] gap-3 md:gap-6 items-center p-3 md:p-4 border border-primary/10 hover:border-primary/30 hover:shadow-orange-sm transition-all cursor-default"
                >
                  <div>
                    <div className="text-xs md:text-sm font-semibold">{row.role}</div>
                    <div className="text-[10px] md:text-xs opacity-55 mt-0.5">{row.candidate}</div>
                  </div>
                  <div className="hidden md:flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary opacity-60" />
                    <span className="text-[10px] uppercase tracking-widest font-light opacity-70">{row.stage}</span>
                  </div>
                  <div className="hidden md:block">
                    <div className="h-1.5 bg-primary/10 overflow-hidden w-full">
                      <motion.div
                        className="h-full bg-primary"
                        initial={{ width: 0 }} whileInView={{ width: `${row.progress}%` }}
                        viewport={{ once: true }} transition={{ duration: 1, delay: i * 0.1 }}
                      />
                    </div>
                  </div>
                  <div className="font-mono text-sm md:text-base font-semibold">
                    {row.score ? <span className="text-primary">{row.score}</span> : <span className="opacity-30">—</span>}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── TRUST / TRACEABILITY ───────────────────────────────────────────── */}
      <section className="py-16 md:py-32 px-4 md:px-6 bg-primary/5">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 md:gap-20 items-center">
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="inline-block px-3 md:px-4 py-2 border border-primary/30 text-[10px] md:text-xs tracking-widest uppercase font-light">
              No black boxes
            </div>
            <h2 className="text-3xl md:text-5xl font-semibold mt-4 leading-tight">Every decision.<br />Fully traceable.</h2>
            <p className="text-base md:text-lg font-light opacity-75 mt-5 leading-relaxed">
              Unlike opaque AI screeners, HRAI shows exactly how each score was derived — which criteria fired, which evidence was cited, and what the AI concluded. Fully auditable by default.
            </p>
            <div className="space-y-5 mt-8">
              {[
                { icon: Shield,  title: "Company-specific AI",   desc: "Trained on your criteria, red flags, and culture values — not generic hiring patterns." },
                { icon: Target,  title: "Evidence-backed scores", desc: "Every dimension includes verbatim interview excerpts and CV evidence supporting the score." },
                { icon: Zap,     title: "Bias detection built in", desc: "Inconsistent evaluations across comparable candidates are automatically flagged for review." },
              ].map(({ icon: Icon, title, desc }, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="flex gap-4 items-start"
                >
                  <div className="p-2.5 md:p-3 border-2 border-primary/20 flex-shrink-0">
                    <Icon size={20} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h4 className="text-base md:text-lg font-semibold">{title}</h4>
                    <p className="text-xs md:text-sm font-light opacity-75 mt-1 leading-relaxed">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* decision card */}
          <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            className="border-2 border-primary/20 p-5 md:p-8 shadow-orange-xl bg-white"
          >
            <div className="pb-4 border-b border-primary/10 flex items-center justify-between">
              <h4 className="text-xs md:text-sm uppercase tracking-widest font-light">Candidate report</h4>
              <span className="text-[10px] font-mono opacity-50">Jane D.</span>
            </div>
            <div className="space-y-5 mt-5">
              {[
                { label: "Role fit",        score: 92, note: "Distributed systems @ scale — verified" },
                { label: "Technical depth", score: 88, note: "CAP trade-offs answered with examples" },
                { label: "Communication",   score: 85, note: "Clear, structured answers throughout" },
                { label: "Culture signals", score: 78, note: "Matches async-first, low-ego criteria" },
              ].map(({ label, score, note }, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -14 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xs md:text-sm font-light">{label}</span>
                      <div className="text-[9px] md:text-[10px] opacity-45 mt-0.5 italic">{note}</div>
                    </div>
                    <span className="font-mono text-xs md:text-sm font-semibold ml-4">{score}</span>
                  </div>
                  <div className="h-1.5 bg-primary/10 overflow-hidden mt-2">
                    <motion.div className="h-full bg-primary" initial={{ width: 0 }} whileInView={{ width: `${score}%` }}
                      viewport={{ once: true }} transition={{ duration: 1, delay: i * 0.1 }} />
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="mt-6 pt-5 border-t border-primary/10 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-widest font-light opacity-60">Recommendation</div>
                <div className="text-primary font-semibold text-sm md:text-base mt-1">Strong Hire</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-widest font-light opacity-60">Overall</div>
                <div className="font-mono text-2xl md:text-3xl font-semibold mt-1">88</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── COMPETITIVE DIFF ──────────────────────────────────────────────── */}
      <section className="py-16 md:py-32 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12 md:mb-16">
            <div className="inline-block px-3 md:px-4 py-2 border border-primary/30 text-[10px] md:text-xs tracking-widest uppercase font-light">
              Why HRAI
            </div>
            <h2 className="text-3xl md:text-5xl font-semibold mt-4">Built different</h2>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="border-2 border-primary/20 overflow-hidden shadow-orange-lg"
          >
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-primary/20 bg-primary/5">
                  <th className="py-4 md:py-5 px-4 md:px-6 text-left text-[10px] md:text-xs uppercase tracking-widest font-light opacity-60">Feature</th>
                  <th className="py-4 md:py-5 px-4 md:px-6 text-center text-[10px] md:text-xs uppercase tracking-widest font-semibold text-primary">HRAI</th>
                  <th className="py-4 md:py-5 px-4 md:px-6 text-center text-[10px] md:text-xs uppercase tracking-widest font-light opacity-60">Others</th>
                </tr>
              </thead>
              <tbody className="px-4 md:px-6">
                {[
                  ["Full pipeline — apply to scheduled interview", 0.0],
                  ["Company-specific AI (your criteria, not generic)", 0.06],
                  ["Proactive talent discovery from past applicants", 0.12],
                  ["Evidence-backed candidate ranking and scoring", 0.18],
                  ["Strategic deadline batching for interviews", 0.24],
                  ["Fully auditable, explainable decisions", 0.30],
                ].map(([feat, delay]) => (
                  <DiffRow key={feat as string} feature={feat} delay={delay} />
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* ─── CTA ───────────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-32 px-4 md:px-6 bg-primary/5">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            className="border-2 md:border-4 border-primary p-8 md:p-16 shadow-orange-xl bg-white"
          >
            <div className="inline-block px-3 md:px-4 py-2 border border-primary/30 text-[10px] md:text-xs tracking-widest uppercase font-light mb-5">
              Early access open
            </div>
            <h2 className="text-3xl md:text-5xl font-semibold">Your first autonomous<br />pipeline in minutes.</h2>
            <p className="text-base md:text-lg font-light opacity-75 max-w-xl mx-auto mt-5">
              No engineering required. Create a job listing, assign an agent, and HRAI takes care of every candidate — start to finish.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center mt-10 md:mt-12">
              <motion.button
                onClick={() => router.push("/waitlist")}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                className="w-full sm:w-auto px-8 md:px-12 h-12 md:h-14 bg-[#FF6A00] text-white text-xs md:text-sm tracking-widest uppercase font-light border-2 border-[#FF6A00] hover:bg-white hover:text-[#FF6A00] transition-colors"
              >
                Join Waitlist
              </motion.button>
              <motion.button
                onClick={() => router.push("/book-demo")}
                whileHover={{ scale: 1.04, backgroundColor: "#FF6A00", color: "#FFFFFF" }} whileTap={{ scale: 0.96 }}
                className="w-full sm:w-auto px-8 md:px-12 h-12 md:h-14 border-2 border-primary text-primary text-xs md:text-sm tracking-widest uppercase font-light transition-all"
              >
                Book Demo
              </motion.button>
            </div>

            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
              className="mt-12 pt-8 border-t border-primary/10"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8">
                <MetricCounter end={247}   label="Active agents" />
                <MetricCounter end={12847} label="Candidates processed" />
                <MetricCounter end={94}    label="Pipeline success rate" suffix="%" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="py-8 md:py-12 px-4 md:px-6 border-t border-primary/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <div className="text-xl md:text-2xl font-semibold">HRAI</div>
            <div className="text-[10px] md:text-xs uppercase tracking-widest opacity-55 mt-1">Full-Stack AI Hiring Orchestration</div>
          </div>
          <div className="text-[10px] md:text-xs uppercase tracking-widest opacity-55 text-center md:text-right">
            © 2026 — Built for autonomous recruitment
          </div>
        </div>
      </footer>
    </div>
  );
}