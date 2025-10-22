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
      #dynamic-footer {
        text-align: center;
        font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
        padding: 15px 5px;
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
        padding: 0 10px;
      }
      #dynamic-footer h4 {
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 0.4px;
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

      /* === Popup Styling === */
  .footer-popup {
    position: fixed;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 999999;
  }
  .footer-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(3px);
    z-index: 999998;
  }
  .footer-content {
    background: #fff;
    padding: 40px;
    max-width: 850px;
    max-height: 85vh;
    overflow-y: auto;
    border-radius: 12px;
    z-index: 1000000;
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
    z-index: 1000001;
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
