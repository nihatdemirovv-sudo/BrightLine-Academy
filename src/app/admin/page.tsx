"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogIn,
  UploadCloud,
  FileText,
  Loader2,
  X,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Eye,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Users,
  Target,
  Flame,
  Zap,
  Trophy,
  Clock,
  Search,
  ChevronDown,
  LifeBuoy,
  Send,
  MessageCircle,
  Paperclip,
  Crown,
  GraduationCap,
  BadgeCheck,
  Mail,
  Phone,
  Cake,
  BookOpen,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ALL_FENLER } from "@/lib/api";
import { openDataUriInNewTab, downloadDataUri } from "@/components/file-attachment-link";
import { compressImageFile, MAX_PDF_BYTES, PDF_TOO_BIG_MSG } from "@/lib/media";
import { Markdown } from "@/components/markdown";

const ADMIN_SESSION_KEY = "admin-session-token";

function getAdminSessionId(): string | null {
  try {
    return sessionStorage.getItem(ADMIN_SESSION_KEY);
  } catch {
    return null;
  }
}

// Admin username/parolu artıq kodda deyil, bazadadır (backend: AdminAccount) — bu
// funksiya hər /api/admin/* sorğusuna X-Admin-Session başlığını əlavə edir, sessiya
// etibarsız olarsa (401) istifadəçini avtomatik login ekranına qaytarır.
async function adminFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const token = getAdminSessionId();
  const headers = new Headers(init.headers);
  if (token) headers.set("X-Admin-Session", token);
  const res = await fetch(input, { ...init, headers });
  if (res.status === 401) {
    try {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    } catch {
      /* noop */
    }
    if (typeof window !== "undefined") window.location.reload();
  }
  return res;
}

type Page = "login" | "dashboard";
type Tab = "questions" | "students" | "universities" | "support" | "groups" | "teachers" | "arena" | "materials";

type SupportTicketStatus = "ACIQ" | "CAVABLANDI" | "BAGLI";

interface SupportTicketSummary {
  id: string;
  movzu: string;
  status: SupportTicketStatus;
  createdAt: string;
  updatedAt: string;
  mesajSayi: number;
  sonMesaj?: string;
  sonGonderen?: "STUDENT" | "ADMIN";
  telebeAdi?: string;
  telebeUsername?: string;
}

interface SupportMessageItem {
  id: string;
  gonderen: "STUDENT" | "ADMIN";
  mesaj: string;
  sekil?: string;
  createdAt: string;
}

interface SupportTicketDetail extends SupportTicketSummary {
  mesajlar: SupportMessageItem[];
}

interface ChatGroupSummary {
  id: string;
  ad: string;
  createdAt: string;
  uzvSayi: number;
  mesajSayi: number;
  inzibatciAdi?: string;
}

interface ChatGroupMemberItem {
  studentId: string;
  ad: string;
  inzibatci: boolean;
  joinedAt: string;
}

interface ChatGroupMessageItem {
  id: string;
  senderId: string;
  senderAdi: string;
  mesaj: string;
  sekil?: string;
  ses?: string;
  createdAt: string;
  redaktaEdilib: boolean;
  silinib: boolean;
}

interface ChatGroupDetail {
  id: string;
  ad: string;
  yaradiciId: string;
  qapali: boolean;
  createdAt: string;
  uzvler: ChatGroupMemberItem[];
  mesajlar: ChatGroupMessageItem[];
}

interface TeacherSummary {
  id: string;
  ad: string;
  username?: string;
  email?: string;
  telefon?: string;
  dogumTarixi?: string;
  muellimFenni?: string;
  muellimSened?: string;
  createdAt: string;
  telebeSayi?: number;
}

interface TeacherStudentRow {
  id: string;
  ad: string;
  username?: string;
  qrup?: string;
  himayeTarixi: string;
}

interface TeacherDetail extends TeacherSummary {
  telebeler: TeacherStudentRow[];
  muellimStatus?: string;
}

interface ActivityEntry {
  icon: string;
  mesaj: string;
}

interface WeeklyActivityResult {
  gunler: Record<string, ActivityEntry[]>;
  cemiSay: number;
}

function supportStatusLabel(status: SupportTicketStatus) {
  if (status === "ACIQ") return "Cavab gözləyir";
  if (status === "CAVABLANDI") return "Cavablandı";
  return "Bağlandı";
}

function supportStatusClass(status: SupportTicketStatus) {
  if (status === "ACIQ") return "border-amber-500/40 text-amber-600";
  if (status === "CAVABLANDI") return "border-accent/40 text-accent";
  return "border-border text-muted-foreground";
}

// Cavab yazanda şəkil (screenshot) əlavə etmək üçün ortaq state.
function useImageAttachment(toast: ReturnType<typeof useToast>["toast"]) {
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
        className="shrink-0"
        onClick={() => fileInputRef.current?.click()}
        title="Şəkil əlavə et"
      >
        <Paperclip className="size-4" />
      </Button>
      {image && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 py-1 pl-1 pr-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.preview} alt="Əlavə edilən şəkil" className="size-9 rounded-md object-cover" />
          <button type="button" onClick={onClear} className="text-muted-foreground hover:text-foreground">
            <X className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

interface StoredQuestion {
  id: string;
  sual: string;
  sualShekil?: string;
  variantlar: { A: string; B: string; C: string; D: string; E: string };
  dogruCavab: "A" | "B" | "C" | "D" | "E";
  izah: string;
  movzu: string;
  cetinlik: "asan" | "orta" | "cetin";
  fenn: string;
  nomre: number;
  uploadedAt: string;
}

interface ExtractedQuestion {
  sual: string;
  sualShekil?: string;
  variantlar: { A: string; B: string; C: string; D: string; E: string };
  dogruCavab: "A" | "B" | "C" | "D" | "E";
  izah: string;
  movzu: string;
  cetinlik: "asan" | "orta" | "cetin";
  fenn: string;
  nomre: number;
}

interface StudentListItem {
  id: string;
  ad: string;
  username: string | null;
  qrup: string;
  hedefUniversite: string;
  streak: number;
  onboarded: boolean;
  createdAt: string;
  lastActiveDate: string | null;
  progress: { fenn: string; seviyye: number; dogruCavab: number; hallSualSayi: number; yildiz: number }[];
  toplamSualSeti: number;
  toplamStudySeansi: number;
  toplamImtahanCehdi: number;
  toplamBookmark: number;
}

interface StudentDetail extends StudentListItem {
  diagnosticDone: boolean;
  telefon?: string | null;
  email?: string | null;
  dogumTarixi?: string | null;
  studySessions: { müddet: number; fenn: string | null; tamamlandı: boolean; createdAt: string }[];
  examAttempts: { sualSayi: number; dogruCavab: number; sehvCavab: number; bosCavab: number; bal: number; tamamlandi: boolean; createdAt: string }[];
  questionSets: { fenn: string; say: number; createdAt: string }[];
  activities: { nov: string; detal: string | null; createdAt: string }[];
}

const LETTERS: ("A" | "B" | "C" | "D" | "E")[] = ["A", "B", "C", "D", "E"];

function fileToBase64(file: File): Promise<{ base64: string; preview: string | null }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1] || "";
      resolve({ base64, preview: file.type.startsWith("image/") ? dataUrl : null });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Bubble-dakı şəkilə basanda tam ölçüdə baxmaq üçün tam-ekran overlay.
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

export default function AdminPage() {
  const [page, setPage] = React.useState<Page>("login");

  React.useEffect(() => {
    if (getAdminSessionId()) {
      setPage("dashboard");
    }
  }, []);

  return page === "login"
    ? <LoginPage onLogin={() => setPage("dashboard")} />
    : <DashboardPage onLogout={() => setPage("login")} />;
}

function LoginPage({ onLogin }: { onLogin: () => void }) {
  const { toast } = useToast();
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "İstifadəçi adı və ya şifrə yanlışdır.");
      }
      sessionStorage.setItem(ADMIN_SESSION_KEY, data.sessionId);
      onLogin();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Yanlış məlumatlar", description: err.message || "İstifadəçi adı və ya şifrə yanlışdır." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Shield className="size-6" />
            </div>
            <CardTitle className="text-xl font-bold">Admin Panel</CardTitle>
            <CardDescription>Daxil olmaq üçün məlumatları daxil edin</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">İstifadəçi adı</Label>
                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" autoFocus />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Şifrə</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={loading || !username || !password}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
                Daxil ol
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// Admin bildirişləri — bir neçə saniyədən bir yoxlanılır: yeni müəllim qeydiyyatı anında
// "Müəllimlər" tabında görünür (badge + toast), cavab gözləyən müraciətlər "Dəstək" tabında.
const ADMIN_NOTIFY_POLL_MS = 5000;

interface AdminNotifications {
  pendingTeachers: { id: string; ad: string; muellimFenni?: string | null; createdAt: string }[];
  openSupport: number;
}

function useAdminNotifications(toast: ReturnType<typeof useToast>["toast"]) {
  const [data, setData] = React.useState<AdminNotifications | null>(null);
  const knownIdsRef = React.useRef<Set<string> | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await adminFetch("/api/admin/notifications");
        if (!res.ok) return;
        const next = (await res.json()) as AdminNotifications;
        if (cancelled) return;
        const ids = new Set(next.pendingTeachers.map((t) => t.id));
        // İlk yükləmədə mövcud sorğular "yeni" sayılmır — yalnız sonradan gələnlər üçün toast.
        if (knownIdsRef.current) {
          for (const t of next.pendingTeachers) {
            if (!knownIdsRef.current.has(t.id)) {
              toast({
                title: "🔔 Yeni müəllim qeydiyyat sorğusu",
                description: `${t.ad}${t.muellimFenni ? ` — ${t.muellimFenni}` : ""}. "Müəllimlər" tabından yoxlayın.`,
              });
            }
          }
        }
        knownIdsRef.current = ids;
        setData(next);
      } catch {
        // növbəti dövrədə yenidən cəhd
      }
    }
    poll();
    const timer = window.setInterval(poll, ADMIN_NOTIFY_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [toast]);

  return data;
}

function DashboardPage({ onLogout }: { onLogout: () => void }) {
  const { toast } = useToast();
  const [tab, setTab] = React.useState<Tab>("questions");
  const notifications = useAdminNotifications(toast);
  const pendingTeacherCount = notifications?.pendingTeachers.length ?? 0;
  // Sorğu siyahısı dəyişəndə açıq "Müəllimlər" tabı özü yenilənsin (səhifəni yeniləmədən).
  const pendingTeacherKey = notifications?.pendingTeachers.map((t) => t.id).join(",") ?? "";
  const tabBadges: Partial<Record<Tab, number>> = {
    teachers: pendingTeacherCount,
    support: notifications?.openSupport ?? 0,
  };

  function handleLogout() {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    onLogout();
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Shield className="size-4" />
            </div>
            <span className="font-heading text-sm font-bold">Admin Panel</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg bg-muted p-0.5">
              {([
                { id: "questions" as Tab, label: "Suallar", icon: FileText },
                { id: "students" as Tab, label: "Tələbələr", icon: Users },
                { id: "teachers" as Tab, label: "Müəllimlər", icon: GraduationCap },
                { id: "universities" as Tab, label: "Universitetlər", icon: UploadCloud },
                { id: "support" as Tab, label: "Dəstək", icon: LifeBuoy },
                { id: "groups" as Tab, label: "Qruplar", icon: Users },
                { id: "arena" as Tab, label: "Arena", icon: Trophy },
                { id: "materials" as Tab, label: "Materiallar", icon: BookOpen },
              ]).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                    tab === t.id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <t.icon className="size-3.5" />
                  {t.label}
                  {!!tabBadges[t.id] && (
                    <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white">
                      {tabBadges[t.id]! > 99 ? "99+" : tabBadges[t.id]}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5 text-xs">
              Çıxış
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-4 sm:p-6">
        {tab === "questions" ? (
          <QuestionsTab toast={toast} />
        ) : tab === "students" ? (
          <StudentsTab toast={toast} />
        ) : tab === "teachers" ? (
          <TeachersTab toast={toast} pendingKey={pendingTeacherKey} />
        ) : tab === "universities" ? (
          <UniversitiesTab toast={toast} />
        ) : tab === "support" ? (
          <SupportTab toast={toast} />
        ) : tab === "arena" ? (
          <ArenaTab toast={toast} />
        ) : tab === "materials" ? (
          <MaterialsTab toast={toast} />
        ) : (
          <GroupsTab toast={toast} />
        )}
      </main>
    </div>
  );
}

// ==================== SUALLAR TAB ====================
function QuestionsTab({ toast }: { toast: ReturnType<typeof useToast>["toast"] }) {
  const [questions, setQuestions] = React.useState<StoredQuestion[]>([]);
  const [files, setFiles] = React.useState<{ id: string; name: string; base64: string; mimeType: string; preview: string | null }[]>([]);
  const [parsing, setParsing] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => { loadQuestions(); }, []);

  async function loadQuestions() {
    try {
      const res = await adminFetch("/api/admin/exam-questions");
      const data = await res.json();
      setQuestions(data.questions || []);
    } catch {
      toast({ variant: "destructive", title: "Xəta", description: "Suallar yüklənə bilmədi." });
    } finally {
      setLoading(false);
    }
  }

  async function handleFilesSelected(fileList: FileList | null) {
    if (!fileList?.length) return;
    const added: typeof files = [];
    for (const file of Array.from(fileList)) {
      const isImage = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (isPdf && file.size > MAX_PDF_BYTES) {
        toast({ variant: "destructive", title: "Fayl yüklənmədi", description: PDF_TOO_BIG_MSG });
        continue;
      }
      try {
        if (isImage) {
          const dataUrl = await compressImageFile(file);
          added.push({
            id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
            name: file.name,
            base64: dataUrl.split(",")[1] || "",
            mimeType: dataUrl.slice(5, dataUrl.indexOf(";")) || file.type,
            preview: dataUrl,
          });
        } else {
          const { base64, preview } = await fileToBase64(file);
          added.push({ id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`, name: file.name, base64, mimeType: file.type, preview });
        }
      } catch {}
    }
    setFiles((prev) => [...prev, ...added]);
  }

  async function handleParseAndSave() {
    if (files.length === 0) return;
    setParsing(true);
    try {
      const res = await adminFetch("/api/admin/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: files.map((f) => ({ base64: f.base64, mimeType: f.mimeType })) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Naməlum xəta" }));
        throw new Error(err.error || "Parse failed");
      }
      const data = await res.json();
      const extracted: ExtractedQuestion[] = data.suallar;
      if (!extracted?.length) throw new Error("Sənəddə sual tapılmadı");
      const saveRes = await adminFetch("/api/admin/exam-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: extracted }),
      });
      if (!saveRes.ok) throw new Error("Yadda saxlanıla bilmədi");
      const saveData = await saveRes.json();
      toast({ title: `${saveData.saved} sual yükləndi`, description: `Cəmi ${saveData.total} sual var.` });
      setFiles([]);
      await loadQuestions();
    } catch (e) {
      toast({ variant: "destructive", title: "Xəta", description: e instanceof Error ? e.message : "" });
    } finally {
      setParsing(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await adminFetch(`/api/admin/exam-questions?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Silinə bilmədi");
      const data = await res.json();
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      toast({ title: "Silindi", description: `Qalan sual: ${data.total}` });
    } catch (e) {
      toast({ variant: "destructive", title: "Xəta", description: e instanceof Error ? e.message : "" });
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UploadCloud className="size-4 text-primary" />
            Sual Yüklə
          </CardTitle>
          <CardDescription>PDF və ya şəkil faylı yükləyin — AI sualları oxuyub saxlayacaq.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <button type="button" onClick={() => fileInputRef.current?.click()} className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary/40 hover:bg-primary/5">
            <UploadCloud className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium">Fayl seçmək üçün klikləyin</p>
            <p className="text-xs text-muted-foreground">JPG, PNG və ya PDF</p>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*,.pdf,application/pdf" multiple className="hidden" onChange={(e) => { handleFilesSelected(e.target.files); e.target.value = ""; }} />
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((f) => (
                <div key={f.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-2.5">
                  {f.preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.preview} alt={f.name} className="size-10 shrink-0 rounded-md object-cover" />
                  ) : (
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted"><FileText className="size-5 text-muted-foreground" /></div>
                  )}
                  <span className="flex-1 truncate text-xs font-medium">{f.name}</span>
                  <button type="button" onClick={() => setFiles((prev) => prev.filter((p) => p.id !== f.id))} className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <Button size="lg" className="w-full gap-2" disabled={files.length === 0 || parsing} onClick={handleParseAndSave}>
            {parsing ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {parsing ? "AI oxuyur..." : "Sualları Oxu & Saxla"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2"><Eye className="size-4 text-primary" /> Yüklənmiş Suallar</span>
            <Badge variant="secondary">{questions.length} sual</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
              <AlertTriangle className="size-8 opacity-50" />
              <p className="text-sm">Hələ sual yüklənməyib</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <div className="space-y-3 pr-4">
                {questions.map((q) => (
                  <div key={q.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-1.5">
                      <span className="font-stat text-xs font-bold text-muted-foreground">#{q.nomre}</span>
                      <Badge variant="secondary" className="text-[10px]">{q.fenn}</Badge>
                      {q.movzu && <Badge variant="outline" className="text-[10px]">{q.movzu}</Badge>}
                      <Badge variant="outline" className={`text-[10px] ${q.cetinlik === "asan" ? "border-accent/40 text-accent" : q.cetinlik === "orta" ? "border-amber-500/40 text-amber-600" : "border-destructive/40 text-destructive"}`}>
                        {q.cetinlik === "asan" ? "Asan" : q.cetinlik === "orta" ? "Orta" : "Çətin"}
                      </Badge>
                      <button onClick={() => handleDelete(q.id)} className="ml-auto flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    {q.sualShekil ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={q.sualShekil} alt={`Sual ${q.nomre}`} className="mb-2 w-full max-w-md rounded-md border border-border" />
                    ) : (
                      <Markdown content={q.sual} className="mb-2 text-sm font-medium leading-relaxed" />
                    )}
                    <div className={q.sualShekil ? "flex flex-wrap gap-1" : "grid gap-1"}>
                      {LETTERS.map((letter) => {
                        const val = q.variantlar[letter];
                        if (!val) return null;
                        const isRight = letter === q.dogruCavab;
                        if (q.sualShekil) {
                          return (
                            <div key={letter} className={`flex size-7 items-center justify-center rounded-md border text-xs font-bold ${isRight ? "border-accent/40 bg-accent/10 text-accent" : "border-border text-muted-foreground"}`}>
                              {letter}
                            </div>
                          );
                        }
                        return (
                          <div key={letter} className={`flex items-start gap-2 rounded-md border px-2 py-1 text-xs ${isRight ? "border-accent/40 bg-accent/10" : "border-border"}`}>
                            <span className={`font-stat font-bold ${isRight ? "text-accent" : "text-muted-foreground"}`}>{letter}.</span>
                            <span className={`flex-1 ${isRight ? "text-accent font-medium" : "text-muted-foreground"}`}>{val}{isRight && <CheckCircle2 className="ml-1 inline size-3" />}</span>
                          </div>
                        );
                      })}
                    </div>
                    {q.izah && (
                      <div className="mt-2 rounded-md border border-border bg-muted/30 p-2">
                        <div className="text-[11px] text-muted-foreground"><span className="font-medium text-foreground">İzah: </span><Markdown content={q.izah} inline className="inline text-[11px] text-muted-foreground" /></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== TƏLƏBƏLƏR TAB ====================
function StudentsTab({ toast }: { toast: ReturnType<typeof useToast>["toast"] }) {
  const [students, setStudents] = React.useState<StudentListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [searchInput, setSearchInput] = React.useState("");
  const [detailId, setDetailId] = React.useState<string | null>(null);

  const loadStudents = React.useCallback(async (p: number, q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (q) params.set("q", q);
      const res = await adminFetch(`/api/admin/students?${params}`);
      const data = await res.json();
      setStudents(data.students || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalCount || 0);
    } catch {
      toast({ variant: "destructive", title: "Xəta", description: "Tələbələr yüklənə bilmədi." });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => { loadStudents(page, search); }, [page, search, loadStudents]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  }

  if (detailId) {
    return <StudentDetailPage id={detailId} onBack={() => setDetailId(null)} onDeleted={() => { setDetailId(null); loadStudents(page, search); }} toast={toast} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-bold">Tələbələr</h2>
          <p className="text-xs text-muted-foreground">Cəmi {totalCount} tələbə · Səhifə {page}/{totalPages}</p>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Ad və ya istifadəçi adı..." className="h-8 w-48 pl-8 text-xs" />
          </div>
          <Button type="submit" size="sm" variant="secondary" className="h-8 text-xs">Axtar</Button>
        </form>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>
      ) : students.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
          <Users className="size-10 opacity-40" />
          <p className="text-sm">Tələbə tapılmadı</p>
        </CardContent></Card>
      ) : (
        <>
          <div className="grid gap-3">
            {students.map((s) => {
              const avgSeviyye = s.progress.length > 0 ? Math.round(s.progress.reduce((a, b) => a + b.seviyye, 0) / s.progress.length) : 0;
              const totalDogru = s.progress.reduce((a, b) => a + b.dogruCavab, 0);
              const totalSual = s.progress.reduce((a, b) => a + b.hallSualSayi, 0);
              return (
                <motion.button
                  key={s.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setDetailId(s.id)}
                  className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/30 hover:shadow-sm"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-heading text-sm font-bold text-primary">
                    {s.ad.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold">{s.ad}</span>
                      <Badge variant="outline" className="shrink-0 text-[9px]">{s.qrup}</Badge>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                      {s.streak > 0 && <span className="flex items-center gap-0.5"><Flame className="size-2.5 text-amber-500" /> {s.streak} gün</span>}
                      <span className="flex items-center gap-0.5"><Target className="size-2.5" /> {totalDogru}/{totalSual} sual</span>
                      <span className="flex items-center gap-0.5"><Clock className="size-2.5" /> {s.toplamStudySeansi} seans</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-stat text-lg font-bold text-primary">{avgSeviyye}%</div>
                    <div className="text-[9px] text-muted-foreground">orta səviyyə</div>
                  </div>
                  <ChevronDown className="size-4 shrink-0 rotate-[-90deg] text-muted-foreground" />
                </motion.button>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="gap-1 text-xs">
                <ChevronLeft className="size-3" /> Əvvəlki
              </Button>
              <span className="px-3 text-xs text-muted-foreground">{page} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="gap-1 text-xs">
                Növbəti <ChevronRight className="size-3" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ==================== UNİVERSİTET BALLARI ====================
function UniversitiesTab({ toast }: { toast: ReturnType<typeof useToast>["toast"] }) {
  const [text, setText] = React.useState("");
  const [replaceAll, setReplaceAll] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [formatting, setFormatting] = React.useState(false);
  const [formatWarnings, setFormatWarnings] = React.useState<string[]>([]);
  const [stats, setStats] = React.useState<{ toplam: number; qrupUzre: Record<string, number> } | null>(null);
  const [lastResult, setLastResult] = React.useState<{ əlavəEdildi: number; sətirSayı: number; xətalar: string[] } | null>(null);

  const loadStats = React.useCallback(async () => {
    try {
      const res = await adminFetch("/api/admin/university-cutoffs/stats");
      const data = await res.json();
      setStats(data);
    } catch {
      // silent
    }
  }, []);

  React.useEffect(() => {
    loadStats();
  }, [loadStats]);

  async function handleAiFormat() {
    if (!text.trim()) {
      toast({ variant: "destructive", title: "Mətn boşdur" });
      return;
    }
    setFormatting(true);
    setFormatWarnings([]);
    try {
      const res = await adminFetch("/api/admin/university-cutoffs/ai-format", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Server xətası" }));
        throw new Error(err.error || "Server xətası");
      }
      const data = await res.json();
      setText(data.formattedText || "");
      setFormatWarnings(data.xəbərdarlıqlar || []);
      toast({
        title: "AI formatladı",
        description: "Nəticəni diqqətlə yoxla, lazım gəlsə düzəlt, sonra \"İdxal Et\" bas.",
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Formatlana bilmədi",
        description: e instanceof Error ? e.message : "Xəta baş verdi",
      });
    } finally {
      setFormatting(false);
    }
  }

  async function handleImport() {
    if (!text.trim()) {
      toast({ variant: "destructive", title: "Mətn boşdur" });
      return;
    }
    setImporting(true);
    try {
      const res = await adminFetch("/api/admin/university-cutoffs/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, replaceAll }),
      });
      if (!res.ok) throw new Error("Server xətası");
      const data = await res.json();
      setLastResult(data);
      toast({
        title: "İdxal edildi ✓",
        description: `${data.əlavəEdildi}/${data.sətirSayı} sətir əlavə edildi.`,
      });
      setText("");
      setFormatWarnings([]);
      loadStats();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "İdxal alınmadı",
        description: e instanceof Error ? e.message : "Xəta baş verdi",
      });
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Universitet Kod Ballarının İdxalı</CardTitle>
          <CardDescription>
            Hər sətir: <code className="rounded bg-muted px-1 py-0.5 text-xs">Universitet | İxtisas | Qrup | MinBal [| TehsilNovu [| İl]]</code>
            {" "}— məs. <code className="rounded bg-muted px-1 py-0.5 text-xs">Bakı Dövlət Universiteti | Hüquqşünaslıq | 1 | 480.5</code>.
            {" "}Xam (PDF-dən kopyalanmış, hələ formatlanmamış) mətn yapışdırıb <b>&quot;AI ilə Formatla&quot;</b> ilə bu formata çevirə bilərsən — nəticəni İdxal etməzdən əvvəl mütləq yoxla.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Universitet | İxtisas | Qrup | MinBal   —   və ya xam PDF mətni yapışdırıb aşağıda 'AI ilə Formatla' bas"
            rows={12}
            className="w-full rounded-lg border border-border bg-background p-3 font-mono text-xs leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {formatWarnings.length > 0 && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-600">
              <p className="mb-1 font-semibold">AI formatlaması zamanı xəbərdarlıq ({formatWarnings.length}):</p>
              <ul className="list-disc space-y-0.5 pl-4">
                {formatWarnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={replaceAll}
                onChange={(e) => setReplaceAll(e.target.checked)}
                className="size-3.5"
              />
              Mövcud bazanı təmizlə, yenidən yaz (replaceAll)
            </label>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleAiFormat} disabled={formatting || importing} className="gap-1.5">
                {formatting ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                AI ilə Formatla
              </Button>
              <Button onClick={handleImport} disabled={importing || formatting} className="gap-1.5">
                {importing ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
                İdxal Et
              </Button>
            </div>
          </div>
          {lastResult && lastResult.xətalar.length > 0 && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
              <p className="mb-1 font-semibold">{lastResult.xətalar.length} sətir keçmədi:</p>
              <ul className="list-disc space-y-0.5 pl-4">
                {lastResult.xətalar.slice(0, 10).map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hazırkı Baza</CardTitle>
        </CardHeader>
        <CardContent>
          {stats ? (
            <div className="space-y-2">
              <p className="text-sm">Toplam: <span className="font-semibold">{stats.toplam}</span> sətir</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.qrupUzre).map(([qrup, say]) => (
                  <Badge key={qrup} variant="outline" className="text-xs">
                    Qrup {qrup}: {say}
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Yüklənir...</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== DƏSTƏK ====================
function SupportTab({ toast }: { toast: ReturnType<typeof useToast>["toast"] }) {
  const [tickets, setTickets] = React.useState<SupportTicketSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const loadTickets = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/support/tickets");
      const data = await res.json();
      setTickets(data || []);
    } catch {
      toast({ variant: "destructive", title: "Xəta", description: "Müraciətlər yüklənə bilmədi." });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => { loadTickets(); }, [loadTickets]);

  async function handleDelete(ticketId: string, movzu: string) {
    if (!window.confirm(`"${movzu}" müraciətini silmək istədiyinə əminsən? Bu geri qaytarıla bilməz.`)) return;
    try {
      const res = await adminFetch(`/api/admin/support/tickets/${ticketId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Silinə bilmədi");
      setTickets((prev) => prev.filter((t) => t.id !== ticketId));
      toast({ title: "Müraciət silindi" });
    } catch (e) {
      toast({ variant: "destructive", title: "Xəta", description: e instanceof Error ? e.message : "" });
    }
  }

  if (selectedId) {
    return (
      <SupportTicketDetailPage
        id={selectedId}
        onBack={() => { setSelectedId(null); loadTickets(); }}
        toast={toast}
      />
    );
  }

  const acikSay = tickets.filter((t) => t.status === "ACIQ").length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-lg font-bold">Dəstək Müraciətləri</h2>
        <p className="text-xs text-muted-foreground">
          Cəmi {tickets.length} müraciət{acikSay > 0 ? ` · ${acikSay} cavab gözləyir` : ""}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>
      ) : tickets.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
          <LifeBuoy className="size-10 opacity-40" />
          <p className="text-sm">Hələ heç bir müraciət yoxdur</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {tickets.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/30 hover:shadow-sm"
            >
              <button
                onClick={() => setSelectedId(t.id)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <MessageCircle className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="break-words text-sm font-semibold">{t.movzu}</span>
                    <Badge variant="outline" className={`shrink-0 text-[10px] ${supportStatusClass(t.status)}`}>
                      {supportStatusLabel(t.status)}
                    </Badge>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                    <span>{t.telebeAdi || "Naməlum tələbə"}{t.telebeUsername ? ` · @${t.telebeUsername}` : ""}</span>
                  </div>
                  {t.sonMesaj && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {t.sonGonderen === "ADMIN" ? "Sən: " : ""}{t.sonMesaj}
                    </p>
                  )}
                </div>
              </button>
              <span className="shrink-0 text-[10px] text-muted-foreground">{relativeTime(t.updatedAt)}</span>
              <button
                onClick={() => handleDelete(t.id, t.movzu)}
                aria-label="Müraciəti sil"
                className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function SupportTicketDetailPage({
  id,
  onBack,
  toast,
}: {
  id: string;
  onBack: () => void;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const [ticket, setTicket] = React.useState<SupportTicketDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [reply, setReply] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [lightboxSrc, setLightboxSrc] = React.useState<string | null>(null);
  const formRef = React.useRef<HTMLFormElement>(null);
  const { image, setImage, fileInputRef, handleFileChange } = useImageAttachment(toast);

  const load = React.useCallback(async () => {
    try {
      const res = await adminFetch(`/api/admin/support/tickets/${id}`);
      const data = await res.json();
      setTicket(data);
    } catch {
      toast({ variant: "destructive", title: "Xəta" });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  React.useEffect(() => { load(); }, [load]);

  // Canlı yeniləmə: ticket açıq olduğu müddətdə tələbə yazanda mesaj avtomatik görünsün.
  React.useEffect(() => {
    const es = new EventSource(`/api/admin/support/tickets/${id}/stream`);
    es.addEventListener("ticket", (e) => {
      try {
        setTicket(JSON.parse((e as MessageEvent).data));
      } catch {
        // e-tam gəlməyibsə sükutla keç
      }
    });
    return () => es.close();
  }, [id]);

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if ((!reply.trim() && !image) || sending) return;
    const mesajText = reply.trim();
    const sekilBase64 = image?.base64;
    const optimisticId = `optimistic-${Date.now()}`;

    // Göndər basan kimi mesaj dərhal görünsün deyə (server cavabını gözləmədən)
    // optimistik əlavə edilir — server cavabı gələndə əsl versiya ilə əvəzlənir.
    setReply("");
    setImage(null);
    setTicket((prev) =>
      prev
        ? {
            ...prev,
            mesajlar: [
              ...prev.mesajlar,
              { id: optimisticId, gonderen: "ADMIN", mesaj: mesajText, sekil: sekilBase64, createdAt: new Date().toISOString() },
            ],
          }
        : prev
    );
    setSending(true);
    try {
      const res = await adminFetch(`/api/admin/support/tickets/${id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mesaj: mesajText, sekil: sekilBase64 }),
      });
      if (!res.ok) throw new Error("Cavab göndərilmədi");
      const data = await res.json();
      setTicket(data);
    } catch (e) {
      setTicket((prev) =>
        prev ? { ...prev, mesajlar: prev.mesajlar.filter((m) => m.id !== optimisticId) } : prev
      );
      setReply(mesajText);
      toast({ variant: "destructive", title: "Xəta", description: e instanceof Error ? e.message : "" });
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

  async function handleSetStatus(status: SupportTicketStatus) {
    try {
      const res = await adminFetch(`/api/admin/support/tickets/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Status dəyişdirilmədi");
      const data = await res.json();
      setTicket(data);
    } catch (e) {
      toast({ variant: "destructive", title: "Xəta", description: e instanceof Error ? e.message : "" });
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!ticket) {
    return <div className="py-10 text-center text-sm text-muted-foreground">Müraciət tapılmadı</div>;
  }

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="size-4" /> Geri
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-lg font-bold">{ticket.movzu}</h2>
            <Badge variant="outline" className={`text-[10px] ${supportStatusClass(ticket.status)}`}>
              {supportStatusLabel(ticket.status)}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {ticket.telebeAdi || "Naməlum tələbə"}{ticket.telebeUsername ? ` · @${ticket.telebeUsername}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {ticket.status !== "BAGLI" ? (
            <Button variant="outline" size="sm" onClick={() => handleSetStatus("BAGLI")} className="text-xs">
              Müraciəti bağla
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => handleSetStatus("ACIQ")} className="text-xs">
              Yenidən aç
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              if (!window.confirm(`"${ticket.movzu}" müraciətini silmək istədiyinə əminsən? Bu geri qaytarıla bilməz.`)) return;
              try {
                const res = await adminFetch(`/api/admin/support/tickets/${id}`, { method: "DELETE" });
                if (!res.ok) throw new Error("Silinə bilmədi");
                toast({ title: "Müraciət silindi" });
                onBack();
              } catch (e) {
                toast({ variant: "destructive", title: "Xəta", description: e instanceof Error ? e.message : "" });
              }
            }}
            className="gap-1.5 border-destructive/30 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
            Sil
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-3 p-4">
          {ticket.mesajlar.map((m) => (
            <div key={m.id} className={`flex gap-3 ${m.gonderen === "ADMIN" ? "flex-row-reverse" : ""}`}>
              <div
                className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${
                  m.gonderen === "ADMIN" ? "bg-primary text-primary-foreground" : "bg-accent/15 text-accent"
                }`}
              >
                {m.gonderen === "ADMIN" ? "Sən" : "Tələbə"}
              </div>
              <div
                className={`max-w-[80%] rounded-2xl border px-3.5 py-2.5 text-sm shadow-sm sm:max-w-[75%] ${
                  m.gonderen === "ADMIN"
                    ? "rounded-tr-sm border-primary/30 bg-primary/5"
                    : "rounded-tl-sm border-border bg-card"
                }`}
              >
                {m.sekil && (
                  <button
                    type="button"
                    onClick={() => setLightboxSrc(m.sekil!)}
                    className={`block ${m.mesaj ? "mb-2" : ""}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={m.sekil}
                      alt="Əlavə edilən şəkil"
                      className="max-h-56 max-w-[240px] cursor-zoom-in rounded-lg border border-border/50 transition-opacity hover:opacity-90"
                    />
                  </button>
                )}
                {m.mesaj && <p className="whitespace-pre-wrap leading-relaxed">{m.mesaj}</p>}
                <p className="mt-1 text-[10px] text-muted-foreground">{relativeTime(m.createdAt)}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {ticket.status !== "BAGLI" && (
        <form ref={formRef} onSubmit={handleReply} className="space-y-2">
          <div className="flex items-end gap-2">
            <Textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={handleReplyKeyDown}
              placeholder="Tələbəyə cavab yaz... (Enter — göndər, Shift+Enter — yeni sətir)"
              rows={2}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={sending || (!reply.trim() && !image)} className="shrink-0">
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </div>
          <ImagePicker image={image} onClear={() => setImage(null)} fileInputRef={fileInputRef} onFileChange={handleFileChange} />
        </form>
      )}

      {lightboxSrc && <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </div>
  );
}

// ==================== QRUPLAR TAB ====================
// Admin bütün qrupları şifrəsiz görə/oxuya bilir, AMMA heç bir qrupun üzv siyahısında
// görünmür (backend admin endpoint-ləri üzvlük qeydi yaratmır) və mesaj yaza bilmir —
// sadəcə "kənardan izləyici"dir.
function GroupsTab({ toast }: { toast: ReturnType<typeof useToast>["toast"] }) {
  const [groups, setGroups] = React.useState<ChatGroupSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const loadGroups = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/groups");
      const data = await res.json();
      setGroups(data || []);
    } catch {
      toast({ variant: "destructive", title: "Xəta", description: "Qruplar yüklənə bilmədi." });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => { loadGroups(); }, [loadGroups]);

  async function handleDelete(groupId: string, ad: string) {
    if (!window.confirm(`"${ad}" qrupunu silmək istədiyinə əminsən? Bu geri qaytarıla bilməz.`)) return;
    try {
      const res = await adminFetch(`/api/admin/groups/${groupId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Silinə bilmədi");
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
      toast({ title: "Qrup silindi" });
    } catch (e) {
      toast({ variant: "destructive", title: "Xəta", description: e instanceof Error ? e.message : "" });
    }
  }

  if (selectedId) {
    return (
      <GroupDetailPage
        id={selectedId}
        onBack={() => { setSelectedId(null); loadGroups(); }}
        toast={toast}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-lg font-bold">Qrup Söhbətləri</h2>
        <p className="text-xs text-muted-foreground">Cəmi {groups.length} qrup</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>
      ) : groups.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
          <Users className="size-10 opacity-40" />
          <p className="text-sm">Hələ heç bir qrup yaradılmayıb</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {groups.map((g) => (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/30 hover:shadow-sm"
            >
              <button
                onClick={() => setSelectedId(g.id)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Users className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="break-words text-sm font-semibold">{g.ad}</span>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                    <span>İnzibatçı: {g.inzibatciAdi || "Naməlum"}</span>
                    <span>·</span>
                    <span>{g.uzvSayi} üzv</span>
                    <span>·</span>
                    <span>{g.mesajSayi} mesaj</span>
                  </div>
                </div>
              </button>
              <span className="shrink-0 text-[10px] text-muted-foreground">{relativeTime(g.createdAt)}</span>
              <button
                onClick={() => handleDelete(g.id, g.ad)}
                aria-label="Qrupu sil"
                className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function GroupDetailPage({
  id,
  onBack,
  toast,
}: {
  id: string;
  onBack: () => void;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const [group, setGroup] = React.useState<ChatGroupDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [lightboxSrc, setLightboxSrc] = React.useState<string | null>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  const load = React.useCallback(async () => {
    try {
      const res = await adminFetch(`/api/admin/groups/${id}`);
      const data = await res.json();
      setGroup(data);
    } catch {
      toast({ variant: "destructive", title: "Xəta" });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  React.useEffect(() => { load(); }, [load]);

  // Canlı yeniləmə: qrup açıq olduğu müddətdə üzvlər yazanda mesaj avtomatik görünsün.
  React.useEffect(() => {
    const es = new EventSource(`/api/admin/groups/${id}/stream`);
    es.addEventListener("group", (e) => {
      try {
        setGroup(JSON.parse((e as MessageEvent).data));
      } catch {
        // e-tam gəlməyibsə sükutla keç
      }
    });
    return () => es.close();
  }, [id]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [group?.mesajlar.length]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!group) {
    return <div className="py-10 text-center text-sm text-muted-foreground">Qrup tapılmadı</div>;
  }

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="size-4" /> Geri
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-lg font-bold">{group.ad}</h2>
            {group.qapali && (
              <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive">Bağlıdır</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{group.uzvler.length} üzv · {relativeTime(group.createdAt)}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            if (!window.confirm(`"${group.ad}" qrupunu silmək istədiyinə əminsən? Bu geri qaytarıla bilməz.`)) return;
            try {
              const res = await adminFetch(`/api/admin/groups/${id}`, { method: "DELETE" });
              if (!res.ok) throw new Error("Silinə bilmədi");
              toast({ title: "Qrup silindi" });
              onBack();
            } catch (e) {
              toast({ variant: "destructive", title: "Xəta", description: e instanceof Error ? e.message : "" });
            }
          }}
          className="gap-1.5 border-destructive/30 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
          Sil
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-2 p-4">
          <p className="mb-1 text-xs font-semibold text-muted-foreground">Üzvlər</p>
          {group.uzvler.map((m) => (
            <div key={m.studentId} className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2">
              <span className="text-sm font-medium">{m.ad}</span>
              {m.inzibatci && (
                <Badge variant="outline" className="gap-1 border-amber-500/40 text-[10px] text-amber-600">
                  <Crown className="size-3" /> Müəllim
                </Badge>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-4">
          {group.mesajlar.length === 0 && (
            <p className="py-6 text-center text-xs text-muted-foreground">Hələ heç bir mesaj yoxdur.</p>
          )}
          {group.mesajlar.map((m) => (
            <div key={m.id}>
              <div className="max-w-[80%] rounded-2xl rounded-tl-sm border border-border bg-card px-3.5 py-2.5 text-sm shadow-sm sm:max-w-[75%]">
                <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                  {m.senderAdi}
                  {m.senderId === group.yaradiciId && <Crown className="size-2.5 text-amber-500" />}
                </p>
                {m.silinib ? (
                  <p className="italic text-muted-foreground">{m.mesaj}</p>
                ) : (
                  <>
                    {m.sekil && (
                      <button
                        type="button"
                        onClick={() => setLightboxSrc(m.sekil!)}
                        className={`block ${(m.mesaj || m.ses) ? "mb-2" : ""}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={m.sekil}
                          alt="Əlavə edilən şəkil"
                          className="max-h-56 max-w-[240px] cursor-zoom-in rounded-lg border border-border/50 transition-opacity hover:opacity-90"
                        />
                      </button>
                    )}
                    {m.ses && (
                      // eslint-disable-next-line jsx-a11y/media-has-caption
                      <audio controls src={m.ses} className={`h-9 max-w-full ${m.mesaj ? "mb-2" : ""}`} />
                    )}
                    {m.mesaj && <p className="whitespace-pre-wrap leading-relaxed">{m.mesaj}</p>}
                  </>
                )}
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {relativeTime(m.createdAt)}
                  {m.redaktaEdilib && !m.silinib && " · redaktə edilib"}
                </p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </CardContent>
      </Card>

      {lightboxSrc && <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </div>
  );
}

// ==================== TƏLƏBƏ DETayı ====================
function StudentDetailPage({ id, onBack, onDeleted, toast }: { id: string; onBack: () => void; onDeleted?: () => void; toast: ReturnType<typeof useToast>["toast"] }) {
  const [student, setStudent] = React.useState<StudentDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [deleting, setDeleting] = React.useState(false);
  const [weeklyActivity, setWeeklyActivity] = React.useState<{ gunler: Record<string, { icon: string; mesaj: string }[]> } | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const [detailRes, activityRes] = await Promise.all([
          adminFetch(`/api/admin/students/${id}`),
          adminFetch(`/api/admin/students/${id}/activity`),
        ]);
        const detailData = await detailRes.json();
        setStudent(detailData.student);
        const activityData = await activityRes.json();
        setWeeklyActivity(activityData);
      } catch {
        toast({ variant: "destructive", title: "Xəta" });
      } finally {
        setLoading(false);
      }
    })();
  }, [id, toast]);

  async function handleDelete() {
    if (!student) return;
    if (!window.confirm(`"${student.ad}" hesabını HƏMİŞƏLİK silmək istədiyinizə əminsiniz? Bütün məlumatları itiriləcək.`)) return;
    setDeleting(true);
    try {
      const res = await adminFetch(`/api/admin/students/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Silinə bilmədi");
      toast({ title: "Hesab silindi" });
      if (onDeleted) onDeleted(); else onBack();
    } catch (e) {
      toast({ variant: "destructive", title: "Xəta", description: e instanceof Error ? e.message : "" });
      setDeleting(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!student) {
    return <div className="py-10 text-center text-sm text-muted-foreground">Tələbə tapılmadı</div>;
  }

  const totalDogru = student.progress.reduce((a, b) => a + b.dogruCavab, 0);
  const totalSual = student.progress.reduce((a, b) => a + b.hallSualSayi, 0);
  const totalDəqiqə = student.studySessions.reduce((a, b) => a + b.müddet, 0);

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="size-4" /> Geri
      </button>

      {/* Başlıq */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 font-heading text-xl font-bold text-primary">
          {student.ad.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
        </div>
        <div>
          <h2 className="font-heading text-xl font-bold">{student.ad}</h2>
          <p className="text-xs text-muted-foreground">@{student.username || "—"}</p>
        </div>
        <Badge variant="outline">{student.qrup === "magistr" ? "Magistr" : `${student.qrup}-ci qrup`}</Badge>
        {student.streak > 0 && <Badge variant="outline" className="gap-1 text-amber-500"><Flame className="size-2.5" /> {student.streak} gün streak</Badge>}
        <Button
          size="sm"
          variant="outline"
          className="ml-auto gap-1.5 border-destructive/40 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
          disabled={deleting}
          onClick={handleDelete}
        >
          {deleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
          Hesabı sil
        </Button>
      </div>

      {/* Stat kartları */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: <Trophy className="size-3.5" />, label: "Doğru", value: totalDogru, color: "text-primary" },
          { icon: <Target className="size-3.5" />, label: "Sual", value: totalSual, color: "text-accent" },
          { icon: <Clock className="size-3.5" />, label: "Dəqiqə", value: totalDəqiqə, color: "text-primary" },
          { icon: <Zap className="size-3.5" />, label: "İmtahan", value: student.toplamImtahanCehdi, color: "text-amber-500" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 text-muted-foreground">{s.icon}<span className="text-[10px] font-medium">{s.label}</span></div>
              <div className={`mt-1 font-stat text-2xl font-bold ${s.color}`}>{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Əlaqə məlumatları — YALNIZ admin panelində görünür (tələbələr/müəllimlər bir-birinin nömrəsini görmür) */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Əlaqə məlumatları</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-x-6 gap-y-2 text-xs sm:grid-cols-2">
            <div className="flex justify-between gap-3 border-b border-border/50 py-1.5">
              <span className="text-muted-foreground">Ad və soyad</span>
              <span className="font-medium">{student.ad}</span>
            </div>
            <div className="flex justify-between gap-3 border-b border-border/50 py-1.5">
              <span className="text-muted-foreground">İstifadəçi adı</span>
              <span className="font-medium">@{student.username || "—"}</span>
            </div>
            <div className="flex justify-between gap-3 border-b border-border/50 py-1.5">
              <span className="text-muted-foreground">Telefon</span>
              <span className="font-medium">{student.telefon || "—"}</span>
            </div>
            <div className="flex justify-between gap-3 border-b border-border/50 py-1.5">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{student.email || "—"}</span>
            </div>
            <div className="flex justify-between gap-3 border-b border-border/50 py-1.5">
              <span className="text-muted-foreground">Doğum tarixi</span>
              <span className="font-medium">{student.dogumTarixi || "—"}</span>
            </div>
            <div className="flex justify-between gap-3 border-b border-border/50 py-1.5">
              <span className="text-muted-foreground">Hədəf universitet</span>
              <span className="font-medium">{student.hedefUniversite || "—"}</span>
            </div>
            <div className="flex justify-between gap-3 border-b border-border/50 py-1.5">
              <span className="text-muted-foreground">Qeydiyyat tarixi</span>
              <span className="font-medium">{(() => { const d = new Date(student.createdAt); return `${d.getDate()} ${AY_ADLARI[d.getMonth()]} ${d.getFullYear()}`; })()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fənn üzrə tərəqqi */}
      {student.progress.filter((p) => p.hallSualSayi > 0 || p.dogruCavab > 0).length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Fənn üzrə tərəqqi</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {student.progress.filter((p) => p.hallSualSayi > 0 || p.dogruCavab > 0).sort((a, b) => b.seviyye - a.seviyye).map((p) => (
                <div key={p.fenn} className="flex items-center gap-3">
                  <span className="w-24 truncate text-xs font-medium">{p.fenn}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${p.seviyye}%` }} />
                  </div>
                  <span className="w-10 text-right font-stat text-xs font-bold">{p.seviyye}%</span>
                  <span className="text-[10px] text-muted-foreground">{p.dogruCavab}/{p.hallSualSayi}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Son aktivliklər */}
      {weeklyActivity && Object.keys(weeklyActivity.gunler).length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Son aktivliklər</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(weeklyActivity.gunler).map(([gun, lines]) => {
                const d = new Date(gun + "T00:00:00");
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
                let label = gun;
                if (diff === 0) label = "Bugün";
                else if (diff === 1) label = "Dünən";
                else label = `${d.getDate()} ${AY_ADLARI[d.getMonth()]}`;
                return (
                  <div key={gun}>
                    <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
                    <div className="space-y-1">
                      {lines.map((l, i) => (
                        <div key={i} className="flex items-start gap-2 rounded-lg border border-border px-3 py-2 text-xs">
                          <span className="shrink-0 text-sm leading-none mt-0.5">{l.icon}</span>
                          <span className="text-muted-foreground">{l.mesaj}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* İmtahan nəticələri */}
      {student.examAttempts.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">İmtahan nəticələri</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {student.examAttempts.map((e, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-xs">
                  <span className="font-stat font-bold text-primary">{e.bal} bal</span>
                  <span className="text-accent">{e.dogruCavab} doğru</span>
                  <span className="text-destructive">{e.sehvCavab} səhv</span>
                  <span className="text-muted-foreground">{e.bosCavab} boş</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">{relativeTime(e.createdAt)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dərs seansları */}
      {student.studySessions.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Dərs seansları</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1">
              {student.studySessions.slice(0, 15).map((ss, i) => (
                <div key={i} className="flex items-center justify-between rounded-md px-3 py-1.5 text-xs">
                  <span>{ss.fenn || "Ümumi"}</span>
                  <span className="font-stat">{ss.müddet} dəq</span>
                  <span className="text-[10px] text-muted-foreground">{relativeTime(ss.createdAt)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ==================== MÜƏLLİMLƏR ====================

function TeachersTab({ toast, pendingKey }: { toast: ReturnType<typeof useToast>["toast"]; pendingKey: string }) {
  const [sub, setSub] = React.useState<"pending" | "approved" | "rejected">("pending");
  const [teachers, setTeachers] = React.useState<TeacherSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [searchInput, setSearchInput] = React.useState("");

  const load = React.useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await adminFetch(`/api/admin/teachers?status=${sub}`);
      setTeachers((await res.json()) || []);
    } catch {
      toast({ variant: "destructive", title: "Xəta", description: "Müəllimlər yüklənə bilmədi." });
    } finally {
      setLoading(false);
    }
  }, [sub, toast]);

  React.useEffect(() => { load(); }, [load]);

  // Yeni sorğu gələndə (və ya başqa yerdən təsdiq/rədd olunanda) "Gözləyən" siyahısı spinnersiz yenilənir.
  const firstPendingKey = React.useRef(true);
  React.useEffect(() => {
    if (firstPendingKey.current) {
      firstPendingKey.current = false;
      return;
    }
    if (sub === "pending") load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingKey]);

  const q = searchInput.trim().toLowerCase();
  const visibleTeachers = q
    ? teachers.filter((t) => (t.ad || "").toLowerCase().includes(q) || (t.username || "").toLowerCase().includes(q))
    : teachers;

  if (selectedId) {
    return (
      <TeacherDetailPage
        id={selectedId}
        onBack={() => { setSelectedId(null); load(); }}
        toast={toast}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-bold">Müəllimlər</h2>
          <p className="text-xs text-muted-foreground">Cəmi {visibleTeachers.length} müəllim</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Ad və ya istifadəçi adı..." className="h-8 w-48 pl-8 text-xs" />
          </div>
          <div className="flex rounded-lg bg-muted p-0.5">
            {([
              { id: "pending" as const, label: "Gözləyən" },
              { id: "approved" as const, label: "Təsdiqlənmiş" },
              { id: "rejected" as const, label: "Rədd edilmiş" },
            ]).map((t) => (
              <button
                key={t.id}
                onClick={() => setSub(t.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  sub === t.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>
      ) : visibleTeachers.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
          <GraduationCap className="size-10 opacity-40" />
          <p className="text-sm">{q ? "Axtarışa uyğun müəllim tapılmadı" : sub === "pending" ? "Gözləyən müəllim yoxdur" : sub === "approved" ? "Təsdiqlənmiş müəllim yoxdur" : "Rədd edilmiş müəllim yoxdur"}</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {visibleTeachers.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedId(t.id)}
              className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/30 hover:shadow-sm"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <GraduationCap className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="break-words text-sm font-semibold">{t.ad}</span>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                  <span>{t.muellimFenni}</span>
                  <span>·</span>
                  <span>{t.email}</span>
                  {sub === "approved" && (
                    <>
                      <span>·</span>
                      <span>{t.telebeSayi ?? 0} tələbə</span>
                    </>
                  )}
                </div>
              </div>
              <span className="shrink-0 text-[10px] text-muted-foreground">{relativeTime(t.createdAt)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TeacherDetailPage({
  id,
  onBack,
  toast,
}: {
  id: string;
  onBack: () => void;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const [teacher, setTeacher] = React.useState<TeacherDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [lightboxSrc, setLightboxSrc] = React.useState<string | null>(null);
  const [acting, setActing] = React.useState(false);
  const [activityStudentId, setActivityStudentId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch(`/api/admin/teachers/${id}`);
      setTeacher(await res.json());
    } catch {
      toast({ variant: "destructive", title: "Xəta" });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  React.useEffect(() => { load(); }, [load]);

  async function handleApprove() {
    setActing(true);
    try {
      await adminFetch(`/api/admin/teachers/${id}/approve`, { method: "POST" });
      toast({ title: "Müəllim təsdiqləndi" });
      load();
    } catch {
      toast({ variant: "destructive", title: "Xəta" });
    } finally {
      setActing(false);
    }
  }

  async function handleReject() {
    if (!window.confirm("Bu müəllimin qeydiyyatını rədd etmək istədiyinə əminsən?")) return;
    setActing(true);
    try {
      await adminFetch(`/api/admin/teachers/${id}/reject`, { method: "POST" });
      toast({ title: "Müəllim rədd edildi" });
      load();
    } catch {
      toast({ variant: "destructive", title: "Xəta" });
    } finally {
      setActing(false);
    }
  }

  async function handleDelete() {
    if (!teacher) return;
    if (!window.confirm(`"${teacher.ad}" hesabını HƏMİŞƏLİK silmək istədiyinizə əminsiniz? Bütün məlumatları itiriləcək.`)) return;
    setActing(true);
    try {
      const res = await adminFetch(`/api/admin/students/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Silinə bilmədi");
      toast({ title: "Hesab silindi" });
      onBack();
    } catch (e) {
      toast({ variant: "destructive", title: "Xəta", description: e instanceof Error ? e.message : "" });
      setActing(false);
    }
  }

  if (activityStudentId && teacher) {
    return (
      <TeacherStudentActivityPage
        teacherId={teacher.id}
        studentId={activityStudentId}
        studentAdi={teacher.telebeler.find((s) => s.id === activityStudentId)?.ad || ""}
        onBack={() => setActivityStudentId(null)}
        toast={toast}
      />
    );
  }

  if (loading || !teacher) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="size-4" /> Geri
        </button>
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">Müəllim tapılmadı</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Geri
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-bold">{teacher.ad}</h2>
          <p className="text-xs text-muted-foreground">@{teacher.username}</p>
        </div>
        {teacher.muellimStatus === "GOZLEYIR" && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs text-destructive" disabled={acting} onClick={handleReject}>
              Rədd et
            </Button>
            <Button size="sm" className="gap-1.5 text-xs" disabled={acting} onClick={handleApprove}>
              {acting ? <Loader2 className="size-3.5 animate-spin" /> : <BadgeCheck className="size-3.5" />}
              Təsdiqlə
            </Button>
          </div>
        )}
        {teacher.muellimStatus === "TESDIQLENIB" && (
          <Badge variant="outline" className="gap-1 border-emerald-500/40 text-emerald-600">
            <BadgeCheck className="size-3.5" /> Təsdiqlənib
          </Badge>
        )}
        {teacher.muellimStatus === "RED" && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 border-destructive/40 text-destructive">
              Rədd edilib
            </Badge>
            <Button size="sm" className="gap-1.5 text-xs" disabled={acting} onClick={handleApprove}>
              {acting ? <Loader2 className="size-3.5 animate-spin" /> : <BadgeCheck className="size-3.5" />}
              Təsdiqlə
            </Button>
          </div>
        )}
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 border-destructive/40 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
          disabled={acting}
          onClick={handleDelete}
        >
          <Trash2 className="size-3.5" />
          Hesabı sil
        </Button>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
          <div className="flex items-center gap-2 text-sm"><Mail className="size-3.5 text-muted-foreground" /> {teacher.email || "—"}</div>
          <div className="flex items-center gap-2 text-sm"><Phone className="size-3.5 text-muted-foreground" /> {teacher.telefon || "—"}</div>
          <div className="flex items-center gap-2 text-sm"><Cake className="size-3.5 text-muted-foreground" /> {teacher.dogumTarixi || "—"}</div>
          <div className="flex items-center gap-2 text-sm"><GraduationCap className="size-3.5 text-muted-foreground" /> {teacher.muellimFenni || "—"}</div>
        </CardContent>
      </Card>

      {teacher.muellimSened && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Təsdiqedici sənəd</CardTitle></CardHeader>
          <CardContent>
            <button onClick={() => setLightboxSrc(teacher.muellimSened!)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={teacher.muellimSened} alt="Sənəd" className="max-h-64 max-w-full cursor-zoom-in rounded-lg border border-border object-contain" />
            </button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-sm">Tələbələri ({teacher.telebeler.length})</CardTitle></CardHeader>
        <CardContent className="space-y-1.5">
          {teacher.telebeler.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">Hələ heç bir tələbə qeydə alınmayıb.</p>
          ) : (
            teacher.telebeler.map((s) => (
              <button
                key={s.id}
                onClick={() => setActivityStudentId(s.id)}
                className="flex w-full items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-left transition-colors hover:border-primary/40"
              >
                <div>
                  <p className="text-sm font-medium">{s.ad}</p>
                  <p className="text-[10px] text-muted-foreground">@{s.username} · {s.qrup}</p>
                </div>
                <span className="text-[10px] text-muted-foreground">{relativeTime(s.himayeTarixi)}</span>
              </button>
            ))
          )}
        </CardContent>
      </Card>

      {lightboxSrc && <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </div>
  );
}

function TeacherStudentActivityPage({
  teacherId,
  studentId,
  studentAdi,
  onBack,
  toast,
}: {
  teacherId: string;
  studentId: string;
  studentAdi: string;
  onBack: () => void;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const [activity, setActivity] = React.useState<WeeklyActivityResult | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await adminFetch(`/api/admin/teachers/${teacherId}/students/${studentId}/activity`);
        setActivity(await res.json());
      } catch {
        toast({ variant: "destructive", title: "Xəta" });
      } finally {
        setLoading(false);
      }
    })();
  }, [teacherId, studentId, toast]);

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Geri
      </button>
      <h2 className="font-heading text-lg font-bold">{studentAdi} — həftəlik fəaliyyət</h2>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>
      ) : !activity || Object.keys(activity.gunler).length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
          <Clock className="size-10 opacity-40" />
          <p className="text-sm">Son 7 gündə fəaliyyət qeydə alınmayıb</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {Object.entries(activity.gunler).map(([gun, entries]) => (
            <Card key={gun}>
              <CardHeader><CardTitle className="text-sm">{formatGunAdi(gun)}</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {entries.map((e, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="shrink-0">{e.icon}</span>
                      <span className="text-muted-foreground">{e.mesaj}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== BİLİK ARENASI ====================

interface AdminArenaCompetition {
  id: string;
  ad: string;
  fenn: string;
  cetinlik: string;
  sualSayi: number;
  status: string;
  yaradiciAdi: string;
  istirakciSayi: number;
  maxIstirakci: number;
  createdAt: string;
  baslamaVaxti: string | null;
  bitmeVaxti: string | null;
}

interface AdminArenaStats {
  umumi: number;
  aktiv: number;
  buGun: number;
  umumiIstirakci: number;
  populyarFenler: { ad: string; say: number }[];
  enCoxYaradan: { ad: string; say: number }[];
  enCoxQalib: { ad: string; say: number }[];
}

const ARENA_STATUS_AZ: Record<string, string> = {
  GOZLEYIR: "Gözləyir",
  BASLADI: "Davam edir",
  BITDI: "Tamamlandı",
  LEGV: "Ləğv edildi",
  VAXT_BITDI: "Vaxtı bitdi",
};
const ARENA_CETINLIK_AZ: Record<string, string> = { asan: "Asan", orta: "Orta", cetin: "Çətin", qarisiq: "Qarışıq" };

function arenaTarix(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getDate()} ${AY_ADLARI[d.getMonth()]} ${d.getFullYear()}, ${d.getHours()}:${d
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

function ArenaTab({ toast }: { toast: ReturnType<typeof useToast>["toast"] }) {
  const [stats, setStats] = React.useState<AdminArenaStats | null>(null);
  const [comps, setComps] = React.useState<AdminArenaCompetition[]>([]);
  const [filter, setFilter] = React.useState<"all" | "active" | "finished" | "cancelled">("all");
  const [loading, setLoading] = React.useState(true);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([
        adminFetch("/api/admin/arena/stats").then((r) => r.json()),
        adminFetch(`/api/admin/arena/competitions?filter=${filter}`).then((r) => r.json()),
      ]);
      setStats(s);
      setComps(c || []);
    } catch {
      toast({ variant: "destructive", title: "Xəta", description: "Arena məlumatları yüklənə bilmədi." });
    } finally {
      setLoading(false);
    }
  }, [filter, toast]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(cid: string, ad: string) {
    if (!window.confirm(`"${ad}" musabiqesini silmek istediyine eminsen? Bu geri qaytarila bilmez.`)) return;
    try {
      const res = await adminFetch(`/api/admin/arena/competitions/${cid}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Siline bilmedi");
      setComps((prev) => prev.filter((c) => c.id !== cid));
      toast({ title: "Musabiqe silindi" });
    } catch (e) {
      toast({ variant: "destructive", title: "Xəta", description: e instanceof Error ? e.message : "" });
    }
  }

  async function handleStop(cid: string) {
    if (!window.confirm("Bu musabiqeni dayandirmaq istediyine eminsen?")) return;
    try {
      const res = await adminFetch(`/api/admin/arena/competitions/${cid}/stop`, { method: "POST" });
      if (!res.ok) throw new Error("Dayandirila bilmedi");
      toast({ title: "Musabiqe dayandirildi" });
      load();
    } catch (e) {
      toast({ variant: "destructive", title: "Xəta", description: e instanceof Error ? e.message : "" });
    }
  }

  if (selectedId) {
    return (
      <ArenaCompetitionDetailPage
        id={selectedId}
        onBack={() => {
          setSelectedId(null);
          load();
        }}
        onStop={handleStop}
        onDelete={handleDelete}
        toast={toast}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-lg font-bold">Bilik Arenasi</h2>
        <p className="text-xs text-muted-foreground">Butun musabiqeler, istirakcilar ve neticeler</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { l: "Umumi musabiqe", v: stats.umumi },
            { l: "Aktiv", v: stats.aktiv },
            { l: "Bu gun", v: stats.buGun },
            { l: "Umumi istirak", v: stats.umumiIstirakci },
          ].map((x) => (
            <Card key={x.l}>
              <CardContent className="p-4">
                <div className="font-heading text-2xl font-bold tabular-nums">{x.v}</div>
                <div className="text-xs text-muted-foreground">{x.l}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {stats && (
        <div className="grid gap-3 sm:grid-cols-3">
          <ArenaTopList title="En populyar fenler" rows={stats.populyarFenler} suffix="musabiqe" />
          <ArenaTopList title="En cox musabiqe yaradan" rows={stats.enCoxYaradan} suffix="musabiqe" />
          <ArenaTopList title="En cox qalib" rows={stats.enCoxQalib} suffix="qelebe" />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "Hamisi"],
            ["active", "Aktiv"],
            ["finished", "Bitmis"],
            ["cancelled", "Legv edilmis"],
          ] as const
        ).map(([v, l]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              filter === v ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : comps.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
            <Trophy className="size-10 opacity-40" />
            <p className="text-sm">Bu filtre uygun musabiqe yoxdur</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {comps.map((c) => (
            <div
              key={c.id}
              className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm"
            >
              <button onClick={() => setSelectedId(c.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Trophy className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="break-words text-sm font-semibold">{c.ad}</span>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                    <span>{c.fenn}</span>
                    <span>{ARENA_CETINLIK_AZ[c.cetinlik] ?? c.cetinlik}</span>
                    <span>{c.sualSayi} sual</span>
                    <span>Yaradan: {c.yaradiciAdi}</span>
                    <span>
                      {c.istirakciSayi}/{c.maxIstirakci} istirakci
                    </span>
                    <span>{arenaTarix(c.createdAt)}</span>
                  </div>
                </div>
              </button>
              <Badge variant="outline" className="shrink-0 text-[10px]">
                {ARENA_STATUS_AZ[c.status] ?? c.status}
              </Badge>
              {(c.status === "GOZLEYIR" || c.status === "BASLADI") && (
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => handleStop(c.id)}>
                  Dayandir
                </Button>
              )}
              <button
                onClick={() => handleDelete(c.id, c.ad)}
                className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ArenaTopList({ title, rows, suffix }: { title: string; rows: { ad: string; say: number }[]; suffix: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-xs text-muted-foreground">Melumat yoxdur</p>
        ) : (
          <ul className="space-y-1.5">
            {rows.map((r, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span className="min-w-0 truncate">
                  {i + 1}. {r.ad}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {r.say} {suffix}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function ArenaCompetitionDetailPage({
  id,
  onBack,
  onStop,
  onDelete,
  toast,
}: {
  id: string;
  onBack: () => void;
  onStop: (id: string) => void;
  onDelete: (id: string, ad: string) => void;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const [detail, setDetail] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await adminFetch(`/api/admin/arena/competitions/${id}`);
        setDetail(await res.json());
      } catch {
        toast({ variant: "destructive", title: "Xəta", description: "Musabiqe yuklene bilmedi." });
      } finally {
        setLoading(false);
      }
    })();
  }, [id, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!detail) return null;

  const parts = [...(detail.istirakcilar || [])].sort(
    (a: any, b: any) => (a.sira ?? 99) - (b.sira ?? 99) || a.istirakciNo - b.istirakciNo
  );

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Arenaya qayit
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-bold">{detail.ad}</h2>
          <p className="text-xs text-muted-foreground">
            {detail.fenn} - {ARENA_CETINLIK_AZ[detail.cetinlik] ?? detail.cetinlik} - {detail.sualSayi} sual -{" "}
            {detail.sualSaniye}s/sual - Yaradan: {detail.yaradiciAdi}
          </p>
          <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
            <span>Status: {ARENA_STATUS_AZ[detail.status] ?? detail.status}</span>
            <span>Yaradildi: {arenaTarix(detail.createdAt)}</span>
            {detail.baslamaVaxti && <span>Basladi: {arenaTarix(detail.baslamaVaxti)}</span>}
            {detail.bitmeVaxti && <span>Bitdi: {arenaTarix(detail.bitmeVaxti)}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          {(detail.status === "GOZLEYIR" || detail.status === "BASLADI") && (
            <Button variant="outline" size="sm" onClick={() => onStop(id)}>
              Dayandir
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(id, detail.ad)}
          >
            <Trash2 className="mr-1.5 size-4" /> Sil
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Istirakcilar ({parts.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {parts.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">Istirakci yoxdur</p>
          ) : (
            parts.map((p: any) => (
              <div key={p.studentId} className="flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-0">
                <span className="w-6 text-center text-sm font-bold tabular-nums">{p.sira ?? p.istirakciNo}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {p.ad} {p.qalib && <span className="text-xs text-amber-500">Qalib</span>}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {p.dogruSay ?? 0} dogru - {p.sehvSay ?? 0} sehv - {p.cavabsizSay ?? 0} cavabsiz - orta{" "}
                    {p.ortaCavabMuddeti ?? 0}s{p.bitirib ? "" : " - (davam edir)"}
                  </div>
                </div>
                <span className="font-heading text-base font-bold tabular-nums">{p.xal ?? 0}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {Array.isArray(detail.suallar) && detail.suallar.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Suallar ({detail.suallar.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {detail.suallar.map((q: any, i: number) => (
              <div key={i} className="rounded-lg border border-border p-3 text-sm">
                <div className="flex gap-1 font-medium">
                  <span>{i + 1}.</span>
                  <Markdown content={q.sual} inline className="text-sm font-medium" />
                </div>
                <ul className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
                  {Object.entries(q.variantlar || {}).map(([h, v]) => (
                    <li key={h} className={q.dogruCavab === h ? "font-semibold text-emerald-600" : ""}>
                      {h}) {String(v)} {q.dogruCavab === h ? "(dogru)" : ""}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ==================== DƏRS MATERİALLARI (PDF) ====================

interface AdminMaterialMeta {
  id: string;
  ad: string;
  tesvir?: string | null;
  fenn?: string | null;
  tip: string;
  olcu?: number | null;
  createdAt: string;
}

function fmtBytes(b?: number | null): string {
  if (!b || b <= 0) return "";
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function MaterialsTab({ toast }: { toast: ReturnType<typeof useToast>["toast"] }) {
  const [items, setItems] = React.useState<AdminMaterialMeta[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [ad, setAd] = React.useState("");
  const [tesvir, setTesvir] = React.useState("");
  const [fenn, setFenn] = React.useState("");
  const [file, setFile] = React.useState<{ name: string; data: string; size: number } | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [openBusy, setOpenBusy] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/materials");
      setItems((await res.json()) || []);
    } catch {
      toast({ variant: "destructive", title: "Xəta", description: "Materiallar yüklənə bilmədi." });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    load();
  }, [load]);

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      toast({ variant: "destructive", title: "Yalnız PDF", description: "Yalnız .pdf faylı yükləmək olar." });
      return;
    }
    if (f.size > MAX_PDF_BYTES) {
      toast({ variant: "destructive", title: "Fayl yüklənmədi", description: PDF_TOO_BIG_MSG });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFile({ name: f.name, data: reader.result as string, size: f.size });
      if (!ad.trim()) setAd(f.name.replace(/\.pdf$/i, ""));
    };
    reader.onerror = () => toast({ variant: "destructive", title: "Fayl oxunmadı" });
    reader.readAsDataURL(f);
  }

  async function upload() {
    if (!ad.trim()) {
      toast({ variant: "destructive", title: "Ad yazın" });
      return;
    }
    if (!file) {
      toast({ variant: "destructive", title: "PDF seçin" });
      return;
    }
    setUploading(true);
    try {
      const res = await adminFetch("/api/admin/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ad: ad.trim(), tesvir: tesvir.trim(), fenn, tip: "pdf", data: file.data }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Yüklənə bilmədi");
      }
      toast({ title: "Material əlavə edildi" });
      setAd("");
      setTesvir("");
      setFenn("");
      setFile(null);
      load();
    } catch (e) {
      toast({ variant: "destructive", title: "Xəta", description: e instanceof Error ? e.message : "" });
    } finally {
      setUploading(false);
    }
  }

  async function remove(id: string, name: string) {
    if (!window.confirm(`"${name}" materialını silmək istədiyinə əminsən?`)) return;
    try {
      const res = await adminFetch(`/api/admin/materials/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Silinə bilmədi");
      setItems((prev) => prev.filter((m) => m.id !== id));
      toast({ title: "Silindi" });
    } catch (e) {
      toast({ variant: "destructive", title: "Xəta", description: e instanceof Error ? e.message : "" });
    }
  }

  async function openOrDownload(id: string, name: string, mode: "open" | "download") {
    setOpenBusy(id + mode);
    try {
      // Admin metadata siyahısı `data` saxlamır — faktiki faylı ümumi endpoint-dən götürürük (eyni məzmun).
      const full = await adminFetch(`/api/materials/library/${id}`).then((r) => r.json());
      if (!full?.data) throw new Error("Fayl tapılmadı");
      if (mode === "open") openDataUriInNewTab(full.data);
      else downloadDataUri(full.data, name.toLowerCase().endsWith(".pdf") ? name : `${name}.pdf`);
    } catch (e) {
      toast({ variant: "destructive", title: "Xəta", description: e instanceof Error ? e.message : "" });
    } finally {
      setOpenBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-heading text-lg font-bold">Dərs Materialları — PDF</h2>
        <p className="text-xs text-muted-foreground">
          Bura əlavə olunan PDF-lər bütün tələbələrə &quot;Dərs Materialları&quot; bölməsində read-only görünür.
        </p>
      </div>

      {/* Yükləmə forması */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1 block text-xs">Ad</Label>
              <Input value={ad} onChange={(e) => setAd(e.target.value)} placeholder="məs. Riyaziyyat — Funksiyalar" />
            </div>
            <div>
              <Label className="mb-1 block text-xs">Fənn (istəyə bağlı)</Label>
              <select
                value={fenn}
                onChange={(e) => setFenn(e.target.value)}
                className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
              >
                <option value="">— Fənn seçin —</option>
                {ALL_FENLER.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <Label className="mb-1 block text-xs">Təsvir (istəyə bağlı)</Label>
            <Textarea
              value={tesvir}
              onChange={(e) => setTesvir(e.target.value)}
              rows={2}
              placeholder="Qısa məzmun / hansı mövzuları əhatə edir"
            />
          </div>
          <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={pickFile} />
          {file ? (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
              <FileText className="size-4 shrink-0 text-destructive" />
              <span className="min-w-0 flex-1 truncate">{file.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{fmtBytes(file.size)}</span>
              <button onClick={() => setFile(null)} className="text-muted-foreground hover:text-destructive">
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border p-6 text-center text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <UploadCloud className="size-6" />
              PDF seçin (maksimum 250 MB)
            </button>
          )}
          <Button onClick={upload} disabled={uploading || !file || !ad.trim()} className="w-full">
            {uploading ? <Loader2 className="size-4 animate-spin" /> : "Materialı əlavə et"}
          </Button>
        </CardContent>
      </Card>

      {/* Siyahı */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-14 text-center text-muted-foreground">
            <BookOpen className="size-10 opacity-40" />
            <p className="text-sm">Hələ material əlavə edilməyib</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {items.map((m) => (
            <div key={m.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <FileText className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{m.ad}</div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  {m.fenn && <span>{m.fenn}</span>}
                  <span>PDF</span>
                  {fmtBytes(m.olcu) && <span>· {fmtBytes(m.olcu)}</span>}
                  {m.tesvir && <span className="truncate">· {m.tesvir}</span>}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                disabled={openBusy === m.id + "open"}
                onClick={() => openOrDownload(m.id, m.ad, "open")}
                title="Oxu"
              >
                {openBusy === m.id + "open" ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                disabled={openBusy === m.id + "download"}
                onClick={() => openOrDownload(m.id, m.ad, "download")}
                title="Yüklə"
              >
                {openBusy === m.id + "download" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
              </Button>
              <button
                onClick={() => remove(m.id, m.ad)}
                className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
