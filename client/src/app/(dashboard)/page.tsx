'use client';
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  Clock, 
  Users, 
  Zap, 
  Shield, 
  ArrowRight,
  Play,
  Pause,
  MessageSquare,
  FileCheck,
  Target,
  TrendingUp
} from "lucide-react";
import { useRouter } from "next/navigation";

// Simulated interview conversation
const interviewSteps = [
  { role: "AI", text: "Walk me through your experience with distributed systems at scale.", time: "00:02" },
  { role: "Candidate", text: "At my previous role, I architected a system handling 50M daily requests...", time: "00:15" },
  { role: "AI", text: "Interesting. What trade-offs did you make between consistency and availability?", time: "00:28" },
  { role: "Candidate", text: "We prioritized eventual consistency for user-facing features...", time: "00:42" },
  { role: "AI", text: "Can you describe a specific incident where this decision was tested?", time: "00:55" },
];

// Live metrics simulation
const MetricCounter = ({ end, label, prefix = "", suffix = "" }: any) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const increment = end / (duration / 16);
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [end]);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="text-center"
    >
      <div className="font-mono text-5xl font-semibold text-primary mb-2">
        {prefix}{count}{suffix}
      </div>
      <div className="text-sm font-light tracking-wide uppercase opacity-60">{label}</div>
    </motion.div>
  );
};

// Workflow step component
const WorkflowStep = ({ number, title, description, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, x: -50 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5 }}
    whileHover={{ x: 8 }}
    className="flex gap-6 group cursor-pointer"
  >
    <div className="flex-shrink-0">
      <motion.div 
        className="w-12 h-12 border-2 border-primary flex items-center justify-center font-mono text-xl font-semibold"
        whileHover={{ scale: 1.1, rotate: 5 }}
      >
        {number}
      </motion.div>
    </div>
    <div className="flex-1">
      <h3 className="text-xl font-semibold mb-2 tracking-tight">{title}</h3>
      <p className="text-sm font-light leading-relaxed opacity-80">{description}</p>
    </div>
  </motion.div>
);

// Feature card with inversion hover
const FeatureCard = ({ icon: Icon, title, value, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.4 }}
    whileHover={{ 
      scale: 1.02,
      backgroundColor: "#FF6A00",
      color: "#FFFFFF",
      transition: { duration: 0.2 }
    }}
    className="p-8 border border-primary/10 shadow-orange-md hover:shadow-orange-lg transition-all"
  >
    <Icon className="w-8 h-8 mb-4" strokeWidth={1.5} />
    <div className="font-mono text-3xl font-semibold mb-2">{value}</div>
    <div className="text-sm font-light tracking-wide uppercase">{title}</div>
  </motion.div>
);

export default function HRAILanding() {
  const [demoPlaying, setDemoPlaying] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  
  // Auto-advance interview demo
  useEffect(() => {
    if (!demoPlaying) return;
    
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % interviewSteps.length);
    }, 3000);
    
    return () => clearInterval(timer);
  }, [demoPlaying]);
  const router = useRouter()
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Progress indicator */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-primary origin-left z-50"
        style={{ scaleX: scrollYProgress }}
      />

      {/* Hero Section - Immediate Demo */}
      <section className="min-h-screen flex items-center justify-center px-6 relative">
        <motion.div 
          className="absolute inset-0 opacity-5"
          style={{ opacity }}
        >
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(to right, rgba(255,106,0,0.1) 1px, transparent 1px),
                             linear-gradient(to bottom, rgba(255,106,0,0.1) 1px, transparent 1px)`,
            backgroundSize: '80px 80px'
          }} />
        </motion.div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
          {/* Left: Value Prop */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div 
                className="inline-block mb-6 px-4 py-2 border border-primary/30 text-xs tracking-widest uppercase font-light"
                animate={{ 
                  letterSpacing: ["0.1em", "0.15em", "0.1em"],
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                Autonomous HR Intelligence
              </motion.div>
              
              <h1 className="text-6xl lg:text-7xl font-semibold leading-none mb-6 tracking-tight">
                <motion.span
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Hiring that
                </motion.span>
                <br />
                <motion.span
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="italic font-light"
                >
                  runs itself
                </motion.span>
              </h1>
              
              <motion.p 
                className="text-lg font-light leading-relaxed max-w-xl opacity-80 mb-25"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                transition={{ delay: 0.6 }}
              
              >
                Train custom AI agents on your hiring standards. They screen, interview, 
                verify, and recommend—autonomously. No black boxes. No bias. Just structured 
                intelligence at scale.
              </motion.p>
            </motion.div>

            <motion.div 
        className="flex gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <motion.button
          onClick={() => router.push("/waitlist")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-8 h-12 bg-[#FF6A00] text-white text-sm tracking-widest uppercase font-light border-2 border-black hover:bg-white hover:text-[#FF6A00] transition-colors"
        >
          Get Started
        </motion.button>
        
        {/* Watch Demo Button with Arrows */}
        <div className="relative">
          <motion.button
            onClick={() => window.open("https://drive.google.com/file/d/1chBw97mGlFh_R3KiqnGA61NC8CVx8V_D/view?usp=drivesdk", "_blank")}
            whileHover={{ scale: 1.05, backgroundColor: "#FF6A00", color: "#FFFFFF" }}
            whileTap={{ scale: 0.95 }}
            className="px-8 h-12 border-2 border-[#FF6A00] text-[#FF6A00] text-sm tracking-widest uppercase font-light hover:bg-[#FF6A00] hover:text-white transition-all relative z-10"
          >
            Watch Demo
          </motion.button>

          {/* Arrow 1 - Top Left */}
          <motion.svg
            initial={{ opacity: 0, scale: 0, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 1.2, duration: 0.5, type: "spring" }}
            className="absolute -top-16 -left-12 w-24 h-24 pointer-events-none"
            viewBox="0 0 100 100"
            fill="none"
          >
            <motion.path
              d="M 20 10 Q 30 25, 45 40 Q 50 45, 55 50"
              stroke="#FF6A00"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 1.2, duration: 0.8 }}
            />
            <motion.path
              d="M 55 50 L 45 45 M 55 50 L 50 60"
              stroke="#FF6A00"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 1.8, duration: 0.3 }}
            />
          </motion.svg>

          {/* Arrow 2 - Top Right */}
          <motion.svg
            initial={{ opacity: 0, scale: 0, rotate: 10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 1.4, duration: 0.5, type: "spring" }}
            className="absolute -top-20 -right-16 w-28 h-28 pointer-events-none"
            viewBox="0 0 100 100"
            fill="none"
          >
            <motion.path
              d="M 80 15 Q 70 28, 58 42 Q 52 48, 48 52"
              stroke="#FF6A00"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 1.4, duration: 0.8 }}
            />
            <motion.path
              d="M 48 52 L 58 48 M 48 52 L 52 62"
              stroke="#FF6A00"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 2.0, duration: 0.3 }}
            />
          </motion.svg>

          {/* Arrow 3 - Bottom Left */}
          <motion.svg
            initial={{ opacity: 0, scale: 0, rotate: 15 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 1.6, duration: 0.5, type: "spring" }}
            className="absolute -bottom-14 -left-16 w-32 h-32 pointer-events-none"
            viewBox="0 0 100 100"
            fill="none"
          >
            <motion.path
              d="M 15 85 Q 25 70, 38 58 Q 44 52, 50 48"
              stroke="#FF6A00"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 1.6, duration: 0.8 }}
            />
            <motion.path
              d="M 50 48 L 42 52 M 50 48 L 46 38"
              stroke="#FF6A00"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 2.2, duration: 0.3 }}
            />
          </motion.svg>

          {/* Arrow 4 - Right Side */}
          <motion.svg
            initial={{ opacity: 0, scale: 0, rotate: -15 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 1.3, duration: 0.5, type: "spring" }}
            className="absolute top-0 -right-24 w-24 h-24 pointer-events-none"
            viewBox="0 0 100 100"
            fill="none"
          >
            <motion.path
              d="M 85 50 Q 72 50, 60 50"
              stroke="#FF6A00"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 1.3, duration: 0.6 }}
            />
            <motion.path
              d="M 60 50 L 68 45 M 60 50 L 68 55"
              stroke="#FF6A00"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 1.7, duration: 0.3 }}
            />
          </motion.svg>

          {/* Arrow 5 - Bottom Right */}
          <motion.svg
            initial={{ opacity: 0, scale: 0, rotate: -20 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 1.5, duration: 0.5, type: "spring" }}
            className="absolute -bottom-16 -right-20 w-32 h-32 pointer-events-none"
            viewBox="0 0 100 100"
            fill="none"
          >
            <motion.path
              d="M 85 88 Q 72 72, 60 60 Q 55 55, 52 52"
              stroke="#FF6A00"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 1.5, duration: 0.8 }}
            />
            <motion.path
              d="M 52 52 L 60 56 M 52 52 L 56 42"
              stroke="#FF6A00"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 2.1, duration: 0.3 }}
            />
          </motion.svg>

          {/* Handwritten Text Labels */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 2.3, duration: 0.4 }}
            className="absolute -top-24 left-1/2 -translate-x-1/2 pointer-events-none"
          >
            <span className="text-[#FF6A00] font-bold text-lg rotate-[-8deg] inline-block whitespace-nowrap" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
              MUST WATCH! →
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 2.5, duration: 0.4 }}
            className="absolute -bottom-20 -left-24 pointer-events-none"
          >
            <span className="text-[#FF6A00] font-bold text-base rotate-[12deg] inline-block whitespace-nowrap" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
              Check this out!
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 2.4, duration: 0.4 }}
            className="absolute top-0 -right-32 pointer-events-none"
          >
            <span className="text-[#FF6A00] font-bold text-base rotate-[-5deg] inline-block whitespace-nowrap" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
              ← See it live
            </span>
          </motion.div>

          {/* Pulse Effect Behind Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: [0.3, 0.5, 0.3],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              delay: 2.6,
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 bg-[#FF6A00] rounded blur-xl -z-10"
          />
        </div>
      </motion.div>

            {/* Live Stats */}
            <motion.div 
              className="grid grid-cols-3 gap-6 pt-8 border-t border-primary/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <div className="text-center">
                <div className="font-mono text-2xl font-semibold">94<span className="text-lg">%</span></div>
                <div className="text-xs uppercase tracking-wide opacity-60 mt-1">Accuracy</div>
              </div>
              <div className="text-center border-l border-primary/10">
                <div className="font-mono text-2xl font-semibold">3.2<span className="text-lg">hr</span></div>
                <div className="text-xs uppercase tracking-wide opacity-60 mt-1">Time Saved</div>
              </div>
              <div className="text-center border-l border-primary/10">
                <div className="font-mono text-2xl font-semibold">10<span className="text-lg">x</span></div>
                <div className="text-xs uppercase tracking-wide opacity-60 mt-1">Faster</div>
              </div>
            </motion.div>
          </div>

          {/* Right: Live Interview Demo */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            <div className="border-2 border-primary/20 shadow-orange-xl bg-white p-8">
              {/* Demo Controls */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-primary/10">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs uppercase tracking-widest font-light">Live Interview</span>
                </div>
                <button 
                  onClick={() => setDemoPlaying(!demoPlaying)}
                  className="p-2 hover:bg-primary/5 transition-colors"
                >
                  {demoPlaying ? <Pause size={16} /> : <Play size={16} />}
                </button>
              </div>

              {/* Interview Conversation */}
              <div className="space-y-4 min-h-[400px]">
                <AnimatePresence mode="wait">
                  {interviewSteps.slice(0, currentStep + 1).map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className={`flex gap-4 ${step.role === 'AI' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`max-w-[80%] ${step.role === 'AI' ? 'order-1' : 'order-2'}`}>
                        <div className="text-xs uppercase tracking-widest mb-2 opacity-60 flex items-center gap-2">
                          {step.role === 'AI' && <Zap size={12} />}
                          {step.role}
                          <span className="font-mono">{step.time}</span>
                        </div>
                        <div className={`p-4 border ${step.role === 'AI' ? 'border-primary/30 bg-primary/5' : 'border-primary/10'}`}>
                          <p className="text-sm font-light leading-relaxed">{step.text}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Real-time Analysis Bar */}
              <motion.div 
                className="mt-6 pt-6 border-t border-primary/10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="uppercase tracking-widest opacity-60">Analyzing Response</span>
                  <span className="font-mono">78%</span>
                </div>
                <div className="h-1 bg-primary/10 overflow-hidden">
                  <motion.div 
                    className="h-full bg-primary"
                    initial={{ width: "0%" }}
                    animate={{ width: "78%" }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            </div>

            {/* Floating Agent Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="absolute -bottom-6 -right-6 bg-primary text-white p-6 shadow-orange-xl"
            >
              <div className="text-xs uppercase tracking-widest mb-2 opacity-80">Agent Status</div>
              <div className="font-mono text-2xl font-semibold">Active</div>
              <div className="text-xs mt-2 opacity-80">Candidate #247</div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Workflow Visualization */}
      <section className="py-32 px-6 bg-primary/5">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="inline-block mb-6 px-4 py-2 border border-primary/30 text-xs tracking-widest uppercase font-light">
              End-to-End Autonomy
            </div>
            <h2 className="text-5xl font-semibold mb-6">How it works</h2>
            <p className="text-lg font-light opacity-80 max-w-2xl mx-auto">
              Five autonomous steps. Zero human intervention required.
            </p>
          </motion.div>

          <div className="space-y-12">
            <WorkflowStep 
              number="01"
              title="Define Standards"
              description="You set the hiring criteria, red flags, and evaluation framework. The agent learns your company's unique requirements."
              delay={0}
            />
            <WorkflowStep 
              number="02"
              title="Resume Screening"
              description="AI verifies claims, checks references, and flags inconsistencies automatically. No keyword matching—actual comprehension."
              delay={0.1}
            />
            <WorkflowStep 
              number="03"
              title="Schedule & Interview"
              description="Agent coordinates calendars and conducts structured interviews via text or voice. Every candidate gets the same rigorous evaluation."
              delay={0.2}
            />
            <WorkflowStep 
              number="04"
              title="Verification"
              description="Cross-references employment history, validates technical claims, and assesses cultural alignment against your standards."
              delay={0.3}
            />
            <WorkflowStep 
              number="05"
              title="Deliver Insights"
              description="Structured reports with fit scores, strengths, weaknesses, and clear hiring recommendations. Fully auditable."
              delay={0.4}
            />
          </div>

          {/* Process Flow Visualization */}
          <motion.div 
            className="mt-20 grid grid-cols-5 gap-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {['Define', 'Screen', 'Interview', 'Verify', 'Deliver'].map((label, index) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div className="h-32 border-2 border-primary/20 flex items-center justify-center hover:border-primary/60 hover:shadow-orange-md transition-all">
                  <span className="text-sm font-mono uppercase tracking-widest">{label}</span>
                </div>
                {index < 4 && (
                  <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                    <ArrowRight className="text-primary" size={16} />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Live Metrics Dashboard */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="inline-block mb-6 px-4 py-2 border border-primary/30 text-xs tracking-widest uppercase font-light">
              Performance at Scale
            </div>
            <h2 className="text-5xl font-semibold mb-6">Built for volume</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard icon={Users} title="Candidates Screened" value="12,847" delay={0} />
            <FeatureCard icon={Clock} title="Hours Saved" value="8,920" delay={0.1} />
            <FeatureCard icon={CheckCircle2} title="Accuracy Rate" value="94%" delay={0.2} />
            <FeatureCard icon={TrendingUp} title="Quality Hires" value="+47%" delay={0.3} />
          </div>

          {/* Real-time Activity Feed */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-20 border-2 border-primary/20 p-8 shadow-orange-lg"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-semibold tracking-tight">Live Activity</h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs uppercase tracking-widest font-light">Real-time</span>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { action: "Interview completed", candidate: "Sarah K.", role: "Senior Engineer", score: 87 },
                { action: "Resume verified", candidate: "Michael T.", role: "Product Designer", score: 92 },
                { action: "Screening started", candidate: "Jennifer L.", role: "Data Scientist", score: null },
                { action: "Interview scheduled", candidate: "Robert M.", role: "Backend Dev", score: null },
              ].map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ x: 8 }}
                  className="flex items-center justify-between p-4 border border-primary/10 hover:border-primary/30 hover:shadow-orange-sm transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <MessageSquare size={20} className="opacity-60" />
                    <div>
                      <div className="text-sm font-semibold">{activity.action}</div>
                      <div className="text-xs opacity-60 mt-1">
                        {activity.candidate} · {activity.role}
                      </div>
                    </div>
                  </div>
                  {activity.score && (
                    <div className="font-mono text-lg font-semibold">{activity.score}</div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust & Control */}
      <section className="py-32 px-6 bg-primary/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-block mb-6 px-4 py-2 border border-primary/30 text-xs tracking-widest uppercase font-light">
                Transparency First
              </div>
              <h2 className="text-5xl font-semibold mb-6 leading-tight">
                Control every decision
              </h2>
              <p className="text-lg font-light leading-relaxed opacity-80 mb-8">
                Unlike black-box AI, HRAI shows exactly how decisions are made. 
                Every evaluation is traceable, auditable, and aligned to your standards.
              </p>

              <div className="space-y-6">
                {[
                  { icon: Shield, title: "Full Auditability", desc: "Every decision logged and explainable" },
                  { icon: Target, title: "Your Standards Only", desc: "Trained on your hiring logic, not generic patterns" },
                  { icon: FileCheck, title: "Bias Detection", desc: "Automatic flagging of inconsistent evaluations" },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex gap-4 items-start"
                  >
                    <div className="p-3 border-2 border-primary/20">
                      <item.icon size={24} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{item.title}</h4>
                      <p className="text-sm font-light opacity-80">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="border-2 border-primary/20 p-8 shadow-orange-xl bg-white"
            >
              <div className="mb-6 pb-4 border-b border-primary/10">
                <h4 className="text-sm uppercase tracking-widest font-light mb-4">Decision Breakdown</h4>
              </div>

              <div className="space-y-6">
                {[
                  { label: "Technical Skills", score: 92, color: "primary" },
                  { label: "Communication", score: 87, color: "primary" },
                  { label: "Cultural Fit", score: 78, color: "primary" },
                  { label: "Experience Level", score: 95, color: "primary" },
                ].map((metric, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-light">{metric.label}</span>
                      <span className="font-mono text-sm font-semibold">{metric.score}</span>
                    </div>
                    <div className="h-2 bg-primary/10 overflow-hidden">
                      <motion.div 
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${metric.score}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div 
                className="mt-8 pt-6 border-t border-primary/10"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm uppercase tracking-widest font-light">Overall Score</span>
                  <span className="font-mono text-3xl font-semibold">88</span>
                </div>
                <div className="mt-4 text-xs uppercase tracking-widest opacity-60">
                  Recommendation: <span className="text-primary font-semibold">Strong Hire</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="border-4 border-primary p-16 shadow-orange-xl"
          >
            <h2 className="text-5xl font-semibold mb-6">
              Start hiring autonomously
            </h2>
            <p className="text-lg font-light opacity-80 mb-12 max-w-2xl mx-auto">
              Deploy your first AI agent in minutes. No engineering required. 
              Full control from day one.
            </p>

            <div className="flex gap-6 justify-center">
              <motion.button
              onClick={() => router.push(`/waitlist`)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-12 h-14 bg-white text-white text-sm tracking-widest uppercase font-light border-2 border-orange-400 hover:bg-orange-400 hover:text-black transition-colors"
              >
                Deploy Now (Waitlist)
              </motion.button>
              
              <motion.button
              onClick={() => router.push(`/book-demo`)}
                whileHover={{ scale: 1.05, backgroundColor: "#FF6A00", color: "#FFFFFF" }}
                whileTap={{ scale: 0.95 }}
                className="px-12 h-14 border-2 border-primary text-primary text-sm tracking-widest uppercase font-light transition-all"
              >
                Book Demo
              </motion.button>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="mt-12 pt-8 border-t border-primary/10"
            >
              <div className="grid grid-cols-3 gap-8">
                <MetricCounter end={247} label="Active Agents" />
                <MetricCounter end={12847} label="Candidates Screened" />
                <MetricCounter end={94} label="Success Rate" suffix="%" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-primary/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-2xl font-semibold mb-2">HRAI</div>
              <div className="text-xs uppercase tracking-widest opacity-60">Autonomous HR Intelligence</div>
            </div>
            <div className="text-xs uppercase tracking-widest opacity-60">
              © 2026 — Built for scalable hiring
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}