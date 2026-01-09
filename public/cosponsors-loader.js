// =============================================================
// ✅ cosponsors-loader.js — identiek patroon aan footer-loader
// =============================================================

(function () {
  console.log("🤝 cosponsors-loader gestart");

  // =========================
  // Helpers (zelfde als footer)
  // =========================
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

  document.addEventListener("DOMContentLoaded", () => {
    // =========================
    // Popup injecteren
    // =========================
    const popupHTML = `
      <div id="cosponsor-popup" class="cosponsor-popup" style="display:none;">
        <div class="cosponsor-overlay"></div>
        <div class="cosponsor-content" role="dialog" aria-modal="true">
          <button id="close-cosponsor-popup" aria-label="Sluiten">×</button>
          <h2>Onze partners</h2>
          <div id="cosponsor-list">Laden…</div>
        </div>
      </div>
    `;
    document.body.appendChild(el(popupHTML));

    const popup = document.getElementById("cosponsor-popup");
    const list = document.getElementById("cosponsor-list");

// =========================
// CSS (geïsoleerd + hard zwart op wit)
// =========================
const style = document.createElement("style");
style.textContent = `
  /* Overlay + popup container */
  #cosponsor-popup {
    position: fixed;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2147483647;
    isolation: isolate;
  }

  #cosponsor-popup .cosponsor-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
  }

  /* Popup inhoud — ALTIJD wit met zwarte tekst */
  #cosponsor-popup .cosponsor-content {
    position: relative;
    background: #ffffff !important;
    color: #000000 !important;
    padding: 32px;
    max-width: 900px;
    width: min(94vw, 900px);
    max-height: 85vh;
    overflow-y: auto;
    border-radius: 12px;
    font-family: Inter, sans-serif !important;
    font-size: 14px;
    line-height: 1.6;
    z-index: 2147483647;
  }

  /* 🔒 HARD OVERRIDE: ALLE tekst altijd zwart */
  #cosponsor-popup .cosponsor-content,
  #cosponsor-popup .cosponsor-content * {
    color: #000000 !important;
  }

  /* Backgrounds van tekst-elementen neutraliseren */
  #cosponsor-popup .cosponsor-content p,
  #cosponsor-popup .cosponsor-content small,
  #cosponsor-popup .cosponsor-content strong,
  #cosponsor-popup .cosponsor-content div,
  #cosponsor-popup .cosponsor-content span {
    background: transparent !important;
  }

  /* Sluitknop */
  #close-cosponsor-popup {
    position: absolute;
    top: 10px;
    right: 18px;
    font-size: 22px;
    border: none;
    background: none !important;
    cursor: pointer;
    color: #000000 !important;
  }

  #close-cosponsor-popup:hover {
    opacity: 0.7;
  }

  /* Titel */
  #cosponsor-popup .cosponsor-content h1,
  #cosponsor-popup .cosponsor-content h2,
  #cosponsor-popup .cosponsor-content h3,
  #cosponsor-popup .cosponsor-content strong {
    color: #000000 !important;
  }

  /* Lijst */
  #cosponsor-popup #cosponsor-list {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  #cosponsor-popup .cosponsor-item {
    display: flex;
    gap: 16px;
    border-bottom: 1px solid #e5e5e5;
    padding-bottom: 16px;
  }

  #cosponsor-popup .cosponsor-item img {
    width: 80px;
    height: auto;
    flex-shrink: 0;
  }

  /* Links — altijd zwart */
  #cosponsor-popup .cosponsor-content a,
  #cosponsor-popup .cosponsor-content a:visited,
  #cosponsor-popup .cosponsor-content a:hover,
  #cosponsor-popup .cosponsor-content a:active {
    color: #000000 !important;
    text-decoration: underline;
  }

  /* Scroll lock */
  html.modal-open,
  body.modal-open {
    overflow: hidden !important;
  }
`;
document.head.appendChild(style);
    
    // =========================
    // Sponsors laden (1x)
    // =========================
    let loaded = false;

    async function loadSponsors() {
      if (loaded) return;
      loaded = true;

      try {
        const res = await fetch(
          "https://globalcoregflow-nl.vercel.app/api/cosponsors.js",
          { cache: "no-store" }
        );
        const json = await res.json();

        list.innerHTML = "";

        if (!Array.isArray(json.data) || !json.data.length) {
          list.innerHTML = "<p>Geen actieve sponsors gevonden.</p>";
          return;
        }

        json.data.forEach(s => {
          const item = document.createElement("div");
          item.className = "cosponsor-item";
          item.innerHTML = `
            ${s.logo ? `<img src="https://cms.core.909play.com/assets/${s.logo}" alt="${s.title}">` : ""}
            <div>
              <strong>${s.title}</strong><br>
              <p>${s.description || ""}</p>
              ${s.address ? `<small>${s.address.replace(/\n/g,"<br>")}</small><br>` : ""}
              <a href="${s.privacy_url}" target="_blank" rel="noopener">Privacybeleid</a>
            </div>
          `;
          list.appendChild(item);
        });
      } catch (err) {
        console.error("❌ Cosponsors laden mislukt:", err);
        list.innerHTML = "<p>Er ging iets mis bij het laden van de sponsorlijst.</p>";
      }
    }

    // =========================
    // Globale click handler (IDENTIEK PATROON ALS FOOTER)
    // =========================
    document.addEventListener("click", (e) => {
      // Open
      if (e.target.closest("#open-sponsor-popup")) {
        e.preventDefault();
        e.stopPropagation();

        popup.style.display = "flex";
        lockScroll();
        loadSponsors();
        return;
      }

      // Close
      if (
        e.target.id === "close-cosponsor-popup" ||
        e.target.classList.contains("cosponsor-overlay")
      ) {
        popup.style.display = "none";
        unlockScroll();
      }
    }, true);
  });
})();
