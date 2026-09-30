export const formatCount = (value) =>
  Number(value || 0).toLocaleString("ro-RO", { maximumFractionDigits: 0 });
export const formatPercent = (value) =>
  value == null
    ? "—"
    : `${Number(value).toLocaleString("ro-RO", { maximumFractionDigits: 1 })}%`;
export const formatMoney = (value, currency = "USD") =>
  new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
export function dateRange(preset, anchor, now = new Date()) {
  const today = now.toISOString().slice(0, 10),
    date = new Date(anchor ? `${anchor}T00:00:00Z` : now);
  if (!Number.isFinite(+date)) return { from: "", to: "" };
  let from, to;
  if (preset === "month") {
    from = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
    to = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
  } else if (preset === "year") {
    from = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    to = new Date(Date.UTC(date.getUTCFullYear(), 11, 31));
  } else {
    to = new Date(`${today}T00:00:00Z`);
    from = new Date(+to - (preset === "7" ? 6 : 29) * 86400000);
  }
  return {
    from: from.toISOString().slice(0, 10),
    to:
      to.toISOString().slice(0, 10) > today
        ? today
        : to.toISOString().slice(0, 10),
  };
}
export function downloadRevenueCsv(data) {
  const lines = [
    [
      "Perioada UTC",
      `Incasari brute ${data.period.currency}`,
      `Rambursari ${data.period.currency}`,
      `Venituri ${data.period.currency}`,
    ],
    ...data.revenue.series.map((row) => [
      row.bucket,
      row.gross,
      row.refunds,
      row.net,
    ]),
  ];
  const csv =
    "\uFEFF" +
    lines
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
      )
      .join("\r\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `venituri-${data.period.from}-${data.period.to}-${data.period.currency}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
