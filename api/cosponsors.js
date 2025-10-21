// /api/cosponsors.js
// Haalt alle live co-sponsors op uit Directus en retourneert JSON
// Wordt aangeroepen door public/cosponsors.js (de popup op Swipe Pages)

export default async function handler(req, res) {
  // CORS headers — zodat Swipe Pages het mag ophalen
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // 🔗 Directus endpoint — haalt alleen live sponsors op
    const url = `${process.env.DIRECTUS_URL}/items/co_sponsors?filter[is_live][_eq]=true&fields=title,description,logo,address,privacy_url&sort=title`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.DIRECTUS_TOKEN}`
      }
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("❌ Directus API-fout:", text);
      return res.status(response.status).json({ error: text });
    }

    const json = await response.json();
    const sponsors = json.data || [];

    console.log(`✅ ${sponsors.length} co-sponsors geladen uit Directus`);
    return res.status(200).json({ data: sponsors });
  } catch (error) {
    console.error("❌ Fout bij ophalen co-sponsors:", error);
    return res.status(500).json({ error: error.message });
  }
}
