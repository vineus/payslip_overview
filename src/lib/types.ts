export interface PayslipData {
  id?: number;
  period: string; // "2024-03"
  format: "payfit" | "silae";
  filename: string;
  uploaded_at?: string;

  // Core salary fields
  gross_salary: number | null;
  net_before_tax: number | null;
  income_tax_rate: number | null;
  income_tax: number | null;
  net_pay: number | null;
  net_social: number | null;

  // Deductions breakdown
  employee_contributions: number | null;
  employer_contributions: number | null;
  meal_vouchers: number | null;
  other_deductions: number | null;

  // Extras
  base_salary: number | null;
  bonus: number | null;
  expense_reimb: number | null;

  // Leave balances
  cp_n2_balance: number | null;
  cp_n1_balance: number | null;
  cp_n_balance: number | null;
  rtt_balance: number | null;

  // Year-to-date cumulative
  ytd_net_taxable: number | null;
  ytd_gross: number | null;
  ytd_income_tax: number | null;
  ytd_days_worked: number | null;

}

export interface ParsedPage {
  text: string;
  num: number;
}

export interface ParseResult {
  pages: ParsedPage[];
  text: string;
}
