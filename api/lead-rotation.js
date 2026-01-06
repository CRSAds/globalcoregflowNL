// =============================================================
// ✅ /api/lead-rotation.js — 1 extra cosponsor via Supabase roulatie
// =============================================================

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  try {
    const body = req.body || {};

    // 1) Pak volgende roulatie cosponsor
    const { data: pick, error } = await supabase.rpc("get_next_cosponsor");
    if (error || !pick || pick.length === 0) {
      console.error("❌ get_next_cosponsor faalde:", error);
      return res.status(500).json({ success: false, message: "No rotation cosponsor available" });
    }

    const rotationCid = pick[0].cid;
    const rotationSid = pick[0].sid;

    // 2) Bouw Databowl params (zelfde mapping als lead.js)
    const params = new URLSearchParams();

    // cid/sid OVERRIDE naar roulatie sponsor
    params.set("cid", rotationCid);
    params.set("sid", rotationSid);

    // Basis
    if (body.firstname) params.set("f_3_firstname", body.firstname);
    if (body.lastname) params.set("f_4_lastname", body.lastname);
    if (body.email) params.set("f_1_email", body.email);
    if (body.gender) params.set("f_2_title", body.gender);
    if (body.dob) params.set("f_5_dob", body.dob);

    // Campagne URL + tracking
    if (body.f_1453_campagne_url) params.set("f_1453_campagne_url", body.f_1453_campagne_url);
    if (body.t_id) params.set("f_1322_transaction_id", body.t_id);
    if (body.offer_id) params.set("f_1687_offer_id", body.offer_id);
    if (body.aff_id) params.set("f_1685_aff_id", body.aff_id);
    if (body.sub_id) params.set("f_1684_sub_id", body.sub_id);
    if (body.f_17_ipaddress) params.set("f_17_ipaddress", body.f_17_ipaddress);

    // Optindate
    const optindate =
      body.f_55_optindate || new Date().toISOString().split(".")[0] + "+0000";
    params.set("f_55_optindate", optindate);

    // Longform velden (alleen als je ze meestuurt)
    // (zelfde gedrag als je huidige lead.js: als velden bestaan, worden ze gezet)
    if (body.postcode) params.set("f_11_postcode", body.postcode);
    if (body.straat) params.set("f_6_address1", body.straat);
    if (body.huisnummer) params.set("f_7_address2", body.huisnummer);
    if (body.woonplaats) params.set("f_9_towncity", body.woonplaats);
    if (body.telefoon) params.set("f_12_phone1", body.telefoon);

    // Coreg antwoorden
    if (body.f_2014_coreg_answer?.trim()) params.set("f_2014_coreg_answer", body.f_2014_coreg_answer.trim());
    if (body.f_2575_coreg_answer_dropdown?.trim()) params.set("f_2575_coreg_answer_dropdown", body.f_2575_coreg_answer_dropdown.trim());

    // 3) POST naar Databowl
    const databowlUrl = "https://crsadvertising.databowl.com/api/v1/lead";
    console.log(`🔁 Rotation cosponsor POST → cid=${rotationCid}, sid=${rotationSid}`);

    const resp = await fetch(databowlUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const text = await resp.text();
    let json = {};
    try { json = JSON.parse(text || "{}"); } catch (_) {}

    // Je kunt hier (optioneel) dezelfde cap-pauze logica toepassen als in lead.js.
    // Maar: dit is “extra” traffic; vaak is “cap bereikt = klaar” ook prima.
    if (!resp.ok) {
      console.error("❌ Databowl error (rotation):", text);
      return res.status(resp.status).json({ success: false, error: text });
    }

    return res.status(200).json({
      success: true,
      rotation: { cid: rotationCid, sid: rotationSid },
      response: text,
    });
  } catch (err) {
    console.error("💥 lead-rotation API fout:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
