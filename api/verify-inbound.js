export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { code, t_id, aff_id, offer_id, sub_id, internalVisitId } = body;

    // 1. Check Directus (Source of Truth)
    const directusUrl = `${process.env.DIRECTUS_URL}/items/calls?filter[pincode][_eq]=${code}&sort=-date_created&limit=1`;
    const dRes = await fetch(directusUrl, {
      headers: { Authorization: `Bearer ${process.env.DIRECTUS_TOKEN}` },
      cache: 'no-store'
    });
    const dJson = await dRes.json();

    if (!dJson.data || dJson.data.length === 0) {
      return res.status(200).json({ success: false, message: `Code ${code} niet gevonden in Directus.` });
    }

    // 2. Directus match! Nu 909 informeren.
    // We gebruiken de STAGE url, zorg dat Lovable die ook gebruikt!
    const params = new URLSearchParams();
    params.append("pin", code);
    params.append("clickId", t_id || "");
    params.append("internalVisitId", internalVisitId || "");
    params.append("affId", aff_id || "unknown");
    params.append("offerId", offer_id || "unknown");
    params.append("subId", sub_id || ""); // Altijd meesturen
    params.append("gameName", "memory"); 

    const nineres = await fetch("https://cdn.909support.com/NL/4.1/stage/assets/php/SubmitPin.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString()
    });

    const responseText = await nineres.text();
    console.log("Raw 909 response:", responseText);

    let result = {};
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      // Als het geen JSON is (bijv. platte tekst "Request failed")
      result = { error: responseText };
    }

    // Check op succes (callId aanwezig)
    if (result.callId) {
      return res.status(200).json({ success: true, callId: result.callId });
    }

    // DEBUG HACK: Als je aan het testen bent en je wilt door ondanks 909 falen:
    // Zet dit op 'true' om de 909 check tijdelijk te negeren (Directus match is dan genoeg)
    const bypass909 = false; 

    if (bypass909) {
       return res.status(200).json({ success: true, message: "Bypassed 909 for testing" });
    }

    return res.status(200).json({ 
      success: false, 
      message: `909 weigert: ${result.error || responseText}`,
      debug: result 
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
