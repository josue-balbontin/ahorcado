
// Colecciones de palabras relacionadas con software para el juego
export const WORDS_EASY = [
  "HTML", "JAVA", "PHP", "RUBY", "RUST", 
  "DATO", "CODE", "BOOT", "LINK", "FILE",
  "MENU", "BYTE", "CHAT", "BLOG", "GAME",
  "TEXT", "ICON", "WIFI", "CLIP", "BYTE"
];

export const WORDS_MEDIUM = [
  "PYTHON", "SCRIPT", "GITHUB", "NUBE", "ARRAY", 
  "CODIGO", "FUNCION", "CLASE", "MÉTODO", "DATOS",
  "SERVIDOR", "CLIENTE", "BUCLE", "PROXY", "BACKUP",
  "DOCKER", "PLUGIN", "SCRUM", "LIBRERÍA", "VISTA"
];

export const WORDS_HARD = [
  "FRAMEWORK", "ALGORITMO", "SOFTWARE", "FRONTEND", "BACKEND", 
  "RECURSIVIDAD", "TYPESCRIPT", "COMPILADOR", "DEPURADOR", "ANALÍTICA",
  "JAVASCRIPT", "PROTOTIPO", "VIRTUALIZACIÓN", "MICROSERVICIO", "CONTENEDOR",
  "RENDERIZADO", "ENCRIPTACIÓN", "MIDDLEWARE", "INFRAESTRUCTURA", "ESCALABILIDAD"
];

// Niveles de dificultad
export enum Difficulty {
  EASY = "easy",
  MEDIUM = "medium",
  HARD = "hard"
}

// Obtener una palabra aleatoria según la dificultad
export const getRandomWord = (difficulty: Difficulty): string => {
  let wordList: string[] = WORDS_EASY;
  
  switch (difficulty) {
    case Difficulty.EASY:
      wordList = WORDS_EASY;
      break;
    case Difficulty.MEDIUM:
      wordList = WORDS_MEDIUM;
      break;
    case Difficulty.HARD:
      wordList = WORDS_HARD;
      break;
  }
  
  return wordList[Math.floor(Math.random() * wordList.length)];
};
