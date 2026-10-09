"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  BookOpen,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { ALL_FENLER } from "@/lib/api";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const PRESETS = [15, 25, 45, 60];
const FAB_SIZE = 56; // size-14
const FAB_MARGIN = 8;
const FAB_POS_KEY = "study-timer-fab-pos";

function clampFabPos(x: number, y: number) {
  if (typeof window === "undefined") return { x, y };
  const maxX = Math.max(FAB_MARGIN, window.innerWidth - FAB_SIZE - FAB_MARGIN);
  const maxY = Math.max(FAB_MARGIN, window.innerHeight - FAB_SIZE - FAB_MARGIN);
  return {
    x: Math.min(Math.max(FAB_MARGIN, x), maxX),
    y: Math.min(Math.max(FAB_MARGIN, y), maxY),
  };
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function StudyTimer() {
  const sessionId = useStore((s) => s.sessionId) || "";
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [müddet, setMüddet] = React.useState<number>(25); // dəqiqə
  const [qalan, setQalan] = React.useState<number>(25 * 60); // saniyə
  const [running, setRunning] = React.useState(false);
  const [fenn, setFenn] = React.useState<string>("");
  const [completing, setCompleting] = React.useState(false);
  const [confetti, setConfetti] = React.useState(false);
  const [expired, setExpired] = React.useState(false);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  // FAB-ı siçanla (masaüstü) və barmaqla (mobil) sürüşdürüb istənilən yerə köçürmək —
  // mobil ekranda bəzən başqa elementlərin üstünə düşüb onları bağlayır deyə əlavə edildi.
  // pos === null olduqda default (sağ-aşağı) CSS mövqeyi işləyir; sürüşdürüldükdən sonra
  // mütləq piksel koordinatı localStorage-da saxlanılır ki, növbəti girişdə də orada qalsın.
  const [fabPos, setFabPos] = React.useState<{ x: number; y: number } | null>(null);
  const draggingRef = React.useRef(false);
  const draggedRef = React.useRef(false);
  const dragStartRef = React.useRef({ x: 0, y: 0, px: 0, py: 0 });

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(FAB_POS_KEY);
      if (saved) {
        const p = JSON.parse(saved);
        if (typeof p?.x === "number" && typeof p?.y === "number") {
          setFabPos(clampFabPos(p.x, p.y));
        }
      }
    } catch {}
  }, []);

  React.useEffect(() => {
    function onResize() {
      setFabPos((p) => (p ? clampFabPos(p.x, p.y) : p));
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function handleFabPointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    draggingRef.current = true;
    draggedRef.current = false;
    dragStartRef.current = { x: rect.left, y: rect.top, px: e.clientX, py: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handleFabPointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (!draggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.px;
    const dy = e.clientY - dragStartRef.current.py;
    if (!draggedRef.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      draggedRef.current = true;
    }
    if (draggedRef.current) {
      setFabPos(clampFabPos(dragStartRef.current.x + dx, dragStartRef.current.y + dy));
    }
  }

  function handleFabPointerUp(e: React.PointerEvent<HTMLButtonElement>) {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    if (draggedRef.current) {
      setFabPos((p) => {
        if (p) {
          try {
            localStorage.setItem(FAB_POS_KEY, JSON.stringify(p));
          } catch {}
        }
        return p;
      });
    }
  }

  function handleFabClick() {
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }
    setOpen(true);
  }

  // İnterval
  React.useEffect(() => {
    if (running && qalan > 0) {
      intervalRef.current = setInterval(() => {
        setQalan((q) => {
          if (q <= 1) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            setExpired(true);
            handleComplete();
            return 0;
          }
          return q - 1;
        });
      }, 1000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [running]);

  // Komponent unmount olanda intervalı təmizlə
  React.useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  async function handleComplete() {
    if (!sessionId) return;
    setCompleting(true);
    setConfetti(true);
    setTimeout(() => setConfetti(false), 2500);
    try {
      await api.createStudySession({
        sessionId,
        müddet,
        fenn: fenn || undefined,
      });
      toast({ title: "🎉 Dərs seansı tamamlandı!" });
      setQalan(müddet * 60);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Seans saxlanılmadı",
        description: e instanceof Error ? e.message : "Xəta",
      });
    } finally {
      setCompleting(false);
    }
  }

  function handleStartPause() {
    if (qalan === 0) {
      setExpired(false);
      setQalan(müddet * 60);
      setRunning(true);
    } else {
      setRunning((r) => !r);
    }
  }

  function handleReset() {
    setRunning(false);
    setQalan(müddet * 60);
  }

  const progress = müddet > 0 ? ((müddet * 60 - qalan) / (müddet * 60)) * 100 : 0;
  const RADIUS = 80;
  const CIRC = 2 * Math.PI * RADIUS;
  const dashOffset = CIRC * (1 - progress / 100);

  // Vaxt işləyəndə YALNIZ yuxarı-sağdakı oval görünür (yumru gizlənir); dayandırılanda
  // (pauza və ya təbii bitmə) YENİDƏN yumru görünür, oval gizlənir — ikisi heç vaxt
  // eyni anda görünmür.
  const timerActive = running && qalan > 0;

  return (
    <>
      {/* Yuxarı-sağ oval — YALNIZ vaxt işləyəndə */}
      <AnimatePresence>
        {timerActive && (
          <motion.button
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={() => setOpen(true)}
            className="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-full bg-primary px-3 py-1.5 text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-foreground opacity-50" />
              <span className="relative inline-flex size-2 rounded-full bg-primary-foreground" />
            </span>
            <span className="font-stat text-sm font-bold tabular-nums">
              {formatTime(qalan)}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Aşağı-sağ yumru FAB — YALNIZ vaxt dayandırılıb olanda, siçan/barmaqla sürüşdürülə bilir */}
      <AnimatePresence>
        {!timerActive && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            onClick={handleFabClick}
            onPointerDown={handleFabPointerDown}
            onPointerMove={handleFabPointerMove}
            onPointerUp={handleFabPointerUp}
            onPointerCancel={handleFabPointerUp}
            aria-label="Dərs saatı"
            style={
              fabPos
                ? { position: "fixed", left: fabPos.x, top: fabPos.y, touchAction: "none" }
                : { touchAction: "none" }
            }
            className={cn(
              "z-30 flex size-14 select-none items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95",
              fabPos ? "cursor-grab active:cursor-grabbing" : "fixed bottom-20 right-4 lg:bottom-6 lg:right-6"
            )}
          >
            <Timer className="size-6" />
          </motion.button>
        )}
      </AnimatePresence>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="flex flex-col gap-0 p-0 sm:max-w-md sm:mx-auto sm:rounded-t-2xl">
          <SheetHeader className="border-b border-border p-4">
            <SheetTitle className="flex items-center gap-2">
              <Timer className="size-5 text-primary" />
              Dərs Saatı
            </SheetTitle>
            <SheetDescription>
              Pomodoro üslubunda fokus seansı.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-1 flex-col items-center gap-5 p-6">
            {/* Confetti */}
            <AnimatePresence>
              {confetti && (
                <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
                  {Array.from({ length: 24 }).map((_, i) => {
                    const angle = (i / 24) * Math.PI * 2;
                    const dist = 100 + Math.random() * 80;
                    const x = Math.cos(angle) * dist;
                    const y = Math.sin(angle) * dist;
                    const emojis = ["🎉", "⭐", "✨", "🏆", "💎", "🚀"];
                    return (
                      <motion.span
                        key={i}
                        initial={{ opacity: 1, x: 0, y: 0, scale: 0.5 }}
                        animate={{
                          opacity: 0,
                          x,
                          y,
                          scale: 1,
                          rotate: Math.random() * 360,
                        }}
                        transition={{ duration: 2, ease: "easeOut" }}
                        className="absolute left-1/2 top-1/3 text-xl"
                      >
                        {emojis[i % emojis.length]}
                      </motion.span>
                    );
                  })}
                </div>
              )}
            </AnimatePresence>

            {/* Dairəvi timer */}
            <div className="relative flex size-56 items-center justify-center">
              <svg className="size-full -rotate-90" viewBox="0 0 200 200">
                <circle
                  cx="100"
                  cy="100"
                  r={RADIUS}
                  fill="none"
                  stroke="currentColor"
                  className="text-muted"
                  strokeWidth="10"
                />
                <motion.circle
                  cx="100"
                  cy="100"
                  r={RADIUS}
                  fill="none"
                  stroke="currentColor"
                  className={cn(running ? "text-accent" : "text-primary")}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  strokeDashoffset={dashOffset}
                  animate={{ strokeDashoffset: dashOffset }}
                  transition={{ duration: 0.4 }}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <div className="font-stat text-4xl font-bold tabular-nums">
                  {formatTime(qalan)}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {running ? "fokusda..." : qalan === 0 ? "tamamlandı" : "hazırdır"}
                </div>
              </div>
            </div>

            {/* Presetlər */}
            <div className="grid w-full grid-cols-4 gap-2">
              {PRESETS.map((n) => (
                <button
                  key={n}
                  onClick={() => {
                    if (running) return;
                    setMüddet(n);
                    setQalan(n * 60);
                  }}
                  disabled={running}
                  className={cn(
                    "rounded-lg border p-2 text-center transition-all disabled:opacity-50",
                    müddet === n
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/40"
                  )}
                >
                  <div className={cn("font-stat text-base font-bold", müddet === n ? "text-primary" : "text-foreground")}>
                    {n}
                  </div>
                  <div className="text-[9px] text-muted-foreground">dəq</div>
                </button>
              ))}
            </div>

            {/* Fənn seçimi (istəyə bağlı) */}
            <div className="w-full">
              <Select value={fenn} onValueChange={setFenn} disabled={running}>
                <SelectTrigger className="w-full">
                  <span className="flex items-center gap-2 text-sm">
                    <BookOpen className="size-4 text-muted-foreground" />
                    <SelectValue placeholder="Fənn (istəyə bağlı)" />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {ALL_FENLER.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Aksiyonlar */}
            <div className="flex w-full items-center gap-2">
              <Button
                onClick={handleStartPause}
                size="lg"
                className="flex-1"
                disabled={completing}
              >
                {completing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : running ? (
                  <Pause className="size-4" />
                ) : (
                  <Play className="size-4" />
                )}
                {completing ? "Saxlanılır..." : running ? "Pauza" : qalan === müddet * 60 ? "Başla" : "Davam et"}
              </Button>
              <Button variant="outline" size="lg" onClick={handleReset} disabled={completing}>
                <RotateCcw className="size-4" />
              </Button>
            </div>

          </div>
        </SheetContent>
      </Sheet>

      {/* Expiry warning dialog */}
      <AlertDialog open={expired} onOpenChange={(o) => { if (!o) setExpired(false); }}>
        <AlertDialogContent className="border-destructive/30 bg-destructive/5 sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Timer className="size-5" />
              Vaxtınız bitdi!
            </AlertDialogTitle>
            <AlertDialogDescription>
              Seans müddəti başa çatdı. Təbriklər, fokus seansını tamamladın!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setExpired(false)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yaxşı
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
