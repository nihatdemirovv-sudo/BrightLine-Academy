"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Star, TrendingUp, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { SectionHeader } from "@/components/dashboard/section-header";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { SubjectProgress } from "@/lib/store";

// fənn üzrə radar (bar list + stars)
const FENN_ORDER = [
  "Riyaziyyat",
  "Fizika",
  "Kimya",
  "Biologiya",
  "Tarix",
  "Ədəbiyyat",
  "Coğrafiya",
  "İngilis dili",
  "Azərbaycan dili",
  "İnformatika",
];

function fennDotColor(seviyye: number, hallSualSayi: number) {
  if (hallSualSayi === 0) return "bg-muted-foreground/30";
  if (seviyye >= 75) return "bg-accent";
  if (seviyye >= 40) return "bg-primary";
  return "bg-muted-foreground/60";
}

function fennBarClass(seviyye: number, hallSualSayi: number) {
  if (hallSualSayi === 0) return "bg-muted-foreground/25";
  if (seviyye >= 75) return "bg-gradient-to-r from-primary to-accent";
  if (seviyye >= 40) return "bg-gradient-to-r from-primary to-primary/70";
  return "bg-muted-foreground/60";
}

function Stars({ yildiz, hallSualSayi }: { yildiz: number; hallSualSayi: number }) {
  if (hallSualSayi === 0) {
    // Hələ sual həll etməyibsə boş ulduzları çox açıq göstər
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} className="size-3 text-muted-foreground/20" />
        ))}
      </div>
    );
  }
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            "size-3",
            i <= yildiz ? "fill-amber-400 text-amber-400" : "fill-muted text-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );
}

export function ProgressRadar({ progress }: { progress: SubjectProgress[] }) {
  const setAppView = useStore((s) => s.setAppView);
  const setSubjectDetailFenn = useStore((s) => s.setSubjectDetailFenn);

  const byFenn = React.useMemo(() => {
    const m = new Map<string, SubjectProgress>();
    for (const p of progress) m.set(p.fenn, p);
    return FENN_ORDER.map((fenn) =>
      m.get(fenn) || { fenn, seviyye: 0, yildiz: 0, dogruCavab: 0, hallSualSayi: 0 }
    );
  }, [progress]);

  const avg = React.useMemo(() => {
    const started = byFenn.filter((p) => p.hallSualSayi > 0);
    if (started.length === 0) return 0;
    const total = started.reduce((a, b) => a + b.seviyye, 0);
    return Math.round(total / started.length);
  }, [byFenn]);

  const strongCount = byFenn.filter((p) => p.seviyye >= 75).length;
  const startedCount = byFenn.filter((p) => p.hallSualSayi > 0).length;

  function handleClickFenn(fenn: string) {
    setSubjectDetailFenn(fenn);
    setAppView("subjectDetail");
  }

  return (
    <Card>
      <CardHeader>
        <SectionHeader
          eyebrow="Analitik"
          title="Tərəqqi Radarı"
          description={`${FENN_ORDER.length} fənn üzrə səviyyə · ${startedCount} fənn başladıblı`}
          icon={<TrendingUp className="size-4 text-accent" />}
          info="Hər fənn üzrə biliyi səviyyənizi 0-100% arası göstərir. 5 ulduz = mükəmməl."
          action={
            <div className="text-right">
              <div className="font-stat text-2xl font-bold text-primary">{avg}%</div>
              <div className="text-[11px] text-muted-foreground">ümumi səviyyə</div>
            </div>
          }
        />
      </CardHeader>
      <CardContent className="space-y-2">
        {byFenn.map((p, i) => {
          const isStarted = p.hallSualSayi > 0;
          return (
            <motion.div
              key={p.fenn}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => handleClickFenn(p.fenn)}
              className="group cursor-pointer rounded-lg border border-transparent p-1.5 transition-all hover:border-border hover:bg-muted/40 hover:shadow-sm"
            >
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className={cn("size-2 rounded-full", fennDotColor(p.seviyye, p.hallSualSayi))} />
                  <span className={cn("text-sm font-medium", !isStarted && "text-muted-foreground")}>{p.fenn}</span>
                  <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
                <div className="flex items-center gap-2">
                  <Stars yildiz={p.yildiz} hallSualSayi={p.hallSualSayi} />
                  <TooltipProvider delayDuration={120}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className={cn(
                            "font-stat text-sm font-bold tabular-nums cursor-help",
                            isStarted
                              ? p.seviyye >= 75
                                ? "text-accent"
                                : p.seviyye >= 40
                                  ? "text-primary"
                                  : "text-foreground"
                              : "text-muted-foreground/50"
                          )}
                        >
                          {isStarted ? `${p.seviyye}%` : "—"}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        {isStarted
                          ? `${p.dogruCavab} / ${p.hallSualSayi} sual (${p.seviyye}%) · Detallı bax`
                          : "Bu fənndə hələ sual həll etməmisiniz"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              {isStarted ? (
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${p.seviyye}%` }}
                    transition={{ duration: 0.7, delay: i * 0.04, ease: "easeOut" }}
                    className={cn(
                      "relative h-full rounded-full transition-all duration-700 ease-out",
                      fennBarClass(p.seviyye, p.hallSualSayi)
                    )}
                  >
                    <motion.span
                      aria-hidden
                      initial={{ x: "-120%" }}
                      animate={{ x: "120%" }}
                      transition={{
                        duration: 2.4,
                        repeat: Infinity,
                        ease: "easeInOut",
                        repeatDelay: 1.5,
                      }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    />
                  </motion.div>
                </div>
              ) : (
                <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-medium text-muted-foreground">
                    Başlamayıb
                  </span>
                </div>
              )}
              {isStarted && (
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {p.dogruCavab} / {p.hallSualSayi} sual · <span className="text-primary/70 group-hover:text-primary">detallı bax</span>
                </p>
              )}
            </motion.div>
          );
        })}

        {strongCount > 0 && (
          <div className="mt-3 rounded-lg border border-accent/20 bg-accent/5 p-3 text-xs">
            <span className="font-semibold text-accent">{strongCount}</span> fənn üzrə yüksək səviyyədəsən 🎯
          </div>
        )}
      </CardContent>
    </Card>
  );
}
