// =============================================================
// consent-module.js — SwipePages DEFINITIEF
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
     Helper: open popup via Swipe trigger
     ----------------------------------------------------------- */
  function openPopupByClass(popupClass) {
    // 1️⃣ Zoek popup
    const popup = document.querySelector(popupClass);
    if (!popup) {
      console.warn("⚠️ Popup niet gevonden:", popupClass);
      return;
    }

    // 2️⃣ Zoek mogelijke trigger die deze popup opent
    const popupId = popup.id;

    let trigger =
      (popupId && document.querySelector(`[href="#${popupId}"]`)) ||
      (popupId && document.querySelector(`[data-target="#${popupId}"]`)) ||
      document.querySelector(`[data-popup="${popupClass.replace(".", "")}"]`);

    if (!trigger) {
      console.warn("⚠️ Geen Swipe trigger gevonden voor popup:", popupClass);
      return;
    }

    // 3️⃣ Simuleer echte klik (Swipe JS handelt de rest af)
    trigger.click();
  }

  /* -----------------------------------------------------------
     Click handling
     ----------------------------------------------------------- */
  document.addEventListener("click", (e) => {

    /* 🎯 Actievoorwaarden */
    if (e.target.closest("#open-actievoorwaarden-inline")) {
      e.preventDefault();
      openPopupByClass(".voorwaarden-popup");
      return;
    }

    /* 🎯 Sponsors */
    if (e.target.closest("#open-sponsor-popup")) {
      e.preventDefault();
      openPopupByClass(".sponsor-popup");
      return;
    }

  });

})();
