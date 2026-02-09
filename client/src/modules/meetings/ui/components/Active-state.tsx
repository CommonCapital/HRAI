import { Button } from "@/components/ui/button";
import { ActivitySquareIcon, VideoIcon } from "lucide-react";
import Link from "next/link";


interface ActiveProps {
  meetingId: string;
}

export const ActiveState = ({ meetingId }: ActiveProps) => {
  return (
    <div 
      className="bg-white rounded border border-[rgba(255,106,0,0.1)] p-8 flex flex-col gap-y-6 items-center justify-center"
      style={{ boxShadow: '0 2px 8px rgba(255,106,0,0.08)' }}
    >
      {/* ICON - ORANGE EDITION */}
      <div className="text-[#FF6A00] w-16 h-16">
        <ActivitySquareIcon className="w-full h-full" />
      </div>

      {/* CONTENT - ORANGE HIERARCHY */}
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-[#FF6A00] tracking-tight">Meeting is Active</h2>
        <p className="text-[rgba(255,106,0,0.6)] font-light mt-2 leading-relaxed">
          The meeting will end once all participants leave.
        </p>
      </div>

      {/* ACTION BUTTON - ORANGE INVERSION */}
      <div className="w-full max-w-xs">
        <Button
          asChild
          className="w-full bg-[#FF6A00] text-white hover:bg-white hover:text-[#FF6A00] hover:border-[#FF6A00] border-2 border-transparent transition-all duration-200 font-medium tracking-wide uppercase text-sm px-6 py-4"
        >
          <Link href={`/call/${meetingId}`}>
            <VideoIcon className="w-4 h-4 mr-2" />
            Join Meeting
          </Link>
        </Button>
      </div>
    </div>
  );
};