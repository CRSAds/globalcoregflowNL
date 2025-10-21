// /public/footer-loader.js
// ✅ Dynamische footer + popup met fix gebaseerd op co-sponsor popup (volledige overlay)
// ✅ Laadt data vanuit Directus (via /api/footers.js)

(function () {
  console.log("🦶 footer-loader.js gestart");

  document.addEventListener("DOMContentLoaded", async () => {
    const footerContainer = document.getElementById("dynamic-footer");
    if (!footerContainer) {
      console.warn("⚠️ Geen #dynamic-footer element gevonden");
      return;
    }

    // Status bepalen → welke footer tonen
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status") || "online";
    const footerName = status === "live" ? "Premium Advertising" : "Online Acties";
    console.log(`🌐 Footer geladen voor status=${status} → ${footerName}`);

    // === Popup HTML (gebaseerd op co-sponsor versie) ===
    const popupHTML = `
      <div id="footer-popup" class="footer-popup" style="display:none;">
        <div class="footer-popup-overlay"></div>
        <div class="footer-popup-content">
          <button id="close-footer-popup">×</button>
          <div id="footer-popup-body">Laden...</div>
        </div>
      </div>
    `;

    // Voeg popup toe aan body
    const popupContainer = document.createElement("div");
    popupContainer.innerHTML = popupHTML;
    document.body.appendChild(popupContainer);

    const popup = document.getElementById("footer-popup");
    const popupBody = document.getElementById("footer-popup-body");
    const closePopup = document.getElementById("close-footer-popup");

    // Popup gedrag
    closePopup.addEventListener("click", () => (popup.style.display = "none"));
    document.querySelector(".footer-popup-overlay")?.addEventListener("click", () => (popup.style.display = "none"));

    // === Styling ===
    const style = document.createElement("style");
    style.textContent = `
      /* === Footer zelf === */
      #dynamic-footer {
        text-align: center;
        font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
        padding: 25px 10px;
        background: transparent;
        color: #444;
        font-size: 13px;
        line-height: 1.6;
        position: relative;
        z-index: 1;
      }
      #dynamic-footer .footer-inner {
        max-width: 900px;
        margin: 0 auto;
        padding: 0 15px;
      }
      .footer-logo {
        width: 140px;
        height: auto;
        margin-bottom: 10px;
      }
      .footer-separator {
        height: 1px;
        border: none;
        background: linear-gradient(to right, rgba(0,0,0,0.25), rgba(0,0,0,0));
        margin: 15px auto 20px;
        width: 100%;
      }
      .footer-links {
        display: flex;
        justify-content: center;
        gap: 18px;
        margin-top: 10px;
      }
      .footer-link {
        background: none;
        color: inherit;
        border: none;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        transition: opacity 0.2s ease;
      }
      .footer-link:hover { opacity: 0.7; }
      .icon-lock::before { content: "🔒"; font-size: 14px; }
      .icon-shield::before { content: "🛡️"; font-size: 14px; }

      /* === Popup (exact van co-sponsor.js) === */
      .footer-popup {
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        display: flex; align-items: center; justify-content: center;
        z-index: 9999;
      }
      .footer-popup-overlay {
        position: fixed; /* ipv absolute */
    inset: 0;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(3px);
    z-index: 999998;
      }
      .footer-popup-content {
        position: relative;
        background: white;
        max-width: 700px; width: 90%;
        padding: 30px; border-radius: 10px;
        z-index: 10000;
        overflow-y: auto; max-height: 80vh;
        font-family: 'Inter', sans-serif;
      }
      #close-footer-popup {
        position: absolute; top: 10px; right: 15px;
        font-size: 24px; background: none; border: none; cursor: pointer;
      }
      #close-footer-popup:hover { color: #000; }

      /* 📱 Mobiel */
      @media (max-width: 768px) {
        #dynamic-footer {
          text-align: left;
          padding: 20px;
        }
        #dynamic-footer p { text-align: justify; }
        .footer-popup-content {
          width: 94vw;
          max-height: 88vh;
          padding: 25px;
        }
      }
    `;
    document.head.appendChild(style);

    // === Data ophalen van Directus ===
    try {
      const res = await fetch("https://globalcoregflow-nl.vercel.app/api/footers.js");
      const { data } = await res.json();

      const footer = data.find(f => f.name === footerName);
      if (!footer) {
        console.warn(`⚠️ Geen footer gevonden met naam: ${footerName}`);
        return;
      }

      const logoUrl = footer.logo?.id
        ? `https://cms.core.909play.com/assets/${footer.logo.id}`
        : "https://via.placeholder.com/150x40?text=Logo";

      // Footer renderen
      footerContainer.innerHTML = `
        <div class="footer-inner">
          <img src="${logoUrl}" alt="${footer.name}" class="footer-logo" />
          <hr class="footer-separator" />
          <p>${footer.text}</p>
          <div class="footer-links">
            <button id="open-terms" class="footer-link">
              <i class="icon-shield"></i> Algemene Voorwaarden
            </button>
            <button id="open-privacy" class="footer-link">
              <i class="icon-lock"></i> Privacybeleid
            </button>
          </div>
        </div>
      `;

      // Popup gedrag (voorwaarden/privacy)
      document.getElementById("open-terms").addEventListener("click", () => {
        popupBody.innerHTML = footer.terms_content || "<p>Geen voorwaarden beschikbaar.</p>";
        popup.style.display = "flex";
      });

      document.getElementById("open-privacy").addEventListener("click", () => {
        popupBody.innerHTML = footer.privacy_content || "<p>Geen privacyverklaring beschikbaar.</p>";
        popup.style.display = "flex";
      });

      console.log(`✅ Footer geladen: ${footerName}`);
    } catch (err) {
      console.error("❌ Fout bij laden footers:", err);
    }
  });
})();
