// app/(dashboard)/(privateRoutes)/attendees/page.tsx  ← SERVER COMPONENT
import { auth } from "@/lib/auth";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import ErrorPage from "@/components/ErrorPage";
import LoadingPage from "@/components/LoadingPage";
import { AttendeesView } from "./ui/views/Attendess-view"; 
import { loadAttendeesParams } from "./params";
import { SearchParams } from "nuqs";
import { ApplicationStatus } from "@/modules/applications/types";

interface Props {
  searchParams: Promise<SearchParams>;
}

export default async function AttendeesPage({ searchParams }: Props) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth/sign-in");

const filters = await loadAttendeesParams.parse(searchParams);

  const queryClient = getQueryClient();

  // Prefetch the job selector list (all my jobs with counts)
  void queryClient.prefetchQuery(
    trpc.applications.myJobsWithCounts.queryOptions(),
  );

  // Prefetch applicants for the selected job (if any)


// Prefetch applicants for the selected job (if any)
if (filters.jobId) {
  void queryClient.prefetchQuery(
    trpc.applications.listForJob.queryOptions({
      jobId:    filters.jobId,
      page:     filters.page,
      pageSize: 20,
      search:   filters.search || undefined,
      status:   (filters.status || undefined) as ApplicationStatus | undefined, // ← fix here
    }),
  );
}

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<LoadingPage />}>
        <ErrorBoundary fallback={<ErrorPage />}>
          <AttendeesView />
        </ErrorBoundary>
      </Suspense>
    </HydrationBoundary>
  );
}