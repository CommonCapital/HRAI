import { ResponsiveDialog } from "@/components/responsive-dialog";
import { useRouter } from "next/navigation";
import { MeetingForm } from "./meeting-form";
import { useState } from "react";
import { Check, Copy, ExternalLink, PlusCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface NewAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NewMeetingDialog = ({ open, onOpenChange }: NewAgentDialogProps) => {
  const router = useRouter();
  
  return (
    <ResponsiveDialog
      title="New Meeting"
      description="Call a new Meeting"
      open={open}
      onOpenChange={onOpenChange}
    >
      <MeetingForm 
      onSuccess={(id) => {
        
      }}
      
      
      onCancel={() => onOpenChange(false)}
      />
    </ResponsiveDialog>
  );
};
