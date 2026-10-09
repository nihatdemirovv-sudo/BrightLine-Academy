"use client";

// Command Palette (Cmd+K / Ctrl+K) — instant navigation & quick actions.
// Uses the existing shadcn Command component (cmdk-based) wrapped in a Dialog.
// Mounted globally in app-shell (full command set) and on landing (limited).
import * as React from "react";
import {
  LayoutDashboard,
  Bot,
  Target,
  GraduationCap,
  Calculator,
  Repeat,
  BookOpen,
  Settings,
  Command as CommandIcon,
  Sparkles,
  FlaskConical,
  Microscope,
  Globe2,
  Languages,
  PenLine,
  FileQuestion,
  Layers,
  MonitorPlay,
  Monitor,
  FileText,
  ListChecks,
  Search as SearchIcon,
  ArrowRight,
  Landmark,
  FileEdit,
  Library,
  LifeBuoy,
  Users,
  UserCheck,
  MessageCircle,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { useStore } from "@/lib/store";
import type { AppView } from "@/lib/store";
import { ALL_FENLER } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface PaletteCommand {
  id: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  // keywords aid cmdk fuzzy search
  keywords?: string;
  onSelect: () => void;
}

interface CommandPaletteProps {
  // "app" = full command set (in-app); "landing" = limited (just onboarding)
  mode?: "app" | "landing";
  // Optional external open control. The palette also opens on Cmd/Ctrl+K.
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Mapping nav items to icons + labels
const NAV_ITEMS: { id: AppView; label: string; icon: LucideIcon; hint: string }[] = [
  { id: "dashboard", label: "Panelə get", icon: LayoutDashboard, hint: "Panel" },
  { id: "tutor", label: "AI Müəllim", icon: Bot, hint: "Söhbət" },
  { id: "generator", label: "Sual Generatoru", icon: Target, hint: "Sual yarat" },
  { id: "exam", label: "İmtahan Simulyatoru", icon: GraduationCap, hint: "Mock imtahan" },
  { id: "pastExam", label: "İmtahana Düşən Suallar", icon: FileText, hint: "Sualları həll et" },
  { id: "examQuestions", label: "İşlədiyiniz Sınaqlar", icon: ListChecks, hint: "Bitirilmiş sınaqlar" },
  { id: "arena", label: "Bilik Arenası", icon: Trophy, hint: "Real vaxtlı bilik yarışı" },
  { id: "score", label: "Bal Hesablayıcı", icon: Calculator, hint: "TQDK bal" },
  { id: "universityMatch", label: "Universitet Kodlaşdırması", icon: Landmark, hint: "Universitet ehtimalları" },
  { id: "review", label: "Təkrar Sistemi (Flashcards)", icon: Repeat, hint: "SRS" },
  { id: "lessons", label: "Dərs Təkrarı", icon: BookOpen, hint: "Mini-dərslər" },
  { id: "materials", label: "Dərs Materialları", icon: MonitorPlay, hint: "Video dərslər" },
  { id: "courses", label: "Kurslar", icon: Library, hint: "Tövsiyə olunan kurslar" },
  { id: "cvBuilder", label: "CV Yaratma", icon: FileEdit, hint: "AI köməyi ilə CV" },
  { id: "support", label: "Dəstək", icon: LifeBuoy, hint: "Problem üzrə müraciət et" },
  { id: "myTeacher", label: "Müəllimim", icon: UserCheck, hint: "Tapşırıq, material, imtahan" },
  { id: "messages", label: "Mesajlar", icon: MessageCircle, hint: "Müəllimlə şəxsi yazışma" },
  { id: "groups", label: "Qruplar", icon: Users, hint: "Şifrə ilə qorunan qrup söhbətləri" },
  { id: "settings", label: "Ayarlar", icon: Settings, hint: "Profil & ayarlar" },
];

// Subject icons — pick a sensible icon per fənn
const FENN_ICONS: Record<string, LucideIcon> = {
  Riyaziyyat: Calculator,
  Fizika: FlaskConical,
  Kimya: FlaskConical,
  Biologiya: Microscope,
  Tarix: BookOpen,
  "Ədəbiyyat": PenLine,
  "Coğrafiya": Globe2,
  "İngilis dili": Languages,
  "Azərbaycan dili": PenLine,
  "İnformatika": Monitor,
};

export function CommandPalette({
  mode = "app",
  open: openProp,
  onOpenChange,
}: CommandPaletteProps) {
  // Internal open state for the Cmd+K flow when uncontrolled.
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;
  const setOpen = React.useCallback(
    (v: boolean) => {
      if (isControlled) onOpenChange?.(v);
      else setInternalOpen(v);
    },
    [isControlled, onOpenChange]
  );

  // Global keyboard listener — Cmd+K (Mac) / Ctrl+K (others).
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setOpen(!open);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  const setAppView = useStore((s) => s.setAppView);
  const setSubjectDetailFenn = useStore((s) => s.setSubjectDetailFenn);
  const setView = useStore((s) => s.setView);
  const { toast } = useToast();

  // Wrap navigation to also close palette.
  const go = React.useCallback(
    (view: AppView) => {
      setOpen(false);
      // Defer navigation so the dialog can close first (smoother UX).
      setTimeout(() => setAppView(view), 30);
    },
    [setAppView, setOpen]
  );

  const goSubject = React.useCallback(
    (fenn: string) => {
      setOpen(false);
      setSubjectDetailFenn(fenn);
      setTimeout(() => setAppView("subjectDetail"), 30);
    },
    [setAppView, setSubjectDetailFenn, setOpen]
  );

  const startNow = React.useCallback(() => {
    setOpen(false);
    setTimeout(() => setView("auth"), 30);
  }, [setOpen, setView]);

  // Build nav commands
  const navCommands: PaletteCommand[] = React.useMemo(
    () =>
      NAV_ITEMS.map((n) => ({
        id: `nav-${n.id}`,
        label: n.label,
        hint: `→ ${n.hint}`,
        icon: n.icon,
        keywords: n.hint,
        onSelect: () => go(n.id),
      })),
    [go]
  );

  // Subject commands (9 fənn)
  const subjectCommands: PaletteCommand[] = React.useMemo(
    () =>
      ALL_FENLER.map((f) => ({
        id: `fenn-${f}`,
        label: `${f} detalı`,
        hint: "→ Mövzu detayı",
        icon: FENN_ICONS[f] || BookOpen,
        keywords: `${f} mövzu zəif tərəf drill`,
        onSelect: () => goSubject(f),
      })),
    [goSubject]
  );

  // Quick action commands
  const quickCommands: PaletteCommand[] = React.useMemo(
    () => [
      {
        id: "qa-create-question",
        label: "Sual yarat",
        hint: "→ Generator",
        icon: FileQuestion,
        onSelect: () => {
          setOpen(false);
          toast({
            title: "Fənn seç",
            description: "Aşağıdan fənn və mövzu seçib sual yaradın.",
          });
          setTimeout(() => setAppView("generator"), 30);
        },
      },
      {
        id: "qa-start-exam",
        label: "İmtahan başlat",
        hint: "→ İmtahan",
        icon: GraduationCap,
        onSelect: () => go("exam"),
      },
      {
        id: "qa-past-exam",
        label: "Real imtahan yüklə",
        hint: "→ İmtahana Düşən Suallar",
        icon: FileText,
        keywords: "pdf şəkil imtahan yüklə real keçmiş",
        onSelect: () => go("pastExam"),
      },
      {
        id: "qa-exam-questions",
        label: "Keçmiş imtahan suallarına bax",
        hint: "→ Keçmiş İmtahan Sualları",
        icon: FileText,
        keywords: "keçmiş sual bax oxu admin yükləmiş",
        onSelect: () => go("examQuestions"),
      },
      {
        id: "qa-review",
        label: "Təkrar et",
        hint: "→ Flashcards",
        icon: Repeat,
        onSelect: () => go("review"),
      },
      {
        id: "qa-create-lesson",
        label: "Dərs yarat",
        hint: "→ Dərslər",
        icon: BookOpen,
        onSelect: () => go("lessons"),
      },
      {
        id: "qa-search-materials",
        label: "Video dərs axtar",
        hint: "→ Materiallar",
        icon: MonitorPlay,
        keywords: "video youtube axtar material dərs",
        onSelect: () => go("materials"),
      },
      {
        id: "qa-calc-score",
        label: "Bal hesabla",
        hint: "→ Bal Hesablayıcı",
        icon: Calculator,
        onSelect: () => go("score"),
      },
      {
        id: "qa-review-cards",
        label: "Təkləri təkrar et",
        hint: "→ Flashcards",
        icon: Layers,
        keywords: "təkrar kart flashcard srs",
        onSelect: () => go("review"),
      },
    ],
    [go, setAppView, setOpen, toast]
  );

  // Landing mode: limited commands.
  const landingCommands: PaletteCommand[] = React.useMemo(
    () => [
      {
        id: "land-start",
        label: "Hazırlaşmağa başla",
        hint: "→ Giriş",
        icon: Sparkles,
        keywords: "başla pulsuz qeydiyyat",
        onSelect: startNow,
      },
    ],
    [startNow]
  );

  if (mode === "landing") {
    return (
      <CommandDialog
        title="Əmr Paneli"
        description="Tez başlamaq üçün bir əmr seçin"
        open={open}
        onOpenChange={setOpen}
        className="sm:max-w-md"
      >
        <CommandInput placeholder="Əmr axtar..." />
        <CommandList>
          <CommandEmpty>
            <span className="flex flex-col items-center gap-2 py-2 text-muted-foreground">
              <SearchIcon className="size-5 opacity-50" />
              <span>Heç nə tapılmadı</span>
            </span>
          </CommandEmpty>
          <CommandGroup heading="Başla">
            {landingCommands.map((c) => (
              <PaletteItem key={c.id} cmd={c} />
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    );
  }

  return (
    <CommandDialog
      title="Əmr Paneli"
      description="Səhifələr, fənnlər və tez əməliyyatlar"
      open={open}
      onOpenChange={setOpen}
    >
      <CommandInput placeholder="Əmr və ya səhifə axtar..." />
      <CommandList>
        <CommandEmpty>
          <span className="flex flex-col items-center gap-2 py-2 text-muted-foreground">
            <SearchIcon className="size-5 opacity-50" />
            <span>Heç nə tapılmadı</span>
          </span>
        </CommandEmpty>

        <CommandGroup heading="Səhifələr">
          {navCommands.map((c) => (
            <PaletteItem key={c.id} cmd={c} />
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Fənnlər">
          {subjectCommands.map((c) => (
            <PaletteItem key={c.id} cmd={c} />
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Tez əməliyyatlar">
          {quickCommands.map((c) => (
            <PaletteItem key={c.id} cmd={c} />
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

function PaletteItem({ cmd }: { cmd: PaletteCommand }) {
  const Icon = cmd.icon;
  return (
    <CommandItem
      value={`${cmd.label} ${cmd.keywords || ""}`}
      onSelect={cmd.onSelect}
      className="group"
    >
      <span className="flex size-7 items-center justify-center rounded-md bg-muted/50 text-muted-foreground transition-colors group-data-[selected=true]:bg-primary/10 group-data-[selected=true]:text-primary">
        <Icon className="size-4" />
      </span>
      <span className="flex-1 font-medium">{cmd.label}</span>
      {cmd.hint && (
        <span className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground">
          {cmd.hint}
          <ArrowRight className="size-3 opacity-60" />
        </span>
      )}
    </CommandItem>
  );
}

// Standalone trigger button — small ghost with the ⌘K hint.
// Mount in headers next to the theme toggle.
export function CommandPaletteTrigger({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Əmr panelini aç (⌘K)"
      title="Əmr panelini aç (⌘K)"
      className={
        "inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground " +
        (className ?? "")
      }
    >
      <CommandIcon className="size-3.5" />
      <kbd className="hidden font-sans text-[10px] font-medium sm:inline">⌘K</kbd>
    </button>
  );
}
