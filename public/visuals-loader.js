// ✅ visuals-loader.js — stabiele versie met preload + gegarandeerde klaar-melding

(function () {
  console.log("🎨 visuals-loader.js gestart");

  async function loadVisuals() {
    try {
      const slug = window.CAMPAIGN_SLUG || "hotel-specials";
      const res = await fetch("https://globalcoregflow-nl.vercel.app/api/campaignVisuals.js");
      const { data } = await res.json();
      const visual = data.find(v => v.slug === slug);

      if (!visual) {
        console.warn("⚠️ Geen visuals gevonden voor:", slug);
        window.dispatchEvent(new Event("visuals:assets-ready"));
        return;
      }

      // 🏷️ Titel
      const titleEl = document.getElementById("campaign-title");
      if (titleEl && visual.title) {
        titleEl.innerHTML = visual.title;
        titleEl.style.margin = "";
        titleEl.style.padding = "";
      }

      // 📄 Paragraaf
      const paragraphEl = document.getElementById("campaign-paragraph");
      if (paragraphEl && visual.paragraph) {
        paragraphEl.innerHTML = visual.paragraph;
        paragraphEl.style.margin = "";
        paragraphEl.style.padding = "";
      }

      // 🖼️ Hero afbeelding — alle secties
      const heroEls = document.querySelectorAll('[id="campaign-hero-image"]');
      heroEls.forEach(el => {
        el.style.opacity = "0";
        el.style.transition = "opacity 0.6s ease";
        el.onload = () => (el.style.opacity = "1");
        if (visual.hero_image) el.src = visual.hero_image;
      });

      // 🖼️ Horizontale hero afbeelding
      const horizontalHeroEls = document.querySelectorAll('[id="campaign-horizontal-hero-image"]');
      horizontalHeroEls.forEach(el => {
        el.style.opacity = "0";
        el.style.transition = "opacity 0.6s ease";
        el.onload = () => (el.style.opacity = "1");
        if (visual.horizontal_hero_image) el.src = visual.horizontal_hero_image;
      });

      // ☎️ IVR afbeelding
      const ivrEls = document.querySelectorAll('[id="campaign-ivr-image"]');
      ivrEls.forEach(el => {
        el.style.opacity = "0";
        el.style.transition = "opacity 0.6s ease";
        el.onload = () => (el.style.opacity = "1");
        if (visual.ivr_image) el.src = visual.ivr_image;
      });

      // 🌄 Achtergrond fade
      const bgEl = document.getElementById("campaign-background");
      if (bgEl && visual.background_image) {
        bgEl.style.opacity = "0";
        bgEl.style.transition = "opacity .6s ease";
        const bgImg = new Image();
        bgImg.onload = () => (bgEl.style.opacity = "1");
        bgImg.onerror = () => (bgEl.style.opacity = "1");
        bgImg.src = visual.background_image;
        bgEl.style.backgroundImage = `url('${visual.background_image}')`;
        bgEl.style.backgroundSize = "cover";
        bgEl.style.backgroundPosition = "center";
        bgEl.style.backgroundRepeat = "no-repeat";
      }

      // === Preload & klaar-signaal ===
      function preload(url) {
        return new Promise(resolve => {
          if (!url) return resolve();
          const img = new Image();
          img.onload = img.onerror = () => resolve();
          img.src = url;
        });
      }

      const waits = [
        preload(visual.hero_image),
        preload(visual.horizontal_hero_image),
        preload(visual.ivr_image),
        preload(visual.background_image)
      ];
      const timeout = new Promise(resolve => setTimeout(resolve, 1500));

      Promise.race([Promise.allSettled(waits), timeout]).then(() => {
        window.dispatchEvent(new Event("visuals:assets-ready"));
      });

      console.log("✅ Visuals geladen voor:", slug);
      window.dispatchEvent(new Event("visuals:assets-ready")); // altijd signaal sturen
    } catch (err) {
      console.error("❌ Fout bij visuals-loader:", err);
      // stuur altijd event ook bij fout
      window.dispatchEvent(new Event("visuals:assets-ready"));
    }
  }

  document.addEventListener("DOMContentLoaded", loadVisuals);
})();
