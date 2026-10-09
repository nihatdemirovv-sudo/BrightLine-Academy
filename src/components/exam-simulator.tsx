"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  CalendarClock,
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
  FileDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/markdown";
import { GeometryFigure } from "@/components/geometry-figure";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api, QRUP_FENLERI, QRUP_LABELS } from "@/lib/api";
import type {
  ExamConfig,
  ExamQuestion,
  ExamSubmitResult,
  ExamHistory,
  ExamAttempt,
} from "@/lib/api";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { exportExamResultPDF } from "@/lib/pdf";
import { cn, azDateShort, azDateISO } from "@/lib/utils";

const LETTERS: ("A" | "B" | "C" | "D" | "E")[] = ["A", "B", "C", "D", "E"];
const MUDDAT_OPTIONS = [60, 120, 180, 240];
const SUAL_SAY_OPTIONS = [10, 20, 30, 50];

type Phase = "setup" | "loading" | "exam" | "results";

function formatExamDate(iso: string): string {
  try {
    const d = new Date(iso + "T00:00:00");
    if (isNaN(d.getTime())) return iso;
    const ay = [
      "Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun",
      "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr",
    ];
    return `${d.getDate()} ${ay[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return iso;
  }
}

function cetinlikBadge(c: string) {
  if (c === "asan")
    return (
      <Badge variant="outline" className="border-accent/40 text-accent text-[10px]">
        Asan
      </Badge>
    );
  if (c === "orta")
    return (
      <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-400 text-[10px]">
        Orta
      </Badge>
    );
  return (
    <Badge variant="outline" className="border-destructive/40 text-destructive text-[10px]">
      Çətin
    </Badge>
  );
}

// mm:ss formatı
function fmtTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m.toString().padStart(2, "0")}:${r.toString().padStart(2, "0")}`;
}

export function ExamSimulator() {
  const { toast } = useToast();
  const sessionId = useStore((s) => s.sessionId) || "";
  const setAppView = useStore((s) => s.setAppView);
  const setStudent = useStore((s) => s.setStudent);
  const student = useStore((s) => s.student);

  const [phase, setPhase] = React.useState<Phase>("setup");
  const [config, setConfig] = React.useState<ExamConfig | null>(null);
  const [qrup, setQrup] = React.useState<string>("1");
  const [history, setHistory] = React.useState<ExamHistory | null>(null);

  // Setup form state
  const [setupDate, setSetupDate] = React.useState<string>("");
  const [setupNov, setSetupNov] = React.useState<"tqdk" | "magistr">("tqdk");
  const [setupMuddet, setSetupMuddet] = React.useState<number>(180);
  const [setupSualSayi, setSetupSualSayi] = React.useState<number>(30);
  const [setupKecidBali, setSetupKecidBali] = React.useState<number>(200);
  const [savingConfig, setSavingConfig] = React.useState(false);
  const [showSetupForm, setShowSetupForm] = React.useState(false);

  // Exam state
  const [questions, setQuestions] = React.useState<ExamQuestion[]>([]);
  const [attemptId, setAttemptId] = React.useState<string>("");
  const [current, setCurrent] = React.useState(0);
  const [cavablar, setCavablar] = React.useState<Record<number, "A" | "B" | "C" | "D" | "E" | null>>({});
  const [flagged, setFlagged] = React.useState<Set<number>>(new Set());
  const [secondsLeft, setSecondsLeft] = React.useState<number>(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<ExamSubmitResult | null>(null);
  const startedAtRef = React.useRef<number>(0);

  // İlk yükləmə: config + history
  const loadInitial = React.useCallback(async () => {
    if (!sessionId) return;
    try {
      const [cfgRes, histRes] = await Promise.all([
        api.getExamConfig(sessionId),
        api.getExamHistory(sessionId),
      ]);
      setConfig(cfgRes.config);
      setQrup(cfgRes.qrup || student?.qrup || "1");
      setHistory(histRes);
      if (cfgRes.config) {
        setSetupDate(cfgRes.config.imtahanTarixi);
        setSetupNov(cfgRes.config.nov);
        setSetupMuddet(cfgRes.config.müddet);
        setSetupSualSayi(cfgRes.config.sualSayi);
        setSetupKecidBali(cfgRes.config.kecidBali);
      } else {
        // default: 30 gün sonra
        const def = new Date();
        def.setDate(def.getDate() + 30);
        setSetupDate(azDateISO(def));
      }
    } catch {
      // silent
    }
  }, [sessionId, student?.qrup]);

  React.useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // Tarixi yenilə (results-dən sonra)
  const reloadHistory = React.useCallback(async () => {
    if (!sessionId) return;
    try {
      const h = await api.getExamHistory(sessionId);
      setHistory(h);
    } catch {
      // silent
    }
  }, [sessionId]);

  // Timer
  React.useEffect(() => {
    if (phase !== "exam") return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // auto-submit
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  async function handleSaveConfig() {
    if (!sessionId || !setupDate) {
      toast({ variant: "destructive", title: "İmtahan tarixini seçin" });
      return;
    }
    setSavingConfig(true);
    try {
      const saved = await api.saveExamConfig({
        sessionId,
        imtahanTarixi: setupDate,
        nov: setupNov,
        müddet: setupMuddet,
        sualSayi: setupSualSayi,
        kecidBali: setupKecidBali,
      });
      setConfig(saved);
      setShowSetupForm(false);
      toast({
        title: "Konfiqurasiya saxlanıldı ✓",
        description: `${formatExamDate(saved.imtahanTarixi)} · ${saved.sualSayi} sual`,
      });
      // history yenilə (gün qalıb dəyişir)
      reloadHistory();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Xəta baş verdi",
        description: e instanceof Error ? e.message : "",
      });
    } finally {
      setSavingConfig(false);
    }
  }

  async function handleStartExam() {
    if (!sessionId) return;
    setPhase("loading");
    try {
      const r = await api.generateExam({ sessionId });
      if (!r.suallar?.length) {
        toast({
          variant: "destructive",
          title: "Suallar yaradıla bilmədi",
          description: "AI cavab qaytarmadı. Yenidən cəhd edin.",
        });
        setPhase("setup");
        return;
      }
      setQuestions(r.suallar);
      setAttemptId(r.attemptId);
      setCavablar({});
      setFlagged(new Set());
      setCurrent(0);
      setSecondsLeft(r.müddet * 60);
      startedAtRef.current = Date.now();
      setPhase("exam");
      toast({
        title: `${r.sualSayi} sual hazırdır`,
        description: `${r.müddet} dəqiqə · Uğurlar!`,
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "İmtahan yaradıla bilmədi",
        description: e instanceof Error ? e.message : "",
      });
      setPhase("setup");
    }
  }

  async function handleSubmit(auto = false) {
    if (!attemptId) return;
    setSubmitting(true);
    const müddetSan = Math.floor((Date.now() - startedAtRef.current) / 1000);
    try {
      const r = await api.submitExam({
        attemptId,
        cavablar,
        müddetSan,
      });
      setResult(r);
      setPhase("results");
      toast({
        title: "İmtahan tamamlandı",
        description: `${r.dogruCavab} doğru · ${r.bal} bal`,
      });
      if (auto) {
        toast({
          variant: "destructive",
          title: "Vaxt bitdi",
          description: "İmtahan avtomatik tamamlandı",
        });
      }
      reloadHistory();
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
    setPhase("setup");
    setQuestions([]);
    setCurrent(0);
    setCavablar({});
    setFlagged(new Set());
    setResult(null);
    setSecondsLeft(0);
  }

  function handleDownloadPDF() {
    if (!result) return;
    try {
      toast({ title: "PDF yüklənir...", description: "İmtahan nəticəsi hazırlanır." });
      exportExamResultPDF({
        student: {
          ad: student?.ad || "Şagird",
          qrup: student?.qrup,
          hedefUniversite: student?.hedefUniversite,
        },
        attempt: {
          sualSayi: result.sualSayi,
          dogruCavab: result.dogruCavab,
          sehvCavab: result.sehvCavab,
          bosCavab: result.bosCavab,
          bal: result.bal,
          müddetSan: result.müddetSan,
          createdAt: result.baslamaVaxti,
        },
        fennNetice: result.fennNetice || {},
        kecidBali: result.kecidBali,
      });
      toast({ title: "PDF yükləndi ✓", description: "İmtahan nəticəsi saxlanıldı." });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "PDF yüklənə bilmədi",
        description: e instanceof Error ? e.message : "Xəta baş verdi",
      });
    }
  }

  const answeredCount = Object.keys(cavablar).length;

  // === LOADING PHASE ===
  if (phase === "loading") {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-5 text-center">
        <div className="relative">
          <Loader2 className="size-16 animate-spin text-primary" />
          <GraduationCap className="absolute -right-2 -top-2 size-7 text-accent" />
        </div>
        <div>
          <p className="font-heading text-xl font-bold">AI imtahan sualları hazırlayır...</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {config?.sualSayi || 30} sual · qrup əsaslı fənn bölgüsü
          </p>
        </div>
        <p className="text-xs text-muted-foreground">Bu 15-25 saniyə çəkə bilər</p>
        <div className="flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1.5 text-xs text-accent">
          <Sparkles className="size-3" />
          Paralel AI generasiya...
        </div>
      </div>
    );
  }

  // === SETUP PHASE ===
  if (phase === "setup") {
    const showForm = !config || showSetupForm;
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        {/* Header */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Simulyasiya
          </p>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            İmtahan Simulyatoru
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real TQDK/Magistr formatında vaxt məhdud imtahan. Sənədləşdir, keçid balını keç.
          </p>
        </div>

        {showForm ? (
          /* === KONFİQURASİYA FORMASI === */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarClock className="size-4 text-primary" />
                İmtahan Konfiqurasiyası
              </CardTitle>
              <CardDescription>
                Hədəf imtahanını təyin et — sistem ona uyğun hazırlıq planı quracaq.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Tarix */}
              <div>
                <Label htmlFor="exam-date" className="mb-1.5 block">İmtahan tarixi</Label>
                <Input
                  id="exam-date"
                  type="date"
                  value={setupDate}
                  onChange={(e) => setSetupDate(e.target.value)}
                  className="w-full"
                />
                {setupDate && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatExamDate(setupDate)}
                  </p>
                )}
              </div>

              {/* Növ */}
              <div>
                <Label className="mb-2 block">İmtahan növü</Label>
                <RadioGroup
                  value={setupNov}
                  onValueChange={(v) => setSetupNov(v as "tqdk" | "magistr")}
                  className="grid grid-cols-2 gap-2"
                >
                  <Label
                    htmlFor="nov-tqdk"
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-all",
                      setupNov === "tqdk"
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    <RadioGroupItem id="nov-tqdk" value="tqdk" />
                    <div>
                      <p className="text-sm font-medium">TQDK</p>
                      <p className="text-[11px] text-muted-foreground">Buraxılış imtahanı</p>
                    </div>
                  </Label>
                  <Label
                    htmlFor="nov-magistr"
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-all",
                      setupNov === "magistr"
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    <RadioGroupItem id="nov-magistr" value="magistr" />
                    <div>
                      <p className="text-sm font-medium">Magistr</p>
                      <p className="text-[11px] text-muted-foreground">Magistratura imtahanı</p>
                    </div>
                  </Label>
                </RadioGroup>
              </div>

              {/* Müddət */}
              <div>
                <Label className="mb-2 block">Müddət (dəqiqə)</Label>
                <div className="grid grid-cols-4 gap-2">
                  {MUDDAT_OPTIONS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSetupMuddet(m)}
                      className={cn(
                        "rounded-lg border p-3 text-center transition-all",
                        setupMuddet === m
                          ? "border-primary bg-primary text-primary-foreground ring-2 ring-primary/20 shadow-sm"
                          : "border-border hover:border-primary/40"
                      )}
                    >
                      <div className={cn("font-stat text-lg font-bold", setupMuddet === m ? "text-primary-foreground" : "text-foreground")}>
                        {m}
                      </div>
                      <div className={cn("text-[10px]", setupMuddet === m ? "text-primary-foreground/80" : "text-muted-foreground")}>
                        dəq
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sual sayı */}
              <div>
                <Label className="mb-2 block">Sual sayı</Label>
                <div className="grid grid-cols-4 gap-2">
                  {SUAL_SAY_OPTIONS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setSetupSualSayi(n)}
                      className={cn(
                        "rounded-lg border p-3 text-center transition-all",
                        setupSualSayi === n
                          ? "border-primary bg-primary text-primary-foreground ring-2 ring-primary/20 shadow-sm"
                          : "border-border hover:border-primary/40"
                      )}
                    >
                      <div className={cn("font-stat text-lg font-bold", setupSualSayi === n ? "text-primary-foreground" : "text-foreground")}>
                        {n}
                      </div>
                      <div className={cn("text-[10px]", setupSualSayi === n ? "text-primary-foreground/80" : "text-muted-foreground")}>
                        sual
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Keçid balı */}
              <div>
                <Label htmlFor="kecid" className="mb-1.5 block">Keçid balı</Label>
                <Input
                  id="kecid"
                  type="number"
                  min={0}
                  value={setupKecidBali}
                  onChange={(e) => setSetupKecidBali(parseInt(e.target.value) || 0)}
                  className="w-full"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  TQDK bal sistemi: doğru +4, səhv −1, boş 0
                </p>
              </div>

              {/* Fənn siyahısı önizləmə */}
              {QRUP_FENLERI[qrup] && (
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                    {QRUP_LABELS[qrup] || qrup} · fənn bölgüsü
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {QRUP_FENLERI[qrup].map((f) => (
                      <Badge key={f} variant="secondary" className="text-[10px]">{f}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            <div className="flex items-center justify-end gap-2 border-t border-border p-4">
              {config && (
                <Button
                  variant="ghost"
                  onClick={() => setShowSetupForm(false)}
                >
                  Ləğv et
                </Button>
              )}
              <Button onClick={handleSaveConfig} disabled={savingConfig}>
                {savingConfig ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
                Konfiqurasiyanı Saxla
              </Button>
            </div>
          </Card>
        ) : (
          /* === İMTAHA HAZIRDIR XÜLASƏSİ === */
          <React.Fragment>
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col items-center gap-5 text-center">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex size-20 items-center justify-center rounded-2xl bg-primary/10 text-primary"
                  >
                    <GraduationCap className="size-10" />
                  </motion.div>
                  <div>
                    <h2 className="font-heading text-2xl font-bold">İmtahan Hazırdır</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatExamDate(config!.imtahanTarixi)} ·{" "}
                      {config!.nov === "magistr" ? "Magistr" : "TQDK"} formatı
                    </p>
                  </div>

                  <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-lg border border-border bg-card p-3">
                      <div className="font-stat text-xl font-bold text-primary">{config!.sualSayi}</div>
                      <div className="text-[10px] text-muted-foreground">sual</div>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-3">
                      <div className="font-stat text-xl font-bold text-primary">{config!.müddet}</div>
                      <div className="text-[10px] text-muted-foreground">dəqiqə</div>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-3">
                      <div className="font-stat text-xl font-bold text-accent">{config!.kecidBali}</div>
                      <div className="text-[10px] text-muted-foreground">keçid balı</div>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-3">
                      <div className="font-stat text-xl font-bold text-foreground">
                        {history?.stats?.toplamCəhd || 0}
                      </div>
                      <div className="text-[10px] text-muted-foreground">cəhd</div>
                    </div>
                  </div>

                  {/* Son cəhd statistikaları */}
                  {history && history.stats.toplamCəhd > 0 && (
                    <div className="w-full rounded-lg border border-border bg-muted/30 p-3 text-left">
                      <p className="mb-2 text-xs font-medium text-muted-foreground">
                        Son nəticələr
                      </p>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <div className="font-stat text-lg font-bold text-foreground">
                            {history.stats.sonBal}
                          </div>
                          <div className="text-[10px] text-muted-foreground">son bal</div>
                        </div>
                        <div>
                          <div className="font-stat text-lg font-bold text-accent">
                            {history.stats.enYaxşıBal}
                          </div>
                          <div className="text-[10px] text-muted-foreground">ən yaxşı</div>
                        </div>
                        <div>
                          <div className="font-stat text-lg font-bold text-primary">
                            {history.stats.ortaBal}
                          </div>
                          <div className="text-[10px] text-muted-foreground">orta</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
                    <Button size="lg" className="h-12 gap-2 px-8" onClick={handleStartExam}>
                      <GraduationCap className="size-5" />
                      İmtahana Başla
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="h-12"
                      onClick={() => setShowSetupForm(true)}
                    >
                      Konfiqurasiyanı dəyiş
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    İmtahan başladıqda suallar AI tərəfindən real vaxtda yaradılacaq (~15-25 san).
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Tarixçə (setup-da da göstər) */}
            {history && history.cəhdlər.length > 0 && (
              <AttemptsHistory
                cəhdlər={history.cəhdlər}
                kecidBali={config!.kecidBali}
              />
            )}
          </React.Fragment>
        )}
      </div>
    );
  }

  // === EXAM PHASE ===
  if (phase === "exam" && questions.length > 0) {
    const q = questions[current];
    const lowTime = secondsLeft <= 300; // 5 dəq
    const answered = answeredCount;
    const flagCount = flagged.size;
    const userAnswer = cavablar[current];

    return (
      <div className="mx-auto w-full max-w-4xl space-y-3">
        {/* Sticky top bar */}
        <div className="sticky top-0 z-30 -mx-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-lg sm:-mx-6 sm:px-6">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1">
                <ListChecks className="size-3" />
                Sual {current + 1} / {questions.length}
              </Badge>
              <motion.div
                animate={lowTime ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                transition={lowTime ? { duration: 1, repeat: Infinity } : { duration: 0 }}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-stat text-base font-bold tabular-nums",
                  lowTime
                    ? "bg-destructive/10 text-destructive"
                    : "bg-primary/5 text-primary"
                )}
              >
                <Clock className="size-4" />
                {fmtTime(secondsLeft)}
              </motion.div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={handleToggleFlag}
              >
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
                      {answered} / {questions.length} sual cavablandırılıb.
                      {!userAnswer && current < questions.length - 1 && " Bitti sonra dəyişdirilə bilməz."}
                      {" "}Bal dərhal hesablanacaq.
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

        {/* Question navigator grid */}
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
                {questions.map((_, i) => {
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

        {/* Question card */}
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
                  <Badge variant="secondary" className="text-[10px]">
                    {q.fenn}
                  </Badge>
                  {q.movzu && (
                    <Badge variant="outline" className="text-[10px]">{q.movzu}</Badge>
                  )}
                  {cetinlikBadge(q.cetinlik)}
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    №{q.nomre || current + 1}
                  </Badge>
                </div>
                <Markdown content={q.sual} className="text-base font-medium leading-relaxed text-balance" />
                <GeometryFigure figura={q.figura} />
              </CardContent>
            </Card>

            {/* Variantlar — silent (no immediate feedback) */}
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
                    {isSelected && (
                      <CheckCircle2 className="size-5 shrink-0 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Bottom nav */}
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAnswer}
                  className="text-xs text-muted-foreground"
                >
                  Cavabı sil
                </Button>
              )}

              {current + 1 < questions.length ? (
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
                        {answered} / {questions.length} sual cavablandırılıb. Bal dərhal hesablanacaq.
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

        {/* Submitting overlay */}
        {submitting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 text-center">
              <Loader2 className="size-12 animate-spin text-primary" />
              <p className="font-heading text-lg font-semibold">Nəticə hesablanır...</p>
              <p className="text-sm text-muted-foreground">TQDK bal sistemi ilə</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // === RESULTS PHASE ===
  if (phase === "results" && result) {
    const passed = result.bal >= result.kecidBali;
    const pct = Math.round((result.dogruCavab / Math.max(1, result.sualSayi)) * 100);
    const müddetDəq = Math.floor(result.müddetSan / 60);

    return (
      <div className="mx-auto max-w-3xl space-y-5">
        {/* Celebratory header */}
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
              passed ? "bg-accent/15 text-accent" : "bg-destructive/15 text-destructive"
            )}
          >
            {passed ? <PartyPopper className="size-12" /> : <AlertTriangle className="size-12" />}
          </motion.div>
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            İmtahan tamamlandı!
          </h1>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-bold",
                passed
                  ? "bg-accent/15 text-accent"
                  : "bg-destructive/15 text-destructive"
              )}
            >
              {passed ? <Trophy className="size-4" /> : <AlertTriangle className="size-4" />}
              {passed ? "KEÇDİN" : "TƏKRAR LAZIMDIR"}
            </span>
          </div>
        </motion.div>

        {/* Bal score */}
        <Card className={cn("overflow-hidden", passed ? "border-accent/30" : "border-destructive/30")}>
          <CardContent className="p-6 text-center">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Toplam bal</p>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={cn(
                "font-stat text-6xl font-bold tabular-nums sm:text-7xl",
                passed ? "text-accent" : "text-destructive"
              )}
            >
              {result.bal}
            </motion.div>
            <p className="mt-1 text-sm text-muted-foreground">
              Keçid balı: {result.kecidBali} · {result.bal >= result.kecidBali ? "+" : "−"}
              {Math.abs(result.bal - result.kecidBali)} bal fərq
            </p>
          </CardContent>
        </Card>

        {/* Stat row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCell
            icon={<CheckCircle2 className="size-4" />}
            value={result.dogruCavab}
            label="Doğru"
            color="text-accent"
          />
          <StatCell
            icon={<XCircle className="size-4" />}
            value={result.sehvCavab}
            label="Səhv"
            color="text-destructive"
          />
          <StatCell
            icon={<Flag className="size-4" />}
            value={result.bosCavab}
            label="Boş"
            color="text-muted-foreground"
          />
          <StatCell
            icon={<Clock className="size-4" />}
            value={müddetDəq}
            suffix=" dəq"
            label={`Dəqiqlik ${pct}%`}
            color="text-primary"
          />
        </div>

        {/* Fənn bölgüsü */}
        {result.fennNetice && Object.keys(result.fennNetice).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fənn bölgüsü</CardTitle>
              <CardDescription>Hər fənn üzrə performans</CardDescription>
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
                      <span className="font-stat text-muted-foreground">
                        {n.dogru} / {total}
                      </span>
                    </div>
                    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${dogruPct}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-accent"
                      />
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${sehvPct}%` }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="h-full bg-destructive/60"
                      />
                    </div>
                    <div className="mt-1 flex gap-3 text-[10px] text-muted-foreground">
                      <span className="text-accent">{n.dogru} doğru</span>
                      <span className="text-destructive">{n.sehv} səhv</span>
                      <span>{n.bos} boş</span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Detallı bax — bütün suallar */}
        <Card>
          <Accordion type="single" collapsible>
            <AccordionItem value="detail" className="border-b-0 px-4">
              <AccordionTrigger className="hover:no-underline">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <ListChecks className="size-4 text-primary" />
                  Nəticələri Detallı Bax
                  <Badge variant="secondary" className="text-[10px]">
                    {questions.length} sual
                  </Badge>
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                {questions.map((q, i) => {
                  const userAns = cavablar[i];
                  const correct = q.dogruCavab;
                  const isCorrect = userAns === correct;
                  const isEmpty = !userAns;
                  return (
                    <div
                      key={i}
                      className={cn(
                        "rounded-xl border p-4",
                        isCorrect
                          ? "border-accent/30 bg-accent/5"
                          : isEmpty
                            ? "border-border bg-muted/20"
                            : "border-destructive/30 bg-destructive/5"
                      )}
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-stat text-xs font-bold text-muted-foreground">
                            {i + 1}.
                          </span>
                          <Badge variant="secondary" className="text-[10px]">{q.fenn}</Badge>
                          {cetinlikBadge(q.cetinlik)}
                          {isCorrect && (
                            <Badge variant="outline" className="border-accent/40 text-accent text-[10px] gap-0.5">
                              <CheckCircle2 className="size-2.5" /> Doğru
                            </Badge>
                          )}
                          {isEmpty && (
                            <Badge variant="outline" className="text-muted-foreground text-[10px] gap-0.5">
                              <Flag className="size-2.5" /> Boş
                            </Badge>
                          )}
                          {!isCorrect && !isEmpty && (
                            <Badge variant="outline" className="border-destructive/40 text-destructive text-[10px] gap-0.5">
                              <XCircle className="size-2.5" /> Səhv
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Markdown content={q.sual} className="mb-2 text-sm font-medium leading-relaxed" />
                      <div className="space-y-1">
                        {LETTERS.map((letter) => {
                          const val = q.variantlar[letter];
                          if (!val) return null;
                          const isRight = letter === correct;
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
                              <span
                                className={cn(
                                  "font-stat font-bold",
                                  isRight && "text-accent",
                                  isUserWrong && "text-destructive",
                                  !isRight && !isUserWrong && "text-muted-foreground"
                                )}
                              >
                                {letter}.
                              </span>
                              <Markdown
                                content={val}
                                inline
                                className={cn(
                                  "flex-1",
                                  isUserWrong && "text-destructive line-through decoration-destructive/50",
                                  !isRight && !isUserWrong && "text-muted-foreground"
                                )}
                              />
                              {isRight && (
                                <span className="text-[10px] font-medium text-accent">doğru</span>
                              )}
                              {isUserWrong && (
                                <span className="text-[10px] font-medium text-destructive">sən</span>
                              )}
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

        {/* Tarixçə */}
        {history && history.cəhdlər.length > 0 && (
          <AttemptsHistory cəhdlər={history.cəhdlər} kecidBali={result.kecidBali} />
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button variant="outline" size="lg" onClick={() => setAppView("dashboard")}>
            <ArrowLeft className="size-4" />
            Panelə Qayıt
          </Button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              size="lg"
              onClick={handleDownloadPDF}
            >
              <FileDown className="size-4" />
              PDF Yüklə
            </Button>
            <Button size="lg" onClick={handleRestart}>
              <RotateCcw className="size-4" />
              Yenidən Cəhd Et
            </Button>
          </div>
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

function AttemptsHistory({
  cəhdlər,
  kecidBali,
}: {
  cəhdlər: ExamAttempt[];
  kecidBali: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="size-4 text-primary" />
          Tarixçə
          <Badge variant="secondary" className="text-[10px]">{cəhdlər.length} cəhd</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-72 overflow-y-auto pr-1">
          <div className="space-y-1.5">
            {cəhdlər.slice(0, 10).map((a, i) => {
              const passed = a.bal >= kecidBali;
              return (
                <div
                  key={a.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-2.5 text-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-stat text-xs font-bold text-muted-foreground">
                      #{cəhdlər.length - i}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-medium">
                        {azDateShort(new Date(a.baslamaVaxti))}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {a.dogruCavab}✓ · {a.sehvCavab}✗ · {a.bosCavab}○
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={cn(
                        "font-stat text-base font-bold tabular-nums",
                        passed ? "text-accent" : "text-destructive"
                      )}
                    >
                      {a.bal}
                    </div>
                    <div className="text-[10px] text-muted-foreground">bal</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
