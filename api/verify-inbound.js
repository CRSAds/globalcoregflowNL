export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { code } = body;

    if (!code || code.length !== 3) {
      return res.status(200).json({ success: false, message: "Vul een 3-cijferige code in." });
    }

    const maxRetries = 5; // Maximaal 5 keer proberen
    const delayMs = 1000; // 1 seconde wachten per poging
    let lastCallRecord = null;

    for (let i = 0; i < maxRetries; i++) {
      const directusUrl = `${process.env.DIRECTUS_URL}/items/calls?filter[pincode][_eq]=${code}&sort=-date_created&limit=1`;
      
      const dRes = await fetch(directusUrl, {
        headers: { Authorization: `Bearer ${process.env.DIRECTUS_TOKEN}` },
        cache: 'no-store'
      });
      const dJson = await dRes.json();

      if (dJson.data && dJson.data.length > 0) {
        lastCallRecord = dJson.data[0];
        
        // Check of de status nu wél goed is (accepteer ook 'ringing' of 'answered' voor de zekerheid)
        const activeStatuses = ['calling', 'answered', 'ringing'];
        
        if (activeStatuses.includes(lastCallRecord.status)) {
          console.log(`✅ Toegang na ${i} retries voor code ${code} (Status: ${lastCallRecord.status})`);
          return res.status(200).json({ 
            success: true, 
            message: "Code geverifieerd!" 
          });
        }
      }

      // Niet gevonden of status is nog niet 'calling'? Wacht 1 seconde en probeer opnieuw (behalve bij de laatste poging)
      if (i < maxRetries - 1) {
        console.log(`⏳ Poging ${i + 1} mislukt, wacht op webhook...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    // Als we na 5 seconden nog steeds geen succes hebben:
    if (!lastCallRecord) {
      return res.status(200).json({ success: false, message: "Deze code is onbekend." });
    } else {
      return res.status(200).json({ 
        success: false, 
        message: `De lijn is nog niet actief (status: ${lastCallRecord.status}). Probeer het over een paar seconden nog eens.` 
      });
    }

  } catch (err) {
    return res.status(500).json({ success: false, message: "Serverfout bij verificatie." });
  }
}
