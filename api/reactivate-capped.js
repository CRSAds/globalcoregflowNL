export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const now = new Date().toISOString();

    const headers = {
      "Authorization": `Bearer ${process.env.DIRECTUS_TOKEN}`,
      "Content-Type": "application/json"
    };

    const body = JSON.stringify({
      data: {
        is_live: true,
        paused_until: null
      }
    });

    // === coreg_campaigns ===
    const r1 = await fetch(
      `${process.env.DIRECTUS_URL}/items/coreg_campaigns?filter[paused_until][_lte]=${now}`,
      {
        method: "PATCH",
        headers,
        body
      }
    );

    // === co_sponsors ===
    const r2 = await fetch(
      `${process.env.DIRECTUS_URL}/items/co_sponsors?filter[paused_until][_lte]=${now}`,
      {
        method: "PATCH",
        headers,
        body
      }
    );

    console.log("✅ Reactivation check complete");

    return res.status(200).json({
      success: true,
      coreg_updated: r1.status,
      sponsors_updated: r2.status
    });

  } catch (err) {
    console.error("❌ Reactivation error:", err);
    return res.status(500).json({ error: err.message });
  }
}
