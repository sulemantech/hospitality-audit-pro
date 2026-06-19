import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border text-foreground",
        // Complaint severity
        critical: "border-transparent bg-red-100 text-red-700",
        high: "border-transparent bg-orange-100 text-orange-700",
        medium: "border-transparent bg-amber-100 text-amber-700",
        low: "border-transparent bg-green-100 text-green-700",
        // Status
        open: "border-transparent bg-orange-100 text-orange-700",
        resolved: "border-transparent bg-green-100 text-green-700",
        pending: "border-transparent bg-blue-100 text-blue-700",
        closed: "border-transparent bg-stone-100 text-stone-600",
        // Sentiment
        positive: "border-transparent bg-green-100 text-green-700",
        neutral: "border-transparent bg-stone-100 text-stone-600",
        negative: "border-transparent bg-red-100 text-red-700",
        // Property type
        hotel: "border-transparent bg-brand-muted text-brand-dark",
        hostel: "border-transparent bg-gold-light text-gold-dark",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
