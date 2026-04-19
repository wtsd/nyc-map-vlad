const CACHE_PREFIX = "nyc-map-cache";
const MANIFEST_URL = "build/manifest.json";

async function loadManifest() {
  const res = await fetch(`${MANIFEST_URL}?t=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

function normalizeAssetPath(path) {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return null;
  return path.startsWith("/") ? path : `/${path}`;
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    try {
      const manifest = await loadManifest();
      const cacheName = `${CACHE_PREFIX}-${manifest.version || "v1"}`;
      const cache = await caches.open(cacheName);
      const offline = manifest.offline || {};
      const core = Array.isArray(offline.core) ? offline.core : [];
      const images = Array.isArray(offline.images) ? offline.images : [];
      const urls = [...core, ...images]
        .map(normalizeAssetPath)
        .filter(Boolean);
      await cache.addAll(urls);
      self.skipWaiting();
    } catch (error) {
      console.warn("SW install fallback (manifest unavailable)", error);
    }
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;

    try {
      const network = await fetch(event.request);
      const cache = await caches.open(`${CACHE_PREFIX}-runtime`);
      if (network.ok && event.request.url.startsWith(self.location.origin)) {
        cache.put(event.request, network.clone());
      }
      return network;
    } catch (error) {
      if (cached) return cached;
      throw error;
    }
  })());
});
