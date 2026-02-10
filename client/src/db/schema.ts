
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

{/**Agents */}
export const agents = pgTable("agents", {
  id: text("id")
  .primaryKey()
  .$defaultFn(() => nanoid()),
  name: text("name").notNull(),
  userId: text("user_id")
  .notNull()
  .references(() => user.id, { onDelete: "cascade"}),
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

// Type exports
export type CVAnalysis = typeof cvAnalysis.$inferSelect;
export type NewCVAnalysis = typeof cvAnalysis.$inferInsert;
export type JobCriteria = typeof jobCriteria.$inferSelect;
export type NewJobCriteria = typeof jobCriteria.$inferInsert;
export type DemoBooking = typeof demoBookings.$inferSelect;
export type NewDemoBooking = typeof demoBookings.$inferInsert;