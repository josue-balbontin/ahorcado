import React, { useState, useEffect } from 'react';
import { getRandomWord, Difficulty } from '@/utils/wordList';
import { 
  checkLetter, 
  checkWin, 
  checkLoss, 
  getIncorrectGuessCount,
  GamePhase,
  getNextPhase,
  isGameCompleted
} from '@/utils/gameLogic';
import Hangman from '@/components/Hangman';
import WordDisplay from '@/components/WordDisplay';
import Keyboard from '@/components/Keyboard';
import GameOverModal from '@/components/GameOverModal';
import PhaseIndicator from '@/components/PhaseIndicator';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const Index = () => {
  // Estado del juego
  const [word, setWord] = useState('');
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [correctLetters, setCorrectLetters] = useState<Set<string>>(new Set());
  const [incorrectLetters, setIncorrectLetters] = useState<Set<string>>(new Set());
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<GamePhase>(GamePhase.PHASE_1);
  
  // Iniciar juego al cargar
  useEffect(() => {
    startNewGame();
  }, []);

  // Iniciar un nuevo juego o fase
  const startNewGame = (newPhase?: GamePhase) => {
    const phase = newPhase || currentPhase;
    let difficulty: Difficulty;
    
    // Seleccionar dificultad según fase
    switch (phase) {
      case GamePhase.PHASE_1:
        difficulty = Difficulty.EASY;
        break;
      case GamePhase.PHASE_2:
        difficulty = Difficulty.MEDIUM;
        break;
      case GamePhase.PHASE_3:
        difficulty = Difficulty.HARD;
        break;
      default:
        difficulty = Difficulty.EASY;
    }
    
    const newWord = getRandomWord(difficulty);
    setWord(newWord);
    setGuessedLetters(new Set());
    setCorrectLetters(new Set());
    setIncorrectLetters(new Set());
    setGameOver(false);
    setIsWin(false);
    
    if (newPhase) {
      setCurrentPhase(newPhase);
    }
    
    console.log('New word:', newWord); // Para depuración
  };

  // Manejar adivinanza de letra
  const handleGuess = (letter: string) => {
    if (gameOver || guessedLetters.has(letter)) return;
    
    // Añadir a letras adivinadas
    const newGuessedLetters = new Set(guessedLetters).add(letter);
    setGuessedLetters(newGuessedLetters);
    
    // Verificar si la letra está en la palabra
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
    
    // Verificar condiciones de victoria/derrota
    checkGameStatus(newGuessedLetters);
  };
  
  // Verificar si el juego ha terminado
  const checkGameStatus = (letters: Set<string>) => {
    if (checkWin(word, letters)) {
      setGameOver(true);
      setIsWin(true);
      
      // Actualizar puntuación según la fase
      let pointsForWin = 10;
      if (currentPhase === GamePhase.PHASE_2) pointsForWin = 20;
      if (currentPhase === GamePhase.PHASE_3) pointsForWin = 30;
      
      const newScore = score + pointsForWin;
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
  
  // Manejar jugar de nuevo
  const handlePlayAgain = () => {
    if (isWin && currentPhase < GamePhase.COMPLETED) {
      // Avanzar a la siguiente fase
      const nextPhase = getNextPhase(currentPhase);
      startNewGame(nextPhase);
    } else {
      // Reiniciar desde la fase 1
      setScore(0);
      startNewGame(GamePhase.PHASE_1);
    }
  };
  
  // Obtener conteo de adivinanzas incorrectas
  const incorrectGuessCount = getIncorrectGuessCount(word, guessedLetters);

  // Determinar el nivel de dificultad actual en formato de texto
  const getCurrentDifficulty = () => {
    switch (currentPhase) {
      case GamePhase.PHASE_1:
        return "Fácil";
      case GamePhase.PHASE_2:
        return "Medio";
      case GamePhase.PHASE_3:
        return "Difícil";
      default:
        return "Completado";
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <div className="game-container">
        
        <div className="flex justify-between w-full mb-6">
          <div className="bg-secondary p-2 rounded-lg">
            <p className="text-sm">Puntuación Actual</p>
            <p className="text-xl font-bold">{score}</p>
          </div>
          <div className="bg-secondary p-2 rounded-lg">
            <p className="text-sm">Dificultad</p>
            <p className="text-xl font-bold">{getCurrentDifficulty()}</p>
          </div>
          <div className="bg-secondary p-2 rounded-lg">
            <p className="text-sm">Mejor Puntuación</p>
            <p className="text-xl font-bold">{highScore}</p>
          </div>
        </div>
        
        <PhaseIndicator currentPhase={currentPhase} />
        
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
            currentPhase={currentPhase}
          />
        )}
        
        <Button 
          onClick={() => {
            setScore(0);
            startNewGame(GamePhase.PHASE_1);
          }}
          className="mt-8 bg-primary hover:bg-primary/90"
        >
          Reiniciar Juego
        </Button>
      </div>
    </div>
  );
};

export default Index;
