import { useState, useEffect } from "react";
import { getSocket } from "./nakama";
import { LoginScreen } from "./components/LoginScreen";
import { LobbyScreen } from "./components/LobbyScreen";
import { GameScreen } from "./components/GameScreen";
import { ResultScreen } from "./components/ResultScreen";

type GameState = "LOGIN" | "LOBBY" | "PLAYING" | "RESULT";

// Server Opcodes
const OPCODE_MOVE = 1;
const OPCODE_GAME_STATE = 2;
const OPCODE_GAME_OVER = 3;
const OPCODE_START = 4;

function App() {
  const [gameState, setGameState] = useState<GameState>("LOGIN");
  const [nickname, setNickname] = useState("");
  const [session, setSession] = useState<any>(null);
  
  // Game data
  const [matchId, setMatchId] = useState<string>("");
  const [board, setBoard] = useState<string[]>(Array(9).fill(""));
  const [currentTurn, setCurrentTurn] = useState<string>("");
  const [players, setPlayers] = useState<any>({});
  const [deadline, setDeadline] = useState<number | null>(null);
  
  // Result data
  const [resultData, setResultData] = useState<any>(null);

  const socket = getSocket();

  useEffect(() => {
    if (!socket) return;

    socket.onmatchmakermatched = async (matched: any) => {
      console.log("Matchmaker matched:", matched);
      try {
        const matchIdArg = matched.match_id || undefined;
        const tokenArg = matched.token || undefined;
        // Nakama joinMatch takes match_id or token. Passing undefined can sometimes cause unhandled promises in the socket adapter.
        const match = await socket.joinMatch(matchIdArg, tokenArg);
        setMatchId(match.match_id);
      } catch (err) {
        console.error("Match join error", err);
      }
    };

    socket.onmatchdata = (matchState: any) => {
      const opCode = matchState.op_code;
      const data = matchState.data ? JSON.parse(new TextDecoder().decode(matchState.data)) : null;

      if (opCode === OPCODE_START || opCode === OPCODE_GAME_STATE) {
        setBoard(data.board);
        setCurrentTurn(data.currentTurn);
        setPlayers(data.players);
        setDeadline(data.deadline || null);
        setGameState("PLAYING");
      } 
      else if (opCode === OPCODE_GAME_OVER) {
        setBoard(data.board);
        setResultData(data);
        setGameState("RESULT");
      }
    };
    
    return () => {
      // Clean up if App unmounts (optional since it's top level)
    };
  }, [socket]);

  const handleLogin = (sess: any, nick: string) => {
    setSession(sess);
    setNickname(nick);
    setGameState("LOBBY");
  };

  const handleCustomMatch = async (mId: string) => {
    if (!socket) return;
    try {
      const match = await socket.joinMatch(mId);
      setMatchId(match.match_id);
    } catch (err) {
      console.error("Failed to join custom match", err);
    }
  };

  const handleMove = (position: number) => {
    if (!socket || !matchId) return;
    socket.sendMatchState(matchId, OPCODE_MOVE, JSON.stringify({ position }));
  };

  const resetToLobby = () => {
    setMatchId("");
    setBoard(Array(9).fill(""));
    setResultData(null);
    setDeadline(null);
    setGameState("LOBBY");
  };

  return (
    <div className="app-container">
      {gameState === "LOGIN" && (
        <LoginScreen onLogin={handleLogin} />
      )}
      
      {gameState === "LOBBY" && (
        <LobbyScreen 
          nickname={nickname} 
          session={session}
          socket={socket}
          onMatchFound={handleCustomMatch}
        />
      )}
      
      {gameState === "PLAYING" && (
        <GameScreen 
          board={board}
          currentTurn={currentTurn}
          myUserId={session?.user_id}
          players={players}
          deadline={deadline}
          onMove={handleMove}
        />
      )}
      
      {gameState === "RESULT" && (
        <ResultScreen 
          winnerId={resultData?.winner}
          winnerSymbol={resultData?.winnerSymbol}
          isDraw={resultData?.isDraw}
          reason={resultData?.reason}
          players={resultData?.players}
          myUserId={session?.user_id}
          session={session}
          onBackToLobby={resetToLobby}
        />
      )}
    </div>
  );
}

export default App;