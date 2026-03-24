// /api/check-call.js
export default async function handler(req, res) {
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

    // 1. _contains negeert spaties rondom de pin
    // 2. &t=Date.now() voorkomt dat Vercel de Directus-call onder water cachet!
    const directusUrl = `${process.env.DIRECTUS_URL}/items/calls?filter[ivr_value][_contains]=${pin}&sort=-date_created&limit=1&fields=id,status,ivr_value&t=${Date.now()}`;

    const response = await fetch(directusUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.DIRECTUS_TOKEN}`,
      },
      cache: "no-store"
    });

    const json = await response.json();

    if (!json.data || json.data.length === 0) {
      return res.status(200).json({ status: "not_found" });
    }

    // Retourneer de exacte status vanuit Directus
    return res.status(200).json({ status: json.data[0].status });

  } catch (err) {
    console.error("❌ Fout bij check-call:", err);
    return res.status(500).json({ status: "error", message: err.message });
  }
}
