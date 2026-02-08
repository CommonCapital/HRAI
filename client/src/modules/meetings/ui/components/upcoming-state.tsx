import Upcoming from "../../../../../public/upcoming"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { VideoIcon } from "lucide-react"
interface Props {
    meetingId: string;
}
export const UpcomingState = ({meetingId }: Props) => {
   return (
    <div className="bg-white rounded-lg px-4 py-5 flex flex-col gap-y-8 items-center justify-between">
        <Upcoming />
        <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Not started yet</h2>
        <p className="text-gray-500 mt-2">
          Once you start this meeting, a data report will be available here.
        </p>
      </div>

      <div className="flex flex-col-reverse lg:flex-row lg:justify-center items-center gap-2 w-full"> 
      

       <Button asChild className="w-full lg:w-auto">
        <Link href={`/call/${meetingId}`}>
         <VideoIcon />
        Start Meeting
        </Link>
       
       </Button>
      </div>

    </div>
   )
}