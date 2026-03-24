// /api/check-call.js
export default async function handler(req, res) {
  // CORS & Anti-Cache Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { pin } = req.query;

    if (!pin) {
      return res.status(400).json({ status: "error", message: "Geen PIN opgegeven" });
    }

    // 🎯 HIER ZIT DE FIX: We zoeken nu in het veld 'pincode' i.p.v. 'ivr_value'!
    const directusUrl = `${process.env.DIRECTUS_URL}/items/calls?filter[pincode][_eq]=${pin}&sort=-date_created&limit=1&fields=id,status,pincode`;

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

    // Succes! Stuur de status terug.
    return res.status(200).json({ status: json.data[0].status });

  } catch (err) {
    console.error("❌ Fout bij check-call:", err);
    return res.status(500).json({ status: "error", message: err.message });
  }
}
