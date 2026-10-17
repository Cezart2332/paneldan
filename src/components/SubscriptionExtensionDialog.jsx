import { useEffect, useRef, useState } from 'react';
import { adminApi } from '../api';
import './subscription-extension.css';

const PERIODS = [1, 2, 3, 7, 14, 30, 60, 90, 365];
const formatDate = (date) => new Date(date).toLocaleString('ro-RO', {
  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

export default function SubscriptionExtensionDialog({ target, onClose, onExtended }) {
  const dialog = useRef(null);
  const operation = useRef(null);
  const [period, setPeriod] = useState('1');
  const [customDays, setCustomDays] = useState('1');
  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState('');
  const [previewRevision, setPreviewRevision] = useState(0);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const days = Number(period === 'custom' ? customDays : period);
  const valid = Number.isInteger(days) && days >= 1 && days <= 365;
  const all = target.scope === 'all';

  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    adminApi.subscriptionExtensionPreview({
      scope: target.scope,
      ...(all ? {} : { user_id: String(target.row.user_id) }),
    }, controller.signal)
      .then((data) => { if (!controller.signal.aborted) setPreview(data); })
      .catch((e) => { if (!controller.signal.aborted) setPreviewError(e.message); });
    return () => controller.abort();
  }, [target, all, previewRevision]);

  async function submit(event) {
    event.preventDefault();
    if (pending || !valid || !preview?.eligibleCount) return;
    const payload = { scope: target.scope, days, ...(all ? {} : { userId: Number(target.row.user_id) }) };
    const fingerprint = JSON.stringify(payload);
    // A retry after a lost response must not grant the same days twice.
    if (operation.current?.fingerprint !== fingerprint) {
      operation.current = { fingerprint, id: crypto.randomUUID() };
    }
    setPending(true);
    setError('');
    try {
      const result = await adminApi.extendSubscriptions({ ...payload, operationId: operation.current.id });
      onExtended(result);
    } catch (e) {
      setError(e.message);
      setPending(false);
    }
  }

  return (
    <dialog ref={dialog} className="subscription-extension-dialog" aria-labelledby="extension-title"
      onCancel={(event) => { event.preventDefault(); if (!pending) onClose(); }}>
      <form onSubmit={submit}>
        <h2 id="extension-title">{all ? 'Prelungire globală' : 'Prelungește abonamentul'}</h2>
        <p className="muted">
          {all ? 'Se aplică tuturor abonaților plătiți activi, indiferent de filtrele listei.'
            : `${target.row.name || `Cont #${target.row.user_id}`} · ${target.row.email || ''}`}
        </p>
        <p>Zilele se adaugă la data actuală de expirare. Sunt eligibile doar abonamentele plătite active, cu termen de expirare.</p>
        <div className="subscription-extension-fields">
          <label htmlFor="extension-period">Perioadă
            <select id="extension-period" value={period} disabled={pending}
              onChange={(event) => { setPeriod(event.target.value); setError(''); }}>
              {PERIODS.map((value) => <option key={value} value={value}>{value} {value === 1 ? 'zi' : 'zile'}</option>)}
              <option value="custom">Număr personalizat de zile</option>
            </select>
          </label>
          {period === 'custom' && <label htmlFor="extension-custom-days">Număr de zile (1–365)
            <input id="extension-custom-days" type="number" min="1" max="365" step="1" required
              value={customDays} disabled={pending} onChange={(event) => { setCustomDays(event.target.value); setError(''); }} />
          </label>}
        </div>
        {preview ? <div className="subscription-extension-summary">
          <strong>{preview.eligibleCount} {preview.eligibleCount === 1 ? 'abonament eligibil' : 'abonamente eligibile'}</strong>
          {preview.skippedLifetimeCount > 0 && <p className="muted">{preview.skippedLifetimeCount} fără termen de expirare — nu necesită prelungire.</p>}
          {!preview.eligibleCount && <p>Nu există abonamente care pot fi prelungite.</p>}
          {!all && valid && preview.eligibleCount > 0 && <dl>
            <div><dt>Expirare actuală</dt><dd>{formatDate(preview.endsAt)}</dd></div>
            <div><dt>Noua expirare</dt><dd>{formatDate(+new Date(preview.endsAt) + days * 86400000)}</dd></div>
          </dl>}
          {all && valid && <p>Fiecare abonament eligibil primește încă {days} {days === 1 ? 'zi' : 'zile'}.</p>}
        </div> : !previewError && <p role="status">Se verifică abonamentele eligibile…</p>}
        {previewError && <div className="analytics-error" role="alert">
          <p>{previewError}</p>
          <button type="button" className="btn" onClick={() => { setPreviewError(''); setPreviewRevision((value) => value + 1); }}>Reîncearcă verificarea</button>
        </div>}
        <p className="muted subscription-extension-note">Prelungirea acordă acces în aplicație. Datele de plată și reînnoirea automată din magazin rămân aceleași.</p>
        {error && <p className="subscription-extension-error" role="alert">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn" disabled={pending} onClick={onClose}>Renunță</button>
          <button type="submit" className="btn btn-primary" disabled={pending || !valid || !preview?.eligibleCount || Boolean(previewError)}>
            {pending ? 'Se prelungește…' : 'Confirmă prelungirea'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
