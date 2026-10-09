"use client";

import * as React from "react";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";
import { Landing } from "@/components/landing";
import { AuthScreen } from "@/components/auth-screen";
import { AppShell } from "@/components/app-shell";
import { TeacherShell } from "@/components/teacher/teacher-shell";
import { LoadingScreen } from "@/components/loading";
import {
  PWAInstallBanner,
  OfflineIndicator,
  NotificationPrompt,
} from "@/components/pwa-banner";

export default function Home() {
  const { student, view, setStudent, setView } = useStore();
  const [hydrated, setHydrated] = React.useState(false);
  const [booting, setBooting] = React.useState(true);

  // Hydration
  React.useEffect(() => {
    setHydrated(true);
  }, []);

  // On mount: try to restore existing session (yalnız sessionId varsa)
  React.useEffect(() => {
    if (!hydrated) return;
    const sid = useStore.getState().sessionId;
    if (!sid) {
      // İlk dəfə gələn istifadəçi — auth-a keç
      setView("auth");
      setBooting(false);
      return;
    }
    (async () => {
      try {
        const s = await api.getStudent(sid);
        if (s) {
          setStudent(s);
          // Diaqnostik test/onboarding ekranı silinib — mövcud sessiya varsa birbaşa panelə get.
          setView("app");
        } else {
          setView("auth");
        }
      } catch {
        setView("auth");
      } finally {
        setBooting(false);
      }
    })();
  }, [hydrated, setStudent, setView]);

  // PWA shortcut handling — ?shortcut=tutor/generator/exam/dashboard
  React.useEffect(() => {
    if (!hydrated || view !== "app") return;
    const params = new URLSearchParams(window.location.search);
    const shortcut = params.get("shortcut");
    if (shortcut) {
      const { setAppView } = useStore.getState();
      const map: Record<string, string> = {
        tutor: "tutor",
        generator: "generator",
        exam: "exam",
        dashboard: "dashboard",
      };
      if (map[shortcut]) {
        setAppView(map[shortcut] as any);
      }
      // Clean URL
      window.history.replaceState({}, "", "/");
    }
  }, [hydrated, view]);

  if (!hydrated || booting) {
    return <LoadingScreen text="Yüklənir..." />;
  }

  return (
    <>
      {view === "landing" && <Landing />}
      {view === "auth" && <AuthScreen />}
      {view === "app" && (student?.rol === "muellim" ? <TeacherShell /> : <AppShell />)}
      {/* PWA overlays */}
      <PWAInstallBanner />
      <OfflineIndicator />
      {view === "app" && <NotificationPrompt />}
    </>
  );
}
