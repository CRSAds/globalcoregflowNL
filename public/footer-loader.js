// /public/footer-loader.js
(function () {
  console.log("🦶 footer-loader.js gestart");

  document.addEventListener("DOMContentLoaded", async () => {
    const footerContainer = document.getElementById("dynamic-footer");
    const popup = document.getElementById("footer-popup");
    const popupContent = document.getElementById("footer-popup-content");
    const closePopup = document.getElementById("close-footer-popup");

    const params = new URLSearchParams(window.location.search);
    const status = params.get("status") || "online";
    const footerName = status === "live" ? "Premium Advertising" : "Online Acties";
    console.log(`🌐 Footer geladen voor status=${status} → ${footerName}`);

    // Popup sluiten
    closePopup.addEventListener("click", () => (popup.style.display = "none"));
    document.querySelector(".footer-overlay")?.addEventListener("click", () => (popup.style.display = "none"));

    // === Styling ===
    const style = document.createElement("style");
    style.textContent = `
      #dynamic-footer {
        text-align: center;
        font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
        padding: 15px 5px;
        background: transparent;
        color: #444;
        font-size: 13px;
        line-height: 1.5;
      }
      #dynamic-footer .footer-inner {
        max-width: 700px;
        margin: 0 auto;
      }
      #dynamic-footer h4 {
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 0.5px;
        color: #222;
        margin-bottom: 6px;
        text-transform: uppercase;
      }
      #dynamic-footer p {
        margin-bottom: 8px;
      }
      #dynamic-footer button {
        background: none;
        color: #4863c4;
        border: none;
        font-weight: 500;
        cursor: pointer;
        text-decoration: underline;
        margin: 0 4px;
        font-size: 13px;
        transition: color 0.2s ease;
      }
      #dynamic-footer button:hover {
        color: #2b48a2;
      }

      /* Popup */
      .footer-popup {
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        display: flex; align-items: center; justify-content: center;
        z-index: 9999;
      }
      .footer-overlay {
        position: absolute;
        width: 100%; height: 100%;
        background: rgba(0,0,0,0.55);
        backdrop-filter: blur(2px);
      }
      .footer-content {
        position: relative;
        background: #fff;
        padding: 35px 40px;
        max-width: 760px;
        max-height: 80vh;
        overflow-y: auto;
        border-radius: 10px;
        z-index: 10000;
        text-align: left;
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        color: #333;
        line-height: 1.6;
        box-shadow: 0 6px 24px rgba(0,0,0,0.15);
      }
      #close-footer-popup {
        position: absolute;
        top: 8px; right: 14px;
        background: none;
        border: none;
        font-size: 22px;
        cursor: pointer;
        color: #666;
      }
      #close-footer-popup:hover {
        color: #000;
      }
    `;
    document.head.appendChild(style);

    // === Data ophalen ===
    try {
      const res = await fetch("https://globalcoregflow-nl.vercel.app/api/footers.js");
      const { data } = await res.json();
      const footer = data.find(f => f.name === footerName);

      if (!footer) {
        console.warn(`⚠️ Geen footer gevonden met naam: ${footerName}`);
        return;
      }

      // === HTML genereren ná ophalen footer ===
      footerContainer.innerHTML = `
        <div class="footer-inner">
          <h4>Footer ${footerName}</h4>
          <p>${footer.text || ""}</p>
          <button id="open-terms">Algemene Voorwaarden</button> |
          <button id="open-privacy">Privacybeleid</button>
        </div>
      `;

      // === Popup gedrag ===
      document.getElementById("open-terms").addEventListener("click", () => {
        popupContent.innerHTML = footer.terms_content || "<p>Geen voorwaarden beschikbaar.</p>";
        popup.style.display = "flex";
      });

      document.getElementById("open-privacy").addEventListener("click", () => {
        popupContent.innerHTML = footer.privacy_content || "<p>Geen privacyverklaring beschikbaar.</p>";
        popup.style.display = "flex";
      });

      console.log(`✅ Footer geladen: ${footerName}`);
    } catch (err) {
      console.error("❌ Fout bij laden footers:", err);
    }
  });
})();
