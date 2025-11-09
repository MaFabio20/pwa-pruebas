const CACHE_NAME = "colviseg-tickets-v1";
const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./app/script.js",
  "./img/colviseg-logo.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  console.log("✅ Service Worker instalado");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("🗑 Eliminando caché antigua:", key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});


self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
