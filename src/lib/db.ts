import initSqlJs, { Database } from "sql.js";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(
  process.env.HOME || process.env.USERPROFILE || ".",
  ".payslip-overview"
);
const DB_PATH = path.join(DATA_DIR, "data.db");

let db: Database | null = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS payslips (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  period          TEXT UNIQUE,
  format          TEXT,
  filename        TEXT,
  uploaded_at     TEXT,
  gross_salary    REAL,
  net_before_tax  REAL,
  income_tax_rate REAL,
  income_tax      REAL,
  net_pay         REAL,
  net_social      REAL,
  employee_contributions  REAL,
  employer_contributions  REAL,
  meal_vouchers           REAL,
  other_deductions        REAL,
  base_salary     REAL,
  bonus           REAL,
  expense_reimb   REAL,
  cp_n2_balance   REAL,
  cp_n1_balance   REAL,
  cp_n_balance    REAL,
  rtt_balance     REAL,
  ytd_net_taxable   REAL,
  ytd_gross         REAL,
  ytd_income_tax    REAL,
  ytd_days_worked   REAL
);
`;

async function getDb(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs({
    locateFile: (file: string) => {
      // In node_modules, sql.js ships the wasm file
      return path.join(
        process.cwd(),
        "node_modules",
        "sql.js",
        "dist",
        file
      );
    },
  });

  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
  }

  // Load existing DB or create new one
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Ensure schema exists
  db.run(SCHEMA);

  // Migration: drop raw_text column from existing DBs
  const cols = db.exec("PRAGMA table_info(payslips)");
  if (cols.length > 0) {
    const hasRawText = cols[0].values.some((row) => row[1] === "raw_text");
    if (hasRawText) {
      // sql.js doesn't support ALTER TABLE DROP COLUMN — recreate with full schema
      db.run(`CREATE TABLE payslips_new (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        period          TEXT UNIQUE,
        format          TEXT,
        filename        TEXT,
        uploaded_at     TEXT,
        gross_salary    REAL,
        net_before_tax  REAL,
        income_tax_rate REAL,
        income_tax      REAL,
        net_pay         REAL,
        net_social      REAL,
        employee_contributions  REAL,
        employer_contributions  REAL,
        meal_vouchers           REAL,
        other_deductions        REAL,
        base_salary     REAL,
        bonus           REAL,
        expense_reimb   REAL,
        cp_n2_balance   REAL,
        cp_n1_balance   REAL,
        cp_n_balance    REAL,
        rtt_balance     REAL,
        ytd_net_taxable   REAL,
        ytd_gross         REAL,
        ytd_income_tax    REAL,
        ytd_days_worked   REAL
      )`);
      db.run(`INSERT INTO payslips_new SELECT
        id, period, format, filename, uploaded_at,
        gross_salary, net_before_tax, income_tax_rate, income_tax, net_pay, net_social,
        employee_contributions, employer_contributions, meal_vouchers, other_deductions,
        base_salary, bonus, expense_reimb,
        cp_n2_balance, cp_n1_balance, cp_n_balance, rtt_balance,
        ytd_net_taxable, ytd_gross, ytd_income_tax, ytd_days_worked
        FROM payslips`);
      db.run("DROP TABLE payslips");
      db.run("ALTER TABLE payslips_new RENAME TO payslips");
    }
  }

  saveDb();

  return db;
}

function saveDb(): void {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
  }
  fs.writeFileSync(DB_PATH, buffer, { mode: 0o600 });
}

export { getDb, saveDb, DB_PATH, DATA_DIR };
