// /api/sponsors.js
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const url = `${process.env.DIRECTUS_URL}/items/co_sponsors?filter[is_live][_eq]=true&fields=title,description,logo,address,privacy_url&sort=title`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${process.env.DIRECTUS_TOKEN}` }
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }

    const json = await response.json();
    const sponsors = json.data || [];

    res.status(200).json({ data: sponsors });
  } catch (error) {
    console.error("❌ Fout bij ophalen sponsors:", error);
    res.status(500).json({ error: error.message });
  }
}
