(function () {
  if (window.__IVR_PIN_ENTRY_LOADED) return;
  window.__IVR_PIN_ENTRY_LOADED = true;

  const PIN_LENGTH = 3;

  const state = {
    pin: null,
    internalVisitId: null,
    requested: false
  };

  function log(...args) {
    console.log('[IVR-PIN]', ...args);
  }

  function getTrackingPayload() {
    return {
      affId: localStorage.getItem('aff_id') || '',
      offerId: localStorage.getItem('offer_id') || '',
      subId: localStorage.getItem('sub_id') || '',
      clickId: localStorage.getItem('t_id') || '',
      gameName: 'Memory',
      internalVisitId: localStorage.getItem('internalVisitId') || null
    };
  }

  // ============================
  // 1️⃣ REQUEST PIN (bij popup open)
  // ============================
  async function requestPin() {
    if (state.requested) return;

    state.requested = true;

    const payload = getTrackingPayload();

    log('request_pin starten:', payload);

    try {
      const res = await fetch(
        'https://cdn.909support.com/NL/4.1/assets/php/request_pin.php',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      const data = await res.json();

      if (!data?.pincode) {
        throw new Error('Geen pincode ontvangen');
      }

      state.pin = String(data.pincode);
      state.internalVisitId = data.internalVisitId || payload.internalVisitId;

      log('request_pin OK (intern opgeslagen)');
    } catch (e) {
      console.error('[IVR-PIN] request_pin fout:', e);
    }
  }

  // ============================
  // 2️⃣ PIN INVOER LOGICA
  // ============================
  function collectPin() {
    const inputs = document.querySelectorAll('.pin-input');
    let code = '';

    inputs.forEach(i => (code += i.value.trim()));

    return code;
  }

  // ============================
  // 3️⃣ SUBMIT PIN
  // ============================
  async function submitPin() {
    const enteredPin = collectPin();

    if (enteredPin.length !== PIN_LENGTH) {
      alert('Voer de volledige code in');
      return;
    }

    const payload = {
      ...getTrackingPayload(),
      pin: enteredPin,
      internalVisitId: state.internalVisitId
    };

    log('SubmitPin payload:', payload);

    try {
      const res = await fetch(
        'https://cdn.909support.com/NL/4.1/assets/php/SubmitPin.php',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      const data = await res.json();

      if (data?.success) {
        log('PIN correct → toegang toegestaan');
        document.dispatchEvent(
          new CustomEvent('ivr-pin-success', { detail: data })
        );
      } else {
        throw new Error('Onjuiste pincode');
      }
    } catch (e) {
      log('PIN fout');
      alert('Onjuiste pincode');
    }
  }

  // ============================
  // 4️⃣ EVENTS
  // ============================

  // Popup open → request_pin
  document.addEventListener('click', e => {
    if (
      e.target.closest('.ivr-pin-popup') ||
      e.target.closest('[data-ivr-pin-open]')
    ) {
      requestPin();
    }
  });

  // Bevestig knop
  document.addEventListener('click', e => {
    if (e.target.closest('[data-ivr-pin-submit]')) {
      submitPin();
    }
  });
})();
