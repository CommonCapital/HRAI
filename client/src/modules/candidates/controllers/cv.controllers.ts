import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { cvAnalysis, jobCriteria } from "@/db/schema";
import { eq, desc, getTableColumns } from "drizzle-orm";
import { auth } from "@/lib/auth";
import {
  analyzeCVWithAI,
  extractCandidateInfo,
  extractTextFromPDF,
} from "@/modules/candidates/services/ai.services";
import { storeFile, deleteFile } from "@/modules/candidates/services/file-storage";

// NOTE: Next.js doesn't use multer - file uploads are handled via FormData
// File validation is done inline in the POST handler

// Helper function to sanitize AI response data to match schema
export function sanitizeAnalysisData(analysis: any) {
  // Convert objects to strings where schema expects strings
  if (analysis.overview) {
    if (typeof analysis.overview.totalExperience === 'object') {
      analysis.overview.totalExperience = JSON.stringify(analysis.overview.totalExperience);
    }
    if (typeof analysis.overview.industry === 'object') {
      analysis.overview.industry = JSON.stringify(analysis.overview.industry);
    }
    if (typeof analysis.overview.currentRole === 'object') {
      analysis.overview.currentRole = JSON.stringify(analysis.overview.currentRole);
    }
  }
  
  // Sanitize work history fields
  if (analysis.workHistory) {
    ['assessment', 'relevantExperience', 'companyQuality'].forEach(field => {
      if (typeof analysis.workHistory[field] === 'object') {
        analysis.workHistory[field] = JSON.stringify(analysis.workHistory[field]);
      }
    });
  }
  
  // Sanitize career trajectory
  if (analysis.careerTrajectory) {
    ['progression', 'growthPattern'].forEach(field => {
      if (typeof analysis.careerTrajectory[field] === 'object') {
        analysis.careerTrajectory[field] = JSON.stringify(analysis.careerTrajectory[field]);
      }
    });
  }
  
  return analysis;
}

// Detect and extract basic candidate info endpoint
export async function detectAndConfirmCandidateInfo(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user;
  const formData = await req.formData();
  const file = formData.get("cv") as File;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only pdf files are allowed" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileKey = `cv:${user.id}:${Date.now()}`;
    storeFile(fileKey, buffer, 3600);

    const cvText = await extractTextFromPDF(fileKey);
    const candidateInfo = await extractCandidateInfo(cvText);

    deleteFile(fileKey);

    return NextResponse.json({ candidateInfo });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to extract candidate info" }, { status: 500 });
  }
}

// Analyze CV endpoint
export async function analyzeCV(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user;
  const formData = await req.formData();
  const file = formData.get("cv") as File;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only pdf files are allowed" }, { status: 400 });
  }

  try {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🚀 STARTING CV/RESUME ANALYSIS");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("User ID:", user.id);
    console.log("File:", file.name);
    console.log("File size:", file.size, "bytes");

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileKey = `cv:${user.id}:${Date.now()}`;
    storeFile(fileKey, buffer, 3600);

    // Extract PDF text
    console.log("📄 Extracting text from CV/Resume PDF...");
    const cvText = await extractTextFromPDF(fileKey);
    console.log("✅ CV text extracted:", cvText.length, "characters");
    
    // 🔥 FETCH USER'S SAVED JOB CRITERIA FROM DATABASE
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔍 FETCHING JOB CRITERIA FROM DATABASE...");
    const userJobCriteria = await db
      .select()
      .from(jobCriteria)
      .where(eq(jobCriteria.userId, user.id))
      .limit(1)
      .then(rows => rows[0]);
    
    // ALSO CHECK FOR MANUAL CRITERIA FROM FORM
    const manualCriteria = formData.get("criteriaText") as string || "";
    
    let criteriaText = "";
    
    if (manualCriteria && manualCriteria.trim()) {
      console.log("✅ MANUAL JOB CRITERIA PROVIDED IN UPLOAD");
      console.log("   Using manual criteria from textarea");
      console.log("   Length:", manualCriteria.length, "characters");
      
      // Use manual criteria as-is (it's plain text)
      criteriaText = manualCriteria;
    } else if (userJobCriteria) {
      console.log("✅ JOB CRITERIA FOUND IN DATABASE!");
      console.log("   Job Title:", userJobCriteria.jobTitle);
      console.log("   Department:", userJobCriteria.department);
      console.log("   Required Skills:", userJobCriteria.requiredSkills?.join(", ") || "None");
      console.log("   Preferred Skills:", userJobCriteria.preferredSkills?.join(", ") || "None");
      console.log("   Experience Level:", userJobCriteria.experienceLevel);
      console.log("   Min Years Experience:", userJobCriteria.minYearsExperience);
      console.log("   Salary Range: $" + userJobCriteria.minSalary?.toLocaleString() + " - $" + userJobCriteria.maxSalary?.toLocaleString());
      console.log("   Location:", userJobCriteria.location);
      console.log("   Education Requirements:", userJobCriteria.educationRequirements || "None");
      console.log("   Custom Evaluation Questions:", userJobCriteria.customEvaluationCriteria?.length || 0);
      
      // Convert to JSON string for AI
      criteriaText = JSON.stringify({
        jobTitle: userJobCriteria.jobTitle,
        department: userJobCriteria.department,
        requiredSkills: userJobCriteria.requiredSkills || [],
        preferredSkills: userJobCriteria.preferredSkills || [],
        experienceLevel: userJobCriteria.experienceLevel,
        minYearsExperience: userJobCriteria.minYearsExperience || 0,
        maxYearsExperience: userJobCriteria.maxYearsExperience,
        minSalary: userJobCriteria.minSalary || 0,
        maxSalary: userJobCriteria.maxSalary || 0,
        location: userJobCriteria.location,
        remotePolicy: userJobCriteria.remotePolicy,
        educationRequirements: userJobCriteria.educationRequirements || "",
        certificationRequirements: userJobCriteria.certificationRequirements || [],
        industryExperience: userJobCriteria.industryExperience || [],
        culturalFitCriteria: userJobCriteria.culturalFitCriteria || "",
        dealBreakers: userJobCriteria.dealBreakers || "",
        customEvaluationCriteria: userJobCriteria.customEvaluationCriteria || [],
        criteriaWeights: userJobCriteria.criteriaWeights || {
          experience: 5,
          skills: 5,
          education: 5,
          culturalFit: 5,
          leadership: 5
        }
      });
      
      console.log("✅ Criteria converted to JSON string");
      console.log("   JSON length:", criteriaText.length, "characters");
    } else {
      console.log("⚠️  NO JOB CRITERIA PROVIDED");
      console.log("   Will use default job requirements");
    }
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    // Extract basic candidate info
    console.log("🔍 Extracting candidate information...");
    const candidateInfo = await extractCandidateInfo(cvText);
    console.log("✅ Candidate info extracted:");
    console.log("   Name:", candidateInfo.name || "Unknown");
    console.log("   Current Role:", candidateInfo.currentRole || "Unknown");
    console.log("   Industry:", candidateInfo.industry || "Unknown");

    // Analyze with AI - pass criteria text
    console.log("🤖 Calling AI analysis...");
    console.log("   Criteria:", criteriaText ? "Provided" : "Using defaults");
    
    let analysis = await analyzeCVWithAI(cvText, criteriaText);

    // Sanitize analysis data to match schema
    console.log("🧹 Sanitizing analysis data...");
    analysis = sanitizeAnalysisData(analysis);

    // Add defaults if missing (don't throw error)
    if (!analysis.recommendation) {
      console.log("⚠️  No recommendation from AI, using default");
      analysis.recommendation = "Pass";
    }
    if (!analysis.summary) {
      console.log("⚠️  No summary from AI, using default");
      analysis.summary = "Analysis completed - review details in all tabs";
    }
    if (!analysis.overallScore && analysis.overallScore !== 0) {
      console.log("⚠️  No overall score from AI, using default");
      analysis.overallScore = 50;
    }

    console.log("✅ AI analysis complete!");
    console.log("   Candidate:", analysis.overview?.candidateName || candidateInfo.name || "Unknown");
    console.log("   Recommendation:", analysis.recommendation);
    console.log("   Overall Score:", analysis.overallScore);
    console.log("   Role Alignment Score:", analysis.roleAlignment?.score || 0);
    console.log("   Experience Match Score:", analysis.experienceMatch?.score || 0);

    // Count pages
    const pageCount = (cvText.match(/--- PAGE \d+ ---/g) || []).length || 1;
    console.log("📊 Pages analyzed:", pageCount);

    // Save analysis with criteria info
    console.log("💾 Saving to database...");
    const [savedAnalysis] = await db
      .insert(cvAnalysis)
      .values({
        userId: user.id,
        cvText: cvText,
        candidateName: analysis.overview?.candidateName || candidateInfo.name || "Unknown",
        currentRole: candidateInfo.currentRole || analysis.overview?.currentRole || "Unknown",
        industry: candidateInfo.industry || analysis.overview?.industry || "Unknown",
        
        inputs: {
          cvSource: formData.get("cvSource") as string || "Direct upload",
          dateReceived: new Date(),
          pageCount: pageCount,
          jobCriteriaUsed: manualCriteria 
            ? manualCriteria
            : userJobCriteria 
            ? `${userJobCriteria.jobTitle} - Custom Job Requirements`
            : "Standard job requirements"
        },
        
        missingCriticalInfo: analysis.missingCriticalInfo || [],
        completenessScore: analysis.completenessScore || 0,
        
        overview: analysis.overview || {},
        careerTrajectory: analysis.careerTrajectory || {},
        workHistory: analysis.workHistory || {},
        experienceMatch: analysis.experienceMatch || { score: 0 },
        skills: analysis.skills || {},
        education: analysis.education || {},
        redFlags: analysis.redFlags || { 
          critical: [], 
          moderate: [], 
          minor: [] 
        },
        
        roleAlignment: analysis.roleAlignment || { 
          score: 0, 
          hiringRecommendation: "", 
          requirementsAssessment: "",
          strengths: [],
          gaps: []
        },
        
        compensation: analysis.compensation || {},
        nextSteps: analysis.nextSteps || [],
        
        recommendation: analysis.recommendation,
        summary: analysis.summary,
        overallScore: analysis.overallScore || 0,
        aiModel: "gpt-4o",
        language: "en"
      })
      .returning();

    console.log("✅ Analysis saved with ID:", savedAnalysis.id);
    
    if (userJobCriteria || manualCriteria) {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("📊 ROLE FIT SUMMARY:");
      console.log("   Experience Match:", analysis.roleAlignment?.experienceMatch?.matches ? "✅ YES" : "❌ NO");
      console.log("   Skills Match:", analysis.roleAlignment?.skillsMatch?.matches ? "✅ YES" : "❌ NO");
      console.log("   Seniority Match:", analysis.roleAlignment?.seniorityMatch?.appropriate ? "✅ YES" : "❌ NO");
      console.log("   Alignment Score:", analysis.roleAlignment?.score || 0, "/ 10");
      console.log("   Strengths:", analysis.roleAlignment?.strengths?.length || 0);
      console.log("   Gaps:", analysis.roleAlignment?.gaps?.length || 0);
      console.log("   Red Flags (Critical):", analysis.redFlags?.critical?.length || 0);
      console.log("   Red Flags (Moderate):", analysis.redFlags?.moderate?.length || 0);
      console.log("   Comprehensive Assessment:", analysis.roleAlignment?.comprehensiveAssessment ? 
        `${analysis.roleAlignment.comprehensiveAssessment.length} characters` : "Not generated");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    }

    deleteFile(fileKey);
    
    console.log("✅ CV ANALYSIS COMPLETE!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    
    return NextResponse.json(savedAnalysis);
  } catch (error: any) {
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("❌ ERROR IN CV ANALYSIS:");
    console.error(error);
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    return NextResponse.json({ 
      error: "Failed to analyze CV/resume",
      details: error.message 
    }, { status: 500 });
  }
}

// Get user CV analyses endpoint
export async function getUserCVAnalyses(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user;

  try {
    const { cvText, ...selectFields } = getTableColumns(cvAnalysis);
    
    const analyses = await db
      .select(selectFields)
      .from(cvAnalysis)
      .where(eq(cvAnalysis.userId, user.id))
      .orderBy(desc(cvAnalysis.createdAt));

    return NextResponse.json(analyses);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to get CV analyses" }, { status: 500 });
  }
}

// Get CV analysis by ID endpoint
export async function getCVAnalysisByID(req: NextRequest, analysisId: string) {
  const session = await auth.api.getSession({ headers: req.headers });
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user;

  try {
    const analysis = await db
      .select()
      .from(cvAnalysis)
      .where(eq(cvAnalysis.id, analysisId))
      .limit(1)
      .then(rows => rows[0]);

    if (!analysis) {
      return NextResponse.json({ error: "CV analysis not found" }, { status: 404 });
    }

    if (analysis.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to get CV analysis" }, { status: 500 });
  }
}