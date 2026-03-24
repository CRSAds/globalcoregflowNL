export default async function handler(req, res) {
  // CORS & Anti-Cache Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { pin } = req.query;

    if (!pin) {
      return res.status(400).json({ status: "error", message: "Geen PIN opgegeven" });
    }

    // Gebruik _eq (exacte match) om type-errors op nummers te voorkomen.
    // Geen extra parameters in deze URL, dat blokkeert Directus soms.
    const directusUrl = `${process.env.DIRECTUS_URL}/items/calls?filter[ivr_value][_eq]=${pin}&sort=-date_created&limit=1&fields=id,status,ivr_value`;

    const response = await fetch(directusUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.DIRECTUS_TOKEN}`,
      },
      cache: "no-store"
    });

    const json = await response.json();

    // Als Directus zelf een foutmelding geeft (bijv. type mismatch of onbekend veld),
    // sturen we dit NU netjes door in plaats van blind "not_found" te roepen!
    if (json.errors) {
      console.error("Directus API Error:", json.errors);
      return res.status(200).json({ status: "error", message: "Directus faalde", details: json.errors });
    }

    if (!json.data || json.data.length === 0) {
      return res.status(200).json({ status: "not_found" });
    }

    // Succes! Stuur de status terug.
    return res.status(200).json({ status: json.data[0].status });

  } catch (err) {
    console.error("❌ Fout bij check-call:", err);
    return res.status(500).json({ status: "error", message: err.message });
  }
}
