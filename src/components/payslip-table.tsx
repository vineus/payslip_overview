"use client";

import { Trash2 } from "lucide-react";

interface PayslipRow {
  id: number;
  period: string;
  format: string;
  filename: string;
  gross_salary: number | null;
  net_pay: number | null;
  income_tax: number | null;
  income_tax_rate: number | null;
  base_salary: number | null;
  bonus: number | null;
}

function formatEuro(n: number | null): string {
  if (n === null) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

export function PayslipTable({
  payslips,
  onDelete,
  selectedPeriod,
  onSelectPeriod,
}: {
  payslips: PayslipRow[];
  onDelete: (id: number) => void;
  selectedPeriod: string | null;
  onSelectPeriod: (period: string) => void;
}) {
  if (!payslips.length) return null;

  return (
    <div>
      <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-3">All Payslips</h3>
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Period</th>
              <th className="px-4 py-2 text-left font-medium">Format</th>
              <th className="px-4 py-2 text-right font-medium">Base</th>
              <th className="px-4 py-2 text-right font-medium">Gross</th>
              <th className="px-4 py-2 text-right font-medium">Net Pay</th>
              <th className="px-4 py-2 text-right font-medium">Tax</th>
              <th className="px-4 py-2 text-right font-medium">Tax Rate</th>
              <th className="px-4 py-2 text-right font-medium">Bonus</th>
              <th className="px-4 py-2 text-center font-medium w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {payslips.map((p) => (
              <tr
                key={p.id}
                onClick={() => onSelectPeriod(p.period)}
                className={`cursor-pointer transition-colors ${
                  p.period === selectedPeriod
                    ? "bg-blue-950/40 border-l-2 border-l-blue-500"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
                }`}
              >
                <td className="px-4 py-2 font-mono">{p.period}</td>
                <td className="px-4 py-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    p.format === "payfit"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                      : "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                  }`}>
                    {p.format}
                  </span>
                </td>
                <td className="px-4 py-2 text-right font-mono">{formatEuro(p.base_salary)}</td>
                <td className="px-4 py-2 text-right font-mono">{formatEuro(p.gross_salary)}</td>
                <td className="px-4 py-2 text-right font-mono font-semibold">{formatEuro(p.net_pay)}</td>
                <td className="px-4 py-2 text-right font-mono">{formatEuro(p.income_tax)}</td>
                <td className="px-4 py-2 text-right font-mono">
                  {p.income_tax_rate !== null ? `${(p.income_tax_rate * 100).toFixed(1)}%` : "—"}
                </td>
                <td className="px-4 py-2 text-right font-mono">
                  {p.bonus ? formatEuro(p.bonus) : ""}
                </td>
                <td className="px-4 py-2 text-center">
                  <button
                    onClick={() => onDelete(p.id)}
                    className="text-zinc-400 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
