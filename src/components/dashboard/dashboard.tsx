"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Flame,
  Target,
  Zap,
  Loader2,
  RefreshCw,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressRadar } from "@/components/dashboard/progress-radar";
import { DailyQuestCard } from "@/components/dashboard/daily-quest-card";
import { WeaknessesCard } from "@/components/dashboard/weaknesses-card";
import { ActivityHeatmap } from "@/components/dashboard/activity-heatmap";
import { AchievementsSection } from "@/components/dashboard/achievements-section";
import { ExamCountdown } from "@/components/dashboard/exam-countdown";
import { WeakTopicsCard } from "@/components/dashboard/weak-topics-card";
import { ArenaCard } from "@/components/dashboard/arena-card";
import { CountUp } from "@/components/count-up";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import type { Student, SubjectProgress } from "@/lib/store";
import { cn, azDate } from "@/lib/utils";

interface StatCard {
  icon: typeof Zap;
  label: string;
  value: number;
  suffix?: string;
  sub?: string;
  // B3a: rəng kodlaması — Sual sayı=foreground, Streak=destructive (urgency)
  accent?: "primary" | "accent" | "amber" | "destructive" | "foreground";
}

export function Dashboard() {
  const { student, sessionId, setStudent, setAppView } = useStore();
  const [progress, setProgress] = React.useState<SubjectProgress[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const [s, p] = await Promise.all([
        api.getStudent(sessionId),
        api.getProgress(sessionId),
      ]);
      setStudent(s);
      setProgress(p);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [sessionId, setStudent]);

  React.useEffect(() => {
    load();
  }, [load]);

  if (loading || !student) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="size-6 animate-spin text-primary" />
        <p className="text-sm">Dashboard yüklənir...</p>
      </div>
    );
  }

  const toplamSual = (student.progress || progress).reduce((a, p) => a + p.hallSualSayi, 0);
  const dogruCavab = (student.progress || progress).reduce((a, p) => a + p.dogruCavab, 0);

  const stats: StatCard[] = [
    {
      icon: Target,
      label: "Sual sayı",
      value: toplamSual,
      sub: `${dogruCavab} doğru`,
      accent: "foreground",
    },
    {
      icon: Flame,
      label: "Streak",
      value: student.streak,
      suffix: " gün",
      sub: "ardıcıl fəaliyyət",
      accent: "destructive",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-end justify-between gap-3"
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Panel</p>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            Salam, {student.ad} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {azDate()} ·{" "}
            Hədəf: {student.hedefUniversite || "təyin olunmayıb"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="h-9 gap-1.5 shadow-sm active:scale-95"
            onClick={() => setAppView("generator")}
          >
            <BookOpen className="size-4" />
            Davam et
            <ArrowRight className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={load} disabled={loading} className="active:scale-95">
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            <span className="sr-only sm:not-sr-only">Yenilə</span>
          </Button>
        </div>
      </motion.div>

      {/* İmtahan Geri Sayım Widget-i (config varsa) */}
      <ExamCountdown />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {stats.map((s, i) => {
          const accentIconClass = cn(
            "flex size-8 items-center justify-center rounded-lg",
            s.accent === "accent"
              ? "bg-accent/10 text-accent"
              : s.accent === "destructive"
                ? "bg-destructive/10 text-destructive"
                : s.accent === "amber"
                  ? "bg-amber-500/10 text-amber-500"
                  : s.accent === "foreground"
                    ? "bg-foreground/5 text-foreground"
                    : "bg-primary/10 text-primary"
          );
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="h-full transition-all hover:shadow-md hover:-translate-y-0.5">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className={accentIconClass}>
                      <s.icon className="size-4" />
                    </div>
                    {s.accent === "accent" && (
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">
                        Aktiv
                      </span>
                    )}
                    {s.accent === "destructive" && student.streak > 0 && (
                      <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-medium text-destructive">
                        Yanğın!
                      </span>
                    )}
                  </div>
                  <div className="mt-3">
                    <CountUp
                      value={s.value}
                      suffix={s.suffix || ""}
                      className={cn(
                        // B3a: daha BÖYÜK rəqəmlər + font-stat + bold + color coding
                        "font-stat text-3xl font-bold tabular-nums sm:text-4xl",
                        s.accent === "accent" && "text-accent",
                        s.accent === "amber" && "text-amber-500",
                        s.accent === "destructive" && "text-destructive",
                        s.accent === "primary" && "text-primary",
                        s.accent === "foreground" && "text-foreground"
                      )}
                    />
                    {/* B3a: sub-text kiçik + muted */}
                    <div className="mt-0.5 text-xs text-muted-foreground">{s.label}</div>
                    {s.sub && <div className="mt-1 text-[11px] text-muted-foreground/80">{s.sub}</div>}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Bilik Arenası */}
      <ArenaCard />

      {/* Nailiyyətlər */}
      <AchievementsSection />

      {/* Aktivlik istilik xəritəsi */}
      <ActivityHeatmap />

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProgressRadar progress={student.progress || progress} />
        </div>
        <div className="space-y-6">
          <WeakTopicsCard />
          <WeaknessesCard />
        </div>
      </div>

      <DailyQuestCard sessionId={sessionId || ""} />

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <QuickAction
          icon={<Sparkles className="size-5" />}
          title="AI Müəllim"
          desc="Məsələ həll et, sual ver"
          onClick={() => setAppView("tutor")}
        />
        <QuickAction
          icon={<Target className="size-5" />}
          title="Sual Yarat"
          desc="İstənilən mövzudan A-E sual"
          onClick={() => setAppView("generator")}
        />

      </div>
    </div>
  );
}

function QuickAction({
  icon,
  title,
  desc,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:border-primary/30 hover:bg-accent/5 hover:shadow-md"
    >
      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </motion.button>
  );
}
