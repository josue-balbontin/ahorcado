
import React from 'react';
import { MAX_MISTAKES } from '@/utils/gameLogic';

interface HangmanProps {
  incorrectGuesses: number;
}

const Hangman: React.FC<HangmanProps> = ({ incorrectGuesses }) => {
  const progress = incorrectGuesses / MAX_MISTAKES;

  return (
    <div className="w-full mx-auto">
      <svg viewBox="0 0 200 200" className="w-full max-w-xs mx-auto h-auto">
        {/* Gallows */}
        <line x1="40" y1="180" x2="160" y2="180" className="hangman-part" />
        <line x1="60" y1="180" x2="60" y2="20" className="hangman-part" />
        <line x1="60" y1="20" x2="120" y2="20" className="hangman-part" />
        <line x1="120" y1="20" x2="120" y2="40" className="hangman-part" />

        {/* Head */}
        {incorrectGuesses >= 1 && (
          <circle cx="120" cy="55" r="15" className="hangman-part fill-none" />
        )}

        {/* Body */}
        {incorrectGuesses >= 2 && (
          <line x1="120" y1="70" x2="120" y2="110" className="hangman-part" />
        )}

        {/* Left Arm */}
        {incorrectGuesses >= 3 && (
          <line x1="120" y1="80" x2="100" y2="95" className="hangman-part" />
        )}

        {/* Right Arm */}
        {incorrectGuesses >= 4 && (
          <line x1="120" y1="80" x2="140" y2="95" className="hangman-part" />
        )}

        {/* Left Leg */}
        {incorrectGuesses >= 5 && (
          <line x1="120" y1="110" x2="100" y2="135" className="hangman-part" />
        )}

        {/* Right Leg */}
        {incorrectGuesses >= 6 && (
          <line x1="120" y1="110" x2="140" y2="135" className="hangman-part" />
        )}

        {/* Face details - only show when game is over */}
        {incorrectGuesses >= MAX_MISTAKES && (
          <>
            {/* X eyes */}
            <line x1="115" y1="50" x2="125" y2="60" className="hangman-part" />
            <line x1="125" y1="50" x2="115" y2="60" className="hangman-part" />
            <line x1="110" y1="65" x2="130" y2="65" className="hangman-part" stroke-linecap="round" />
          </>
        )}
      </svg>

      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
        <div
          className="bg-destructive h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${progress * 100}%` }}
        ></div>
      </div>
    </div>
  );
};

export default Hangman;
