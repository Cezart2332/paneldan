import { useEffect, useState, useCallback } from 'react';
import { FiAlertCircle, FiMail } from 'react-icons/fi';
import { adminApi } from '../api';

export default function BugReportsPage() {
  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.bugReports(page, 50);
      setReports(res.items || []);
      setTotal(res.total || 0);
      if (expandedId && !(res.items || []).some((item) => item.id === expandedId)) {
        setExpandedId(null);
      }
    } catch {
      setReports([]);
      setTotal(0);
    }
    setLoading(false);
  }, [page, expandedId]);

  useEffect(() => {
    load();
  }, [load]);

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
          <div className="table-wrap">
            <table>
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

function FragmentRow({ report, expanded, onToggle }) {
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
          <span className={`badge badge--${statusClass(report.status)}`}>{statusLabel(report.status)}</span>
        </td>
        <td>
          <button className="btn btn-ghost btn-sm" onClick={onToggle}>
            <FiAlertCircle /> {expanded ? 'Ascunde' : 'Vezi'}
          </button>
        </td>
        <td className="td-date">{fmtDate(report.created_at)}</td>
      </tr>
      {expanded ? (
        <tr className="bug-row-expanded">
          <td colSpan="6">
            <div className="bug-report-description">{report.description || 'Fara descriere'}</div>
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

function fmtDate(d) {
  if (!d) return '–';
  return new Date(d).toLocaleDateString('ro-RO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
