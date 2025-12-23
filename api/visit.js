// =============================================================
// ✅ /api/visit.js — logt 1 bezoek naar Supabase (REST insert)
// =============================================================

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  // ✅ Universele CORS headers (zelfde patroon als /api/lead.js)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Cache-Control, Authorization");

  // ✅ Preflight
  if (req.method === "OPTIONS") return res.status(200).end();

  // ✅ Alleen POST
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  try {
    const body = req.body || {};

    // ---- Minimale velden die we loggen
    const t_id = body.t_id || null;
    const offer_id = body.offer_id || null;
    const aff_id = body.aff_id || null;
    const sub_id = body.sub_id || null;
    const page_url = body.page_url || null;
    const user_agent = body.user_agent || req.headers["user-agent"] || null;

    // ---- IP server-side (Vercel proxy)
    const ip =
      (req.headers["x-forwarded-for"] || "").toString().split(",")[0].trim() ||
      req.socket?.remoteAddress ||
      null;

    // ---- Supabase config (via env vars)
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const TABLE = process.env.SUPABASE_VISITS_TABLE || "visits";

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({
        success: false,
        error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars"
      });
    }

    const endpoint = `${SUPABASE_URL}/rest/v1/${TABLE}`;

    const payload = {
      t_id,
      offer_id,
      aff_id,
      sub_id,
      page_url,
      user_agent,
      ip
    };

    const resp = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: "return=minimal"
      },
      body: JSON.stringify(payload)
    });

    const text = await resp.text();

    if (!resp.ok) {
      return res.status(resp.status).json({ success: false, error: text });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
