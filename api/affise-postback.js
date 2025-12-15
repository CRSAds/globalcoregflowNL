// =============================================================
// ✅ Affise Postback → Supabase (Costs / Payouts)
// - Ondersteunt JSON MET en ZONDER Content-Type
// - Ondersteunt x-www-form-urlencoded
// - clickid === t_id (uniek)
// - sub2 → sub_id
// - affiliate_name als label
// - date_only leidend (Y-m-d)
// - idempotent via unique index op t_id
// =============================================================

import querystring from "querystring";

export const config = {
  api: {
    bodyParser: false // 👈 nodig voor Affise (form + raw JSON)
  }
};

export default async function handler(req, res) {
  // --------------------------------------------------
  // 🌍 CORS
  // --------------------------------------------------
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false });

  try {
    // --------------------------------------------------
    // 📥 Raw body uitlezen
    // --------------------------------------------------
    let rawBody = "";

    await new Promise(resolve => {
      req.on("data", chunk => {
        rawBody += chunk.toString();
      });
      req.on("end", resolve);
    });

    const contentType = req.headers["content-type"] || "";
    const trimmed = rawBody.trim();

    let body = {};

    // --------------------------------------------------
    // 🧠 Body parsing (Affise-proof)
    // --------------------------------------------------
    if (
      contentType.includes("application/json") ||
      trimmed.startsWith("{")
    ) {
      // JSON (ook als Content-Type ontbreekt)
      body = JSON.parse(trimmed || "{}");
    } else {
      // application/x-www-form-urlencoded
      body = querystring.parse(rawBody);
    }

    // --------------------------------------------------
    // 🧾 Debug (mag je later verwijderen)
    // --------------------------------------------------
    console.log("[affise-postback] rawBody:", rawBody);
    console.log("[affise-postback] parsed body:", body);

    // --------------------------------------------------
    // 🎯 Exacte mapping (zoals afgesproken)
    // --------------------------------------------------
    const offer_id = body.offer_id;
    const t_id = body.clickid || body.click_id;
    const payout = body.payout || body.sum;
    const sub_id = body.sub_id || body.sub2 || "unknown";
    const affiliate_name = body.affiliate_name || null;
    const day = body.date_only;

    // --------------------------------------------------
    // 🛑 Validatie (strikt & bewust)
    // --------------------------------------------------
    if (!offer_id || !t_id || payout == null || !day) {
      console.error("[affise-postback] missing fields", {
        offer_id,
        t_id,
        payout,
        day
      });
      return res.status(400).json({ ok: false, error: "missing_fields" });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error("[affise-postback] missing env vars");
      return res.status(500).json({ ok: false, error: "missing_env" });
    }

    // --------------------------------------------------
    // 📦 Supabase row
    // --------------------------------------------------
    const row = {
      day,
      offer_id: String(offer_id),
      sub_id: String(sub_id),
      affiliate_name,
      t_id: String(t_id),
      payout: Number(payout),
      raw: body
    };

    // --------------------------------------------------
    // ♻️ Upsert naar Supabase (idempotent)
    // --------------------------------------------------
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/affise_payouts?on_conflict=t_id`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal"
        },
        body: JSON.stringify(row)
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error("[affise-postback] Supabase error", text);
      return res.status(500).json({ ok: false });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("[affise-postback] exception", err);
    return res.status(500).json({ ok: false });
  }
}
