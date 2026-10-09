"use client";

import * as React from "react";
import {
  Search,
  UserPlus,
  UserMinus,
  ChevronLeft,
  Loader2,
  Plus,
  X,
  Paperclip,
  Send,
  CheckSquare,
  Square,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import type { TeacherStudentSearchItem, TeacherStudentSummary, TaskDetail, WeeklyActivityResult } from "@/lib/api";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { compressImageFile, readFileAsDataURL, MAX_PDF_BYTES, PDF_TOO_BIG_MSG } from "@/lib/media";
import { cn } from "@/lib/utils";
import { FileAttachmentLink } from "@/components/file-attachment-link";

const AY_ADLARI = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun", "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"];

function formatGunAdi(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffGun = Math.round((today.getTime() - target.getTime()) / 86400000);
  if (diffGun === 0) return "Bugün";
  if (diffGun === 1) return "Dünən";
  return `${d} ${AY_ADLARI[m - 1]}`;
}

function useFileAttachment() {
  const { toast } = useToast();
  const [file, setFile] = React.useState<{ base64: string; ad: string; tip: string } | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = "";
    if (!f) return;
    const isImage = f.type.startsWith("image/");
    const isPdf = f.type === "application/pdf";
    if (!isImage && !isPdf) {
      toast({ variant: "destructive", title: "Dəstəklənməyən fayl", description: "Yalnız şəkil və ya PDF." });
      return;
    }
    if (isPdf && f.size > MAX_PDF_BYTES) {
      toast({ variant: "destructive", title: "Fayl yüklənmədi", description: PDF_TOO_BIG_MSG });
      return;
    }
    try {
      const base64 = isImage ? await compressImageFile(f) : await readFileAsDataURL(f);
      setFile({ base64, ad: f.name, tip: isImage ? "image" : "pdf" });
    } catch {
      toast({ variant: "destructive", title: "Fayl emal edilə bilmədi" });
    }
  }

  return { file, setFile, inputRef, handleChange };
}

// ==================== TƏLƏBƏ AXTAR (ayrı nav bölməsi) ====================
// BÜTÜN tələbələri axtarıb himayə sorğusu göndərmək üçün. Fənn/qrup filtri YOXDUR.
export function TeacherStudentSearch() {
  const { sessionId } = useStore();
  const { toast } = useToast();
  const [roster, setRoster] = React.useState<TeacherStudentSummary[]>([]);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<TeacherStudentSearchItem[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [searched, setSearched] = React.useState(false);

  const loadRoster = React.useCallback(async () => {
    if (!sessionId) return;
    try {
      setRoster(await api.getTeacherStudents(sessionId));
    } catch {
      /* sükutla keç */
    }
  }, [sessionId]);

  React.useEffect(() => { loadRoster(); }, [loadRoster]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionId || query.trim().length < 2) return;
    setSearching(true);
    try {
      setResults(await api.searchStudents(sessionId, query.trim()));
      setSearched(true);
    } catch (err) {
      toast({ variant: "destructive", title: "Axtarış xətası", description: err instanceof Error ? err.message : undefined });
    } finally {
      setSearching(false);
    }
  }

  const statusById = React.useMemo(() => {
    const m = new Map<string, string>();
    roster.forEach((s) => m.set(s.id, s.status || "QEBUL_EDILIB"));
    return m;
  }, [roster]);

  async function handleSendRequest(s: TeacherStudentSearchItem) {
    if (!sessionId) return;
    try {
      const res = await api.addTeacherStudent(sessionId, s.id);
      if (res.status === "GOZLEYIR") {
        toast({ title: "Sorğu göndərildi", description: `${s.ad} sorğunuzu qəbul edəndə tələbəniz olacaq.` });
      } else {
        toast({ title: "Artıq tələbənizdir" });
      }
      loadRoster();
    } catch (err) {
      toast({ variant: "destructive", title: "Xəta", description: err instanceof Error ? err.message : undefined });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-xl font-bold">Tələbə axtar</h1>
        <p className="mt-1 text-sm text-muted-foreground">Bütün tələbələr arasında axtarıb himayə sorğusu göndərin. Tələbə sorğunu qəbul edəndə &quot;Tələbələrim&quot;ə düşür.</p>
      </div>

      <form onSubmit={handleSearch} className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="Tələbənin adını və ya istifadəçi adını yazın..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button type="submit" disabled={query.trim().length < 2 || searching} className="shrink-0 gap-1.5">
            {searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            Axtar
          </Button>
        </div>
        {results.length > 0 ? (
          <div className="mt-3 space-y-1.5">
            {results.map((r) => {
              const status = statusById.get(r.id);
              return (
                <div key={r.id} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.ad}</p>
                    <p className="truncate text-xs text-muted-foreground">@{r.username}{r.qrup ? ` · ${r.qrup} qrup` : ""}</p>
                  </div>
                  {status === "GOZLEYIR" ? (
                    <Badge variant="outline" className="shrink-0 text-[10px]">Sorğu göndərilib</Badge>
                  ) : status === "QEBUL_EDILIB" ? (
                    <Badge variant="outline" className="shrink-0 text-[10px] text-emerald-600">Tələbəniz</Badge>
                  ) : (
                    <Button size="sm" variant="outline" className="shrink-0 gap-1.5" onClick={() => handleSendRequest(r)}>
                      <UserPlus className="size-3.5" />
                      Sorğu göndər
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        ) : searched && !searching ? (
          <p className="mt-3 text-center text-sm text-muted-foreground">Axtarışa uyğun tələbə tapılmadı.</p>
        ) : null}
      </form>
    </div>
  );
}

// ==================== TƏLƏBƏLƏRİM (yalnız öz tələbələri) ====================
export function TeacherStudents() {
  const { sessionId } = useStore();
  const { toast } = useToast();
  const [students, setStudents] = React.useState<TeacherStudentSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<TeacherStudentSummary | null>(null);

  const loadStudents = React.useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      setStudents(await api.getTeacherStudents(sessionId));
    } catch {
      // sükutla keç — boş siyahı göstərilir
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  React.useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  async function handleRemove(s: TeacherStudentSummary, e: React.MouseEvent) {
    e.stopPropagation();
    if (!sessionId) return;
    if (!window.confirm(`"${s.ad}" adlı tələbəni siyahınızdan çıxarmaq istədiyinizə əminsiniz?`)) return;
    try {
      await api.removeTeacherStudent(sessionId, s.id);
      toast({ title: "Tələbə siyahınızdan çıxarıldı" });
      loadStudents();
    } catch (err) {
      toast({ variant: "destructive", title: "Xəta", description: err instanceof Error ? err.message : undefined });
    }
  }

  if (selected) {
    return <StudentDetail student={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-xl font-bold">Tələbələrim</h1>
        <p className="mt-1 text-sm text-muted-foreground">Qəbul edilmiş tələbələriniz. Üstünə basıb məlumatlarını görün, tapşırıq açın.</p>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">Tələbələrim ({students.length})</h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : students.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Hələ heç bir tələbə qəbul etməmisiniz. &quot;Tələbə axtar&quot; bölməsindən sorğu göndərin.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {students.map((s) => {
              const pending = s.status === "GOZLEYIR";
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card p-3.5 transition-colors hover:border-primary/40"
                >
                  <button
                    type="button"
                    onClick={() => (pending ? toast({ title: "Sorğu hələ qəbul edilməyib" }) : setSelected(s))}
                    className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{s.ad}</p>
                      <p className="truncate text-xs text-muted-foreground">@{s.username} · {s.qrup} qrup</p>
                    </div>
                    {pending ? (
                      <Badge variant="outline" className="shrink-0 text-[10px]">Gözləyir</Badge>
                    ) : (
                      <ChevronLeft className="size-4 shrink-0 rotate-180 text-muted-foreground" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleRemove(s, e)}
                    title={pending ? "Sorğunu ləğv et" : "Siyahıdan çıxar"}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <UserMinus className="size-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StudentDetail({ student, onBack }: { student: TeacherStudentSummary; onBack: () => void }) {
  const { sessionId } = useStore();
  const { toast } = useToast();
  const [tasks, setTasks] = React.useState<TaskDetail[]>([]);
  const [loadingTasks, setLoadingTasks] = React.useState(true);
  const [activity, setActivity] = React.useState<WeeklyActivityResult | null>(null);
  const [loadingActivity, setLoadingActivity] = React.useState(false);
  const [newTaskOpen, setNewTaskOpen] = React.useState(false);

  const loadTasks = React.useCallback(async () => {
    if (!sessionId) return;
    setLoadingTasks(true);
    try {
      setTasks(await api.getTeacherTasks(sessionId, student.id));
    } finally {
      setLoadingTasks(false);
    }
  }, [sessionId, student.id]);

  React.useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  async function loadActivity() {
    if (!sessionId || activity) return;
    setLoadingActivity(true);
    try {
      setActivity(await api.getStudentActivity(sessionId, student.id));
    } finally {
      setLoadingActivity(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ChevronLeft className="size-4" />
        </Button>
        <div>
          <h1 className="font-heading text-lg font-bold">{student.ad}</h1>
          <p className="text-xs text-muted-foreground">@{student.username} · {student.qrup} qrup</p>
        </div>
      </div>

      {/* Əlaqə məlumatları — yalnız öz (qəbul edilmiş) tələbələrin */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="mb-2 text-sm font-semibold">Əlaqə məlumatları</p>
        <div className="grid gap-x-6 gap-y-1.5 text-xs sm:grid-cols-2">
          <div className="flex justify-between gap-3 border-b border-border/50 py-1.5">
            <span className="text-muted-foreground">Ad və soyad</span>
            <span className="text-right font-medium">{student.ad}</span>
          </div>
          <div className="flex justify-between gap-3 border-b border-border/50 py-1.5">
            <span className="text-muted-foreground">İstifadəçi adı</span>
            <span className="text-right font-medium">@{student.username || "—"}</span>
          </div>
          <div className="flex justify-between gap-3 border-b border-border/50 py-1.5">
            <span className="text-muted-foreground">Telefon</span>
            <span className="break-all text-right font-medium">{student.telefon || "—"}</span>
          </div>
          <div className="flex justify-between gap-3 border-b border-border/50 py-1.5">
            <span className="text-muted-foreground">Email</span>
            <span className="break-all text-right font-medium">{student.email || "—"}</span>
          </div>
          <div className="flex justify-between gap-3 border-b border-border/50 py-1.5">
            <span className="text-muted-foreground">Doğum tarixi</span>
            <span className="text-right font-medium">{student.dogumTarixi || "—"}</span>
          </div>
          <div className="flex justify-between gap-3 border-b border-border/50 py-1.5">
            <span className="text-muted-foreground">Qrup</span>
            <span className="text-right font-medium">{student.qrup || "—"}</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="tasks" onValueChange={(v) => v === "activity" && loadActivity()}>
        <TabsList>
          <TabsTrigger value="tasks">Tapşırıqlar</TabsTrigger>
          <TabsTrigger value="activity">Həftəlik fəaliyyət</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <NewTaskDialog
            open={newTaskOpen}
            onOpenChange={setNewTaskOpen}
            studentId={student.id}
            onCreated={(t) => {
              setTasks((prev) => [t, ...prev]);
              toast({ title: "Tapşırıq yaradıldı" });
            }}
          />
          <Button onClick={() => setNewTaskOpen(true)} className="gap-1.5">
            <Plus className="size-4" />
            Yeni Tapşırıq
          </Button>

          {loadingTasks ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : tasks.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Hələ bu tələbəyə tapşırıq açılmayıb.
            </p>
          ) : (
            <div className="space-y-3">
              {tasks.map((t) => (
                <TeacherTaskCard
                  key={t.id}
                  task={t}
                  onUpdate={(updated) => setTasks((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))}
                  onDelete={(id) => setTasks((prev) => prev.filter((x) => x.id !== id))}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity">
          {loadingActivity ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : !activity || Object.keys(activity.gunler).length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Son 7 gündə heç bir fəaliyyət qeydə alınmayıb.
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(activity.gunler).map(([gun, entries]) => (
                <div key={gun} className="rounded-xl border border-border bg-card p-3.5">
                  <p className="text-sm font-semibold">{formatGunAdi(gun)}</p>
                  <ul className="mt-2 space-y-1.5">
                    {entries.map((e, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="shrink-0">{e.icon}</span>
                        <span className="text-muted-foreground">{e.mesaj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NewTaskDialog({
  open,
  onOpenChange,
  studentId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  studentId: string;
  onCreated: (t: TaskDetail) => void;
}) {
  const { sessionId } = useStore();
  const { toast } = useToast();
  const [baslik, setBaslik] = React.useState("");
  const [items, setItems] = React.useState<string[]>([""]);
  const [saving, setSaving] = React.useState(false);

  function updateItem(i: number, v: string) {
    setItems((prev) => prev.map((x, idx) => (idx === i ? v : x)));
  }
  function addItem() {
    setItems((prev) => [...prev, ""]);
  }
  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit() {
    if (!sessionId || !baslik.trim()) return;
    setSaving(true);
    try {
      const t = await api.createTask({
        sessionId,
        studentId,
        baslik: baslik.trim(),
        items: items.map((x) => x.trim()).filter(Boolean),
      });
      onCreated(t);
      setBaslik("");
      setItems([""]);
      onOpenChange(false);
    } catch (err) {
      toast({ variant: "destructive", title: "Xəta", description: err instanceof Error ? err.message : undefined });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yeni Tapşırıq</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Başlıq</label>
            <Textarea placeholder="Nə iş görəcəyini qısa izah et..." value={baslik} onChange={(e) => setBaslik(e.target.value)} rows={2} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Addımlar (checklist)</label>
            <div className="space-y-1.5">
              {items.map((it, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="w-5 shrink-0 text-xs text-muted-foreground">{i + 1}.</span>
                  <Input value={it} onChange={(e) => updateItem(i, e.target.value)} placeholder="Addımı yaz..." />
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)} className="shrink-0 text-muted-foreground hover:text-destructive">
                      <X className="size-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addItem}>
              <Plus className="size-3.5" />
              Addım əlavə et
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!baslik.trim() || saving} className="gap-1.5">
            {saving && <Loader2 className="size-4 animate-spin" />}
            Yarat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TeacherTaskCard({
  task,
  onUpdate,
  onDelete,
}: {
  task: TaskDetail;
  onUpdate: (t: TaskDetail) => void;
  onDelete: (id: string) => void;
}) {
  const { sessionId } = useStore();
  const { toast } = useToast();
  const [commentText, setCommentText] = React.useState("");
  const [sendingComment, setSendingComment] = React.useState(false);
  const attachment = useFileAttachment();
  const [uploading, setUploading] = React.useState(false);
  const tamamSay = task.items.filter((i) => i.tamam).length;

  async function handleAttach() {
    if (!sessionId || !attachment.file) return;
    setUploading(true);
    try {
      const updated = await api.addTaskAttachment({
        sessionId,
        taskId: task.id,
        ad: attachment.file.ad,
        tip: attachment.file.tip,
        data: attachment.file.base64,
      });
      onUpdate(updated);
      attachment.setFile(null);
    } catch (err) {
      toast({ variant: "destructive", title: "Yükləmə xətası", description: err instanceof Error ? err.message : undefined });
    } finally {
      setUploading(false);
    }
  }

  async function handleComment() {
    if (!sessionId || !commentText.trim()) return;
    setSendingComment(true);
    try {
      const updated = await api.addTaskComment(sessionId, task.id, commentText.trim());
      onUpdate(updated);
      setCommentText("");
    } catch (err) {
      toast({ variant: "destructive", title: "Xəta", description: err instanceof Error ? err.message : undefined });
    } finally {
      setSendingComment(false);
    }
  }

  async function handleDelete() {
    if (!sessionId || !window.confirm("Bu tapşırığı silmək istədiyinizə əminsiniz?")) return;
    try {
      await api.deleteTeacherTask(sessionId, task.id);
      onDelete(task.id);
    } catch (err) {
      toast({ variant: "destructive", title: "Xəta", description: err instanceof Error ? err.message : undefined });
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold">{task.baslik}</p>
        <div className="flex shrink-0 items-center gap-2">
          {task.items.length > 0 && (
            <Badge variant="outline" className="shrink-0">{tamamSay}/{task.items.length}</Badge>
          )}
          <button onClick={handleDelete} className="text-muted-foreground hover:text-destructive" title="Sil">
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      {task.items.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {task.items.map((it) => (
            <li key={it.id} className="flex items-center gap-2 text-sm">
              {it.tamam ? <CheckSquare className="size-4 text-primary" /> : <Square className="size-4 text-muted-foreground" />}
              <span className={cn(it.tamam && "text-muted-foreground line-through")}>{it.metn}</span>
            </li>
          ))}
        </ul>
      )}

      {task.attachments.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {task.attachments.map((a) => (
            <FileAttachmentLink key={a.id} data={a.data} ad={a.ad} tip={a.tip} />
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <input ref={attachment.inputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={attachment.handleChange} />
        <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => attachment.inputRef.current?.click()}>
          <Paperclip className="size-3.5" />
          Fayl əlavə et
        </Button>
        {attachment.file && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="max-w-[8rem] truncate">{attachment.file.ad}</span>
            <button onClick={() => attachment.setFile(null)}><X className="size-3.5" /></button>
            <Button size="sm" onClick={handleAttach} disabled={uploading} className="h-6 gap-1 px-2 text-xs">
              {uploading && <Loader2 className="size-3 animate-spin" />}
              Göndər
            </Button>
          </div>
        )}
      </div>

      {/* Comment thread */}
      <div className="mt-4 space-y-2 border-t border-border pt-3">
        {task.comments.map((c) => (
          <div key={c.id} className="text-sm">
            <span className={cn("font-medium", c.authorRol === "muellim" && "text-primary")}>
              {c.authorAdi}{c.authorRol === "muellim" && <Badge variant="outline" className="ml-1.5 h-4 px-1 text-[10px]">Müəllim</Badge>}
            </span>
            <span className="text-muted-foreground"> — {c.mesaj}</span>
          </div>
        ))}
        <div className="flex gap-1.5">
          <Input
            placeholder="Şərh yaz..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleComment();
              }
            }}
          />
          <Button size="icon" className="shrink-0" onClick={handleComment} disabled={!commentText.trim() || sendingComment}>
            {sendingComment ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
