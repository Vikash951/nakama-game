import React, { useState } from 'react';
import { authenticateDevice, setDisplayName, connectSocket } from '../nakama';

interface LoginScreenProps {
  onLogin: (session: any, nickname: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!nickname.trim()) {
      setError('Nickname is required');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      const session = await authenticateDevice();
      const taggedName = await setDisplayName(session, nickname);
      
      // Phase 1 check: We need to connect the socket before entering the lobby
      await connectSocket(session);
      
      onLogin(session, taggedName);
    } catch (err: any) {
      setError(err.message || 'Failed to login');
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel text-center">
      <h1 className="title">Tic-Tac-Toe</h1>
      <h2 className="subtitle">Choose your avatar name</h2>
      
      <input
        className="input-field"
        placeholder="Enter nickname..."
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
        maxLength={15}
        autoFocus
      />
      
      {error && <p style={{ color: 'var(--danger-color)', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</p>}
      
      <button 
        className="btn" 
        onClick={handleLogin} 
        disabled={loading || !nickname.trim()}
      >
        {loading ? 'Connecting...' : 'Enter Arena'}
      </button>
    </div>
  );
};
