"use client";

import * as React from "react";
import { useNotifications } from "./use-pwa";

// Schedule local notifications for daily reminders + exam countdown
export function useNotificationScheduler(opts: {
  enabled: boolean;
  examDate?: string | null;
  dailyGoalMet?: boolean;
}) {
  const { permission, notify } = useNotifications();
  const scheduledRef = React.useRef(false);

  React.useEffect(() => {
    if (!opts.enabled || permission !== "granted" || scheduledRef.current) return;
    scheduledRef.current = true;

    // Daily study reminder — check every hour, notify if not studied today by 18:00
    const checkDailyReminder = () => {
      const now = new Date();
      const hour = now.getHours();
      // Only remind between 18:00 and 22:00
      if (hour < 18 || hour > 22) return;

      const lastNotified = localStorage.getItem("ai-tqdk-daily-notified");
      const today = now.toISOString().slice(0, 10);
      if (lastNotified === today) return;

      if (!opts.dailyGoalMet) {
        notify("📚 Bugünkü planını unutma!", {
          body: "Günlük təkrar növbən gözləyir. 10 dəqiqə vaxt ayır və seriyani qoru!",
          tag: "daily-reminder",
          data: { url: "/" },
        });
        localStorage.setItem("ai-tqdk-daily-notified", today);
      }
    };

    // Exam countdown alerts — 7 days, 3 days, 1 day before
    const checkExamCountdown = () => {
      if (!opts.examDate) return;
      const exam = new Date(opts.examDate);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const daysLeft = Math.ceil((exam.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      const alertKey = `ai-tqdk-exam-${daysLeft}d`;
      if (localStorage.getItem(alertKey)) return;

      if ([7, 3, 1, 0].includes(daysLeft)) {
        const messages: Record<number, { title: string; body: string }> = {
          7: {
            title: "⚠️ İmtahanına 7 gün qalıb!",
            body: "Son həftə — intensivləşdir! Zəif mövzulara fokuslan.",
          },
          3: {
            title: "🔥 İmtahanına 3 gün qalıb!",
            body: "Son hazırlıq günləri. İmtahan simulyasiyası keç!",
          },
          1: {
            title: "🎯 Sabah imtahan günüdür!",
            body: "Bugün yüngül təkrar et və yaxşı yat. Uğurlar!",
          },
          0: {
            title: "🏆 İmtahan günü budur!",
            body: "Hazırsan! İnan özünə. Uğurlar! 🎓",
          },
        };
        const msg = messages[daysLeft];
        if (msg) {
          notify(msg.title, {
            body: msg.body,
            tag: `exam-${daysLeft}d`,
            data: { url: "/" },
          });
          localStorage.setItem(alertKey, "1");
        }
      }
    };

    // Initial check + interval
    checkDailyReminder();
    checkExamCountdown();
    const interval = setInterval(() => {
      checkDailyReminder();
      checkExamCountdown();
    }, 60 * 60 * 1000); // hourly

    return () => clearInterval(interval);
  }, [opts.enabled, opts.examDate, opts.dailyGoalMet, permission, notify]);

  return { permission };
}
