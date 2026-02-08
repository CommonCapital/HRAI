import ErrorPage from '@/components/ErrorPage';
import LoadingPage from '@/components/LoadingPage';
import { auth } from '@/lib/auth';
import { MeetingIdView } from '@/modules/meetings/ui/views/meetings-id-view';
import { getQueryClient, trpc } from '@/trpc/server';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import React, { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary';
interface Props {
  params: Promise<{
meetingId: string;
  }>
};
const Page = async ({params}: Props) => {
  const {meetingId } = await params;
  
  
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(
    trpc.meetings.getOnePublic.queryOptions({ id: meetingId}),
  );

  

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<LoadingPage />}>
        <ErrorBoundary fallback={<ErrorPage />}>
          <MeetingIdView meetingId={meetingId} />
        </ErrorBoundary>
      </Suspense>
    </HydrationBoundary>
  )
}

export default Page