// =============================================================
// ✅ IVR PINCODE INVULLEN (LOS / VEILIG / MET request_pin)
// - Activeert IVR sessie via request_pin.php (zonder tonen)
// - Raakt bestaande IVR flows NIET
// - gameName = Memory
// =============================================================

(function IVRPinEntryOnly() {
  const DEBUG = true;

  const POPUP_SELECTOR = ".ivr-pin-popup";
  const SUBMIT_BTN_SELECTOR = "#submitPinButton";

  const ENDPOINTS = {
    requestPin: [
      "https://cdn.909support.com/NL/4.1/assets/php/request_pin.php",
      "https://cdn.909support.com/NL/4.1/stage/assets/php/request_pin.php",
    ],
    submitPin: [
      "https://cdn.909support.com/NL/4.1/assets/php/SubmitPin.php",
      "https://cdn.909support.com/NL/4.1/stage/assets/php/SubmitPin.php",
    ],
  };

  const log = (...a) => DEBUG && console.log("[IVR-PIN]", ...a);
  const warn = (...a) => DEBUG && console.warn("[IVR-PIN]", ...a);

  const getStore = (k) =>
    sessionStorage.getItem(k) ?? localStorage.getItem(k) ?? "";
  const setStore = (k, v) => sessionStorage.setItem(k, v);

  // Expliciet gameName
  setStore("gameName", "Memory");

  let pinSessionActivated = false;

  // --------------------------------------------------
  // Init wanneer popup verschijnt
  // --------------------------------------------------
  function initIfPopupExists() {
    const popup = document.querySelector(POPUP_SELECTOR);
    if (!popup || popup.dataset.ivrInit === "true") return;

    popup.dataset.ivrInit = "true";
    log("PIN popup gevonden, initialisatie gestart");

    activatePinSession(); // 👈 NIEUW
    wireInputs(popup);
    wireSubmit(popup);
  }

  const observer = new MutationObserver(initIfPopupExists);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  initIfPopupExists();

  // --------------------------------------------------
  // Activeer IVR PIN sessie (request_pin zonder UI)
  // --------------------------------------------------
  async function activatePinSession() {
    if (pinSessionActivated) return;
    pinSessionActivated = true;

    const payload = new URLSearchParams({
      clickId: getStore("t_id"),
      internalVisitId: getStore("internalVisitId"),
    });

    for (const url of ENDPOINTS.requestPin) {
      try {
        log("request_pin proberen:", url);
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          },
          body: payload,
        });

        const text = await res.text();
        log("request_pin response (genegeerd):", text);
        return; // één succesvolle call is genoeg
      } catch (e) {
        warn("request_pin fout op:", url, e);
      }
    }
  }

  // --------------------------------------------------
  // PIN inputs
  // --------------------------------------------------
  function wireInputs(popup) {
    const inputs = [
      popup.querySelector("#input1"),
      popup.querySelector("#input2"),
      popup.querySelector("#input3"),
    ];
    const pinCode = popup.querySelector("#pinCode");

    if (inputs.some((i) => !i) || !pinCode) {
      warn("PIN inputs ontbreken");
      return;
    }

    const updatePin = () => {
      pinCode.value =
        (inputs[0].value || "") +
        (inputs[1].value || "") +
        (inputs[2].value || "");
      log("pinCode update:", pinCode.value);
    };

    inputs.forEach((input, idx) => {
      input.addEventListener("input", () => {
        input.value = input.value.replace(/\D/g, "").slice(0, 1);
        updatePin();
        if (input.value && inputs[idx + 1]) inputs[idx + 1].focus();
      });
    });

    setTimeout(() => inputs[0].focus(), 50);
  }

  // --------------------------------------------------
  // Submit PIN
  // --------------------------------------------------
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

      const payload = {
        affId: getStore("aff_id"),
        offerId: getStore("offer_id"),
        subId: getStore("sub_id"),
        clickId: getStore("t_id"),
        internalVisitId: getStore("internalVisitId"),
        pin,
        gameName: "Memory",
      };

      log("SubmitPin payload:", payload);

      try {
        let finalData = null;

        for (const url of ENDPOINTS.submitPin) {
          try {
            log("SubmitPin proberen:", url);
            const res = await fetch(url, {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/x-www-form-urlencoded; charset=UTF-8",
              },
              body: new URLSearchParams(payload),
            });

            const text = await res.text();
            let data = {};
            try {
              data = JSON.parse(text);
            } catch {}

            log("SubmitPin response:", data || text);

            if (data.callId || data.returnUrl) {
              finalData = data;
              break;
            }
          } catch (e) {
            warn("SubmitPin fout op:", url, e);
          }
        }

        if (!finalData) {
          showError(popup);
          return;
        }

        if (finalData.callId) {
          setStore("callId", finalData.callId);
        }

        if (finalData.returnUrl) {
          const url = new URL(finalData.returnUrl);
          url.searchParams.set("call_id", finalData.callId || "");

          ["t_id", "aff_id", "offer_id", "sub_id"].forEach((k) => {
            const v = getStore(k);
            if (v) url.searchParams.set(k, v);
          });

          window.open(url.toString(), "_blank");
        }
      } catch (err) {
        console.error("IVR SubmitPin fout:", err);
        showError(popup);
      } finally {
        btn.disabled = false;
        btn.classList.remove("loading");
      }
    });
  }

  function showError(popup) {
    popup.querySelector(".error-input")?.remove();
    const div = document.createElement("div");
    div.className = "error-input";
    div.textContent = "Onjuiste pincode";
    popup.appendChild(div);
  }
})();
