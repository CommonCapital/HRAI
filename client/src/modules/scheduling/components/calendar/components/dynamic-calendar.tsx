"use client";

import dynamic from "next/dynamic";
import type { AvailabilityCalendarProps } from "./availability-calendar";

export const DynamicAvailabilityCalendar = dynamic<AvailabilityCalendarProps>(
  () => import("./availability-calendar").then((mod) => mod.AvailabilityCalendar),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[calc(100vh-180px)] min-h-[400px] items-center justify-center rounded-lg border border-dashed bg-muted/50">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading calendar...</p>
        </div>
      </div>
    ),
  }
);
