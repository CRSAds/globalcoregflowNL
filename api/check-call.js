// /api/check-call.js
export default async function handler(req, res) {
  // CORS & Anti-Cache Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // 1. Haal de pin én de nieuwe tracking params uit de URL
    const { pin, t_id, offer_id, sub_id, aff_id } = req.query;

    if (!pin) {
      return res.status(400).json({ status: "error", message: "Geen PIN opgegeven" });
    }

    // 2. We vragen nu ook het veld 'click_id' op, zodat we weten of de tracking al is opgeslagen.
    // (Check even of dit veld in jouw Directus 'click_id', 't_id' of 'transaction_id' heet!)
    const directusUrl = `${process.env.DIRECTUS_URL}/items/calls?filter[pincode][_eq]=${pin}&sort=-date_created&limit=1&fields=id,status,pincode,click_id`;

    const response = await fetch(directusUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.DIRECTUS_TOKEN}`,
      },
      cache: "no-store"
    });

    const json = await response.json();

    if (json.errors) {
      console.error("Directus API Error:", json.errors);
      return res.status(200).json({ status: "error", message: "Directus faalde", details: json.errors });
    }

    if (!json.data || json.data.length === 0) {
      return res.status(200).json({ status: "not_found" });
    }

    const callRecord = json.data[0];

    // =========================================================
    // 3. ✨ DE SLIMME TRACKING PATCH ✨
    // Als de call bestaat, we t_id hebben ontvangen, én click_id nog leeg is in Directus:
    // =========================================================
    if (t_id && t_id !== "undefined" && !callRecord.click_id) {
      console.log(`[Tracking] Call gevonden voor pin ${pin}. Tracking data toevoegen...`);
      
      // Update het record asynchroon op de achtergrond
      fetch(`${process.env.DIRECTUS_URL}/items/calls/${callRecord.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.DIRECTUS_TOKEN}`
        },
        body: JSON.stringify({
          click_id: t_id,      // Zorg dat de veldnamen (links) exact matchen met Directus!
          offer_id: offer_id,
          sub_id: sub_id,
          aff_id: aff_id
        })
      }).catch(err => console.error("Fout bij updaten Directus tracking:", err));
    }

    // 4. Succes! Stuur de actuele bel-status terug
    return res.status(200).json({ status: callRecord.status });

  } catch (err) {
    console.error("❌ Fout bij check-call:", err);
    return res.status(500).json({ status: "error", message: err.message });
  }
}
