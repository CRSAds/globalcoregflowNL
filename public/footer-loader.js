// /public/footer-loader.js
// ✅ Dynamische footer + popup met volledige overlay + scroll-lock fix

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
    const footerName = status === "live" ? "Premium Advertising" : "Online Acties";
    console.log(`🌐 Footer geladen voor status=${status} → ${footerName}`);

    // Popup-elementen altijd direct in <body> zetten (niet binnen Swipe-sectie)
    if (popup && popup.parentElement !== document.body) {
      document.body.appendChild(popup);
    }
    const overlay = popup?.querySelector(".footer-overlay");
    if (overlay && overlay.parentElement !== popup) {
      popup.appendChild(overlay);
    }

    // Popup sluiten
    if (closePopup) {
      closePopup.addEventListener("click", () => {
        popup.style.display = "none";
        document.documentElement.style.overflow = "";
        document.body.style.overflow = "";
      });
    }

    document.querySelector(".footer-overlay")?.addEventListener("click", () => {
      popup.style.display = "none";
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    });

    // === Styling injecteren ===
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

    // === Data ophalen van Directus via Vercel API ===
    try {
      const res = await fetch("https://globalcoregflow-nl.vercel.app/api/footers.js");
      const { data } = await res.json();

      const footer = data.find(f => f.name === footerName);
      if (!footer) {
        console.warn(`⚠️ Geen footer gevonden met naam: ${footerName}`);
        return;
      }

      // === Footer renderen ===
      footerContainer.innerHTML = `
        <div class="footer-inner">
          <h4>Footer ${footerName}</h4>
          <p>${footer.text}</p>
          <button id="open-terms">Algemene Voorwaarden</button> |
          <button id="open-privacy">Privacybeleid</button>
        </div>
      `;

      // === Popup gedrag ===
      const openTerms = document.getElementById("open-terms");
      const openPrivacy = document.getElementById("open-privacy");

      openTerms.addEventListener("click", () => {
        popupContent.innerHTML = footer.terms_content || "<p>Geen voorwaarden beschikbaar.</p>";
        popup.style.display = "flex";
        document.documentElement.style.overflow = "hidden";
        document.body.style.overflow = "hidden";
      });

      openPrivacy.addEventListener("click", () => {
        popupContent.innerHTML = footer.privacy_content || "<p>Geen privacyverklaring beschikbaar.</p>";
        popup.style.display = "flex";
        document.documentElement.style.overflow = "hidden";
        document.body.style.overflow = "hidden";
      });

      console.log(`✅ Footer geladen: ${footerName}`);
    } catch (err) {
      console.error("❌ Fout bij laden footers:", err);
    }
  });
})();
