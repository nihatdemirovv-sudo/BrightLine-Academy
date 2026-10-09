"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  User,
  CalendarClock,
  Bell,
  GraduationCap,
  AlertTriangle,
  Loader2,
  Save,
  Trash2,
  Zap,
  Flame,
  Check,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  api,
  QRUP_LABELS,
} from "@/lib/api";
import type {
  SettingsResult,
  StudentSettings,
  ExamConfig,
} from "@/lib/api";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { cn, azDateISO, azDateShort } from "@/lib/utils";

type Cetinlik = "asan" | "orta" | "cetin";

const CETINLIK_OPTIONS: { value: Cetinlik; label: string; desc: string }[] = [
  { value: "asan", label: "Asan", desc: "Temel səviyyə" },
  { value: "orta", label: "Orta", desc: "Standart imtahan səviyyəsi" },
  { value: "cetin", label: "Çətin", desc: "Ayrı-ayrılıqda çətin suallar" },
];

const DEFAULT_SETTINGS: StudentSettings = {
  bildirislerAktiv: true,
  gunlukPlanBildirisi: true,
  streakXebardarligi: true,
  gunkuSualHediyye: 10,
  cetinlikSeviyyesi: "orta",
  animasyonlar: true,
  valideynEmail: null,
  valideynBildirisiAktiv: false,
};

export function SettingsPanel() {
  const sessionId = useStore((s) => s.sessionId) || "";
  const logout = useStore((s) => s.logout);
  const { toast } = useToast();

  const [data, setData] = React.useState<SettingsResult | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [savingSection, setSavingSection] = React.useState<string | null>(null);
  const [resetting, setResetting] = React.useState(false);

  // Şifrə dəyişmə
  const [oldPassword, setOldPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [changingPassword, setChangingPassword] = React.useState(false);

  // Hesabı sil
  const [deletePassword, setDeletePassword] = React.useState("");
  const [deletingAccount, setDeletingAccount] = React.useState(false);

  // Profil form
  const [email, setEmail] = React.useState("");

  // Exam config form
  const [imtahanTarixi, setImtahanTarixi] = React.useState("");
  const [nov, setNov] = React.useState<"tqdk" | "magistr">("tqdk");
  const [müddet, setMüddet] = React.useState<number>(180);
  const [sualSayi, setSualSayi] = React.useState<number>(30);
  const [kecidBali, setKecidBali] = React.useState<number>(200);

  // Settings form
  const [bildirislerAktiv, setBildirislerAktiv] = React.useState(true);
  const [gunlukPlanBildirisi, setGunlukPlanBildirisi] = React.useState(true);
  const [streakXebardarligi, setStreakXebardarligi] = React.useState(true);

  // Learning form
  const [gunkuSualHediyye, setGunkuSualHediyye] = React.useState(10);
  const [cetinlik, setCetinlik] = React.useState<Cetinlik>("orta");
  const [animasyonlar, setAnimasyonlar] = React.useState(true);

  // Today date as YYYY-MM-DD
  const today = azDateISO(new Date());

  const load = React.useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const r = await api.getSettings(sessionId);
      setData(r);
      // Initialize form state from server data
      setEmail(r.profil.email || "");
      if (r.examConfig) {
        setImtahanTarixi(r.examConfig.imtahanTarixi);
        setNov(r.examConfig.nov);
        setMüddet(r.examConfig.müddet);
        setSualSayi(r.examConfig.sualSayi);
        setKecidBali(r.examConfig.kecidBali);
      }
      const s = r.settings;
      setBildirislerAktiv(s.bildirislerAktiv);
      setGunlukPlanBildirisi(s.gunlukPlanBildirisi);
      setStreakXebardarligi(s.streakXebardarligi);
      setGunkuSualHediyye(s.gunkuSualHediyye);
      setCetinlik(s.cetinlikSeviyyesi);
      setAnimasyonlar(s.animasyonlar);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Ayarlar yüklənmədi",
        description: e instanceof Error ? e.message : "Xəta",
      });
    } finally {
      setLoading(false);
    }
  }, [sessionId, toast]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function saveProfil() {
    if (!sessionId) return;
    setSavingSection("profil");
    try {
      const r = await api.updateSettings({
        sessionId,
        profil: {
          email: email.trim(),
        },
      });
      setData(r);
      toast({ title: "Profil saxlanıldı ✓" });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Saxlanıla bilmədi",
        description: e instanceof Error ? e.message : "Xəta",
      });
    } finally {
      setSavingSection(null);
    }
  }

  async function saveExamConfig() {
    if (!sessionId) return;
    if (!imtahanTarixi) {
      toast({
        variant: "destructive",
        title: "Tarix tələb olunur",
        description: "İmtahan tarixini daxil edin",
      });
      return;
    }
    setSavingSection("exam");
    try {
      const r = await api.updateSettings({
        sessionId,
        examConfig: {
          imtahanTarixi,
          nov,
          müddet,
          sualSayi,
          kecidBali,
        },
      });
      setData(r);
      toast({ title: "İmtahan ayarları saxlanıldı ✓" });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Saxlanıla bilmədi",
        description: e instanceof Error ? e.message : "Xəta",
      });
    } finally {
      setSavingSection(null);
    }
  }

  async function saveNotifications() {
    if (!sessionId) return;
    setSavingSection("notif");
    try {
      const r = await api.updateSettings({
        sessionId,
        settings: {
          bildirislerAktiv,
          gunlukPlanBildirisi,
          streakXebardarligi,
        },
      });
      setData(r);
      toast({ title: "Bildiriş ayarları saxlanıldı ✓" });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Saxlanıla bilmədi",
        description: e instanceof Error ? e.message : "Xəta",
      });
    } finally {
      setSavingSection(null);
    }
  }

  async function saveLearning() {
    if (!sessionId) return;
    setSavingSection("learn");
    try {
      const r = await api.updateSettings({
        sessionId,
        settings: {
          gunkuSualHediyye,
          cetinlikSeviyyesi: cetinlik,
          animasyonlar,
        },
      });
      setData(r);
      toast({ title: "Öyrənmə ayarları saxlanıldı ✓" });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Saxlanıla bilmədi",
        description: e instanceof Error ? e.message : "Xəta",
      });
    } finally {
      setSavingSection(null);
    }
  }

  async function handleReset() {
    if (!sessionId) return;
    setResetting(true);
    try {
      const r = await api.resetProgress(sessionId);
      toast({
        title: "Proqres sıfırlandı",
        description: r.mesaj || "Bütün məlumatlar silindi",
      });
      // logout — onboarding-ə qayıt
      setTimeout(() => {
        logout();
      }, 800);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Sıfırlanmadı",
        description: e instanceof Error ? e.message : "Xəta",
      });
    } finally {
      setResetting(false);
    }
  }

  async function handleChangePassword() {
    if (!sessionId || !oldPassword || newPassword.length < 4) return;
    setChangingPassword(true);
    try {
      await api.changePassword({ sessionId, oldPassword, newPassword });
      toast({ title: "Şifrə dəyişdirildi" });
      setOldPassword("");
      setNewPassword("");
    } catch (e) {
      toast({ variant: "destructive", title: "Xəta", description: e instanceof Error ? e.message : undefined });
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleDeleteAccount() {
    if (!sessionId || !deletePassword) return;
    setDeletingAccount(true);
    try {
      await api.deleteMyAccount({ sessionId, password: deletePassword });
      toast({ title: "Hesab silindi" });
      logout();
    } catch (e) {
      toast({ variant: "destructive", title: "Xəta", description: e instanceof Error ? e.message : undefined });
      setDeletingAccount(false);
    }
  }

  // === Loading ===
  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="size-6 animate-spin text-primary" />
        <p className="text-sm">Ayarlar yüklənir...</p>
      </div>
    );
  }

  const profil = data?.profil;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Ayarlar
        </p>
        <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
          Ayarlar və Profil
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Profili, imtahan konfiqurasiyasını və təcrübə ayarlarını idarə et
        </p>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="profil" className="space-y-6">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="profil" className="gap-1.5 px-3 py-1.5">
            <User className="size-3.5" />
            <span className="hidden sm:inline">Profil</span>
          </TabsTrigger>
          <TabsTrigger value="exam" className="gap-1.5 px-3 py-1.5">
            <CalendarClock className="size-3.5" />
            <span className="hidden sm:inline">İmtahan</span>
          </TabsTrigger>
          <TabsTrigger value="notif" className="gap-1.5 px-3 py-1.5">
            <Bell className="size-3.5" />
            <span className="hidden sm:inline">Bildirişlər</span>
          </TabsTrigger>
          <TabsTrigger value="learn" className="gap-1.5 px-3 py-1.5">
            <GraduationCap className="size-3.5" />
            <span className="hidden sm:inline">Öyrənmə</span>
          </TabsTrigger>
          <TabsTrigger value="danger" className="gap-1.5 px-3 py-1.5 text-destructive data-[state=active]:text-destructive">
            <AlertTriangle className="size-3.5" />
            <span className="hidden sm:inline">Təhlükəli zona</span>
          </TabsTrigger>
        </TabsList>

        {/* === Profil === */}
        <TabsContent value="profil" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="size-4 text-primary" />
                Profil məlumatları
              </CardTitle>
              <CardDescription>
                Email və parolunu dəyişə bilərsən · ad, doğum tarixi və qrup yalnız qeydiyyatda təyin olunur
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="settings-email">Email</Label>
                <Input
                  id="settings-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@nümunə.az"
                  className="max-w-md"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Qrup</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={QRUP_LABELS[profil?.qrup || "1"] || "—"}
                    disabled
                    className="max-w-md bg-muted/40"
                  />
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    read-only
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Qrup yalnız onboarding zamanı təyin olunur — dəyişdirilə bilməz
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Stat cards */}
          {profil && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Flame className="size-4 text-amber-500" />
                  Fəaliyyət statistikası
                </CardTitle>
                <CardDescription>Yalnız oxumaq üçün · dəyişdirilə bilməz</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <StatCard icon={Flame} label="Streak" value={profil.streak} suffix=" gün" accent="amber" />
                </div>
                <Separator className="my-3 bg-border/60" />
                <p className="text-[11px] text-muted-foreground">
                  Qeydiyyat: {azDateShort(new Date(profil.createdAt))}
                </p>
              </CardContent>
            </Card>
          )}

          <SectionFooter
            onSave={saveProfil}
            saving={savingSection === "profil"}
          />
        </TabsContent>

        {/* === İmtahan Ayarları === */}
        <TabsContent value="exam" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarClock className="size-4 text-primary" />
                İmtahan konfiqurasiyası
              </CardTitle>
              <CardDescription>
                İmtahan tarixi və parametrləri — dashboard-dakı geri sayım və bal hesablayıcı üçün istifadə olunur
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="settings-imtahan-tarixi">İmtahan tarixi</Label>
                <Input
                  id="settings-imtahan-tarixi"
                  type="date"
                  min={today}
                  value={imtahanTarixi}
                  onChange={(e) => setImtahanTarixi(e.target.value)}
                  className="max-w-md"
                />
              </div>
              <div className="space-y-1.5">
                <Label>İmtahan növü</Label>
                <RadioGroup
                  value={nov}
                  onValueChange={(v) => setNov(v as "tqdk" | "magistr")}
                  className="grid grid-cols-2 gap-2 sm:max-w-md"
                >
                  <label
                    htmlFor="nov-tqdk"
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-all active:scale-[0.98]",
                      nov === "tqdk"
                        ? "border-primary/40 bg-primary/5"
                        : "border-border hover:bg-muted/40"
                    )}
                  >
                    <RadioGroupItem id="nov-tqdk" value="tqdk" />
                    <div>
                      <div className="text-sm font-semibold">TQDK</div>
                      <div className="text-[11px] text-muted-foreground">Buraxılış imtahanı</div>
                    </div>
                  </label>
                  <label
                    htmlFor="nov-magistr"
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-all active:scale-[0.98]",
                      nov === "magistr"
                        ? "border-primary/40 bg-primary/5"
                        : "border-border hover:bg-muted/40"
                    )}
                  >
                    <RadioGroupItem id="nov-magistr" value="magistr" />
                    <div>
                      <div className="text-sm font-semibold">Magistr</div>
                      <div className="text-[11px] text-muted-foreground">Magistratura imtahanı</div>
                    </div>
                  </label>
                </RadioGroup>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Müddət (dəq)</Label>
                  <Select
                    value={String(müddet)}
                    onValueChange={(v) => setMüddet(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[60, 120, 180, 240].map((m) => (
                        <SelectItem key={m} value={String(m)}>
                          {m} dəq ({Math.floor(m / 60)} saat {m % 60} dəq)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Sual sayı</Label>
                  <Select
                    value={String(sualSayi)}
                    onValueChange={(v) => setSualSayi(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 20, 30, 50].map((s) => (
                        <SelectItem key={s} value={String(s)}>
                          {s} sual
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="settings-kecid-bali">Keçid balı</Label>
                  <Input
                    id="settings-kecid-bali"
                    type="number"
                    min={0}
                    value={kecidBali}
                    onChange={(e) => setKecidBali(Math.max(0, Number(e.target.value) || 0))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <SectionFooter onSave={saveExamConfig} saving={savingSection === "exam"} />
        </TabsContent>

        {/* === Bildirişlər === */}
        <TabsContent value="notif" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="size-4 text-primary" />
                Bildiriş ayarları
              </CardTitle>
              <CardDescription>
                Hansı bildirişləri almaq istədiyini idarə et
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <ToggleRow
                title="Bütün bildirişlər"
                desc="Master açar — bütün bildirişləri aktivləşdir"
                checked={bildirislerAktiv}
                onCheckedChange={setBildirislerAktiv}
              />
              <Separator className="bg-border/60" />
              <ToggleRow
                title="Günlük plan bildirişi"
                desc="Hər səhər günün planını xatırladan bildiriş"
                checked={gunlukPlanBildirisi}
                onCheckedChange={setGunlukPlanBildirisi}
                disabled={!bildirislerAktiv}
              />
              <Separator className="bg-border/60" />
              <ToggleRow
                title="Streak xəbərdarlığı"
                desc="Streak-it itirməmək üçün xəbərdarlıq"
                checked={streakXebardarligi}
                onCheckedChange={setStreakXebardarligi}
                disabled={!bildirislerAktiv}
              />
            </CardContent>
          </Card>
          <SectionFooter
            onSave={saveNotifications}
            saving={savingSection === "notif"}
          />
        </TabsContent>

        {/* === Öyrənmə === */}
        <TabsContent value="learn" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <GraduationCap className="size-4 text-primary" />
                Öyrənmə ayarları
              </CardTitle>
              <CardDescription>
                AI-nin sənə fərdi yanaşması üçün üstünlüklər
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Günkü sual hədiyyə */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-semibold">
                      Günkü sual hədiyyəsi
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Hər gün AI-nın tövsiyə etdiyi sual sayı
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="font-stat text-base font-bold text-primary"
                  >
                    {gunkuSualHediyye}
                  </Badge>
                </div>
                <Slider
                  value={[gunkuSualHediyye]}
                  min={5}
                  max={30}
                  step={1}
                  onValueChange={(v) => setGunkuSualHediyye(v[0])}
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>5</span>
                  <span>15</span>
                  <span>30</span>
                </div>
              </div>

              <Separator className="bg-border/60" />

              {/* Çətinlik səviyyəsi */}
              <div className="space-y-2">
                <div>
                  <Label className="text-sm font-semibold">Çətinlik səviyyəsi</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Sual generatoru və imtahan simulatoru üçün standart səviyyə
                  </p>
                </div>
                <RadioGroup
                  value={cetinlik}
                  onValueChange={(v) => setCetinlik(v as Cetinlik)}
                  className="grid grid-cols-1 gap-2 sm:grid-cols-3"
                >
                  {CETINLIK_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      htmlFor={`cetinlik-${opt.value}`}
                      className={cn(
                        "flex cursor-pointer flex-col gap-0.5 rounded-lg border p-3 transition-all active:scale-[0.98]",
                        cetinlik === opt.value
                          ? "border-primary/40 bg-primary/5"
                          : "border-border hover:bg-muted/40"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem
                          id={`cetinlik-${opt.value}`}
                          value={opt.value}
                        />
                        <span className="text-sm font-semibold">{opt.label}</span>
                      </div>
                      <span className="ml-6 text-[11px] text-muted-foreground">
                        {opt.desc}
                      </span>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <Separator className="bg-border/60" />

              {/* Animasyonlar */}
              <ToggleRow
                title="Animasyonlar"
                desc="UI keçid animasiyaları və mikro-interaksiyalar"
                checked={animasyonlar}
                onCheckedChange={setAnimasyonlar}
                icon={<Sparkles className="size-3.5 text-muted-foreground" />}
              />
            </CardContent>
          </Card>
          <SectionFooter
            onSave={saveLearning}
            saving={savingSection === "learn"}
          />
        </TabsContent>

        {/* === Təhlükəli zona === */}
        <TabsContent value="danger" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Şifrəni dəyiş</CardTitle>
              <CardDescription>Köhnə şifrənizi təsdiqləyib yenisini təyin edin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="old-pass">Köhnə şifrə</Label>
                <Input id="old-pass" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-pass">Yeni şifrə</Label>
                <Input id="new-pass" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Ən azı 4 simvol" />
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleChangePassword}
                  disabled={changingPassword || !oldPassword || newPassword.length < 4}
                  className="gap-1.5"
                >
                  {changingPassword && <Loader2 className="size-4 animate-spin" />}
                  Şifrəni yenilə
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-destructive">
                <AlertTriangle className="size-4" />
                Təhlükəli zona
              </CardTitle>
              <CardDescription>
                Bu əməliyyat geri alına bilməz — diqqətlə oxu
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                    <Trash2 className="size-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Proqresi sıfırla</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Bütün məlumatlar silinəcək: suallar, nailiyyətlər, flashcardlar,
                      dərslər, zəif mövzular, xəta nümunələri. Yalnız
                      profil məlumatın (ad, qrup, hədəf universite) saxlanılır.
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="gap-1.5 active:scale-95"
                      >
                        <Trash2 className="size-4" />
                        Proqresi Sıfırla
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="size-4 text-destructive" />
                          Əminsiniz?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Bütün məlumatlar silinəcək: suallar, nailiyyətlər, flashcardlar,
                          dərslər, zəif mövzular və streak. Profil saxlanılır.
                          Bu əməliyyat <strong>geri alına bilməz</strong>.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>İmtina</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleReset}
                          disabled={resetting}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {resetting ? (
                            <>
                              <Loader2 className="size-3.5 animate-spin" />
                              Sıfırlanır...
                            </>
                          ) : (
                            <>
                              <Trash2 className="size-3.5" />
                              Bəli, sıfırla
                            </>
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                    <Trash2 className="size-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Hesabı sil</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Hesabınız və bütün məlumatlarınız (suallar, nailiyyətlər, tapşırıqlar, qruplar,
                      mesajlar) HƏMİŞƏLİK silinəcək. Geri qaytarıla bilməz.
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-col items-end gap-2">
                  <Input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Təsdiq üçün şifrənizi yazın"
                    className="w-full"
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" disabled={!deletePassword} className="gap-1.5 active:scale-95">
                        <Trash2 className="size-4" />
                        Hesabı Sil
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="size-4 text-destructive" />
                          Tam əminsiniz?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Hesabınız və bütün məlumatlarınız HƏMİŞƏLİK silinəcək.
                          Bu əməliyyat <strong>geri alına bilməz</strong>.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>İmtina</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          disabled={deletingAccount}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {deletingAccount ? (
                            <>
                              <Loader2 className="size-3.5 animate-spin" />
                              Silinir...
                            </>
                          ) : (
                            <>
                              <Trash2 className="size-3.5" />
                              Bəli, hesabımı sil
                            </>
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// === Helpers ===

function SectionFooter({
  onSave,
  saving,
}: {
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="flex justify-end">
      <Button onClick={onSave} disabled={saving} className="gap-1.5 active:scale-95">
        {saving ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Save className="size-4" />
        )}
        Saxla
      </Button>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  accent,
}: {
  icon: typeof Zap;
  label: string;
  value: number;
  suffix?: string;
  accent: "primary" | "accent" | "amber";
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Icon
          className={cn(
            "size-3",
            accent === "primary" && "text-primary",
            accent === "accent" && "text-accent",
            accent === "amber" && "text-amber-500"
          )}
        />
        {label}
      </div>
      <div
        className={cn(
          "mt-1 font-stat text-xl font-bold tabular-nums",
          accent === "primary" && "text-primary",
          accent === "accent" && "text-accent",
          accent === "amber" && "text-amber-500"
        )}
      >
        {value}
        {suffix}
      </div>
    </div>
  );
}

function ToggleRow({
  title,
  desc,
  checked,
  onCheckedChange,
  disabled,
  icon,
}: {
  title: string;
  desc: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 py-3 transition-opacity",
        disabled && "opacity-50"
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {icon}
          <p className="text-sm font-semibold">{title}</p>
        </div>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{desc}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
}
