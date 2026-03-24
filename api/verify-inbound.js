export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // Vercel parseert de body soms al automatisch, we vangen beide gevallen op:
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { code, t_id, aff_id, offer_id, sub_id, internalVisitId } = body;

    console.log("🔍 Check voor code:", code, "bij t_id:", t_id);

    // 1. Check Directus (Source of Truth)
    const directusUrl = `${process.env.DIRECTUS_URL}/items/calls?filter[pincode][_eq]=${code}&sort=-date_created&limit=1`;
    const dRes = await fetch(directusUrl, {
      headers: { Authorization: `Bearer ${process.env.DIRECTUS_TOKEN}` },
      cache: 'no-store'
    });
    const dJson = await dRes.json();

    if (!dJson.data || dJson.data.length === 0) {
      console.log("❌ Geen match in Directus voor code:", code);
      return res.status(200).json({ success: false, message: "Code niet gevonden in Directus" });
    }

    console.log("✅ Match in Directus! Nu 909 informeren...");

    // 2. Directus match gevonden! Nu 909Support informeren
    const formData = new URLSearchParams();
    formData.append("pin", code);
    formData.append("clickId", t_id || "");
    formData.append("internalVisitId", internalVisitId || "");
    formData.append("affId", aff_id || "unknown");
    formData.append("offerId", offer_id || "unknown");
    formData.append("subId", sub_id || "unknown");
    formData.append("gameName", "memory"); 

    const nineres = await fetch("https://cdn.909support.com/NL/4.1/stage/assets/php/SubmitPin.php", {
      method: "POST",
      body: formData,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    // We loggen wat 909 zegt, maar we laten de bezoeker alvast door als Directus groen licht gaf
    const nineData = await nineres.json();
    console.log("📞 909 Response:", nineData);

    return res.status(200).json({ 
      success: true, 
      callId: nineData?.callId || null,
      message: "Geverifieerd!" 
    });

  } catch (err) {
    console.error("🔥 Server Error:", err);
    return res.status(500).json({ success: false, message: "Serverfout bij verificatie" });
  }
}
