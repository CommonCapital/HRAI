"use client"


import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CallProvider } from "../components/call-provider";
import { CompletedState } from "@/modules/meetings/ui/components/Completed-state";

interface Props {
    meetingId: string;
};

export const CallView = ({meetingId}: Props) => {
    const trpc = useTRPC();
    const {data} = useSuspenseQuery(trpc.meetings.getOnePublic.queryOptions({id: meetingId}));
 
    if (data.status === "completed") {
        return (
            <div className="flex h-screen items-center justify-center">
            <CompletedState data={data}/>
            </div>
        )
    }

    return (
        <div>
            <CallProvider meetingId={meetingId} meetingName={data.name} />
        </div>
    )
}