import fs from "fs";
import path from "path";
import { parsePdf } from "../src/lib/parsers/index";

const SOURCE_DIR = path.join(__dirname, "..", "source");

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms: ${label}`)), ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

async function main() {
  const files = fs
    .readdirSync(SOURCE_DIR)
    .filter((f) => f.endsWith(".pdf"))
    .sort();

  console.log(`Found ${files.length} PDFs\n`);

  let successCount = 0;
  const results: Array<{
    file: string;
    period: string;
    format: string;
    gross: number | null;
    net: number | null;
    netBeforeTax: number | null;
    tax: number | null;
    taxRate: number | null;
    baseSalary: number | null;
    bonus: number | null;
    empContrib: number | null;
    cpN1: number | null;
    cpN: number | null;
    rtt: number | null;
    ytdGross: number | null;
  }> = [];

  for (const file of files) {
    try {
      const buf = fs.readFileSync(path.join(SOURCE_DIR, file));
      const data = await withTimeout(parsePdf(buf, file), 30000, file);

      results.push({
        file: file.slice(0, 50),
        period: data.period,
        format: data.format,
        gross: data.gross_salary,
        net: data.net_pay,
        netBeforeTax: data.net_before_tax,
        tax: data.income_tax,
        taxRate: data.income_tax_rate,
        baseSalary: data.base_salary,
        bonus: data.bonus,
        empContrib: data.employee_contributions,
        cpN1: data.cp_n1_balance,
        cpN: data.cp_n_balance,
        rtt: data.rtt_balance,
        ytdGross: data.ytd_gross,
      });

      const missing: string[] = [];
      if (!data.period) missing.push("period");
      if (!data.gross_salary) missing.push("gross");
      if (!data.net_pay) missing.push("net_pay");
      if (!data.net_before_tax) missing.push("net_before_tax");
      if (!data.income_tax) missing.push("income_tax");

      if (missing.length === 0) {
        successCount++;
        console.log(
          `✓ ${data.period} (${data.format}) - Gross: ${data.gross_salary}, Net: ${data.net_pay}, Tax: ${data.income_tax}`
        );
      } else {
        console.log(
          `✗ ${file.slice(0, 50)} - Missing: ${missing.join(", ")}`
        );
        if (data.period) console.log(`  Period: ${data.period}`);
        if (data.gross_salary) console.log(`  Gross: ${data.gross_salary}`);
      }
    } catch (err) {
      console.log(`✗ ${file.slice(0, 50)} - ERROR: ${err}`);
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`${successCount}/${files.length} parsed successfully\n`);

  // Print table
  console.log(
    "Period     | Format | Base      | Gross     | Net       | NetBfTax  | Tax       | Rate  | Bonus    | Contrib   | CP N-1 | CP N   | RTT    | YTD Gross"
  );
  console.log("-".repeat(170));
  for (const r of results.sort((a, b) => a.period.localeCompare(b.period))) {
    const fmt = (n: number | null, w = 9) =>
      n !== null ? n.toFixed(2).padStart(w) : "".padStart(w, "-");
    console.log(
      `${r.period.padEnd(10)} | ${r.format.padEnd(6)} | ${fmt(r.baseSalary)} | ${fmt(r.gross)} | ${fmt(r.net)} | ${fmt(r.netBeforeTax)} | ${fmt(r.tax)} | ${r.taxRate !== null ? (r.taxRate * 100).toFixed(1).padStart(5) + "%" : "-----"} | ${fmt(r.bonus, 8)} | ${fmt(r.empContrib)} | ${fmt(r.cpN1, 6)} | ${fmt(r.cpN, 6)} | ${fmt(r.rtt, 6)} | ${fmt(r.ytdGross)}`
    );
  }
}

main().catch(console.error);
