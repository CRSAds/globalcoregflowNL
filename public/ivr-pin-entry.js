(function () {
  if (window.ivrPinEntryInitialized) return;
  window.ivrPinEntryInitialized = true;

  const log = (...a) => console.log('[IVR-PIN]', ...a);
  const error = (...a) => console.error('[IVR-PIN]', ...a);

  const REQUEST_PIN_URL =
    'https://cdn.909support.com/NL/4.1/assets/php/request_pin.php';
  const SUBMIT_PIN_URL =
    'https://cdn.909support.com/NL/4.1/assets/php/SubmitPin.php';
  const REGISTER_VISIT_URL =
    'https://cdn.909support.com/NL/4.1/assets/php/register_visit.php';

  // 🔹 helpers
  const qs = (s) => document.querySelector(s);

  // 🔹 register visit (vereist voor IVR)
  async function registerVisitIfNeeded() {
    if (localStorage.getItem('internalVisitId')) {
      log('internalVisitId al aanwezig:', localStorage.getItem('internalVisitId'));
      return;
    }

    log('register_visit starten');

    const res = await fetch(REGISTER_VISIT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clickId: localStorage.getItem('t_id'),
        affId: localStorage.getItem('aff_id'),
        offerId: localStorage.getItem('offer_id'),
        subId: localStorage.getItem('sub_id'),
        subId2: localStorage.getItem('sub1'),
      }),
    });

    const data = await res.json();

    if (!data?.internalVisitId) {
      throw new Error('Geen internalVisitId ontvangen');
    }

    localStorage.setItem('internalVisitId', data.internalVisitId);
    log('internalVisitId opgeslagen:', data.internalVisitId);
  }

  // 🔹 request pin (reserveert call-context)
  async function requestPin() {
    await registerVisitIfNeeded();

    log('request_pin starten');

    const payload = {
      affId: localStorage.getItem('aff_id'),
      offerId: localStorage.getItem('offer_id'),
      subId: localStorage.getItem('sub_id'),
      clickId: localStorage.getItem('t_id'),
      gameName: 'Memory',
      internalVisitId: localStorage.getItem('internalVisitId'),
    };

    const res = await fetch(REQUEST_PIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await res.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = {};
    }

    if (!data?.pincode) {
      throw new Error('Geen pincode ontvangen');
    }

    log('request_pin OK (pincode gegenereerd)');
  }

  // 🔹 pincode submit
  async function submitPin(pin) {
    const payload = {
      affId: localStorage.getItem('aff_id'),
      offerId: localStorage.getItem('offer_id'),
      subId: localStorage.getItem('sub_id'),
      clickId: localStorage.getItem('t_id'),
      gameName: 'Memory',
      internalVisitId: localStorage.getItem('internalVisitId'),
      pin,
    };

    log('SubmitPin payload:', payload);

    const res = await fetch(SUBMIT_PIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    log('SubmitPin response:', data);

    if (data?.returnUrl) {
      window.open(
        `${data.returnUrl}?call_id=${data.callId}&t_id=${payload.clickId}`,
        '_blank'
      );
      return;
    }

    throw new Error('Onjuiste pincode');
  }

  // 🔹 popup hooks (Swipe Pages)
  document.addEventListener('click', async (e) => {
    if (!e.target.closest('.open-ivr-pin-popup')) return;

    try {
      await requestPin();
    } catch (err) {
      error(err.message);
    }
  });

  document.addEventListener('click', async (e) => {
    if (!e.target.closest('#submitPinButton')) return;

    const pin =
      qs('#input1')?.value +
      qs('#input2')?.value +
      qs('#input3')?.value;

    if (!/^\d{3}$/.test(pin)) {
      error('Ongeldige pincode');
      return;
    }

    try {
      await submitPin(pin);
    } catch (err) {
      error(err.message);
      qs('.error-input')?.remove();
      qs('.inputGrid')?.insertAdjacentHTML(
        'afterend',
        '<div class="error-input">Onjuiste pincode</div>'
      );
    }
  });
})();
