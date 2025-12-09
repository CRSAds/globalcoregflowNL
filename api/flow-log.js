// /api/flow-log.js
//
// Centrale flow-logging endpoint voor alle templates
// - Slaat logs op in Directus (met ts in SECONDEN i.p.v. ms)
// - Stuurt volledige ms naar data.ts_ms voor debugging

const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;
const FLOW_COLLECTION = process.env.DIRECTUS_FLOW_COLLECTION || "flow_logs";

// -------------------------
// 🔧 Timestamp normalizer
// -------------------------
function toSeconds(ts) {
  const n = Number(ts);
  if (!Number.isFinite(n)) return Math.floor(Date.now() / 1000);

  // Als groter dan 2 miljard → is ms → converteren
  if (n > 2_000_000_000) return Math.floor(n / 1000);

  // Al in seconds
  return Math.floor(n);
}

// -------------------------
// 📩 Opslaan in Directus
// -------------------------
async function store(entry) {
  if (!DIRECTUS_URL || !DIRECTUS_TOKEN) return;

  try {
    const res = await fetch(`${DIRECTUS_URL}/items/${FLOW_COLLECTION}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DIRECTUS_TOKEN}`,
      },
      body: JSON.stringify(entry),
    });

    if (!res.ok) {
      console.warn("⚠️ Directus flow-log store failed:", res.status, await res.text());
    }
  } catch (err) {
    console.error("❌ Directus store error:", err);
  }
}

// -------------------------
// 🌐 API handler
// -------------------------
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  // ----------------------------------------
  // 🔥 POST: log ontvangen
  // ----------------------------------------
  if (req.method === "POST") {
    let body = req.body;

    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch { body = {}; }
    }

    const tsIncoming = body.ts || Date.now();
    const tsSec = toSeconds(tsIncoming);

    const entry = {
      event: body.event || "unknown",
      ts: tsSec,                        // ← ALLEEN seconden in Directus
      url: body.url || null,
      ua: body.ua || null,
      sectionId: body.sectionId || null,
      classList: body.classList || null,
      data: {
        ts_ms: tsIncoming,             // ← debugging, niet gebruikt door Directus
        ...(body.data || {}),
        template: body.template || null,
      },
    };

    console.log("📊 FLOW LOG:", entry);

    store(entry);

    return res.status(200).json({ ok: true });
  }

  // ----------------------------------------
  // 📊 GET: mini-dashboard voor snelle check
  // ----------------------------------------
  if (req.method === "GET") {
    if (!DIRECTUS_URL || !DIRECTUS_TOKEN) {
      return res.status(200).json({
        ok: true,
        msg: "Directus niet geconfigureerd, alleen Vercel logs beschikbaar.",
      });
    }

    try {
      const url = `${DIRECTUS_URL}/items/${FLOW_COLLECTION}?limit=500&sort[]=-ts`;
      const res2 = await fetch(url, {
        headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` },
      });

      const json = await res2.json();
      const items = json.data || [];

      const summary = {
        ok: true,
        totalLogs: items.length,
        byEvent: {},
      };

      for (const item of items) {
        summary.byEvent[item.event] = (summary.byEvent[item.event] || 0) + 1;
      }

      return res.status(200).json(summary);
    } catch (err) {
      console.error("❌ GET error:", err);
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
