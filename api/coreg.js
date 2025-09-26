export default async function handler(req, res) {
  // Zet CORS headers voor alle requests
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Preflight check (OPTIONS)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const url = `${process.env.DIRECTUS_URL}/items/coreg_campaigns?fields=*,image.id,image.filename_download,coreg_answers.id,coreg_answers.label,coreg_dropdown_options.id,coreg_dropdown_options.label,coreg_dropdown_options.value&sort=order`;

    const r = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.DIRECTUS_TOKEN}`
      }
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).json({ error: text });
    }

    const data = await r.json();
    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
