export default async function handler(req, res) {
  // CORS & Anti-Cache Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { pin } = req.query;

    if (!pin) {
      return res.status(400).json({ status: "error", message: "Geen PIN opgegeven" });
    }

    const url = `${process.env.DIRECTUS_URL}/items/calls?filter[ivr_value][_eq]=${pin}&sort=-date_created&limit=1&fields=id,status,ivr_value`;

    // Gebruik cache: 'no-store' zodat de Next.js/Vercel fetch niet stiekem cachet
    const response = await fetch(url, {
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

    return res.status(200).json({ status: json.data[0].status });

  } catch (err) {
    console.error("❌ Fout bij check-call:", err);
    return res.status(500).json({ status: "error", message: err.message });
  }
}
