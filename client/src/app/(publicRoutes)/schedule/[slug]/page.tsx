import ErrorPage from "@/components/ErrorPage";
import LoadingPage from "@/components/LoadingPage";
import PublicBookingView from "@/modules/scheduling/ui/views/public-booking-view";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface Props {
    params: Promise<{ slug: string }>;
}

const Page = async ({ params }: Props) => {
    const { slug } = await params;
    const queryClient = getQueryClient();

    // Prefetch the public meeting type data
    void queryClient.prefetchQuery(
        trpc.scheduling.getPublicMeetingType.queryOptions({ slug })
    );

    return (
        <div className="min-h-screen bg-muted/30">
            <HydrationBoundary state={dehydrate(queryClient)}>
                <Suspense fallback={<LoadingPage />}>
                    <ErrorBoundary fallback={<ErrorPage />}>
                        <PublicBookingView slug={slug} />
                    </ErrorBoundary>
                </Suspense>
            </HydrationBoundary>
        </div>
    );
};

export default Page;
