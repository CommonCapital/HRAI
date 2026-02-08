"use client";

import Link from "next/link";
import Image from "next/image";
import {
  CallControls,
  SpeakerLayout,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

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
  <div className="flex flex-col justify-between text-white bg-[#0b0c0d] overflow-hidden">
    {/* HEADER */}
    <div className="bg-[#101213] rounded-2xl p-4 flex items-center justify-between">
      {/* Left side: logo + info */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Link
          href="/"
          className="flex items-center justify-center p-1 bg-white/10 rounded-full w-10 h-10 sm:w-12 sm:h-12"
        >
          <Image
            src="/logo.svg"
            alt="logo"
            width={48}
            height={48}
            className="object-contain"
          />
        </Link>

        <div className="flex flex-row gap-5">
          <h4 className="text-sm sm:text-lg font-medium leading-tight truncate max-w-[160px] sm:max-w-none">
            {meetingName}
          </h4>
          <div className="mt-0.5 flex items-center text-xs sm:text-sm text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse" />
            Live • {participantCount}{" "}
            {participantCount === 1 ? "person" : "people"}
          </div>
        </div>
      </div>

      {/* Desktop End Meeting Button */}
      <div className="hidden sm:flex">
        <Button onClick={onEnd} variant="destructive" className="rounded-xl">
          End Meeting
        </Button>
      </div>
    </div>

    {/* MAIN CONTENT */}
    <div className="flex-1 overflow-hidden mt-4">
      <SpeakerLayout />
    </div>

    {/* BOTTOM CONTROLS (always pinned at bottom on mobile) */}
    <div className="fixed bottom-0 left-0 w-full bg-[#101213] border-t border-[#1f2123] p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 rounded-t-2xl sm:static sm:rounded-full sm:mt-4 sm:px-4 sm:py-2">
      <div className="flex-1 flex justify-center">
        <CallControls onLeave={onLeave} />
      </div>

      {/* Mobile End Meeting Button */}
      <div className="flex sm:hidden">
        <Button
          onClick={onEnd}
          variant="destructive"
          className="w-full py-3 rounded-xl"
        >
          End Meeting
        </Button>
      </div>
    </div>
  </div>
);



};