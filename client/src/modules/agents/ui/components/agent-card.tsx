"use client"
import { AgentsGetMany } from '../../types'; // Assuming this is the correct path
import { GeneratedAvatar } from '@/components/generated-avatar';
import { CornerRightDownIcon, VideoIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card'; // Assuming you have a Card component (e.g., from shadcn/ui)

interface AgentCardProps {
    agent: AgentsGetMany[number];
    onClick: () => void;
}

export const AgentCard = ({ agent, onClick }: AgentCardProps) => {
    return (
        <Card
            onClick={onClick}
            className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border-2 hover:border-blue-500 w-[350px]" // Added hover effect for clickability
        >
            <CardContent className="p-4 flex flex-col gap-y-4">
                {/* Agent Name and Avatar */}
                <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-x-3'>
                        <GeneratedAvatar
                            variant="initials"
                            seed={agent.name}
                            className='size-10' // Larger avatar for card view
                        />
                        <span className='font-bold text-lg capitalize truncate max-w-[150px]'>
                            {agent.name}
                        </span>
                    </div>

                    {/* Agent Status/Meetings Badge */}
                    <Badge className='
                        flex items-center gap-x-1 whitespace-nowrap
                        bg-gray-100 text-gray-800 hover:bg-gray-200
                    '
                        variant={'secondary'}
                    >
                        <VideoIcon className='size-3.5 text-blue-600' />
                        <span className="font-medium text-sm">
                            {agent.meetingCount} {agent.meetingCount === 1 ? 'meeting' : 'meetings'}
                        </span>
                    </Badge>
                </div>

                {/* Agent Instructions/Description */}
                <div className='flex flex-col gap-y-2'>
                    <span className='text-sm font-semibold text-gray-500'>
                        Training data:
                    </span>
                    <div className='flex items-start gap-x-2'>
                        <CornerRightDownIcon className='size-4 flex-shrink-0 text-muted-foreground mt-0.5'/>
                        <span className='text-sm text-muted-foreground line-clamp-2'> 
                            {agent.instructions}
                        </span>
                    </div>
                </div>

                {/* You could add more Vapi-style data here, like Model Name or Voice */}
                
            </CardContent>
        </Card>
    )
}