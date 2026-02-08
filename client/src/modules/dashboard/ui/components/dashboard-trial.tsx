import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MAX_FREE_MEETINGS, MAX_FREE_AGENTS } from "@/modules/premium/constants";
import { TestTubeDiagonalIcon } from "lucide-react";
import React from "react"; 
export const DashboardTrial = () => {
    const trpc = useTRPC();
  //  const {data} = useQuery(trpc.premium.getFreeUsage.queryOptions());
   // if (!data) return null;

    return (
        <div className="border border-border/10 rounded-lg w-full bg-white/5 flex flex-col gap-y-2">
             <div className="p-3 flex flex-col gap-y-4">
               <div className="flex items-center gap-2">
                <TestTubeDiagonalIcon className="size-4" />
                    <p className="text-sm font-medium">Test Trial</p>

               </div>
               <div className="flex flex-col gap-y-2">
                 <p className="text-xs">
                  {/** You utilized {data.agentCount} agents from {MAX_FREE_AGENTS} available agents*/}
                  
                 </p>
                 {/**  <Progress className="bg-blue-400" value={(data.agentCount / MAX_FREE_AGENTS) * 100} /> */}
                    
               </div>
                   <div className="flex flex-col gap-y-2">
                 <p className="text-xs">
                  {/** You utilized {data.meetingCount} meetings from {MAX_FREE_MEETINGS} available meetings */}
                  
                 </p>
                 {/**  <Progress className="bg-blue-400" value={(data.meetingCount / MAX_FREE_MEETINGS) * 100} /> */}
                   
               </div>
             </div>
             <Button
             asChild
             className="bg-transparent border-t border-border/10 hoverg-white/10 rounded-t-none"
             >
                <Link href="/upgrade" className="">
                Upgrade
                </Link>
             </Button>
        </div>
    )
}