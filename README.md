# 🎮 Nakama Tic-Tac-Toe

A **real-time multiplayer Tic-Tac-Toe** game built with React + Vite on the frontend and a fully **authoritative Nakama Game Server** backend. Supports Classic and Timed game modes, a global leaderboard, and unique player identity.

---

## ○ Setup and installation instructions

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- A modern browser

### 1. Clone & Install
```bash
git clone https://github.com/Vikash951/nakama-game.git
cd lila--tictactoe

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies (for TypeScript compilation)
cd ../nakama-backend
npm install
```

### 2. Build & Start Backend (Docker)
The backend uses TypeScript. You must compile it before starting Nakama:
```bash
# In nakama-backend directory
./build.sh          # Transpiles src/tictactoe.ts to modules/tictactoe.js
docker-compose up -d # Starts PostgreSQL and Nakama
```

### 3. Run Frontend
```bash
cd ../frontend
npm run dev
```
Open `http://localhost:5173` to play locally.

---

## ○ Architecture and design decisions

- **Authoritative Server Model**: All critical logic (move validation, win detection, turn management) runs on the server. Clients transmit intent (moves) and receive state updates.
- **TypeScript-to-JS Pipeline**: Backend logic is written in TypeScript for type safety and compiled to ES5 JavaScript using `esbuild` to be compatible with Nakama's QuickJS runtime.
- **Native Matchmaker**: Uses Nakama's built-in matchmaking system. Players provide a `mode` property ("classic" or "timed"), and the server pairs them with others requesting the same mode.
- **Tick-Based Timing**: The match loop runs at a `tickRate` of 1/sec. In Timed Mode, a `deadline` is set 30 ticks ahead. If a player fails to move by the deadline, the server automatically declares them the loser.
- **Unique Identity (name#tag)**: Since accounts are anonymous (device ID), we append the first 4 characters of the Nakama User ID to the player's chosen nickname to ensure uniqueness on the leaderboard.

---

## ○ Deployment process documentation

### Backend (Render)
1. **GitHub Sync**: Connect the `nakama-backend` folder to a Render project.
2. **Environment Variables**:
   - `DB_URL`: Your PostgreSQL connection string.
   - `PORT`: 7350
3. **Build Command**: Render uses the included `Dockerfile` which runs `start.sh`. Ensure `build.sh` has been run locally or in a CI step to populate the `modules/` directory if not using a multi-stage Docker build.

### Frontend (Render/Vercel)
1. **Config Update**: Update `frontend/src/nakama.ts` to point to your production host:
   ```typescript
   const HOST = "https://nakama-game-jpke.onrender.com/";
   const USE_SSL = true;
   ```
2. **Deploy**: Push to GitHub and connect the `frontend` directory to Render or Vercel.

---

## ○ API/server configuration details

### Nakama Configuration
- **Ports**:
  - `7350`: Client API (REST & WebSockets)
  - `7351`: Developer Console (Admin UI)
- **Server Key**: `defaultkey` (ensure this matches in both `config.yml` and `nakama.ts`)
- **Storage**: User stats (wins, losses, draws) are stored in the `stats` collection with the key `tictactoe`.

### Opcodes
| Code | Name | Source | Description |
|---|---|---|---|
| `1` | `OPCODE_MOVE` | Client | Player submits a board index (0-8) |
| `2` | `OPCODE_GAME_STATE` | Server | Periodic board and turn updates |
| `3` | `OPCODE_GAME_OVER` | Server | Match result (win/draw/forfeit/timeout) |
| `4` | `OPCODE_START` | Server | Initial match data and player symbols |

---

## ○ How to test the multiplayer functionality

### 1. Basic Matchmaking
- Open the game in a browser window.
- Open a second instance in an **Incognito/Private** window.
- Enter different names in both and select **Classic Mode**.
- Click **Find Match** simultaneously. They should be paired into a new authoritative match.

### 2. Timed Mode (Forfeit Test)
- Enter a match in **Timed Mode** using two windows.
- In one window, do not make a move.
- Wait 30 seconds. The server should broadcast a `timeout` result, awarding the victory to the other player.

### 3. Disconnect Handling
- Start a match.
- Close one browser tab mid-game.
- The remaining player should receive a "Victory" message with the reason `"opponent_disconnected"`.

### 4. Leaderboard Verification
- Complete a match and win.
- Return to the Lobby. The "Top Players" list should now include your `name#tag` with the updated win count.
- Verify entry in the Nakama Console under **Leaderboards → tictactoe_global**.

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


