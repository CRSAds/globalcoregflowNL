import { fetchWithRetry } from "./utils/fetchDirectus.js";

export default async function handler(req, res) {
  // --- CORS headers ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  // ✅ Edge caching (1 uur) via Vercel CDN
  res.setHeader(
    "Cache-Control",
    "s-maxage=3600, stale-while-revalidate"
  );

  try {
    const url = `${process.env.DIRECTUS_URL}/items/co_sponsors?filter[is_live][_eq]=true&fields=title,description,logo,address,privacy_url,cid,sid&sort=title`;

    const json = await fetchWithRetry(url, {
      headers: { Authorization: `Bearer ${process.env.DIRECTUS_TOKEN}` },
    });

    const sponsors = (json.data || []).map((s) => ({
      title: s.title || "",
      description: s.description || "",
      logo: s.logo || null,
      address: s.address || "",
      privacy_url: s.privacy_url || "",
      cid: s.cid || "",
      sid: s.sid || "",
    }));

    console.log(`✅ ${sponsors.length} co-sponsors geladen`);
    res.status(200).json({ data: sponsors });
  } catch (error) {
    console.error("❌ Fout bij ophalen co-sponsors:", error);
    res.status(500).json({ error: error.message });
  }
}
