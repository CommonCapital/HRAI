"use client"

import { Loader2Icon } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { GeneratdAvatarUri } from "@/lib/avatar"
import { CallConnect } from "./call-connect";
import { GeneratedAvatar } from "@/components/generated-avatar";

interface Props {
    meetingId: string;
    meetingName: string;
}

export const CallProvider = ({meetingId, meetingName}: Props) => {
    const {data, isPending} = authClient.useSession();
    
    if (!data || isPending ) {
      return (
        <div className="flex h-screen items-center justify-center">
            <Loader2Icon className="animate-spin" />
        </div>
      )
}
    return (
        <div>
             <CallConnect 
             meetingId={meetingId}
             meetingName={meetingName}
             userId={data.user.id}
             userName={data.user.name}
             userImage={
                data.user.image ?? GeneratdAvatarUri({seed: data.user.name, variant:"initials"})
             }
             />
        </div>
     
    )
}