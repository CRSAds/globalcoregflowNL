// =============================================================
// consent-module.js — DEFINITIEF
// - sponsor consent state
// - sponsor popup (bestaande cosponsors.js)
// - actievoorwaarden popup (eigen modal)
// =============================================================

(function () {

  /* ============================================================
     1. Sponsor consent state
     ============================================================ */
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

  /* ============================================================
     2. Sponsor popup — HERGEBRUIK BESTAANDE cosponsors.js
     ============================================================ */
  function openSponsorPopup() {
    const popup = document.getElementById("sponsor-popup");
    if (!popup) {
      console.warn("⚠️ sponsor-popup niet gevonden (cosponsors.js)");
      return;
    }

    popup.style.display = "flex";
  }

  /* ============================================================
     3. Actievoorwaarden modal — eigen, lichtgewicht
     ============================================================ */
  let voorwaardenModal = null;

  function createVoorwaardenModal() {
    if (voorwaardenModal) return voorwaardenModal;

    const overlay = document.createElement("div");
    overlay.className = "pb-modal-overlay";
    overlay.setAttribute("aria-hidden", "true");

    overlay.innerHTML = `
      <div class="pb-modal" role="dialog" aria-modal="true">
        <div class="pb-modal-header">
          <h3 class="pb-modal-title">Actievoorwaarden</h3>
          <button type="button" class="pb-modal-close" aria-label="Sluiten">✕</button>
        </div>
        <div class="pb-modal-body"></div>
      </div>
    `;

    document.body.appendChild(overlay);

    // sluiten via X
    overlay.querySelector(".pb-modal-close").addEventListener("click", () => {
      closeVoorwaardenModal();
    });

    // sluiten via backdrop
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeVoorwaardenModal();
    });

    // ESC
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeVoorwaardenModal();
    });

    voorwaardenModal = overlay;
    return overlay;
  }

  function openVoorwaardenModal() {
    const content = document.getElementById("actievoorwaarden-wrapper");
    if (!content) {
      console.warn("⚠️ #actievoorwaarden-wrapper niet gevonden");
      return;
    }

    const overlay = createVoorwaardenModal();
    const body = overlay.querySelector(".pb-modal-body");

    // content verplaatsen (1x)
    if (!body.contains(content)) {
      body.appendChild(content);
    }

    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    document.documentElement.style.overflow = "hidden";
  }

  function closeVoorwaardenModal() {
    if (!voorwaardenModal) return;

    voorwaardenModal.classList.remove("is-open");
    voorwaardenModal.setAttribute("aria-hidden", "true");
    document.documentElement.style.overflow = "";
  }

  /* ============================================================
     4. Click handling (event delegation)
     ============================================================ */
  function initClickHandlers() {
    document.addEventListener("click", (e) => {

      /* 🎯 Sponsor popup */
      if (e.target.closest("#open-sponsor-popup")) {
        e.preventDefault();
        openSponsorPopup();
        return;
      }

      /* 🎯 Actievoorwaarden */
      if (e.target.closest("#open-actievoorwaarden-inline")) {
        e.preventDefault();
        openVoorwaardenModal();
        return;
      }

    });
  }

  /* ============================================================
     Boot
     ============================================================ */
  document.addEventListener("DOMContentLoaded", () => {
    initSponsorConsent();
    initClickHandlers();
  });

})();
