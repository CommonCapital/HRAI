// app/apply/[jobId]/page.tsx  ← PUBLIC SERVER COMPONENT (no auth)
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { ApplyView } from "@/modules/applications/ui/view/apply-view";

interface Props {
  params: Promise<{ jobId: string }>;
}

export default async function ApplyPage({ params }: Props) {
  const { jobId } = await params;

  const queryClient = getQueryClient();

  // Prefetch job details for the form header — baseProcedure so no auth needed
  void queryClient.prefetchQuery(trpc.jobs.getById.queryOptions({ jobId }));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense
        fallback={
          <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: "#FF6A00", opacity: 0.4, letterSpacing: "0.1em" }}>
              Loading…
            </div>
          </div>
        }
      >
        <ErrorBoundary
          fallback={
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, fontFamily: "sans-serif" }}>
              <p style={{ color: "#FF6A00", fontWeight: 600 }}>Position not found</p>
              <p style={{ color: "#aaa", fontSize: 13 }}>This listing may no longer be active.</p>
            </div>
          }
        >
          <ApplyView jobId={jobId} />
        </ErrorBoundary>
      </Suspense>
    </HydrationBoundary>
  );
}

// Tell Next.js this page has no layout (standalone public page)
export const dynamic = "force-dynamic";