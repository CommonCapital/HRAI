'use client'
import ContractAnalysisResults from "@/components/analysis/Pitch-deck-analysis-results";

import { ContractAnalysis } from "@/lib/contract.interface";

import { notFound } from "next/navigation";
import {  useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";

import { authClient } from "@/lib/auth-client";
import { useTRPC } from "@/trpc/client";
import LoadingPage from "@/components/LoadingPage";

interface IContractResultsProps {
  contractId: string;
}

export default function ContractResults({ contractId }: IContractResultsProps) {
  
 

const trpc = useTRPC()
  const { data: session, isPending, error, refetch } = authClient.useSession();
const user = session?.user;
 const { data: contract } = useSuspenseQuery(
    trpc.contracts.getContractById.queryOptions({ id: contractId })
  );

  if (!contract) {
    return notFound();
  }

  

  if (error) {
    return notFound();
  }

  if (!contract) {
    return <LoadingPage />;
  }

  return (
    <ContractAnalysisResults
      contractId={contractId}
      analysisResults={contract}
      
      
    />
  );
}
