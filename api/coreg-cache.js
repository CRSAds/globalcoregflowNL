// =============================================================
// ⚡ /api/coreg-cache.js
// Server-side cached proxy voor Directus coreg data
// - Haalt maar 1x per TTL de data op bij Directus
// - Bezoekers krijgen altijd bliksemsnel antwoord
// =============================================================

export default async function handler(req, res) {
  try {
    const DIRECTUS_URL = process.env.DIRECTUS_COREG_URL;
    if (!DIRECTUS_URL) {
      return res.status(500).json({ error: "Missing DIRECTUS_COREG_URL env" });
    }

    // Gebruik Vercel serverless cache (1 uur TTL, instelbaar)
    const CACHE_TTL = 60 * 60; // 1 uur (in seconden)
    res.setHeader("Cache-Control", `s-maxage=${CACHE_TTL}, stale-while-revalidate`);

    // Proxy Directus → return cached response
    const upstream = await fetch(DIRECTUS_URL, {
      headers: { "Content-Type": "application/json" }
    });

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: "Directus fetch failed",
        status: upstream.status
      });
    }

    const json = await upstream.json();

    // Return en laat Vercel dit cachen
    return res.status(200).json(json);

  } catch (err) {
    console.error("coreg-cache error:", err);
    return res.status(500).json({ error: "Internal cache server error" });
  }
}
