// /public/footer-loader.js
// ✅ Volledige, vaste popup over de hele pagina + platte iconen
// ✅ Achtergrondpagina niet scrollbaar tijdens popup
// ✅ Logo, tekst en content via Directus

(function () {
  console.log("🦶 footer-loader.js gestart");

  document.addEventListener("DOMContentLoaded", async () => {
    const footerContainer = document.getElementById("dynamic-footer");
    if (!footerContainer) {
      console.warn("⚠️ Geen #dynamic-footer element gevonden");
      return;
    }

    // URL parameter check
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status") || "online";
    const footerName = status === "live" ? "Premium Advertising" : "Online Acties";
    console.log(`🌐 Footer geladen voor status=${status} → ${footerName}`);

    // === Popup HTML (fullscreen, niet scrollbaar) ===
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

    // Popup gedrag (body blokkeren)
    const openPopup = (html) => {
      popupBody.innerHTML = html;
      popup.style.display = "flex";
      document.body.style.overflow = "hidden"; // ❗ achtergrondpagina niet scrollen
    };
    const closeAll = () => {
      popup.style.display = "none";
      document.body.style.overflow = ""; // scrollen weer toestaan
    };

    closePopup.addEventListener("click", closeAll);
    document.querySelector(".footer-popup-overlay")?.addEventListener("click", closeAll);

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
        margin-bottom: 12px;
        display: block;
        margin-left: auto;
        margin-right: auto;
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
        gap: 20px;
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
      .footer-link img {
        width: 16px;
        height: 16px;
        opacity: 0.8;
      }

      /* === Popup (fullscreen, boven alles) === */
      .footer-popup {
        position: fixed;
        inset: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
      }
      .footer-popup-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,0.65);
        z-index: 999998;
      }
      .footer-popup-content {
        position: relative;
        background: #fff;
        max-width: 800px;
        width: 92%;
        padding: 35px 40px;
        border-radius: 10px;
        z-index: 1000000;
        overflow-y: auto;
        max-height: 85vh;
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        color: #333;
        line-height: 1.7;
        box-shadow: 0 8px 28px rgba(0,0,0,0.25);
        animation: fadeIn 0.3s ease;
      }
      #close-footer-popup {
        position: absolute;
        top: 10px;
        right: 15px;
        font-size: 24px;
        background: none;
        border: none;
        cursor: pointer;
        color: #555;
      }
      #close-footer-popup:hover { color: #000; }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

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

    // === Data ophalen ===
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
              <img src="/terms-and-conditions.png" alt=""> Algemene Voorwaarden
            </button>
            <button id="open-privacy" class="footer-link">
              <img src="/insurance.png" alt=""> Privacybeleid
            </button>
          </div>
        </div>
      `;

      // Popup gedrag
      document.getElementById("open-terms").addEventListener("click", () => {
        openPopup(footer.terms_content || "<p>Geen voorwaarden beschikbaar.</p>");
      });

      document.getElementById("open-privacy").addEventListener("click", () => {
        openPopup(footer.privacy_content || "<p>Geen privacyverklaring beschikbaar.</p>");
      });

      console.log(`✅ Footer geladen: ${footerName}`);
    } catch (err) {
      console.error("❌ Fout bij laden footers:", err);
    }
  });
})();
