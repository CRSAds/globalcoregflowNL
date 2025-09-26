export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { cid, sid, answer } = req.body;

    // Build payload → hier koppel je shortform data uit session of extra velden
    const payload = {
      cid,
      sid,
      f_1234_answer: answer, // voorbeeld
      // TODO: voeg hier short form data toe (firstname, email etc.)
    };

    const r = await fetch("https://crsadvertising.databowl.com/api/v1/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await r.text();
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(r.ok ? 200 : r.status).send(text);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
