import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-white/10 text-white",
        violet: "bg-violet-500/15 text-violet-300 border border-violet-500/30",
        pink: "bg-pink-500/15 text-pink-300 border border-pink-500/30",
        amber: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
        green: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
        red: "bg-red-500/15 text-red-300 border border-red-500/30",
        outline: "border border-white/15 text-white/70",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
