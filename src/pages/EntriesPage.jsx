import { useEffect, useState, useCallback, useRef } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import { adminApi } from '../api';
import WellbeingEntries from './WellbeingEntries';

function EntryTabs({ kind, onChange }) {
  return <div className="toolbar" role="tablist" aria-label="Tipul de progres">{[['journal','Jurnale'],['checkins','Check-in-uri'],['sessions','Sesiuni SOS']].map(([id,label]) => <button key={id} role="tab" aria-selected={kind===id} className={`btn ${kind===id?'btn-primary':'btn-ghost'}`} onClick={()=>onChange(id)}>{label}</button>)}</div>;
}

export default function EntriesPage() {
  const [kind, setKind] = useState('journal');
  return <><EntryTabs kind={kind} onChange={setKind} />{kind === 'journal' ? <JournalEntries /> : <WellbeingEntries key={kind} kind={kind} />}</>;
}
function JournalEntries() {
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [userFilter, setUserFilter] = useState('');
  const [since, setSince] = useState('');
  const [until, setUntil] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedCells, setExpandedCells] = useState({});
  const requestVersion = useRef(0);

  const load = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    try {
      const res = await adminApi.progress(page, userFilter, since ? new Date(`${since}T00:00:00`).toISOString() : '', until ? new Date(`${until}T23:59:59.999`).toISOString() : '');
      if (requestVersion.current !== version) return;
      setEntries(res.items || []);
      setTotal(res.total || 0);
      setError('');
    } catch (failure) { if (requestVersion.current === version) setError(failure.message); }
    if (requestVersion.current === version) setLoading(false);
  }, [page, userFilter, since, until]);

  useEffect(() => { const timer = setTimeout(load, 0); return () => { clearTimeout(timer); requestVersion.current += 1; }; }, [load]);

  const handleDelete = async (id) => {
    if (!confirm('Sigur vrei să ștergi această intrare?')) return;
    try {
      await adminApi.deleteProgress(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      setTotal((t) => t - 1);
    } catch (failure) { setError(failure.message); }
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
        <label>De la <input aria-label="Jurnale de la" type="date" className="search-input" value={since} onChange={(e)=>{setSince(e.target.value);setPage(1);}} /></label>
        <label>Până la <input aria-label="Jurnale până la" type="date" className="search-input" value={until} onChange={(e)=>{setUntil(e.target.value);setPage(1);}} /></label>
        <input
          type="text"
          placeholder="Filtrează după User ID..."
          value={userFilter}
          onChange={(e) => { setUserFilter(e.target.value); setPage(1); }}
          className="search-input search-input--sm"
        />
      </div>
      {error && <p role="alert">{error} <button className="btn btn-ghost" onClick={load}>Reîncearcă</button></p>}

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
                  <th>Abonament</th>
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
                      <span className={`badge badge--sub-${normalizeSubscriptionType(e.subscription_type)}`}>
                        {normalizeSubscriptionType(e.subscription_type)}
                      </span>
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
                    <td className="td-date">{fmtDate(e.client_date || e.created_at)}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(e.id)} title="Șterge"><FiTrash2 /></button>
                    </td>
                  </tr>
                ))}
                {entries.length === 0 && (
                  <tr><td colSpan="8" className="td-empty">Nu există intrări de progres.</td></tr>
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
  const textRef = useRef(null);
  const [isExpandable, setIsExpandable] = useState(false);
  const value = text?.trim() || '–';

  useEffect(() => {
    if (expanded) return;

    const id = window.requestAnimationFrame(() => {
      const el = textRef.current;
      if (!el) return;
      setIsExpandable(el.scrollHeight > el.clientHeight + 1);
    });

    return () => window.cancelAnimationFrame(id);
  }, [value, expanded]);

  useEffect(() => {
    if (expanded) return;

    const onResize = () => {
      const el = textRef.current;
      if (!el) return;
      setIsExpandable(el.scrollHeight > el.clientHeight + 1);
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [expanded]);

  return (
    <td className={`td-desc${expanded ? ' td-desc--expanded' : ''}`}>
      <div ref={textRef} className="td-desc__text">{value}</div>
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

function normalizeSubscriptionType(type) {
  const value = String(type || '').toLowerCase();
  if (value === 'pro') return 'premium';
  if (value === 'trial' || value === 'basic' || value === 'premium' || value === 'vip') return value;
  return 'none';
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
