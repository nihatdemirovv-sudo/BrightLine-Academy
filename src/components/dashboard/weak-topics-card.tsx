"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  Loader2,
  ArrowRight,
  Check,
  ChevronDown,
  Sparkles,
  AlertTriangle,
  Brain,
  BookOpen,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/dashboard/section-header";
import { api } from "@/lib/api";
import type { WeakTopic, WeakTopicsResult } from "@/lib/api";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Markdown } from "@/components/markdown";

// Önceliye görə prioritet dot rengi (1-5)
function priorityDot(oncelik: number): string {
  if (oncelik >= 5) return "bg-destructive";
  if (oncelik === 4) return "bg-amber-500";
  if (oncelik === 3) return "bg-primary/70";
  return "bg-muted-foreground/50";
}

function priorityLabel(oncelik: number): string {
  if (oncelik >= 5) return "Kritik";
  if (oncelik === 4) return "Yüksək";
  if (oncelik === 3) return "Orta";
  return "Aşağı";
}

function priorityTextClass(oncelik: number): string {
  if (oncelik >= 5) return "text-destructive";
  if (oncelik === 4) return "text-amber-500";
  if (oncelik === 3) return "text-primary";
  return "text-muted-foreground";
}

// Səhv nisbətinə görə bar rengi
function severityBarClass(sehvNisbeti: number): string {
  if (sehvNisbeti >= 70) return "bg-destructive";
  if (sehvNisbeti >= 40) return "bg-amber-500";
  return "bg-primary/70";
}

export function WeakTopicsCard() {
  const sessionId = useStore((s) => s.sessionId) || "";
  const setAppView = useStore((s) => s.setAppView);
  const setGeneratorPrefill = useStore((s) => s.setGeneratorPrefill);
  const setGeneratorPrefillMovzu = useStore((s) => s.setGeneratorPrefillMovzu);
  const setLessonPrefill = useStore((s) => s.setLessonPrefill);
  const { toast } = useToast();

  const [data, setData] = React.useState<WeakTopicsResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const [markingId, setMarkingId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const r = await api.getWeakTopics(sessionId);
      setData(r);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [sessionId]);

  function handleWork(wt: WeakTopic) {
    setGeneratorPrefill(wt.fenn);
    setGeneratorPrefillMovzu(wt.movzu);
    setAppView("generator");
  }

  function handleCreateLesson(wt: WeakTopic) {
    setLessonPrefill({ fenn: wt.fenn, movzu: wt.movzu });
    setAppView("lessons");
  }

  async function handleMarkLearned(wt: WeakTopic) {
    setMarkingId(wt.id);
    try {
      await api.markTopicLearned(wt.id, true);
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          weakTopics: prev.weakTopics.map((t) =>
            t.id === wt.id ? { ...t, oynenildi: true } : t
          ),
        };
      });
      toast({
        title: "Öyrənildi kimi işarələndi ✓",
        description: `${wt.movzu} — yaxşı iş!`,
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: " İşarələnmədi",
        description: e instanceof Error ? e.message : "Xəta",
      });
    } finally {
      setMarkingId(null);
    }
  }

  // Sort by oncelik desc (already from API, but be safe)
  const sorted = React.useMemo(() => {
    if (!data) return [] as WeakTopic[];
    return [...data.weakTopics].sort((a, b) => {
      // Learned go to the bottom
      if (a.oynenildi !== b.oynenildi) return a.oynenildi ? 1 : -1;
      return b.oncelik - a.oncelik;
    });
  }, [data]);

  const toplam = data?.stats.toplam || 0;
  const kritik = data?.stats.kritik || 0;
  const mesaj = data?.mesaj;

  const INITIAL_COUNT = 6;
  const visible = expanded ? sorted : sorted.slice(0, INITIAL_COUNT);
  const hiddenCount = Math.max(0, sorted.length - INITIAL_COUNT);

  return (
    <Card className="gap-4 py-5">
      <CardHeader>
        <SectionHeader
          eyebrow="AI Analitik"
          title="Zəif Mövzular"
          description={`AI sub-mövzu analizi · ${toplam} mövzu`}
          icon={<Target className="size-4 text-primary" />}
          info="AI tərəfindən sub-mövzu səviyyəsində təyin edilən zəif sahələr."
          action={
            kritik > 0 ? (
              <Badge variant="outline" className="border-destructive/40 text-destructive gap-1 text-[10px]">
                <AlertTriangle className="size-2.5" />
                {kritik} kritik
              </Badge>
            ) : undefined
          }
        />
      </CardHeader>
      <CardContent className="space-y-3">
        {!loaded ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Brain className="size-5" />
            </div>
            <p className="text-sm text-muted-foreground">
              Zəif mövzularını görmək üçün AI analiz başlat.
            </p>
            <Button size="sm" onClick={load} disabled={loading} className="gap-1.5">
              {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
              Analiz Et
            </Button>
          </div>
        ) : loading ? (
          <div className="space-y-2.5 py-1">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0.4 }}
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.08,
                }}
                className="rounded-xl border border-border p-3"
              >
                <div className="mb-2 flex items-center gap-2">
                  <div className="size-2 rounded-full bg-muted" />
                  <div className="h-3 w-20 rounded bg-muted" />
                  <div className="ml-auto h-3 w-12 rounded bg-muted" />
                </div>
                <div className="h-2 w-full rounded bg-muted" />
              </motion.div>
            ))}
          </div>
        ) : mesaj ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Brain className="size-5" />
            </div>
            <p className="text-sm text-muted-foreground">{mesaj}</p>
          </div>
        ) : sorted.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Zəif mövzu aşkarlanmayıb.
          </div>
        ) : (
          <>
            <AnimatePresence initial={false}>
              {visible.map((wt, i) => (
                <motion.div
                  key={wt.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ delay: Math.min(i * 0.04, 0.3) }}
                  className={cn(
                    "relative overflow-hidden rounded-xl border p-3 transition-all",
                    wt.oynenildi
                      ? "border-accent/30 bg-accent/5 opacity-60"
                      : wt.oncelik >= 4
                        ? "border-destructive/30 border-l-2 border-l-destructive bg-destructive/5"
                        : wt.oncelik === 3
                          ? "border-border bg-muted/20"
                          : "border-border"
                  )}
                >
                  <div className="flex items-start gap-2">
                    {/* Priority dot */}
                    <div className="mt-1 flex flex-col items-center gap-0.5">
                      <span className={cn("size-2 rounded-full", priorityDot(wt.oncelik))} />
                      <span className={cn("text-[9px] font-medium", priorityTextClass(wt.oncelik))}>
                        {wt.oncelik}
                      </span>
                    </div>
                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="secondary" className="text-[10px]">{wt.fenn}</Badge>
                        <span
                          className={cn(
                            "text-sm font-semibold",
                            wt.oynenildi && "line-through text-muted-foreground"
                          )}
                        >
                          {wt.movzu}
                        </span>
                        <span className={cn("text-[10px] font-medium", priorityTextClass(wt.oncelik))}>
                          · {priorityLabel(wt.oncelik)}
                        </span>
                        {wt.oncelik >= 4 && !wt.oynenildi && (
                          <Badge variant="outline" className="border-destructive/40 text-destructive gap-0.5 text-[9px]">
                            <AlertTriangle className="size-2.5" />
                            Kritik
                          </Badge>
                        )}
                      </div>

                      {/* Severity bar — B3b: smooth + shimmer */}
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, Math.max(0, wt.sehvNisbeti))}%` }}
                            transition={{ duration: 0.7, ease: "easeOut" }}
                            className={cn(
                              "relative h-full rounded-full transition-all duration-700 ease-out",
                              severityBarClass(wt.sehvNisbeti)
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
                        <span className="font-stat text-xs font-semibold tabular-nums text-muted-foreground">
                          {wt.sehvNisbeti}%
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          · {wt.sualSayi} sual
                        </span>
                      </div>

                      {/* AI tovsie */}
                      {wt.tovsie && (
                        <div className="mt-2 flex gap-1 text-[11px] leading-relaxed text-muted-foreground">
                          <Sparkles className="mt-0.5 size-2.5 shrink-0 text-amber-500" />
                          <Markdown content={wt.tovsie} inline className="text-[11px] text-muted-foreground" />
                        </div>
                      )}

                      {/* Actions */}
                      {!wt.oynenildi && (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleWork(wt)}
                            className="h-7 gap-1 text-[11px] active:scale-95"
                          >
                            Çalış
                            <ArrowRight className="size-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCreateLesson(wt)}
                            className="h-7 gap-1 text-[11px] text-primary hover:bg-primary/10 hover:text-primary active:scale-95"
                          >
                            <BookOpen className="size-3" />
                            Dərs Yarat
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkLearned(wt)}
                            disabled={markingId === wt.id}
                            className="h-7 gap-1 text-[11px] text-accent hover:bg-accent/10 hover:text-accent"
                          >
                            {markingId === wt.id ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <Check className="size-3" />
                            )}
                            Öyrəndim
                          </Button>
                        </div>
                      )}
                      {wt.oynenildi && (
                        <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-accent">
                          <Check className="size-3" />
                          Öyrənilmiş kimi işarələnib
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Expand button */}
            {hiddenCount > 0 && (
              <div className="flex justify-center pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded((v) => !v)}
                  className="h-8 gap-1 text-xs"
                >
                  {expanded ? "Daha az göstər" : `Hamısını Gör (+${hiddenCount})`}
                  <ChevronDown
                    className={cn(
                      "size-3.5 transition-transform",
                      expanded && "rotate-180"
                    )}
                  />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
