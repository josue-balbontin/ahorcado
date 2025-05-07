
// Maximum number of incorrect guesses allowed before game over
export const MAX_MISTAKES = 6;

// Check if the guessed letter is in the word
export const checkLetter = (word: string, letter: string): boolean => {
  return word.includes(letter);
};

// Check if the player has won the game
export const checkWin = (word: string, guessedLetters: Set<string>): boolean => {
  return [...word].every(letter => guessedLetters.has(letter));
};

// Check if the player has lost the game
export const checkLoss = (word: string, guessedLetters: Set<string>): boolean => {
  const incorrectGuesses = [...guessedLetters].filter(letter => !word.includes(letter));
  return incorrectGuesses.length >= MAX_MISTAKES;
};

// Get the number of incorrect guesses
export const getIncorrectGuessCount = (word: string, guessedLetters: Set<string>): number => {
  return [...guessedLetters].filter(letter => !word.includes(letter)).length;
};
