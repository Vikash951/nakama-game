import React, { useEffect, useState } from 'react';
import { client } from '../nakama';

interface ResultScreenProps {
  winnerId: string | null;
  winnerSymbol: string | null;
  isDraw: boolean;
  reason: string;
  myUserId: string;
  players: any;
  session: any;
  onBackToLobby: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({ 
  winnerId, 
  winnerSymbol, 
  isDraw, 
  reason, 
  myUserId, 
  players, 
  session,
  onBackToLobby 
}) => {
  const isWinner = winnerId === myUserId;
  const isDeserter = reason === 'opponent_disconnected' && isWinner;
  const isTimeout = reason === 'timeout';

  return (
    <div className="glass-panel text-center">
      {isDraw ? (
        <>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🤝</div>
          <h1 className="title" style={{ background: 'linear-gradient(to right, #9ca3af, #f3f4f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            It's a Draw!
          </h1>
        </>
      ) : isWinner ? (
        <>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏆</div>
          <h1 className="title" style={{ background: 'linear-gradient(to right, #fbbf24, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Victory!
          </h1>
          {isDeserter ? (
             <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Opponent fled the battle.</p>
          ) : isTimeout ? (
             <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Opponent ran out of time!</p>
          ) : (
             <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>You crushed your opponent.</p>
          )}
        </>
      ) : (
        <>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💔</div>
          <h1 className="title" style={{ background: 'linear-gradient(to right, #ef4444, #f87171)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Defeat
          </h1>
          {isTimeout ? (
             <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>You ran out of time!</p>
          ) : (
             <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Better luck next time.</p>
          )}
        </>
      )}

      <button className="btn" onClick={onBackToLobby}>
        Back to Lobby
      </button>
    </div>
  );
};
