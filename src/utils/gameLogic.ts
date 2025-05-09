
// Número máximo de errores permitidos antes de que termine el juego
export const MAX_MISTAKES = 6;

// Niveles de dificultad
export enum GamePhase {
  PHASE_1 = 1,
  PHASE_2 = 2,
  PHASE_3 = 3,
  COMPLETED = 4
}

// Verificar si la letra adivinada está en la palabra
export const checkLetter = (word: string, letter: string): boolean => {
  return word.includes(letter);
};

// Verificar si el jugador ha ganado la fase actual
export const checkWin = (word: string, guessedLetters: Set<string>): boolean => {
  return [...word].every(letter => guessedLetters.has(letter));
};

// Verificar si el jugador ha perdido la fase actual
export const checkLoss = (word: string, guessedLetters: Set<string>): boolean => {
  const incorrectGuesses = [...guessedLetters].filter(letter => !word.includes(letter));
  return incorrectGuesses.length >= MAX_MISTAKES;
};

// Obtener el número de adivinanzas incorrectas
export const getIncorrectGuessCount = (word: string, guessedLetters: Set<string>): number => {
  return [...guessedLetters].filter(letter => !word.includes(letter)).length;
};

// Obtener la siguiente fase del juego
export const getNextPhase = (currentPhase: GamePhase): GamePhase => {
  switch (currentPhase) {
    case GamePhase.PHASE_1:
      return GamePhase.PHASE_2;
    case GamePhase.PHASE_2:
      return GamePhase.PHASE_3;
    case GamePhase.PHASE_3:
      return GamePhase.COMPLETED;
    default:
      return GamePhase.PHASE_1;
  }
};

// Verificar si el juego está completamente ganado (todas las fases)
export const isGameCompleted = (phase: GamePhase): boolean => {
  return phase === GamePhase.COMPLETED;
};
