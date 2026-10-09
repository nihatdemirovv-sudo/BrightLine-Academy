"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Calendar, Flame, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { InfoTooltip } from "@/components/dashboard/info-tooltip";
import { ShimmerHeatmap } from "@/components/dashboard/shimmer";
import { api } from "@/lib/api";
import type { HeatmapData } from "@/lib/api";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

// 12 həftəlik istilik xəritəsi (GitHub-style)
// intensivlik: 0=bos, 1-4 aktivlik səviyyəsi (1=açıq, 4=tünd zümrüt)

const MONTH_LABELS = [
  "Yan", "Fev", "Mar", "Apr", "May", "İyn",
  "İyl", "Avq", "Sen", "Okt", "Noy", "Dek",
];

// Həftənin günləri qısa (Bazar ertəsi = "Baz e" tarzında) — yalnız 3 gün göstəririk
const DAY_LABELS = ["Baz e", "Çər", "Cüm", "Şən"];

function intensivlikClass(i: number): string {
  switch (i) {
    case 1:
      return "bg-accent/40";
    case 2:
      return "bg-accent/65";
    case 3:
      return "bg-accent/85";
    case 4:
      return "bg-accent ring-1 ring-accent/30";
    default:
      return "bg-muted/40 dark:bg-muted/30";
  }
}

function parseDate(tarix: string): Date {
  // "2024-08-15" → Date
  const [y, m, d] = tarix.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function monthOf(tarix: string): number {
  return parseDate(tarix).getMonth();
}

function dayOfWeek(tarix: string): number {
  // 0=Bazar, 1=Bazar ertəsi, ..., 6=Şənbə
  return parseDate(tarix).getDay();
}

function formatDay(tarix: string): string {
  const d = parseDate(tarix);
  const gün = ["Bazar", "Bazar ertəsi", "Çərşənbə axşamı", "Çərşənbə", "Cümə axşamı", "Cümə", "Şənbə"][d.getDay()];
  const ay = MONTH_LABELS[d.getMonth()];
  return `${d.getDate()} ${ay}, ${gün}`;
}

export function ActivityHeatmap() {
  const sessionId = useStore((s) => s.sessionId) || "";
  const [data, setData] = React.useState<HeatmapData | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const d = await api.getActivityHeatmap(sessionId);
      setData(d);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  React.useEffect(() => {
    load();
  }, [load]);

  // Ay etiketləri: hər həftənin ilk gününün ayına baxırıq, ay dəyişəndə etiket qoyuruq
  const monthLabels = React.useMemo(() => {
    if (!data) return [] as { weekIdx: number; label: string }[];
    const labels: { weekIdx: number; label: string }[] = [];
    let prevMonth = -1;
    data.həftələr.forEach((w, idx) => {
      const first = w.günlər[0];
      if (!first) return;
      const m = monthOf(first.tarix);
      if (m !== prevMonth) {
        labels.push({ weekIdx: idx, label: MONTH_LABELS[m] });
        prevMonth = m;
      }
    });
    return labels;
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-1.5 text-base">
              <Calendar className="size-4 text-accent" />
              Aktivlik İstilik Xəritəsi
              <InfoTooltip content="Son 12 həftəlik fəaliyyətinizi göstərir. Tünd yaşıl = çox aktiv." />
            </CardTitle>
            <CardDescription className="mt-1">Son 12 həftə · {data?.toplamAktivlik || 0} aktivlik</CardDescription>
          </div>
          {data && (
            <div className="flex flex-wrap gap-3 text-right">
              <Stat label="Aktiv gün" value={data.aktivGünlər} accent="accent" />
              <Stat label="Cari seriya" value={data.cariStreak} suffix=" gün" accent="primary" icon={<Flame className="size-3" />} />
              <Stat label="Ən yaxşı gün" value={data.ənYaxşıGün} accent="amber" icon={<TrendingUp className="size-3" />} />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <ShimmerHeatmap />
            <div className="mt-3 flex items-center justify-end gap-1.5 pl-8">
              <span className="text-[10px] text-muted-foreground">Az</span>
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="size-3.5 animate-pulse rounded-[4px] bg-muted" />
              ))}
              <span className="text-[10px] text-muted-foreground">Çox</span>
            </div>
          </div>
        ) : !data ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Məlumat yüklənə bilmədi.
          </div>
        ) : (
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[600px]">
              {/* Ay etiketləri */}
              <div className="mb-1 flex pl-8">
                <div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${data.həftələr.length}, 1fr)`, gap: "3px" }}>
                  {data.həftələr.map((_, idx) => {
                    const lbl = monthLabels.find((m) => m.weekIdx === idx);
                    return (
                      <div key={idx} className="text-[10px] text-muted-foreground">
                        {lbl?.label ?? ""}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Grid: sol gün etiketləri + 12 həftə */}
              <div className="flex gap-1.5">
                {/* Sol gün etiketləri (yalnız 4 gün göstəririk: Bazar ertəsi, Çər, Cüm, Şən) */}
                <div className="flex w-7 flex-col gap-[3px] pt-[1px]">
                  {[1, 3, 5, 6].map((dow) => (
                    <div
                      key={dow}
                      className="flex h-3.5 items-center justify-end pr-1 text-[9px] text-muted-foreground/70"
                    >
                      {DAY_LABELS[[1, 3, 5, 6].indexOf(dow)]}
                    </div>
                  ))}
                </div>

                {/* Həftələr */}
                <TooltipProvider delayDuration={80}>
                  <div className="flex gap-[3px]">
                    {data.həftələr.map((week, wIdx) => (
                      <div key={wIdx} className="flex flex-col gap-[3px]">
                        {week.günlər.map((day, dIdx) => {
                          // dayOfWeek: 0=Bazar (yuxarı), 6=Şənbə (aşağı)
                          return (
                            <Tooltip key={dIdx}>
                              <TooltipTrigger asChild>
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.6 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  whileHover={{ scale: 1.35, zIndex: 10 }}
                                  transition={{
                                    delay: Math.min(wIdx * 0.015 + dIdx * 0.008, 0.6),
                                    duration: 0.3,
                                    scale: { duration: 0.15 },
                                  }}
                                  className={cn(
                                    "size-3.5 rounded-[4px] transition-colors cursor-default",
                                    intensivlikClass(day.intensivlik),
                                    day.intensivlik === 0 && "hover:bg-muted/60"
                                  )}
                                />
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                <div className="font-medium">{formatDay(day.tarix)}</div>
                                <div className="text-primary-foreground/80">
                                  {day.say > 0 ? `${day.say} aktivlik` : "Aktivlik yoxdur"}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </TooltipProvider>
              </div>

              {/* Legend */}
              <div className="mt-3 flex items-center justify-end gap-1.5 pl-8">
                <span className="text-[10px] text-muted-foreground">Az</span>
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={cn("size-3.5 rounded-[4px]", intensivlikClass(i))}
                  />
                ))}
                <span className="text-[10px] text-muted-foreground">Çox</span>
              </div>

              {/* Motivasyon mesajı — az aktivlik varsa */}
              {data.aktivGünlər < 3 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-3 flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2"
                >
                  <Flame className="size-4 shrink-0 text-accent" />
                  <p className="text-xs text-muted-foreground">
                    {data.aktivGünlər === 0
                      ? "Hələ aktivlik yoxdur — ilk sualı həll et və xəritən doldurmağa başla!"
                      : "Yaxşı başlanğıc! Hər gün bir az çalış və seriyani böyüt."}
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  suffix = "",
  accent = "primary",
  icon,
}: {
  label: string;
  value: number;
  suffix?: string;
  accent?: "primary" | "accent" | "amber";
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-end">
      <div
        className={cn(
          "flex items-center gap-1 font-stat text-base font-bold tabular-nums",
          accent === "accent" && "text-accent",
          accent === "primary" && "text-primary",
          accent === "amber" && "text-amber-500"
        )}
      >
        {icon}
        {value}
        {suffix}
      </div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}
