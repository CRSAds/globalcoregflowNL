export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const now = new Date().toISOString();

    const url = `${process.env.DIRECTUS_URL}/items/coreg_campaigns`;
    const patchBody = JSON.stringify({
      data: { is_live: true, paused_until: null },
      filter: { paused_until: { _lte: now } }
    });

    const r1 = await fetch(url, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${process.env.DIRECTUS_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: patchBody
    });

    const r2 = await fetch(`${process.env.DIRECTUS_URL}/items/co_sponsors`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${process.env.DIRECTUS_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: patchBody
    });

    console.log("✅ Reactivation check complete");
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Reactivation error:", err);
    return res.status(500).json({ error: err.message });
  }
}
