import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const API_BASE = `http://${window.location.hostname}:${__BACKEND_PORT__}`;

const JoinRoom: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roomFromUrl = searchParams.get('room') || '';

  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState(roomFromUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdRoom, setCreatedRoom] = useState<{
    room_id: string;
    join_url: string;
    qr_code: string;
    local_ip: string;
  } | null>(null);

  // Auto-fill room from URL
  useEffect(() => {
    if (roomFromUrl) {
      setRoomId(roomFromUrl);
    }
  }, [roomFromUrl]);

  const createRoom = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/create-room`, { method: 'POST' });
      if (!res.ok) throw new Error('Error al crear sala');
      const data = await res.json();
      setCreatedRoom(data);
      setRoomId(data.room_id);
    } catch (e: any) {
      setError(e.message || 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = () => {
    if (!playerName.trim()) {
      setError('Ingresa tu nombre');
      return;
    }
    if (!roomId.trim()) {
      setError('Ingresa el código de sala');
      return;
    }

    const isHost = createdRoom?.room_id === roomId.toUpperCase();
    navigate(`/voting?room=${roomId.toUpperCase()}&name=${encodeURIComponent(playerName.trim())}&host=${isHost}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-500 bg-clip-text text-transparent mb-2">
            🎮 Ahorcado
          </h1>
          <p className="text-gray-500 text-lg">Modo Votación Multijugador</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Crear sala section */}
          {!createdRoom && (
            <div className="p-6 border-b border-gray-100">
              <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="bg-amber-100 text-amber-600 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold">1</span>
                Crear Sala (Solo Host)
              </h2>
              <Button
                onClick={createRoom}
                disabled={loading}
                className="w-full bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 text-white py-3 rounded-xl font-semibold text-base shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Creando...
                  </span>
                ) : '🎲 Crear Nueva Sala'}
              </Button>
            </div>
          )}

          {/* QR + Room info */}
          {createdRoom && (
            <div className="p-6 border-b border-gray-100 bg-gradient-to-b from-amber-50 to-white">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full font-bold text-lg mb-4">
                  <span>Sala:</span>
                  <span className="font-mono tracking-wider text-2xl">{createdRoom.room_id}</span>
                </div>

                {/* QR Code */}
                <div className="bg-white rounded-xl p-4 inline-block shadow-inner mb-4">
                  <img
                    src={`data:image/png;base64,${createdRoom.qr_code}`}
                    alt="QR para unirse"
                    className="w-48 h-48 mx-auto"
                  />
                </div>

                <p className="text-sm text-gray-500 mb-1">
                  Escanea o conéctate a:
                </p>
                <p className="text-xs font-mono bg-gray-100 inline-block px-3 py-1.5 rounded-lg text-gray-600 break-all">
                  {createdRoom.join_url}
                </p>
              </div>
            </div>
          )}

          {/* Unirse section */}
          <div className="p-6">
            <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-600 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold">
                {createdRoom ? '2' : '●'}
              </span>
              {createdRoom ? 'Entrar como Host' : 'Unirse a una Sala'}
            </h2>

            <div className="space-y-3">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Tu nombre</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Ej: Josué"
                  maxLength={20}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 outline-none transition-all text-base"
                  onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
                />
              </div>

              {/* Código de sala (solo si no creó) */}
              {!createdRoom && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Código de sala</label>
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                    placeholder="Ej: AB12"
                    maxLength={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 outline-none transition-all text-base font-mono tracking-widest text-center text-2xl"
                    onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
                  />
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-xl border border-red-200">
                  {error}
                </div>
              )}

              {/* Botón unirse */}
              <Button
                onClick={joinRoom}
                className={`w-full py-3 rounded-xl font-semibold text-base shadow-lg transition-all ${
                  createdRoom
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
                }`}
              >
                {createdRoom ? '🚀 Entrar como Host' : '🎯 Unirse a la Sala'}
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Volver al modo clásico
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinRoom;
