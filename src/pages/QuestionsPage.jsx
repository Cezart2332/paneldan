import { useEffect, useState, useCallback } from 'react';
import { FiCheckCircle, FiMail } from 'react-icons/fi';
import { adminApi } from '../api';

export default function QuestionsPage() {
  const [questions, setQuestions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.questions(page, statusFilter);
      setQuestions(res.items || []);
      setTotal(res.total || 0);
    } catch {}
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await adminApi.updateQuestion(id, newStatus);
      setQuestions((prev) => prev.map((q) => q.id === id ? { ...q, status: newStatus } : q));
    } catch {}
  };

  const totalPages = Math.max(1, Math.ceil(total / 50));

  return (
    <div className="page">
      <div className="page-header">
        <h1>Întrebări</h1>
        <p>{total} întrebări primite</p>
      </div>

      <div className="toolbar">
        <div className="filter-group">
          <label>Status:</label>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">Toate</option>
            <option value="new">Noi</option>
            <option value="read">Citite</option>
            <option value="answered">Răspunse</option>
            <option value="archived">Arhivate</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="page-loading">Se încarcă...</div>
      ) : (
        <>
          <div className="cards-list">
            {questions.map((q) => (
              <div key={q.id} className={`question-card question-card--${q.status}`}>
                <div className="question-card__header" onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}>
                  <div className="question-card__meta">
                    <span className={`badge badge--${q.status}`}>{statusLabel(q.status)}</span>
                    <span className="question-card__user">{q.user_name || q.name || q.email || q.q_email || 'Anonim'}</span>
                    <span className="question-card__date">{fmtDate(q.created_at)}</span>
                  </div>
                  <div className="question-card__preview">
                    {q.question?.slice(0, 120)}{q.question?.length > 120 ? '...' : ''}
                  </div>
                </div>
                {expandedId === q.id && (
                  <div className="question-card__body">
                    <div className="question-card__full">{q.question}</div>
                    {q.q_email && <div className="question-card__detail"><FiMail /> {q.q_email}</div>}
                    {q.consent ? <div className="question-card__detail"><FiCheckCircle /> Consimțământ acordat</div> : null}
                    <div className="question-card__actions">
                      <label>Schimbă status:</label>
                      <select value={q.status} onChange={(e) => handleStatusChange(q.id, e.target.value)}>
                        <option value="new">Nou</option>
                        <option value="read">Citit</option>
                        <option value="answered">Răspuns</option>
                        <option value="archived">Arhivat</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {questions.length === 0 && <div className="empty-state">Nu există întrebări{statusFilter ? ` cu status "${statusLabel(statusFilter)}"` : ''}.</div>}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}

function statusLabel(s) {
  return { new: 'Nou', read: 'Citit', answered: 'Răspuns', archived: 'Arhivat' }[s] || s;
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
