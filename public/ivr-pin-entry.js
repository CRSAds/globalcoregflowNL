(() => {
  if (window.__IVR_PIN_ENTRY_INIT__) return;
  window.__IVR_PIN_ENTRY_INIT__ = true;

  // ============================
  // Config
  // ============================
  const GAME_NAME = "Memory";
  const PIN_LENGTH = 3;

  // Alleen activeren voor deze popup(s)
  // (je kunt hier later extra selectors toevoegen)
  const POPUP_SELECTOR = ".call-pop-up-desktop.memory-pop-up";

  const REGISTER_VISIT_URL =
    "https://cdn.909support.com/NL/4.1/assets/php/register_visit.php";
  const REQUEST_PIN_URL =
    "https://cdn.909support.com/NL/4.1/assets/php/request_pin.php";
  const SUBMIT_PIN_URL =
    "https://cdn.909support.com/NL/4.1/assets/php/SubmitPin.php";

  // ============================
  // State
  // ============================
  const state = {
    started: false,      // request_pin flow al gestart voor deze page sessie
    internalVisitId: null,
    lastRequestOk: false // request_pin succesvol geweest
  };

  // ============================
  // Helpers
  // ============================
  const log = (...args) => console.log("[IVR-PIN]", ...args);
  const warn = (...args) => console.warn("[IVR-PIN]", ...args);
  const err = (...args) => console.error("[IVR-PIN]", ...args);

  const $ = (sel, root = document) => root.querySelector(sel);

  function getLocal(key) {
    const v = localStorage.getItem(key);
    return v == null ? "" : v;
  }

  function getTracking() {
    return {
      affId: getLocal("aff_id"),
      offerId: getLocal("offer_id"),
      subId: getLocal("sub_id"),
      clickId: getLocal("t_id"),
      internalVisitId: localStorage.getItem("internalVisitId") || null,
      gameName: GAME_NAME
    };
  }

  function showInlineError(popupEl, message) {
    // Verwijder oude melding
    popupEl.querySelectorAll(".error-input").forEach((n) => n.remove());

    const grid = popupEl.querySelector(".inputGrid");
    if (!grid) return;

    grid.insertAdjacentHTML(
      "afterend",
      `<div class="error-input">${message}</div>`
    );
  }

  function clearInlineError(popupEl) {
    popupEl.querySelectorAll(".error-input").forEach((n) => n.remove());
  }

  function collectPin(popupEl) {
    const a = $("#input1", popupEl)?.value?.trim() || "";
    const b = $("#input2", popupEl)?.value?.trim() || "";
    const c = $("#input3", popupEl)?.value?.trim() || "";
    return `${a}${b}${c}`;
  }

  // ============================
  // API calls
  // ============================
  async function postJson(url, payload) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    // request_pin returns soms geen json-header -> fallback
    const txt = await res.text();
    try {
      return JSON.parse(txt);
    } catch {
      return { raw: txt };
    }
  }

  async function ensureInternalVisitId() {
    const existing = localStorage.getItem("internalVisitId");
    if (existing) {
      state.internalVisitId = existing;
      log("internalVisitId al aanwezig:", existing);
      return existing;
    }

    const t = getTracking();

    // register_visit verwacht soms subId2 (sub1)
    const payload = {
      clickId: t.clickId,
      affId: t.affId,
      offerId: t.offerId,
      subId: t.subId,
      subId2: getLocal("sub1")
    };

    log("register_visit proberen:", REGISTER_VISIT_URL);

    const data = await postJson(REGISTER_VISIT_URL, payload);

    if (!data?.internalVisitId) {
      throw new Error("Geen internalVisitId ontvangen uit register_visit");
    }

    localStorage.setItem("internalVisitId", String(data.internalVisitId));
    state.internalVisitId = String(data.internalVisitId);

    log("internalVisitId opgeslagen:", state.internalVisitId);
    return state.internalVisitId;
  }

  async function requestPinContext() {
    const t = getTracking();

    const payload = {
      affId: t.affId,
      offerId: t.offerId,
      subId: t.subId,
      clickId: t.clickId,
      internalVisitId: t.internalVisitId,
      gameName: GAME_NAME
    };

    log("request_pin proberen:", REQUEST_PIN_URL);

    const data = await postJson(REQUEST_PIN_URL, payload);

    // We tonen pincode niet, maar willen wel weten of request ok was
    if (!data?.pincode) {
      // Sommige responses geven een andere shape; log raw voor debug
      throw new Error("Geen pincode ontvangen uit request_pin");
    }

    state.lastRequestOk = true;
    log("request_pin OK (pincode ontvangen maar niet getoond).");
    return true;
  }

  async function startIvrPinFlowOnce() {
    if (state.started) return;
    state.started = true;

    try {
      await ensureInternalVisitId();
      await requestPinContext();
    } catch (e) {
      state.lastRequestOk = false;
      err(e);
    }
  }

  async function submitPin(popupEl, pin) {
    const t = getTracking();

    const payload = {
      affId: t.affId,
      offerId: t.offerId,
      subId: t.subId,
      clickId: t.clickId,
      internalVisitId: t.internalVisitId,
      gameName: GAME_NAME,
      pin
    };

    log("SubmitPin proberen:", SUBMIT_PIN_URL);
    log("SubmitPin payload:", payload);

    const data = await postJson(SUBMIT_PIN_URL, payload);
    log("SubmitPin response:", data);

    // Oude 909 scripts geven soms {callId, returnUrl} i.p.v. success:true
    if (data?.returnUrl) {
      // Open returnUrl in nieuwe tab zoals legacy gedrag
      const url =
        `${data.returnUrl}` +
        `?call_id=${encodeURIComponent(data.callId || "")}` +
        `&t_id=${encodeURIComponent(t.clickId)}` +
        `&aff_id=${encodeURIComponent(t.affId)}` +
        `&offer_id=${encodeURIComponent(t.offerId)}` +
        `&sub_id=${encodeURIComponent(t.subId)}`;

      window.open(url, "_blank");
      return { ok: true, data };
    }

    // Sommige responses bevatten errors
    if (data?.error) {
      return { ok: false, data };
    }

    // fallback: als er geen duidelijke success indicator is
    return { ok: false, data };
  }

  // ============================
  // Popup detectie: start flow bij "open"
  // ============================
  function isVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0")
      return false;

    // Als swipe popup via transform off-screen werkt, check rect
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function observePopupOpen() {
    let lastWasOpen = false;

    const tick = () => {
      const popup = document.querySelector(POPUP_SELECTOR);
      const openNow = popup && isVisible(popup);

      // Trigger alleen op "closed -> open"
      if (openNow && !lastWasOpen) {
        log("Popup geopend → IVR flow starten");
        startIvrPinFlowOnce();
      }

      lastWasOpen = !!openNow;
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }

  // ============================
  // Input UX: auto-focus naar volgende veld
  // ============================
  function attachInputHandlers(popupEl) {
    const inputs = popupEl.querySelectorAll(".pin-input");
    if (!inputs.length) return;

    inputs.forEach((inp, idx) => {
      inp.addEventListener("input", () => {
        clearInlineError(popupEl);

        // alleen 1 char, numeric
        inp.value = (inp.value || "").replace(/\D/g, "").slice(0, 1);

        if (inp.value && idx < inputs.length - 1) {
          inputs[idx + 1].focus();
        }
      });
    });
  }

  // ============================
  // Submit handler
  // ============================
  function attachSubmitHandler() {
    document.addEventListener("click", async (e) => {
      const btn = e.target.closest("#submitPinButton");
      if (!btn) return;

      const popupEl = document.querySelector(POPUP_SELECTOR);
      if (!popupEl) return;

      const pin = collectPin(popupEl);

      if (!/^\d{3}$/.test(pin)) {
        log("Ongeldige pincode");
        showInlineError(popupEl, "Vul 3 cijfers in");
        return;
      }

      // Als request_pin nooit OK is geweest, heeft submit weinig kans van slagen
      if (!state.lastRequestOk) {
        warn("request_pin was niet OK. Probeer popup opnieuw te openen / opnieuw te bellen.");
        // we proberen alsnog, maar tonen wel nette melding als het faalt
      }

      const result = await submitPin(popupEl, pin);

      if (result.ok) {
        clearInlineError(popupEl);
        // optioneel: markeer succes / disable button
        btn.disabled = true;
        btn.classList.add("loading");
        return;
      }

      showInlineError(popupEl, "Onjuiste pincode");
    });
  }

  // ============================
  // Init
  // ============================
  function init() {
    // Start observer die wacht tot popup zichtbaar wordt
    observePopupOpen();

    // Voeg handlers toe zodra popup in DOM staat
    const observer = new MutationObserver(() => {
      const popup = document.querySelector(POPUP_SELECTOR);
      if (!popup || popup.dataset.ivrPinBound) return;

      popup.dataset.ivrPinBound = "true";
      attachInputHandlers(popup);
      log("Handlers gekoppeld aan IVR PIN popup");
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Submit handler is document-wide
    attachSubmitHandler();
  }

  init();
})();
