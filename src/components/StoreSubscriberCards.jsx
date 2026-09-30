import { Metric, Metrics } from "./MetricCards";
import { formatCount, subscribersForStore } from "../utils/analytics";

export default function StoreSubscriberCards({
  rows,
  loading = false,
  filtered = false,
}) {
  const value = (store) => {
    const total = subscribersForStore(rows, store);
    return loading || total == null ? "—" : formatCount(total);
  };
  const description = filtered
    ? "Plătiți activi · toate rezultatele filtrate · fără trial-uri"
    : "Plătiți activi în prezent · fără trial-uri";
  return (
    <Metrics columns={2} busy={loading}>
      <Metric
        label="Abonați Google Play"
        value={value("GOOGLE_PLAY")}
        description={description}
      />
      <Metric
        label="Abonați App Store"
        value={value("APP_STORE")}
        description={description}
      />
    </Metrics>
  );
}
