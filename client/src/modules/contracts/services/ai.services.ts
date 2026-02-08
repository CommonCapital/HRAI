
import OpenAI from "openai";
import { getFile } from "@/modules/contracts/services/file-storage";
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// HELPER: Retry logic for API calls
async function callOpenAIWithRetry(requestFn: () => Promise<any>, maxRetries = 3): Promise<any> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error: any) {
      if (attempt === maxRetries) throw error;
      
      if (error.status === 429 || error.status >= 500) {
        const waitTime = 1000 * attempt;
        console.log(`⚠️  API error (${error.status}), retrying in ${waitTime}ms (${attempt}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        throw error;
      }
    }
  }
}

// HELPER: Calculate confidence score
function calculateConfidenceScore(analysis: any): number {
  let score = 100;
  
  // Penalize missing critical fields
  if (!analysis.overview.companyName || analysis.overview.companyName.includes("not in deck")) score -= 20;
  if (!analysis.marketAnalysis.tam || analysis.marketAnalysis.tam.includes("Not provided")) score -= 15;
  if (!analysis.marketAnalysis.sam || analysis.marketAnalysis.sam.includes("Not provided")) score -= 10;
  if (!analysis.traction.metrics || analysis.traction.metrics.length === 0) score -= 15;
  if (!analysis.team.assessment || analysis.team.assessment.includes("Not provided")) score -= 10;
  
  // Penalize template text (AI didn't replace instructions)
  const jsonStr = JSON.stringify(analysis);
  if (jsonStr.includes("🔥") || jsonStr.includes("EXTRACT FROM")) score -= 30;
  
  return Math.max(0, score);
}

// Vision-enhanced PDF extraction with pdf-parse + Poppler
export const extractTextFromPDF = async (fileKey: string) => {
  let totalCost = 0;
  
  try {
    const fileData = getFile(fileKey);
    if (!fileData) {
      throw new Error("File not found");
    }

    console.log("📄 Extracting text from PDF...");
    
    // Write to temp file
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-'));
    const pdfPath = path.join(tmpDir, 'input.pdf');
    fs.writeFileSync(pdfPath, Buffer.from(fileData));
    
    // Use pdftotext from Poppler (you already have it installed)
    const textOutput = execSync(`pdftotext "${pdfPath}" -`, { encoding: 'utf-8' });
    
    // Get page count
    const infoOutput = execSync(`pdfinfo "${pdfPath}"`, { encoding: 'utf-8' });
    const pageMatch = infoOutput.match(/Pages:\s+(\d+)/);
    const numPages = pageMatch ? parseInt(pageMatch[1]) : 1;
    
    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
    
    const totalChars = textOutput.length;
    
    console.log("   Total pages:", numPages);
    console.log("   Text extracted:", totalChars, "characters");
    
    // Format with slide markers
    let text = "";
    const pages = textOutput.split('\f');
    
    for (let i = 0; i < pages.length; i++) {
      text += `\n━━━ SLIDE ${i + 1} START ━━━\n`;
      text += pages[i].trim() + "\n";
      text += `━━━ SLIDE ${i + 1} END ━━━\n`;
    }
    
    const avgCharsPerPage = totalChars / numPages;
    
    if (avgCharsPerPage < 50 && numPages > 5) {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("⚠️  LOW TEXT EXTRACTION DETECTED!");
      console.log("   Average chars/page:", Math.round(avgCharsPerPage));
      console.log("   This PDF is likely image-based");
      console.log("🔍 ACTIVATING VISION MODE WITH POPPLER...");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      
      try {
        const pagesToProcess = Math.min(numPages, 25);
        
        console.log(`📸 Converting ${pagesToProcess} pages to images using Poppler...`);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        
        // Write PDF to a temp file
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-'));
        const pdfPath = path.join(tmpDir, 'input.pdf');
        fs.writeFileSync(pdfPath, Buffer.from(fileData));

        const outputPrefix = path.join(tmpDir, 'page');

        // Convert PDF pages to PNGs using Poppler
        execSync(`pdftoppm -png -r 200 -f 1 -l ${pagesToProcess} "${pdfPath}" "${outputPrefix}"`);

        // Read and encode images to base64
        const imageFiles = fs.readdirSync(tmpDir)
          .filter((f) => f.startsWith('page') && f.endsWith('.png'))
          .sort();

        const images: string[] = [];
        console.log("📊 PROGRESS TRACKING:");

        for (let i = 0; i < imageFiles.length; i++) {
          const imgBuffer = fs.readFileSync(path.join(tmpDir, imageFiles[i]));
          images.push(imgBuffer.toString('base64'));

          const progress = Math.round(((i + 1) / imageFiles.length) * 100);
          console.log(`   [${progress}%] Page ${i + 1}/${imageFiles.length} encoded`);
        }

        // Cleanup temp files
        fs.rmSync(tmpDir, { recursive: true, force: true });

        console.log(`   ✓ Converted ${images.length} pages to images`);
        
        const visionCost = images.length * 0.00255;
        totalCost += visionCost;
        
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("📤 Sending to GPT-4o Vision API...");
        console.log(`   Images: ${images.length}`);
        console.log(`   Vision cost: $${visionCost.toFixed(4)}`);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        
        // Build Vision API request
        const visionContent: any[] = [
          {
            type: "text",
            text: `Extract ALL text from these ${images.length} pitch deck slides.

Format your response EXACTLY like this:

━━━ SLIDE 1 START ━━━
[All text from slide 1]
━━━ SLIDE 1 END ━━━

━━━ SLIDE 2 START ━━━
[All text from slide 2]
━━━ SLIDE 2 END ━━━

Extract EVERY word and number. Don't summarize.`
          }
        ];
        
        // Add all images
        images.forEach((base64) => {
          visionContent.push({
            type: "image_url",
            image_url: {
              url: `data:image/png;base64,${base64}`,
              detail: "high"
            }
          });
        });
        
        // Call Vision API with retry logic
        const visionResponse = await callOpenAIWithRetry(() =>
          openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: visionContent }],
            max_tokens: 16000,
            temperature: 0.1
          })
        );
        
        const visionText = visionResponse.choices[0].message.content || "";
        
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("✅ VISION EXTRACTION COMPLETE");
        console.log("   Extracted:", visionText.length, "characters");
        console.log("   Original:", totalChars, "characters");
        console.log("   Improvement:", Math.round((visionText.length / Math.max(totalChars, 1)) * 100), "%");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        
        if (visionText.length > totalChars * 1.5) {
          console.log("✅ Using Vision extraction (much better!)");
          return visionText;
        } else {
          console.log("⚠️  Vision didn't improve extraction significantly, using original");
        }
        
      } catch (visionError: any) {
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("❌ VISION EXTRACTION FAILED");
        console.log("   Error:", visionError.message || visionError);
        
        if (visionError.message?.includes("pdftoppm")) {
          console.log("");
          console.log("💡 SOLUTION:");
          console.log("   Install Poppler: brew install poppler");
          console.log("");
        } else if (visionError.status === 429) {
          console.log("   Rate limit hit. Try again in a few minutes.");
        } else if (visionError.status === 400) {
          console.log("   Image format issue. PDF may be corrupted.");
        }
        
        console.log("⚠️  Falling back to text extraction");
        
        if (totalChars < 1000) {
          console.log("⚠️⚠️⚠️ WARNING: Analysis quality will be significantly reduced!");
          console.log("   Only", totalChars, "chars extracted from", numPages, "pages");
        }
        
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      }
    }
    
    console.log("✅ Text extraction complete");
    console.log(`💰 Extraction cost: $${totalCost.toFixed(4)}`);
    
    return text;
    
  } catch (error) {
    console.log(error);
    throw new Error("Failed to extract text from PDF");
  }
};

export const detectDeckType = async (deckText: string): Promise<string> => {
  const prompt = `What sector is this company in? Reply with ONLY the sector name (e.g., "FinTech", "HealthTech", "B2B SaaS").

${deckText.substring(0, 2000)}`;

  const completion = await callOpenAIWithRetry(() =>
    openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    })
  );

  return completion.choices[0].message.content?.trim() || "Not specified";
};

export const analyzePitchDeckWithAI = async (
  deckText: string,
  criteriaText: string = ""
): Promise<any> => {
  let totalCost = 0.0001; // Sector detection cost
  
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🤖 AI ANALYSIS STARTING");
  
  console.log("Criteria Text Received:", criteriaText ? "✅ YES" : "❌ NO");
  
  let vcCriteria: any = null;
  if (criteriaText?.trim()) {
    try {
      vcCriteria = JSON.parse(criteriaText);
      console.log("✅ Criteria parsed as JSON");
    } catch {
      console.log("⚠️  Criteria is not JSON, treating as raw text");
      vcCriteria = { rawText: criteriaText };
    }
  }
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  let criteriaPrompt = "";
  if (vcCriteria?.fundName) {
    criteriaPrompt = `\n\n🎯 INVESTOR: ${vcCriteria.fundName}
Sectors: ${vcCriteria.preferredSectors?.join(', ') || 'Any'}
Stages: ${vcCriteria.targetStages?.join(', ') || 'Any'}
Check: $${vcCriteria.minCheckSize?.toLocaleString()}-$${vcCriteria.maxCheckSize?.toLocaleString()}`;
  } else if (criteriaText) {
    criteriaPrompt = `\n\nINVESTOR CRITERIA:\n${criteriaText}`;
  }

  // 🔥 NUCLEAR PROMPT - FORCES EXTRACTION
  const systemPrompt = `You are a VC analyst extracting data from pitch decks.

🚨 CRITICAL RULES - FOLLOW EXACTLY 🚨

1. YOU MUST EXTRACT ACTUAL DATA FROM THE DECK
2. NEVER WRITE "Not provided" OR "Unknown" 
3. IF DATA EXISTS IN DECK, YOU MUST FIND IT
4. ALWAYS CITE SLIDES: [Slide X]

YOU WILL BE PENALIZED FOR:
❌ Writing "Not provided"
❌ Missing TAM/SAM/SOM when they exist
❌ Missing company name
❌ Missing metrics
❌ Not citing slides

EXTRACTION TARGETS:
✓ Company name (Slide 1-2)
✓ TAM/SAM/SOM (Slides 3-8, look for "$" and "B" or "M")
✓ Metrics (Slides 6-10, look for numbers, revenue, users, growth)
✓ Team info (Slides 8-12)
✓ Stage/funding ask (Last 3 slides)`;

  const userPrompt = `PITCH DECK TEXT:
${deckText}
${criteriaPrompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔥🔥🔥 MANDATORY EXTRACTION CHECKLIST 🔥🔥🔥
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

READ EVERY SLIDE CAREFULLY AND EXTRACT:

1️⃣ COMPANY NAME (Slide 1-2):
   ❌ WRONG: "Not provided"
   ✅ RIGHT: "SocialPet" [Slide 1]

2️⃣ SECTOR:
   ❌ WRONG: "Not provided"
   ✅ RIGHT: "Consumer Social - Pet Tech"

3️⃣ PRODUCT:
   ❌ WRONG: "Not provided"
   ✅ RIGHT: "Social network for pet owners to share photos"

4️⃣ TAM (Total Addressable Market):
   🔍 CHECK SLIDES 3-8 FOR: "$500B", "$25B", "Total Market"
   ❌ WRONG: "Not provided"
   ✅ RIGHT: "$500 Billion [Slide 4]"

5️⃣ SAM (Serviceable Addressable Market):
   🔍 USUALLY SAME SLIDE AS TAM
   ❌ WRONG: "Not provided"
   ✅ RIGHT: "$75 Billion [Slide 4]"

6️⃣ SOM (Serviceable Obtainable Market):
   🔍 USUALLY SAME SLIDE AS TAM/SAM
   ❌ WRONG: "Not provided"
   ✅ RIGHT: "Not calculated yet [Slide 4]" OR "$5M in year 3 [Slide 4]"

7️⃣ TRACTION METRICS:
   🔍 CHECK SLIDES 6-10 FOR: downloads, users, revenue, growth, customers
   ❌ WRONG: []
   ✅ RIGHT: ["10,000 downloads [Slide 8]", "$0 revenue [Slide 8]", "2% MAU [Slide 8]"]

8️⃣ REVENUE MODEL:
   ❌ WRONG: "Not provided"
   ✅ RIGHT: "Freemium with $4.99/month subscription [Slide 5]"

9️⃣ STAGE:
   ❌ WRONG: "Not provided"
   ✅ RIGHT: "Pre-seed" OR "Series A"

🔟 FUNDING ASK:
   🔍 CHECK LAST 3-5 SLIDES
   ❌ WRONG: "Not provided"
   ✅ RIGHT: "$5M Series A [Slide 12]" OR "Not specified in deck"

1️⃣1️⃣ TEAM:
   🔍 CHECK SLIDES 8-12 FOR: names, titles, backgrounds
   ❌ WRONG: "Not provided"
   ✅ RIGHT: "Bob Smith (CEO, Business Major), Alice Jones (COO) [Slide 10]"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NOW RESPOND WITH THIS JSON STRUCTURE:

{
  "overview": {
    "companyName": "🔥 EXTRACT FROM SLIDE 1-2 - NEVER 'Not provided'",
    "sector": "🔥 IDENTIFY SECTOR - Be specific: 'Consumer Social', 'B2B SaaS', etc.",
    "product": "🔥 WHAT DO THEY BUILD? Extract from slides 2-4",
    "customerType": "B2B or B2C",
    "revenueModel": "🔥 HOW DO THEY MAKE MONEY? Check slides 4-6",
    "traction": "🔥 CRITICAL: List ALL metrics: '10K users, $0 revenue, 2% engagement' [Slide X]",
    "capitalNeed": "🔥 FUNDING ASK - Check last slides: '$5M Series A' [Slide X]",
    "stage": "Pre-seed, Seed, Series A, etc."
  },
  
  "marketAnalysis": {
    "tam": "🔥🔥🔥 CRITICAL! Check slides 3-8 for TAM. Format: '$500B - Pet industry [Slide 4]'. If you see a number with 'B' or 'Billion', EXTRACT IT!",
    "sam": "🔥🔥🔥 CRITICAL! Usually same slide as TAM. Format: '$75B - App users [Slide 4]'",
    "som": "🔥🔥🔥 CRITICAL! Check same slide. Format: '$5M Year 3 target [Slide 4]' OR 'Not calculated [Slide 4]' if they say so",
    "tamCalculationMethod": "Bottom-up or Top-down or Not specified",
    "accessibility": "How accessible is the market"
  },
  
  "traction": {
    "metrics": [
      "🔥 CHECK SLIDES 6-10 CAREFULLY!",
      "Extract: Downloads, Users, Revenue, Growth, Customers, MRR, ARR",
      "Format: '10,000 downloads [Slide 8]'",
      "Format: '$0 revenue to date [Slide 8]'",
      "Format: '2% monthly active users [Slide 8]'",
      "List EVERY METRIC you find - don't skip any!"
    ],
    "gaps": ["Missing revenue", "Missing user engagement data", etc.]
  },
  
  "problemDefinition": {
    "analysis": "What problem are they solving?",
    "isRealAndUrgent": true,
    "slideReferences": [2]
  },
  
  "solution": {
    "evaluation": "Their solution description",
    "isBetterThanStatusQuo": true,
    "slideReferences": [3]
  },
  
  "validation": {
    "level": "Paid usage",
    "validationStrength": "Strong",
    "details": "Evidence of validation"
  },
  
  "businessModel": {
    "contributionMargin": "Margin analysis",
    "paybackPeriod": "CAC payback period",
    "cacLtvRatio": "LTV:CAC ratio",
    "scalability": "Scalability assessment",
    "risks": [],
    "unitEconomicsComputable": false,
    "missingForCalculation": []
  },
  
  "team": {
    "assessment": "🔥 EXTRACT NAMES AND ROLES from team slide (usually 8-12). Format: 'Bob Smith (CEO, ex-Google), Alice Jones (CTO) [Slide 10]'",
    "founderMarketFit": true,
    "keyStrengths": ["Strength 1", "Strength 2"],
    "keyWeaknesses": []
  },
  
  "defensibility": {
    "moats": ["Network effects", "Data", etc.],
    "vulnerabilities": []
  },
  
  "risks": {
    "tier1": [],
    "tier2": [],
    "tier3": [],
    "tier4": []
  },
  
  "criteriaAlignment": {
    "matchesCustomCriteria": ${vcCriteria ? 'true' : 'null'},
    "dealBreakersTriggered": []
  },
  
  "fundAlignment": {
    "score": 7,
    "sectorAnalysis": {
      "startupSector": "Extract actual sector",
      "matches": true,
      "reasoning": "Analysis"
    },
    "stageAnalysis": {
      "startupStage": "Extract stage",
      "matches": true,
      "reasoning": "Analysis"
    },
    "checkSizeAnalysis": {
      "amountNeeded": "Extract amount",
      "withinRange": true,
      "reasoning": "Analysis"
    },
    "geographyAnalysis": {
      "startupGeography": "Extract location",
      "matches": true,
      "reasoning": "Analysis"
    },
    "strengths": [
      {
        "criterion": "What matches criteria",
        "howItFits": "Explanation",
        "evidence": "Data [Slide X]"
      }
    ],
    "gaps": [],
    "fundSpecificRisks": [],
    "summaryReport": "3-5 paragraph analysis",
    "investmentRecommendation": "Pass",
    "keyTakeaways": ["Takeaway 1", "Takeaway 2"]
  },
  
  "useOfFunds": {
    "clarity": "Use of funds analysis",
    "milestones": [],
    "achievability": "Assessment",
    "commentary": "Commentary"
  },
  
  "returnPotential": {
    "potential10to20x": false,
    "pathTo100MARR": "Path analysis",
    "timeToScale": "Timeline",
    "exitScenarios": []
  },
  
  "missingCriticalInfo": [],
  "dataQualityScore": 70,
  
  "icMemo": {
    "verdict": "Pass",
    "summary": "Summary",
    "strengths": [
      {"point": "Strength", "evidenceTag": "Evidence", "slideReferences": [1]}
    ],
    "weaknesses": [],
    "dataNeededForReconsideration": []
  },
  
  "verdict": "Strong Lead OR Track OR Pass",
  "recommendation": "Clear recommendation with reasoning",
  "overallScore": 65
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 REMEMBER: EXTRACT REAL DATA! NO "Not provided"! 🚨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  console.log("📤 Sending to OpenAI...");

  const completion = await callOpenAIWithRetry(() =>
    openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.0,
      max_tokens: 16000,
    })
  );

  totalCost += 0.11; // Analysis cost

  let text = completion.choices[0].message.content || "{}";
  
  console.log("📥 Response received:", text.length, "chars");
  text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  try {
    const analysis = JSON.parse(text);
    
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ AI RESPONSE PARSED");
    console.log("   Company:", analysis.overview?.companyName || "❌ MISSING");
    console.log("   Sector:", analysis.overview?.sector || "❌ MISSING");
    console.log("   TAM:", analysis.marketAnalysis?.tam || "❌ MISSING");
    console.log("   SAM:", analysis.marketAnalysis?.sam || "❌ MISSING");
    console.log("   SOM:", analysis.marketAnalysis?.som || "❌ MISSING");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    console.log("🔧 STARTING SANITIZATION...");
    console.log("   risks.tier1 type BEFORE:", typeof analysis.risks?.tier1?.[0]);
    console.log("   gaps type BEFORE:", typeof analysis.fundAlignment?.gaps?.[0]);
    
    // SANITIZATION - FIX ANY MISSING FIELDS
    if (!analysis.overview) analysis.overview = {};
    if (!analysis.overview.companyName || analysis.overview.companyName === "Not provided") {
      analysis.overview.companyName = "Company name not in deck";
    }
    if (!analysis.overview.sector || analysis.overview.sector === "Not provided") {
      analysis.overview.sector = "Technology";
    }
    
    if (!analysis.marketAnalysis) analysis.marketAnalysis = {};
    
    // FIX tamCalculationMethod enum
    const validTAMethods = ["Bottom-up", "Top-down"];
    if (!analysis.marketAnalysis.tamCalculationMethod || !validTAMethods.includes(analysis.marketAnalysis.tamCalculationMethod)) {
      analysis.marketAnalysis.tamCalculationMethod = "Top-down";
    }
    
    if (!analysis.traction) analysis.traction = { metrics: [], gaps: [] };
    if (!analysis.validation) analysis.validation = {};
    
    // NUCLEAR FIX: risks must be OBJECTS not strings
    if (!analysis.risks) analysis.risks = {};
    if (!Array.isArray(analysis.risks.tier1)) analysis.risks.tier1 = [];
    if (!Array.isArray(analysis.risks.tier2)) analysis.risks.tier2 = [];
    if (!Array.isArray(analysis.risks.tier3)) analysis.risks.tier3 = [];
    if (!Array.isArray(analysis.risks.tier4)) analysis.risks.tier4 = [];
    
    // Convert any string risks to proper objects
    ['tier1', 'tier2', 'tier3', 'tier4'].forEach(tier => {
      if (Array.isArray(analysis.risks[tier])) {
        analysis.risks[tier] = analysis.risks[tier].map((r: any) => {
          if (typeof r === 'string') {
            return {
              risk: r,
              severity: "Medium",
              likelihood: "Medium",
              impact: "Moderate risk"
            };
          }
          return {
            risk: r.risk || "Risk identified",
            severity: r.severity || "Medium",
            likelihood: r.likelihood || "Medium",
            impact: r.impact || "Impact identified"
          };
        });
      }
    });
    
    // NUCLEAR FIX: fundAlignment.gaps must be OBJECTS not strings
    if (!analysis.fundAlignment) analysis.fundAlignment = {};
    if (!Array.isArray(analysis.fundAlignment.gaps)) analysis.fundAlignment.gaps = [];
    
    analysis.fundAlignment.gaps = analysis.fundAlignment.gaps.map((g: any) => {
      if (typeof g === 'string') {
        return {
          criterion: g,
          howItFails: "Does not meet criterion",
          severity: "Minor"
        };
      }
      const validGapSeverities = ["Critical", "Major", "Minor"];
      let severity = g.severity || "Minor";
      if (!validGapSeverities.includes(severity)) {
        if (severity === "High") severity = "Major";
        else if (severity === "Medium") severity = "Minor";
        else if (severity === "Low") severity = "Minor";
        else severity = "Minor";
      }
      
      return {
        criterion: g.criterion || "Gap identified",
        howItFails: g.howItFails || "Does not meet criterion",
        severity: severity
      };
    });
    
    // NUCLEAR FIX: fundAlignment.strengths must be OBJECTS
    if (!Array.isArray(analysis.fundAlignment.strengths)) analysis.fundAlignment.strengths = [];
    
    analysis.fundAlignment.strengths = analysis.fundAlignment.strengths.map((s: any) => {
      if (typeof s === 'string') {
        return {
          criterion: s,
          howItFits: "Meets criterion",
          evidence: "Evidence from deck"
        };
      }
      return {
        criterion: s.criterion || "Strength",
        howItFits: s.howItFits || "Meets criterion",
        evidence: s.evidence || "Evidence identified"
      };
    });
    
    // NUCLEAR FIX: fundAlignment.fundSpecificRisks must be OBJECTS
    if (!Array.isArray(analysis.fundAlignment.fundSpecificRisks)) analysis.fundAlignment.fundSpecificRisks = [];
    
    analysis.fundAlignment.fundSpecificRisks = analysis.fundAlignment.fundSpecificRisks.map((r: any) => {
      if (typeof r === 'string') {
        return {
          risk: r,
          reasoning: "Risk identified",
          impact: "Medium"
        };
      }
      return {
        risk: r.risk || "Risk",
        reasoning: r.reasoning || "Risk identified",
        impact: r.impact || "Medium"
      };
    });
    
    console.log("🔧 SANITIZATION COMPLETE!");
    console.log("   risks.tier1 type AFTER:", typeof analysis.risks.tier1[0]);
    console.log("   risks.tier1[0]:", JSON.stringify(analysis.risks.tier1[0]));
    console.log("   gaps type AFTER:", typeof analysis.fundAlignment.gaps[0]);
    console.log("   tamCalculationMethod:", analysis.marketAnalysis.tamCalculationMethod);
    
    const validLevels = ["Paid usage", "Pilots", "LOIs", "Surveys", "None"];
    if (!validLevels.includes(analysis.validation.level)) {
      analysis.validation.level = "None";
    }
    
    const validStrengths = ["Strong", "Moderate", "Weak", "None"];
    if (!validStrengths.includes(analysis.validation.validationStrength)) {
      analysis.validation.validationStrength = "None";
    }
    
    if (!analysis.verdict) {
      const score = analysis.fundAlignment?.score || analysis.overallScore || 50;
      if (score >= 8) analysis.verdict = "Strong Lead";
      else if (score >= 6) analysis.verdict = "Track";
      else analysis.verdict = "Pass";
    }
    
    if (!analysis.overallScore) {
      const fundScore = analysis.fundAlignment?.score || 0;
      const dataScore = analysis.dataQualityScore || 0;
      analysis.overallScore = Math.round((fundScore * 10 + dataScore) / 2) || 50;
    }
    
    if (!analysis.recommendation) {
      analysis.recommendation = `${analysis.verdict} - See detailed analysis`;
    }
    
    if (!analysis.icMemo) analysis.icMemo = {};
    if (!analysis.icMemo.strengths) analysis.icMemo.strengths = [];
    
    if (Array.isArray(analysis.icMemo.strengths)) {
      analysis.icMemo.strengths = analysis.icMemo.strengths.map((s: any) => ({
        point: typeof s === 'string' ? s : (s.point || "Strength"),
        evidenceTag: "Evidence",
        slideReferences: Array.isArray(s.slideReferences) ? s.slideReferences.filter((r: any) => typeof r === 'number') : []
      }));
    }
    
    if (!analysis.problemDefinition) analysis.problemDefinition = {};
    if (!analysis.solution) analysis.solution = {};
    if (!analysis.businessModel) analysis.businessModel = {};
    if (!analysis.team) analysis.team = {};
    if (!analysis.defensibility) analysis.defensibility = { moats: [], vulnerabilities: [] };
    if (!analysis.criteriaAlignment) analysis.criteriaAlignment = {};
    if (!analysis.useOfFunds) analysis.useOfFunds = {};
    if (!analysis.returnPotential) analysis.returnPotential = {};
    if (!analysis.missingCriticalInfo) analysis.missingCriticalInfo = [];
    if (!analysis.dataQualityScore) analysis.dataQualityScore = 50;
    
    // CALCULATE CONFIDENCE SCORE
    const confidenceScore = calculateConfidenceScore(analysis);
    analysis.extractionConfidence = confidenceScore;
    
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🧹 Sanitizing analysis data...");
    console.log("✅ AI analysis complete!");
    console.log("   Company:", analysis.overview.companyName);
    console.log("   Verdict:", analysis.verdict);
    console.log("   Overall Score:", analysis.overallScore);
    console.log("   Fund Alignment Score:", analysis.fundAlignment.score);
    console.log(`   📊 Extraction Confidence: ${confidenceScore}%`);
    console.log(`   💰 TOTAL COST: $${totalCost.toFixed(4)}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    return analysis;
    
  } catch (error) {
    console.log("❌ Parse error:", error);
    console.log("Response:", text.substring(0, 500));
    
    return {
      overview: {
        companyName: "Parse error",
        sector: "Unknown",
        product: "Error parsing AI response",
        traction: "Unable to extract"
      },
      marketAnalysis: {},
      validation: { level: "None", validationStrength: "None" },
      traction: { metrics: [], gaps: [] },
      businessModel: {},
      team: {},
      defensibility: { moats: [], vulnerabilities: [] },
      risks: { tier1: [], tier2: [], tier3: [], tier4: [] },
      criteriaAlignment: {},
      fundAlignment: { score: 0 },
      useOfFunds: {},
      returnPotential: {},
      missingCriticalInfo: ["Parse error"],
      dataQualityScore: 0,
      extractionConfidence: 0,
      icMemo: {
        verdict: "Pass",
        summary: "Error",
        strengths: [],
        weaknesses: [],
        dataNeededForReconsideration: []
      },
      verdict: "Pass",
      recommendation: "Technical error",
      overallScore: 0
    };
  }
};