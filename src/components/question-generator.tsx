"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Trophy,
  Target,
  ArrowLeft,
  Wand2,
  StopCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { api, ALL_FENLER, QRUP_FENLERI } from "@/lib/api";
import { useStore } from "@/lib/store";
import type { GeneratedQuestion } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { Markdown } from "@/components/markdown";
import { GeometryFigure } from "@/components/geometry-figure";
import { cn, azDateShort } from "@/lib/utils";
import { History, ChevronRight as ChevronRightIcon } from "lucide-react";

type Herf = "A" | "B" | "C" | "D" | "E";
const LETTERS: Herf[] = ["A", "B", "C", "D", "E"];
const SAY_OPTIONS = [5, 10, 15, 20];
const MAGISTR_FENLER = QRUP_FENLERI.magistr;

type Rejim = "abituriyent" | "magistr";

type CetinlikFilter = "asan" | "orta" | "cetin" | "qarisix";

const CETINLIK_OPTIONS: { value: CetinlikFilter; label: string; suffix: string }[] = [
  { value: "asan", label: "Asan", suffix: "asan səviyyədə" },
  { value: "orta", label: "Orta", suffix: "orta çətinlikdə" },
  { value: "cetin", label: "Çətin", suffix: "çətin səviyyədə" },
  { value: "qarisix", label: "Qarışıq", suffix: "qarışıq çətinlikdə" },
];

// localStorage-da son dəstlər — həm generasiya ayarlarını (yenidən yaratmaq üçün), həm də
// faktiki sualları/cavabları (əvvəlki nəticələrə birbaşa qayıtmaq üçün) saxlayır.
interface SonDest {
  id: string;
  fenn: string;
  say: number;
  movzu?: string;
  cetinlik: CetinlikFilter;
  tarix: string;
  rejim?: Rejim;
  questions?: GeneratedQuestion[];
  answers?: (Herf | null)[];
}
const SON_DEST_KEY = "ai-tqdk-son-destler";
function loadSonDestler(): SonDest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SON_DEST_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.slice(0, 3);
  } catch {
    return [];
  }
}
function saveSonDest(d: SonDest) {
  if (typeof window === "undefined") return;
  try {
    const existing = loadSonDestler();
    const next = [d, ...existing.filter((x) => x.id !== d.id)].slice(0, 3);
    window.localStorage.setItem(SON_DEST_KEY, JSON.stringify(next));
  } catch {
    // silent
  }
}
// Cavab seçildikcə eyni dəstin localStorage-dakı qeydini yeniləyir ki, istifadəçi çıxıb
// qayıtsa da "Son dəstlər"dən həmin nəticələrə dəqiq baxa bilsin.
function persistDestAnswers(id: string | null, newAnswers: (Herf | null)[]) {
  if (!id || typeof window === "undefined") return;
  try {
    const existing = loadSonDestler();
    const next = existing.map((d) => (d.id === id ? { ...d, answers: newAnswers } : d));
    window.localStorage.setItem(SON_DEST_KEY, JSON.stringify(next));
  } catch {
    // silent
  }
}

type Phase = "setup" | "loading" | "playing" | "results" | "review";

export function QuestionGenerator() {
  const { toast } = useToast();
  const sessionId = useStore((s) => s.sessionId) || "";
  const setAppView = useStore((s) => s.setAppView);
  const student = useStore((s) => s.student);
  const prefillFenn = useStore((s) => s.generatorPrefillFenn);
  const prefillMovzu = useStore((s) => s.generatorPrefillMovzu);
  const setGeneratorPrefillMovzu = useStore((s) => s.setGeneratorPrefillMovzu);

  const [phase, setPhase] = React.useState<Phase>("setup");
  const [rejim, setRejim] = React.useState<Rejim>(student?.qrup === "magistr" ? "magistr" : "abituriyent");
  const [fenn, setFenn] = React.useState<string>(prefillFenn || "");
  const [say, setSay] = React.useState<number>(5);
  const [movzu, setMovzu] = React.useState<string>(prefillMovzu || "");
  const [cetinlik, setCetinlik] = React.useState<CetinlikFilter>("qarisix");
  const [sonDestler, setSonDestler] = React.useState<SonDest[]>([]);
  const [questions, setQuestions] = React.useState<GeneratedQuestion[]>([]);
  const [current, setCurrent] = React.useState(0);
  // Sual üzrə cavab tarixçəsi — geri qayıdıb əvvəlki sualları baxmaq üçün, indeks = sual sırası.
  const [answers, setAnswers] = React.useState<(Herf | null)[]>([]);
  // Hazırkı dəstin "Son dəstlər" localStorage qeydi — cavab verildikcə həmin qeydi yeniləmək üçün.
  const [currentDestId, setCurrentDestId] = React.useState<string | null>(null);
  const [savedBookmarks, setSavedBookmarks] = React.useState<boolean[]>([]);

  const selected = answers[current] ?? null;
  const revealed = selected !== null;
  const savedBookmark = savedBookmarks[current] ?? false;
  const correctCount = answers.reduce(
    (n, a, i) => (a && questions[i] && a === questions[i].dogruCavab ? n + 1 : n),
    0
  );
  const wrongCount = answers.reduce(
    (n, a, i) => (a && questions[i] && a !== questions[i].dogruCavab ? n + 1 : n),
    0
  );
  const answeredCount = answers.filter((a) => a !== null).length;

  // Prefill-ləri tətbiq et və təmizlə
  React.useEffect(() => {
    if (prefillFenn && phase === "setup") {
      setFenn(prefillFenn);
    }
    if (prefillMovzu && phase === "setup") {
      setMovzu(prefillMovzu);
    }
  }, [prefillFenn, prefillMovzu, phase]);

  // Movzu prefill-i yalnız bir dəfə istifadə olunsun
  React.useEffect(() => {
    if (prefillMovzu) {
      setGeneratorPrefillMovzu(null);
    }
  }, [prefillMovzu, setGeneratorPrefillMovzu]);

  // Son dəstləri yüklə (client-side)
  React.useEffect(() => {
    setSonDestler(loadSonDestler());
  }, [phase]);

  async function handleGenerate() {
    if (!fenn) {
      toast({ variant: "destructive", title: "Fənn seçin" });
      return;
    }
    setPhase("loading");
    try {
      // Çətinlik suffix-i movzuya əlavə et (AI prompt üçün nümayiş)
      const cetinlikSuffix = CETINLIK_OPTIONS.find((c) => c.value === cetinlik)?.suffix || "";
      const finalMovzu = movzu.trim()
        ? `${movzu.trim()} (${cetinlikSuffix})`
        : cetinlik !== "qarisix"
          ? `Ümumi mövzu, ${cetinlikSuffix}`
          : undefined;
      const { suallar } = await api.generateQuestions({
        sessionId,
        fenn,
        say,
        movzu: finalMovzu,
        qrup: rejim === "magistr" ? "magistr" : undefined,
      });
      if (!suallar?.length) {
        toast({
          variant: "destructive",
          title: "Suallar yaradıla bilmədi",
          description: "AI cavab qaytarmadı. Yenidən cəhd edin.",
        });
        setPhase("setup");
        return;
      }
      setQuestions(suallar);
      setCurrent(0);
      setAnswers(new Array(suallar.length).fill(null));
      setSavedBookmarks(new Array(suallar.length).fill(false));
      // Son dəstlərə əlavə et — sualları/cavabları da saxlayır ki, sonra "Son dəstlər"dən
      // birbaşa əvvəlki nəticələrə baxıla bilsin.
      const sonDest: SonDest = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        fenn,
        say,
        movzu: movzu.trim() || undefined,
        cetinlik,
        tarix: new Date().toISOString(),
        rejim,
        questions: suallar,
        answers: new Array(suallar.length).fill(null),
      };
      saveSonDest(sonDest);
      setSonDestler(loadSonDestler());
      setCurrentDestId(sonDest.id);
      setPhase("playing");
      toast({
        title: `${suallar.length} sual hazırdır ✓`,
        description: `${fenn}${movzu ? " · " + movzu : ""}`,
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Xəta baş verdi",
        description: e instanceof Error ? e.message : "",
      });
      setPhase("setup");
    }
  }

  async function handleSelect(letter: Herf) {
    if (revealed) return;
    const idx = current;
    const q = questions[idx];
    const correct = letter === q.dogruCavab;
    setAnswers((prev) => {
      const next = [...prev];
      next[idx] = letter;
      persistDestAnswers(currentDestId, next);
      return next;
    });
    if (!correct) {
      // Səhv cavabı bookmark kimi saxla (fire-and-forget)
      api
        .addBookmark({
          sessionId,
          fenn,
          sual: q.sual,
          variantlar: q.variantlar,
          dogruCavab: q.dogruCavab,
          izah: q.izah,
          movzu: q.movzu || undefined,
          sehvCavab: letter,
        })
        .then(() =>
          setSavedBookmarks((prev) => {
            const next = [...prev];
            next[idx] = true;
            return next;
          })
        )
        .catch(() => undefined);
    }
    // Save progress — radar/statistika RƏSMİ fənn adı üzrə aparılır, mövzu adı ilə yox
    api
      .recordProgress({ sessionId, fenn, dogru: correct, say: 1 })
      .catch(() => undefined);
  }

  function finishTest() {
    setPhase("results");
    const total = answeredCount || 1;
    const pct = Math.round((correctCount / total) * 100);
    toast({
      title: "Test tamamlandı! 🎉",
      description: `${correctCount}/${answeredCount} doğru · ${pct}%`,
    });
  }

  function handleNext() {
    if (current + 1 >= questions.length) {
      finishTest();
      return;
    }
    setCurrent((c) => c + 1);
  }

  function handleBack() {
    setCurrent((c) => Math.max(0, c - 1));
  }

  function changeRejim(r: Rejim) {
    if (r === rejim) return;
    setRejim(r);
    setFenn("");
  }

  function handleRestart() {
    setPhase("setup");
    setQuestions([]);
    setCurrent(0);
    setAnswers([]);
    setSavedBookmarks([]);
    setCurrentDestId(null);
  }

  // "Son dəstlər" siyahısındakı bir qeydin ayarlarını (fənn/say/çətinlik/mövzu) formaya doldurur
  // — yeni sual dəsti yaratmaq üçün (əvvəlki sualları DƏYİŞMİR).
  function prefillFromDest(d: SonDest) {
    setRejim(d.rejim || "abituriyent");
    setFenn(d.fenn);
    setSay(d.say);
    setCetinlik(d.cetinlik);
    setMovzu(d.movzu || "");
  }

  // "Son dəstlər" qeydinə klikləyəndə — saxlanılmış suallar/cavablar varsa birbaşa baxış
  // rejiminə keçir, yoxdursa (köhnə format qeyd) ayarları doldurmaqla kifayətlənir.
  function openDestResults(d: SonDest) {
    if (!d.questions?.length) {
      prefillFromDest(d);
      toast({
        title: "Bu dəst üçün saxlanılmış nəticə yoxdur",
        description: "Ayarlar dolduruldu — yenidən yarada bilərsən.",
      });
      return;
    }
    setRejim(d.rejim || "abituriyent");
    setFenn(d.fenn);
    setQuestions(d.questions);
    setAnswers(
      d.answers && d.answers.length === d.questions.length
        ? d.answers
        : new Array(d.questions.length).fill(null)
    );
    setSavedBookmarks(new Array(d.questions.length).fill(false));
    setCurrentDestId(d.id);
    setCurrent(0);
    setPhase("review");
  }

  // === SETUP ===
  if (phase === "setup") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Alət</p>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Sual Generatoru</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Süni intellekt istənilən mövzuda A/B/C/D/E formatında suallar yaradır.
          </p>
        </div>

        <div>
          <Label className="mb-2 block">Rejim</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => changeRejim("abituriyent")}
              className={cn(
                "rounded-lg border px-3 py-2.5 text-center text-sm font-medium transition-all",
                rejim === "abituriyent"
                  ? "border-primary bg-primary text-primary-foreground ring-2 ring-primary/20 shadow-sm"
                  : "border-border hover:border-primary/40 hover:bg-muted/40"
              )}
            >
              Abituriyent
            </button>
            <button
              onClick={() => changeRejim("magistr")}
              className={cn(
                "rounded-lg border px-3 py-2.5 text-center text-sm font-medium transition-all",
                rejim === "magistr"
                  ? "border-primary bg-primary text-primary-foreground ring-2 ring-primary/20 shadow-sm"
                  : "border-border hover:border-primary/40 hover:bg-muted/40"
              )}
            >
              Magistr
            </button>
          </div>
        </div>

        <Card>
          <CardContent className="space-y-5 p-6">
            <div>
              <Label className="mb-2 block">Fənn</Label>
              <Select value={fenn} onValueChange={setFenn}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Fənn seçin" />
                </SelectTrigger>
                <SelectContent>
                  {(rejim === "magistr" ? MAGISTR_FENLER : ALL_FENLER).map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                  {rejim === "abituriyent" && (
                    <SelectItem value="Təsadüfi">🎲 Təsadüfi (qarışıq)</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">Sual sayı</Label>
              <div className="grid grid-cols-4 gap-2">
                {SAY_OPTIONS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setSay(n)}
                    className={cn(
                      "rounded-lg border p-3 text-center transition-all",
                      say === n
                        ? "border-primary bg-primary text-primary-foreground ring-2 ring-primary/20 shadow-sm"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    <div className={cn("font-stat text-lg font-bold", say === n ? "text-primary-foreground" : "text-foreground")}>
                      {n}
                    </div>
                    <div className={cn("text-[10px]", say === n ? "text-primary-foreground/80" : "text-muted-foreground")}>
                      sual
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Çətinlik</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {CETINLIK_OPTIONS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setCetinlik(c.value)}
                    className={cn(
                      "rounded-lg border px-3 py-2.5 text-center text-sm font-medium transition-all",
                      cetinlik === c.value
                        ? "border-primary bg-primary text-primary-foreground ring-2 ring-primary/20 shadow-sm"
                        : "border-border hover:border-primary/40 hover:bg-muted/40"
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                <Badge variant="outline" className="border-primary/30 text-primary text-[9px] gap-0.5">A/B/C/D/E</Badge>
                Format: çoxseçiməli
              </p>
            </div>

            <div>
              <Label htmlFor="movzu" className="mb-2 block">
                Mövzu <span className="text-muted-foreground">(istəyə bağlı)</span>
              </Label>
              <Input
                id="movzu"
                placeholder="Məs: Kvadrat tənliklər, Tarixdə orta əsrlər..."
                value={movzu}
                onChange={(e) => setMovzu(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Mövzu təyin etsən, AI daha spesifik suallar yaradacaq.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Son dəstlər (localStorage) */}
        {sonDestler.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <History className="size-4 text-muted-foreground" />
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Son dəstlər
                </p>
              </div>
              <div className="space-y-1.5">
                {sonDestler.map((d) => {
                  const hasResults = !!d.questions?.length;
                  const answeredInDest = d.answers?.filter((a) => a !== null).length ?? 0;
                  const correctInDest =
                    d.answers?.reduce(
                      (n, a, i) => (a && d.questions?.[i] && a === d.questions[i].dogruCavab ? n + 1 : n),
                      0
                    ) ?? 0;
                  return (
                    <div
                      key={d.id}
                      className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-card p-2.5 transition-all hover:border-primary/40 hover:bg-accent/5"
                    >
                      <button
                        onClick={() => openDestResults(d)}
                        title={hasResults ? "Nəticələrə bax" : "Ayarları doldur"}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      >
                        <Badge variant="secondary" className="text-[10px] shrink-0">{d.fenn}</Badge>
                        <span className="truncate text-xs text-muted-foreground">
                          {d.movzu || "Ümumi"}
                        </span>
                        {hasResults && answeredInDest > 0 && (
                          <Badge variant="outline" className="shrink-0 gap-0.5 text-[9px]">
                            {correctInDest}/{answeredInDest} ✓
                          </Badge>
                        )}
                      </button>
                      <div className="flex shrink-0 items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="font-stat font-semibold">{d.say} sual</span>
                        <span>·</span>
                        <span>{azDateShort(new Date(d.tarix))}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            prefillFromDest(d);
                          }}
                          title="Bu ayarlarla yenidən yarat"
                          className="rounded-md p-1 hover:bg-accent/10 hover:text-primary"
                        >
                          <RotateCcw className="size-3" />
                        </button>
                        <ChevronRightIcon className="size-3" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end">
          <Button size="lg" onClick={handleGenerate} disabled={!fenn} className="h-12 px-6">
            <Wand2 className="size-4" />
            Sual Yarat
          </Button>
        </div>
      </div>
    );
  }

  // === LOADING ===
  if (phase === "loading") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="relative">
          <Loader2 className="size-14 animate-spin text-primary" />
          <Sparkles className="absolute -right-2 -top-2 size-6 text-accent" />
        </div>
        <div>
          <p className="font-heading text-lg font-semibold">AI sualları hazırlayır...</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {fenn} · {say} sual{movzu ? ` · ${movzu}` : ""}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">Bu 10-20 saniyə çəkə bilər</p>
      </div>
    );
  }

  // === RESULTS ===
  if (phase === "results") {
    const pct = Math.round((correctCount / (answeredCount || 1)) * 100);
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-2xl bg-accent/15 text-accent">
            <Trophy className="size-10" />
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Test tamamlandı!</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {fenn} ·{" "}
            {answeredCount < questions.length
              ? `${answeredCount}/${questions.length} sual cavablandırıldı`
              : `${questions.length} sual`}
          </p>
        </motion.div>

        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="font-stat text-3xl font-bold text-accent">{correctCount}</div>
                <div className="text-xs text-muted-foreground">Doğru</div>
              </div>
              <div className="text-center">
                <div className="font-stat text-3xl font-bold text-destructive">{wrongCount}</div>
                <div className="text-xs text-muted-foreground">Səhv</div>
              </div>
              <div className="text-center">
                <div className="font-stat text-3xl font-bold text-primary">{pct}%</div>
                <div className="text-xs text-muted-foreground">Dəqiqlik</div>
              </div>
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6 }}
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
              />
            </div>
            {pct >= 80 && (
              <p className="mt-3 text-center text-sm text-accent">Əla iş! Bu mövzuda yaxşı hazırlaşıbsan 🎯</p>
            )}
            {pct < 50 && (
              <p className="mt-3 text-center text-sm text-amber-600 dark:text-amber-400">
                Bu mövzunu bir az daha çalış — AI Müəllimdən izah istə.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button variant="outline" onClick={() => setAppView("dashboard")} size="lg">
            <ArrowLeft className="size-4" />
            Panelə Qayıt
          </Button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => {
                setCurrent(0);
                setPhase("review");
              }}
              size="lg"
            >
              <History className="size-4" />
              Cavablara Bax
            </Button>
            <Button onClick={handleRestart} size="lg">
              <RotateCcw className="size-4" />
              Yenidən
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // === REVIEW (nəticələrdən sonra bütün sualları/cavabları geri qayıdıb baxmaq) ===
  if (phase === "review") {
    const q = questions[current];
    const ans = answers[current];
    const isCorrect = ans !== null && ans === q.dogruCavab;
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Baxış rejimi</p>
            <h2 className="font-heading text-lg font-bold sm:text-xl">
              Sual {current + 1} / {questions.length}
            </h2>
          </div>
          <Button variant="outline" size="sm" onClick={() => setPhase("results")} className="gap-1.5">
            <ArrowLeft className="size-4" />
            Nəticələrə qayıt
          </Button>
        </div>

        <Card className="mb-3">
          <CardContent className="p-5 sm:p-6">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {q.movzu && (
                <Badge variant="outline" className="text-xs">
                  {q.movzu}
                </Badge>
              )}
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  q.cetinlik === "asan" && "border-accent/40 text-accent",
                  q.cetinlik === "orta" && "border-amber-500/40 text-amber-600 dark:text-amber-400",
                  q.cetinlik === "cetin" && "border-destructive/40 text-destructive"
                )}
              >
                {q.cetinlik === "asan" ? "Asan" : q.cetinlik === "orta" ? "Orta" : "Çətin"}
              </Badge>
              {ans === null && (
                <Badge variant="secondary" className="text-xs">
                  Cavablanmayıb
                </Badge>
              )}
            </div>
            <Markdown content={q.sual} className="text-base font-medium leading-relaxed text-balance" />
            <GeometryFigure figura={q.figura} />
          </CardContent>
        </Card>

        <div className="grid gap-2">
          {LETTERS.map((letter) => {
            const val = q.variantlar[letter];
            const isCorrectLetter = letter === q.dogruCavab;
            const isSelectedLetter = ans === letter;
            return (
              <div
                key={letter}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border p-3.5 text-left sm:p-4",
                  isCorrectLetter && "border-accent bg-accent/10",
                  isSelectedLetter && !isCorrectLetter && "border-destructive bg-destructive/10",
                  !isCorrectLetter && !isSelectedLetter && "border-border bg-card opacity-60"
                )}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-lg border font-stat text-sm font-semibold",
                    isCorrectLetter && "border-accent bg-accent text-accent-foreground",
                    isSelectedLetter && !isCorrectLetter && "border-destructive bg-destructive text-white",
                    !isCorrectLetter && !isSelectedLetter && "border-border text-muted-foreground"
                  )}
                >
                  {letter}
                </span>
                <Markdown content={val} inline className="text-sm leading-relaxed pt-0.5" />
                {isCorrectLetter && <CheckCircle2 className="ml-auto size-5 shrink-0 text-accent" />}
                {isSelectedLetter && !isCorrectLetter && <XCircle className="ml-auto size-5 shrink-0 text-destructive" />}
              </div>
            );
          })}
        </div>

        <Card
          className={cn(
            "border-l-4",
            ans === null ? "border-l-muted-foreground/30" : isCorrect ? "border-l-accent" : "border-l-destructive"
          )}
        >
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2">
              {ans === null ? (
                <span className="text-sm font-semibold text-muted-foreground">Bu sual cavablanmayıb</span>
              ) : isCorrect ? (
                <>
                  <CheckCircle2 className="size-4 text-accent" />
                  <span className="text-sm font-semibold">Doğru cavab!</span>
                </>
              ) : (
                <>
                  <XCircle className="size-4 text-destructive" />
                  <span className="text-sm font-semibold">Səhv cavab</span>
                </>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">İzah: </span>
              <Markdown content={q.izah} inline />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
            className="gap-1.5"
          >
            <ChevronLeft className="size-4" />
            Əvvəlki
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
            disabled={current === questions.length - 1}
            className="gap-1.5"
          >
            Növbəti
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  // === PLAYING ===
  if (questions.length === 0) return null;
  const q = questions[current];
  const progress = (answeredCount / questions.length) * 100;
  const isLast = current + 1 >= questions.length;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Sual Generatoru</p>
          <h2 className="font-heading text-lg font-bold sm:text-xl">
            Sual {current + 1} / {questions.length}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Target className="size-3" />
            {fenn}
          </Badge>
          <Badge variant="secondary" className="font-stat">
            {correctCount} ✓ · {wrongCount} ✗
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={finishTest}
            disabled={answeredCount === 0}
            className="h-7 gap-1 text-[11px]"
          >
            <StopCircle className="size-3.5" />
            Bitir
          </Button>
        </div>
      </div>

      <Progress value={progress} className="h-2" />

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          <Card className="mb-3">
            <CardContent className="p-5 sm:p-6">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {q.movzu && (
                  <Badge variant="outline" className="text-xs">
                    {q.movzu}
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    q.cetinlik === "asan" && "border-accent/40 text-accent",
                    q.cetinlik === "orta" && "border-amber-500/40 text-amber-600 dark:text-amber-400",
                    q.cetinlik === "cetin" && "border-destructive/40 text-destructive"
                  )}
                >
                  {q.cetinlik === "asan" ? "Asan" : q.cetinlik === "orta" ? "Orta" : "Çətin"}
                </Badge>
              </div>
              <Markdown content={q.sual} className="text-base font-medium leading-relaxed text-balance" />
              <GeometryFigure figura={q.figura} />
            </CardContent>
          </Card>

          <div className="grid gap-2">
            {LETTERS.map((letter) => {
              const val = q.variantlar[letter];
              const isCorrect = letter === q.dogruCavab;
              const isSelected = selected === letter;
              return (
                <button
                  key={letter}
                  onClick={() => handleSelect(letter)}
                  disabled={revealed}
                  className={cn(
                    "group flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-all sm:p-4",
                    !revealed && "border-border bg-card hover:border-primary/40 hover:bg-accent/5 cursor-pointer",
                    revealed && isCorrect && "border-accent bg-accent/10",
                    revealed && isSelected && !isCorrect && "border-destructive bg-destructive/10",
                    revealed && !isCorrect && !isSelected && "border-border bg-card opacity-60"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-lg border font-stat text-sm font-semibold",
                      !revealed && "border-border text-muted-foreground",
                      revealed && isCorrect && "border-accent bg-accent text-accent-foreground",
                      revealed && isSelected && !isCorrect && "border-destructive bg-destructive text-white",
                      revealed && !isCorrect && !isSelected && "border-border text-muted-foreground"
                    )}
                  >
                    {letter}
                  </span>
                  <Markdown content={val} inline className="text-sm leading-relaxed pt-0.5" />
                  {revealed && isCorrect && <CheckCircle2 className="ml-auto size-5 shrink-0 text-accent" />}
                  {revealed && isSelected && !isCorrect && <XCircle className="ml-auto size-5 shrink-0 text-destructive" />}
                </button>
              );
            })}
          </div>

          {current > 0 && (
            <div className="mt-3 flex justify-start">
              <Button variant="outline" size="sm" onClick={handleBack} className="gap-1.5">
                <ChevronLeft className="size-4" />
                Əvvəlki Sual
              </Button>
            </div>
          )}

          <AnimatePresence>
            {revealed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 overflow-hidden"
              >
                <Card className={cn("border-l-4", selected === q.dogruCavab ? "border-l-accent" : "border-l-destructive")}>
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center gap-2">
                      {selected === q.dogruCavab ? (
                        <CheckCircle2 className="size-4 text-accent" />
                      ) : (
                        <XCircle className="size-4 text-destructive" />
                      )}
                      <span className="text-sm font-semibold">
                        {selected === q.dogruCavab ? "Doğru cavab!" : "Səhv cavab"}
                      </span>
                      {selected !== q.dogruCavab && savedBookmark && (
                        <span className="ml-auto flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                          📌 Saxlanıldı
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">İzah: </span>
                      <Markdown content={q.izah} inline />
                    </div>
                  </CardContent>
                </Card>
                <div className="mt-3 flex justify-end">
                  <Button onClick={handleNext} size="lg">
                    {isLast ? "Nəticələri gör" : "Növbəti Sual"}
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
