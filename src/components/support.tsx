"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  LifeBuoy,
  Plus,
  ChevronLeft,
  Loader2,
  Send,
  MessageCircle,
  Clock,
  Paperclip,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  Shield,
  Image as ImageIcon,
  Headphones,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import type { SupportTicketDetail, SupportTicketStatus, SupportTicketSummary } from "@/lib/api";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { compressImageFile } from "@/lib/media";
import { cn } from "@/lib/utils";
import { UnreadBadge } from "@/components/unread-badge";
import { useMarkSeen, useUnreadStore, useViewActive } from "@/lib/unread";

function statusLabel(status: SupportTicketStatus) {
  if (status === "ACIQ") return "Cavab gözlənilir";
  if (status === "CAVABLANDI") return "Cavablandı";
  return "Bağlandı";
}

function statusIcon(status: SupportTicketStatus) {
  if (status === "ACIQ") return <AlertCircle className="size-3" />;
  if (status === "CAVABLANDI") return <CheckCircle2 className="size-3" />;
  return <Shield className="size-3" />;
}

function statusClass(status: SupportTicketStatus) {
  if (status === "ACIQ") return "border-amber-500/30 bg-amber-500/10 text-amber-600";
  if (status === "CAVABLANDI") return "border-accent/30 bg-accent/10 text-accent";
  return "border-border bg-muted text-muted-foreground";
}

function statusDot(status: SupportTicketStatus) {
  if (status === "ACIQ") return "bg-amber-500";
  if (status === "CAVABLANDI") return "bg-accent";
  return "bg-muted-foreground";
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

function ImageLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" onClick={onClose}>
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-white/10 text-white/90 transition-colors hover:bg-white/20"
        title="Bağla"
      >
        <X className="size-5" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Böyüdülmüş şəkil" className="max-h-full max-w-full rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
    </div>
  );
}

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

export function Support() {
  const { sessionId } = useStore();
  const { toast } = useToast();
  const [tickets, setTickets] = React.useState<SupportTicketSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const ticketUnread = useUnreadStore((s) => s.counts?.support.items);

  const loadTickets = React.useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const data = await api.getSupportTickets(sessionId);
      setTickets(data);
    } catch {
      toast({ variant: "destructive", title: "Xəta", description: "Müraciətlər yüklənə bilmədi." });
    } finally {
      setLoading(false);
    }
  }, [sessionId, toast]);

  React.useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  if (selectedId) {
    return (
      <TicketThread
        id={selectedId}
        onBack={() => {
          setSelectedId(null);
          loadTickets();
        }}
      />
    );
  }

  const openCount = tickets.filter((t) => t.status === "ACIQ").length;
  const answeredCount = tickets.filter((t) => t.status === "CAVABLANDI").length;
  const closedCount = tickets.filter((t) => t.status === "BAGLI").length;

  const filteredTickets = searchQuery
    ? tickets.filter((t) => t.movzu.toLowerCase().includes(searchQuery.toLowerCase()) || (t.sonMesaj && t.sonMesaj.toLowerCase().includes(searchQuery.toLowerCase())))
    : tickets;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Dəstək</p>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Dəstək Mərkəzi</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Problemini yaz, admin ən qısa zamanda cavab verəcək.
          </p>
        </div>
        <Button className="gap-1.5 rounded-full" onClick={() => setCreating((v) => !v)}>
          <Plus className="size-4" />
          Yeni Müraciət
        </Button>
      </div>

      {creating && (
        <NewTicketForm
          onCancel={() => setCreating(false)}
          onCreated={(t) => {
            setCreating(false);
            setTickets((prev) => [t, ...prev]);
            toast({ title: "Müraciət göndərildi", description: "Admin ən qısa zamanda cavab verəcək." });
          }}
        />
      )}

      {/* Stats */}
      {!loading && tickets.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{openCount}</p>
            <p className="text-[10px] font-medium text-muted-foreground">Açıq</p>
          </div>
          <div className="rounded-2xl border border-accent/20 bg-accent/5 p-3 text-center">
            <p className="text-2xl font-bold text-accent">{answeredCount}</p>
            <p className="text-[10px] font-medium text-muted-foreground">Cavablandı</p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/30 p-3 text-center">
            <p className="text-2xl font-bold text-muted-foreground">{closedCount}</p>
            <p className="text-[10px] font-medium text-muted-foreground">Bağlandı</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : tickets.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
              <Headphones className="size-7 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Hələ heç bir müraciətin yoxdur</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Bir problemin varsa, &quot;Yeni Müraciət&quot; düyməsi ilə yaz.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Axtarış */}
          {tickets.length > 2 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Müraciət axtar..."
                className="pl-9 rounded-full"
              />
            </div>
          )}

          <div className="grid gap-2">
            {filteredTickets.map((t) => (
              <motion.button
                key={t.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedId(t.id)}
                className="flex w-full items-start gap-4 rounded-2xl border border-border/60 bg-card p-4 text-left transition-all hover:border-primary/30 hover:bg-primary/[0.02] hover:shadow-md"
              >
                <div className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5">
                  <MessageCircle className="size-5 text-primary" />
                  <div className={cn("absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-card", statusDot(t.status))} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="break-words text-sm font-semibold">{t.movzu}</span>
                    <Badge variant="outline" className={cn("shrink-0 gap-1 text-[10px]", statusClass(t.status))}>
                      {statusIcon(t.status)}
                      {statusLabel(t.status)}
                    </Badge>
                  </div>
                  {t.sonMesaj && (
                    <p className="mt-1 break-words text-xs text-muted-foreground line-clamp-1">
                      {t.sonGonderen === "ADMIN" ? (
                        <span className="font-medium text-accent">Admin: </span>
                      ) : (
                        ""
                      )}
                      {t.sonMesaj}
                    </p>
                  )}
                  <div className="mt-1.5 flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="size-2.5" />
                      {relativeTime(t.updatedAt)}
                    </span>
                    {t.mesajSayi !== undefined && (
                      <span className="flex items-center gap-1">
                        <MessageCircle className="size-2.5" />
                        {t.mesajSayi} mesaj
                      </span>
                    )}
                  </div>
                </div>
                <UnreadBadge count={ticketUnread?.[t.id]} className="mt-1" />
                <ChevronLeft className="size-4 shrink-0 rotate-180 text-muted-foreground mt-1" />
              </motion.button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function NewTicketForm({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated: (t: SupportTicketSummary) => void;
}) {
  const { sessionId } = useStore();
  const { toast } = useToast();
  const [movzu, setMovzu] = React.useState("");
  const [mesaj, setMesaj] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const { image, setImage, fileInputRef, handleFileChange } = useImageAttachment();

  const canSubmit = !!movzu.trim() && (!!mesaj.trim() || !!image);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionId || !movzu.trim() || (!mesaj.trim() && !image)) return;
    setSending(true);
    try {
      const ticket = await api.createSupportTicket({
        sessionId,
        movzu: movzu.trim(),
        mesaj: mesaj.trim(),
        sekil: image?.base64,
      });
      onCreated(ticket);
      setMovzu("");
      setMesaj("");
      setImage(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Göndərilmədi", description: e instanceof Error ? e.message : "" });
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
            Yeni Müraciət
          </CardTitle>
          <CardDescription>Problemini qısa və aydın şəkildə təsvir et.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="movzu">Mövzu</Label>
              <Input
                id="movzu"
                value={movzu}
                onChange={(e) => setMovzu(e.target.value)}
                placeholder="Məs. Sual generatoru işləmir"
                maxLength={150}
                autoFocus
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mesaj">Probleminin təsviri</Label>
              <Textarea
                id="mesaj"
                value={mesaj}
                onChange={(e) => setMesaj(e.target.value)}
                placeholder="Nə baş verdi, hansı səhifədə, nə gözləyirdin..."
                rows={5}
                className="rounded-xl"
              />
            </div>
            <ImagePicker image={image} onClear={() => setImage(null)} fileInputRef={fileInputRef} onFileChange={handleFileChange} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={onCancel} className="rounded-full">
                Ləğv et
              </Button>
              <Button type="submit" disabled={sending || !canSubmit} className="gap-1.5 rounded-full">
                {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                Göndər
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function TicketThread({ id, onBack }: { id: string; onBack: () => void }) {
  const { sessionId } = useStore();
  const { toast } = useToast();
  const [ticket, setTicket] = React.useState<SupportTicketDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [reply, setReply] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [lightboxSrc, setLightboxSrc] = React.useState<string | null>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const formRef = React.useRef<HTMLFormElement>(null);
  const { image, setImage, fileInputRef, handleFileChange } = useImageAttachment();
  // Müraciət açıq və ekrandadırsa — admin cavabları oxunmuş sayılır.
  useMarkSeen(`support:${id}`, useViewActive("support"), ticket?.mesajlar.length);

  const load = React.useCallback(async () => {
    if (!sessionId) return;
    try {
      const data = await api.getSupportTicket(sessionId, id);
      setTicket(data);
    } catch {
      toast({ variant: "destructive", title: "Xəta", description: "Müraciət yüklənə bilmədi." });
    } finally {
      setLoading(false);
    }
  }, [sessionId, id, toast]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    if (!sessionId) return;
    const es = new EventSource(
      `/api/support/tickets/${id}/stream?sessionId=${encodeURIComponent(sessionId)}`
    );
    es.addEventListener("ticket", (e) => {
      try {
        setTicket(JSON.parse((e as MessageEvent).data));
      } catch {}
    });
    es.onerror = () => {};
    return () => es.close();
  }, [sessionId, id]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.mesajlar.length]);

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionId || (!reply.trim() && !image) || sending) return;
    const mesajText = reply.trim();
    const sekilBase64 = image?.base64;
    const optimisticId = `optimistic-${Date.now()}`;

    setReply("");
    setImage(null);
    setTicket((prev) =>
      prev
        ? {
            ...prev,
            mesajlar: [
              ...prev.mesajlar,
              { id: optimisticId, gonderen: "STUDENT", mesaj: mesajText, sekil: sekilBase64, createdAt: new Date().toISOString() },
            ],
          }
        : prev
    );
    setSending(true);
    try {
      const data = await api.replySupportTicket({ sessionId, id, mesaj: mesajText, sekil: sekilBase64 });
      setTicket(data);
    } catch (e) {
      setTicket((prev) =>
        prev ? { ...prev, mesajlar: prev.mesajlar.filter((m) => m.id !== optimisticId) } : prev
      );
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="size-4" /> Geri
        </button>
        <p className="py-10 text-center text-sm text-muted-foreground">Müraciət tapılmadı</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-card transition-colors hover:bg-muted">
          <ChevronLeft className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate font-heading text-lg font-bold">{ticket.movzu}</h2>
            <Badge variant="outline" className={cn("gap-1 text-[10px]", statusClass(ticket.status))}>
              {statusIcon(ticket.status)}
              {statusLabel(ticket.status)}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{ticket.mesajlar.length} mesaj</p>
        </div>
      </div>

      {/* Messages */}
      <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {ticket.mesajlar.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-muted mb-3">
                <MessageCircle className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Hələ mesaj yoxdur. İlk mesajı yaz.</p>
            </div>
          )}
          {ticket.mesajlar.map((m) => {
            const mine = m.gonderen === "STUDENT";
            return (
              <div key={m.id} className={cn("flex gap-2.5", mine ? "flex-row-reverse" : "flex-row")}>
                {/* Avatar */}
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold mt-1",
                    mine ? "bg-primary text-primary-foreground" : "bg-accent/15 text-accent"
                  )}
                >
                  {mine ? "Sən" : "Ad"}
                </div>
                <div className={cn("flex flex-col gap-0.5 max-w-[75%]", mine ? "items-end" : "items-start")}>
                  <p className="px-1 text-[10px] font-semibold text-muted-foreground">
                    {mine ? "Sən" : "Admin"}
                  </p>
                  <div
                    className={cn(
                      "rounded-2xl border px-3.5 py-2.5 text-sm shadow-sm",
                      mine
                        ? "rounded-tr-md border-primary/20 bg-primary text-primary-foreground"
                        : "rounded-tl-md border-border bg-muted/50"
                    )}
                  >
                    {m.sekil && (
                      <button type="button" onClick={() => setLightboxSrc(m.sekil!)} className={cn("block", m.mesaj && "mb-2")}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={m.sekil}
                          alt="Əlavə edilən şəkil"
                          className="max-h-56 max-w-[240px] cursor-zoom-in rounded-xl transition-opacity hover:opacity-90"
                        />
                      </button>
                    )}
                    {m.mesaj && <p className="whitespace-pre-wrap leading-relaxed">{m.mesaj}</p>}
                    <p className={cn("mt-1 text-[10px]", mine ? "text-primary-foreground/60" : "text-muted-foreground")}>
                      {relativeTime(m.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input area */}
      {ticket.status !== "BAGLI" ? (
        <form ref={formRef} onSubmit={handleReply} className="space-y-2">
          <div className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm focus-within:border-primary/30 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
            <ImagePicker image={image} onClear={() => setImage(null)} fileInputRef={fileInputRef} onFileChange={handleFileChange} />
            <Textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={handleReplyKeyDown}
              placeholder="Cavab yaz..."
              rows={1}
              className="min-h-[36px] flex-1 resize-none border-0 bg-transparent p-1.5 text-sm shadow-none focus-visible:ring-0"
            />
            <Button type="submit" size="icon" disabled={sending || (!reply.trim() && !image)} className="size-9 shrink-0 rounded-full">
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </div>
          <p className="flex items-center gap-1.5 px-1 text-[10px] text-muted-foreground">
            Enter — göndər, Shift+Enter — yeni sətir
          </p>
        </form>
      ) : (
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <Shield className="size-4 shrink-0" />
          Bu müraciət bağlanıb. Yeni cavab yaza bilməzsən.
        </div>
      )}

      {lightboxSrc && <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </div>
  );
}
