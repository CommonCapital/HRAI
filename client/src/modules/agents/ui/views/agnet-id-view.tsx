"use client";
import ErrorPage from "@/components/ErrorPage";
import LoadingPage from "@/components/LoadingPage";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { AgentIdViewHeader } from "../components/agent-id-view-header";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { Badge } from "@/components/ui/badge";
import { VideoIcon, Users, FileText, Database } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useConfirm } from "@/modules/hooks/use-confirm";
import { useState } from "react";
import { UpdateAgentDialog } from "../components/update-agent-dialog";

interface Props {
  agentId: string;
}

export const AgentIdView = ({ agentId }: Props) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const [updateAgentDialogOpen, setUpdateAgentDialogOpen] = useState(false);
  
  const { data } = useSuspenseQuery(trpc.agents.getOne.queryOptions({ id: agentId }));
  
  const removeAgent = useMutation(
    trpc.agents.remove.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.agents.getMany.queryOptions({}));
        router.push('/agents');
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const [RemoveConfirmation, confirmRemove] = useConfirm(
    "Agent Deleting",
    `The following action will remove ${data.meetingCount} ${data.meetingCount === 1 ? 'meeting' : 'meetings'} and associated data`,
  );

  const handleRemoveAgent = async () => {
    const Confirm = await confirmRemove();
    if (!Confirm) return;
    await removeAgent.mutateAsync({ id: agentId });
  };

  return (
    <>
      <RemoveConfirmation />
      <UpdateAgentDialog
        open={updateAgentDialogOpen}
        onOpenChange={setUpdateAgentDialogOpen}
        initialValues={data}
      />
      
      <div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-6">
        {/* Header */}
        <AgentIdViewHeader
          agentId={agentId}
          agentName={data.name}
          onEdit={() => setUpdateAgentDialogOpen(true)}
          onRemove={handleRemoveAgent}
        />

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Agent Overview Card */}
          <div className="lg:col-span-2 border-2 border-primary/10 bg-white shadow-orange-md">
            <div className="p-6 border-b border-primary/10">
              <div className="flex items-center gap-4">
                <GeneratedAvatar
                  variant="initials"
                  seed={data.name}
                  className="size-16 border-2 border-primary/20"
                />
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold text-primary tracking-tight mb-1">
                    {data.name}
                  </h2>
                  <p className="text-xs uppercase tracking-widest font-light opacity-60">
                    Autonomous Agent
                  </p>
                </div>
              </div>
            </div>

            {/* Agent Stats */}
            <div className="p-6 border-b border-primary/10 bg-primary/5">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 border border-primary/10 bg-white">
                  <div className="text-2xl font-semibold text-primary font-mono mb-1">
                    {data.meetingCount}
                  </div>
                  <div className="text-xs uppercase tracking-widest opacity-60">
                    {data.meetingCount === 1 ? 'Interview' : 'Interviews'}
                  </div>
                </div>
                <div className="text-center p-4 border border-primary/10 bg-white">
                  <div className="text-2xl font-semibold text-primary font-mono mb-1">
                    94%
                  </div>
                  <div className="text-xs uppercase tracking-widest opacity-60">
                    Accuracy
                  </div>
                </div>
                <div className="text-center p-4 border border-primary/10 bg-white">
                  <div className="text-2xl font-semibold text-primary font-mono mb-1">
                    Active
                  </div>
                  <div className="text-xs uppercase tracking-widest opacity-60">
                    Status
                  </div>
                </div>
              </div>
            </div>

            {/* Training Data Section */}
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Database size={20} className="text-primary" strokeWidth={1.5} />
                    <h3 className="text-lg font-semibold text-primary tracking-tight">
                      Training Data
                    </h3>
                  </div>
                  <div className="border-l-4 border-primary pl-4 py-2">
                    <p className="text-sm font-light leading-relaxed opacity-80">
                      {data.instructions}
                    </p>
                  </div>
                </div>

                <div className="border-t border-primary/10 pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText size={20} className="text-primary" strokeWidth={1.5} />
                    <h3 className="text-lg font-semibold text-primary tracking-tight">
                      Report Template
                    </h3>
                  </div>
                  <div className="border-l-4 border-primary pl-4 py-2">
                    <p className="text-sm font-light leading-relaxed opacity-80">
                      {data.instructions2}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Quick Actions */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="border-2 border-primary/10 bg-white shadow-orange-md p-6">
              <h3 className="text-sm uppercase tracking-widest font-semibold text-primary mb-4">
                Agent Status
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-primary/10">
                  <span className="text-xs uppercase tracking-wide opacity-60">
                    State
                  </span>
                  <Badge variant="outline" className="border-primary/30 text-primary">
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-primary/10">
                  <span className="text-xs uppercase tracking-wide opacity-60">
                    Interviews
                  </span>
                  <span className="font-mono text-sm font-semibold text-primary">
                    {data.meetingCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wide opacity-60">
                    Last Updated
                  </span>
                  <span className="text-xs font-light opacity-60">
                    {new Date(data.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Capabilities Card */}
            <div className="border-2 border-primary/10 bg-white shadow-orange-md p-6">
              <h3 className="text-sm uppercase tracking-widest font-semibold text-primary mb-4">
                Capabilities
              </h3>
              <div className="space-y-3">
                {[
                  'Resume Screening',
                  'Structured Interviews',
                  'Claim Verification',
                  'Report Generation',
                  'Bias Detection'
                ].map((capability, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-primary flex-shrink-0"></div>
                    <span className="text-xs font-light opacity-80">{capability}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Card */}
            <div className="border-2 border-primary bg-primary/5 p-6">
              <div className="text-center space-y-2">
                <div className="text-3xl font-semibold text-primary font-mono">
                  {data.meetingCount}
                </div>
                <div className="text-xs uppercase tracking-widest opacity-60">
                  Total Interviews
                </div>
                <div className="pt-4 border-t border-primary/20">
                  <VideoIcon className="w-8 h-8 text-primary mx-auto" strokeWidth={1.5} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export const AgentIdViewLoading = () => {
  return <LoadingPage />;
};

export const AgentIdViewError = () => {
  return <ErrorPage />;
};