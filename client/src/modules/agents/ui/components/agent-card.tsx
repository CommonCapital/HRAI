"use client";
import { AgentsGetMany } from '../../types';
import { GeneratedAvatar } from '@/components/generated-avatar';
import { CornerRightDown, VideoIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface AgentCardProps {
  agent: AgentsGetMany[number];
  onClick: () => void;
}

export const AgentCard = ({ agent, onClick }: AgentCardProps) => {
  return (
    <Card
      onClick={onClick}
      className="cursor-pointer border-2 border-primary/10 hover:border-primary/30 hover:shadow-orange-lg transition-all duration-300 bg-white group"
    >
      <CardContent className="p-6 flex flex-col gap-y-4">
        {/* Header: Avatar + Name + Badge */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <GeneratedAvatar
              variant="initials"
              seed={agent.name}
              className="size-12 border-2 border-primary/20 group-hover:border-primary/40 transition-colors flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-primary truncate group-hover:text-primary/80 transition-colors">
                {agent.name}
              </h3>
              <p className="text-xs uppercase tracking-widest font-light opacity-60 mt-0.5">
                Autonomous Agent
              </p>
            </div>
          </div>
          
          <Badge 
            variant="outline"
            className="flex items-center gap-1.5 whitespace-nowrap border-primary/30 text-primary px-2 py-1 flex-shrink-0"
          >
            <VideoIcon size={14} strokeWidth={1.5} />
            <span className="font-mono text-xs font-semibold">
              {agent.meetingCount}
            </span>
          </Badge>
        </div>

        {/* Training Data Preview */}
        <div className="flex flex-col gap-2 pt-4 border-t border-primary/10">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest font-semibold text-primary">
              Training Data
            </span>
          </div>
          
          <div className="flex items-start gap-2">
            <CornerRightDown 
              size={14} 
              strokeWidth={1.5} 
              className="text-primary/40 mt-0.5 flex-shrink-0" 
            />
            <p className="text-sm font-light text-foreground/80 leading-relaxed line-clamp-2">
              {agent.instructions}
            </p>
          </div>
        </div>

        {/* Footer: Meeting Count */}
        <div className="flex items-center justify-between pt-4 border-t border-primary/10 text-xs font-light opacity-60">
          <span>{agent.meetingCount} {agent.meetingCount === 1 ? 'interview' : 'interviews'} conducted</span>
        </div>

        {/* Hover Indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary/10 group-hover:bg-primary transition-colors"></div>
      </CardContent>
    </Card>
  );
};