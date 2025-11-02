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

      // 🖼️ Hero afbeelding
      const heroEl = document.getElementById("campaign-hero-image");
      if (heroEl && visual.hero_image) heroEl.src = visual.hero_image;

      // 🖼️ Horizontale hero afbeelding
      const horizontalHeroEl = document.getElementById("campaign-horizontal-hero-image");
      if (horizontalHeroEl && visual.horizontal_hero_image) horizontalHeroEl.src = visual.horizontal_hero_image;

      // ☎️ IVR afbeelding
      const ivrEl = document.getElementById("campaign-ivr-image");
      if (ivrEl && visual.ivr_image) ivrEl.src = visual.ivr_image;

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
