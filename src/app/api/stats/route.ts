import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { PARSER_VERSION } from "@/lib/parsers";

export async function GET() {
  const db = await getDb();

  const results = db.exec(
    `SELECT period, gross_salary, net_before_tax, income_tax_rate, income_tax, net_pay, net_social,
            employee_contributions, employer_contributions, meal_vouchers, other_deductions,
            base_salary, bonus, prime_vacances, leave_adjustment, expense_reimb,
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

  const outdatedRes = db.exec(
    `SELECT COUNT(*) FROM payslips WHERE parser_version IS NULL OR parser_version < ${PARSER_VERSION}`
  );
  const outdatedCount = outdatedRes.length > 0 ? (outdatedRes[0].values[0][0] as number) : 0;

  return NextResponse.json({ payslips, latest, previous, outdatedCount });
}
