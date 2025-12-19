// =============================================================
// ✅ IVR PINCODE INVULLEN (LOS / VEILIG / NIEUWE MODULE)
// - Alleen actief als .ivr-pin-popup bestaat
// - Zet internalVisitId via register_visit als die ontbreekt
// - Probeert eerst LIVE endpoint, en valt terug op STAGE
// - DEBUG logging aan/uit
// =============================================================

(function IVRPinEntryOnly() {
  const DEBUG = true; // <- zet op false als het werkt

  const POPUP_SELECTOR = ".ivr-pin-popup";
  const SUBMIT_BTN_SELECTOR = "#submitPinButton";

  // Eerst LIVE proberen, daarna STAGE fallback (oude code gebruikte stage)
  const ENDPOINTS = {
    registerVisit: [
      "https://cdn.909support.com/NL/4.1/assets/php/register_visit.php",
      "https://cdn.909support.com/NL/4.1/stage/assets/php/register_visit.php",
    ],
    submitPin: [
      "https://cdn.909support.com/NL/4.1/assets/php/SubmitPin.php",
      "https://cdn.909support.com/NL/4.1/stage/assets/php/SubmitPin.php",
    ],
  };

  const log = (...args) => DEBUG && console.log("[IVR-PIN]", ...args);
  const warn = (...args) => DEBUG && console.warn("[IVR-PIN]", ...args);

  // Storage: eerst sessionStorage, fallback localStorage
  const getStore = (k) => sessionStorage.getItem(k) ?? localStorage.getItem(k) ?? "";
  const setStore = (k, v) => sessionStorage.setItem(k, v);

  // Zet gameName expliciet
  setStore("gameName", "Memory");

  // -----------------------------
  // Init wanneer popup bestaat
  // -----------------------------
  function initIfPopupExists() {
    const popup = document.querySelector(POPUP_SELECTOR);
    if (!popup || popup.dataset.ivrInit === "true") return;

    popup.dataset.ivrInit = "true";
    log("Popup gevonden, init bindings…", POPUP_SELECTOR);

    wireInputs(popup);
    wireSubmit(popup);
  }

  const observer = new MutationObserver(initIfPopupExists);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  initIfPopupExists();

  // -----------------------------
  // internalVisitId garanderen
  // -----------------------------
  async function ensureInternalVisitId() {
    const existing = getStore("internalVisitId");
    if (existing) {
      log("internalVisitId al aanwezig:", existing);
      return existing;
    }

    const payload = new URLSearchParams({
      clickId: getStore("t_id"),
      affId: getStore("aff_id"),
      offerId: getStore("offer_id"),
      subId: getStore("sub_id"),
      subId2: getStore("sub1"),
    });

    for (const url of ENDPOINTS.registerVisit) {
      try {
        log("register_visit proberen:", url);
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
          body: payload,
        });

        const text = await res.text();
        let data = {};
        try { data = JSON.parse(text); } catch {}

        log("register_visit response:", data || text);

        if (data && data.internalVisitId) {
          setStore("internalVisitId", data.internalVisitId);
          log("internalVisitId gezet:", data.internalVisitId);
          return data.internalVisitId;
        }
      } catch (e) {
        warn("register_visit fout op:", url, e);
      }
    }

    warn("Geen internalVisitId gekregen (blijft leeg).");
    return "";
  }

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

    if (inputs.some((i) => !i) || !pinCode) {
      warn("Inputs/pinCode niet gevonden in popup. Check ids: input1/2/3 + pinCode");
      return;
    }

    const updatePin = () => {
      pinCode.value = (inputs[0].value || "") + (inputs[1].value || "") + (inputs[2].value || "");
      log("pinCode update:", pinCode.value);
    };

    inputs.forEach((input, index) => {
      input.addEventListener("input", () => {
        input.value = input.value.replace(/\D/g, "").slice(0, 1);
        updatePin();
        if (input.value && inputs[index + 1]) inputs[index + 1].focus();
      });
    });

    setTimeout(() => inputs[0].focus(), 50);
  }

  // -----------------------------
  // Submit PIN (met endpoint fallback)
  // -----------------------------
  function wireSubmit(popup) {
    const btn = popup.querySelector(SUBMIT_BTN_SELECTOR);
    const pinCode = popup.querySelector("#pinCode");

    if (!btn) {
      warn("Submit button niet gevonden. Verwacht:", SUBMIT_BTN_SELECTOR);
      return;
    }
    if (!pinCode) {
      warn("pinCode input niet gevonden (#pinCode).");
      return;
    }
    if (btn.dataset.ivrBound === "true") return;
    btn.dataset.ivrBound = "true";

    btn.addEventListener("click", async (e) => {
      e.preventDefault();

      const pin = pinCode.value.trim();
      if (!/^\d{3}$/.test(pin)) {
        warn("Pin is niet 3 cijfers:", pin);
        return;
      }

      btn.disabled = true;
      btn.classList.add("loading");

      try {
        await ensureInternalVisitId();

        const basePayload = {
          affId: getStore("aff_id"),
          offerId: getStore("offer_id"),
          subId: getStore("sub_id"),
          clickId: getStore("t_id"),
          internalVisitId: getStore("internalVisitId"),
          pin,
          gameName: "Memory",
        };

        log("Submit payload:", basePayload);

        let finalData = null;

        for (const url of ENDPOINTS.submitPin) {
          try {
            log("SubmitPin proberen:", url);

            const res = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
              body: new URLSearchParams(basePayload),
            });

            const text = await res.text();
            let data = {};
            try { data = JSON.parse(text); } catch {}

            log("SubmitPin response:", data || text);

            // als callId of returnUrl terugkomt, is dit de juiste endpoint
            if (data && (data.callId || data.returnUrl)) {
              finalData = data;
              break;
            }
          } catch (err) {
            warn("SubmitPin fout op:", url, err);
          }
        }

        if (!finalData) {
          showError(popup, "Onjuiste pincode (of endpoint mismatch)");
          return;
        }

        if (finalData.callId) {
          setStore("callId", finalData.callId);
          log("callId opgeslagen:", finalData.callId);
        }

        if (finalData.returnUrl) {
          const url = new URL(finalData.returnUrl);
          if (finalData.callId) url.searchParams.set("call_id", finalData.callId);

          // tracking params optioneel
          ["t_id", "aff_id", "offer_id", "sub_id"].forEach((k) => {
            const v = getStore(k);
            if (v) url.searchParams.set(k, v);
          });

          log("Open returnUrl:", url.toString());
          window.open(url.toString(), "_blank");
        } else {
          showError(popup, "Onjuiste pincode");
        }
      } catch (err) {
        console.error("IVR PIN submit fout:", err);
        showError(popup, "Er ging iets mis, probeer opnieuw.");
      } finally {
        btn.disabled = false;
        btn.classList.remove("loading");
      }
    });
  }

  function showError(popup, msg) {
    popup.querySelector(".error-input")?.remove();
    const div = document.createElement("div");
    div.className = "error-input";
    div.textContent = msg || "Onjuiste pincode";
    popup.appendChild(div);
  }
})();
