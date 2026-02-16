import { PayslipData } from "../types";

// Parse French number format: "1 234,56" or "1 234.56" → 1234.56
function parseNum(str: string | undefined | null): number | null {
  if (!str) return null;
  const cleaned = str.replace(/\s/g, "").replace(",", ".");
  const val = parseFloat(cleaned);
  return isNaN(val) ? null : val;
}

function extractAfter(text: string, pattern: RegExp): number | null {
  const match = text.match(pattern);
  if (!match) return null;
  return parseNum(match[1]);
}

export function parsePayfit(fullText: string, filename: string): PayslipData {
  const text = fullText;

  // Period: "EN EUROS - mars 2024"
  let period = "";
  const monthMatch = text.match(/EN EUROS\s*-\s*([\w\u00C0-\u024F]+)\s+(\d{4})/i);
  if (monthMatch) {
    const monthMap: Record<string, string> = {
      janvier: "01", "février": "02", fevrier: "02", mars: "03",
      avril: "04", mai: "05", juin: "06", juillet: "07",
      "août": "08", aout: "08", septembre: "09", octobre: "10",
      novembre: "11", "décembre": "12", decembre: "12",
    };
    const monthNum = monthMap[monthMatch[1].toLowerCase()] || "01";
    period = `${monthMatch[2]}-${monthNum}`;
  }

  // Base salary: "Salaire de base9 583,33" (no space between label and number in v1)
  const baseSalary = extractAfter(text, /Salaire de base\s*(\d[\d\s]*[.,]\d{2})/);

  // Gross salary: "Rémunération brute\nDont X € de primes\n9 136,30 €"
  const grossMatch = text.match(
    /Rémunération brute\s*\n(?:Dont[\s\S]*?\n)?(\d[\d\s]*[.,]\d{2})\s*€/
  );
  const grossSalary = grossMatch ? parseNum(grossMatch[1]) : null;

  // Employee contributions
  const employeeContributions = extractAfter(
    text,
    /Cotisations et contributions salariales\s*[-–]\s*(\d[\d\s]*[.,]\d{2})\s*€/
  ) || extractAfter(
    text,
    /TOTAL COTISATIONS & CONTRIBUTIONS SALARIALES\s*\d?\s*(\d[\d\s]*[.,]\d{2})/
  );

  // Employer contributions
  const employerContributions = extractAfter(
    text,
    /TOTAL COTISATIONS & CONTRIBUTIONS PATRONALES\s*(\d[\d\s]*[.,]\d{2})/
  );

  // Net before tax
  const netBeforeTax = extractAfter(
    text, /salaire avant imp[oô]t\s*(\d[\d\s]*[.,]\d{2})\s*€/
  ) || extractAfter(
    text, /Net à payer avant imp[oô]t(?:\s+sur le revenu)?\s*(\d[\d\s]*[.,]\d{2})/
  );

  // Income tax: "Prélèvement à la source (20,00 %)  1 506,02 €"
  const incomeTaxMatch = text.match(
    /Prélèvement à la source\s*\((\d[\d\s]*[.,]\d{2})\s*%\)\s*(\d[\d\s]*[.,]\d{2})\s*€/
  );
  let incomeTaxRate = incomeTaxMatch ? (parseNum(incomeTaxMatch[1]) || 0) / 100 : null;
  let incomeTax = incomeTaxMatch ? parseNum(incomeTaxMatch[2]) : null;

  if (!incomeTax) {
    incomeTax = extractAfter(
      text,
      /Impôt sur le revenu prélevé à la source\s*\d?\s*[\d\s.,]+\s+[\d.,]+\s*%\s*(\d[\d\s]*[.,]\d{2})/
    );
  }
  if (!incomeTaxRate) {
    const rateMatch = text.match(/source\s*\d?\s*[\d\s.,]+\s+(\d[\d\s]*[.,]\d{2})\s*%/);
    if (rateMatch) incomeTaxRate = (parseNum(rateMatch[1]) || 0) / 100;
  }

  // Net pay
  const netPay = extractAfter(
    text, /salaire après imp[oô]t\s*(\d[\d\s]*[.,]\d{2})/
  ) || extractAfter(
    text, /Net payé en euros[^]*?=\s*(\d[\d\s]*[.,]\d{2})/
  );

  // Net social
  const netSocial = extractAfter(text, /[Mm]ontant net social\s*(\d[\d\s]*[.,]\d{2})/);

  // Meal vouchers
  const mealVouchers = extractAfter(
    text, /[Tt]itres[- ]restaurant\s*[\d\s.,]+\s*[\d\s.,]+\s*(\d[\d\s]*[.,]\d{2})/
  );

  // Expense reimbursement
  const expenseReimb = extractAfter(
    text, /notes de frais\s*\(\s*(\d[\d\s]*[.,]\d{2})\s*€\)/
  ) || extractAfter(
    text, /Indemnités non soumises\s*\d?\s*(\d[\d\s]*[.,]\d{2})/
  );

  // Other deductions
  const otherDeductions = extractAfter(
    text, /Autres retenues[\s\S]*?[-–]\s*(\d[\d\s]*[.,]\d{2})\s*€/
  );

  // Bonus
  const bonusMatch = text.match(/Dont\s+(\d[\d\s]*[.,]\d{2})\s*€\s*de primes/);
  const bonus = bonusMatch ? parseNum(bonusMatch[1]) : null;

  // Leave balances: "CP N-20,00 jours" "CP N-10,00 jours" "CP N-0,12 jours" "RTT0,68 jours"
  const cpN2Balance = extractAfter(text, /CP N-2\s*(\d[\d\s,]*)\s*jours/);
  const cpN1Balance = extractAfter(text, /CP N-1\s*(\d[\d\s,]*)\s*jours/);
  // CP N (not followed by -1 or -2): "CP N-0,12 jours" → balance = -0.12
  const cpNMatch = text.match(/CP N(?!-[12])\s*([-]?\d[\d\s,]*)\s*jours/);
  const cpNBalance = cpNMatch ? parseNum(cpNMatch[1]) : null;
  const rttBalance = extractAfter(text, /RTT\s*(-?\d[\d\s,]*)\s*jours/);

  // YTD cumuls
  const cumulSection = text.match(/Cumuls\s+DEPUIS[\s\S]*?(?=Congés disponibles|$)/i);
  const cumulText = cumulSection ? cumulSection[0] : text;

  const ytdNetTaxable = extractAfter(cumulText, /[Nn]et imposable\s*(\d[\d\s]*[.,]\d{2})\s*€?/);
  const ytdGross = extractAfter(cumulText, /Salaire brut\s*(\d[\d\s]*[.,]\d{2})\s*€?/);
  const ytdIncomeTax = extractAfter(cumulText, /Prélèvement à la source\s*(\d[\d\s]*[.,]\d{2})\s*€?/);
  const ytdDays = extractAfter(cumulText, /Temps travaillé\s*(\d[\d\s]*)\s*j/);

  return {
    period,
    format: "payfit",
    filename,
    gross_salary: grossSalary,
    net_before_tax: netBeforeTax,
    income_tax_rate: incomeTaxRate,
    income_tax: incomeTax,
    net_pay: netPay,
    net_social: netSocial,
    employee_contributions: employeeContributions,
    employer_contributions: employerContributions,
    meal_vouchers: mealVouchers,
    other_deductions: otherDeductions,
    base_salary: baseSalary,
    bonus: bonus && bonus > 0 ? bonus : null,
    expense_reimb: expenseReimb,
    cp_n2_balance: cpN2Balance,
    cp_n1_balance: cpN1Balance,
    cp_n_balance: cpNBalance,
    rtt_balance: rttBalance,
    ytd_net_taxable: ytdNetTaxable,
    ytd_gross: ytdGross,
    ytd_income_tax: ytdIncomeTax,
    ytd_days_worked: ytdDays,
  };
}
