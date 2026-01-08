// =============================================================
// ✅ /api/lead-rotation.js — random waterfall met reject-fallback
// =============================================================

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 🔀 Fisher–Yates shuffle
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ success: false });

  try {
    const body = req.body || {};

    // =============================================================
    // 1️⃣ Haal ALLE actieve roulatie-campagnes op
    // =============================================================
    const { data: sponsors, error } = await supabase
      .from("sponsor_lookup")
      .select("cid, supplier_id")
      .eq("in_cosponsor_rotation", true);

    if (error || !sponsors?.length) {
      console.error("❌ Geen roulatie sponsors beschikbaar", error);
      return res.status(200).json({
        success: false,
        reason: "NO_ROTATION_SPONSORS",
      });
    }

    // =============================================================
    // 2️⃣ Random volgorde per lead
    // =============================================================
    const queue = shuffle(
      sponsors.map(s => ({
        cid: s.cid,
        sid: s.supplier_id,
      }))
    );

    const databowlUrl = "https://crsadvertising.databowl.com/api/v1/lead";
    const tried = [];

    // =============================================================
    // 3️⃣ Waterfall: probeer tot acceptatie
    // =============================================================
    for (const sponsor of queue) {
      tried.push(`${sponsor.cid}`);

      const params = new URLSearchParams();

      params.set("cid", sponsor.cid);
      params.set("sid", sponsor.sid);

      // --- zelfde mapping als lead.js ---
      if (body.firstname) params.set("f_3_firstname", body.firstname);
      if (body.lastname) params.set("f_4_lastname", body.lastname);
      if (body.email) params.set("f_1_email", body.email);
      if (body.gender) params.set("f_2_title", body.gender);
      if (body.dob) params.set("f_5_dob", body.dob);

      if (body.f_1453_campagne_url)
        params.set("f_1453_campagne_url", body.f_1453_campagne_url);
      if (body.t_id) params.set("f_1322_transaction_id", body.t_id);
      if (body.offer_id) params.set("f_1687_offer_id", body.offer_id);
      if (body.aff_id) params.set("f_1685_aff_id", body.aff_id);
      if (body.sub_id) params.set("f_1684_sub_id", body.sub_id);
      if (body.f_17_ipaddress)
        params.set("f_17_ipaddress", body.f_17_ipaddress);

      const optindate =
        body.f_55_optindate ||
        new Date().toISOString().split(".")[0] + "+0000";
      params.set("f_55_optindate", optindate);

      // longform (optioneel)
      if (body.postcode) params.set("f_11_postcode", body.postcode);
      if (body.straat) params.set("f_6_address1", body.straat);
      if (body.huisnummer) params.set("f_7_address2", body.huisnummer);
      if (body.woonplaats) params.set("f_9_towncity", body.woonplaats);
      if (body.telefoon) params.set("f_12_phone1", body.telefoon);

      // coreg
      if (body.f_2014_coreg_answer?.trim())
        params.set("f_2014_coreg_answer", body.f_2014_coreg_answer.trim());
      if (body.f_2575_coreg_answer_dropdown?.trim())
        params.set(
          "f_2575_coreg_answer_dropdown",
          body.f_2575_coreg_answer_dropdown.trim()
        );

      // =========================================================
      // 🚀 Verstuur naar Databowl
      // =========================================================
      const resp = await fetch(databowlUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });

      const text = await resp.text();
      let json = {};
      try {
        json = JSON.parse(text || "{}");
      } catch {}

      // =========================================================
      // ✅ ACCEPT → STOP
      // =========================================================
      const isRejected =
        json?.msg ||
        json?.error?.msg;
      
      if (!isRejected) {
        console.log(
          `✅ Roulatie ACCEPT cid=${sponsor.cid} (tried: ${tried.join(",")})`
        );
        return res.status(200).json({
          success: true,
          accepted_by: sponsor.cid,
          tried,
        });
      }
      
      // Anders: reject → door naar volgende
      console.warn(
        `⛔ Roulatie REJECT cid=${sponsor.cid}`,
        json?.msg || json?.error?.msg || text
      );

    // =============================================================
    // ❌ Alles afgewezen
    // =============================================================
    console.warn("❌ Alle roulatie sponsors geweigerd", tried);
    return res.status(200).json({
      success: false,
      reason: "ALL_REJECTED",
      tried,
    });
  } catch (err) {
    console.error("💥 lead-rotation fout:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
