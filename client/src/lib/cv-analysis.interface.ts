// CV/Resume Analysis Interface
// Converted from ContractAnalysis

// Red Flag (replaces Risk)
interface CriticalRedFlag {
  issue: string;
  description: string;
  recommendation?: string;
}

interface ModerateRedFlag {
  issue: string;
  description: string;
  mitigatingFactors?: string;
}

interface RedFlags {
  critical?: CriticalRedFlag[];
  moderate?: ModerateRedFlag[];
  minor?: string[];
}

// Skills (NEW for CV)
interface SkillCategory {
  category: string;
  skills: string[];
}

interface SkillGap {
  skill: string;
  criticality: "critical" | "high" | "medium" | "low";
  note?: string;
}

interface Skills {
  present?: SkillCategory[];
  gaps?: SkillGap[];
  technicalDepth?: string;
}

// Work History (NEW for CV)
interface WorkPosition {
  title: string;
  company: string;
  duration: string;
  relevance: "High" | "Medium" | "Low";
  keyAchievements?: string[];
}

interface WorkHistory {
  assessment: string;
  relevantExperience: string;
  yearsRelevant?: string;
  companyQuality: string;
  positions?: WorkPosition[];
}

// Education (NEW for CV)
interface Degree {
  degree: string;
  institution: string;
  year: string;
  relevance?: "High" | "Medium" | "Low";
}

interface Education {
  degrees?: Degree[];
  certifications?: string[];
  assessment?: string;
}

// Role Alignment (replaces Opportunity concept)
interface AlignmentStrength {
  area: string;
  description: string;
  evidence: string;
}

interface AlignmentGap {
  area: string;
  description: string;
  severity: "Critical" | "Moderate" | "Minor";
  canBeAddressed?: boolean;
  addressingStrategy?: string;
}

interface InterviewFocusArea {
  topic: string;
  priority: "High" | "Medium" | "Low";
  reasoning: string;
  suggestedQuestions?: string[];
}

interface RoleAlignment {
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
  strengths?: AlignmentStrength[];
  gaps?: AlignmentGap[];
  interviewFocusAreas?: InterviewFocusArea[];
  comprehensiveAssessment?: string;
}

// Compensation (adapted for CV context)
interface CompensationStructure {
  analysis: string;
  withinBudget: boolean;
  marketComparison?: string;
}

// Career Trajectory (NEW for CV)
interface CareerTrajectory {
  progression: string;
  trend: "Upward" | "Lateral" | "Downward" | "Stable";
  growthPattern: string;
  keyMilestones?: string[];
}

// Overview
interface Overview {
  candidateName?: string;
  currentRole?: string;
  currentCompany?: string;
  totalExperience?: string;
  industry?: string;
  location?: string;
  noticePeriod?: string;
  salaryExpectation?: string;
}

// Inputs
interface Inputs {
  cvSource?: string;
  dateReceived?: Date;
  pageCount?: number;
  jobCriteriaUsed?: string;
}

// Experience Match Score
interface ExperienceMatch {
  score: number;
}

// Main CVAnalysis interface
export interface CVAnalysis {
  userId: string;
  cvText: string;
  candidateName: string | null;
  currentRole: string | null;
  industry: string | null;
  redFlags?: RedFlags;
  roleAlignment?: RoleAlignment;
  summary: string;
  nextSteps?: string[];
  completenessScore: number;
  missingCriticalInfo: string[];
  overallScore: number;
  compensationStructure?: CompensationStructure;
  recommendation: "Strong Hire" | "Hire" | "Interview" | "Maybe" | "Pass";
  language: string;
  aiModel: string;
  id: string;
  createdAt: string;
  updatedAt: string;
  inputs?: Inputs;
  overview?: Overview;
  careerTrajectory?: CareerTrajectory;
  workHistory?: WorkHistory;
  experienceMatch?: ExperienceMatch;
  skills?: Skills;
  education?: Education;
}