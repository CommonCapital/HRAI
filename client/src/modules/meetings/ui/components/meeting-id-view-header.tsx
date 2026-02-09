"use client"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";

import { DropdownMenu, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuContent} from '@/components/ui/dropdown-menu'
import { ChevronRightIcon, TrashIcon, PencilIcon, MoreVertical, MoreVerticalIcon } from "lucide-react";
import Link from "next/link";




interface Props {
    meetingId: string;
    meetingName: string;
    onEdit: () => void;
    onRemove: () => void;
}

export const MeetingIdViewHeader = ({
 meetingId,
 meetingName,
 onEdit,
 onRemove
}: Props) => {
return (
    <div className="flex items-center justify-between">
       <Breadcrumb>
        <BreadcrumbList>
         <BreadcrumbItem>
           <BreadcrumbLink asChild className="font-medium text-xl">
            <Link href="/meetings">
               Return to
              <h5 className="font-medium text-xl text-black justify-between bg-amber-500 rounded-md hover:text-4xl">
                My Meetings
              </h5>
            </Link>
           </BreadcrumbLink>
         </BreadcrumbItem>
         <BreadcrumbSeparator>
          <ChevronRightIcon className="text-foreground text-xl font-medium [&>svg]:size-4"/>
         </BreadcrumbSeparator>
          <BreadcrumbItem>
           <BreadcrumbLink asChild className="font-medium text-xl text-foreground">
            <Link href={`/agents/${meetingId}`}>
              {meetingName}
            </Link>
           </BreadcrumbLink>
         </BreadcrumbItem>
        </BreadcrumbList>
       </Breadcrumb>
       <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost">
                <MoreVerticalIcon />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
                <PencilIcon className="size-4 text-black" />
                Edit Meeting
            </DropdownMenuItem>

             <DropdownMenuItem onClick={onRemove}>
                <TrashIcon className="size-4 text-black"/>
                Delete Meeting
            </DropdownMenuItem>

        </DropdownMenuContent>
       </DropdownMenu>
    </div>
)
}