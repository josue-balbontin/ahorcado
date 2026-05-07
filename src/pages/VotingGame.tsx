import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useWebSocket, WSMessage } from '@/hooks/useWebSocket';
import Hangman from '@/components/Hangman';
import VotingPanel from '@/components/VotingPanel';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const API_BASE = `http://${window.location.hostname}:8000`;

interface GameState {
  players: Array<{ name: string; is_host: boolean; has_voted: boolean }>;
  player_count: number;
  word_display: (string | null)[];
  word_length: number;
  guessed_letters: string[];
  correct_letters: string[];
  incorrect_letters: string[];
  incorrect_count: number;
  max_mistakes: number;
  votes: Record<string, number>;
  voters: Record<string, string>;
  voting_open: boolean;
  current_phase: number;
  difficulty: string;
  score: number;
  game_started: boolean;
  game_over: boolean;
  is_win: boolean;
  word?: string;
}

const VotingGame: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isHost = searchParams.get('host') === 'true';

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myName, setMyName] = useState<string>('');
  const [myVote, setMyVote] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ letter: string; correct: boolean } | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [qrData, setQrData] = useState<{ qr_code: string; join_url: string } | null>(null);

  // WebSocket
  const wsUrl = `ws://${window.location.hostname}:8000/ws?host=${isHost}`;
  const { connected, sendMessage, lastMessage } = useWebSocket(wsUrl);

  // Cargar QR
  const loadQR = useCallback(async () => {
    try {
      const port = window.location.port || '8080';
      const res = await fetch(`${API_BASE}/api/game-info?frontend_port=${port}`);
      if (res.ok) {
        const data = await res.json();
        setQrData({ qr_code: data.qr_code, join_url: data.join_url });
      }
    } catch (e) {
      console.error('Error cargando QR:', e);
    }
  }, []);

  useEffect(() => {
    loadQR();
  }, [loadQR]);

  // Procesar mensajes
  useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case 'joined':
        setMyName(lastMessage.name);
        toast({
          description: `Conectado como ${lastMessage.name}${lastMessage.is_host ? ' (Host)' : ''}`,
          duration: 2000,
        });
        break;

      case 'room_state':
        setGameState(lastMessage as unknown as GameState);
        if (lastMessage.voting_open) {
          setMyVote(null);
          setLastResult(null);
        }
        break;

      case 'player_joined':
        toast({
          description: `${lastMessage.name} se unio (${lastMessage.player_count} jugadores)`,
          duration: 2000,
        });
        break;

      case 'player_left':
        toast({
          variant: 'destructive',
          description: `${lastMessage.name} se desconecto`,
          duration: 2000,
        });
        break;

      case 'vote_update':
        setGameState(prev => {
          if (!prev) return prev;
          return { ...prev, votes: lastMessage.votes, voters: lastMessage.voters };
        });
        break;

      case 'letter_result':
        setLastResult({ letter: lastMessage.letter, correct: lastMessage.correct });
        setGameState(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            word_display: lastMessage.word_display,
            incorrect_count: lastMessage.incorrect_count,
            guessed_letters: lastMessage.guessed_letters,
            correct_letters: lastMessage.correct_letters,
            incorrect_letters: lastMessage.incorrect_letters,
            voting_open: false,
          };
        });
        toast({
          variant: lastMessage.correct ? 'default' : 'destructive',
          description: lastMessage.correct
            ? `"${lastMessage.letter}" es correcta!`
            : `"${lastMessage.letter}" no esta en la palabra`,
          duration: 2000,
        });
        break;

      case 'game_over':
        setGameState(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            game_over: true,
            is_win: lastMessage.win,
            word: lastMessage.word,
            score: lastMessage.score,
          };
        });
        break;
    }
  }, [lastMessage]);

  // Handlers
  const handleVote = useCallback((letter: string) => {
    if (!gameState?.voting_open || gameState.game_over) return;
    if (gameState.guessed_letters.includes(letter)) return;
    setMyVote(letter);
    sendMessage({ type: 'vote', letter });
  }, [gameState, sendMessage]);

  const handleConfirm = useCallback((letter: string) => {
    if (!isHost) return;
    sendMessage({ type: 'confirm', letter });
  }, [isHost, sendMessage]);

  const handleStartGame = useCallback(() => {
    sendMessage({ type: 'start_game', phase: 1 });
  }, [sendMessage]);

  const handleNewGame = useCallback(() => {
    sendMessage({ type: 'new_game', phase: 1 });
  }, [sendMessage]);

  const handleNextPhase = useCallback(() => {
    sendMessage({ type: 'next_phase' });
  }, [sendMessage]);

  // Keyboard rows
  const keyboardRows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
  ];

  const guessedSet = gameState ? new Set(gameState.guessed_letters) : new Set<string>();
  const correctSet = gameState ? new Set(gameState.correct_letters) : new Set<string>();
  const incorrectSet = gameState ? new Set(gameState.incorrect_letters) : new Set<string>();

  const getKeyClass = (letter: string) => {
    if (correctSet.has(letter)) return 'key-button key-button-correct';
    if (incorrectSet.has(letter)) return 'key-button key-button-incorrect';
    if (guessedSet.has(letter)) return 'key-button key-button-disabled';
    if (myVote === letter) return 'key-button bg-blue-500 text-white ring-2 ring-blue-300 shadow-lg shadow-blue-200';
    if (!gameState?.voting_open || gameState?.game_over) return 'key-button key-button-disabled';
    return 'key-button key-button-enabled';
  };

  // ── Conectando ──
  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-gray-300 border-t-gray-800 rounded-full mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Conectando al servidor...</p>
          <button onClick={() => navigate('/')} className="mt-4 text-sm text-gray-400 hover:text-gray-600">
            Volver
          </button>
        </div>
      </div>
    );
  }

  // ── Lobby ──
  if (!gameState?.game_started) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Ahorcado</h2>
            <p className="text-gray-400 text-sm mb-6">Modo Votacion Multijugador</p>

            {/* Connection info */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm text-gray-500">Conectado como <strong>{myName}</strong></span>
              {isHost && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">HOST</span>}
            </div>

            {/* QR */}
            {qrData && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-500 mb-3">Escanea para unirse:</p>
                <div className="bg-white rounded-xl p-3 inline-block shadow-inner mb-3">
                  <img src={`data:image/png;base64,${qrData.qr_code}`} alt="QR" className="w-40 h-40 mx-auto" />
                </div>
                <p className="text-xs font-mono bg-white px-3 py-1.5 rounded-lg text-gray-500 break-all">
                  {qrData.join_url}
                </p>
              </div>
            )}

            {/* Players */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-sm font-semibold text-gray-600 mb-3">
                Jugadores ({gameState?.player_count || 0}):
              </p>
              <div className="space-y-2">
                {gameState?.players.map((p, i) => (
                  <div key={i} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 shadow-sm">
                    <span className="font-medium text-gray-700">{p.name}</span>
                    {p.is_host && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">HOST</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {isHost ? (
              <Button
                onClick={handleStartGame}
                disabled={!gameState || gameState.player_count < 1}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-3 rounded-xl font-semibold text-base shadow-lg"
              >
                Iniciar Juego
              </Button>
            ) : (
              <div className="bg-amber-50 text-amber-700 px-4 py-3 rounded-xl text-sm border border-amber-200">
                Esperando a que el host inicie el juego...
              </div>
            )}
          </div>

          <button onClick={() => navigate('/')} className="mt-4 text-sm text-gray-400 hover:text-gray-600">
            Volver al modo clasico
          </button>
        </div>
      </div>
    );
  }

  // ── Juego activo ──
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-4">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="bg-white shadow-sm border border-gray-200 rounded-xl px-3 py-2">
              <p className="text-xs text-gray-400">Jugadores</p>
              <p className="font-bold text-gray-800">{gameState.player_count}</p>
            </div>
            <div className="bg-white shadow-sm border border-gray-200 rounded-xl px-3 py-2">
              <p className="text-xs text-gray-400">Dificultad</p>
              <p className="font-bold text-gray-800">{gameState.difficulty}</p>
            </div>
            <div className="bg-white shadow-sm border border-gray-200 rounded-xl px-3 py-2">
              <p className="text-xs text-gray-400">Puntaje</p>
              <p className="font-bold text-gray-800">{gameState.score}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* QR toggle button */}
            <button
              onClick={() => setShowQR(!showQR)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
                showQR
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              QR
            </button>

            {/* Connection indicator */}
            <div className="bg-white shadow-sm border border-gray-200 rounded-xl px-3 py-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-sm text-gray-600">{myName}</span>
              {isHost && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">HOST</span>}
            </div>
          </div>
        </div>

        {/* QR overlay */}
        {showQR && qrData && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 mb-4 flex items-center gap-4">
            <img src={`data:image/png;base64,${qrData.qr_code}`} alt="QR" className="w-28 h-28 rounded-lg" />
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Escanea para unirse</p>
              <p className="text-xs font-mono text-gray-400 break-all">{qrData.join_url}</p>
              <button onClick={() => setShowQR(false)} className="text-xs text-gray-400 hover:text-gray-600 mt-2">
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* Phase indicator */}
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center bg-white shadow-sm border border-gray-200 px-3 py-1.5 rounded-full">
            <span className="text-xs mr-2 text-gray-500">Fase:</span>
            {[1, 2, 3].map(phase => (
              <div key={phase} className={`
                inline-block w-3 h-3 rounded-full mx-1
                ${gameState.current_phase > phase ? 'bg-emerald-500' :
                  gameState.current_phase === phase ? 'bg-gray-800 animate-pulse' : 'bg-gray-300'}
              `} />
            ))}
          </div>
        </div>

        {/* Last result banner */}
        {lastResult && !gameState.game_over && (
          <div className={`
            text-center py-2 px-4 rounded-xl mb-4 font-semibold text-sm
            ${lastResult.correct
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
            }
          `}>
            {lastResult.correct
              ? `"${lastResult.letter}" es correcta!`
              : `"${lastResult.letter}" no esta en la palabra`
            }
          </div>
        )}

        {/* Main game area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Hangman */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4">
              <Hangman incorrectGuesses={gameState.incorrect_count} />
              <p className="text-center text-sm text-gray-400 mt-2">
                {gameState.incorrect_count}/{gameState.max_mistakes} errores
              </p>
            </div>
          </div>

          {/* Center: Word + Keyboard */}
          <div className="lg:col-span-1 flex flex-col items-center">
            {/* Word display */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 w-full mb-4">
              <div className="flex justify-center flex-wrap gap-1.5">
                {gameState.word_display.map((letter, index) => (
                  <div key={index} className="word-letter">
                    {letter || ''}
                  </div>
                ))}
              </div>
            </div>

            {/* Voting keyboard (jugadores) */}
            {!isHost && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 w-full">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-600">
                    {gameState.voting_open
                      ? 'Vota por la siguiente letra'
                      : 'Esperando al host...'}
                  </p>
                  {myVote && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                      Tu voto: {myVote}
                    </span>
                  )}
                </div>

                {keyboardRows.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex justify-center gap-1 mb-1.5">
                    {rowIndex === 2 && <div className="w-3" />}
                    {row.map((letter) => (
                      <button
                        key={letter}
                        className={getKeyClass(letter)}
                        onClick={() => handleVote(letter)}
                        disabled={!gameState.voting_open || gameState.game_over || guessedSet.has(letter)}
                      >
                        {letter}
                      </button>
                    ))}
                    {rowIndex === 2 && <div className="w-3" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Voting panel + Players */}
          <div className="lg:col-span-1">
            <VotingPanel
              votes={gameState.votes}
              voters={gameState.voters}
              totalPlayers={gameState.player_count}
              votingOpen={gameState.voting_open}
              isHost={isHost}
              onConfirm={handleConfirm}
              guessedLetters={gameState.guessed_letters}
            />

            {/* Player list */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-lg p-4 mt-4">
              <h4 className="text-sm font-semibold text-gray-600 mb-2">Jugadores</h4>
              <div className="space-y-1">
                {gameState.players.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-sm px-2 py-1.5 rounded-lg bg-gray-50">
                    <span className="text-gray-700 font-medium">{p.name}</span>
                    <div className="flex items-center gap-1">
                      {p.is_host && <span className="text-xs text-amber-600 font-semibold">HOST</span>}
                      {p.has_voted && !p.is_host && <span className="text-xs text-emerald-600 font-semibold">Voto</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Game Over overlay */}
        {gameState.game_over && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
              <div className="text-5xl mb-4">
                {gameState.is_win ? '🎉' : '💀'}
              </div>
              <h2 className={`text-2xl font-bold mb-2 ${gameState.is_win ? 'text-emerald-600' : 'text-red-600'}`}>
                {gameState.is_win ? 'Ganaron!' : 'Perdieron!'}
              </h2>
              <p className="text-gray-500 mb-1">La palabra era:</p>
              <p className="text-3xl font-bold text-gray-800 mb-4 font-mono tracking-wider">
                {gameState.word}
              </p>
              <p className="text-gray-500 mb-6">Puntaje: {gameState.score}</p>

              {isHost && (
                <div className="space-y-2">
                  {gameState.is_win && gameState.current_phase < 3 && (
                    <Button
                      onClick={handleNextPhase}
                      className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-3 rounded-xl font-semibold"
                    >
                      Siguiente Fase
                    </Button>
                  )}
                  <Button
                    onClick={handleNewGame}
                    className="w-full bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white py-3 rounded-xl font-semibold"
                  >
                    Nuevo Juego (Fase 1)
                  </Button>
                </div>
              )}

              {!isHost && (
                <p className="text-sm text-gray-400">Esperando al host...</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VotingGame;
