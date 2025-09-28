// api/lead.js
// Endpoint om leads server-side naar Databowl te sturen met CORS support + debug

export default async function handler(req, res) {
  // ✅ CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { cid, sid, answer, firstname, lastname, email, dob, postcode, phone1 } = req.body;

    if (!cid || !sid) {
      return res.status(400).json({ error: "cid en sid zijn verplicht" });
    }

    // ✅ Payload zoals in Template 5.2
    const payload = {
      cid,
      sid,
      f_1_firstname: firstname || "",
      f_2_lastname: lastname || "",
      f_3_email: email || "",
      f_5_dob: dob || "",            // yyyy-mm-dd
      f_6_postcode: postcode || "",
      f_7_phone1: phone1 || "",
      f_2047_EM_CO_sponsors: answer || "" // coreg sponsor antwoord
    };

    // 🔎 Debug: log payload in Vercel logs
    console.log("Lead naar Databowl:", payload);

    const response = await fetch("https://crsadvertising.databowl.com/api/v1/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Databowl error:", result);
      return res.status(response.status).json({ error: "Lead niet verstuurd", details: result });
    }

    return res.status(200).json({ success: true, result });
  } catch (err) {
    console.error("Lead handler error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
