import { useEffect, useState } from "react";
import { adminApi } from "../api";
import { FiSearch } from "react-icons/fi";
import StoreSubscriberCards from "../components/StoreSubscriberCards";
import SubscriptionExtensionDialog from "../components/SubscriptionExtensionDialog";

const fmt = (value) =>
  value
    ? new Date(value).toLocaleDateString("ro-RO", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Fără termen";
export default function SubscriptionsPage() {
  const [page, setPage] = useState(1),
    [plan, setPlan] = useState(""),
    [search, setSearch] = useState(""),
    [result, setResult] = useState({ items: [], total: 0 }),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [revision, setRevision] = useState(0);
  const [extensionTarget, setExtensionTarget] = useState(null);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      setError("");
      adminApi
        .subscriptions(
          { page: String(page), limit: "25", plan, search },
          controller.signal,
        )
        .then((data) => {
          if (!controller.signal.aborted) setResult(data);
        })
        .catch((e) => {
          if (!controller.signal.aborted) setError(e.message);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [page, plan, search, revision]);
  const pages = Math.max(1, Math.ceil(result.total / 25));
  return (
    <div className="page">
      <div className="page-header">
        <div className="subscription-extension-heading">
          <div>
            <h1>Abonamente active</h1>
            <p>
              Basic, Premium, Pro și VIP · un singur abonament activ per cont · fără
              trial-uri.
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setExtensionTarget({scope:'all'})}>Prelungește global</button>
        </div>
      </div>
      {notice && <div className="subscription-extension-success" role="status">{notice}</div>}
      {extensionTarget && <SubscriptionExtensionDialog target={extensionTarget} onClose={() => setExtensionTarget(null)} onExtended={(data) => {
        setNotice(data.affectedCount
          ? `${data.affectedCount} ${data.affectedCount === 1 ? 'abonament prelungit' : 'abonamente prelungite'} cu ${data.days} ${data.days === 1 ? 'zi' : 'zile'}.`
          : 'Nu mai există abonamente eligibile. Nu a fost prelungit niciun abonament.');
        setExtensionTarget(null);
        setRevision((value) => value + 1);
      }} />}
      <div className="toolbar">
        <label className="search-field">
          <FiSearch />
          <input
            aria-label="Caută abonați"
            className="search-input"
            placeholder="Caută după nume sau email…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <div className="filter-group">
          <label htmlFor="subscription-plan">Plan</label>
          <select
            id="subscription-plan"
            value={plan}
            onChange={(e) => {
              setPlan(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Toate planurile</option>
            {["basic", "premium", "pro", "vip"].map((value) => (
              <option value={value} key={value}>
                {value === "vip"
                  ? "VIP"
                  : value[0].toUpperCase() + value.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <span className="muted">
          {result.total.toLocaleString("ro-RO")} abonamente
        </span>
      </div>
      {error ? (
        <div className="analytics-error" role="alert">
          <p>{error}</p>
          <button
            className="btn btn-primary"
            onClick={() => setRevision((v) => v + 1)}
          >
            Încearcă din nou
          </button>
        </div>
      ) : null}
      <StoreSubscriberCards
        rows={error ? undefined : result.byStore}
        loading={loading}
        filtered={Boolean(plan || search)}
      />
      <div className="table-wrap" aria-busy={loading}>
        <table>
          <caption className="sr-only">
            Abonamente plătite active în prezent
          </caption>
          <thead>
            <tr>
              <th>Utilizator</th>
              <th>Plan</th>
              <th>Platformă</th>
              <th>Început</th>
              <th>Expiră</th>
              <th>Reînnoire</th>
              <th>Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {!error &&
              result.items.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="td-user">
                      <span className="td-user__name">
                        {row.name || `Cont #${row.user_id}`}
                      </span>
                      <span className="td-user__email">{row.email || "—"}</span>
                    </div>
                  </td>
                  <td>
                    <span className="outline-badge">
                      {row.type === "vip"
                        ? "VIP"
                        : row.type[0].toUpperCase() + row.type.slice(1)}
                    </span>
                  </td>
                  <td>
                    {{
                      APP_STORE: "App Store",
                      GOOGLE_PLAY: "Google Play",
                      PLAY_STORE: "Google Play",
                      STRIPE: "Stripe",
                    }[String(row.store || "").toUpperCase()] ||
                      row.store ||
                      "Manual"}
                  </td>
                  <td className="td-date">{fmt(row.starts_at)}</td>
                  <td className="td-date">{fmt(row.ends_at)}</td>
                  <td>
                    {row.willRenew == null
                      ? "Necunoscută"
                      : Number(row.willRenew)
                        ? "Activată"
                        : "Dezactivată"}
                  </td>
                  <td>
                    <button className="btn btn-sm" disabled={!row.ends_at}
                      aria-label={`Prelungește abonamentul pentru ${row.name || row.email || `Cont #${row.user_id}`}`}
                      title={row.ends_at ? 'Adaugă zile la abonamentul activ' : 'Abonament fără termen de expirare'}
                      onClick={() => setExtensionTarget({scope:'user',row})}>Prelungește</button>
                  </td>
                </tr>
              ))}
            {loading && !result.items.length ? (
              <tr>
                <td colSpan={7} className="td-empty">
                  Se încarcă abonamentele…
                </td>
              </tr>
            ) : !error && !result.items.length ? (
              <tr>
                <td colSpan={7} className="td-empty">
                  Nu există abonamente plătite active pentru filtrele alese.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="pagination">
        <button
          disabled={page <= 1 || loading}
          onClick={() => setPage(page - 1)}
        >
          ← Înapoi
        </button>
        <span>
          Pagina {page} / {pages}
        </span>
        <button
          disabled={page >= pages || loading}
          onClick={() => setPage(page + 1)}
        >
          Înainte →
        </button>
      </div>
    </div>
  );
}
