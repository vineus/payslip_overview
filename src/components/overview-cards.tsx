"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface CardData {
  label: string;
  value: number | null;
  previousValue: number | null;
  color: string;
}

function formatEuro(n: number | null): string {
  if (n === null) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

function DeltaIndicator({ current, previous }: { current: number | null; previous: number | null }) {
  if (current === null || previous === null) return null;
  const delta = current - previous;
  if (Math.abs(delta) < 0.01) return <Minus className="w-3 h-3 text-zinc-400" />;
  const isUp = delta > 0;
  return (
    <span className={`flex items-center gap-0.5 text-xs ${isUp ? "text-green-600" : "text-red-600"}`}>
      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {isUp ? "+" : ""}{formatEuro(delta)}
    </span>
  );
}

export function OverviewCards({
  latest,
  previous,
}: {
  latest: Record<string, unknown> | null;
  previous: Record<string, unknown> | null;
}) {
  if (!latest) {
    return (
      <div className="text-center text-zinc-400 py-8">Upload payslips to see overview</div>
    );
  }

  const cards: CardData[] = [
    {
      label: "Gross Pay",
      value: latest.gross_salary as number | null,
      previousValue: previous?.gross_salary as number | null ?? null,
      color: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800",
    },
    {
      label: "Net Before Tax",
      value: latest.net_before_tax as number | null,
      previousValue: previous?.net_before_tax as number | null ?? null,
      color: "bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800",
    },
    {
      label: "Income Tax",
      value: latest.income_tax as number | null,
      previousValue: previous?.income_tax as number | null ?? null,
      color: "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800",
    },
    {
      label: "Net Pay",
      value: latest.net_pay as number | null,
      previousValue: previous?.net_pay as number | null ?? null,
      color: "bg-violet-50 dark:bg-violet-950 border-violet-200 dark:border-violet-800",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className={`rounded-lg border p-4 ${card.color}`}>
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
            {card.label}
          </div>
          <div className="text-xl font-semibold mt-1">{formatEuro(card.value)}</div>
          <DeltaIndicator current={card.value} previous={card.previousValue} />
        </div>
      ))}
    </div>
  );
}
