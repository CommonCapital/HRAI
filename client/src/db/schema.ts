import { boolean, text, timestamp, pgTable, pgEnum, jsonb, integer } from "drizzle-orm/pg-core";
import { nanoid } from 'nanoid';


{/**Authorization */}
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});
export const agentTypeEnum = pgEnum("agent_type", ["active", "passive"]);
{/**Agents */}
export const agents = pgTable("agents", {
  id: text("id")
  .primaryKey()
  .$defaultFn(() => nanoid()),
  name: text("name").notNull(),
  userId: text("user_id")
  .notNull()
  .references(() => user.id, { onDelete: "cascade"}),
  agentType: agentTypeEnum("agent_type").notNull().default("active"),
  instructions: text("instructions").notNull(),
  instructions2: text("instructions2").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const meetingStatus = pgEnum("meeting_status", [
  "upcoming",
  "active",
  "completed",
  "processing",
  "cancelled",
]);

export const meetings = pgTable("meetings", {
  id: text("id")
  .primaryKey()
  .$defaultFn(() => nanoid()),
  name: text("name").notNull(),
  userId: text("user_id")
  .notNull()
  .references(() => user.id, { onDelete: "cascade"}),
  agentId: text("agent_id")
  .notNull()
  .references(() => agents.id, { onDelete: "cascade"}),
  // ✅ NEW: Optional reference to a CV analysis for HR interview context
  cvAnalysisId: text("cv_analysis_id")
    .references(() => cvAnalysis.id, { onDelete: "set null" }),
  status: meetingStatus("status").notNull().default("upcoming"),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  transcriptUrl: text("transcript_url"),
  recordingUrl: text("recording_url"),
  summary: text("summary"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});



// Update the enum for CV recommendations
export const recommendationEnum = pgEnum("recommendation", ["Strong Hire", "Hire", "Interview", "Maybe", "Pass"]);

// CVAnalysis table - stores CV/resume analysis results
export const cvAnalysis = pgTable("cv_analysis", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  cvText: text("cv_text").notNull(),
  candidateName: text("candidate_name"),
  currentRole: text("current_role"),
  industry: text("industry"),
  
  // All nested objects as JSONB to preserve structure
  inputs: jsonb("inputs").$type<{
    cvSource?: string;
    dateReceived?: Date;
    pageCount?: number;
    jobCriteriaUsed?: string;
  }>(),
  
  missingCriticalInfo: jsonb("missing_critical_info").$type<string[]>().notNull(),
  completenessScore: integer("completeness_score").notNull(),
  
  overview: jsonb("overview").$type<{
    candidateName?: string;
    currentRole?: string;
    currentCompany?: string;
    totalExperience?: string;
    industry?: string;
    location?: string;
    noticePeriod?: string;
    salaryExpectation?: string;
  }>(),
  
  careerTrajectory: jsonb("career_trajectory").$type<{
    progression: string;
    trend: "Upward" | "Lateral" | "Downward" | "Stable";
    growthPattern: string;
    keyMilestones?: string[];
  }>(),
  
  workHistory: jsonb("work_history").$type<{
    assessment: string;
    relevantExperience: string;
    yearsRelevant?: string;
    companyQuality: string;
    positions?: {
      title: string;
      company: string;
      duration: string;
      relevance: "High" | "Medium" | "Low";
      keyAchievements?: string[];
    }[];
  }>(),
  
  experienceMatch: jsonb("experience_match").$type<{
    score: number;
  }>(),
  
  skills: jsonb("skills").$type<{
    present?: {
      category: string;
      skills: string[];
    }[];
    gaps?: {
      skill: string;
      criticality: "critical" | "high" | "medium" | "low";
      note?: string;
    }[];
    technicalDepth?: string;
  }>(),
  
  education: jsonb("education").$type<{
    degrees?: {
      degree: string;
      institution: string;
      year: string;
      relevance?: "High" | "Medium" | "Low";
    }[];
    certifications?: string[];
    assessment?: string;
  }>(),
  
  redFlags: jsonb("red_flags").$type<{
    critical?: {
      issue: string;
      description: string;
      recommendation?: string;
    }[];
    moderate?: {
      issue: string;
      description: string;
      mitigatingFactors?: string;
    }[];
    minor?: string[];
  }>(),
  
  roleAlignment: jsonb("role_alignment").$type<{
    score: number;
    hiringRecommendation?: string;
    requirementsAssessment?: string;
    criticalGaps?: string[];
    keyTakeaways?: string[];
    
    experienceMatch?: {
      matches: boolean;
      candidateLevel: string;
      reasoning: string;
    };
    
    skillsMatch?: {
      matches: boolean;
      matchPercentage: number;
      reasoning: string;
    };
    
    seniorityMatch?: {
      appropriate: boolean;
      level: string;
      reasoning: string;
    };
    
    culturalFit?: {
      score: number;
      assessment: string;
    };
    
    strengths?: {
      area: string;
      description: string;
      evidence: string;
    }[];
    
    gaps?: {
      area: string;
      description: string;
      severity: "Critical" | "Moderate" | "Minor";
      canBeAddressed?: boolean;
      addressingStrategy?: string;
    }[];
    
    interviewFocusAreas?: {
      topic: string;
      priority: "High" | "Medium" | "Low";
      reasoning: string;
      suggestedQuestions?: string[];
    }[];
    
    comprehensiveAssessment?: string;
  }>(),
  
  compensation: jsonb("compensation").$type<{
    analysis: string;
    withinBudget: boolean;
    marketComparison?: string;
  }>(),
  
  nextSteps: jsonb("next_steps").$type<string[]>(),
   // AI Chat messages storage
 
messages: jsonb("messages").$type<any[]>(),
  recommendation: recommendationEnum("recommendation").notNull().default("Pass"),
  summary: text("summary").notNull(),
  overallScore: integer("overall_score").notNull(),
  
  aiModel: text("ai_model"),
  language: text("language"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// JobCriteria table - stores hiring manager's job requirements
export const jobCriteria = pgTable("job_criteria", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  jobTitle: text("job_title").notNull(),
  department: text("department"),
  requiredSkills: jsonb("required_skills").$type<string[]>(),
  preferredSkills: jsonb("preferred_skills").$type<string[]>(),
  experienceLevel: text("experience_level"), // "Entry", "Mid", "Senior", "Lead", "Executive"
  minYearsExperience: integer("min_years_experience"),
  maxYearsExperience: integer("max_years_experience"),
  industryExperience: jsonb("industry_experience").$type<string[]>(),
  minSalary: integer("min_salary").notNull(),
  maxSalary: integer("max_salary").notNull(),
  location: text("location"),
  remotePolicy: text("remote_policy"), // "On-site", "Hybrid", "Remote"
  educationRequirements: text("education_requirements"),
  certificationRequirements: jsonb("certification_requirements").$type<string[]>(),
  culturalFitCriteria: text("cultural_fit_criteria"),
  dealBreakers: text("deal_breakers"),
  customEvaluationCriteria: jsonb("custom_evaluation_criteria").$type<{
    question: string;
    importance: "Critical" | "Important" | "Nice-to-have";
    expectedAnswer?: string;
  }[]>(),
  criteriaWeights: jsonb("criteria_weights").$type<{
    experience: number;
    skills: number;
    education: number;
    culturalFit: number;
    leadership: number;
  }>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Demo Bookings Status Enum
export const demoStatusEnum = pgEnum("demo_status", [
  "pending",
  "contacted",
  "scheduled",
  "completed",
  "cancelled",
]);

// Demo Bookings table - stores demo requests
export const demoBookings = pgTable("demo_bookings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  jobTitle: text("job_title"),
  phoneNumber: text("phone_number"),
  companySize: text("company_size"), // "1-10", "11-50", "51-200", "201-500", "500+"
  message: text("message"),
  status: demoStatusEnum("status").notNull().default("pending"),
  preferredDate: timestamp("preferred_date"),
  scheduledDate: timestamp("scheduled_date"),
  notes: text("notes"), // Internal notes from sales team
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  referralSource: text("referral_source"), // "website", "linkedin", "google", "referral", etc.
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Add to your schema
export const processedWebhooks = pgTable("processed_webhooks", {
  webhookId: text("webhook_id").primaryKey(),
  eventType: text("event_type").notNull(),
  processedAt: timestamp("processed_at").defaultNow().notNull(),
});

export const employmentTypeEnum = pgEnum("employment_type", [
  "full_time",
  "part_time",
  "contract",
  "internship",
  "temporary",
]);

export const workplaceTypeEnum = pgEnum("workplace_type", [
  "on_site",
  "remote",
  "hybrid",
]);

export const applicationStatusEnum = pgEnum("application_status", [
  "submitted",
  "in_review",
  "accepted",
  "rejected",
  "withdrawn",
  "shortlisted"
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "application_status",
  "application_received",
  "job_closed",
  "system",
]);

export const companyMemberRoleEnum = pgEnum("company_member_role", [
  "owner",
  "admin",
  "recruiter",
  "member",
]);

// ─── Companies ────────────────────────────────────────────────────────────────
// No clerkOrgId — owned by a user directly via createdByUserId.
// companyMembers is kept for future multi-member support; for now only the
// creator is inserted with role "owner".

export const companies = pgTable("companies", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  name: text("name").notNull(),
  slug: text("slug").unique(),
  logoUrl: text("logo_url"),
  website: text("website"),
  description: text("description"),
  location: text("location"),
  createdByUserId: text("created_by_user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const companyMembers = pgTable(
  "company_members",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    companyId: text("company_id")
      
      .references(() => companies.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: companyMemberRoleEnum("role").notNull().default("member"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },

);

// ─── Candidate Profiles ───────────────────────────────────────────────────────

export const candidateProfiles = pgTable("candidate_profiles", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  headline: text("headline"),
  bio: text("bio"),
  summary: text("summary"),
  location: text("location"),
  phone: text("phone"),
  website: text("website"),
  linkedinUrl: text("linkedin_url"),
  githubUrl: text("github_url"),
  yearsExperience: integer("years_experience"),
  // Stored as a Postgres text array: ["React", "TypeScript", ...]
  skills: text("skills").array().notNull().default([]),
  openToWork: boolean("open_to_work").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const candidateExperiences = pgTable("candidate_experiences", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  company: text("company").notNull(),
  location: text("location"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  isCurrent: boolean("is_current").notNull().default(false),
  description: text("description"),
  // Used for drag-to-reorder on the profile page
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const candidateEducation = pgTable("candidate_education", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  school: text("school").notNull(),
  degree: text("degree"),
  fieldOfStudy: text("field_of_study"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  description: text("description"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const candidateCertifications = pgTable("candidate_certifications", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  issuingOrg: text("issuing_org").notNull(),
  issueDate: text("issue_date"),
  expirationDate: text("expiration_date"),
  credentialUrl: text("credential_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const candidateResumes = pgTable("candidate_resumes", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  // Direct file URL (S3 / R2 / Uploadthing — no Convex storageId needed)
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size"),
  contentType: text("content_type"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// ─── Job Listings ─────────────────────────────────────────────────────────────

export const jobListings = pgTable("job_listings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  companyId: text("company_id")
    
    .references(() => companies.id, { onDelete: "cascade" }),
    agentId:          text("agent_id").references(() => agents.id),  // nullable
autoOrchestrate:  boolean("auto_orchestrate").default(false),
  // Denormalized — avoids joining companies on every list query
  companyName: text("company_name").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  employmentType: employmentTypeEnum("employment_type").notNull(),
  workplaceType: workplaceTypeEnum("workplace_type").notNull(),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  salaryCurrency: text("salary_currency").default("USD"),
  // Postgres text[] — supports array containment operator @>
  tags: text("tags").array().notNull().default([]),
  // Concatenation of title + stripped description + location + companyName + tags.
  // Rebuilt on every create/update. Used for ILIKE search (no extra index needed).
  searchText: text("search_text").notNull().default(""),
  isActive: boolean("is_active").notNull().default(true),
  featured: boolean("featured").notNull().default(false),
  
  // ── autoCloseOnAccept ─────────────────────────────────────────────────────
  // When true: accepting any candidate triggers two side effects atomically
  // (inside a db.transaction in the tRPC router):
  //   1. The job is set to isActive = false + closedAt = now
  //   2. Every other submitted/in_review applicant receives a
  //      "job_closed" notification
  // Best for single-hire roles. Leave false for multi-hire positions.
  autoCloseOnAccept: boolean("auto_close_on_accept").notNull().default(false),
  // Denormalized counter — incremented on apply, no COUNT() needed on list views
  applicationCount: integer("application_count").notNull().default(0),
  postedByUserId: text("posted_by_user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  closedAt: timestamp("closed_at"),
});

// ─── Applications ─────────────────────────────────────────────────────────────

export const applicationNewColumns = {
  // ── Identity ───────────────────────────────────────────────────────────────
  fullName:       text("full_name"),          // required
  email:          text("email"),              // required
  phone:          text("phone"),              // optional
  locationCity:   text("location_city"),      // required  e.g. "Almaty, KZ"

  // ── Professional background ────────────────────────────────────────────────
  currentRole:    text("current_role"),       // "Senior Engineer at XYZ"
  experienceYears: text("experience_years"),  // "3-5"  (enum-like string)
  linkedin:       text("linkedin"),           // URL optional
  portfolio:      text("portfolio"),          // URL optional

  // ── Application details ────────────────────────────────────────────────────
  motivation:     text("motivation"),         // "Why this company?"  required
  skills:         text("skills"),             // free-text list        required
  education:      jsonb("education")          // EducationEntry[]      optional
                    .$type<Array<{
                      institution: string;
                      degree: string;
                      field: string;
                      graduationYear: string;
                    }>>(),

  // ── Documents ─────────────────────────────────────────────────────────────
  cvUrl:              text("cv_url"),          // required — uploaded PDF/doc
  coverLetterUrl:     text("cover_letter_url"), // optional

  // ── Consent ────────────────────────────────────────────────────────────────
  termsAccepted:  boolean("terms_accepted").default(false),

  // ── Recruiter notes (added by owner later) ─────────────────────────────────
  recruiterNotes: text("recruiter_notes"),
};

// ─────────────────────────────────────────────────────────────────────────────
// FULL TABLE REFERENCE — replace your existing applications table with this
// (keeping whatever columns you already had + the new ones above)
// ─────────────────────────────────────────────────────────────────────────────

export const applications = pgTable("applications", {
  id:               text("id").primaryKey().$defaultFn(() => nanoid()),
  jobId:            text("job_id").notNull(),        // FK → jobListings.id
  applicantUserId:  text("applicant_user_id"),       // nullable — public submissions have no account

  // Public form identity
  fullName:         text("full_name").notNull(),
  email:            text("email").notNull(),
  phone:            text("phone"),
  locationCity:     text("location_city").notNull(),

  // Professional background
  currentRole:      text("current_role").notNull(),
  experienceYears:  text("experience_years").notNull(), // "0-1" | "1-3" | "3-5" | "5-10" | "10+"
  linkedin:         text("linkedin"),
  portfolio:        text("portfolio"),

  // Application narrative
  motivation:       text("motivation").notNull(),
  skills:           text("skills").notNull(),
  education:        jsonb("education").$type<Array<{
                      institution: string;
                      degree: string;
                      field: string;
                      graduationYear: string;
                    }>>(),

  // Documents
  cvUrl:            text("cv_url").notNull(),
  coverLetterUrl:   text("cover_letter_url"),
cvAnalysisId: text("cv_analysis_id"),   // FK → cvAnalysis.id (after auto-analysis)
meetingId:    text("meeting_id"),        // FK → meetings.id (after auto-meeting)
autoHandled:  boolean("auto_handled").default(false), // was this auto-orchestrated?
  // Status & consent
  status:           applicationStatusEnum("status").default("submitted").notNull(),
  termsAccepted:    boolean("terms_accepted").default(false).notNull(),
  recruiterNotes:   text("recruiter_notes"),

  // Timestamps
  createdAt:        timestamp("created_at").defaultNow().notNull(),
  updatedAt:        timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});
// ─── Favorites ────────────────────────────────────────────────────────────────

export const favorites = pgTable(
  "favorites",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    jobId: text("job_id")
      .notNull()
      .references(() => jobListings.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },

);

// ─── Notifications ────────────────────────────────────────────────────────────

export const notifications = pgTable("notifications", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  linkUrl: text("link_url"),
  // Flexible JSON payload: { jobId, applicationId, status, ... }
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

// Existing
export type CVAnalysis = typeof cvAnalysis.$inferSelect;
export type NewCVAnalysis = typeof cvAnalysis.$inferInsert;
export type JobCriteria = typeof jobCriteria.$inferSelect;
export type NewJobCriteria = typeof jobCriteria.$inferInsert;
export type DemoBooking = typeof demoBookings.$inferSelect;
export type NewDemoBooking = typeof demoBookings.$inferInsert;

// New
export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type CompanyMember = typeof companyMembers.$inferSelect;
export type JobListing = typeof jobListings.$inferSelect;
export type NewJobListing = typeof jobListings.$inferInsert;
export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
export type Favorite = typeof favorites.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type CandidateProfile = typeof candidateProfiles.$inferSelect;
export type CandidateExperience = typeof candidateExperiences.$inferSelect;
export type CandidateEducation = typeof candidateEducation.$inferSelect;
export type CandidateCertification = typeof candidateCertifications.$inferSelect;
export type CandidateResume = typeof candidateResumes.$inferSelect;