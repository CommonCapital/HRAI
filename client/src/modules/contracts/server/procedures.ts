import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { db } from "@/db";
import { pitchDeckAnalysis, vcCriteria } from "@/db/schema";
import { TRPCError } from "@trpc/server";
import { desc, eq, getTableColumns } from "drizzle-orm";
import { z } from "zod";
import { deleteFile, storeFile } from "@/modules/contracts/services/file-storage";
import { analyzePitchDeckWithAI, detectDeckType, extractTextFromPDF } from "../services/ai.services";
import { sanitizeAnalysisData } from "../controllers/contract.controllers";

export const contractsRouter = createTRPCRouter({
 getUserContracts: protectedProcedure.query(async ({ ctx }) => {
    try {
// Get all columns except deckText (mimics Mongoose .select("-deckText"))
const { deckText, ...selectFields } = getTableColumns(pitchDeckAnalysis);
const contracts = await db
        .select(selectFields)
        .from(pitchDeckAnalysis)
        .where(eq(pitchDeckAnalysis.userId, ctx.auth.user.id))
        .orderBy(desc(pitchDeckAnalysis.createdAt));
return contracts;
    } catch (error) {
console.error(error);
throw new TRPCError({
code: "INTERNAL_SERVER_ERROR",
message: "Failed to get contracts",
      });
    }
  }),
  // Add this to your contractsRouter in src/modules/contracts/server/procedures.ts

getContractById: protectedProcedure
  .input(
    z.object({
      id: z.string(),
    })
  )
  .query(async ({ ctx, input }) => {
    try {
      console.log("🔍 Fetching contract by ID:", input.id);
      console.log("   User ID:", ctx.auth.user.id);
      
      const contract = await db
        .select()
        .from(pitchDeckAnalysis)
        .where(eq(pitchDeckAnalysis.id, input.id))
        .limit(1)
        .then(rows => rows[0]);

      if (!contract) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contract not found",
        });
      }

      // Verify ownership
      if (contract.userId !== ctx.auth.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this contract",
        });
      }

      console.log("✅ Contract found:", contract.companyName);
      return contract;
      
    } catch (error) {
      console.error("❌ Error fetching contract:", error);
      
      // Re-throw TRPCErrors as-is
      if (error instanceof TRPCError) {
        throw error;
      }
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get contract",
      });
    }
  }),
  deleteContract: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        console.log("🗑️ Deleting contract:", input.id);
        
        const contract = await db
          .select()
          .from(pitchDeckAnalysis)
          .where(eq(pitchDeckAnalysis.id, input.id))
          .limit(1)
          .then(rows => rows[0]);

        if (!contract) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Contract not found",
          });
        }

        // Verify ownership
        if (contract.userId !== ctx.auth.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to delete this contract",
          });
        }

        await db
          .delete(pitchDeckAnalysis)
          .where(eq(pitchDeckAnalysis.id, input.id));

        console.log("✅ Contract deleted successfully");
        return { success: true };
        
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete contract",
        });
      }
    }),
  
  analyzeContract: protectedProcedure
    .input(
      z.object({
        // File as base64 string or Buffer
        file: z.object({
          buffer: z.instanceof(Buffer).or(z.string()), // base64 or Buffer
          originalname: z.string(),
          size: z.number(),
        }),
        criteriaText: z.string().optional(),
        deckSource: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.auth.user;

      try {
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("🚀 STARTING PITCH DECK ANALYSIS");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("User ID:", user.id);
        console.log("File:", input.file.originalname);
        console.log("File size:", input.file.size, "bytes");

        // Convert base64 to Buffer if needed
        const fileBuffer = typeof input.file.buffer === 'string' 
          ? Buffer.from(input.file.buffer, 'base64')
          : input.file.buffer;

        const fileKey = `file:${user.id}:${Date.now()}`;
        storeFile(fileKey, fileBuffer, 3600);

        // Extract PDF text
        console.log("📄 Extracting text from PDF...");
        const pdfText = await extractTextFromPDF(fileKey);
        console.log("✅ PDF extracted:", pdfText.length, "characters");

        // Fetch VC criteria from database
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("🔍 FETCHING VC CRITERIA FROM DATABASE...");
        
        const userVcCriteria = await db
          .select()
          .from(vcCriteria)
          .where(eq(vcCriteria.userId, user.id))
          .limit(1)
          .then(rows => rows[0]);

        const manualCriteria = input.criteriaText || "";
        let criteriaText = "";

        if (manualCriteria && manualCriteria.trim()) {
          console.log("✅ MANUAL CRITERIA PROVIDED IN UPLOAD");
          console.log("   Using manual criteria from textarea");
          console.log("   Length:", manualCriteria.length, "characters");
          criteriaText = manualCriteria;
        } else if (userVcCriteria) {
          console.log("✅ VC CRITERIA FOUND IN DATABASE!");
          console.log("   Fund Name:", userVcCriteria.fundName);
          console.log("   Preferred Sectors:", userVcCriteria.preferredSectors?.join(", ") || "None");
          console.log("   Avoided Sectors:", userVcCriteria.avoidedSectors?.join(", ") || "None");
          console.log("   Target Stages:", userVcCriteria.stages?.join(", ") || "None");
          console.log("   Check Size Range: $" + userVcCriteria.minCheckSize?.toLocaleString() + " - $" + userVcCriteria.maxCheckSize?.toLocaleString());
          console.log("   Geographic Focus:", userVcCriteria.geographicFocus?.join(", ") || "None");
          console.log("   Custom Questions:", userVcCriteria.customEvaluationCriteria?.length || 0);

          criteriaText = JSON.stringify({
            fundName: userVcCriteria.fundName,
            preferredSectors: userVcCriteria.preferredSectors || [],
            avoidedSectors: userVcCriteria.avoidedSectors || [],
            targetStages: userVcCriteria.stages || [],
            minCheckSize: userVcCriteria.minCheckSize || 0,
            maxCheckSize: userVcCriteria.maxCheckSize || 0,
            geographicFocus: userVcCriteria.geographicFocus || [],
            keyFocusAreas: userVcCriteria.keyFocusAreas || "",
            dealBreakers: userVcCriteria.dealBreakers || "",
            customEvaluationCriteria: userVcCriteria.customEvaluationCriteria || [],
            criteriaWeights: userVcCriteria.criteriaWeights || {
              marketSize: 5,
              team: 5,
              traction: 5,
              product: 5,
              businessModel: 5,
            },
          });

          console.log("✅ Criteria converted to JSON string");
          console.log("   JSON length:", criteriaText.length, "characters");
        } else {
          console.log("⚠️  NO CRITERIA PROVIDED");
          console.log("   Will use default VC criteria");
        }
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        // Detect sector
        console.log("🔍 Detecting startup sector...");
        const detectedSector = await detectDeckType(pdfText);
        console.log("✅ Detected sector:", detectedSector);

        // Analyze with AI
       // const tier = user.isPremium ? "premium" : "free"; // Adjust based on your user schema
        console.log("🤖 Calling AI analysis...");
     //   console.log("   Tier:", tier);
        console.log("   Criteria:", criteriaText ? "Provided" : "Using defaults");

        let analysis = await analyzePitchDeckWithAI(pdfText, criteriaText);

        // Sanitize analysis data
        console.log("🧹 Sanitizing analysis data...");
        analysis = sanitizeAnalysisData(analysis);

        // Add defaults if missing
        if (!analysis.verdict) {
          console.log("⚠️  No verdict from AI, using default");
          analysis.verdict = "Pass";
        }
        if (!analysis.recommendation) {
          console.log("⚠️  No recommendation from AI, using default");
          analysis.recommendation = "Analysis completed - review details in all tabs";
        }
        if (!analysis.overallScore && analysis.overallScore !== 0) {
          console.log("⚠️  No overall score from AI, using default");
          analysis.overallScore = 50;
        }

        console.log("✅ AI analysis complete!");
        console.log("   Company:", analysis.overview?.companyName || "Unknown");
        console.log("   Verdict:", analysis.verdict);
        console.log("   Overall Score:", analysis.overallScore);
        console.log("   Fund Alignment Score:", analysis.fundAlignment?.score || 0);

        // Count slides
        const slideCount = (pdfText.match(/--- SLIDE \d+ ---/g) || []).length;
        console.log("📊 Slides analyzed:", slideCount);

        // Save to database
        console.log("💾 Saving to database...");
        const [savedAnalysis] = await db
          .insert(pitchDeckAnalysis)
          .values({
            userId: user.id,
            deckText: pdfText,
            companyName: analysis.overview?.companyName || "Unknown",
            sector: detectedSector,

            inputs: {
              deckSource: input.deckSource || "Direct upload",
              dateReceived: new Date(),
              slideCount: slideCount,
              fundCriteriaUsed: manualCriteria
                ? "Manual criteria provided"
                : userVcCriteria
                ? `${userVcCriteria.fundName} - Custom Investment Criteria`
                : "Default VC criteria",
            },

            missingInputs: analysis.missingInputs || {
              financial: [],
              operational: [],
              strategic: [],
            },
            overview: analysis.overview || {},
            problemDefinition: analysis.problemDefinition || {},
            solution: analysis.solution || {},
            marketAnalysis: analysis.marketAnalysis || {},
            validation: analysis.validation || {},
            traction: analysis.traction || {},
            businessModel: analysis.businessModel || {},
            team: analysis.team || {},
            defensibility: analysis.defensibility || {},
            risks: analysis.risks || { tier1: [], tier2: [], tier3: [], tier4: [] },
            criteriaAlignment: analysis.criteriaAlignment || {},
            fundAlignment: analysis.fundAlignment || {
              score: 0,
              capitalEfficiency: "",
              pathToCashFlow: "",
              alignment: "",
            },
            useOfFunds: analysis.useOfFunds || {},
            returnPotential: analysis.returnPotential || {},
            missingCriticalInfo: analysis.missingCriticalInfo || [],
            dataQualityScore: analysis.dataQualityScore || 0,
            icMemo: analysis.icMemo || {
              verdict: "Pass",
              summary: "",
              strengths: [],
              weaknesses: [],
              dataNeededForReconsideration: [],
            },
            verdict: analysis.verdict,
            recommendation: analysis.recommendation,
            overallScore: analysis.overallScore || 0,
            aiModel: "gpt-4o",
            language: "en",
          })
          .returning();

        console.log("✅ Analysis saved with ID:", savedAnalysis.id);

        if (userVcCriteria || manualCriteria) {
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          console.log("📊 FUND FIT SUMMARY:");
          console.log("   Sector Match:", analysis.fundAlignment?.sectorAnalysis?.matches ? "✅ YES" : "❌ NO");
          console.log("   Stage Match:", analysis.fundAlignment?.stageAnalysis?.matches ? "✅ YES" : "❌ NO");
          console.log("   Check Size Match:", analysis.fundAlignment?.checkSizeAnalysis?.withinRange ? "✅ YES" : "❌ NO");
          console.log("   Alignment Score:", analysis.fundAlignment?.score || 0, "/ 10");
          console.log("   Strengths:", analysis.fundAlignment?.strengths?.length || 0);
          console.log("   Gaps:", analysis.fundAlignment?.gaps?.length || 0);
          console.log("   Fund Risks:", analysis.fundAlignment?.fundSpecificRisks?.length || 0);
          console.log("   Summary Report:", analysis.fundAlignment?.summaryReport
            ? `${analysis.fundAlignment.summaryReport.length} characters`
            : "Not generated"
          );
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        }

        deleteFile(fileKey);

        console.log("✅ ANALYSIS COMPLETE!");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        return savedAnalysis;
      } catch (error: any) {
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.error("❌ ERROR IN ANALYSIS:");
        console.error(error);
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to analyze contract",
          cause: error,
        });
      }
    }),
});