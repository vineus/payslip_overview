import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/db";
import { parsePdf } from "@/lib/parsers";
import { PayslipData } from "@/lib/types";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function GET() {
  const db = await getDb();
  const results = db.exec(
    "SELECT id, period, format, filename, uploaded_at, gross_salary, net_before_tax, income_tax_rate, income_tax, net_pay, net_social, employee_contributions, employer_contributions, meal_vouchers, other_deductions, base_salary, bonus, expense_reimb, cp_n2_balance, cp_n1_balance, cp_n_balance, rtt_balance, ytd_net_taxable, ytd_gross, ytd_income_tax, ytd_days_worked FROM payslips ORDER BY period ASC"
  );

  if (!results.length) return NextResponse.json([]);

  const columns = results[0].columns;
  const rows = results[0].values.map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const files = formData.getAll("files") as File[];

  if (!files.length) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  const results: Array<{ filename: string; period: string; success: boolean; error?: string }> = [];

  const db = await getDb();

  for (const file of files) {
    try {
      if (!file.name.endsWith(".pdf")) {
        results.push({ filename: file.name, period: "", success: false, error: "Not a PDF file" });
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        results.push({ filename: file.name, period: "", success: false, error: "File too large (max 10 MB)" });
        continue;
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      // Validate PDF magic bytes
      if (buffer.length < 4 || buffer.subarray(0, 4).toString("ascii") !== "%PDF") {
        results.push({ filename: file.name, period: "", success: false, error: "Invalid PDF file" });
        continue;
      }

      const data: PayslipData = await parsePdf(buffer, file.name);

      if (!data.period) {
        results.push({ filename: file.name, period: "", success: false, error: "Could not detect period" });
        continue;
      }

      db.run(
        `INSERT OR REPLACE INTO payslips (
          period, format, filename, uploaded_at,
          gross_salary, net_before_tax, income_tax_rate, income_tax, net_pay, net_social,
          employee_contributions, employer_contributions, meal_vouchers, other_deductions,
          base_salary, bonus, expense_reimb,
          cp_n2_balance, cp_n1_balance, cp_n_balance, rtt_balance,
          ytd_net_taxable, ytd_gross, ytd_income_tax, ytd_days_worked
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.period, data.format, data.filename, new Date().toISOString(),
          data.gross_salary, data.net_before_tax, data.income_tax_rate, data.income_tax, data.net_pay, data.net_social,
          data.employee_contributions, data.employer_contributions, data.meal_vouchers, data.other_deductions,
          data.base_salary, data.bonus, data.expense_reimb,
          data.cp_n2_balance, data.cp_n1_balance, data.cp_n_balance, data.rtt_balance,
          data.ytd_net_taxable, data.ytd_gross, data.ytd_income_tax, data.ytd_days_worked,
        ]
      );

      results.push({ filename: file.name, period: data.period, success: true });
    } catch (err) {
      results.push({
        filename: file.name,
        period: "",
        success: false,
        error: "Failed to parse PDF",
      });
    }
  }

  saveDb();
  return NextResponse.json(results);
}

export async function DELETE() {
  const db = await getDb();
  db.run("DELETE FROM payslips");
  saveDb();
  return NextResponse.json({ success: true });
}
