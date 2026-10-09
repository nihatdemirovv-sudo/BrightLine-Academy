"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Bot,
  Target,
  LogOut,
  Menu,
  Flame,
  GraduationCap,
  Calculator,
  MoreHorizontal,
  Settings,
  MonitorPlay,
  FileText,
  ListChecks,
  BookOpen,
  Landmark,
  FileEdit,
  Library,
  LifeBuoy,
  Users,
  UserCheck,
  Trophy,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { CommandPalette, CommandPaletteTrigger } from "@/components/command-palette";
import { Dashboard } from "@/components/dashboard/dashboard";
import { AITutor } from "@/components/ai-tutor";
import { QuestionGenerator } from "@/components/question-generator";

import { ExamSimulator } from "@/components/exam-simulator";
import { ScoreSimulator } from "@/components/score-simulator";
import { UniversityMatch } from "@/components/university-match";
import { CvBuilder } from "@/components/cv-builder";
import { FlashcardReview } from "@/components/flashcard-review";
import { MiniLessons } from "@/components/mini-lessons";
import { MaterialsBrowser } from "@/components/materials-browser";
import { Courses } from "@/components/courses";
import { Support } from "@/components/support";
import { MyTeacherPanel } from "@/components/my-teacher-panel";
import { Groups } from "@/components/groups";
import { KnowledgeArena } from "@/components/arena/knowledge-arena";
import { SettingsPanel } from "@/components/settings-panel";
import { SubjectDetail } from "@/components/subject-detail";
import { ExamQuestionsView } from "@/components/exam-questions-view";
import { CompletedExamsView } from "@/components/completed-exams-view";
import { StudyTimer } from "@/components/study-timer";
import { DirectMessages } from "@/components/direct-messages";
import { UnreadBadge, UnreadDot } from "@/components/unread-badge";
import { useUnreadPolling, useUnreadStore, totalUnread } from "@/lib/unread";
import type { UnreadCounts } from "@/lib/api";
import { useStore } from "@/lib/store";
import { useNotificationScheduler } from "@/hooks/use-notification-scheduler";
import type { AppView } from "@/lib/store";
import { cn } from "@/lib/utils";

interface NavItem {
  id: AppView;
  label: string;
  shortLabel: string;
  icon: typeof LayoutDashboard;
  desc: string;
}

// Desktop hamısını göstərir; mobil bottom-nav-də ən vacib 4 + "Daha" menyusu
const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Panel", shortLabel: "Panel", icon: LayoutDashboard, desc: "Ümumi baxış" },
  { id: "tutor", label: "AI Müəllim", shortLabel: "AI", icon: Bot, desc: "Söhbət" },
  { id: "generator", label: "Sual Generatoru", shortLabel: "Sual", icon: Target, desc: "Sual yarat" },
  { id: "exam", label: "İmtahan Simulyatoru", shortLabel: "İmtahan", icon: GraduationCap, desc: "Mock imtahan" },
  { id: "pastExam", label: "İmtahana Düşən Suallar", shortLabel: "Sınaq", icon: FileText, desc: "Sualları həll et" },
  { id: "examQuestions", label: "İşlədiyiniz Sınaqlar", shortLabel: "Sınaqlar", icon: ListChecks, desc: "Bitirilmiş sınaqlar" },
  { id: "arena", label: "Bilik Arenası", shortLabel: "Arena", icon: Trophy, desc: "Real vaxtlı bilik yarışı" },
  { id: "score", label: "Bal Hesablayıcı", shortLabel: "Bal", icon: Calculator, desc: "TQDK bal proqnozu" },
  { id: "universityMatch", label: "Universitet Kodlaşdırması", shortLabel: "Univ.", icon: Landmark, desc: "Uyğun universitet ehtimalları" },
  { id: "lessons", label: "Dərs Təkrarı", shortLabel: "Təkrar", icon: BookOpen, desc: "AI mini-dərslər" },
  { id: "materials", label: "Dərs Materialları", shortLabel: "Materiallar", icon: MonitorPlay, desc: "Video dərslər" },
  { id: "courses", label: "Kurslar", shortLabel: "Kurslar", icon: Library, desc: "Tövsiyə olunan kurslar" },
  { id: "cvBuilder", label: "CV Yaratma", shortLabel: "CV", icon: FileEdit, desc: "AI köməyi ilə CV hazırla" },
  { id: "support", label: "Dəstək", shortLabel: "Dəstək", icon: LifeBuoy, desc: "Problem üzrə müraciət et" },
  { id: "myTeacher", label: "Müəllimim", shortLabel: "Müəllim", icon: UserCheck, desc: "Tapşırıq, material, imtahan" },
  { id: "messages", label: "Mesajlar", shortLabel: "Mesajlar", icon: MessageCircle, desc: "Müəllimlə şəxsi yazışma" },
  { id: "groups", label: "Qruplar", shortLabel: "Qruplar", icon: Users, desc: "Şifrə ilə qorunan qrup söhbətləri" },
  { id: "settings", label: "Ayarlar", shortLabel: "Ayarlar", icon: Settings, desc: "Profil & ayarlar" },
];

// Mobil alt-nav-də öncəlikli göstərilənlər (qalan "Daha" menyusuna düşür)
const MOBILE_PRIMARY: AppView[] = ["dashboard", "generator", "exam", "score"];
const MOBILE_SECONDARY: AppView[] = ["tutor", "pastExam", "examQuestions", "arena", "lessons", "materials", "support", "myTeacher", "messages", "groups", "settings"];

// Hər nav bəndinin oxunmamış sayı (qırmızı badge, 99-dan çox olanda "99+").
function navBadge(id: AppView, c: UnreadCounts | null): number {
  if (!c) return 0;
  switch (id) {
    case "groups":
      return c.groups.total;
    case "support":
      return c.support.total;
    case "messages":
      return c.messages.total;
    case "myTeacher":
      return c.myTeacher?.total ?? 0;
    case "arena":
      return c.arena ?? 0;
    default:
      return 0;
  }
}

export function AppShell() {
  const { student, sessionId, appView, setAppView, logout, setView } = useStore();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  useUnreadPolling(sessionId);
  const unread = useUnreadStore((s) => s.counts);
  const secondaryUnread = MOBILE_SECONDARY.reduce((sum, id) => sum + navBadge(id, unread), 0);

  // Səhifələr arası keçəndə (məs. Sual Generatoru → Panel → geri) canlı vəziyyət
  // (davam edən test, yazılan mətn və s.) İTMƏSİN deyə hər görüş bir dəfə "ziyarət
  // edilmiş" kimi işarələnir və bir daha unmount olunmur — sadəcə CSS ilə gizlədilir.
  const [visitedViews, setVisitedViews] = React.useState<Set<AppView>>(() => new Set([appView]));
  React.useEffect(() => {
    setVisitedViews((prev) => (prev.has(appView) ? prev : new Set(prev).add(appView)));
  }, [appView]);

  // Notification scheduler — daily reminders + exam countdown
  useNotificationScheduler({
    enabled: !!student,
    examDate: (student as any)?.examConfig?.imtahanTarixi || null,
  });

  // Əgər student yoxdursa landing-ə qayıt
  React.useEffect(() => {
    if (!student) {
      setView("auth");
    }
  }, [student, setView]);

  if (!student) return null;

  const initials = student.ad
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function handleNav(item: AppView) {
    setAppView(item);
    setMobileOpen(false);
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-sidebar/40 backdrop-blur-sm lg:flex">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-border px-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brightline-icon.png" alt="" className="h-8 w-auto" />
          <span className="font-heading text-sm font-bold">BrightLine Academy</span>
        </div>

        {/* Student card */}
        <div className="border-b border-border p-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-10 border border-border">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                {initials || "Ş"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{student.ad}</p>
              <p className="truncate text-xs text-muted-foreground">
                {student.qrup === "magistr" ? "Magistr" : `${student.qrup}-ci qrup`}
              </p>
            </div>
          </div>
          {student.streak > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <Badge variant="outline" className="gap-1 text-[10px] text-amber-500">
                <Flame className="size-2.5" /> {student.streak} gün
              </Badge>
            </div>
          )}
        </div>

        {/* Nav — premium aktiv state (left accent bar + depth) */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV_ITEMS.filter((i) => i.id !== "settings").map((item) => {
            const active = appView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={cn(
                  "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                  active
                    ? "bg-primary/5 text-primary font-semibold shadow-sm ring-1 ring-primary/10"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active-bar"
                    className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary"
                  />
                )}
                <item.icon
                  className={cn(
                    "size-4 shrink-0 transition-colors",
                    active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span className="flex-1 text-left">{item.label}</span>
                <UnreadBadge count={navBadge(item.id, unread)} />
              </button>
            );
          })}
        </nav>

        {/* Footer — Settings + ⌘K trigger + ThemeToggle + Logout */}
        <div className="border-t border-border p-3">
          <button
            onClick={() => handleNav("settings")}
            className={cn(
              "group relative mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
              appView === "settings"
                ? "bg-primary/5 text-primary font-semibold shadow-sm ring-1 ring-primary/10"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {appView === "settings" && (
              <motion.span
                layoutId="nav-active-bar"
                className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary"
              />
            )}
            <Settings
              className={cn(
                "size-4 shrink-0 transition-colors",
                appView === "settings"
                  ? "text-primary"
                  : "text-muted-foreground group-hover:text-foreground"
              )}
            />
            <span className="flex-1 text-left">Ayarlar</span>
          </button>
          <Separator className="my-2 bg-border" />
          <div className="flex items-center justify-between gap-1">
            <CommandPaletteTrigger onClick={() => setPaletteOpen(true)} />
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={logout} className="gap-1.5 text-xs">
              <LogOut className="size-3.5" />
              Çıxış
            </Button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-lg lg:hidden">
          <div className="flex items-center gap-2.5">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative size-9">
                  <Menu className="size-5" />
                  <UnreadDot show={totalUnread(unread) > 0} className="right-1 top-1" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                {/* Başlıq + tələbə kartı + naviqasiya bir yerdə sürüşdürülür (mobil ekranda
                    hamısı sığmaya bilər — footer sabit qalır, bu blok müstəqil scroll olunur
                    ki, aşağıdakı nav item-lər (məs. Dəstək) həmişə əlçatan olsun). */}
                <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                  <SheetHeader className="border-b border-border">
                    <SheetTitle className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/brightline-icon.png" alt="" className="h-8 w-auto" />
                      <span className="font-heading text-sm font-bold">BrightLine Academy</span>
                    </SheetTitle>
                  </SheetHeader>
                  {/* Student card */}
                  <div className="border-b border-border p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10 border border-border">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                          {initials || "Ş"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{student.ad}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {student.qrup === "magistr" ? "Magistr" : `${student.qrup}-ci qrup`}
                        </p>
                      </div>
                    </div>
                    {student.streak > 0 && (
                      <div className="mt-3 flex items-center gap-2">
                        <Badge variant="outline" className="gap-1 text-[10px] text-amber-500">
                          <Flame className="size-2.5" /> {student.streak}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <nav className="space-y-1 p-3">
                    {NAV_ITEMS.map((item) => {
                      const active = appView === item.id;
                      return (
                        <SheetClose asChild key={item.id}>
                          <button
                            onClick={() => handleNav(item.id)}
                            className={cn(
                              "relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                              active
                                ? "bg-primary/5 font-semibold text-primary shadow-sm ring-1 ring-primary/10"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                          >
                            {active && (
                              <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
                            )}
                            <item.icon className="size-4 shrink-0" />
                            <span className="flex-1 text-left">{item.label}</span>
                            <UnreadBadge count={navBadge(item.id, unread)} />
                          </button>
                        </SheetClose>
                      );
                    })}
                  </nav>
                </div>
                <div className="shrink-0 border-t border-border p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <ThemeToggle />
                    <Button variant="ghost" size="sm" onClick={logout} className="gap-1.5 text-xs">
                      <LogOut className="size-3.5" />
                      Çıxış
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brightline-icon.png" alt="BrightLine Academy" className="h-7 w-auto" />
          </div>
          <div className="flex items-center gap-1">
            <CommandPaletteTrigger onClick={() => setPaletteOpen(true)} />
            <ThemeToggle className="size-8" />
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-x-hidden px-4 pb-24 pt-4 sm:px-6 lg:pb-8 lg:pt-6">
          <div className="mx-auto w-full max-w-6xl">
            {/* Hər görüş yalnız İLK ziyarətdə mount olunur, sonra bir daha unmount
                edilmir (yalnız gizlədilir) — davam edən test/söhbət/forma vəziyyəti
                başqa səhifəyə keçib-qayıdanda qorunur. */}
            {(
              [
                ["dashboard", <Dashboard key="dashboard" />],
                ["tutor", <AITutor key="tutor" />],
                ["generator", <QuestionGenerator key="generator" />],
                ["exam", <ExamSimulator key="exam" />],
                ["pastExam", <ExamQuestionsView key="pastExam" />],
                ["examQuestions", <CompletedExamsView key="examQuestions" />],
                ["score", <ScoreSimulator key="score" />],
                ["universityMatch", <UniversityMatch key="universityMatch" />],
                ["cvBuilder", <CvBuilder key="cvBuilder" />],
                ["review", <FlashcardReview key="review" />],
                ["lessons", <MiniLessons key="lessons" />],
                ["materials", <MaterialsBrowser key="materials" />],
                ["courses", <Courses key="courses" />],
                ["support", <Support key="support" />],
                ["myTeacher", <MyTeacherPanel key="myTeacher" />],
                ["groups", <Groups key="groups" />],
                ["messages", <DirectMessages key="messages" />],
                ["arena", <KnowledgeArena key="arena" />],
                ["settings", <SettingsPanel key="settings" />],
                ["subjectDetail", <SubjectDetail key="subjectDetail" />],
              ] as [AppView, React.ReactElement][]
            ).map(
              ([id, node]) =>
                visitedViews.has(id) && (
                  <div
                    key={id}
                    className={cn(
                      "animate-in fade-in slide-in-from-bottom-1 duration-200",
                      appView === id ? "block" : "hidden"
                    )}
                  >
                    {node}
                  </div>
                )
            )}
          </div>
        </main>

        {/* Mobile bottom nav — 4 öncəlikli + "Daha" menyusu (7 nav elementi təmiz saxlayır) */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-5 border-t border-border bg-background/95 backdrop-blur-lg lg:hidden">
          {MOBILE_PRIMARY.map((id) => {
            const item = NAV_ITEMS.find((n) => n.id === id)!;
            const active = appView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className={cn("size-5", active && "text-primary")} />
                <span className="truncate px-1">{item.shortLabel}</span>
                {active && (
                  <motion.div
                    layoutId="bottom-nav-active"
                    className="absolute -top-px h-0.5 w-8 rounded-full bg-primary"
                  />
                )}
              </button>
            );
          })}
          {/* "Daha" menyusu — qalan 3 nav */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors",
                  MOBILE_SECONDARY.includes(appView) ? "text-primary" : "text-muted-foreground"
                )}
              >
                <MoreHorizontal className={cn("size-5", MOBILE_SECONDARY.includes(appView) && "text-primary")} />
                <UnreadBadge count={secondaryUnread} className="absolute right-1/2 top-1 h-4 min-w-4 translate-x-5 px-1 text-[9px]" />
                <span className="truncate px-1">Daha</span>
                {MOBILE_SECONDARY.includes(appView) && (
                  <motion.div
                    layoutId="bottom-nav-active"
                    className="absolute -top-px h-0.5 w-8 rounded-full bg-primary"
                  />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="mb-2 w-44">
              {MOBILE_SECONDARY.map((id, idx) => {
                const item = NAV_ITEMS.find((n) => n.id === id)!;
                const active = appView === item.id;
                const isSettings = id === "settings";
                return (
                  <React.Fragment key={item.id}>
                    {isSettings && idx > 0 && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                      onClick={() => handleNav(item.id)}
                      className={cn(
                        "gap-2",
                        active && "font-semibold text-primary",
                        isSettings && "text-muted-foreground"
                      )}
                    >
                      <item.icon className="size-4" />
                      <span className="flex-1">{item.label}</span>
                      <UnreadBadge count={navBadge(item.id, unread)} />
                    </DropdownMenuItem>
                  </React.Fragment>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>

      {/* Floating study timer — yalnız app içərisində görünür */}
      <StudyTimer />

      {/* Command palette (Cmd+K) — global nav & quick actions */}
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />

    </div>
  );
}
