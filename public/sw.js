// BrightLine Academy — Service Worker
// Offline support: cache static assets, network-first for API, stale-while-revalidate for pages

const CACHE_VERSION = "ai-tqdk-v98";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const PAGE_CACHE = `${CACHE_VERSION}-pages`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Static assets to pre-cache
const PRECACHE_URLS = [
  "/",
  "/manifest.json",
  "/icon.svg",
  "/icon-1024.png",
];

// Install: pre-cache critical assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.startsWith(CACHE_VERSION))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch strategy:
// - API requests (/api/*): network-first, fallback to cache
// - Navigation requests: stale-while-revalidate
// - Static assets: cache-first
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) return;

  // API requests: network-first (API data should be fresh)
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful GET API responses (only for 5 min)
          if (response.ok) {
            const clone = response.clone();
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, clone);
              // Set expiry via headers (best effort)
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache
          return caches.match(request);
        })
    );
    return;
  }

  // Navigation requests (HTML pages): network-first — always prefer the live
  // version so a redeploy is visible on the very next load; cache is only a
  // fallback for offline use.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(PAGE_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // Offline: fall back to whatever was cached
          return caches.match(request).then((cached) => cached || caches.match("/"));
        })
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        // Revalidate in background
        fetch(request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
            }
          })
          .catch(() => {});
        return cached;
      }
      return fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match("/icon.svg"));
    })
  );
});

// Handle messages from the page (e.g., manual cache clear)
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (event.data === "CLEAR_CACHE") {
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => caches.delete(key)))
    );
  }
});

// Push notifications (for future server push)
self.addEventListener("push", (event) => {
  let data = { title: "BrightLine Academy", body: "Yeni bildiriş" };
  try {
    data = event.data ? event.data.json() : data;
  } catch {
    data = { title: "BrightLine Academy", body: event.data?.text() || "Yeni bildiriş" };
  }

  const options = {
    body: data.body,
    icon: "/icon-1024.png",
    badge: "/icon.svg",
    vibrate: [100, 50, 100],
    data: { url: data.url || "/" },
    actions: [
      { action: "open", title: "Aç" },
      { action: "close", title: "Bağla" },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "close") return;

  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Periodic sync (for daily reminders — if supported)
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "daily-reminder") {
    event.waitUntil(showDailyReminder());
  }
});

async function showDailyReminder() {
  const clients = await self.clients.matchAll({ type: "window" });
  if (clients.length === 0) {
    // App not open — show notification
    await self.registration.showNotification("BrightLine Academy", {
      body: "Bugünkü planını tamamla! 📚 Günlük təkrar növbən gözləyir.",
      icon: "/icon-1024.png",
      badge: "/icon.svg",
      data: { url: "/" },
      vibrate: [100, 50, 100],
    });
  }
}
