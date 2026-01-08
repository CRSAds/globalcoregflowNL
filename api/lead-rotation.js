// =============================================================
// ✅ /api/lead-rotation.js — random waterfall, Databowl-leidend
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
  // -----------------------------------------------------------
  // CORS
  // -----------------------------------------------------------
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ success: false });

  try {
    const body = req.body || {};
    const tid = body.t_id || "NO_TID";

    // -----------------------------------------------------------
    // 1️⃣ Haal actieve roulatie-sponsors op
    // -----------------------------------------------------------
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

    // -----------------------------------------------------------
    // 2️⃣ Random volgorde per lead
    // -----------------------------------------------------------
    const queue = shuffle(
      sponsors.map(s => ({
        cid: s.cid,
        sid: s.supplier_id,
      }))
    );

    const databowlUrl = "https://crsadvertising.databowl.com/api/v1/lead";
    const tried = [];

    // -----------------------------------------------------------
    // 3️⃣ Waterfall: probeer tot ACCEPT
    // -----------------------------------------------------------
    for (const sponsor of queue) {
      tried.push(`${sponsor.cid}`);

      const params = new URLSearchParams();
      params.set("cid", sponsor.cid);
      params.set("sid", sponsor.sid);

      // --- Basisvelden ---
      if (body.firstname) params.set("f_3_firstname", body.firstname);
      if (body.lastname) params.set("f_4_lastname", body.lastname);
      if (body.email) params.set("f_1_email", body.email);
      if (body.gender) params.set("f_2_title", body.gender);
      if (body.dob) params.set("f_5_dob", body.dob);

      // --- Tracking ---
      if (body.f_1453_campagne_url)
        params.set("f_1453_campagne_url", body.f_1453_campagne_url);
      if (body.t_id)
        params.set("f_1322_transaction_id", body.t_id);
      if (body.offer_id)
        params.set("f_1687_offer_id", body.offer_id);
      if (body.aff_id)
        params.set("f_1685_aff_id", body.aff_id);
      if (body.sub_id)
        params.set("f_1684_sub_id", body.sub_id);
      if (body.f_17_ipaddress)
        params.set("f_17_ipaddress", body.f_17_ipaddress);

      const optindate =
        body.f_55_optindate ||
        new Date().toISOString().split(".")[0] + "+0000";
      params.set("f_55_optindate", optindate);

      // --- Longform (optioneel) ---
      if (body.postcode) params.set("f_11_postcode", body.postcode);
      if (body.straat) params.set("f_6_address1", body.straat);
      if (body.huisnummer) params.set("f_7_address2", body.huisnummer);
      if (body.woonplaats) params.set("f_9_towncity", body.woonplaats);
      if (body.telefoon) params.set("f_12_phone1", body.telefoon);

      // --- Coreg ---
      if (body.f_2014_coreg_answer?.trim())
        params.set("f_2014_coreg_answer", body.f_2014_coreg_answer.trim());
      if (body.f_2575_coreg_answer_dropdown?.trim())
        params.set(
          "f_2575_coreg_answer_dropdown",
          body.f_2575_coreg_answer_dropdown.trim()
        );

      // ---------------------------------------------------------
      // 🚀 Verstuur naar Databowl
      // ---------------------------------------------------------
      let resp, text, json;
      try {
        resp = await fetch(databowlUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params.toString(),
        });

        text = await resp.text();
        try {
          json = JSON.parse(text || "{}");
        } catch {
          json = {};
        }
      } catch (err) {
        console.error(`💥 Fetch-fout cid=${sponsor.cid} t_id=${tid}`, err);
        continue;
      }

      // ---------------------------------------------------------
      // ✅ Databowl is LEIDEND
      // ACCEPT = HTTP 201 of expliciete accept-body
      // ---------------------------------------------------------
      const httpAccepted = resp.status === 201;
      const bodyAccepted =
        json?.success === true ||
        json?.status === "accepted" ||
        json?.result === "accepted";

      const isAccepted = httpAccepted || bodyAccepted;

      if (isAccepted) {
        console.log(
          `✅ Roulatie ACCEPT cid=${sponsor.cid} t_id=${tid} (status=${resp.status})`
        );
        return res.status(200).json({
          success: true,
          accepted_by: sponsor.cid,
          tried,
          databowl_status: resp.status,
          databowl_body: json,
        });
      }

      // ❌ Reject → volgende sponsor
      console.warn(
        `⛔ Roulatie REJECT cid=${sponsor.cid} t_id=${tid} (status=${resp.status})`,
        json
      );
    }

    // -----------------------------------------------------------
    // ❌ Alles afgewezen
    // -----------------------------------------------------------
    console.warn(
      `❌ Alle roulatie sponsors geweigerd t_id=${tid}`,
      tried
    );

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
