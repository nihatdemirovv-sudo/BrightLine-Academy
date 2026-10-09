"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Loader2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Clock,
  Flag,
  Trophy,
  XCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  Timer,
  Send,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const LETTERS: ("A" | "B" | "C" | "D" | "E")[] = ["A", "B", "C", "D", "E"];

interface StoredQuestion {
  id: string;
  sual: string;
  sualShekil?: string;
  variantlar: { A: string; B: string; C: string; D: string; E: string };
  dogruCavab: "A" | "B" | "C" | "D" | "E";
  izah: string;
  movzu: string;
  cetinlik: "asan" | "orta" | "cetin";
  fenn: string;
  nomre: number;
  uploadedAt: string;
}

type ViewMode = "study" | "exam" | "results";

function fmtTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m.toString().padStart(2, "0")}:${r.toString().padStart(2, "0")}`;
}

function cetinlikColor(c: string) {
  if (c === "asan") return "border-accent/40 text-accent";
  if (c === "orta") return "border-amber-500/40 text-amber-600 dark:text-amber-400";
  return "border-destructive/40 text-destructive";
}

export function ExamQuestionsView() {
  const { toast } = useToast();
  const [questions, setQuestions] = React.useState<StoredQuestion[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [mode, setMode] = React.useState<ViewMode>("study");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  // Exam state
  const [current, setCurrent] = React.useState(0);
  const [cavablar, setCavablar] = React.useState<Record<number, "A" | "B" | "C" | "D" | "E" | null>>({});
  const [flagged, setFlagged] = React.useState<Set<number>>(new Set());
  const [secondsLeft, setSecondsLeft] = React.useState(0);
  const [muddetDq] = React.useState(30);
  const [submitting, setSubmitting] = React.useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = React.useState(false);
  const [attemptId, setAttemptId] = React.useState<string | null>(null);
  const startedAtRef = React.useRef<number>(0);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  // Results
  const [result, setResult] = React.useState<{
    dogru: number;
    sehv: number;
    bos: number;
    bal: number;
    fennNetice: Record<string, { dogru: number; sehv: number; bos: number }>;
  } | null>(null);

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/exam-questions");
        const data = await res.json();
        setQuestions(data.questions || []);
      } catch {
        toast({ variant: "destructive", title: "Xəta", description: "Suallar yüklənə bilmədi." });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [toast]);

  // Timer
  React.useEffect(() => {
    if (mode !== "exam") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [mode]);

  async function startExam() {
    if (questions.length === 0) return;
    setCurrent(0);
    setCavablar({});
    setFlagged(new Set());
    setSecondsLeft(muddetDq * 60);
    startedAtRef.current = Date.now();
    setResult(null);
    setAttemptId(null);

    // ExamAttempt yarat
    try {
      const res = await fetch("/api/past-exam/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: useStore.getState().sessionId,
          suallar: questions.map((q) => ({
            sual: q.sual,
            variantlar: q.variantlar,
            dogruCavab: q.dogruCavab,
            izah: q.izah,
            fenn: q.fenn,
            movzu: q.movzu,
            cetinlik: q.cetinlik,
            nomre: q.nomre,
          })),
          müddet: muddetDq,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAttemptId(data.attemptId);
      }
    } catch {
      // DB-yə yazılmasa da imtahan davam edir (local nəticə)
    }

    setMode("exam");
  }

  function selectAnswer(letter: "A" | "B" | "C" | "D" | "E") {
    setCavablar((prev) => ({ ...prev, [current]: letter }));
  }

  function clearAnswer() {
    setCavablar((prev) => {
      const next = { ...prev };
      delete next[current];
      return next;
    });
  }

  function toggleFlag() {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(current)) next.delete(current);
      else next.add(current);
      return next;
    });
  }

  async function handleSubmit(auto = false) {
    if (submitting) return;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const müddetSan = Math.floor((Date.now() - startedAtRef.current) / 1000);

    // Hesabla
    let dogru = 0;
    let sehv = 0;
    let bos = 0;
    let bal = 0;
    const fennNetice: Record<string, { dogru: number; sehv: number; bos: number }> = {};

    questions.forEach((q, idx) => {
      const cavab = cavablar[idx];
      const fenn = q.fenn || "Ümumi";
      if (!fennNetice[fenn]) fennNetice[fenn] = { dogru: 0, sehv: 0, bos: 0 };

      if (!cavab) {
        bos++;
        fennNetice[fenn].bos++;
      } else if (cavab === q.dogruCavab) {
        dogru++;
        bal += 4;
        fennNetice[fenn].dogru++;
      } else {
        sehv++;
        bal -= 1;
        fennNetice[fenn].sehv++;
      }
    });

    // DB-yə yaz (əgər attemptId varsa)
    if (attemptId) {
      try {
        await fetch("/api/exam/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attemptId,
            cavablar,
            müddetSan,
          }),
        });
      } catch {
        // DB-yə yazılmasa belə nəticəni göstər
      }
    }

    const resultData = { dogru, sehv, bos, bal, fennNetice };
    setResult(resultData);
    setMode("results");

    // localStorage-a yaz (İşlədiyiniz Sınaqlar üçün)
    try {
      const completedExam = {
        id: `ce_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        tarix: new Date().toISOString(),
        sualSayi: questions.length,
        suallar: questions,
        cavablar,
        müddetDq: muddetDq,
        müddetSan,
        netice: resultData,
      };
      const raw = localStorage.getItem("completed-exams") || "[]";
      const list = JSON.parse(raw);
      list.unshift(completedExam);
      localStorage.setItem("completed-exams", JSON.stringify(list.slice(0, 50)));
    } catch {}

    if (auto) {
      toast({ variant: "destructive", title: "Vaxt bitdi!", description: "İmtahan avtomatik tamamlandı." });
    } else {
      toast({ title: "İmtahan tamamlandı", description: `${dogru} doğru · ${bal} bal` });
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Suallar yüklənir...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">İmtahana Düşən Suallar</p>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Oxunmamış Suallar</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
            <FileText className="size-10 opacity-40" />
            <p className="text-sm">Hələ heç sual yüklənməyib.</p>
            <p className="text-xs">Admin panelindən sual yükləndikdə burada görünəcək.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ==================== EXAM MODE ====================
  if (mode === "exam") {
    const q = questions[current];
    const answered = Object.keys(cavablar).length;
    const isFlagged = flagged.has(current);
    const minutes = Math.floor(secondsLeft / 60);
    const isLowTime = secondsLeft < 300;

    return (
      <div className="mx-auto max-w-3xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="font-stat text-sm font-bold text-primary">{current + 1}/{questions.length}</span>
            <span className="text-xs text-muted-foreground">{answered} cavablandırıldı</span>
          </div>
          <div className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-stat text-sm font-bold", isLowTime ? "bg-destructive/10 text-destructive" : "bg-muted text-foreground")}>
            <Timer className="size-3.5" />
            {fmtTime(secondsLeft)}
          </div>
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15 }}
          >
            <Card>
              <CardContent className="p-5">
                <div className="mb-3 flex flex-wrap items-center gap-1.5">
                  <Badge variant="secondary" className="text-[10px]">{q.fenn}</Badge>
                  {q.movzu && <Badge variant="outline" className="text-[10px]">{q.movzu}</Badge>}
                  <Badge variant="outline" className={cn("text-[10px]", cetinlikColor(q.cetinlik))}>
                    {q.cetinlik === "asan" ? "Asan" : q.cetinlik === "orta" ? "Orta" : "Çətin"}
                  </Badge>
                  <button onClick={toggleFlag} className={cn("ml-auto flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors", isFlagged ? "bg-amber-500/10 text-amber-500" : "text-muted-foreground hover:bg-muted")}>
                    <Flag className={cn("size-3", isFlagged && "fill-current")} />
                    {isFlagged ? "İşarələnib" : "İşarələ"}
                  </button>
                </div>
                {q.sualShekil ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={q.sualShekil} alt={`Sual ${q.nomre}`} className="mb-4 w-full rounded-lg border border-border" />
                ) : (
                  <Markdown content={q.sual} className="mb-4 text-sm font-medium leading-relaxed" />
                )}
                <div className={cn(q.sualShekil ? "flex flex-wrap gap-2" : "space-y-2")}>
                  {LETTERS.map((letter) => {
                    const val = q.variantlar[letter];
                    if (!val) return null;
                    const isSelected = cavablar[current] === letter;
                    if (q.sualShekil) {
                      return (
                        <button
                          key={letter}
                          type="button"
                          onClick={() => isSelected ? clearAnswer() : selectAnswer(letter)}
                          className={cn(
                            "flex size-11 items-center justify-center rounded-xl border text-sm font-bold transition-all",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground ring-1 ring-primary/20"
                              : "border-border text-muted-foreground hover:border-primary/30 hover:bg-muted/30"
                          )}
                        >
                          {letter}
                        </button>
                      );
                    }
                    return (
                      <button
                        key={letter}
                        type="button"
                        onClick={() => isSelected ? clearAnswer() : selectAnswer(letter)}
                        className={cn(
                          "flex w-full items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-sm transition-all",
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                            : "border-border hover:border-primary/30 hover:bg-muted/30"
                        )}
                      >
                        <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold", isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                          {letter}
                        </span>
                        <Markdown content={val} inline className={cn("flex-1 leading-relaxed", isSelected ? "font-medium" : "text-muted-foreground")} />
                        {isSelected && <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigator */}
        <div className="flex flex-wrap gap-1.5">
          {questions.map((_, idx) => {
            const isAnswered = cavablar[idx] !== undefined;
            const isCurrent = idx === current;
            const isF = flagged.has(idx);
            return (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg text-xs font-bold transition-all",
                  isCurrent ? "bg-primary text-primary-foreground ring-2 ring-primary/30" :
                  isAnswered ? "bg-accent/20 text-accent" :
                  isF ? "bg-amber-500/20 text-amber-500" :
                  "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Nav buttons */}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" disabled={current === 0} onClick={() => setCurrent((p) => p - 1)} className="gap-1">
            <ChevronLeft className="size-3" /> Geri
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={submitting}
            onClick={() => setShowSubmitDialog(true)}
            className="gap-1.5"
          >
            <Send className="size-3" />
            Təqdim Et ({answered}/{questions.length})
          </Button>
          <Button variant="outline" size="sm" disabled={current === questions.length - 1} onClick={() => setCurrent((p) => p + 1)} className="gap-1">
            İrəli <ChevronRight className="size-3" />
          </Button>
        </div>

        {/* Submit dialog */}
        <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>İmtahanı təqdim edirsən?</AlertDialogTitle>
              <AlertDialogDescription>
                {answered < questions.length
                  ? `${questions.length - answered} sual cavablanmayıb. Cavablanmayan suallar boş sayılacaq.`
                  : "Bütün suallar cavablandırılıb. Təqdim etmək istəyirsən?"}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Geri qayıt</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleSubmit(false)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Təqdim Et
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // ==================== RESULTS MODE ====================
  if (mode === "results" && result) {
    const totalSual = questions.length;
    const facePct = totalSual > 0 ? Math.round((result.dogru / totalSual) * 100) : 0;

    return (
      <div className="mx-auto max-w-3xl space-y-5">
        {/* Score header */}
        <Card className="overflow-hidden">
          <div className={cn("flex flex-col items-center gap-3 py-8 text-center", result.bal >= 100 ? "bg-gradient-to-b from-accent/10 to-transparent" : "")}>
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
              <Trophy className="size-8 text-primary" />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold">{result.bal} bal</h2>
            </div>
            <div className="flex gap-6 text-center">
              <div><div className="font-stat text-xl font-bold text-accent">{result.dogru}</div><div className="text-[10px] text-muted-foreground">Doğru</div></div>
              <div><div className="font-stat text-xl font-bold text-destructive">{result.sehv}</div><div className="text-[10px] text-muted-foreground">Səhv</div></div>
              <div><div className="font-stat text-xl font-bold text-muted-foreground">{result.bos}</div><div className="text-[10px] text-muted-foreground">Boş</div></div>
            </div>
            <div className="w-48">
              <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
                <span>Doğru faizi</span>
                <span>{facePct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${facePct}%` }} />
              </div>
            </div>
          </div>
        </Card>

        {/* Fenn neticeleri */}
        {Object.keys(result.fennNetice).length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Fənn üzrə nəticə</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(result.fennNetice).map(([fenn, n]) => {
                  const total = n.dogru + n.sehv + n.bos;
                  const pct = total > 0 ? Math.round((n.dogru / total) * 100) : 0;
                  return (
                    <div key={fenn} className="flex items-center gap-3">
                      <span className="w-24 truncate text-xs font-medium">{fenn}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-16 text-right text-xs">{n.dogru}/{total} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hər sual üzrə nəticə */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Sual üzrə nəticələr</CardTitle></CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-3 pr-4">
                {questions.map((q, idx) => {
                  const cavab = cavablar[idx];
                  const isDogru = cavab === q.dogruCavab;
                  const isBos = !cavab;
                  return (
                    <div key={q.id} className={cn("rounded-xl border p-4", isDogru ? "border-accent/40 bg-accent/5" : isBos ? "border-border" : "border-destructive/40 bg-destructive/5")}>
                      <div className="mb-2 flex flex-wrap items-center gap-1.5">
                        <span className="font-stat text-xs font-bold text-muted-foreground">#{q.nomre}</span>
                        <Badge variant="secondary" className="text-[10px]">{q.fenn}</Badge>
                        {isDogru ? (
                          <Badge variant="outline" className="border-accent/40 text-[10px] text-accent gap-1"><CheckCircle2 className="size-2.5" /> Doğru</Badge>
                        ) : isBos ? (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground gap-1"><AlertTriangle className="size-2.5" /> Boş</Badge>
                        ) : (
                          <Badge variant="outline" className="border-destructive/40 text-[10px] text-destructive gap-1"><XCircle className="size-2.5" /> Səhv</Badge>
                        )}
                      </div>
                      {q.sualShekil ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={q.sualShekil} alt={`Sual ${q.nomre}`} className="mb-2 w-full rounded-lg border border-border" />
                      ) : (
                        <Markdown content={q.sual} className="mb-2 text-sm font-medium leading-relaxed" />
                      )}
                      <div className={cn(q.sualShekil ? "flex flex-wrap gap-1.5" : "grid gap-1")}>
                        {LETTERS.map((letter) => {
                          const val = q.variantlar[letter];
                          if (!val) return null;
                          const isRight = letter === q.dogruCavab;
                          const isChosen = letter === cavab;
                          if (q.sualShekil) {
                            return (
                              <div key={letter} className={cn("flex size-8 items-center justify-center rounded-lg border text-xs font-bold", isRight ? "border-accent/40 bg-accent/10 text-accent" : isChosen && !isRight ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-border text-muted-foreground")}>
                                {letter}
                                {isRight && <CheckCircle2 className="ml-0.5 inline size-3" />}
                                {isChosen && !isRight && <XCircle className="ml-0.5 inline size-3" />}
                              </div>
                            );
                          }
                          return (
                            <div key={letter} className={cn("flex items-start gap-2 rounded-md border px-2.5 py-1.5 text-xs", isRight ? "border-accent/40 bg-accent/10" : isChosen && !isRight ? "border-destructive/40 bg-destructive/10" : "border-border")}>
                              <span className={cn("font-stat font-bold", isRight ? "text-accent" : isChosen && !isRight ? "text-destructive" : "text-muted-foreground")}>{letter}.</span>
                              <span className={cn("flex-1", isRight ? "font-medium text-accent" : isChosen && !isRight ? "text-destructive" : "text-muted-foreground")}>
                                <Markdown content={val} inline />
                                {isRight && <CheckCircle2 className="ml-1 inline size-3" />}
                                {isChosen && !isRight && <XCircle className="ml-1 inline size-3" />}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      {/* Göstər: sənin cavabın */}
                      {!isDogru && cavab && (
                        <div className="mt-2 text-[11px] text-muted-foreground">
                          Sənin cavabın: <span className="font-bold text-destructive">{cavab}</span> · Düzgün: <span className="font-bold text-accent">{q.dogruCavab}</span>
                        </div>
                      )}
                      {q.izah && (
                        <div className="mt-2 rounded-md border border-border bg-muted/30 p-2.5">
                          <div className="mb-1 flex items-center gap-1 text-[10px] font-medium text-foreground"><BookOpen className="size-2.5" /> İzah</div>
                          <Markdown content={q.izah} inline className="text-[11px] leading-relaxed text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="flex justify-center pb-8">
          <Button onClick={() => { setMode("study"); setResult(null); setAttemptId(null); }} className="gap-2" variant="outline">
            <RotateCcw className="size-4" /> Geri Qayıt
          </Button>
        </div>
      </div>
    );
  }

  // ==================== STUDY MODE ====================
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">İmtahana Düşən Suallar</p>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Keçmiş İmtahan Sualları</h1>
          <p className="mt-1 text-sm text-muted-foreground">{questions.length} sual · Cavablar göstərilir</p>
        </div>
        <Button onClick={startExam} className="gap-2">
          <Play className="size-4" /> İmtahan Vermək
        </Button>
      </div>

      <ScrollArea className="max-h-[calc(100vh-260px)]">
        <div className="space-y-3 pr-4">
          {questions.map((q, idx) => {
            const expanded = expandedId === q.id;
            return (
              <motion.div key={q.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03, duration: 0.2 }}>
                <Card className="overflow-hidden">
                  <button type="button" onClick={() => setExpandedId((prev) => (prev === q.id ? null : q.id))} className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted/30">
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-stat text-xs font-bold text-primary">{q.nomre}</span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-1.5">
                        <Badge variant="secondary" className="text-[10px]">{q.fenn}</Badge>
                        {q.movzu && <Badge variant="outline" className="text-[10px]">{q.movzu}</Badge>}
                        <Badge variant="outline" className={cn("text-[10px]", cetinlikColor(q.cetinlik))}>
                          {q.cetinlik === "asan" ? "Asan" : q.cetinlik === "orta" ? "Orta" : "Çətin"}
                        </Badge>
                      </div>
                      {q.sualShekil ? (
                        <p className="text-sm text-muted-foreground">Şəkil sualı — açmaq üçün klikləyin</p>
                      ) : (
                        <Markdown content={q.sual} inline className="text-sm font-medium leading-relaxed line-clamp-2" />
                      )}
                    </div>
                    <div className="shrink-0 pt-1">
                      {expanded ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
                    </div>
                  </button>
                  {expanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} transition={{ duration: 0.2 }} className="border-t border-border px-4 pb-4 pt-3">
                      {q.sualShekil ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={q.sualShekil} alt={`Sual ${q.nomre}`} className="mb-3 w-full rounded-lg border border-border" />
                      ) : (
                        <Markdown content={q.sual} className="mb-3 text-sm font-medium leading-relaxed" />
                      )}
                      <div className={cn(q.sualShekil ? "flex flex-wrap gap-1.5" : "space-y-1.5")}>
                        {LETTERS.map((letter) => {
                          const val = q.variantlar[letter];
                          if (!val) return null;
                          const isRight = letter === q.dogruCavab;
                          if (q.sualShekil) {
                            return (
                              <div key={letter} className={cn("flex size-9 items-center justify-center rounded-lg border text-sm font-bold", isRight ? "border-accent/40 bg-accent/10 text-accent" : "border-border text-muted-foreground")}>
                                {letter}
                                {isRight && <CheckCircle2 className="ml-0.5 inline size-3" />}
                              </div>
                            );
                          }
                          return (
                            <div key={letter} className={cn("flex items-start gap-2 rounded-lg border px-3 py-2 text-sm", isRight ? "border-accent/40 bg-accent/10" : "border-border")}>
                              <span className={cn("font-stat font-bold", isRight ? "text-accent" : "text-muted-foreground")}>{letter}.</span>
                              <Markdown content={val} inline className={cn("flex-1", isRight ? "font-medium text-accent" : "text-muted-foreground")} />
                              {isRight && <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" />}
                            </div>
                          );
                        })}
                      </div>
                      {q.izah && (
                        <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3">
                          <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-foreground"><BookOpen className="size-3" /> İzah</div>
                          <Markdown content={q.izah} inline className="text-xs leading-relaxed text-muted-foreground" />
                        </div>
                      )}
                    </motion.div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
