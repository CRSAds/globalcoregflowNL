// =============================================================
// POST /api/sovendus-impression
// Logt 1 Sovendus iframe impression per t_id
// =============================================================

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false });
  }

  try {
    const { t_id, offer_id, sub_id } = req.body || {};

    if (!t_id) {
      return res.status(400).json({ ok: false, error: "missing t_id" });
    }

    const payload = {
      t_id,
      offer_id: offer_id || "unknown",
      sub_id: sub_id || "unknown"
    };

    const r = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/sovendus_impressions`,
      {
        method: "POST",
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "resolution=ignore-duplicates"
        },
        body: JSON.stringify(payload)
      }
    );

    if (!r.ok) {
      const txt = await r.text();
      throw new Error(txt);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("[sovendus-impression]", err);
    res.status(500).json({ ok: false });
  }
}
