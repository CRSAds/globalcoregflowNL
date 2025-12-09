// /api/flow-log.js
//
// Centrale flow-logging endpoint voor ALLE templates
// - Ontvangt logs van front-end (flow_section_visible, flow_start, enz.)
// - Logt naar Vercel logs
// - Probeert logs op te slaan in Directus (collectie: flow_logs)

const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;
const FLOW_COLLECTION = process.env.DIRECTUS_FLOW_COLLECTION || "flow_logs";

// 🔧 Helper: ts normaliseren naar seconden (Unix time) i.p.v. milliseconden
function normalizeTs(inputTs) {
  let ts = inputTs;

  if (typeof ts !== "number" || !Number.isFinite(ts)) {
    ts = Date.now();
  }

  // Als het > 2.000.000.000.000 is, is het vrijwel zeker ms → naar seconden
  if (ts > 2_000_000_000_000) {
    ts = Math.floor(ts / 1000);
  }

  // Veiligheid: afronden naar integer
  return Math.floor(ts);
}

async function storeInDirectus(payload) {
  if (!DIRECTUS_URL || !DIRECTUS_TOKEN) {
    console.warn("⚠️ Directus credentials ontbreken, sla logs alleen in Vercel op");
    return;
  }

  try {
    const res = await fetch(
      `${DIRECTUS_URL}/items/${FLOW_COLLECTION}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DIRECTUS_TOKEN}`,
        },
        body: JSON.stringify({
          event: payload.event || null,
          ts: normalizeTs(payload.ts),          // ✅ nu altijd veilige Unix seconden
          url: payload.url || null,
          ua: payload.ua || null,
          sectionId: payload.sectionId || null,
          classList: payload.classList || null,
          data: payload.data || null,          // overige velden als JSON (incl. ts_ms)
        }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.warn("⚠️ Directus flow-log store failed:", res.status, text);
    }
  } catch (err) {
    console.error("❌ Fout bij opslaan flow-log in Directus:", err);
  }
}

export default async function handler(req, res) {
  // --- CORS ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "POST") {
    try {
      const rawBody = req.body;
      let payload;

      if (typeof rawBody === "string") {
        try {
          payload = JSON.parse(rawBody);
        } catch {
          payload = {};
        }
      } else {
        payload = rawBody || {};
      }

      const {
        event,
        ts,
        url,
        ua,
        sectionId,
        classList,
        ...rest
      } = payload;

      const tsMs = typeof ts === "number" ? ts : Date.now();
      const tsSafe = normalizeTs(tsMs);

      const logEntry = {
        event: event || "unknown",
        ts: tsSafe,                 // ✅ veilige integer voor Directus
        url,
        ua,
        sectionId,
        classList,
        // in data stoppen we o.a. de originele ms-timestamp
        data: {
          ts_ms: tsMs,
          ...rest,
        },
      };

      console.log("📊 FLOW LOG:", logEntry);

      // Probeer op te slaan in Directus (zonder de request te blokkeren)
      storeInDirectus(logEntry).catch(() => {});

      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error("❌ Fout in flow-log handler (POST):", err);
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  // Klein “dashboard” JSON voor snelle checks in de browser
  if (req.method === "GET") {
    if (!DIRECTUS_URL || !DIRECTUS_TOKEN) {
      return res.status(200).json({
        ok: true,
        note: "Geen Directus configuratie, alleen Vercel logs beschikbaar.",
      });
    }

    try {
      // Haal de laatste 1000 logs op, meest recente eerst
      const url = `${DIRECTUS_URL}/items/${FLOW_COLLECTION}?limit=1000&sort[]=-ts`;
      const directusRes = await fetch(url, {
        headers: {
          Authorization: `Bearer ${DIRECTUS_TOKEN}`,
        },
      });

      if (!directusRes.ok) {
        const text = await directusRes.text();
        console.warn("⚠️ Directus flow-log GET failed:", directusRes.status, text);
        return res.status(500).json({ ok: false, error: "Directus GET failed" });
      }

      const json = await directusRes.json();
      const items = json.data || [];

      const summary = {
        ok: true,
        totalLogs: items.length,
        byEvent: {},
        bySectionId: {},
      };

      for (const item of items) {
        const ev = item.event || "unknown";
        const sid = item.sectionId || "(none)";

        summary.byEvent[ev] = (summary.byEvent[ev] || 0) + 1;
        summary.bySectionId[sid] = (summary.bySectionId[sid] || 0) + 1;
      }

      return res.status(200).json(summary);
    } catch (err) {
      console.error("❌ Fout in flow-log handler (GET):", err);
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
