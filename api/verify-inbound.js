export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { code, t_id } = body;

    // Directus check
    const directusUrl = `${process.env.DIRECTUS_URL}/items/calls?filter[pincode][_eq]=${code}&sort=-date_created&limit=1`;
    const dRes = await fetch(directusUrl, {
      headers: { Authorization: `Bearer ${process.env.DIRECTUS_TOKEN}` },
      cache: 'no-store'
    });
    const dJson = await dRes.json();

    if (dJson.data && dJson.data.length > 0) {
      return res.status(200).json({ 
        success: true, 
        message: "Match gevonden in Directus!" 
      });
    }

    return res.status(200).json({ 
      success: false, 
      message: "Code niet gevonden." 
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
