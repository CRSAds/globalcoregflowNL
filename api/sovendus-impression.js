// =============================================================
// POST /api/sovendus-impression
// Debug-safe: voeg ?debug=1 toe om Supabase response te zien
// =============================================================

export default async function handler(req, res) {
  const debug = req.query?.debug === "1";

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false });

  try {
    const { t_id, offer_id, sub_id } = req.body || {};
    if (!t_id) return res.status(400).json({ ok: false, error: "missing t_id" });

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !KEY) {
      console.error("[sovendus-impression] Missing env", {
        hasUrl: !!SUPABASE_URL,
        hasKey: !!KEY,
      });
      return res.status(500).json({ ok: false, error: "missing_env" });
    }

    const payload = {
      t_id,
      offer_id: offer_id || "unknown",
      sub_id: sub_id || "unknown",
    };

    const url = `${SUPABASE_URL}/rest/v1/sovendus_impressions`;

    const r = await fetch(url, {
      method: "POST",
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation,resolution=ignore-duplicates",
      },
      body: JSON.stringify(payload),
    });

    const text = await r.text();

    if (!r.ok) {
      console.error("[sovendus-impression] Supabase error", r.status, text);
      return res.status(500).json({
        ok: false,
        error: "supabase_error",
        ...(debug ? { status: r.status, body: text, url } : {}),
      });
    }

    // Als ignore-duplicates triggert kan body leeg zijn; dat is ok.
    if (debug) {
      return res.json({
        ok: true,
        status: r.status,
        body: text,
        url,
        payload,
      });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("[sovendus-impression] Exception", err);
    return res.status(500).json({ ok: false, error: "exception" });
  }
}
