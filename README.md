# Dan fost anxios — panel

React/Vite administration panel. The neutral design follows the selected [shadcn dashboard reference](https://ui.shadcn.com/view/new-york-v4/dashboard-01); charts use Recharts. Shared navigation, forms and tables use the same palette. Report tabs and the mobile drawer support keyboard navigation; charts expose their data in accessible tables.

## Development

Use Node.js 20.19+ or a supported newer LTS release:

```sh
npm ci
npm run dev
```

Development requests to `/api` proxy to `http://127.0.0.1:3000`. Override `VITE_API_PROXY_TARGET` for another development backend. Production uses `VITE_API_URL` or a same-origin `/api` reverse proxy. Login uses the existing admin token; never embed it or RevenueCat secrets in a `VITE_*` variable.

## Reports

- Overview: paid subscribers, revenue, app use and outstanding work.
- Revenue: month/year/custom UTC periods, daily/monthly grouping, previous period/year comparison, currencies, sales/refunds, plan/store breakdown and CSV download.
- Subscriptions: Basic/Premium/Pro/VIP in paid totals and the paginated list. Trials have a separate indicator and conversion metric.
- App activity: video consumption, challenge progress, exact-day 7/30 return, SOS feedback and check-ins.
- Dan's activity: unanswered questions, response time, completed meetings and open bugs.

The Venituri tab accepts the official RevenueCat Transactions CSV for historical backfill, up to 4 MB / 10,000 rows. Import and webhook retry share transaction identities. Revenue excludes trial/sandbox/promo/family grants and is before store fees/taxes. Missing prices and recording coverage are shown; new mobile activity metrics accumulate after the updated app is released.

Deploy the compatible backend first. Its `ANALYTICS.md` documents schema, webhook setup and metric definitions.

## Checks

```sh
npm test
npm run lint
npm run build
```

Charts load separately from ordinary administration routes. Keep the existing Windows SWC override until newer binaries are verified on the build host.
