export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { code, t_id } = body;

    if (!code || code.length !== 3) {
      return res.status(200).json({ success: false, message: "Geen geldige code ingevoerd." });
    }

    // STRENGE CHECK: Pincode moet matchen ÉN de status moet 'calling' zijn.
    // Voeg eventueel 'answered' toe als 909 de status soms al opschuift.
    const directusUrl = `${process.env.DIRECTUS_URL}/items/calls?filter[pincode][_eq]=${code}&filter[status][_in]=calling,answered&sort=-date_created&limit=1`;
    
    const dRes = await fetch(directusUrl, {
      headers: { Authorization: `Bearer ${process.env.DIRECTUS_TOKEN}` },
      cache: 'no-store'
    });
    
    const dJson = await dRes.json();

    // Als de array leeg is, bestaat de code niet óf is er niet (meer) mee gebeld.
    if (dJson.data && dJson.data.length > 0) {
      console.log(`✅ Toegang verleend voor code ${code} (Status: ${dJson.data[0].status})`);
      return res.status(200).json({ 
        success: true, 
        message: "Code geverifieerd en lijn is actief!" 
      });
    }

    console.log(`❌ Toegang geweigerd voor code ${code}`);
    return res.status(200).json({ 
      success: false, 
      message: "Deze code is onjuist of de telefoonlijn is niet actief." 
    });

  } catch (err) {
    console.error("API Error:", err);
    return res.status(500).json({ success: false, message: "Serverfout bij verificatie." });
  }
}
