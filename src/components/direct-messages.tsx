"use client";

import * as React from "react";
import {
  ChevronLeft,
  GraduationCap,
  ImageIcon,
  Loader2,
  MessageCircle,
  Search,
  Send,
  Trash2,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UnreadBadge } from "@/components/unread-badge";
import { openDataUriInNewTab } from "@/components/file-attachment-link";
import { api, type DmConversation, type DmThread } from "@/lib/api";
import { compressImageFile } from "@/lib/media";
import { useStore } from "@/lib/store";
import { useMarkSeen, useUnreadStore, useViewActive } from "@/lib/unread";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

function relativeTime(iso?: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "indi";
  if (min < 60) return `${min} dəq`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} saat`;
  const day = Math.floor(hr / 24);
  return `${day} gün`;
}

function clockTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function initials(ad: string): string {
  return ad
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Müəllim ↔ tələbə şəxsi söhbəti. Həm tələbə qabığında ("Mesajlar"), həm müəllim panelində
 * istifadə olunur — siyahıdakı həmsöhbətlər yalnız qəbul edilmiş himayə əlaqəsi olanlardır.
 */
export function DirectMessages() {
  const { sessionId, student, dmPartnerId, setDmPartnerId } = useStore();
  const { toast } = useToast();
  const teacherMe = student?.rol === "muellim";
  const [conversations, setConversations] = React.useState<DmConversation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const unreadTotal = useUnreadStore((s) => s.counts?.messages.total ?? 0);

  const load = React.useCallback(async () => {
    if (!sessionId) return;
    try {
      setConversations(await api.getDmConversations(sessionId));
    } catch {
      toast({ variant: "destructive", title: "Xəta", description: "Söhbətlər yüklənə bilmədi." });
    } finally {
      setLoading(false);
    }
  }, [sessionId, toast]);

  // Yeni mesaj gələndə (sayğac dəyişəndə) siyahıdakı son mesaj/badge-lər də yenilənsin.
  React.useEffect(() => {
    load();
  }, [load, unreadTotal]);

  // "Mesaj yaz" düyməsindən gələndə həmin söhbəti birbaşa aç.
  React.useEffect(() => {
    if (dmPartnerId) {
      setSelectedId(dmPartnerId);
      setDmPartnerId(null);
    }
  }, [dmPartnerId, setDmPartnerId]);

  const q = search.trim().toLowerCase();
  const visible = q ? conversations.filter((c) => c.ad.toLowerCase().includes(q)) : conversations;
  const selected = conversations.find((c) => c.partnerId === selectedId) || null;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Mesajlar</p>
        <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Şəxsi Mesajlar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {teacherMe
            ? "Tələbələrinizlə şəxsi yazışma — yalnız sorğunu qəbul etmiş tələbələr görünür."
            : "Müəlliminizlə şəxsi yazışma — yalnız sorğusunu qəbul etdiyiniz müəllimlər görünür."}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
        {/* Söhbət siyahısı — mobildə söhbət açıq olanda gizlənir */}
        <div className={cn("space-y-2", selectedId && "hidden lg:block")}>
          {conversations.length > 4 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Axtar..." className="rounded-full pl-9" />
            </div>
          )}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              <MessageCircle className="mx-auto mb-2 size-6 text-primary" />
              {teacherMe
                ? "Hələ sorğunuzu qəbul etmiş tələbə yoxdur. \"Tələbə axtar\" bölməsindən sorğu göndərin."
                : "Hələ heç bir müəllimə bağlı deyilsiniz. Müəlliminiz sorğu göndərəndə \"Müəllimim\" bölməsindən qəbul edin."}
            </div>
          ) : (
            visible.map((c) => (
              <button
                key={c.partnerId}
                onClick={() => setSelectedId(c.partnerId)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all",
                  selectedId === c.partnerId
                    ? "border-primary/40 bg-primary/5"
                    : "border-border/60 bg-card hover:border-primary/30 hover:shadow-sm"
                )}
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {c.muellimdi ? <GraduationCap className="size-4" /> : initials(c.ad) || <User className="size-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn("truncate text-sm", c.oxunmamis > 0 ? "font-bold" : "font-semibold")}>{c.ad}</span>
                    <span className="shrink-0 text-[10px] text-muted-foreground">{relativeTime(c.sonMesajVaxti)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn("truncate text-xs", c.oxunmamis > 0 ? "text-foreground" : "text-muted-foreground")}>
                      {c.sonMesaj ? `${c.sonGonderenMenem ? "Sən: " : ""}${c.sonMesaj}` : c.altBaslik || "Söhbətə başla"}
                    </span>
                    <UnreadBadge count={c.oxunmamis} />
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Söhbət */}
        <div className={cn(!selectedId && "hidden lg:block")}>
          {selectedId ? (
            <DmThreadView
              key={selectedId}
              partnerId={selectedId}
              fallbackName={selected?.ad}
              onBack={() => {
                setSelectedId(null);
                load();
              }}
            />
          ) : (
            <div className="flex h-full min-h-[20rem] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border text-center text-sm text-muted-foreground">
              <MessageCircle className="size-8 text-primary/60" />
              Söhbət seçin
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DmThreadView({ partnerId, fallbackName, onBack }: { partnerId: string; fallbackName?: string; onBack: () => void }) {
  const { sessionId, student } = useStore();
  const { toast } = useToast();
  const [thread, setThread] = React.useState<DmThread | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [text, setText] = React.useState("");
  const [image, setImage] = React.useState<string | null>(null);
  const [sending, setSending] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const active = useViewActive("messages");

  const meId = student?.id;
  const partner = thread ? (thread.teacher.id === meId ? thread.student : thread.teacher) : null;
  const messageCount = thread?.mesajlar.length ?? 0;

  // Söhbət açıq və ekrandadırsa — hər yeni mesajda "oxundu" işarələ.
  useMarkSeen(`dm:${partnerId}`, active, messageCount);

  React.useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    api
      .getDmThread(sessionId, partnerId)
      .then((t) => !cancelled && setThread(t))
      .catch((e) => toast({ variant: "destructive", title: "Söhbət açıla bilmədi", description: e instanceof Error ? e.message : "" }))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [sessionId, partnerId, toast]);

  React.useEffect(() => {
    if (!sessionId) return;
    const es = new EventSource(`/api/dm/${partnerId}/stream?sessionId=${encodeURIComponent(sessionId)}`);
    es.addEventListener("dm", (e) => {
      try {
        setThread(JSON.parse((e as MessageEvent).data) as DmThread);
      } catch {}
    });
    es.onerror = () => {};
    return () => es.close();
  }, [sessionId, partnerId]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageCount]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: "Yalnız şəkil faylı", description: "JPG, PNG, WEBP dəstəklənir." });
      return;
    }
    try {
      setImage(await compressImageFile(file));
    } catch {
      toast({ variant: "destructive", title: "Şəkil emal edilə bilmədi" });
    }
  }

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    if (!sessionId || sending || (!text.trim() && !image)) return;
    setSending(true);
    try {
      const t = await api.sendDm({ sessionId, partnerId, mesaj: text.trim(), sekil: image ?? undefined });
      setThread(t);
      setText("");
      setImage(null);
    } catch (err) {
      toast({ variant: "destructive", title: "Göndərilmədi", description: err instanceof Error ? err.message : "" });
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(messageId: string) {
    if (!sessionId || !window.confirm("Bu mesajı silmək istəyirsən?")) return;
    try {
      setThread(await api.deleteDm({ sessionId, partnerId, messageId }));
    } catch (err) {
      toast({ variant: "destructive", title: "Silinmədi", description: err instanceof Error ? err.message : "" });
    }
  }

  return (
    <div className="flex h-[calc(100vh-14rem)] min-h-[24rem] flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-3 border-b border-border px-3 py-2.5">
        <Button variant="ghost" size="icon" className="size-8 shrink-0 rounded-full lg:hidden" onClick={onBack}>
          <ChevronLeft className="size-4" />
        </Button>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {initials(partner?.ad || fallbackName || "?")}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{partner?.ad || fallbackName || "..."}</p>
          {partner?.altBaslik && <p className="truncate text-[11px] text-muted-foreground">{partner.altBaslik}</p>}
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : !thread || thread.mesajlar.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Hələ mesaj yoxdur — ilk mesajı yaz 👋</p>
        ) : (
          thread.mesajlar.map((m) => {
            const mine = m.senderId === meId;
            return (
              <div key={m.id} className={cn("group flex items-end gap-1.5", mine ? "justify-end" : "justify-start")}>
                {mine && !m.silinib && (
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="mb-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                    title="Sil"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                    mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-muted",
                    m.silinib && "italic opacity-60"
                  )}
                >
                  {m.sekil && (
                    <img
                      src={m.sekil}
                      alt="Şəkil"
                      className="mb-1 max-h-60 cursor-zoom-in rounded-lg object-contain"
                      onClick={() => openDataUriInNewTab(m.sekil!)}
                    />
                  )}
                  {m.mesaj && <p className="whitespace-pre-wrap break-words">{m.mesaj}</p>}
                  <p className={cn("mt-0.5 text-right text-[10px]", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                    {clockTime(m.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="border-t border-border p-2">
        {image && (
          <div className="mb-2 flex items-center gap-2 rounded-xl border border-border bg-muted/30 p-1.5">
            <img src={image} alt="" className="size-12 rounded-lg object-cover" />
            <span className="flex-1 text-xs text-muted-foreground">Şəkil əlavə edildi</span>
            <button type="button" onClick={() => setImage(null)} className="text-muted-foreground hover:text-destructive">
              <X className="size-4" />
            </button>
          </div>
        )}
        <div className="flex items-end gap-1.5">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <Button type="button" variant="ghost" size="icon" className="shrink-0 rounded-full" onClick={() => fileRef.current?.click()} title="Şəkil əlavə et">
            <ImageIcon className="size-4" />
          </Button>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Mesaj yaz..."
            rows={1}
            className="max-h-32 min-h-10 flex-1 resize-none rounded-2xl"
          />
          <Button type="submit" size="icon" className="shrink-0 rounded-full" disabled={sending || (!text.trim() && !image)}>
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </div>
      </form>
    </div>
  );
}
