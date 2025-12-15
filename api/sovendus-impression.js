// =============================================================
// /api/sovendus-impression.js
// CORS-safe endpoint voor cross-domain Sovendus logging
// =============================================================

export default async function handler(req, res) {
  // ✅ CORS HEADERS
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
    // ⬇️ NEW: source met veilige default
    const {
      t_id,
      offer_id,
      sub_id,
      source = "flow", // 👈 BELANGRIJK
    } = req.body || {};

    if (!t_id) {
      return res.status(400).json({ ok: false, error: "missing_t_id" });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !KEY) {
      console.error("[sovendus-impression] Missing env vars");
      return res.status(500).json({ ok: false, error: "missing_env" });
    }

    const payload = {
      t_id,
      offer_id: offer_id || "unknown",
      sub_id: sub_id || "unknown",
      source, // 👈 wordt nu opgeslagen
    };

    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/sovendus_impressions`,
      {
        method: "POST",
        headers: {
          apikey: KEY,
          Authorization: `Bearer ${KEY}`,
          "Content-Type": "application/json",
          Prefer: "resolution=ignore-duplicates",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!r.ok) {
      const txt = await r.text();
      console.error(
        "[sovendus-impression] Supabase error",
        r.status,
        txt
      );
      return res.status(500).json({ ok: false });
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error("[sovendus-impression] Exception", e);
    return res.status(500).json({ ok: false });
  }
}
