# HRAI — The AI-First Recruitment Orchestration Engine

HRAI is a high-performance recruitment platform that transforms hiring from a manual chore into an automated, merit-driven engine. By combining **GPT-4o CV Orchestration**, **Proactive Talent Discovery**, and **Strategic Batch Invitations**, HRAI ensures your team only spends time with the absolute best talent.

## 🚀 The Core Workflows

### 1. The Automated "Submission-to-Invite" Loop
*   **Instant Analysis**: Every candidate submission triggers a GPT-4o analysis that extracts skills, assesses experience, and assigns an **AI Score (0-100)**.
*   **CRM Sorting**: Candidates are instantly ranked in your dashboard from top-to-bottom based on their AI score—no manual screening required.
*   **Smart Deferral**: If a job has a deadline, invitations are intelligently held back to allow the full pool of talent to be evaluated.


### 2. Proactive Talent Discovery (AI-fetch)
*   **Pull from DB**: Instead of paying for new leads, recruiters can proactively scan their entire historical database for candidates matching a new role's specific requirements.
*   **Cross-Job Matching**: Rediscover "lost gems" who applied for previous roles but are a perfect fit for your current needs.

### 3. Strategic Deadline Batching
*   **Top-N Selection**: Once a job deadline is reached, the system automatically dispatches booking invitations only to the **Top N** ranked candidates.
*   **Automated Scheduling**: Candidates receive personalized links to book interviews via your **Google Meet-integrated** calendar.

---

## 🧠 Key Features

### 🧠 Intelligent Automation
- **Smart AI-autofill**: Recruiters can generate full job descriptions and AI Agent instructions from a simple title.
- **Candidate AI Assist**: Applicants can use AI to refine their motivation statements and skills based on the job requirements.
- **Full Orchestration**: Move candidates from "Applied" to "Interview Scheduled" with zero manual clicks.

### 📅 Advanced Scheduling
- **Google Calendar/Meet Sync**: Real-time availability sync and automatic unique meeting link generation.
- **Recruiter Dashboard**: High-speed availability management and a professional "Orange & White" glassmorphism UI.

---

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router) & React 19
- **API**: tRPC (Type-safe RPC) for seamless client-server communication.
- **Database**: PostgreSQL with Drizzle ORM.
- **Workflows**: Inngest for reliable, event-driven background processing and cron-jobs.
- **AI**: OpenAI GPT-4o for deep document extraction and merit-based ranking.
- **Auth**: Better-Auth with Google OAuth 2.0.

---

## 🛠 Setup & Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file with your `DATABASE_URL`, `OPENAI_API_KEY`, `RESEND_API_KEY`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and Google OAuth credentials.

3. **Synchronize Database**:
   ```bash
   npm run db:push
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

## 📄 License

MIT License