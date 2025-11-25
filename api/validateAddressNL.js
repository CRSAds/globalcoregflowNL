// /api/validateAddressNL.js
export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { postcode, huisnummer } = req.body || {};

    if (!postcode || !huisnummer) {
      return res.status(400).json({ valid: false, error: "Missing fields" });
    }

    const url = `https://api.pro6pp.nl/v2/autocomplete/nl?authKey=${process.env.PRO6PP_KEY}&postalCode=${encodeURIComponent(
      postcode
    )}&streetNumber=${encodeURIComponent(huisnummer)}`;

    const response = await fetch(url);
    if (!response.ok) {
      return res.status(500).json({ valid: false, error: "API error" });
    }

    const data = await response.json();

    // ------------------------------
    // 1) v2 Autocomplete format
    // ------------------------------
    if (Array.isArray(data?.results) && data.results.length > 0) {
      const adr = data.results[0];

      return res.json({
        valid: true,
        street: adr.street || "",
        city: adr.settlement || adr.city || "",
        raw: data
      });
    }

    // ------------------------------
    // 2) v3 Address Lookup format
    // (zoals jouw response!)
    // ------------------------------
    if (data.street && data.postalCode) {
      return res.json({
        valid: true,
        street: data.street || "",
        city: data.settlement || data.city || "",
        raw: data
      });
    }

    // ------------------------------
    // 3) Geen match
    // ------------------------------
    return res.json({ valid: false });
  } catch (e) {
    return res.status(500).json({ valid: false, error: e.message });
  }
}
