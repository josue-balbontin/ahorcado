"""
Backend para Ahorcado - Modo Votacion Multijugador
FastAPI + WebSocket para votacion en tiempo real por red local.
Sala unica, sin necesidad de room ID ni nombre.
"""

import asyncio
import json
import random
import string
import socket
import io
import base64
from typing import Dict, List, Optional, Set
from dataclasses import dataclass, field
from enum import Enum

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import qrcode


# ---- Listas de palabras (mismas que el frontend) ----

WORDS_EASY = [
    "HTML", "JAVA", "RUBY", "RUST", "NODO",
    "DATO", "CODE", "BOOT", "LINK", "FILE",
    "MENU", "BYTE", "CHAT", "BLOG", "GAME",
    "TEXT", "ICON", "WIFI", "CLIP", "PORT"
]

WORDS_MEDIUM = [
    "PYTHON", "SCRIPT", "GITHUB", "NUBE", "ARRAY",
    "CODIGO", "FUNCION", "CLASE", "MODELO", "DATOS",
    "SERVIDOR", "CLIENTE", "BUCLE", "PROXY", "BACKUP",
    "DOCKER", "PLUGIN", "SCRUM", "MODULO", "VISTA"
]

WORDS_HARD = [
    "FRAMEWORK", "ALGORITMO", "SOFTWARE", "FRONTEND", "BACKEND",
    "RECURSIVIDAD", "TYPESCRIPT", "COMPILADOR", "DEPURADOR", "BINARIO",
    "JAVASCRIPT", "PROTOTIPO", "PROCESADOR", "MICROSERVICIO", "CONTENEDOR",
    "RENDERIZADO", "ENCRIPTACION", "MIDDLEWARE", "INFRAESTRUCTURA", "ESCALABILIDAD"
]

MAX_MISTAKES = 6


class GamePhase(int, Enum):
    PHASE_1 = 1
    PHASE_2 = 2
    PHASE_3 = 3
    COMPLETED = 4


class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


def get_random_word(difficulty: Difficulty) -> str:
    if difficulty == Difficulty.EASY:
        return random.choice(WORDS_EASY)
    elif difficulty == Difficulty.MEDIUM:
        return random.choice(WORDS_MEDIUM)
    else:
        return random.choice(WORDS_HARD)


def phase_to_difficulty(phase: GamePhase) -> Difficulty:
    if phase == GamePhase.PHASE_1:
        return Difficulty.EASY
    elif phase == GamePhase.PHASE_2:
        return Difficulty.MEDIUM
    else:
        return Difficulty.HARD


# ---- Modelos de datos ----

@dataclass
class Player:
    id: str
    name: str
    ws: WebSocket
    is_host: bool = False
    current_vote: Optional[str] = None


@dataclass
class GameRoom:
    """Sala unica del juego."""
    players: Dict[str, Player] = field(default_factory=dict)
    player_counter: int = 0
    word: str = ""
    guessed_letters: Set[str] = field(default_factory=set)
    correct_letters: Set[str] = field(default_factory=set)
    incorrect_letters: Set[str] = field(default_factory=set)
    votes: Dict[str, int] = field(default_factory=dict)
    voters: Dict[str, str] = field(default_factory=dict)
    current_phase: GamePhase = GamePhase.PHASE_1
    score: int = 0
    game_started: bool = False
    game_over: bool = False
    is_win: bool = False
    voting_open: bool = False

    def next_player_name(self) -> str:
        self.player_counter += 1
        return f"Jugador {self.player_counter}"

    def get_word_display(self) -> List[Optional[str]]:
        display = []
        for i, letter in enumerate(self.word):
            if i < 2 or letter in self.guessed_letters or self.game_over:
                display.append(letter)
            else:
                display.append(None)
        return display

    def get_incorrect_count(self) -> int:
        return len(self.incorrect_letters)

    def check_win(self) -> bool:
        return all(letter in self.guessed_letters for letter in self.word)

    def check_loss(self) -> bool:
        return self.get_incorrect_count() >= MAX_MISTAKES

    def reset_votes(self):
        self.votes = {}
        self.voters = {}
        self.voting_open = True
        for player in self.players.values():
            player.current_vote = None

    def start_new_word(self, phase: Optional[GamePhase] = None):
        if phase:
            self.current_phase = phase
        difficulty = phase_to_difficulty(self.current_phase)
        self.word = get_random_word(difficulty)
        hint_letters = set()
        for i in range(min(2, len(self.word))):
            hint_letters.add(self.word[i])
        self.guessed_letters = set(hint_letters)
        self.correct_letters = set(hint_letters)
        self.incorrect_letters = set()
        self.game_over = False
        self.is_win = False
        self.game_started = True
        self.reset_votes()

    def apply_letter(self, letter: str) -> bool:
        letter = letter.upper()
        if letter in self.guessed_letters:
            return letter in self.word

        self.guessed_letters.add(letter)

        if letter in self.word:
            self.correct_letters.add(letter)
            correct = True
        else:
            self.incorrect_letters.add(letter)
            correct = False

        if self.check_win():
            self.game_over = True
            self.is_win = True
            points = {GamePhase.PHASE_1: 10, GamePhase.PHASE_2: 20, GamePhase.PHASE_3: 30}
            self.score += points.get(self.current_phase, 10)
        elif self.check_loss():
            self.game_over = True
            self.is_win = False
            self.score = 0

        return correct

    def get_state(self, for_host: bool = False) -> dict:
        difficulty_names = {
            GamePhase.PHASE_1: "Facil",
            GamePhase.PHASE_2: "Medio",
            GamePhase.PHASE_3: "Dificil",
            GamePhase.COMPLETED: "Completado"
        }
        state = {
            "type": "room_state",
            "players": [
                {"name": p.name, "is_host": p.is_host, "has_voted": p.current_vote is not None}
                for p in self.players.values()
            ],
            "player_count": len(self.players),
            "word_display": self.get_word_display(),
            "word_length": len(self.word),
            "guessed_letters": list(self.guessed_letters),
            "correct_letters": list(self.correct_letters),
            "incorrect_letters": list(self.incorrect_letters),
            "incorrect_count": self.get_incorrect_count(),
            "max_mistakes": MAX_MISTAKES,
            "votes": self.votes,
            "voters": self.voters,
            "voting_open": self.voting_open,
            "current_phase": self.current_phase.value,
            "difficulty": difficulty_names.get(self.current_phase, "Facil"),
            "score": self.score,
            "game_started": self.game_started,
            "game_over": self.game_over,
            "is_win": self.is_win,
        }
        if for_host or self.game_over:
            state["word"] = self.word
        return state


# ---- FastAPI App ----

app = FastAPI(title="Ahorcado - Modo Votacion")
room = GameRoom()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_local_ip() -> str:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def generate_qr_base64(url: str) -> str:
    qr = qrcode.QRCode(version=1, box_size=10, border=2)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    return base64.b64encode(buffer.read()).decode("utf-8")


@app.get("/api/game-info")
async def get_game_info(frontend_port: int = Query(default=5173)):
    """Devuelve info del juego y QR con el puerto correcto del frontend."""
    ip = get_local_ip()
    join_url = f"http://{ip}:{frontend_port}/voting"
    qr_base64 = generate_qr_base64(join_url)
    return {
        "join_url": join_url,
        "local_ip": ip,
        "frontend_port": frontend_port,
        "qr_code": qr_base64,
        "player_count": len(room.players),
        "game_started": room.game_started,
    }


# ---- WebSocket Handler ----

async def broadcast(message: dict, exclude_ws: Optional[WebSocket] = None):
    disconnected = []
    for pid, player in room.players.items():
        if player.ws == exclude_ws:
            continue
        try:
            await player.ws.send_json(message)
        except Exception:
            disconnected.append(pid)
    for pid in disconnected:
        del room.players[pid]


async def send_state_to_all():
    for pid, player in list(room.players.items()):
        try:
            state = room.get_state(for_host=player.is_host)
            await player.ws.send_json(state)
        except Exception:
            del room.players[pid]


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, host: bool = Query(default=False)):
    await websocket.accept()

    # Auto-asignar nombre
    player_name = room.next_player_name()
    player_id = f"p_{id(websocket)}"

    player = Player(id=player_id, name=player_name, ws=websocket, is_host=host)
    room.players[player_id] = player

    # Confirmar conexion
    try:
        await websocket.send_json({
            "type": "joined",
            "name": player_name,
            "is_host": host,
        })

        # Notificar a todos
        await broadcast({
            "type": "player_joined",
            "name": player_name,
            "player_count": len(room.players),
            "is_host": host,
        }, exclude_ws=websocket)

        # Enviar estado actual
        await send_state_to_all()

        # Loop de mensajes
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            # -- START GAME --
            if msg_type == "start_game":
                if player.is_host:
                    phase_val = data.get("phase", 1)
                    phase = GamePhase(min(phase_val, 3))
                    room.start_new_word(phase)
                    await send_state_to_all()

            # -- VOTE --
            elif msg_type == "vote":
                letter = data.get("letter", "").upper()
                if not letter or not room.voting_open or room.game_over:
                    continue

                # Quitar voto anterior
                if player.current_vote:
                    old = player.current_vote
                    if old in room.votes:
                        room.votes[old] -= 1
                        if room.votes[old] <= 0:
                            del room.votes[old]

                # Registrar nuevo voto
                player.current_vote = letter
                room.votes[letter] = room.votes.get(letter, 0) + 1
                room.voters[player_name] = letter

                await broadcast({
                    "type": "vote_update",
                    "votes": room.votes,
                    "voters": room.voters,
                    "voter_name": player_name,
                    "letter": letter,
                    "total_voters": sum(1 for p in room.players.values() if p.current_vote),
                    "total_players": len(room.players),
                })

            # -- CONFIRM (solo Host) --
            elif msg_type == "confirm":
                if not player.is_host or room.game_over:
                    continue

                letter = data.get("letter", "").upper()
                if not letter:
                    continue

                room.voting_open = False
                correct = room.apply_letter(letter)

                await broadcast({
                    "type": "letter_result",
                    "letter": letter,
                    "correct": correct,
                    "word_display": room.get_word_display(),
                    "incorrect_count": room.get_incorrect_count(),
                    "guessed_letters": list(room.guessed_letters),
                    "correct_letters": list(room.correct_letters),
                    "incorrect_letters": list(room.incorrect_letters),
                })

                if room.game_over:
                    await broadcast({
                        "type": "game_over",
                        "win": room.is_win,
                        "word": room.word,
                        "score": room.score,
                    })
                else:
                    room.reset_votes()
                    await send_state_to_all()

            # -- NEW GAME (solo Host) --
            elif msg_type == "new_game":
                if not player.is_host:
                    continue
                phase_val = data.get("phase", room.current_phase.value)
                phase = GamePhase(min(phase_val, 3))
                room.score = 0
                room.start_new_word(phase)
                await send_state_to_all()

            # -- NEXT PHASE (solo Host) --
            elif msg_type == "next_phase":
                if not player.is_host:
                    continue
                current = room.current_phase.value
                next_phase = GamePhase(current + 1) if current < 3 else GamePhase.PHASE_1
                room.start_new_word(next_phase)
                await send_state_to_all()

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        if player_id in room.players:
            del room.players[player_id]

            if player_name in room.voters:
                vote = room.voters[player_name]
                if vote in room.votes:
                    room.votes[vote] -= 1
                    if room.votes[vote] <= 0:
                        del room.votes[vote]
                del room.voters[player_name]

            await broadcast({
                "type": "player_left",
                "name": player_name,
                "player_count": len(room.players),
            })


# ---- Arrancar servidor ----

def find_free_port(start: int = 8000, end: int = 8020) -> int:
    """Busca un puerto libre en el rango [start, end]."""
    import socket as _socket
    for port in range(start, end + 1):
        try:
            s = _socket.socket(_socket.AF_INET, _socket.SOCK_STREAM)
            s.bind(("0.0.0.0", port))
            s.close()
            return port
        except OSError:
            continue
    # Si ninguno esta libre, dejar que uvicorn falle con el default
    return start


def save_backend_port(port: int):
    """Guarda el puerto del backend en un archivo compartido para que el frontend lo lea."""
    import os
    port_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend_port.json")
    with open(port_file, "w") as f:
        json.dump({"port": port}, f)
    print(f"  Puerto guardado en: {os.path.abspath(port_file)}")


if __name__ == "__main__":
    import uvicorn
    ip = get_local_ip()
    port = find_free_port(8000, 8020)
    save_backend_port(port)
    print(f"\n{'='*50}")
    print(f"  Ahorcado - Modo Votacion")
    print(f"  Servidor: http://{ip}:{port}")
    print(f"  (puerto auto-detectado)")
    print(f"{'='*50}\n")
    uvicorn.run(app, host="0.0.0.0", port=port)
