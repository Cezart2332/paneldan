import { useEffect, useId, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowDownRight,
  FiArrowUpRight,
  FiCalendar,
  FiChevronDown,
  FiDownload,
  FiRefreshCw,
  FiTrendingUp,
} from "react-icons/fi";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { adminApi } from "../api";
import {
  dateRange,
  downloadRevenueCsv,
  formatCount as count,
  formatMoney,
  formatPercent as percent,
} from "../utils/analytics";
import "../dashboard.css";

const tabs = [
  ["overview", "Prezentare generală"],
  ["revenue", "Venituri"],
  ["subscriptions", "Abonamente"],
  ["activity", "Activitatea aplicației"],
  ["dan", "Activitatea lui Dan"],
];
const planLabel = (value) =>
  ({ basic: "Basic", premium: "Premium", pro: "Pro", vip: "VIP" })[value] ||
  value;
const storeLabel = (value) =>
  ({
    APP_STORE: "App Store",
    GOOGLE_PLAY: "Google Play",
    STRIPE: "Stripe",
    RC_BILLING: "RevenueCat Billing",
  })[value] || value;
const dateLabel = (value) =>
  value
    ? new Date(value).toLocaleDateString("ro-RO", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : "date încă indisponibile";
const bucketLabel = (value) =>
  String(value).length === 7
    ? new Date(`${value}-01T00:00:00Z`).toLocaleDateString("ro-RO", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : new Date(`${value}T00:00:00Z`).toLocaleDateString("ro-RO", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      });
const compact = (value) =>
  new Intl.NumberFormat("ro-RO", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
const money = (data, value) => formatMoney(value, data.period.currency);

export default function AnalyticsDashboard() {
  const [tab, setTab] = useState("overview"),
    [draft, setDraft] = useState(() => ({
      ...dateRange("month"),
      preset: "month",
      group: "day",
    }));
  const [filter, setFilter] = useState(() => ({
    ...dateRange("month"),
    group: "day",
    currency: "USD",
  }));
  const [data, setData] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0),
    [filterError, setFilterError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => {
      if (controller.signal.aborted) return;
      setLoading(true);
      setError("");
      adminApi
        .analytics(filter, controller.signal)
        .then((value) => {
          if (!controller.signal.aborted) setData(value);
        })
        .catch((e) => {
          if (!controller.signal.aborted) setError(e.message);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    });
    return () => controller.abort();
  }, [filter, revision]);
  const changePreset = (preset) =>
    setDraft({
      ...draft,
      ...dateRange(preset),
      preset,
      group: preset === "year" ? "month" : "day",
    });
  const apply = (e) => {
    e.preventDefault();
    if (
      !draft.from ||
      !draft.to ||
      draft.to < draft.from ||
      draft.to > new Date().toISOString().slice(0, 10)
    ) {
      setFilterError("Alege date valide, până cel târziu astăzi.");
      return;
    }
    setFilterError("");
    setFilter({
      ...filter,
      from: draft.from,
      to: draft.to,
      group: draft.group,
      compare: draft.preset === "year" ? "year" : "previous",
    });
  };
  const content = !data || error ? null : data;
  return (
    <div className="page analytics-page">
      <div className="page-header dashboard-heading">
        <div>
          <h1>Dashboard</h1>
          <p>O imagine clară a aplicației și a evoluției ei.</p>
        </div>
        <div className="heading-actions">
          <button
            className="btn btn-ghost"
            onClick={() => setRevision((v) => v + 1)}
            disabled={loading}
            aria-label="Actualizează statisticile"
          >
            <FiRefreshCw className={loading ? "spin" : ""} />
          </button>
          <button
            className="btn btn-primary"
            disabled={!content || loading}
            onClick={() => downloadRevenueCsv(content)}
          >
            <FiDownload /> Export CSV
          </button>
        </div>
      </div>
      <form className="analytics-filters" onSubmit={apply}>
        <label className="select-field">
          <span>Perioadă</span>
          <select
            aria-label="Perioadă"
            value={draft.preset}
            onChange={(e) => changePreset(e.target.value)}
          >
            <option value="month">Lună</option>
            <option value="year">An</option>
            <option value="30">Ultimele 30 de zile</option>
            <option value="7">Ultimele 7 zile</option>
            <option value="custom">Interval personalizat</option>
          </select>
        </label>
        {draft.preset === "month" ? (
          <label className="select-field">
            <span>Luna</span>
            <input
              aria-label="Luna"
              type="month"
              max={new Date().toISOString().slice(0, 7)}
              value={draft.from.slice(0, 7)}
              onInput={(e) => {
                const value = e.currentTarget.value;
                setDraft((current) => ({
                  ...current,
                  ...dateRange("month", `${value}-01`),
                }));
              }}
            />
          </label>
        ) : null}
        {draft.preset === "year" ? (
          <label className="select-field">
            <span>Anul</span>
            <select
              aria-label="Anul"
              value={draft.from.slice(0, 4)}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  ...dateRange("year", `${e.target.value}-01-01`),
                })
              }
            >
              {Array.from(
                { length: new Date().getUTCFullYear() - 2019 },
                (_, i) => new Date().getUTCFullYear() - i,
              ).map((year) => (
                <option key={year}>{year}</option>
              ))}
            </select>
          </label>
        ) : null}
        {draft.preset === "custom" ? (
          <>
            <label className="select-field">
              <span>De la</span>
              <input
                aria-label="De la"
                type="date"
                value={draft.from}
                onInput={(e) => {
                  const value = e.currentTarget.value;
                  setDraft((current) => ({ ...current, from: value }));
                }}
              />
            </label>
            <label className="select-field">
              <span>Până la</span>
              <input
                aria-label="Până la"
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                value={draft.to}
                onInput={(e) => {
                  const value = e.currentTarget.value;
                  setDraft((current) => ({ ...current, to: value }));
                }}
              />
            </label>
          </>
        ) : null}
        <label className="select-field">
          <span>Grupare</span>
          <select
            aria-label="Grupare"
            value={draft.group}
            onChange={(e) => setDraft({ ...draft, group: e.target.value })}
          >
            <option value="day">Pe zile</option>
            <option value="month">Pe luni</option>
          </select>
        </label>
        <button className="btn btn-ghost" type="submit">
          <FiCalendar /> Aplică perioada
        </button>
        <label className="select-field currency-field">
          <span>Monedă</span>
          <select
            aria-label="Monedă"
            value={filter.currency}
            onChange={(e) => setFilter({ ...filter, currency: e.target.value })}
          >
            {(data?.currencies || ["USD"]).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </form>
      {filterError ? (
        <p role="alert" className="form-error">
          {filterError}
        </p>
      ) : null}
      <div className="analytics-period">
        <span>
          {dateLabel(filter.from)} — {dateLabel(filter.to)}
        </span>
        <span>
          Perioade în UTC ·{" "}
          {loading
            ? "Se actualizează…"
            : data
              ? `Actualizat la ${new Date(data.generatedAt).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}`
              : ""}
        </span>
      </div>
      <div className="analytics-tabs" role="tablist" aria-label="Rapoarte">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            role="tab"
            id={`tab-${id}`}
            aria-controls={`report-${id}`}
            aria-selected={tab === id}
            className={tab === id ? "active" : ""}
            onClick={() => setTab(id)}
            onKeyDown={(e) => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key))
                return;
              e.preventDefault();
              const index = tabs.findIndex(([t]) => t === tab),
                next =
                  e.key === "Home"
                    ? 0
                    : e.key === "End"
                      ? tabs.length - 1
                      : (index +
                          (e.key === "ArrowRight" ? 1 : -1) +
                          tabs.length) %
                        tabs.length;
              setTab(tabs[next][0]);
              document.getElementById(`tab-${tabs[next][0]}`)?.focus();
            }}
            tabIndex={tab === id ? 0 : -1}
          >
            {label}
          </button>
        ))}
      </div>
      {error ? (
        <div className="analytics-error" role="alert">
          <h2>Statisticile nu s-au încărcat</h2>
          <p>{error}</p>
          <button
            className="btn btn-primary"
            onClick={() => setRevision((v) => v + 1)}
          >
            Încearcă din nou
          </button>
        </div>
      ) : null}
      {loading && !data ? (
        <div role="status" aria-label="Se încarcă statisticile">
          <div className="metrics-grid">
            {[0, 1, 2, 3].map((i) => (
              <div className="metric-card skeleton-card" key={i}>
                <span />
                <strong />
                <span />
              </div>
            ))}
          </div>
          <div className="analytics-card skeleton-chart" />
        </div>
      ) : null}
      {content ? (
        <section
          role="tabpanel"
          id={`report-${tab}`}
          aria-labelledby={`tab-${tab}`}
          aria-busy={loading}
          className={loading ? "report-loading" : ""}
        >
          {tab === "overview" ? (
            <Overview data={content} />
          ) : tab === "revenue" ? (
            <RevenueReport
              data={content}
              onImported={() => setRevision((v) => v + 1)}
            />
          ) : tab === "subscriptions" ? (
            <SubscriptionsReport data={content} />
          ) : tab === "activity" ? (
            <ActivityReport data={content} />
          ) : (
            <DanReport data={content} />
          )}
        </section>
      ) : null}
    </div>
  );
}

function Metric({ label, value, description, change }) {
  const currency =
    typeof value === "string" ? value.match(/^(.*)\s([A-Z]{3})$/) : null;
  return (
    <article className="metric-card">
      <div className="metric-label">
        {label}
        {change != null ? (
          <span className="metric-trend">
            {change >= 0 ? <FiArrowUpRight /> : <FiArrowDownRight />}
            {Math.abs(change).toLocaleString("ro-RO")}%
          </span>
        ) : null}
      </div>
      <strong
        className={`metric-value${currency ? " metric-value-money" : ""}`}
      >
        {currency ? (
          <>
            <span>{currency[1]}</span>
            <small>{currency[2]}</small>
          </>
        ) : (
          value
        )}
      </strong>
      <p>{description}</p>
    </article>
  );
}
function Metrics({ children }) {
  return <div className="metrics-grid">{children}</div>;
}
function Panel({ title, description, children, action }) {
  return (
    <article className="analytics-card">
      <header className="analytics-card-header">
        <div>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {action}
      </header>
      {children}
    </article>
  );
}
function Empty({ text = "Nu există date în perioada aleasă." }) {
  return (
    <div className="chart-empty">
      <FiTrendingUp aria-hidden="true" />
      <p>{text}</p>
    </div>
  );
}
function Note({ children }) {
  return <p className="analytics-note">{children}</p>;
}
function QuickStat({ label, value, link }) {
  return (
    <div className="quick-stat">
      <span>{link ? <Link to={link}>{label}</Link> : label}</span>
      <strong>{count(value)}</strong>
    </div>
  );
}
function PlanRows({ data }) {
  return (
    <div className="plan-rows">
      {data.subscriptions.byPlan.map((row) => (
        <div className="plan-row" key={row.plan}>
          <div>
            <span>{planLabel(row.plan)}</span>
            <strong>{count(row.total)}</strong>
          </div>
          <progress
            value={row.total}
            max={Math.max(1, data.subscriptions.active)}
            aria-label={`Abonamente ${planLabel(row.plan)}`}
          />
        </div>
      ))}
      <p className="muted">
        Trial-uri active, separat:{" "}
        <strong>{count(data.subscriptions.activeTrials)}</strong>
      </p>
    </div>
  );
}
function Overview({ data: d }) {
  return (
    <>
      <Metrics>
        <Metric
          label="Venituri înregistrate"
          value={money(d, d.revenue.net)}
          change={d.revenue.changePercent}
          description="Încasări brute minus rambursări"
        />
        <Metric
          label="Abonamente plătite active"
          value={count(d.subscriptions.active)}
          description="În prezent · fără trial-uri"
        />
        <Metric
          label="Utilizatori activi"
          value={count(d.users.activeUsers)}
          description="Conturi distincte în perioada aleasă"
        />
        <Metric
          label="Videoclipuri finalizate"
          value={count(d.videos.completed)}
          description={`${count(d.videos.minutes)} minute de consum`}
        />
      </Metrics>
      <RevenueChart data={d} />
      <div className="analytics-columns">
        <Panel
          title="Abonamente active"
          description="Un singur plan activ pentru fiecare cont"
          action={
            <Link className="text-link" to="/subscriptions">
              Vezi lista →
            </Link>
          }
        >
          <PlanRows data={d} />
        </Panel>
        <Panel
          title="De urmărit"
          description="Activitatea aplicației și solicitările deschise"
        >
          <div className="quick-stat-list">
            <QuickStat
              label="Provocări finalizate"
              value={d.challenges.completed}
            />
            <QuickStat label="Sesiuni SOS" value={d.sos.sessions} />
            <QuickStat label="Check-in-uri" value={d.checkins.total} />
            <QuickStat
              label="Întrebări fără răspuns"
              value={d.dan.unanswered}
              link="/questions"
            />
            <QuickStat
              label="Probleme deschise"
              value={d.dan.openBugs}
              link="/bug-reports"
            />
          </div>
        </Panel>
      </div>
      <Coverage data={d} />
    </>
  );
}
function RevenueChart({ data: d }) {
  const gradient = useId().replaceAll(":", "");
  return (
    <Panel
      title="Evoluția veniturilor"
      description="Încasări brute minus rambursări, înainte de comisioane și taxe"
      action={<span className="outline-badge">{d.period.currency}</span>}
    >
      {d.revenue.payments > 0 || d.revenue.refunds > 0 ? (
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={d.revenue.series}
              accessibilityLayer
              margin={{ top: 16, right: 20, left: 0, bottom: 8 }}
            >
              <defs>
                <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#525252" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#525252" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke="#e5e5e5"
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="bucket"
                axisLine={false}
                tickLine={false}
                minTickGap={32}
                tickFormatter={bucketLabel}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={65}
                tickFormatter={compact}
              />
              <Tooltip
                content={<ChartTooltip currency={d.period.currency} />}
              />
              <Area
                type="monotone"
                dataKey="net"
                name="Venituri"
                stroke="#404040"
                strokeWidth={2}
                fill={`url(#${gradient})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <Empty text="Nu există tranzacții înregistrate în perioada aleasă." />
      )}
      <ChartData
        rows={d.revenue.series}
        columns={[
          ["bucket", "Perioadă"],
          ["gross", "Încasări brute"],
          ["refunds", "Rambursări"],
          ["net", "Venituri"],
        ]}
        currency={d.period.currency}
      />
    </Panel>
  );
}
function ChartTooltip({ active, payload, label, currency }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <strong>{bucketLabel(label)}</strong>
      {payload.map((row) => (
        <div key={row.dataKey}>
          <span>{row.name}</span>
          <b>
            {currency ? formatMoney(row.value, currency) : count(row.value)}
          </b>
        </div>
      ))}
    </div>
  );
}
function ChartData({ rows, columns, currency }) {
  return (
    <details className="chart-data">
      <summary>
        Datele graficului <FiChevronDown />
      </summary>
      <div className="table-wrap">
        <table>
          <caption className="sr-only">Valorile afișate în grafic</caption>
          <thead>
            <tr>
              {columns.map(([key, label]) => (
                <th key={key}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.bucket}>
                {columns.map(([key]) => (
                  <td key={key}>
                    {key === "bucket"
                      ? bucketLabel(row[key])
                      : currency
                        ? formatMoney(row[key], currency)
                        : count(row[key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
function Coverage({ data: d }) {
  return (
    <Note>
      Venituri disponibile din {dateLabel(d.coverage?.revenueSince)}.
      Trial-urile și plățile sandbox sunt excluse.{" "}
      {d.period.currency === "USD"
        ? "USD folosește conversia furnizată de RevenueCat."
        : "Sunt incluse numai plățile făcute în moneda selectată."}{" "}
      {d.revenue.missingAmounts > 0
        ? `${d.revenue.missingAmounts} tranzacții au sume necunoscute; totalul este incomplet.`
        : ""}
    </Note>
  );
}
function RevenueBreakdown({ rows, labelKey, label, data }) {
  return rows.length ? (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Categorie</th>
            <th>Încasări</th>
            <th>Rambursări</th>
            <th>Venituri</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[labelKey]}>
              <td>{label(row[labelKey])}</td>
              <td>{money(data, row.gross)}</td>
              <td>{money(data, row.refunds)}</td>
              <td>
                <strong>{money(data, row.net)}</strong>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <Empty />
  );
}
function RevenueReport({ data: d, onImported }) {
  return (
    <>
      <Metrics>
        <Metric
          label="Încasări brute"
          value={money(d, d.revenue.gross)}
          description={`${count(d.revenue.payments)} tranzacții de plată`}
        />
        <Metric
          label="Rambursări"
          value={money(d, d.revenue.refunds)}
          description="Ajustări înregistrate în perioada aleasă"
        />
        <Metric
          label="Venituri înregistrate"
          value={money(d, d.revenue.net)}
          change={d.revenue.changePercent}
          description="Înainte de comisioane și taxe"
        />
        <Metric
          label={
            d.period.comparison === "year"
              ? "Anul precedent"
              : "Perioada precedentă"
          }
          value={money(d, d.revenue.previous.net)}
          description={`${dateLabel(d.period.previousFrom)} — ${dateLabel(d.period.previousTo)}`}
        />
      </Metrics>
      <RevenueChart data={d} />
      <div className="analytics-columns">
        <Panel
          title="Venituri pe abonament"
          description="Distribuția încasărilor"
        >
          <RevenueBreakdown
            rows={d.revenue.byPlan}
            labelKey="plan"
            label={planLabel}
            data={d}
          />
        </Panel>
        <Panel title="Venituri pe platformă" description="Sursa tranzacțiilor">
          <RevenueBreakdown
            rows={d.revenue.byStore}
            labelKey="store"
            label={storeLabel}
            data={d}
          />
        </Panel>
      </div>
      <Coverage data={d} />
      <RevenueImport onImported={onImported} />
    </>
  );
}
function RevenueImport({ onImported }) {
  const [file, setFile] = useState(null),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState(""),
    [error, setError] = useState("");
  const submit = async () => {
    setBusy(true);
    setStatus("");
    setError("");
    try {
      const result = await adminApi.importRevenue(await file.text());
      setStatus(
        `${result.rows} rânduri procesate. ${result.entries} înregistrări financiare salvate sau actualizate.`,
      );
      onImported();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <details className="import-panel">
      <summary>
        Importă istoricul RevenueCat <FiChevronDown />
      </summary>
      <div>
        <p>
          Încarcă exportul CSV „Transactions”, cu prețurile brute și după
          rambursări. Reimportarea aceleiași tranzacții nu o dublează.
        </p>
        <label className="file-label">
          Export CSV{" "}
          <input
            type="file"
            accept=".csv,text/csv"
            disabled={busy}
            onChange={(e) => {
              setStatus("");
              const selected = e.target.files?.[0];
              if (selected?.size > 4 * 1024 * 1024) {
                setError("Fișierul trebuie să aibă maximum 4 MB.");
                setFile(null);
              } else {
                setFile(selected || null);
                setError("");
              }
            }}
          />
        </label>
        <button
          className="btn btn-primary"
          disabled={!file || busy}
          onClick={submit}
        >
          {busy ? "Se importă…" : "Importă tranzacțiile"}
        </button>
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        {status ? (
          <p role="status" className="form-success">
            {status}
          </p>
        ) : null}
      </div>
    </details>
  );
}
function SubscriptionsReport({ data: d }) {
  return (
    <>
      <Metrics>
        <Metric
          label="Abonamente plătite active"
          value={count(d.subscriptions.active)}
          description="În prezent · fără trial-uri"
        />
        <Metric
          label="Primele plăți"
          value={count(d.subscriptions.firstPayments)}
          description="Prima plată cunoscută în perioadă"
        />
        <Metric
          label="Reînnoiri"
          value={count(d.subscriptions.renewals)}
          description="Fără prima plată după trial"
        />
        <Metric
          label="Expirări"
          value={count(d.subscriptions.expiredUsers)}
          description="Conturi cu expirare plătită înregistrată"
        />
      </Metrics>
      <div className="analytics-columns">
        <Panel
          title="Distribuția abonamentelor"
          description="Planuri plătite active în prezent"
          action={
            <Link className="text-link" to="/subscriptions">
              Vezi abonații →
            </Link>
          }
        >
          <PlanRows data={d} />
        </Panel>
        <Panel
          title="De la trial la abonament"
          description="Trial-uri începute în perioada aleasă"
        >
          <div className="conversion-summary">
            <strong>{percent(d.subscriptions.conversionRate)}</strong>
            <p>
              {count(d.subscriptions.converted)} din{" "}
              {count(d.subscriptions.trials)} conturi au o plată înregistrată
              până la sfârșitul perioadei.
            </p>
          </div>
          <div className="quick-stat-list">
            <QuickStat
              label="Trial-uri active în prezent"
              value={d.subscriptions.activeTrials}
            />
            <QuickStat
              label="Anulări înregistrate"
              value={d.subscriptions.cancellations}
            />
          </div>
          <Note>
            Anularea reînnoirii nu înseamnă automat expirarea accesului.
            Expirările folosesc evenimentele colectate din{" "}
            {dateLabel(d.coverage?.lifecycleSince)}.
          </Note>
        </Panel>
      </div>
    </>
  );
}
function Ranking({ rows, labelKey, valueKey, heading, valueLabel, secondary }) {
  return rows.length ? (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{heading}</th>
            <th>{valueLabel}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.mediaKey || row.challengeId || i}>
              <td>
                <span className="ranking-title">{row[labelKey]}</span>
                {secondary ? (
                  <small className="muted">{secondary(row)}</small>
                ) : null}
              </td>
              <td className="numeric">{count(row[valueKey])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <Empty />
  );
}
function ActivityReport({ data: d }) {
  return (
    <>
      <Metrics>
        <Metric
          label="Utilizatori activi"
          value={count(d.users.activeUsers)}
          description="Conturi distincte în perioada aleasă"
        />
        <Metric
          label="Utilizatori noi"
          value={count(d.users.newUsers)}
          description={`${count(d.users.total)} conturi în total`}
        />
        <Metric
          label="Revin în ziua 7"
          value={percent(d.users.retention7)}
          description={`${count(d.users.returned7)} din ${count(d.users.eligible7)} conturi eligibile`}
        />
        <Metric
          label="Revin în ziua 30"
          value={percent(d.users.retention30)}
          description={`${count(d.users.returned30)} din ${count(d.users.eligible30)} conturi eligibile`}
        />
      </Metrics>
      <Panel
        title="Activitate în timp"
        description="Videoclipuri finalizate, provocări finalizate, sesiuni SOS și check-in-uri"
      >
        {d.activitySeries.some(
          (row) => row.videos + row.challenges + row.sos + row.checkins > 0,
        ) ? (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={d.activitySeries}
                accessibilityLayer
                margin={{ top: 16, right: 20, left: 0, bottom: 8 }}
              >
                <CartesianGrid vertical={false} stroke="#e5e5e5" />
                <XAxis
                  dataKey="bucket"
                  tickFormatter={bucketLabel}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={32}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend />
                <Bar
                  dataKey="videos"
                  name="Videoclipuri"
                  stackId="activity"
                  fill="#262626"
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="challenges"
                  name="Provocări"
                  stackId="activity"
                  fill="#737373"
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="sos"
                  name="SOS"
                  stackId="activity"
                  fill="#a3a3a3"
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="checkins"
                  name="Check-in-uri"
                  stackId="activity"
                  fill="#d4d4d4"
                  radius={[3, 3, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <Empty />
        )}
        <ChartData
          rows={d.activitySeries}
          columns={[
            ["bucket", "Perioadă"],
            ["users", "Utilizatori activi"],
            ["videos", "Videoclipuri"],
            ["challenges", "Provocări"],
            ["sos", "SOS"],
            ["checkins", "Check-in-uri"],
          ]}
        />
      </Panel>
      <div className="analytics-columns">
        <Panel
          title="Videoclipuri"
          description="Consum măsurat, inclusiv modul Doar sunet"
        >
          <div className="inline-metrics">
            <div>
              <strong>{count(d.videos.minutes)}</strong>
              <span>minute de consum</span>
            </div>
            <div>
              <strong>{percent(d.videos.completionRate)}</strong>
              <span>finalizare / sesiuni începute</span>
            </div>
          </div>
          <Ranking
            rows={d.videos.top}
            labelKey="title"
            valueKey="completed"
            heading="Videoclip"
            valueLabel="Finalizări"
            secondary={(row) =>
              `${count(row.minutes)} min · ${count(row.sessions)} sesiuni`
            }
          />
        </Panel>
        <Panel title="Provocări" description="Progres și dificultate raportată">
          <div className="inline-metrics">
            <div>
              <strong>{count(d.challenges.completed)}</strong>
              <span>feedback-uri de finalizare</span>
            </div>
            <div>
              <strong>{percent(d.challenges.completionRate)}</strong>
              <span>încercări finalizate / începute</span>
            </div>
          </div>
          <Ranking
            rows={d.challenges.top}
            labelKey="title"
            valueKey="completed"
            heading="Provocare"
            valueLabel="Finalizări"
            secondary={(row) =>
              row.difficulty != null
                ? `Dificultate medie: ${Number(row.difficulty).toFixed(1)} / 5`
                : ""
            }
          />
          <Note>
            Încercări urmărite din {dateLabel(d.coverage?.attemptsSince)};
            feedback-urile vechi rămân în total.
          </Note>
        </Panel>
      </div>
      <div className="analytics-columns">
        <Panel
          title="SOS și feedback"
          description="Evaluări oferite voluntar după exercițiu"
        >
          <div className="quick-stat-list">
            <QuickStat label="Sesiuni SOS" value={d.sos.sessions} />
            <QuickStat label="Sesiuni încheiate" value={d.sos.completed} />
            <QuickStat label="Respirație" value={d.sos.breathing} />
            <QuickStat label="Ancorare în prezent" value={d.sos.grounding} />
          </div>
          <div className="feedback-row">
            <span>
              M-a ajutat <b>{count(d.sos.helpful)}</b>
            </span>
            <span>
              Neutru <b>{count(d.sos.neutral)}</b>
            </span>
            <span>
              Nu m-a ajutat <b>{count(d.sos.unhelpful)}</b>
            </span>
          </div>
          <Note>
            Feedback-ul este opțional. O sesiune poate folosi ambele tehnici.
          </Note>
        </Panel>
        <Panel
          title="Check-in-uri și revenire"
          description="Frecvența folosirii aplicației"
        >
          <div className="quick-stat-list">
            <QuickStat
              label="Check-in-uri raportate"
              value={d.checkins.total}
            />
            <QuickStat label="Persoane cu check-in" value={d.checkins.users} />
          </div>
          <Note>
            Activitate urmărită din {dateLabel(d.coverage?.activitySince)}.
            Revenirea în ziua 7/30 folosește numai conturile înregistrate după
            începerea trackingului și suficient de vechi pentru comparație.
          </Note>
          <Link className="text-link" to="/entries">
            Deschide progresul →
          </Link>
        </Panel>
      </div>
    </>
  );
}
function DanReport({ data: d }) {
  return (
    <>
      <Metrics>
        <Metric
          label="Întrebări primite"
          value={count(d.dan.questions)}
          description="În perioada aleasă"
        />
        <Metric
          label="Întrebări cu răspuns"
          value={count(d.dan.answered)}
          description="Din întrebările perioadei"
        />
        <Metric
          label="Timp mediu de răspuns"
          value={
            d.dan.replyHours == null
              ? "—"
              : `${Number(d.dan.replyHours).toLocaleString("ro-RO", { maximumFractionDigits: 1 })} h`
          }
          description="De la trimitere la răspuns"
        />
        <Metric
          label="Ședințe încheiate"
          value={count(d.dan.completedMeetings)}
          description="Programate în perioada aleasă"
        />
      </Metrics>
      <div className="analytics-columns">
        <Panel
          title="Întrebări în așteptare"
          description="Întrebări ne-arhivate fără răspuns"
        >
          <div className="action-metric">
            <strong>{count(d.dan.unanswered)}</strong>
            <Link className="btn btn-ghost" to="/questions">
              Deschide întrebările →
            </Link>
          </div>
        </Panel>
        <Panel
          title="Probleme de rezolvat"
          description="Sesizări noi sau în lucru"
        >
          <div className="action-metric">
            <strong>{count(d.dan.openBugs)}</strong>
            <Link className="btn btn-ghost" to="/bug-reports">
              Deschide sesizările →
            </Link>
          </div>
        </Panel>
      </div>
    </>
  );
}
