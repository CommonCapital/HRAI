"use client"
import { ColumnDef } from '@tanstack/react-table';
import { MeetingGetMany } from '../../types';
import { GeneratedAvatar } from '@/components/generated-avatar';
import {  CircleCheckIcon, CircleXIcon, ClockArrowUpIcon, ClockFadingIcon, CornerRightDownIcon, LoaderIcon  } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {format} from 'date-fns';
import humanizeDuration from 'humanize-duration';
import { cn } from '@/lib/utils';

function formatDuration(seconds: number) {
  return humanizeDuration(seconds * 1000, {
    largest: 1,
    round: true,
    units: ["h", "m", "s"],
  });
}

const statusIconMap ={
  upcoming: ClockArrowUpIcon,
  active: LoaderIcon,
  completed: CircleCheckIcon,
  processing: LoaderIcon,
  cancelled: CircleXIcon,
};

const statusColorMap = {
  upcoming:"text-yellow-500 bg-yellow-100 border-yellow-500",
  active:"text-blue-500 bg-blue-100 border-blue-500",
  completed: "text-green-500 bg-green-100 border-green-500",
  cancelled: "text-red-500 bg-red-100 border-red-500",
  processing: "text-blue-500 bg-blue-100 border-blue-500",
  

}

export const columns: ColumnDef<MeetingGetMany[number]>[] = [
     {
        accessorKey: "name",
        header: "Meeting Name",
        cell: ({row}) => (
            <div className='flex flex-col gap-y-1'>
              <span className='font-semibold capitalize'>{row.original.name}</span>
               

               <div className='flex items-center gap-x-2'>
                 
                  <div className='flex items-center gap-x-1'>
                   <CornerRightDownIcon className='size-3 text-muted-foreground'/>
                   <span className='text-sm text-muted-foreground max-w-[200px] truncate capitalize'>
                    {row.original.agent.name}
                   </span>
                   </div>
                   <GeneratedAvatar variant='botttsNeutral' seed={row.original.agent.name} className='size-4' />
                   <span className='text-sm text-muted-foreground'>
                     {row.original.startedAt ? format(row.original.startedAt, "MMMM d") : ""}
                   </span>
                 </div>
               </div>

            
        )
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({row}) => {
          const Icon = statusIconMap[row.original.status as keyof typeof statusIconMap];
          return (
            <Badge variant='outline' className={cn("capitalize [&>svg]:size-4 text-muted-foreground", statusColorMap[row.original.status as keyof typeof statusColorMap])}>
              <Icon className={cn(row.original.status === "processing" && "animate-spin")}/>
              {row.original.status}
            </Badge>
          )
        },
    },
      {
          accessorKey: "duration",
          header: "Duration",
          cell: ({row}) => (
            <Badge
            variant='outline'
            className='capitalize [&>svg]:size-4 flex items-center gap-x-2'
            >
              <ClockFadingIcon className='text-blue-700'/>
              {row.original.duration ? formatDuration(row.original.duration) : "No duration"}
            </Badge>
          )
          
        }
]

   
