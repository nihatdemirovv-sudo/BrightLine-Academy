"use client";

import * as React from "react";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface InfoTooltipProps {
  /** İkonun yanında görünən açıqlama mətni */
  content: string;
  /** Tooltip-in tərəfi (default: "top") */
  side?: "top" | "bottom" | "left" | "right";
  /** İkon ölçüsü (default: "size-3.5") */
  iconClassName?: string;
  /** Əlavə className (wrapper üçün) */
  className?: string;
}

/**
 * Universal məlumat balacıq ikonu.
 * Header-lərdə və ya kart başlıqlarında kontekstual izah üçün istifadə olunur.
 * Hover-də shadcn Tooltip göstərir.
 */
export function InfoTooltip({
  content,
  side = "top",
  iconClassName,
  className,
}: InfoTooltipProps) {
  if (!content) return null;
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="Əlavə məlumat"
            className={cn(
              "inline-flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              className
            )}
          >
            <Info className={cn("size-3.5", iconClassName)} />
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs text-xs leading-relaxed">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
