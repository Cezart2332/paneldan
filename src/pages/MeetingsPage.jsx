import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../api';

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [users, setUsers] = useState([]);

  // Form state
  const [form, setForm] = useState({ user_id: '', title: 'Ședință', notes: '', scheduled_at: '', duration_min: 60 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.meetings(page, showUpcoming);
      setMeetings(res.items || []);
      setTotal(res.total || 0);
    } catch {}
    setLoading(false);
  }, [page, showUpcoming]);

  useEffect(() => { load(); }, [load]);

  // Load users for the dropdown
  useEffect(() => {
    adminApi.users(1, '').then((res) => setUsers(res.items || [])).catch(() => {});
  }, []);

  const resetForm = () => {
    setForm({ user_id: '', title: 'Ședință', notes: '', scheduled_at: '', duration_min: 60 });
    setEditId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await adminApi.updateMeeting(editId, form);
      } else {
        await adminApi.createMeeting(form);
      }
      resetForm();
      load();
    } catch {}
  };

  const handleEdit = (m) => {
    setForm({
      user_id: m.user_id || '',
      title: m.title || 'Ședință',
      notes: m.notes || '',
      scheduled_at: m.scheduled_at ? toLocalInput(m.scheduled_at) : '',
      duration_min: m.duration_min || 60,
    });
    setEditId(m.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Sigur vrei să ștergi această ședință?')) return;
    try {
      await adminApi.deleteMeeting(id);
      load();
    } catch {}
  };

  const handleStatusChange = async (id, status) => {
    try {
      await adminApi.updateMeeting(id, { status });
      setMeetings((prev) => prev.map((m) => m.id === id ? { ...m, status } : m));
    } catch {}
  };

  const totalPages = Math.max(1, Math.ceil(total / 50));

  return (
    <div className="page">
      <div className="page-header">
        <h1>Ședințe</h1>
        <p>Programează și gestionează ședințele cu utilizatorii</p>
      </div>

      <div className="toolbar">
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>+ Programează ședință</button>
        <label className="toggle-label">
          <input type="checkbox" checked={showUpcoming} onChange={(e) => { setShowUpcoming(e.target.checked); setPage(1); }} />
          Doar viitoare
        </label>
      </div>

      {showForm && (
        <div className="form-card">
          <h3>{editId ? 'Editează ședința' : 'Ședință nouă'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Utilizator</label>
                <select value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })}>
                  <option value="">– Fără utilizator –</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name || u.email} (#{u.id})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Titlu</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Data și ora</label>
                <input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Durata (min)</label>
                <input type="number" min="15" max="480" value={form.duration_min} onChange={(e) => setForm({ ...form, duration_min: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Note</label>
              <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Note despre ședință..." />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">{editId ? 'Salvează' : 'Creează'}</button>
              <button type="button" className="btn btn-ghost" onClick={resetForm}>Anulează</button>
            </div>
          </form>
        </div>
      )}

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
                  <th>Titlu</th>
                  <th>Data</th>
                  <th>Durata</th>
                  <th>Status</th>
                  <th>Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {meetings.map((m) => {
                  const isPast = new Date(m.scheduled_at) < new Date();
                  return (
                    <tr key={m.id} className={isPast && m.status === 'scheduled' ? 'tr-warn' : ''}>
                      <td className="td-mono">{m.id}</td>
                      <td>
                        <div className="td-user">
                          <span className="td-user__name">{m.user_name || '–'}</span>
                          <span className="td-user__email">{m.email || (m.user_id ? `#${m.user_id}` : 'General')}</span>
                        </div>
                      </td>
                      <td>{m.title}</td>
                      <td className="td-date">{fmtDate(m.scheduled_at)}</td>
                      <td>{m.duration_min} min</td>
                      <td>
                        <select className={`badge-select badge-select--${m.status}`} value={m.status} onChange={(e) => handleStatusChange(m.id, e.target.value)}>
                          <option value="scheduled">Programat</option>
                          <option value="completed">Finalizat</option>
                          <option value="cancelled">Anulat</option>
                        </select>
                      </td>
                      <td className="td-actions">
                        <button className="btn btn-sm btn-ghost" onClick={() => handleEdit(m)} title="Editează">✏️</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(m.id)} title="Șterge">🗑️</button>
                      </td>
                    </tr>
                  );
                })}
                {meetings.length === 0 && (
                  <tr><td colSpan="7" className="td-empty">Nu există ședințe programate.</td></tr>
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

function toLocalInput(d) {
  const dt = new Date(d);
  const pad = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}
