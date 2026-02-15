# payslip-overview

Personal salary analytics dashboard — upload French payslip PDFs (Payfit or Silae) and get charts/stats.

## Commands

- `npm run dev` — Start Next.js dev server (port 3000)
- `npm run build` — Production build (standalone output)
- `npm run start` — Run via CLI launcher (`bin/cli.js`), opens browser
- `npm run lint` — ESLint
- `npm run test:parse` — Test PDF parsing (`tsx scripts/test-parse.ts`)

## Architecture

Next.js 16 app (React 19, App Router). No external database — uses **sql.js** (SQLite compiled to WASM) with the DB file persisted at `~/.payslip-overview/data.db`.

```
src/
├── app/
│   ├── page.tsx                    # Main dashboard page
│   ├── layout.tsx
│   └── api/
│       ├── payslips/
│       │   ├── route.ts            # GET (list), POST (upload PDFs), DELETE (clear all)
│       │   └── [id]/route.ts       # DELETE single payslip
│       └── stats/route.ts          # GET aggregated stats for charts
├── components/                     # Dashboard UI (Recharts charts, upload, tables)
└── lib/
    ├── types.ts                    # PayslipData interface
    ├── db.ts                       # sql.js singleton, schema, getDb/saveDb
    ├── cn.ts                       # tailwind-merge utility
    └── parsers/
        ├── index.ts                # extractText, detectFormat, parsePdf
        ├── payfit.ts               # Payfit format parser
        └── silae.ts                # Silae format parser
```

## Key patterns

- **Path alias**: `@/*` → `./src/*`
- **PDF parsing**: `pdf-parse` extracts text, then `detectFormat()` picks Payfit vs Silae based on keywords ("BULLETIN DE PAIE" → Payfit, "BULLETIN DE SALAIRE" → Silae). Each parser uses regex to extract salary fields.
- **DB**: sql.js singleton in `lib/db.ts`. `getDb()` lazily initializes, `saveDb()` writes to disk after mutations. Period is `UNIQUE` — re-uploading the same month replaces the row (`INSERT OR REPLACE`).
- **Data flow**: Upload PDF → POST `/api/payslips` → parse → insert into SQLite → dashboard fetches GET `/api/stats` and GET `/api/payslips` to render charts.
- **Charts**: Recharts (`salary-evolution`, `monthly-chart`, `composition-chart`, `leave-evolution`)
- **Styling**: Tailwind CSS v4, shadcn-style utilities (`cn`, `class-variance-authority`)
- **CLI**: `bin/cli.js` — npm-publishable CLI that starts the standalone server or falls back to `next dev`
