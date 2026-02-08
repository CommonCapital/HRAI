"use client";

import { LogInIcon } from "lucide-react";
import {
    DefaultVideoPlaceholder,
    StreamVideoParticipant,
    ToggleAudioPreviewButton,
    ToggleVideoPreviewButton,
    useCallStateHooks,
    VideoPreview
} from "@stream-io/video-react-sdk";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { GeneratdAvatarUri } from "@/lib/avatar";

import "@stream-io/video-react-sdk/dist/css/styles.css"


interface Props {
    onJoin: () => void;
};

const DisabledVideoPreview = () => {
    const {data} = authClient.useSession();
    return (
        <DefaultVideoPlaceholder
          participant={
            {
                name: data?.user.name ?? "",
                image: data?.user.image ?? GeneratdAvatarUri({seed: data?.user.name ?? "", variant:"initials"}),
                
            } as StreamVideoParticipant

        }
        />
    )
};

const AllowBrowserPermissions = () => {
  return (
    <p className="text-sm text-muted-foreground text-center px-4">
      Allow your browser access to your camera and microphone.
    </p>
  );
};

export const CallLobby = ({onJoin}: Props) => {
const {useCameraState, useMicrophoneState} = useCallStateHooks();
const {hasBrowserPermission: hasCameraPermission} = useCameraState();
const {hasBrowserPermission: hasMicrophonePermission} = useMicrophoneState();
const hasBrowserMediaPermission = hasCameraPermission && hasMicrophonePermission

return (
    <div className="flex flex-col items-center justify-center h-full bg-radial from-sidebar-accent to-sidebar">
     <div className="py-4 px-8 flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-y-6 bg-background rounded-lg p-10 shadow-sm">
          <div className="flex flex-col gap-y-2 text-center">
            <h6 className="text-lg font-medium">Call Lobby</h6>
            <p className="text-sm">Adjust your camera and microphone settings before joining</p>
          </div>
          <VideoPreview
            DisabledVideoPreview={
                hasBrowserMediaPermission 
                ? DisabledVideoPreview 
                : AllowBrowserPermissions}
          />

    <div className="flex gap-x-2">
       <ToggleVideoPreviewButton />
       <ToggleAudioPreviewButton />
    </div>

    <div className="flex gap-x-2 justify-between w-full">
    
     <Button asChild variant={'ghost'}>
        <Link href="/meetings">
        Cancel Call
        </Link>
     </Button>
    
     <Button
     onClick={onJoin}
     >
        
        <LogInIcon />
        Join Call
        
     </Button>

    </div>

        </div>
     </div>
    </div>
)
}