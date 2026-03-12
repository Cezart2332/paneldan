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
      await adminApi.login(token.trim());
      setToken(token.trim());
      onLogin();
    } catch (err) {
      setError(err.message || 'Token invalid');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">🛡️</div>
          <h1>Panel Dan</h1>
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
