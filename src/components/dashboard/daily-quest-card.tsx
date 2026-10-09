"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  Flame,
  Loader2,
  CalendarCheck,
  PartyPopper,
  Trophy,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SectionHeader } from "@/components/dashboard/section-header";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import type { DailyTask } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";

interface DailyQuestCardProps {
  sessionId: string;
}

// Confetti particles — emoji-based, no external libs
const CONFETTI_EMOJIS = ["🎉", "✨", "⭐", "🌟", "💫", "🎊"];

function ConfettiBurst({ trigger }: { trigger: number }) {
  // `trigger` changes (incremented) — re-render burst each time
  const particles = React.useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => ({
      id: `${trigger}-${i}`,
      emoji: CONFETTI_EMOJIS[i % CONFETTI_EMOJIS.length],
      angle: (i / 8) * Math.PI * 2,
      distance: 40 + Math.random() * 30,
      delay: Math.random() * 0.05,
    }));
  }, [trigger]);

  if (trigger === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
      <AnimatePresence>
        {particles.map((p) => {
          const dx = Math.cos(p.angle) * p.distance;
          const dy = Math.sin(p.angle) * p.distance - 20;
          return (
            <motion.span
              key={p.id}
              initial={{ opacity: 1, x: 0, y: 0, scale: 0.6 }}
              animate={{ opacity: 0, x: dx, y: dy, scale: 1.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: "easeOut", delay: p.delay }}
              className="absolute text-base"
              aria-hidden
            >
              {p.emoji}
            </motion.span>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function onemBadge(onem: string) {
  if (onem === "yuksek")
    return (
      <Badge variant="outline" className="border-destructive/40 text-destructive">
        Yüksək
      </Badge>
    );
  if (onem === "orta")
    return (
      <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-400">
        Orta
      </Badge>
    );
  return (
    <Badge variant="outline" className="text-muted-foreground">
      Aşağı
    </Badge>
  );
}

export function DailyQuestCard({ sessionId }: DailyQuestCardProps) {
  const { toast } = useToast();
  const [tasks, setTasks] = React.useState<DailyTask[]>([]);
  const [tamamlandi, setTamamlandi] = React.useState(0);
  const [toplam, setToplam] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const [completing, setCompleting] = React.useState<number | null>(null);
  // Index of the task that just completed (for confetti)
  const [celebratingIdx, setCelebratingIdx] = React.useState<number | null>(null);
  // Burst counter to re-trigger confetti
  const [burstCount, setBurstCount] = React.useState(0);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getDailyQuest(sessionId);
      setTasks(data.tasks || []);
      setTamamlandi(data.tamamlandi || 0);
      setToplam(data.toplam || (data.tasks?.length || 0));
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Plan yüklənmədi",
        description: e instanceof Error ? e.message : "Xəta baş verdi",
      });
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [sessionId, toast]);

  async function handleComplete(index: number) {
    if (tasks[index]?.tamamlandi) return;
    setCompleting(index);
    try {
      const r = await api.completeTask({ sessionId, taskIndex: index });
      setTasks(r.tasks);
      setTamamlandi(r.tamamlandi);
      // Trigger confetti on this card
      setCelebratingIdx(index);
      setBurstCount((c) => c + 1);
      // Auto-clear celebration after animation
      setTimeout(() => setCelebratingIdx(null), 1000);

      toast({ title: "Tamamlandı ✓" });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Tamamlanmadı",
        description: e instanceof Error ? e.message : "Xəta",
      });
    } finally {
      setCompleting(null);
    }
  }

  const pct = toplam > 0 ? Math.round((tamamlandi / toplam) * 100) : 0;
  const allDone = !loading && tasks.length > 0 && tamamlandi === toplam;
  const qalanSual = tasks.reduce((a, t) => a + (t.tamamlandi ? 0 : t.sualSayi), 0);

  return (
    <Card className="gap-4 py-5">
      <CardHeader>
        <SectionHeader
          eyebrow="Plan"
          title="Günlük Plan"
          description="Bugünkü tapşırıqlar"
          icon={<CalendarCheck className="size-4 text-primary" />}
          action={
            <div className="text-right">
              <div className="font-stat text-xl font-bold text-primary">
                {tamamlandi}<span className="text-muted-foreground">/{toplam}</span>
              </div>
              <div className="text-[11px] text-muted-foreground">tamamlandı</div>
            </div>
          }
        />
        {toplam > 0 && (
          <div className="mt-1">
            <Progress
              value={pct}
              className={cn(
                "h-2 transition-all duration-700 ease-out",
                allDone && "[&>div]:bg-gradient-to-r [&>div]:from-accent [&>div]:to-accent"
              )}
            />
            <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{pct}%</span>
              <span className="flex items-center gap-1">
                <Flame className="size-2.5 text-accent" />
                Qalan: {qalanSual} sual
              </span>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {!loaded ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarCheck className="size-5" />
            </div>
            <p className="text-sm text-muted-foreground">
              Bugünkü şəxsi tapşırıq planını AI ilə yarat.
            </p>
            <Button size="sm" onClick={load} disabled={loading} className="gap-1.5">
              {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
              Plan Yarat
            </Button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Plan hazırlanır...
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Bu gün üçün plan yoxdur. Yenidən yükləməyi yoxla.
          </div>
        ) : (
          tasks.map((t, i) => {
            const isCelebrating = celebratingIdx === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "relative flex items-start gap-3 overflow-hidden rounded-xl border p-3 transition-all",
                  t.tamamlandi
                    ? "border-accent/30 bg-accent/5 opacity-60"
                    : "border-border bg-card hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-md"
                )}
              >
                <ConfettiBurst trigger={isCelebrating ? burstCount : 0} />
                <button
                  onClick={() => handleComplete(i)}
                  disabled={t.tamamlandi || completing === i}
                  className="mt-0.5 shrink-0 transition-transform active:scale-90"
                  aria-label="Tamamla"
                >
                  {completing === i ? (
                    <Loader2 className="size-5 animate-spin text-primary" />
                  ) : t.tamamlandi ? (
                    <motion.div
                      initial={{ scale: 0.6 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    >
                      <CheckCircle2 className="size-5 text-accent" />
                    </motion.div>
                  ) : (
                    <Circle className="size-5 text-muted-foreground hover:text-primary" />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {t.fenn}
                    </Badge>
                    {onemBadge(t.onem)}
                  </div>
                  <p
                    className={cn(
                      "mt-1 text-sm font-medium",
                      t.tamamlandi && "line-through text-muted-foreground"
                    )}
                  >
                    {t.movzuQisa || t.movzu}
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 text-xs text-muted-foreground",
                      t.tamamlandi && "line-through"
                    )}
                  >
                    {t.movzu}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    <Flame className="mr-1 inline size-3 text-accent" />
                    {t.sualSayi} sual
                  </p>
                </div>
              </motion.div>
            );
          })
        )}
        {/* All-done celebration banner */}
        <AnimatePresence>
          {allDone && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 200, damping: 18 }}
              className="relative overflow-hidden rounded-xl border border-accent/40 bg-gradient-to-br from-accent/15 to-accent/5 p-4 text-center"
            >
              <motion.div
                aria-hidden
                initial={{ rotate: -10, scale: 0.8, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 250, damping: 12, delay: 0.1 }}
                className="mx-auto mb-2 flex size-10 items-center justify-center rounded-xl bg-accent/20 text-accent"
              >
                <PartyPopper className="size-5" />
              </motion.div>
              <p className="font-heading text-sm font-bold text-accent">
                🎉 Bugünkü plan tamamlandı!
              </p>
              <p className="mt-0.5 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                <Sparkles className="size-3 text-amber-500" />
                Yaxşı iş!
                <Trophy className="size-3 text-accent" />
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
