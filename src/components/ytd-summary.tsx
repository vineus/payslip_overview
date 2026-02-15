"use client";

interface PayslipRow {
  period: string;
  ytd_net_taxable: number | null;
  ytd_gross: number | null;
  ytd_income_tax: number | null;
  ytd_days_worked: number | null;
}

function formatEuro(n: number | null): string {
  if (n === null) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

export function YtdSummary({ payslip, period }: { payslip: PayslipRow | null; period: string | null }) {
  if (!payslip) return null;

  const formatPeriod = (p: string) => {
    const [year, month] = p.split("-");
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  const items = [
    { label: "YTD Gross", value: formatEuro(payslip.ytd_gross) },
    { label: "YTD Net Taxable", value: formatEuro(payslip.ytd_net_taxable) },
    { label: "YTD Income Tax", value: formatEuro(payslip.ytd_income_tax) },
    { label: "YTD Days Worked", value: payslip.ytd_days_worked !== null ? `${payslip.ytd_days_worked} days` : "—" },
  ];

  return (
    <div>
      <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-3">
        Year-to-Date {period && <span className="text-zinc-400">— {formatPeriod(period)}</span>}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">{item.label}</div>
            <div className="text-lg font-semibold mt-0.5">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
