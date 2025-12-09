<script>
// =====================================================================
// 🌊 flowLogger.js – centrale logger voor flow events
// =====================================================================
(function () {
  const ENDPOINT = "https://globalcoregflow-nl.vercel.app/api/flow-log.js";

  // --------- basis logger ----------
  function flowLog(event, extra) {
    try {
      const payload = {
        event,
        ts: Date.now(),
        url: window.location.href,
        ...(extra || {})
      };

      fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true
      });
    } catch (e) {
      // stil falen
      console && console.warn && console.warn("flowLog failed", e);
    }
  }

  // --------- sectie-visibility logger ----------
  const loggedSections = new Set();

  function logSectionVisibility(sectionEl) {
    if (!sectionEl || !sectionEl.classList) return;

    const cls = Array.from(sectionEl.classList).find(c => c.startsWith("section-"));
    if (!cls) return;

    const key = cls;
    if (loggedSections.has(key)) return;
    loggedSections.add(key);

    // section-shortform  -> section_shortform_visible
    // section-coreg      -> section_coreg_visible
    const name = cls.replace("section-", "").replace(/-/g, "_");
    const eventName = `section_${name}_visible`;

    flowLog(eventName);
  }

  // --------- expose global ----------
  window.flowLog = flowLog;
  window.logSectionVisibility = logSectionVisibility;

  // --------- landings-event ----------
  document.addEventListener("DOMContentLoaded", function () {
    flowLog("flow_landed");
  });
})();
</script>
