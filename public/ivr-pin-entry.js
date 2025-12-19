(function () {
  const LOG_PREFIX = '[IVR-PIN]';

  function log(...args) {
    console.log(LOG_PREFIX, ...args);
  }

  function error(...args) {
    console.error(LOG_PREFIX, ...args);
  }

  // -------------------------------
  // PIN INPUT HANDLING
  // -------------------------------
  function updatePinCode() {
    const pin =
      ($('#input1').val() || '') +
      ($('#input2').val() || '') +
      ($('#input3').val() || '');

    $('#pinCode').val(pin);
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

  // -------------------------------
  // SUBMIT PIN (ENIGE BACKEND CALL)
  // -------------------------------
  $('#submitPinButton').on('click', function () {
    const pin = $('#pinCode').val();

    if (!/^\d{3}$/.test(pin)) {
      error('Ongeldige pincode');
      return;
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

    log('SubmitPin payload:', payload);

    $.ajax({
      url: 'https://cdn.909support.com/NL/4.1/stage/assets/php/SubmitPin.php',
      type: 'POST',
      data: payload,
      success: function (response) {
        const data = JSON.parse(response);
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
      },
      error: function () {
        error('SubmitPin request failed');
      },
    });
  });
})();
