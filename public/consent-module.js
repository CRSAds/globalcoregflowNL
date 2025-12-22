// =============================================================
// consent-module.js — DEFINITIEF
// - sponsor consent
// - sponsor popup
// - actievoorwaarden popup
// =============================================================

(function () {

  /* -----------------------------------------------------------
     CONFIG
     ----------------------------------------------------------- */
  const POPUPS = {
    sponsors: {
      title: "Onze partners",
      contentSelector: "#cosponsor-popup",
      openSelector: "#open-sponsor-popup",
    },
    voorwaarden: {
      title: "Actievoorwaarden",
      contentSelector: "#actievoorwaarden-wrapper",
      openSelector: "#open-actievoorwaarden-inline",
    },
  };

  /* -----------------------------------------------------------
     Sponsor consent state
     ----------------------------------------------------------- */
  function initSponsorConsent() {
    const checkbox = document.getElementById("consent-sponsors");
    if (!checkbox) return;

    sessionStorage.setItem("sponsorsAccepted", "false");

    checkbox.addEventListener("change", () => {
      sessionStorage.setItem(
        "sponsorsAccepted",
        checkbox.checked ? "true" : "false"
      );
    });
  }

  /* -----------------------------------------------------------
     Modal creation
     ----------------------------------------------------------- */
  function createModalShell(id, title) {
    const overlay = document.createElement("div");
    overlay.className = "pb-modal-overlay";
    overlay.id = id;
    overlay.setAttribute("aria-hidden", "true");

    overlay.innerHTML = `
      <div class="pb-modal" role="dialog" aria-modal="true">
        <div class="pb-modal-header">
          <h3 class="pb-modal-title">${title}</h3>
          <button type="button" class="pb-modal-close" aria-label="Sluiten">✕</button>
        </div>
        <div class="pb-modal-body"></div>
      </div>
    `;

    document.body.appendChild(overlay);

    // sluiten via X
    overlay.querySelector(".pb-modal-close").addEventListener("click", () => {
      closeModal(overlay);
    });

    // sluiten via backdrop
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal(overlay);
    });

    return overlay;
  }

  function openModal(overlay) {
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    document.documentElement.style.overflow = "hidden";
  }

  function closeModal(overlay) {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    document.documentElement.style.overflow = "";
  }

  /* -----------------------------------------------------------
     Content handling
     ----------------------------------------------------------- */
  function moveContentIntoModal(modalBody, contentEl) {
    if (!contentEl) return;
    if (modalBody.contains(contentEl)) return;

    modalBody.appendChild(contentEl);
  }

  /* -----------------------------------------------------------
     Init
     ----------------------------------------------------------- */
  function initPopups() {
    const shells = {};

    Object.entries(POPUPS).forEach(([key, cfg]) => {
      shells[key] = createModalShell(`pb-modal-${key}`, cfg.title);
    });

    // ESC sluit popup
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      const open = document.querySelector(".pb-modal-overlay.is-open");
      if (open) closeModal(open);
    });

    // Open triggers
    document.addEventListener("click", (e) => {
      Object.entries(POPUPS).forEach(([key, cfg]) => {
        if (e.target.closest(cfg.openSelector)) {
          e.preventDefault();

          const overlay = shells[key];
          const body = overlay.querySelector(".pb-modal-body");
          const contentEl = document.querySelector(cfg.contentSelector);

          if (!contentEl) {
            console.warn(`⚠️ Content niet gevonden: ${cfg.contentSelector}`);
            return;
          }

          moveContentIntoModal(body, contentEl);
          openModal(overlay);
        }
      });
    });
  }

  /* -----------------------------------------------------------
     Boot
     ----------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    initSponsorConsent();
    initPopups();
  });

})();
