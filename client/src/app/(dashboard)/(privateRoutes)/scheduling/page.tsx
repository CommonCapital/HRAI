import ErrorPage from "@/components/ErrorPage";
import LoadingPage from "@/components/LoadingPage";
import { auth } from "@/lib/auth";
import SchedulingView from "@/modules/scheduling/ui/views/scheduling-view";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

const Page = async () => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/auth/sign-in");
    }

    const queryClient = getQueryClient();
    
    // Prefetch availability
    void queryClient.prefetchQuery(
        trpc.scheduling.getAvailability.queryOptions()
    );

    // Prefetch bookings
    void queryClient.prefetchQuery(
        trpc.scheduling.getUserBookings.queryOptions()
    );

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <Suspense fallback={<LoadingPage />}>
                <ErrorBoundary fallback={<ErrorPage />}>
                    <SchedulingView />
                </ErrorBoundary>
            </Suspense>
        </HydrationBoundary>
    );
};

export default Page;
