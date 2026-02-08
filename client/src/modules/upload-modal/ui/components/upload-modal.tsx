'use client'
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

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
import { Loader2, Upload, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTRPC } from "@/trpc/client";

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
  
  const queryClient = useQueryClient();
  const router = useRouter();
const trpc = useTRPC()
const uploadMutation = useMutation(
  trpc.contracts.analyzeContract.mutationOptions({
    onSuccess: (data) => {
      toast("Analysis Complete!", {
        description: "Opening results...",
        duration: 2000,
      });
      queryClient.invalidateQueries({ queryKey: ["user-contracts"] });
      onUploadComplete();
      handleClose();
      
      setTimeout(() => {
        console.log("🚀 REDIRECTING TO:", `/dashboard/contract/${data.id}`);
        router.push(`/contract/${data.id}`);
      }, 500);
    },
    onError: (error) => {
      toast("Analysis Failed", {
        description: error.message || "Failed to analyze pitch deck",
      });
    },
  })
);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
    } else {
      toast(
         "Invalid File",
        {
        
        description: "Please upload a PDF file",
        
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast(
         "No File Selected",
        {
        
        description: "Please select a PDF file to analyze",
       
      });
      return;
    }
const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');

 uploadMutation.mutate({
    file: {
      buffer: base64,
      originalname: file.name,
      size: file.size,
    },
    criteriaText: criteriaText || undefined,
    deckSource: "Upload form",
  });
  };

  const handleClose = () => {
    setFile(null);
    setCriteriaText("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: any) => {
      // Prevent closing during upload
      if (!uploadMutation.isPending) {
        handleClose();
      }
    }}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="size-6 text-purple-600" />
            Analyze Pitch Deck
          </DialogTitle>
          <DialogDescription>
            {uploadMutation.isPending 
              ? "Analyzing your pitch deck with AI... This may take 30-60 seconds."
              : "Upload a pitch deck and optionally specify your evaluation criteria"
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Criteria Text Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="criteria" className="text-sm font-semibold">
                Evaluation Criteria (Optional)
              </Label>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCriteriaText(`B2B SaaS, Series A, min $2M ARR, strong tech team
Preferred: Enterprise, AI/ML
Gross margin >70%, CAC payback <12mo
Avoid: Consumer, hardware`)}
                  className="text-xs h-7"
                >
                  Growth VC
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCriteriaText(`Seed to Series A, $500K-$3M ARR
Technical founders, 10+ customers
Capital efficient
Avoid: B2C, pre-revenue`)}
                  className="text-xs h-7"
                >
                  Early Stage
                </Button>
              </div>
            </div>
            <Textarea
              id="criteria"
              placeholder="Example: B2B SaaS, Series A, min $2M ARR, strong tech team. Preferred: Enterprise, AI/ML. Avoid: Consumer apps, hardware."
              value={criteriaText}
              onChange={(e: any) => setCriteriaText(e.target.value)}
              className="min-h-[120px] resize-none font-mono text-sm"
            />
            <p className="text-xs text-gray-500">
              💡 Write naturally - AI understands various formats. Include deal breakers and financial requirements.
            </p>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file" className="text-sm font-semibold">
              Upload Pitch Deck
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
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
                  Analyzing deck...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 size-4" />
                  Analyze Contract With AI
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}