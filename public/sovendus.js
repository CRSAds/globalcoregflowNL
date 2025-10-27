let hasInitialized = false;

export default function setupSovendus() {
  if (hasInitialized) {
    console.log("⚠️ setupSovendus al uitgevoerd — wordt overgeslagen");
    return;
  }
  hasInitialized = true;

  console.log("👉 setupSovendus gestart");

  const containerId = 'sovendus-container-1';
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`❌ Container #${containerId} niet gevonden`);
    return;
  }

  // Verwijder eerder iframe
  container.innerHTML = '';

  // Laadbericht
  const loadingMessage = document.getElementById('sovendus-loading');
  if (!loadingMessage) {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'sovendus-loading';
    loadingDiv.style.textAlign = 'center';
    loadingDiv.style.padding = '16px';
    loadingDiv.innerHTML = `<p style="font-size: 16px;">Even geduld… jouw voordeel wordt geladen!</p>`;
    container.parentNode.insertBefore(loadingDiv, container);
  }

  // Data ophalen uit sessionStorage
  const t_id = sessionStorage.getItem('t_id') || crypto.randomUUID();
  const gender = sessionStorage.getItem('gender') || '';
  const firstname = sessionStorage.getItem('firstname') || '';
  const lastname = sessionStorage.getItem('lastname') || '';
  const email = sessionStorage.getItem('email') || '';
  const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);

  // Zet globale variabelen voor Sovendus
  window.sovConsumer = {
    consumerSalutation: gender,
    consumerFirstName: firstname,
    consumerLastName: lastname,
    consumerEmail: email
  };

  window.sovIframes = window.sovIframes || [];
  window.sovIframes.push({
    trafficSourceNumber: '5592',
    trafficMediumNumber: '1',
    sessionId: t_id,
    timestamp: timestamp,
    orderId: '',
    orderValue: '',
    orderCurrency: '',
    usedCouponCode: '',
    iframeContainerId: containerId
  });

  // Laad het externe script
  const script = document.createElement('script');
  script.src = 'https://api.sovendus.com/sovabo/common/js/flexibleIframe.js';
  script.async = true;

  script.onload = () => {
    console.log('✅ Sovendus → flexibleIframe.js geladen');
    document.getElementById('sovendus-loading')?.remove();
  };

  script.onerror = () => {
    console.error('❌ Fout bij laden van flexibleIframe.js');
  };

  document.body.appendChild(script);
}

// --- Automatisch starten zodra de sectie zichtbaar wordt ---
document.addEventListener("DOMContentLoaded", () => {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setupSovendus();
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  const sovendusSection = document.getElementById('sovendus-section');
  if (sovendusSection) observer.observe(sovendusSection);
});

window.setupSovendus = setupSovendus;
