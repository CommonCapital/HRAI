"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const CallEnded = () => {
    return (
        <div className="flex flex-col items-center justify-center max-w-full max-h-full bg-white">
            <div className="py-4 px-8 flex flex-1 items-center justify-center">
                <div className="flex flex-col items-center justify-center gap-y-6 bg-white rounded-lg p-10 shadow-[0_2px_8px_rgba(255,106,0,0.08)]">
                    <div className="flex flex-col gap-y-2 text-center">
                        <h6 className="text-lg font-medium text-[#FF6A00]">You have ended the call</h6>
                        <p className="text-sm text-[rgba(255,106,0,0.6)]">
                            Data report is waiting for you in the meeting section
                        </p>
                    </div>
                    <Button 
                        asChild
                        className="bg-[#FF6A00] text-white hover:bg-white hover:text-[#FF6A00] hover:border-[#FF6A00] border-2 border-transparent"
                    >
                        <Link href="/meetings">Return to Meetings</Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}