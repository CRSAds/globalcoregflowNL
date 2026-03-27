export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    
    // 1. Haal nu ook alle tracking data uit de body!
    const { code, t_id, aff_id, offer_id, sub_id } = body;

    if (!code || code.length !== 3) {
      return res.status(200).json({ success: false, message: "Vul een 3-cijferige code in." });
    }

    const maxRetries = 5;
    const delayMs = 1000;
    let lastCallRecord = null;

    for (let i = 0; i < maxRetries; i++) {
      // 2. We vragen extra velden op: 'click_id' om te kijken of we al gepatcht hebben.
      const directusUrl = `${process.env.DIRECTUS_URL}/items/calls?filter[pincode][_eq]=${code}&sort=-date_created&limit=1&fields=id,status,pincode,click_id`;
      
      const dRes = await fetch(directusUrl, {
        headers: { Authorization: `Bearer ${process.env.DIRECTUS_TOKEN}` },
        cache: 'no-store'
      });
      const dJson = await dRes.json();

      if (dJson.data && dJson.data.length > 0) {
        lastCallRecord = dJson.data[0];
        
        // =========================================================
        // ✨ DE SLIMME TRACKING PATCH ✨
        // Als we tracking data hebben én de call in Directus heeft dit nog niet:
        // =========================================================
        if (t_id && t_id !== "undefined" && !lastCallRecord.click_id) {
          console.log(`[Verify Inbound] Call gevonden voor pin ${code}. Tracking data updaten...`);
          
          try {
            await fetch(`${process.env.DIRECTUS_URL}/items/calls/${lastCallRecord.id}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.DIRECTUS_TOKEN}`
              },
              body: JSON.stringify({
                click_id: t_id,      // Let op: check of deze kolom in Directus echt 'click_id' heet
                offer_id: offer_id,
                sub_id: sub_id,
                aff_id: aff_id
              })
            });
            // Voorkom dubbele patches binnen dezelfde loop
            lastCallRecord.click_id = t_id; 
          } catch(e) {
            console.error("Fout bij opslaan van tracking data in Directus:", e);
          }
        }

        // 3. Status afhandeling
        const currentStatus = lastCallRecord.status ? lastCallRecord.status.toLowerCase() : '';
        const activeStatuses = ['calling', 'answered', 'ringing'];
        
        if (activeStatuses.includes(currentStatus)) {
          return res.status(200).json({ 
            success: true, 
            message: "Code geverifieerd!" 
          });
        }
      }

      // Wacht 1 seconde voordat hij het opnieuw probeert
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    if (!lastCallRecord) {
      return res.status(200).json({ success: false, message: "Deze code is onbekend." });
    } else {
      return res.status(200).json({ 
        success: false, 
        message: `De lijn is nog niet actief (status: ${lastCallRecord.status}). Probeer het over een paar seconden nog eens.` 
      });
    }

  } catch (err) {
    console.error("Serverfout bij verificatie:", err);
    return res.status(500).json({ success: false, message: "Serverfout bij verificatie." });
  }
}
