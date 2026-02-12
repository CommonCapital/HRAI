import OpenAI from "openai";
import { getFile } from "@/modules/candidates/services/file-storage";
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

// HELPER: Calculate completeness score
function calculateCompletenessScore(analysis: any): number {
  let score = 100;
  
  // Penalize missing critical fields
  if (!analysis.overview.candidateName || analysis.overview.candidateName.includes("not found")) score -= 20;
  if (!analysis.overview.currentRole || analysis.overview.currentRole.includes("Not provided")) score -= 10;
  if (!analysis.workHistory.assessment || analysis.workHistory.assessment.includes("Not provided")) score -= 15;
  if (!analysis.skills.present || analysis.skills.present.length === 0) score -= 15;
  if (!analysis.education.degrees || analysis.education.degrees.length === 0) score -= 10;
  
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

    console.log("📄 Extracting text from CV/Resume PDF...");
    
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
    
    // Format with page markers
    let text = "";
    const pages = textOutput.split('\f');
    
    for (let i = 0; i < pages.length; i++) {
      text += `\n━━━ PAGE ${i + 1} START ━━━\n`;
      text += pages[i].trim() + "\n";
      text += `━━━ PAGE ${i + 1} END ━━━\n`;
    }
    
    const avgCharsPerPage = totalChars / numPages;
    
    // Trigger Vision for any low-quality extraction, regardless of page count
    if (avgCharsPerPage < 100 || totalChars < 200) {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("⚠️  LOW TEXT EXTRACTION DETECTED!");
      console.log("   Total chars:", totalChars);
      console.log("   Average chars/page:", Math.round(avgCharsPerPage));
      console.log("   Pages:", numPages);
      console.log("   This CV is likely image-based or scanned");
      console.log("🔍 ACTIVATING VISION MODE WITH POPPLER...");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      
      try {
        const pagesToProcess = Math.min(numPages, 10); // CVs typically shorter than decks
        
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
            text: `Extract ALL text from this ${images.length}-page CV/resume.

Format your response EXACTLY like this:

━━━ PAGE 1 START ━━━
[All text from page 1]
━━━ PAGE 1 END ━━━

━━━ PAGE 2 START ━━━
[All text from page 2]
━━━ PAGE 2 END ━━━

Extract EVERY word, number, date, and detail. Don't summarize.`
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
        
        if (totalChars < 500) {
          console.log("⚠️⚠️⚠️ WARNING: Analysis quality will be significantly reduced!");
          console.log("   Only", totalChars, "chars extracted from", numPages, "pages");
        }
        
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      }
    }
    
    console.log("✅ Text extraction complete");
    console.log(`💰 Extraction cost: $${totalCost.toFixed(4)}`);
    
    // Final check - warn if extraction is still very poor
    if (text.length < 200) {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("⚠️⚠️⚠️ CRITICAL WARNING ⚠️⚠️⚠️");
      console.log("   Only", text.length, "characters extracted!");
      console.log("   CV analysis will be VERY LIMITED or may fail");
      console.log("   Possible causes:");
      console.log("   1. PDF is corrupted");
      console.log("   2. Vision mode failed (check Poppler installation)");
      console.log("   3. File is not a valid PDF");
      console.log("   4. PDF is password protected");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    }
    
    return text;
    
  } catch (error) {
    console.log(error);
    throw new Error("Failed to extract text from CV PDF");
  }
};

export const extractCandidateInfo = async (cvText: string): Promise<{
  name?: string;
  currentRole?: string;
  industry?: string;
}> => {
  const prompt = `Extract the candidate's name, current job title, and industry from this CV. Reply with ONLY a JSON object with these fields: name, currentRole, industry.

${cvText.substring(0, 2000)}`;

  const completion = await callOpenAIWithRetry(() =>
    openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2,
    })
  );

  const result = completion.choices[0].message.content;
  if (!result) return {};
  
  try {
    return JSON.parse(result);
  } catch {
    return {};
  }
};

export const analyzeCVWithAI = async (
  cvText: string,
  criteriaText: string = ""
): Promise<any> => {
  let totalCost = 0.0001; // Candidate info extraction cost
  
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🤖 CV AI ANALYSIS STARTING");
  
  console.log("Job Criteria Received:", criteriaText ? "✅ YES" : "❌ NO");
  
  let jobCriteria: any = null;
  if (criteriaText?.trim()) {
    try {
      jobCriteria = JSON.parse(criteriaText);
      console.log("✅ Criteria parsed as JSON");
    } catch {
      console.log("⚠️  Criteria is not JSON, treating as raw text");
      jobCriteria = { rawText: criteriaText };
    }
  }
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  let criteriaPrompt = "";
  if (jobCriteria?.jobTitle) {
    criteriaPrompt = `\n\n🎯 JOB REQUIREMENTS: ${jobCriteria.jobTitle}
Department: ${jobCriteria.department || 'Not specified'}
Required Skills: ${jobCriteria.requiredSkills?.join(', ') || 'Not specified'}
Experience Level: ${jobCriteria.experienceLevel || 'Not specified'}
Years Required: ${jobCriteria.minYearsExperience || 0}+ years
Location: ${jobCriteria.location || 'Not specified'}
Salary Range: $${jobCriteria.minSalary?.toLocaleString()}-$${jobCriteria.maxSalary?.toLocaleString()}`;
  } else if (criteriaText) {
    criteriaPrompt = `\n\nJOB REQUIREMENTS:\n${criteriaText}`;
  }

  // 🔥 NUCLEAR PROMPT - FORCES EXTRACTION
  const systemPrompt = `You are an expert HR analyst and recruiter analyzing CVs/resumes.

🚨 CRITICAL RULES - FOLLOW EXACTLY 🚨

1. YOU MUST EXTRACT ACTUAL DATA FROM THE CV
2. NEVER WRITE "Not provided" OR "Unknown" 
3. IF DATA EXISTS IN CV, YOU MUST FIND IT
4. ALWAYS CITE PAGES: [Page X]

YOU WILL BE PENALIZED FOR:
❌ Writing "Not provided"
❌ Missing candidate name
❌ Missing work experience details
❌ Missing skills
❌ Not citing pages

EXTRACTION TARGETS:
✓ Candidate name (Page 1)
✓ Contact info (Page 1)
✓ Work experience with dates, companies, roles (All pages)
✓ Skills (technical, soft, tools)
✓ Education (degrees, institutions, years)
✓ Achievements and metrics`;

  const userPrompt = `CV/RESUME TEXT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 CV TEXT - READ COMPLETELY, EVERY WORD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${cvText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 JOB REQUIREMENTS - MUST EVALUATE AGAINST THESE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${criteriaPrompt}

⚠️ CRITICAL: Failure to evaluate against these requirements = SEVERE PENALTIES

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔥🔥🔥 MANDATORY EXTRACTION CHECKLIST 🔥🔥🔥
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

READ EVERY PAGE CAREFULLY AND EXTRACT:

1️⃣ CANDIDATE NAME (Page 1):
   ❌ WRONG: "Not provided"
   ✅ RIGHT: "Sarah Chen" [Page 1]

2️⃣ CURRENT ROLE:
   ❌ WRONG: "Not provided"
   ✅ RIGHT: "Backend Engineer at TechCorp" [Page 1]

3️⃣ TOTAL EXPERIENCE:
   🔍 CALCULATE FROM WORK HISTORY
   ❌ WRONG: "Not provided"
   ✅ RIGHT: "6 years" [Calculated from work history]

4️⃣ WORK HISTORY:
   🔍 CHECK ALL PAGES FOR: job titles, companies, dates, achievements
   ❌ WRONG: Empty array
   ✅ RIGHT: List ALL positions with full details

5️⃣ SKILLS:
   🔍 CHECK FOR: Programming languages, frameworks, tools, certifications
   ❌ WRONG: Empty array
   ✅ RIGHT: Categorized list (Backend: Python, Django; Databases: PostgreSQL, Redis)

6️⃣ EDUCATION:
   ❌ WRONG: Empty array
   ✅ RIGHT: ["B.S. Computer Science, UC Berkeley, 2018" [Page 2]]

7️⃣ LOCATION:
   ❌ WRONG: "Not provided"
   ✅ RIGHT: "San Francisco, CA" [Page 1]

8️⃣ SALARY EXPECTATION:
   🔍 May or may not be in CV
   ✅ RIGHT: "$160k-$180k" [Page 1] OR "Not specified in CV" if truly not present

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NOW RESPOND WITH THIS JSON STRUCTURE (replace ALL example values with ACTUAL data from the CV):

{
  "overview": {
    "candidateName": "Sarah Chen",
    "currentRole": "Senior Backend Engineer",
    "currentCompany": "TechCorp Inc",
    "totalExperience": "6 years",
    "industry": "Technology / SaaS",
    "location": "San Francisco, CA",
    "noticePeriod": "2 weeks",
    "salaryExpectation": "$160k-$180k"
  },
  
  "careerTrajectory": {
    "progression": "Progressed from Junior Engineer to Senior Engineer over 6 years with consistent promotions",
    "trend": "Upward",
    "growthPattern": "Steady advancement with increasing responsibility",
    "keyMilestones": ["Promoted to Senior Engineer in 2022", "Led team of 5 developers in 2023"]
  },
  
  "workHistory": {
    "assessment": "Strong backend engineering experience with progressive responsibility",
    "relevantExperience": "All 6 years directly relevant to backend engineering",
    "yearsRelevant": "6 years",
    "companyQuality": "Mix of Series B startup and Fortune 500 companies",
    "positions": [
      {
        "title": "Senior Backend Engineer",
        "company": "TechCorp Inc",
        "duration": "Jan 2021 - Present (4 years)",
        "relevance": "High",
        "keyAchievements": [
          "Led migration of monolithic app to microservices, improving performance by 40%",
          "Managed team of 5 engineers",
          "Reduced API response time from 300ms to 80ms"
        ]
      },
      {
        "title": "Backend Engineer",
        "company": "StartupCo",
        "duration": "Mar 2019 - Dec 2020 (2 years)",
        "relevance": "High",
        "keyAchievements": [
          "Built RESTful APIs serving 1M+ requests/day",
          "Implemented CI/CD pipeline reducing deployment time by 60%"
        ]
      }
    ]
  },
  
  "experienceMatch": {
    "score": 7
  },
  
  "skills": {
    "present": [
      {
        "category": "Backend Languages",
        "skills": ["Python", "Django", "Node.js"]
      },
      {
        "category": "Databases",
        "skills": ["PostgreSQL", "MySQL", "Redis"]
      }
    ],
    "gaps": [
      {
        "skill": "Kubernetes",
        "criticality": "high",
        "note": "Required for role but not mentioned in CV"
      },
      {
        "skill": "Docker Compose",
        "criticality": "medium",
        "note": "Nice to have for local development"
      }
    ],
    "technicalDepth": "Assessment of technical skill depth"
  },
  
  "education": {
    "degrees": [
      {
        "degree": "B.S. Computer Science",
        "institution": "UC Berkeley",
        "year": "2018",
        "relevance": "High"
      },
      {
        "degree": "M.S. Software Engineering",
        "institution": "Stanford University",
        "year": "2020",
        "relevance": "High"
      }
    ],
    "certifications": ["AWS Certified Developer", "MongoDB Certified"],
    "assessment": "Educational background assessment"
  },
  
  "redFlags": {
    "critical": [
      {
        "issue": "Employment gap",
        "description": "6-month unexplained gap between roles",
        "recommendation": "Address in interview"
      }
    ],
    "moderate": [
      {
        "issue": "Limited cloud experience",
        "description": "AWS certification but minimal work experience",
        "mitigatingFactors": "Strong theoretical knowledge"
      }
    ],
    "minor": [
      "No open source contributions",
      "Limited leadership experience mentioned"
    ]
  },
  
  "roleAlignment": {
    "score": 7,
    "hiringRecommendation": "Recommend technical interview to assess...",
    "requirementsAssessment": "Candidate meets X out of Y core requirements",
    "criticalGaps": ["Leadership experience", "Cloud infrastructure hands-on"],
    "keyTakeaways": [
      "Strong technical foundation in required stack",
      "Need to verify cloud experience in interview"
    ],
    
    "experienceMatch": {
      "matches": true,
      "candidateLevel": "6 years - meets 5+ requirement",
      "reasoning": "All experience directly relevant"
    },
    
    "skillsMatch": {
      "matches": true,
      "matchPercentage": 80,
      "reasoning": "8/10 required skills present"
    },
    
    "seniorityMatch": {
      "appropriate": true,
      "level": "Mid-Senior",
      "reasoning": "Experience level appropriate for role"
    },
    
    "culturalFit": {
      "score": 7,
      "assessment": "Assessment based on CV content"
    },
    
    "strengths": [
      {
        "area": "Core Technical Skills",
        "description": "Excellent proficiency in Python/Django",
        "evidence": "4+ years consistent usage [Work History]"
      }
    ],
    
    "gaps": [
      {
        "area": "Cloud Infrastructure",
        "description": "Limited AWS hands-on experience",
        "severity": "Moderate",
        "canBeAddressed": true,
        "addressingStrategy": "Technical interview deep-dive + AWS certification"
      },
      {
        "area": "Team Leadership",
        "description": "Limited people management experience documented",
        "severity": "Minor",
        "canBeAddressed": true,
        "addressingStrategy": "Start with tech lead role, progress to management"
      }
    ],
    
    "interviewFocusAreas": [
      {
        "topic": "AWS & Cloud Infrastructure",
        "priority": "High",
        "reasoning": "Required skill but documentation weak in CV",
        "suggestedQuestions": [
          "Walk me through your experience with AWS services (EC2, S3, Lambda)",
          "Describe how you debugged a production issue in a cloud environment",
          "How would you design a scalable architecture for X?"
        ]
      },
      {
        "topic": "System Design & Scalability",
        "priority": "High",
        "reasoning": "Critical for senior role",
        "suggestedQuestions": [
          "Design a URL shortener service handling 1M requests/day",
          "How would you handle database scaling for rapid user growth?"
        ]
      },
      {
        "topic": "Team Collaboration",
        "priority": "Medium",
        "reasoning": "Need to assess fit with existing team",
        "suggestedQuestions": [
          "Tell me about a time you mentored a junior engineer",
          "How do you handle disagreements about technical approaches?"
        ]
      }
    ],
    
    "comprehensiveAssessment": "Sarah Chen presents as a strong candidate for the Senior Backend Engineer position. With 6 years of progressive experience in Python/Django development, she demonstrates the technical foundation required for this role. Her work history shows consistent growth from junior to senior positions, with quantifiable achievements including a 40% performance improvement through microservices migration and managing a team of 5 engineers. However, there are some gaps to address. While she has AWS certification, her hands-on cloud experience appears limited based on the CV. Additionally, leadership experience is documented but could be explored more deeply in interviews. Her skill set aligns well with 8 out of 10 required competencies, placing her in the 80th percentile for this position. The moderate red flag around cloud experience can likely be addressed through targeted interview questions and potentially a practical coding exercise. Overall recommendation is to proceed with technical interview focusing on AWS/cloud architecture and system design, with particular attention to validating her practical experience in these areas."
  },
  
  "compensation": {
    "analysis": "Salary expectation analysis",
    "withinBudget": true,
    "marketComparison": "Comparison to market rates"
  },
  
  "nextSteps": [
    "Schedule technical interview",
    "Assess cloud experience in detail",
    "Reference check on team collaboration"
  ],
  
  "missingCriticalInfo": [],
  "completenessScore": 85,
  
  "recommendation": "Interview",
  "summary": "Strong backend engineer with 6 years experience in Python/Django. Meets most requirements but needs interview to validate cloud experience. Recommend proceeding with technical interview.",
  "overallScore": 78 ( The candidate score is computed as follows: 
Score=(roleScore×10×0.4)+(experienceScore×10×0.4)+(completeness×0.2)
It is not predetermined (e.g., 78); if the formula produces no value, the score defaults to 50. )
}

⚠️⚠️⚠️ CRITICAL: The JSON above shows EXAMPLE DATA only! ⚠️⚠️⚠️
YOU MUST REPLACE **EVERY SINGLE VALUE** WITH ACTUAL DATA FROM THE CV!

DO NOT COPY:
❌ "Sarah Chen" - use the REAL candidate name from the CV
❌ "6 years" - calculate the REAL total experience
❌ "TechCorp Inc" - use the REAL company names
❌ Example achievements - use the REAL achievements from CV

EXTRACT AND USE REAL DATA FOR EVERY FIELD!

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
    console.log("   Candidate:", analysis.overview?.candidateName || "❌ MISSING");
    console.log("   Current Role:", analysis.overview?.currentRole || "❌ MISSING");
    console.log("   Total Experience:", analysis.overview?.totalExperience || "❌ MISSING");
    console.log("   Skills Present:", analysis.skills?.present?.length || 0, "categories");
    console.log("   Work Positions:", analysis.workHistory?.positions?.length || 0);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    console.log("🔧 STARTING SANITIZATION...");
    
    // SANITIZATION - FIX ANY MISSING FIELDS
    if (!analysis.overview) analysis.overview = {};
    if (!analysis.overview.candidateName || analysis.overview.candidateName === "Not provided") {
      analysis.overview.candidateName = "Candidate name not found in CV";
    }
    if (!analysis.overview.industry || analysis.overview.industry === "Not provided") {
      analysis.overview.industry = "Technology";
    }
    
    if (!analysis.careerTrajectory) analysis.careerTrajectory = {};
    const validTrends = ["Upward", "Lateral", "Downward", "Stable"];
    if (!validTrends.includes(analysis.careerTrajectory.trend)) {
      analysis.careerTrajectory.trend = "Stable";
    }
    
    if (!analysis.workHistory) analysis.workHistory = { positions: [] };
    if (!Array.isArray(analysis.workHistory.positions)) analysis.workHistory.positions = [];
    
    // Validate work history positions
    analysis.workHistory.positions = analysis.workHistory.positions.map((pos: any) => {
      const validRelevance = ["High", "Medium", "Low"];
      return {
        title: pos.title || "Position",
        company: pos.company || "Company",
        duration: pos.duration || "Unknown",
        relevance: validRelevance.includes(pos.relevance) ? pos.relevance : "Medium",
        keyAchievements: Array.isArray(pos.keyAchievements) ? pos.keyAchievements : []
      };
    });
    
    if (!analysis.experienceMatch) analysis.experienceMatch = { score: 0 };
    if (typeof analysis.experienceMatch.score !== 'number') {
      analysis.experienceMatch.score = 0;
    }
    
    if (!analysis.skills) analysis.skills = {};
    if (!Array.isArray(analysis.skills.present)) analysis.skills.present = [];
    if (!Array.isArray(analysis.skills.gaps)) analysis.skills.gaps = [];
    
    // Validate skills gaps
    analysis.skills.gaps = analysis.skills.gaps.map((gap: any) => {
      const validCriticality = ["critical", "high", "medium", "low"];
      return {
        skill: gap.skill || "Skill",
        criticality: validCriticality.includes(gap.criticality) ? gap.criticality : "medium",
        note: gap.note || ""
      };
    });
    
    if (!analysis.education) analysis.education = {};
    if (!Array.isArray(analysis.education.degrees)) analysis.education.degrees = [];
    if (!Array.isArray(analysis.education.certifications)) analysis.education.certifications = [];
    
    // Validate education degrees
    analysis.education.degrees = analysis.education.degrees.map((degree: any) => {
      const validRelevance = ["High", "Medium", "Low"];
      return {
        degree: degree.degree || "Degree",
        institution: degree.institution || "Institution",
        year: degree.year || "Unknown",
        relevance: validRelevance.includes(degree.relevance) ? degree.relevance : undefined
      };
    });
    
    // NUCLEAR FIX: redFlags must be properly structured
    if (!analysis.redFlags) analysis.redFlags = {};
    if (!Array.isArray(analysis.redFlags.critical)) analysis.redFlags.critical = [];
    if (!Array.isArray(analysis.redFlags.moderate)) analysis.redFlags.moderate = [];
    if (!Array.isArray(analysis.redFlags.minor)) analysis.redFlags.minor = [];
    
    // Validate critical red flags
    analysis.redFlags.critical = analysis.redFlags.critical.map((flag: any) => {
      if (typeof flag === 'string') {
        return { issue: flag, description: "Issue identified", recommendation: "Address in interview" };
      }
      return {
        issue: flag.issue || "Issue",
        description: flag.description || "Issue identified",
        recommendation: flag.recommendation
      };
    });
    
    // Validate moderate red flags
    analysis.redFlags.moderate = analysis.redFlags.moderate.map((flag: any) => {
      if (typeof flag === 'string') {
        return { issue: flag, description: "Concern identified", mitigatingFactors: "" };
      }
      return {
        issue: flag.issue || "Issue",
        description: flag.description || "Concern identified",
        mitigatingFactors: flag.mitigatingFactors
      };
    });
    
    // Validate minor red flags (can be strings)
    analysis.redFlags.minor = analysis.redFlags.minor.filter((flag: any) => 
      typeof flag === 'string' && flag.trim()
    );
    
    // NUCLEAR FIX: roleAlignment must be properly structured
    if (!analysis.roleAlignment) analysis.roleAlignment = {};
    if (typeof analysis.roleAlignment.score !== 'number') {
      analysis.roleAlignment.score = 0;
    }
    
    if (!Array.isArray(analysis.roleAlignment.strengths)) analysis.roleAlignment.strengths = [];
    analysis.roleAlignment.strengths = analysis.roleAlignment.strengths.map((s: any) => {
      if (typeof s === 'string') {
        return { area: s, description: "Strength identified", evidence: "From CV" };
      }
      return {
        area: s.area || "Strength",
        description: s.description || "Strength identified",
        evidence: s.evidence || "From CV"
      };
    });
    
    if (!Array.isArray(analysis.roleAlignment.gaps)) analysis.roleAlignment.gaps = [];
    analysis.roleAlignment.gaps = analysis.roleAlignment.gaps.map((gap: any) => {
      if (typeof gap === 'string') {
        return {
          area: gap,
          description: "Gap identified",
          severity: "Moderate",
          canBeAddressed: true,
          addressingStrategy: "Can be addressed through training or interview"
        };
      }
      const validSeverity = ["Critical", "Moderate", "Minor"];
      return {
        area: gap.area || "Gap",
        description: gap.description || "Gap identified",
        severity: validSeverity.includes(gap.severity) ? gap.severity : "Moderate",
        canBeAddressed: gap.canBeAddressed !== false,
        addressingStrategy: gap.addressingStrategy
      };
    });
    
    if (!Array.isArray(analysis.roleAlignment.interviewFocusAreas)) {
      analysis.roleAlignment.interviewFocusAreas = [];
    }
    analysis.roleAlignment.interviewFocusAreas = analysis.roleAlignment.interviewFocusAreas.map((area: any) => {
      const validPriority = ["High", "Medium", "Low"];
      return {
        topic: area.topic || "Topic",
        priority: validPriority.includes(area.priority) ? area.priority : "Medium",
        reasoning: area.reasoning || "Area to explore",
        suggestedQuestions: Array.isArray(area.suggestedQuestions) ? area.suggestedQuestions : []
      };
    });
    
    if (!analysis.compensation) analysis.compensation = {};
    if (!analysis.nextSteps) analysis.nextSteps = [];
    
    // Validate recommendation
    const validRecommendations = ["Strong Hire", "Hire", "Interview", "Maybe", "Pass"];
    if (!validRecommendations.includes(analysis.recommendation)) {
      const score = analysis.roleAlignment?.score || analysis.overallScore || 50;
      if (score >= 80) analysis.recommendation = "Strong Hire";
      else if (score >= 70) analysis.recommendation = "Hire";
      else if (score >= 60) analysis.recommendation = "Interview";
      else if (score >= 50) analysis.recommendation = "Maybe";
      else analysis.recommendation = "Pass";
    }
    
   if (!analysis.overallScore) {
  const roleScore = analysis.roleAlignment?.score || 0;
  const experienceScore = analysis.experienceMatch?.score || 0;
  const completeness = analysis.completenessScore || 0;
  
  // Weight: role alignment 40%, experience 40%, completeness 20%
  analysis.overallScore = Math.round(
    (roleScore * 10 * 0.4) + 
    (experienceScore * 10 * 0.4) + 
    (completeness * 0.2)
  ) || 50;
}
    
    if (!analysis.summary) {
      analysis.summary = `${analysis.recommendation} - See detailed analysis`;
    }
    
    if (!analysis.missingCriticalInfo) analysis.missingCriticalInfo = [];
    if (!analysis.completenessScore) analysis.completenessScore = 50;
    
    // CALCULATE COMPLETENESS SCORE
    const completenessScore = calculateCompletenessScore(analysis);
    analysis.completenessScore = completenessScore;
    
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🧹 Sanitizing analysis data...");
    console.log("✅ AI analysis complete!");
    console.log("   Candidate:", analysis.overview.candidateName);
    console.log("   Recommendation:", analysis.recommendation);
    console.log("   Overall Score:", analysis.overallScore);
    console.log("   Role Alignment Score:", analysis.roleAlignment.score);
    console.log(`   📊 Completeness: ${completenessScore}%`);
    console.log(`   💰 TOTAL COST: $${totalCost.toFixed(4)}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    return analysis;
    
  } catch (error) {
    console.log("❌ Parse error:", error);
    console.log("Response:", text.substring(0, 500));
    
    return {
      overview: {
        candidateName: "Parse error",
        currentRole: "Unknown",
        industry: "Unknown",
        totalExperience: "Unknown"
      },
      careerTrajectory: { trend: "Stable" },
      workHistory: { positions: [] },
      experienceMatch: { score: 0 },
      skills: { present: [], gaps: [] },
      education: { degrees: [], certifications: [] },
      redFlags: { critical: [], moderate: [], minor: [] },
      roleAlignment: {
        score: 0,
        strengths: [],
        gaps: [],
        interviewFocusAreas: []
      },
      compensation: {},
      nextSteps: [],
      missingCriticalInfo: ["Parse error"],
      completenessScore: 0,
      recommendation: "Pass",
      summary: "Technical error during analysis",
      overallScore: 0
    };
  }
};