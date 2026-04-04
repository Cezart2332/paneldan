import { useCallback, useEffect, useState } from 'react';
import { FiEdit2, FiTrash2, FiVideo } from 'react-icons/fi';
import { adminApi } from '../api';

const WEBINAR_STATUSES = ['scheduled', 'live', 'held', 'cancelled'];

const initialForm = {
  title: '',
  description: '',
  scheduled_at: '',
  access_link: '',
  status: 'scheduled',
  recording_link: '',
};

export default function WebinarsPage() {
  const [webinars, setWebinars] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const result = await adminApi.webinars({
        page,
        status: statusFilter,
        upcoming: showUpcoming,
        limit: 50,
      });
      setWebinars(Array.isArray(result?.items) ? result.items : []);
      setTotal(Number(result?.total || 0));
    } catch (e) {
      setMessage(e?.message || 'Nu am putut incarca webinariile.');
      setWebinars([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, showUpcoming]);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setForm(initialForm);
    setEditId(null);
    setShowForm(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');

    const payload = {
      title: form.title,
      description: form.description || null,
      scheduled_at: form.scheduled_at,
      access_link: form.access_link || null,
      status: form.status,
      recording_link: form.recording_link || null,
    };

    try {
      if (editId) {
        const res = await adminApi.updateWebinar(editId, payload);
        const notified = Number(res?.notified || 0);
        setMessage(`Webinar actualizat. Notificari trimise: ${notified}.`);
      } else {
        const res = await adminApi.createWebinar(payload);
        const notified = Number(res?.notified || 0);
        setMessage(`Webinar creat. Notificari trimise: ${notified}.`);
      }
      resetForm();
      load();
    } catch (e) {
      setMessage(e?.message || 'Nu am putut salva webinarul.');
    }
  };

  const handleEdit = (row) => {
    setForm({
      title: row.title || '',
      description: row.description || '',
      scheduled_at: row.scheduled_at ? toLocalInput(row.scheduled_at) : '',
      access_link: row.access_link || '',
      status: row.status || 'scheduled',
      recording_link: row.recording_link || '',
    });
    setEditId(row.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Sigur vrei sa stergi acest webinar?')) return;
    try {
      await adminApi.deleteWebinar(id);
      setMessage('Webinar sters.');
      load();
    } catch (e) {
      setMessage(e?.message || 'Nu am putut sterge webinarul.');
    }
  };

  const handleQuickStatusChange = async (id, status) => {
    try {
      const res = await adminApi.updateWebinar(id, { status });
      const notified = Number(res?.notified || 0);
      if (notified > 0) {
        setMessage(`Status webinar actualizat. Notificari trimise: ${notified}.`);
      }
      setWebinars((prev) => prev.map((row) => (row.id === id ? { ...row, status } : row)));
    } catch (e) {
      setMessage(e?.message || 'Nu am putut actualiza statusul webinarului.');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / 50));

  return (
    <div className="page">
      <div className="page-header">
        <h1>Webinarii</h1>
        <p>Creeaza webinarii, actualizeaza statusul si publica inregistrarile.</p>
      </div>

      <div className="toolbar">
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
          <FiVideo /> Webinar nou
        </button>

        <label className="filter-group">
          Status
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">Toate</option>
            <option value="scheduled">Programat</option>
            <option value="live">Live</option>
            <option value="held">Tinut</option>
            <option value="cancelled">Anulat</option>
          </select>
        </label>

        <label className="toggle-label">
          <input
            type="checkbox"
            checked={showUpcoming}
            onChange={(e) => {
              setShowUpcoming(e.target.checked);
              setPage(1);
            }}
          />
          Doar viitoare
        </label>
      </div>

      {message ? <div className="form-error">{message}</div> : null}

      {showForm ? (
        <div className="form-card">
          <h3>{editId ? 'Editeaza webinar' : 'Webinar nou'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Titlu</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex: Gestionarea atacurilor de panica"
                />
              </div>
              <div className="form-group">
                <label>Data si ora</label>
                <input
                  type="datetime-local"
                  required
                  value={form.scheduled_at}
                  onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="scheduled">Programat</option>
                  <option value="live">Live</option>
                  <option value="held">Tinut</option>
                  <option value="cancelled">Anulat</option>
                </select>
              </div>
              <div className="form-group">
                <label>Link participare</label>
                <input
                  type="url"
                  value={form.access_link}
                  onChange={(e) => setForm({ ...form, access_link: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Link inregistrare</label>
                <input
                  type="url"
                  value={form.recording_link}
                  onChange={(e) => setForm({ ...form, recording_link: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="form-group">
              <label>Descriere</label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Detalii despre webinar..."
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">{editId ? 'Salveaza' : 'Creeaza'}</button>
              <button type="button" className="btn btn-ghost" onClick={resetForm}>Anuleaza</button>
            </div>
          </form>
        </div>
      ) : null}

      {loading ? (
        <div className="page-loading">Se incarca...</div>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Titlu</th>
                  <th>Programat</th>
                  <th>Status</th>
                  <th>Participare</th>
                  <th>Inregistrare</th>
                  <th>Actiuni</th>
                </tr>
              </thead>
              <tbody>
                {webinars.map((row) => (
                  <tr key={row.id}>
                    <td className="td-mono">{row.id}</td>
                    <td>
                      <div className="td-user">
                        <span className="td-user__name">{row.title || 'Webinar'}</span>
                        <span className="td-user__email">{row.description ? crop(row.description, 60) : 'Fara descriere'}</span>
                      </div>
                    </td>
                    <td className="td-date">{fmtDate(row.scheduled_at)}</td>
                    <td>
                      <select
                        className={`badge-select badge-select--${WEBINAR_STATUSES.includes(row.status) ? row.status : 'scheduled'}`}
                        value={row.status || 'scheduled'}
                        onChange={(e) => handleQuickStatusChange(row.id, e.target.value)}
                      >
                        <option value="scheduled">Programat</option>
                        <option value="live">Live</option>
                        <option value="held">Tinut</option>
                        <option value="cancelled">Anulat</option>
                      </select>
                    </td>
                    <td>
                      {row.access_link ? (
                        <a className="contact-link" href={row.access_link} target="_blank" rel="noreferrer">Link live</a>
                      ) : '—'}
                    </td>
                    <td>
                      {row.recording_link ? (
                        <a className="contact-link" href={row.recording_link} target="_blank" rel="noreferrer">Inregistrare</a>
                      ) : '—'}
                    </td>
                    <td className="td-actions">
                      <button className="btn btn-sm btn-ghost" onClick={() => handleEdit(row)} title="Editeaza"><FiEdit2 /></button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(row.id)} title="Sterge"><FiTrash2 /></button>
                    </td>
                  </tr>
                ))}
                {!webinars.length ? (
                  <tr>
                    <td colSpan="7" className="td-empty">Nu exista webinarii.</td>
                  </tr>
                ) : null}
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
      <button disabled={page <= 1} onClick={() => onChange(page - 1)}>← Inapoi</button>
      <span>Pagina {page} / {totalPages}</span>
      <button disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Inainte →</button>
    </div>
  );
}

function fmtDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('ro-RO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toLocalInput(value) {
  const date = new Date(value);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function crop(value, maxChars) {
  const text = String(value || '');
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}...`;
}
