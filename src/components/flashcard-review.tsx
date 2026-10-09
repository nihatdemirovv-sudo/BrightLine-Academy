"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  Loader2,
  Plus,
  Trash2,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Trophy,
  Check,
  X,
  Brain,
  Calendar,
  RefreshCw,
  PartyPopper,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, ALL_FENLER } from "@/lib/api";
import type { Flashcard, FlashcardsResult } from "@/lib/api";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { cn, azDateShort } from "@/lib/utils";
import { Markdown } from "@/components/markdown";

// === Quality button config ===
interface QualityOption {
  label: string;
  quality: number; // SM-2 scale 0-5
  hint: string;
  className: string;
  icon?: React.ReactNode;
}

const QUALITY_OPTIONS: QualityOption[] = [
  {
    label: "Tam Yanlış",
    quality: 0,
    hint: "Interval sıfırlanır",
    className: "border-destructive/40 bg-destructive/5 text-destructive hover:bg-destructive/10",
    icon: <X className="size-4" />,
  },
  {
    label: "Zorla Xatırladım",
    quality: 3,
    hint: "Az artım",
    className: "border-amber-500/40 bg-amber-500/5 text-amber-600 hover:bg-amber-500/10 dark:text-amber-400",
    icon: <Brain className="size-4" />,
  },
  {
    label: "Doğru",
    quality: 4,
    hint: "Normal artım",
    className: "border-primary/40 bg-primary/5 text-primary hover:bg-primary/10",
    icon: <Check className="size-4" />,
  },
  {
    label: "Mükəmməl",
    quality: 5,
    hint: "Maksimum artım",
    className: "border-accent/40 bg-accent/5 text-accent hover:bg-accent/10",
    icon: <Sparkles className="size-4" />,
  },
];

type Phase = "main" | "review" | "summary";

interface ReviewStats {
  correct: number;
  wrong: number;
  total: number;
}

function parseDate(s: string): Date {
  return new Date(s);
}

function formatNextReview(s: string): string {
  const d = parseDate(s);
  const today = new Date();
  const diffMs = d.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Bu gün";
  if (diffDays === 1) return "Sabah";
  if (diffDays < 7) return `${diffDays} gün sonra`;
  if (diffDays < 30) return `${Math.round(diffDays / 7)} həftə sonra`;
  return azDateShort(d);
}

export function FlashcardReview() {
  const sessionId = useStore((s) => s.sessionId) || "";
  const setAppView = useStore((s) => s.setAppView);
  const { toast } = useToast();

  const [phase, setPhase] = React.useState<Phase>("main");
  const [data, setData] = React.useState<FlashcardsResult | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshKey, setRefreshKey] = React.useState(0);

  // Review state
  const [queue, setQueue] = React.useState<Flashcard[]>([]);
  const [currentIdx, setCurrentIdx] = React.useState(0);
  const [revealed, setRevealed] = React.useState(false);
  const [reviewing, setReviewing] = React.useState(false);
  const [stats, setStats] = React.useState<ReviewStats>({ correct: 0, wrong: 0, total: 0 });

  const load = React.useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const [due, all] = await Promise.all([
        api.getFlashcards(sessionId, "due"),
        api.getFlashcards(sessionId, "all"),
      ]);
      // Use "all" as the main dataset, override stats with "due" stats
      setData({
        flashcards: all.flashcards,
        stats: due.stats,
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Yüklənmə xətası",
        description: e instanceof Error ? e.message : "Server xətası",
      });
    } finally {
      setLoading(false);
    }
  }, [sessionId, toast]);

  React.useEffect(() => {
    load();
  }, [load, refreshKey]);

  function refresh() {
    setRefreshKey((k) => k + 1);
  }

  function startReview() {
    if (!data || data.stats.buGunTəkrar === 0) return;
    // Load fresh due cards for the queue
    api
      .getFlashcards(sessionId, "due")
      .then((r) => {
        if (!r.flashcards.length) {
          toast({ title: "Təkrar ediləcək kart yoxdur" });
          return;
        }
        setQueue(r.flashcards);
        setCurrentIdx(0);
        setRevealed(false);
        setStats({ correct: 0, wrong: 0, total: r.flashcards.length });
        setPhase("review");
      })
      .catch((e) => {
        toast({
          variant: "destructive",
          title: "Təkrar başladıla bilmədi",
          description: e instanceof Error ? e.message : "Xəta",
        });
      });
  }

  function nextCard() {
    setRevealed(false);
    // small delay so the flip-back animation reads
    setTimeout(() => {
      if (currentIdx + 1 >= queue.length) {
        setPhase("summary");
      } else {
        setCurrentIdx((i) => i + 1);
      }
    }, 180);
  }

  async function handleQuality(q: number) {
    const card = queue[currentIdx];
    if (!card || reviewing) return;
    setReviewing(true);
    try {
      const r = await api.reviewFlashcard({ flashcardId: card.id, quality: q });
      setStats((s) => ({
        ...s,
        correct: q >= 3 ? s.correct + 1 : s.correct,
        wrong: q < 3 ? s.wrong + 1 : s.wrong,
      }));
      toast({
        title: q >= 3 ? "Doğru cavab ✓" : "Səhv cavab",
        description: `Növbəti təkrar: ${formatNextReview(r.nextReview)}`,
      });
      nextCard();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Saxlanıla bilmədi",
        description: e instanceof Error ? e.message : "Xəta",
      });
    } finally {
      setReviewing(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteFlashcard(id);
      toast({ title: "Kart silindi" });
      refresh();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Silinmədi",
        description: e instanceof Error ? e.message : "Xəta",
      });
    }
  }

  function finishReview() {
    setPhase("summary");
  }

  function exitToMain() {
    setPhase("main");
    setQueue([]);
    setCurrentIdx(0);
    setRevealed(false);
    setStats({ correct: 0, wrong: 0, total: 0 });
    refresh();
  }

  // === Loading ===
  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="size-6 animate-spin text-primary" />
        <p className="text-sm">Təkrar kartları yüklənir...</p>
      </div>
    );
  }

  // === Review phase ===
  if (phase === "review") {
    const card = queue[currentIdx];
    if (!card) {
      // Empty — all done
      return (
        <ReviewSummary
          stats={stats}
          onBackToDashboard={() => {
            setAppView("dashboard");
            exitToMain();
          }}
          onRestart={exitToMain}
        />
      );
    }
    const progressPct = stats.total > 0 ? Math.round((currentIdx / stats.total) * 100) : 0;
    return (
      <div className="mx-auto w-full max-w-3xl space-y-5">
        {/* Top bar: exit + progress */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={() => setPhase("main")} className="gap-1.5">
            <ArrowLeft className="size-4" />
            Geri
          </Button>
          <div className="flex items-center gap-3">
            <span className="font-stat text-sm font-semibold tabular-nums text-muted-foreground">
              Kart {currentIdx + 1} / {queue.length}
            </span>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                  Bitir
                  <X className="size-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Təkrarı dayandır?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Hal-hazırda {currentIdx + 1}/{queue.length} kart tamamlayıbsan. Davam edib
                    qalan kartları da təkrar etməyi tövsiyə edirik.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Davam et</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={finishReview}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Bitir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <Progress value={progressPct} className="h-1.5" />
        </div>

        {/* Flashcard */}
        <div className="[perspective:1800px]">
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="relative"
            style={{ transformStyle: "preserve-3d" }}
          >
            <AnimatePresence mode="wait">
              {!revealed ? (
                <motion.div
                  key="front"
                  initial={{ rotateY: 0 }}
                  exit={{ rotateY: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="min-h-[300px] sm:min-h-[360px]"
                >
                  <Card className="h-full border-primary/20">
                    <CardContent className="flex h-full min-h-[300px] flex-col items-center justify-center gap-4 p-6 text-center sm:min-h-[360px] sm:p-10">
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <Badge variant="secondary" className="text-xs">{card.fenn}</Badge>
                        {card.movzu && (
                          <Badge variant="outline" className="text-xs">{card.movzu}</Badge>
                        )}
                        <Badge variant="outline" className="text-[10px] text-muted-foreground gap-1">
                          <Layers className="size-2.5" />
                          {card.repetitions + 1}-ci təkrar
                        </Badge>
                      </div>
                      <Markdown content={card.onYuzu} className="font-heading text-lg font-semibold leading-relaxed sm:text-xl" />
                      <Button
                        size="lg"
                        onClick={() => setRevealed(true)}
                        className="mt-2 gap-2 shadow-md"
                      >
                        <RotateCcw className="size-4" />
                        Cavabı Göstər
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="back"
                  initial={{ rotateY: -90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  transition={{ duration: 0.25 }}
                  className="min-h-[300px] sm:min-h-[360px]"
                >
                  <Card className="h-full border-accent/30 bg-accent/5">
                    <CardContent className="flex h-full min-h-[300px] flex-col items-center justify-center gap-4 p-6 text-center sm:min-h-[360px] sm:p-10">
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <Badge variant="secondary" className="text-xs">{card.fenn}</Badge>
                        {card.movzu && (
                          <Badge variant="outline" className="text-xs">{card.movzu}</Badge>
                        )}
                      </div>
                      <Markdown content={card.cavab} className="font-heading text-lg font-semibold leading-relaxed sm:text-xl" />
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        Cavab nə dərəcədə yaxşı xatırladın?
                      </p>
                      <div className="grid w-full max-w-md grid-cols-2 gap-2">
                        {QUALITY_OPTIONS.map((opt) => (
                          <button
                            key={opt.quality}
                            onClick={() => handleQuality(opt.quality)}
                            disabled={reviewing}
                            className={cn(
                              "flex flex-col items-start gap-0.5 rounded-lg border p-3 text-left transition-all active:scale-95 disabled:opacity-60",
                              opt.className
                            )}
                          >
                            <span className="flex items-center gap-1.5 text-sm font-semibold">
                              {opt.icon}
                              {opt.label}
                            </span>
                            <span className="text-[10px] opacity-80">{opt.hint}</span>
                          </button>
                        ))}
                      </div>
                      {reviewing && (
                        <Loader2 className="size-4 animate-spin text-muted-foreground" />
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Live stats */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Check className="size-3 text-accent" /> {stats.correct} doğru
          </span>
          <span className="flex items-center gap-1">
            <X className="size-3 text-destructive" /> {stats.wrong} səhv
          </span>
        </div>
      </div>
    );
  }

  // === Summary phase ===
  if (phase === "summary") {
    return (
      <ReviewSummary
        stats={stats}
        onBackToDashboard={() => {
          setAppView("dashboard");
          exitToMain();
        }}
        onRestart={exitToMain}
      />
    );
  }

  // === Main phase ===
  const dueCount = data?.stats.buGunTəkrar || 0;
  const toplam = data?.stats.toplam || 0;
  const öyrənilen = data?.stats.öyrənilen || 0;
  const allCards = data?.flashcards || [];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Təkrar Sistemi
          </p>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            SRS Təkrar Kartları
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            SM-2 alqoritması ilə optimallaşdırılmış təkrar
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NewCardDialog sessionId={sessionId} onCreated={refresh} />
          <Button variant="ghost" size="sm" onClick={refresh}>
            <RefreshCw className="size-4" />
            <span className="sr-only sm:not-sr-only">Yenilə</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setAppView("dashboard")}>
            <ArrowLeft className="size-4" />
            <span className="sr-only sm:not-sr-only">Panel</span>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="size-4 text-primary" />
              <span className="text-xs">Bu gün təkrar</span>
            </div>
            <div className="font-stat mt-1 text-2xl font-bold text-primary">{dueCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Layers className="size-4" />
              <span className="text-xs">Toplam kart</span>
            </div>
            <div className="font-stat mt-1 text-2xl font-bold">{toplam}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Trophy className="size-4 text-accent" />
              <span className="text-xs">Öyrənilən</span>
            </div>
            <div className="font-stat mt-1 text-2xl font-bold text-accent">{öyrənilen}</div>
          </CardContent>
        </Card>
      </div>

      {/* Start review CTA / celebration */}
      {dueCount === 0 ? (
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="flex flex-col items-center justify-center gap-3 p-8 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, type: "spring" }}
              className="flex size-14 items-center justify-center rounded-2xl bg-accent/15 text-accent"
            >
              <PartyPopper className="size-7" />
            </motion.div>
            <div>
              <p className="font-heading text-lg font-semibold">
                Bugünkü təkrar tamamlandı! 🎉
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Yeni kartlar əlavə et və ya qalan kartlarına bax.
              </p>
            </div>
            {toplam > 0 && (
              <p className="text-[11px] text-muted-foreground">
                Növbəti təkrara qədər istirahət et — beyin öyrədiləni möhkəmləşdirir.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <p className="text-sm font-semibold">
                {dueCount} kart təkrar üçün hazırdır
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Müntəzəm təkrar yaddaşını gücləndirir
              </p>
            </div>
            <Button size="lg" onClick={startReview} className="gap-2 shadow-md">
              <RotateCcw className="size-4" />
              Təkrara Başla
              <ArrowRight className="size-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* All flashcards */}
      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-heading text-base font-semibold">Bütün kartlar</h2>
          {toplam > 0 && (
            <span className="text-xs text-muted-foreground">{toplam} kart</span>
          )}
        </div>
        {allCards.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Layers className="size-6" />
              </div>
              <div>
                <p className="text-sm font-semibold">Hələ kart yoxdur</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Səhv cavab kitabxanasından "Kart Yarat" düyməsi ilə və ya manuel əlavə et.
                </p>
              </div>
              <NewCardDialog sessionId={sessionId} onCreated={refresh} trigger={
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Plus className="size-4" />
                  Yeni Kart Əlavə Et
                </Button>
              } />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {allCards.map((c, i) => (
                <motion.div
                  key={c.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                >
                  <Card className="h-full transition-all hover:shadow-md hover:-translate-y-0.5">
                    <CardContent className="flex h-full flex-col gap-2 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="secondary" className="text-[10px]">{c.fenn}</Badge>
                          {c.movzu && (
                            <Badge variant="outline" className="text-[10px]">{c.movzu}</Badge>
                          )}
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                              aria-label="Sil"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Kartı sil?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Bu kart və bütün təkrar tarixçəsi silinəcək. Bu əməliyyat geri alına bilməz.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Ləğv et</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(c.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Sil
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      <Markdown content={c.onYuzu} inline className="line-clamp-3 text-sm font-medium leading-relaxed" />
                      <Markdown content={c.cavab} inline className="line-clamp-2 text-xs text-muted-foreground" />
                      <div className="mt-auto flex items-center justify-between gap-2 pt-1 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <RefreshCw className="size-2.5" />
                          {c.repetitions} təkrar
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="size-2.5" />
                          {formatNextReview(c.nextReview)}
                        </span>
                        <span className="font-stat tabular-nums">ease {c.ease.toFixed(1)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

// === Review summary ===
function ReviewSummary({
  stats,
  onBackToDashboard,
  onRestart,
}: {
  stats: ReviewStats;
  onBackToDashboard: () => void;
  onRestart: () => void;
}) {
  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto w-full max-w-2xl"
    >
      <Card className="overflow-hidden">
        <CardContent className="flex flex-col items-center gap-5 p-8 text-center sm:p-10">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="flex size-16 items-center justify-center rounded-2xl bg-accent/15 text-accent"
          >
            <Trophy className="size-8" />
          </motion.div>
          <div>
            <h2 className="font-heading text-xl font-bold sm:text-2xl">
              Təkrar tamamlandı! 🎉
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {stats.total} kartı təkrar etdin
            </p>
          </div>
          <div className="grid w-full grid-cols-2 gap-3">
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-3">
              <div className="font-stat text-2xl font-bold text-accent">{stats.correct}</div>
              <div className="text-[10px] text-muted-foreground">Doğru</div>
            </div>
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
              <div className="font-stat text-2xl font-bold text-destructive">{stats.wrong}</div>
              <div className="text-[10px] text-muted-foreground">Səhv</div>
            </div>
          </div>
          <div className="w-full">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Dəqiqlik</span>
              <span className="font-stat font-semibold">{accuracy}%</span>
            </div>
            <Progress
              value={accuracy}
              className={cn(
                "h-2",
                accuracy >= 75 && "[&>div]:bg-accent",
                accuracy < 75 && accuracy >= 50 && "[&>div]:bg-amber-500",
                accuracy < 50 && "[&>div]:bg-destructive"
              )}
            />
          </div>
          <div className="flex w-full flex-wrap items-center justify-center gap-2 pt-2">
            <Button variant="outline" onClick={onRestart} className="gap-1.5">
              <RotateCcw className="size-4" />
              Yenidən bax
            </Button>
            <Button onClick={onBackToDashboard} className="gap-1.5">
              <ArrowLeft className="size-4" />
              Panelə Qayıt
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// === New card dialog ===
function NewCardDialog({
  sessionId,
  onCreated,
  trigger,
}: {
  sessionId: string;
  onCreated: () => void;
  trigger?: React.ReactNode;
}) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [onYuzu, setOnYuzu] = React.useState("");
  const [cavab, setCavab] = React.useState("");
  const [fenn, setFenn] = React.useState<string>("");
  const [movzu, setMovzu] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  function reset() {
    setOnYuzu("");
    setCavab("");
    setFenn("");
    setMovzu("");
  }

  async function handleSave() {
    if (!onYuzu.trim() || !cavab.trim() || !fenn) {
      toast({
        variant: "destructive",
        title: "Boş sahə var",
        description: "Sual, cavab və fənn tələb olunur",
      });
      return;
    }
    setSaving(true);
    try {
      await api.createFlashcard({
        sessionId,
        onYuzu: onYuzu.trim(),
        cavab: cavab.trim(),
        fenn,
        movzu: movzu.trim() || undefined,
      });
      toast({ title: "Kart əlavə edildi ✓", description: "Bu gün təkrar üçün hazırdır" });
      reset();
      setOpen(false);
      onCreated();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Əlavə edilə bilmədi",
        description: e instanceof Error ? e.message : "Xəta",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="gap-1.5">
            <Plus className="size-4" />
            Yeni Kart Əlavə Et
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Yeni təkrar kartı</DialogTitle>
          <DialogDescription>
            Sual və cavabını daxil et. Kart bu gün təkrar üçün növbəyə düşəcək.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fc-onuzu">Sual (ön tərəf) *</Label>
            <Textarea
              id="fc-onuzu"
              value={onYuzu}
              onChange={(e) => setOnYuzu(e.target.value)}
              placeholder="Məs: Kvadrat tənliyin ümumi forması nədir?"
              className="min-h-20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fc-cavab">Cavab (arka tərəf) *</Label>
            <Textarea
              id="fc-cavab"
              value={cavab}
              onChange={(e) => setCavab(e.target.value)}
              placeholder="Məs: ax² + bx + c = 0 (a ≠ 0)"
              className="min-h-20"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Fənn *</Label>
              <Select value={fenn} onValueChange={setFenn}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seçin" />
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
            <div className="space-y-2">
              <Label htmlFor="fc-movzu">Mövzu (opsional)</Label>
              <Input
                id="fc-movzu"
                value={movzu}
                onChange={(e) => setMovzu(e.target.value)}
                placeholder="Məs: Kvadrat tənliklər"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
            Ləğv et
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Əlavə et
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
