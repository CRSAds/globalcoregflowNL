// Bestand: /api/save-score.js

export default async function handler(req, res) {
  // We accepteren alleen POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Haal de data uit de payload van Lovable
  const { score, t_id, email, firstname, lastname } = req.body;

  try {
    // Jouw Directus URL en Token (Zorg dat deze in je Vercel Environment Variables staan!)
    // Mocht je ze hardcoded willen (niet aanbevolen, maar kan), vul ze dan hier in.
    const directusUrl = process.env.DIRECTUS_URL || "https://cms.core.909play.com"; 
    const directusToken = process.env.DIRECTUS_TOKEN; // Bijv: "jouw-geheime-api-token"

    if (!directusToken) {
      console.error("Missende Directus Token!");
      return res.status(500).json({ error: "Server configuratie fout" });
    }

    // Bouw het pakketje voor Directus
    const payload = {
      score: parseInt(score, 10) || 0,
      t_id: t_id || "",
      email: email || "",
      firstname: firstname || "",
      lastname: lastname || ""
    };

    // Schiet de data naar de nieuwe 'quiz_scores' collectie
    const response = await fetch(`${directusUrl}/items/quiz_scores`, {
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
    
    // Succes! Stuur een OK terug naar Lovable
    return res.status(200).json({ success: true, id: data.data.id });

  } catch (error) {
    console.error("API Crash in save-score:", error);
    return res.status(500).json({ error: "Interne serverfout" });
  }
}
