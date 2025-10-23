// /public/footer-loader.js
// ✅ Dynamische footer met Terms/Privacy popup (zelfde aanpak als co-sponsors)

(function () {
  console.log("🦶 footer-loader.js gestart");

  // ---------- Helpers ----------
  function lockBodyScroll() {
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    document.body.dataset.scrollY = String(scrollY);
    document.body.style.top = `-${scrollY}px`;
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
  }
  function unlockBodyScroll() {
    const y = parseInt(document.body.dataset.scrollY || "0", 10);
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";
    window.scrollTo(0, y);
    delete document.body.dataset.scrollY;
  }
  function el(html) {
    const div = document.createElement("div");
    div.innerHTML = html.trim();
    return div.firstElementChild;
  }

  document.addEventListener("DOMContentLoaded", async () => {
    // ---------- Popup HTML injecteren (zoals bij co-sponsors) ----------
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

    // ---------- CSS (fullscreen + boven alles) ----------
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
        max-width: 980px; /* iets breder */
        margin: 0 auto;
        padding: 0 10px;
      }
      #dynamic-footer .brand {
        display: flex;
        align-items: center;
        gap: 14px;
        justify-content: center;
        margin-bottom: 10px;
      }
      #dynamic-footer .brand img {
        height: 28px;
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

      /* knoppen (links) met iconen */
      #dynamic-footer .link-row {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      #dynamic-footer .soft-link {
        background: none;
        border: none;
        font-weight: 600;            /* subtiel dikker i.p.v. felblauw */
        cursor: pointer;
        text-decoration: none;       /* geen underline */
        color: inherit;              /* overneemt paginakleur */
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

      /* === Popup Styling (echte fullscreen overlay) === */
      .footer-popup {
        position: fixed;
        inset: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2147483000; /* hoger dan Swipepages dividers */
      }
      .footer-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,0.6);
        z-index: 0;
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
        z-index: 1;
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

      /* 📱 Mobiel */
      @media (max-width: 768px) {
        #dynamic-footer { text-align: left; padding: 20px; }
        #dynamic-footer p { text-align: justify; }
        .footer-content { max-height: 88vh; padding: 24px; }
        #dynamic-footer .brand { justify-content: flex-start; }
      }
    `;
    document.head.appendChild(style);

    // ---------- Bepaal welke footer we moeten tonen ----------
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status") || "online";
    const footerName = status === "live" ? "Premium Advertising" : "Online Acties";

    // ---------- Data ophalen ----------
    let footerData = null;
    try {
      const res = await fetch("https://globalcoregflow-nl.vercel.app/api/footers.js");
      const { data } = await res.json();
      footerData = data.find(f => f.name === footerName) || null;
      if (!footerData) {
        console.warn(`⚠️ Geen footer gevonden met naam '${footerName}', toon niets.`);
        return;
      }
    } catch (err) {
      console.error("❌ Fout bij laden footers:", err);
      return;
    }

    // ---------- Footer container aanwezig? Zo niet, maak hem. ----------
    let footerContainer = document.getElementById("dynamic-footer");
    if (!footerContainer) {
      footerContainer = document.createElement("div");
      footerContainer.id = "dynamic-footer";
      document.body.appendChild(footerContainer);
    }

    // ---------- Render footer ----------
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
        <div class="brand">
          ${logo}
        </div>
        <hr class="fade-rule">
        <p>${footerData.text || ""}</p>
        <div class="link-row" aria-label="Documenten">
          <button class="soft-link" id="open-terms">${termsIcon}<span>Algemene Voorwaarden</span></button>
          <button class="soft-link" id="open-privacy">${privacyIcon}<span>Privacybeleid</span></button>
        </div>
      </div>
    `;

    // ---------- Event delegation voor openen/sluiten ----------
    document.addEventListener("click", (e) => {
      // Open Terms
      if (e.target.closest("#open-terms")) {
        e.preventDefault();
        popupContent.innerHTML = footerData.terms_content || "<p>Geen voorwaarden beschikbaar.</p>";
        popup.style.display = "flex";
        lockBodyScroll();
      }
      // Open Privacy
      if (e.target.closest("#open-privacy")) {
        e.preventDefault();
        popupContent.innerHTML = footerData.privacy_content || "<p>Geen privacyverklaring beschikbaar.</p>";
        popup.style.display = "flex";
        lockBodyScroll();
      }
      // Sluiten (kruisje of overlay)
      if (e.target.id === "close-footer-popup" || e.target.classList.contains("footer-overlay")) {
        popup.style.display = "none";
        unlockBodyScroll();
      }
    });
  });
})();
