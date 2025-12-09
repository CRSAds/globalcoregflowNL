// /api/flow-log.js
//
// Flow logging → Supabase REST + Directus
// - Supabase zonder SDK (100% Vercel safe)
// - Alleen bestaande kolommen gebruiken
// - Directus blijft optioneel
// - Geen “flow_start” nodig

// ---------- ENV ----------
const SUPABASE_URL = process.env.SUPABASE_URL; 
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_FLOW_TABLE = process.env.SUPABASE_FLOW_TABLE || "flow_logs";

const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;
const DIRECTUS_COLLECTION = process.env.DIRECTUS_FLOW_COLLECTION || "flow_logs";


// ---------- HELPERS ----------
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
    return { t_id: null, offer_id: null, aff_id: null, sub_id: null };
  }
}


// ---------- SUPABASE WRITE ----------
async function saveToSupabase(entry) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_FLOW_TABLE}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: "return=minimal"
      },
      body: JSON.stringify(entry)
    });

    if (!res.ok) {
      console.error("⚠️ Supabase error:", res.status, await res.text());
    }
  } catch (err) {
    console.error("❌ Supabase store error:", err);
  }
}


// ---------- DIRECTUS WRITE ----------
async function saveToDirectus(entry) {
  if (!DIRECTUS_URL || !DIRECTUS_TOKEN) return;

  try {
    const res = await fetch(`${DIRECTUS_URL}/items/${DIRECTUS_COLLECTION}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DIRECTUS_TOKEN}`,
      },
      body: JSON.stringify(entry),
    });

    if (!res.ok) {
      console.warn("⚠️ Directus error:", res.status, await res.text());
    }
  } catch (err) {
    console.error("❌ Directus store error:", err);
  }
}


// ---------- HANDLER ----------
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();


  // ---------- WRITE ----------
  if (req.method === "POST") {
    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch { body = {}; }
    }

    const ts = toSeconds(body.ts || Date.now());
    const url = body.url || "";
    const params = extractParams(url);

    // ❗ Alleen kolommen die bestaan in Supabase
    const entry = {
      ts,
      event: body.event || "unknown",
      t_id: params.t_id,
      offer_id: params.offer_id,
      aff_id: params.aff_id,
      sub_id: params.sub_id,
      // overige velden alleen voor Directus:
      template: body.template || null,
      url
    };

    console.log("📊 FLOW LOG ENTRY:", entry);

    // Supabase (fire & forget)
    saveToSupabase({
      ts: entry.ts,
      event: entry.event,
      t_id: entry.t_id,
      offer_id: entry.offer_id,
      aff_id: entry.aff_id,
      sub_id: entry.sub_id
    }).catch(() => {});

    // Directus (fire & forget)
    saveToDirectus(entry).catch(() => {});

    return res.status(200).json({ ok: true });
  }


  // ---------- GET INFO ----------
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      mode: "Supabase + Directus",
      supabaseTable: SUPABASE_FLOW_TABLE,
      directusCollection: DIRECTUS_COLLECTION
    });
  }


  // ---------- INVALID ----------
  return res.status(405).json({ error: "Method not allowed" });
}
