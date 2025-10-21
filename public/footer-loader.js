// /public/footer-loader.js
// ✅ Laadt dynamisch de juiste footer uit Directus op basis van ?status=online of ?status=live

(function () {
  console.log("🦶 footer-loader.js gestart");

  document.addEventListener("DOMContentLoaded", async () => {
    const footerContainer = document.getElementById("dynamic-footer");
    const popup = document.getElementById("footer-popup");
    const popupContent = document.getElementById("footer-popup-content");
    const closePopup = document.getElementById("close-footer-popup");

    // === URL parameter check ===
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status") || "online";
    const footerName = status === "live" ? "Premium International" : "Online Acties";
    console.log(`🌐 Footer geladen voor status=${status} → ${footerName}`);

    // Popup sluiten
    closePopup.addEventListener("click", () => (popup.style.display = "none"));
    document.querySelector(".footer-overlay")?.addEventListener("click", () => (popup.style.display = "none"));

    // === Basis styling ===
    const style = document.createElement("style");
    style.textContent = `
      #dynamic-footer {
        text-align: center;
        font-family: sans-serif;
        padding: 30px 10px;
        background: #f7f7f7;
        color: #333;
      }
      #dynamic-footer .footer-inner {
        max-width: 800px;
        margin: 0 auto;
      }
      #dynamic-footer button {
        background: none;
        color: #0057ff;
        border: none;
        font-weight: 600;
        cursor: pointer;
        text-decoration: underline;
        margin: 0 6px;
      }
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
        background: rgba(0,0,0,0.6);
      }
      .footer-content {
        position: relative;
        background: #fff;
        padding: 40px;
        max-width: 800px;
        max-height: 80vh;
        overflow-y: auto;
        border-radius: 10px;
        z-index: 10000;
        text-align: left;
      }
      #close-footer-popup {
        position: absolute;
        top: 10px; right: 15px;
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
      }
    `;
    document.head.appendChild(style);

    // === Data ophalen van Directus via Vercel API ===
    try {
      const res = await fetch("https://globalcoregflow-nl.vercel.app/api/footers.js");
      const { data } = await res.json();

      const footer = data.find(f => f.name === footerName);
      if (!footer) {
        console.warn(`⚠️ Geen footer gevonden met naam: ${footerName}`);
        return;
      }

      // === Footer onderaan pagina ===
      footerContainer.innerHTML = `
        <div class="footer-inner">
          <p>${footer.text}</p>
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
