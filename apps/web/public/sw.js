const CACHE = "cubage-shell-v8";
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

  // Network-first pour TOUS les fichiers (y compris ceux avec hash) pour forcer les mises à jour
  // Le hash change à chaque build, donc c'est un nouveau fichier de toute façon
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          // Mettre à jour le cache avec la nouvelle version
          if (res.ok) {
            const resClone = res.clone();
            caches.open(CACHE).then((c) => c.put(req, resClone));
          }
          return res;
        })
        .catch(() => {
          // Fallback sur le cache uniquement si offline ou erreur réseau
          return caches.match(req);
        })
    );
    return;
  }

  // Cross-origin: try cache then network, no caching
  e.respondWith(caches.match(req).then((c) => c || fetch(req)));
});


