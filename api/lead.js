// api/lead.js
let recentIps = new Map();

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
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
      sub2               // 👈 toegevoegd
    } = req.body;

    console.log("Ontvangen lead payload:", req.body);

    if (!cid || !sid) {
      return res.status(400).json({ error: "cid en sid zijn verplicht" });
    }

    // IP + optindate
    const ipaddress =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      "";
    const optindate = new Date().toISOString().split(".")[0] + "+0000";
    const safeTId = f_1322_transaction_id || t_id || crypto.randomUUID();

    // Bouw params voor Databowl
    const params = new URLSearchParams({
      cid: String(cid),
      sid: String(sid),
      f_2_title: gender || "",
      f_3_firstname: firstname || "",
      f_4_lastname: lastname || "",
      f_1_email: email || "",
      f_5_dob: f_5_dob || "",
      f_11_postcode: postcode || "",
      f_6_address1: straat || "",
      f_7_address2: huisnummer || "",
      f_9_towncity: woonplaats || "",
      f_12_phone1: telefoon || "",
      f_17_ipaddress: ipaddress,
      f_55_optindate: optindate,
      f_1322_transaction_id: safeTId,
      f_1453_campagne_url: f_1453_campagne_url || "",
      f_1684_sub_id: f_1684_sub_id || "",
      f_1685_aff_id: f_1685_aff_id || "",
      f_1687_offer_id: f_1687_offer_id || "",
      sub2: sub2 || ""   // 👈 toegevoegd
    });

    console.log("➡️ Naar Databowl:", params.toString());

    const response = await fetch("https://crsadvertising.databowl.com/api/v1/lead", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString()
    });

    const result = await response.json();
    console.log("✅ Databowl antwoord:", result);

    return res.status(200).json({ success: true, result });
  } catch (err) {
    console.error("❌ Lead handler error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
