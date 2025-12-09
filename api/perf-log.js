// =============================================================
// ✅ /api/perf-log.js — Real User Monitoring endpoint
// Logt performance-data van echte bezoekers via Vercel Logs
// =============================================================

export default async function handler(req, res) {
  // --- CORS headers ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // OPTIONS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Alleen POST toegestaan
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method Not Allowed" });
  }

  try {
    const body = req.body || {};

    // Zorg dat er niks van persoonsgegevens in deze logs komt
    const safePayload = {
      ts: body.ts || Date.now(),
      url: body.url || null,
      userAgent: body.userAgent || null,
      loaderVisible: body.loaderVisible ?? null,
      initFirstSection: body.initFirstSection ?? null,
      measures: Array.isArray(body.measures) ? body.measures : []
    };

    // Log naar Vercel (zichtbaar in Functions → Logs)
    console.log("📊 PERF LOG:", JSON.stringify(safePayload, null, 2));

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("❌ PERF LOG ERROR:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
