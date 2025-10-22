// /public/footer-loader.js
(function () {
  console.log("🦶 footer-loader.js gestart");

  document.addEventListener("DOMContentLoaded", async () => {
    const footerContainer = document.getElementById("dynamic-footer");
    if (!footerContainer) return console.warn("⚠️ Geen #dynamic-footer element gevonden");

    // Footer kiezen obv URL
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status") || "online";
    const footerName = status === "live" ? "Premium Advertising" : "Online Acties";
    console.log(`🌐 Footer geladen voor ${footerName}`);

    // === Popup HTML (zelfde structuur als cosponsor.js) ===
    const popupHTML = `
      <div id="footer-popup" class="footer-popup" style="display:none;">
        <div class="footer-popup-overlay"></div>
        <div class="footer-popup-content">
          <button id="close-footer-popup">×</button>
          <div id="footer-popup-body">Laden...</div>
        </div>
      </div>
    `;
    const container = document.createElement("div");
    container.innerHTML = popupHTML;
    document.body.appendChild(container);

    const popup = document.getElementById("footer-popup");
    const popupBody = document.getElementById("footer-popup-body");
    const closePopup = document.getElementById("close-footer-popup");

    const openPopup = (html) => {
      popupBody.innerHTML = html;
      popup.style.display = "flex";
      document.body.style.overflow = "hidden";
    };
    const closeAll = () => {
      popup.style.display = "none";
      document.body.style.overflow = "";
    };

    closePopup.addEventListener("click", closeAll);
    document.querySelector(".footer-popup-overlay")?.addEventListener("click", closeAll);

    // === CSS injecteren (stabiele layout + popup boven alles) ===
    const style = document.createElement("style");
    style.textContent = `
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
      }
      .footer-logo {
        width: 150px;
        height: auto;
        margin: 0 auto 10px;
        display: block;
      }
      .footer-separator {
        height: 1px;
        border: none;
        background: linear-gradient(to right, rgba(0,0,0,0.25), rgba(0,0,0,0));
        margin: 15px 0 20px;
      }
      .footer-links {
        display: flex;
        justify-content: center;
        gap: 20px;
      }
      .footer-link {
        background: none;
        border: none;
        color: inherit;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        transition: opacity 0.2s;
      }
      .footer-link:hover { opacity: 0.7; }
      .footer-link img { width: 16px; height: 16px; opacity: 0.8; }

      /* Popup over hele pagina */
      .footer-popup {
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
      }
      .footer-popup-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,0.6);
      }
      .footer-popup-content {
        position: relative;
        background: #fff;
        padding: 35px 40px;
        max-width: 800px;
        max-height: 85vh;
        overflow-y: auto;
        border-radius: 10px;
        z-index: 100000;
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        color: #333;
        line-height: 1.7;
        box-shadow: 0 8px 28px rgba(0,0,0,0.25);
      }
      #close-footer-popup {
        position: absolute;
        top: 10px; right: 15px;
        font-size: 24px;
        border: none;
        background: none;
        cursor: pointer;
      }
      #close-footer-popup:hover { color: #000; }

      @media (max-width: 768px) {
        #dynamic-footer { text-align: left; padding: 20px; }
        #dynamic-footer p { text-align: justify; }
        .footer-popup-content { width: 94vw; max-height: 88vh; padding: 25px; }
      }
    `;
    document.head.appendChild(style);

    // === Footerdata laden vanuit API ===
    try {
      const res = await fetch("https://globalcoregflow-nl.vercel.app/api/footers.js");
      const { data } = await res.json();
      const footer = data.find(f => f.name === footerName);
      if (!footer) return console.warn(`⚠️ Geen footer gevonden: ${footerName}`);

      footerContainer.innerHTML = `
        <div class="footer-inner">
          ${footer.logo ? `<img src="${footer.logo}" alt="Logo" class="footer-logo">` : ""}
          <hr class="footer-separator">
          <p>${footer.text}</p>
          <div class="footer-links">
            <button id="open-terms" class="footer-link">
              <img src="${footer.icon_terms || '/terms-and-conditions.png'}" alt=""> Algemene Voorwaarden
            </button>
            <button id="open-privacy" class="footer-link">
              <img src="${footer.icon_privacy || '/insurance.png'}" alt=""> Privacybeleid
            </button>
          </div>
        </div>
      `;

      // Popup eventlisteners
      document.getElementById("open-terms").addEventListener("click", () => {
        openPopup(footer.terms_content || "<p>Geen voorwaarden beschikbaar.</p>");
      });
      document.getElementById("open-privacy").addEventListener("click", () => {
        openPopup(footer.privacy_content || "<p>Geen privacyverklaring beschikbaar.</p>");
      });
    } catch (err) {
      console.error("❌ Fout bij laden footers:", err);
    }
  });
})();
