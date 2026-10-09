"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Trophy, Swords, Flame, ArrowRight, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { ArenaStats, ArenaNotificationItem } from "@/lib/api";
import { useStore } from "@/lib/store";
import { cn, azDateShort } from "@/lib/utils";
import { SectionHeader } from "@/components/dashboard/section-header";

export function ArenaCard() {
  const sessionId = useStore((s) => s.sessionId);
  const setAppView = useStore((s) => s.setAppView);
  const [stats, setStats] = React.useState<ArenaStats | null>(null);
  const [winNotif, setWinNotif] = React.useState<ArenaNotificationItem | null>(null);

  React.useEffect(() => {
    if (!sessionId) return;
    api.arenaMyStats(sessionId).then(setStats).catch(() => {});
    api
      .arenaNotifications(sessionId)
      .then((r) => {
        const w = r.bildirisler.find((n) => n.tip === "QALIB" && !n.oxunub);
        setWinNotif(w ?? null);
      })
      .catch(() => {});
  }, [sessionId]);

  // Heç iştirak yoxdursa və qalib bildirişi yoxdursa — dəvətedici mini kart
  const bosdur = !stats || stats.istirakSayi === 0;

  return (
    <div className="space-y-3">
      <SectionHeader
        icon={<Trophy className="size-4 text-primary" />}
        title="Bilik Arenası"
        description="Digər tələbələrlə real vaxtlı yarış"
      />

      {winNotif && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-amber-400 via-amber-500 to-primary text-white">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="text-3xl">🏆</div>
              <div className="min-w-0 flex-1">
                <p className="font-heading text-sm font-bold">Təbriklər!</p>
                <p className="truncate text-xs text-white/90">{winNotif.mesaj}</p>
              </div>
              <button
                onClick={() => setWinNotif(null)}
                className="rounded-md p-1 text-white/70 hover:bg-white/10 hover:text-white"
                aria-label="Bağla"
              >
                <X className="size-4" />
              </button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Card className="rounded-2xl">
        <CardContent className="p-4">
          {bosdur ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Swords className="size-5" />
              </div>
              <p className="text-sm font-medium">Hələ heç bir müsabiqədə iştirak etməmisən</p>
              <p className="max-w-xs text-xs text-muted-foreground">
                Fənn seç, dostlarını dəvət et və eyni suallar üzərində kim daha yaxşıdır — yoxla.
              </p>
              <Button size="sm" className="mt-1 rounded-full" onClick={() => setAppView("arena")}>
                Arenaya keç <ArrowRight className="ml-1 size-4" />
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                <Mini label="İştirak" value={stats!.istirakSayi} />
                <Mini label="Qalibiyyət" value={stats!.qalibSayi} accent="amber" />
                <Mini label="Məğlubiyyət" value={stats!.meglubSayi} />
                <Mini label="Ümumi xal" value={stats!.umumiXal} accent="primary" />
                <Mini label="Ən yaxşı" value={stats!.enYaxsiXal} />
              </div>
              {stats!.sonMusabiqe && (
                <div className="mt-3 flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2 text-xs">
                  <span className="min-w-0 truncate">
                    Son: <span className="font-medium">{stats!.sonMusabiqe.ad}</span> ·{" "}
                    {stats!.sonMusabiqe.sira ? `${stats!.sonMusabiqe.sira}-ci yer` : "—"} ·{" "}
                    {azDateShort(new Date(stats!.sonMusabiqe.tarix))}
                  </span>
                  {stats!.sonMusabiqe.qalib && <Flame className="size-3.5 shrink-0 text-amber-500" />}
                </div>
              )}
              <Button
                size="sm"
                variant="outline"
                className="mt-3 w-full rounded-full"
                onClick={() => setAppView("arena")}
              >
                Bilik Arenası <ArrowRight className="ml-1 size-4" />
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Mini({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "amber" | "primary";
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-2.5 text-center">
      <div
        className={cn(
          "font-stat text-lg font-bold tabular-nums",
          accent === "amber" && "text-amber-500",
          accent === "primary" && "text-primary"
        )}
      >
        {value}
      </div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}
