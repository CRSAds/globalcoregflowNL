// =============================================================
// ✅ /api/coreg.js — stabiele fallback + geen Directus errors meer
// =============================================================

import { fetchWithRetry } from "./utils/fetchDirectus.js";

let LAST_KNOWN_GOOD = null; // fallback cache

export default async function handler(req, res) {
  // === CORS ===
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  const url = `${process.env.DIRECTUS_URL}/items/coreg_campaigns?filter[is_live][_eq]=true&fields=*,image.id,image.filename_download,coreg_answers.*,coreg_dropdown_options.*,more_info&sort=order`;

  try {
    // 1️⃣ Probeer Directus met retry (zoals nu)
    const json = await fetchWithRetry(url, {
      headers: { Authorization: `Bearer ${process.env.DIRECTUS_TOKEN}` },
    });

    // 2️⃣ Als het lukt → cache opslaan
    LAST_KNOWN_GOOD = json;

    // 3️⃣ Verwerken zoals voorheen
    const campaigns = normalizeCampaigns(json.data || []);

    console.log(`✅ ${campaigns.length} coreg campagnes geladen (live)`);
    return res.status(200).json({ data: campaigns });

  } catch (err) {
    console.error("❌ Directus fout:", err.message);

    // 4️⃣ FALLBACK: gebruik cached versie
    if (LAST_KNOWN_GOOD) {
      const campaigns = normalizeCampaigns(LAST_KNOWN_GOOD.data || []);
      console.warn("⚠️ Serving FALLBACK coreg data");
      return res.status(200).json({ data: campaigns });
    }

    // 5️⃣ Als er geen cache is, dán pas error geven
    return res.status(500).json({ error: "Coreg kon niet geladen worden" });
  }
}

// -------------------------------------------------------------
// 🔧 Zelfde mapping-logica als jouw huidige werkende variant
// -------------------------------------------------------------
function normalizeCampaigns(list) {
  return list.map((camp) => {
    const normalizedCid = camp.cid || camp.campaign_id || null;
    const normalizedSid = camp.sid || camp.source_id || null;

    const answers = (camp.coreg_answers || []).map((ans) => ({
      id: ans.id,
      label: ans.label || "",
      answer_value: ans.value || ans.answer_value || "",
      has_own_campaign: !!ans.has_own_campaign,
      cid: ans.has_own_campaign
        ? ans.cid || ans.campaign_id || normalizedCid
        : normalizedCid,
      sid: ans.has_own_campaign
        ? ans.sid || ans.source_id || normalizedSid
        : normalizedSid,
    }));

    const dropdowns = (camp.coreg_dropdown_options || []).map((opt) => ({
      id: opt.id,
      label: opt.label || "",
      value: opt.value || "",
      cid: opt.has_own_campaign
        ? opt.cid || opt.campaign_id || normalizedCid
        : normalizedCid,
      sid: opt.has_own_campaign
        ? opt.sid || opt.source_id || normalizedSid
        : normalizedSid,
    }));

    return {
      ...camp,
      cid: normalizedCid,
      sid: normalizedSid,
      coreg_answers: answers,
      coreg_dropdown_options: dropdowns,
    };
  });
}
