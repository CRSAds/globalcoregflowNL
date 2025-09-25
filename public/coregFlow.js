// coregFlow.js
// Alle coreg campagnes + rendering + flow logica

const sponsorCampaigns = {
  "campaign-nationale-kranten": {
    type: "single",
    title: "Welke is jouw favoriet?",
    description:
      "Geef hieronder aan van welke krant jij graag dagelijks per e-mail de nieuwsbrief zou willen ontvangen.",
    image: "https://globalcoregflow-nl.vercel.app/images/Nationale-Kranten.png",
    positiveAnswers: [
      "Ja, De Volkskrant",
      "Ja, Algemeen Dagblad",
      "Ja, Trouw",
      "Ja, Het Parool"
    ],
    cid: 3534,
    sid: 34,
    coregAnswerKey: "coreg_answer_campaign-nationale-kranten"
  },

  "campaign-regionale-kranten": {
    type: "dropdown",
    title: "Jouw regio, Jouw nieuws!",
    description:
      "Ontvang dagelijks de belangrijkste updates uit jouw omgeving rechtstreeks in je inbox.<br><b>Kies je favoriet</b> en blijf altijd op de hoogte van wat er speelt.",
    image: "https://globalcoregflow-nl.vercel.app/images/Nationale-Kranten.png",
    options: [
      { value: "de-stentor", label: "de Stentor" },
      { value: "bn-destem", label: "BN DeStem" },
      { value: "de-gelderlander", label: "de Gelderlander" },
      { value: "brabants-dagblad", label: "Brabants Dagblad" },
      { value: "tubantia", label: "Tubantia" },
      { value: "eindhovens-dagblad", label: "Eindhovens Dagblad" },
      { value: "pzc", label: "PZC" }
    ],
    cid: 4196,
    sid: 34,
    coregAnswerKey: "coreg_answer_campaign-regionale-kranten",
    answerFieldKey: "f_2575_coreg_answer_dropdown"
  },

  "campaign-trefzeker": {
    type: "multistep",
    step1: {
      title: "Betaal jij nog te veel voor je energie rekening?",
      description:
        "Stop met te veel betalen! Met onze gratis check kun je direct beginnen met besparen op jouw energie rekening. Mogen wij jou vrijblijvend bellen voor de bespaar check?",
      positiveText: "Ja, graag",
      negativeText: "Sla over, geen interesse"
    },
    step2: {
      title: "Wie is je huidige energieleverancier?",
      description: "Selecteer hieronder je huidige leverancier.",
      options: [
        { value: "Vattenfall", label: "Vattenfall" },
        { value: "Essent", label: "Essent" },
        { value: "Eneco", label: "Eneco" },
        { value: "Budget Energie", label: "Budget Energie" },
        { value: "Greenchoice", label: "Greenchoice" },
        { value: "ENGIE", label: "ENGIE" },
        { value: "Oxxio", label: "Oxxio" },
        { value: "Pure Energie", label: "Pure Energie" },
        { value: "Vandebron", label: "Vandebron" },
        { value: "Delta", label: "Delta" },
        { value: "Anders", label: "Anders" }
      ]
    },
    image: "https://globalcoregflow-nl.vercel.app/images/Trefzeker Prijzen Coreg.png",
    cid: 5017,
    sid: 496,
    coregAnswerKey: "coreg_answer_campaign-trefzeker",
    answerFieldKey: "f_2575_coreg_answer_dropdown",
    hasCoregFlow: true,
    requiresLongForm: true
  },

  "campaign-kiosk": {
    type: "single",
    title: "Lees alle bladen voordeliger",
    description:
      "Ontvang 2x per maand per email gratis de Kiosk.nl nieuwsbrief met daarin de leukste artikelen, aanbiedingen en prijsvragen. Wil je onze nieuwsbrief ontvangen?",
    image: "https://globalcoregflow-nl.vercel.app/images/Kiosk Banner.webp",
    positiveAnswers: ["Ja, leuk"],
    cid: 6001,
    sid: 34,
    coregAnswerKey: "coreg_answer_campaign-kiosk"
  },

  "campaign-generationzero": {
    type: "single",
    title: "Wil je meer weten over Generation Zero?",
    description: "Ontvang updates en exclusieve content over Generation Zero.",
    image: "https://globalcoregflow-nl.vercel.app/images/GenZero Coreg.png",
    positiveAnswers: ["Ja, ik wil informatie ontvangen"],
    cid: 6002,
    sid: 34,
    coregAnswerKey: "coreg_answer_campaign-generationzero",
    requiresLongForm: true
  },

  "campaign-mycollections": {
    type: "single",
    title: "Wat spreekt u het meest aan?",
    description:
      "Ontdek My Collections: exclusieve verzamelingen met een gratis cadeau. Interesse in een telefonisch aanbod? Zo ja, wat is uw favoriete categorie?",
    image: "https://globalcoregflow-nl.vercel.app/images/MyCollections Banner.webp",
    positiveAnswers: [
      "Ja, topboeken",
      "Ja, kookboeken",
      "Ja, romans",
      "Ja, kristallen beeldjes"
    ],
    cid: 1882,
    sid: 34,
    coregAnswerKey: "coreg_answer_campaign-mycollections",
    requiresLongForm: true
  },

  "campaign-raadselgids": {
    type: "single",
    title: "Wil jij een Gratis Puzzelboek?",
    description:
      "Mag Raadselgids jou eenmalig bellen met een leuk puzzelaanbod? Los puzzels op, verdien punten en ruil in voor mooie prijzen!",
    image: "https://globalcoregflow-nl.vercel.app/images/raadselgids.png",
    positiveAnswers: ["Ja, graag"],
    cid: 4621,
    sid: 34,
    coregAnswerKey: "coreg_answer_campaign-raadselgids",
    requiresLongForm: true
  }
};

// ============== Renderer & Flow logica (ongewijzigd behalve requiresLongForm gebruik) ==============
// ... (zelfde rendering en initCoregFlow code als in mijn vorige versie)
// Je hoeft alleen sponsorCampaigns hierboven te vervangen in je huidige coregFlow.js
