// /public/footer-loader.js
// ✅ Dynamische footer + popup met logo, icoontjes, en fixed overlay zoals co-sponsor popup

(function () {
  console.log("🦶 footer-loader.js gestart");

  document.addEventListener("DOMContentLoaded", async () => {
    const footerContainer = document.getElementById("dynamic-footer");
    const popup = document.getElementById("footer-popup");
    const popupContent = document.getElementById("footer-popup-content");
    const closePopup = document.getElementById("close-footer-popup");

    if (!footerContainer || !popup || !popupContent || !closePopup) {
      console.warn("⚠️ Vereiste footer-elementen niet gevonden in de pagina.");
      return;
    }

    // === Status bepalen ===
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status") || "online";
    const footerName = status === "live" ? "Premium Advertising" : "Online Acties";
    console.log(`🌐 Footer geladen voor status=${status} → ${footerName}`);

    // === Popup gedrag ===
    closePopup.addEventListener("click", () => {
      popup.style.display = "none";
      document.body.style.overflow = "auto";
    });
    document.querySelector(".footer-overlay")?.addEventListener("click", () => {
      popup.style.display = "none";
      document.body.style.overflow = "auto";
    });

    // === Styling (inclusief popup fix) ===
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
        padding: 0 15px;
        text-align: center;
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
      .footer-link:hover {
        opacity: 0.7;
      }

      .icon-lock::before {
        content: "🔒";
        font-size: 14px;
      }
      .icon-shield::before {
        content: "🛡️";
        font-size: 14px;
      }

      /* === Popup (volledige overlay) === */
      .footer-popup {
        position: fixed;
        inset: 0;
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 9999999;
      }
      .footer-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.6);
        backdrop-filter: blur(3px);
        z-index: 9999998;
      }
      .footer-content {
        position: relative;
        background: #fff;
        padding: 40px;
        max-width: 850px;
        max-height: 85vh;
        overflow-y: auto;
        border-radius: 12px;
        z-index: 10000000;
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        color: #333;
        line-height: 1.7;
        box-shadow: 0 8px 28px rgba(0,0,0,0.25);
      }
      #close-footer-popup {
        position: absolute;
        top: 10px;
        right: 20px;
        font-size: 22px;
        border: none;
        background: none;
        cursor: pointer;
        z-index: 10000001;
      }
      #close-footer-popup:hover { color: #000; }

      /* 📱 Mobiel */
      @media (max-width: 768px) {
        #dynamic-footer {
          text-align: left;
          padding: 20px;
        }
        #dynamic-footer p {
          text-align: justify;
        }
        .footer-links {
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }
        .footer-content {
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

      // ✅ Betere logo fallback + URL-validatie
      let logoUrl = "";
      if (footer.logo && footer.logo.startsWith("http")) {
        logoUrl = footer.logo;
      } else if (footer.logo) {
        logoUrl = `https://cms.core.909play.com/assets/${footer.logo}`;
      } else {
        logoUrl = "https://via.placeholder.com/150x40?text=Logo";
      }

      // === HTML Footer renderen ===
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

      // === Popup gedrag ===
      const openTerms = document.getElementById("open-terms");
      const openPrivacy = document.getElementById("open-privacy");

      openTerms.addEventListener("click", () => {
        popupContent.innerHTML = footer.terms_content || "<p>Geen voorwaarden beschikbaar.</p>";
        popup.style.display = "flex";
        document.body.style.overflow = "hidden";
      });

      openPrivacy.addEventListener("click", () => {
        popupContent.innerHTML = footer.privacy_content || "<p>Geen privacyverklaring beschikbaar.</p>";
        popup.style.display = "flex";
        document.body.style.overflow = "hidden";
      });

      console.log(`✅ Footer geladen: ${footerName}`);
    } catch (err) {
      console.error("❌ Fout bij laden footers:", err);
    }
  });
})();
