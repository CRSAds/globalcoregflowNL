export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const now = new Date().toISOString();

    // ---------- HELPERS ----------
    async function getIds(collection) {
      const r = await fetch(
        `${process.env.DIRECTUS_URL}/items/${collection}?fields=id&filter[paused_until][_lte]=${now}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.DIRECTUS_TOKEN}`
          }
        }
      );
      const j = await r.json();
      return (j.data || []).map(x => x.id);
    }

    async function patchByIds(collection, ids) {
      if (!ids.length) return 204; // nothing to patch

      const r = await fetch(`${process.env.DIRECTUS_URL}/items/${collection}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${process.env.DIRECTUS_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          keys: ids,
          data: {
            is_live: true,
            paused_until: null
          }
        })
      });

      return r.status;
    }

    // ---------- CORE LOGIC ----------
    const coregIds = await getIds("coreg_campaigns");
    const sponsorIds = await getIds("co_sponsors");

    const coregStatus = await patchByIds("coreg_campaigns", coregIds);
    const sponsorStatus = await patchByIds("co_sponsors", sponsorIds);

    return res.status(200).json({
      success: true,
      coreg_updated: coregStatus,
      sponsors_updated: sponsorStatus,
      coreg_ids: coregIds,
      sponsor_ids: sponsorIds
    });

  } catch (err) {
    console.error("❌ Reactivation error:", err);
    return res.status(500).json({ error: err.message });
  }
}
