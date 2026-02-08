import { Button } from "@/components/ui/button";
import { ActivitySquareIcon, VideoIcon } from "lucide-react";
import Link from "next/link";



interface Props {
    meetingId: string;
    
}
export const ActiveState = ({meetingId}: Props) => {
   return (
    <div className="bg-white rounded-lg px-4 py-5 flex flex-col gap-y-8 items-center justify-between">
        <ActivitySquareIcon />
        <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Meeting is active</h2>
        <p className="text-gray-500 mt-2">
          Meeting will end, once all participants leave.
        </p>
      </div>
       
      <div className="flex flex-col-reverse lg:flex-row lg:justify-center items-center gap-2 w-full"> 
       

       <Button  asChild className="w-full lg:w-auto">
        <Link href={`/call/${meetingId}`}>
         <VideoIcon />
        Join Meeting
        </Link>
       
       </Button>
      </div>


    </div>
   )
}