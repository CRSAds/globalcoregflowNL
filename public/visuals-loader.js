// /public/visuals-loader.js
// ✅ Dynamisch laden van hero, background, ivr, titel en paragraaf uit Directus

(function () {
  console.log("🎨 visuals-loader.js gestart");

  async function loadVisuals() {
    try {
      const slug = window.CAMPAIGN_SLUG || "hotel-specials"; // 👈 centraal in body instellen
      const res = await fetch("https://globalcoregflow-nl.vercel.app/api/campaignVisuals.js");
      const { data } = await res.json();
      const visual = data.find(v => v.slug === slug);
      if (!visual) {
        console.warn("⚠️ Geen visuals gevonden voor:", slug);
        return;
      }

      // 🏷️ Titel (HTML behouden)
      const titleEl = document.getElementById("campaign-title");
      if (titleEl && visual.title) {
        titleEl.innerHTML = visual.title;
        // Swipe Pages styling behouden
        titleEl.style.margin = "";
        titleEl.style.padding = "";
      }

      // 📄 Paragraaf (HTML behouden)
      const paragraphEl = document.getElementById("campaign-paragraph");
      if (paragraphEl && visual.paragraph) {
        paragraphEl.innerHTML = visual.paragraph;
        paragraphEl.style.margin = "";
        paragraphEl.style.padding = "";
      }

      // 🖼️ Hero afbeelding — toepassen op ALLE secties
      const heroEls = document.querySelectorAll('[id="campaign-hero-image"]');
      if (heroEls.length && visual.hero_image) {
        heroEls.forEach(el => {
          el.src = visual.hero_image;
        });
      }
      
      // 🖼️ Horizontale hero afbeelding — toepassen op ALLE secties
      const horizontalHeroEls = document.querySelectorAll('[id="campaign-horizontal-hero-image"]');
      if (horizontalHeroEls.length && visual.horizontal_hero_image) {
        horizontalHeroEls.forEach(el => {
          el.src = visual.horizontal_hero_image;
        });
      }
      
      // ☎️ IVR afbeelding — toepassen op ALLE secties
      const ivrEls = document.querySelectorAll('[id="campaign-ivr-image"]');
      if (ivrEls.length && visual.ivr_image) {
        ivrEls.forEach(el => {
          el.src = visual.ivr_image;
        });
      }
      
      // 🌄 Achtergrond
      if (visual.background_image) {
      document.body.style.backgroundImage = `url('${visual.background_image}')`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
      document.body.style.backgroundRepeat = "no-repeat";
      document.body.style.backgroundAttachment = "fixed"; // optioneel: laat hem meescrollen
    }

      console.log("✅ Visuals succesvol geladen voor:", slug);
    } catch (err) {
      console.error("❌ Fout bij visuals-loader:", err);
    }
  }

  document.addEventListener("DOMContentLoaded", loadVisuals);
})();
