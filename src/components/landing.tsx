"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Bot,
  Sparkles,
  CalendarCheck,
  Landmark,
  FileEdit,
  Infinity as InfinityIcon,
  ArrowRight,
  BookOpen,
  Trophy,
  Mic,
  Star,
  TrendingUp,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { CommandPalette, CommandPaletteTrigger } from "@/components/command-palette";
import { useStore } from "@/lib/store";

const features = [
  {
    icon: Bot,
    title: "AI Müəllim",
    desc: "Yazılı və ya səsli sorğu ver — AI məsələləri addım-addım həll edir və izah edir.",
    accent: "from-primary/10 to-primary/5",
  },
  {
    icon: InfinityIcon,
    title: "Sonsuz Sual Generatoru",
    desc: "Hər mövzuda, hər çətinlik səviyyəsində orijinal A/B/C/D/E suallar — sonsuz sayda.",
    accent: "from-accent/15 to-accent/5",
  },
  {
    icon: CalendarCheck,
    title: "Fərdi Hazırlıq Planı",
    desc: "Günlük AI planı zəif tərəflərinə görə avtomatik tənzimlənir.",
    accent: "from-primary/10 to-accent/5",
  },
  {
    icon: Landmark,
    title: "Universitet Uyğunlaşdırma",
    desc: "Balına görə hansı universitet və ixtisaslara keçə biləcəyini anında gör.",
    accent: "from-accent/10 to-primary/5",
  },
];

const stats = [
  { value: "9", label: "Fənn" },
  { value: "15+", label: "İmtahan Növü" },
  { value: "100%", label: "Azərbaycan dilində" },
];

// Social proof avatars — placeholder initials
const AVATARS = [
  { initials: "Nİ", color: "bg-primary/15 text-primary" },
  { initials: "ƏM", color: "bg-accent/15 text-accent" },
  { initials: "AK", color: "bg-amber-500/15 text-amber-500" },
  { initials: "GR", color: "bg-primary/15 text-primary" },
  { initials: "SƏ", color: "bg-accent/15 text-accent" },
];

// === B2b: Product mockup (stylized, abstract, premium) ===
function ProductMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
      className="relative mx-auto w-full max-w-md"
    >
      {/* Subtle float animation wrapper */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="relative"
      >
        {/* Glow */}
        <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-primary/15 via-accent/10 to-transparent blur-2xl" />

        <Card className="overflow-hidden border-border/60 shadow-xl backdrop-blur-sm">
          <CardContent className="space-y-4 p-5">
            {/* Mock window chrome */}
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Sparkles className="size-4" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="font-heading text-xs font-bold">BrightLine Paneli</span>
                  <span className="text-[10px] text-muted-foreground">Canlı demo</span>
                </div>
              </div>
              <Badge variant="outline" className="gap-1 text-[9px]">
                <span className="size-1.5 rounded-full bg-accent" />
                Aktiv
              </Badge>
            </div>

            {/* Mock top metrics */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-border/60 bg-muted/30 p-2.5">
                <Trophy className="size-3.5 text-accent" />
                <div className="mt-1 font-stat text-base font-bold text-accent">620</div>
                <div className="text-[9px] text-muted-foreground">Bal</div>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/30 p-2.5">
                <Target className="size-3.5 text-primary" />
                <div className="mt-1 font-stat text-base font-bold text-primary">142</div>
                <div className="text-[9px] text-muted-foreground">Sual</div>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/30 p-2.5">
                <TrendingUp className="size-3.5 text-accent" />
                <div className="mt-1 font-stat text-base font-bold text-accent">76%</div>
                <div className="text-[9px] text-muted-foreground">Dəqiqlik</div>
              </div>
            </div>

            {/* Mock circular progress ring + bar chart */}
            <div className="grid grid-cols-[auto_1fr] items-center gap-4 rounded-lg border border-border/60 bg-muted/20 p-3">
              {/* SVG circular ring */}
              <div className="relative size-16">
                <svg className="size-full -rotate-90" viewBox="0 0 64 64">
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    fill="none"
                    stroke="currentColor"
                    className="text-muted-foreground/20"
                    strokeWidth="6"
                  />
                  <motion.circle
                    cx="32"
                    cy="32"
                    r="26"
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 26}
                    initial={{ strokeDashoffset: 2 * Math.PI * 26 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 26 * (1 - 0.76) }}
                    transition={{ duration: 1.5, delay: 0.6, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-stat text-sm font-bold text-primary">76%</span>
                  <span className="text-[8px] text-muted-foreground">ümumi</span>
                </div>
              </div>
              {/* Mini bar chart */}
              <div className="space-y-1.5">
                {[
                  { label: "Riyaziyyat", pct: 82, color: "bg-primary" },
                  { label: "Fizika", pct: 64, color: "bg-accent" },
                  { label: "Kimya", pct: 48, color: "bg-amber-500" },
                ].map((bar, i) => (
                  <div key={bar.label} className="space-y-0.5">
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="text-muted-foreground">{bar.label}</span>
                      <span className="font-stat font-semibold text-foreground">{bar.pct}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${bar.pct}%` }}
                        transition={{ duration: 0.9, delay: 0.8 + i * 0.15, ease: "easeOut" }}
                        className={bar.color}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mock AI chat bubble */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 0.4 }}
              className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3"
            >
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Bot className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold">AI Müəllim</span>
                  <span className="size-1.5 rounded-full bg-accent" />
                </div>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                  Logarifm qaydasını yaxşı başa düşürsən. İndi <span className="font-semibold text-foreground">log₂(8) = ?</span> sualını yoxlayaq...
                </p>
              </div>
            </motion.div>
          </CardContent>
        </Card>

        {/* Floating streak badge */}
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -left-3 bottom-8 flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 shadow-lg"
        >
          <span className="text-base">🔥</span>
          <span className="font-stat text-xs font-bold text-foreground">7 gün streak</span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export function Landing() {
  const setView = useStore((s) => s.setView);
  const howItWorksRef = React.useRef<HTMLElement | null>(null);
  const [paletteOpen, setPaletteOpen] = React.useState(false);

  function scrollToHowItWorks() {
    howItWorksRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/30" />
        <div className="absolute -top-40 left-1/2 h-[40rem] w-[60rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/3 -right-40 h-96 w-96 rounded-full bg-accent/15 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brightline-icon.png" alt="" className="h-9 w-auto" />
            <div className="flex flex-col leading-tight">
              <span className="font-heading text-base font-bold tracking-tight">BrightLine Academy</span>
              <span className="hidden text-[11px] text-muted-foreground sm:block">Ağıllı imtahan hazırlığı</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CommandPaletteTrigger onClick={() => setPaletteOpen(true)} />
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={() => setView("auth")}>
              Daxil ol
            </Button>
            <Button size="sm" onClick={() => setView("auth")}>
              Pulsuz Başla
              <ArrowRight className="size-4" />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto w-full max-w-7xl px-4 pt-12 sm:px-6 sm:pt-20">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          {/* Left: copy + CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center lg:text-left"
          >
            <Badge variant="outline" className="mb-5 gap-1.5 rounded-full px-3 py-1 text-xs">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-accent" />
              </span>
              Yeni: AI Sual Generatoru aktivdir
            </Badge>
            <h1 className="font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-balance sm:text-6xl">
              İmtahana hazırlaşmaq
              <br />
              <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                indi çox rahatdır
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0">
              Süni intellekt dəstəkli TQDK və Magistr hazırlıq platforması. AI müəllim,
              sonsuz sual generatoru, fərdi gündəlik plan və universitet uyğunlaşdırması —
              hamısı bir yerdə, tamamilə Azərbaycan dilində.
            </p>

            {/* B2a: Social proof banner */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mt-6 flex flex-col items-center gap-2 lg:flex-row lg:items-center lg:gap-3"
            >
              <div className="flex items-center -space-x-2">
                {AVATARS.map((a, i) => (
                  <Avatar
                    key={i}
                    className="size-7 border-2 border-background ring-1 ring-border/40"
                  >
                    <AvatarFallback className={`text-[10px] font-bold ${a.color}`}>
                      {a.initials}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <div className="flex flex-col items-center gap-0.5 lg:items-start">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">10,000+</span> şagird tərəfindən istifadə olunur
                </p>
              </div>
            </motion.div>

            {/* B2c: CTA hierarchy */}
            <div className="mt-7 flex flex-col items-stretch justify-center gap-2.5 sm:flex-row lg:justify-start">
              <Button
                size="lg"
                className="h-12 px-6 text-base shadow-md"
                onClick={() => setView("auth")}
              >
                Pulsuz Başla
                <ArrowRight className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 gap-2 border-2 border-primary px-6 text-base text-primary hover:bg-primary/5 hover:text-primary"
                onClick={scrollToHowItWorks}
              >
                <BookOpen className="size-4" />
                Necə işlədiyinə bax
              </Button>
            </div>
          </motion.div>

          {/* Right: Product mockup */}
          <ProductMockup />
        </div>

        {/* Hero stats band */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
          className="mx-auto mt-14 grid max-w-3xl grid-cols-3 gap-3 sm:gap-4"
        >
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-border/60 bg-card/60 p-4 text-center shadow-sm backdrop-blur-sm sm:p-5"
            >
              <div className="font-stat text-2xl font-bold text-primary sm:text-4xl">{s.value}</div>
              <div className="mt-1 text-xs text-muted-foreground sm:text-sm">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Feature cards */}
      <section className="mx-auto mt-20 w-full max-w-7xl px-4 pb-24 sm:px-6">
        <div className="mb-8 text-center">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            İmkanlar
          </p>
          <h2 className="mt-1 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            Nə təklif edirik?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Hər bir alət süni intellekt ilə gücləndirilmişdir.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <Card className="group h-full overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5">
                <CardContent className={`relative p-6`}>
                  <div className={`absolute inset-0 -z-10 bg-gradient-to-br ${f.accent} opacity-60`} />
                  <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <f.icon className="size-5" />
                  </div>
                  <h3 className="font-heading text-base font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section
        ref={howItWorksRef}
        className="mx-auto w-full max-w-7xl scroll-mt-20 px-4 pb-24 sm:px-6"
      >
        <div className="mb-6 text-center">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Necə işləyir
          </p>
          <h2 className="mt-1 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            3 addımda hazırlığa başla
          </h2>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-sm backdrop-blur-sm sm:p-10">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {[
              { n: "01", title: "Profilini yarat", desc: "Qrup və hədəf universitetini seç.", icon: Sparkles },
              { n: "02", title: "Mövzunu seç", desc: "İstədiyin fənn və mövzuda AI sənə suallar yaratsın.", icon: Trophy },
              { n: "03", title: "AI ilə çalış", desc: "Plan, sual generator və AI hoca səni istiqamətləndirir.", icon: Bot },
            ].map((s) => (
              <div key={s.n} className="relative">
                <div className="mb-3 flex items-center gap-3">
                  <span className="font-stat text-sm font-semibold text-accent">{s.n}</span>
                  <div className="h-px flex-1 bg-border" />
                  <s.icon className="size-4 text-primary" />
                </div>
                <h3 className="font-heading text-base font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities strip */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-24 sm:px-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { icon: FileEdit, title: "AI ilə CV yarat", desc: "Peşəkar, ATS-dostu CV-ni bir neçə dəqiqəyə hazırla və PDF kimi yüklə." },
            { icon: Mic, title: "Səsli sorğu", desc: "Mikrofonla sual ver, AI səsini tanıyıb cavablasın." },
            { icon: Trophy, title: "Gamifikasiya", desc: "Streak və nailiyyətlər — hər addımda motivasiyanı yüksəlt." },
          ].map((c) => (
            <div
              key={c.title}
              className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/40 p-4 backdrop-blur-sm"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <c.icon className="size-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold">{c.title}</h4>
                <p className="mt-0.5 text-xs text-muted-foreground">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-24 sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary to-primary/80 p-8 text-center shadow-lg sm:p-12"
        >
          <h2 className="font-heading text-2xl font-bold text-primary-foreground sm:text-3xl">
            Hazırsan? İlk sualın 30 saniyəyə hazırdır.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-primary-foreground/80 sm:text-base">
            İmtahan gününə qədər AI sənə fərdi hazırlıq planı təqdim edəcək.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="mt-6 h-12 bg-background px-6 text-base text-primary hover:bg-background/90"
            onClick={() => setView("auth")}
          >
            İndi başla
            <ArrowRight className="size-4" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/60 bg-background/70 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="size-4 text-primary" />
            <span>© 2025 BrightLine Academy</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Azərbaycan şagirdləri üçün sevgi ilə hazırlanıb.
          </p>
        </div>
      </footer>

      {/* Command palette (Cmd+K) — limited landing commands */}
      <CommandPalette mode="landing" open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
