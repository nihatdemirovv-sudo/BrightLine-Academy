"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Trophy, Lock, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { api } from "@/lib/api";
import type { Achievement, AchievementsResponse } from "@/lib/api";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { InfoTooltip } from "@/components/dashboard/info-tooltip";
import { ShimmerBadges } from "@/components/dashboard/shimmer";
import { cn, azDateShort } from "@/lib/utils";

// Nailiyyət rəngi → Tailwind class
function ringClass(reng: string, acildi: boolean) {
  if (!acildi) return "border-muted-foreground/30 text-muted-foreground";
  switch (reng) {
    case "primary":
      return "border-primary/60 text-primary";
    case "accent":
      return "border-accent/60 text-accent";
    case "warning":
      return "border-amber-500/60 text-amber-500";
    case "destructive":
      return "border-destructive/60 text-destructive";
    default:
      return "border-border";
  }
}

function glowClass(reng: string) {
  switch (reng) {
    case "primary":
      return "shadow-[0_0_18px_-4px_var(--primary)]";
    case "accent":
      return "shadow-[0_0_18px_-4px_var(--accent)]";
    case "warning":
      return "shadow-[0_0_18px_-4px_#f59e0b]";
    case "destructive":
      return "shadow-[0_0_18px_-4px_#ef4444]";
    default:
      return "";
  }
}

function parseDate(s: string): Date {
  return new Date(s);
}

export function AchievementsSection() {
  const sessionId = useStore((s) => s.sessionId) || "";
  const { toast } = useToast();
  const [data, setData] = React.useState<AchievementsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<Achievement | null>(null);
  const toastedRef = React.useRef<Set<string>>(new Set());

  const load = React.useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const d = await api.getAchievements(sessionId);
      setData(d);
      // Yeni açılanlar üçün toast (hər biri üçün ayrı, amma limitli sayda)
      if (d.yeniAçılan && d.yeniAçılan.length > 0) {
        for (const a of d.yeniAçılan) {
          if (toastedRef.current.has(a.kod)) continue;
          toastedRef.current.add(a.kod);
          toast({
            title: "🏆 Nailiyyət açıldı!",
            description: `${a.ad} — ${a.tesvir}`,
          });
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [sessionId, toast]);

  React.useEffect(() => {
    load();
  }, [load]);

  const acilanSayi = data?.achievements.filter((a) => a.acildi).length ?? 0;
  const toplam = data?.achievements.length ?? 17;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-1.5 text-base">
                <Trophy className="size-4 text-amber-500" />
                Nailiyyətlər
                <InfoTooltip content="Fəaliyyətlərinizlə açdığınız mükafatlar. 17 badge mövcuddur." />
              </CardTitle>
              <CardDescription className="mt-1">
                {acilanSayi} / {toplam} açıldı
              </CardDescription>
            </div>
            {data && (
              <Badge variant="outline" className="gap-1 text-xs">
                <Sparkles className="size-3 text-accent" />
                {Math.round((acilanSayi / toplam) * 100)}%
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="overflow-hidden pb-2">
              <ShimmerBadges count={6} />
            </div>
          ) : !data ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Məlumat yüklənə bilmədi.
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]">
              {data.achievements.map((a, i) => (
                <BadgeButton key={a.kod} a={a} delay={i * 0.03} onClick={() => setSelected(a)} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detaylı modal */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="size-5 text-amber-500" />
              Nailiyyətlər
            </DialogTitle>
            <DialogDescription>
              {selected ? `${selected.ad} — ${selected.tesvir}` : "Bütün nailiyyətlər"}
            </DialogDescription>
          </DialogHeader>

          {/* Seçilmiş nailiyyət böyük kart */}
          {selected && (
            <div
              className={cn(
                "flex items-center gap-4 rounded-xl border-2 p-4",
                ringClass(selected.reng, selected.acildi),
                selected.acildi && glowClass(selected.reng)
              )}
            >
              <div
                className={cn(
                  "flex size-14 shrink-0 items-center justify-center rounded-full border-2 bg-card text-2xl",
                  ringClass(selected.reng, selected.acildi),
                  !selected.acildi && "grayscale"
                )}
              >
                {selected.acildi ? selected.icon : <Lock className="size-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{selected.ad}</span>
                  {selected.acildi ? (
                    <Badge variant="outline" className="border-accent/40 text-accent text-[10px]">
                      Açılıb
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                      Bloklanmış
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">{selected.tesvir}</p>
                {selected.acildi && selected.acilmaTarixi ? (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Açılma tarixi: {azDateShort(parseDate(selected.acilmaTarixi))}
                  </p>
                ) : !selected.acildi && selected.proqres !== null ? (
                  <div className="mt-2">
                    <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Proqres</span>
                      <span className="font-stat">{selected.proqres}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${selected.proqres}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* Bütün nailiyyətlər grid */}
          <div className="max-h-[50vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {data?.achievements.map((a, i) => (
                <button
                  key={a.kod}
                  onClick={() => setSelected(a)}
                  className={cn(
                    "group flex flex-col items-center gap-1.5 rounded-lg border-2 p-2 transition-all hover:-translate-y-0.5",
                    ringClass(a.reng, a.acildi),
                    a.acildi && "ring-2 ring-accent/30",
                    selected?.kod === a.kod && "ring-2 ring-primary/40"
                  )}
                >
                  <div className="relative">
                    <div
                      className={cn(
                        "flex size-10 items-center justify-center rounded-full border-2 bg-card text-lg",
                        ringClass(a.reng, a.acildi),
                        !a.acildi && "grayscale opacity-50"
                      )}
                    >
                      {a.acildi ? a.icon : <Lock className="size-3.5" />}
                    </div>
                    {!a.acildi && (
                      <div className="absolute -bottom-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full border border-background bg-muted text-muted-foreground">
                        <Lock className="size-2" />
                      </div>
                    )}
                    {!a.acildi && a.proqres !== null && a.proqres > 0 && (
                      <svg
                        className="absolute -inset-1 size-[calc(100%+8px)] -rotate-90"
                        viewBox="0 0 48 48"
                      >
                        <circle
                          cx="24"
                          cy="24"
                          r="22"
                          fill="none"
                          stroke="currentColor"
                          className="text-muted"
                          strokeWidth="2"
                        />
                        <circle
                          cx="24"
                          cy="24"
                          r="22"
                          fill="none"
                          stroke="currentColor"
                          className="text-accent"
                          strokeWidth="2"
                          strokeDasharray={`${(a.proqres / 100) * 138.2} 138.2`}
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-center text-[10px] font-medium leading-tight">{a.ad}</span>
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function BadgeButton({
  a,
  delay,
  onClick,
}: {
  a: Achievement;
  delay: number;
  onClick: () => void;
}) {
  return (
    <TooltipProvider delayDuration={120}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            onClick={onClick}
            className={cn(
              "group relative flex w-20 shrink-0 flex-col items-center gap-1.5 rounded-xl border p-2 transition-all hover:-translate-y-0.5 hover:shadow-md",
              a.acildi && "border-accent/30 bg-accent/5"
            )}
          >
            <div className="relative">
              <div
                className={cn(
                  "flex size-12 items-center justify-center rounded-full border-2 bg-card text-xl",
                  ringClass(a.reng, a.acildi),
                  a.acildi && "ring-2 ring-accent/30",
                  !a.acildi && "grayscale opacity-50"
                )}
              >
                {a.acildi ? a.icon : <Lock className="size-4" />}
              </div>
              {/* Bloklanmış badge-lər üçün kiçik lock overlay */}
              {!a.acildi && (
                <div className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full border border-background bg-muted text-muted-foreground">
                  <Lock className="size-2.5" />
                </div>
              )}
              {!a.acildi && a.proqres !== null && a.proqres > 0 && (
                <svg className="absolute -inset-1 size-[calc(100%+8px)] -rotate-90" viewBox="0 0 48 48">
                  <circle
                    cx="24"
                    cy="24"
                    r="22"
                    fill="none"
                    stroke="currentColor"
                    className="text-muted"
                    strokeWidth="2"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="22"
                    fill="none"
                    stroke="currentColor"
                    className="text-accent"
                    strokeWidth="2"
                    strokeDasharray={`${(a.proqres / 100) * 138.2} 138.2`}
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </div>
            <span className="line-clamp-2 text-center text-[10px] font-medium leading-tight text-muted-foreground">
              {a.ad}
            </span>
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <div className="font-medium">{a.ad}</div>
          <div className="text-primary-foreground/80">{a.tesvir}</div>
          {a.acildi && (
            <div className="mt-0.5 text-accent">✓ Açılıb</div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
