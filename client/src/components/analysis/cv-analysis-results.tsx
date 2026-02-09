'use client'

import { ReactNode, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { 
  AlertTriangle, 
  ArrowDown, 
  ArrowUp, 
  CheckCircle2, 
  Minus, 
  TrendingUp, 
  XCircle,
  Briefcase,
  GraduationCap,
  Award,
  Users
} from "lucide-react";
import OverallScoreChart from "./chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { motion } from "framer-motion";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Accordion, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { AccordionContent } from "@radix-ui/react-accordion";

interface ICVAnalysisResultsProps {
  analysisResults: any;
  candidateId: string;
}

export default function CVAnalysisResults({
  analysisResults,
}: ICVAnalysisResultsProps) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!analysisResults) {
    return <div>No results</div>;
  }

  const getScore = () => {
    const score = analysisResults.overallScore;
    if (score > 70)
      return { icon: ArrowUp, color: "text-green-500", text: "Strong Match" };
    if (score < 50)
      return { icon: ArrowDown, color: "text-red-500", text: "Weak Match" };
    return { icon: Minus, color: "text-yellow-500", text: "Moderate Match" };
  };

  const scoreTrend = getScore();

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case "Strong Hire":
        return "bg-green-100 text-green-800 border-green-300";
      case "Hire":
        return "bg-green-100 text-green-800 border-green-300";
      case "Interview":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "Maybe":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "Pass":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-300";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Candidate Analysis</h1>
          {analysisResults.overview?.candidateName && (
            <p className="text-lg text-gray-600">{analysisResults.overview.candidateName}</p>
          )}
          {analysisResults.overview?.currentRole && (
            <p className="text-md text-gray-500">{analysisResults.overview.currentRole}</p>
          )}
        </div>
        <Badge className={`text-lg px-4 py-2 ${getRecommendationColor(analysisResults.recommendation)}`}>
          {analysisResults.recommendation}
        </Badge>
      </div>

      {/* Custom Job Criteria Used */}
      {analysisResults.inputs?.jobCriteriaUsed && 
       analysisResults.inputs.jobCriteriaUsed !== "Standard job requirements" && (
        <Card className="mb-6 border-purple-300 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center text-purple-900">
              <CheckCircle2 className="mr-2 size-5" />
              Custom Role Requirements Applied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white rounded-md p-4 border border-purple-200">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                {analysisResults.inputs.jobCriteriaUsed}
              </pre>
            </div>
            {analysisResults.roleAlignment?.requirementsAssessment && (
              <div className="mt-4 p-4 bg-purple-100 rounded-md border border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-2">Requirements Match Assessment:</h4>
                <p className="text-sm text-purple-800">{analysisResults.roleAlignment.requirementsAssessment}</p>
                {analysisResults.roleAlignment?.criticalGaps && 
                 analysisResults.roleAlignment.criticalGaps.length > 0 && (
                  <div className="mt-3">
                    <h5 className="font-semibold text-red-800 mb-1">⚠️ Critical Requirements Not Met:</h5>
                    <ul className="list-disc list-inside space-y-1">
                      {analysisResults.roleAlignment.criticalGaps.map((gap: string, index: number) => (
                        <li key={index} className="text-sm text-red-700">{gap}</li>
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
              CV Completeness Score: {analysisResults.completenessScore}/100
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysisResults.missingCriticalInfo.map((alert: string, index: number) => (
                <li key={index} className="flex items-start">
                  <XCircle className="mr-2 size-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-red-800">{alert}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Overall Candidate Score</CardTitle>
          <CardDescription>
            Based on comprehensive role fit analysis
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
                  <span>Role Alignment</span>
                  <span>{analysisResults.roleAlignment?.score || 0}/10</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Experience Match</span>
                  <span>{analysisResults.experienceMatch?.score || 0}/10</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>CV Completeness</span>
                  <span>{analysisResults.completenessScore || 0}%</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-4">
                {analysisResults.summary}
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
          <TabsTrigger value="experience">Experience</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="redflags">Red Flags</TabsTrigger>
          <TabsTrigger value="rolefit">Role Fit</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Candidate Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="font-semibold">Current Role:</span>{" "}
                  {analysisResults.overview?.currentRole || "Not provided"}
                </div>
                <div>
                  <span className="font-semibold">Current Company:</span>{" "}
                  {analysisResults.overview?.currentCompany || "Not provided"}
                </div>
                <div>
                  <span className="font-semibold">Total Experience:</span>{" "}
                  {analysisResults.overview?.totalExperience || "Not provided"}
                </div>
                <div>
                  <span className="font-semibold">Industry:</span>{" "}
                  {analysisResults.overview?.industry || "Not provided"}
                </div>
                <div>
                  <span className="font-semibold">Location:</span>{" "}
                  {analysisResults.overview?.location || "Not provided"}
                </div>
                <div>
                  <span className="font-semibold">Notice Period:</span>{" "}
                  {analysisResults.overview?.noticePeriod || "Not provided"}
                </div>
                <div>
                  <span className="font-semibold">Salary Expectation:</span>{" "}
                  {analysisResults.overview?.salaryExpectation || "Not provided"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Career Trajectory</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Career Progression</h4>
                  <p className="text-sm text-gray-700">
                    {analysisResults.careerTrajectory?.progression || "Not provided"}
                  </p>
                  <Badge className="mt-2">
                    {analysisResults.careerTrajectory?.trend || "Stable"}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Growth Pattern</h4>
                  <p className="text-sm text-gray-700">
                    {analysisResults.careerTrajectory?.growthPattern || "Not provided"}
                  </p>
                </div>
                {analysisResults.careerTrajectory?.keyMilestones && 
                 analysisResults.careerTrajectory.keyMilestones.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Key Milestones</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {analysisResults.careerTrajectory.keyMilestones.map((milestone: string, index: number) => (
                        <li key={index} className="text-sm text-gray-700">{milestone}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="experience">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Work History Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold">Overall Assessment</h4>
                  <p className="text-sm text-gray-700">{analysisResults.workHistory?.assessment || "Not provided"}</p>
                </div>
                
                {analysisResults.workHistory?.relevantExperience && (
                  <div>
                    <h4 className="font-semibold mb-2">Relevant Experience</h4>
                    <p className="text-sm text-gray-700">{analysisResults.workHistory.relevantExperience}</p>
                    <Badge className="mt-2">
                      {analysisResults.workHistory.yearsRelevant || "0"} years relevant
                    </Badge>
                  </div>
                )}

                {analysisResults.workHistory?.companyQuality && (
                  <div>
                    <h4 className="font-semibold mb-2">Company Quality</h4>
                    <p className="text-sm text-gray-700">{analysisResults.workHistory.companyQuality}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {analysisResults.workHistory?.positions && analysisResults.workHistory.positions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Position Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysisResults.workHistory.positions.map((position: any, index: number) => (
                      <div key={index} className="border-l-4 border-blue-500 pl-4 py-3 bg-gray-50 rounded-r">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">{position.title}</h4>
                            <p className="text-sm text-gray-600">{position.company}</p>
                            <p className="text-xs text-gray-500">{position.duration}</p>
                          </div>
                          <Badge variant={position.relevance === "High" ? "default" : "outline"}>
                            {position.relevance} Relevance
                          </Badge>
                        </div>
                        {position.keyAchievements && position.keyAchievements.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {position.keyAchievements.map((achievement: string, idx: number) => (
                              <li key={idx} className="text-sm text-gray-700 flex items-start">
                                <CheckCircle2 className="mr-2 size-3 text-green-600 mt-1 flex-shrink-0" />
                                {achievement}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="skills">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-green-800">
                  <CheckCircle2 className="mr-2 size-5" />
                  Skills Present
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysisResults.skills?.present && analysisResults.skills.present.length > 0 ? (
                  <div className="space-y-4">
                    {analysisResults.skills.present.map((skillGroup: any, index: number) => (
                      <div key={index}>
                        <h4 className="font-semibold text-sm mb-2">{skillGroup.category}</h4>
                        <div className="flex flex-wrap gap-2">
                          {skillGroup.skills.map((skill: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="bg-green-50">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No skills documented</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-yellow-300 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center text-yellow-800">
                  <XCircle className="mr-2 size-5" />
                  Skills Gaps
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysisResults.skills?.gaps && analysisResults.skills.gaps.length > 0 ? (
                  <div className="space-y-3">
                    {analysisResults.skills.gaps.map((gap: any, index: number) => (
                      <div key={index} className="bg-white p-3 rounded border border-yellow-200">
                        <div className="flex items-start justify-between mb-1">
                          <span className="text-sm font-semibold text-yellow-900">{gap.skill}</span>
                          <Badge className={getRiskLevelColor(gap.criticality)}>
                            {gap.criticality}
                          </Badge>
                        </div>
                        {gap.note && <p className="text-xs text-gray-600 mt-1">{gap.note}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">All required skills present</p>
                )}
              </CardContent>
            </Card>
          </div>

          {analysisResults.skills?.technicalDepth && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Technical Depth Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">{analysisResults.skills.technicalDepth}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="education">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <GraduationCap className="mr-2 size-5" />
                  Educational Background
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysisResults.education?.degrees && analysisResults.education.degrees.length > 0 ? (
                  analysisResults.education.degrees.map((degree: any, index: number) => (
                    <div key={index} className="border-l-4 border-purple-500 pl-4 py-2">
                      <h4 className="font-semibold">{degree.degree}</h4>
                      <p className="text-sm text-gray-600">{degree.institution}</p>
                      <p className="text-xs text-gray-500">{degree.year}</p>
                      {degree.relevance && (
                        <Badge className="mt-2" variant="outline">
                          {degree.relevance} Relevance
                        </Badge>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No education information provided</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="mr-2 size-5" />
                  Certifications & Additional Learning
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysisResults.education?.certifications && analysisResults.education.certifications.length > 0 ? (
                  <ul className="space-y-2">
                    {analysisResults.education.certifications.map((cert: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle2 className="mr-2 size-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{cert}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No certifications listed</p>
                )}
              </CardContent>
            </Card>
          </div>

          {analysisResults.education?.assessment && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Educational Fit Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">{analysisResults.education.assessment}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="redflags">
          <div className="space-y-4">
            {analysisResults.redFlags?.critical && analysisResults.redFlags.critical.length > 0 && (
              <Card className="border-red-300">
                <CardHeader>
                  <CardTitle className="flex items-center text-red-800">
                    <AlertTriangle className="mr-2 size-5" />
                    Critical Red Flags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysisResults.redFlags.critical.map((flag: any, index: number) => (
                      <div key={index} className="border-l-4 border-red-500 pl-4 py-2 bg-red-50">
                        <div className="flex items-start mb-2">
                          <AlertTriangle className="mr-2 size-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm font-semibold text-red-900">{flag.issue}</span>
                        </div>
                        <p className="text-xs text-red-700 ml-6">{flag.description}</p>
                        {flag.recommendation && (
                          <p className="text-xs text-red-800 mt-2 ml-6 font-semibold">
                            Action: {flag.recommendation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {analysisResults.redFlags?.moderate && analysisResults.redFlags.moderate.length > 0 && (
              <Card className="border-orange-300">
                <CardHeader>
                  <CardTitle className="flex items-center text-orange-800">
                    <AlertTriangle className="mr-2 size-5" />
                    Areas of Concern
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysisResults.redFlags.moderate.map((flag: any, index: number) => (
                      <div key={index} className="border-l-4 border-orange-500 pl-4 py-2 bg-orange-50">
                        <span className="text-sm font-semibold text-orange-900">{flag.issue}</span>
                        <p className="text-xs text-orange-700 mt-1">{flag.description}</p>
                        {flag.mitigatingFactors && (
                          <p className="text-xs text-gray-600 mt-2">
                            Mitigating factors: {flag.mitigatingFactors}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {analysisResults.redFlags?.minor && analysisResults.redFlags.minor.length > 0 && (
              <Card className="border-yellow-300">
                <CardHeader>
                  <CardTitle className="flex items-center text-yellow-800">
                    Minor Considerations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysisResults.redFlags.minor.map((flag: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2 text-yellow-600">•</span>
                        <span className="text-sm text-yellow-800">{flag}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {(!analysisResults.redFlags?.critical || analysisResults.redFlags.critical.length === 0) &&
             (!analysisResults.redFlags?.moderate || analysisResults.redFlags.moderate.length === 0) &&
             (!analysisResults.redFlags?.minor || analysisResults.redFlags.minor.length === 0) && (
              <Card className="border-green-300 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center text-green-800">
                    <CheckCircle2 className="mr-2 size-5" />
                    No Significant Red Flags Identified
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-green-700">
                    The candidate's profile appears clean with no major concerns identified during the analysis.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="rolefit">
          <div className="space-y-6">
            {/* Header Score Card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Role Requirements Alignment</h2>
                  <p className="text-gray-600 mt-1">Match against job requirements</p>
                </div>
                <div className="text-center">
                  <div className={`text-5xl font-bold mb-1 ${
                    (analysisResults.roleAlignment?.score || 0) >= 7 ? 'text-green-600' :
                    (analysisResults.roleAlignment?.score || 0) >= 5 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {analysisResults.roleAlignment?.score || 0}/10
                  </div>
                  <div className={`px-4 py-1 rounded-full text-sm font-semibold ${
                    (analysisResults.roleAlignment?.score || 0) >= 7 ? 'bg-green-100 text-green-800' :
                    (analysisResults.roleAlignment?.score || 0) >= 5 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {(analysisResults.roleAlignment?.score || 0) >= 7 ? 'Strong Fit' :
                     (analysisResults.roleAlignment?.score || 0) >= 5 ? 'Moderate Fit' :
                     'Weak Fit'}
                  </div>
                </div>
              </div>

              {analysisResults.roleAlignment?.hiringRecommendation && (
                <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500 mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Hiring Recommendation</h3>
                  <p className="text-lg text-gray-800">{analysisResults.roleAlignment.hiringRecommendation}</p>
                </div>
              )}

              {analysisResults.roleAlignment?.keyTakeaways && analysisResults.roleAlignment.keyTakeaways.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5" />
                    Key Takeaways
                  </h3>
                  <ul className="space-y-2">
                    {analysisResults.roleAlignment.keyTakeaways.map((takeaway: string, index: number) => (
                      <li key={index} className="flex items-start text-sm text-blue-900">
                        <span className="mr-2 mt-0.5 flex-shrink-0 font-bold">•</span>
                        <span>{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Requirements Matching Grid */}
            {(analysisResults.roleAlignment?.experienceMatch || 
              analysisResults.roleAlignment?.skillsMatch || 
              analysisResults.roleAlignment?.seniorityMatch || 
              analysisResults.roleAlignment?.culturalFit) && (
              <div className="grid md:grid-cols-2 gap-4">
                {analysisResults.roleAlignment.experienceMatch && (
                  <div className={`rounded-lg border-2 p-5 ${
                    analysisResults.roleAlignment.experienceMatch.matches 
                      ? 'bg-green-50 border-green-300' 
                      : 'bg-red-50 border-red-300'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">Experience Match</h3>
                      {analysisResults.roleAlignment.experienceMatch.matches ? (
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-600" />
                      )}
                    </div>
                    <p className="font-semibold text-gray-900 mb-2">
                      {analysisResults.roleAlignment.experienceMatch.candidateLevel}
                    </p>
                    <p className="text-sm text-gray-700">
                      {analysisResults.roleAlignment.experienceMatch.reasoning}
                    </p>
                  </div>
                )}

                {analysisResults.roleAlignment.skillsMatch && (
                  <div className={`rounded-lg border-2 p-5 ${
                    analysisResults.roleAlignment.skillsMatch.matches 
                      ? 'bg-green-50 border-green-300' 
                      : 'bg-red-50 border-red-300'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">Skills Match</h3>
                      {analysisResults.roleAlignment.skillsMatch.matches ? (
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-600" />
                      )}
                    </div>
                    <p className="font-semibold text-gray-900 mb-2">
                      {analysisResults.roleAlignment.skillsMatch.matchPercentage}% Match
                    </p>
                    <p className="text-sm text-gray-700">
                      {analysisResults.roleAlignment.skillsMatch.reasoning}
                    </p>
                  </div>
                )}

                {analysisResults.roleAlignment.seniorityMatch && (
                  <div className={`rounded-lg border-2 p-5 ${
                    analysisResults.roleAlignment.seniorityMatch.appropriate 
                      ? 'bg-green-50 border-green-300' 
                      : 'bg-red-50 border-red-300'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">Seniority Level</h3>
                      {analysisResults.roleAlignment.seniorityMatch.appropriate ? (
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-600" />
                      )}
                    </div>
                    <p className="font-semibold text-gray-900 mb-2">
                      {analysisResults.roleAlignment.seniorityMatch.level}
                    </p>
                    <p className="text-sm text-gray-700">
                      {analysisResults.roleAlignment.seniorityMatch.reasoning}
                    </p>
                  </div>
                )}

                {analysisResults.roleAlignment.culturalFit && (
                  <div className={`rounded-lg border-2 p-5 ${
                    analysisResults.roleAlignment.culturalFit.score >= 7 
                      ? 'bg-green-50 border-green-300' 
                      : analysisResults.roleAlignment.culturalFit.score >= 5
                      ? 'bg-yellow-50 border-yellow-300'
                      : 'bg-red-50 border-red-300'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">Cultural Fit</h3>
                      <div className="text-2xl font-bold">
                        {analysisResults.roleAlignment.culturalFit.score}/10
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">
                      {analysisResults.roleAlignment.culturalFit.assessment}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* What Matches Well */}
            {analysisResults.roleAlignment?.strengths && analysisResults.roleAlignment.strengths.length > 0 && (
              <div className="bg-green-50 rounded-xl border-2 border-green-300 p-6">
                <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center">
                  <CheckCircle2 className="mr-2 h-6 w-6" />
                  Strong Alignment Points
                </h3>
                <div className="space-y-4">
                  {analysisResults.roleAlignment.strengths.map((strength: any, index: number) => (
                    <div key={index} className="bg-white rounded-lg p-5 shadow-sm">
                      <h4 className="font-bold text-green-900 text-lg mb-2">
                        {strength.area}
                      </h4>
                      <p className="text-gray-700 mb-3 leading-relaxed">
                        {strength.description}
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

            {/* What's Missing */}
            {analysisResults.roleAlignment?.gaps && analysisResults.roleAlignment.gaps.length > 0 && (
              <div className="bg-red-50 rounded-xl border-2 border-red-300 p-6">
                <h3 className="text-xl font-bold text-red-900 mb-4 flex items-center">
                  <XCircle className="mr-2 h-6 w-6" />
                  Gaps & Weaknesses
                </h3>
                <div className="space-y-4">
                  {analysisResults.roleAlignment.gaps.map((gap: any, index: number) => (
                    <div key={index} className="bg-white rounded-lg p-5 shadow-sm">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-red-900 text-lg flex-1">
                          {gap.area}
                        </h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ml-3 ${
                          gap.severity === 'Critical' ? 'bg-red-200 text-red-900' :
                          gap.severity === 'Moderate' ? 'bg-orange-200 text-orange-900' :
                          'bg-yellow-200 text-yellow-900'
                        }`}>
                          {gap.severity}
                        </span>
                      </div>
                      <p className="text-gray-700 leading-relaxed mb-3">
                        {gap.description}
                      </p>
                      {gap.canBeAddressed && (
                        <div className="bg-blue-50 rounded p-3 border-l-4 border-blue-500">
                          <p className="text-sm text-blue-800">
                            <span className="font-semibold">Possible Solution:</span> {gap.addressingStrategy}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interview Focus Areas */}
            {analysisResults.roleAlignment?.interviewFocusAreas && analysisResults.roleAlignment.interviewFocusAreas.length > 0 && (
              <div className="bg-purple-50 rounded-xl border-2 border-purple-300 p-6">
                <h3 className="text-xl font-bold text-purple-900 mb-4 flex items-center">
                  <Users className="mr-2 h-6 w-6" />
                  Recommended Interview Focus Areas
                </h3>
                <div className="space-y-4">
                  {analysisResults.roleAlignment.interviewFocusAreas.map((area: any, index: number) => (
                    <div key={index} className="bg-white rounded-lg p-5 shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-bold text-purple-900 text-lg flex-1">
                          {area.topic}
                        </h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          area.priority === 'High' ? 'bg-red-100 text-red-800' :
                          area.priority === 'Medium' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {area.priority} Priority
                        </span>
                      </div>
                      <p className="text-gray-700 mb-3 leading-relaxed">
                        {area.reasoning}
                      </p>
                      {area.suggestedQuestions && area.suggestedQuestions.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-semibold text-purple-900 mb-2">Suggested Questions:</p>
                          <ul className="space-y-1">
                            {area.suggestedQuestions.map((question: string, qIdx: number) => (
                              <li key={qIdx} className="text-sm text-gray-700 flex items-start">
                                <span className="mr-2 mt-0.5">•</span>
                                <span>{question}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comprehensive Summary */}
            {analysisResults.roleAlignment?.comprehensiveAssessment && (
              <div className="bg-white rounded-xl border-2 border-gray-300 shadow-lg p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gray-200">
                  Comprehensive Role Fit Analysis
                </h3>
                <div className="prose max-w-none">
                  <div className="text-gray-800 text-base leading-relaxed space-y-4 whitespace-pre-line">
                    {analysisResults.roleAlignment.comprehensiveAssessment}
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Salary & Compensation Fit */}
      {analysisResults.compensation && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Compensation Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold">Expectation vs Budget</h4>
              <p className="text-sm text-gray-700">{analysisResults.compensation.analysis}</p>
            </div>
            <div>
              <Badge className={
                analysisResults.compensation.withinBudget 
                  ? "bg-green-100 text-green-800" 
                  : "bg-red-100 text-red-800"
              }>
                {analysisResults.compensation.withinBudget ? "Within Budget" : "Above Budget"}
              </Badge>
            </div>
            {analysisResults.compensation.marketComparison && (
              <div>
                <h4 className="font-semibold">Market Comparison</h4>
                <p className="text-sm text-gray-700">{analysisResults.compensation.marketComparison}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      {analysisResults.nextSteps && analysisResults.nextSteps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommended Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2">
              {analysisResults.nextSteps.map((step: string, index: number) => (
                <li key={index} className="text-sm text-gray-700">{step}</li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}