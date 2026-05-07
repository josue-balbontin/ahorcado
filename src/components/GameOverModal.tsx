
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { GamePhase, isGameCompleted } from '@/utils/gameLogic';

interface GameOverModalProps {
  isWin: boolean;
  word: string;
  onPlayAgain: () => void;
  score: number;
  currentPhase: GamePhase;
}

const GameOverModal: React.FC<GameOverModalProps> = ({
  isWin,
  word,
  onPlayAgain,
  score,
  currentPhase
}) => {
  const gameCompleted = isGameCompleted(currentPhase);
  const nextPhase = currentPhase < GamePhase.COMPLETED ? currentPhase : GamePhase.COMPLETED;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center">
            {isWin ? (
              gameCompleted ? (
                <span className="text-green-500">¡Felicidades! ¡Has Completado Todas las Fases!</span>
              ) : (
                <span className="text-green-500">¡Has Superado la Fase {currentPhase - 1}!</span>
              )
            ) : (
              <span className="text-destructive">¡Has Perdido!</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-2">La palabra era:</p>
          <p className="text-xl font-bold mb-4">{word}</p>
          <p className="mb-4">Puntuación: {score}</p>

          {isWin && !gameCompleted && (
            <div className="mb-4">
              <p className="mb-2">¡Pasando a la Fase {nextPhase}!</p>
              <p className="text-sm text-muted-foreground">Las palabras serán más difíciles</p>
            </div>
          )}

          {gameCompleted && isWin && (
            <p className="text-sm text-green-500 font-semibold">
              ¡Has dominado todas las dificultades!
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={onPlayAgain} className="bg-primary hover:bg-primary/90">
            {isWin && !gameCompleted ? 'Siguiente Fase' : 'Jugar de nuevo'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default GameOverModal;
