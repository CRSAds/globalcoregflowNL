// =============================================================
// /api/sovendus-impression.js
// CORS-safe endpoint voor Sovendus impressions + clicks
// =============================================================

export default async function handler(req, res) {
  // =============================================================
  // CORS HEADERS
  // =============================================================
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Preflight
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false });
  }

  try {
    const {
      t_id,
      offer_id,
      sub_id,
      source = "flow",        // verwacht: flow | exit
      event = "impression",   // impression | click
    } = req.body || {};

    if (!t_id) {
      return res.status(400).json({ ok: false, error: "missing_t_id" });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !KEY) {
      console.error("[sovendus] Missing env vars");
      return res.status(500).json({ ok: false, error: "missing_env" });
    }

    // =============================================================
    // Normaliseer source (DB accepteert alleen flow | exit)
    // =============================================================
    const normalizedSource = source === "exit" ? "exit" : "flow";

    // =============================================================
    // Bepaal doel-tabel
    // =============================================================
    const table =
      event === "click"
        ? "sovendus_clicks"
        : "sovendus_impressions";

    // =============================================================
    // Payload
    // =============================================================
    const payload = {
      t_id,
      offer_id: offer_id || "unknown",
      sub_id: sub_id || "unknown",
      source: normalizedSource,
    };

    // =============================================================
    // Insert in Supabase
    // =============================================================
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=ignore-duplicates",
      },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const txt = await r.text();
      console.error(`[sovendus] Supabase error (${table})`, r.status, txt);
      return res.status(500).json({ ok: false });
    }

    return res.json({
      ok: true,
      event,
      table,
      source: normalizedSource,
    });
  } catch (e) {
    console.error("[sovendus] Exception", e);
    return res.status(500).json({ ok: false });
  }
}
