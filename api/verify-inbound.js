export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { code, t_id, aff_id, offer_id, sub_id, internalVisitId } = body;

    // 1. Eerst Directus checken (zoals we gewend zijn)
    const directusUrl = `${process.env.DIRECTUS_URL}/items/calls?filter[pincode][_eq]=${code}&sort=-date_created&limit=1`;
    const dRes = await fetch(directusUrl, {
      headers: { Authorization: `Bearer ${process.env.DIRECTUS_TOKEN}` },
      cache: 'no-store'
    });
    const dJson = await dRes.json();

    if (!dJson.data || dJson.data.length === 0) {
      return res.status(200).json({ success: false, message: `Code ${code} niet gevonden in Directus.` });
    }

    // 2. Directus is OK! Nu 909 informeren.
    // We gebruiken exact de parameters die 909 verwacht.
    const formData = new URLSearchParams();
    formData.append("pin", code);
    formData.append("clickId", t_id);
    formData.append("internalVisitId", internalVisitId);
    formData.append("affId", aff_id || "");
    formData.append("offerId", offer_id || "");
    formData.append("gameName", "memory"); 

    const nineres = await fetch("https://cdn.909support.com/NL/4.1/stage/assets/php/SubmitPin.php", {
      method: "POST",
      body: formData,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const nineText = await nineres.text(); // We pakken eerst tekst voor het geval het geen JSON is
    let nineData = {};
    try { nineData = JSON.parse(nineText); } catch(e) { nineData = { raw: nineText }; }

    console.log("909 Raw Response:", nineText);

    // Als 909 een callId geeft, is het 100% succes.
    if (nineData.callId) {
      return res.status(200).json({ 
        success: true, 
        callId: nineData.callId,
        message: "Geverifieerd bij Directus & 909!" 
      });
    } 

    // Als 909 geen callId geeft, sturen we hun specifieke fout door
    return res.status(200).json({ 
      success: false, 
      message: `909 weigert: ${nineData.error || nineData.message || "Onbekende fout"}`,
      debug: nineData 
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: "Serverfout: " + err.message });
  }
}
