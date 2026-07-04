import { useState } from 'react';
import { adminApi, setToken } from '../api';

export default function LoginPage({ onLogin }) {
  const [token, setTokenVal] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const trimmed = token.trim();
      await adminApi.login(trimmed);
      setToken(trimmed);
      onLogin();
    } catch (err) {
      const msg = err.message || 'Token invalid';
      if (msg.includes('ADMIN_TOKEN nu este configurat')) {
        setError('Backend-ul nu are ADMIN_TOKEN setat. Adauga variabila in .env / Coolify si reporneste serverul.');
      } else if (msg === 'Token invalid') {
        setError(
          'Token invalid. Verifica ca folosesti ADMIN_TOKEN de pe acelasi server la care se conecteaza panelul (local vs productie).'
        );
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <img src="/brandmark.png" alt="Dan fost anxios" className="login-logo-img" />
          <p>Panou de administrare</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="token">Token Admin</label>
            <input
              id="token"
              type="password"
              placeholder="Introdu token-ul de admin..."
              value={token}
              onChange={(e) => setTokenVal(e.target.value)}
              autoFocus
            />
          </div>
          {error && <div className="form-error">{error}</div>}
          <button type="submit" className="btn btn-primary btn-full" disabled={loading || !token.trim()}>
            {loading ? 'Se verifică...' : 'Autentificare'}
          </button>
        </form>
      </div>
    </div>
  );
}
