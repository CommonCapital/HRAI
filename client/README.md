# HRAI — AI-Powered HR Orchestration Engine

HRAI is a modern recruitment automation platform designed to streamline the hiring process from application to interview. By leveraging AI-driven CV analysis and automated scheduling, HRAI enables recruiters to focus on talent while the engine handles the orchestration.

## 🚀 Key Features

### 🧠 AI Orchestration Engine
- **Automated CV Analysis**: Leveraging GPT-4o to analyze candidate resumes against specific job criteria and agent instructions.
- **Smart Screening**: Automatic "Strong Hire" / "Interview" threshold detection to trigger follow-up actions.
- **Pipeline Automation**: Seamlessly moves candidates from "Submitted" to "In Review" or "Shortlisted" based on AI recommendations.

### 📅 Advanced Scheduling System
- **Google Calendar Integration**: Direct OAuth 2.0 integration for real-time availability synchronization.
- **Google Meet Automation**: Automatic generation of unique meeting links for every scheduled interview.
- **Visual Availability Dashboard**: A powerful "drag-and-drop" calendar for recruiters to manage their weekly availability.
- **Public Booking Pages**: Professional, high-speed booking links for candidates to select times that work for both parties.

### 💼 Recruiter Dashboard
- **Modern Aesthetic**: High-contrast "Orange & White" premium design system optimized for speed and clarity.
- **Job Management**: Complete control over job listings, agent instructions, and auto-orchestration toggles.
- **Interactive Analytics**: Quick insights into application counts and candidate status.

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript / React 19
- **API layer**: tRPC (Type-safe RPC)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better-Auth with Google OAuth
- **State Management**: TanStack Query (React Query)
- **Styling**: Vanilla CSS with Design Tokens & Lucide Icons
- **AI/ML**: OpenAI GPT-4o for document extraction and analysis
- **Mailing**: Resend

## 📦 Project Structure

```text
src/
├── app/               # Next.js 15 App Router (Pages & API)
├── modules/           # Feature-driven module architecture
│   ├── jobs/          # Job management UI and logic
│   ├── scheduling/    # Calendar, booking, and Google integration
│   ├── candidates/    # CV analysis and AI services
│   ├── applications/  # Orchestration engine and pipeline logic
│   └── agents/        # AI Agent configuration
├── components/        # Shared UI components (Brutalist theme)
├── db/                # Drizzle schema and database configuration
├── lib/               # Shared utilities (Auth, Stream, etc.)
└── trpc/              # Type-safe API client and procedures
```

## 🛠 Setup & Installation

1. **Clone the repository**:
   ```bash
   git clone [repository-url]
   cd HRAI/client
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL=postgresql://...

   # Auth
   BETTER_AUTH_SECRET=...
   BETTER_AUTH_URL=http://localhost:3000
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # Google API (for Calendars/Meet)
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...

   # AI & Email
   OPENAI_API_KEY=...
   RESEND_API_KEY=...
   ```

4. **Synchronize Database**:
   ```bash
   npm run db:push
   ```

5. **Start Development Server**:
   ```bash
   npm run dev
   ```

## 📄 License

Internal Use Only — HRAI Proprietary Software.