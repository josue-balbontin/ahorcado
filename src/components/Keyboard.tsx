
import React from 'react';

interface KeyboardProps {
  onGuess: (letter: string) => void;
  guessedLetters: Set<string>;
  correctLetters: Set<string>;
  incorrectLetters: Set<string>;
  disabled: boolean;
}

const Keyboard: React.FC<KeyboardProps> = ({
  onGuess,
  guessedLetters,
  correctLetters,
  incorrectLetters,
  disabled
}) => {
  const rows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
  ];

  const getKeyClass = (letter: string) => {
    if (correctLetters.has(letter)) return 'key-button key-button-correct';
    if (incorrectLetters.has(letter)) return 'key-button key-button-incorrect';
    if (guessedLetters.has(letter)) return 'key-button key-button-disabled';
    return disabled ? 'key-button key-button-disabled' : 'key-button key-button-enabled';
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-1 mb-2">
          {rowIndex === 2 && <div className="w-5"></div>}
          {row.map((letter) => (
            <button
              key={letter}
              className={getKeyClass(letter)}
              onClick={() => onGuess(letter)}
              disabled={disabled || guessedLetters.has(letter)}
            >
              {letter}
            </button>
          ))}
          {rowIndex === 2 && <div className="w-5"></div>}
        </div>
      ))}
    </div>
  );
};

export default Keyboard;
