export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { code, t_id, aff_id, offer_id, sub_id } = JSON.parse(req.body);

    // 1. Check eerst Directus (jouw eigen database)
    const directusUrl = `${process.env.DIRECTUS_URL}/items/calls?filter[pincode][_eq]=${code}&sort=-date_created&limit=1`;
    const dRes = await fetch(directusUrl, {
      headers: { Authorization: `Bearer ${process.env.DIRECTUS_TOKEN}` }
    });
    const dJson = await dRes.json();

    if (!dJson.data || dJson.data.length === 0) {
      return res.status(200).json({ success: false, message: "Code onbekend" });
    }

    // 2. Directus match gevonden! Nu 909Support op de hoogte stellen
    // We gebruiken de gegevens die uit de frontend komen
    const formData = new URLSearchParams();
    formData.append("pin", code);
    formData.append("clickId", t_id);
    formData.append("affId", aff_id || "unknown");
    formData.append("offerId", offer_id || "unknown");
    formData.append("subId", sub_id || "unknown");
    formData.append("gameName", "memory"); 

    const nineres = await fetch("https://cdn.909support.com/NL/4.1/stage/assets/php/SubmitPin.php", {
      method: "POST",
      body: formData,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const nineData = await nineres.json();

    if (nineData && nineData.callId) {
      return res.status(200).json({ 
        success: true, 
        callId: nineData.callId,
        message: "Geverifieerd bij Directus & 909!" 
      });
    } else {
      return res.status(200).json({ success: false, message: "909 keurde de code af." });
    }

  } catch (err) {
    return res.status(500).json({ success: false, message: "Serverfout" });
  }
}
