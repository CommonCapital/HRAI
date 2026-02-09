
import UserCVAnalyses from "@/components/dashboard/user-contracts";

import ErrorPage from "@/components/ErrorPage";
import LoadingPage from "@/components/LoadingPage";

import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";

export default async function Dashboard() {
  const session = await auth.api.getSession({
          headers: await headers(),
        });
      
        if (!session) {
          redirect("/auth/sign-in");
        }

    const queryClient = getQueryClient();
    void queryClient.prefetchQuery(
        trpc.candidates.getUserCVAnalyses.queryOptions()
);

  return (
       <>
        
        <HydrationBoundary state={dehydrate(queryClient)}>
            <Suspense fallback={<LoadingPage />}>
                <ErrorBoundary fallback={<ErrorPage />}>
                  <UserCVAnalyses />
            </ErrorBoundary> 
                   
               
            </Suspense>
           
        </HydrationBoundary>
        </>
   
    
  );
}
