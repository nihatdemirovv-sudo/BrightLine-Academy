"use client";

import * as React from "react";
import { formatBadge } from "@/lib/unread";
import { cn } from "@/lib/utils";

/** Qırmızı oxunmamış sayğac — 0 olanda heç nə göstərmir, 99-dan çox olanda "99+". */
export function UnreadBadge({ count, className }: { count?: number | null; className?: string }) {
  if (!count || count <= 0) return null;
  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold leading-none text-white shadow-sm tabular-nums",
        className
      )}
      aria-label={`${count} oxunmamış`}
    >
      {formatBadge(count)}
    </span>
  );
}

/** Kiçik qırmızı nöqtə — sayın yerləşmədiyi yerlər üçün (məs. menyu düyməsinin küncü). */
export function UnreadDot({ show, className }: { show: boolean; className?: string }) {
  if (!show) return null;
  return <span className={cn("absolute size-2.5 rounded-full border-2 border-background bg-red-500", className)} />;
}
