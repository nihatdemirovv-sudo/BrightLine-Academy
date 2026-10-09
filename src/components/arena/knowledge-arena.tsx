"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Plus,
  Users,
  Clock,
  Loader2,
  ChevronLeft,
  Crown,
  Check,
  X,
  Swords,
  Flame,
  Medal,
  Bell,
  Sparkles,
  RefreshCw,
  ListChecks,
  BarChart3,
  AlertTriangle,
  Timer,
  LogOut,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Markdown } from "@/components/markdown";
import { GeometryFigure } from "@/components/geometry-figure";
import { api, ALL_FENLER } from "@/lib/api";
import type {
  ArenaCompetitionCard,
  ArenaCompetitionDetail,
  ArenaHistoryItem,
  ArenaLeaderboard,
  ArenaNotificationItem,
  ArenaStats,
} from "@/lib/api";
import type { GeometryFigureSpec } from "@/lib/store";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { cn, azDateShort } from "@/lib/utils";

// ==================== KÖMƏKÇİLƏR ====================

const CETINLIK_LABEL: Record<string, string> = {
  asan: "Asan",
  orta: "Orta",
  cetin: "Çətin",
  qarisiq: "Qarışıq",
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  GOZLEYIR: { label: "Gözləyir", cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  BASLADI: { label: "Davam edir", cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  BITDI: { label: "Tamamlandı", cls: "bg-primary/15 text-primary" },
  LEGV: { label: "Ləğv edildi", cls: "bg-muted text-muted-foreground" },
  VAXT_BITDI: { label: "Vaxtı bitdi", cls: "bg-destructive/15 text-destructive" },
};

const HERFLER = ["A", "B", "C", "D", "E"] as const;

function initials(ad: string): string {
  return ad
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function fmtClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, "0")}`;
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "indi";
  if (min < 60) return `${min} dəq əvvəl`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} saat əvvəl`;
  return `${Math.floor(hr / 24)} gün əvvəl`;
}

function medalFor(sira: number | null | undefined): string | null {
  if (sira === 1) return "🥇";
  if (sira === 2) return "🥈";
  if (sira === 3) return "🥉";
  return null;
}

// ==================== ƏSAS KONTEYNER ====================

type Screen = "lobby" | "create" | "room" | "history" | "leaderboard";

export function KnowledgeArena() {
  const [screen, setScreen] = React.useState<Screen>("lobby");
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const setAppView = useStore((s) => s.setAppView);
  const setGeneratorPrefill = useStore((s) => s.setGeneratorPrefill);

  const openRoom = React.useCallback((id: string) => {
    setActiveId(id);
    setScreen("room");
  }, []);

  return (
    <div className="space-y-6">
      {/* Başlıq */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-primary text-white shadow-sm">
            <Trophy className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Bilik Arenası</p>
            <h1 className="font-heading text-xl font-bold tracking-tight sm:text-2xl">
              Digər tələbələrlə real vaxtda yarış
            </h1>
          </div>
        </div>
        <ArenaNotificationsBell onOpenCompetition={openRoom} />
      </div>

      <AnimatePresence mode="wait">
        {screen === "lobby" && (
          <motion.div key="lobby" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <ArenaLobby
              onOpen={openRoom}
              onCreate={() => setScreen("create")}
              onHistory={() => setScreen("history")}
              onLeaderboard={() => setScreen("leaderboard")}
            />
          </motion.div>
        )}
        {screen === "create" && (
          <motion.div key="create" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <CreateCompetition onCreated={openRoom} onCancel={() => setScreen("lobby")} />
          </motion.div>
        )}
        {screen === "room" && activeId && (
          <motion.div key="room" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <CompetitionRoom
              id={activeId}
              onExit={() => {
                setActiveId(null);
                setScreen("lobby");
              }}
              onNewCompetition={() => {
                setActiveId(null);
                setScreen("create");
              }}
              onOpenTutor={(fenn) => {
                setGeneratorPrefill(fenn);
                setAppView("tutor");
              }}
            />
          </motion.div>
        )}
        {screen === "history" && (
          <motion.div key="history" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <ArenaHistory onBack={() => setScreen("lobby")} onOpen={openRoom} />
          </motion.div>
        )}
        {screen === "leaderboard" && (
          <motion.div key="lb" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <ArenaLeaderboardView onBack={() => setScreen("lobby")} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==================== LOBBİ ====================

function ArenaLobby({
  onOpen,
  onCreate,
  onHistory,
  onLeaderboard,
}: {
  onOpen: (id: string) => void;
  onCreate: () => void;
  onHistory: () => void;
  onLeaderboard: () => void;
}) {
  const sessionId = useStore((s) => s.sessionId);
  const { toast } = useToast();
  const [comps, setComps] = React.useState<ArenaCompetitionCard[]>([]);
  const [stats, setStats] = React.useState<ArenaStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [joiningId, setJoiningId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!sessionId) return;
    try {
      const [c, s] = await Promise.all([api.arenaListActive(sessionId), api.arenaMyStats(sessionId)]);
      setComps(c);
      setStats(s);
    } catch {
      /* səssiz */
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  React.useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [load]);

  async function handleJoin(c: ArenaCompetitionCard) {
    if (!sessionId) return;
    if (c.menimIstirakim) {
      onOpen(c.id);
      return;
    }
    setJoiningId(c.id);
    try {
      await api.arenaJoin(sessionId, c.id);
      onOpen(c.id);
    } catch (e) {
      toast({ variant: "destructive", title: "Qoşulmaq mümkün olmadı", description: (e as Error).message });
    } finally {
      setJoiningId(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* Statistika zolağı */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatChip icon={<Swords className="size-4" />} label="İştirak" value={stats?.istirakSayi ?? 0} />
        <StatChip icon={<Trophy className="size-4" />} label="Qalibiyyət" value={stats?.qalibSayi ?? 0} accent="amber" />
        <StatChip icon={<X className="size-4" />} label="Məğlubiyyət" value={stats?.meglubSayi ?? 0} />
        <StatChip icon={<Flame className="size-4" />} label="Ümumi xal" value={stats?.umumiXal ?? 0} accent="primary" />
      </div>

      {/* Naviqasiya + yarat */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="rounded-full bg-primary px-3 py-1 text-primary-foreground">Aktiv müsabiqələr</Badge>
        <Button variant="ghost" size="sm" className="rounded-full" onClick={onHistory}>
          <ListChecks className="mr-1.5 size-4" /> Tarixçə
        </Button>
        <Button variant="ghost" size="sm" className="rounded-full" onClick={onLeaderboard}>
          <BarChart3 className="mr-1.5 size-4" /> Reytinq
        </Button>
        <Button variant="ghost" size="icon" className="size-8 rounded-full" onClick={load} title="Yenilə">
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
        </Button>
        <Button size="sm" className="ml-auto rounded-full shadow-sm" onClick={onCreate}>
          <Plus className="mr-1.5 size-4" /> Yeni müsabiqə yarat
        </Button>
      </div>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center text-muted-foreground">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : comps.length === 0 ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Trophy className="size-7" />
            </div>
            <p className="font-heading text-lg font-semibold">Hazırda aktiv müsabiqə yoxdur</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              İlk müsabiqəni sən yarat — fənn, sual sayı və çətinlik seç, dostlarını dəvət et və biliyini sına.
            </p>
            <Button className="mt-1 rounded-full" onClick={onCreate}>
              <Plus className="mr-1.5 size-4" /> Müsabiqə yarat
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {comps.map((c) => (
            <ArenaCard key={c.id} c={c} joining={joiningId === c.id} onJoin={() => handleJoin(c)} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatChip({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent?: "amber" | "primary";
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div
        className={cn(
          "flex size-8 items-center justify-center rounded-lg",
          accent === "amber"
            ? "bg-amber-500/10 text-amber-500"
            : accent === "primary"
              ? "bg-primary/10 text-primary"
              : "bg-foreground/5 text-foreground"
        )}
      >
        {icon}
      </div>
      <div className="mt-2 font-stat text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

function ArenaCard({ c, joining, onJoin }: { c: ArenaCompetitionCard; joining: boolean; onJoin: () => void }) {
  const full = c.istirakciSayi >= c.maxIstirakci;
  const meta = STATUS_META[c.status] ?? STATUS_META.GOZLEYIR;
  const canJoin = c.status === "GOZLEYIR" && !full && !c.menimIstirakim;

  return (
    <motion.div whileHover={{ y: -2 }}>
      <Card className="h-full rounded-2xl transition-all hover:shadow-md">
        <CardContent className="flex h-full flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-heading text-base font-semibold">{c.ad}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Yaradan: {c.yaradiciAdi}</p>
            </div>
            <Badge className={cn("shrink-0 rounded-full", meta.cls)}>{meta.label}</Badge>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="rounded-full text-[11px]">{c.fenn}</Badge>
            <Badge variant="outline" className="rounded-full text-[11px]">{c.sualSayi} sual</Badge>
            <Badge variant="outline" className="rounded-full text-[11px]">
              {CETINLIK_LABEL[c.cetinlik] ?? c.cetinlik}
            </Badge>
            <Badge variant="outline" className="rounded-full text-[11px]">
              <Timer className="mr-1 size-3" /> {c.sualSaniye}s / sual
            </Badge>
          </div>

          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="size-4" />
            <span className={cn(full && "text-destructive font-medium")}>
              {c.istirakciSayi} / {c.maxIstirakci} iştirakçı
            </span>
          </div>

          <div className="text-xs">
            {c.suallarXeta ? (
              <span className="flex items-center gap-1 text-destructive">
                <AlertTriangle className="size-3.5" /> Suallar hazırlana bilmədi
              </span>
            ) : !c.suallarHazir ? (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <Loader2 className="size-3.5 animate-spin" /> Suallar hazırlanır…
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <Check className="size-3.5" /> Suallar hazırdır
              </span>
            )}
          </div>

          <div className="mt-auto pt-1">
            {c.menimIstirakim ? (
              <Button className="w-full rounded-full" variant="secondary" onClick={onJoin}>
                {c.status === "BASLADI" ? "Yarışa qayıt" : "Gözləmə otağı"}
              </Button>
            ) : (
              <Button className="w-full rounded-full" disabled={!canJoin || joining} onClick={onJoin}>
                {joining ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : full ? (
                  "Doludur"
                ) : c.status !== "GOZLEYIR" ? (
                  "Başlayıb"
                ) : (
                  "Qoşul"
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ==================== MÜSABİQƏ YARAT ====================

const SUAL_SAYI_OPT = [5, 10, 15, 20];
const CETINLIK_OPT = ["asan", "orta", "cetin", "qarisiq"];
const MAX_OPT = [2, 5, 10, 20];
const GOZLEME_OPT = [
  { v: 120, l: "2 dəq" },
  { v: 300, l: "5 dəq" },
  { v: 600, l: "10 dəq" },
  { v: 900, l: "15 dəq" },
  { v: 1800, l: "30 dəq" },
];
const SUAL_SANIYE_OPT = [
  { v: 15, l: "15 san" },
  { v: 20, l: "20 san" },
  { v: 30, l: "30 san" },
  { v: 45, l: "45 san" },
  { v: 60, l: "60 san" },
  { v: 90, l: "90 san" },
];

function CreateCompetition({ onCreated, onCancel }: { onCreated: (id: string) => void; onCancel: () => void }) {
  const sessionId = useStore((s) => s.sessionId);
  const { toast } = useToast();
  const [ad, setAd] = React.useState("");
  const [fenn, setFenn] = React.useState(ALL_FENLER[0]);
  const [sualSayi, setSualSayi] = React.useState(10);
  const [cetinlik, setCetinlik] = React.useState("orta");
  const [maxIstirakci, setMaxIstirakci] = React.useState(5);
  const [gozlemeSaniye, setGozlemeSaniye] = React.useState(300);
  const [sualSaniye, setSualSaniye] = React.useState(30);
  const [busy, setBusy] = React.useState(false);

  async function submit() {
    if (!sessionId) return;
    if (!ad.trim()) {
      toast({ variant: "destructive", title: "Müsabiqə adı yazın" });
      return;
    }
    setBusy(true);
    try {
      const d = await api.arenaCreate({
        sessionId,
        ad: ad.trim(),
        fenn,
        sualSayi,
        cetinlik,
        maxIstirakci,
        gozlemeSaniye,
        sualSaniye,
      });
      toast({ title: "Müsabiqə yaradıldı", description: "Suallar hazırlanır, gözləmə otağına keçirilirsiniz." });
      onCreated(d.id);
    } catch (e) {
      toast({ variant: "destructive", title: "Yaradıla bilmədi", description: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <button onClick={onCancel} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Geri
      </button>

      <Card className="rounded-2xl">
        <CardContent className="space-y-5 p-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Müsabiqə adı</label>
            <Input
              value={ad}
              onChange={(e) => setAd(e.target.value)}
              maxLength={80}
              placeholder="məs. Riyaziyyat Sürət Yarışı"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Fənn</label>
            <Select value={fenn} onValueChange={setFenn}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_FENLER.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ChipRow
            label="Sual sayı"
            options={SUAL_SAYI_OPT.map((v) => ({ v, l: String(v) }))}
            value={sualSayi}
            onChange={setSualSayi}
          />
          <ChipRow
            label="Çətinlik səviyyəsi"
            options={CETINLIK_OPT.map((v) => ({ v, l: CETINLIK_LABEL[v] }))}
            value={cetinlik}
            onChange={setCetinlik}
          />
          <p className="-mt-3 text-xs text-muted-foreground">
            «Qarışıq» seçiləndə sistem asan, orta və çətin sualları birlikdə formalaşdırır.
          </p>
          <ChipRow
            label="İştirakçı limiti"
            options={MAX_OPT.map((v) => ({ v, l: `${v} nəfər` }))}
            value={maxIstirakci}
            onChange={setMaxIstirakci}
          />
          <ChipRow label="Gözləmə müddəti" options={GOZLEME_OPT} value={gozlemeSaniye} onChange={setGozlemeSaniye} />
          <ChipRow label="Hər sual üçün vaxt" options={SUAL_SANIYE_OPT} value={sualSaniye} onChange={setSualSaniye} />

          <div className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
            Suallar müsabiqə yaradılan an bir dəfə hazırlanır və bütün iştirakçılara EYNİ ardıcıllıqla,
            eyni variantlarla verilir. Başlamaq üçün ən azı 2 iştirakçı lazımdır.
          </div>

          <Button className="w-full rounded-full" disabled={busy} onClick={submit}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : "Müsabiqəni yarat"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ChipRow<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { v: T; l: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={String(o.v)}
            type="button"
            onClick={() => onChange(o.v)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
              value === o.v
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:bg-muted"
            )}
          >
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );
}

// ==================== MÜSABİQƏ OTAĞI (gözləmə / yarış / nəticələr) ====================

function CompetitionRoom({
  id,
  onExit,
  onNewCompetition,
  onOpenTutor,
}: {
  id: string;
  onExit: () => void;
  onNewCompetition: () => void;
  onOpenTutor: (fenn: string) => void;
}) {
  const sessionId = useStore((s) => s.sessionId);
  const student = useStore((s) => s.student);
  const { toast } = useToast();
  const [detail, setDetail] = React.useState<ArenaCompetitionDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [nowMs, setNowMs] = React.useState(Date.now());
  const offsetRef = React.useRef(0);
  const prevStatusRef = React.useRef<string | null>(null);
  const [pending, setPending] = React.useState<{ idx: number; secim: string } | null>(null);

  const applyDetail = React.useCallback((d: ArenaCompetitionDetail) => {
    offsetRef.current = new Date(d.serverTime).getTime() - Date.now();
    setDetail(d);
  }, []);

  const refetch = React.useCallback(async () => {
    if (!sessionId) return;
    try {
      const d = await api.arenaGet(sessionId, id);
      applyDetail(d);
    } catch (e) {
      toast({ variant: "destructive", title: "Xəta", description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }, [sessionId, id, applyDetail, toast]);

  React.useEffect(() => {
    setLoading(true);
    refetch();
  }, [refetch]);

  // SSE — real-vaxt vəziyyət
  React.useEffect(() => {
    if (!sessionId) return;
    const es = new EventSource(`/api/arena/competitions/${id}/stream?sessionId=${encodeURIComponent(sessionId)}`);
    es.addEventListener("competition", (e) => {
      try {
        // Yayım NEYTRALDIR (heç kimin şəxsi seçimləri yoxdur) — öz "menimIstirakim"-imizi saxlayırıq
        // və şəxsi vəziyyəti (öz seçimlərimiz, bitəndə öz nəticəmiz) ayrıca sorğu ilə yeniləyirik.
        const d = JSON.parse((e as MessageEvent).data) as ArenaCompetitionDetail;
        offsetRef.current = new Date(d.serverTime).getTime() - Date.now();
        setDetail((prev) => ({ ...d, menimIstirakim: d.menimIstirakim ?? prev?.menimIstirakim }));
        refetch();
      } catch {
        /* boş */
      }
    });
    es.onerror = () => {};
    return () => es.close();
  }, [sessionId, id, refetch]);

  // Lokal saat + SSE düşərsə ehtiyat poll
  React.useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 250);
    return () => clearInterval(t);
  }, []);
  React.useEffect(() => {
    if (!detail || (detail.status !== "GOZLEYIR" && detail.status !== "BASLADI")) return;
    const t = setInterval(refetch, 4000);
    return () => clearInterval(t);
  }, [detail, refetch]);

  // Status keçidlərində bildiriş
  React.useEffect(() => {
    if (!detail) return;
    const prev = prevStatusRef.current;
    if (prev && prev !== detail.status) {
      if (detail.status === "BASLADI") toast({ title: "🏁 Yarış başladı!" });
      if (detail.status === "BITDI") toast({ title: "Müsabiqə bitdi — nəticələr hazırdır" });
      if (detail.status === "LEGV") toast({ variant: "destructive", title: "Müsabiqə ləğv edildi" });
      if (detail.status === "VAXT_BITDI") toast({ variant: "destructive", title: "Müsabiqənin vaxtı bitdi" });
    }
    prevStatusRef.current = detail.status;
  }, [detail, toast]);

  const serverNowMs = nowMs + offsetRef.current;

  async function handleStart() {
    if (!sessionId) return;
    try {
      applyDetail(await api.arenaStart(sessionId, id));
    } catch (e) {
      toast({ variant: "destructive", title: "Başlatmaq mümkün olmadı", description: (e as Error).message });
    }
  }
  async function handleCancel() {
    if (!sessionId) return;
    if (!window.confirm("Müsabiqəni ləğv etmək istədiyinizə əminsiniz?")) return;
    try {
      applyDetail(await api.arenaCancel(sessionId, id));
    } catch (e) {
      toast({ variant: "destructive", title: "Xəta", description: (e as Error).message });
    }
  }
  async function handleLeave(confirmMsg: string) {
    if (!sessionId) return;
    if (!window.confirm(confirmMsg)) return;
    try {
      await api.arenaLeave(sessionId, id);
      onExit();
    } catch (e) {
      toast({ variant: "destructive", title: "Xəta", description: (e as Error).message });
    }
  }
  async function handleAnswer(idx: number, secim: string) {
    if (!sessionId) return;
    setPending({ idx, secim });
    try {
      applyDetail(await api.arenaAnswer({ sessionId, id, sualIndex: idx, secim }));
    } catch (e) {
      setPending(null);
      toast({ variant: "destructive", title: "Cavab qəbul edilmədi", description: (e as Error).message });
    }
  }

  if (loading || !detail) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  const isCreator = student?.id === detail.yaradiciId;

  if (detail.status === "GOZLEYIR") {
    return (
      <WaitingRoom
        detail={detail}
        isCreator={isCreator}
        serverNowMs={serverNowMs}
        onStart={handleStart}
        onCancel={handleCancel}
        onLeave={() => handleLeave("Müsabiqədən ayrılmaq istəyirsiniz?")}
        onBack={onExit}
      />
    );
  }
  if (detail.status === "BASLADI") {
    return (
      <RaceView
        detail={detail}
        studentId={student?.id ?? ""}
        serverNowMs={serverNowMs}
        pending={pending}
        onAnswer={handleAnswer}
        onLeave={() => handleLeave("Yarışdan çıxsanız, qalan suallar cavabsız sayılacaq. Çıxmaq istəyirsiniz?")}
      />
    );
  }
  return (
    <ResultsView
      detail={detail}
      studentId={student?.id ?? ""}
      onExit={onExit}
      onNewCompetition={onNewCompetition}
      onOpenTutor={() => onOpenTutor(detail.fenn)}
    />
  );
}

// ==================== GÖZLƏMƏ OTAĞI ====================

function WaitingRoom({
  detail,
  isCreator,
  serverNowMs,
  onStart,
  onCancel,
  onLeave,
  onBack,
}: {
  detail: ArenaCompetitionDetail;
  isCreator: boolean;
  serverNowMs: number;
  onStart: () => void;
  onCancel: () => void;
  onLeave: () => void;
  onBack: () => void;
}) {
  const remaining = detail.gozlemeBitir
    ? (new Date(detail.gozlemeBitir).getTime() - serverNowMs) / 1000
    : null;
  const canStart = detail.suallarHazir && detail.istirakciSayi >= 2;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Lobbiyə qayıt
      </button>

      <Card className="rounded-2xl">
        <CardContent className="space-y-4 p-5">
          <div className="text-center">
            <h2 className="font-heading text-xl font-bold">{detail.ad}</h2>
            <div className="mt-1 flex flex-wrap justify-center gap-1.5">
              <Badge variant="outline" className="rounded-full text-[11px]">{detail.fenn}</Badge>
              <Badge variant="outline" className="rounded-full text-[11px]">{detail.sualSayi} sual</Badge>
              <Badge variant="outline" className="rounded-full text-[11px]">
                {CETINLIK_LABEL[detail.cetinlik] ?? detail.cetinlik}
              </Badge>
              <Badge variant="outline" className="rounded-full text-[11px]">{detail.sualSaniye}s / sual</Badge>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 rounded-xl bg-amber-500/10 py-2 text-sm font-medium text-amber-600 dark:text-amber-400">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-500 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-amber-500" />
            </span>
            İştirakçı gözlənilir
          </div>

          <div className="flex items-center justify-center gap-6 text-center">
            <div>
              <div className="font-stat text-3xl font-bold tabular-nums">
                {detail.istirakciSayi} <span className="text-lg text-muted-foreground">/ {detail.maxIstirakci}</span>
              </div>
              <div className="text-xs text-muted-foreground">iştirakçı</div>
            </div>
            {remaining !== null && (
              <div>
                <div className="flex items-center gap-1 font-stat text-3xl font-bold tabular-nums">
                  <Clock className="size-5 text-muted-foreground" />
                  {remaining > 0 ? fmtClock(remaining) : "0:00"}
                </div>
                <div className="text-xs text-muted-foreground">avtomatik bağlanmağa</div>
              </div>
            )}
          </div>

          <div className="text-center text-xs">
            {detail.suallarXeta ? (
              <span className="inline-flex items-center gap-1 text-destructive">
                <AlertTriangle className="size-3.5" /> Suallar hazırlana bilmədi — müsabiqəni ləğv edib yenidən yaradın
              </span>
            ) : !detail.suallarHazir ? (
              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <Loader2 className="size-3.5 animate-spin" /> Suallar hazırlanır…
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <Check className="size-3.5" /> Suallar hazırdır
              </span>
            )}
          </div>

          {/* İştirakçılar */}
          <div className="space-y-1.5">
            {detail.istirakcilar.map((p) => (
              <div key={p.studentId} className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2">
                <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {initials(p.ad)}
                </div>
                <span className="text-sm font-medium">{p.ad}</span>
                <span className="text-xs text-muted-foreground">#{p.istirakciNo}</span>
                {p.studentId === detail.yaradiciId && (
                  <Badge className="ml-auto rounded-full bg-amber-500/15 text-[10px] text-amber-600 dark:text-amber-400">
                    <Crown className="mr-0.5 size-3" /> Yaradıcı
                  </Badge>
                )}
              </div>
            ))}
          </div>

          {isCreator ? (
            <div className="space-y-2">
              <Button className="w-full rounded-full" disabled={!canStart} onClick={onStart}>
                {detail.suallarHazir ? "Müsabiqəni başlat" : "Suallar gözlənilir…"}
              </Button>
              {!canStart && detail.suallarHazir && (
                <p className="text-center text-xs text-muted-foreground">Başlamaq üçün ən azı 2 iştirakçı lazımdır.</p>
              )}
              <Button variant="ghost" className="w-full rounded-full text-destructive hover:text-destructive" onClick={onCancel}>
                Müsabiqəni ləğv et
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-center text-sm text-muted-foreground">Yaradıcının müsabiqəni başlatmasını gözləyin…</p>
              <Button variant="ghost" className="w-full rounded-full" onClick={onLeave}>
                <LogOut className="mr-1.5 size-4" /> Ayrıl
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== YARIŞ ====================

function RaceView({
  detail,
  studentId,
  serverNowMs,
  pending,
  onAnswer,
  onLeave,
}: {
  detail: ArenaCompetitionDetail;
  studentId: string;
  serverNowMs: number;
  pending: { idx: number; secim: string } | null;
  onAnswer: (idx: number, secim: string) => void;
  onLeave: () => void;
}) {
  const total = detail.sualSayi;
  const baslamaMs = detail.baslamaVaxti ? new Date(detail.baslamaVaxti).getTime() : serverNowMs;
  const rawIdx =
    detail.cariSualIndex ?? Math.floor((serverNowMs - baslamaMs) / (detail.sualSaniye * 1000));
  const curIdx = Math.min(Math.max(rawIdx, 0), total);
  const finishedAll = curIdx >= total;

  const qEndMs = baslamaMs + (curIdx + 1) * detail.sualSaniye * 1000;
  const remaining = Math.max(0, (qEndMs - serverNowMs) / 1000);
  const remainingFrac = Math.max(0, Math.min(1, remaining / detail.sualSaniye));

  const q = detail.suallar[curIdx];
  const mine = detail.menimIstirakim;
  const answeredThis =
    pending?.idx === curIdx ? pending.secim : mine?.secimler?.[String(curIdx)] ?? null;
  const locked = !!answeredThis || remaining <= 0;

  const opponents = detail.istirakcilar.filter((p) => p.studentId !== studentId);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Üst zolaq */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="mb-1 flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>
              Sual {Math.min(curIdx + 1, total)} / {total}
            </span>
            <span className={cn("tabular-nums", remaining <= 5 && "text-destructive")}>
              <Timer className="mr-1 inline size-3.5" />
              {fmtClock(remaining)}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(Math.min(curIdx, total) / total) * 100}%` }}
            />
          </div>
        </div>
        <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground" onClick={onLeave}>
          <LogOut className="size-4" />
        </Button>
      </div>

      {/* Timer bar */}
      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-[width] duration-200 ease-linear", remaining <= 5 ? "bg-destructive" : "bg-emerald-500")}
          style={{ width: `${remainingFrac * 100}%` }}
        />
      </div>

      {finishedAll || !q ? (
        <Card className="rounded-2xl">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Loader2 className="size-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {finishedAll ? "Bütün suallar bitdi — nəticələr hesablanır…" : "Növbəti sual yüklənir…"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl">
          <CardContent className="space-y-4 p-5">
            <Markdown content={q.sual} className="text-base font-medium leading-relaxed text-balance" />
            <GeometryFigure figura={(q.figura ?? null) as GeometryFigureSpec | null} />

            <div className="grid gap-2">
              {HERFLER.map((h) => {
                const val = q.variantlar?.[h];
                if (val === undefined || val === null) return null;
                const selected = answeredThis === h;
                return (
                  <button
                    key={h}
                    disabled={locked && !selected}
                    onClick={() => !locked && onAnswer(curIdx, h)}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border p-3 text-left transition-all",
                      selected
                        ? "border-primary bg-primary/10 ring-1 ring-primary"
                        : locked
                          ? "border-border opacity-50"
                          : "border-border hover:border-primary/40 hover:bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-bold",
                        selected ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                      )}
                    >
                      {h}
                    </span>
                    <Markdown content={val} inline className="pt-0.5 text-sm leading-relaxed" />
                  </button>
                );
              })}
            </div>

            <p className="text-center text-xs text-muted-foreground">
              {answeredThis
                ? "Cavabın qeydə alındı — növbəti sualı gözlə."
                : remaining <= 0
                  ? "Vaxt bitdi."
                  : "Bir variant seç. Düzgün cavab yalnız yarış bitəndə göstərilir."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Rəqiblər */}
      {opponents.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {opponents.map((p) => (
            <div
              key={p.studentId}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs"
            >
              <div className="flex size-5 items-center justify-center rounded-full bg-muted text-[9px] font-semibold">
                {initials(p.ad)}
              </div>
              <span className="font-medium">{p.ad}</span>
              <span className="text-muted-foreground">
                {p.bitirib ? "çıxdı" : `${p.cavabladiSay ?? 0}/${total}`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== NƏTİCƏLƏR ====================

function ResultsView({
  detail,
  studentId,
  onExit,
  onNewCompetition,
  onOpenTutor,
}: {
  detail: ArenaCompetitionDetail;
  studentId: string;
  onExit: () => void;
  onNewCompetition: () => void;
  onOpenTutor: () => void;
}) {
  const [review, setReview] = React.useState(false);
  const sessionId = useStore((s) => s.sessionId);
  const [rank, setRank] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!sessionId) return;
    api
      .arenaLeaderboard(sessionId, "all")
      .then((lb) => setRank(lb.menim.sira))
      .catch(() => {});
  }, [sessionId]);

  if (detail.status === "LEGV" || detail.status === "VAXT_BITDI") {
    return (
      <div className="mx-auto max-w-md space-y-4 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <X className="size-8" />
        </div>
        <h2 className="font-heading text-xl font-bold">
          {detail.status === "LEGV" ? "Müsabiqə ləğv edildi" : "Müsabiqə vaxtında başlamadı"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {detail.status === "LEGV"
            ? "Yaradıcı bu müsabiqəni başlamazdan əvvəl ləğv etdi."
            : "Gözləmə müddəti bitdi və müsabiqə avtomatik bağlandı."}
        </p>
        <Button className="rounded-full" onClick={onExit}>
          Lobbiyə qayıt
        </Button>
      </div>
    );
  }

  const ranked = [...detail.istirakcilar].sort((a, b) => (a.sira ?? 99) - (b.sira ?? 99));
  const mine = detail.menimIstirakim;
  const won = !!mine?.qalib;
  const podium = ranked.slice(0, 3);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "overflow-hidden rounded-2xl p-6 text-center",
          won
            ? "bg-gradient-to-br from-amber-400 via-amber-500 to-primary text-white"
            : "bg-card border border-border"
        )}
      >
        <div className="text-4xl">{won ? "🏆" : mine ? "🎯" : "🏁"}</div>
        <h2 className={cn("mt-2 font-heading text-2xl font-bold", !won && "text-foreground")}>
          {won ? "Qalib sənsən!" : "Müsabiqə başa çatdı"}
        </h2>
        {mine && (
          <p className={cn("mt-1 text-sm", won ? "text-white/90" : "text-muted-foreground")}>
            {won
              ? `${ranked.length - 1} rəqibə qarşı 1-ci yer · ${mine.xal} xal`
              : `${mine.sira}-ci yer · ${mine.xal} xal`}
          </p>
        )}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {won ? (
            <Button variant="secondary" className="rounded-full" onClick={onNewCompetition}>
              <Sparkles className="mr-1.5 size-4" /> Növbəti müsabiqə
            </Button>
          ) : mine ? (
            <Button className="rounded-full" onClick={onOpenTutor}>
              <Bot className="mr-1.5 size-4" /> AI Müəllimlə {detail.fenn} təkrar et
            </Button>
          ) : null}
          <Button variant={won ? "secondary" : "outline"} className="rounded-full" onClick={onExit}>
            Lobbiyə qayıt
          </Button>
        </div>
      </motion.div>

      {/* Podium */}
      {podium.length >= 2 && (
        <div className="grid grid-cols-3 items-end gap-2">
          {[podium[1], podium[0], podium[2]].map((p, i) => {
            if (!p) return <div key={i} />;
            const place = p.sira ?? 0;
            const h = place === 1 ? "h-24" : place === 2 ? "h-20" : "h-16";
            return (
              <div key={p.studentId} className="flex flex-col items-center gap-1.5">
                <div className="text-2xl">{medalFor(place)}</div>
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {initials(p.ad)}
                </div>
                <div className="max-w-full truncate text-xs font-medium">{p.ad}</div>
                <div
                  className={cn(
                    "flex w-full flex-col items-center justify-start rounded-t-xl bg-gradient-to-t from-primary/5 to-primary/20 pt-2 text-sm font-bold tabular-nums",
                    h
                  )}
                >
                  {p.xal}
                  <span className="text-[10px] font-normal text-muted-foreground">xal</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tam sıralama */}
      <Card className="rounded-2xl">
        <CardContent className="p-0">
          {ranked.map((p) => {
            const isMe = p.studentId === studentId;
            return (
              <div
                key={p.studentId}
                className={cn(
                  "flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-0",
                  isMe && "bg-primary/5"
                )}
              >
                <span className="w-6 text-center text-sm font-bold tabular-nums">
                  {medalFor(p.sira) ?? p.sira}
                </span>
                <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  {initials(p.ad)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {p.ad} {isMe && <span className="text-xs text-primary">(sən)</span>}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {p.dogruSay ?? 0} doğru · {p.sehvSay ?? 0} səhv · {p.cavabsizSay ?? 0} cavabsız
                  </div>
                </div>
                <span className="font-stat text-base font-bold tabular-nums">{p.xal ?? 0}</span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Öz təfərrüatım */}
      {mine && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          <MiniStat label="Doğru" value={mine.dogruSay ?? 0} />
          <MiniStat label="Səhv" value={mine.sehvSay ?? 0} />
          <MiniStat label="Cavabsız" value={mine.cavabsizSay ?? 0} />
          <MiniStat label="Ümumi xal" value={mine.xal ?? 0} />
          <MiniStat label="Orta müddət" value={`${mine.ortaCavabMuddeti ?? 0}s`} />
          <MiniStat label="Reytinq yeri" value={rank ? `#${rank}` : "—"} />
        </div>
      )}

      {/* Cavablara bax */}
      {detail.suallar.length > 0 && (
        <div>
          <Button variant="outline" className="w-full rounded-full" onClick={() => setReview((v) => !v)}>
            {review ? "Cavabları gizlət" : "Cavablara bax"}
          </Button>
          {review && (
            <div className="mt-3 space-y-3">
              {detail.suallar.map((q, i) => {
                const myPick = mine?.secimler?.[String(i)];
                return (
                  <Card key={i} className="rounded-2xl">
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        Sual {i + 1}
                        {q.movzu && <Badge variant="outline" className="rounded-full text-[10px]">{q.movzu}</Badge>}
                      </div>
                      <Markdown content={q.sual} className="text-sm font-medium leading-relaxed" />
                      <GeometryFigure figura={(q.figura ?? null) as GeometryFigureSpec | null} />
                      <div className="grid gap-1.5">
                        {HERFLER.map((h) => {
                          const val = q.variantlar?.[h];
                          if (val === undefined || val === null) return null;
                          const isCorrect = q.dogruCavab === h;
                          const isMine = myPick === h;
                          return (
                            <div
                              key={h}
                              className={cn(
                                "flex items-start gap-2 rounded-lg border p-2 text-sm",
                                isCorrect
                                  ? "border-emerald-500/50 bg-emerald-500/10"
                                  : isMine
                                    ? "border-destructive/50 bg-destructive/10"
                                    : "border-border"
                              )}
                            >
                              <span className="flex size-5 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-bold">
                                {h}
                              </span>
                              <Markdown content={val} inline className="text-sm" />
                              {isCorrect && <Check className="ml-auto size-4 shrink-0 text-emerald-600" />}
                              {isMine && !isCorrect && <X className="ml-auto size-4 shrink-0 text-destructive" />}
                            </div>
                          );
                        })}
                      </div>
                      {/* Hər iştirakçının bu suala verdiyi cavab (yalnız bitəndən sonra göndərilir) */}
                      <div className="flex flex-wrap gap-1.5">
                        {ranked.map((p) => {
                          const pick = p.secimler?.[String(i)];
                          const ok = pick !== undefined && pick === q.dogruCavab;
                          return (
                            <span
                              key={p.studentId}
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]",
                                pick === undefined
                                  ? "border-border text-muted-foreground"
                                  : ok
                                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                    : "border-destructive/50 bg-destructive/10 text-destructive"
                              )}
                            >
                              {p.ad}
                              {p.studentId === studentId && " (sən)"}: <b>{pick ?? "—"}</b>
                              {pick !== undefined && (ok ? <Check className="size-3" /> : <X className="size-3" />)}
                            </span>
                          );
                        })}
                      </div>
                      {q.izah && (
                        <div className="rounded-lg bg-muted/50 p-2.5 text-xs">
                          <Markdown content={q.izah} inline />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-2.5 text-center">
      <div className="font-stat text-lg font-bold tabular-nums">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

// ==================== TARİXÇƏ ====================

function ArenaHistory({ onBack, onOpen }: { onBack: () => void; onOpen: (id: string) => void }) {
  const sessionId = useStore((s) => s.sessionId);
  const [rows, setRows] = React.useState<ArenaHistoryItem[] | null>(null);

  React.useEffect(() => {
    if (!sessionId) return;
    api.arenaHistory(sessionId).then(setRows).catch(() => setRows([]));
  }, [sessionId]);

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Lobbiyə qayıt
      </button>
      <h2 className="font-heading text-lg font-bold">Müsabiqə tarixçəm</h2>

      {rows === null ? (
        <div className="flex justify-center py-10">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : rows.length === 0 ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Hələ heç bir müsabiqədə iştirak etməmisən.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <button
              key={r.competitionId}
              onClick={() => onOpen(r.competitionId)}
              className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition-colors hover:bg-muted"
            >
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl",
                  r.qalib ? "bg-amber-500/15 text-amber-500" : "bg-muted text-muted-foreground"
                )}
              >
                {r.qalib ? <Trophy className="size-5" /> : <Medal className="size-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{r.ad}</div>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span>{r.fenn}</span>·<span>{azDateShort(new Date(r.tarix))}</span>·
                  <span>{r.istirakciSayi} iştirakçı</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold tabular-nums">
                  {r.sira ? `${r.sira}/${r.istirakciSayi}` : "—"}
                </div>
                <div className="text-[11px] text-muted-foreground">{r.xal} xal</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== REYTİNQ ====================

function ArenaLeaderboardView({ onBack }: { onBack: () => void }) {
  const sessionId = useStore((s) => s.sessionId);
  const studentId = useStore((s) => s.student?.id);
  const [period, setPeriod] = React.useState<"all" | "week" | "month">("all");
  const [data, setData] = React.useState<ArenaLeaderboard | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    api
      .arenaLeaderboard(sessionId, period)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [sessionId, period]);

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Lobbiyə qayıt
      </button>
      <h2 className="font-heading text-lg font-bold">Bilik Arenası reytinqi</h2>

      <div className="flex gap-2">
        {(
          [
            ["all", "Ümumi"],
            ["week", "Bu həftə"],
            ["month", "Bu ay"],
          ] as const
        ).map(([v, l]) => (
          <button
            key={v}
            onClick={() => setPeriod(v)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
              period === v ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"
            )}
          >
            {l}
          </button>
        ))}
      </div>

      {data && (
        <Card className="rounded-2xl bg-gradient-to-br from-primary/10 to-transparent">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <div className="text-xs text-muted-foreground">Sənin yerin</div>
              <div className="font-stat text-2xl font-bold">
                {data.menim.sira ? `#${data.menim.sira}` : "Reytinqdə deyilsən"}
              </div>
            </div>
            <div className="text-right">
              <div className="font-stat text-2xl font-bold tabular-nums">{data.menim.xal}</div>
              <div className="text-xs text-muted-foreground">ümumi xal</div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : !data || data.liderler.length === 0 ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Bu dövr üçün hələ nəticə yoxdur.
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl">
          <CardContent className="p-0">
            {data.liderler.map((r) => {
              const isMe = r.studentId === studentId;
              return (
                <div
                  key={r.studentId}
                  className={cn(
                    "flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-0",
                    isMe && "bg-primary/5"
                  )}
                >
                  <span className="w-7 text-center text-sm font-bold tabular-nums">
                    {medalFor(r.sira) ?? r.sira}
                  </span>
                  <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                    {initials(r.ad)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {r.ad} {isMe && <span className="text-xs text-primary">(sən)</span>}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {r.musabiqeSayi} müsabiqə · {r.qalibSayi} qalibiyyət
                    </div>
                  </div>
                  <span className="font-stat text-base font-bold tabular-nums">{r.xal}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ==================== BİLDİRİŞ ZƏNGİ ====================

function ArenaNotificationsBell({ onOpenCompetition }: { onOpenCompetition: (id: string) => void }) {
  const sessionId = useStore((s) => s.sessionId);
  const [items, setItems] = React.useState<ArenaNotificationItem[]>([]);
  const [unread, setUnread] = React.useState(0);
  const [open, setOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!sessionId) return;
    try {
      const r = await api.arenaNotifications(sessionId);
      setItems(r.bildirisler);
      setUnread(r.oxunmamis);
    } catch {
      /* boş */
    }
  }, [sessionId]);

  React.useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [load]);

  async function handleOpenChange(v: boolean) {
    setOpen(v);
    if (v && unread > 0 && sessionId) {
      try {
        await api.arenaMarkNotificationsRead(sessionId);
        setUnread(0);
        setItems((prev) => prev.map((n) => ({ ...n, oxunub: true })));
      } catch {
        /* boş */
      }
    }
  }

  const emoji: Record<string, string> = {
    QOSULDU: "🔔",
    BASLADI: "🏁",
    BITDI: "✅",
    QALIB: "🏆",
    DEVET: "✉️",
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative size-9 rounded-full">
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="border-b border-border px-3 py-2 text-sm font-semibold">Bildirişlər</div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-3 py-8 text-center text-xs text-muted-foreground">Bildiriş yoxdur</div>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  if (n.competitionId) {
                    onOpenCompetition(n.competitionId);
                    setOpen(false);
                  }
                }}
                className={cn(
                  "flex w-full items-start gap-2 border-b border-border px-3 py-2.5 text-left last:border-0 hover:bg-muted",
                  !n.oxunub && "bg-primary/5"
                )}
              >
                <span className="text-base leading-none">{emoji[n.tip] ?? "🔔"}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs leading-snug">{n.mesaj}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{relTime(n.createdAt)}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
