"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Users,
  Plus,
  ChevronLeft,
  Loader2,
  Send,
  Lock,
  Paperclip,
  X,
  Mic,
  Square,
  Crown,
  GraduationCap,
  UserMinus,
  ShieldCheck,
  Trash2,
  Bell,
  BellOff,
  Pencil,
  Reply,
  Settings,
  Unlock,
  MoreVertical,
  Eraser,
  LogOut,
  Search,
  MessageSquare,
  Image as ImageIcon,
  Headphones,
  CheckSquare,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/lib/api";
import type { ChatGroupDetail, ChatGroupMessageItem, ChatGroupSummary, TeacherStudentSummary } from "@/lib/api";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { compressImageFile } from "@/lib/media";
import { cn } from "@/lib/utils";
import { UnreadBadge } from "@/components/unread-badge";
import { useMarkSeen, useUnreadStore, useViewActive } from "@/lib/unread";

const MAX_RECORD_SECONDS = 60;
const MAX_RECORD_MS = MAX_RECORD_SECONDS * 1000;
const RECORD_WARNING_SECONDS = 10;

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "indi";
  if (min < 60) return `${min} dəq əvvəl`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} saat əvvəl`;
  const day = Math.floor(hr / 24);
  return `${day} gün əvvəl`;
}

function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function ImageLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-white/10 text-white/90 transition-colors hover:bg-white/20"
        title="Bağla"
      >
        <X className="size-5" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Böyüdülmüş şəkil"
        className="max-h-full max-w-full rounded-lg object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

function useImageAttachment() {
  const { toast } = useToast();
  const [image, setImage] = React.useState<{ base64: string; preview: string } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: "Yalnız şəkil faylı", description: "JPG, PNG, WEBP dəstəklənir." });
      return;
    }
    try {
      // Şəkil serverə göndərilməzdən əvvəl brauzerdə kiçildilir (böyük fotolar → ~1 MB).
      const dataUrl = await compressImageFile(file);
      setImage({ base64: dataUrl, preview: dataUrl });
    } catch {
      toast({ variant: "destructive", title: "Şəkil emal edilə bilmədi" });
    }
  }

  return { image, setImage, fileInputRef, handleFileChange };
}

function ImagePicker({
  image,
  onClear,
  fileInputRef,
  onFileChange,
}: {
  image: { preview: string } | null;
  onClear: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0 rounded-full text-muted-foreground hover:text-primary"
        onClick={() => fileInputRef.current?.click()}
        title="Şəkil əlavə et"
      >
        <Paperclip className="size-4" />
      </Button>
      {image && (
        <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 py-1 pl-1 pr-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.preview} alt="Əlavə edilən şəkil" className="size-10 rounded-lg object-cover" />
          <button type="button" onClick={onClear} className="text-muted-foreground hover:text-destructive">
            <X className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function useAudioAttachment() {
  const { toast } = useToast();
  const [audio, setAudio] = React.useState<{ base64: string } | null>(null);
  const [recording, setRecording] = React.useState(false);
  const [recordingStartedAt, setRecordingStartedAt] = React.useState<number | null>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = React.useRef(false);

  function clearTimers() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }

  async function startRecording() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      toast({ variant: "destructive", title: "Mikrofon dəstəklənmir", description: "Brauzerin bunu dəstəkləmir." });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      cancelledRef.current = false;
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (cancelledRef.current) return;
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        if (blob.size > 8 * 1024 * 1024) {
          toast({ variant: "destructive", title: "Səs mesajı çox böyükdür" });
          return;
        }
        const reader = new FileReader();
        reader.onload = () => setAudio({ base64: reader.result as string });
        reader.readAsDataURL(blob);
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
      setRecordingStartedAt(Date.now());
      timeoutRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
        setRecording(false);
        clearTimers();
      }, MAX_RECORD_MS);
    } catch {
      toast({ variant: "destructive", title: "Mikrofona icazə verilmədi" });
    }
  }

  function stopRecording() {
    clearTimers();
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
    setRecording(false);
  }

  function cancelRecording() {
    cancelledRef.current = true;
    clearTimers();
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
    setRecording(false);
    setAudio(null);
  }

  React.useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === "recording") {
        cancelledRef.current = true;
        mediaRecorderRef.current.stop();
      }
      clearTimers();
    };
  }, []);

  return { audio, setAudio, recording, recordingStartedAt, startRecording, stopRecording, cancelRecording };
}

function RecordingBar({ startedAt, onCancel, onStop }: { startedAt: number; onCancel: () => void; onStop: () => void }) {
  const [elapsed, setElapsed] = React.useState(() => Math.floor((Date.now() - startedAt) / 1000));

  React.useEffect(() => {
    const iv = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(iv);
  }, [startedAt]);

  const remaining = Math.max(0, MAX_RECORD_SECONDS - elapsed);
  const warning = remaining <= RECORD_WARNING_SECONDS;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors",
        warning ? "border-destructive bg-destructive/10" : "border-destructive/20 bg-destructive/5"
      )}
    >
      <span className="relative flex size-3 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
        <span className="relative inline-flex size-3 rounded-full bg-destructive" />
      </span>
      <span className="flex-1 text-sm font-medium text-destructive">
        Səs qeydə alınır... {formatDuration(elapsed)}
        {warning && <span className="ml-1.5 font-semibold">· {remaining}san qaldı</span>}
      </span>
      <button
        type="button"
        onClick={onCancel}
        title="Ləğv et"
        className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </button>
      <button
        type="button"
        onClick={onStop}
        title="Dayandır"
        className="flex size-9 items-center justify-center rounded-full bg-destructive text-white transition-transform hover:scale-105"
      >
        <Square className="size-3.5" />
      </button>
    </div>
  );
}

function AudioRecorder({
  audio,
  onStart,
  onClear,
}: {
  audio: { base64: string } | null;
  onStart: () => void;
  onClear: () => void;
}) {
  if (audio) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 py-1 pl-2 pr-2">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <audio controls src={audio.base64} className="h-8 max-w-[180px]" />
        <button type="button" onClick={onClear} className="text-muted-foreground hover:text-destructive">
          <X className="size-3.5" />
        </button>
      </div>
    );
  }
  return (
    <Button type="button" variant="ghost" size="icon" className="shrink-0 rounded-full text-muted-foreground hover:text-primary" onClick={onStart} title="Səs mesajı qeyd et">
      <Mic className="size-4" />
    </Button>
  );
}

export function Groups() {
  const { sessionId } = useStore();
  const { toast } = useToast();
  const [groups, setGroups] = React.useState<ChatGroupSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [joiningGroup, setJoiningGroup] = React.useState<ChatGroupSummary | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const groupUnread = useUnreadStore((s) => s.counts?.groups.items);

  const loadGroups = React.useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const data = await api.getChatGroups(sessionId);
      setGroups(data);
    } catch {
      toast({ variant: "destructive", title: "Xəta", description: "Qruplar yüklənə bilmədi." });
    } finally {
      setLoading(false);
    }
  }, [sessionId, toast]);

  React.useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  if (selectedId) {
    return (
      <GroupThread
        id={selectedId}
        onBack={() => {
          setSelectedId(null);
          loadGroups();
        }}
      />
    );
  }

  const meninQruplarim = groups.filter((g) => g.daxilOlub);
  const digerQruplar = groups.filter((g) => !g.daxilOlub);

  const filteredMyGroups = searchQuery
    ? meninQruplarim.filter((g) => g.ad.toLowerCase().includes(searchQuery.toLowerCase()))
    : meninQruplarim;
  const filteredOtherGroups = searchQuery
    ? digerQruplar.filter((g) => g.ad.toLowerCase().includes(searchQuery.toLowerCase()))
    : digerQruplar;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Qruplar</p>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Qrup Söhbətləri</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Şifrə ilə qorunan qrup yarat və ya mövcud bir qrupa qoşul.
          </p>
        </div>
        <Button className="gap-1.5 rounded-full" onClick={() => setCreating((v) => !v)}>
          <Plus className="size-4" />
          Yeni Qrup Yarat
        </Button>
      </div>

      {creating && (
        <NewGroupForm
          onCancel={() => setCreating(false)}
          onCreated={(g) => {
            setCreating(false);
            setSelectedId(g.id);
            toast({ title: "Qrup yaradıldı" });
          }}
        />
      )}

      {joiningGroup && (
        <JoinGroupForm
          group={joiningGroup}
          onCancel={() => setJoiningGroup(null)}
          onJoined={(id) => {
            setJoiningGroup(null);
            setSelectedId(id);
          }}
        />
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Axtarış */}
          {groups.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Qrup axtar..."
                className="pl-9 rounded-full"
              />
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-muted-foreground">Mənim Qruplarım</h2>
              {meninQruplarim.length > 0 && (
                <Badge variant="secondary" className="text-[10px]">{meninQruplarim.length}</Badge>
              )}
            </div>
            {filteredMyGroups.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
                    <MessageSquare className="size-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Hələ heç bir qrupa qoşulmamısan</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Aşağıdan bir qrup tap və ya yeni yarat.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-2">
                {filteredMyGroups.map((g) => (
                  <GroupRow key={g.id} group={g} unread={groupUnread?.[g.id]} onClick={() => setSelectedId(g.id)} />
                ))}
              </div>
            )}
          </div>

          {filteredOtherGroups.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-muted-foreground">Bütün Qruplar</h2>
                <Badge variant="secondary" className="text-[10px]">{filteredOtherGroups.length}</Badge>
              </div>
              <div className="grid gap-2">
                {filteredOtherGroups.map((g) => (
                  <GroupRow key={g.id} group={g} onClick={() => setJoiningGroup(g)} locked />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GroupRow({ group, onClick, locked, unread }: { group: ChatGroupSummary; onClick: () => void; locked?: boolean; unread?: number }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-2xl border border-border/60 bg-card p-4 text-left transition-all hover:border-primary/30 hover:bg-primary/[0.02] hover:shadow-md"
    >
      <div className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary">
        <Users className="size-5" />
        {locked && (
          <div className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-background border border-border">
            <Lock className="size-2.5 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <span className="break-words text-sm font-semibold">{group.ad}</span>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="size-3" />
            {group.uzvSayi} üzv
          </span>
          <span>·</span>
          <span>{relativeTime(group.createdAt)}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {locked ? (
          <div className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
            Qoşul
          </div>
        ) : (
          <>
            <UnreadBadge count={unread} />
            <ChevronLeft className="size-4 rotate-180 text-muted-foreground" />
          </>
        )}
      </div>
    </motion.button>
  );
}

function NewGroupForm({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated: (g: ChatGroupDetail) => void;
}) {
  const { sessionId, student } = useStore();
  const { toast } = useToast();
  const [ad, setAd] = React.useState("");
  const [sifre, setSifre] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const isTeacher = student?.rol === "muellim";
  const [roster, setRoster] = React.useState<TeacherStudentSummary[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (!isTeacher || !sessionId) return;
    api.getTeacherStudents(sessionId).then((list) => setRoster(list.filter((s) => (s.status || "QEBUL_EDILIB") === "QEBUL_EDILIB"))).catch(() => {});
  }, [isTeacher, sessionId]);

  function toggleStudent(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionId || !ad.trim() || sifre.length < 4) return;
    setSending(true);
    try {
      const group = await api.createChatGroup({ sessionId, ad: ad.trim(), sifre, memberIds: Array.from(selectedIds) });
      onCreated(group);
    } catch (e) {
      toast({ variant: "destructive", title: "Yaradılmadı", description: e instanceof Error ? e.message : "" });
    } finally {
      setSending(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10">
              <Plus className="size-4 text-primary" />
            </div>
            Yeni Qrup Yarat
          </CardTitle>
          <CardDescription>Qrupun inzibatçısı sən olacaqsan — üzv çıxarma icazən olacaq.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="qrup-ad">Qrup adı</Label>
              <Input
                id="qrup-ad"
                value={ad}
                onChange={(e) => setAd(e.target.value)}
                placeholder="Məs. 11-A sinfi"
                maxLength={100}
                autoFocus
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qrup-sifre">Şifrə</Label>
              <Input
                id="qrup-sifre"
                type="text"
                value={sifre}
                onChange={(e) => setSifre(e.target.value)}
                placeholder="Ən azı 4 simvol"
                maxLength={100}
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground">Üzvlər qoşulmaq üçün bu şifrəni bilməlidir.</p>
            </div>
            {isTeacher && roster.length > 0 && (
              <div className="space-y-2">
                <Label>Tələbələrinizdən əlavə et (istəyə bağlı)</Label>
                <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-border p-2">
                  {roster.map((s) => (
                    <label key={s.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted/50">
                      <Checkbox checked={selectedIds.has(s.id)} onCheckedChange={() => toggleStudent(s.id)} />
                      <span className="truncate">{s.ad}</span>
                      <span className="truncate text-xs text-muted-foreground">@{s.username}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Seçilən tələbələr şifrəsiz birbaşa qrupa əlavə olunur.</p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={onCancel} className="rounded-full">
                Ləğv et
              </Button>
              <Button type="submit" disabled={sending || !ad.trim() || sifre.length < 4} className="gap-1.5 rounded-full">
                {sending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                Yarat
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function JoinGroupForm({
  group,
  onCancel,
  onJoined,
}: {
  group: ChatGroupSummary;
  onCancel: () => void;
  onJoined: (id: string) => void;
}) {
  const { sessionId } = useStore();
  const { toast } = useToast();
  const [sifre, setSifre] = React.useState("");
  const [sending, setSending] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionId || !sifre) return;
    setSending(true);
    try {
      await api.joinChatGroup({ sessionId, id: group.id, sifre });
      onJoined(group.id);
    } catch (e) {
      toast({ variant: "destructive", title: "Qoşula bilmədin", description: e instanceof Error ? e.message : "Şifrə yanlışdır." });
    } finally {
      setSending(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10">
              <Lock className="size-4 text-primary" />
            </div>
            &quot;{group.ad}&quot; qrupuna qoşul
          </CardTitle>
          <CardDescription>Bu qrupa qoşulmaq üçün şifrəni daxil et.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="join-sifre">Şifrə</Label>
              <Input
                id="join-sifre"
                type="text"
                value={sifre}
                onChange={(e) => setSifre(e.target.value)}
                placeholder="Qrup şifrəsi"
                autoFocus
                className="rounded-xl"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={onCancel} className="rounded-full">
                Ləğv et
              </Button>
              <Button type="submit" disabled={sending || !sifre} className="gap-1.5 rounded-full">
                {sending ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
                Qoşul
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function useGroupNotifications(groupId: string) {
  const storageKey = `group-notify-${groupId}`;
  const [enabled, setEnabled] = React.useState(false);

  React.useEffect(() => {
    try {
      setEnabled(localStorage.getItem(storageKey) === "1");
    } catch {}
  }, [storageKey]);

  async function toggle() {
    if (!enabled) {
      if (typeof Notification === "undefined") return;
      if (Notification.permission !== "granted") {
        const perm = await Notification.requestPermission();
        if (perm !== "granted") return;
      }
      try {
        localStorage.setItem(storageKey, "1");
      } catch {}
      setEnabled(true);
    } else {
      try {
        localStorage.setItem(storageKey, "0");
      } catch {}
      setEnabled(false);
    }
  }

  return { enabled, toggle };
}

function GroupSettingsPanel({
  group,
  onUpdated,
  onClose,
  onDisbanded,
}: {
  group: ChatGroupDetail;
  onUpdated: (g: ChatGroupDetail) => void;
  onClose: () => void;
  onDisbanded: () => void;
}) {
  const { sessionId } = useStore();
  const { toast } = useToast();
  const [ad, setAd] = React.useState(group.ad);
  const [sifre, setSifre] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [togglingClosed, setTogglingClosed] = React.useState(false);
  const [togglingMute, setTogglingMute] = React.useState(false);
  const [disbanding, setDisbanding] = React.useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionId || !ad.trim()) return;
    if (sifre && sifre.length < 4) {
      toast({ variant: "destructive", title: "Şifrə ən azı 4 simvol olmalıdır." });
      return;
    }
    setSaving(true);
    try {
      const data = await api.updateChatGroupSettings({ sessionId, id: group.id, ad: ad.trim(), sifre: sifre || undefined });
      onUpdated(data);
      setSifre("");
      toast({ title: "Ayarlar yadda saxlanıldı" });
    } catch (e) {
      toast({ variant: "destructive", title: "Xəta", description: e instanceof Error ? e.message : "" });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleClosed() {
    if (!sessionId) return;
    setTogglingClosed(true);
    try {
      const data = await api.setChatGroupClosed({ sessionId, id: group.id, qapali: !group.qapali });
      onUpdated(data);
    } catch (e) {
      toast({ variant: "destructive", title: "Xəta", description: e instanceof Error ? e.message : "" });
    } finally {
      setTogglingClosed(false);
    }
  }

  async function handleToggleMute() {
    if (!sessionId) return;
    setTogglingMute(true);
    try {
      const data = await api.muteChatGroup({ sessionId, id: group.id, yalnizAdminYaza: !group.yalnizAdminYaza });
      onUpdated(data);
    } catch (e) {
      toast({ variant: "destructive", title: "Xəta", description: e instanceof Error ? e.message : "" });
    } finally {
      setTogglingMute(false);
    }
  }

  async function handleDisband() {
    if (!sessionId) return;
    if (!window.confirm(`"${group.ad}" qrupunu tamamilə dağıtmaq istədiyinə əminsən? Bütün üzvlər və mesajlar həmişəlik silinəcək.`)) return;
    setDisbanding(true);
    try {
      await api.disbandChatGroup({ sessionId, id: group.id });
      toast({ title: "Qrup dağıdıldı" });
      onDisbanded();
    } catch (e) {
      toast({ variant: "destructive", title: "Xəta", description: e instanceof Error ? e.message : "" });
      setDisbanding(false);
    }
  }

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings className="size-4 text-muted-foreground" />
          Qrup Ayarları
        </CardTitle>
        <CardDescription>Bu ayarları yalnız İnzibatçı (qrupu yaradan) dəyişə bilər.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSave} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="settings-ad">Qrup adı</Label>
            <Input id="settings-ad" value={ad} onChange={(e) => setAd(e.target.value)} maxLength={100} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-sifre">Yeni şifrə</Label>
            <Input
              id="settings-sifre"
              value={sifre}
              onChange={(e) => setSifre(e.target.value)}
              placeholder="Boş saxla — şifrə dəyişməsin"
              maxLength={100}
              className="rounded-xl"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} className="rounded-full">
              Bağla
            </Button>
            <Button type="submit" disabled={saving || !ad.trim()} className="gap-1.5 rounded-full">
              {saving && <Loader2 className="size-4 animate-spin" />}
              Yadda saxla
            </Button>
          </div>
        </form>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
            <div>
              <p className="text-sm font-medium">{group.qapali ? "Qrup bağlıdır" : "Qrup açıqdır"}</p>
              <p className="text-xs text-muted-foreground">Bağlasan, heç kim mesaj yaza bilməz.</p>
            </div>
            <Button
              type="button"
              variant={group.qapali ? "default" : "outline"}
              size="sm"
              disabled={togglingClosed}
              onClick={handleToggleClosed}
              className="gap-1.5 rounded-full text-xs"
            >
              {togglingClosed ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : group.qapali ? (
                <Unlock className="size-3.5" />
              ) : (
                <Lock className="size-3.5" />
              )}
              {group.qapali ? "Aç" : "Bağla"}
            </Button>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
            <div>
              <p className="text-sm font-medium">{group.yalnizAdminYaza ? "Yalnız İnzibatçı yaza bilər" : "Hamı yaza bilər"}</p>
              <p className="text-xs text-muted-foreground">Aktiv olanda yalnız inzibatçı mesaj yaza bilər.</p>
            </div>
            <Button
              type="button"
              variant={group.yalnizAdminYaza ? "default" : "outline"}
              size="sm"
              disabled={togglingMute}
              onClick={handleToggleMute}
              className="gap-1.5 rounded-full text-xs"
            >
              {togglingMute ? <Loader2 className="size-3.5 animate-spin" /> : <Lock className="size-3.5" />}
              {group.yalnizAdminYaza ? "Hamıya aç" : "Məhdudlaşdır"}
            </Button>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-destructive">Qrupu dağıt</p>
              <p className="text-xs text-muted-foreground">Bütün üzvlər və mesajlar silinəcək. Geri qaytarıla bilməz.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disbanding}
              onClick={handleDisband}
              className="gap-1.5 rounded-full border-destructive/30 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              {disbanding ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
              Dağıt
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type ReplyTarget = { id: string; senderAdi: string; mesaj: string; sekilVar: boolean; sesVar: boolean };

function GroupThread({ id, onBack }: { id: string; onBack: () => void }) {
  const { sessionId, student } = useStore();
  const { toast } = useToast();
  const [group, setGroup] = React.useState<ChatGroupDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [reply, setReply] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [showMembers, setShowMembers] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [lightboxSrc, setLightboxSrc] = React.useState<string | null>(null);
  const [highlightedId, setHighlightedId] = React.useState<string | null>(null);
  const [replyTo, setReplyTo] = React.useState<ReplyTarget | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [myClearedAt, setMyClearedAt] = React.useState<string | null>(null);
  const [selectMode, setSelectMode] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const formRef = React.useRef<HTMLFormElement>(null);
  const { image, setImage, fileInputRef, handleFileChange } = useImageAttachment();
  const { audio, setAudio, recording, recordingStartedAt, startRecording, stopRecording, cancelRecording } = useAudioAttachment();
  const { enabled: notifyEnabled, toggle: toggleNotify } = useGroupNotifications(id);
  // Qrup açıq və ekrandadırsa — hər yeni mesajda oxunmamış sayğacı sıfırla.
  const viewActive = useViewActive("groups");
  useMarkSeen(`group:${id}`, viewActive, group?.mesajlar.length);

  const notifyEnabledRef = React.useRef(notifyEnabled);
  React.useEffect(() => { notifyEnabledRef.current = notifyEnabled; }, [notifyEnabled]);
  const studentRef = React.useRef(student);
  React.useEffect(() => { studentRef.current = student; }, [student]);
  const lastMessageIdRef = React.useRef<string | null>(null);

  function applyDirectUpdate(data: ChatGroupDetail) {
    setGroup(data);
    setMyClearedAt(data.menimClearedAt ?? null);
  }

  const load = React.useCallback(async () => {
    if (!sessionId) return;
    try {
      const data = await api.getChatGroup(sessionId, id);
      setGroup(data);
      setMyClearedAt(data.menimClearedAt ?? null);
      const last = data.mesajlar[data.mesajlar.length - 1];
      lastMessageIdRef.current = last ? last.id : null;
    } catch {
      toast({ variant: "destructive", title: "Xəta", description: "Qrup yüklənə bilmədi." });
    } finally {
      setLoading(false);
    }
  }, [sessionId, id, toast]);

  React.useEffect(() => { load(); }, [load]);

  // Real-vaxt yeniləmədən sonra şəxsi görünüşü səssizcə yenilə (qrupdan çıxarılıbsa xəta göstərmə).
  const refreshSilently = React.useCallback(async () => {
    if (!sessionId) return;
    try {
      applyDirectUpdate(await api.getChatGroup(sessionId, id));
    } catch {
      /* boş */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, id]);

  React.useEffect(() => {
    if (!sessionId) return;
    const es = new EventSource(`/api/groups/${id}/stream?sessionId=${encodeURIComponent(sessionId)}`);
    es.addEventListener("group", (e) => {
      try {
        // Yayım NEYTRALDIR (heç kimin "Məndən sil" filtri yoxdur) — onu birbaşa göstərmirik,
        // yalnız bildiriş üçün istifadə edib öz şəxsi görünüşümüzü serverdən yenidən alırıq.
        const data = JSON.parse((e as MessageEvent).data) as ChatGroupDetail;
        const last = data.mesajlar[data.mesajlar.length - 1];
        if (
          last &&
          last.id !== lastMessageIdRef.current &&
          !last.silinib &&
          last.senderId !== studentRef.current?.id &&
          notifyEnabledRef.current &&
          typeof document !== "undefined" &&
          document.hidden &&
          typeof Notification !== "undefined" &&
          Notification.permission === "granted"
        ) {
          new Notification(`${last.senderAdi} — ${data.ad}`, {
            body: last.sekil ? "📷 Şəkil göndərdi" : last.ses ? "🎤 Səs mesajı göndərdi" : last.mesaj,
          });
        }
        if (last) lastMessageIdRef.current = last.id;
        refreshSilently();
      } catch {}
    });
    es.onerror = () => {};
    return () => es.close();
  }, [sessionId, id, refreshSilently]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [group?.mesajlar.length, myClearedAt]);

  const canSubmit = editingId ? !!reply.trim() : !!reply.trim() || !!image || !!audio;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionId || !canSubmit || sending) return;

    if (editingId) {
      const mesajText = reply.trim();
      setSending(true);
      try {
        const data = await api.editChatGroupMessage({ sessionId, id, messageId: editingId, mesaj: mesajText });
        applyDirectUpdate(data);
        setEditingId(null);
        setReply("");
      } catch (e) {
        toast({ variant: "destructive", title: "Redaktə edilmədi", description: e instanceof Error ? e.message : "" });
      } finally {
        setSending(false);
      }
      return;
    }

    const mesajText = reply.trim();
    const sekilBase64 = image?.base64;
    const sesBase64 = audio?.base64;
    const cavabId = replyTo?.id;
    const optimisticId = `optimistic-${Date.now()}`;

    setReply("");
    setImage(null);
    setAudio(null);
    setReplyTo(null);
    setGroup((prev) =>
      prev
        ? {
            ...prev,
            mesajlar: [
              ...prev.mesajlar,
              {
                id: optimisticId,
                senderId: student?.id || "",
                senderAdi: student?.ad || "Sən",
                muellimdi: student?.rol === "muellim",
                mesaj: mesajText,
                sekil: sekilBase64,
                ses: sesBase64,
                createdAt: new Date().toISOString(),
                redaktaEdilib: false,
                silinib: false,
                cavab: replyTo
                  ? { id: replyTo.id, senderAdi: replyTo.senderAdi, mesaj: replyTo.mesaj, sekilVar: replyTo.sekilVar, sesVar: replyTo.sesVar }
                  : undefined,
              },
            ],
          }
        : prev
    );
    setSending(true);
    try {
      const data = await api.sendChatGroupMessage({ sessionId, id, mesaj: mesajText, sekil: sekilBase64, ses: sesBase64, cavabId });
      applyDirectUpdate(data);
    } catch (e) {
      setGroup((prev) => (prev ? { ...prev, mesajlar: prev.mesajlar.filter((m) => m.id !== optimisticId) } : prev));
      setReply(mesajText);
      toast({ variant: "destructive", title: "Göndərilmədi", description: e instanceof Error ? e.message : "" });
    } finally {
      setSending(false);
    }
  }

  function handleReplyKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  }

  function startEdit(m: ChatGroupMessageItem) {
    setEditingId(m.id);
    setReply(m.mesaj);
    setReplyTo(null);
    setImage(null);
    setAudio(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setReply("");
  }

  function startReply(m: ChatGroupMessageItem) {
    setReplyTo({ id: m.id, senderAdi: m.senderAdi, mesaj: m.mesaj, sekilVar: !!m.sekil, sesVar: !!m.ses });
    setEditingId(null);
  }

  function scrollToMessage(messageId: string) {
    const el = document.getElementById(`group-msg-${messageId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightedId(messageId);
    window.setTimeout(() => {
      setHighlightedId((cur) => (cur === messageId ? null : cur));
    }, 1500);
  }

  async function handleDeleteMessage(messageId: string) {
    if (!sessionId || !group) return;
    if (!window.confirm("Bu mesajı silmək istədiyinə əminsən?")) return;
    const previous = group;
    setGroup((prev) =>
      prev
        ? {
            ...prev,
            mesajlar: prev.mesajlar.map((m) =>
              m.id === messageId ? { ...m, silinib: true, mesaj: "Mesaj silindi", sekil: undefined, ses: undefined, cavab: undefined } : m
            ),
          }
        : prev
    );
    try {
      const data = await api.deleteChatGroupMessage({ sessionId, id, messageId });
      applyDirectUpdate(data);
    } catch (e) {
      setGroup(previous);
      toast({ variant: "destructive", title: "Xəta", description: e instanceof Error ? e.message : "" });
    }
  }

  async function handleHideMessage(messageId: string) {
    if (!sessionId || !group) return;
    const previous = group;
    setGroup((prev) => (prev ? { ...prev, mesajlar: prev.mesajlar.filter((m) => m.id !== messageId) } : prev));
    try {
      const data = await api.hideChatGroupMessage({ sessionId, id, messageId });
      applyDirectUpdate(data);
    } catch (e) {
      setGroup(previous);
      toast({ variant: "destructive", title: "Xəta", description: e instanceof Error ? e.message : "" });
    }
  }

  function enterSelectMode(messageId: string) {
    setSelectMode(true);
    setSelectedIds(new Set([messageId]));
    setReplyTo(null);
    setEditingId(null);
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedIds(new Set());
  }

  function toggleSelect(messageId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) next.delete(messageId);
      else next.add(messageId);
      if (next.size === 0) setSelectMode(false);
      return next;
    });
  }

  async function handleBulkDelete(mode: "me" | "everyone") {
    if (!sessionId || selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    if (mode === "everyone" && !window.confirm(`${ids.length} mesajı HƏR KƏSDƏN silmək istədiyinə əminsən?`)) return;
    try {
      for (const messageId of ids) {
        if (mode === "me") {
          await api.hideChatGroupMessage({ sessionId, id, messageId });
        } else {
          await api.deleteChatGroupMessage({ sessionId, id, messageId });
        }
      }
      const data = await api.getChatGroup(sessionId, id);
      applyDirectUpdate(data);
      exitSelectMode();
    } catch (e) {
      toast({ variant: "destructive", title: "Xəta", description: e instanceof Error ? e.message : "" });
    }
  }

  async function handleKick(memberId: string) {
    if (!sessionId) return;
    if (!window.confirm("Bu üzvü qrupdan çıxarmaq istədiyinə əminsən?")) return;
    try {
      const data = await api.kickChatGroupMember({ sessionId, id, memberId });
      applyDirectUpdate(data);
    } catch (e) {
      toast({ variant: "destructive", title: "Xəta", description: e instanceof Error ? e.message : "" });
    }
  }

  async function handleClearChat() {
    if (!sessionId) return;
    if (!window.confirm("Söhbəti təmizləmək istədiyinə əminsən? Bu YALNIZ sənin görünüşünü təmizləyəcək, digər üzvlərə təsir etməyəcək.")) return;
    try {
      const data = await api.clearChatGroup({ sessionId, id });
      applyDirectUpdate(data);
      toast({ title: "Söhbət təmizləndi" });
    } catch (e) {
      toast({ variant: "destructive", title: "Xəta", description: e instanceof Error ? e.message : "" });
    }
  }

  async function handleLeaveChat() {
    if (!sessionId) return;
    if (
      !window.confirm(
        "Bu qrupdan çıxmaq istədiyinə əminsən? Öz mesajların silinəcək və yenidən qoşulmaq üçün şifrə lazım olacaq."
      )
    )
      return;
    try {
      await api.leaveChatGroup({ sessionId, id });
      toast({ title: "Qrupdan çıxdın" });
      onBack();
    } catch (e) {
      toast({ variant: "destructive", title: "Xəta", description: e instanceof Error ? e.message : "" });
    }
  }

  const visibleMessages = React.useMemo(() => {
    if (!group) return [];
    if (!myClearedAt) return group.mesajlar;
    const threshold = new Date(myClearedAt).getTime();
    return group.mesajlar.filter((m) => new Date(m.createdAt).getTime() > threshold);
  }, [group, myClearedAt]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="size-4" /> Geri
        </button>
        <p className="py-10 text-center text-sm text-muted-foreground">Qrup tapılmadı</p>
      </div>
    );
  }

  const menInzibatciyam = student?.id === group.yaradiciId;
  const canDeleteEveryoneForAll =
    selectedIds.size > 0 &&
    Array.from(selectedIds).every((sid) => {
      const msg = group.mesajlar.find((mm) => mm.id === sid);
      return msg && (msg.senderId === student?.id || menInzibatciyam);
    });

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      {selectMode ? (
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="size-9 shrink-0 rounded-full" onClick={exitSelectMode} title="Ləğv et">
            <X className="size-4" />
          </Button>
          <p className="flex-1 text-sm font-semibold">{selectedIds.size} seçildi</p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-full"
              onClick={() => handleBulkDelete("me")}
              title="Məndən sil"
            >
              <EyeOff className="size-4" />
            </Button>
            {canDeleteEveryoneForAll && (
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full text-destructive hover:bg-destructive/10"
                onClick={() => handleBulkDelete("everyone")}
                title="Hər kəsdən sil"
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        </div>
      ) : (
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-card transition-colors hover:bg-muted">
          <ChevronLeft className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate font-heading text-lg font-bold">{group.ad}</h2>
            {group.qapali && (
              <Badge variant="outline" className="gap-1 border-destructive/40 text-[10px] text-destructive">
                <Lock className="size-2.5" /> Bağlı
              </Badge>
            )}
            {menInzibatciyam && (
              <Badge variant="outline" className="gap-1 border-amber-500/40 text-[10px] text-amber-600">
                <Crown className="size-2.5" /> İnzs
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{group.uzvler.length} üzv</p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-full"
            onClick={toggleNotify}
            title={notifyEnabled ? "Bildirişləri söndür" : "Bildirişləri aç"}
          >
            {notifyEnabled ? <Bell className="size-4" /> : <BellOff className="size-4 text-muted-foreground" />}
          </Button>
          <Button variant="ghost" size="icon" className="size-8 rounded-full" onClick={() => setShowMembers((v) => !v)} title="Üzvlər">
            <Users className="size-4" />
          </Button>
          {menInzibatciyam && (
            <Button variant="ghost" size="icon" className="size-8 rounded-full" onClick={() => setShowSettings((v) => !v)} title="Ayarlar">
              <Settings className="size-4" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8 rounded-full" title="Daha çox">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleClearChat} className="gap-2">
                <Eraser className="size-3.5" />
                Söhbəti təmizlə
              </DropdownMenuItem>
              {!menInzibatciyam && (
                <DropdownMenuItem onClick={handleLeaveChat} className="gap-2 text-destructive focus:text-destructive">
                  <LogOut className="size-3.5" />
                  Qrupdan çıx
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      )}

      {showSettings && menInzibatciyam && (
        <GroupSettingsPanel
          group={group}
          onUpdated={applyDirectUpdate}
          onClose={() => setShowSettings(false)}
          onDisbanded={onBack}
        />
      )}

      {showMembers && (
        <Card className="border-border/60">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Üzvlər ({group.uzvler.length})</h3>
              <Button variant="ghost" size="icon" className="size-6" onClick={() => setShowMembers(false)}>
                <X className="size-3.5" />
              </Button>
            </div>
            <div className="space-y-1">
              {group.uzvler.map((m) => {
                const initials = m.ad.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
                return (
                  <div key={m.studentId} className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 transition-colors hover:bg-muted/50">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-medium">{m.ad}</span>
                          {m.inzibatci && (
                            <Badge variant="outline" className="gap-0.5 border-amber-500/40 text-[9px] text-amber-600">
                              <Crown className="size-2" /> Admin
                            </Badge>
                          )}
                          {m.muellimdi && (
                            <Badge variant="outline" className="gap-0.5 border-primary/40 text-[9px] text-primary">
                              <GraduationCap className="size-2" /> Müəllim
                            </Badge>
                          )}
                          {m.studentId === student?.id && !m.inzibatci && (
                            <span className="text-[9px] text-muted-foreground">(sən)</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {menInzibatciyam && !m.inzibatci && (
                      <button
                        onClick={() => handleKick(m.studentId)}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-destructive transition-colors hover:bg-destructive/10"
                      >
                        <UserMinus className="size-3" /> Çıxar
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat area */}
      <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-1">
          {myClearedAt && visibleMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-muted mb-3">
                <MessageSquare className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Söhbəti təmizləmisən — yeni mesajlar buradan görünəcək.
              </p>
            </div>
          )}
          {visibleMessages.map((m) => (
            <MessageRow
              key={m.id}
              m={m}
              mine={m.senderId === student?.id}
              menInzibatciyam={menInzibatciyam}
              yaradiciId={group.yaradiciId}
              highlighted={highlightedId === m.id}
              selectMode={selectMode}
              selected={selectedIds.has(m.id)}
              onScrollToMessage={scrollToMessage}
              onImageClick={setLightboxSrc}
              onReply={startReply}
              onEdit={startEdit}
              onDeleteEveryone={handleDeleteMessage}
              onDeleteForMe={handleHideMessage}
              onEnterSelect={enterSelectMode}
              onToggleSelect={toggleSelect}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input area */}
      {group.qapali ? (
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <Lock className="size-4 shrink-0" />
          Bu qrup bağlıdır, mesaj yazıla bilməz.
        </div>
      ) : group.yalnizAdminYaza && !menInzibatciyam ? (
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <Lock className="size-4 shrink-0" />
          Bu qrupda yalnız İnzibatçı mesaj yaza bilər.
        </div>
      ) : (
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-2">
          {(replyTo || editingId) && !recording && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex items-center justify-between gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs"
            >
              <div className="min-w-0 flex-1">
                {editingId ? (
                  <p className="font-medium text-primary">Mesajı redaktə edirsən</p>
                ) : (
                  <>
                    <p className="font-medium text-primary">{replyTo?.senderAdi}-ə cavab</p>
                    <p className="truncate text-muted-foreground">
                      {replyTo?.mesaj || (replyTo?.sekilVar ? "📷 Şəkil" : replyTo?.sesVar ? "🎤 Səs mesajı" : "")}
                    </p>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={editingId ? cancelEdit : () => setReplyTo(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </motion.div>
          )}
          {recording && recordingStartedAt ? (
            <RecordingBar startedAt={recordingStartedAt} onCancel={cancelRecording} onStop={stopRecording} />
          ) : (
            <>
              <div className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm focus-within:border-primary/30 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                <ImagePicker image={image} onClear={() => setImage(null)} fileInputRef={fileInputRef} onFileChange={handleFileChange} />
                {!editingId && <AudioRecorder audio={audio} onStart={startRecording} onClear={() => setAudio(null)} />}
                <Textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={handleReplyKeyDown}
                  placeholder="Mesaj yaz..."
                  rows={1}
                  className="min-h-[36px] flex-1 resize-none border-0 bg-transparent p-1.5 text-sm shadow-none focus-visible:ring-0"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={sending || !canSubmit}
                  className="size-9 shrink-0 rounded-full"
                >
                  {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                </Button>
              </div>
              <p className="flex items-center gap-1.5 px-1 text-[10px] text-muted-foreground">
                <ShieldCheck className="size-3" /> Enter — göndər, Shift+Enter — yeni sətir
              </p>
            </>
          )}
        </form>
      )}

      {lightboxSrc && <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </div>
  );
}

// Bir mesaj sətri — WhatsApp-tərzi qarşılıqlı əlaqə: telefonda basılı-tut (uzun toxunma) menyu
// açır, mesajı sağa sürüşdürmək cavabla (reply) tetikləyir; kompüterdə mouse-u üstünə gətirəndə
// "Cavabla" + 3-nöqtə düymələri görünür, 3-nöqtəyə basanda eyni menyu (Sil/Seç/Redaktə/Cavabla) açılır.
function MessageRow({
  m,
  mine,
  menInzibatciyam,
  yaradiciId,
  highlighted,
  selectMode,
  selected,
  onScrollToMessage,
  onImageClick,
  onReply,
  onEdit,
  onDeleteEveryone,
  onDeleteForMe,
  onEnterSelect,
  onToggleSelect,
}: {
  m: ChatGroupMessageItem;
  mine: boolean;
  menInzibatciyam: boolean;
  yaradiciId: string;
  highlighted: boolean;
  selectMode: boolean;
  selected: boolean;
  onScrollToMessage: (id: string) => void;
  onImageClick: (src: string) => void;
  onReply: (m: ChatGroupMessageItem) => void;
  onEdit: (m: ChatGroupMessageItem) => void;
  onDeleteEveryone: (id: string) => void;
  onDeleteForMe: (id: string) => void;
  onEnterSelect: (id: string) => void;
  onToggleSelect: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [dragX, setDragX] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);
  const touchRef = React.useRef<{ startX: number; startY: number; timer: ReturnType<typeof setTimeout> | null; moved: boolean }>({
    startX: 0,
    startY: 0,
    timer: null,
    moved: false,
  });

  const canEdit = mine && !m.silinib;
  const canDeleteEveryone = (mine || menInzibatciyam) && !m.silinib;
  const initials = m.senderAdi.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  function clearPressTimer() {
    if (touchRef.current.timer) {
      clearTimeout(touchRef.current.timer);
      touchRef.current.timer = null;
    }
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (selectMode || m.silinib) return;
    const t = e.touches[0];
    touchRef.current = { startX: t.clientX, startY: t.clientY, timer: null, moved: false };
    touchRef.current.timer = setTimeout(() => {
      if (!touchRef.current.moved) {
        setMenuOpen(true);
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(15);
      }
    }, 480);
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (selectMode || m.silinib) return;
    const t = e.touches[0];
    const dx = t.clientX - touchRef.current.startX;
    const dy = t.clientY - touchRef.current.startY;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
      touchRef.current.moved = true;
      clearPressTimer();
    }
    if (Math.abs(dx) > Math.abs(dy) && dx > 0) {
      setDragging(true);
      setDragX(Math.min(dx, 70));
    }
  }

  function handleTouchEnd() {
    clearPressTimer();
    if (dragX > 45) onReply(m);
    setDragging(false);
    setDragX(0);
  }

  function handleRowClick() {
    if (selectMode && !m.silinib) onToggleSelect(m.id);
  }

  return (
    <div
      className={cn("flex gap-2 py-0.5", mine ? "flex-row-reverse" : "flex-row", selectMode && "cursor-pointer")}
      onClick={selectMode ? handleRowClick : undefined}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: dragX ? `translateX(${dragX}px)` : undefined,
        transition: dragging ? "none" : "transform 200ms ease-out",
      }}
    >
      {selectMode && (
        <div className="flex shrink-0 items-center">
          <Checkbox checked={selected} onCheckedChange={() => onToggleSelect(m.id)} className="pointer-events-none" />
        </div>
      )}
      {/* Avatar */}
      {!mine && (
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold mt-1",
            m.muellimdi ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
          )}
        >
          {initials}
        </div>
      )}
      <div className={cn("group flex flex-col gap-0.5 max-w-[75%]", mine ? "items-end" : "items-start")}>
        {/* Sender name */}
        {!mine && (
          <p className="flex items-center gap-1 px-1 text-[10px] font-semibold text-muted-foreground">
            {m.senderAdi}
            {m.senderId === yaradiciId && <Crown className="size-2.5 text-amber-500" />}
            {m.muellimdi && <GraduationCap className="size-2.5 text-primary" />}
          </p>
        )}
        {/* Bubble */}
        <div
          id={`group-msg-${m.id}`}
          className={cn(
            "rounded-2xl border px-3.5 py-2.5 text-sm shadow-sm transition-all duration-500",
            mine
              ? "rounded-tr-md border-primary/20 bg-primary text-primary-foreground"
              : m.muellimdi
                ? "rounded-tl-md border-primary/30 bg-primary/10"
                : "rounded-tl-md border-border bg-muted/50",
            highlighted && "!ring-2 !ring-primary/40 !ring-offset-2"
          )}
        >
          {m.silinib ? (
            <p className={cn("italic", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>{m.mesaj}</p>
          ) : (
            <>
              {m.cavab && (
                <button
                  type="button"
                  onClick={() => !selectMode && onScrollToMessage(m.cavab!.id)}
                  className={cn(
                    "mb-2 block w-full rounded-xl border-l-[3px] px-2.5 py-2 text-left text-xs transition-colors",
                    mine
                      ? "border-primary-foreground/40 bg-primary-foreground/10"
                      : "border-primary/40 bg-primary/5 hover:bg-primary/10"
                  )}
                >
                  <p className={cn("font-semibold", mine ? "text-primary-foreground" : "text-primary")}>{m.cavab.senderAdi}</p>
                  <p className={cn("truncate", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                    {m.cavab.mesaj || (m.cavab.sekilVar ? "📷 Şəkil" : m.cavab.sesVar ? "🎤 Səs mesajı" : "")}
                  </p>
                </button>
              )}
              {m.sekil && (
                <button
                  type="button"
                  onClick={() => !selectMode && onImageClick(m.sekil!)}
                  className={cn("block", (m.mesaj || m.ses) && "mb-2")}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.sekil}
                    alt="Əlavə edilən şəkil"
                    className="max-h-56 max-w-[240px] cursor-zoom-in rounded-xl transition-opacity hover:opacity-90"
                  />
                </button>
              )}
              {m.ses && (
                <div className={cn((m.mesaj || m.sekil) && "mb-1")}>
                  {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                  <audio controls src={m.ses} className="h-9 max-w-full" />
                </div>
              )}
              {m.mesaj && <p className="whitespace-pre-wrap leading-relaxed">{m.mesaj}</p>}
            </>
          )}
          <p className={cn("mt-1 text-[10px]", mine ? "text-primary-foreground/60" : "text-muted-foreground")}>
            {relativeTime(m.createdAt)}
            {m.redaktaEdilib && !m.silinib && " · redaktə"}
          </p>
        </div>
        {/* Hover (desktop) action buttons: Cavabla + 3-nöqtə menyu */}
        {!m.silinib && !selectMode && (
          <div
            className={cn(
              "flex items-center gap-0.5 px-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100",
              mine ? "flex-row-reverse" : "flex-row"
            )}
          >
            <button
              type="button"
              onClick={() => onReply(m)}
              title="Cavabla"
              className="flex size-6 items-center justify-center rounded-full text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
            >
              <Reply className="size-3" />
            </button>
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  title="Daha çox"
                  className="flex size-6 items-center justify-center rounded-full text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
                >
                  <MoreVertical className="size-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={mine ? "end" : "start"}>
                <DropdownMenuItem onClick={() => onReply(m)} className="gap-2">
                  <Reply className="size-3.5" />
                  Cavabla
                </DropdownMenuItem>
                {canEdit && (
                  <DropdownMenuItem onClick={() => onEdit(m)} className="gap-2">
                    <Pencil className="size-3.5" />
                    Redaktə et
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onEnterSelect(m.id)} className="gap-2">
                  <CheckSquare className="size-3.5" />
                  Seç
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDeleteForMe(m.id)} className="gap-2">
                  <EyeOff className="size-3.5" />
                  Məndən sil
                </DropdownMenuItem>
                {canDeleteEveryone && (
                  <DropdownMenuItem onClick={() => onDeleteEveryone(m.id)} className="gap-2 text-destructive focus:text-destructive">
                    <Trash2 className="size-3.5" />
                    Hər kəsdən sil
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
}
