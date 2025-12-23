// =============================================================
// consent-module.js — ROBUUST & PRODUCTIE-VEILIG (Swipepages-proof)
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
     2. Utils — waitForElement (cruciaal)
     ============================================================ */
  function waitForElement(id, timeout = 5000, interval = 100) {
    return new Promise((resolve) => {
      const start = Date.now();
      const timer = setInterval(() => {
        const el = document.getElementById(id);
        if (el) {
          clearInterval(timer);
          resolve(el);
        } else if (Date.now() - start > timeout) {
          clearInterval(timer);
          resolve(null);
        }
      }, interval);
    });
  }

  /* ============================================================
     3. Actievoorwaarden modal (eigen modal)
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
    overlay.querySelector(".pb-modal-close")
      .addEventListener("click", closeVoorwaardenModal);

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

  async function openVoorwaardenModal() {
    const content = await waitForElement("actievoorwaarden-wrapper");

    if (!content) {
      console.warn("❌ Actievoorwaarden-wrapper niet gevonden (timeout)");
      return;
    }

    const overlay = createVoorwaardenModal();
    const body = overlay.querySelector(".pb-modal-body");

    // Content eenmalig verplaatsen
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
     4. Click handling
     ------------------------------------------------------------
     - Actievoorwaarden → eigen modal
     - Sponsors → volledig overlaten aan cosponsors.js
     ============================================================ */
  function initClickHandlers() {
    document.addEventListener("click", (e) => {

      // 🎯 Actievoorwaarden
      if (e.target.closest("#open-actievoorwaarden-inline")) {
        e.preventDefault();
        openVoorwaardenModal();
        return;
      }

      // ⛔️ GEEN sponsor-logica hier
      // cosponsors.js handelt sponsor clicks volledig af

    });
  }

  /* ============================================================
     5. Boot — run altijd correct
     ============================================================ */
  function init() {
    initSponsorConsent();
    initClickHandlers();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
