"use client";

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Cell, Tooltip,
} from "recharts";
import { ChartTooltip } from "./chart-tooltip";
import { StackToggle } from "./cumulative-toggle";
import { InteractiveLegend } from "./interactive-legend";

interface PayslipRow {
  period: string;
  net_pay: number | null;
  income_tax: number | null;
  employee_contributions: number | null;
}

function periodToTimestamp(p: string): number {
  const [year, month] = p.split("-").map(Number);
  return new Date(year, month - 1, 1).getTime();
}

function formatTick(ts: number): string {
  const d = new Date(ts);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
}

const euroFormatter = (v: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);

export function MonthlyChart({
  payslips,
  selectedPeriod,
  onSelectPeriod,
}: {
  payslips: PayslipRow[];
  selectedPeriod: string | null;
  onSelectPeriod: (period: string) => void;
}) {
  const [stacked, setStacked] = useState(true);
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  if (!payslips.length) return null;

  const toggleSeries = (key: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const data = payslips.map((p) => ({
    period: p.period,
    ts: periodToTimestamp(p.period),
    netPay: p.net_pay || 0,
    tax: p.income_tax || 0,
    contributions: p.employee_contributions || 0,
  }));

  const ticks = data.map((d) => d.ts);
  const halfMonth = 15 * 24 * 60 * 60 * 1000;
  const domainMin = data[0].ts - halfMonth;
  const domainMax = data[data.length - 1].ts + halfMonth;

  const h = (key: string) => hidden.has(key);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wide">Monthly Breakdown</h3>
        <StackToggle enabled={stacked} onChange={setStacked} />
      </div>
      <ResponsiveContainer width="100%" height={300}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
          <XAxis
            dataKey="ts"
            type="number"
            scale="time"
            domain={[domainMin, domainMax]}
            ticks={ticks}
            tickFormatter={formatTick}
            tick={{ fontSize: 11 }}
          />
          <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
          <Tooltip content={<ChartTooltip labelFormatter={(ts) => formatTick(ts as number)} valueFormatter={euroFormatter} showTotal={stacked} />} />
          <Legend content={<InteractiveLegend hidden={hidden} onToggle={toggleSeries} />} />
          <Bar dataKey="netPay" name="Net Pay" stackId={stacked ? "a" : undefined} fill="#60a5fa" radius={[0, 0, 0, 0]} onClick={(d: any) => onSelectPeriod(d.period)} cursor="pointer" hide={h("netPay")}>
            {data.map((entry) => (
              <Cell
                key={entry.period}
                fill={entry.period === selectedPeriod ? "#2563eb" : "#60a5fa"}
              />
            ))}
          </Bar>
          <Bar dataKey="tax" name="Income Tax" stackId={stacked ? "a" : undefined} fill="#f97316" onClick={(d: any) => onSelectPeriod(d.period)} cursor="pointer" hide={h("tax")} />
          <Bar dataKey="contributions" name="Contributions" stackId={stacked ? "a" : undefined} fill="#a78bfa" radius={[4, 4, 0, 0]} onClick={(d: any) => onSelectPeriod(d.period)} cursor="pointer" hide={h("contributions")} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
