const campaigns = {
  "campaign-nationale-kranten": {
    type: "single",
    title: "Welke is jouw favoriet?",
    description: "Geef hieronder aan van welke krant jij graag dagelijks per e-mail de nieuwsbrief zou willen ontvangen.",
    positiveAnswers: [
      "Ja, De Volkskrant",
      "Ja, Algemeen Dagblad",
      "Ja, Trouw",
      "Ja, Het Parool"
    ]
  },

  "campaign-regionale-kranten": {
    type: "dropdown",
    title: "Welke regionale krant wil je ontvangen?",
    description: "Kies jouw favoriete regionale krant en ontvang dagelijks de nieuwsbrief per e-mail.",
    options: [
      { value: "brabants", label: "Brabants Dagblad" },
      { value: "tubantia", label: "Tubantia" },
      { value: "pzc", label: "PZC" },
      { value: "gelderlander", label: "De Gelderlander" }
    ]
  },

  "campaign-trefzeker": {
    type: "multistep",
    step1: {
      title: "Wil je een energieaanbod ontvangen?",
      description: "Onze partner Trefzeker helpt je graag met het vergelijken van energietarieven.",
      positiveText: "Ja, ik wil een aanbod",
      negativeText: "Nee, geen interesse"
    },
    step2: {
      title: "Wie is je huidige energieleverancier?",
      description: "Selecteer hieronder je huidige leverancier.",
      options: [
        { value: "essent", label: "Essent" },
        { value: "vandebron", label: "Van de Bron" },
        { value: "budget", label: "Budget Energie" }
      ]
    }
  }
};

export default campaigns;
