import { Card as ShadcnCard } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

type CardProps = ComponentProps<typeof ShadcnCard>;

export function Card({ className, ...props }: CardProps) {
  return (
    <ShadcnCard
      className={cn("gap-3 p-3", className)}
      {...props}
    />
  );
}