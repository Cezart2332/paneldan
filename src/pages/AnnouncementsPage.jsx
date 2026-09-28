import { useState } from 'react';
import { FiSend, FiUsers } from 'react-icons/fi';
import { adminApi } from '../api';

const initialForm = { title: '', body: '', target: 'all', url: '' };

function isValidLink(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export default function AnnouncementsPage() {
  const [form, setForm] = useState(initialForm);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null);

  const resetForm = () => {
    setForm(initialForm);
    setResult(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      setMessage('Titlul si mesajul sunt obligatorii.');
      return;
    }
    const url = form.url.trim();
    if (url && !isValidLink(url)) {
      setMessage('Linkul trebuie sa inceapa cu https://');
      return;
    }
    setSending(true);
    setMessage('');
    setResult(null);

    try {
      const res = await adminApi.sendAnnouncement({
        title: form.title.trim(),
        body: form.body.trim(),
        target: form.target,
        ...(url ? { url } : {}),
      });
      setResult(res);
      setForm(initialForm);
    } catch (e) {
      setMessage(e?.message || 'Nu am putut trimite anuntul.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Anunturi</h1>
        <p>Trimite notificari push catre utilizatori cu anunturi importante.</p>
      </div>

      {message ? <div className="form-error">{message}</div> : null}

      {result ? (
        <div className="form-success">
          <p>
            Anunt trimis cu succes! Notificari livrate:{' '}
            <strong>{result.sentCount}</strong> din{' '}
            <strong>{result.totalTokens}</strong> dispozitive.
          </p>
          <button className="btn btn-primary" onClick={resetForm}>
            Trimite alt anunt
          </button>
        </div>
      ) : (
        <div className="form-card">
          <h3>Anunt nou</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Titlu</label>
              <input
                type="text"
                required
                maxLength={100}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: Actualizare importanta"
              />
              <span className="form-hint">{form.title.length}/100</span>
            </div>

            <div className="form-group">
              <label>Mesaj</label>
              <textarea
                required
                maxLength={500}
                rows={4}
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="Scrie mesajul anuntului aici..."
              />
              <span className="form-hint">{form.body.length}/500</span>
            </div>

            <div className="form-group">
              <label>Link (optional)</label>
              <input
                type="url"
                maxLength={500}
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://danfostanxios.ro/..."
              />
              <span className="form-hint">
                In aplicatie, notificarea va avea butonul „Deschide linkul”. Linkurile scrise direct in mesaj devin si
                ele clickabile.
              </span>
            </div>

            <div className="form-group">
              <label>Trimite catre</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="target"
                    value="all"
                    checked={form.target === 'all'}
                    onChange={() => setForm({ ...form, target: 'all' })}
                  />
                  <span className="radio-text">
                    <FiUsers /> Toti utilizatorii
                  </span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="target"
                    value="premium"
                    checked={form.target === 'premium'}
                    onChange={() => setForm({ ...form, target: 'premium' })}
                  />
                  <span className="radio-text">
                    <FiUsers /> Doar Premium / VIP / Pro
                  </span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={sending || !form.title.trim() || !form.body.trim()}
            >
              <FiSend /> {sending ? 'Se trimite...' : 'Trimite anuntul'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
