// app/company/jobs/page.tsx  ← SERVER COMPONENT
import { auth } from "@/lib/auth";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import ErrorPage from "@/components/ErrorPage";
import LoadingPage from "@/components/LoadingPage";
import { JobsView } from "@/modules/jobs/ui/view/JobsView";

export default async function JobsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth/sign-in");

  const queryClient = getQueryClient();

  // Prefetch the user's job list so the view loads instantly
  void queryClient.prefetchQuery(
    trpc.jobs.myJobs.queryOptions({ includeClosed: false }),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<LoadingPage />}>
        <ErrorBoundary fallback={<ErrorPage />}>
          <JobsView />
        </ErrorBoundary>
      </Suspense>
    </HydrationBoundary>
  );
}