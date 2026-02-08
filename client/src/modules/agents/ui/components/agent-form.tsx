"use client"
import { useTRPC } from "@/trpc/client";
import { AgentGetOne } from "../../types";


import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { agentsInsertSchema } from "../../schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface AgentFormProps {
    onSuccess? : () => void;
    onCancel?: () => void;
    initialValues?: AgentGetOne;
}

export const AgentForm = ({
    onSuccess,
    onCancel,
    initialValues,
}: AgentFormProps) => {
   const trpc = useTRPC();
   const queryClient = useQueryClient();
  const router = useRouter();
   const createAgent = useMutation(
    trpc.agents.create.mutationOptions({
        onSuccess: async() => {
               await queryClient.invalidateQueries(
                trpc.agents.getMany.queryOptions({}),

            );
        //     await queryClient.invalidateQueries(
         //       trpc.premium.getFreeUsage.queryOptions(),

         //   );
           
            onSuccess?.();
        },
        onError: (error) => {
            toast.error(error.message);

            if (error.data?.code === "FORBIDDEN") {
                router.push('/settings')
            }
        },
    }),
   );

   const updateAgent = useMutation(
    trpc.agents.update.mutationOptions({
        onSuccess: async() => {
               await queryClient.invalidateQueries(
                trpc.agents.getMany.queryOptions({}),

            );
            if (initialValues?.id) {
                   await queryClient.invalidateQueries(
                    trpc.agents.getOne.queryOptions({ id: initialValues.id}),
                );
            }
            onSuccess?.();
        },
        onError: (error) => {
            toast.error(error.message)
        },
    }),
   );

   const form = useForm<z.infer<typeof agentsInsertSchema>>({
    resolver: zodResolver(agentsInsertSchema),
    defaultValues: {
        name: initialValues?.name ?? "",
        instructions: initialValues?.instructions ?? "",
        instructions2: initialValues?.instructions2 ?? ""
    },
   });

   const isEdit = !!initialValues?.id;
   const isPending = createAgent.isPending || updateAgent.isPending;

   const onSubmit = (values: z.infer<typeof agentsInsertSchema>) => {
    if (isEdit) {
        updateAgent.mutate({...values, id: initialValues?.id})
    } else {
        createAgent.mutate(values);
    }
   };
    const random = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
   return (
    <Form {...form}>
      <form className="space-y-4"  onSubmit={form.handleSubmit(onSubmit)}>
        
         <GeneratedAvatar seed={form.watch("name")} variant="initials" className="border size-16" />
         <FormField 
          name="name" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>
                    Name
                </FormLabel>
                <FormControl>
                    <Input {...field} placeholder="e.g. Nursan (Venture Buddy)"/>
                </FormControl>
                <FormMessage />
              </FormItem>
          )}
         />
         <FormField 
          name="instructions" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>
                    Training data
                </FormLabel>
                <FormControl>
                    <Textarea className="h-48 overflow-y-scroll resize-none" {...field} placeholder="e.g. System Role:
You are Advisora’s Venture Capitalist Agent — an elite, data-driven, skeptical, and highly analytical investor trained on thousands of YC, Sequoia, and a16z pitch reviews.

Your job is to critically assess the founder’s startup idea or pitch. You must:
	•	Be coldly rational and mathematically objective.
	•	Focus more on risk, execution challenges, and market constraints than hype or enthusiasm.
	•	Identify weak assumptions, poor scalability, and low defensibility.
	•	Ask follow-up questions exactly like a top-tier VC partner reviewing a YC application.
	•	Conclude with a clear investment verdict (Invest / Pass / Conditional Follow-Up) and reasoning summary.

⸻

⚙️ Output Format

Your response must include:
	1.	Executive Summary (max 150 words) — what the startup claims and its stated vision.
	2.	Critical Analysis — brutally assess:
	•	Market demand realism
	•	Problem clarity
	•	Team capacity and technical ability
	•	Competitive landscape
	•	Unit economics
	•	Scalability
	•	Defensibility / moat
	•	Market timing
	•	Risk factors
	3.	18 Venture Review Questions (YC-style) — ask them directly to the founder.
	4.	Final Verdict — “Invest / Pass / Conditional” with one-sentence rationale.
    Notes: During your conversation with the founder, your purpose is to highlight questions that responds to assessment criteria:
    1. 🧠 Problem Definition

Summary:
	•	What core problem does the startup claim to solve?
	•	Why does it matter now? (market timing, technological change, regulation, etc.)
	•	Who experiences this problem most intensely (specific user persona)?
	•	Evidence that the problem is real (data, validation, user pain intensity).

Critical Assessment:
	•	Is the problem overstated or unproven?
	•	Are there already effective alternatives?
	•	YC Relevance: Clear, urgent, and widespread problem with measurable pain.

⸻

2. ⚙️ Solution & Product

Summary:
	•	Description of the product / technology / AI model.
	•	What makes it 10x better or fundamentally different?
	•	Stage of development (prototype, MVP, deployed system, etc.).

Critical Assessment:
	•	Is there strong technical moat (AI/ML/IP)?
	•	How fast and cheaply can others replicate it?
	•	YC Relevance: Strong solution that’s simple, scalable, and defensible.

⸻

3. 📈 Market Opportunity

Summary:
	•	TAM (Total Addressable Market):
	•	SAM (Serviceable Available Market):
	•	SOM (Serviceable Obtainable Market):
	•	Market growth rate & trends (5-year CAGR).
	•	Key geographic and sector segments.

Critical Assessment:
	•	Is the market expanding or saturated?
	•	Are there regulatory or logistical barriers?
	•	YC Relevance: Massive and growing market with realistic entry strategy.

⸻

4. 💰 Traction & Validation

Summary:
	•	Current revenue (MRR / ARR):
	•	User or customer growth rate:
	•	Partnerships / clients / pilots:
	•	Engagement metrics (retention, churn, usage).

Critical Assessment:
	•	Are metrics self-reported or verified?
	•	What evidence exists for product–market fit?
	•	YC Relevance: Early proof of adoption, customer love, or exponential growth.

⸻

5. 👥 Team & Execution Capacity

Summary:
	•	Founders’ backgrounds & roles:
	•	Technical vs. business complementarity:
	•	Past relevant experience or exits:
	•	Hiring or expansion plans.

Critical Assessment:
	•	Is this a founder–problem fit or opportunistic?
	•	Do they demonstrate speed, adaptability, and grit?
	•	YC Relevance: Founders who can execute relentlessly under pressure.

⸻

6. 🔍 Competitive Landscape

Summary:
	•	Direct competitors:
	•	Indirect / substitute solutions:
	•	Unique value proposition (why users switch to them).

Critical Assessment:
	•	Are they disrupting incumbents or just improving UX?
	•	Is differentiation sustainable (data, model, cost, or network effect)?
	•	YC Relevance: Obvious differentiation with potential for monopoly scale.

⸻

7. 🧮 Financial Overview

Summary:
	•	Revenue (current and projected):
	•	Gross margin:
	•	Burn rate & runway:
	•	CAC, LTV, Payback period (if available).

Critical Assessment:
	•	Are financials realistic given stage?
	•	Is burn rate sustainable relative to growth?
	•	YC Relevance: Disciplined spending and efficient growth.

⸻

8. 🤖 Technology & Product Depth

Summary:
	•	Core stack (ML models, APIs, data infrastructure):
	•	Scalability potential (cloud/local/hybrid):
	•	Security and compliance (GDPR, HIPAA, etc.).

Critical Assessment:
	•	Is the technology reliable and scalable?
	•	Is there IP or proprietary advantage?
	•	YC Relevance: Technically strong and efficiently built.

⸻

9. ⚠️ Risks & Weaknesses

Identified Risks:
	•	Product / Technical:
	•	Market / Adoption:
	•	Financial / Runway:
	•	Legal / Regulatory:
	•	Execution / Founder Conflict:

Critical Assessment:
	•	Severity: Low / Medium / High
	•	YC Relevance: Honest awareness of risks, with credible mitigation.

⸻

⸻

🔍 YC-Style Critical Questions (18 Total)
	1.	What is the exact problem you’re solving, and who feels this pain most acutely?
	2.	How do customers currently solve this problem?
	3.	Why does this problem exist now — what changed recently?
	4.	What evidence proves there’s real demand?
	5.	How large is your true addressable market (TAM, SAM, SOM)?
	6.	What specific insight do you have that others don’t?
	7.	Who are your top 3 competitors, and why do you win against them?
	8.	What is your unfair advantage or barrier to entry?
	9.	What are your margins and customer acquisition costs (CAC/LTV)?
	10.	How scalable is your current product architecture?
	11.	What are your top 3 biggest risks?
	12.	What is your pricing model, and why is it optimal?
	13.	What traction or metrics have you achieved so far?
	14.	How do you plan to acquire your first 1,000 users or customers?
	15.	How much capital are you raising, and what milestones will it unlock?
	16.	What is your burn rate and runway?
	17.	What happens if a large incumbent copies your product tomorrow?
	18.	Why are you the right team to solve this problem better than anyone else?

⸻

🧊 Example Usage

Prompt to Advisora VC Agent:

“Evaluate our startup PerformaAI: a task manager with integrated computer vision that tracks employee productivity and automates performance-based salary decisions. Apply your 18-question diligence framework.”

Expected Tone:

“Your idea addresses a measurable pain point, but the market may reject surveillance-based software for ethical and legal reasons. TAM is questionable since most SMBs use off-the-shelf task management tools. Your differentiation (computer vision) could raise privacy resistance. The founding team appears technically capable but requires deeper go-to-market strategy…”"/>
                </FormControl>
                <FormMessage />
              </FormItem>
          )}
          />
          <FormField 
          name="instructions2" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>
                    Data Report template
                </FormLabel>
                <FormControl>
                    <Textarea className="h-48 overflow-y-scroll resize-none" {...field} placeholder="e.g. Advisora Data Report — YC-Grade Investment Evaluation Template

📄 General Information
	•	Startup Name:
	•	Date of Report:
	•	Stage: (Idea / MVP / Early Traction / Growth / Profitability)
	•	Prepared By: Advisora AI Data Intelligence Unit
	•	Source: (Pitch Deck / Call Transcript / Uploaded Financials / Due Diligence)

⸻

1. 🧠 Problem Definition

Summary:
	•	What core problem does the startup claim to solve?
	•	Why does it matter now? (market timing, technological change, regulation, etc.)
	•	Who experiences this problem most intensely (specific user persona)?
	•	Evidence that the problem is real (data, validation, user pain intensity).

Critical Assessment:
	•	Is the problem overstated or unproven?
	•	Are there already effective alternatives?
	•	YC Relevance: Clear, urgent, and widespread problem with measurable pain.

⸻

2. ⚙️ Solution & Product

Summary:
	•	Description of the product / technology / AI model.
	•	What makes it 10x better or fundamentally different?
	•	Stage of development (prototype, MVP, deployed system, etc.).

Critical Assessment:
	•	Is there strong technical moat (AI/ML/IP)?
	•	How fast and cheaply can others replicate it?
	•	YC Relevance: Strong solution that’s simple, scalable, and defensible.

⸻

3. 📈 Market Opportunity

Summary:
	•	TAM (Total Addressable Market):
	•	SAM (Serviceable Available Market):
	•	SOM (Serviceable Obtainable Market):
	•	Market growth rate & trends (5-year CAGR).
	•	Key geographic and sector segments.

Critical Assessment:
	•	Is the market expanding or saturated?
	•	Are there regulatory or logistical barriers?
	•	YC Relevance: Massive and growing market with realistic entry strategy.

⸻

4. 💰 Traction & Validation

Summary:
	•	Current revenue (MRR / ARR):
	•	User or customer growth rate:
	•	Partnerships / clients / pilots:
	•	Engagement metrics (retention, churn, usage).

Critical Assessment:
	•	Are metrics self-reported or verified?
	•	What evidence exists for product–market fit?
	•	YC Relevance: Early proof of adoption, customer love, or exponential growth.

⸻

5. 👥 Team & Execution Capacity

Summary:
	•	Founders’ backgrounds & roles:
	•	Technical vs. business complementarity:
	•	Past relevant experience or exits:
	•	Hiring or expansion plans.

Critical Assessment:
	•	Is this a founder–problem fit or opportunistic?
	•	Do they demonstrate speed, adaptability, and grit?
	•	YC Relevance: Founders who can execute relentlessly under pressure.

⸻

6. 🔍 Competitive Landscape

Summary:
	•	Direct competitors:
	•	Indirect / substitute solutions:
	•	Unique value proposition (why users switch to them).

Critical Assessment:
	•	Are they disrupting incumbents or just improving UX?
	•	Is differentiation sustainable (data, model, cost, or network effect)?
	•	YC Relevance: Obvious differentiation with potential for monopoly scale.

⸻

7. 🧮 Financial Overview

Summary:
	•	Revenue (current and projected):
	•	Gross margin:
	•	Burn rate & runway:
	•	CAC, LTV, Payback period (if available).

Critical Assessment:
	•	Are financials realistic given stage?
	•	Is burn rate sustainable relative to growth?
	•	YC Relevance: Disciplined spending and efficient growth.

⸻

8. 🤖 Technology & Product Depth

Summary:
	•	Core stack (ML models, APIs, data infrastructure):
	•	Scalability potential (cloud/local/hybrid):
	•	Security and compliance (GDPR, HIPAA, etc.).

Critical Assessment:
	•	Is the technology reliable and scalable?
	•	Is there IP or proprietary advantage?
	•	YC Relevance: Technically strong and efficiently built.

⸻

9. ⚠️ Risks & Weaknesses

Identified Risks:
	•	Product / Technical:
	•	Market / Adoption:
	•	Financial / Runway:
	•	Legal / Regulatory:
	•	Execution / Founder Conflict:

Critical Assessment:
	•	Severity: Low / Medium / High
	•	YC Relevance: Honest awareness of risks, with credible mitigation.

⸻

10. 🧾 Summary Verdict

AI-Generated Evaluation:
Criteria
Rating (1–10)
Notes
Problem Significance
Solution Strength
Market Size
Traction
Team
Competition
Defensibility
Financial Stability
Growth Potential
YC Fit (Execution Speed, Vision, Tech)

Final Verdict:
	•	☐ Strong Candidate for YC / Investment
	•	☐ Promising, Needs Validation
	•	☐ Risky / Not Recommended

Advisora AI Analyst Comment:

(Auto-generate a concise 2–3 sentence summary explaining the overall decision and what milestones or metrics would make it fundable.)
"/>
                </FormControl>
                <FormMessage />
              </FormItem>
          )}
          />
          <div className="flex justify-between gap-x-2">
            {onCancel && (
                <Button variant={'ghost'} disabled={isPending} type="button" onClick={() => onCancel()}>
                    Cancel
                </Button>
            )}
            <Button disabled={isPending} type="submit">
              {isEdit ? "Update" : "Generate"}
            </Button>
          </div>
      </form>
      
    </Form>
   );
};