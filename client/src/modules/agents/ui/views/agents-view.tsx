"use client";
import ErrorPage from "@/components/ErrorPage";
import LoadingPage from "@/components/LoadingPage";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/ui/empty-state";
import { useAgentsFilters } from "@/modules/hooks/use-agents-filters";
import { DataPagination } from "../components/data-pagination";
import { useRouter } from "next/navigation";
import { AgentsGetMany } from "../../types";
import { AgentCard } from "../components/agent-card";

export const AgentsView = () => {
  const router = useRouter();
  const [filters, setFilters] = useAgentsFilters();
  const trpc = useTRPC();
  
  const { data } = useSuspenseQuery(trpc.agents.getMany.queryOptions({
    ...filters
  }));

  return (
    <div className="flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-8">
      {/* Page Header */}
      <div className="border-b-2 border-primary/10 pb-6">
        <h1 className="text-3xl font-semibold text-primary tracking-tight mb-2">
          AI Agents
        </h1>
        <p className="text-sm font-light opacity-60 tracking-wide">
          Autonomous agents trained on your hiring standards
        </p>
      </div>

      {/* Agents Grid */}
      {data.items.length > 0 && (
        <>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(350px,1fr))] gap-6">
            {data.items.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onClick={() => router.push(`/agents/${agent.id}`)}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="border-t-2 border-primary/10 pt-6">
            <DataPagination
              page={filters.page}
              totalPages={data.totalPages}
              onPageChange={(page) => setFilters({ page })}
            />
          </div>
        </>
      )}

      {/* Empty State */}
      {data.items.length === 0 && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <EmptyState
            title="Create Your First Agent"
            description="Deploy autonomous AI agents trained on your specific hiring criteria. Each agent conducts interviews, evaluates candidates, and delivers structured insights—without human intervention."
          />
        </div>
      )}
    </div>
  );
};

export const AgentsViewLoading = () => {
  return <LoadingPage />;
};

export const AgentsViewError = () => {
  return <ErrorPage />;
};