"use client"
import LoadingPage from "@/components/LoadingPage";
import { authClient } from "@/lib/auth-client";

import { ChatUI } from "./chat-ui";


interface Props {
    meetingId: string;
    meetingName: string;
}

export const ChatProvider = ({meetingId, meetingName}: Props) => {
    const {data, isPending} = authClient.useSession();

    if (isPending || !data?.user) {
return <LoadingPage />
    };

    return (
        <ChatUI
           meetingId={meetingId}
           meetingName={meetingName}
           userId={data.user.id}
           userName={data.user.name}
           userImage={data.user.image ?? ""}
        />
    )
    
    
}