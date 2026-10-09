"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  LogIn,
  UserPlus,
  Loader2,
  GraduationCap,
  Eye,
  EyeOff,
  Paperclip,
  X,
  BadgeCheck,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme-toggle";
import { api, QRUP_LABELS, QRUP_FENLERI, ALL_FENLER, isPendingRegister, type AuthResult, type RegisterPendingResult } from "@/lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { compressImageFile, readFileAsDataURL, MAX_PDF_BYTES, PDF_TOO_BIG_MSG } from "@/lib/media";
import { cn } from "@/lib/utils";

type Tab = "login" | "register";
type Rol = "telebe" | "muellim";

// Təsdiq gözləyən müəllim — bu brauzerdə yadda saxlanılır ki, sayt bağlanıb yenidən açılanda
// da status izlənsin və admin qərar verən an ekranda bildiriş çıxsın.
const PENDING_TEACHER_KEY = "brightline-pending-teacher";
const STATUS_POLL_MS = 4000;

interface PendingTeacher {
  token: string;
  username: string;
}

function readPendingTeacher(): PendingTeacher | null {
  try {
    const raw = localStorage.getItem(PENDING_TEACHER_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as PendingTeacher;
    return p?.token ? p : null;
  } catch {
    return null;
  }
}

function writePendingTeacher(p: PendingTeacher | null) {
  try {
    if (p) localStorage.setItem(PENDING_TEACHER_KEY, JSON.stringify(p));
    else localStorage.removeItem(PENDING_TEACHER_KEY);
  } catch {
    // gizli rejim / bloklanmış storage — izləmə yalnız bu səhifə açıq olduqca işləyəcək
  }
}

// Qeydiyyat sənədi (müəllim təsdiq sənədi) üçün şəkil seçici — support.tsx-dəki
// useImageAttachment/ImagePicker pattern-inin eynisi, bu ekran daxilində təkrarlanır.
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
  label,
}: {
  image: { preview: string } | null;
  onClear: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
}) {
  return (
    <div className="space-y-1.5">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
      {image ? (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.preview} alt={label} className="size-12 rounded-md object-cover" />
          <span className="flex-1 text-xs text-muted-foreground">Sənəd əlavə edildi</span>
          <button type="button" onClick={onClear} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start gap-2 text-muted-foreground"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="size-4" />
          {label}
        </Button>
      )}
    </div>
  );
}

export function AuthScreen() {
  const { toast } = useToast();
  const { setStudent, setView, setAppView } = useStore();
  const [tab, setTab] = React.useState<Tab>("login");

  // Login state
  const [loginUsername, setLoginUsername] = React.useState("");
  const [loginPassword, setLoginPassword] = React.useState("");
  const [loginLoading, setLoginLoading] = React.useState(false);
  const [showLoginPass, setShowLoginPass] = React.useState(false);

  // Register — ortaq
  const [regRol, setRegRol] = React.useState<Rol>("telebe");
  const [regUsername, setRegUsername] = React.useState("");
  const [regPassword, setRegPassword] = React.useState("");
  const [regAd, setRegAd] = React.useState("");
  const [regDogumTarixi, setRegDogumTarixi] = React.useState("");
  const [regLoading, setRegLoading] = React.useState(false);
  const [showRegPass, setShowRegPass] = React.useState(false);
  const [pendingMesaj, setPendingMesaj] = React.useState<string | null>(null);

  // Register — yalnız Şagird
  const [regQrup, setRegQrup] = React.useState("1");

  // Register — yalnız Müəllim
  const [regEmail, setRegEmail] = React.useState("");
  const [regTelefon, setRegTelefon] = React.useState("");
  const [regFenn, setRegFenn] = React.useState("");
  const sened = useImageAttachment();

  // Təsdiq gözləyən müəllimin canlı status izləməsi
  const [pendingTeacher, setPendingTeacher] = React.useState<PendingTeacher | null>(null);
  const [decision, setDecision] = React.useState<{ status: "TESDIQLENIB" | "RED"; ad: string; username: string } | null>(null);

  React.useEffect(() => {
    const saved = readPendingTeacher();
    if (saved) {
      setPendingTeacher(saved);
      setPendingMesaj("Müəllim qeydiyyat sorğunuz hələ admin tərəfindən yoxlanılır.");
    }
  }, []);

  React.useEffect(() => {
    if (!pendingTeacher) return;
    let stopped = false;
    async function check() {
      try {
        const res = await api.getTeacherStatus(pendingTeacher!.token);
        if (stopped || res.status === "GOZLEYIR") return;
        stopped = true;
        writePendingTeacher(null);
        setPendingTeacher(null);
        setPendingMesaj(null);
        setDecision({ status: res.status, ad: res.ad, username: res.username });
        if (typeof document !== "undefined" && document.hidden && typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification(res.status === "TESDIQLENIB" ? "Müraciətiniz təsdiq edildi ✅" : "Müraciətiniz təsdiq edilmədi", {
            body: res.status === "TESDIQLENIB" ? "İndi BrightLine Academy-yə daxil ola bilərsiniz." : "Ətraflı məlumat üçün dəstəklə əlaqə saxlayın.",
          });
        }
      } catch (err) {
        // hesab silinibsə (404) izləməni dayandır; digər xətalarda növbəti dövrədə yenidən cəhd et
        if (err instanceof Error && /tapılmadı|404/.test(err.message)) {
          stopped = true;
          writePendingTeacher(null);
          setPendingTeacher(null);
        }
      }
    }
    check();
    const timer = window.setInterval(() => !stopped && check(), STATUS_POLL_MS);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [pendingTeacher]);

  function startPendingTracking(result: RegisterPendingResult) {
    setPendingMesaj(result.mesaj);
    if (result.statusToken) {
      const p = { token: result.statusToken, username: result.username || "" };
      writePendingTeacher(p);
      setPendingTeacher(p);
    }
  }

  function closeDecision() {
    if (decision?.status === "TESDIQLENIB") setLoginUsername(decision.username);
    setDecision(null);
    setTab("login");
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!loginUsername.trim() || !loginPassword) return;
    setLoginLoading(true);
    try {
      const result = await api.login({
        username: loginUsername.trim(),
        password: loginPassword,
      });
      if (isPendingRegister(result)) {
        startPendingTracking(result);
        return;
      }
      handleAuthSuccess(result);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Giriş xətası",
        description: err instanceof Error ? err.message : "İstifadəçi adı və ya şifrə yanlışdır.",
      });
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    const eksik = (baslik: string, mesaj: string) => {
      toast({ variant: "destructive", title: baslik, description: mesaj });
    };
    // Bütün xanalar məcburidir — doldurmadan qeydiyyat tamamlana bilməz
    if (!regAd.trim()) return eksik("Ad və soyad tələb olunur", "Ad və soyadınızı daxil edin.");
    if (regUsername.trim().length < 3) return eksik("İstifadəçi adı tələb olunur", "Ən azı 3 simvol olmalıdır.");
    if (regPassword.length < 4) return eksik("Şifrə tələb olunur", "Ən azı 4 simvol olmalıdır.");
    if (!regDogumTarixi) return eksik("Doğum tarixi tələb olunur", "Zəhmət olmasa doğum tarixinizi seçin.");
    if (!regTelefon.trim()) return eksik("Telefon nömrəsi tələb olunur", "Zəhmət olmasa əlaqə nömrənizi daxil edin.");
    if (regRol === "telebe") {
      if (!regQrup) return eksik("Qrup seçilməyib", "Qrupunuzu seçin.");
    } else {
      if (!regEmail.trim()) return eksik("Email tələb olunur", "Email ünvanınızı daxil edin.");
      if (!regFenn.trim()) return eksik("Fənn seçilməyib", "Hansı fənni tədris etdiyinizi seçin.");
      if (!sened.image) return eksik("Sənəd şəkli tələb olunur", "Təsdiqedici sənədin şəklini yükləyin.");
    }
    setRegLoading(true);
    try {
      const result = await api.register({
        username: regUsername.trim(),
        password: regPassword,
        ad: regAd.trim(),
        rol: regRol,
        dogumTarixi: regDogumTarixi,
        telefon: regTelefon.trim(),
        ...(regRol === "telebe"
          ? { qrup: regQrup }
          : {
              email: regEmail.trim(),
              muellimFenni: regFenn.trim(),
              muellimSened: sened.image?.base64,
            }),
      });
      if (isPendingRegister(result)) {
        startPendingTracking(result);
        return;
      }
      handleAuthSuccess(result);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Qeydiyyat xətası",
        description: err instanceof Error ? err.message : "Xəta baş verdi.",
      });
    } finally {
      setRegLoading(false);
    }
  }

  function handleAuthSuccess(result: AuthResult) {
    // Student obyektini store-a yaz
    setStudent({
      id: result.id,
      sessionId: result.sessionId,
      ad: result.ad,
      qrup: result.qrup,
      hedefUniversite: result.hedefUniversite || "",
      onboarded: result.onboarded,
      diagnosticDone: result.diagnosticDone || false,
      streak: result.streak || 0,
      progress: result.progress,
      rol: result.rol,
      muellimStatus: result.muellimStatus,
    });

    // Diaqnostik test/onboarding ekranı silinib — həmişə birbaşa panelə get.
    setView("app");
    setAppView("dashboard");
  }

  function resetToLoginAfterPending() {
    setPendingMesaj(null);
    setTab("login");
    setRegUsername("");
    setRegPassword("");
    setRegAd("");
    setRegDogumTarixi("");
    setRegEmail("");
    setRegTelefon("");
    setRegFenn("");
    sened.setImage(null);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background to-muted/30" />
        <div className="absolute -top-40 left-1/2 h-[36rem] w-[50rem] -translate-x-1/2 rounded-full bg-primary/8 blur-3xl" />
      </div>

      {/* Theme toggle — top right */}
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md space-y-6"
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-2 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brightline-icon.png" alt="" className="h-14 w-auto" />
          <h1 className="font-heading text-xl font-bold tracking-tight">BrightLine Academy</h1>
          <p className="text-sm text-muted-foreground">Hesabınıza daxil olun və ya qeydiyyatdan keçin</p>
        </div>

        {pendingMesaj ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="space-y-4 p-6 text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-sky-500/10">
                  <BadgeCheck className="size-8 text-sky-500" />
                </div>
                <div>
                  <h2 className="font-heading text-lg font-semibold">Qeydiyyat sorğunuz göndərildi</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pendingMesaj}</p>
                </div>
                {pendingTeacher && (
                  <div className="flex items-center justify-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin" />
                    Status canlı izlənilir — admin qərar verən kimi bu ekranda bildiriş görəcəksiniz.
                  </div>
                )}
                <Button className="w-full h-11" onClick={resetToLoginAfterPending}>
                  Girişə qayıt
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex rounded-xl bg-muted p-1">
              {([
                { id: "login" as Tab, label: "Giriş", icon: LogIn },
                { id: "register" as Tab, label: "Qeydiyyat", icon: UserPlus },
              ]).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all",
                    tab === t.id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <t.icon className="size-4" />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Login Form */}
            {tab === "login" && (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleLogin}
              >
                <Card>
                  <CardContent className="space-y-4 p-6">
                    <div className="space-y-1.5">
                      <Label htmlFor="login-user">İstifadəçi adı</Label>
                      <Input
                        id="login-user"
                        placeholder="İstifadəçi adınızı daxil edin"
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="login-pass">Şifrə</Label>
                      <div className="relative">
                        <Input
                          id="login-pass"
                          type={showLoginPass ? "text" : "password"}
                          placeholder="Şifrənizi daxil edin"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPass(!showLoginPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showLoginPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-11 gap-1.5 active:scale-[0.98]"
                      disabled={!loginUsername.trim() || !loginPassword || loginLoading}
                    >
                      {loginLoading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <LogIn className="size-4" />
                      )}
                      Daxil ol
                    </Button>
                  </CardContent>
                </Card>
              </motion.form>
            )}

            {/* Register Form */}
            {tab === "register" && (
              <motion.form
                key="register"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleRegister}
              >
                <Card>
                  <CardContent className="space-y-4 p-6">
                    {/* Rol seçimi */}
                    <div className="space-y-1.5">
                      <Label>Kim kimi qeydiyyatdan keçirsiniz?</Label>
                      <Select value={regRol} onValueChange={(v) => setRegRol(v as Rol)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="telebe">Şagird</SelectItem>
                          <SelectItem value="muellim">Müəllim</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="reg-ad">Ad və soyad</Label>
                      <Input
                        id="reg-ad"
                        placeholder="Adınızı daxil edin"
                        value={regAd}
                        onChange={(e) => setRegAd(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="reg-user">İstifadəçi adı</Label>
                      <Input
                        id="reg-user"
                        placeholder="Unikal istifadəçi adı"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="reg-pass">Şifrə</Label>
                      <div className="relative">
                        <Input
                          id="reg-pass"
                          type={showRegPass ? "text" : "password"}
                          placeholder="Ən azı 4 simvol"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPass(!showRegPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showRegPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="reg-dogum">Doğum tarixi</Label>
                      <Input
                        id="reg-dogum"
                        type="date"
                        value={regDogumTarixi}
                        onChange={(e) => setRegDogumTarixi(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="reg-telefon">Telefon nömrəsi</Label>
                      <Input
                        id="reg-telefon"
                        type="tel"
                        placeholder="+994 XX XXX XX XX"
                        value={regTelefon}
                        onChange={(e) => setRegTelefon(e.target.value)}
                      />
                    </div>

                    {regRol === "telebe" ? (
                      /* Qrup seçimi — yalnız Şagird */
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1.5">
                          <GraduationCap className="size-3.5" />
                          Qrup seçimi
                        </Label>
                        <RadioGroup
                          value={regQrup}
                          onValueChange={setRegQrup}
                          className="grid grid-cols-2 gap-2"
                        >
                          {Object.entries(QRUP_LABELS).map(([key, label]) => {
                            const fenler = QRUP_FENLERI[key] || [];
                            const checked = regQrup === key;
                            return (
                              <label
                                key={key}
                                className={cn(
                                  "relative flex cursor-pointer items-start gap-2 rounded-xl border p-3 transition-all",
                                  checked
                                    ? "border-primary bg-primary/5 shadow-sm"
                                    : "border-border hover:border-primary/40"
                                )}
                              >
                                <RadioGroupItem value={key} id={`reg-${key}`} className="mt-0.5" />
                                <div className="min-w-0 flex-1">
                                  <span className="text-xs font-semibold">{label}</span>
                                  <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground line-clamp-2">
                                    {fenler.join(", ")}
                                  </p>
                                </div>
                              </label>
                            );
                          })}
                        </RadioGroup>
                      </div>
                    ) : (
                      /* Müəllim sahələri */
                      <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="reg-email">Email</Label>
                          <Input
                            id="reg-email"
                            type="email"
                            placeholder="email@nümunə.az"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="reg-fenn">Hansı fənni tədris edirsiniz?</Label>
                          <Select value={regFenn} onValueChange={setRegFenn}>
                            <SelectTrigger id="reg-fenn">
                              <SelectValue placeholder="Fənn seçin" />
                            </SelectTrigger>
                            <SelectContent>
                              {ALL_FENLER.map((f) => (
                                <SelectItem key={f} value={f}>{f}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Təsdiqedici sənədin şəkli</Label>
                          <p className="text-[11px] text-muted-foreground">
                            Diplom, sertifikat və ya müəllim olduğunuzu təsdiqləyən digər sənədin fotosu
                          </p>
                          <ImagePicker
                            image={sened.image}
                            onClear={() => sened.setImage(null)}
                            fileInputRef={sened.fileInputRef}
                            onFileChange={sened.handleFileChange}
                            label="Sənəd şəklini yükləyin"
                          />
                        </div>
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full h-11 gap-1.5 active:scale-[0.98]"
                      disabled={!regUsername.trim() || !regPassword || !regAd.trim() || regLoading}
                    >
                      {regLoading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <UserPlus className="size-4" />
                      )}
                      {regRol === "muellim" ? "Sorğunu göndər" : "Qeydiyyatdan keç"}
                    </Button>
                  </CardContent>
                </Card>
              </motion.form>
            )}
          </>
        )}

        {/* Back to landing */}
        <div className="text-center">
          <button
            onClick={() => setView("landing")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Ana səhifəyə qayıt
          </button>
        </div>
      </motion.div>

      {/* Admin müəllim qeydiyyatı barədə qərar verən an çıxan bildiriş */}
      <AlertDialog open={!!decision} onOpenChange={(open) => !open && closeDecision()}>
        <AlertDialogContent className="text-center sm:max-w-md">
          <AlertDialogHeader className="items-center sm:text-center">
            <div
              className={cn(
                "mx-auto mb-2 flex size-16 items-center justify-center rounded-full",
                decision?.status === "TESDIQLENIB" ? "bg-emerald-500/10" : "bg-destructive/10"
              )}
            >
              {decision?.status === "TESDIQLENIB" ? (
                <CheckCircle2 className="size-9 text-emerald-500" />
              ) : (
                <XCircle className="size-9 text-destructive" />
              )}
            </div>
            <AlertDialogTitle className="text-xl">
              {decision?.status === "TESDIQLENIB" ? "Müraciətiniz təsdiq edildi! 🎉" : "Müraciətiniz təsdiq edilmədi"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed">
              {decision?.status === "TESDIQLENIB"
                ? `${decision.ad}, müəllim hesabınız aktivləşdirildi. İndi istifadəçi adınız və şifrənizlə daxil ola bilərsiniz.`
                : "Təqdim etdiyiniz sənəd admin tərəfindən qəbul edilmədi. Ətraflı məlumat üçün bizimlə əlaqə saxlayın."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogAction onClick={closeDecision} className="w-full sm:w-auto">
              {decision?.status === "TESDIQLENIB" ? "Daxil ol" : "Bağla"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
