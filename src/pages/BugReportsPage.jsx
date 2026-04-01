import { useEffect, useState, useCallback } from 'react';
import { FiAlertCircle, FiMail } from 'react-icons/fi';
import { adminApi } from '../api';
import Pagination from '../components/Pagination';
import PageError from '../components/PageError';
import { fmtDateTime } from '../utils/formatters';
import { getErrorMessage } from '../utils/errors';

export default function BugReportsPage() {
  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusSavingId, setStatusSavingId] = useState(null);
  const [statusError, setStatusError] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.bugReports(page, 50);
      setReports(res.items || []);
      setTotal(res.total || 0);
      if (expandedId && !(res.items || []).some((item) => item.id === expandedId)) {
        setExpandedId(null);
      }
    } catch (err) {
      setReports([]);
      setTotal(0);
      setError(getErrorMessage(err, 'Nu am putut incarca bug reports.'));
    } finally {
      setLoading(false);
    }
  }, [page, expandedId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusChange = async (id, nextStatus) => {
    setStatusError('');
    setStatusSavingId(id);
    try {
      await adminApi.updateBugReport(id, nextStatus);
      setReports((prev) => prev.map((item) => (item.id === id ? { ...item, status: nextStatus } : item)));
    } catch (err) {
      setStatusError(getErrorMessage(err, 'Nu am putut actualiza statusul bug report-ului. Incearca din nou.'));
    } finally {
      setStatusSavingId((current) => (current === id ? null : current));
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / 50));

  return (
    <div className="page">
      <div className="page-header">
        <h1>Bug Reports</h1>
        <p>{total} rapoarte trimise de utilizatori</p>
      </div>

      {loading ? (
        <div className="page-loading">Se incarca...</div>
      ) : (
        <>
          <PageError message={error} />
          <PageError message={statusError} />

          <div className="table-wrap">
            <table>
              <caption className="sr-only">Lista raportari bug</caption>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Utilizator</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Detalii</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => {
                  const isExpanded = expandedId === report.id;
                  return (
                    <FragmentRow
                      key={report.id}
                      report={report}
                      expanded={isExpanded}
                      onToggle={() => setExpandedId(isExpanded ? null : report.id)}
                      onStatusChange={handleStatusChange}
                      saving={statusSavingId === report.id}
                    />
                  );
                })}

                {reports.length === 0 && (
                  <tr>
                    <td colSpan="6" className="td-empty">Nu exista bug reports momentan.</td>
                  </tr>
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

function FragmentRow({ report, expanded, onToggle, onStatusChange, saving }) {
  return (
    <>
      <tr>
        <td className="td-mono">{report.id}</td>
        <td>
          <div className="td-user">
            <span className="td-user__name">{report.user_email || 'Anonim'}</span>
            <span className="td-user__email">{report.user_id ? `#${report.user_id}` : 'Fara cont'}</span>
          </div>
        </td>
        <td>
          {report.contact_email ? (
            <a className="contact-link" href={`mailto:${report.contact_email}`}>
              <FiMail />
              <span>{report.contact_email}</span>
            </a>
          ) : (
            '–'
          )}
        </td>
        <td>
          <div className="bug-status-cell">
            <span className={`badge badge--${statusClass(report.status)}`}>{statusLabel(report.status)}</span>
            <select
              className={`badge-select badge-select--${statusClass(report.status)}`}
              value={report.status || 'new'}
              onChange={(e) => onStatusChange(report.id, e.target.value)}
              disabled={saving}
              aria-label={`Schimba status pentru bug report ${report.id}`}
            >
              <option value="new">Nou</option>
              <option value="in_progress">In lucru</option>
              <option value="resolved">Rezolvat</option>
              <option value="closed">Inchis</option>
            </select>
          </div>
        </td>
        <td>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-controls={`bug-report-desc-${report.id}`}
          >
            <FiAlertCircle /> {expanded ? 'Ascunde' : 'Vezi'}
          </button>
        </td>
        <td className="td-date">{fmtDateTime(report.created_at)}</td>
      </tr>
      {expanded ? (
        <tr className="bug-row-expanded">
          <td colSpan="6">
            <div id={`bug-report-desc-${report.id}`} className="bug-report-description">{report.description || 'Fara descriere'}</div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

function statusLabel(status) {
  return (
    {
      new: 'Nou',
      in_progress: 'In lucru',
      resolved: 'Rezolvat',
      closed: 'Inchis',
    }[status] || status || 'Necunoscut'
  );
}

function statusClass(status) {
  if (status === 'in_progress') return 'in_progress';
  if (status === 'resolved') return 'resolved';
  if (status === 'closed') return 'closed';
  return 'new';
}
