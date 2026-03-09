// app/company/jobs/[jobId]/edit/page.tsx  ← SERVER COMPONENT
import { auth } from "@/lib/auth";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import ErrorPage from "@/components/ErrorPage";
import LoadingPage from "@/components/LoadingPage";
import { EditJobView } from "@/modules/jobs/ui/view/EditJobView";

interface Props {
  params: Promise<{ jobId: string }>;
}

export default async function EditJobPage({ params }: Props) {
  const { jobId } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth/sign-in");

  const queryClient = getQueryClient();

  // Prefetch the job so the form pre-fills instantly (no loading flash)
  void queryClient.prefetchQuery(trpc.jobs.getById.queryOptions({ jobId }));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<LoadingPage />}>
        <ErrorBoundary fallback={<ErrorPage />}>
          <EditJobView jobId={jobId} />
        </ErrorBoundary>
      </Suspense>
    </HydrationBoundary>
  );
}