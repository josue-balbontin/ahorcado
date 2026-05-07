import React from 'react';

interface VotingPanelProps {
  votes: Record<string, number>;
  voters: Record<string, string>;
  totalPlayers: number;
  votingOpen: boolean;
  isHost: boolean;
  onConfirm: (letter: string) => void;
  guessedLetters: string[];
}

const VotingPanel: React.FC<VotingPanelProps> = ({
  votes,
  voters,
  totalPlayers,
  votingOpen,
  isHost,
  onConfirm,
  guessedLetters
}) => {
  // Ordenar votos de mayor a menor
  const sortedVotes = Object.entries(votes).sort(([, a], [, b]) => b - a);
  const maxVotes = sortedVotes.length > 0 ? sortedVotes[0][1] : 0;
  const totalVoters = Object.keys(voters).length;

  // Agrupar quién votó por qué
  const votersByLetter: Record<string, string[]> = {};
  for (const [name, letter] of Object.entries(voters)) {
    if (!votersByLetter[letter]) votersByLetter[letter] = [];
    votersByLetter[letter].push(name);
  }

  return (
    <div className="w-full bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-lg p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span className="text-xl">🗳️</span> Votación
        </h3>
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${votingOpen ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
          <span className="text-sm text-gray-500">
            {totalVoters}/{totalPlayers} votaron
          </span>
        </div>
      </div>

      {/* Votes list */}
      {sortedVotes.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p className="text-3xl mb-2">🤔</p>
          <p className="text-sm">Esperando votos...</p>
        </div>
      ) : (
        <div className="space-y-3 mb-4">
          {sortedVotes.map(([letter, count]) => {
            const percentage = maxVotes > 0 ? (count / totalPlayers) * 100 : 0;
            const isTopVote = count === maxVotes;
            const alreadyGuessed = guessedLetters.includes(letter);

            return (
              <div key={letter} className="relative">
                <div className="flex items-center gap-3">
                  {/* Letter badge */}
                  <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shrink-0
                    transition-all duration-300
                    ${alreadyGuessed
                      ? 'bg-gray-200 text-gray-400 line-through'
                      : isTopVote
                        ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-amber-200'
                        : 'bg-gray-100 text-gray-700'
                    }
                  `}>
                    {letter}
                  </div>

                  {/* Bar + info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500 truncate">
                        {votersByLetter[letter]?.join(', ')}
                      </span>
                      <span className={`text-sm font-bold ${isTopVote ? 'text-amber-600' : 'text-gray-500'}`}>
                        {count}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ease-out ${
                          isTopVote
                            ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                            : 'bg-gray-300'
                        }`}
                        style={{ width: `${Math.max(percentage, 5)}%` }}
                      />
                    </div>
                  </div>

                  {/* Confirm button (host only) */}
                  {isHost && votingOpen && !alreadyGuessed && (
                    <button
                      onClick={() => onConfirm(letter)}
                      className="shrink-0 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-all hover:scale-105 active:scale-95 shadow-sm"
                    >
                      ✓
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Host: keyboard to choose any letter */}
      {isHost && votingOpen && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <p className="text-xs text-gray-500 mb-3 text-center font-medium">
            O elige cualquier letra directamente:
          </p>
          <div className="flex flex-wrap justify-center gap-1">
            {['Q','W','E','R','T','Y','U','I','O','P','A','S','D','F','G','H','J','K','L','Ñ','Z','X','C','V','B','N','M'].map(letter => {
              const alreadyUsed = guessedLetters.includes(letter);
              return (
                <button
                  key={letter}
                  disabled={alreadyUsed}
                  onClick={() => onConfirm(letter)}
                  className={`
                    w-8 h-8 rounded-lg text-xs font-bold transition-all
                    ${alreadyUsed
                      ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                      : 'bg-gray-800 text-white hover:bg-gray-700 hover:scale-110 active:scale-95 shadow-sm'
                    }
                  `}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default VotingPanel;
