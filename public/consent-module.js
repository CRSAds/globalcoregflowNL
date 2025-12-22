// =============================================================
// consent-module.js — DEFINITIEF (Tatsu popup integratie)
// =============================================================

(function () {

  /* -----------------------------------------------------------
     Sponsor consent opslaan
     ----------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    const checkbox = document.getElementById("consent-sponsors");
    if (!checkbox) return;

    sessionStorage.setItem("sponsorsAccepted", "false");

    checkbox.addEventListener("change", () => {
      sessionStorage.setItem(
        "sponsorsAccepted",
        checkbox.checked ? "true" : "false"
      );
    });
  });

  /* -----------------------------------------------------------
     Popup openen via Tatsu showPopup()
     ----------------------------------------------------------- */
  function openTatsuPopup(reason) {
    if (typeof window.showPopup === "function") {
      window.showPopup(reason);
    } else {
      console.warn(
        "⚠️ showPopup() niet beschikbaar — Tatsu popup niet geladen"
      );
    }
  }

  /* -----------------------------------------------------------
     Click handling
     ----------------------------------------------------------- */
  document.addEventListener("click", (e) => {

    /* 🎯 Actievoorwaarden */
    if (e.target.closest("#open-actievoorwaarden-inline")) {
      e.preventDefault();
      openTatsuPopup("voorwaarden-click");
      return;
    }

    /* 🎯 Sponsors */
    if (e.target.closest("#open-sponsor-popup")) {
      e.preventDefault();
      openTatsuPopup("sponsor-click");
      return;
    }

  });

})();
