// /public/cosponsors.js
(function () {
  console.log("🎯 coSponsors.js gestart");

  // Dynamisch element voor popup injecteren
  const popupHTML = `
    <div id="sponsor-popup" class="sponsor-popup" style="display:none;">
      <div class="sponsor-popup-overlay"></div>
      <div class="sponsor-popup-content">
        <button id="close-popup">×</button>
        <h2>Onze partners</h2>
        <div id="sponsor-list" class="sponsor-list">Laden...</div>
      </div>
    </div>
    <button id="open-sponsor-popup" class="popup-trigger">Bekijk alle partners</button>
  `;

  document.addEventListener("DOMContentLoaded", async () => {
    // Voeg popup toe aan DOM
    const container = document.createElement("div");
    container.innerHTML = popupHTML;
    document.body.appendChild(container);

    const popup = document.getElementById("sponsor-popup");
    const sponsorList = document.getElementById("sponsor-list");

    // Popup gedrag
    document.getElementById("open-sponsor-popup").addEventListener("click", () => {
      popup.style.display = "flex";
    });
    document.getElementById("close-popup").addEventListener("click", () => {
      popup.style.display = "none";
    });
    document.querySelector(".sponsor-popup-overlay")?.addEventListener("click", () => {
      popup.style.display = "none";
    });

    // CSS dynamisch injecteren
    const style = document.createElement("style");
    style.textContent = `
      .sponsor-popup {
        position: fixed; top: 0; left: 0;
        width: 100%; height: 100%;
        display: flex; align-items: center; justify-content: center;
        z-index: 9999;
      }
      .sponsor-popup-overlay {
        position: absolute; width: 100%; height: 100%;
        background: rgba(0,0,0,0.6);
      }
      .sponsor-popup-content {
        position: relative;
        background: white;
        max-width: 700px; width: 90%;
        padding: 30px; border-radius: 10px;
        z-index: 10000;
        overflow-y: auto; max-height: 80vh;
        font-family: sans-serif;
      }
      .sponsor-list { display: flex; flex-direction: column; gap: 20px; margin-top: 15px; }
      .sponsor-item { border-bottom: 1px solid #ddd; padding-bottom: 15px; display: flex; align-items: flex-start; gap: 15px; }
      .sponsor-item img { width: 80px; height: auto; flex-shrink: 0; }
      .sponsor-item h4 { margin: 0 0 5px 0; }
      #open-sponsor-popup {
        background: #4f46e5; color: #fff;
        padding: 10px 20px; border: none;
        border-radius: 6px; cursor: pointer;
        font-weight: 600;
      }
      #close-popup {
        position: absolute; top: 10px; right: 15px;
        font-size: 24px; background: none; border: none; cursor: pointer;
      }
    `;
    document.head.appendChild(style);

    // Data ophalen van Directus via Vercel API
    try {
      const res = await fetch("https://globalcoregflow-nl.vercel.app/api/cosponsors.js");
      const json = await res.json();

      sponsorList.innerHTML = "";

      if (json.data && json.data.length > 0) {
        json.data.forEach(s => {
          const div = document.createElement("div");
          div.className = "sponsor-item";
          div.innerHTML = `
            <img src="https://cms.core.909play.com/assets/${s.logo}" alt="${s.title}" />
            <div>
              <h4>${s.title}</h4>
              <p>${s.description}</p>
              <small>${(s.address || "").replace(/\n/g, "<br>")}</small><br>
              <a href="${s.privacy_url}" target="_blank">Privacybeleid</a>
            </div>
          `;
          sponsorList.appendChild(div);
        });
      } else {
        sponsorList.innerHTML = "<p>Geen actieve sponsors gevonden.</p>";
      }
    } catch (err) {
      console.error("❌ Fout bij ophalen sponsors:", err);
      sponsorList.innerHTML = "<p>Er ging iets mis bij het laden van de sponsorlijst.</p>";
    }
  });
})();
