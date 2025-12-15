export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).end();

  try {
    const {
      offer_id,
      clickid,
      payout,
      sub_id,
      date_only
    } = req.body || {};

    if (!offer_id || !clickid || !payout || !date_only) {
      return res.status(400).json({ ok: false, error: "missing_fields" });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const row = {
      day: date_only,              // 👈 leidend
      offer_id: String(offer_id),
      sub_id: sub_id || "unknown",
      t_id: String(clickid),       // 👈 clickid == t_id
      payout: Number(payout),
      raw: req.body
    };

    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/affise_payouts?on_conflict=t_id`,
      {
        method: "POST",
        headers: {
          apikey: KEY,
          Authorization: `Bearer ${KEY}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal"
        },
        body: JSON.stringify(row)
      }
    );

    if (!r.ok) {
      const t = await r.text();
      console.error("Supabase error", t);
      return res.status(500).json({ ok: false });
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error("Affise postback error", e);
    return res.status(500).json({ ok: false });
  }
}
