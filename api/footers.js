// /api/footers.js
// ✅ Haalt alle footers, algemene voorwaarden & privacy policies op uit Directus
// Endpoint: https://globalcoregflow-nl.vercel.app/api/footers.js

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  // === CORS headers ===
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // ===== Directus endpoint =====
    const url = `${process.env.DIRECTUS_URL}/items/footers?fields=name,text,terms_content,privacy_content`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.DIRECTUS_TOKEN}`
      }
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("❌ Directus fout:", text);
      return res.status(response.status).json({ error: text });
    }

    const json = await response.json();

    // ===== Data normaliseren =====
    const data = (json.data || []).map(f => ({
      name: f.name || "",
      text: f.text || "",
      terms_content: f.terms_content || "",
      privacy_content: f.privacy_content || ""
    }));

    console.log(`✅ ${data.length} footers geladen uit Directus`);
    return res.status(200).json({ data });
  } catch (err) {
    console.error("❌ Fout bij ophalen footers:", err);
    return res.status(500).json({ error: err.message });
  }
}
