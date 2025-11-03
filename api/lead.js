// =============================================================
// ✅ /api/lead.js — stabiele versie met coreg_answer fix (short + long)
// =============================================================
import querystring from "querystring";

export default async function handler(req, res) {
  // ✅ Universele CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cache-Control');

  // ✅ Preflight (OPTIONS) meteen afsluiten
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ✅ Alleen POST requests toestaan
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const body = req.body || {};
    const {
      cid,
      sid,
      firstname,
      lastname,
      email,
      gender,
      dob,
      postcode,
      straat,
      huisnummer,
      woonplaats,
      telefoon,
      is_shortform,
      f_2014_coreg_answer,
      f_2575_coreg_answer_dropdown,
      f_1453_campagne_url,
      f_1322_transaction_id,
      f_1684_sub_id,
      f_1685_aff_id,
      f_1687_offer_id
    } = body;

    // ===== Detecteer shortform lead (zoals in originele werkende versie)
    const isShort =
      String(cid) === "925" ||
      is_shortform === true ||
      (!postcode && !telefoon && !woonplaats);

    const params = new URLSearchParams();

    // ===== Basisvelden
    if (cid) params.set("cid", cid);
    if (sid) params.set("sid", sid);
    if (firstname) params.set("f_3_firstname", firstname);
    if (lastname) params.set("f_4_lastname", lastname);
    if (email) params.set("f_1_email", email);
    if (gender) params.set("f_2_title", gender);
    if (dob) params.set("f_5_dob", dob);

    // ===== Campagne URL + tracking
    if (f_1453_campagne_url) params.set("f_1453_campagne_url", f_1453_campagne_url);
    if (t_id) params.set("t_id", t_id);
    if (offer_id) params.set("offer_id", offer_id);
    if (aff_id) params.set("aff_id", aff_id);
    if (sub_id) params.set("sub_id", sub_id);

    // ===== Alleen longformvelden bij longform leads
    if (!isShort) {
      if (postcode) params.set("f_11_postcode", postcode);
      if (straat) params.set("f_6_address1", straat);
      if (huisnummer) params.set("f_7_address2", huisnummer);
      if (woonplaats) params.set("f_9_towncity", woonplaats);
      if (telefoon) params.set("f_12_phone1", telefoon);
    }

    // ✅ Altijd coreg antwoorden meesturen (ook bij shortform coregs)
    if (f_2014_coreg_answer?.trim()) {
      params.set("f_2014_coreg_answer", f_2014_coreg_answer.trim());
    }
    if (f_2575_coreg_answer_dropdown?.trim()) {
      params.set("f_2575_coreg_answer_dropdown", f_2575_coreg_answer_dropdown.trim());
    }

    // ✅ Sponsor-optin alleen meesturen bij akkoord
    if (f_2047_EM_CO_sponsors?.trim()) {
      params.set("f_2047_EM_CO_sponsors", f_2047_EM_CO_sponsors.trim());
    }

    // ===== Databowl endpoint
    const databowlUrl = "https://crsadvertising.databowl.com/api/v1/lead";
    console.log("🚀 Databowl POST:", params.toString());

    const resp = await fetch(databowlUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString()
    });

    const text = await resp.text();
    if (!resp.ok) {
      console.error("❌ Databowl error:", text);
      return res.status(resp.status).json({ success: false, error: text });
    }

    console.log("✅ Lead succesvol naar Databowl:", text);
    res.status(200).json({ success: true, response: text });
  } catch (err) {
    console.error("💥 Lead API fout:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}
