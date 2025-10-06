// initFlow-lite.js
// Sectie-regie voor SwipePages + nieuwe coreg flow (Directus)
// - verbergt/tonen van secties (.flow-section, .coreg-section)
// - short form opslaan + lead naar cid=925
// - smooth doorstappen
// Vereist: window.buildPayload, window.fetchLead (uit formSubmit.js)

(function () {
  const suspiciousEmail = (email) => {
    const e = (email || '').toLowerCase();
    return [
      /@teleworm\.us$/i,
      /michaeljm/i,
      /^[a-z]{3,12}jm.*@/i,
      /[Mm]{3,}/
    ].some((p) => p.test(e));
  };

  function validateLeadForm(form) {
    if (!form) return false;
    const gender = form.querySelector('input[name="gender"]:checked');
    const firstname = form.querySelector('#firstname')?.value.trim();
    const lastname  = form.querySelector('#lastname')?.value.trim();
    const dd = form.querySelector('#dob-day')?.value.trim();
    const mm = form.querySelector('#dob-month')?.value.trim();
    const yy = form.querySelector('#dob-year')?.value.trim();
    const email = form.querySelector('#email')?.value.trim();

    const errors = [];
    if (!gender) errors.push('Geslacht');
    if (!firstname) errors.push('Voornaam');
    if (!lastname) errors.push('Achternaam');
    if (!dd || !mm || !yy) errors.push('Geboortedatum');
    if (!email || !email.includes('@') || !email.includes('.')) errors.push('E-mailadres');

    if (errors.length) {
      alert('Vul aub alle velden correct in:\n' + errors.join('\n'));
      return false;
    }
    if (suspiciousEmail(email)) {
      console.warn('⛔ Verdachte lead geblokkeerd (short form):', email);
      return false;
    }
    return true;
  }

  function storeLeadFormToSession(form) {
    const gender = form.querySelector('input[name="gender"]:checked')?.value || '';
    const firstname = form.querySelector('#firstname')?.value.trim() || '';
    const lastname  = form.querySelector('#lastname')?.value.trim() || '';
    const dd = form.querySelector('#dob-day')?.value.trim() || '';
    const mm = form.querySelector('#dob-month')?.value.trim() || '';
    const yy = form.querySelector('#dob-year')?.value.trim() || '';
    const email = form.querySelector('#email')?.value.trim() || '';

    const urlParams = new URLSearchParams(window.location.search);
    const t_id = urlParams.get('t_id') || crypto.randomUUID();

    sessionStorage.setItem('gender', gender);
    sessionStorage.setItem('firstname', firstname);
    sessionStorage.setItem('lastname', lastname);
    sessionStorage.setItem('dob_day', dd);
    sessionStorage.setItem('dob_month', mm);
    sessionStorage.setItem('dob_year', yy);
    sessionStorage.setItem('email', email);
    sessionStorage.setItem('t_id', t_id);
  }

  async function sendShortForm925() {
    try {
      const payload = window.buildPayload({ cid: 925, sid: 34 });
      // sanity: status=online in URL (zoals je 5.2 controle)
      if (!payload.f_1453_campagne_url?.includes('?status=online')) {
        console.warn('⚠️ f_1453_campagne_url mist ?status=online:', payload.f_1453_campagne_url);
      }
      console.log('📦 Short form → 925 payload:', payload);
      const res = await window.fetchLead(payload);
      console.log('✅ Short form verstuurd → 925:', res);
    } catch (e) {
      console.error('❌ Fout bij short form 925:', e);
    }
  }

  function nextSection(current, steps, skipOne = false) {
    const idx = steps.indexOf(current);
    if (idx === -1) return;
    current.style.display = 'none';
    const next = steps[idx + (skipOne ? 2 : 1)];
    if (next) {
      next.style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function init() {
    const params = new URLSearchParams(window.location.search);
    const statusParam = params.get('status');

    // Filter welke secties actief zijn
    const rawSteps = Array.from(document.querySelectorAll('.flow-section, .coreg-section'));
    const steps = rawSteps.filter(step => {
      if (statusParam === 'online') {
        return !step.classList.contains('status-live') && !step.classList.contains('ivr-section');
      }
      if (statusParam === 'live') return true;
      return true; // default: alles tonen volgens live
    });

    // Verberg alles, toon eerste
    steps.forEach((el, i) => el.style.display = i === 0 ? 'block' : 'none');

    // Koppel click-handlers
    steps.forEach((step, stepIndex) => {
      // 1) Short form doorgang op .flow-next in #lead-form
      const leadForm = step.querySelector('#lead-form');
      if (leadForm) {
        const goBtn = step.querySelector('.flow-next');
        if (goBtn) {
          goBtn.addEventListener('click', async () => {
            if (!validateLeadForm(leadForm)) return;
            storeLeadFormToSession(leadForm);
            await sendShortForm925();
            nextSection(step, steps, goBtn.classList.contains('skip-next-section'));
          });
        }
      }

      // 2) Generieke flow-next knoppen voor overige secties
      step.querySelectorAll('.flow-next').forEach(btn => {
        // skip als dit de short form knop is (al afgevangen)
        if (leadForm && btn === step.querySelector('.flow-next')) return;

        btn.addEventListener('click', () => {
          const skipNext = btn.classList.contains('skip-next-section');
          nextSection(step, steps, skipNext);
        });
      });

      // 3) Long form: init via formSubmit.js (laat eigen submit logica draaien)
      const longBtn = step.querySelector('#submit-long-form');
      if (longBtn && typeof window.setupFormSubmit === 'function') {
        // Zorg dat er niet dubbel geluisterd wordt
        if (!longBtn.dataset._initDone) {
          window.setupFormSubmit();
          longBtn.dataset._initDone = '1';
        }
      }
    });
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
