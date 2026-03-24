// Bestand: /api/save-score.js

export default async function handler(req, res) {
  // 1. Stel de CORS headers in (Laat iedereen toe)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // Of specifieke domeinen, maar * is het makkelijkst
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 2. Vang het 'preflight' (OPTIONS) verzoek van de browser af en geef direct groen licht
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 3. We accepteren voor het opslaan alleen POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Haal de data uit de payload van Lovable
  const { score, t_id, email, firstname, lastname } = req.body;

  try {
    // Jouw Directus URL en Token
    const directusUrl = process.env.DIRECTUS_URL || "https://cms.core.909play.com"; 
    const directusToken = process.env.DIRECTUS_TOKEN;

    if (!directusToken) {
      console.error("Missende Directus Token!");
      return res.status(500).json({ error: "Server configuratie fout" });
    }

    // Bouw het pakketje voor Directus (zorg dat de collectienaam overeenkomt!)
    const payload = {
      score: parseInt(score, 10) || 0,
      t_id: t_id || "",
      email: email || "",
      firstname: firstname || "",
      lastname: lastname || ""
    };

    // Schiet de data naar jouw nieuwe collectie: Highscores_speed_quiz
    const response = await fetch(`${directusUrl}/items/Highscores_speed_quiz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${directusToken}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Directus weigerde de score:", errorText);
      return res.status(response.status).json({ error: "Fout bij opslaan in Directus" });
    }

    const data = await response.json();
    
    // Succes! Stuur een OK terug
    return res.status(200).json({ success: true, id: data.data.id });

  } catch (error) {
    console.error("API Crash in save-score:", error);
    return res.status(500).json({ error: "Interne serverfout" });
  }
}
