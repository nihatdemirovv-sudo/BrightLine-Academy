"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ListChecks,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Trash2,
  BookOpen,
  Clock,
  Trophy,
  Calendar,
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
import { cn } from "@/lib/utils";

const LETTERS: ("A" | "B" | "C" | "D" | "E")[] = ["A", "B", "C", "D", "E"];
const STORAGE_KEY = "completed-exams";

interface StoredQuestion {
  id: string;
  sual: string;
  variantlar: { A: string; B: string; C: string; D: string; E: string };
  dogruCavab: "A" | "B" | "C" | "D" | "E";
  izah: string;
  movzu: string;
  cetinlik: "asan" | "orta" | "cetin";
  fenn: string;
  nomre: number;
  uploadedAt: string;
}

interface CompletedExam {
  id: string;
  tarix: string;
  sualSayi: number;
  suallar: StoredQuestion[];
  cavablar: Record<number, "A" | "B" | "C" | "D" | "E" | null>;
  müddetDq: number;
  müddetSan: number;
  netice: {
    dogru: number;
    sehv: number;
    bos: number;
    bal: number;
    fennNetice: Record<string, { dogru: number; sehv: number; bos: number }>;
  };
}

function cetinlikColor(c: string) {
  if (c === "asan") return "border-accent/40 text-accent";
  if (c === "orta") return "border-amber-500/40 text-amber-600 dark:text-amber-400";
  return "border-destructive/40 text-destructive";
}

function relativeDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "indi";
  if (diffMin < 60) return `${diffMin} dəq əvvəl`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} saat əvvəl`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} gün əvvəl`;
}

export function CompletedExamsView() {
  const { toast } = useToast();
  const [exams, setExams] = React.useState<CompletedExam[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [detailId, setDetailId] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setExams(raw ? JSON.parse(raw) : []);
    } catch {
      setExams([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleDelete(id: string) {
    const updated = exams.filter((e) => e.id !== id);
    setExams(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setDeleteId(null);
    if (detailId === id) setDetailId(null);
    toast({ title: "Sındırıldı" });
  }

  function handleClearAll() {
    setExams([]);
    localStorage.removeItem(STORAGE_KEY);
    setDeleteId(null);
    setDetailId(null);
    toast({ title: "Hamısı silindi" });
  }

  const detail = detailId ? exams.find((e) => e.id === detailId) || null : null;

  // Detail view
  if (detail) {
    const facePct = detail.sualSayi > 0 ? Math.round((detail.netice.dogru / detail.sualSayi) * 100) : 0;
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <button onClick={() => setDetailId(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Geri
        </button>

        {/* Score */}
        <Card className="overflow-hidden">
          <div className={cn("flex flex-col items-center gap-3 py-8 text-center", detail.netice.bal >= 100 ? "bg-gradient-to-b from-accent/10 to-transparent" : "")}>
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
              <Trophy className="size-8 text-primary" />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold">{detail.netice.bal} bal</h2>
            </div>
            <div className="flex gap-6 text-center">
              <div><div className="font-stat text-xl font-bold text-accent">{detail.netice.dogru}</div><div className="text-[10px] text-muted-foreground">Doğru</div></div>
              <div><div className="font-stat text-xl font-bold text-destructive">{detail.netice.sehv}</div><div className="text-[10px] text-muted-foreground">Səhv</div></div>
              <div><div className="font-stat text-xl font-bold text-muted-foreground">{detail.netice.bos}</div><div className="text-[10px] text-muted-foreground">Boş</div></div>
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
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="size-3" /> {detail.müddetDq} dəq</span>
              <span>·</span>
              <span>{new Date(detail.tarix).toLocaleString("az-AZ")}</span>
            </div>
          </div>
        </Card>

        {/* Fenn nəticələri */}
        {Object.keys(detail.netice.fennNetice).length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Fənn üzrə nəticə</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(detail.netice.fennNetice).map(([fenn, n]) => {
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

        {/* Hər sual */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Sual üzrə nəticələr</CardTitle></CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-3 pr-4">
                {detail.suallar.map((q, idx) => {
                  const cavab = detail.cavablar[idx];
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
                      <Markdown content={q.sual} className="mb-2 text-sm font-medium leading-relaxed" />
                      <div className="grid gap-1">
                        {LETTERS.map((letter) => {
                          const val = q.variantlar[letter];
                          if (!val) return null;
                          const isRight = letter === q.dogruCavab;
                          const isChosen = letter === cavab;
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
      </div>
    );
  }

  // List view
  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Yüklənir...</p>
      </div>
    );
  }

  if (exams.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Sınaq Tarixçəsi</p>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">İşlədiyiniz Sınaqlar</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
            <ListChecks className="size-10 opacity-40" />
            <p className="text-sm">Hələ heç sınaq tamamlamamısınız.</p>
            <p className="text-xs">"İmtahana Düşən Suallar"-dan imtahan verib təsdiq etdikdə burada görünəcək.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Sınaq Tarixçəsi</p>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">İşlədiyiniz Sınaqlar</h1>
          <p className="mt-1 text-sm text-muted-foreground">{exams.length} bitirilmiş sınaq</p>
        </div>
        <Button variant="destructive" size="sm" onClick={() => setDeleteId("clear-all")} className="gap-1 text-xs">
          <Trash2 className="size-3" /> Hamısını Sil
        </Button>
      </div>

      <ScrollArea className="max-h-[calc(100vh-260px)]">
        <div className="space-y-3 pr-4">
          {exams.map((exam) => {
            const isExpanded = expandedId === exam.id;
            const facePct = exam.sualSayi > 0 ? Math.round((exam.netice.dogru / exam.sualSayi) * 100) : 0;
            return (
              <motion.div key={exam.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedId((prev) => (prev === exam.id ? null : exam.id))}
                    className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-muted/30"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <Trophy className="size-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-stat text-lg font-bold text-primary">{exam.netice.bal}</span>
                        <span className="text-xs text-muted-foreground">bal</span>
                        <Badge variant="outline" className="text-[9px]">
                          {exam.netice.dogru}/{exam.sualSayi} doğru
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-0.5"><Calendar className="size-2.5" /> {relativeDate(exam.tarix)}</span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5"><Clock className="size-2.5" /> {exam.müddetDq} dəq</span>
                        <span>·</span>
                        <span>{facePct}%</span>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setDeleteId(exam.id); }}
                        className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                      {isExpanded ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} transition={{ duration: 0.2 }} className="border-t border-border px-4 pb-4 pt-3">
                      {/* Fenn nəticələri */}
                      {Object.keys(exam.netice.fennNetice).length > 0 && (
                        <div className="mb-3 space-y-1.5">
                          {Object.entries(exam.netice.fennNetice).map(([fenn, n]) => {
                            const total = n.dogru + n.sehv + n.bos;
                            const pct = total > 0 ? Math.round((n.dogru / total) * 100) : 0;
                            return (
                              <div key={fenn} className="flex items-center gap-2">
                                <span className="w-20 truncate text-[10px] text-muted-foreground">{fenn}</span>
                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="w-12 text-right text-[10px] text-muted-foreground">{n.dogru}/{total}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <Button size="sm" variant="outline" onClick={() => setDetailId(exam.id)} className="w-full gap-1.5 text-xs">
                        Ətraflı Bax
                      </Button>
                    </motion.div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Delete dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteId === "clear-all" ? "Hamısını silmək istəyirsən?" : "Bu sınağı silmək istəyirsən?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteId === "clear-all"
                ? "Bütün sınaq tarixçəsi silinəcək. Bu əməliyyat geri alıla bilməz."
                : "Bu sınaq tarixçədən silinəcək. Bu əməliyyat geri alıla bilməz."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İmtina</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId === "clear-all" ? handleClearAll() : deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
