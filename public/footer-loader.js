// /public/footer-loader.js — herstelde popup (cosponsor-style)
(function () {
  console.log("🦶 footer-loader.js gestart");

  document.addEventListener("DOMContentLoaded", async () => {
    const footerContainer = document.getElementById("dynamic-footer");
    if (!footerContainer) return console.warn("⚠️ Geen #dynamic-footer element gevonden");

    const params = new URLSearchParams(window.location.search);
    const status = params.get("status") || "online";
    const footerName = status === "live" ? "Premium Advertising" : "Online Acties";

    console.log(`🌐 Footer geladen voor ${footerName}`);

    // === Popup HTML (gebaseerd op cosponsors.js) ===
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

    // === Popup gedrag ===
    const openPopup = (html) => {
      popupBody.innerHTML = html || "<p><em>Geen inhoud beschikbaar.</em></p>";
      popup.style.display = "flex";
      document.body.style.overflow = "hidden";
    };
    const closePopup = () => {
      popup.style.display = "none";
      document.body.style.overflow = "";
    };

    document.getElementById("close-footer-popup").addEventListener("click", closePopup);
    document.querySelector(".footer-popup-overlay")?.addEventListener("click", closePopup);

    // === CSS injecteren ===
    const style = document.createElement("style");
    style.textContent = `
      #dynamic-footer {
        text-align: center;
        font-family: 'Inter', sans-serif;
        padding: 25px 10px;
        background: transparent;
        color: #444;
        font-size: 13px;
        line-height: 1.6;
        position: relative;
        z-index: 1;
      }
      .footer-inner { max-width: 900px; margin: 0 auto; }
      .footer-logo { width: 150px; height: auto; margin: 0 auto 10px; display: block; }
      .footer-separator {
        height: 1px; border: none;
        background: linear-gradient(to right, rgba(0,0,0,0.25), rgba(0,0,0,0));
        margin: 15px 0 20px;
      }
      .footer-links {
        display: flex; justify-content: center; gap: 20px;
      }
      .footer-link {
        background: none; border: none; color: inherit;
        font-weight: 600; cursor: pointer;
        display: flex; align-items: center; gap: 8px;
        font-size: 13px; transition: opacity 0.2s;
      }
      .footer-link img { width: 16px; height: 16px; opacity: 0.8; }
      .footer-link:hover { opacity: 0.7; }

      /* === Popup (identiek aan cosponsor.js) === */
      .footer-popup {
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        display: flex; align-items: center; justify-content: center;
        z-index: 99999; /* hoger dan Swipe divider */
      }
      .footer-popup-overlay {
        position: absolute; width: 100%; height: 100%;
        background: rgba(0,0,0,0.6);
      }
      .footer-popup-content {
        position: relative;
        background: white;
        max-width: 800px; width: 90%;
        padding: 35px; border-radius: 10px;
        z-index: 100000;
        overflow-y: auto; max-height: 85vh;
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        color: #333;
        line-height: 1.7;
        box-shadow: 0 8px 28px rgba(0,0,0,0.25);
      }
      #close-footer-popup {
        position: absolute; top: 10px; right: 15px;
        font-size: 24px; background: none; border: none; cursor: pointer;
      }
      #close-footer-popup:hover { color: #000; }

      @media (max-width: 768px) {
        #dynamic-footer { text-align: left; padding: 20px; }
        #dynamic-footer p { text-align: justify; }
        .footer-popup-content { width: 94vw; max-height: 88vh; padding: 25px; }
      }
    `;
    document.head.appendChild(style);

    // === Data ophalen van Directus via Vercel API ===
    try {
      const res = await fetch("https://globalcoregflow-nl.vercel.app/api/footers.js");
      const { data } = await res.json();
      const footer = data.find(f => f.name === footerName);
      if (!footer) return console.warn(`⚠️ Geen footer gevonden: ${footerName}`);

      const logo = footer.logo ? `<img src="${footer.logo}" alt="Logo" class="footer-logo">` : "";
      const iconTerms = footer.icon_terms || "/terms-and-conditions.png";
      const iconPrivacy = footer.icon_privacy || "/insurance.png";

      footerContainer.innerHTML = `
        <div class="footer-inner">
          ${logo}
          <hr class="footer-separator">
          <p>${footer.text}</p>
          <div class="footer-links">
            <button id="open-terms" class="footer-link">
              <img src="${iconTerms}" alt=""> Algemene Voorwaarden
            </button>
            <button id="open-privacy" class="footer-link">
              <img src="${iconPrivacy}" alt=""> Privacybeleid
            </button>
          </div>
        </div>
      `;

      document.getElementById("open-terms").addEventListener("click", () =>
        openPopup(footer.terms_content || "<p><em>Geen voorwaarden beschikbaar.</em></p>")
      );
      document.getElementById("open-privacy").addEventListener("click", () =>
        openPopup(footer.privacy_content || "<p><em>Geen privacyverklaring beschikbaar.</em></p>")
      );
    } catch (err) {
      console.error("❌ Fout bij laden footers:", err);
    }
  });
})();
