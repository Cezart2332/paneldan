import { useCallback, useEffect, useRef, useState } from 'react';
import { FiAlertTriangle, FiBookOpen, FiCheckCircle, FiClock, FiRefreshCw, FiSend, FiUsers, FiXCircle } from 'react-icons/fi';
import { adminApi } from '../api';

const POLL_MS = 2000;

function formatBytes(bytes) {
  if (!bytes) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(value) {
  if (!value) return '–';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '–';
  return date.toLocaleString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const STATUS_LABELS = { sent: 'Trimis', failed: 'Eșuat', sending: 'Se trimite' };
const STATUS_BADGES = { sent: 'resolved', failed: 'failed', sending: 'in_progress' };
const SOURCE_LABELS = { bulk: 'Manual (buton)', new_subscription: 'Automat (abonament nou)' };

export default function BooksPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [starting, setStarting] = useState(false);
  const pollRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await adminApi.books();
      setData(res);
      setError('');
      return res;
    } catch (e) {
      setError(e?.message || 'Nu am putut încărca starea cărților.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cât timp trimiterea rulează pe server, reîmprospătăm progresul.
  const running = Boolean(data?.job?.running);
  useEffect(() => {
    if (!running) return undefined;
    pollRef.current = setInterval(load, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [running, load]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSend = async () => {
    const pending = data?.stats?.pending || 0;
    const confirmed = window.confirm(
      `Trimiți cele 2 cărți PDF pe email la ${pending} ${pending === 1 ? 'abonat' : 'abonați'} Premium/VIP care nu le-au primit încă?`
    );
    if (!confirmed) return;

    setStarting(true);
    setError('');
    setNotice('');
    try {
      const res = await adminApi.sendBooks();
      if (res.reason === 'NOTHING_PENDING') setNotice('Toți abonații Premium/VIP au primit deja cărțile.');
      if (res.reason === 'ALREADY_RUNNING') setNotice('O trimitere este deja în curs.');
      await load();
    } catch (e) {
      setError(e?.message || 'Trimiterea nu a putut porni.');
    } finally {
      setStarting(false);
    }
  };

  if (loading) return <div className="page-loading">Se încarcă...</div>;

  const files = data?.files;
  const stats = data?.stats || {};
  const job = data?.job;
  const recent = data?.recent || [];
  const tooLarge = files && files.encodedBytes > files.maxEmailBytes;
  const canSend = Boolean(files?.ready) && (stats.pending || 0) > 0 && !running && !starting;
  const done = job ? job.sent + job.failed + job.skipped : 0;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Cărți PDF</h1>
        <p>Trimite cele 2 cărți cadou pe email abonaților Premium și VIP.</p>
      </div>

      {error ? <div className="form-error">{error}</div> : null}
      {notice ? <div className="form-info">{notice}</div> : null}

      <div className="stats-grid">
        <StatCard icon={FiUsers} label="Abonați Premium/VIP activi" value={stats.activeSubscribers ?? '–'} color="blue" />
        <StatCard icon={FiCheckCircle} label="Au primit cărțile" value={stats.sent ?? '–'} color="green" />
        <StatCard icon={FiClock} label="De trimis" value={stats.pending ?? '–'} color="orange" sub="abonați activi fără cărți" />
        <StatCard icon={FiXCircle} label="Eșuate" value={stats.failed ?? '–'} color="red" sub="se reîncearcă la următoarea trimitere" />
      </div>

      <div className="form-card">
        <h3>Fișierele</h3>
        <p className="form-hint books-hint">
          Pune fișierele <strong>pdf1.pdf</strong> și <strong>pdf2.pdf</strong> în folderul{' '}
          <code className="books-path">{files?.dir}</code> din containerul backend-ului.
        </p>
        <div className="books-files">
          {(files?.files || []).map((file) => (
            <div key={file.key} className={`books-file${file.found ? '' : ' books-file--missing'}`}>
              <span className="books-file__icon">{file.found ? <FiCheckCircle /> : <FiAlertTriangle />}</span>
              <div className="books-file__body">
                <div className="books-file__name">{file.key}.pdf</div>
                <div className="books-file__meta">
                  {file.found
                    ? `${formatBytes(file.size)} · în email apare ca „${file.attachmentName}”`
                    : 'Lipsește — încarcă fișierul în folderul de mai sus'}
                </div>
              </div>
            </div>
          ))}
        </div>
        {tooLarge ? (
          <div className="form-error">
            Fișierele au împreună {formatBytes(files.totalBytes)}, prea mult pentru un email (limita Resend e 40 MB
            după codare). Micșorează PDF-urile.
          </div>
        ) : null}
        <button type="button" className="btn btn-ghost btn-sm" onClick={load}>
          <FiRefreshCw /> Verifică din nou
        </button>
      </div>

      <div className="form-card">
        <h3>Trimite cărțile</h3>
        <p className="form-hint books-hint">
          Primesc doar abonații Premium și VIP activi care nu au primit încă cărțile. Fiecare cont le primește o
          singură dată, chiar dacă apeși butonul de mai multe ori.
        </p>

        {running ? (
          <div className="books-progress">
            <div className="books-progress__label">
              Se trimite… {done} din {job.total} ({job.sent} trimise{job.failed ? `, ${job.failed} eșuate` : ''})
            </div>
            <div className="books-progress__bar">
              <div className="books-progress__fill" style={{ width: `${job.total ? (done / job.total) * 100 : 0}%` }} />
            </div>
          </div>
        ) : job?.finishedAt && job.total > 0 ? (
          <div className="form-success">
            Ultima trimitere ({formatDate(job.finishedAt)}): <strong>{job.sent}</strong> trimise
            {job.failed ? (
              <>
                , <strong>{job.failed}</strong> eșuate{job.lastError ? ` — ultima eroare: ${job.lastError}` : ''}
              </>
            ) : null}
            .
          </div>
        ) : null}

        <button type="button" className="btn btn-primary" onClick={handleSend} disabled={!canSend}>
          <FiSend />{' '}
          {starting
            ? 'Se pornește...'
            : running
              ? 'Trimitere în curs...'
              : !stats.pending
                ? 'Toți abonații au primit cărțile'
                : `Trimite la ${stats.pending} ${stats.pending === 1 ? 'abonat' : 'abonați'}`}
        </button>

        <p className="form-hint books-hint books-hint--auto">
          <FiBookOpen /> <strong>Automat:</strong> fiecare cont care își face primul abonament Premium sau VIP primește
          cărțile pe email imediat. Reînnoirile și revenirile după o pauză nu le primesc din nou.
        </p>
      </div>

      <div className="form-card">
        <h3>Ultimele trimiteri</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Utilizator</th>
                <th>Tip</th>
                <th>Status</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={4} className="td-empty">Nicio trimitere încă.</td>
                </tr>
              ) : (
                recent.map((row) => (
                  <tr key={row.userId} className={row.status === 'failed' ? 'tr-warn' : undefined}>
                    <td className="td-user">
                      <div className="td-user__name">{row.name || `Utilizator #${row.userId}`}</div>
                      <div className="td-user__email">{row.email || '–'}</div>
                    </td>
                    <td>{SOURCE_LABELS[row.source] || row.source}</td>
                    <td>
                      <span className={`badge badge--${STATUS_BADGES[row.status] || 'closed'}`}>
                        {STATUS_LABELS[row.status] || row.status}
                      </span>
                      {row.status === 'failed' && row.error ? <div className="books-error">{row.error}</div> : null}
                    </td>
                    <td className="td-date">{formatDate(row.sentAt || row.updatedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, sub }) {
  const Icon = icon;
  return (
    <div className={`stat-card stat-card--${color}`}>
      <div className="stat-card__icon"><Icon /></div>
      <div className="stat-card__body">
        <div className="stat-card__value">{value}</div>
        <div className="stat-card__label">{label}</div>
        {sub && <div className="stat-card__sub">{sub}</div>}
      </div>
    </div>
  );
}
