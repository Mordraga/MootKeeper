// sw.js - MootsKeeper Service Worker

const CACHE_NAME = "mootskeeper-v1";

// Static assets to cache on install
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/styles/style.css",
  "/scripts/app.js",
  "/scripts/auth.js",
  "/scripts/availability.js",
  "/scripts/cardBuilder.js",
  "/scripts/categories.js",
  "/scripts/categoryStore.js",
  "/scripts/contactForm.js",
  "/scripts/contactList.js",
  "/scripts/contacts.js",
  "/scripts/onboarding.js",
  "/scripts/preferences.js",
  "/scripts/settings.js",
  "/scripts/settingsModal.js",
  "/scripts/sidePanel.js",
  "/scripts/timezone.js",
  "/scripts/ui.js",
  "/scripts/aboutModal.js"
];

// ========== INSTALL ==========
// Cache all static assets when SW is installed
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Caching static assets");
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// ========== ACTIVATE ==========
// Clean up old caches on activation
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log("[SW] Deleting old cache:", key);
            return caches.delete(key);
          })
      )
    )
  );
  self.clients.claim();
});

// ========== FETCH ==========
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // API calls (Railway backend) — network first, fall through on fail
  if (url.hostname.includes("railway.app")) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // If offline and hitting API, return a friendly offline response
        return new Response(
          JSON.stringify({ error: "offline", message: "You're offline. Local data only." }),
          {
            status: 503,
            headers: { "Content-Type": "application/json" }
          }
        );
      })
    );
    return;
  }

  // Static assets — cache first, network fallback
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        // Cache valid responses for future offline use
        if (response && response.status === 200 && response.type === "basic") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
