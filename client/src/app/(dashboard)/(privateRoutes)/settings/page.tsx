import ErrorPage from "@/components/ErrorPage";
import LoadingPage from "@/components/LoadingPage";
import { auth } from "@/lib/auth";
import { UpgradeView } from "@/modules/premium/ui/view/upgrade-view";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { SettingsView } from "@/modules/settings/ui/view/SettingsView";

const Page = async() => {
    const session = await auth.api.getSession({
     headers: await headers(),
    });

    if (!session) {
       redirect("/auth/sign-in")
    };
    const queryClient = getQueryClient();
    
    // Prefetch connected accounts for seamless loading
    void queryClient.prefetchQuery(
        trpc.scheduling.getConnectedAccounts.queryOptions()
    );

    return (
     <HydrationBoundary state={dehydrate(queryClient)}>
       <Suspense fallback={<LoadingPage />}>
        <ErrorBoundary fallback={<ErrorPage />}>
            <SettingsView />
        </ErrorBoundary>
       </Suspense>
     </HydrationBoundary>
    )
}

export default Page;