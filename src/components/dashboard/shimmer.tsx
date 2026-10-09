"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Tutarlı skeleton shimmer — dashboard kartları üçün.
 * `lines` sayıda növbəti sətirləri göstərir, hər biri fərqli eni.
 * animate-pulse + subtle scale ilə premium görünüş verir.
 */
interface ShimmerRowsProps {
  /** Skeletor sətir sayı (default 4) */
  count?: number;
  /** Hər sətirin hündürlüyü (default 12px) */
  rowHeight?: string;
  /** Əlavə className */
  className?: string;
  /** Gap ölçüsü (default gap-2) */
  gap?: string;
}

export function ShimmerRows({
  count = 4,
  rowHeight = "h-3",
  className,
  gap = "gap-2",
}: ShimmerRowsProps) {
  return (
    <div className={cn("flex flex-col", gap, className)}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.4 }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.08,
          }}
          className={cn(
            "rounded-md bg-muted",
            rowHeight,
            // Hər 4-cü sətir daha qısa, hər 2-ci daha uzun — görünüşü təbii etmək üçün
            i % 4 === 3 ? "w-2/3" : i % 2 === 0 ? "w-full" : "w-4/5"
          )}
        />
      ))}
    </div>
  );
}

/**
 * Tutarlı radar skeletoru — 9 fənn barı üçün.
 */
export function ShimmerRadar({ count = 9 }: { count?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <motion.div
            initial={{ opacity: 0.4 }}
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.06,
            }}
            className="h-3 w-16 shrink-0 rounded-md bg-muted"
          />
          <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ x: "-120%" }}
              animate={{ x: "120%" }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.08,
              }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/15 to-transparent"
            />
          </div>
          <motion.div
            initial={{ opacity: 0.4 }}
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.07,
            }}
            className="h-3 w-8 shrink-0 rounded-md bg-muted"
          />
        </div>
      ))}
    </div>
  );
}

/**
 * Heatmap skeletoru — 12 həftəlik grid.
 */
export function ShimmerHeatmap() {
  return (
    <div className="overflow-hidden">
      <div className="flex gap-[3px]">
        {Array.from({ length: 12 }).map((_, wIdx) => (
          <div key={wIdx} className="flex flex-1 flex-col gap-[3px]">
            {Array.from({ length: 7 }).map((_, dIdx) => (
              <motion.div
                key={dIdx}
                initial={{ opacity: 0.3 }}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: (wIdx * 0.012 + dIdx * 0.008),
                }}
                className="size-3.5 rounded-[4px] bg-muted"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Badge skeletoru — nailiyyət kartı üçün.
 */
export function ShimmerBadges({ count = 6 }: { count?: number }) {
  return (
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.4 }}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.06,
          }}
          className="flex w-20 shrink-0 flex-col items-center gap-1.5 rounded-xl border border-border p-2"
        >
          <div className="size-12 rounded-full bg-muted" />
          <div className="h-2 w-12 rounded bg-muted" />
        </motion.div>
      ))}
    </div>
  );
}
