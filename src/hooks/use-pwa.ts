"use client";

import * as React from "react";

// PWA: Service Worker registration + install prompt + online/offline status
export function usePWA() {
  const [isOnline, setIsOnline] = React.useState(true);
  const [canInstall, setCanInstall] = React.useState(false);
  const [isInstalled, setIsInstalled] = React.useState(false);
  const [swRegistered, setSwRegistered] = React.useState(false);
  const installEventRef = React.useRef<any>(null);

  // Register service worker
  React.useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => setSwRegistered(true))
        .catch(() => {});
    }
  }, []);

  // Online/offline status
  React.useEffect(() => {
    setIsOnline(navigator.onLine);
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // Install prompt (beforeinstallprompt event)
  React.useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      installEventRef.current = e;
      setCanInstall(true);
    };
    const onAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      installEventRef.current = null;
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onAppInstalled);

    // Check if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const promptInstall = React.useCallback(async () => {
    if (!installEventRef.current) return false;
    installEventRef.current.prompt();
    const { outcome } = await installEventRef.current.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
      setCanInstall(false);
    }
    installEventRef.current = null;
    return outcome === "accepted";
  }, []);

  return {
    isOnline,
    canInstall,
    isInstalled,
    swRegistered,
    promptInstall,
  };
}

// Notification API hook
export function useNotifications() {
  const [permission, setPermission] = React.useState<NotificationPermission>(
    "default"
  );
  const [supported, setSupported] = React.useState(false);

  React.useEffect(() => {
    setSupported("Notification" in window);
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = React.useCallback(async () => {
    if (!("Notification" in window)) return false;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === "granted";
  }, []);

  const notify = React.useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!("Notification" in window) || Notification.permission !== "granted")
        return;
      try {
        new Notification(title, {
          icon: "/icon-1024.png",
          badge: "/icon.svg",
          ...options,
        });
      } catch {}
    },
    []
  );

  return {
    permission,
    supported,
    requestPermission,
    notify,
  };
}
