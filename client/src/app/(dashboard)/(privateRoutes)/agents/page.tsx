import LoadingPage from "@/components/LoadingPage";
import { auth } from "@/lib/auth";
import { loadSearchParams } from "@/modules/agents/params";
import { AgentListHeader } from "@/modules/agents/ui/components/agents-list-header";
import { AgentsView } from "@/modules/agents/ui/views/agents-view";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SearchParams } from "nuqs";
import { Suspense } from "react";
interface Props {
  searchParams: Promise<SearchParams>
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
 void  queryClient.prefetchQuery(trpc.agents.getMany.queryOptions({
  ...filters,
 }));

    return (
        
        
        <HydrationBoundary state={dehydrate(queryClient)}>
         <Suspense  fallback={<LoadingPage />}>
            <AgentListHeader/>
            <AgentsView />
          </Suspense>
        </HydrationBoundary>
        
    )
}
export default Page
