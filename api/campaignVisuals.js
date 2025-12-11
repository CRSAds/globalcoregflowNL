import { fetchWithRetry } from "./utils/fetchDirectus.js";

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  // --- CORS ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  // ✅ Edge caching (1 uur)
  res.setHeader(
    "Cache-Control",
    "s-maxage=3600, stale-while-revalidate"

  try {
    const url = `${process.env.DIRECTUS_URL}/items/campaign_layouts?filter[is_live][_eq]=true&fields=slug,title,paragraph,hero_image.id,horizontal_hero_image.id,background_image.id,ivr_image.id`;

    const json = await fetchWithRetry(url, {
      headers: { Authorization: `Bearer ${process.env.DIRECTUS_TOKEN}` },
    });

    const visuals = (json.data || []).map((v) => ({
      slug: v.slug || "",
      title: v.title || "",
      paragraph: v.paragraph || "",
      hero_image: v.hero_image?.id
        ? `https://cms.core.909play.com/assets/${v.hero_image.id}`
        : null,
      horizontal_hero_image: v.horizontal_hero_image?.id
        ? `https://cms.core.909play.com/assets/${v.horizontal_hero_image.id}`
        : null,
      background_image: v.background_image?.id
        ? `https://cms.core.909play.com/assets/${v.background_image.id}`
        : null,
      ivr_image: v.ivr_image?.id
        ? `https://cms.core.909play.com/assets/${v.ivr_image.id}`
        : null,
    }));

    console.log(`✅ ${visuals.length} visuals geladen`);
    res.status(200).json({ data: visuals });
  } catch (err) {
    console.error("❌ Fout bij ophalen visuals:", err);
    res.status(500).json({ error: err.message });
  }
}
