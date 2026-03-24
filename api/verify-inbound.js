export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { code, t_id, aff_id, offer_id, sub_id, internalVisitId } = body;

    // 1. De Heilige Check: Staat de code in Directus?
    const directusUrl = `${process.env.DIRECTUS_URL}/items/calls?filter[pincode][_eq]=${code}&sort=-date_created&limit=1`;
    const dRes = await fetch(directusUrl, {
      headers: { Authorization: `Bearer ${process.env.DIRECTUS_TOKEN}` },
      cache: 'no-store'
    });
    const dJson = await dRes.json();

    const hasDirectusMatch = dJson.data && dJson.data.length > 0;

    // 2. Probeer 909 te informeren (op de achtergrond)
    const params = new URLSearchParams();
    params.append("pin", code);
    params.append("clickId", t_id || "");
    params.append("internalVisitId", internalVisitId || "");
    params.append("affId", aff_id || "unknown");
    params.append("offerId", offer_id || "unknown");
    params.append("subId", sub_id || "");
    params.append("gameName", "memory"); 

    const nineres = await fetch("https://cdn.909support.com/NL/4.1/stage/assets/php/SubmitPin.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString()
    });
    const nineText = await nineres.text();

    // 3. BESLISSING: We laten de gebruiker door als Directus groen licht geeft.
    // Dit voorkomt dat een 909-fout de hele funnel blokkeert.
    if (hasDirectusMatch) {
      return res.status(200).json({ 
        success: true, 
        message: "Code gevonden! (909 status: " + nineText + ")",
        callId: "simulated_id_" + Date.now() 
      });
    }

    return res.status(200).json({ 
      success: false, 
      message: "Code " + code + " niet gevonden in Directus." 
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
