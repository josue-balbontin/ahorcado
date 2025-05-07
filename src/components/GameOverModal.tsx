
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface GameOverModalProps {
  isWin: boolean;
  word: string;
  onPlayAgain: () => void;
  score: number;
}

const GameOverModal: React.FC<GameOverModalProps> = ({ isWin, word, onPlayAgain, score }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center">
            {isWin ? (
              <span className="text-green-500">¡Has Ganado!</span>
            ) : (
              <span className="text-destructive">¡Has Perdido!</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-2">La palabra era:</p>
          <p className="text-xl font-bold mb-4">{word}</p>
          <p>Puntuación: {score}</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={onPlayAgain} className="bg-primary hover:bg-primary/90">
            Jugar de nuevo
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default GameOverModal;
