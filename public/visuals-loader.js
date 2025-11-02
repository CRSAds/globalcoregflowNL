// /public/visuals-loader.js
// ✅ Dynamisch laden van hero, horizontal hero, background, IVR, titel en paragraaf uit Directus
//    + previews in Swipe Pages editor + fade-in effecten

(function () {
  console.log("🎨 visuals-loader.js gestart");

  async function loadVisuals() {
    try {
      const slug = window.CAMPAIGN_SLUG || "hotel-specials"; // 👈 centraal in body instellen
      const res = await fetch("https://globalcoregflow-nl.vercel.app/api/campaignVisuals.js");
      const { data } = await res.json();
      const visual = data.find(v => v.slug === slug);
      const host = window.location.hostname;
      const isEditor = host.includes("app.swipepages.com");

      // === PREVIEW DATA (voor Swipe Pages editor) ===
      const preview = {
        title: "<p><strong>Ontspan. Speel. Win.</strong></p>",
        paragraph:
          "<p>Even tijd voor ontspanning? Speel het beauty memory spel en maak kans op een Rituals cadeaubon van €250. Daarnaast geven we 10 extra cadeaubonnen van €25 weg. Een paar klikken en je doet al mee!</p>",
        hero_image: "https://via.placeholder.com/346x551?text=Hero+Preview",
        horizontal_hero_image: "https://via.placeholder.com/876x192?text=Horizontal+Hero",
        ivr_image: "https://via.placeholder.com/876x192?text=IVR+Preview",
        background_image: "https://via.placeholder.com/1600x900?text=Background+Preview"
      };

      // gebruik preview-data in editor, of echte data live
      const active = visual || (isEditor ? preview : null);
      if (!active) {
        console.warn("⚠️ Geen visuals gevonden voor:", slug);
        return;
      }

      // 🏷️ Titel (HTML behouden)
      const titleEl = document.getElementById("campaign-title");
      if (titleEl && active.title) {
        titleEl.innerHTML = active.title;
        titleEl.style.margin = "";
        titleEl.style.padding = "";
      }

      // 📄 Paragraaf (HTML behouden)
      const paragraphEl = document.getElementById("campaign-paragraph");
      if (paragraphEl && active.paragraph) {
        paragraphEl.innerHTML = active.paragraph;
        paragraphEl.style.margin = "";
        paragraphEl.style.padding = "";
      }

      // 🖼️ Hero afbeelding (staand)
      const heroEl = document.getElementById("campaign-hero-image");
      if (heroEl && active.hero_image) {
        heroEl.style.opacity = "0";
        heroEl.onload = () => (heroEl.style.opacity = "1");
        heroEl.src = active.hero_image;
        heroEl.style.transition = "opacity 0.8s ease";
      }

      // 🖼️ Horizontale hero afbeelding (liggend)
      const horizontalHeroEl = document.getElementById("campaign-horizontal-hero-image");
      if (horizontalHeroEl && active.horizontal_hero_image) {
        horizontalHeroEl.style.opacity = "0";
        horizontalHeroEl.onload = () => (horizontalHeroEl.style.opacity = "1");
        horizontalHeroEl.src = active.horizontal_hero_image;
        horizontalHeroEl.style.transition = "opacity 0.8s ease";
      }

      // ☎️ IVR afbeelding
      const ivrEl = document.getElementById("campaign-ivr-image");
      if (ivrEl && active.ivr_image) {
        ivrEl.style.opacity = "0";
        ivrEl.onload = () => (ivrEl.style.opacity = "1");
        ivrEl.src = active.ivr_image;
        ivrEl.style.transition = "opacity 0.8s ease";
      }

      // 🌄 Achtergrond (beeldvullend)
      const bgEl = document.getElementById("campaign-background");
      if (bgEl && active.background_image) {
        bgEl.style.backgroundImage = `url('${active.background_image}')`;
        bgEl.style.backgroundSize = "cover";
        bgEl.style.backgroundPosition = "center";
        bgEl.style.backgroundRepeat = "no-repeat";
        bgEl.style.transition = "background-image 0.8s ease";
      }

      console.log(`✅ Visuals succesvol geladen voor: ${isEditor ? "Editor Preview" : slug}`);
    } catch (err) {
      console.error("❌ Fout bij visuals-loader:", err);
    }
  }

  document.addEventListener("DOMContentLoaded", loadVisuals);
})();
