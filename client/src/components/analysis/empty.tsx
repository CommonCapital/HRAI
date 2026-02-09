import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import Link from "next/link";
import { UploadModal } from "@/modules/upload-modal/ui/components/upload-modal";
import { FileText, Upload, LayoutDashboard } from "lucide-react";

interface IEmptyStateProps {
  title: string;
  description: string;
}

export default function EmptyState({ title, description }: IEmptyStateProps) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-center p-4 mt-10">
        <Card className="w-full max-w-md border-2 border-primary/10 shadow-orange-lg">
          <CardHeader className="border-b border-primary/10 pb-6">
            {/* Icon header */}
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 border-2 border-primary/20 flex items-center justify-center">
                <FileText size={40} className="text-primary" strokeWidth={1.5} />
              </div>
            </div>
            
            <CardTitle className="text-2xl font-semibold text-primary text-center tracking-tight">
              {title}
            </CardTitle>
            <CardDescription className="text-center font-light text-sm mt-2">
              {description}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            <p className="text-sm font-light leading-relaxed text-center opacity-80">
              To receive your analysis, you need to upload a PDF document.
            </p>

            {/* Info box - minimal design */}
            <div className="border-l-4 border-primary p-4 bg-primary/5">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-widest font-semibold text-primary">
                  Note
                </p>
                <p className="text-sm font-light leading-relaxed opacity-80">
                  You can upload your contract in PDF or DXS format.
                </p>
              </div>
            </div>

            {/* Feature list - brutalist */}
            <div className="space-y-3 pt-4">
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 bg-primary mt-2 flex-shrink-0"></div>
                <p className="text-xs font-light opacity-80">Instant automated analysis</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 bg-primary mt-2 flex-shrink-0"></div>
                <p className="text-xs font-light opacity-80">Structured insights and recommendations</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 bg-primary mt-2 flex-shrink-0"></div>
                <p className="text-xs font-light opacity-80">Secure document processing</p>
              </div>
            </div>
          </CardContent>

          <CardFooter className="border-t border-primary/10 pt-6">
            <div className="flex flex-col w-full space-y-3">
              <Button
                onClick={() => setIsUploadModalOpen(true)}
                className="w-full h-12 bg-primary hover:bg-white hover:text-primary border-2 border-primary text-white font-light tracking-widest uppercase text-sm transition-all"
              >
                <Upload size={18} strokeWidth={1.5} className="mr-2" />
                Upload for Full Analysis
              </Button>
              
              <Button 
                className="w-full h-12 border-2 border-primary/20 hover:border-primary hover:bg-primary/5 text-primary font-light tracking-widest uppercase text-sm transition-all" 
                asChild 
                variant="outline"
              >
                <Link href="/dashboard">
                  <LayoutDashboard size={18} strokeWidth={1.5} className="mr-2" />
                  Go to Dashboard
                </Link>
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadComplete={() => setIsUploadModalOpen(true)}
      />
    </>
  );
}