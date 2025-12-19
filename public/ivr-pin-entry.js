(function () {
  const LOG_PREFIX = '[IVR-PIN]';

  function log(...args) {
    console.log(LOG_PREFIX, ...args);
  }

  function error(...args) {
    console.error(LOG_PREFIX, ...args);
  }

  // -------------------------------
  // 1️⃣ REQUEST PIN (bij popup open)
  // -------------------------------
  async function requestPin() {
    try {
      const payload = {
        clickId: localStorage.getItem('t_id'),
        internalVisitId: localStorage.getItem('internalVisitId'),
      };

      log('request_pin starten:', payload);

      const res = await $.ajax({
        url: 'https://cdn.909support.com/NL/4.1/stage/assets/php/request_pin.php',
        type: 'POST',
        data: payload,
      });

      const data = JSON.parse(res);

      if (!data || !data.pincode) {
        throw new Error('Geen pincode ontvangen uit request_pin');
      }

      log('request_pin succesvol (pincode gegenereerd)');
      return true;
    } catch (err) {
      error('request_pin fout:', err.message);
      return false;
    }
  }

  (function () {
    const POPUP_SELECTOR = '.call-pop-up-desktop.memory-pop-up';
  
    const observer = new MutationObserver(() => {
      const popup = document.querySelector(POPUP_SELECTOR);
  
      if (!popup) return;
  
      const isVisible =
        popup.offsetParent !== null &&
        window.getComputedStyle(popup).display !== 'none';
  
      if (isVisible && !popup.dataset.ivrStarted) {
        popup.dataset.ivrStarted = 'true';
        console.log('[IVR-PIN] Popup zichtbaar → start IVR flow');
        window.startIVRPinFlow?.();
      }
    });
  
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });
  })();
  
  // --------------------------------
  // 2️⃣ PIN INPUT HANDLING
  // --------------------------------
  function updatePinCode() {
    const pin =
      ($('#input1').val() || '') +
      ($('#input2').val() || '') +
      ($('#input3').val() || '');

    $('#pinCode').val(pin).trigger('input');
  }

  $('.pin-input').on('input', function () {
    const maxLength = this.maxLength;

    $('.error-input').remove();
    localStorage.removeItem('errorShown');

    if (this.value.length >= maxLength) {
      $(this).next('.pin-input').focus();
    }

    updatePinCode();
  });

  $('.pin-input')
    .on('focus', function () {
      $(this).data('placeholder', $(this).attr('placeholder'));
      $(this).attr('placeholder', '');
    })
    .on('blur', function () {
      $(this).attr('placeholder', $(this).data('placeholder'));
    });

  // --------------------------------
  // 3️⃣ SUBMIT PIN
  // --------------------------------
  async function submitPin() {
    try {
      const pin = $('#pinCode').val();

      if (!/^\d{3}$/.test(pin)) {
        throw new Error('Ongeldige pincode');
      }

      const payload = {
        affId: localStorage.getItem('aff_id'),
        offerId: localStorage.getItem('offer_id'),
        subId: localStorage.getItem('sub_id'),
        internalVisitId: localStorage.getItem('internalVisitId'),
        clickId: localStorage.getItem('t_id'),
        pin,
        gameName: localStorage.getItem('gameName'),
      };

      log('SubmitPin proberen:', payload);

      const res = await $.ajax({
        url: 'https://cdn.909support.com/NL/4.1/stage/assets/php/SubmitPin.php',
        type: 'POST',
        data: payload,
      });

      const data = JSON.parse(res);
      log('SubmitPin response:', data);

      if (data.callId && data.returnUrl) {
        localStorage.setItem('callId', data.callId);

        const redirectUrl =
          data.returnUrl +
          '?call_id=' + data.callId +
          '&t_id=' + localStorage.getItem('t_id') +
          '&aff_id=' + localStorage.getItem('aff_id') +
          '&offer_id=' + localStorage.getItem('offer_id') +
          '&sub_id=' + localStorage.getItem('sub_id') +
          '&f_2_title=' + localStorage.getItem('f_2_title') +
          '&f_3_firstname=' + localStorage.getItem('f_3_firstname') +
          '&f_4_lastname=' + localStorage.getItem('f_4_lastname') +
          '&f_1_email=' + localStorage.getItem('f_1_email');

        window.open(redirectUrl, '_blank');

        setTimeout(() => $('.close-icon').trigger('click'), 7500);
        return;
      }

      throw new Error('Onjuiste pincode');
    } catch (err) {
      error(err.message);

      setTimeout(() => $('.pin-input').val(''), 500);

      if (!localStorage.getItem('errorShown')) {
        $('.inputGrid').after('<div class="error-input">Onjuiste pincode</div>');
        localStorage.setItem('errorShown', 'true');
      }
    }
  }

  // --------------------------------
  // 4️⃣ EVENTS
  // --------------------------------
  $('#submitPinButton').on('click', submitPin);

  // --------------------------------
  // 5️⃣ EXPOSE FOR POPUP OPEN
  // --------------------------------
  window.startIVRPinFlow = async function () {
    log('Popup geopend → IVR flow starten');
    await requestPin();
  };
})();
