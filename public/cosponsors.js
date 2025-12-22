// =============================================================
// ✅ cosponsors.js — injecterende versie (footer-loader patroon)
// =============================================================

(function () {
  console.log("🤝 cosponsors.js (inject) gestart");

  // =========================
  // Helpers
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
          <div id="cosponsor-list"><p>Laden…</p></div>
        </div>
      </div>
    `;
    document.body.appendChild(el(popupHTML));

    const popup = document.getElementById("cosponsor-popup");
    const list = document.getElementById("cosponsor-list");

    // =========================
    // CSS injecteren
    // =========================
    const style = document.createElement("style");
    style.textContent = `
      .cosponsor-popup {
        position: fixed;
        inset: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2147483647;
        isolation: isolate;
      }
      .cosponsor-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,0.6);
      }
      .cosponsor-content {
        position: relative;
        background: #fff;
        padding: 32px;
        max-width: 900px;
        width: min(94vw, 900px);
        max-height: 85vh;
        overflow-y: auto;
        border-radius: 12px;
        font-family: Inter, sans-serif;
        font-size: 14px;
        line-height: 1.6;
        z-index: 2147483647;
      }
      #close-cosponsor-popup {
        position: absolute;
        top: 10px;
        right: 18px;
        font-size: 22px;
        border: none;
        background: none;
        cursor: pointer;
        color: #666;
      }
      #close-cosponsor-popup:hover { color: #000; }

      #cosponsor-list {
        margin-top: 20px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      .cosponsor-item {
        display: flex;
        gap: 16px;
        border-bottom: 1px solid #e5e5e5;
        padding-bottom: 16px;
      }
      .cosponsor-item img {
        width: 80px;
        height: auto;
        flex-shrink: 0;
      }

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
    // Globale click-delegatie
    // =========================
    document.addEventListener(
      "click",
      (e) => {
        // Openen
        if (e.target.closest("#open-sponsor-popup")) {
          e.preventDefault();
          e.stopPropagation();

          popup.style.display = "flex";
          lockScroll();
          loadSponsors();
          return;
        }

        // Sluiten
        if (
          e.target.id === "close-cosponsor-popup" ||
          e.target.classList.contains("cosponsor-overlay")
        ) {
          popup.style.display = "none";
          unlockScroll();
        }
      },
      true
    );
  });
})();
