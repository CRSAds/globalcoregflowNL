// /api/validateAddressNL.js
export default async function handler(req, res) {
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

    // Pro6PP endpoint
    const url = `https://api.pro6pp.nl/v2/autocomplete/nl?authKey=${process.env.PRO6PP_KEY}&postalCode=${encodeURIComponent(
      postcode
    )}&streetNumber=${encodeURIComponent(huisnummer)}`;

    const response = await fetch(url);
    if (!response.ok) {
      return res.status(500).json({ valid: false, error: "API error" });
    }

    const data = await response.json();

    if (!data?.results?.length) {
      return res.json({ valid: false });
    }

    const adr = data.results[0];

    return res.json({
      valid: true,
      street: adr.street,
      city: adr.city,
      raw: data,
    });
  } catch (e) {
    return res.status(500).json({ valid: false, error: e.message });
  }
}
