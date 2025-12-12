// /api/sync-calls.js

const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  try {
    // 1️⃣ Alleen calls met status = Stopped
    const url =
      `${DIRECTUS_URL}/items/calls` +
      `?filter[status][_eq]=Stopped` +
      `&sort=-date_created` +
      `&limit=500`;

    const r = await fetch(url, {
      headers: {
        Authorization: `Bearer ${DIRECTUS_TOKEN}`,
      },
    });

    if (!r.ok) {
      const t = await r.text();
      throw new Error(`Directus error: ${t}`);
    }

    const { data } = await r.json();
    if (!data?.length) {
      return res.json({ ok: true, synced: 0 });
    }

    // 2️⃣ Mapping
    const rows = data.map(c => ({
      id: c.id,
      date_created: c.date_created,
      called_number: c.called_number,
      calling_number: c.calling_number,
      sub_id: c.sub_id,
      offer_id: c.offer_id,
      ivr_value: c.ivr_value,
      status: c.status,
    }));

    // 3️⃣ Upsert naar Supabase
    const sr = await fetch(`${SUPABASE_URL}/rest/v1/calls`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify(rows),
    });

    if (!sr.ok) {
      const t = await sr.text();
      throw new Error(`Supabase error: ${t}`);
    }

    res.json({
      ok: true,
      synced: rows.length,
    });

  } catch (err) {
    console.error("❌ sync-calls error:", err);
    res.status(500).json({ error: err.message });
  }
}
