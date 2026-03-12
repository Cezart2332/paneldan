import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../api';

export default function EntriesPage() {
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [userFilter, setUserFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.progress(page, userFilter);
      setEntries(res.items || []);
      setTotal(res.total || 0);
    } catch {}
    setLoading(false);
  }, [page, userFilter]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!confirm('Sigur vrei să ștergi această intrare?')) return;
    try {
      await adminApi.deleteProgress(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      setTotal((t) => t - 1);
    } catch {}
  };

  const totalPages = Math.max(1, Math.ceil(total / 50));

  return (
    <div className="page">
      <div className="page-header">
        <h1>Jurnale Progres</h1>
        <p>{total} intrări de progres</p>
      </div>

      <div className="toolbar">
        <input
          type="text"
          placeholder="Filtrează după User ID..."
          value={userFilter}
          onChange={(e) => { setUserFilter(e.target.value); setPage(1); }}
          className="search-input search-input--sm"
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
                  <th>Utilizator</th>
                  <th>Nivel</th>
                  <th>Descriere</th>
                  <th>Acțiuni efectuate</th>
                  <th>Data</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id}>
                    <td className="td-mono">{e.id}</td>
                    <td>
                      <div className="td-user">
                        <span className="td-user__name">{e.user_name || '–'}</span>
                        <span className="td-user__email">{e.email || `#${e.user_id}`}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`level-badge level-badge--${levelColor(e.level)}`}>{e.level}/10</span>
                    </td>
                    <td className="td-desc">{e.description || '–'}</td>
                    <td className="td-desc">{e.actions || '–'}</td>
                    <td className="td-date">{fmtDate(e.client_date || e.created_at)}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(e.id)} title="Șterge">🗑️</button>
                    </td>
                  </tr>
                ))}
                {entries.length === 0 && (
                  <tr><td colSpan="7" className="td-empty">Nu există intrări de progres.</td></tr>
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

function levelColor(level) {
  if (level <= 3) return 'green';
  if (level <= 6) return 'orange';
  return 'red';
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
