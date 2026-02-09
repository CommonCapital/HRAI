"use client";
import { DataTable } from "@/components/data-table";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { columns } from "../components/columns";
import { EmptyState } from "@/components/ui/empty-state";
import { useRouter } from "next/navigation";
import { useMeetingsFilters } from "../../hooks/use-meetings-filters";
import { DataPagination } from "@/components/data-pagination";

export const MeetingsView = () => {
  const trpc = useTRPC();
  const router = useRouter();
  const [filters, setFilters] = useMeetingsFilters();
  
  const { data } = useSuspenseQuery(trpc.meetings.getMany.queryOptions({
    ...filters,
  }));

  return (
    <div className="flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-8">
      {/* Page Header */}
      <div className="border-b-2 border-primary/10 pb-6">
        <h1 className="text-3xl font-semibold text-primary tracking-tight mb-2">
          Meetings
        </h1>
        <p className="text-sm font-light opacity-60 tracking-wide">
          AI-powered interviews and consultations with your agents
        </p>
      </div>

      {data.items.length > 0 ? (
        <>
          {/* Data Table */}
          <div className="border-2 border-primary/10 bg-white shadow-orange-md overflow-hidden">
            <DataTable
              data={data.items}
              columns={columns}
              onRowClick={(row) => router.push(`/meeting-call/${row.id}`)}
            />
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
      ) : (
        <div className="flex items-center justify-center min-h-[60vh]">
          <EmptyState
            title="Schedule Your First Meeting"
            description="Create AI-powered meetings where autonomous agents conduct interviews, evaluate candidates, and generate detailed reports based on your training data."
          />
        </div>
      )}
    </div>
  );
};

export default MeetingsView;