// coregPaths.js
export const coregPaths = {
  // ✅ STANDAARD PAD
  // - pakt ALLES uit Directus
  // - ook vragen zonder coreg_key
  // - geen filtering, geen herordening
  default: {
    mode: "all",
  },

  // ✅ DEDICATED PAGINA — ENERGY
  // - alleen vragen met coreg_key = "energie-direct"
  // - volgorde zoals hier opgegeven
  energie_direct: {
    mode: "keys",
    steps: ["energie-direct"],
  },
};
