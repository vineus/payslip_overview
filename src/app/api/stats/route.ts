import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = await getDb();

  const results = db.exec(
    `SELECT period, gross_salary, net_before_tax, income_tax_rate, income_tax, net_pay, net_social,
            employee_contributions, employer_contributions, meal_vouchers, other_deductions,
            base_salary, bonus, expense_reimb,
            cp_n2_balance, cp_n1_balance, cp_n_balance, rtt_balance,
            ytd_net_taxable, ytd_gross, ytd_income_tax, ytd_days_worked
     FROM payslips ORDER BY period ASC`
  );

  if (!results.length) {
    return NextResponse.json({ payslips: [], latest: null, previous: null });
  }

  const columns = results[0].columns;
  const payslips = results[0].values.map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });

  const latest = payslips.length > 0 ? payslips[payslips.length - 1] : null;
  const previous = payslips.length > 1 ? payslips[payslips.length - 2] : null;

  return NextResponse.json({ payslips, latest, previous });
}
