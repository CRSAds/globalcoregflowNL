// =============================================================
// ⚡ /api/coreg.js — Ultra-fast versie met Edge Cache + Retry + Fallback
// =============================================================

import { fetchWithRetry } from "./utils/fetchDirectus.js";

let LAST_KNOWN_GOOD = null; // fallback cache (blijft alleen bestaan per function instance)

// =============================================================
// Main handler
// =============================================================
export default async function handler(req, res) {
  // --- CORS headers ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  // Edge Cache headers (1 uur cache)
  res.setHeader(
    "Cache-Control",
    "s-maxage=3600, stale-while-revalidate"
  );

  // Directus URL
  const url = `${process.env.DIRECTUS_URL}/items/coreg_campaigns`
    + `?filter[is_live][_eq]=true`
    + `&filter[_or][0][country][_null]=true`
    + `&filter[_or][1][country][_eq]=NL`
    + `&fields=*,image.id,image.filename_download,coreg_answers.*,coreg_dropdown_options.*,more_info`
    + `&sort=order`;

  try {
    const json = await fetchWithRetry(url, {
      headers: { Authorization: `Bearer ${process.env.DIRECTUS_TOKEN}` },
    });

    LAST_KNOWN_GOOD = json;

    const campaigns = normalizeCampaigns(json.data || []);

    console.log(`✅ ${campaigns.length} coreg campagnes geladen (EDGE cached)`);
    return res.status(200).json({ data: campaigns });

  } catch (err) {
    console.error("❌ Directus fout:", err.message);

    if (LAST_KNOWN_GOOD) {
      const campaigns = normalizeCampaigns(LAST_KNOWN_GOOD.data || []);
      console.warn("⚠️ Serving FALLBACK coreg data (Directus down)");
      return res.status(200).json({ data: campaigns });
    }

    return res.status(500).json({ error: "Coreg kon niet geladen worden" });
  }
}

// =============================================================
// Normalisatie
// =============================================================
function normalizeCampaigns(list) {
  return list.map((camp) => {
    const normalizedCid = camp.cid || camp.campaign_id || null;
    const normalizedSid = camp.sid || camp.source_id || null;

    const answers = (camp.coreg_answers || []).map((ans) => ({
      id: ans.id,
      label: ans.label || "",
      answer_value: ans.value || ans.answer_value || "",
      // ✅ NIEUW: skip_next doorgeven
      skip_next: !!ans.skip_next,
      
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
      // ✅ NIEUW: skip_next doorgeven voor dropdowns
      skip_next: !!opt.skip_next,

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
