
import React, { useState, useEffect } from 'react';
import { getRandomWord } from '@/utils/wordList';
import { checkLetter, checkWin, checkLoss, getIncorrectGuessCount } from '@/utils/gameLogic';
import Hangman from '@/components/Hangman';
import WordDisplay from '@/components/WordDisplay';
import Keyboard from '@/components/Keyboard';
import GameOverModal from '@/components/GameOverModal';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const Index = () => {
  // Game state
  const [word, setWord] = useState('');
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [correctLetters, setCorrectLetters] = useState<Set<string>>(new Set());
  const [incorrectLetters, setIncorrectLetters] = useState<Set<string>>(new Set());
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isWin, setIsWin] = useState(false);
  
  // Get a random word on first render and when starting a new game
  useEffect(() => {
    startNewGame();
  }, []);

  // Start a new game
  const startNewGame = () => {
    const newWord = getRandomWord();
    setWord(newWord);
    setGuessedLetters(new Set());
    setCorrectLetters(new Set());
    setIncorrectLetters(new Set());
    setGameOver(false);
    setIsWin(false);
    
    console.log('New word:', newWord); // For debugging
  };

  // Handle letter guess
  const handleGuess = (letter: string) => {
    if (gameOver || guessedLetters.has(letter)) return;
    
    // Add to guessed letters
    const newGuessedLetters = new Set(guessedLetters).add(letter);
    setGuessedLetters(newGuessedLetters);
    
    // Check if letter is in the word
    const isCorrect = checkLetter(word, letter);
    
    if (isCorrect) {
      const newCorrectLetters = new Set(correctLetters).add(letter);
      setCorrectLetters(newCorrectLetters);
      toast({
        description: `¡Bien! La letra "${letter}" está en la palabra.`,
        duration: 1500,
      });
    } else {
      const newIncorrectLetters = new Set(incorrectLetters).add(letter);
      setIncorrectLetters(newIncorrectLetters);
      toast({
        variant: "destructive",
        description: `La letra "${letter}" no está en la palabra.`,
        duration: 1500,
      });
    }
    
    // Check for win/loss conditions
    checkGameStatus(newGuessedLetters);
  };
  
  // Check if game is won or lost
  const checkGameStatus = (letters: Set<string>) => {
    if (checkWin(word, letters)) {
      setGameOver(true);
      setIsWin(true);
      const newScore = score + 10;
      setScore(newScore);
      if (newScore > highScore) {
        setHighScore(newScore);
      }
    } else if (checkLoss(word, letters)) {
      setGameOver(true);
      setIsWin(false);
      setScore(0);
    }
  };
  
  // Handle play again
  const handlePlayAgain = () => {
    startNewGame();
  };
  
  // Get count of incorrect guesses
  const incorrectGuessCount = getIncorrectGuessCount(word, guessedLetters);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="game-container">
        <h1 className="title">Juego del Ahorcado</h1>
        
        <div className="flex justify-between w-full mb-6">
          <div className="bg-secondary p-2 rounded-lg">
            <p className="text-sm">Puntuación Actual</p>
            <p className="text-xl font-bold">{score}</p>
          </div>
          <div className="bg-secondary p-2 rounded-lg">
            <p className="text-sm">Mejor Puntuación</p>
            <p className="text-xl font-bold">{highScore}</p>
          </div>
        </div>
        
        <Hangman incorrectGuesses={incorrectGuessCount} />
        
        <WordDisplay 
          word={word} 
          guessedLetters={guessedLetters} 
          gameOver={gameOver} 
        />
        
        <Keyboard 
          onGuess={handleGuess} 
          guessedLetters={guessedLetters}
          correctLetters={correctLetters}
          incorrectLetters={incorrectLetters} 
          disabled={gameOver}
        />
        
        {gameOver && (
          <GameOverModal 
            isWin={isWin} 
            word={word} 
            onPlayAgain={handlePlayAgain} 
            score={score} 
          />
        )}
        
        <Button 
          onClick={handlePlayAgain}
          className="mt-8 bg-primary hover:bg-primary/90"
        >
          Nueva Palabra
        </Button>
      </div>
    </div>
  );
};

export default Index;
