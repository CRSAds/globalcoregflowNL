// Bestand: /api/get-campaign.js

export default async function handler(req, res) {
  // CORS Headers (zodat Lovable erbij mag)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Preflight request afvangen
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Haal de slug uit de request (bijv: ?slug=kaartvanah)
  const { slug } = req.query;

  if (!slug) {
    return res.status(400).json({ error: 'Geen slug meegegeven' });
  }

  try {
    const directusUrl = process.env.DIRECTUS_URL || "https://cms.core.909play.com";
    const directusToken = process.env.DIRECTUS_TOKEN;

    // We vragen Directus om het item waar de slug overeenkomt met de URL
    // Zorg dat je collectie naam 'campaign_layouts' is (of pas dit hieronder aan)
    const fetchUrl = `${directusUrl}/items/campaign_layouts?filter[slug][_eq]=${slug}&limit=1`;
    
    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${directusToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Fout bij ophalen Directus data' });
    }

    const data = await response.json();

    // Check of we een campagne hebben gevonden
    if (data.data && data.data.length > 0) {
      const campaign = data.data[0];
      
      // Directus geeft bij images alleen een ID terug (bijv: 'abc-123-def').
      // Wij bouwen hier direct de volledige afbeeldings-URL voor Lovable.
      const getImageUrl = (imageId) => imageId ? `${directusUrl}/assets/${imageId}` : null;

      return res.status(200).json({
        success: true,
        title: campaign.title || "",
        paragraph: campaign.paragraph || "",
        hero_image: getImageUrl(campaign.hero_image),
        horizontal_hero_image: getImageUrl(campaign.horizontal_hero_image)
      });
    } else {
      return res.status(404).json({ error: 'Campagne niet gevonden' });
    }

  } catch (error) {
    console.error("API Crash in get-campaign:", error);
    return res.status(500).json({ error: 'Interne serverfout' });
  }
}
