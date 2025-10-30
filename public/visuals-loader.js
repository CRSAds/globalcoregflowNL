// /public/visuals-loader.js
// ✅ Dynamisch laden van hero, background, ivr, titel en paragraaf uit Directus

(function () {
  console.log("🎨 visuals-loader.js gestart");

  async function loadVisuals() {
    try {
      const slug = window.CAMPAIGN_SLUG || "hotel-specials"; // 👈 of stel via inline script
      const res = await fetch("https://globalcoregflow-nl.vercel.app/api/campaignVisuals.js");
      const { data } = await res.json();
      const visual = data.find(v => v.slug === slug);
      if (!visual) {
        console.warn("⚠️ Geen visuals gevonden voor:", slug);
        return;
      }

      // 🏷️ Titel
      const titleEl = document.getElementById("campaign-title");
      if (titleEl && visual.title) titleEl.textContent = visual.title;

      // 📄 Paragraaf
      const paragraphEl = document.getElementById("campaign-paragraph");
      if (paragraphEl && visual.paragraph) paragraphEl.innerHTML = visual.paragraph;

      // 🖼️ Hero afbeelding
      const heroEl = document.getElementById("campaign-hero-image");
      if (heroEl && visual.hero_image) heroEl.src = visual.hero_image;

      // ☎️ IVR afbeelding
      const ivrEl = document.getElementById("campaign-ivr-image");
      if (ivrEl && visual.ivr_image) ivrEl.src = visual.ivr_image;

      // 🌄 Achtergrond
      const bgEl = document.getElementById("campaign-background");
      if (bgEl && visual.background_image) {
        bgEl.style.backgroundImage = `url('${visual.background_image}')`;
        bgEl.style.backgroundSize = "cover";
        bgEl.style.backgroundPosition = "center";
      }

      console.log("✅ Visuals succesvol geladen voor:", slug);
    } catch (err) {
      console.error("❌ Fout bij visuals-loader:", err);
    }
  }

  document.addEventListener("DOMContentLoaded", loadVisuals);
})();
