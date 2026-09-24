import { cn } from "@/lib/utils";

export function Separator({ className, orientation = "horizontal" }: { className?: string; orientation?: "horizontal" | "vertical" }) {
  return (
    <div
      className={cn(
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        "bg-white/10",
        className
      )}
    />
  );
}
