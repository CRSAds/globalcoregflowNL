// /api/lead.js
// ✅ Universele leadverwerking voor shortform, co-sponsors en coreg (short/longform)
// ✅ Inclusief automatische herkenning + fraud & duplicate protection

export const config = { runtime: "nodejs" };

let recentIps = new Map();

export default async function handler(req, res) {
  // ---- CORS headers ----
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Cache-Control, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  try {
    // ---- Body veilig parsen ----
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        console.warn("⚠️ Ongeldige JSON body ontvangen:", body);
      }
    }

    const {
      cid,
      sid,
      gender,
      firstname,
      lastname,
      email,
      f_5_dob,
      postcode,
      straat,
      huisnummer,
      woonplaats,
      telefoon,
      t_id,
      f_1322_transaction_id,
      f_1453_campagne_url,
      f_1684_sub_id,
      f_1685_aff_id,
      f_1687_offer_id,
      sub2,
      f_2014_coreg_answer,
      f_2575_coreg_answer_dropdown,
      is_shortform
    } = body || {};

    console.log("➡️ Ontvangen lead payload:", body);

    // ---- Validatie ----
    if (!cid || !sid) {
      console.error("❌ Campagnegegevens ontbreken (cid/sid)", { cid, sid });
      return res.status(400).json({ success: false, message: "Campagnegegevens ontbreken", cid, sid });
    }

    // ---- IP & tijd ----
    const ipaddress =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      "";
    const optindate = new Date().toISOString().split(".")[0] + "+0000";

    // ---- Duplicate throttle ----
    const ipKey = `${ipaddress}_${cid}_${sid}`;
    const now = Date.now();
    const lastTime = recentIps.get(ipKey);
    if (lastTime && now - lastTime < 60000) {
      console.warn("⛔️ Geblokkeerd (duplicate binnen 60s):", ipKey);
      return res.status(200).json({ success: false, blocked: true, reason: "duplicate_ip" });
    }
    recentIps.set(ipKey, now);

    // ---- E-mail fraud check ----
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

    // ---- Transaction ID fallback ----
    const safeTId = f_1322_transaction_id || t_id || "unknown";

    // =====================================================
    // 🧩 Automatische herkenning: shortform / longform
    // =====================================================
    const isShort =
      String(cid) === "925" ||
      is_shortform === true ||
      (!postcode && !telefoon && !woonplaats); // auto-detectie bij coreg shortform

    // ---- Basisvelden (altijd aanwezig) ----
    const params = new URLSearchParams({
      cid: String(cid),
      sid: String(sid),
      f_2_title: gender || "",
      f_3_firstname: firstname || "",
      f_4_lastname: lastname || "",
      f_1_email: email || "",
      f_5_dob: f_5_dob || "",
      f_17_ipaddress: ipaddress,
      f_55_optindate: optindate,
      f_1322_transaction_id: safeTId,
      f_1453_campagne_url: f_1453_campagne_url || "",
      f_1684_sub_id: f_1684_sub_id || "",
      f_1685_aff_id: f_1685_aff_id || "",
      f_1687_offer_id: f_1687_offer_id || "",
      sub2: sub2 || ""
    });

    // ---- Alleen toevoegen bij longform/coreg ----
    if (!isShort) {
      if (postcode) params.set("f_11_postcode", postcode);
      if (straat) params.set("f_6_address1", straat);
      if (huisnummer) params.set("f_7_address2", huisnummer);
      if (woonplaats) params.set("f_9_towncity", woonplaats);
      if (telefoon) params.set("f_12_phone1", telefoon);

      if (f_2014_coreg_answer?.trim()) {
        params.set("f_2014_coreg_answer", f_2014_coreg_answer.trim());
      }
      if (f_2575_coreg_answer_dropdown?.trim()) {
        params.set("f_2575_coreg_answer_dropdown", f_2575_coreg_answer_dropdown.trim());
      }
    }

    console.log(
      `🚀 Lead wordt verstuurd naar Databowl (${isShort ? "shortform / co-sponsor" : "longform"}) → cid=${cid}, sid=${sid}`
    );

    // =====================================================
    // 🔄 Versturen naar Databowl
    // =====================================================
    const dbRes = await fetch("https://crsadvertising.databowl.com/api/v1/lead", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache"
      },
      body: params.toString()
    });

    const text = await dbRes.text();
    console.log("📩 Databowl raw response:", text || "(leeg)");

    let dbResult = {};
    try {
      dbResult = text ? JSON.parse(text) : {};
    } catch {
      dbResult = { raw: text || "no-json-body", status: dbRes.status };
    }

    console.log("✅ Lead succesvol verwerkt – HTTP status:", dbRes.status);
    return res.status(200).json({ success: true, status: dbRes.status, result: dbResult });
  } catch (error) {
    console.error("❌ Interne fout bij verzenden naar Databowl:", error);
    return res.status(500).json({
      success: false,
      message: "Interne fout bij verzenden",
      error: String(error)
    });
  }
}
