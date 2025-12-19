// public/ivr-pin-entry.js
// ============================================================
// ✅ IVR PIN entry (Memory) — productie versie
// - Breekt bestaande IVR niet (staat los)
// - Start flow zodra popup zichtbaar is (geen device-detectie)
// - Doet: register_visit -> request_pin (niet tonen) -> SubmitPin
// - POST als application/x-www-form-urlencoded (zoals legacy jQuery)
// - Fallback naar /stage endpoints
// ============================================================

(() => {
  if (window.__IVR_PIN_ENTRY_INIT__) return;
  window.__IVR_PIN_ENTRY_INIT__ = true;

  // ============================
  // Config
  // ============================
  const GAME_NAME = "Memory";
  const PIN_LENGTH = 3;

  // Activeer alléén op deze popup container (pas dit aan als je popup-classes anders zijn)
  // Jij noemde: "call-pop-up-desktop memory-pop-up"
  const POPUP_SELECTOR = ".call-pop-up-desktop.memory-pop-up";

  // Endpoints (prod + stage fallback)
  const REGISTER_VISIT_URLS = [
    "https://cdn.909support.com/NL/4.1/assets/php/register_visit.php",
    "https://cdn.909support.com/NL/4.1/stage/assets/php/register_visit.php",
  ];

  const REQUEST_PIN_URLS = [
    "https://cdn.909support.com/NL/4.1/assets/php/request_pin.php",
    "https://cdn.909support.com/NL/4.1/stage/assets/php/request_pin.php",
  ];

  const SUBMIT_PIN_URLS = [
    "https://cdn.909support.com/NL/4.1/assets/php/SubmitPin.php",
    "https://cdn.909support.com/NL/4.1/stage/assets/php/SubmitPin.php",
  ];

  // ============================
  // State
  // ============================
  const state = {
    started: false,        // request_pin flow al gestart
    internalVisitId: null, // cached
    lastRequestOk: false,  // request_pin succesvol geweest
    popupWasOpen: false,   // voor open/close detectie
  };

  // ============================
  // Helpers
  // ============================
  const log = (...a) => console.log("[IVR-PIN]", ...a);
  const warn = (...a) => console.warn("[IVR-PIN]", ...a);
  const err = (...a) => console.error("[IVR-PIN]", ...a);

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
      gameName: GAME_NAME,
    };
  }

  function showInlineError(popupEl, message) {
    popupEl.querySelectorAll(".error-input").forEach((n) => n.remove());
    const grid = popupEl.querySelector(".inputGrid");
    if (!grid) return;
    grid.insertAdjacentHTML("afterend", `<div class="error-input">${message}</div>`);
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

  function isVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0")
      return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  // ============================
  // HTTP: form-urlencoded (legacy compatible)
  // ============================
  async function postForm(url, payload) {
    const body = new URLSearchParams();
    Object.entries(payload || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") body.append(k, String(v));
    });

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
      body,
    });

    const txt = await res.text();
    try {
      return JSON.parse(txt);
    } catch {
      return { raw: txt };
    }
  }

  // ============================
  // API: register_visit (internalVisitId)
  // ============================
  async function ensureInternalVisitId() {
    const existing = localStorage.getItem("internalVisitId");
    if (existing) {
      state.internalVisitId = existing;
      log("internalVisitId al aanwezig:", existing);
      return existing;
    }

    const t = getTracking();

    const payload = {
      clickId: t.clickId,
      affId: t.affId,
      offerId: t.offerId,
      subId: t.subId,
      subId2: getLocal("sub1"),
    };

    for (const url of REGISTER_VISIT_URLS) {
      try {
        log("register_visit proberen:", url);
        const data = await postForm(url, payload);

        if (data?.internalVisitId) {
          const id = String(data.internalVisitId);
          localStorage.setItem("internalVisitId", id);
          state.internalVisitId = id;
          log("internalVisitId opgeslagen:", id);
          return id;
        }
      } catch (e) {
        err("register_visit error:", e);
      }
    }

    throw new Error("Geen internalVisitId ontvangen uit register_visit");
  }

  // ============================
  // API: request_pin (reserveer call-context, pincode NIET tonen)
  // ============================
  async function requestPinContext() {
    const t = getTracking();

    // Legacy endpoint gebruikt (minimaal) clickId + internalVisitId
    const payload = {
      clickId: t.clickId,
      internalVisitId: t.internalVisitId,
      // gameName soms genegeerd; maar veilig mee te sturen
      gameName: GAME_NAME,
    };

    for (const url of REQUEST_PIN_URLS) {
      try {
        log("request_pin proberen:", url);
        const data = await postForm(url, payload);

        if (data?.pincode) {
          state.lastRequestOk = true;
          log("request_pin OK (pincode ontvangen maar niet getoond).");
          return true;
        }
      } catch (e) {
        err("request_pin error:", e);
      }
    }

    throw new Error("Geen pincode ontvangen uit request_pin");
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

  // ============================
  // API: SubmitPin
  // ============================
  async function submitPin(pin) {
    const t = getTracking();

    const payload = {
      affId: t.affId,
      offerId: t.offerId,
      subId: t.subId,
      clickId: t.clickId,
      internalVisitId: t.internalVisitId,
      pin,
      gameName: GAME_NAME,
    };

    for (const url of SUBMIT_PIN_URLS) {
      try {
        log("SubmitPin proberen:", url);
        log("SubmitPin payload:", payload);

        const data = await postForm(url, payload);
        log("SubmitPin response:", data);

        // Legacy success shape
        if (data?.returnUrl || data?.callId) return { ok: true, data };
        if (data?.success === true) return { ok: true, data };

        // Als de server expliciet zegt dat het fout is, direct stoppen
        if (data?.error || data?.message) {
          // ga door naar stage fallback als prod faalt zonder harde error?
          // hier laten we fallback wel proberen; user ziet uiteindelijk "Onjuiste pincode"
        }
      } catch (e) {
        // In jouw logs kwam "{error:'Request failed'}" → dat is server-side json
        // Maar fetch errors kunnen ook, dus we loggen en proberen de volgende url
        err("SubmitPin error:", e);
      }
    }

    return { ok: false, data: { error: "Request failed" } };
  }

  // ============================
  // UX: input handlers (auto focus + numeric)
  // ============================
  function attachInputHandlers(popupEl) {
    const inputs = popupEl.querySelectorAll(".pin-input");
    if (!inputs.length) return;

    inputs.forEach((inp, idx) => {
      inp.addEventListener("input", () => {
        clearInlineError(popupEl);

        inp.value = (inp.value || "").replace(/\D/g, "").slice(0, 1);

        if (inp.value && idx < inputs.length - 1) {
          inputs[idx + 1].focus();
        }
      });
    });
  }

  // ============================
  // Submit handler (button id)
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

      if (!state.lastRequestOk) {
        warn("request_pin was niet OK. Probeer popup opnieuw te openen / opnieuw te bellen.");
      }

      // Disable knop tijdens request
      btn.disabled = true;
      btn.classList.add("loading");

      try {
        const result = await submitPin(pin);

        if (result.ok) {
          clearInlineError(popupEl);

          // Legacy gedrag: open returnUrl in nieuwe tab indien aanwezig
          const t = getTracking();
          const { data } = result;

          if (data?.returnUrl) {
            const url =
              `${data.returnUrl}` +
              `?call_id=${encodeURIComponent(data.callId || "")}` +
              `&t_id=${encodeURIComponent(t.clickId)}` +
              `&aff_id=${encodeURIComponent(t.affId)}` +
              `&offer_id=${encodeURIComponent(t.offerId)}` +
              `&sub_id=${encodeURIComponent(t.subId)}`;

            window.open(url, "_blank");
          }

          // Event hook voor integratie (bv memory starten)
          document.dispatchEvent(
            new CustomEvent("ivr-pin-success", { detail: result.data })
          );

          return;
        }

        showInlineError(popupEl, "Onjuiste pincode");
      } catch (e2) {
        err(e2);
        showInlineError(popupEl, "Onjuiste pincode");
      } finally {
        btn.disabled = false;
        btn.classList.remove("loading");
      }
    });
  }

  // ============================
  // Popup open detectie (Swipe Pages safe)
  // - Start flow op closed -> open transition
  // ============================
  function observePopupOpen() {
    const tick = () => {
      const popup = document.querySelector(POPUP_SELECTOR);
      const openNow = popup && isVisible(popup);

      if (openNow && !state.popupWasOpen) {
        log("Popup geopend -> IVR flow starten");
        startIvrPinFlowOnce();
      }

      state.popupWasOpen = !!openNow;
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }

  // ============================
  // Init
  // ============================
  function init() {
    observePopupOpen();

    // Bind input handlers zodra popup in DOM verschijnt
    const domObserver = new MutationObserver(() => {
      const popup = document.querySelector(POPUP_SELECTOR);
      if (!popup || popup.dataset.ivrPinBound) return;

      popup.dataset.ivrPinBound = "true";
      attachInputHandlers(popup);
      log("Handlers gekoppeld aan IVR PIN popup");
    });

    domObserver.observe(document.body, { childList: true, subtree: true });

    attachSubmitHandler();
  }

  init();
})();
