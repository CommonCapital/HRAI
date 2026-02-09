

import { auth } from "@/lib/auth";
import ContractResults from "./components/contract-results";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import LoadingPage from "@/components/LoadingPage";
import ErrorPage from "@/components/ErrorPage";
import { ErrorBoundary } from "react-error-boundary";

interface IContractResultsProps {
  params: { id: string };
}

export default async function ContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;  // ← Await params first
  
  const session = await auth.api.getSession({
    headers: await headers(),
  });
      
        if (!session) {
          redirect("/auth/sign-in");
        }

    const queryClient = getQueryClient();
    void queryClient.prefetchQuery(
       trpc.candidates.getCVAnalysisById.queryOptions({ id: id })
    )
  return (
    <>
      
    <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<LoadingPage />}>
            <ErrorBoundary fallback={<ErrorPage />}>
                    <ContractResults contractId={id} />;
            </ErrorBoundary>       
        </Suspense>
       
    </HydrationBoundary>

    </>
  )
}
