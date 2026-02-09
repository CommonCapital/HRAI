"use client";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { MeetingIdViewHeader } from "../components/meeting-id-view-header";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/modules/hooks/use-confirm";
import { UpdateMeetingDialog } from "../components/update-meeting-dialog";
import { useState } from "react";
import { UpcomingState } from "../components/upcoming-state";
import { ProcessingState } from "../components/processing-state";
import { CancelledState } from "../components/cancelled-state";
import { ActiveState } from "../components/Active-state";
import { CompletedState } from "../components/Completed-state";

interface Props {
  meetingId: string;
}

export const MeetingIdView = ({ meetingId }: Props) => {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [updateMeetingDialogOpen, setUpdateMeetingDialogOpen] = useState(false);
  
  const { data } = useSuspenseQuery(
    trpc.meetings.getOnePublic.queryOptions({ id: meetingId })
  );

  const [RemoveConfirmation, confirmRemove] = useConfirm(
    "Delete Meeting",
    "This action cannot be undone. All meeting data will be permanently deleted.",
  );

  const removeMeeting = useMutation(trpc.meetings.remove.mutationOptions({
    onSuccess: async () => {
      await queryClient.invalidateQueries(trpc.meetings.getMany.queryOptions({}));
      router.push('/meetings');
    },
  }));

  const handleRemoveMeeting = async () => {
    const ok = await confirmRemove();
    if (!ok) return;
    await removeMeeting.mutateAsync({ id: meetingId });
  };

  const isActive = data.status === "active";
  const isUpcoming = data.status === "upcoming";
  const isCancelled = data.status === "cancelled";
  const isCompleted = data.status === "completed";
  const isProcessing = data.status === "processing";

  return (
    <>
      <RemoveConfirmation />
      <UpdateMeetingDialog
        open={updateMeetingDialogOpen}
        onOpenChange={setUpdateMeetingDialogOpen}
        initialValues={data}
      />
      
      <div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-6">
        {/* Header */}
        <MeetingIdViewHeader
          meetingId={meetingId}
          meetingName={data.name}
          onEdit={() => setUpdateMeetingDialogOpen(true)}
          onRemove={handleRemoveMeeting}
        />

        {/* Status-Based Content */}
        <div className="border-2 border-primary/10 bg-white shadow-orange-md">
          {isCancelled && <CancelledState />}
          {isProcessing && <ProcessingState />}
          {isCompleted && <CompletedState data={data} />}
          {isActive && <ActiveState meetingId={meetingId} />}
          {isUpcoming && <UpcomingState meetingId={meetingId} />}
        </div>
      </div>
    </>
  );
};