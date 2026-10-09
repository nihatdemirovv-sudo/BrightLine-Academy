"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Target, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { SectionHeader } from "@/components/dashboard/section-header";
import { ShimmerRadar } from "@/components/dashboard/shimmer";
import { api } from "@/lib/api";
import type { SubjectProgress } from "@/lib/store";
import type { Weakness } from "@/lib/store";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Markdown } from "@/components/markdown";

function priorityBadge(p: string) {
  if (p === "yuksek")
    return (
      <Badge variant="outline" className="border-destructive/40 text-destructive">
        Yüksək prioritet
      </Badge>
    );
  if (p === "orta")
    return (
      <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-400">
        Orta prioritet
      </Badge>
    );
  return (
    <Badge variant="outline" className="text-muted-foreground">
      Aşağı prioritet
    </Badge>
  );
}

// === RadarChart — fənn üzrə SVG radar/spider chart ===
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

function RadarChart({ progress }: { progress: SubjectProgress[] }) {
  // SVG dimensions
  const size = 220;
  const center = size / 2;
  const radius = 78; // polygon maksimal radiusu
  const axes = FENN_ORDER.length;

  // Fenn seviyye — 0-100%
  const byFenn = React.useMemo(() => {
    const m = new Map<string, SubjectProgress>();
    for (const p of progress) m.set(p.fenn, p);
    return FENN_ORDER.map((fenn) => {
      const p = m.get(fenn);
      return {
        fenn,
        seviyye: p?.seviyye || 0,
        hallSualSayi: p?.hallSualSayi || 0,
      };
    });
  }, [progress]);

  // Polygon vertices: hər ox üzrə seviyye * radius / 100
  const points = byFenn.map((f, i) => {
    const angle = (Math.PI * 2 * i) / axes - Math.PI / 2; // start from top
    const r = (f.seviyye / 100) * radius;
    return {
      x: center + Math.cos(angle) * r,
      y: center + Math.sin(angle) * r,
      labelX: center + Math.cos(angle) * (radius + 18),
      labelY: center + Math.sin(angle) * (radius + 18),
      angle,
      fenn: f.fenn,
      seviyye: f.seviyye,
      hallSualSayi: f.hallSualSayi,
    };
  });

  const polygonPoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  // Koncentrik grid rings — 25/50/75/100%
  const rings = [0.25, 0.5, 0.75, 1];

  // Bütün fənn-lər 0-dırsa boş state göstər
  const hasData = byFenn.some((f) => f.hallSualSayi > 0);

  if (!hasData) {
    // B3c: skeleton empty state — pulsing muted circle with text
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-3 text-center">
        <div className="relative flex size-28 items-center justify-center">
          {/* Pulsing outer ring */}
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full bg-muted-foreground/10"
            animate={{ opacity: [0.4, 0.15, 0.4], scale: [1, 1.06, 1] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Inner pulsing disc */}
          <motion.div
            aria-hidden
            className="flex size-20 items-center justify-center rounded-full bg-muted/60"
            animate={{ opacity: [0.7, 0.4, 0.7] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <AlertTriangle className="size-7 text-muted-foreground/60" />
          </motion.div>
        </div>
        <p className="text-[11px] text-muted-foreground animate-pulse">
          Məlumat dolduqca radar formalaşacaq
        </p>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <svg
        className="size-full max-w-[260px]"
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="Fənn radar qrafiki"
      >
        {/* Koncentrik grid */}
        {rings.map((r, i) => {
          const pts = FENN_ORDER.map((_, j) => {
            const angle = (Math.PI * 2 * j) / axes - Math.PI / 2;
            const rad = r * radius;
            return `${center + Math.cos(angle) * rad},${center + Math.sin(angle) * rad}`;
          }).join(" ");
          return (
            <polygon
              key={i}
              points={pts}
              fill="none"
              stroke="currentColor"
              className="text-muted-foreground/15"
              strokeWidth="1"
            />
          );
        })}

        {/* Ox xətləri */}
        {points.map((p, i) => (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={p.labelX - (p.labelX - center) * 0.18}
            y2={p.labelY - (p.labelY - center) * 0.18}
            stroke="currentColor"
            className="text-muted-foreground/15"
            strokeWidth="1"
          />
        ))}

        {/* Data polygon — gradient fill */}
        <motion.polygon
          points={polygonPoints}
          fill="url(#radarGradient)"
          stroke="#1E3A8A"
          strokeWidth="2"
          strokeLinejoin="round"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ transformOrigin: `${center}px ${center}px` }}
        />

        {/* Gradient definition */}
        <defs>
          <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E3A8A" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.35" />
          </linearGradient>
        </defs>

        {/* Vertex dots */}
        {points.map((p, i) => (
          <TooltipProvider key={i} delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={p.hallSualSayi > 0 ? 3.5 : 2}
                  fill={p.seviyye >= 75 ? "#10B981" : p.seviyye >= 40 ? "#1E3A8A" : "#94A3B8"}
                  stroke="#fff"
                  strokeWidth="1.5"
                  className="cursor-help"
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <div className="font-medium">{p.fenn}</div>
                <div className="text-primary-foreground/80">
                  {p.hallSualSayi > 0 ? `${p.seviyye}% səviyyə` : "Başlamayıb"}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}

        {/* Fenn labels */}
        {points.map((p, i) => {
          // Yaxınlıq sağı/sola görə text-anchor
          const cos = Math.cos(p.angle);
          const anchor = cos > 0.2 ? "start" : cos < -0.2 ? "end" : "middle";
          // Fənn adını qısaldılmış göstər
          const label = p.fenn.length > 9 ? p.fenn.slice(0, 8) + "…" : p.fenn;
          return (
            <text
              key={i}
              x={p.labelX}
              y={p.labelY}
              textAnchor={anchor}
              dominantBaseline="middle"
              className="fill-muted-foreground text-[8px] font-medium"
              style={{ fontSize: "8px" }}
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export function WeaknessesCard() {
  const { toast } = useToast();
  const sessionId = useStore((s) => s.sessionId) || "";
  const setAppView = useStore((s) => s.setAppView);
  const setGeneratorPrefill = useStore((s) => s.setGeneratorPrefill);
  const setSubjectDetailFenn = useStore((s) => s.setSubjectDetailFenn);

  const [items, setItems] = React.useState<Weakness[]>([]);
  const [progress, setProgress] = React.useState<SubjectProgress[]>([]);
  const [progressLoading, setProgressLoading] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  // Radar chart (progress) is a plain DB read — safe to auto-load.
  React.useEffect(() => {
    if (!sessionId) return;
    setProgressLoading(true);
    api
      .getProgress(sessionId)
      .then((pg) => setProgress(pg || []))
      .catch(() => {})
      .finally(() => setProgressLoading(false));
  }, [sessionId]);

  // Weaknesses list calls AI — only fetch when the user asks for it.
  const load = React.useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const wr = await api.getWeaknesses(sessionId);
      setItems(wr.zəifTərəflər || []);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Analiz xətası",
        description: e instanceof Error ? e.message : "Xəta baş verdi",
      });
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [sessionId, toast]);

  function handleWork(fenn: string) {
    setGeneratorPrefill(fenn);
    setAppView("generator");
  }

  function handleDetail(fenn: string) {
    setSubjectDetailFenn(fenn);
    setAppView("subjectDetail");
  }

  // Fenn-in seviyyesini tap (~0-100). progress yoxdursa 0 qaytarır.
  function fennSeviyye(fenn: string): number {
    const p = progress.find((x) => x.fenn === fenn);
    return p?.seviyye ?? 0;
  }

  return (
    <Card className="gap-4 py-5">
      <CardHeader>
        <SectionHeader
          eyebrow="AI Analitik"
          title="Zəif Tərəflər"
          description={`AI tövsiyə etdiyi diqqət sahələri · ${FENN_ORDER.length} fənn radarı`}
          icon={<AlertTriangle className="size-4 text-amber-500" />}
          info="Sual həllərində zəif olduğunuz fənn və mövzular."
        />
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Radar chart */}
        {progressLoading ? (
          <div className="py-2">
            <ShimmerRadar count={9} />
          </div>
        ) : (
          <RadarChart progress={progress} />
        )}

        {/* Weaknesses list */}
        {!loaded ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">
              Zəif tərəflərini AI ilə analiz et.
            </p>
            <Button size="sm" onClick={load} disabled={loading} className="gap-1.5">
              {loading ? (
                <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <AlertTriangle className="size-3.5" />
              )}
              Analiz Et
            </Button>
          </div>
        ) : loading ? (
          <div className="space-y-2 py-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0.4 }}
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.1,
                }}
                className="rounded-xl border border-border p-3"
              >
                <div className="mb-2 flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-muted" />
                  <div className="h-3 w-24 rounded bg-muted" />
                </div>
                <div className="h-2 w-full rounded bg-muted" />
              </motion.div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-4 text-center text-sm text-muted-foreground">
            Hələ zəif tərəf aşkarlanmayıb. Sual həll etdikcə görünəcək.
          </div>
        ) : (
          items.slice(0, 3).map((w, i) => {
            const sev = fennSeviyye(w.fenn);
            const isLow = sev > 0 && sev < 40;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={cn(
                  "group relative rounded-xl border p-3 transition-all hover:shadow-md",
                  w.övvelik === "yuksek"
                    ? "border-destructive/30 bg-destructive/5"
                    : isLow
                      ? "border-destructive/20 bg-destructive/5"
                      : "border-border hover:border-primary/30"
                )}
              >
                {/* Clickable header → subject detail */}
                <button
                  onClick={() => handleDetail(w.fenn)}
                  className="mb-2 flex w-full items-center justify-between gap-2 text-left transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Target className="size-4 text-primary" />
                    <span className="text-sm font-semibold transition-colors group-hover:text-primary">{w.fenn}</span>
                    {isLow && (
                      <Badge variant="outline" className="border-destructive/40 text-destructive gap-0.5 text-[9px]">
                        <AlertTriangle className="size-2.5" />
                        {sev}%
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {priorityBadge(w.övvelik)}
                    <ChevronRight className="size-3.5 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>
                </button>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div>
                    <span className="font-medium text-foreground">Səbəb: </span>
                    <Markdown content={w.sebəb} inline className="inline text-xs text-muted-foreground" />
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Tövsiyə: </span>
                    <Markdown content={w.tovsie} inline className="inline text-xs text-muted-foreground" />
                  </div>
                </div>
                <div className="mt-2 flex gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 flex-1 gap-1 text-xs active:scale-95"
                    onClick={() => handleWork(w.fenn)}
                  >
                    Bu mövzunu çalış
                    <ArrowRight className="size-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 gap-1 px-2 text-xs text-primary hover:bg-primary/10 hover:text-primary active:scale-95"
                    onClick={() => handleDetail(w.fenn)}
                  >
                    Detallı bax
                    <ChevronRight className="size-3" />
                  </Button>
                </div>
              </motion.div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
