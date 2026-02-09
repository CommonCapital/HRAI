"use client";
import { Button } from "@/components/ui/button";
import { PlusIcon, XCircleIcon } from "lucide-react";
import { NewAgentDialog } from "./new-agent-dialog";
import { useState } from "react";
import { useAgentsFilters } from "@/modules/hooks/use-agents-filters";
import { AgentsSearchFilter } from "./agents-search-filter";
import { DEFAULT_PAGE } from "@/constants";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export const AgentListHeader = () => {
  const [filters, setFilters] = useAgentsFilters();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const isAnyFilterModified = !!filters.search;
  
  const onClearFilters = () => {
    setFilters({
      search: "",
      page: DEFAULT_PAGE,
    });
  };

  return (
    <>
      <NewAgentDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
      
      <div className="py-6 px-4 md:px-8 flex flex-col gap-y-6 border-b-2 border-primary/10">
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-primary tracking-tight">
              My Agents
            </h1>
            <p className="text-sm font-light opacity-60 mt-1 tracking-wide">
              Autonomous agents trained on your hiring standards
            </p>
          </div>
          
          <Button 
            onClick={() => setIsDialogOpen(true)}
            className="h-12 px-6 bg-primary hover:bg-amber-600 hover:text-primary border-2 border-primary text-black font-light tracking-widest uppercase text-sm transition-all"
          >
            <PlusIcon size={18} strokeWidth={1.5} className="mr-2" />
            New Agent
          </Button>
        </div>

        {/* Filters Row */}
        <ScrollArea>
          <div className="flex items-center gap-3 p-1">
            <AgentsSearchFilter />
            
            {isAnyFilterModified && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onClearFilters}
                className="h-10 border-2 border-primary/20 hover:border-primary hover:bg-primary/5 text-primary font-light tracking-wide uppercase text-xs transition-all"
              >
                <XCircleIcon size={16} strokeWidth={1.5} className="mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </>
  );
};