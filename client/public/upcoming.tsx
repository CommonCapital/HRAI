"use client";

import { CalendarDays } from "lucide-react";

export default function Upcoming() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-amber-500">
      <CalendarDays className="w-20 h-20 mb-4" />
      <h2 className="text-xl font-semibold">Upcoming</h2>
    </div>
  );
}