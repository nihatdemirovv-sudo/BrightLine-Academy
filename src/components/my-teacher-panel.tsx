"use client";

import * as React from "react";
import {
  Loader2,
  CheckSquare,
  Square,
  Send,
  GraduationCap,
  Check,
  X as XIcon,
  Mail,
  LogOut,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import type { TaskDetail, TeacherMaterialItem, TeacherExamItem, TeacherRequestItem, MyTeacherItem } from "@/lib/api";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { FileAttachmentLink } from "@/components/file-attachment-link";
import { UnreadBadge } from "@/components/unread-badge";
import { useMarkSeen, useUnreadStore, useViewActive } from "@/lib/unread";

type MtTab = "tasks" | "materials" | "exams";

// Dəyər ARTANDA (yeni tapşırıq/material/imtahan gələndə) artan açar — siyahıları yenidən yükləmək üçün.
function useGrowthKey(value: number): number {
  const [key, setKey] = React.useState(0);
  const prev = React.useRef(value);
  React.useEffect(() => {
    if (value > prev.current) setKey((k) => k + 1);
    prev.current = value;
  }, [value]);
  return key;
}

export function MyTeacherPanel() {
  const [tab, setTab] = React.useState<MtTab>("tasks");
  const mt = useUnreadStore((s) => s.counts?.myTeacher);
  // Açıq olan tab ekrandadırsa — həmin tabın yeniliyi oxunmuş sayılır.
  useMarkSeen(`mt:${tab}`, useViewActive("myTeacher"), mt?.[tab]);
  const tasksKey = useGrowthKey(mt?.tasks ?? 0);
  const materialsKey = useGrowthKey(mt?.materials ?? 0);
  const examsKey = useGrowthKey(mt?.exams ?? 0);
  const requestsKey = useGrowthKey(mt?.requests ?? 0);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="font-heading text-xl font-bold flex items-center gap-2">
          <GraduationCap className="size-5 text-primary" />
          Müəllimim
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Müəlliminizin sizə açdığı tapşırıqlar, materiallar və imtahanlar.</p>
      </div>

      <MyTeacherCard reloadKey={requestsKey} />
      <PendingTeacherRequests reloadKey={requestsKey} />

      <Tabs value={tab} onValueChange={(v) => setTab(v as MtTab)}>
        <TabsList>
          <TabsTrigger value="tasks" className="gap-1.5">Tapşırıqlar<UnreadBadge count={tab === "tasks" ? 0 : mt?.tasks} /></TabsTrigger>
          <TabsTrigger value="materials" className="gap-1.5">Materiallar<UnreadBadge count={tab === "materials" ? 0 : mt?.materials} /></TabsTrigger>
          <TabsTrigger value="exams" className="gap-1.5">İmtahanlar<UnreadBadge count={tab === "exams" ? 0 : mt?.exams} /></TabsTrigger>
        </TabsList>
        <TabsContent value="tasks"><MyTasks reloadKey={tasksKey} /></TabsContent>
        <TabsContent value="materials"><MyMaterials reloadKey={materialsKey} /></TabsContent>
        <TabsContent value="exams"><MyExams reloadKey={examsKey} /></TabsContent>
      </Tabs>
    </div>
  );
}

function MyTeacherCard({ reloadKey }: { reloadKey: number }) {
  const { sessionId, setAppView, setDmPartnerId } = useStore();
  const { toast } = useToast();
  const [teachers, setTeachers] = React.useState<MyTeacherItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [leaving, setLeaving] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!sessionId) return;
    api.getMyTeacher(sessionId).then(setTeachers).finally(() => setLoading(false));
  }, [sessionId, reloadKey]);

  async function handleLeave(t: MyTeacherItem) {
    if (!sessionId) return;
    if (!window.confirm(`"${t.ad}" müəlliminin himayəsindən çıxmaq istədiyinizə əminsiniz?`)) return;
    setLeaving(t.teacherId);
    try {
      await api.leaveTeacher(sessionId, t.teacherId);
      setTeachers((prev) => prev.filter((x) => x.teacherId !== t.teacherId));
      toast({ title: "Müəllimin himayəsindən çıxdınız" });
    } catch (err) {
      toast({ variant: "destructive", title: "Xəta", description: err instanceof Error ? err.message : undefined });
    } finally {
      setLeaving(null);
    }
  }

  if (loading) return null;

  if (teachers.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
        Hələ heç bir müəllimə bağlı deyilsiniz — müəlliminiz sizi axtarıb sorğu göndərəndə burada görünəcək.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {teachers.map((t) => (
        <div key={t.teacherId} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <GraduationCap className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Müəlliminiz</p>
            <p className="truncate text-sm font-semibold">{t.ad}</p>
          </div>
          {t.muellimFenni && (
            <Badge variant="outline" className="ml-auto shrink-0">
              {t.muellimFenni}
            </Badge>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-8 shrink-0 gap-1 px-2 text-xs"
            onClick={() => {
              setDmPartnerId(t.teacherId);
              setAppView("messages");
            }}
          >
            <MessageCircle className="size-3.5" />
            Mesaj yaz
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 shrink-0 gap-1 px-2 text-xs text-muted-foreground hover:text-destructive"
            disabled={leaving === t.teacherId}
            onClick={() => handleLeave(t)}
          >
            {leaving === t.teacherId ? <Loader2 className="size-3.5 animate-spin" /> : <LogOut className="size-3.5" />}
            Ayrıl
          </Button>
        </div>
      ))}
    </div>
  );
}

function PendingTeacherRequests({ reloadKey }: { reloadKey: number }) {
  const { sessionId } = useStore();
  const { toast } = useToast();
  const [requests, setRequests] = React.useState<TeacherRequestItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [acting, setActing] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!sessionId) return;
    try {
      setRequests(await api.getPendingTeacherRequests(sessionId));
    } finally {
      setLoading(false);
    }
  }, [sessionId, reloadKey]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function respond(teacherId: string, accept: boolean) {
    if (!sessionId) return;
    setActing(teacherId);
    try {
      await api.respondToTeacherRequest({ sessionId, teacherId, accept });
      setRequests((prev) => prev.filter((r) => r.teacherId !== teacherId));
      toast({ title: accept ? "Sorğu qəbul edildi" : "Sorğu rədd edildi" });
    } catch (err) {
      toast({ variant: "destructive", title: "Xəta", description: err instanceof Error ? err.message : undefined });
    } finally {
      setActing(null);
    }
  }

  if (loading || requests.length === 0) return null;

  return (
    <div className="space-y-2 rounded-xl border border-primary/30 bg-primary/5 p-4">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-primary">
        <Mail className="size-4" />
        Gələn müəllim sorğuları
      </p>
      {requests.map((r) => (
        <div key={r.teacherId} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{r.teacherAdi}</p>
            <p className="text-xs text-muted-foreground">{r.muellimFenni || "Müəllim"} sizi tələbəsi kimi qəbul etmək istəyir</p>
          </div>
          <div className="flex shrink-0 gap-1.5">
            <Button size="sm" variant="outline" className="h-8 gap-1 px-2 text-xs text-destructive" disabled={acting === r.teacherId} onClick={() => respond(r.teacherId, false)}>
              <XIcon className="size-3.5" /> Rədd et
            </Button>
            <Button size="sm" className="h-8 gap-1 px-2 text-xs" disabled={acting === r.teacherId} onClick={() => respond(r.teacherId, true)}>
              {acting === r.teacherId ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />} Qəbul et
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function MyTasks({ reloadKey }: { reloadKey: number }) {
  const { sessionId } = useStore();
  const { toast } = useToast();
  const [tasks, setTasks] = React.useState<TaskDetail[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      setTasks(await api.getMyTasks(sessionId));
    } finally {
      setLoading(false);
    }
  }, [sessionId, reloadKey]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function toggleItem(taskId: string, itemId: string) {
    if (!sessionId) return;
    try {
      const updated = await api.toggleMyTaskItem(sessionId, taskId, itemId);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? { ...updated, muellimAdi: t.muellimAdi } : t)));
    } catch (err) {
      toast({ variant: "destructive", title: "Xəta", description: err instanceof Error ? err.message : undefined });
    }
  }

  async function addComment(taskId: string, mesaj: string) {
    if (!sessionId) return;
    const updated = await api.addTaskComment(sessionId, taskId, mesaj);
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? { ...updated, muellimAdi: t.muellimAdi } : t)));
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Hələ heç bir müəllimin tələbəsi deyilsiniz — tapşırıq görünmür.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((t) => (
        <StudentTaskCard key={t.id} task={t} onToggle={toggleItem} onComment={addComment} />
      ))}
    </div>
  );
}

function StudentTaskCard({
  task,
  onToggle,
  onComment,
}: {
  task: TaskDetail;
  onToggle: (taskId: string, itemId: string) => void;
  onComment: (taskId: string, mesaj: string) => Promise<void>;
}) {
  const [commentText, setCommentText] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const tamamSay = task.items.filter((i) => i.tamam).length;

  async function handleComment() {
    if (!commentText.trim()) return;
    setSending(true);
    try {
      await onComment(task.id, commentText.trim());
      setCommentText("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{task.baslik}</p>
          {task.muellimAdi && <p className="text-xs text-muted-foreground">{task.muellimAdi} tərəfindən</p>}
        </div>
        {task.items.length > 0 && <Badge variant="outline" className="shrink-0">{tamamSay}/{task.items.length}</Badge>}
      </div>

      {task.items.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {task.items.map((it) => (
            <li key={it.id}>
              <button onClick={() => onToggle(task.id, it.id)} className="flex items-center gap-2 text-left text-sm">
                {it.tamam ? <CheckSquare className="size-4 shrink-0 text-primary" /> : <Square className="size-4 shrink-0 text-muted-foreground" />}
                <span className={cn(it.tamam && "text-muted-foreground line-through")}>{it.metn}</span>
              </button>
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

      <div className="mt-4 space-y-2 border-t border-border pt-3">
        {task.comments.map((c) => (
          <div key={c.id} className="text-sm">
            <span className={cn("font-medium", c.authorRol === "muellim" && "text-primary")}>
              {c.authorRol === "muellim" ? c.authorAdi : "Sən"}
              {c.authorRol === "muellim" && <Badge variant="outline" className="ml-1.5 h-4 px-1 text-[10px]">Müəllim</Badge>}
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
          <Button size="icon" className="shrink-0" onClick={handleComment} disabled={!commentText.trim() || sending}>
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

function MyMaterials({ reloadKey }: { reloadKey: number }) {
  const { sessionId } = useStore();
  const [materials, setMaterials] = React.useState<TeacherMaterialItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!sessionId) return;
    api.getMyTeacherMaterials(sessionId).then(setMaterials).finally(() => setLoading(false));
  }, [sessionId, reloadKey]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (materials.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Hələ heç bir material paylaşılmayıb.
      </p>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {materials.map((m) => (
        <FileAttachmentLink key={m.id} data={m.data} ad={m.ad} tip={m.tip} className="w-full" />
      ))}
    </div>
  );
}

function MyExams({ reloadKey }: { reloadKey: number }) {
  const { sessionId } = useStore();
  const { toast } = useToast();
  const [exams, setExams] = React.useState<TeacherExamItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      setExams(await api.getMyExams(sessionId));
    } finally {
      setLoading(false);
    }
  }, [sessionId, reloadKey]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(examId: string) {
    if (!sessionId) return;
    const cavab = answers[examId]?.trim();
    if (!cavab) return;
    setSubmitting(examId);
    try {
      const submission = await api.submitMyExam({ sessionId, examId, cavab });
      setExams((prev) => prev.map((ex) => (ex.id === examId ? { ...ex, menimCavabim: submission } : ex)));
      toast({ title: "Cavabınız göndərildi" });
    } catch (err) {
      toast({ variant: "destructive", title: "Xəta", description: err instanceof Error ? err.message : undefined });
    } finally {
      setSubmitting(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (exams.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Hələ elan olunmuş imtahan yoxdur.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {exams.map((ex) => {
        const own = ex.menimCavabim;
        return (
          <div key={ex.id} className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-semibold">{ex.baslik}</p>
            {ex.telimat && <p className="mt-1 text-sm text-muted-foreground">{ex.telimat}</p>}
            {ex.sened && (
              ex.sened.startsWith("data:image") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ex.sened} alt="İmtahan sənədi" className="mt-2 max-h-64 rounded-lg border border-border object-contain" />
              ) : (
                <FileAttachmentLink data={ex.sened} ad="Sual sənədi" tip="pdf" className="mt-2 w-fit" />
              )
            )}

            {!own ? (
              <div className="mt-3 space-y-2">
                <Textarea
                  placeholder="Cavabınızı yazın..."
                  value={answers[ex.id] || ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [ex.id]: e.target.value }))}
                  rows={3}
                />
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => handleSubmit(ex.id)}
                  disabled={!answers[ex.id]?.trim() || submitting === ex.id}
                >
                  {submitting === ex.id && <Loader2 className="size-4 animate-spin" />}
                  Göndər
                </Button>
              </div>
            ) : (
              <div className="mt-3 space-y-2 rounded-lg border border-border bg-muted/20 p-3">
                <div className="flex items-center gap-2">
                  <Badge variant={own.status === "YOXLANILIB" ? "outline" : "default"} className={cn(own.status === "YOXLANILIB" && "text-emerald-600")}>
                    {own.status === "YOXLANILIB" ? "Yoxlanılıb" : "Göndərildi, gözləyir"}
                  </Badge>
                  {own.netice && <span className="text-sm font-semibold">{own.netice}</span>}
                </div>
                <p className="text-sm text-muted-foreground">Cavabınız: {own.cavab}</p>
                {own.feedback && <p className="text-sm">{own.feedback}</p>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
