ALTER TYPE "public"."application_status" ADD VALUE 'shortlisted';--> statement-breakpoint
CREATE TABLE "availability_slots" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"day_of_week" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" text PRIMARY KEY NOT NULL,
	"meeting_type_id" text NOT NULL,
	"attendee_name" text NOT NULL,
	"attendee_email" text NOT NULL,
	"date" timestamp NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meeting_types" (
	"id" text PRIMARY KEY NOT NULL,
	"host_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"duration" integer DEFAULT 30 NOT NULL,
	"description" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "applications" DROP CONSTRAINT "applications_job_id_job_listings_id_fk";
--> statement-breakpoint
ALTER TABLE "applications" DROP CONSTRAINT "applications_company_id_companies_id_fk";
--> statement-breakpoint
ALTER TABLE "applications" DROP CONSTRAINT "applications_applicant_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "applications" DROP CONSTRAINT "applications_resume_id_candidate_resumes_id_fk";
--> statement-breakpoint
ALTER TABLE "applications" DROP CONSTRAINT "applications_decided_by_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "applicant_user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "company_members" ALTER COLUMN "company_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "job_listings" ALTER COLUMN "company_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "full_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "location_city" text NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "current_role" text NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "experience_years" text NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "linkedin" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "portfolio" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "motivation" text NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "skills" text NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "education" jsonb;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "cv_url" text NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "cover_letter_url" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "cv_analysis_id" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "meeting_id" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "auto_handled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "terms_accepted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "recruiter_notes" text;--> statement-breakpoint
ALTER TABLE "job_listings" ADD COLUMN "agent_id" text;--> statement-breakpoint
ALTER TABLE "job_listings" ADD COLUMN "auto_orchestrate" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "availability_slots" ADD CONSTRAINT "availability_slots_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_meeting_type_id_meeting_types_id_fk" FOREIGN KEY ("meeting_type_id") REFERENCES "public"."meeting_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_types" ADD CONSTRAINT "meeting_types_host_id_user_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_listings" ADD CONSTRAINT "job_listings_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "company_id";--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "cover_letter";--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "resume_id";--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "answers";--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "decided_by_user_id";--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "decided_at";