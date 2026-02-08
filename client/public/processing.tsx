"use client";

import { Loader } from "lucide-react";

export default function Processing() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-yellow-500 animate-pulse">
      <Loader className="w-20 h-20 mb-4" />
      <h2 className="text-xl font-semibold">Processing</h2>
    </div>
  );
}