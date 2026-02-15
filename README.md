# payslip-overview

Personal salary analytics dashboard — upload French payslip PDFs and get interactive charts and stats.

## Quick Start

```bash
npx @vineus/payslip-overview
```

This starts a local web server and opens the dashboard in your browser. Upload your payslip PDFs and explore your salary data.

## Supported Formats

- **Payfit** — detected by "BULLETIN DE PAIE" header
- **Silae / Deel** — detected by "BULLETIN DE SALAIRE" header

## Features

- Upload multiple payslip PDFs at once
- Automatic format detection (Payfit vs Silae)
- Salary evolution chart over time
- Monthly breakdown (gross, net, employer cost)
- Salary composition breakdown
- Leave/vacation tracking
- Local-only — all data stays on your machine (`~/.payslip-overview/data.db`)
- Re-uploading the same month replaces the existing data

## Development

```bash
git clone https://github.com/vineus/payslip_overview.git
cd payslip_overview
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (port 3000) |
| `npm run build` | Production build |
| `npm run start` | Run via CLI (opens browser) |
| `npm run lint` | ESLint |
| `npm run test:parse` | Test PDF parsing |

## Tech Stack

- [Next.js](https://nextjs.org/) 16 (App Router, React 19)
- [sql.js](https://github.com/sql-js/sql.js) (SQLite in WASM, no external DB)
- [Recharts](https://recharts.org/) for charts
- [Tailwind CSS](https://tailwindcss.com/) v4
- [pdf-parse](https://www.npmjs.com/package/pdf-parse) for PDF text extraction

## License

MIT
