// =============================================================
// consent-module.js — DEFINITIEF (SwipePages compatible)
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
     Helper: popup openen (Swipe-safe)
     ----------------------------------------------------------- */
  function openPopup(selector) {
    const popup =
      document.querySelector(selector) ||
      document.getElementById(selector.replace("#", ""));

    if (!popup) {
      console.warn("⚠️ Popup niet gevonden:", selector);
      return;
    }

    // Meest compatibele manier
    popup.style.display = "block";
    popup.setAttribute("aria-hidden", "false");

    // Voor eventuele listeners
    popup.dispatchEvent(new Event("open", { bubbles: true }));
  }

  /* -----------------------------------------------------------
     Click handling
     ----------------------------------------------------------- */
  document.addEventListener("click", (e) => {

    /* 🎯 Actievoorwaarden */
    if (e.target.closest("#open-actievoorwaarden-inline")) {
      e.preventDefault();
      openPopup(".voorwaarden-popup");
      return;
    }

    /* 🎯 Sponsors */
    if (e.target.closest("#open-sponsor-popup")) {
      e.preventDefault();
      openPopup(".sponsor-popup");
      return;
    }

  });

})();
