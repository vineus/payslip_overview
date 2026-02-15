import { PayslipData } from "../types";

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

const MONTH_MAP: Record<string, string> = {
  janvier: "01", "février": "02", fevrier: "02", mars: "03",
  avril: "04", mai: "05", juin: "06", juillet: "07",
  "août": "08", aout: "08", septembre: "09", octobre: "10",
  novembre: "11", "décembre": "12", decembre: "12",
};

export function parseSilae(fullText: string, filename: string): PayslipData {
  const text = fullText;

  // Period: "Période : Juin 2024"
  let period = "";
  const periodMatch = text.match(/Période\s*:\s*(\w+)\s+(\d{4})/i);
  if (periodMatch) {
    const monthNum = MONTH_MAP[periodMatch[1].toLowerCase()] || "01";
    period = `${periodMatch[2]}-${monthNum}`;
  }
  if (!period) {
    const headerMatch = text.match(/##BULLETIN##(\d{2})-(\d{4})##/);
    if (headerMatch) period = `${headerMatch[2]}-${headerMatch[1]}`;
  }

  // In pdf-parse v1, labels and numbers may be concatenated without whitespace
  // e.g., "Salaire brut9 866.27" or "Salaire brut\t9 866.27"
  // Use \s* to optionally match any whitespace between label and number

  // Base salary: "Salaire de base (Forfait 218 jours)9 583.33"
  const baseSalary = extractAfter(text, /Salaire de base\s*(?:\([^)]*\))?\s*([\d][\d\s]*\.\d{2})/);

  // Gross salary: "Salaire brut9 866.27"
  const grossSalary = extractAfter(text, /Salaire brut\s*([\d][\d\s]*\.\d{2})/);

  // Contributions: "Total des cotisations et contributions2 127.424 432.26"
  // The two numbers are concatenated. Employee contrib ends at a digit pattern boundary.
  const contribMatch = text.match(
    /Total des cotisations et contributions\s*([\d][\d\s]*\.\d{2})([\d][\d\s]*\.\d{2})/
  );
  const employeeContributions = contribMatch ? parseNum(contribMatch[1]) : null;
  const employerContributions = contribMatch ? parseNum(contribMatch[2]) : null;

  // Net social: "Montant net social7 738.85"
  const netSocial = extractAfter(text, /Montant net social\s*([\d][\d\s]*\.\d{2})/);

  // Net before tax: "Net à payer avant impôt sur le revenu7 638.85"
  const netBeforeTax = extractAfter(
    text, /Net à payer avant imp[oô]t sur le revenu\s*([\d][\d\s]*\.\d{2})/
  );

  // Income tax: "PAS8 138.98- 17.20001 399.90" or "PAS7 904.36  - 17.1000    1 351.65"
  // Rate always has exactly 4 decimal places to avoid greedy matching into tax amount
  const taxMatch = text.match(
    /Impôt sur le revenu prélevé à la source\s*-\s*PAS\s*([\d][\d\s]*\.\d{2})\s*-\s*([\d][\d\s]*\.\d{4})\s*([\d][\d\s]*\.\d{2})/
  );
  const incomeTax = taxMatch ? parseNum(taxMatch[3]) : null;
  const incomeTaxRate = taxMatch ? (parseNum(taxMatch[2]) || 0) / 100 : null;

  // Net pay: "Net payé : 6 238.95 euros" (final line) or "Net payé6 238.95"
  const netPayFinal = text.match(/Net payé\s*:\s*([\d][\d\s]*\.\d{2})\s*euros/);
  const netPay = netPayFinal
    ? parseNum(netPayFinal[1])
    : extractAfter(text, /Net payé\s*([\d][\d\s]*\.\d{2})/);

  // Meal vouchers: "Titres-restaurant20.005.0000100.0020.005.0000100.00"
  // Pattern: label + count + rate + employee_amount + count + rate + employer_amount
  const mealMatch = text.match(
    /Titres-restaurant\s*([\d][\d\s]*\.\d{2})([\d][\d\s]*\.[\d]+)([\d][\d\s]*\.\d{2})/
  );
  const mealVouchers = mealMatch ? parseNum(mealMatch[3]) : null;

  // Bonus: "Bonus21 062.00" or "Bonus  21 062.00"
  let bonus: number | null = null;
  const bonusMatch = text.match(/Bonus\s*([\d][\d\s]*\.\d{2})/);
  if (bonusMatch) bonus = parseNum(bonusMatch[1]);
  const primeVacances = extractAfter(text, /Prime de vacances\s*([\d][\d\s]*\.\d{2})/);
  if (primeVacances) bonus = (bonus || 0) + primeVacances;
  if (bonus === 0) bonus = null;

  // Expense reimbursement
  const expenseReimb = extractAfter(text, /Remboursement[^\n]*([\d][\d\s]*\.\d{2})/);

  // YTD income tax: "cumul PAS annuel5 625.02"
  const ytdIncomeTax = extractAfter(text, /cumul PAS annuel\s*([\d][\d\s]*\.\d{2})/);

  // Parse the summary numbers at the end of the text
  // After "Paiement le DD/MM/YYYY par Virement" there are stacked numbers
  const paymentSplit = text.split(/Paiement le[^\n]*(?:Virement|virement)/);
  let cpN1Balance: number | null = null;
  let cpNBalance: number | null = null;
  let rttBalance: number | null = null;
  let ytdGross: number | null = null;
  let ytdNetTaxable: number | null = null;
  let ytdDays: number | null = null;

  // Actually in v1, the numbers come BEFORE "Net payé : X euros"
  // They appear after "Net payé6 238.95" and before "Net payé : 6 238.95 euros"
  // Let me extract from the raw tail of the document

  // Find all the stacked numbers after the last "Net payé" line (non-final)
  const netPayeFirstIdx = text.indexOf("Net payé");
  const netPayeFinalIdx = text.lastIndexOf("Net payé :");
  if (netPayeFirstIdx >= 0 && netPayeFinalIdx > netPayeFirstIdx) {
    const numBlock = text.substring(netPayeFirstIdx, netPayeFinalIdx);
    // Skip the first line (Net payé6 238.95) and extract the stacked numbers
    const lines = numBlock.split("\n").slice(1);
    const tailNums: number[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      // Each line may have one or more numbers
      const matches = trimmed.match(/-?\s*[\d][\d\s]*\.\d{1,4}/g);
      if (matches) {
        for (const m of matches) {
          const n = parseNum(m);
          if (n !== null) tailNums.push(n);
        }
      }
    }

    // Summary table: 8 columns × 2 rows = 16 numbers
    // Then leave: 3 groups (N-1, N, RTT) × (Acquis, Pris, [Solde if non-zero])
    // Solde may be omitted when it equals 0, so total is 22-25

    if (tailNums.length >= 16) {
      ytdDays = tailNums[1]; // annual days
      ytdGross = tailNums[3]; // annual brut
      ytdNetTaxable = tailNums[7]; // annual net imposable
    }

    // Parse leave groups: each has Acquis, Pris, and optionally Solde
    // Solde = Acquis - Pris. If present in data, it follows Pris.
    if (tailNums.length > 16) {
      const leaveNums = tailNums.slice(16);
      const soldes: number[] = [];
      let ptr = 0;
      for (let g = 0; g < 3 && ptr + 1 < leaveNums.length; g++) {
        const acquis = leaveNums[ptr];
        const pris = leaveNums[ptr + 1];
        ptr += 2;
        const computed = Math.round((acquis - pris) * 100) / 100;
        if (ptr < leaveNums.length && Math.abs(leaveNums[ptr] - computed) < 0.02) {
          soldes.push(leaveNums[ptr]);
          ptr += 1;
        } else {
          soldes.push(computed);
        }
      }
      if (soldes.length >= 1) cpN1Balance = soldes[0];
      if (soldes.length >= 2) cpNBalance = soldes[1];
      if (soldes.length >= 3) rttBalance = soldes[2];
    }
  }

  return {
    period,
    format: "silae",
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
    other_deductions: mealVouchers,
    base_salary: baseSalary,
    bonus,
    expense_reimb: expenseReimb,
    cp_n2_balance: null,
    cp_n1_balance: cpN1Balance,
    cp_n_balance: cpNBalance,
    rtt_balance: rttBalance,
    ytd_net_taxable: ytdNetTaxable,
    ytd_gross: ytdGross,
    ytd_income_tax: ytdIncomeTax,
    ytd_days_worked: ytdDays,
  };
}
