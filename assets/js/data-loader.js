(() => {
  const MANIFEST_URL = "build/manifest.json";

  async function loadManifest() {
    try {
      const res = await fetch(`${MANIFEST_URL}?t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      console.warn("Failed to load build manifest, using fallback asset paths", error);
      return null;
    }
  }

  function resolveAssetPath(manifest, key, fallbackPath) {
    if (!manifest || typeof manifest !== "object") return fallbackPath;
    const path = manifest[key];
    if (typeof path !== "string" || !path) return fallbackPath;
    return path;
  }

  window.NYCMapDataLoader = {
    loadManifest,
    resolveAssetPath
  };
})();
