// /public/footer-loader.js
// ✅ Dynamische footer met Terms/Privacy popup — volledig gefixt + scroll lock + hoogste z-index

(function () {
  console.log("🦶 footer-loader.js gestart");

  // =============== HELPERS ===============
  function lockScroll() {
    document.documentElement.classList.add("modal-open");
    document.body.classList.add("modal-open");
  }

  function unlockScroll() {
    document.documentElement.classList.remove("modal-open");
    document.body.classList.remove("modal-open");
  }

  function el(html) {
    const div = document.createElement("div");
    div.innerHTML = html.trim();
    return div.firstElementChild;
  }

  document.addEventListener("DOMContentLoaded", async () => {
    // =============== POPUP INJECTEREN ===============
    const popupHTML = `
      <div id="footer-popup" class="footer-popup" style="display:none;">
        <div class="footer-overlay"></div>
        <div class="footer-content" role="dialog" aria-modal="true">
          <button id="close-footer-popup" aria-label="Sluiten">×</button>
          <div id="footer-popup-content">Laden…</div>
        </div>
      </div>
    `;
    document.body.appendChild(el(popupHTML));

    const popup = document.getElementById("footer-popup");
    const popupContent = document.getElementById("footer-popup-content");

    // =============== CSS ===============
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
        max-width: 980px;
        margin: 0 auto;
        padding: 0 10px;
      }
      #dynamic-footer .brand {
        display: flex;
        align-items: center;
        gap: 14px;
        justify-content: flex-start;
        margin-bottom: 10px;
      }
      #dynamic-footer .brand img {
        height: 30px;
        width: auto;
        display: block;
      }
      #dynamic-footer .fade-rule {
        height: 1px;
        margin: 10px auto 12px;
        border: 0;
        background: linear-gradient(to right, rgba(0,0,0,0.15), rgba(0,0,0,0.06), rgba(0,0,0,0));
      }
      #dynamic-footer p { margin-bottom: 8px; }

      #dynamic-footer .link-row {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      #dynamic-footer .soft-link {
        background: none;
        border: none;
        font-weight: 600;
        cursor: pointer;
        text-decoration: none;
        color: inherit;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 4px 2px;
      }
      #dynamic-footer .soft-link img.icon {
        width: 16px;
        height: 16px;
        display: inline-block;
      }

      /* === Popup Styling (absolute top layer) === */
      .footer-popup {
        position: fixed;
        inset: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2147483647 !important; /* boven alles */
        isolation: isolate;
      }
      .footer-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,0.6);
        z-index: 2147483646;
      }
      .footer-content {
        position: relative;
        background: #fff;
        padding: 40px;
        max-width: 850px;
        width: min(94vw, 850px);
        max-height: 85vh;
        overflow-y: auto;
        border-radius: 12px;
        z-index: 2147483647;
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
        color: #666;
      }
      #close-footer-popup:hover { color: #000; }

      /* Scroll lock */
      html.modal-open, body.modal-open {
        overflow: hidden !important;
      }

      /* 📱 Mobiel */
      @media (max-width: 768px) {
        #dynamic-footer { text-align: left; padding: 20px; }
        #dynamic-footer p { text-align: justify; }
        .footer-content { max-height: 88vh; padding: 24px; }
        #dynamic-footer .brand { justify-content: flex-start; }
      }
    `;
    document.head.appendChild(style);

    // =============== DATA OPHALEN ===============
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status") || "online";
    const footerName = status === "live" ? "Premium Advertising" : "Online Acties";

    let footerData = null;
    try {
      const res = await fetch("https://globalcoregflow-nl.vercel.app/api/footers.js");
      const { data } = await res.json();
      footerData = data.find(f => f.name === footerName) || null;
      if (!footerData) {
        console.warn(`⚠️ Geen footer gevonden met naam '${footerName}'`);
        return;
      }
    } catch (err) {
      console.error("❌ Fout bij laden footers:", err);
      return;
    }

    // =============== FOOTER MAKEN ALS DIE NIET BESTAAT ===============
    let footerContainer = document.getElementById("dynamic-footer");
    if (!footerContainer) {
      footerContainer = document.createElement("div");
      footerContainer.id = "dynamic-footer";
      document.body.appendChild(footerContainer);
    }

    // =============== FOOTER INHOUD ===============
    const termsIcon = footerData.icon_terms
      ? `<img class="icon" src="${footerData.icon_terms}" alt="" loading="lazy">`
      : `<span aria-hidden="true">🔒</span>`;
    const privacyIcon = footerData.icon_privacy
      ? `<img class="icon" src="${footerData.icon_privacy}" alt="" loading="lazy">`
      : `<span aria-hidden="true">✅</span>`;

    const logo = footerData.logo
      ? `<img src="${footerData.logo}" alt="Logo ${footerName}" loading="lazy">`
      : "";

    footerContainer.innerHTML = `
      <div class="footer-inner">
        <div class="brand">${logo}</div>
        <hr class="fade-rule">
        <p>${footerData.text || ""}</p>
        <div class="link-row" aria-label="Documenten">
          <button class="soft-link" id="open-terms">${termsIcon}<span>Algemene Voorwaarden</span></button>
          <button class="soft-link" id="open-privacy">${privacyIcon}<span>Privacybeleid</span></button>
        </div>
      </div>
    `;

    // =============== POPUP GEDRAG ===============
    document.addEventListener("click", (e) => {
      if (e.target.closest("#open-terms")) {
        e.preventDefault();
        popupContent.innerHTML = footerData.terms_content || "<p>Geen voorwaarden beschikbaar.</p>";
        popup.style.display = "flex";
        lockScroll();
      }
      if (e.target.closest("#open-privacy")) {
        e.preventDefault();
        popupContent.innerHTML = footerData.privacy_content || "<p>Geen privacyverklaring beschikbaar.</p>";
        popup.style.display = "flex";
        lockScroll();
      }
      if (e.target.id === "close-footer-popup" || e.target.classList.contains("footer-overlay")) {
        popup.style.display = "none";
        unlockScroll();
      }
    });

    // --- Verplaats popup naar body (hoisten) ---
    const popupEl = document.getElementById("footer-popup");
    if (popupEl && popupEl.parentElement !== document.body) {
      document.body.appendChild(popupEl);
    }

    console.log(`✅ Footer geladen en popup actief voor: ${footerName}`);
  });
})();
