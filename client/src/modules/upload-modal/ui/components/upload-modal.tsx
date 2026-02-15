'use client'
import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, Sparkles, UserCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTRPC } from "@/trpc/client";
import { CommandSelect } from "@/components/command-select";
import { GeneratedAvatar } from "@/components/generated-avatar";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
}

export function UploadModal({
  isOpen,
  onClose,
  onUploadComplete,
}: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [criteriaText, setCriteriaText] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [agentSearch, setAgentSearch] = useState("");
  const [criteriaSource, setCriteriaSource] = useState<"manual" | "agent" | null>(null);
  
  const queryClient = useQueryClient();
  const router = useRouter();
  const trpc = useTRPC();
  
  // Fetch agents for selection
  const agents = useQuery(
    trpc.agents.getMany.queryOptions({
      pageSize: 100,
      search: agentSearch,
    }),
  );
  
  // Auto-fill criteria when agent is selected
  useEffect(() => {
    if (selectedAgentId && agents.data?.items) {
      const selectedAgent = agents.data.items.find(a => a.id === selectedAgentId);
      if (selectedAgent?.instructions) {
        setCriteriaText(selectedAgent.instructions);
        setCriteriaSource("agent");
      }
    }
  }, [selectedAgentId, agents.data?.items]);
  
  /* ✅ BACKEND: candidates.analyzeCV mutation
   * Input: { file: { buffer, originalname, size }, criteriaText?, cvSource? }
   * Returns: CVAnalysis with id field
   */
  const uploadMutation = useMutation(
    trpc.candidates.analyzeCV.mutationOptions({
      onSuccess: (data) => {
        toast("Analysis Complete!", {
          description: "Opening results...",
          duration: 2000,
        });
        /* ✅ BACKEND: Invalidate candidates query cache */
        queryClient.invalidateQueries({ queryKey: ["candidates"] });
        onUploadComplete();
        handleClose();
        
        setTimeout(() => {
          /* ✅ ROUTE: /candidate/${id} matches backend structure */
          console.log("🚀 REDIRECTING TO:", `/candidate/${data.id}`);
          router.push(`/candidate/${data.id}`);
        }, 500);
      },
      onError: (error) => {
        toast("Analysis Failed", {
          description: error.message || "Failed to analyze CV/resume",
        });
      },
    })
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
    } else {
      toast("Invalid File", {
        description: "Please upload a PDF file",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast("No File Selected", {
        description: "Please select a PDF CV/resume to analyze",
      });
      return;
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    /* ✅ BACKEND: Mutation input matches cv-analysis.controllers.ts
     * Expected fields:
     * - file: { buffer: string, originalname: string, size: number }
     * - criteriaText?: string (optional job requirements)
     * - cvSource?: string (source tracking)
     */
    uploadMutation.mutate({
      file: {
        buffer: base64,
        originalname: file.name,
        size: file.size,
      },
      criteriaText: criteriaText || undefined,
      cvSource: "Upload form",
    });
  };

  const handleClose = () => {
    setFile(null);
    setCriteriaText("");
    setSelectedAgentId("");
    setAgentSearch("");
    setCriteriaSource(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: any) => {
      // Prevent closing during upload
      if (!uploadMutation.isPending) {
        handleClose();
      }
    }}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-amber-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="size-6 text-blue-600" />
            Analyze CV/Resume
          </DialogTitle>
          <DialogDescription>
            {uploadMutation.isPending 
              ? "Analyzing the CV with AI... This may take 30-60 seconds. Please ensure the resume image is clearly visible; otherwise, the provided information may be inconsistent."
              : "Upload a CV/resume and optionally specify your job requirements. Please ensure the resume image is clearly visible; otherwise, the provided information may be inconsistent."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Agent Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <UserCircle2 className="size-4" />
              Select Agent (Optional)
            </Label>
            <CommandSelect
              options={(agents.data?.items ?? []).map((agent) => ({
                id: agent.id,
                value: agent.id,
                children: (
                  <div className="flex items-center gap-2">
                    <GeneratedAvatar
                      seed={agent.name}
                      variant="initials"
                      className="border-2 border-primary/20 size-6"
                    />
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{agent.name}</span>
                      {agent.instructions && (
                        <span className="text-xs text-gray-500 truncate max-w-[300px]">
                          {agent.instructions.substring(0, 60)}...
                        </span>
                      )}
                    </div>
                  </div>
                ),
              }))}
              onSelect={(value) => {
                setSelectedAgentId(value);
              }}
              onSearch={setAgentSearch}
              value={selectedAgentId}
              placeholder="Choose an agent to auto-fill requirements"
            />
            {selectedAgentId && criteriaSource === "agent" && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                ✓ Job requirements auto-filled from agent. You can still edit below.
              </p>
            )}
            <p className="text-xs text-gray-500">
              💡 Select an agent to automatically use their job requirements, or write your own below.
            </p>
          </div>

          {/* Job Criteria Text Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="criteria" className="text-sm font-semibold">
                Job Requirements (Optional)
              </Label>
              <div className="flex gap-1">
                {selectedAgentId && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedAgentId("");
                      setCriteriaText("");
                      setCriteriaSource(null);
                    }}
                    className="text-xs h-7 text-red-600 hover:text-red-700"
                  >
                    Clear Agent
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCriteriaText(`Senior Backend Engineer
Required: Python, Django, PostgreSQL, 5+ years
Preferred: AWS, Docker, Kubernetes
Must have: Team leadership, system design
Avoid: No production experience`);
                    setSelectedAgentId("");
                    setCriteriaSource("manual");
                  }}
                  className="text-xs h-7"
                >
                  Backend Eng
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCriteriaText(`Full Stack Developer, 3-5 years
Required: React, Node.js, TypeScript
Preferred: Next.js, tRPC, Tailwind
Remote OK, $120k-$150k
Must have: Portfolio, GitHub`);
                    setSelectedAgentId("");
                    setCriteriaSource("manual");
                  }}
                  className="text-xs h-7"
                >
                  Full Stack
                </Button>
              </div>
            </div>
            <Textarea
              id="criteria"
              placeholder="Example: Senior Backend Engineer, 5+ years Python/Django, AWS experience required, team leadership preferred. $150k-$180k range."
              value={criteriaText}
              onChange={(e: any) => {
                setCriteriaText(e.target.value);
                // If user manually edits after agent selection, mark as manual
                if (e.target.value !== criteriaText && criteriaSource === "agent") {
                  setCriteriaSource("manual");
                }
              }}
              className="min-h-[120px] resize-none font-mono text-sm"
            />
            <p className="text-xs text-gray-500">
              💡 {selectedAgentId && criteriaSource === "agent" 
                ? "Agent requirements loaded. Feel free to edit or add more details." 
                : "Write naturally - AI understands various formats. Include required skills, experience level, and deal-breakers."}
            </p>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file" className="text-sm font-semibold">
              Upload CV/Resume
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              <input
                id="file"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="file"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="size-10 text-gray-400" />
                {file ? (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-green-600">
                      ✓ {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Click to change file
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-700">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PDF only (max 50MB)</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={uploadMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!file || uploadMutation.isPending}
              className="bg-black hover:bg-gray-900 text-white"
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Analyzing CV...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 size-4" />
                  Analyze CV With AI
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}