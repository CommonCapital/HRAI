"use client";

import { XCircle } from "lucide-react";

export default function Cancelled() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-red-500">
      <XCircle className="w-20 h-20 mb-4" />
      <h2 className="text-xl font-semibold">Cancelled</h2>
    </div>
  );
}