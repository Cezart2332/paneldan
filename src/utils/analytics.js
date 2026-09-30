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

export const normalizeStore = (store) => {
  const value = String(store || "")
    .trim()
    .toUpperCase();
  return value === "PLAY_STORE" ? "GOOGLE_PLAY" : value;
};

// A model of store fees, not actual bank payouts or tax calculations.
export function estimateStoreFees(rows, appleRate = 0.3) {
  if (![0.15, 0.3].includes(appleRate))
    throw new RangeError("Invalid Apple fee rate");
  if (!Array.isArray(rows)) return null;
  const totals = { GOOGLE_PLAY: 0, APP_STORE: 0 };
  let missingAmounts = 0;
  for (const row of rows) {
    const store = normalizeStore(row.store);
    if (!Object.hasOwn(totals, store)) continue;
    totals[store] += Number(row.net || 0);
    missingAmounts += Number(row.missingAmounts || 0);
  }
  const round = (value) =>
    (Math.sign(value) * Math.round((Math.abs(value) + Number.EPSILON) * 100)) /
      100 || 0;
  const googleFee = round(totals.GOOGLE_PLAY * 0.15);
  const appleFee = round(totals.APP_STORE * appleRate);
  return {
    googleFee,
    appleFee,
    net: round(totals.GOOGLE_PLAY + totals.APP_STORE - googleFee - appleFee),
    missingAmounts,
  };
}

export function subscribersForStore(rows, store) {
  if (!Array.isArray(rows)) return null;
  return rows.reduce(
    (sum, row) =>
      sum + (normalizeStore(row.store) === store ? Number(row.total || 0) : 0),
    0,
  );
}
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
