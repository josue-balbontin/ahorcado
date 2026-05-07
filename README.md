# Ahorcado - Vivi Experiencia

Juego del ahorcado con dos modos de juego:

- **Modo Clásico**: juego individual con 3 fases de dificultad.
- **Modo Votación Multijugador**: múltiples jugadores votan por la siguiente letra en red local. El host confirma o elige la letra.

## Requisitos

- **Node.js** (v18+)
- **Python** (v3.10+)
- **npm**

## Estructura del Proyecto

```
ahorcado/
├── frontend/          ← Aplicación React (Vite + TypeScript + Tailwind)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Index.tsx          # Modo clásico
│   │   │   └── VotingGame.tsx     # Modo votación multijugador
│   │   ├── components/
│   │   │   ├── Hangman.tsx        # Dibujo del ahorcado (SVG)
│   │   │   ├── Keyboard.tsx       # Teclado (modo clásico)
│   │   │   ├── VotingPanel.tsx    # Panel de votos en vivo
│   │   │   ├── WordDisplay.tsx    # Palabra con letras ocultas
│   │   │   └── ...
│   │   ├── hooks/
│   │   │   └── useWebSocket.ts    # Hook de conexión WebSocket
│   │   └── utils/
│   │       ├── gameLogic.ts       # Lógica del juego
│   │       └── wordList.ts        # Listas de palabras
│   └── package.json
│
└── backend/           ← Servidor Python (FastAPI + WebSocket)
    ├── main.py            # Servidor principal
    ├── requirements.txt   # Dependencias Python
    └── start.bat          # Script de inicio rápido (Windows)
```

---

## Inicio Rápido

### 1. Frontend (ambos modos)

```bash
cd ahorcado/frontend
npm install
npm run dev
```

El frontend se abrirá en `http://localhost:8080` (o el siguiente puerto disponible).

> Esto es suficiente para jugar el **modo clásico**.

---

### 2. Backend (solo para modo votación multijugador)

#### Opción A: Script automático (Windows)

```bash
cd ahorcado/backend
start.bat
```

#### Opción B: Manual

```bash
cd ahorcado/backend
pip install -r requirements.txt
python main.py
```

El servidor se iniciará en `http://0.0.0.0:8000`.

---

## Cómo Jugar - Modo Votación Multijugador

### Preparación

1. Conecta tu PC y los celulares de los jugadores a la **misma red** (hotspot del celular).
2. Inicia el **backend** y el **frontend** como se indica arriba.

### Flujo del juego

1. En el juego clásico, haz clic en **"Modo Votación Multijugador"**.
2. Se mostrará un **código QR** y la URL de conexión.
3. Los jugadores escanean el QR desde sus celulares.
4. Cuando todos estén conectados, el host presiona **"Iniciar Juego"**.
5. Los jugadores votan por la letra que creen correcta desde su celular.
6. El host ve los votos en vivo y presiona **confirmar** en la letra ganadora, o elige cualquier otra letra.
7. Se revela el resultado y comienza la siguiente ronda.

### Reconexión

Si un jugador se desconecta, el host puede presionar el botón **"QR"** en la esquina superior derecha para volver a mostrar el código.

---

## Tecnologías

| Componente | Tecnología |
|------------|------------|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Backend | Python, FastAPI, WebSockets |
| Comunicación | WebSocket (tiempo real) |
| QR | qrcode (Python) |
