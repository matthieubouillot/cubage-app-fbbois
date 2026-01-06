const CACHE = "cubage-shell-v7";
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/favicon.png",
];

self.addEventListener("install", (e) => {
  // Forcer l'activation immédiate du nouveau Service Worker
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(APP_SHELL))
  );
});

// Écouter les messages pour prendre le contrôle immédiatement
self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  
  // Ne JAMAIS intercepter les requêtes non-GET ou les requêtes API
  if (req.method !== "GET" || 
      url.pathname.startsWith("/api/") || 
      req.headers.get("Authorization") ||
      req.headers.get("Content-Type") === "application/json") {
    // Laisser passer toutes les requêtes API et non-GET
    return;
  }

  // Handle navigations: network-first pour toujours avoir la dernière version
  if (req.mode === "navigate" && url.origin === self.location.origin) {
    e.respondWith(
      fetch("/index.html")
        .then((res) => {
          // Cache la nouvelle version
          const resClone = res.clone();
          caches.open(CACHE).then((c) => c.put("/index.html", resClone));
          return res;
        })
        .catch(() => caches.match("/index.html")) // Fallback sur le cache si offline
    );
    return;
  }

  // Pour les fichiers JS/CSS avec hash (index-ABC123.js): cache-first car ils ne changent jamais
  // Pour les autres assets: network-first
  if (url.origin === self.location.origin) {
    const hasHashInFilename = /\-[a-zA-Z0-9]{8,}\.(js|css)$/.test(url.pathname);
    
    if (hasHashInFilename) {
      // Cache-first pour les fichiers avec hash (immutables)
      e.respondWith(
        caches.match(req).then((cached) => {
          if (cached) return cached;
          return fetch(req).then((res) => {
            const resClone = res.clone();
            caches.open(CACHE).then((c) => c.put(req, resClone));
            return res;
          });
        })
      );
    } else {
      // Network-first pour les autres assets (peuvent changer)
      e.respondWith(
        fetch(req)
          .then((res) => {
            const resClone = res.clone();
            caches.open(CACHE).then((c) => c.put(req, resClone));
            return res;
          })
          .catch(() => caches.match(req)) // Fallback sur le cache si offline
      );
    }
    return;
  }

  // Cross-origin: try cache then network, no caching
  e.respondWith(caches.match(req).then((c) => c || fetch(req)));
});


