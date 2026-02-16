"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp } from "lucide-react";

function formatEuro(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    signDisplay: "always",
  }).format(n);
}

interface VarianceItem {
  label: string;
  impact: number;
}

function computeVariance(
  current: Record<string, unknown>,
  previous: Record<string, unknown>,
): VarianceItem[] {
  const num = (obj: Record<string, unknown>, key: string): number =>
    (obj[key] as number | null) ?? 0;

  const items: VarianceItem[] = [];

  // Gross sub-components (positive impact on net)
  const deltaBase = num(current, "base_salary") - num(previous, "base_salary");
  if (Math.abs(deltaBase) >= 0.01) items.push({ label: "Base salary", impact: deltaBase });

  const deltaBonus = num(current, "bonus") - num(previous, "bonus");
  if (Math.abs(deltaBonus) >= 0.01) items.push({ label: "Bonus", impact: deltaBonus });

  const deltaPrimeVacances = num(current, "prime_vacances") - num(previous, "prime_vacances");
  if (Math.abs(deltaPrimeVacances) >= 0.01)
    items.push({ label: "Holiday bonus (prime de vacances)", impact: deltaPrimeVacances });

  const deltaLeave = num(current, "leave_adjustment") - num(previous, "leave_adjustment");
  if (Math.abs(deltaLeave) >= 0.01)
    items.push({ label: "Leave adjustments (CP)", impact: deltaLeave });

  // Residual gross = gross - base - bonus - prime_vacances - leave_adjustment
  const knownGross = (k: Record<string, unknown>) =>
    num(k, "base_salary") + num(k, "bonus") + num(k, "prime_vacances") + num(k, "leave_adjustment");
  const deltaOtherGross =
    (num(current, "gross_salary") - knownGross(current)) -
    (num(previous, "gross_salary") - knownGross(previous));
  if (Math.abs(deltaOtherGross) >= 0.01)
    items.push({ label: "Other gross components", impact: deltaOtherGross });

  // Deductions (increase = negative impact on net)
  // Label includes direction hint so "+98€" next to "Lower income tax" reads naturally
  const deductionLabel = (name: string, rawDelta: number) =>
    rawDelta > 0 ? `Higher ${name.toLowerCase()}` : `Lower ${name.toLowerCase()}`;

  const deltaContrib =
    num(current, "employee_contributions") - num(previous, "employee_contributions");
  if (Math.abs(deltaContrib) >= 0.01)
    items.push({ label: deductionLabel("Employee contributions", deltaContrib), impact: -deltaContrib });

  const deltaMeal = num(current, "meal_vouchers") - num(previous, "meal_vouchers");
  if (Math.abs(deltaMeal) >= 0.01)
    items.push({ label: deductionLabel("Meal vouchers", deltaMeal), impact: -deltaMeal });

  const deltaOtherDed = num(current, "other_deductions") - num(previous, "other_deductions");
  if (Math.abs(deltaOtherDed) >= 0.01)
    items.push({ label: deductionLabel("Other deductions", deltaOtherDed), impact: -deltaOtherDed });

  const deltaTax = num(current, "income_tax") - num(previous, "income_tax");
  if (Math.abs(deltaTax) >= 0.01)
    items.push({ label: deductionLabel("Income tax", deltaTax), impact: -deltaTax });

  // Expense reimbursements (positive impact on net)
  const deltaExpense = num(current, "expense_reimb") - num(previous, "expense_reimb");
  if (Math.abs(deltaExpense) >= 0.01)
    items.push({ label: "Expense reimbursements", impact: deltaExpense });

  // Sort by absolute impact descending
  items.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

  // Residual rounding line
  const actualDelta = num(current, "net_pay") - num(previous, "net_pay");
  const computedDelta = items.reduce((sum, i) => sum + i.impact, 0);
  const residual = actualDelta - computedDelta;
  if (Math.abs(residual) >= 0.01) {
    items.push({ label: "Rounding / Other", impact: residual });
  }

  return items;
}

export function VarianceExplanation({
  current,
  previous,
}: {
  current: Record<string, unknown> | null;
  previous: Record<string, unknown> | null;
}) {
  const [expanded, setExpanded] = useState(true);

  if (!current || current.net_pay == null) return null;
  if (!previous || previous.net_pay == null) {
    return (
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 py-3 text-sm text-zinc-400">
        No previous month for comparison
      </div>
    );
  }

  const delta = (current.net_pay as number) - (previous.net_pay as number);

  if (Math.abs(delta) < 0.01) {
    return (
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 py-3 text-sm text-zinc-500">
        No change in net pay compared to the previous month
      </div>
    );
  }

  const items = computeVariance(current, previous);
  const isPositive = delta > 0;
  const maxAbsImpact = Math.max(...items.map((i) => Math.abs(i.impact)));

  return (
    <div
      className={`rounded-lg border ${
        isPositive
          ? "border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/30"
          : "border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/30"
      }`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer"
      >
        <span className="text-sm">
          Your net pay is{" "}
          <span className={`font-semibold ${isPositive ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
            {formatEuro(delta)} {isPositive ? "higher" : "lower"}
          </span>{" "}
          than the previous month due to{" "}
          <span className="font-medium">{items.length} reason{items.length > 1 ? "s" : ""}</span>
        </span>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0 ml-2" />
        ) : (
          <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0 ml-2" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-3 space-y-1.5">
          {items.map((item) => {
            const itemPositive = item.impact > 0;
            const barWidth = maxAbsImpact > 0 ? (Math.abs(item.impact) / maxAbsImpact) * 100 : 0;
            return (
              <div key={item.label} className="flex items-center gap-3 text-sm">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    itemPositive ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span className="flex-1 text-zinc-700 dark:text-zinc-300 truncate">
                  {item.label}
                </span>
                <div className="w-24 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden shrink-0">
                  <div
                    className={`h-full rounded-full ${itemPositive ? "bg-green-500" : "bg-red-500"}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span
                  className={`text-xs font-medium tabular-nums w-24 text-right shrink-0 ${
                    itemPositive ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
                  }`}
                >
                  {formatEuro(item.impact)}
                </span>
              </div>
            );
          })}
          <div className="border-t border-zinc-200 dark:border-zinc-700 pt-1.5 mt-1.5 flex items-center gap-3 text-sm">
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-green-600 shrink-0" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span className="flex-1 font-semibold text-zinc-800 dark:text-zinc-200">
              Net pay change
            </span>
            <span
              className={`text-sm font-semibold tabular-nums w-24 text-right shrink-0 ${
                isPositive ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
              }`}
            >
              {formatEuro(delta)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
