// /api/coreg.js
// Haalt campagnes + antwoorden op uit Directus en normaliseert ontbrekende cid/sid

export default async function handler(req, res) {
  // === CORS headers ===
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // ===== Directus endpoint =====
    const url = `${process.env.DIRECTUS_URL}/items/coreg_campaigns?filter[is_live][_eq]=true&fields=*,image.id,image.filename_download,coreg_answers.*,coreg_dropdown_options.*,more_info&sort=order`;

    const r = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.DIRECTUS_TOKEN}`
      }
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).json({ error: text });
    }

    const json = await r.json();
    let campaigns = json.data || [];

    // ===== Normalisatie stap =====
    campaigns = campaigns.map((camp) => {
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
          : normalizedSid
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
          : normalizedSid
      }));

      return {
        ...camp,
        cid: normalizedCid,
        sid: normalizedSid,
        coreg_answers: answers,
        coreg_dropdown_options: dropdowns
      };
    });

    console.log(`✅ ${campaigns.length} campagnes genormaliseerd met cid/sid`);
    return res.status(200).json({ data: campaigns });
  } catch (err) {
    console.error("❌ Fout bij ophalen coreg campagnes:", err);
    return res.status(500).json({ error: err.message });
  }
}
