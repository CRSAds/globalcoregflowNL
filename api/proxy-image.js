// Bestand: /api/proxy-image.js

export default async function handler(req, res) {
  // 1. Zet de CORS-poorten wijd open voor Lovable
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).send('Geen image ID opgegeven');
  }

  try {
    const directusUrl = process.env.DIRECTUS_URL || "https://cms.core.909play.com";
    
    // Haal de afbeelding server-to-server op uit Directus (geen CORS issues hier!)
    const response = await fetch(`${directusUrl}/assets/${id}`);
    
    if (!response.ok) {
      return res.status(response.status).send('Afbeelding niet gevonden in Directus');
    }

    // Zet de data om naar een buffer
    const buffer = await response.arrayBuffer();
    
    // Kijk welk type bestand het is (bijv. image/jpeg of image/png)
    const contentType = response.headers.get('content-type');

    // Stuur de afbeelding terug naar de browser mét de juiste headers
    res.setHeader('Content-Type', contentType || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // Sla hem lokaal op voor snelheid
    
    return res.send(Buffer.from(buffer));

  } catch (error) {
    console.error("Proxy error:", error);
    return res.status(500).send('Fout bij het laden van de afbeelding');
  }
}
