import { FiArrowDownRight, FiArrowUpRight } from "react-icons/fi";
import "./metric-cards.css";

export function Metric({ label, value, description, change }) {
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

export function Metrics({ children, columns = 4, busy = false }) {
  return (
    <div className={`metrics-grid metrics-grid-${columns}`} aria-busy={busy}>
      {children}
    </div>
  );
}
