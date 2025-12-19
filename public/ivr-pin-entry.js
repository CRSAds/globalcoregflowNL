// public/ivr-pin-entry.js
(() => {
  if (window.__IVR_PIN_ENTRY_INIT__) return;
  window.__IVR_PIN_ENTRY_INIT__ = true;

  const GAME_NAME = "Memory";
  const POPUP_SELECTOR = ".call-pop-up-desktop.memory-pop-up";

  // We proberen STAGE eerst (vaak gekoppeld aan de IVR lijn), daarna PROD
  const ENV_BASES = [
    "https://cdn.909support.com/NL/4.1/stage/assets/php",
    "https://cdn.909support.com/NL/4.1/assets/php",
  ];

  const state = {
    started: false,
    envBase: null,          // <- we locken hierop zodra request_pin OK is
    internalVisitId: null,
    lastRequestOk: false,
    popupWasOpen: false,
  };

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
      const json = JSON.parse(txt);
      return json;
    } catch {
      return { raw: txt };
    }
  }

  function endpoint(envBase, file) {
    return `${envBase}/${file}`;
  }

  async function ensureInternalVisitId() {
    const existing = localStorage.getItem("internalVisitId");
    if (existing) {
      state.internalVisitId = existing;
      log("internalVisitId al aanwezig:", existing);
      return existing;
    }

    // Als envBase al gelocked is, gebruik die. Anders proberen we envs op volgorde.
    const bases = state.envBase ? [state.envBase] : ENV_BASES;

    const t = getTracking();
    const payload = {
      clickId: t.clickId,
      affId: t.affId,
      offerId: t.offerId,
      subId: t.subId,
      subId2: getLocal("sub1"),
    };

    for (const base of bases) {
      const url = endpoint(base, "register_visit.php");
      try {
        log("register_visit proberen:", url);
        const data = await postForm(url, payload);
        log("register_visit response:", data);

        if (data?.internalVisitId) {
          const id = String(data.internalVisitId);
          localStorage.setItem("internalVisitId", id);
          state.internalVisitId = id;

          // Als nog niet gelocked, lock naar deze base (belangrijk voor consistentie)
          if (!state.envBase) state.envBase = base;

          log("internalVisitId opgeslagen:", id, "| envBase:", state.envBase);
          return id;
        }
      } catch (e) {
        err("register_visit error:", e);
      }
    }

    throw new Error("Geen internalVisitId ontvangen uit register_visit");
  }

  async function requestPinContext() {
    // request_pin bepaalt de juiste omgeving -> locken we op success
    const t = getTracking();

    const payload = {
      clickId: t.clickId,
      internalVisitId: t.internalVisitId,
      gameName: GAME_NAME,
    };

    for (const base of ENV_BASES) {
      const url = endpoint(base, "request_pin.php");
      try {
        log("request_pin proberen:", url);
        const data = await postForm(url, payload);
        log("request_pin response (genegeerd):", data);

        if (data?.pincode) {
          state.lastRequestOk = true;
          state.envBase = base; // <- LOCK HIER
          log("request_pin OK (pincode ontvangen maar niet getoond). envBase =", state.envBase);
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
      // eerst visit id, dan request pin (lock envBase)
      await ensureInternalVisitId();
      await requestPinContext();
    } catch (e) {
      state.lastRequestOk = false;
      err(e);
    }
  }

  async function submitPin(pin) {
    const t = getTracking();

    // SubmitPin MOET dezelfde envBase gebruiken als request_pin succes had
    const bases = state.envBase ? [state.envBase] : ENV_BASES;

    const payload = {
      affId: t.affId,
      offerId: t.offerId,
      subId: t.subId,
      clickId: t.clickId,
      internalVisitId: t.internalVisitId,
      pin,
      gameName: GAME_NAME,
    };

    for (const base of bases) {
      const url = endpoint(base, "SubmitPin.php");
      try {
        log("SubmitPin proberen:", url);
        log("SubmitPin payload:", payload);

        const data = await postForm(url, payload);
        log("SubmitPin response:", data);

        if (data?.returnUrl || data?.callId || data?.success === true) {
          return { ok: true, data };
        }
      } catch (e) {
        err("SubmitPin error:", e);
      }
    }

    return { ok: false, data: { error: "Request failed" } };
  }

  function attachInputHandlers(popupEl) {
    const inputs = popupEl.querySelectorAll(".pin-input");
    if (!inputs.length) return;

    inputs.forEach((inp, idx) => {
      inp.addEventListener("input", () => {
        clearInlineError(popupEl);
        inp.value = (inp.value || "").replace(/\D/g, "").slice(0, 1);
        if (inp.value && idx < inputs.length - 1) inputs[idx + 1].focus();
      });
    });
  }

  function attachSubmitHandler() {
    document.addEventListener("click", async (e) => {
      const btn = e.target.closest("#submitPinButton");
      if (!btn) return;

      const popupEl = document.querySelector(POPUP_SELECTOR);
      if (!popupEl) return;

      const pin = collectPin(popupEl);

      if (!/^\d{3}$/.test(pin)) {
        showInlineError(popupEl, "Vul 3 cijfers in");
        return;
      }

      if (!state.lastRequestOk) {
        warn("request_pin was niet OK. Probeer popup opnieuw te openen en opnieuw te bellen.");
      }

      btn.disabled = true;
      btn.classList.add("loading");

      try {
        const result = await submitPin(pin);

        if (result.ok) {
          clearInlineError(popupEl);

          const { data } = result;
          const t = getTracking();

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

          document.dispatchEvent(new CustomEvent("ivr-pin-success", { detail: data }));
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

  function init() {
    observePopupOpen();

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
