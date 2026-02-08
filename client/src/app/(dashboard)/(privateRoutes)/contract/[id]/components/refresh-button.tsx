'use client';

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

export function RefreshButton() {
  const router = useRouter();
  
  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <Button onClick={handleRefresh} variant="outline">
      <RefreshCw className="mr-2 size-4" />
      Refresh
    </Button>
  );
}