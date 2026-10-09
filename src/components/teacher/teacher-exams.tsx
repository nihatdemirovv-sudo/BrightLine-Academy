"use client";

import * as React from "react";
import { Loader2, Plus, FileCheck2, ChevronLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import type { TeacherExamItem, ExamSubmissionDetail } from "@/lib/api";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { compressImageFile, readFileAsDataURL, MAX_PDF_BYTES, PDF_TOO_BIG_MSG } from "@/lib/media";
import { cn } from "@/lib/utils";

export function TeacherExams() {
  const { sessionId } = useStore();
  const { toast } = useToast();
  const [exams, setExams] = React.useState<TeacherExamItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [baslik, setBaslik] = React.useState("");
  const [telimat, setTelimat] = React.useState("");
  const [file, setFile] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [selected, setSelected] = React.useState<TeacherExamItem | null>(null);

  const load = React.useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      setExams(await api.getTeacherExams(sessionId));
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (e.target) e.target.value = "";
    if (!f) return;
    const isImage = f.type.startsWith("image/");
    if (!isImage && f.type !== "application/pdf") {
      toast({ variant: "destructive", title: "Dəstəklənməyən fayl", description: "Yalnız şəkil və ya PDF." });
      return;
    }
    if (!isImage && f.size > MAX_PDF_BYTES) {
      toast({ variant: "destructive", title: "Fayl yüklənmədi", description: PDF_TOO_BIG_MSG });
      return;
    }
    try {
      setFile(isImage ? await compressImageFile(f) : await readFileAsDataURL(f));
    } catch {
      toast({ variant: "destructive", title: "Fayl emal edilə bilmədi" });
    }
  }

  async function handleCreate() {
    if (!sessionId || !baslik.trim()) return;
    setSaving(true);
    try {
      const exam = await api.createTeacherExam({ sessionId, baslik: baslik.trim(), sened: file || undefined, telimat: telimat.trim() || undefined });
      setExams((prev) => [exam, ...prev]);
      setOpen(false);
      setBaslik("");
      setTelimat("");
      setFile(null);
      toast({ title: "İmtahan elan edildi" });
    } catch (err) {
      toast({ variant: "destructive", title: "Xəta", description: err instanceof Error ? err.message : undefined });
    } finally {
      setSaving(false);
    }
  }

  if (selected) {
    return <ExamSubmissions exam={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-bold">İmtahanlar</h1>
          <p className="mt-1 text-sm text-muted-foreground">Bütün tələbələrinizə elan olunur.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="shrink-0 gap-1.5">
          <Plus className="size-4" />
          Elan et
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni imtahan elan et</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Başlıq" value={baslik} onChange={(e) => setBaslik(e.target.value)} />
            <Textarea placeholder="Təlimat (məs. 'sabaha qədər yazın')" value={telimat} onChange={(e) => setTelimat(e.target.value)} rows={3} />
            <input ref={inputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />
            {file ? (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-2 text-sm">
                <FileText className="size-4" />
                Sual sənədi seçildi
                <button className="ml-auto text-muted-foreground hover:text-foreground" onClick={() => setFile(null)}>×</button>
              </div>
            ) : (
              <Button variant="outline" className="w-full" onClick={() => inputRef.current?.click()}>
                Suallar (şəkil / PDF) əlavə et
              </Button>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleCreate} disabled={!baslik.trim() || saving} className="gap-1.5">
              {saving && <Loader2 className="size-4 animate-spin" />}
              Elan et
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : exams.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Hələ imtahan elan etməmisiniz.
        </p>
      ) : (
        <div className="space-y-2">
          {exams.map((ex) => (
            <button
              key={ex.id}
              onClick={() => setSelected(ex)}
              className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-3.5 text-left transition-colors hover:border-primary/40"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <FileCheck2 className="size-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{ex.baslik}</p>
                  <p className="text-xs text-muted-foreground">{ex.gonderilenSay ?? 0} cavab göndərilib</p>
                </div>
              </div>
              {(ex.yoxlanilmamisSay ?? 0) > 0 && (
                <Badge className="shrink-0">{ex.yoxlanilmamisSay} yoxlanılmamış</Badge>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ExamSubmissions({ exam, onBack }: { exam: TeacherExamItem; onBack: () => void }) {
  const { sessionId } = useStore();
  const { toast } = useToast();
  const [subs, setSubs] = React.useState<ExamSubmissionDetail[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [active, setActive] = React.useState<ExamSubmissionDetail | null>(null);
  const [feedback, setFeedback] = React.useState("");
  const [netice, setNetice] = React.useState("");
  const [sending, setSending] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      setSubs(await api.getExamSubmissions(sessionId, exam.id));
    } finally {
      setLoading(false);
    }
  }, [sessionId, exam.id]);

  React.useEffect(() => {
    load();
  }, [load]);

  function openSubmission(s: ExamSubmissionDetail) {
    setActive(s);
    setFeedback(s.feedback || "");
    setNetice(s.netice || "");
  }

  async function handleSend() {
    if (!sessionId || !active || !feedback.trim()) return;
    setSending(true);
    try {
      const updated = await api.sendExamFeedback({ sessionId, examId: exam.id, submissionId: active.id, feedback: feedback.trim(), netice: netice.trim() || undefined });
      setSubs((prev) => prev.map((s) => (s.id === updated.id ? { ...updated, studentAdi: s.studentAdi } : s)));
      setActive(null);
      toast({ title: "Feedback göndərildi" });
    } catch (err) {
      toast({ variant: "destructive", title: "Xəta", description: err instanceof Error ? err.message : undefined });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ChevronLeft className="size-4" />
        </Button>
        <div>
          <h1 className="font-heading text-lg font-bold">{exam.baslik}</h1>
          <p className="text-xs text-muted-foreground">Göndərilən cavablar</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : subs.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Hələ heç bir tələbə cavab göndərməyib.
        </p>
      ) : (
        <div className="space-y-2">
          {subs.map((s) => (
            <button
              key={s.id}
              onClick={() => openSubmission(s)}
              className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-3.5 text-left transition-colors hover:border-primary/40"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{s.studentAdi}</p>
                <p className="truncate text-xs text-muted-foreground">{s.cavab || (s.sekil ? "📷 Şəkil" : "")}</p>
              </div>
              <Badge
                variant={s.status === "YOXLANILIB" ? "outline" : "default"}
                className={cn("shrink-0", s.status === "YOXLANILIB" && "text-emerald-600")}
              >
                {s.status === "YOXLANILIB" ? "Yoxlanılıb" : "Gözləyir"}
              </Badge>
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!active} onOpenChange={(v) => !v && setActive(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{active?.studentAdi} — cavab</DialogTitle>
          </DialogHeader>
          {active && (
            <div className="space-y-3">
              {active.cavab && <p className="whitespace-pre-wrap rounded-lg border border-border bg-muted/20 p-3 text-sm">{active.cavab}</p>}
              {active.sekil && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={active.sekil} alt="Cavab şəkli" className="max-h-64 rounded-lg border border-border object-contain" />
              )}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nəticə (məs. 8/10)</label>
                <Input value={netice} onChange={(e) => setNetice(e.target.value)} placeholder="8/10" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Feedback</label>
                <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={4} placeholder="Nə düzgün, nə səhv idi..." />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleSend} disabled={!feedback.trim() || sending} className="gap-1.5">
              {sending && <Loader2 className="size-4 animate-spin" />}
              Göndər
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
