import { fetchWithRetry } from "./utils/fetchDirectus.js";

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  // ✅ Edge caching (1 uur)
  res.setHeader(
    "Cache-Control",
    "s-maxage=3600, stale-while-revalidate"
  );

  try {
    const url = `${process.env.DIRECTUS_URL}/items/footers?fields=name,text,terms_content,privacy_content,actievoorwaarden,logo.id,icon_terms.id,icon_privacy.id`;

    const json = await fetchWithRetry(url, {
      headers: { Authorization: `Bearer ${process.env.DIRECTUS_TOKEN}` },
    });

    const data = (json.data || []).map((f) => ({
      name: f.name || "",
      coreg_path: f.coreg_path || "",
      text: f.text || "",
      terms_content: f.terms_content || "",
      privacy_content: f.privacy_content || "",
      actievoorwaarden: f.actievoorwaarden || "",
      logo: f.logo?.id
        ? `https://cms.core.909play.com/assets/${f.logo.id}`
        : null,
      icon_terms: f.icon_terms?.id
        ? `https://cms.core.909play.com/assets/${f.icon_terms.id}`
        : null,
      icon_privacy: f.icon_privacy?.id
        ? `https://cms.core.909play.com/assets/${f.icon_privacy.id}`
        : null,
    }));

    console.log(`✅ ${data.length} footers geladen`);
    res.status(200).json({ data });
  } catch (err) {
    console.error("❌ Fout bij ophalen footers:", err);
    res.status(500).json({ error: err.message });
  }
}
