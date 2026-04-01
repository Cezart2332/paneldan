import { useEffect, useState, useCallback } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import { adminApi } from '../api';
import Pagination from '../components/Pagination';
import PageError from '../components/PageError';
import { fmtDateTime } from '../utils/formatters';
import { getErrorMessage } from '../utils/errors';

export default function EntriesPage() {
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [userFilter, setUserFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedCells, setExpandedCells] = useState({});
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.progress(page, userFilter);
      setEntries(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      setEntries([]);
      setTotal(0);
      setError(getErrorMessage(err, 'Nu am putut incarca jurnalele de progres.'));
    } finally {
      setLoading(false);
    }
  }, [page, userFilter]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!confirm('Sigur vrei să ștergi această intrare?')) return;
    try {
      await adminApi.deleteProgress(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      setTotal((t) => t - 1);
    } catch (err) {
      setError(getErrorMessage(err, 'Nu am putut sterge intrarea selectata.'));
    }
  };

  const toggleCell = (entryId, field) => {
    const key = `${entryId}:${field}`;
    setExpandedCells((prev) => ({ ...prev, [key]: !prev[key] }));
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
          <PageError message={error} />

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
                    <ExpandableTextCell
                      entryId={e.id}
                      field="description"
                      text={e.description}
                      expanded={Boolean(expandedCells[`${e.id}:description`])}
                      onToggle={toggleCell}
                    />
                    <ExpandableTextCell
                      entryId={e.id}
                      field="actions"
                      text={e.actions}
                      expanded={Boolean(expandedCells[`${e.id}:actions`])}
                      onToggle={toggleCell}
                    />
                    <td className="td-date">{fmtDateTime(e.client_date || e.created_at)}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(e.id)} title="Șterge"><FiTrash2 /></button>
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

function ExpandableTextCell({ entryId, field, text, expanded, onToggle }) {
  const value = text?.trim() || '–';
  const isExpandable = value !== '–' && value.length > 120;

  return (
    <td className={`td-desc${expanded ? ' td-desc--expanded' : ''}`}>
      <div className="td-desc__text">{value}</div>
      {isExpandable ? (
        <button
          type="button"
          className="td-desc__toggle"
          onClick={() => onToggle(entryId, field)}
        >
          {expanded ? 'Ascunde' : 'Vezi tot'}
        </button>
      ) : null}
    </td>
  );
}

function levelColor(level) {
  if (level <= 3) return 'green';
  if (level <= 6) return 'orange';
  return 'red';
}
