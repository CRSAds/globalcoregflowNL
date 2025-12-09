// =============================================================
//  /api/flow-log.js — nieuwe minimalistische flow-logger
// =============================================================
//
//  Front-end stuurt nu alleen:
//     event: "coreg_visible"
//     ts: Date.now()
//     url: window.location.href
//     ua: navigator.userAgent
//     template: "template5.2" of "globalcoregflow"
//
//  Backend logt:
//     - event
//     - ts (in seconden)
//     - t_id, offer_id, aff_id, sub_id (automatisch uit URL)
//     - template
//
// =============================================================

const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;
const FLOW_COLLECTION = process.env.DIRECTUS_FLOW_COLLECTION || "flow_logs";

// ----------------------------------
// Timestamp normalisatie
// ----------------------------------
function toSeconds(ts) {
  const n = Number(ts);
  if (!Number.isFinite(n)) return Math.floor(Date.now() / 1000);
  return n > 2_000_000_000 ? Math.floor(n / 1000) : Math.floor(n);
}

// ----------------------------------
// Query parameters extraheren
// ----------------------------------
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
    return { t_id: null, offer_id: null, aff_id: null, sub_id: null };
  }
}

// ----------------------------------
// Directus opslag
// ----------------------------------
async function saveToDirectus(entry) {
  if (!DIRECTUS_URL || !DIRECTUS_TOKEN) return;

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
}

// ----------------------------------
// Handler
// ----------------------------------
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  // POST — nieuwe log binnen
  if (req.method === "POST") {
    let body = req.body || {};

    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch { body = {}; }
    }

    const url = body.url || "";
    const ts = toSeconds(body.ts);
    const event = body.event || "unknown";
    const template = body.template || null;

    const { t_id, offer_id, aff_id, sub_id } = extractParams(url);

    const entry = {
      event,
      ts,
      t_id,
      offer_id,
      aff_id,
      sub_id,
      template,
    };

    console.log("📊 FLOW LOG:", entry);
    saveToDirectus(entry).catch(() => {});

    return res.status(200).json({ ok: true });
  }

  // GET — sanity info
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      accepts: [
        "flow_landed",
        "flow_start",
        "landing_visible",
        "shortform_visible",
        "coreg_visible",
        "longform_visible",
        "ivr_visible",
        "sovendus_visible",
        "thankyou_visible",
      ],
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
