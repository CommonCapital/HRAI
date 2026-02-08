
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

// Update the enum to include "Invest"
export const verdictEnum = pgEnum("verdict", ["Strong Lead", "Track", "Pass", "Invest"]);

// PitchDeckAnalysis table - matches Mongoose IPitchDeckAnalysis exactly
export const pitchDeckAnalysis = pgTable("pitch_deck_analysis", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  deckText: text("deck_text").notNull(),
  companyName: text("company_name"),
  sector: text("sector"),
  
  // All nested objects as JSONB to preserve exact Mongoose structure
  inputs: jsonb("inputs").$type<{
    deckSource?: string;
    dateReceived?: Date;
    slideCount?: number;
    fundCriteriaUsed?: string;
  }>(),
  
  missingInputs: jsonb("missing_inputs").$type<{
    financial: string[];
    operational: string[];
    strategic: string[];
  }>(),
  
  overview: jsonb("overview").$type<{
    companyName?: string;
    sector?: string;
    product?: string;
    customerType?: string;
    revenueModel?: string;
    traction?: string;
    capitalNeed?: string;
    stage?: string;
    evidenceType?: "Evidence" | "Inference";
    slideReferences?: number[];
  }>(),
  
  problemDefinition: jsonb("problem_definition").$type<{
    analysis: string;
    isRealAndUrgent: boolean | null;
    marketAcknowledgment: string;
    slideReferences?: number[];
    evidenceType?: "Evidence" | "Inference";
  }>(),
  
  solution: jsonb("solution").$type<{
    evaluation: string;
    isBetterThanStatusQuo: boolean | null;
    valueCreationMechanism: string;
    slideReferences?: number[];
    evidenceType?: "Evidence" | "Inference";
  }>(),
  
  marketAnalysis: jsonb("market_analysis").$type<{
    tam: string;
    sam: string;
    som: string;
    accessibility: string;
    tamCalculationMethod: "Bottom-up" | "Top-down" | "Not provided";
    tamDriverTree?: string;
    slideReferences?: number[];
  }>(),
  
  validation: jsonb("validation").$type<{
    level: "Paid usage" | "Pilots" | "LOIs" | "Surveys" | "None";
    proofProvided: boolean;
    validationStrength: "Strong" | "Moderate" | "Weak" | "None";
    details: string;
    slideReferences?: number[];
  }>(),
  
  traction: jsonb("traction").$type<{
    metrics: string[];
    gaps: string[];
    slideReferences?: number[];
  }>(),
  
  businessModel: jsonb("business_model").$type<{
    contributionMargin?: string;
    paybackPeriod?: string;
    cacLtvRatio?: string;
    scalability: string;
    risks: string[];
    unitEconomicsComputable: boolean;
    missingForCalculation?: string[];
    slideReferences?: number[];
  }>(),
  
  team: jsonb("team").$type<{
    assessment: string;
    founderMarketFit: boolean | null;
    keyStrengths: string[];
    keyWeaknesses: string[];
    slideReferences?: number[];
  }>(),
  
  defensibility: jsonb("defensibility").$type<{
    moats: string[];
    vulnerabilities: string[];
    slideReferences?: number[];
  }>(),
  
  risks: jsonb("risks").$type<{
    tier1: {
      risk: string;
      severity: "High" | "Medium" | "Low";
      likelihood: "High" | "Medium" | "Low";
      impact: string;
      mitigation?: string;
      proofArtifactNeeded?: string;
    }[];
    tier2: {
      risk: string;
      severity: "High" | "Medium" | "Low";
      likelihood: "High" | "Medium" | "Low";
      impact: string;
      mitigation?: string;
      proofArtifactNeeded?: string;
    }[];
    tier3: {
      risk: string;
      severity: "High" | "Medium" | "Low";
      likelihood: "High" | "Medium" | "Low";
      impact: string;
      mitigation?: string;
      proofArtifactNeeded?: string;
    }[];
    tier4: {
      risk: string;
      severity: "High" | "Medium" | "Low";
      likelihood: "High" | "Medium" | "Low";
      impact: string;
      mitigation?: string;
      proofArtifactNeeded?: string;
    }[];
  }>(),
  
  criteriaAlignment: jsonb("criteria_alignment").$type<{
    sectorMatch: boolean;
    stageMatch: boolean;
    checkSizeMatch: boolean;
    geographyMatch: boolean;
    dealBreakersTriggered: string[];
  }>(),
  
  fundAlignment: jsonb("fund_alignment").$type<{
    score: number;
    sectorAnalysis?: {
      startupSector: string;
      matches: boolean;
      reasoning: string;
    };
    stageAnalysis?: {
      startupStage: string;
      matches: boolean;
      reasoning: string;
    };
    checkSizeAnalysis?: {
      amountNeeded: string;
      withinRange: boolean;
      reasoning: string;
    };
    geographyAnalysis?: {
      startupGeography: string;
      matches: boolean;
      reasoning: string;
    };
    strengths?: {
      criterion: string;
      howItFits: string;
      evidence: string;
    }[];
    gaps?: {
      criterion: string;
      howItFails: string;
      severity: "Critical" | "Moderate" | "Minor";
    }[];
    fundSpecificRisks?: {
      risk: string;
      reasoning: string;
      impact: "High" | "Medium" | "Low";
    }[];
    customCriteriaAnalysis?: {
      question: string;
      importance: "Critical" | "Important" | "Nice to have";
      score: number;
      assessment: string;
      meetsRequirement: boolean;
    }[];
    summaryReport?: string;
    investmentRecommendation?: string;
    keyTakeaways?: string[];
    capitalEfficiency?: string;
    pathToCashFlow?: string;
    alignment?: string;
    slideReferences?: number[];
  }>(),
  
  useOfFunds: jsonb("use_of_funds").$type<{
    clarity: string;
    milestones: string[];
    achievability: string;
    commentary: string;
    capitalToMilestones?: {
      amount: string;
      milestone: string;
      timeline: string;
      proofRequired: string;
    }[];
    slideReferences?: number[];
  }>(),
  
  returnPotential: jsonb("return_potential").$type<{
    potential10to20x: boolean | null;
    pathTo100MARR: string;
    timeToScale: string;
    exitScenarios: string[];
    slideReferences?: number[];
  }>(),
  
  missingCriticalInfo: jsonb("missing_critical_info").$type<string[]>().notNull(),
  dataQualityScore: integer("data_quality_score").notNull(),
  
  icMemo: jsonb("ic_memo").$type<{
    verdict: "Strong Lead" | "Track" | "Pass" | "Invest";
    summary: string;
    strengths: {
      point: string;
      evidenceTag: "Evidence" | "Inference";
      slideReferences: number[];
    }[];
    weaknesses: string[];
    dataNeededForReconsideration: string[];
  }>().notNull(),
  
  verdict: verdictEnum("verdict").notNull().default("Pass"),
  recommendation: text("recommendation").notNull(),
  overallScore: integer("overall_score").notNull(),
  
  aiModel: text("ai_model"),
  language: text("language"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// VCCriteria table - matches Mongoose IVCCriteria exactly
export const vcCriteria = pgTable("vc_criteria", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  fundName: text("fund_name").notNull(),
  preferredSectors: jsonb("preferred_sectors").$type<string[]>(),
  avoidedSectors: jsonb("avoided_sectors").$type<string[]>(),
  stages: jsonb("stages").$type<string[]>(),
  minCheckSize: integer("min_check_size").notNull(),
  maxCheckSize: integer("max_check_size").notNull(),
  geographicFocus: jsonb("geographic_focus").$type<string[]>(),
  keyFocusAreas: text("key_focus_areas"),
  dealBreakers: text("deal_breakers"),
  customEvaluationCriteria: jsonb("custom_evaluation_criteria").$type<{
    question: string;
    importance: "Critical" | "Important" | "Nice to have";
  }[]>(),
  criteriaWeights: jsonb("criteria_weights").$type<{
    marketSize: number;
    team: number;
    traction: number;
    product: number;
    businessModel: number;
  }>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Type exports
export type PitchDeckAnalysis = typeof pitchDeckAnalysis.$inferSelect;
export type NewPitchDeckAnalysis = typeof pitchDeckAnalysis.$inferInsert;
export type VCCriteria = typeof vcCriteria.$inferSelect;
export type NewVCCriteria = typeof vcCriteria.$inferInsert;