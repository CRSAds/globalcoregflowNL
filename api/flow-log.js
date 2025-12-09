// /api/flow-log.js
//
// Simpele flow logging:
//
// - events (bijv. section_shortform_visible, ivr_called, flow_landed)
// - ts (UNIX seconds)
// - t_id, offer_id, aff_id, sub_id uit de URL

const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;
const FLOW_COLLECTION = process.env.DIRECTUS_FLOW_COLLECTION || "flow_logs";

// -------------------------------------------------
// Helpers
// -------------------------------------------------
function toSeconds(ts) {
  const n = Number(ts);
  if (!Number.isFinite(n)) return Math.floor(Date.now() / 1000);
  return n > 2_000_000_000 ? Math.floor(n / 1000) : Math.floor(n);
}

function extractParams(url) {
  try {
    const u = new URL(url);
    const p = u.searchParams;
    return {
      t_id: p.get("t_id") || null,
      offer_id: p.get("offer_id") || null,
      aff_id: p.get("aff_id") || null,
      sub_id: p.get("sub_id") || null,
    };
  } catch {
    return {
      t_id: null,
      offer_id: null,
      aff_id: null,
      sub_id: null,
    };
  }
}

async function saveToDirectus(entry) {
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
      const text = await res.text();
      console.warn("⚠️ Directus flow-log store failed:", res.status, text);
    }
  } catch (err) {
    console.error("❌ Directus store error:", err);
  }
}

// -------------------------------------------------
// Handler
// -------------------------------------------------
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // POST: log opslaan
  if (req.method === "POST") {
    let body = req.body || {};
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }

    const tsRaw = body.ts || Date.now();
    const ts = toSeconds(tsRaw);

    const url = body.url || "";
    const { t_id, offer_id, aff_id, sub_id } = extractParams(url);

    const entry = {
      event: body.event || "unknown",
      ts,
      t_id,
      offer_id,
      aff_id,
      sub_id,
    };

    console.log("📊 FLOW LOG:", entry);
    saveToDirectus(entry).catch(() => {});

    return res.status(200).json({ ok: true });
  }

  // GET: kleine beschrijving / sanity check
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      description: "Flow log endpoint",
      events: [
        "flow_landed",
        "shortform_submitted",
        "section_shortform_visible",
        "section_coreg_visible",
        "section_longform_visible",
        "section_ivr_visible",
        "section_sovendus_visible",
        "ivr_called",
      ],
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
