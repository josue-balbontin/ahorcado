
// Spanish word collection for the game
export const WORDS = [
  "CASA", "PERRO", "GATO", "ARBOL", "LIBRO",
  "JUEGO", "FELIZ", "TIEMPO", "AGUA", "FUEGO",
  "TIERRA", "AIRE", "AMIGO", "AMOR", "SOL",
  "LUNA", "COMER", "BEBER", "DORMIR", "HABLAR",
  "VIVIR", "MUNDO", "CIUDAD", "CAMPO", "MAR",
  "PLAYA", "CIELO", "NUBE", "LLUVIA", "NIEVE",
  "CALOR", "FRIO", "VERANO", "INVIERNO", "MUSICA",
  "BAILE", "CINE", "TEATRO", "ESCUELA", "TRABAJO",
  "DINERO", "FAMILIA", "PADRE", "MADRE", "HERMANO",
  "HERMANA", "HIJO", "HIJA", "ABUELO", "ABUELA"
];

// Get a random word from the list
export const getRandomWord = (): string => {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
};
