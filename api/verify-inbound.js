export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { code, t_id, aff_id, offer_id, sub_id, internalVisitId } = body;

    console.log(`🚀 Verificatie start voor t_id: ${t_id} met code: ${code}`);

    // 1. Check Directus (Altijd eerst checken of de code bestaat)
    const directusUrl = `${process.env.DIRECTUS_URL}/items/calls?filter[pincode][_eq]=${code}&sort=-date_created&limit=1`;
    const dRes = await fetch(directusUrl, {
      headers: { Authorization: `Bearer ${process.env.DIRECTUS_TOKEN}` },
      cache: 'no-store'
    });
    const dJson = await dRes.json();

    if (!dJson.data || dJson.data.length === 0) {
      return res.status(200).json({ success: false, message: "Code niet gevonden in database." });
    }

    // 2. Directus match! Nu 909Support informeren zodat de beller feedback krijgt op de lijn
    const formData = new URLSearchParams();
    formData.append("pin", code);
    formData.append("clickId", t_id); // De unieke t_id van de beller
    formData.append("internalVisitId", internalVisitId);
    formData.append("affId", aff_id || "");
    formData.append("offerId", offer_id || "");
    formData.append("subId", sub_id || "");
    formData.append("gameName", "memory"); 

    const nineres = await fetch("https://cdn.909support.com/NL/4.1/stage/assets/php/SubmitPin.php", {
      method: "POST",
      body: formData,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const nineData = await nineres.json();

    // 3. Alleen succes als 909 de code accepteert (zodat beller en site synchroon lopen)
    if (nineData && nineData.callId) {
      return res.status(200).json({ 
        success: true, 
        callId: nineData.callId,
        message: "Code geaccepteerd door Directus & 909!" 
      });
    } else {
      return res.status(200).json({ 
        success: false, 
        message: "De telefoonlijn herkent deze code nog niet. Probeer het over een paar seconden opnieuw." 
      });
    }

  } catch (err) {
    console.error("Fout:", err);
    return res.status(500).json({ success: false, message: "Serverfout" });
  }
}
