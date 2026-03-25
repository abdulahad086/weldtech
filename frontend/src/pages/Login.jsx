import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Galaxy from '../components/Galaxy';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'weldtech' && password === '12341234') {
      localStorage.setItem('isAuthenticated', 'true');
      navigate('/');
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <Galaxy />
      </div>
      
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', fontFamily: 'sans-serif' }}>
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.1)', 
          padding: '40px', 
          borderRadius: '12px', 
          backdropFilter: 'blur(10px)', 
          border: '1px solid rgba(255, 255, 255, 0.2)', 
          textAlign: 'center', 
          color: 'white', 
          minWidth: '320px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
        }}>
          <h2 style={{ marginBottom: '20px', fontSize: '28px', fontWeight: 'bold' }}>weldtech</h2>
          
          {error && <div style={{ color: '#ff6b6b', marginBottom: '15px', background: 'rgba(255, 0, 0, 0.1)', padding: '10px', borderRadius: '6px' }}>{error}</div>}
          
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input 
              type="text" 
              placeholder="Username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.3)', width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }}
              required
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.3)', width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }}
              required
            />
            <button 
              type="submit" 
              style={{ 
                padding: '12px', 
                borderRadius: '6px', 
                border: 'none', 
                background: '#4CAF50', 
                color: 'white', 
                fontWeight: 'bold', 
                cursor: 'pointer', 
                marginTop: '10px',
                fontSize: '16px',
                transition: 'background 0.3s'
              }}
              onMouseOver={(e) => e.target.style.background = '#45a049'}
              onMouseOut={(e) => e.target.style.background = '#4CAF50'}
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}