<script>
// =====================================================================
// 🌊 flowLogger.js – centrale logger voor alle flows
// - Werkt puur op basis van .flow-section + class "log-*"
// - Stuurt events naar /api/flow-log.js → Supabase + Directus
// - Voorbeeld: <div class="flow-section log-shortform"> ⇒ event: "shortform_visible"
// =====================================================================
(function () {
  const ENDPOINT = "https://globalcoregflow-nl.vercel.app/api/flow-log.js";

  // Events die we al voor deze bezoeker hebben verstuurd (per t_id + event)
  const sentEvents = new Set();

  // --------------------------------------------------
  // Hulpfunctie: haal t_id uit de URL (voor dedupe-key)
  // --------------------------------------------------
  function getTidFromUrl() {
    try {
      const u = new URL(window.location.href);
      return u.searchParams.get("t_id") || "no_tid";
    } catch {
      return "no_tid";
    }
  }

  // --------------------------------------------------
  // Basis logger
  // --------------------------------------------------
  function flowLog(event, extra) {
    try {
      const url = window.location.href;
      const t_id = getTidFromUrl();
      const key = `${t_id}|${event}`;

      // Dubbele events voor dezelfde bezoeker vermijden
      if (sentEvents.has(key)) return;
      sentEvents.add(key);

      const payload = {
        event,
        ts: Date.now(),
        url,
        ua: navigator.userAgent,
        ...(extra || {})
      };

      fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(() => {});
    } catch (e) {
      if (window.console && console.warn) {
        console.warn("flowLog failed", e);
      }
    }
  }

  // --------------------------------------------------
  // Sectie → eventnaam
  // <div class="flow-section log-shortform"> → "shortform_visible"
  // --------------------------------------------------
  function getEventNameForSection(el) {
    if (!el || !el.classList) return null;

    const logClass = Array.from(el.classList).find(c => c.startsWith("log-"));
    if (!logClass) return null;

    const base = logClass.replace(/^log-/, "");   // log-shortform → shortform
    if (!base) return null;

    return `${base}_visible`;                    // shortform_visible
  }

  // --------------------------------------------------
  // Check of sectie nu zichtbaar is; zo ja → log event
  // --------------------------------------------------
  function checkSectionVisibility(el) {
    if (!el) return;

    const eventName = getEventNameForSection(el);
    if (!eventName) return;

    const style = window.getComputedStyle(el);
    const visible =
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      el.offsetHeight > 0 &&
      el.offsetWidth > 0;

    if (!visible) return;

    flowLog(eventName);
  }

  // --------------------------------------------------
  // Scan alle bestaande secties één keer
  // --------------------------------------------------
  function scanAllSections() {
    const sections = document.querySelectorAll(".flow-section, .ivr-section, .coreg-section");
    sections.forEach(checkSectionVisibility);
  }

  // --------------------------------------------------
  // MutationObserver: reageer op show/hide van secties
  // (style / class wijzigt, of er worden nieuwe secties toegevoegd)
  // --------------------------------------------------
  function setupObserver() {
    if (!window.MutationObserver) {
      // Fallback: elke 2s even checken
      setInterval(scanAllSections, 2000);
      return;
    }

    const observer = new MutationObserver(mutations => {
      for (const m of mutations) {
        if (m.type === "attributes" && (m.attributeName === "style" || m.attributeName === "class")) {
          const el = m.target;
          if (!el || !el.classList) continue;
          if (el.classList.contains("flow-section") ||
              el.classList.contains("ivr-section") ||
              el.classList.contains("coreg-section")) {
            checkSectionVisibility(el);
          }
        }

        if (m.type === "childList" && m.addedNodes.length) {
          m.addedNodes.forEach(node => {
            if (!(node instanceof HTMLElement)) return;

            if (node.classList &&
               (node.classList.contains("flow-section") ||
                node.classList.contains("ivr-section") ||
                node.classList.contains("coreg-section"))) {
              checkSectionVisibility(node);
            }

            // Ook eventuele nested secties
            node.querySelectorAll?.(".flow-section, .ivr-section, .coreg-section")
              .forEach(checkSectionVisibility);
          });
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class"]
    });
  }

  // --------------------------------------------------
  // Globale helpers (optioneel vanuit andere scripts)
  // --------------------------------------------------
  window.flowLog = flowLog;
  window.logSectionVisibility = function (el) {
    // als initFlow expliciet iets doorgeeft, laten we dat netjes via dezelfde weg lopen
    checkSectionVisibility(el);
  };

  // --------------------------------------------------
  // Start logger bij pageload
  // --------------------------------------------------
  document.addEventListener("DOMContentLoaded", function () {
    // Landings-event
    flowLog("flow_landed");

    // Direct een eerste scan + observer
    scanAllSections();
    setupObserver();
  });
})();
</script>
