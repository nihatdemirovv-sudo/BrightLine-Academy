"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Library,
  FileCheck2,
  MessageSquare,
  LifeBuoy,
  Settings,
  LogOut,
  Loader2,
  Trash2,
  AlertTriangle,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ThemeToggle } from "@/components/theme-toggle";
import { Groups } from "@/components/groups";
import { TeacherStudents, TeacherStudentSearch } from "@/components/teacher/teacher-students";
import { TeacherMaterials } from "@/components/teacher/teacher-materials";
import { TeacherExams } from "@/components/teacher/teacher-exams";
import { Support } from "@/components/support";
import { DirectMessages } from "@/components/direct-messages";
import { UnreadBadge } from "@/components/unread-badge";
import { useMarkSeen, useUnreadPolling, useUnreadStore } from "@/lib/unread";
import type { UnreadCounts } from "@/lib/api";
import { api } from "@/lib/api";
import { useStore, type TeacherView } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface NavItem {
  id: TeacherView;
  label: string;
  icon: typeof LayoutDashboard;
}

const NAV_ITEMS: NavItem[] = [
  { id: "panel", label: "Panel", icon: LayoutDashboard },
  { id: "students", label: "Tələbələrim", icon: Users },
  { id: "student-search", label: "Tələbə axtar", icon: UserPlus },
  { id: "materials", label: "Materiallar", icon: Library },
  { id: "exams", label: "İmtahanlar", icon: FileCheck2 },
  { id: "messages", label: "Mesajlar", icon: MessageCircle },
  { id: "groups", label: "Qruplar", icon: MessageSquare },
  { id: "support", label: "Dəstək", icon: LifeBuoy },
  { id: "settings", label: "Ayarlar", icon: Settings },
];

// Müəllim nav bəndlərinin oxunmamış sayı: yoxlanılmamış imtahan cavabları, tələbə şərhləri, mesajlar.
function navBadge(id: TeacherView, c: UnreadCounts | null): number {
  if (!c) return 0;
  switch (id) {
    case "students":
      return c.students ?? 0;
    case "exams":
      return c.exams ?? 0;
    case "messages":
      return c.messages.total;
    case "groups":
      return c.groups.total;
    case "support":
      return c.support.total;
    default:
      return 0;
  }
}

export function TeacherShell() {
  const { student, sessionId, logout } = useStore();
  const [view, setView] = React.useState<TeacherView>("panel");
  useUnreadPolling(sessionId);
  const unread = useUnreadStore((s) => s.counts);
  // "Tələbələrim" açılanda tələbələrin yeni tapşırıq şərhləri oxunmuş sayılır.
  useMarkSeen("t:students", view === "students");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brightline-icon.png" alt="" className="h-9 w-auto" />
            <div className="flex flex-col leading-tight">
              <span className="font-heading text-sm font-bold">BrightLine Academy</span>
              <p className="hidden text-[11px] text-muted-foreground sm:block">Müəllim paneli</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="hidden items-center gap-2 sm:flex">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {(student?.ad || "M").slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="max-w-[10rem] truncate text-sm font-medium">{student?.ad}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} title="Çıxış">
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>

        {/* Nav */}
        <div className="mx-auto max-w-5xl overflow-x-auto px-4 pb-2">
          <nav className="flex w-max min-w-full gap-1.5">
            {NAV_ITEMS.map((item) => {
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={cn(
                    "relative flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                  <UnreadBadge count={navBadge(item.id, unread)} />
                  {active && (
                    <motion.span
                      layoutId="teacher-nav-active"
                      className="absolute inset-x-2 -bottom-2 h-0.5 rounded-full bg-primary"
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto w-full min-w-0 max-w-5xl flex-1 overflow-x-hidden px-4 py-6">
        {view === "panel" && <TeacherPanelHome onNav={setView} />}
        {view === "students" && <TeacherStudents />}
        {view === "student-search" && <TeacherStudentSearch />}
        {view === "materials" && <TeacherMaterials />}
        {view === "exams" && <TeacherExams />}
        {view === "messages" && <DirectMessages />}
        {view === "groups" && <Groups />}
        {view === "support" && <Support />}
        {view === "settings" && <TeacherSettings />}
      </main>
    </div>
  );
}

function TeacherPanelHome({ onNav }: { onNav: (v: TeacherView) => void }) {
  const { student } = useStore();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-xl font-bold">Xoş gəldiniz, {student?.ad}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bu paneldən tələbələrinizə tapşırıq/material/imtahan paylaşa, mesajlaşa bilərsiniz.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <button
          onClick={() => onNav("students")}
          className="rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40"
        >
          <Users className="size-5 text-primary" />
          <p className="mt-2 font-semibold">Tələbələrim</p>
          <p className="mt-1 text-xs text-muted-foreground">Axtar, qeydə al, tapşırıq aç, fəaliyyəti izlə</p>
        </button>
        <button
          onClick={() => onNav("materials")}
          className="rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40"
        >
          <Library className="size-5 text-primary" />
          <p className="mt-2 font-semibold">Materiallar</p>
          <p className="mt-1 text-xs text-muted-foreground">Bütün tələbələrin read-only gördüyü fayllar</p>
        </button>
        <button
          onClick={() => onNav("exams")}
          className="rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40"
        >
          <FileCheck2 className="size-5 text-primary" />
          <p className="mt-2 font-semibold">İmtahanlar</p>
          <p className="mt-1 text-xs text-muted-foreground">Elan et, cavabları yoxla, feedback göndər</p>
        </button>
      </div>
    </div>
  );
}

function TeacherSettings() {
  const { sessionId, student, logout } = useStore();
  const { toast } = useToast();
  const [oldPassword, setOldPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [changingPassword, setChangingPassword] = React.useState(false);
  const [deletePassword, setDeletePassword] = React.useState("");
  const [deletingAccount, setDeletingAccount] = React.useState(false);

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

  return (
    <div className="max-w-md space-y-4">
      <h1 className="font-heading text-xl font-bold">Ayarlar</h1>
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-12">
            <AvatarFallback className="bg-primary/10 text-base font-semibold text-primary">
              {(student?.ad || "M").slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{student?.ad}</p>
            <p className="text-xs text-muted-foreground">Müəllim hesabı — təsdiqlənib</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <p className="text-sm font-semibold">Şifrəni dəyiş</p>
        <div className="space-y-1.5">
          <Label htmlFor="t-old-pass">Köhnə şifrə</Label>
          <Input id="t-old-pass" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="t-new-pass">Yeni şifrə</Label>
          <Input id="t-new-pass" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Ən azı 4 simvol" />
        </div>
        <Button
          onClick={handleChangePassword}
          disabled={changingPassword || !oldPassword || newPassword.length < 4}
          className="w-full gap-1.5"
        >
          {changingPassword && <Loader2 className="size-4 animate-spin" />}
          Şifrəni yenilə
        </Button>
      </div>

      <Button variant="outline" className="w-full gap-2" onClick={logout}>
        <LogOut className="size-4" />
        Hesabdan çıxış
      </Button>

      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
          <AlertTriangle className="size-4" />
          Hesabı sil
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Hesabınız və bütün məlumatlarınız (tələbələr, tapşırıqlar, materiallar, qruplar) HƏMİŞƏLİK
          silinəcək. Geri qaytarıla bilməz.
        </p>
        <Input
          type="password"
          value={deletePassword}
          onChange={(e) => setDeletePassword(e.target.value)}
          placeholder="Təsdiq üçün şifrənizi yazın"
        />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={!deletePassword} className="w-full gap-1.5">
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
  );
}
