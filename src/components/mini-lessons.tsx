"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Sparkles,
  Loader2,
  Star,
  Check,
  Clock,
  Plus,
  ArrowLeft,
  ArrowRight,
  Lightbulb,
  Trophy,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ListChecks,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Markdown } from "@/components/markdown";
import { GeometryFigure } from "@/components/geometry-figure";
import { CountUp } from "@/components/count-up";
import { api, ALL_FENLER } from "@/lib/api";
import type {
  MiniLesson,
  MiniLessonsResult,
  GeneratedQuestion,
  WeakTopicsResult,
  WeakTopic,
} from "@/lib/api";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { cn, azDateShort } from "@/lib/utils";

const LETTERS: ("A" | "B" | "C" | "D" | "E")[] = ["A", "B", "C", "D", "E"];

// AI dərsi yaradılarkən fırlanan mesajlar
const GENERATION_STEPS = [
  "Mövzu analiz edilir...",
  "Əsas anlayışlar seçilir...",
  "Addım-addım izah yazılır...",
  "Nümunə həlli hazırlanır...",
  "Səhv xətalar qeyd edilir...",
  "Mini quiz sualları yaradılır...",
];

type Phase = "main" | "reader";

interface StatItem {
  label: string;
  value: number;
  icon: typeof BookOpen;
  accent: "primary" | "accent" | "amber" | "muted";
}

export function MiniLessons() {
  const sessionId = useStore((s) => s.sessionId) || "";
  const setAppView = useStore((s) => s.setAppView);
  const lessonPrefill = useStore((s) => s.lessonPrefill);
  const setLessonPrefill = useStore((s) => s.setLessonPrefill);
  const { toast } = useToast();

  const [phase, setPhase] = React.useState<Phase>("main");
  const [data, setData] = React.useState<MiniLessonsResult | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeLesson, setActiveLesson] = React.useState<MiniLesson | null>(null);
  const [weakTopics, setWeakTopics] = React.useState<WeakTopic[]>([]);

  // Create dialog state
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [fenn, setFenn] = React.useState<string>("");
  const [movzu, setMovzu] = React.useState<string>("");
  const [stepIdx, setStepIdx] = React.useState(0);

  const load = React.useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const r = await api.getMiniLessons(sessionId);
      setData(r);
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

  // Weak topics-u "Yeni Dərs Yarat" dialoqunda chip kimi göstərmək üçün yüklə
  const loadWeakTopics = React.useCallback(async () => {
    if (!sessionId) return;
    try {
      const r = await api.getWeakTopics(sessionId);
      // Yalnız öyrənilməmişləri göstər
      setWeakTopics((r.weakTopics || []).filter((t) => !t.oynenildi).slice(0, 6));
    } catch {
      // silent
    }
  }, [sessionId]);

  React.useEffect(() => {
    load();
  }, [load]);

  // Dialoq açılanda zəif mövzuları yüklə
  React.useEffect(() => {
    if (dialogOpen) loadWeakTopics();
  }, [dialogOpen, loadWeakTopics]);

  // Prefill-ləri tətbiq et — zəif mövzudan gələndə dialoqu açıb avtomatik yarat
  React.useEffect(() => {
    if (lessonPrefill && !loading) {
      setFenn(lessonPrefill.fenn);
      setMovzu(lessonPrefill.movzu);
      setDialogOpen(true);
      setLessonPrefill(null);
      // Avtomatik yaratma yerinə dialoqu açıb istifadəçiyə təsdiq veririk
    }
  }, [lessonPrefill, loading, setLessonPrefill]);

  // AI yaradılarkən fırlanan mesajlar
  React.useEffect(() => {
    if (!creating) {
      setStepIdx(0);
      return;
    }
    const id = window.setInterval(() => {
      setStepIdx((i) => Math.min(i + 1, GENERATION_STEPS.length - 1));
    }, 1800);
    return () => window.clearInterval(id);
  }, [creating]);

  async function handleCreate() {
    if (!fenn || !movzu.trim()) {
      toast({
        variant: "destructive",
        title: "Məlumat çatışmır",
        description: "Fənn və mövzu tələb olunur",
      });
      return;
    }
    setCreating(true);
    try {
      const lesson = await api.generateMiniLesson({
        sessionId,
        fenn,
        movzu: movzu.trim(),
      });
      // Yeni dərsi siyahıya əlavə et (ən üstdə)
      setData((prev) =>
        prev
          ? {
              lessons: [lesson, ...prev.lessons.filter((l) => l.id !== lesson.id)],
              stats: {
                toplam: prev.lessons.length + 1,
                oxundu: prev.stats.oxundu,
                oxunmamis: prev.stats.oxunmamis + 1,
                bookmark: prev.stats.bookmark,
              },
            }
          : prev
      );
      setDialogOpen(false);
      setMovzu("");
      toast({
        title: "Dərs hazırlandı ✓",
        description: `${lesson.basliq} — oxumağa hazırdır`,
      });
      // Avtomatik oxuma görünüşünə keç
      setActiveLesson(lesson);
      setPhase("reader");
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Dərs yaradıla bilmədi",
        description: e instanceof Error ? e.message : "Xəta baş verdi",
      });
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleBookmark(lesson: MiniLesson) {
    try {
      const r = await api.toggleLessonBookmark(lesson.id);
      setData((prev) =>
        prev
          ? {
              ...prev,
              lessons: prev.lessons.map((l) => (l.id === r.id ? { ...l, ...r } : l)),
              stats: {
                ...prev.stats,
                bookmark:
                  prev.stats.bookmark + (r.bookmarkEdildi ? 1 : -1),
              },
            }
          : prev
      );
      if (activeLesson?.id === r.id) {
        setActiveLesson((al) => (al ? { ...al, ...r } : al));
      }
    } catch (e) {
      toast({
        variant: "destructive",
        title: " Əməliyyat alınmadı",
        description: e instanceof Error ? e.message : "Xəta",
      });
    }
  }

  function openLesson(lesson: MiniLesson) {
    setActiveLesson(lesson);
    setPhase("reader");
  }

  function backToMain() {
    setActiveLesson(null);
    setPhase("main");
    load();
  }

  // === Loading ===
  if (loading && !data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="size-6 animate-spin text-primary" />
        <p className="text-sm">Mini-dərslər yüklənir...</p>
      </div>
    );
  }

  // === Reader phase ===
  if (phase === "reader" && activeLesson) {
    return (
      <LessonReader
        key={activeLesson.id}
        lesson={activeLesson}
        sessionId={sessionId}
        onBack={backToMain}
        onToggleBookmark={() => handleToggleBookmark(activeLesson)}
        onMarkRead={async () => {
          try {
            const r = await api.toggleLessonRead(activeLesson.id);
            setData((prev) =>
              prev
                ? {
                    ...prev,
                    lessons: prev.lessons.map((l) =>
                      l.id === r.id ? { ...l, ...r } : l
                    ),
                    stats: {
                      ...prev.stats,
                      oxundu: prev.stats.oxundu + (r.oxundu ? 1 : -1),
                      oxunmamis: Math.max(0, prev.stats.oxunmamis - (r.oxundu ? 1 : 0)),
                    },
                  }
                : prev
            );
            setActiveLesson((al) => (al ? { ...al, ...r } : al));
            if (r.oxundu) {
              toast({
                title: "Dərs oxundu! 🎉",
                description: "Dərs oxundu kimi işarələndi",
              });
            }
            return r;
          } catch (e) {
            toast({
              variant: "destructive",
              title: "İşarələnmədi",
              description: e instanceof Error ? e.message : "Xəta",
            });
            return null;
          }
        }}
        onNextLesson={(lesson) => {
          setActiveLesson(lesson);
        }}
        nextLesson={
          data
            ? data.lessons.find((l, i, arr) => {
                const curIdx = arr.findIndex((x) => x.id === activeLesson.id);
                return i > curIdx && !l.oxundu;
              })
            : undefined
        }
      />
    );
  }

  // === Main phase ===
  const stats = data?.stats || { toplam: 0, oxundu: 0, oxunmamis: 0, bookmark: 0 };
  const statItems: StatItem[] = [
    { label: "Toplam dərs", value: stats.toplam, icon: BookOpen, accent: "primary" },
    { label: "Oxunmuş", value: stats.oxundu, icon: CheckCircle2, accent: "accent" },
    { label: "Oxunmamış", value: stats.oxunmamis, icon: Clock, accent: "amber" },
    { label: "Bookmark", value: stats.bookmark, icon: Star, accent: "muted" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-end justify-between gap-3"
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Dərs Təkrarı
          </p>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            Dərs Təkrarı
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            AI zəif mövzularına fokuslanmış mini-dərslər
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={load}
            disabled={loading}
            className="active:scale-95"
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            <span className="sr-only sm:not-sr-only">Yenilə</span>
          </Button>
          <Button
            size="sm"
            className="h-9 gap-1.5 shadow-sm active:scale-95"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="size-4" />
            Yeni Dərs Yarat
          </Button>
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {statItems.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="h-full transition-all hover:shadow-md hover:-translate-y-0.5">
              <CardContent className="flex items-center gap-3 p-4 sm:p-5">
                <div
                  className={cn(
                    "flex size-9 items-center justify-center rounded-lg",
                    s.accent === "primary" && "bg-primary/10 text-primary",
                    s.accent === "accent" && "bg-accent/10 text-accent",
                    s.accent === "amber" && "bg-amber-500/10 text-amber-500",
                    s.accent === "muted" && "bg-muted text-muted-foreground"
                  )}
                >
                  <s.icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <CountUp
                    value={s.value}
                    className={cn(
                      "font-stat text-xl font-bold tabular-nums sm:text-2xl",
                      s.accent === "primary" && "text-primary",
                      s.accent === "accent" && "text-accent",
                      s.accent === "amber" && "text-amber-500",
                      s.accent === "muted" && "text-foreground"
                    )}
                  />
                  <div className="text-[11px] text-muted-foreground sm:text-xs">
                    {s.label}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Lessons list */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Dərslər yüklənir...
        </div>
      ) : !data || data.lessons.length === 0 ? (
        <EmptyState onCreate={() => setDialogOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {data.lessons.map((lesson, i) => (
              <motion.div
                key={lesson.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
              >
                <LessonCard
                  lesson={lesson}
                  onOpen={() => openLesson(lesson)}
                  onBookmark={() => handleToggleBookmark(lesson)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => !creating && setDialogOpen(o)}>
        <DialogContent className="sm:max-w-md">
          {creating ? (
            <CreateProgressView stepIdx={stepIdx} />
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  Yeni Mini-Dərs Yarat
                </DialogTitle>
                <DialogDescription>
                  AI zəif mövzuya fokuslanmış dərs hazırlayacaq (~10-15 saniyə)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {/* Fenn */}
                <div className="space-y-1.5">
                  <Label htmlFor="lesson-fenn">Fənn</Label>
                  <Select value={fenn} onValueChange={setFenn}>
                    <SelectTrigger id="lesson-fenn" className="w-full">
                      <SelectValue placeholder="Fənn seçin" />
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
                {/* Movzu */}
                <div className="space-y-1.5">
                  <Label htmlFor="lesson-movzu">Mövzu</Label>
                  <Input
                    id="lesson-movzu"
                    placeholder='məs: "Kvadrat tənliklər", "pH hesablamaları"'
                    value={movzu}
                    onChange={(e) => setMovzu(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleCreate();
                      }
                    }}
                  />
                </div>
                {/* Suggest weak topics */}
                {weakTopics.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Lightbulb className="size-3 text-amber-500" />
                      Zəif mövzularından seç
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {weakTopics.map((wt) => (
                        <button
                          key={wt.id}
                          onClick={() => {
                            setFenn(wt.fenn);
                            setMovzu(wt.movzu);
                          }}
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-[11px] transition-all active:scale-95",
                            fenn === wt.fenn && movzu === wt.movzu
                              ? "border-primary/40 bg-primary/5 text-primary"
                              : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                          )}
                        >
                          {wt.fenn} · {wt.movzu}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setDialogOpen(false)}
                  className="active:scale-95"
                >
                  İmtina
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!fenn || !movzu.trim()}
                  className="gap-1.5 active:scale-95"
                >
                  <Sparkles className="size-4" />
                  Yarat
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// === Lesson Card ===
function LessonCard({
  lesson,
  onOpen,
  onBookmark,
}: {
  lesson: MiniLesson;
  onOpen: () => void;
  onBookmark: () => void;
}) {
  return (
    <Card
      onClick={onOpen}
      className={cn(
        "group relative h-full cursor-pointer overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md",
        lesson.oxundu ? "border-accent/30 bg-accent/5" : "border-border",
        lesson.bookmarkEdildi && "ring-1 ring-amber-500/30"
      )}
    >
      <CardContent className="flex h-full flex-col gap-3 p-4">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-[10px]">
              {lesson.fenn}
            </Badge>
            {lesson.oxundu && (
              <Badge
                variant="outline"
                className="border-accent/40 text-accent gap-0.5 text-[10px]"
              >
                <Check className="size-2.5" />
                Oxundu
              </Badge>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBookmark();
            }}
            className={cn(
              "flex size-7 items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95",
              lesson.bookmarkEdildi
                ? "text-amber-500 hover:bg-amber-500/10"
                : "text-muted-foreground/60 hover:bg-muted hover:text-amber-500"
            )}
            aria-label="Bookmark"
          >
            <Star
              className={cn("size-4", lesson.bookmarkEdildi && "fill-current")}
            />
          </button>
        </div>

        {/* Title */}
        <div className="min-h-0 flex-1">
          <h3 className="line-clamp-2 font-heading text-sm font-bold leading-tight">
            {lesson.basliq}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">{lesson.movzu}</p>
        </div>

        {/* Footer */}
        <Separator className="bg-border/60" />
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            ~{lesson.oxunmaVaxti} dəq
          </span>
          {lesson.quizSuallar && lesson.quizSuallar.length > 0 && (
            <span className="flex items-center gap-1">
              <ListChecks className="size-3" />
              {lesson.quizSuallar.length} sual
            </span>
          )}
          <span className="text-muted-foreground/60">{azDateShort(new Date(lesson.createdAt))}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// === Create Progress View ===
function CreateProgressView({ stepIdx }: { stepIdx: number }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-8">
      <div className="relative flex size-16 items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary"
        />
        <Sparkles className="size-7 text-primary" />
      </div>
      <div className="text-center">
        <h3 className="font-heading text-base font-bold">AI dərs hazırlayır...</h3>
        <motion.p
          key={stepIdx}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-sm text-muted-foreground"
        >
          {GENERATION_STEPS[stepIdx]}
        </motion.p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-1">
        {GENERATION_STEPS.map((step, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center gap-2 text-[11px] transition-all",
              i < stepIdx
                ? "text-accent"
                : i === stepIdx
                  ? "text-foreground"
                  : "text-muted-foreground/40"
            )}
          >
            {i < stepIdx ? (
              <Check className="size-3" />
            ) : i === stepIdx ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <div className="size-3 rounded-full border border-current" />
            )}
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}

// === Empty State ===
function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <BookOpen className="size-7" />
        </div>
        <div>
          <p className="font-heading text-base font-semibold">Hələ dərs yoxdur</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            AI zəif mövzularına fokuslanmış mini-dərs yarada bilərsən. Dərs sonunda
            qısa quiz də gözləyir.
          </p>
        </div>
        <Button onClick={onCreate} className="gap-1.5 active:scale-95">
          <Plus className="size-4" />
          İlk mini-dərsini yarat
        </Button>
      </CardContent>
    </Card>
  );
}

// === Lesson Reader ===
interface LessonReaderProps {
  lesson: MiniLesson;
  sessionId: string;
  onBack: () => void;
  onToggleBookmark: () => void;
  onNextLesson: (lesson: MiniLesson) => void;
  onMarkRead: () => Promise<MiniLesson | null>;
  nextLesson?: MiniLesson;
}

function LessonReader({
  lesson,
  sessionId,
  onBack,
  onToggleBookmark,
  onMarkRead,
  onNextLesson,
  nextLesson,
}: LessonReaderProps) {
  const { toast } = useToast();
  const [quizAnswers, setQuizAnswers] = React.useState<
    Record<number, "A" | "B" | "C" | "D" | "E">
  >({});
  const [quizRevealed, setQuizRevealed] = React.useState<Record<number, boolean>>({});
  const [quizFinished, setQuizFinished] = React.useState(false);
  const [markingRead, setMarkingRead] = React.useState(false);
  const quiz = lesson.quizSuallar || [];

  function answerQuestion(idx: number, letter: "A" | "B" | "C" | "D" | "E") {
    if (quizRevealed[idx]) return;
    setQuizAnswers((prev) => ({ ...prev, [idx]: letter }));
    setQuizRevealed((prev) => ({ ...prev, [idx]: true }));
    // POST /api/progress — dərs sualı həlli
    if (sessionId && quiz[idx]) {
      const dogru = quiz[idx].dogruCavab === letter;
      api
        .recordProgress({
          sessionId,
          fenn: lesson.fenn,
          dogru,
          say: 1,
        })
        .catch(() => {
          // silent
        });
    }
  }

  const correctCount = quiz.reduce(
    (acc, q, i) => acc + (quizAnswers[i] === q.dogruCavab ? 1 : 0),
    0
  );
  const answeredCount = Object.keys(quizRevealed).filter((k) => quizRevealed[Number(k)]).length;
  const allAnswered = quiz.length > 0 && answeredCount === quiz.length;

  React.useEffect(() => {
    if (allAnswered && !quizFinished) {
      setQuizFinished(true);
      // Auto-mark read after a short delay
      if (!lesson.oxundu) {
        window.setTimeout(async () => {
          setMarkingRead(true);
          await onMarkRead();
          setMarkingRead(false);
        }, 600);
      }
    }
  }, [allAnswered, quizFinished, lesson.oxundu, onMarkRead]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 active:scale-95">
          <ArrowLeft className="size-4" />
          Dərslərə qayıt
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleBookmark}
            className={cn(
              "gap-1.5 active:scale-95",
              lesson.bookmarkEdildi && "text-amber-500 hover:bg-amber-500/10"
            )}
          >
            <Star className={cn("size-4", lesson.bookmarkEdildi && "fill-current")} />
            {lesson.bookmarkEdildi ? "Bookmark edildi" : "Bookmark"}
          </Button>
        </div>
      </div>

      {/* Lesson header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardContent className="space-y-3 p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{lesson.fenn}</Badge>
              {lesson.oxundu && (
                <Badge
                  variant="outline"
                  className="border-accent/40 text-accent gap-0.5"
                >
                  <Check className="size-3" />
                  Oxundu
                </Badge>
              )}
              <Badge variant="outline" className="gap-0.5 text-muted-foreground">
                <Clock className="size-3" />
                ~{lesson.oxunmaVaxti} dəq
              </Badge>
            </div>
            <h1 className="font-heading text-xl font-bold leading-tight sm:text-2xl">
              {lesson.basliq}
            </h1>
            <p className="text-sm text-muted-foreground">{lesson.movzu}</p>
            <Separator />
            {/* Markdown content */}
            <article className="prose-tqdk max-w-none">
              <Markdown content={lesson.metin} />
            </article>
          </CardContent>
        </Card>
      </motion.div>

      {/* Mini Quiz */}
      {quiz.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ListChecks className="size-4 text-primary" />
                Mini Quiz
              </CardTitle>
              <CardDescription>
                Dərsi möhkəmləndir · {quiz.length} sual · {correctCount} doğru
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress bar */}
              {quiz.length > 1 && (
                <div>
                  <Progress
                    value={quiz.length > 0 ? (answeredCount / quiz.length) * 100 : 0}
                    className="h-1.5"
                  />
                </div>
              )}

              {/* Questions */}
              <div className="space-y-4">
                {quiz.map((q, qi) => (
                  <QuizQuestion
                    key={qi}
                    question={q}
                    index={qi}
                    selected={quizAnswers[qi] || null}
                    revealed={!!quizRevealed[qi]}
                    onAnswer={(letter) => answerQuestion(qi, letter)}
                  />
                ))}
              </div>

              {/* Completion summary */}
              <AnimatePresence>
                {quizFinished && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="rounded-xl border border-accent/30 bg-accent/5 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-full bg-accent/15 text-accent">
                        <Trophy className="size-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-heading text-sm font-bold">
                          Quiz tamamlandı! 🎉
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {correctCount} / {quiz.length} doğru
                          {correctCount === quiz.length
                            ? " — mükəmməl!"
                            : correctCount >= Math.ceil(quiz.length / 2)
                              ? " — yaxşı iş!"
                              : " — mövzunu təkrar et"}
                        </p>
                      </div>
                    </div>
                    {markingRead ? (
                      <div className="mt-3 flex items-center gap-2 text-xs text-accent">
                        <Loader2 className="size-3 animate-spin" />
                        Dərs oxundu kimi işarələnir...
                      </div>
                    ) : lesson.oxundu ? (
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-accent">
                        <Check className="size-3" />
                        Dərs oxundu kimi işarələnib
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={async () => {
                          setMarkingRead(true);
                          await onMarkRead();
                          setMarkingRead(false);
                        }}
                        disabled={markingRead}
                        className="mt-3 gap-1.5 active:scale-95"
                      >
                        {markingRead ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Check className="size-3.5" />
                        )}
                        Oxundu kimi işarələ
                      </Button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Footer actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBack}
                  className="gap-1.5 active:scale-95"
                >
                  <ArrowLeft className="size-4" />
                  Panele qayıt
                </Button>
                {nextLesson && (
                  <Button
                    size="sm"
                    onClick={() => onNextLesson(nextLesson)}
                    className="gap-1.5 active:scale-95"
                  >
                    Növbəti dərs
                    <ArrowRight className="size-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="size-4 text-amber-500" />
            <p className="text-xs text-muted-foreground">
              Bu dərs üçün quiz sualları yaratdırıla bilmədi. Mövzunu yenidən işləyib
              dərs silinərsə təkrar yaratmaq mümkündür.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// === Quiz Question ===
function QuizQuestion({
  question,
  index,
  selected,
  revealed,
  onAnswer,
}: {
  question: GeneratedQuestion;
  index: number;
  selected: "A" | "B" | "C" | "D" | "E" | null;
  revealed: boolean;
  onAnswer: (letter: "A" | "B" | "C" | "D" | "E") => void;
}) {
  const isCorrect = selected === question.dogruCavab;
  return (
    <div className="rounded-xl border border-border p-3 sm:p-4">
      <div className="mb-2 flex items-start gap-2">
        <span className="font-stat flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {index + 1}
        </span>
        <Markdown content={question.sual} className="text-sm font-medium leading-relaxed" />
      </div>
      <GeometryFigure figura={question.figura} />
      <div className="space-y-1.5">
        {LETTERS.map((letter) => {
          const value = question.variantlar[letter];
          const isAnswer = letter === selected;
          const isRightAnswer = letter === question.dogruCavab;
          return (
            <button
              key={letter}
              onClick={() => onAnswer(letter)}
              disabled={revealed}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-sm transition-all",
                !revealed &&
                  "border-border hover:border-primary/30 hover:bg-primary/5 active:scale-[0.99]",
                revealed && isRightAnswer && "border-accent/40 bg-accent/5 text-accent",
                revealed &&
                  isAnswer &&
                  !isRightAnswer &&
                  "border-destructive/40 bg-destructive/5 text-destructive",
                revealed &&
                  !isRightAnswer &&
                  !isAnswer &&
                  "border-border opacity-60"
              )}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded text-[10px] font-bold",
                  !revealed && "bg-muted text-muted-foreground",
                  revealed && isRightAnswer && "bg-accent text-accent-foreground",
                  revealed &&
                    isAnswer &&
                    !isRightAnswer &&
                    "bg-destructive text-destructive-foreground",
                  revealed &&
                    !isRightAnswer &&
                    !isAnswer &&
                    "bg-muted text-muted-foreground"
                )}
              >
                {revealed && isRightAnswer ? (
                  <Check className="size-3" />
                ) : revealed && isAnswer && !isRightAnswer ? (
                  <XCircle className="size-3" />
                ) : (
                  letter
                )}
              </span>
              <Markdown content={value} inline className="flex-1 text-xs leading-relaxed sm:text-sm" />
            </button>
          );
        })}
      </div>
      {revealed && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className={cn(
            "mt-2 rounded-lg border-l-2 p-2.5 text-xs",
            isCorrect
              ? "border-l-accent bg-accent/5 text-foreground"
              : "border-l-amber-500 bg-amber-500/5 text-foreground"
          )}
        >
          <p className="mb-0.5 font-semibold">
            {isCorrect ? "✓ Doğru!" : "✗ Səhv cavab"}
          </p>
          <div className="text-muted-foreground">
            <strong className="text-foreground">İzah: </strong>
            <Markdown content={question.izah} inline />
          </div>
        </motion.div>
      )}
    </div>
  );
}
