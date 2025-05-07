
import React from 'react';

interface WordDisplayProps {
  word: string;
  guessedLetters: Set<string>;
  gameOver: boolean;
}

const WordDisplay: React.FC<WordDisplayProps> = ({ word, guessedLetters, gameOver }) => {
  return (
    <div className="flex justify-center flex-wrap gap-1 mb-8">
      {[...word].map((letter, index) => {
        const isRevealed = guessedLetters.has(letter) || gameOver;
        return (
          <div key={index} className="word-letter">
            {isRevealed ? letter : ''}
          </div>
        );
      })}
    </div>
  );
};

export default WordDisplay;
