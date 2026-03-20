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

      // 🏷️ Tekst aanpassen
      const titleEl = document.getElementById("campaign-title");
      if (titleEl && visual.title) titleEl.innerHTML = visual.title;

      const paragraphEl = document.getElementById("campaign-paragraph");
      if (paragraphEl && visual.paragraph) paragraphEl.innerHTML = visual.paragraph;

      // 🖼️ Afbeeldingen instellen (zonder src direct te tonen)
      const setImage = (selector, url) => {
        const els = document.querySelectorAll(`[id="${selector}"]`);
        els.forEach(el => {
          el.style.opacity = "0";
          el.style.transition = "opacity 0.6s ease";
          el.onload = () => (el.style.opacity = "1");
          if (url) el.src = url;
        });
      };

      setImage("campaign-hero-image", visual.hero_image);
      setImage("campaign-horizontal-hero-image", visual.horizontal_hero_image);
      setImage("campaign-ivr-image", visual.ivr_image);

      if (visual.background_image) {
        document.body.style.backgroundImage = `url('${visual.background_image}')`;
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundAttachment = "fixed";
      }

      // === Preload Logica ===
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

      // Wacht maximaal 1.5 seconden op de plaatjes, daarna loader weg
      const timeout = new Promise(resolve => setTimeout(resolve, 1500));

      Promise.race([Promise.allSettled(waits), timeout]).then(() => {
        console.log("✅ Visuals assets klaar of timeout bereikt");
        window.dispatchEvent(new Event("visuals:assets-ready"));
      });

    } catch (err) {
      console.error("❌ Fout bij visuals-loader:", err);
      window.dispatchEvent(new Event("visuals:assets-ready"));
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadVisuals);
  } else {
    loadVisuals();
  }
})();
