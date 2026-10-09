"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { InfoTooltip } from "@/components/dashboard/info-tooltip";

interface SectionHeaderProps {
  /** Kiçik başlığın üstündəki uppercase etiket */
  eyebrow?: string;
  /** Əsas başlıq */
  title: string;
  /** Başlığın yanında göstərilən açıqlama (muted) */
  description?: string;
  /** Sağ tərəfdə göstərilən əlavə məzmun (button, badge və s.) */
  action?: React.ReactNode;
  /** Başlıq ikonu */
  icon?: React.ReactNode;
  /** Kontekstual tooltip mətni — başlığın yanında Info ikonu göstərir */
  info?: string;
  className?: string;
}

/**
 * B3c — Dashboard bölmə başlıqları üçün tutarlı stil.
 * - Üst: text-xs uppercase tracking-wider text-muted-foreground (eyebrow)
 * - Alt: text-lg font-heading bold + sağına action
 * - info prop: kontekstual izah üçün InfoTooltip (hover-də açılır)
 */
export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  icon,
  info,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-2",
        className
      )}
    >
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <div className="mt-0.5 flex items-center gap-1.5">
          {icon}
          <h2 className="font-heading text-lg font-bold tracking-tight">
            {title}
          </h2>
          {info && <InfoTooltip content={info} />}
        </div>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
