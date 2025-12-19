(function () {
  const LOG_PREFIX = "[IVR-PIN]";
  const POPUP_SELECTOR = ".call-pop-up-desktop.memory-pop-up"; // jouw popup
  const REQUEST_PIN_URL = "https://cdn.909support.com/NL/4.1/stage/assets/php/request_pin.php";
  const SUBMIT_PIN_URL  = "https://cdn.909support.com/NL/4.1/stage/assets/php/SubmitPin.php";

  const GAME_NAME = "memory"; // hard gezet zoals je wilde

  const log = (...a) => console.log(LOG_PREFIX, ...a);
  const warn = (...a) => console.warn(LOG_PREFIX, ...a);
  const err = (...a) => console.error(LOG_PREFIX, ...a);

  let isSubmitting = false;

  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------
  function getLS(key, fallback = null) {
    const v = localStorage.getItem(key);
    return (v === undefined || v === null || v === "") ? fallback : v;
  }

  function setButtonLoading(isLoading) {
    const btn = document.getElementById("submitPinButton");
    if (!btn) return;

    btn.disabled = !!isLoading;
    btn.classList.toggle("is-loading", !!isLoading);

    const textEl = btn.querySelector(".btn-text");
    const loaderEl = btn.querySelector(".btn-loader");

    if (textEl) textEl.style.opacity = isLoading ? "0.6" : "1";
    if (loaderEl) loaderEl.style.display = isLoading ? "inline-block" : "none";
  }

  function showError(msg = "Onjuiste pincode") {
    // voorkom stapels errors
    document.querySelectorAll(".ivr-pin-wrapper .error-input").forEach(n => n.remove());

    const wrap = document.querySelector(".ivr-pin-wrapper");
    if (!wrap) return;

    const div = document.createElement("div");
    div.className = "error-input";
    div.textContent = msg;

    const group = wrap.querySelector(".pin-input-group") || wrap.querySelector(".inputGrid");
    (group || wrap).insertAdjacentElement("afterend", div);
  }

  function clearError() {
    document.querySelectorAll(".ivr-pin-wrapper .error-input").forEach(n => n.remove());
  }

  function clearInputs() {
    ["input1", "input2", "input3", "pinCode"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    const i1 = document.getElementById("input1");
    if (i1) i1.focus();
  }

  function updatePinCode() {
    const a = (document.getElementById("input1")?.value || "").trim();
    const b = (document.getElementById("input2")?.value || "").trim();
    const c = (document.getElementById("input3")?.value || "").trim();
    const pin = `${a}${b}${c}`.replace(/\D/g, "").slice(0, 3);

    const hidden = document.getElementById("pinCode");
    if (hidden) hidden.value = pin;

    return pin;
  }

  function isPopupVisible() {
    const popup = document.querySelector(POPUP_SELECTOR);
    if (!popup) return false;
    return popup.offsetParent !== null && window.getComputedStyle(popup).display !== "none";
  }

  // ------------------------------------------------------------
  // 1) request_pin bij popup open (maar toon pincode NIET)
  // ------------------------------------------------------------
  async function requestPin() {
    const clickId = getLS("t_id");
    const internalVisitId = getLS("internalVisitId");

    const payload = { clickId, internalVisitId };
    log("request_pin starten:", payload);

    if (!clickId) warn("clickId (t_id) ontbreekt in localStorage");
    if (!internalVisitId) warn("internalVisitId ontbreekt in localStorage (kan request_pin breken)");

    try {
      const res = await $.ajax({
        url: REQUEST_PIN_URL,
        type: "POST",
        data: payload,
        cache: false
      });

      const data = typeof res === "string" ? JSON.parse(res) : res;

      // We tonen de pincode niet, maar we checken wel of de endpoint OK is
      if (!data || !data.pincode) {
        throw new Error("Geen pincode ontvangen uit request_pin");
      }

      log("request_pin succesvol (pincode gegenereerd)");
      return true;
    } catch (e) {
      err("request_pin fout:", e?.message || e);
      return false;
    }
  }

  // ------------------------------------------------------------
  // 2) SubmitPin
  // ------------------------------------------------------------
  async function submitPin() {
    if (isSubmitting) return;

    clearError();

    const pin = updatePinCode();
    if (!/^\d{3}$/.test(pin)) {
      showError("Vul een geldige 3-cijferige code in");
      return;
    }

    const payload = {
      affId: getLS("aff_id") || "unknown",
      offerId: getLS("offer_id") || "unknown",
      subId: getLS("sub_id") || "unknown",
      internalVisitId: getLS("internalVisitId") || "",
      clickId: getLS("t_id") || "",
      pin,
      gameName: GAME_NAME
    };

    log("SubmitPin payload:", payload);

    isSubmitting = true;
    setButtonLoading(true);

    try {
      const res = await $.ajax({
        url: SUBMIT_PIN_URL,
        type: "POST",
        data: payload,
        cache: false
      });

      const data = typeof res === "string" ? JSON.parse(res) : res;
      log("SubmitPin response:", data);

      if (data?.callId && data?.returnUrl) {
        localStorage.setItem("callId", data.callId);

        const redirectUrl =
          data.returnUrl +
          "?call_id=" + encodeURIComponent(data.callId) +
          "&t_id=" + encodeURIComponent(getLS("t_id") || "") +
          "&aff_id=" + encodeURIComponent(getLS("aff_id") || "") +
          "&offer_id=" + encodeURIComponent(getLS("offer_id") || "") +
          "&sub_id=" + encodeURIComponent(getLS("sub_id") || "") +
          "&f_2_title=" + encodeURIComponent(getLS("f_2_title") || "") +
          "&f_3_firstname=" + encodeURIComponent(getLS("f_3_firstname") || "") +
          "&f_4_lastname=" + encodeURIComponent(getLS("f_4_lastname") || "") +
          "&f_1_email=" + encodeURIComponent(getLS("f_1_email") || "");

        window.open(redirectUrl, "_blank");
        setTimeout(() => $(".close-icon").trigger("click"), 7500);
        return;
      }

      // Als er geen callId/returnUrl is, is de code “niet goed”
      showError("Onjuiste pincode");
      setTimeout(clearInputs, 350);
    } catch (e) {
      err("SubmitPin request error:", e?.message || e);
      showError("Controle duurt langer / verzoek mislukt. Probeer opnieuw.");
    } finally {
      isSubmitting = false;
      setButtonLoading(false);
    }
  }

  // ------------------------------------------------------------
  // 3) Start flow wanneer popup zichtbaar wordt
  // ------------------------------------------------------------
  async function startFlowIfNeeded() {
    const popup = document.querySelector(POPUP_SELECTOR);
    if (!popup) return;

    if (!isPopupVisible()) return;

    // maar 1x per open
    if (popup.dataset.ivrStarted === "true") return;
    popup.dataset.ivrStarted = "true";

    log("Popup geopend → IVR flow starten");
    await requestPin();
  }

  // observe DOM changes zodat we ook werken als popup later injected wordt
  const observer = new MutationObserver(() => {
    startFlowIfNeeded();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true
  });

  // fallback bij load
  document.addEventListener("DOMContentLoaded", () => {
    startFlowIfNeeded();
  });

  // ------------------------------------------------------------
  // 4) Event delegation (BELANGRIJK: werkt ook als HTML later verschijnt)
  // ------------------------------------------------------------
  // Alleen cijfers toestaan + auto-focus naar volgende input
  $(document).on("input", ".pin-input", function () {
    clearError();

    // alleen 0-9
    this.value = (this.value || "").replace(/\D/g, "").slice(0, 1);

    updatePinCode();

    if (this.value.length === 1) {
      const next = this.nextElementSibling;
      if (next && next.classList.contains("pin-input")) next.focus();
    }
  });

  // backspace = terug
  $(document).on("keydown", ".pin-input", function (e) {
    if (e.key === "Backspace" && !this.value) {
      const prev = this.previousElementSibling;
      if (prev && prev.classList.contains("pin-input")) prev.focus();
    }
    if (e.key === "Enter") {
      e.preventDefault();
      submitPin();
    }
  });

  // submit button
  $(document).on("click", "#submitPinButton", function () {
    submitPin();
  });

  // expose (optioneel, als jij ergens handmatig wil starten)
  window.startIVRPinFlow = startFlowIfNeeded;
})();
