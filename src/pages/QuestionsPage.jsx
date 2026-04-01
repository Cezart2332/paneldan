import { useEffect, useState, useCallback } from 'react';
import { FiCheckCircle, FiMail } from 'react-icons/fi';
import { adminApi } from '../api';
import Pagination from '../components/Pagination';
import PageError from '../components/PageError';
import { fmtDateTime } from '../utils/formatters';
import { getErrorMessage } from '../utils/errors';

export default function QuestionsPage() {
  const [questions, setQuestions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.questions(page, statusFilter);
      setQuestions(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      setQuestions([]);
      setTotal(0);
      setError(getErrorMessage(err, 'Nu am putut incarca intrebarile.'));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (id, newStatus) => {
    setError('');
    try {
      await adminApi.updateQuestion(id, newStatus);
      setQuestions((prev) => prev.map((q) => q.id === id ? { ...q, status: newStatus } : q));
    } catch (err) {
      setError(getErrorMessage(err, 'Nu am putut actualiza statusul intrebarii.'));
    }
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
          <label htmlFor="questions-status-filter">Status:</label>
          <select id="questions-status-filter" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
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
          <PageError message={error} />

          <div className="cards-list">
            {questions.map((q) => (
              <div key={q.id} className={`question-card question-card--${q.status}`}>
                <button
                  type="button"
                  className="question-card__header"
                  onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                  aria-expanded={expandedId === q.id}
                  aria-controls={`question-card-body-${q.id}`}
                >
                  <div className="question-card__meta">
                    <span className={`badge badge--${q.status}`}>{statusLabel(q.status)}</span>
                    <span className="question-card__user">{q.user_name || q.name || q.email || q.q_email || 'Anonim'}</span>
                    <span className="question-card__date">{fmtDateTime(q.created_at)}</span>
                  </div>
                  <div className="question-card__preview">
                    {q.question?.slice(0, 120)}{q.question?.length > 120 ? '...' : ''}
                  </div>
                </button>
                {expandedId === q.id && (
                  <div id={`question-card-body-${q.id}`} className="question-card__body">
                    <div className="question-card__full">{q.question}</div>
                    {q.q_email && <div className="question-card__detail"><FiMail /> {q.q_email}</div>}
                    {q.consent ? <div className="question-card__detail"><FiCheckCircle /> Consimțământ acordat</div> : null}
                    <div className="question-card__actions">
                      <label htmlFor={`question-status-${q.id}`}>Schimba status:</label>
                      <select id={`question-status-${q.id}`} value={q.status} onChange={(e) => handleStatusChange(q.id, e.target.value)}>
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
