import ErrorPage from '@/components/ErrorPage';
import LoadingPage from '@/components/LoadingPage';
import { auth } from '@/lib/auth';
import { MeetingsListHeader } from '@/modules/meetings/ui/components/meetings-list-header';
import MeetingsView from '@/modules/meetings/ui/views/meetings-view'
import { getQueryClient, trpc } from '@/trpc/server'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import React, { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary';
import { loadSearchParams } from '@/modules/meetings/params';
import { SearchParams } from 'nuqs';


interface Props {
  searchParams: Promise<SearchParams>;
}


const Page = async ({searchParams}: Props) => {
  const filters = await loadSearchParams(searchParams);
   const session = await auth.api.getSession({
          headers: await headers(),
        });
      
        if (!session) {
          redirect("/auth/sign-in");
        }

    const queryClient = getQueryClient();
    void queryClient.prefetchQuery(
        trpc.meetings.getMany.queryOptions({
          ...filters,
        })
);
  return (
    <>
    <MeetingsListHeader />
    <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<LoadingPage />}>
            <ErrorBoundary fallback={<ErrorPage />}>
                <MeetingsView />
            </ErrorBoundary>       
        </Suspense>
       
    </HydrationBoundary>
    </>
  )
}

export default Page