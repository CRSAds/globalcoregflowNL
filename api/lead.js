// =============================================================
// ✅ /api/lead.js — automatische cap-detectie & OMG Server-to-Server
// =============================================================
import querystring from "querystring";

/**
 * Helper functie voor de OMG Server-to-Server postback.
 * Wordt aangeroepen bij specifieke combinaties van Offer ID en Partner ID.
 */
async function fireOMGPostback(omgRequestId, transactionId) {
  // o=22165 (Offer), e=877 (Event), f=pb (Format)
  const url = `https://secureomg.nl/p.ashx?o=22165&e=877&f=pb&r=${omgRequestId}&t=${transactionId}`;
  
  try {
    const res = await fetch(url);
    const text = await res.text();
    console.log(`🎯 OMG Postback resultaat voor ${transactionId}: ${text}`);
  } catch (err) {
    console.error(`❌ OMG Postback fout: ${err.message}`);
  }
}

export default async function handler(req, res) {
  // ✅ Universele CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Cache-Control, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method Not Allowed" });

  try {
    const body = req.body || {};
    const {
      cid, sid, firstname, lastname, email, gender, dob,
      postcode, straat, huisnummer, woonplaats, telefoon,
      is_shortform, f_2014_coreg_answer, f_2575_coreg_answer_dropdown,
      f_1453_campagne_url, t_id, offer_id, aff_id, sub_id, sub2
    } = body;

    // ===== Detecteer shortform lead
    const isShort =
      String(cid) === "925" ||
      is_shortform === true ||
      (!postcode && !telefoon && !woonplaats);

    const params = new URLSearchParams();

    // ===== Basisvelden
    if (cid) params.set("cid", cid);
    if (sid) params.set("sid", sid);
    if (firstname) params.set("f_3_firstname", firstname);
    if (lastname) params.set("f_4_lastname", lastname);
    if (email) params.set("f_1_email", email);
    if (gender) params.set("f_2_title", gender);
    if (dob) params.set("f_5_dob", dob);

    // ===== Campagne URL + tracking
    if (f_1453_campagne_url) params.set("f_1453_campagne_url", f_1453_campagne_url);
    if (t_id) params.set("f_1322_transaction_id", t_id);
    if (offer_id) params.set("f_1687_offer_id", offer_id);
    if (aff_id) params.set("f_1685_aff_id", aff_id);
    if (sub_id) params.set("f_1684_sub_id", sub_id);
    if (body.f_17_ipaddress) params.set("f_17_ipaddress", body.f_17_ipaddress);

    // ✅ Optindate toevoegen
    const optindate = body.f_55_optindate || new Date().toISOString().split(".")[0] + "+0000";
    params.set("f_55_optindate", optindate);

    // ===== Alleen longformvelden bij longform leads
    if (!isShort) {
      if (postcode) params.set("f_11_postcode", postcode);
      if (straat) params.set("f_6_address1", straat);
      if (huisnummer) params.set("f_7_address2", huisnummer);
      if (woonplaats) params.set("f_9_towncity", woonplaats);
      if (telefoon) params.set("f_12_phone1", telefoon);
    }

    // ===== Coreg antwoorden
    if (f_2014_coreg_answer?.trim()) params.set("f_2014_coreg_answer", f_2014_coreg_answer.trim());
    if (f_2575_coreg_answer_dropdown?.trim()) params.set("f_2575_coreg_answer_dropdown", f_2575_coreg_answer_dropdown.trim());

    // ===== Databowl endpoint
    const databowlUrl = "https://crsadvertising.databowl.com/api/v1/lead";
    console.log("🚀 Databowl POST:", params.toString());

    const resp = await fetch(databowlUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString()
    });

    const text = await resp.text();
    const json = JSON.parse(text || "{}");

    // ===== Check op foutmeldingen van Databowl
    if (json?.error?.msg === "TOTAL_CAP_REACHED") {
      console.warn(`⚠️ CAP REACHED for campaign cid=${cid}, sid=${sid}`);

      const tomorrow = new Date();
      tomorrow.setUTCHours(0, 0, 0, 0);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

      async function pauseInCollection(collection) {
        try {
          const findRes = await fetch(
            `${process.env.DIRECTUS_URL}/items/${collection}?filter[cid][_eq]=${cid}&filter[sid][_eq]=${sid}&fields=id,is_live`,
            {
              headers: { Authorization: `Bearer ${process.env.DIRECTUS_TOKEN}` }
            }
          );
          const findJson = await findRes.json();
          const item = findJson.data?.[0];

          if (!item) return;

          await fetch(`${process.env.DIRECTUS_URL}/items/${collection}/${item.id}`, {
            method: "PATCH",
            headers: {
              "Authorization": `Bearer ${process.env.DIRECTUS_TOKEN}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              is_live: false,
              paused_until: tomorrow.toISOString()
            })
          });
        } catch (err) {
          console.error(`❌ Pauzeren mislukt voor ${collection}:`, err);
        }
      }

      await pauseInCollection("coreg_campaigns");
      await pauseInCollection("co_sponsors");

      return res.status(200).json({
        success: false,
        message: `Campaign ${cid} paused until ${tomorrow.toISOString()}`
      });
    }

    // ===== Normale succes-afhandeling Databowl
    if (!resp.ok) {
      console.error("❌ Databowl error:", text);
      return res.status(resp.status).json({ success: false, error: text });
    }

    // ✅ EXTRA: OMG Server-to-Server Tracking
    // Check specifiek voor Offer ID 1104 en Partner ID 71
    if (cid === "1104" && aff_id === "71") {
      // sub2 bevat het OMG {subid} uit de tracking link
      const omgId = sub2; 
      
      if (omgId && omgId !== "unknown") {
        // Vuur postback af. We gebruiken t_id als TRANSACTION_ID voor OMG.
        await fireOMGPostback(omgId, t_id);
      } else {
        console.warn("⚠️ OMG Postback overgeslagen: sub2 (omgId) ontbreekt in payload.");
      }
    }

    console.log("✅ Lead succesvol naar Databowl:", text);
    res.status(200).json({ success: true, response: text });

  } catch (err) {
    console.error("💥 Lead API fout:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}
