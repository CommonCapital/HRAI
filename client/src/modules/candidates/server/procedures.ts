import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { db } from "@/db";
import { cvAnalysis, jobCriteria } from "@/db/schema";
import { TRPCError } from "@trpc/server";
import { desc, eq, getTableColumns } from "drizzle-orm";
import { z } from "zod";
import { deleteFile, storeFile } from "@/modules/candidates/services/file-storage";
import { analyzeCVWithAI, extractCandidateInfo, extractTextFromPDF } from "../services/ai.services";
import { sanitizeAnalysisData } from "../controllers/cv.controllers";

export const candidatesRouter = createTRPCRouter({
  getUserCVAnalyses: protectedProcedure.query(async ({ ctx }) => {
    try {
      // Get all columns except cvText (mimics Mongoose .select("-cvText"))
      const { cvText, ...selectFields } = getTableColumns(cvAnalysis);
      const analyses = await db
        .select(selectFields)
        .from(cvAnalysis)
        .where(eq(cvAnalysis.userId, ctx.auth.user.id))
        .orderBy(desc(cvAnalysis.createdAt));
      return analyses;
    } catch (error) {
      console.error(error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get CV analyses",
      });
    }
  }),

  getCVAnalysisById: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        console.log("🔍 Fetching CV analysis by ID:", input.id);
        console.log("   User ID:", ctx.auth.user.id);
        
        const analysis = await db
          .select()
          .from(cvAnalysis)
          .where(eq(cvAnalysis.id, input.id))
          .limit(1)
          .then(rows => rows[0]);

        if (!analysis) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "CV analysis not found",
          });
        }

        // Verify ownership
        if (analysis.userId !== ctx.auth.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have access to this CV analysis",
          });
        }

        console.log("✅ CV analysis found:", analysis.candidateName);
        return analysis;
        
      } catch (error) {
        console.error("❌ Error fetching CV analysis:", error);
        
        // Re-throw TRPCErrors as-is
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get CV analysis",
        });
      }
    }),

  deleteCVAnalysis: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        console.log("🗑️ Deleting CV analysis:", input.id);
        
        const analysis = await db
          .select()
          .from(cvAnalysis)
          .where(eq(cvAnalysis.id, input.id))
          .limit(1)
          .then(rows => rows[0]);

        if (!analysis) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "CV analysis not found",
          });
        }

        // Verify ownership
        if (analysis.userId !== ctx.auth.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to delete this CV analysis",
          });
        }

        await db
          .delete(cvAnalysis)
          .where(eq(cvAnalysis.id, input.id));

        console.log("✅ CV analysis deleted successfully");
        return { success: true };
        
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete CV analysis",
        });
      }
    }),
  
  analyzeCV: protectedProcedure
    .input(
      z.object({
        // File as base64 string or Buffer
        file: z.object({
          buffer: z.instanceof(Buffer).or(z.string()), // base64 or Buffer
          originalname: z.string(),
          size: z.number(),
        }),
        criteriaText: z.string().optional(),
        cvSource: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.auth.user;

      try {
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("🚀 STARTING CV/RESUME ANALYSIS");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("User ID:", user.id);
        console.log("File:", input.file.originalname);
        console.log("File size:", input.file.size, "bytes");

        // Convert base64 to Buffer if needed
        const fileBuffer = typeof input.file.buffer === 'string' 
          ? Buffer.from(input.file.buffer, 'base64')
          : input.file.buffer;

        const fileKey = `cv:${user.id}:${Date.now()}`;
        storeFile(fileKey, fileBuffer, 3600);

        // Extract PDF text
        console.log("📄 Extracting text from CV/Resume PDF...");
        const cvText = await extractTextFromPDF(fileKey);
        console.log("✅ CV text extracted:", cvText.length, "characters");

        // Fetch job criteria from database
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("🔍 FETCHING JOB CRITERIA FROM DATABASE...");
        
        const userJobCriteria = await db
          .select()
          .from(jobCriteria)
          .where(eq(jobCriteria.userId, user.id))
          .limit(1)
          .then(rows => rows[0]);

        const manualCriteria = input.criteriaText || "";
        let criteriaText = "";

        if (manualCriteria && manualCriteria.trim()) {
          console.log("✅ MANUAL JOB CRITERIA PROVIDED IN UPLOAD");
          console.log("   Using manual criteria from textarea");
          console.log("   Length:", manualCriteria.length, "characters");
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
              leadership: 5,
            },
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

        // Analyze with AI
        console.log("🤖 Calling AI analysis...");
        console.log("   Criteria:", criteriaText ? "Provided" : "Using defaults");

        let analysis = await analyzeCVWithAI(cvText, criteriaText);

        // Sanitize analysis data
        console.log("🧹 Sanitizing analysis data...");
        analysis = sanitizeAnalysisData(analysis);

        // Add defaults if missing
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

        // Count pages/sections
        const pageCount = (cvText.match(/--- PAGE \d+ ---/g) || []).length || 1;
        console.log("📊 Pages analyzed:", pageCount);

        // Save to database
        console.log("💾 Saving to database...");
        const [savedAnalysis] = await db
          .insert(cvAnalysis)
          .values({
            userId: user.id,
            cvText: cvText,
            candidateName: analysis.overview?.candidateName || candidateInfo.name || "Unknown",
            currentRole: candidateInfo.currentRole || analysis.overview?.currentRole || "Unknown",
            industry: candidateInfo.industry || "Unknown",

            inputs: {
              cvSource: input.cvSource || "Direct upload",
              dateReceived: new Date(),
              pageCount: pageCount,
              jobCriteriaUsed: manualCriteria
                ? manualCriteria
                : userJobCriteria
                ? `${userJobCriteria.jobTitle} - Custom Job Requirements`
                : "Standard job requirements",
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
              gaps: [],
            },
            
            compensation: analysis.compensation || {},
            nextSteps: analysis.nextSteps || [],
            
            recommendation: analysis.recommendation,
            summary: analysis.summary,
            overallScore: analysis.overallScore || 0,
            aiModel: "gpt-4o",
            language: "en",
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
          console.log("   Comprehensive Assessment:", analysis.roleAlignment?.comprehensiveAssessment
            ? `${analysis.roleAlignment.comprehensiveAssessment.length} characters`
            : "Not generated"
          );
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        }

        deleteFile(fileKey);

        console.log("✅ CV ANALYSIS COMPLETE!");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        return savedAnalysis;
      } catch (error: any) {
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.error("❌ ERROR IN CV ANALYSIS:");
        console.error(error);
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to analyze CV/resume",
          cause: error,
        });
      }
    }),
});