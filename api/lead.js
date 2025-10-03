// /api/lead.js
// Unified Databowl forwarder voor short form, EM/TM coregs en cosponsors (elk met eigen cid/sid)

let recentIps = new Map();

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Cache-Control");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  try {
    // ===== Inkomende payload =====
    const {
      // verplicht
      cid,
      sid,

      // basisvelden
      gender,
      firstname,
      lastname,
      email,
      f_5_dob,          // yyyy-mm-dd

      // adres/phone (long form)
      postcode,
      straat,
      huisnummer,
      woonplaats,
      telefoon,

      // tracking
      t_id,
      f_1322_transaction_id,
      f_1453_campagne_url,
      f_1684_sub_id,
      f_1685_aff_id,
      f_1687_offer_id,
      sub2,

      // optioneel: coreg specifieke velden (worden alleen doorgestuurd als ze bestaan)
      f_2014_coreg_answer,
      f_2575_coreg_answer_dropdown
    } = req.body || {};

    console.log("➡️ Ontvangen lead payload:", req.body);

    // Validatie basis
    if (!cid || !sid) {
      console.error("❌ Campagnegegevens ontbreken (cid/sid)");
      return res.status(400).json({ success: false, message: "Campagnegegevens ontbreken" });
    }

    // ===== IP & optindate =====
    const ipaddress =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      "";
    const optindate = new Date().toISOString().split(".")[0] + "+0000";

    // ===== Duplicate throttle per IP + campaign (60s) =====
    const ipKey = `${ipaddress}_${cid}_${sid}`;
    const now = Date.now();
    const lastTime = recentIps.get(ipKey);
    if (lastTime && now - lastTime < 60000) {
      console.warn("⛔️ Geblokkeerd (duplicate binnen 60s):", ipKey);
      return res.status(200).json({ success: false, blocked: true, reason: "duplicate_ip" });
    }
    recentIps.set(ipKey, now);

    // ===== E-mail fraud heuristics =====
    const emailLower = (email || "").toLowerCase();
    const suspiciousPatterns = [
      /(?:[a-z]{3,}@teleworm\.us)/i,
      /(?:michaeljm)+/i,
      /^[a-z]{3,12}jm.*@/i,
      /^[a-z]{4,}@gmail\.com$/i,
      /^[a-z]*[M]{2,}/i
    ];
    const isSuspicious = suspiciousPatterns.some((p) => p.test(emailLower));
    if (isSuspicious) {
      console.warn("⛔️ Verdacht e-mailadres, lead geblokkeerd:", email);
      return res.status(200).json({ success: false, blocked: true, reason: "suspicious_email" });
    }

    // ===== Transaction id =====
    const safeTId = f_1322_transaction_id || t_id || "unknown";

    // ===== Mapping naar Databowl (form-urlencoded) =====
    const params = new URLSearchParams({
      cid: String(cid),
      sid: String(sid),

      // Persoon
      f_2_title: gender || "",
      f_3_firstname: firstname || "",
      f_4_lastname: lastname || "",
      f_1_email: email || "",
      f_5_dob: f_5_dob || "",

      // Adres/telefoon (leeg als niet aanwezig)
      f_11_postcode: postcode || "",
      f_6_address1: straat || "",
      f_7_address2: huisnummer || "",
      f_8_address3: "",                 // niet gebruikt, maar veld bestaat in 5.2
      f_9_towncity: woonplaats || "",
      f_12_phone1: telefoon || "",

      // Meta
      f_17_ipaddress: ipaddress,
      f_55_optindate: optindate,
      f_1322_transaction_id: safeTId,

      // Tracking
      f_1453_campagne_url: f_1453_campagne_url || "",
      f_1684_sub_id: f_1684_sub_id || "",
      f_1685_aff_id: f_1685_aff_id || "",
      f_1687_offer_id: f_1687_offer_id || "",
      sub2: sub2 || ""
    });

    // Optionele coreg velden alleen meesturen als ze aanwezig zijn
    if (typeof f_2014_coreg_answer !== "undefined") {
      params.set("f_2014_coreg_answer", f_2014_coreg_answer || "");
    }
    if (typeof f_2575_coreg_answer_dropdown !== "undefined") {
      params.set("f_2575_coreg_answer_dropdown", f_2575_coreg_answer_dropdown || "");
    }

    console.log("🎯 Parameters → Databowl:", params.toString());

    // ===== Doorsturen naar Databowl =====
    const dbRes = await fetch("https://crsadvertising.databowl.com/api/v1/lead", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache"
      },
      body: params.toString()
    });

    // Sommige responses (bv. bij errors) hebben lege body → veilig parsen
    let dbResult = {};
    try {
      const text = await dbRes.text();
      dbResult = text ? JSON.parse(text) : {};
    } catch (parseErr) {
      console.warn("⚠️ Databowl gaf geen geldige JSON terug:", parseErr);
      dbResult = { raw: "no-json-body", status: dbRes.status };
    }

    console.log("✅ Databowl antwoord:", dbResult);

    return res.status(200).json({
      success: true,
      status: dbRes.status,
      result: dbResult
    });
  } catch (error) {
    console.error("❌ Fout bij verzenden naar Databowl:", error);
    // Zorg dat front-end altijd JSON krijgt
    return res.status(500).json({ success: false, message: "Interne fout bij verzenden" });
  }
}
