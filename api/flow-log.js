// /api/flow-log.js
//
// Simpele flow logging:
// - events (bijv. landing_visible, shortform_visible, shortform_submitted, ivr_visible, ...)
// - ts (UNIX seconds)
// - t_id, offer_id, aff_id, sub_id uit de URL
// - schrijft naar Supabase (en optioneel nog naar Directus)

import { createClient } from "@supabase/supabase-js";

// ------- Directus (optioneel, kan je later uitzetten) -------
const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;
const FLOW_COLLECTION = process.env.DIRECTUS_FLOW_COLLECTION || "flow_logs";

// ------- Supabase -------
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_FLOW_TABLE = process.env.SUPABASE_FLOW_TABLE || "flow_logs";

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    : null;

// -------------------------------------------------
// Helpers
// -------------------------------------------------
function toSeconds(ts) {
  const n = Number(ts);
  if (!Number.isFinite(n)) return Math.floor(Date.now() / 1000);
  // als ts in ms is → naar sec
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

async function saveToSupabase(entry) {
  if (!supabase) return;

  try {
    const { error } = await supabase
      .from(SUPABASE_FLOW_TABLE)
      .insert(entry);

    if (error) {
      console.warn("⚠️ Supabase flow-log store failed:", error.message);
    }
  } catch (err) {
    console.error("❌ Supabase store error:", err);
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
      template: body.template || null,
      url: url || null,
    };

    console.log("📊 FLOW LOG:", entry);

    // Fire & forget → we wachten niet op beide writes
    saveToSupabase(entry).catch(() => {});
    saveToDirectus(entry).catch(() => {});

    return res.status(200).json({ ok: true });
  }

  // GET: simpele beschrijving / sanity check
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      description: "Flow log endpoint (Supabase + Directus)",
      example_events: [
        "lander_visible",
        "shortform_visible",
        "shortform_submitted",
        "coreg_visible",
        "longform_visible",
        "ivr_visible",
        "ivr_called",
        "sovendus_visible",
        "thankyou_visible",
      ],
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
