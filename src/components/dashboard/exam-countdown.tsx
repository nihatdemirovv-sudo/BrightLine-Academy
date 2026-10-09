"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  CalendarClock,
  Flame,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  PartyPopper,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/dashboard/info-tooltip";
import { cn, azDate } from "@/lib/utils";
import { api } from "@/lib/api";
import type { ExamConfig, ExamHistory } from "@/lib/api";
import { useStore } from "@/lib/store";

// "2025-09-15" → "15 Sentyabr 2025"
function formatExamDate(iso: string): string {
  try {
    const d = new Date(iso + "T00:00:00");
    if (isNaN(d.getTime())) return iso;
    const ay = [
      "Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun",
      "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr",
    ];
    return `${d.getDate()} ${ay[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return iso;
  }
}

export function ExamCountdown() {
  const sessionId = useStore((s) => s.sessionId) || "";
  const setAppView = useStore((s) => s.setAppView);

  const [history, setHistory] = React.useState<ExamHistory | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const h = await api.getExamHistory(sessionId);
      setHistory(h);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  React.useEffect(() => {
    load();
  }, [load]);

  // No config — show subtle prompt
  if (!loading && (!history || !history.config)) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-dashed border-border bg-card/50 transition-all hover:-translate-y-0.5 hover:shadow-md">
          <CardContent className="flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CalendarClock className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">İmtahan tarixini təyin et</p>
                <p className="text-xs text-muted-foreground">
                  Hədəf imtahan gününü seç və geri sayım + intensiv hazırlıq planı al.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 active:scale-95"
              onClick={() => setAppView("exam")}
            >
              Təyin et
              <ArrowRight className="size-3.5" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (loading || !history || !history.config) return null;

  const config: ExamConfig = history.config;
  const günQalıb = history.stats.günQalıb ?? 0;
  const imtahanTarixi = formatExamDate(config.imtahanTarixi);

  // Vaxtın keçmə faizi (qeydiyyat → imtahan)
  // createdAt-dən imtahan tarixinə qədər keçən vaxtın faizi
  const createdMs = config.createdAt ? new Date(config.createdAt).getTime() : Date.now();
  const examMs = new Date(config.imtahanTarixi + "T00:00:00").getTime();
  const totalSpan = Math.max(1, examMs - createdMs);
  const elapsedMs = Date.now() - createdMs;
  const elapsedPct = Math.min(100, Math.max(0, Math.round((elapsedMs / totalSpan) * 100)));

  // Vəziyyət: gün qalıb 0-dan kiçikdirsə imtahan günü keçib, 0-dısa bu gün
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const examDate = new Date(config.imtahanTarixi + "T00:00:00");
  const isToday = today.getTime() === examDate.getTime();
  const isPast = günQalıb < 0;

  // Rəng akseti
  const critical = günQalıb <= 7 && günQalıb > 0; // son həftə
  const accentBorder = isToday || isPast
    ? "border-accent/40"
    : critical
      ? "border-amber-500/40"
      : "border-primary/20";

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className={cn("overflow-hidden", accentBorder)}>
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Sol: geri sayım */}
            <div className="flex items-center gap-4">
              <motion.div
                animate={
                  isToday || critical
                    ? { scale: [1, 1.08, 1] }
                    : { scale: 1 }
                }
                transition={
                  isToday || critical
                    ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
                    : { duration: 0 }
                }
                className={cn(
                  "flex size-14 items-center justify-center rounded-2xl shrink-0",
                  isToday || isPast
                    ? "bg-accent/15 text-accent"
                    : critical
                      ? "bg-amber-500/15 text-amber-500"
                      : "bg-primary/10 text-primary"
                )}
              >
                {isToday || isPast ? (
                  <PartyPopper className="size-7" />
                ) : (
                  <CalendarClock className="size-7" />
                )}
              </motion.div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  {isPast ? (
                    <span className="font-stat text-3xl font-bold sm:text-4xl text-accent">
                      Bitdi
                    </span>
                  ) : (
                    <>
                      <span
                        className={cn(
                          "font-stat text-3xl font-bold tabular-nums sm:text-4xl",
                          critical ? "text-amber-500" : "text-primary"
                        )}
                      >
                        {günQalıb}
                      </span>
                      <span className="text-sm font-medium text-muted-foreground">gün qalıb</span>
                    </>
                  )}
                  <InfoTooltip
                    content="Hədəf imtahan tarixinə qədər qalan gün sayı."
                    side="right"
                  />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  İmtahan tarixi: <span className="font-medium text-foreground">{imtahanTarixi}</span>
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className={cn(
                      "gap-1 text-[10px]",
                      config.nov === "magistr"
                        ? "border-accent/40 text-accent"
                        : "border-primary/30 text-primary"
                    )}
                  >
                    <Sparkles className="size-2.5" />
                    {config.nov === "magistr" ? "Magistr" : "TQDK"}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {config.sualSayi} sual · {config.müddet} dəq
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    Keçid: {config.kecidBali} bal
                  </Badge>
                </div>
              </div>
            </div>

            {/* Sağ: son cəhd statistikaları */}
            {history.stats.toplamCəhd > 0 && (
              <div className="flex gap-4 sm:flex-col sm:items-end sm:gap-1">
                <div className="text-center sm:text-right">
                  <div className="font-stat text-xl font-bold text-foreground">
                    {history.stats.sonBal}
                  </div>
                  <div className="text-[10px] text-muted-foreground">son bal</div>
                </div>
                <div className="text-center sm:text-right">
                  <div className="font-stat text-xl font-bold text-accent">
                    {history.stats.enYaxşıBal}
                  </div>
                  <div className="text-[10px] text-muted-foreground">ən yaxşı</div>
                </div>
              </div>
            )}
          </div>

          {/* Progress bar: keçən vaxt */}
          {!isPast && !isToday && (
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Hazırlıq proqresi</span>
                <span className="font-stat font-medium">{elapsedPct}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${elapsedPct}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className={cn(
                    "h-full rounded-full",
                    critical
                      ? "bg-gradient-to-r from-amber-500 to-amber-400"
                      : "bg-gradient-to-r from-primary to-accent"
                  )}
                />
              </div>
            </div>
          )}

          {/* Mesajlar */}
          {isToday && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 p-2.5 text-sm text-accent"
            >
              <PartyPopper className="size-4 shrink-0" />
              <span className="font-medium">İmtahan günü budur! Uğurlar! 🍀</span>
            </motion.div>
          )}
          {critical && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-sm text-amber-600 dark:text-amber-400"
            >
              <Flame className="size-4 shrink-0" />
              <span className="font-medium">Son həftə! İntensivləşdir!</span>
            </motion.div>
          )}
          {isPast && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-2.5 text-sm text-muted-foreground"
            >
              <AlertTriangle className="size-4 shrink-0" />
              <span>İmtahan tarixi keçib. Yeni tarix təyin etməyi unutma.</span>
              <Button
                size="sm"
                variant="outline"
                className="ml-auto h-7 gap-1 text-xs"
                onClick={() => setAppView("exam")}
              >
                Yenilə
              </Button>
            </motion.div>
          )}

          {/* Alt: simulyator keçidi */}
          {!isPast && (
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
              <p className="text-xs text-muted-foreground">
                {azDate()} · {history.stats.toplamCəhd} cəhd tamamlandı
              </p>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => setAppView("exam")}
              >
                İmtahana Başla
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
