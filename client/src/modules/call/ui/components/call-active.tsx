"use client";

import Link from "next/link";
import {
  CallControls,
  SpeakerLayout,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { Button } from "@/components/ui/button";
import { HRAILogo } from "@/modules/meetings/ui/components/logo";

interface Props {
  onLeave: () => void;
  onEnd: () => void;
  meetingName: string;
}

export const CallActive = ({ onLeave, onEnd, meetingName }: Props) => {
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();
  const participantCount = participants.length;

  return (
    <div className="flex flex-col justify-between text-[#FF6A00] bg-white overflow-hidden">
      {/* HEADER */}
      <div className="bg-white border-b border-[rgba(255,106,0,0.1)] p-4 flex items-center justify-between">
        {/* Left side: logo + info */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/"
            className="flex items-center justify-center p-1 border border-[rgba(255,106,0,0.1)] rounded-full w-10 h-10 sm:w-12 sm:h-12"
          >
            
          </Link>

          <div className="flex flex-row gap-5">
            <h4 className="text-sm sm:text-lg font-medium leading-tight truncate max-w-[160px] sm:max-w-none">
              {meetingName}
            </h4>
            <div className="mt-0.5 flex items-center text-xs sm:text-sm text-[rgba(255,106,0,0.6)] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6A00] mr-1 animate-pulse" />
              Live • {participantCount}{" "}
              {participantCount === 1 ? "person" : "people"}
            </div>
          </div>
        </div>

        {/* Desktop End Meeting Button */}
        <div className="hidden sm:flex">
          <Button 
            onClick={onEnd} 
            className="bg-[#FF6A00] text-white hover:bg-white hover:text-[#FF6A00] hover:border-[#FF6A00] border-2 border-transparent rounded-xl"
          >
            End Meeting
          </Button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-hidden mt-4">
        <SpeakerLayout />
      </div>

      {/* BOTTOM CONTROLS (always pinned at bottom on mobile) */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-[rgba(255,106,0,0.1)] p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 rounded-t-2xl sm:static sm:rounded-full sm:mt-4 sm:px-4 sm:py-2">
        <div className="flex-1 flex justify-center">
          <CallControls onLeave={onLeave} />
        </div>

        {/* Mobile End Meeting Button */}
        <div className="flex sm:hidden">
          <Button
            onClick={onEnd}
            className="w-full py-3 bg-[#FF6A00] text-white hover:bg-white hover:text-[#FF6A00] hover:border-[#FF6A00] border-2 border-transparent rounded-xl"
          >
            End Meeting
          </Button>
        </div>
      </div>
    </div>
  );
};