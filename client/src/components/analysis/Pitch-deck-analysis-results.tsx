import { ContractAnalysis } from "@/lib/contract.interface";
import { ReactNode, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { AlertTriangle, ArrowDown, ArrowUp, CheckCircle2, Minus, TrendingUp, XCircle } from "lucide-react";
import OverallScoreChart from "./chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { motion } from "framer-motion";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Accordion, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { AccordionContent } from "@radix-ui/react-accordion";

interface IContractAnalysisResultsProps {
  analysisResults: any;
  
  contractId: string;
  
}

export default function ContractAnalysisResults({
  analysisResults,
  
}: IContractAnalysisResultsProps) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!analysisResults) {
    return <div>No results</div>;
  }

  const getScore = () => {
    const score = analysisResults.overallScore;
    if (score > 70)
      return { icon: ArrowUp, color: "text-green-500", text: "Strong" };
    if (score < 50)
      return { icon: ArrowDown, color: "text-red-500", text: "Weak" };
    return { icon: Minus, color: "text-yellow-500", text: "Moderate" };
  };

  const scoreTrend = getScore();

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case "Strong Lead":
        return "bg-green-100 text-green-800 border-green-300";
      case "Invest":
        return "bg-green-100 text-green-800 border-green-300";
      case "Track":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "Monitor":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "Pass":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "tier1":
        return "bg-red-100 text-red-800 border-red-300";
      case "tier2":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "tier3":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "tier4":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const renderPremiumAccordion = (content: ReactNode) => {
   

    return (
      <div className="relative">
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center">
         {/**
          *   <Button onClick={onUpgrade} variant="outline">
            Upgrade to Premium
          </Button>
          * 
          */}
        
        </div>
        <div className="opacity-50">{content}</div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Pitch Deck Analysis</h1>
          {analysisResults.overview?.companyName && (
            <p className="text-lg text-gray-600">{analysisResults.overview.companyName}</p>
          )}
        </div>
        <Badge className={`text-lg px-4 py-2 ${getVerdictColor(analysisResults.verdict)}`}>
          {analysisResults.verdict}
        </Badge>
      </div>

      {/* Custom Criteria Used */}
      {analysisResults.inputs?.fundCriteriaUsed && 
       analysisResults.inputs.fundCriteriaUsed !== "Capital efficient, revenue > 0, execution-heavy, path to cash flow" &&
       analysisResults.inputs.fundCriteriaUsed !== "Default VC criteria: capital efficient, revenue > 0, execution-heavy, path to cash flow" && (
        <Card className="mb-6 border-purple-300 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center text-purple-900">
              <CheckCircle2 className="mr-2 size-5" />
              Custom Investment Criteria Applied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white rounded-md p-4 border border-purple-200">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                {analysisResults.inputs.fundCriteriaUsed}
              </pre>
            </div>
            {analysisResults.criteriaAlignment?.customCriteriaAssessment && (
              <div className="mt-4 p-4 bg-purple-100 rounded-md border border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-2">Criteria Match Assessment:</h4>
                <p className="text-sm text-purple-800">{analysisResults.criteriaAlignment.customCriteriaAssessment}</p>
                {analysisResults.criteriaAlignment.dealBreakersTriggered && 
                 analysisResults.criteriaAlignment.dealBreakersTriggered.length > 0 && (
                  <div className="mt-3">
                    <h5 className="font-semibold text-red-800 mb-1">⚠️ Deal Breakers Triggered:</h5>
                    <ul className="list-disc list-inside space-y-1">
                      {analysisResults.criteriaAlignment.dealBreakersTriggered.map((breaker: string, index: number) => (
                        <li key={index} className="text-sm text-red-700">{breaker}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Missing Critical Info Alert */}
      {analysisResults.missingCriticalInfo && analysisResults.missingCriticalInfo.length > 0 && (
        <Card className="mb-6 border-red-300 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-800">
              <AlertTriangle className="mr-2 size-5" />
              Critical Information Missing ({analysisResults.missingCriticalInfo.length} items)
            </CardTitle>
            <CardDescription className="text-red-700">
              Data Quality Score: {analysisResults.dataQualityScore}/100
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
                {/**
                 *  {analysisResults.missingCriticalInfo.slice(0, isActive ? undefined : 3).map((alert: string, index: number) => (
                <li key={index} className="flex items-start">
                  <XCircle className="mr-2 size-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-red-800">{alert}</span>
                </li>
              ))}
                 */}
             
            </ul>
            {/**
             *  {!isActive && analysisResults.missingCriticalInfo.length > 3 && (
              <p className="mt-4 text-sm text-red-700">
                Upgrade to see all {analysisResults.missingCriticalInfo.length} missing items
              </p>
            )}
             */}
           
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Overall Investment Score</CardTitle>
          <CardDescription>
            Based on comprehensive VC analysis criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="w-1/2">
              <div className="flex items-center space-x-4 mb-4">
                <div className="text-4xl font-bold">
                  {analysisResults.overallScore ?? 0}
                </div>
                <div className={`flex items-center ${scoreTrend.color}`}>
                  <scoreTrend.icon className="size-6 mr-1" />
                  <span className="font-semibold">{scoreTrend.text}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Fund Alignment</span>
                  <span>{analysisResults.fundAlignment?.score || 0}/10</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Data Quality</span>
                  <span>{analysisResults.dataQualityScore || 0}%</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-4">
                {analysisResults.recommendation}
              </p>
            </div>

            <div className="w-1/2 h-48 flex justify-center items-center">
              <div className="w-full h-full max-w-xs">
                <OverallScoreChart
                  overallScore={analysisResults.overallScore}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="market">Market</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="risks">Risks</TabsTrigger>
          <TabsTrigger value="traction">Traction</TabsTrigger>
          <TabsTrigger value="alignment">Fund Fit</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="font-semibold">Sector:</span>{" "}
                  {analysisResults.overview?.sector || "Not provided"}
                </div>
                <div>
                  <span className="font-semibold">Product:</span>{" "}
                  {analysisResults.overview?.product || "Not provided"}
                </div>
                <div>
                  <span className="font-semibold">Customer Type:</span>{" "}
                  {analysisResults.overview?.customerType || "Not provided"}
                </div>
                <div>
                  <span className="font-semibold">Revenue Model:</span>{" "}
                  {analysisResults.overview?.revenueModel || "Not provided"}
                </div>
                <div>
                  <span className="font-semibold">Stage:</span>{" "}
                  {analysisResults.overview?.stage || "Not provided"}
                </div>
                <div>
                  <span className="font-semibold">Capital Need:</span>{" "}
                  {analysisResults.overview?.capitalNeed || "Not provided"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Problem & Solution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Problem Definition</h4>
                  <p className="text-sm text-gray-700">
                    {analysisResults.problemDefinition?.analysis || "Not provided"}
                  </p>
                  <Badge className="mt-2">
                    {analysisResults.problemDefinition?.isRealAndUrgent 
                      ? "Real & Urgent" 
                      : analysisResults.problemDefinition?.isRealAndUrgent === false
                      ? "Not Validated"
                      : "Uncertain"}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Solution Evaluation</h4>
                  <p className="text-sm text-gray-700">
                    {analysisResults.solution?.evaluation || "Not provided"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="market">
          <Card>
            <CardHeader>
              <CardTitle>Market Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold">TAM (Total Addressable Market)</h4>
                <p className="text-sm text-gray-700">{analysisResults.marketAnalysis?.tam || "Not provided"}</p>
              </div>
              <div>
                <h4 className="font-semibold">SAM (Serviceable Addressable Market)</h4>
                <p className="text-sm text-gray-700">{analysisResults.marketAnalysis?.sam || "Not provided"}</p>
              </div>
              <div>
                <h4 className="font-semibold">SOM (Serviceable Obtainable Market)</h4>
                <p className="text-sm text-gray-700">{analysisResults.marketAnalysis?.som || "Not provided"}</p>
              </div>
              <div>
                <h4 className="font-semibold">Market Accessibility</h4>
                <p className="text-sm text-gray-700">{analysisResults.marketAnalysis?.accessibility || "Not provided"}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Team Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Overall Assessment</h4>
                <p className="text-sm text-gray-700">{analysisResults.team?.assessment || "Not provided"}</p>
                <Badge className="mt-2">
                  Founder-Market Fit: {analysisResults.team?.founderMarketFit 
                    ? "Yes" 
                    : analysisResults.team?.founderMarketFit === false 
                    ? "No" 
                    : "Uncertain"}
                </Badge>
              </div>
              {analysisResults.team?.keyStrengths && analysisResults.team.keyStrengths.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Key Strengths</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {analysisResults.team.keyStrengths.map((strength: string, index: number) => (
                      <li key={index} className="text-sm text-gray-700">{strength}</li>
                    ))}
                  </ul>
                </div>
              )}
              {analysisResults.team?.keyWeaknesses && analysisResults.team.keyWeaknesses.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Key Weaknesses</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {analysisResults.team.keyWeaknesses.map((weakness: string, index: number) => (
                      <li key={index} className="text-sm text-red-700">{weakness}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risks">
          <div className="space-y-4">
            {analysisResults.risks?.tier1 && analysisResults.risks.tier1.length > 0 && (
              <Card className="border-red-300">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Badge className={getTierColor("tier1")} variant="outline">Tier 1</Badge>
                    <span className="ml-2">Existential Risks</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysisResults.risks.tier1.map((riskObj: any, index: number) => (
                      <div key={index} className="border-l-4 border-red-500 pl-4 py-2">
                        <div className="flex items-start mb-2">
                          <AlertTriangle className="mr-2 size-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm font-semibold">{riskObj.risk}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 ml-6">
                          <div>Severity: <Badge variant="destructive" className="ml-1">{riskObj.severity}</Badge></div>
                          <div>Likelihood: <Badge variant="outline" className="ml-1">{riskObj.likelihood}</Badge></div>
                        </div>
                        {riskObj.impact && <p className="text-xs text-gray-700 mt-2 ml-6">Impact: {riskObj.impact}</p>}
                        {riskObj.mitigation && <p className="text-xs text-gray-700 mt-1 ml-6">Mitigation: {riskObj.mitigation}</p>}
                        {riskObj.proofArtifactNeeded && <p className="text-xs text-blue-700 mt-1 ml-6">Proof Needed: {riskObj.proofArtifactNeeded}</p>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {analysisResults.risks?.tier2 && analysisResults.risks.tier2.length > 0 && (
              <Card className="border-orange-300">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Badge className={getTierColor("tier2")} variant="outline">Tier 2</Badge>
                    <span className="ml-2">Operational Bottlenecks</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysisResults.risks.tier2.map((riskObj: any, index: number) => (
                      <div key={index} className="border-l-4 border-orange-500 pl-4 py-2">
                        <div className="flex items-start mb-2">
                          <AlertTriangle className="mr-2 size-4 text-orange-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm font-semibold">{riskObj.risk}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 ml-6">
                          <div>Severity: <Badge variant="outline" className="ml-1">{riskObj.severity}</Badge></div>
                          <div>Likelihood: <Badge variant="outline" className="ml-1">{riskObj.likelihood}</Badge></div>
                        </div>
                        {riskObj.impact && <p className="text-xs text-gray-700 mt-2 ml-6">Impact: {riskObj.impact}</p>}
                        {riskObj.mitigation && <p className="text-xs text-gray-700 mt-1 ml-6">Mitigation: {riskObj.mitigation}</p>}
                        {riskObj.proofArtifactNeeded && <p className="text-xs text-blue-700 mt-1 ml-6">Proof Needed: {riskObj.proofArtifactNeeded}</p>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {analysisResults.risks?.tier3 && analysisResults.risks.tier3.length > 0 && (
              <Card className="border-yellow-300">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Badge className={getTierColor("tier3")} variant="outline">Tier 3</Badge>
                    <span className="ml-2">Competitive Risks</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysisResults.risks.tier3.map((riskObj: any, index: number) => (
                      <div key={index} className="border-l-4 border-yellow-500 pl-4 py-2">
                        <div className="flex items-start mb-2">
                          <span className="text-sm font-semibold">{riskObj.risk}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 ml-2">
                          <div>Severity: <Badge variant="outline" className="ml-1">{riskObj.severity}</Badge></div>
                          <div>Likelihood: <Badge variant="outline" className="ml-1">{riskObj.likelihood}</Badge></div>
                        </div>
                        {riskObj.impact && <p className="text-xs text-gray-700 mt-2 ml-2">Impact: {riskObj.impact}</p>}
                        {riskObj.mitigation && <p className="text-xs text-gray-700 mt-1 ml-2">Mitigation: {riskObj.mitigation}</p>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {analysisResults.risks?.tier4 && analysisResults.risks.tier4.length > 0 && (
              <Card className="border-blue-300">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Badge className={getTierColor("tier4")} variant="outline">Tier 4</Badge>
                    <span className="ml-2">Execution Risks</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysisResults.risks.tier4.map((riskObj: any, index: number) => (
                      <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                        <div className="flex items-start mb-2">
                          <span className="text-sm font-semibold">{riskObj.risk}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 ml-2">
                          <div>Severity: <Badge variant="outline" className="ml-1">{riskObj.severity}</Badge></div>
                          <div>Likelihood: <Badge variant="outline" className="ml-1">{riskObj.likelihood}</Badge></div>
                        </div>
                        {riskObj.impact && <p className="text-xs text-gray-700 mt-2 ml-2">Impact: {riskObj.impact}</p>}
                        {riskObj.mitigation && <p className="text-xs text-gray-700 mt-1 ml-2">Mitigation: {riskObj.mitigation}</p>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="traction">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Metrics Provided</CardTitle>
              </CardHeader>
              <CardContent>
                {analysisResults.traction?.metrics && analysisResults.traction.metrics.length > 0 ? (
                  <ul className="space-y-2">
                    {analysisResults.traction.metrics.map((metric: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle2 className="mr-2 size-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{metric}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No metrics provided</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-yellow-300 bg-yellow-50">
              <CardHeader>
                <CardTitle>Missing Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                {analysisResults.traction?.gaps && analysisResults.traction.gaps.length > 0 ? (
                  <ul className="space-y-2">
                    {analysisResults.traction.gaps.map((gap: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <XCircle className="mr-2 size-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-yellow-800">{gap}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">All key metrics provided</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* FUND FIT TAB - Replace your <TabsContent value="alignment"> with this entire section */}
        <TabsContent value="alignment">
          <div className="space-y-6">
            {/* Header Score Card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Fund Thesis Alignment</h2>
                  <p className="text-gray-600 mt-1">Analysis against your investment criteria</p>
                </div>
                <div className="text-center">
                  <div className={`text-5xl font-bold mb-1 ${
                    (analysisResults.fundAlignment?.score || 0) >= 7 ? 'text-green-600' :
                    (analysisResults.fundAlignment?.score || 0) >= 5 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {analysisResults.fundAlignment?.score || 0}/10
                  </div>
                  <div className={`px-4 py-1 rounded-full text-sm font-semibold ${
                    (analysisResults.fundAlignment?.score || 0) >= 7 ? 'bg-green-100 text-green-800' :
                    (analysisResults.fundAlignment?.score || 0) >= 5 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {(analysisResults.fundAlignment?.score || 0) >= 7 ? 'Strong Fit' :
                     (analysisResults.fundAlignment?.score || 0) >= 5 ? 'Moderate Fit' :
                     'Weak Fit'}
                  </div>
                </div>
              </div>

              {analysisResults.fundAlignment?.investmentRecommendation && (
                <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500 mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Investment Recommendation</h3>
                  <p className="text-lg text-gray-800">{analysisResults.fundAlignment.investmentRecommendation}</p>
                </div>
              )}

              {analysisResults.fundAlignment?.keyTakeaways && analysisResults.fundAlignment.keyTakeaways.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5" />
                    Key Takeaways
                  </h3>
                  <ul className="space-y-2">
                    {analysisResults.fundAlignment.keyTakeaways.map((takeaway: string, index: number) => (
                      <li key={index} className="flex items-start text-sm text-blue-900">
                        <span className="mr-2 mt-0.5 flex-shrink-0 font-bold">•</span>
                        <span>{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Criteria Matching Grid */}
            {(analysisResults.fundAlignment?.sectorAnalysis || 
              analysisResults.fundAlignment?.stageAnalysis || 
              analysisResults.fundAlignment?.checkSizeAnalysis || 
              analysisResults.fundAlignment?.geographyAnalysis) && (
              <div className="grid md:grid-cols-2 gap-4">
                {analysisResults.fundAlignment.sectorAnalysis && (
                  <div className={`rounded-lg border-2 p-5 ${
                    analysisResults.fundAlignment.sectorAnalysis.matches 
                      ? 'bg-green-50 border-green-300' 
                      : 'bg-red-50 border-red-300'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">Sector Match</h3>
                      {analysisResults.fundAlignment.sectorAnalysis.matches ? (
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-600" />
                      )}
                    </div>
                    <p className="font-semibold text-gray-900 mb-2">
                      {analysisResults.fundAlignment.sectorAnalysis.startupSector}
                    </p>
                    <p className="text-sm text-gray-700">
                      {analysisResults.fundAlignment.sectorAnalysis.reasoning}
                    </p>
                  </div>
                )}

                {analysisResults.fundAlignment.stageAnalysis && (
                  <div className={`rounded-lg border-2 p-5 ${
                    analysisResults.fundAlignment.stageAnalysis.matches 
                      ? 'bg-green-50 border-green-300' 
                      : 'bg-red-50 border-red-300'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">Stage Match</h3>
                      {analysisResults.fundAlignment.stageAnalysis.matches ? (
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-600" />
                      )}
                    </div>
                    <p className="font-semibold text-gray-900 mb-2">
                      {analysisResults.fundAlignment.stageAnalysis.startupStage}
                    </p>
                    <p className="text-sm text-gray-700">
                      {analysisResults.fundAlignment.stageAnalysis.reasoning}
                    </p>
                  </div>
                )}

                {analysisResults.fundAlignment.checkSizeAnalysis && (
                  <div className={`rounded-lg border-2 p-5 ${
                    analysisResults.fundAlignment.checkSizeAnalysis.withinRange 
                      ? 'bg-green-50 border-green-300' 
                      : 'bg-red-50 border-red-300'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">Check Size</h3>
                      {analysisResults.fundAlignment.checkSizeAnalysis.withinRange ? (
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-600" />
                      )}
                    </div>
                    <p className="font-semibold text-gray-900 mb-2">
                      {analysisResults.fundAlignment.checkSizeAnalysis.amountNeeded}
                    </p>
                    <p className="text-sm text-gray-700">
                      {analysisResults.fundAlignment.checkSizeAnalysis.reasoning}
                    </p>
                  </div>
                )}

                {analysisResults.fundAlignment.geographyAnalysis && (
                  <div className={`rounded-lg border-2 p-5 ${
                    analysisResults.fundAlignment.geographyAnalysis.matches 
                      ? 'bg-green-50 border-green-300' 
                      : 'bg-red-50 border-red-300'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">Geography</h3>
                      {analysisResults.fundAlignment.geographyAnalysis.matches ? (
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-600" />
                      )}
                    </div>
                    <p className="font-semibold text-gray-900 mb-2">
                      {analysisResults.fundAlignment.geographyAnalysis.startupGeography}
                    </p>
                    <p className="text-sm text-gray-700">
                      {analysisResults.fundAlignment.geographyAnalysis.reasoning}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* What Fits Well */}
            {analysisResults.fundAlignment?.strengths && analysisResults.fundAlignment.strengths.length > 0 && (
              <div className="bg-green-50 rounded-xl border-2 border-green-300 p-6">
                <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center">
                  <CheckCircle2 className="mr-2 h-6 w-6" />
                  What Fits Well
                </h3>
                <div className="space-y-4">
                  {analysisResults.fundAlignment.strengths.map((strength: any, index: number) => (
                    <div key={index} className="bg-white rounded-lg p-5 shadow-sm">
                      <h4 className="font-bold text-green-900 text-lg mb-2">
                        {strength.criterion}
                      </h4>
                      <p className="text-gray-700 mb-3 leading-relaxed">
                        {strength.howItFits}
                      </p>
                      <div className="bg-green-50 rounded p-3 border-l-4 border-green-500">
                        <p className="text-sm text-green-800">
                          <span className="font-semibold">Evidence:</span> {strength.evidence}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* What Doesn't Fit */}
            {analysisResults.fundAlignment?.gaps && analysisResults.fundAlignment.gaps.length > 0 && (
              <div className="bg-red-50 rounded-xl border-2 border-red-300 p-6">
                <h3 className="text-xl font-bold text-red-900 mb-4 flex items-center">
                  <XCircle className="mr-2 h-6 w-6" />
                  What Doesn't Fit
                </h3>
                <div className="space-y-4">
                  {analysisResults.fundAlignment.gaps.map((gap: any, index: number) => (
                    <div key={index} className="bg-white rounded-lg p-5 shadow-sm">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-red-900 text-lg flex-1">
                          {gap.criterion}
                        </h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ml-3 ${
                          gap.severity === 'Critical' ? 'bg-red-200 text-red-900' :
                          gap.severity === 'Moderate' ? 'bg-orange-200 text-orange-900' :
                          'bg-yellow-200 text-yellow-900'
                        }`}>
                          {gap.severity}
                        </span>
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        {gap.howItFails}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fund-Specific Risks */}
            {analysisResults.fundAlignment?.fundSpecificRisks && analysisResults.fundAlignment.fundSpecificRisks.length > 0 && (
              <div className="bg-orange-50 rounded-xl border-2 border-orange-300 p-6">
                <h3 className="text-xl font-bold text-orange-900 mb-4 flex items-center">
                  <AlertTriangle className="mr-2 h-6 w-6" />
                  Fund-Specific Risks & Threats
                </h3>
                <div className="space-y-4">
                  {analysisResults.fundAlignment.fundSpecificRisks.map((risk: any, index: number) => (
                    <div key={index} className="bg-white rounded-lg p-5 shadow-sm">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-orange-900 text-lg flex-1">
                          {risk.risk}
                        </h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ml-3 ${
                          risk.impact === 'High' ? 'bg-red-200 text-red-900' :
                          risk.impact === 'Medium' ? 'bg-orange-200 text-orange-900' :
                          'bg-yellow-200 text-yellow-900'
                        }`}>
                          {risk.impact} Impact
                        </span>
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        {risk.reasoning}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Criteria Analysis */}
            {analysisResults.fundAlignment?.customCriteriaAnalysis && analysisResults.fundAlignment.customCriteriaAnalysis.length > 0 && (
              <div className="bg-purple-50 rounded-xl border-2 border-purple-300 p-6">
                <h3 className="text-xl font-bold text-purple-900 mb-4">
                  Custom Evaluation Criteria
                </h3>
                <div className="space-y-4">
                  {analysisResults.fundAlignment.customCriteriaAnalysis.map((criteria: any, index: number) => (
                    <div key={index} className="bg-white rounded-lg p-5 shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 text-lg mb-2">
                            {criteria.question}
                          </h4>
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            criteria.importance === 'Critical' ? 'bg-red-100 text-red-800' :
                            criteria.importance === 'Important' ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {criteria.importance}
                          </span>
                        </div>
                        <div className="flex flex-col items-end ml-4">
                          <span className="text-3xl font-bold text-gray-900">
                            {criteria.score}/10
                          </span>
                          <span className={`mt-2 px-3 py-1 rounded-full text-xs font-bold ${
                            criteria.meetsRequirement 
                              ? 'bg-green-200 text-green-900' 
                              : 'bg-red-200 text-red-900'
                          }`}>
                            {criteria.meetsRequirement ? 'Met' : 'Not Met'}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        {criteria.assessment}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comprehensive Summary Report - THE KEY FEATURE */}
            {analysisResults.fundAlignment?.summaryReport && (
              <div className="bg-white rounded-xl border-2 border-gray-300 shadow-lg p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gray-200">
                  Comprehensive Fund Fit Analysis
                </h3>
                <div className="prose max-w-none">
                  <div className="text-gray-800 text-base leading-relaxed space-y-4 whitespace-pre-line">
                    {analysisResults.fundAlignment.summaryReport}
                  </div>
                </div>
              </div>
            )}

            {/* Fallback to old format if new data not available */}
            {!analysisResults.fundAlignment?.summaryReport && 
             (analysisResults.fundAlignment?.capitalEfficiency || 
              analysisResults.fundAlignment?.pathToCashFlow || 
              analysisResults.fundAlignment?.alignment) && (
              <Card>
                <CardHeader>
                  <CardTitle>Legacy Fund Alignment (Update Pending)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analysisResults.fundAlignment.capitalEfficiency && (
                    <div>
                      <h4 className="font-semibold">Capital Efficiency</h4>
                      <p className="text-sm text-gray-700">{analysisResults.fundAlignment.capitalEfficiency}</p>
                    </div>
                  )}
                  {analysisResults.fundAlignment.pathToCashFlow && (
                    <div>
                      <h4 className="font-semibold">Path to Cash Flow</h4>
                      <p className="text-sm text-gray-700">{analysisResults.fundAlignment.pathToCashFlow}</p>
                    </div>
                  )}
                  {analysisResults.fundAlignment.alignment && (
                    <div>
                      <h4 className="font-semibold">Overall Alignment</h4>
                      <p className="text-sm text-gray-700">{analysisResults.fundAlignment.alignment}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    

      { analysisResults.useOfFunds && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Use of Funds Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold">Clarity</h4>
              <p className="text-sm text-gray-700">{analysisResults.useOfFunds.clarity}</p>
            </div>
            {analysisResults.useOfFunds.milestones && analysisResults.useOfFunds.milestones.length > 0 && (
              <div>
                <h4 className="font-semibold">Milestones</h4>
                <ul className="list-disc list-inside space-y-1">
                  {analysisResults.useOfFunds.milestones.map((milestone: string, index: number) => (
                    <li key={index} className="text-sm text-gray-700">{milestone}</li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <h4 className="font-semibold">Commentary</h4>
              <p className="text-sm text-gray-700">{analysisResults.useOfFunds.commentary}</p>
            </div>
          </CardContent>
        </Card>
      )}

      { analysisResults.returnPotential && (
        <Card>
          <CardHeader>
            <CardTitle>Return Potential</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Badge>
                10-20x Potential: {analysisResults.returnPotential.potential10to20x 
                  ? "Yes" 
                  : analysisResults.returnPotential.potential10to20x === false 
                  ? "No" 
                  : "Uncertain"}
              </Badge>
            </div>
            <div>
              <h4 className="font-semibold">Path to $100M ARR</h4>
              <p className="text-sm text-gray-700">{analysisResults.returnPotential.pathTo100MARR}</p>
            </div>
            <div>
              <h4 className="font-semibold">Time to Scale</h4>
              <p className="text-sm text-gray-700">{analysisResults.returnPotential.timeToScale}</p>
            </div>
            {analysisResults.returnPotential.exitScenarios && analysisResults.returnPotential.exitScenarios.length > 0 && (
              <div>
                <h4 className="font-semibold">Exit Scenarios</h4>
                <ul className="list-disc list-inside space-y-1">
                  {analysisResults.returnPotential.exitScenarios.map((scenario: string, index: number) => (
                    <li key={index} className="text-sm text-gray-700">{scenario}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}