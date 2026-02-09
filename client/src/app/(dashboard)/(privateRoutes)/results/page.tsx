

import ErrorPage from "@/components/ErrorPage";
import LoadingPage from "@/components/LoadingPage";
import ContractAnalysisResults from "@/components/analysis/cv-analysis-results";
import EmptyState from "@/components/analysis/empty";
import { auth } from "@/lib/auth";


import { useContractStore } from "@/lib/contract-store";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";

export default async function ContractResultsPage() {
  

  const session = await auth.api.getSession({
    headers: await headers(),
  });
      
        if (!session) {
          redirect("/auth/sign-in");
        }

    const queryClient = getQueryClient();
    void queryClient.prefetchQuery(
       trpc.candidates.getUserCVAnalyses.queryOptions()
    )
  return (
    <>
      
    <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<LoadingPage />}>
            <ErrorBoundary fallback={<ErrorPage />}>
             
            </ErrorBoundary>       
        </Suspense>
       
    </HydrationBoundary>

    </>
  )
}
