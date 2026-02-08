"use client";
import ErrorPage from "@/components/ErrorPage";
import LoadingPage from "@/components/LoadingPage";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
// import { DataTable } from "@/components/data-table"; // No longer needed as the main table component
// import { columns } from "../components/columns"; // No longer needed
import { EmptyState } from "@/components/ui/empty-state";
import { useAgentsFilters } from "@/modules/hooks/use-agents-filters";
import { DataPagination } from "../components/data-pagination";
import { useRouter } from "next/navigation";
import { AgentsGetMany } from "../../types"; // Assuming this is where AgentsGetMany comes from
import { AgentCard } from "../components/agent-card"; // New component for the Vapi-style card

// The Data flow logic remains the same here!
export const AgentsView = () => {
  const router = useRouter();
  const [filters, setFilters] = useAgentsFilters();
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.agents.getMany.queryOptions({
    ...filters
  }));

  return (
    <div className="flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-6">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(350px,1fr))] gap-x-6 gap-y-10 ">
        {data.items.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            onClick={() => router.push(`/agents/${agent.id}`)}
          />
        ))}
      </div>

      {data.items.length > 0 && (
        <DataPagination
          page={filters.page}
          totalPages={data.totalPages}
          onPageChange={(page) => setFilters({ page })}
        />
      )}

      {data.items.length === 0 && (
        <EmptyState
          title="Generate your first Venture Capitalist analyst Agent"
          description="
            Welcome to Advisora! 
            Train your first Venture Capitalist Agent to get started. 
            Each Agent will abide to your specific data from your training data, and will be able to visit your meetings, analysize reviews, and generate reports."
        />)}
    </div>
  );
};

export const AgentsViewLoading = () => {
  return (
    <LoadingPage
    />
  )
};
export const AgentsViewError = () => {
  return (
    <ErrorPage />
  )
};