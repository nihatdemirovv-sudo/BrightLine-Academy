"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, WifiOff, X, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWA, useNotifications } from "@/hooks/use-pwa";

// PWA Install Banner — shows when app is installable
export function PWAInstallBanner() {
  const { canInstall, isInstalled, promptInstall } = usePWA();
  const [dismissed, setDismissed] = React.useState(false);

  // Don't show if installed, dismissed, or not installable
  if (isInstalled || dismissed || !canInstall) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed left-1/2 top-4 z-50 -translate-x-1/2 px-4"
      >
        <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-card p-3 shadow-lg">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Download className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Tətbiqi quraşdır</p>
            <p className="text-xs text-muted-foreground">
              Daha sürətli və offline giriş üçün
            </p>
          </div>
          <Button
            size="sm"
            className="ml-2"
            onClick={() => promptInstall()}
          >
            Quraşdır
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="size-8 p-0"
            onClick={() => setDismissed(true)}
          >
            <X className="size-4" />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Offline indicator — shows when network is lost
export function OfflineIndicator() {
  const { isOnline } = usePWA();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 sm:bottom-4"
        >
          <div className="flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm shadow-lg backdrop-blur">
            <WifiOff className="size-4 text-destructive" />
            <span className="font-medium text-destructive">
              Offline rejim — məlumatlar saxlanılır
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Notification permission prompt
export function NotificationPrompt() {
  const { permission, supported, requestPermission } = useNotifications();
  const [dismissed, setDismissed] = React.useState(false);

  // Don't show if not supported, already granted/denied, or dismissed
  if (!supported || permission !== "default" || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed left-1/2 top-20 z-50 -translate-x-1/2 px-4"
      >
        <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-card p-3 shadow-lg">
          <div className="flex size-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Bell className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Bildirişləri aktivləşdir</p>
            <p className="text-xs text-muted-foreground">
              Günlük plan və imtahan xatırlatmaları al
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="ml-2"
            onClick={() => requestPermission()}
          >
            Aktivləşdir
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="size-8 p-0"
            onClick={() => setDismissed(true)}
          >
            <X className="size-4" />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
