// /api/verify-inbound.js
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { code } = req.body ? JSON.parse(req.body) : req.query;

    if (!code) {
      return res.status(400).json({ success: false, message: "Geen code ingevuld" });
    }

    // Zoek in Directus of deze 'pincode' (of 'ivr_value' afhankelijk van 909support) 
    // de afgelopen 15 minuten is aangemaakt en de status 'calling' of 'answered' heeft.
    // Voor nu zoeken we op 'pincode' net als in de outbound versie.
    const directusUrl = `${process.env.DIRECTUS_URL}/items/calls?filter[pincode][_eq]=${code}&sort=-date_created&limit=1&fields=id,status`;

    const response = await fetch(directusUrl, {
      method: "GET",
      headers: { Authorization: `Bearer ${process.env.DIRECTUS_TOKEN}` },
      cache: "no-store"
    });

    const json = await response.json();

    if (!json.data || json.data.length === 0) {
      return res.status(200).json({ success: false, message: "Code onbekend of verlopen" });
    }

    // Code bestaat! Je kunt hier eventueel nog checken of status === 'calling'
    return res.status(200).json({ success: true, message: "Code geverifieerd!" });

  } catch (err) {
    console.error("❌ Fout bij verify-inbound:", err);
    return res.status(500).json({ success: false, message: "Serverfout" });
  }
}
