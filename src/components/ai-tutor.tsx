"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Send,
  Paperclip,
  Mic,
  X,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  Square,
  Trash2,
  Volume2,
  Search,
  AudioLines,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Markdown } from "@/components/markdown";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import type { ChatMessage } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { compressImageFile } from "@/lib/media";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Kvadrat tənliyi necə həll edilir?",
  "Tarixdən sual ver",
  "İngilis dilində Past Continuous izah et",
  "Kimyada redoks reaksiyaları nədir?",
  "Fizikada Newton qanunlarını qısaca izah et",
];

// AI Müəllimə HƏR sorğuda BÜTÜN söhbət tarixçəsi göndərilir (backend tərəfində kəsmə
// YOXDUR) — uzun söhbətlərdə (bir neçə ətraflı fizika/riyaziyyat izahından sonra) bu,
// AI provayderinin token limitini aşıb "AI cavab verə bilmədi" xətası yaradır (canlıda
// müşahidə edilib: Groq-un 8000 token/dəqiqə limiti, 9694 token tələb edilib → 413).
// Ən son mesajlardan geriyə doğru YIĞCAM simvol büdcəsinə sığana qədər saxlayırıq —
// ən azı SON mesajı hər zaman göndəririk (o tək başına böyük olsa belə).
const MAX_HISTORY_CHARS = 9000;
function trimHistoryForBudget(all: { role: string; content: string }[]): { role: string; content: string }[] {
  const trimmed: { role: string; content: string }[] = [];
  let total = 0;
  for (let i = all.length - 1; i >= 0; i--) {
    const len = all[i].content.length;
    if (total + len > MAX_HISTORY_CHARS && trimmed.length > 0) break;
    trimmed.unshift(all[i]);
    total += len;
  }
  return trimmed;
}

// === Səs (ASR/TTS) — brauzerin daxili Web Speech API-si, tamamilə pulsuz,
// backend-ə heç bir sorğu getmir. Dəstək brauzerdən asılıdır (Chrome/Edge yaxşı,
// Firefox/Safari məhdud) — bax: https://caniuse.com/speech-recognition
function getSpeechRecognitionCtor(): any {
  if (typeof window === "undefined") return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

// Azərbaycan dilində TTS səsi olan cihaz demək olar yoxdur — brauzer bu halda
// SƏSSİZCƏ default (adətən ingiliscə) səsə keçir, mətni "robot kimi" ingilis
// fonetikası ilə oxuyur. Türk səsi Azərbaycan mətnini xeyli təbii oxuyur
// (ortaq latın əlifbası/fonetika), ona görə əvvəlcə "az", tapılmasa "tr" axtarırıq.
function pickBestSpeechVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang?.toLowerCase().startsWith("az")) ||
    voices.find((v) => v.lang?.toLowerCase().startsWith("tr")) ||
    null
  );
}

// AI-nin cavabları çox vaxt LaTeX-lə doludur ($..$, \frac, \vec, ^, _ və s.).
// Bunları təmizləməsək TTS "dollar", "backslash", "vec F" kimi hərf-hərf/işarə-işarə
// oxumağa çalışır — "robot kimi" səslənmənin əsas səbəbi elə budur.
function convertLatexForSpeech(text: string): string {
  return text
    .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, "$1 bölünsün $2")
    .replace(/\\sqrt\[(\d+)\]\{([^{}]*)\}/g, "$1-ci dərəcədən kökü $2")
    .replace(/\\sqrt\{([^{}]*)\}/g, "kökü $1")
    .replace(/\\vec\{([^{}]*)\}/g, "$1 vektoru")
    .replace(/\\overline\{([^{}]*)\}/g, "$1")
    .replace(/\\left|\\right/g, "")
    .replace(/\\times/g, " vurulsun ")
    .replace(/\\cdot/g, " vurulsun ")
    .replace(/\\div/g, " bölünsün ")
    .replace(/\\pm/g, " üstəgəl-mənfi ")
    .replace(/\\leq/g, " kiçik-bərabər ")
    .replace(/\\geq/g, " böyük-bərabər ")
    .replace(/\\neq/g, " bərabər deyil ")
    .replace(/\\approx/g, " təxminən ")
    .replace(/\\rightarrow|\\to/g, " gedir ")
    .replace(/\\infty/g, " sonsuzluq ")
    .replace(/\\pi/g, " pi ")
    .replace(/\\alpha/g, " alfa ")
    .replace(/\\beta/g, " beta ")
    .replace(/\\theta/g, " teta ")
    .replace(/\\sum/g, " cəm ")
    .replace(/\\int/g, " inteqral ")
    .replace(/\^\{([^{}]*)\}/g, " üstü $1")
    .replace(/\^(\w)/g, " üstü $1")
    .replace(/_\{([^{}]*)\}/g, " indeks $1")
    .replace(/_(\w)/g, " indeks $1")
    .replace(/\$\$?/g, " ")
    .replace(/\\[a-zA-Z]+/g, " ")
    .replace(/[{}]/g, "");
}

function stripMarkdownForSpeech(text: string): string {
  return convertLatexForSpeech(text)
    .replace(/```[\s\S]*?```/g, " (kod bloku) ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[.*?\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Axtarış nəticəsində query-ni highlight et (case-insensitive)
function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <span>{text}</span>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="rounded-sm bg-accent/30 px-0.5 text-foreground"
          >
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  );
}

export function AITutor() {
  const { toast } = useToast();
  const sessionId = useStore((s) => s.sessionId) || "";
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [loadingHistory, setLoadingHistory] = React.useState(true);
  const [image, setImage] = React.useState<{ base64: string; mimeType: string; preview: string } | null>(null);
  const [recording, setRecording] = React.useState(false);
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  // B4a: Input focus state — bordered + ring on focus
  const [inputFocused, setInputFocused] = React.useState(false);

  // Feature 3: Axtarış state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<ChatMessage[] | null>(null);
  const [searching, setSearching] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Feature 2: TTS state — global auto-play + playing (brauzer TTS-i dərhal başlayır, loading fazası yoxdur)
  const [autoTTS, setAutoTTS] = React.useState(false);
  const [ttsPlayingId, setTtsPlayingId] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  // Web Speech API — SpeechRecognition instansı (ASR) və cari utterance (TTS)
  const recognitionRef = React.useRef<any>(null);
  const utteranceRef = React.useRef<SpeechSynthesisUtterance | null>(null);
  // Auto-play üçün son assistant mesajının ID-si
  const lastAutoPlayedRef = React.useRef<string | null>(null);

  // Load chat history
  const loadHistory = React.useCallback(async () => {
    setLoadingHistory(true);
    try {
      const history = await api.getChatHistory(sessionId);
      setMessages(history);
      if (history.length === 0) setShowSuggestions(true);
    } catch {
      // silent
    } finally {
      setLoadingHistory(false);
    }
  }, [sessionId]);

  React.useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Auto-scroll
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // === TTS: stop audio on unmount ===
  React.useEffect(() => {
    return () => {
      stopTTS();
    };
  }, []);

  // Chrome səs siyahısını asinxron yükləyir — ilk çağırış boş qaytara bilər.
  // Komponent açılanda erkən "isindiririk" ki, oynatma anında siyahı hazır olsun.
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.getVoices();
    const handler = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener("voiceschanged", handler);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", handler);
  }, []);

  // === TTS: dayandır (unmount və nav zamanı) ===
  function stopTTS() {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    utteranceRef.current = null;
    setTtsPlayingId(null);
  }

  // === TTS: bir mesajı səslə oxu (brauzerin daxili SpeechSynthesis-i, pulsuz) ===
  function playTTS(messageId: string, content: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      toast({ variant: "destructive", title: "Brauzeriniz səsləndirməni dəstəkləmir", description: "Chrome və ya Edge istifadə edin." });
      return;
    }
    // Əgər eyni mesaj hazırda çalırsa — dayandır
    if (ttsPlayingId === messageId) {
      stopTTS();
      return;
    }
    // Əvvəlki səsi dayandır (yalnız bir səs)
    stopTTS();

    const utterance = new SpeechSynthesisUtterance(stripMarkdownForSpeech(content));
    const bestVoice = pickBestSpeechVoice();
    if (bestVoice) {
      utterance.voice = bestVoice;
      utterance.lang = bestVoice.lang;
    } else {
      // Uyğun səs tapılmadı — brauzerin defolt (çox güman ingilis) səsi işlədiləcək.
      utterance.lang = "az-AZ";
    }
    utterance.onend = () => stopTTS();
    utterance.onerror = (e) => {
      stopTTS();
      // "canceled"/"interrupted" — özümüz stopTTS() çağırmışıq (yeni səs və ya
      // istifadəçi dayandırıb), bu real xəta deyil, toast göstərmə.
      if (e.error !== "canceled" && e.error !== "interrupted") {
        toast({ variant: "destructive", title: "Səs oxuna bilmədi" });
      }
    };
    utteranceRef.current = utterance;
    setTtsPlayingId(messageId);
    window.speechSynthesis.speak(utterance);
  }

  // === Auto TTS: yeni assistant cavab gəldikdə auto-play ===
  React.useEffect(() => {
    if (!autoTTS) return;
    if (loading) return;
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.role !== "assistant") return;
    // Yeni mesaj ID-si yoxdursa və ya artıq auto-play olunubsa — skip
    const lastId = last.id || `idx-${messages.length - 1}`;
    if (lastAutoPlayedRef.current === lastId) return;
    lastAutoPlayedRef.current = lastId;
    // Qısa gecikmə ilə auto-play
    const timer = setTimeout(() => {
      playTTS(lastId, last.content);
    }, 400);
    return () => clearTimeout(timer);
  }, [messages, autoTTS, loading]);

  // === Axtarış: debounced 300ms ===
  React.useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await api.searchChatHistory(sessionId, searchQuery.trim());
        setSearchResults(results);
      } catch {
        toast({ variant: "destructive", title: "Axtarış xətası", description: "Yenidən cəhd edin." });
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, sessionId]);

  function clearSearch() {
    setSearchQuery("");
    setSearchResults(null);
    searchInputRef.current?.focus();
  }

  function fileToBase64(file: File): Promise<{ base64: string; mimeType: string; preview: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const preview = reader.result as string;
        // Strip prefix for base64 only
        const base64 = preview.split(",")[1] || "";
        resolve({ base64, mimeType: file.type, preview });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: "Yalnız şəkil faylı", description: "JPG, PNG, WEBP dəstəklənir." });
      return;
    }
    try {
      // Böyük fotolar serverə göndərilməzdən əvvəl brauzerdə kiçildilir.
      const preview = await compressImageFile(file);
      const base64 = preview.split(",")[1] || "";
      const mimeType = preview.slice(5, preview.indexOf(";")) || file.type;
      setImage({ base64, mimeType, preview });
    } catch {
      toast({ variant: "destructive", title: "Şəkil yüklənmədi" });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ASR — brauzerin daxili SpeechRecognition-u (pulsuz, backend-ə sorğu getmir)
  function startRecording() {
    const SpeechRecognitionCtor = getSpeechRecognitionCtor();
    if (!SpeechRecognitionCtor) {
      toast({ variant: "destructive", title: "Brauzeriniz səs tanımanı dəstəkləmir", description: "Chrome və ya Edge istifadə edin." });
      return;
    }
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "az-AZ";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const text = event.results?.[0]?.[0]?.transcript || "";
      if (text) {
        setInput((prev) => (prev ? prev + " " + text : text));
        toast({ title: "Səs tanındı ✓", description: text.slice(0, 80) + (text.length > 80 ? "..." : "") });
      } else {
        toast({ variant: "destructive", title: "Səs tanınmadı", description: "Daha aydın danışın." });
      }
    };
    recognition.onerror = (event: any) => {
      if (event.error === "no-speech") {
        toast({ variant: "destructive", title: "Səs eşidilmədi", description: "Daha aydın danışın." });
      } else if (event.error === "not-allowed") {
        toast({ variant: "destructive", title: "Mikrofon icazəsi yoxdur", description: "Brauzer ayarlarınızı yoxlayın." });
      } else {
        toast({ variant: "destructive", title: "Səs tanıma xətası", description: event.error || "" });
      }
    };
    recognition.onend = () => setRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    setRecording(false);
  }

  async function handleSend() {
    const text = input.trim();
    if (!text && !image) return;
    if (loading) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: text || (image ? "[Şəkil yükləndi]" : ""),
      hasImage: !!image,
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setShowSuggestions(false);
    setLoading(true);
    // Yeni mesaj göndəriləndə axtarış rejimindən çıx
    clearSearch();

    try {
      let reply = "";
      if (image) {
        const r = await api.analyzeImage({
          sessionId,
          imageBase64: image.base64,
          mimeType: image.mimeType,
          question: text || undefined,
        });
        reply = r.reply;
        setImage(null);
      } else {
        const r = await api.tutorChat({
          sessionId,
          messages: trimHistoryForBudget(newMessages.map((m) => ({ role: m.role, content: m.content }))),
        });
        reply = r.reply;
      }
      const assistantMsg: ChatMessage = { role: "assistant", content: reply };
      // ID veririk ki auto-play tracking işləsin
      assistantMsg.id = `local-${Date.now()}`;
      setMessages((m) => [...m, assistantMsg]);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "AI cavab verə bilmədi",
        description: e instanceof Error ? e.message : "Bir az sonra yenidən cəhd edin.",
      });
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "Bağışlayın, cavab verə bilmədim. Bir az sonra yenidən cəhd edin.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function clearChat() {
    stopTTS();
    setMessages([]);
    setShowSuggestions(true);
    lastAutoPlayedRef.current = null;
    toast({ title: "Söhbət təmizləndi", description: "Tarixçə saxlanılır, amma ekran təmizləndi." });
  }

  // Axtarış aktivdirsə — searchResults, yoxsa messages
  const isSearching = searchQuery.trim().length > 0;
  const displayedMessages = isSearching ? (searchResults ?? []) : messages;

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col sm:h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Bot className="size-5" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex size-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex size-3 rounded-full bg-accent" />
            </span>
          </div>
          <div>
            <h2 className="font-heading text-base font-bold">AI Müəllim</h2>
            <p className="text-xs text-muted-foreground">Sual ver, foto yüklə, səsli danış</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* B4a: Global TTS toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 transition-colors hover:bg-muted/50">
                <AudioLines className={cn("size-3.5", autoTTS ? "text-accent" : "text-muted-foreground")} />
                <span className="hidden text-xs font-medium sm:inline">Avtomatik səs</span>
                <Switch
                  checked={autoTTS}
                  onCheckedChange={(c) => {
                    setAutoTTS(c);
                    if (!c) {
                      stopTTS();
                    } else {
                      // Toggling ON: existing messages should NOT auto-play,
                      // only future assistant responses. Mark current last as played.
                      const last = messages[messages.length - 1];
                      if (last && last.role === "assistant") {
                        lastAutoPlayedRef.current =
                          last.id || `idx-${messages.length - 1}`;
                      }
                    }
                  }}
                  aria-label="Avtomatik səs cavabları"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {autoTTS ? "Avtomatik səs AÇIQ" : "Avtomatik səs BAĞLI"}
            </TooltipContent>
          </Tooltip>
          {messages.length > 0 && (
            <Button variant="ghost" size="icon" onClick={clearChat} title="Ekranı təmizlə">
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Feature 3: Axtarış zolağı */}
      {messages.length > 0 && (
        <div className="mb-2 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Söhbətdə axtar..."
              className="h-8 border-border bg-card pl-8 pr-8 text-xs"
            />
            {isSearching && (
              <button
                onClick={clearSearch}
                className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center justify-center rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Axtarışı təmizlə"
              >
                {searching ? <Loader2 className="size-3 animate-spin" /> : <X className="size-3.5" />}
              </button>
            )}
          </div>
          {isSearching && !searching && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              {(searchResults ?? []).length} nəticə
            </Badge>
          )}
        </div>
      )}

      {/* Messages */}
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
        <div ref={scrollRef} className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
          {loadingHistory ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              <p className="text-sm">Söhbət tarixçəsi yüklənir...</p>
            </div>
          ) : isSearching ? (
            // Axtarış rejimi
            searching ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
                <p className="text-sm">Axtarılır...</p>
              </div>
            ) : (searchResults ?? []).length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-muted-foreground">
                <Search className="size-8 opacity-40" />
                <p className="text-sm font-medium">Heç nə tapılmadı</p>
                <p className="text-xs">Başqa sözlə axtarın</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-accent/30 bg-accent/5 px-3 py-1.5 text-xs text-accent">
                  {(searchResults ?? []).length} nəticə tapıldı
                </div>
                <AnimatePresence initial={false}>
                  {(searchResults ?? []).map((m, i) => {
                    const msgId = m.id || `search-${i}`;
                    const isPlaying = ttsPlayingId === msgId;
                    return (
                      <motion.div
                        key={`search-${i}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}
                      >
                        <div
                          className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-lg",
                            m.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-accent/15 text-accent"
                          )}
                        >
                          {m.role === "user" ? "Sən" : <Bot className="size-4" />}
                        </div>
                        <div
                          className={cn(
                            "max-w-[80%] rounded-2xl border px-3.5 py-2.5 text-sm shadow-sm transition-colors sm:max-w-[75%]",
                            m.role === "user"
                              ? "rounded-tr-sm border-primary/30 bg-primary/5"
                              : cn(
                                  "rounded-tl-sm border-border bg-card",
                                  isPlaying && "border-accent/50 bg-accent/5"
                                )
                          )}
                        >
                          {m.hasImage && (
                            <Badge variant="outline" className="mb-2 gap-1 text-[10px]">
                              <ImageIcon className="size-3" />
                              Şəkil
                            </Badge>
                          )}
                          {m.role === "assistant" ? (
                            <div className="group relative">
                              <Markdown content={m.content} />
                              <TTSButton
                                isPlaying={isPlaying}
                                onPlay={() => playTTS(msgId, m.content)}
                                onStop={stopTTS}
                              />
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap break-words leading-relaxed">
                              <HighlightedText text={m.content} query={searchQuery} />
                            </p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"
              >
                <Sparkles className="size-8" />
              </motion.div>
              <div>
                <h3 className="font-heading text-lg font-semibold">Salam! Mən AI Müəlliməm</h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Hər hansı sualı ver, məsələnin şəklini yüklə, ya da mikrofonla danış. Sənə kömək edim.
                </p>
              </div>
              <div className="grid w-full max-w-md gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="rounded-lg border border-border bg-card p-2.5 text-left text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:bg-accent/5 hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {messages.map((m, i) => {
                  const msgId = m.id || `idx-${i}`;
                  const isPlaying = ttsPlayingId === msgId;
                  return (
                    <motion.div
                      key={msgId}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}
                    >
                      <div
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-lg",
                          m.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-accent/15 text-accent"
                        )}
                      >
                        {m.role === "user" ? "Sən" : <Bot className="size-4" />}
                      </div>
                      <div
                        className={cn(
                          "group relative max-w-[80%] rounded-2xl border px-3.5 py-2.5 text-sm shadow-sm transition-colors sm:max-w-[75%]",
                          m.role === "user"
                            ? "rounded-tr-sm border-primary/30 bg-primary/5"
                            : cn(
                                "rounded-tl-sm border-border bg-card",
                                isPlaying && "border-accent/50 bg-accent/5"
                              )
                        )}
                      >
                        {m.hasImage && (
                          <Badge variant="outline" className="mb-2 gap-1 text-[10px]">
                            <ImageIcon className="size-3" />
                            Şəkil
                          </Badge>
                        )}
                        {m.role === "assistant" ? (
                          <>
                            <Markdown content={m.content} />
                            <TTSButton
                              isPlaying={isPlaying}
                              onPlay={() => playTTS(msgId, m.content)}
                              onStop={stopTTS}
                            />
                          </>
                        ) : (
                          <p className="whitespace-pre-wrap break-words leading-relaxed">{m.content}</p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {loading && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
                    <Bot className="size-4" />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3">
                    <span className="size-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                    <span className="size-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                    <span className="size-2 animate-bounce rounded-full bg-muted-foreground" />
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Image preview */}
        <AnimatePresence>
          {image && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-border bg-muted/30 px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <img
                  src={image.preview}
                  alt="Yüklənən şəkil"
                  className="size-12 rounded-lg border object-cover"
                />
                <div className="flex-1 text-xs">
                  <p className="font-medium">Şəkil əlavə edildi</p>
                  <p className="text-muted-foreground">Göndər düyməsini bas — AI analiz edəcək</p>
                </div>
                <Button variant="ghost" size="icon" className="size-7" onClick={() => setImage(null)}>
                  <X className="size-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input area — B4b: focus border + ring */}
        <div className="border-t border-border p-2 sm:p-3">
          <div
            className={cn(
              "flex items-end gap-2 rounded-lg border bg-card p-1.5 transition-all duration-200",
              inputFocused
                ? "border-primary ring-2 ring-primary/20"
                : "border-border hover:border-primary/30"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 transition-colors duration-200 hover:bg-muted"
              onClick={() => fileInputRef.current?.click()}
              title="Şəkil yüklə"
            >
              <Paperclip className="size-4" />
            </Button>
            {recording ? (
              <Button
                variant="destructive"
                size="icon"
                className="shrink-0 animate-pulse transition-colors duration-200"
                onClick={stopRecording}
                title="Yazını dayandır"
              >
                <Square className="size-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 transition-colors duration-200 hover:bg-muted"
                onClick={startRecording}
                title="Səsli yazı"
              >
                <Mic className="size-4" />
              </Button>
            )}
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder={recording ? "Dinləyirəm..." : "AI Müəllimə sual ver..."}
              className="min-h-[44px] flex-1 resize-none border-0 bg-transparent p-2 text-sm shadow-none focus-visible:ring-0 focus-visible:border-0"
              rows={1}
              disabled={recording}
            />
            <Button
              onClick={handleSend}
              disabled={loading || (!input.trim() && !image)}
              className="h-11 shrink-0 bg-primary px-4 transition-all duration-200 hover:bg-primary/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              <span className="hidden sm:inline">Göndər</span>
            </Button>
          </div>
          {recording && (
            <div className="mt-1.5 flex items-center gap-2 px-1 text-xs text-destructive">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-destructive" />
              </span>
              Yazır... Dayandırmaq üçün kvadrat düyməni bas.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// === TTS düyməsi — assistant mesajlarının sağ alt küncündə ===
// Hover olunanda görünür, çalındığı vaxt pulse animasiya edir.
function TTSButton({
  isPlaying,
  onPlay,
  onStop,
}: {
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
}) {
  return (
    <div className="mt-1.5 flex justify-end">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={isPlaying ? onStop : onPlay}
            className={cn(
              "h-7 gap-1 px-2 text-[11px] text-muted-foreground opacity-70 transition-opacity duration-200 hover:opacity-100 hover:text-foreground group-hover:opacity-100",
              isPlaying && "opacity-100 text-accent hover:text-accent"
            )}
            aria-label={isPlaying ? "Səsi dayandır" : "Səslə oxu"}
          >
            {isPlaying ? (
              <motion.span
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                className="flex items-center"
              >
                <Square className="size-3.5" />
              </motion.span>
            ) : (
              <Volume2 className="size-3.5" />
            )}
            <span className="hidden sm:inline">
              {isPlaying ? "Dayandır" : "Səslə oxu"}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          {isPlaying ? "Səsi dayandır" : "Səslə oxu"}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
