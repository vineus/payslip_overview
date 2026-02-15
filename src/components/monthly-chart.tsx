"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Cell, Tooltip,
} from "recharts";
import { ChartTooltip } from "./chart-tooltip";

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
  if (!payslips.length) return null;

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

  return (
    <div>
      <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-3">Monthly Breakdown</h3>
      <ResponsiveContainer width="100%" height={300}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
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
          <Tooltip content={<ChartTooltip labelFormatter={(ts) => formatTick(ts as number)} valueFormatter={euroFormatter} />} />
          <Legend />
          <Bar dataKey="netPay" name="Net Pay" stackId="a" radius={[0, 0, 0, 0]} onClick={(d: any) => onSelectPeriod(d.period)} cursor="pointer">
            {data.map((entry) => (
              <Cell
                key={entry.period}
                fill={entry.period === selectedPeriod ? "#2563eb" : "#60a5fa"}
              />
            ))}
          </Bar>
          <Bar dataKey="tax" name="Income Tax" stackId="a" fill="#f97316" onClick={(d: any) => onSelectPeriod(d.period)} cursor="pointer" />
          <Bar dataKey="contributions" name="Contributions" stackId="a" fill="#a78bfa" radius={[4, 4, 0, 0]} onClick={(d: any) => onSelectPeriod(d.period)} cursor="pointer" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
