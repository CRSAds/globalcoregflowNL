// /api/cosponsors.js
// ✅ Uitgebreide versie: bevat nu cid/sid voor Databowl-verzending

export default async function handler(req, res) {
  // --- CORS headers ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // 🔗 Directus endpoint — alleen live co-sponsors met cid/sid
    const url = `${process.env.DIRECTUS_URL}/items/co_sponsors?filter[is_live][_eq]=true&fields=title,description,logo,address,privacy_url,cid,sid&sort=title`;

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
    const sponsors = (json.data || []).map(s => ({
      title: s.title || "",
      description: s.description || "",
      logo: s.logo || null,
      address: s.address || "",
      privacy_url: s.privacy_url || "",
      cid: s.cid || "",
      sid: s.sid || ""
    }));

    console.log(`✅ ${sponsors.length} co-sponsors geladen uit Directus (incl. cid/sid)`);
    return res.status(200).json({ data: sponsors });
  } catch (error) {
    console.error("❌ Fout bij ophalen co-sponsors:", error);
    return res.status(500).json({ error: error.message });
  }
}
