# 🎮 Nakama Tic-Tac-Toe

A **real-time multiplayer Tic-Tac-Toe** game built with React + Vite on the frontend and a fully **authoritative Nakama Game Server** backend. Supports Classic and Timed game modes, a global leaderboard, and unique player identity.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 Device Auth | Anonymous login via a persistent device ID stored in `localStorage` |
| 🤝 Native Matchmaking | Nakama's built-in matchmaker pairs players by game mode |
| ⚔️ Authoritative Backend | All game logic runs server-side — no client-side cheating |
| ⏱️ Timed Mode | 30-second turn timer with automatic forfeit if a player exceeds the limit |
| 🏆 Global Leaderboard | Win-based leaderboard updated server-side after every match |
| 🪪 Unique Player Identity | Every player gets a `name#xxxx` tag tied to their account |

---

## 🛠️ Setup & Installation

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- A modern browser (Chrome, Edge, Firefox, Safari)

---

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd lila--tictactoe
```

---

### 2. Start the Nakama Backend (Docker)

```bash
cd nakama-backend
docker-compose up -d
```

This starts two containers:
- **PostgreSQL** — persistent game data storage
- **Nakama** — authoritative game server + JavaScript runtime

| Service | URL |
|---|---|
| Nakama REST API | `http://localhost:7350` |
| Nakama Developer Console | `http://localhost:7351` |
| Console Credentials | `admin` / `password` |

> After starting, wait ~10 seconds for Nakama to fully boot before connecting clients.

To view live server logs:
```bash
docker-compose logs -f nakama
```

To apply backend code changes (after editing `modules/index.js`):
```bash
docker-compose restart nakama
```

---

### 3. Start the React Frontend

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🏗️ Architecture & Design Decisions

```
┌─────────────────────────────────┐
│         React Frontend          │
│  (Vite + TypeScript + Vanilla CSS) │
│                                 │
│  LoginScreen → LobbyScreen      │
│      ↓             ↓            │
│  GameScreen ← ResultScreen      │
└────────────┬────────────────────┘
             │ WebSocket (port 7350)
             │ Nakama JS SDK
             ▼
┌─────────────────────────────────┐
│        Nakama Game Server       │
│     (Docker / JS Runtime)       │
│                                 │
│  ┌─────────────────────────┐    │
│  │  modules/index.js       │    │
│  │  - matchInit            │    │
│  │  - matchJoin            │    │
│  │  - matchLoop (tick=1s)  │    │
│  │  - matchmakerMatched    │    │
│  │  - updatePlayerStats    │    │
│  └─────────────────────────┘    │
│                                 │
│  PostgreSQL (persistent state)  │
└─────────────────────────────────┘
```

### Key Design Decisions

#### ✅ Authoritative Server Model
All game logic (move validation, win detection, forfeit on timeout) runs exclusively inside the Nakama `matchLoop`. Clients only **send moves** and **receive state** — they cannot manipulate the game outcome.

#### ✅ Native Nakama Matchmaker
We use `socket.addMatchmaker()` with mode-based query properties (`+properties.mode:timed`) rather than a custom RPC. This eliminates race conditions and ensures players are only matched with others in the same mode.

#### ✅ Tick-Based Timer
The Nakama `tickRate` is set to `1` (1 tick = 1 second). In Timed Mode, a `deadline` tick is set 30 ticks into the future on each turn. If the `matchLoop` tick reaches the deadline without a move, the server automatically forfeits the current player.

#### ✅ Unique Player Identity (`name#tag`)
Since device auth generates anonymous accounts, players can pick the same nickname. To guarantee uniqueness on the leaderboard, every display name is suffixed with the first 4 characters of the Nakama `user_id`  (e.g., `shiva#2f7f`). This is set in both `username` and `display_name` fields of the Nakama account.

#### ✅ Server-Side Stats & Leaderboard
Win/loss/draw stats are written to Nakama Storage with `permissionWrite: 0` (client cannot overwrite). The global leaderboard `tictactoe_global` is written from the server only after a confirmed game outcome.

---

## 📡 API & Server Configuration

### Nakama Server Config

Located in `nakama-backend/config.yml`:

| Setting | Value | Description |
|---|---|---|
| `name` | `nakama1` | Node name |
| `server_key` | `defaultkey` | Client connection key (change for production!) |
| HTTP port | `7350` | REST & WebSocket API |
| Console port | `7351` | Admin dashboard |
| `runtime.js_entrypoint` | `modules/index.js` | Path to game logic module |

### Frontend Nakama Client Config

Located in `frontend/src/nakama.ts`:

```typescript
const HOST = "localhost";   // Change to your server IP/domain for production
const PORT = 7350;
const USE_SSL = false;       // Set to true for HTTPS in production
const SERVER_KEY = "defaultkey"; // Must match Nakama config server_key
```

### Match Opcodes

| Opcode | Constant | Direction | Description |
|---|---|---|---|
| `1` | `OPCODE_MOVE` | Client → Server | Player submits a board position |
| `2` | `OPCODE_GAME_STATE` | Server → Clients | Updated board after a valid move |
| `3` | `OPCODE_GAME_OVER` | Server → Clients | Game ended (win/draw/timeout/disconnect) |
| `4` | `OPCODE_START` | Server → Clients | Match started, initial board state |

### Nakama Storage Collections

| Collection | Key | Description |
|---|---|---|
| `stats` | `tictactoe` | Per-user win/loss/draw/streak stats |

### Leaderboard

| ID | Type | Sort | Reset |
|---|---|---|---|
| `tictactoe_global` | Non-authoritative | Descending (by wins) | Weekly (Monday 00:00 UTC) |

---

## 🚀 Deployment

### Backend — Cloud Server (Docker)

1. Provision an Ubuntu VM (DigitalOcean, AWS EC2, etc.)
2. Install Docker and Docker Compose
3. Copy the `nakama-backend` folder to the server
4. **Before going live**, update `docker-compose.yml`:
   - Change `POSTGRES_PASSWORD`
   - Change `server_key` in `config.yml`
5. Start the server:
   ```bash
   docker-compose up -d
   ```
6. Open ports `7350` (API) and optionally `7351` (console) in your firewall

### Frontend — Vercel

1. Update `frontend/src/nakama.ts`:
   ```typescript
   const HOST = "your-server-ip-or-domain";
   const USE_SSL = true;  // if using HTTPS
   ```
2. Deploy:
   ```bash
   cd frontend
   npx vercel deploy
   ```

---

## 🧪 Testing Multiplayer Functionality

### Basic Match Test (Two Browser Windows)

1. Open `http://localhost:5173` in a **normal** browser window
2. Open `http://localhost:5173` in an **incognito / private** window
3. Enter different nicknames on each (e.g., `player1` and `player2`)
4. Select the same game mode (**Classic** or **Timed**) on both
5. Click **Find Match** on both windows — they will be paired automatically
6. Make moves alternately and verify the board syncs in real time

### Timed Mode Test

1. Follow steps 1–5 above but select **Timed Mode** on both windows
2. After the game starts, let one player's turn expire without making a move
3. After 30 seconds the server should:
   - Declare the waiting player the winner
   - Show `"Opponent ran out of time!"` on the winner's screen
   - Show `"You ran out of time!"` on the loser's screen

### Leaderboard Test

1. Complete at least one full match
2. Return to the lobby — the **Top Players** list should update with the winner's `name#tag`
3. Verify directly in the Nakama Console at `http://localhost:7351`:
   - Navigate to **Leaderboards → tictactoe_global**
   - Navigate to **Storage → stats → tictactoe** to inspect per-user stats

### Disconnect / Forfeit Test

1. Start a match between two windows
2. Close one window mid-game
3. The remaining player should see a **Victory** screen with `"Opponent fled the battle."`

### Nakama Console Monitoring

Use the developer console at `http://localhost:7351` (login: `admin` / `password`) to:
- Inspect live active matches
- Query user storage records
- View leaderboard entries
- Monitor server logs in real time

---

## 🗂️ Project Structure

```
lila--tictactoe/
├── nakama-backend/
│   ├── modules/
│   │   └── index.js          # Authoritative game server logic
│   ├── config.yml            # Nakama server configuration
│   └── docker-compose.yml    # Docker services definition
│
└── frontend/
    ├── src/
    │   ├── nakama.ts         # Nakama JS SDK client setup
    │   ├── App.tsx           # Root component + socket event handling
    │   ├── index.css         # Global design system / CSS variables
    │   └── components/
    │       ├── LoginScreen.tsx    # Nickname entry + device auth
    │       ├── LobbyScreen.tsx    # Mode selection + matchmaking + leaderboard
    │       ├── GameScreen.tsx     # Board UI + countdown timer
    │       └── ResultScreen.tsx   # Win/loss/draw/timeout result display
    ├── package.json
    └── vite.config.ts
```

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 19 + TypeScript |
| Build Tool | Vite |
| Styling | Vanilla CSS (CSS Variables + Glassmorphism) |
| Game Server | [Nakama](https://heroiclabs.com/) (self-hosted via Docker) |
| Backend Runtime | JavaScript (Nakama JS Module Runtime) |
| Database | PostgreSQL (managed by Nakama) |
| Real-time Protocol | WebSockets (Nakama JS SDK) |

---

Happy Gaming! 🕹️
