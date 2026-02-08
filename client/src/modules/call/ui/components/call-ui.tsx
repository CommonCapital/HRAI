"use client"



import { StreamTheme, useCall } from "@stream-io/video-react-sdk";
import { useState } from "react";
import { CallLobby } from "./call-lobby";
import { CallActive } from "./call-active";
import { CallEnded } from "./call-ended";
import { redirect } from "next/navigation";



interface Props {
    meetingName: string
}


export const CallUI =({meetingName}: Props) => {
 const call = useCall();
 const [show, setShow] = useState<"lobby" | "call" | "ended">("lobby");
 const handleJoin = async () => {
    if (!call) return;

    await call.join();
    setShow("call");
 };

 const handleEnd = () => {
    if (!call) return;

    call.endCall();
    setShow("ended");
 };
const handleLeave = () => {
   if (!call) return;

   call.leave()
   redirect("/meetings");
}
 return (
    <StreamTheme className="h-full">
                          {show === "lobby" && <CallLobby onJoin={handleJoin} />}
    
                           {show === "call" && <CallActive onLeave={handleLeave} onEnd={handleEnd} meetingName={meetingName}/>}
                            {show === "ended" && <CallEnded />}
    </StreamTheme>
 )


};