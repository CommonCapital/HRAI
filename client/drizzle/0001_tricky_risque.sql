CREATE TYPE IF NOT EXISTS "public"."agent_type" AS ENUM('active', 'passive');--> statement-breakpoint
CREATE TYPE IF NOT EXISTS "public"."application_status" AS ENUM('submitted', 'in_review', 'accepted', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TYPE IF NOT EXISTS "public"."company_member_role" AS ENUM('owner', 'admin', 'recruiter', 'member');--> statement-breakpoint
CREATE TYPE IF NOT EXISTS "public"."demo_status" AS ENUM('pending', 'contacted', 'scheduled', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE IF NOT EXISTS "public"."employment_type" AS ENUM('full_time', 'part_time', 'contract', 'internship', 'temporary');--> statement-breakpoint
CREATE TYPE IF NOT EXISTS "public"."notification_type" AS ENUM('application_status', 'application_received', 'job_closed', 'system');--> statement-breakpoint
CREATE TYPE IF NOT EXISTS "public"."recommendation" AS ENUM('Strong Hire', 'Hire', 'Interview', 'Maybe', 'Pass');--> statement-breakpoint
CREATE TYPE IF NOT EXISTS "public"."workplace_type" AS ENUM('on_site', 'remote', 'hybrid');--> statement-breakpoint
CREATE TABLE "applications" (
	"id" text PRIMARY KEY NOT NULL,
	"job_id" text NOT NULL,
	"company_id" text NOT NULL,
	"applicant_user_id" text NOT NULL,
	"status" "application_status" DEFAULT 'submitted' NOT NULL,
	"cover_letter" text,
	"resume_id" text,
	"answers" jsonb,
	"decided_by_user_id" text,
	"decided_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidate_certifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"issuing_org" text NOT NULL,
	"issue_date" text,
	"expiration_date" text,
	"credential_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidate_education" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"school" text NOT NULL,
	"degree" text,
	"field_of_study" text,
	"start_date" text,
	"end_date" text,
	"description" text,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidate_experiences" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"company" text NOT NULL,
	"location" text,
	"start_date" text NOT NULL,
	"end_date" text,
	"is_current" boolean DEFAULT false NOT NULL,
	"description" text,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidate_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"headline" text,
	"bio" text,
	"summary" text,
	"location" text,
	"phone" text,
	"website" text,
	"linkedin_url" text,
	"github_url" text,
	"years_experience" integer,
	"skills" text[] DEFAULT '{}' NOT NULL,
	"open_to_work" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "candidate_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "candidate_resumes" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"file_url" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size" integer,
	"content_type" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text,
	"logo_url" text,
	"website" text,
	"description" text,
	"location" text,
	"created_by_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "companies_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "company_members" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "company_member_role" DEFAULT 'member' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cv_analysis" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"cv_text" text NOT NULL,
	"candidate_name" text,
	"current_role" text,
	"industry" text,
	"inputs" jsonb,
	"missing_critical_info" jsonb NOT NULL,
	"completeness_score" integer NOT NULL,
	"overview" jsonb,
	"career_trajectory" jsonb,
	"work_history" jsonb,
	"experience_match" jsonb,
	"skills" jsonb,
	"education" jsonb,
	"red_flags" jsonb,
	"role_alignment" jsonb,
	"compensation" jsonb,
	"next_steps" jsonb,
	"messages" jsonb,
	"recommendation" "recommendation" DEFAULT 'Pass' NOT NULL,
	"summary" text NOT NULL,
	"overall_score" integer NOT NULL,
	"ai_model" text,
	"language" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "demo_bookings" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"company" text,
	"job_title" text,
	"phone_number" text,
	"company_size" text,
	"message" text,
	"status" "demo_status" DEFAULT 'pending' NOT NULL,
	"preferred_date" timestamp,
	"scheduled_date" timestamp,
	"notes" text,
	"ip_address" text,
	"user_agent" text,
	"referral_source" text,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"job_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_criteria" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"job_title" text NOT NULL,
	"department" text,
	"required_skills" jsonb,
	"preferred_skills" jsonb,
	"experience_level" text,
	"min_years_experience" integer,
	"max_years_experience" integer,
	"industry_experience" jsonb,
	"min_salary" integer NOT NULL,
	"max_salary" integer NOT NULL,
	"location" text,
	"remote_policy" text,
	"education_requirements" text,
	"certification_requirements" jsonb,
	"cultural_fit_criteria" text,
	"deal_breakers" text,
	"custom_evaluation_criteria" jsonb,
	"criteria_weights" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "job_criteria_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "job_listings" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"company_name" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"location" text NOT NULL,
	"employment_type" "employment_type" NOT NULL,
	"workplace_type" "workplace_type" NOT NULL,
	"salary_min" integer,
	"salary_max" integer,
	"salary_currency" text DEFAULT 'USD',
	"tags" text[] DEFAULT '{}' NOT NULL,
	"search_text" text DEFAULT '' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"auto_close_on_accept" boolean DEFAULT false NOT NULL,
	"application_count" integer DEFAULT 0 NOT NULL,
	"posted_by_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"link_url" text,
	"metadata" jsonb,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "processed_webhooks" (
	"webhook_id" text PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"processed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pitch_deck_analysis" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "vc_criteria" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "pitch_deck_analysis" CASCADE;--> statement-breakpoint
DROP TABLE "vc_criteria" CASCADE;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "agent_type" "agent_type" DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "cv_analysis_id" text;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_job_listings_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_applicant_user_id_user_id_fk" FOREIGN KEY ("applicant_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_resume_id_candidate_resumes_id_fk" FOREIGN KEY ("resume_id") REFERENCES "public"."candidate_resumes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_decided_by_user_id_user_id_fk" FOREIGN KEY ("decided_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_certifications" ADD CONSTRAINT "candidate_certifications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_education" ADD CONSTRAINT "candidate_education_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_experiences" ADD CONSTRAINT "candidate_experiences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_profiles" ADD CONSTRAINT "candidate_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_resumes" ADD CONSTRAINT "candidate_resumes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_members" ADD CONSTRAINT "company_members_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_members" ADD CONSTRAINT "company_members_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cv_analysis" ADD CONSTRAINT "cv_analysis_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_job_id_job_listings_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_criteria" ADD CONSTRAINT "job_criteria_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_listings" ADD CONSTRAINT "job_listings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_listings" ADD CONSTRAINT "job_listings_posted_by_user_id_user_id_fk" FOREIGN KEY ("posted_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_cv_analysis_id_cv_analysis_id_fk" FOREIGN KEY ("cv_analysis_id") REFERENCES "public"."cv_analysis"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
DROP TYPE "public"."verdict";