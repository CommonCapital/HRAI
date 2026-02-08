

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pitchDeckAnalysis, vcCriteria } from "@/db/schema";
import { eq, desc, getTableColumns } from "drizzle-orm";
import { auth } from "@/lib/auth";
import {
  analyzePitchDeckWithAI,
  detectDeckType,
  extractTextFromPDF,
} from "@/modules/contracts/services/ai.services";
import { storeFile, deleteFile } from "@/modules/contracts/services/file-storage";

// NOTE: Next.js doesn't use multer - file uploads are handled via FormData
// File validation is done inline in the POST handler

// Helper function to sanitize AI response data to match schema
export function sanitizeAnalysisData(analysis: any) {
  // Convert objects to strings where schema expects strings
  if (analysis.overview) {
    if (typeof analysis.overview.traction === 'object') {
      analysis.overview.traction = JSON.stringify(analysis.overview.traction);
    }
    if (typeof analysis.overview.sector === 'object') {
      analysis.overview.sector = JSON.stringify(analysis.overview.sector);
    }
    if (typeof analysis.overview.product === 'object') {
      analysis.overview.product = JSON.stringify(analysis.overview.product);
    }
  }
  
  // Sanitize any other potential object fields
  if (analysis.marketAnalysis) {
    ['tam', 'sam', 'som', 'accessibility'].forEach(field => {
      if (typeof analysis.marketAnalysis[field] === 'object') {
        analysis.marketAnalysis[field] = JSON.stringify(analysis.marketAnalysis[field]);
      }
    });
  }
  
  if (analysis.businessModel) {
    ['contributionMargin', 'paybackPeriod', 'cacLtvRatio', 'scalability'].forEach(field => {
      if (typeof analysis.businessModel[field] === 'object') {
        analysis.businessModel[field] = JSON.stringify(analysis.businessModel[field]);
      }
    });
  }
  
  return analysis;
}

// Detect contract type endpoint
export async function detectAndConfirmContractType(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user;
  const formData = await req.formData();
  const file = formData.get("contract") as File;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only pdf files are allowed" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileKey = `file:${user.id}:${Date.now()}`;
    storeFile(fileKey, buffer, 3600);

    const pdfText = await extractTextFromPDF(fileKey);
    const detectedType = await detectDeckType(pdfText);

    deleteFile(fileKey);

    return NextResponse.json({ detectedType });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to detect contract type" }, { status: 500 });
  }
}

// Analyze contract endpoint
export async function analyzeContract(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user;
  const formData = await req.formData();
  const file = formData.get("contract") as File;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only pdf files are allowed" }, { status: 400 });
  }

  try {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🚀 STARTING PITCH DECK ANALYSIS");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("User ID:", user.id);
    console.log("File:", file.name);
    console.log("File size:", file.size, "bytes");

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileKey = `file:${user.id}:${Date.now()}`;
    storeFile(fileKey, buffer, 3600);

    // Extract PDF text
    console.log("📄 Extracting text from PDF...");
    const pdfText = await extractTextFromPDF(fileKey);
    console.log("✅ PDF extracted:", pdfText.length, "characters");
    
    // 🔥 FETCH USER'S SAVED VC CRITERIA FROM DATABASE
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔍 FETCHING VC CRITERIA FROM DATABASE...");
    const userVcCriteria = await db
      .select()
      .from(vcCriteria)
      .where(eq(vcCriteria.userId, user.id))
      .limit(1)
      .then(rows => rows[0]);
    
    // ALSO CHECK FOR MANUAL CRITERIA FROM FORM
    const manualCriteria = formData.get("criteriaText") as string || "";
    
    let criteriaText = "";
    
    if (manualCriteria && manualCriteria.trim()) {
      console.log("✅ MANUAL CRITERIA PROVIDED IN UPLOAD");
      console.log("   Using manual criteria from textarea");
      console.log("   Length:", manualCriteria.length, "characters");
      
      // Use manual criteria as-is (it's plain text)
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
      
      // Convert to JSON string for AI
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
          businessModel: 5
        }
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

    // Analyze with AI - pass criteria text
    const tier = (user as any).isPremium ? "premium" : "free";
    console.log("🤖 Calling AI analysis...");
    console.log("   Tier:", tier);
    console.log("   Criteria:", criteriaText ? "Provided" : "Using defaults");
    
    let analysis = await analyzePitchDeckWithAI(pdfText, criteriaText);

    // Sanitize analysis data to match schema
    console.log("🧹 Sanitizing analysis data...");
    analysis = sanitizeAnalysisData(analysis);

    // Add defaults if missing (don't throw error)
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

    // Save analysis with criteria info
    console.log("💾 Saving to database...");
    const [savedAnalysis] = await db
      .insert(pitchDeckAnalysis)
      .values({
        userId: user.id,
        deckText: pdfText,
        companyName: analysis.overview?.companyName || "Unknown",
        sector: detectedSector,
        
        inputs: {
          deckSource: formData.get("deckSource") as string || "Direct upload",
          dateReceived: new Date(),
          slideCount: slideCount,
          fundCriteriaUsed: manualCriteria 
            ? "Manual criteria provided"
            : userVcCriteria 
            ? `${userVcCriteria.fundName} - Custom Investment Criteria`
            : "Default VC criteria"
        },
        
        missingInputs: analysis.missingInputs || {
          financial: [],
          operational: [],
          strategic: []
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
          alignment: "" 
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
          dataNeededForReconsideration: []
        },
        verdict: analysis.verdict,
        recommendation: analysis.recommendation,
        overallScore: analysis.overallScore || 0,
        aiModel: "gpt-4o",
        language: "en"
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
      console.log("   Summary Report:", analysis.fundAlignment?.summaryReport ? 
        `${analysis.fundAlignment.summaryReport.length} characters` : "Not generated");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    }

    deleteFile(fileKey);
    
    console.log("✅ ANALYSIS COMPLETE!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    
    return NextResponse.json(savedAnalysis);
  } catch (error: any) {
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("❌ ERROR IN ANALYSIS:");
    console.error(error);
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    return NextResponse.json({ 
      error: "Failed to analyze contract",
      details: error.message 
    }, { status: 500 });
  }
}

// Get user contracts endpoint
export async function getUserContracts(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user;

  try {
    const { deckText, ...selectFields } = getTableColumns(pitchDeckAnalysis);
    
    const contracts = await db
      .select(selectFields)
      .from(pitchDeckAnalysis)
      .where(eq(pitchDeckAnalysis.userId, user.id))
      .orderBy(desc(pitchDeckAnalysis.createdAt));

    return NextResponse.json(contracts);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to get contracts" }, { status: 500 });
  }
}

// Get contract by ID endpoint
export async function getContractByID(req: NextRequest, contractId: string) {
  const session = await auth.api.getSession({ headers: req.headers });
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user;

  try {
    const contract = await db
      .select()
      .from(pitchDeckAnalysis)
      .where(eq(pitchDeckAnalysis.id, contractId))
      .limit(1)
      .then(rows => rows[0]);

    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    if (contract.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(contract);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to get contract" }, { status: 500 });
  }
}