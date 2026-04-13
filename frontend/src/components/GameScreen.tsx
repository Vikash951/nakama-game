import React, { useState, useEffect } from 'react';

interface GameScreenProps {
  board: string[];
  currentTurn: string;
  myUserId: string;
  players: any;
  deadline?: number | null;
  onMove: (position: number) => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({ board, currentTurn, myUserId, players, deadline, onMove }) => {
  const isMyTurn = currentTurn === myUserId;
  const myPlayer = players[myUserId];
  const opponent = Object.values(players).find((p: any) => p !== myPlayer) as any;

  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    if (!deadline) return;
    
    setTimeLeft(30);
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentTurn, deadline]);

  return (
    <div className="glass-panel">
      <div className="turn-indicator" style={{ border: isMyTurn ? '1px solid var(--accent-color)' : '1px solid transparent' }}>
        <div className={`player-tag x ${myPlayer?.symbol === 'X' ? 'active' : ''}`}>
          <div className="symbol">X</div>
          <span>{myPlayer?.symbol === 'X' ? 'You' : opponent?.displayName || 'Opponent'}</span>
        </div>
        
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>
          {isMyTurn ? <span style={{ color: 'var(--accent-color)' }}>YOUR TURN</span> : 'WAITING...'}
          {deadline && (
             <div style={{ marginTop: '0.5rem', color: timeLeft <= 10 ? '#ef4444' : 'var(--text-secondary)', fontSize: '1.2rem', fontFamily: 'monospace' }}>
                ⏱ {timeLeft}s
             </div>
          )}
        </div>

        <div className={`player-tag o ${myPlayer?.symbol === 'O' ? 'active' : ''}`}>
          <span>{myPlayer?.symbol === 'O' ? 'You' : opponent?.displayName || 'Opponent'}</span>
          <div className="symbol">O</div>
        </div>
      </div>

      <div className="board">
        {board.map((cell, idx) => {
          const isEmpty = cell === '';
          return (
            <div 
              key={idx} 
              className={`cell ${isEmpty && isMyTurn ? 'enabled' : ''}`}
              onClick={() => {
                if (isEmpty && isMyTurn) onMove(idx);
              }}
            >
              {cell === 'X' && <span className="x">✕</span>}
              {cell === 'O' && <span className="o">◯</span>}
            </div>
          );
        })}
      </div>
      
      <div className="status-text">
        Match ID: <span style={{ fontFamily: 'monospace', opacity: 0.5 }}>Playing</span>
      </div>
    </div>
  );
};
