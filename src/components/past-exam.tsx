"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  UploadCloud,
  X,
  Loader2,
  Sparkles,
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Trophy,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowLeft,
  ListChecks,
  Timer,
  PartyPopper,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/markdown";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/lib/api";
import type { ExamQuestion, ExamSubmitResult } from "@/lib/api";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { compressImageFile, readFileAsDataURL, MAX_PDF_BYTES, PDF_TOO_BIG_MSG } from "@/lib/media";
import { cn } from "@/lib/utils";

const LETTERS: ("A" | "B" | "C" | "D" | "E")[] = ["A", "B", "C", "D", "E"];

type Phase = "upload" | "parsing" | "review" | "exam" | "results";

interface PendingFile {
  id: string;
  name: string;
  base64: string;
  mimeType: string;
  preview: string | null;
}

function fmtTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m.toString().padStart(2, "0")}:${r.toString().padStart(2, "0")}`;
}

function fileToBase64(file: File): Promise<{ base64: string; preview: string | null }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1] || "";
      resolve({ base64, preview: file.type.startsWith("image/") ? dataUrl : null });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function cetinlikBadge(c: string) {
  if (c === "asan")
    return <Badge variant="outline" className="border-accent/40 text-accent text-[10px]">Asan</Badge>;
  if (c === "orta")
    return <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-400 text-[10px]">Orta</Badge>;
  return <Badge variant="outline" className="border-destructive/40 text-destructive text-[10px]">Çətin</Badge>;
}

export function PastExam() {
  const { toast } = useToast();
  const sessionId = useStore((s) => s.sessionId) || "";
  const setAppView = useStore((s) => s.setAppView);

  const [phase, setPhase] = React.useState<Phase>("upload");
  const [files, setFiles] = React.useState<PendingFile[]>([]);
  const [suallar, setSuallar] = React.useState<ExamQuestion[]>([]);
  const [muddet, setMuddet] = React.useState<number>(30);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Exam state
  const [attemptId, setAttemptId] = React.useState<string>("");
  const [current, setCurrent] = React.useState(0);
  const [cavablar, setCavablar] = React.useState<Record<number, "A" | "B" | "C" | "D" | "E" | null>>({});
  const [flagged, setFlagged] = React.useState<Set<number>>(new Set());
  const [secondsLeft, setSecondsLeft] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<ExamSubmitResult | null>(null);
  const startedAtRef = React.useRef<number>(0);

  // Timer
  React.useEffect(() => {
    if (phase !== "exam") return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  async function handleFilesSelected(fileList: FileList | null) {
    if (!fileList?.length) return;
    const added: PendingFile[] = [];
    for (const file of Array.from(fileList)) {
      const isImage = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (isPdf && file.size > MAX_PDF_BYTES) {
        toast({ variant: "destructive", title: "Fayl yüklənmədi", description: PDF_TOO_BIG_MSG });
        continue;
      }
      try {
        if (isImage) {
          // Şəkil serverə göndərilməzdən əvvəl brauzerdə kiçildilir (böyük fotolar → ~1 MB).
          const dataUrl = await compressImageFile(file);
          added.push({
            id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
            name: file.name,
            base64: dataUrl.split(",")[1] || "",
            mimeType: dataUrl.slice(5, dataUrl.indexOf(";")) || file.type,
            preview: dataUrl,
          });
        } else {
          const { base64, preview } = await fileToBase64(file);
          added.push({
            id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
            name: file.name,
            base64,
            mimeType: file.type,
            preview,
          });
        }
      } catch {
        // silent — bir fayl oxuna bilməzsə digərlərini itirmə
      }
    }
    setFiles((prev) => [...prev, ...added]);
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  async function handleParse() {
    if (!sessionId || files.length === 0) return;
    setPhase("parsing");
    try {
      const r = await api.parsePastExam({
        sessionId,
        files: files.map((f) => ({ base64: f.base64, mimeType: f.mimeType })),
      });
      setSuallar(r.suallar);
      setMuddet(Math.max(10, Math.round(r.suallar.length * 1.5)));
      setPhase("review");
      toast({
        title: `${r.suallar.length} sual tapıldı`,
        description: "Suallara nəzər sal və vaxtı təyin et.",
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Suallar oxuna bilmədi",
        description: e instanceof Error ? e.message : "",
      });
      setPhase("upload");
    }
  }

  async function handleStartExam() {
    if (!sessionId || suallar.length === 0) return;
    try {
      const r = await api.startPastExam({ sessionId, suallar, müddet: muddet });
      setAttemptId(r.attemptId);
      setCavablar({});
      setFlagged(new Set());
      setCurrent(0);
      setSecondsLeft(r.müddet * 60);
      startedAtRef.current = Date.now();
      setPhase("exam");
      toast({ title: `${r.sualSayi} sual · ${r.müddet} dəqiqə`, description: "Uğurlar!" });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "İmtahan başladıla bilmədi",
        description: e instanceof Error ? e.message : "",
      });
    }
  }

  async function handleSubmit(auto = false) {
    if (!attemptId) return;
    setSubmitting(true);
    const müddetSan = Math.floor((Date.now() - startedAtRef.current) / 1000);
    try {
      const r = await api.submitExam({ attemptId, cavablar, müddetSan });
      setResult(r);
      setPhase("results");
      toast({ title: "İmtahan tamamlandı", description: `${r.dogruCavab} doğru · ${r.bal} bal` });
      if (auto) {
        toast({ variant: "destructive", title: "Vaxt bitdi", description: "İmtahan avtomatik tamamlandı" });
      }
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Təqdim edilə bilmədi",
        description: e instanceof Error ? e.message : "",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function handleSelectAnswer(letter: "A" | "B" | "C" | "D" | "E") {
    setCavablar((prev) => ({ ...prev, [current]: letter }));
  }

  function handleClearAnswer() {
    setCavablar((prev) => {
      const next = { ...prev };
      delete next[current];
      return next;
    });
  }

  function handleToggleFlag() {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(current)) next.delete(current);
      else next.add(current);
      return next;
    });
  }

  function handleRestart() {
    setPhase("upload");
    setFiles([]);
    setSuallar([]);
    setAttemptId("");
    setCurrent(0);
    setCavablar({});
    setFlagged(new Set());
    setResult(null);
    setSecondsLeft(0);
  }

  const answeredCount = Object.keys(cavablar).length;

  // === UPLOAD PHASE ===
  if (phase === "upload") {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Real Sənəd
          </p>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            İmtahana Düşən Suallar
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Müəllimindən aldığın imtahan vərəqinin şəklini (və ya PDF-ini) yüklə —
            AI sualları oxuyub vaxt məhdudiyyətli imtahana çevirəcək.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UploadCloud className="size-4 text-primary" />
              Sənəd yüklə
            </CardTitle>
            <CardDescription>
              Bir və ya bir neçə şəkil (hər səhifə üçün 1 şəkil) və ya PDF seç.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <UploadCloud className="size-8 text-muted-foreground" />
              <p className="text-sm font-medium">Fayl seçmək üçün klikləyin</p>
              <p className="text-xs text-muted-foreground">JPG, PNG və ya PDF</p>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,application/pdf"
              multiple
              className="hidden"
              onChange={(e) => {
                handleFilesSelected(e.target.files);
                e.target.value = "";
              }}
            />

            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card p-2.5"
                  >
                    {f.preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={f.preview} alt={f.name} className="size-10 shrink-0 rounded-md object-cover" />
                    ) : (
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
                        <FileText className="size-5 text-muted-foreground" />
                      </div>
                    )}
                    <span className="flex-1 truncate text-xs font-medium">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(f.id)}
                      className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <Button
              size="lg"
              className="w-full gap-2"
              disabled={files.length === 0}
              onClick={handleParse}
            >
              <Sparkles className="size-4" />
              Sualları Oxu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // === PARSING PHASE ===
  if (phase === "parsing") {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-5 text-center">
        <div className="relative">
          <Loader2 className="size-16 animate-spin text-primary" />
          <FileText className="absolute -right-2 -top-2 size-7 text-accent" />
        </div>
        <div>
          <p className="font-heading text-xl font-bold">AI sənədi oxuyur...</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {files.length} fayl analiz olunur
          </p>
        </div>
        <p className="text-xs text-muted-foreground">Bu 20-40 saniyə çəkə bilər</p>
      </div>
    );
  }

  // === REVIEW PHASE ===
  if (phase === "review") {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <button
          onClick={() => setPhase("upload")}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-3.5" />
          Geri
        </button>

        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            {suallar.length} sual tapıldı
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Suallara nəzər sal, vaxtı təyin et və imtahana başla.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vaxt</CardTitle>
            <CardDescription>Bu imtahan üçün neçə dəqiqə vaxt verilsin?</CardDescription>
          </CardHeader>
          <CardContent>
            <Label htmlFor="past-exam-muddet" className="mb-1.5 block">Müddət (dəqiqə)</Label>
            <Input
              id="past-exam-muddet"
              type="number"
              min={1}
              value={muddet}
              onChange={(e) => setMuddet(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full"
            />
          </CardContent>
        </Card>

        <Card>
          <Accordion type="single" collapsible>
            <AccordionItem value="preview" className="border-b-0 px-4">
              <AccordionTrigger className="hover:no-underline">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <ListChecks className="size-4 text-primary" />
                  Sualları önizlə
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-2.5 pt-2">
                {suallar.map((q, i) => (
                  <div key={i} className="rounded-lg border border-border bg-card p-3">
                    <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="font-stat text-xs font-bold text-muted-foreground">{i + 1}.</span>
                      <Badge variant="secondary" className="text-[10px]">{q.fenn}</Badge>
                      {cetinlikBadge(q.cetinlik)}
                    </div>
                    <Markdown content={q.sual} className="text-sm leading-relaxed" />
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>

        <Button size="lg" className="w-full gap-2" onClick={handleStartExam}>
          <FileText className="size-5" />
          İmtahana Başla
        </Button>
      </div>
    );
  }

  // === EXAM PHASE ===
  if (phase === "exam" && suallar.length > 0) {
    const q = suallar[current];
    const lowTime = secondsLeft <= 60;
    const answered = answeredCount;
    const flagCount = flagged.size;
    const userAnswer = cavablar[current];

    return (
      <div className="mx-auto w-full max-w-4xl space-y-3">
        <div className="sticky top-0 z-30 -mx-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-lg sm:-mx-6 sm:px-6">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1">
                <ListChecks className="size-3" />
                Sual {current + 1} / {suallar.length}
              </Badge>
              <motion.div
                animate={lowTime ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                transition={lowTime ? { duration: 1, repeat: Infinity } : { duration: 0 }}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-stat text-base font-bold tabular-nums",
                  lowTime ? "bg-destructive/10 text-destructive" : "bg-primary/5 text-primary"
                )}
              >
                <Clock className="size-4" />
                {fmtTime(secondsLeft)}
              </motion.div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={handleToggleFlag}>
                <Flag className={cn("size-3.5", flagged.has(current) ? "fill-amber-400 text-amber-500" : "text-muted-foreground")} />
                {flagged.has(current) ? "İşarələnib" : "İşarələ"}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive" className="gap-1.5">
                    <Timer className="size-3.5" />
                    Bitir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>İmtahanı bitirək?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {answered} / {suallar.length} sual cavablandırılıb. Bal dərhal hesablanacaq.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Ləğv et</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleSubmit(false)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Bəli, bitir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="p-3">
            <div className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Sual naviqatoru</span>
              <span className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-primary" /> cavablanıb ({answered})
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-amber-400" /> işarə ({flagCount})
                </span>
              </span>
            </div>
            <ScrollArea className="max-h-32">
              <div className="grid grid-cols-8 gap-1.5 pr-2 sm:grid-cols-10 md:grid-cols-12">
                {suallar.map((_, i) => {
                  const isAnswered = cavablar[i] !== undefined;
                  const isFlagged = flagged.has(i);
                  const isCurrent = i === current;
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrent(i)}
                      className={cn(
                        "relative aspect-square rounded-md border font-stat text-xs font-semibold transition-all",
                        isCurrent && "ring-2 ring-primary ring-offset-1 ring-offset-background",
                        isAnswered
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-muted-foreground hover:border-primary/40"
                      )}
                    >
                      {i + 1}
                      {isFlagged && (
                        <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-amber-400 ring-1 ring-background" />
                      )}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <Card>
              <CardContent className="p-5 sm:p-6">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">{q.fenn}</Badge>
                  {q.movzu && <Badge variant="outline" className="text-[10px]">{q.movzu}</Badge>}
                  {cetinlikBadge(q.cetinlik)}
                </div>
                <Markdown content={q.sual} className="text-base font-medium leading-relaxed text-balance" />
              </CardContent>
            </Card>

            <div className="grid gap-2">
              {LETTERS.map((letter) => {
                const val = q.variantlar[letter];
                if (!val) return null;
                const isSelected = userAnswer === letter;
                return (
                  <button
                    key={letter}
                    onClick={() => handleSelectAnswer(letter)}
                    className={cn(
                      "group flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-all sm:p-4",
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border bg-card hover:border-primary/40 hover:bg-accent/5 cursor-pointer"
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-lg border font-stat text-sm font-semibold transition-colors",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground group-hover:text-foreground"
                      )}
                    >
                      {letter}
                    </span>
                    <Markdown content={val} inline className="flex-1 text-sm leading-relaxed pt-0.5" />
                    {isSelected && <CheckCircle2 className="size-5 shrink-0 text-primary" />}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                disabled={current === 0}
                className="gap-1.5"
              >
                <ChevronLeft className="size-4" />
                Əvvəlki
              </Button>

              {userAnswer && (
                <Button variant="ghost" size="sm" onClick={handleClearAnswer} className="text-xs text-muted-foreground">
                  Cavabı sil
                </Button>
              )}

              {current + 1 < suallar.length ? (
                <Button onClick={() => setCurrent((c) => c + 1)} className="gap-1.5">
                  Növbəti
                  <ChevronRight className="size-4" />
                </Button>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="gap-1.5">
                      <CheckCircle2 className="size-4" />
                      Bitir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>İmtahanı bitirək?</AlertDialogTitle>
                      <AlertDialogDescription>
                        {answered} / {suallar.length} sual cavablandırılıb. Bal dərhal hesablanacaq.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Ləğv et</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleSubmit(false)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Bəli, bitir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {submitting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 text-center">
              <Loader2 className="size-12 animate-spin text-primary" />
              <p className="font-heading text-lg font-semibold">Nəticə hesablanır...</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // === RESULTS PHASE ===
  if (phase === "results" && result) {
    const pct = Math.round((result.dogruCavab / Math.max(1, result.sualSayi)) * 100);
    const müddetDəq = Math.floor(result.müddetSan / 60);
    const good = pct >= 60;

    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className={cn(
              "mx-auto mb-4 flex size-24 items-center justify-center rounded-3xl",
              good ? "bg-accent/15 text-accent" : "bg-destructive/15 text-destructive"
            )}
          >
            {good ? <PartyPopper className="size-12" /> : <AlertTriangle className="size-12" />}
          </motion.div>
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            İmtahan tamamlandı!
          </h1>
        </motion.div>

        <Card className={cn("overflow-hidden", good ? "border-accent/30" : "border-destructive/30")}>
          <CardContent className="p-6 text-center">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Toplam bal</p>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={cn("font-stat text-6xl font-bold tabular-nums sm:text-7xl", good ? "text-accent" : "text-destructive")}
            >
              {result.bal}
            </motion.div>
            <p className="mt-1 text-sm text-muted-foreground">{pct}% dəqiqlik</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCell icon={<CheckCircle2 className="size-4" />} value={result.dogruCavab} label="Doğru" color="text-accent" />
          <StatCell icon={<XCircle className="size-4" />} value={result.sehvCavab} label="Səhv" color="text-destructive" />
          <StatCell icon={<Flag className="size-4" />} value={result.bosCavab} label="Boş" color="text-muted-foreground" />
          <StatCell icon={<Clock className="size-4" />} value={müddetDəq} suffix=" dəq" label="Sərf olunan vaxt" color="text-primary" />
        </div>

        {result.fennNetice && Object.keys(result.fennNetice).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fənn bölgüsü</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(result.fennNetice).map(([fenn, n]) => {
                const total = n.dogru + n.sehv + n.bos;
                const dogruPct = total > 0 ? (n.dogru / total) * 100 : 0;
                const sehvPct = total > 0 ? (n.sehv / total) * 100 : 0;
                return (
                  <div key={fenn}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium">{fenn}</span>
                      <span className="font-stat text-muted-foreground">{n.dogru} / {total}</span>
                    </div>
                    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${dogruPct}%` }} transition={{ duration: 0.5 }} className="h-full bg-accent" />
                      <motion.div initial={{ width: 0 }} animate={{ width: `${sehvPct}%` }} transition={{ duration: 0.5, delay: 0.1 }} className="h-full bg-destructive/60" />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        <Card>
          <Accordion type="single" collapsible>
            <AccordionItem value="detail" className="border-b-0 px-4">
              <AccordionTrigger className="hover:no-underline">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <ListChecks className="size-4 text-primary" />
                  Nəticələri Detallı Bax
                  <Badge variant="secondary" className="text-[10px]">{suallar.length} sual</Badge>
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                {suallar.map((q, i) => {
                  const userAns = cavablar[i];
                  const isCorrect = userAns === q.dogruCavab;
                  const isEmpty = !userAns;
                  return (
                    <div
                      key={i}
                      className={cn(
                        "rounded-xl border p-4",
                        isCorrect ? "border-accent/30 bg-accent/5" : isEmpty ? "border-border bg-muted/20" : "border-destructive/30 bg-destructive/5"
                      )}
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-1.5">
                        <span className="font-stat text-xs font-bold text-muted-foreground">{i + 1}.</span>
                        <Badge variant="secondary" className="text-[10px]">{q.fenn}</Badge>
                        {isCorrect && <Badge variant="outline" className="border-accent/40 text-accent text-[10px] gap-0.5"><CheckCircle2 className="size-2.5" /> Doğru</Badge>}
                        {isEmpty && <Badge variant="outline" className="text-muted-foreground text-[10px] gap-0.5"><Flag className="size-2.5" /> Boş</Badge>}
                        {!isCorrect && !isEmpty && <Badge variant="outline" className="border-destructive/40 text-destructive text-[10px] gap-0.5"><XCircle className="size-2.5" /> Səhv</Badge>}
                      </div>
                      <Markdown content={q.sual} className="mb-2 text-sm font-medium leading-relaxed" />
                      <div className="space-y-1">
                        {LETTERS.map((letter) => {
                          const val = q.variantlar[letter];
                          if (!val) return null;
                          const isRight = letter === q.dogruCavab;
                          const isUserWrong = letter === userAns && !isCorrect;
                          return (
                            <div
                              key={letter}
                              className={cn(
                                "flex items-start gap-2 rounded-md border px-2 py-1 text-xs",
                                isRight && "border-accent/40 bg-accent/10",
                                isUserWrong && "border-destructive/40 bg-destructive/10",
                                !isRight && !isUserWrong && "border-border"
                              )}
                            >
                              <span className={cn("font-stat font-bold", isRight && "text-accent", isUserWrong && "text-destructive", !isRight && !isUserWrong && "text-muted-foreground")}>
                                {letter}.
                              </span>
                              <Markdown
                                content={val}
                                inline
                                className={cn("flex-1", isUserWrong && "text-destructive line-through decoration-destructive/50", !isRight && !isUserWrong && "text-muted-foreground")}
                              />
                            </div>
                          );
                        })}
                      </div>
                      {q.izah && (
                        <div className="mt-2 rounded-md border border-border bg-muted/30 p-2">
                          <div className="text-[11px] text-muted-foreground">
                            <span className="font-medium text-foreground">İzah: </span>
                            <Markdown content={q.izah} inline />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button variant="outline" size="lg" onClick={() => setAppView("dashboard")}>
            <ArrowLeft className="size-4" />
            Panelə Qayıt
          </Button>
          <Button size="lg" onClick={handleRestart}>
            <RotateCcw className="size-4" />
            Yeni Sənəd Yüklə
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

function StatCell({
  icon,
  value,
  suffix,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: number;
  suffix?: string;
  label: string;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <div className={cn("mx-auto mb-1 flex size-7 items-center justify-center rounded-lg bg-muted", color)}>
          {icon}
        </div>
        <div className={cn("font-stat text-2xl font-bold tabular-nums", color)}>
          {value}
          {suffix}
        </div>
        <div className="text-[11px] text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}
