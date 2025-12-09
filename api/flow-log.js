// /api/flow-log.js
//
// Versimpelde flow logging:
// - Alleen 7 events
// - Alleen t_id, offer_id, aff_id, sub_id, event, ts
// - ts in seconden
// - Maximaal betrouwbaar en clean

const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;
const COLLECTION = "flow_logs";

// -------------------------
// Helpers
// -------------------------
function toSeconds(ts) {
  const n = Number(ts);
  if (!Number.isFinite(n)) return Math.floor(Date.now() / 1000);
  return n > 2_000_000_000 ? Math.floor(n / 1000) : n;
}

function extractParams(url) {
  try {
    const u = new URL(url);
    const p = u.searchParams;
    return {
      t_id: p.get("t_id") || null,
      offer_id: p.get("offer_id") || null,
      aff_id: p.get("aff_id") || null,
      sub_id: p.get("sub_id") || null
    };
  } catch {
    return {};
  }
}

// -------------------------
// Directus save
// -------------------------
async function saveToDirectus(entry) {
  if (!DIRECTUS_URL || !DIRECTUS_TOKEN) return;

  try {
    await fetch(`${DIRECTUS_URL}/items/${COLLECTION}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DIRECTUS_TOKEN}`,
      },
      body: JSON.stringify(entry),
    });
  } catch (err) {
    console.error("❌ Directus store error:", err);
  }
}

// -------------------------
// Handler
// -------------------------
export default async function handler(req, res) {

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  // POST — store log
  if (req.method === "POST") {
    let body = req.body || {};
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch { body = {}; }
    }

    const tsRaw = body.ts || Date.now();
    const ts = toSeconds(tsRaw);
    const { t_id, offer_id, aff_id, sub_id } = extractParams(body.url || "");

    const final = {
      event: body.event || "unknown",
      ts,
      t_id,
      offer_id,
      aff_id,
      sub_id
    };

    console.log("📊 FLOW LOG:", final);
    saveToDirectus(final);

    return res.status(200).json({ ok: true });
  }

  // GET — stats
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      events: [
        "flow_landed",
        "flow_shortform_submitted",
        "flow_coreg_shown",
        "flow_longform_shown",
        "flow_ivr_shown",
        "flow_ivr_called",
        "flow_sovendus_shown",
      ]
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
