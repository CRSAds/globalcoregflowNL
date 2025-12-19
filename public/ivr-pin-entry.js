// =============================================================
// ✅ IVR PINCODE INVULLEN (LOS / VEILIG / NIEUWE MODULE)
// - Doet niets tenzij .ivr-pin-popup bestaat
// - Geen impact op bestaande IVR
// - gameName = Memory
// =============================================================

(function IVRPinEntryOnly() {
  const POPUP_SELECTOR = ".ivr-pin-popup";
  const SUBMIT_BTN_SELECTOR = "#submitPinButton";

  const ENDPOINT_SUBMIT_PIN =
    "https://cdn.909support.com/NL/4.1/stage/assets/php/SubmitPin.php";

  // -----------------------------
  // Helpers storage
  // -----------------------------
  const getStore = (k) =>
    sessionStorage.getItem(k) ??
    localStorage.getItem(k) ??
    "";

  const setStore = (k, v) =>
    sessionStorage.setItem(k, v);

  // Zet gameName expliciet
  setStore("gameName", "Memory");

  // -----------------------------
  // Init wanneer popup bestaat
  // -----------------------------
  function initIfPopupExists() {
    const popup = document.querySelector(POPUP_SELECTOR);
    if (!popup || popup.dataset.ivrInit === "true") return;

    popup.dataset.ivrInit = "true";
    wireInputs(popup);
    wireSubmit(popup);
  }

  // Observe DOM (popup kan later verschijnen)
  const observer = new MutationObserver(initIfPopupExists);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  // Ook direct proberen
  initIfPopupExists();

  // -----------------------------
  // PIN input logica
  // -----------------------------
  function wireInputs(popup) {
    const inputs = [
      popup.querySelector("#input1"),
      popup.querySelector("#input2"),
      popup.querySelector("#input3"),
    ];
    const pinCode = popup.querySelector("#pinCode");

    if (inputs.some((i) => !i) || !pinCode) return;

    const updatePin = () => {
      pinCode.value =
        (inputs[0].value || "") +
        (inputs[1].value || "") +
        (inputs[2].value || "");
    };

    inputs.forEach((input, index) => {
      input.addEventListener("input", () => {
        input.value = input.value.replace(/\D/g, "").slice(0, 1);
        updatePin();

        if (input.value && inputs[index + 1]) {
          inputs[index + 1].focus();
        }
      });
    });

    // focus eerste input bij openen
    setTimeout(() => inputs[0].focus(), 50);
  }

  // -----------------------------
  // Submit PIN
  // -----------------------------
  function wireSubmit(popup) {
    const btn = popup.querySelector(SUBMIT_BTN_SELECTOR);
    const pinCode = popup.querySelector("#pinCode");

    if (!btn || !pinCode || btn.dataset.ivrBound === "true") return;
    btn.dataset.ivrBound = "true";

    btn.addEventListener("click", async (e) => {
      e.preventDefault();

      const pin = pinCode.value.trim();
      if (!/^\d{3}$/.test(pin)) return;

      btn.disabled = true;
      btn.classList.add("loading");

      try {
        const res = await fetch(ENDPOINT_SUBMIT_PIN, {
          method: "POST",
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded; charset=UTF-8",
          },
          body: new URLSearchParams({
            affId: getStore("aff_id"),
            offerId: getStore("offer_id"),
            subId: getStore("sub_id"),
            clickId: getStore("t_id"),
            internalVisitId: getStore("internalVisitId"),
            pin: pin,
            gameName: "Memory",
          }),
        });

        const text = await res.text();
        let data = {};
        try {
          data = JSON.parse(text);
        } catch {}

        if (data.callId) {
          setStore("callId", data.callId);
        }

        if (data.returnUrl) {
          const url = new URL(data.returnUrl);
          url.searchParams.set("call_id", data.callId || "");

          ["t_id", "aff_id", "offer_id", "sub_id"].forEach((k) => {
            const v = getStore(k);
            if (v) url.searchParams.set(k, v);
          });

          window.open(url.toString(), "_blank");
        } else {
          showError(popup);
        }
      } catch (err) {
        console.error("IVR PIN submit fout:", err);
        showError(popup);
      } finally {
        btn.disabled = false;
        btn.classList.remove("loading");
      }
    });
  }

  function showError(popup) {
    if (popup.querySelector(".error-input")) return;

    const div = document.createElement("div");
    div.className = "error-input";
    div.textContent = "Onjuiste pincode";
    popup.appendChild(div);
  }
})();
