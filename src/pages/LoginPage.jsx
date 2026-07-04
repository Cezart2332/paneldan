import { useEffect, useState } from 'react';
import { adminApi, clearToken, setToken } from '../api';

export default function LoginPage({ onLogin }) {
  const [token, setTokenVal] = useState('');
  const [error, setError] = useState('');
  const [hint, setHint] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    adminApi.adminStatus()
      .then((data) => {
        if (data?.adminTokenConfigured === false) {
          setHint(
            'Backend-ul API nu are ADMIN_TOKEN setat. Adauga variabila in Coolify la serviciul backend (api.danfostanxios.ro), nu la paneldan, apoi redeploy.'
          );
        }
      })
      .catch(() => {
        setHint('Nu am putut contacta backend-ul. Verifica ca API-ul ruleaza si ca panelul e conectat la serverul corect.');
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      clearToken();
      const trimmed = token.trim();
      await adminApi.login(trimmed);
      setToken(trimmed);
      onLogin();
    } catch (err) {
      const msg = err.message || 'Token invalid';
      if (msg.includes('ADMIN_TOKEN nu este configurat')) {
        setError('Backend-ul nu are ADMIN_TOKEN setat. Adauga variabila in Coolify la serviciul API si fa redeploy.');
      } else if (msg === 'Token invalid') {
        setError(
          'Token invalid. Foloseste exact valoarea variabilei ADMIN_TOKEN de pe serviciul API (backend), fara ghilimele sau spatii. Dupa ce o schimbi in Coolify, fa redeploy la backend.'
        );
      } else if (msg.includes('Request failed')) {
        setError(`Nu am putut contacta backend-ul (${msg}).`);
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
          {hint && !error ? <div className="form-hint">{hint}</div> : null}
          {error && <div className="form-error">{error}</div>}
          <button type="submit" className="btn btn-primary btn-full" disabled={loading || !token.trim()}>
            {loading ? 'Se verifică...' : 'Autentificare'}
          </button>
        </form>
      </div>
    </div>
  );
}
