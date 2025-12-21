// =============================================================
// consent-module.js
// -------------------------------------------------------------
// Geïsoleerde consent-module voor short form
// - Sponsor-optin opslaan in sessionStorage
// - Actievoorwaarden openen via bestaande footer popup
// - Geen impact op form submit, flow of Databowl
// =============================================================

(function () {
  // ---------------------------------------------
  // Init na DOM load
  // ---------------------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    initSponsorConsent();
  });

  // ---------------------------------------------
  // Sponsor consent (checkbox)
  // ---------------------------------------------
  function initSponsorConsent() {
    const checkbox = document.getElementById("consent-sponsors");
    if (!checkbox) return;

    // Default altijd expliciet false (compliance)
    sessionStorage.setItem("sponsorsAccepted", "false");

    checkbox.addEventListener("change", () => {
      sessionStorage.setItem(
        "sponsorsAccepted",
        checkbox.checked ? "true" : "false"
      );
    });
  }

  // ---------------------------------------------
  // Actievoorwaarden popup (hergebruik footer)
  // ---------------------------------------------
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("#open-actievoorwaarden-inline");
    if (!trigger) return;

    e.preventDefault();

    // Footer-loader injecteert deze knop dynamisch
    const footerTrigger = document.getElementById("open-terms");

    if (footerTrigger) {
      footerTrigger.click();
    } else {
      console.warn(
        "⚠️ consent-module: footer terms-trigger (#open-terms) nog niet beschikbaar"
      );
    }
  });
})();
