"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Star,
  TrendingUp,
  Clock,
  Target,
  Brain,
  BookOpen,
  Bookmark,
  Layers,
  Check,
  AlertTriangle,
  Loader2,
  ListChecks,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  History,
  Zap,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { CountUp } from "@/components/count-up";
import { SectionHeader } from "@/components/dashboard/section-header";
import { api } from "@/lib/api";
import type {
  SubjectDetailResult,
  QuestionHistoryResult,
  SualDesti,
} from "@/lib/api";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { cn, azDateShort } from "@/lib/utils";
import { Markdown } from "@/components/markdown";

// === Aktivlik növlərinin etiketləri ===
const AKTIVLIK_LABELS: Record<string, { label: string; icon: typeof Zap; reng: string }> = {
  sual_helli: { label: "Sual həlli", icon: Target, reng: "text-primary" },
  exam_complete: { label: "İmtahan tamamlandı", icon: CheckCircle2, reng: "text-accent" },
  lesson_read: { label: "Dərs oxundu", icon: BookOpen, reng: "text-primary" },
  flashcard_review: { label: "Təkrar edildi", icon: Layers, reng: "text-accent" },
  daily_quest: { label: "Günlük plan", icon: Calendar, reng: "text-primary" },
  bookmark_added: { label: "Səhv saxlandı", icon: Bookmark, reng: "text-amber-500" },
};

// Relative time formatter (Az)
function relativeTime(iso: string): string {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const diff = Math.max(0, now - t);
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hour = Math.floor(min / 60);
  const day = Math.floor(hour / 24);
  if (sec < 60) return "indi";
  if (min < 60) return `${min} dəq əvvəl`;
  if (hour < 24) return `${hour} saat əvvəl`;
  if (day < 7) return `${day} gün əvvəl`;
  return azDateShort(new Date(iso));
}

// === Səhv nisbətinə görə bar rengi ===
function severityBarClass(sehvNisbeti: number): string {
  if (sehvNisbeti >= 60) return "bg-destructive";
  if (sehvNisbeti >= 30) return "bg-amber-500";
  return "bg-accent";
}

function severityTextClass(sehvNisbeti: number): string {
  if (sehvNisbeti >= 60) return "text-destructive";
  if (sehvNisbeti >= 30) return "text-amber-500";
  return "text-accent";
}

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

// === Ulduz reytingi ===
function StarsRow({ yildiz, size = "size-4" }: { yildiz: number; size?: string }) {
  return (
    <div className="flex gap-0.5" aria-label={`${yildiz} ulduz`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            size,
            i <= yildiz
              ? "fill-amber-400 text-amber-400"
              : "fill-muted text-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );
}

// === Böyük Dairəvi Proqres (seviyye %) ===
function BigCircularProgress({ value }: { value: number }) {
  const radius = 60;
  const stroke = 10;
  const size = 160;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;
  const [animatedValue, setAnimatedValue] = React.useState(0);

  React.useEffect(() => {
    const start = performance.now();
    const dur = 1200;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimatedValue(Math.round(eased * value));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  const strokeColor =
    value >= 75 ? "var(--accent)" : value >= 40 ? "var(--primary)" : "var(--muted-foreground)";

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg className="size-full -rotate-90" viewBox="0 0 160 160">
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-muted/40"
          strokeWidth={stroke}
        />
        <motion.circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-stat text-4xl font-bold tabular-nums sm:text-5xl"
          style={{ color: strokeColor }}
        >
          {animatedValue}
          <span className="text-xl">%</span>
        </span>
        <span className="mt-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Səviyyə
        </span>
      </div>
    </div>
  );
}

// === Bal Trend Qrafiki (SVG area chart) ===
function BalTrendChart({
  data,
}: {
  data: { tarix: string; bal: number; dogru: number }[];
}) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
          <TrendingUp className="size-5" />
        </div>
        <p className="text-sm text-muted-foreground">
          İmtahan simulyasiyası keçdikcə bal trendi formalaşacaq
        </p>
      </div>
    );
  }

  // Reverse to chronological order (oldest → newest)
  const pts = [...data].reverse();
  const width = 320;
  const height = 140;
  const padding = { top: 14, right: 14, bottom: 24, left: 28 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const maxBal = Math.max(100, ...pts.map((p) => p.bal));

  const xFor = (i: number) =>
    pts.length === 1
      ? padding.left + innerW / 2
      : padding.left + (i / (pts.length - 1)) * innerW;
  const yFor = (b: number) => padding.top + innerH - (b / maxBal) * innerH;

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(p.bal)}`).join(" ");
  const areaPath =
    `M ${xFor(0)} ${padding.top + innerH} ` +
    pts.map((p, i) => `L ${xFor(i)} ${yFor(p.bal)}`).join(" ") +
    ` L ${xFor(pts.length - 1)} ${padding.top + innerH} Z`;

  // Y-axis grid lines (0, mid, max)
  const yLines = [0, Math.round(maxBal / 2), maxBal];

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="size-full" role="img" aria-label="Bal trend qrafiki">
        <defs>
          <linearGradient id="balTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Grid */}
        {yLines.map((v, i) => {
          const y = yFor(v);
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="currentColor"
                className="text-muted-foreground/15"
                strokeWidth="1"
                strokeDasharray="2 3"
              />
              <text
                x={padding.left - 4}
                y={y + 3}
                textAnchor="end"
                className="fill-muted-foreground"
                style={{ fontSize: "8px" }}
              >
                {v}
              </text>
            </g>
          );
        })}
        {/* Area */}
        <motion.path
          d={areaPath}
          fill="url(#balTrendFill)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        />
        {/* Line */}
        <motion.path
          d={linePath}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        {/* Points */}
        {pts.map((p, i) => (
          <TooltipProvider key={i} delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.circle
                  cx={xFor(i)}
                  cy={yFor(p.bal)}
                  r="4"
                  fill="var(--background)"
                  stroke="var(--primary)"
                  strokeWidth="2.5"
                  className="cursor-help"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.08, type: "spring", stiffness: 300 }}
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <div className="font-medium">{azDateShort(new Date(p.tarix))}</div>
                <div className="text-primary-foreground/80">{p.bal} bal · {p.dogru} doğru</div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
        {/* X-axis labels (first + last) */}
        <text
          x={xFor(0)}
          y={height - 6}
          textAnchor="middle"
          className="fill-muted-foreground"
          style={{ fontSize: "8px" }}
        >
          {azDateShort(new Date(pts[0].tarix))}
        </text>
        {pts.length > 1 && (
          <text
            x={xFor(pts.length - 1)}
            y={height - 6}
            textAnchor="middle"
            className="fill-muted-foreground"
            style={{ fontSize: "8px" }}
          >
            {azDateShort(new Date(pts[pts.length - 1].tarix))}
          </text>
        )}
      </svg>
    </div>
  );
}

// === Shimmer overlay (subtle moving highlight on progress fills) ===
function ShimmerOverlay() {
  return (
    <motion.span
      aria-hidden
      initial={{ x: "-120%" }}
      animate={{ x: "120%" }}
      transition={{
        duration: 2.4,
        repeat: Infinity,
        ease: "easeInOut",
        repeatDelay: 1.2,
      }}
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
    />
  );
}

// === Mövzu Bölgüsü (horizontal bars) ===
function MovzuBolugu({
  data,
  onSelectMovzu,
}: {
  data: SubjectDetailResult["movzuStat"];
  onSelectMovzu: (movzu: string) => void;
}) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
          <Target className="size-4" />
        </div>
        <p className="text-xs text-muted-foreground">
          Bu fənndə hələ mövzu statistikan yoxdur. Sual həll etdikcə görünəcək.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {data.slice(0, 8).map((m, i) => (
          <motion.div
            key={m.movzu}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ delay: Math.min(i * 0.04, 0.3) }}
            className="group cursor-pointer rounded-lg border border-border p-3 transition-all hover:border-primary/30 hover:bg-muted/30"
            onClick={() => onSelectMovzu(m.movzu)}
          >
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm font-medium">{m.movzu}</span>
                <ChevronRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="gap-0.5 text-[9px]">
                  {m.sehv}/{m.toplam} səhv
                </Badge>
                <span
                  className={cn(
                    "font-stat text-xs font-bold tabular-nums",
                    severityTextClass(m.sehvNisbeti)
                  )}
                >
                  {m.sehvNisbeti}%
                </span>
              </div>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.max(0, m.sehvNisbeti))}%` }}
                transition={{ duration: 0.6, delay: i * 0.04, ease: "easeOut" }}
                className={cn(
                  "relative h-full rounded-full transition-all duration-700 ease-out",
                  severityBarClass(m.sehvNisbeti)
                )}
              >
                <ShimmerOverlay />
              </motion.div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      <p className="text-center text-[10px] text-muted-foreground">
        Mövzuya kliklə → mini-dərs yarat
      </p>
    </div>
  );
}

// === Zəif Mövzular bölməsi (reuse weak-topics logic) ===
function ZeifMovzularSection({
  items,
  onWork,
  onCreateLesson,
}: {
  items: SubjectDetailResult["zəifMövzular"];
  onWork: (movzu: string) => void;
  onCreateLesson: (movzu: string) => void;
}) {
  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-accent/10 text-accent">
          <Check className="size-4" />
        </div>
        <p className="text-sm font-medium">Zəif mövzu yoxdur</p>
        <p className="text-xs text-muted-foreground">Bu fənndə yaxşı gedirsən!</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {items.slice(0, 6).map((w, i) => (
          <motion.div
            key={w.movzu + i}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ delay: Math.min(i * 0.05, 0.3) }}
            className={cn(
              "rounded-xl border p-3 transition-all",
              w.oynenildi
                ? "border-accent/30 bg-accent/5 opacity-60"
                : w.oncelik >= 4
                  ? "border-destructive/30 border-l-2 border-l-destructive bg-destructive/5"
                  : "border-border"
            )}
          >
            <div className="flex items-start gap-2">
              <div className="mt-1 flex flex-col items-center gap-0.5">
                <span className={cn("size-2 rounded-full", priorityDot(w.oncelik))} />
                <span
                  className={cn(
                    "text-[9px] font-medium",
                    w.oncelik >= 5
                      ? "text-destructive"
                      : w.oncelik === 4
                        ? "text-amber-500"
                        : w.oncelik === 3
                          ? "text-primary"
                          : "text-muted-foreground"
                  )}
                >
                  {w.oncelik}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      w.oynenildi && "line-through text-muted-foreground"
                    )}
                  >
                    {w.movzu}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-medium",
                      w.oncelik >= 5
                        ? "text-destructive"
                        : w.oncelik === 4
                          ? "text-amber-500"
                          : w.oncelik === 3
                            ? "text-primary"
                            : "text-muted-foreground"
                    )}
                  >
                    · {priorityLabel(w.oncelik)}
                  </span>
                  {w.oncelik >= 4 && !w.oynenildi && (
                    <Badge variant="outline" className="border-destructive/40 text-destructive gap-0.5 text-[9px]">
                      <AlertTriangle className="size-2.5" />
                      Kritik
                    </Badge>
                  )}
                </div>
                {/* Severity bar */}
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, Math.max(0, w.sehvNisbeti))}%` }}
                      transition={{ duration: 0.6, delay: i * 0.04, ease: "easeOut" }}
                      className={cn(
                        "relative h-full rounded-full transition-all duration-700 ease-out",
                        severityBarClass(w.sehvNisbeti)
                      )}
                    >
                      <ShimmerOverlay />
                    </motion.div>
                  </div>
                  <span className="font-stat text-xs font-semibold tabular-nums text-muted-foreground">
                    {w.sehvNisbeti}%
                  </span>
                  <span className="text-[10px] text-muted-foreground">· {w.sualSayi} sual</span>
                </div>
                {/* AI tovsie */}
                {w.tovsie && (
                  <div className="mt-2 flex gap-1 text-[11px] leading-relaxed text-muted-foreground">
                    <Sparkles className="mt-0.5 size-2.5 shrink-0 text-amber-500" />
                    <Markdown content={w.tovsie} inline className="text-[11px] text-muted-foreground" />
                  </div>
                )}
                {/* Actions */}
                {!w.oynenildi && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onWork(w.movzu)}
                      className="h-7 gap-1 text-[11px] active:scale-95"
                    >
                      Çalış
                      <ArrowRight className="size-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onCreateLesson(w.movzu)}
                      className="h-7 gap-1 text-[11px] text-primary hover:bg-primary/10 hover:text-primary active:scale-95"
                    >
                      <BookOpen className="size-3" />
                      Dərs Yarat
                    </Button>
                  </div>
                )}
                {w.oynenildi && (
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
    </div>
  );
}

// === Son Aktivlik Timeline ===
function SonAktivlikTimeline({
  items,
}: {
  items: SubjectDetailResult["sonAktivlik"];
}) {
  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
          <Clock className="size-4" />
        </div>
        <p className="text-xs text-muted-foreground">
          Bu fənndə hələ aktivlik yoxdur
        </p>
      </div>
    );
  }
  return (
    <div className="relative space-y-3 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-px before:bg-border">
      {items.slice(0, 8).map((a, i) => {
        const meta = AKTIVLIK_LABELS[a.nov] || {
          label: a.nov,
          icon: Zap,
          reng: "text-muted-foreground",
        };
        const Icon = meta.icon;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(i * 0.04, 0.3) }}
            className="relative flex items-start gap-3 pl-1"
          >
            <div
              className={cn(
                "z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-background bg-card",
                meta.reng
              )}
            >
              <Icon className="size-3.5" />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium">{meta.label}</p>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {relativeTime(a.tarix)}
                </span>
              </div>
              {a.detal && (
                <p className="mt-0.5 text-[11px] text-muted-foreground">{a.detal}</p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// === Sual Dəstləri Tab ===
function SualDesteleriTab({ items }: { items: SualDesti[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
          <History className="size-4" />
        </div>
        <p className="text-xs text-muted-foreground">
          Bu fənndə hələ sual dəsti yaradılmayıb
        </p>
      </div>
    );
  }
  return (
    <div className="max-h-96 space-y-2 overflow-y-auto scrollbar-thin pr-1">
      {items.map((d, i) => (
        <motion.div
          key={d.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(i * 0.03, 0.3) }}
          className="flex items-center justify-between gap-2 rounded-lg border border-border p-3 transition-colors hover:bg-muted/30"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ListChecks className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">{d.fenn}</p>
              <p className="text-[10px] text-muted-foreground">
                {azDateShort(new Date(d.tarix))}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="gap-1 text-[10px]">
            <Target className="size-2.5" />
            {d.sualSayi} sual
          </Badge>
        </motion.div>
      ))}
    </div>
  );
}

// === Mini Stat Card (üst sırada) ===
function MiniStatCard({
  icon,
  label,
  value,
  suffix,
  accent = "primary",
  delay = 0,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  accent?: "primary" | "accent" | "foreground" | "amber";
  delay?: number;
}) {
  const colorClass = cn(
    accent === "primary" && "text-primary",
    accent === "accent" && "text-accent",
    accent === "amber" && "text-amber-500",
    accent === "foreground" && "text-foreground"
  );
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="h-full transition-all hover:shadow-md hover:-translate-y-0.5">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className={cn("flex size-7 items-center justify-center rounded-lg bg-muted/60", colorClass)}>
              {icon}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
          </div>
          <div className="mt-2">
            <CountUp
              value={value}
              suffix={suffix || ""}
              className={cn("font-stat text-3xl font-bold tabular-nums sm:text-4xl", colorClass)}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// === MAIN COMPONENT ===
export function SubjectDetail() {
  const sessionId = useStore((s) => s.sessionId) || "";
  const subjectDetailFenn = useStore((s) => s.subjectDetailFenn);
  const setSubjectDetailFenn = useStore((s) => s.setSubjectDetailFenn);
  const setAppView = useStore((s) => s.setAppView);
  const setGeneratorPrefill = useStore((s) => s.setGeneratorPrefill);
  const setGeneratorPrefillMovzu = useStore((s) => s.setGeneratorPrefillMovzu);
  const setLessonPrefill = useStore((s) => s.setLessonPrefill);
  const { toast } = useToast();

  const [detail, setDetail] = React.useState<SubjectDetailResult | null>(null);
  const [history, setHistory] = React.useState<QuestionHistoryResult | null>(null);
  const [loading, setLoading] = React.useState(true);

  const fenn = subjectDetailFenn || "";

  const load = React.useCallback(async () => {
    if (!sessionId || !fenn) return;
    setLoading(true);
    try {
      const [d, h] = await Promise.all([
        api.getSubjectDetail(sessionId, fenn),
        api.getQuestionHistory(sessionId, fenn, 50),
      ]);
      setDetail(d);
      setHistory(h);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Yüklənmə xətası",
        description: e instanceof Error ? e.message : "Server xətası",
      });
    } finally {
      setLoading(false);
    }
  }, [sessionId, fenn, toast]);

  React.useEffect(() => {
    load();
  }, [load]);

  function handleBack() {
    setSubjectDetailFenn(null);
    setAppView("dashboard");
  }

  function handleMovzuSelect(movzu: string) {
    // Mini-dərs yaratmağa prefill et
    setLessonPrefill({ fenn, movzu });
    setAppView("lessons");
  }

  function handleWorkMovzu(movzu: string) {
    setGeneratorPrefill(fenn);
    setGeneratorPrefillMovzu(movzu);
    setAppView("generator");
  }

  function handleCreateLesson(movzu: string) {
    setLessonPrefill({ fenn, movzu });
    setAppView("lessons");
  }

  // Loading state
  if (loading || !detail) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleBack} className="gap-1">
            <ArrowLeft className="size-4" />
            Panelə Qayıt
          </Button>
        </div>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="size-6 animate-spin text-primary" />
          <p className="text-sm">Mövzu detayı yüklənir...</p>
        </div>
      </div>
    );
  }

  const prog = detail.progress;
  const sevColor =
    prog.seviyye >= 75 ? "text-accent" : prog.seviyye >= 40 ? "text-primary" : "text-muted-foreground";
  const sevBadgeClass = cn(
    "border",
    prog.seviyye >= 75
      ? "border-accent/40 text-accent bg-accent/5"
      : prog.seviyye >= 40
        ? "border-primary/40 text-primary bg-primary/5"
        : "border-border text-muted-foreground bg-muted/40"
  );

  return (
    <div className="space-y-6">
      {/* Back button + heading */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        <Button variant="ghost" size="sm" onClick={handleBack} className="gap-1 active:scale-95">
          <ArrowLeft className="size-4" />
          Panelə Qayıt
        </Button>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Mövzu Detayı
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
                {detail.fenn}
              </h1>
              <Badge variant="outline" className={cn("gap-1 text-sm font-bold", sevBadgeClass)}>
                <TrendingUp className="size-3" />
                {prog.seviyye}%
              </Badge>
              <StarsRow yildiz={prog.yildiz} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {prog.dogruCavab} / {prog.hallSualSayi} sual həll edilib · dəqiqlik {prog.dəqiqlik}%
            </p>
          </div>
        </div>
      </motion.div>

      {/* Top stat row — 4 mini cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <MiniStatCard
          icon={<Target className="size-3.5" />}
          label="Sual sayı"
          value={prog.hallSualSayi}
          accent="foreground"
          delay={0}
        />
        <MiniStatCard
          icon={<CheckCircle2 className="size-3.5" />}
          label="Doğru cavab"
          value={prog.dogruCavab}
          accent="accent"
          delay={0.05}
        />
        <MiniStatCard
          icon={<Zap className="size-3.5" />}
          label="Dəqiqlik"
          value={prog.dəqiqlik}
          suffix="%"
          accent="primary"
          delay={0.1}
        />
        <MiniStatCard
          icon={<Bookmark className="size-3.5" />}
          label="Bookmark"
          value={detail.bookmarkSayi}
          accent="amber"
          delay={0.15}
        />
      </div>

      {/* Progress visualization + secondary stats */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Big circular progress */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <SectionHeader
              eyebrow="Ümumi"
              title="Səviyyə"
              description="Fənn proqresi"
            />
          </CardHeader>
          <CardContent className="flex flex-col items-center pb-6">
            <BigCircularProgress value={prog.seviyye} />
            <div className="mt-4 grid w-full grid-cols-2 gap-2 text-center">
              <div className="rounded-lg bg-muted/40 p-2">
                <div className="font-stat text-base font-bold text-foreground">
                  {prog.yildiz}<span className="text-xs text-muted-foreground">/5</span>
                </div>
                <div className="text-[10px] text-muted-foreground">ulduz</div>
              </div>
              <div className="rounded-lg bg-muted/40 p-2">
                <div className={cn("font-stat text-base font-bold", sevColor)}>
                  {prog.dəqiqlik}%
                </div>
                <div className="text-[10px] text-muted-foreground">dəqiqlik</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mövzu bölgüsü */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <SectionHeader
              eyebrow="Analitik"
              title="Mövzu Bölgüsü"
              description="Hər mövzuda səhv nisbəti"
              icon={<Brain className="size-4 text-primary" />}
            />
          </CardHeader>
          <CardContent>
            <MovzuBolugu data={detail.movzuStat} onSelectMovzu={handleMovzuSelect} />
          </CardContent>
        </Card>
      </div>

      {/* Bal Trend + Son Aktivlik */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <SectionHeader
              eyebrow="Performans"
              title="Bal Trend"
              description="İmtahan simulyasiyalarında fənn balı"
              icon={<TrendingUp className="size-4 text-accent" />}
            />
          </CardHeader>
          <CardContent>
            <BalTrendChart data={detail.balTrend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionHeader
              eyebrow="Tarixçə"
              title="Son Aktivlik"
              description="Bu fənndə son işlər"
              icon={<Clock className="size-4 text-primary" />}
            />
          </CardHeader>
          <CardContent>
            <SonAktivlikTimeline items={detail.sonAktivlik} />
          </CardContent>
        </Card>
      </div>

      {/* Zəif Mövzular */}
      <Card>
        <CardHeader>
          <SectionHeader
            eyebrow="Diqqət"
            title="Zəif Mövzular"
            description="Bu fənndə diqqət tələb edən mövzular"
            icon={<Target className="size-4 text-destructive" />}
            action={
              detail.zəifMövzular.length > 0 ? (
                <Badge variant="outline" className="gap-1 text-[10px]">
                  <AlertTriangle className="size-2.5" />
                  {detail.zəifMövzular.length} mövzu
                </Badge>
              ) : undefined
            }
          />
        </CardHeader>
        <CardContent>
          <ZeifMovzularSection
            items={detail.zəifMövzular}
            onWork={handleWorkMovzu}
            onCreateLesson={handleCreateLesson}
          />
        </CardContent>
      </Card>

      {/* Sual Tarixçəsi — tabs */}
      <Card>
        <CardHeader>
          <SectionHeader
            eyebrow="Arxiv"
            title="Sual Tarixçəsi"
            description="Yaradılan dəstlər və səhv cavablar"
            icon={<History className="size-4 text-primary" />}
            action={
              history ? (
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Badge variant="outline" className="gap-0.5 text-[9px]">
                    {history.stats.toplamDəst} dəst
                  </Badge>
                  <Badge variant="outline" className="gap-0.5 text-[9px]">
                    {history.stats.toplamSəhv} səhv
                  </Badge>
                </div>
              ) : undefined
            }
          />
        </CardHeader>
        <CardContent>
          {history ? <SualDesteleriTab items={history.sualDəstləri} /> : null}
        </CardContent>
      </Card>

      {/* Quick stats footer */}
      <Card>
        <CardContent className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BookOpen className="size-4" />
            </div>
            <div>
              <div className="font-stat text-lg font-bold">{detail.miniDersSayi}</div>
              <div className="text-[10px] text-muted-foreground">mini-dərs</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Check className="size-4" />
            </div>
            <div>
              <div className="font-stat text-lg font-bold">{detail.oxunmusDersSayi}</div>
              <div className="text-[10px] text-muted-foreground">oxunmuş dərs</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Bookmark className="size-4" />
            </div>
            <div>
              <div className="font-stat text-lg font-bold">{detail.bookmarkSayi}</div>
              <div className="text-[10px] text-muted-foreground">bookmark</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Layers className="size-4" />
            </div>
            <div>
              <div className="font-stat text-lg font-bold">{detail.flashcardSayi}</div>
              <div className="text-[10px] text-muted-foreground">flashcard</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
