// =============================================================
// consent-module.js — uitgebreid
// =============================================================

(function () {

  document.addEventListener("DOMContentLoaded", () => {
    initSponsorConsent();
  });

  /* -----------------------------------------------------------
     Sponsor consent opslaan
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
     Popups openen (event delegation)
     ----------------------------------------------------------- */
  document.addEventListener("click", (e) => {

    /* 🎯 Actievoorwaarden */
    const voorwaardenBtn = e.target.closest("#open-actievoorwaarden-inline");
    if (voorwaardenBtn) {
      e.preventDefault();

      const popup =
        document.querySelector(".voorwaarden-popup") ||
        document.getElementById("voorwaarden-popup");

      if (popup) {
        popup.classList.add("open");
      } else {
        console.warn("⚠️ voorwaarden-popup niet gevonden");
      }
      return;
    }

    /* 🎯 Sponsors */
    const sponsorBtn = e.target.closest("#open-sponsor-popup");
    if (sponsorBtn) {
      e.preventDefault();

      const popup =
        document.querySelector(".sponsor-popup") ||
        document.getElementById("sponsor-popup");

      if (popup) {
        popup.classList.add("open");
      } else {
        console.warn("⚠️ sponsor-popup niet gevonden");
      }
    }
  });

})();
