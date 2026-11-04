export const SENTENCES = [
  "Nie rozumiem, co ty mówisz.",
  "Dzień dobry, jak się dzisiaj czujesz?",
  "Gdzie jest najbliższy przystanek autobusowy?",
  "Dziękuję za pomoc i miłe spotkanie."
];

export const SENTENCE_GLOSS_LIST: string[][] = [
  ["JA", "NIE-ROZUMIEM", "TY", "CO", "MÓWIĆ", "CO"],
  ["DZIEŃ-DOBRY", "JAK", "TY", "CZUJESZ", "DZISIAJ"],
  ["PRZYSTANEK", "AUTOBUSOWY", "NAJBLIŻSZY", "GDZIE"],
  ["DZIĘKUJĘ", "POMOC", "SPOTKANIE", "MIŁE"]
];

export const GLOSSES = SENTENCE_GLOSS_LIST.map((list) => list.join(" - "));

export const SENTENCE_OPTIONS = SENTENCES.map((sentence, index) => ({
  value: sentence,
  label: `${index + 1}. ${sentence}`
}));
