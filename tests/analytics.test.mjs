import test from "node:test";
import assert from "node:assert/strict";
import {
  dateRange,
  formatPercent,
  formatMoney,
  estimateStoreFees,
  subscribersForStore,
} from "../src/utils/analytics.js";
test("month/year ranges cover complete past periods and stop the current period at today", () => {
  const now = new Date("2026-09-30T12:00:00Z");
  assert.deepEqual(dateRange("month", "2024-02-01", now), {
    from: "2024-02-01",
    to: "2024-02-29",
  });
  assert.deepEqual(dateRange("year", "2025-01-01", now), {
    from: "2025-01-01",
    to: "2025-12-31",
  });
  assert.deepEqual(dateRange("year", "2026-01-01", now), {
    from: "2026-01-01",
    to: "2026-09-30",
  });
  assert.deepEqual(dateRange("7", null, now), {
    from: "2026-09-24",
    to: "2026-09-30",
  });
  assert.deepEqual(dateRange("month", "-01", now), { from: "", to: "" });
});
test("unknown rates are distinct from zero; currencies are not silently converted", () => {
  assert.equal(formatPercent(null), "—");
  assert.equal(formatPercent(0), "0%");
  assert.match(formatMoney(123.45, "RON"), /RON/);
  assert.match(formatMoney(123.45, "USD"), /USD/);
});

test("store fee estimates use revenue after refunds, exclude other stores and support Apple's reduced rate", () => {
  const rows = [
    { store: "GOOGLE_PLAY", net: "800", gross: "1000", refunds: "200" },
    { store: "APP_STORE", net: "2000" },
    { store: "STRIPE", net: "500" },
    { store: "UNKNOWN", net: "999" },
  ];
  assert.deepEqual(estimateStoreFees(rows), {
    googleFee: 120,
    appleFee: 600,
    net: 2080,
    missingAmounts: 0,
  });
  assert.deepEqual(estimateStoreFees(rows, 0.15), {
    googleFee: 120,
    appleFee: 300,
    net: 2380,
    missingAmounts: 0,
  });
  assert.throws(() => estimateStoreFees(rows, 0.5), RangeError);
});

test("refund-only periods reverse estimated fees; aliases merge and amounts round to cents", () => {
  assert.deepEqual(
    estimateStoreFees([
      { store: " play_store ", net: "-10" },
      { store: "GOOGLE_PLAY", net: "0.3" },
      { store: "app_store", net: "-0.15", missingAmounts: "1" },
    ]),
    { googleFee: -1.46, appleFee: -0.05, net: -8.34, missingAmounts: 1 },
  );
});

test("missing store data differs from an empty report or zero subscribers", () => {
  assert.equal(estimateStoreFees(undefined), null);
  assert.deepEqual(estimateStoreFees([]), {
    googleFee: 0,
    appleFee: 0,
    net: 0,
    missingAmounts: 0,
  });
  assert.equal(subscribersForStore(undefined, "GOOGLE_PLAY"), null);
  assert.equal(subscribersForStore([], "GOOGLE_PLAY"), 0);
  assert.equal(
    subscribersForStore(
      [
        { store: "PLAY_STORE", total: "2" },
        { store: "google_play", total: 1 },
        { store: "APP_STORE", total: 4 },
        { store: "OTHER", total: 5 },
      ],
      "GOOGLE_PLAY",
    ),
    3,
  );
});
