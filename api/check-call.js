// /api/check-call.js
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { pin } = req.query;

    if (!pin) {
      return res.status(400).json({ status: "error", message: "Geen PIN opgegeven" });
    }

    // Zoek in Directus naar de meest recente call met deze ivr_value
    const url = `${process.env.DIRECTUS_URL}/items/calls?filter[ivr_value][_eq]=${pin}&sort=-date_created&limit=1&fields=id,status,ivr_value`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.DIRECTUS_TOKEN}`,
      },
    });

    const json = await response.json();

    if (!json.data || json.data.length === 0) {
      return res.status(200).json({ status: "not_found" });
    }

    // Retourneer de status (bijv. "calling" of "Stopped")
    return res.status(200).json({ status: json.data[0].status });

  } catch (err) {
    console.error("❌ Fout bij check-call:", err);
    return res.status(500).json({ status: "error", message: err.message });
  }
}
