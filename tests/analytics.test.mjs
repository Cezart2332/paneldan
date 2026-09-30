import test from "node:test";
import assert from "node:assert/strict";
import {
  dateRange,
  formatPercent,
  formatMoney,
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
