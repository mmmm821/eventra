"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container flex flex-col items-center justify-center py-32 text-center">
      <AlertTriangle className="h-10 w-10 text-red-400 mb-4" />
      <h1 className="font-display text-2xl font-semibold text-white">Something went wrong</h1>
      <p className="text-white/50 mt-2 max-w-sm">An unexpected error occurred. You can try again, or head back home.</p>
      <Button className="mt-6" onClick={reset}>Try again</Button>
    </div>
  );
}
