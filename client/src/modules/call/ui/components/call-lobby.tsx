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
    <p className="text-sm text-[rgba(255,106,0,0.6)] text-center px-4">
      Allow your browser access to your camera and microphone.
    </p>
  );
};

export const CallLobby = ({onJoin}: Props) => {
  const {useCameraState, useMicrophoneState} = useCallStateHooks();
  const {hasBrowserPermission: hasCameraPermission} = useCameraState();
  const {hasBrowserPermission: hasMicrophonePermission} = useMicrophoneState();
  const hasBrowserMediaPermission = hasCameraPermission && hasMicrophonePermission;

  return (
    <div className="flex flex-col items-center justify-center h-full bg-white">
     <div className="py-4 px-8 flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-y-6 bg-white rounded-lg p-10">
          <div className="flex flex-col gap-y-2 text-center">
            <h6 className="text-lg font-medium text-[#FF6A00]">Call Lobby</h6>
            <p className="text-sm text-[rgba(255,106,0,0.6)]">
              Adjust your camera and microphone settings before joining
            </p>
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
            <Button 
              asChild 
              variant="ghost" 
              className="text-[rgba(255,106,0,0.6)] hover:text-[#FF6A00]"
            >
              <Link href="/meetings">
                Cancel Call
              </Link>
            </Button>
            
            <Button
              onClick={onJoin}
              className="bg-[#FF6A00] text-white hover:bg-white hover:text-[#FF6A00] hover:border-[#FF6A00] border-2 border-transparent"
            >
              <LogInIcon className="mr-2 h-4 w-4" />
              Join Call
            </Button>
          </div>
        </div>
     </div>
    </div>
  )
}