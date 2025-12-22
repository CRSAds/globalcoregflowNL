// =============================================================
// consent-module.js — DEFINITIEF & PRODUCTIE-VEILIG
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
     ------------------------------------------------------------
     ❗ Belangrijk:
     - We openen GEEN popup zelf
     - We triggeren exact dezelfde click-chain
     ============================================================ */
  function triggerSponsorPopup() {
    const btn = document.getElementById("open-sponsor-popup");
    if (!btn) {
      console.warn("⚠️ #open-sponsor-popup niet gevonden");
      return;
    }

    // Gebruik exact dezelfde codepath als bestaande funnels
    btn.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window,
      })
    );
  }

  /* ============================================================
     3. Actievoorwaarden modal — eigen modal
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

    // Sluiten via X
    overlay.querySelector(".pb-modal-close").addEventListener("click", closeVoorwaardenModal);

    // Sluiten via backdrop
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeVoorwaardenModal();
    });

    // Sluiten via ESC
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

    // Content verplaatsen (eenmalig)
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
     4. Click handling (ZEER BELANGRIJK)
     ------------------------------------------------------------
     - GEEN preventDefault op sponsor
     - WEL preventDefault op voorwaarden
     ============================================================ */
  function initClickHandlers() {
    document.addEventListener("click", (e) => {

      /* 🎯 Actievoorwaarden → eigen modal */
      if (e.target.closest("#open-actievoorwaarden-inline")) {
        e.preventDefault(); // veilig: dit is onze eigen modal
        openVoorwaardenModal();
        return;
      }

      /* 🎯 Sponsor → laat cosponsors.js zijn werk doen */
      if (e.target.closest("#open-sponsor-popup")) {
        // ❗ GEEN preventDefault
        // ❗ GEEN eigen open-logica
        // cosponsors.js vangt deze click zelf af
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
