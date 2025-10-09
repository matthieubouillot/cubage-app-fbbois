const CACHE = "cubage-shell-v4";
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/favicon.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(APP_SHELL)).then(() => self.skipWaiting()),
  );
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

  // Handle navigations: always serve the SPA shell
  if (req.mode === "navigate" && url.origin === self.location.origin) {
    e.respondWith(
      caches.match("/index.html").then((cached) =>
        cached || fetch("/index.html").then((res) => {
          // Cache the shell for next time
          const resClone = res.clone();
          caches.open(CACHE).then((c) => c.put("/index.html", resClone));
          return res;
        }).catch(() => caches.match("/index.html"))
      ),
    );
    return;
  }

  // For same-origin assets: cache-first with runtime fill
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req)
          .then((res) => {
            const resClone = res.clone();
            caches.open(CACHE).then((c) => c.put(req, resClone));
            return res;
          })
          .catch(() => {
            // If request was for the shell specifically
            if (url.pathname === "/index.html") return caches.match("/index.html");
            return undefined;
          });
      }),
    );
    return;
  }

  // Cross-origin: try cache then network, no caching
  e.respondWith(caches.match(req).then((c) => c || fetch(req)));
});


