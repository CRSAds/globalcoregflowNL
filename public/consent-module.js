// =============================================================
// consent-module.js — DEFINITIEF (trigger-onafhankelijk)
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
     Popup openen — universeel
     ----------------------------------------------------------- */
  function openPopup(selector) {
    const popup = document.querySelector(selector);
    if (!popup) {
      console.warn("⚠️ Popup niet gevonden:", selector);
      return;
    }

    // 1️⃣ CSS visibility
    popup.style.display = "block";
    popup.style.visibility = "visible";
    popup.style.opacity = "1";

    // 2️⃣ ARIA (Swipe / accessibility)
    popup.setAttribute("aria-hidden", "false");

    // 3️⃣ Veelgebruikte open-classes (veilig)
    popup.classList.add("open", "active", "is-open", "visible");

    // 4️⃣ Custom event (voor eventuele listeners)
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
