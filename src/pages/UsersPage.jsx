import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../api';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.users(page, search);
      setUsers(res.items || []);
      setTotal(res.total || 0);
    } catch {}
    setLoading(false);
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / 50));

  return (
    <div className="page">
      <div className="page-header">
        <h1>Utilizatori</h1>
        <p>{total} utilizatori înregistrați</p>
      </div>

      <div className="toolbar">
        <input
          type="text"
          placeholder="Caută după email sau nume..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="search-input"
        />
      </div>

      {loading ? (
        <div className="page-loading">Se încarcă...</div>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Nume</th>
                  <th>Provider</th>
                  <th>Înregistrat</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="td-mono">{u.id}</td>
                    <td>{u.email || '–'}</td>
                    <td>{u.name || '–'}</td>
                    <td><span className={`badge badge--${u.provider}`}>{u.provider}</span></td>
                    <td className="td-date">{fmtDate(u.created_at)}</td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan="5" className="td-empty">Niciun utilizator găsit</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="pagination">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)}>← Înapoi</button>
      <span>Pagina {page} / {totalPages}</span>
      <button disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Înainte →</button>
    </div>
  );
}

function fmtDate(d) {
  if (!d) return '–';
  return new Date(d).toLocaleDateString('ro-RO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
