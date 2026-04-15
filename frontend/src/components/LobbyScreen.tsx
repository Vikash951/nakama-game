import React, { useState, useEffect } from 'react';
import { client } from '../nakama';

interface LeaderboardRecord {
  owner_id: string;
  username: string;
  score: string;
  rank: string;
}

interface LobbyScreenProps {
  nickname: string;
  session: any;
  socket: any;
  onMatchFound: (matchId: string) => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({ nickname, session, socket,
  onMatchFound
}) => {
  const [isSearching, setIsSearching] = useState(false);
  const [matchmakerTicket, setMatchmakerTicket] = useState('');
  const [gameMode, setGameMode] = useState<'classic' | 'timed'>('classic');
  const [leaderboard, setLeaderboard] = useState<LeaderboardRecord[]>([]);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      // The leaderboard ID must match the one we write to in InitModule "tictactoe_global"
      const result = await client.listLeaderboardRecords(session, 'tictactoe_global', [], 5);
      setLeaderboard((result.records || []) as any);
    } catch (err: any) {
      if (err.message && err.message.includes('404')) {
        // Leaderboard doesn't exist yet, which is fine before the first game is played.
        setLeaderboard([]);
      } else {
        console.warn('Failed to load leaderboard', err);
      }
    }
  };

  const findMatch = async () => {
    if (!socket) return;
    try {
      setIsSearching(true);
      const query = `+properties.mode:${gameMode}`;
      const response = await socket.addMatchmaker(query, 2, 2, { mode: gameMode });
      setMatchmakerTicket(response.ticket);
    } catch (err) {
      console.error("Failed to add matchmaker:", err);
      setIsSearching(false);
    }
  };

  const cancelMatchmaking = async () => {
    if (!socket) return;
    try {
      if (matchmakerTicket) {
        await socket.removeMatchmaker(matchmakerTicket);
      }
      setIsSearching(false);
      setMatchmakerTicket('');
    } catch (err) {
      console.error("Failed to cancel matchmaking:", err);
    }
  };

  const createCustomRoom = async () => {
    try {
      const response = await client.rpc(session, 'create_match', {});
      if (response.payload) {
        const payload = typeof response.payload === 'string' ? JSON.parse(response.payload) : response.payload;
        onMatchFound(payload.matchId);
      }
    } catch (err) {
      console.error("Failed to create custom room:", err);
    }
  };

  return (
    <div className="glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Welcome, {nickname}</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ width: 10, height: 10, background: 'var(--success-color)', borderRadius: '50%', boxShadow: '0 0 10px var(--success-color)' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Online</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        {!isSearching && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className={`btn ${gameMode === 'classic' ? '' : 'secondary'}`}
              style={{ flex: 1, padding: '0.75rem', fontSize: '1rem' }}
              onClick={() => setGameMode('classic')}
            >
              Classic
            </button>
            <button
              className={`btn ${gameMode === 'timed' ? '' : 'secondary'}`}
              style={{ flex: 1, padding: '0.75rem', fontSize: '1rem' }}
              onClick={() => setGameMode('timed')}
            >
              Timed Mode
            </button>
          </div>
        )}
        {isSearching ? (
          <button className="btn secondary" onClick={cancelMatchmaking}>
            Cancel Matchmaking...
          </button>
        ) : (
          <>
            <button className="btn" onClick={findMatch} style={{ padding: '1.25rem' }}>
              <span style={{ fontSize: '1.4rem', marginRight: '0.5rem' }}>⚔️</span> Find Match
            </button>
            <button 
             // className="btn secondary" 
              onClick={createCustomRoom} 
            //  style={{ padding: '0.75rem', fontSize: '0.9rem' }}
            >
              .
            </button>
          </>
        )}
      </div>

      <div className="leaderboard">
        <div className="leaderboard-header">🏆 Top Players</div>
        {leaderboard.length === 0 ? (
          <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            No records yet. Be the first!
          </div>
        ) : (
          leaderboard.map((r) => (
            <div key={r.owner_id} className="leaderboard-row">
              <span>{r.rank}. {r.username}</span>
              <span style={{ fontWeight: 600, color: 'var(--accent-color)' }}>{r.score} wins</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
