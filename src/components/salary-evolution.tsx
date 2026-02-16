"use client";

import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Tooltip, Legend,
} from "recharts";
import { ChartTooltip } from "./chart-tooltip";
import { InteractiveLegend } from "./interactive-legend";

interface PayslipRow {
  period: string;
  base_salary: number | null;
  gross_salary: number | null;
  net_pay: number | null;
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

export function SalaryEvolution({ payslips, selectedPeriod, onSelectPeriod }: { payslips: PayslipRow[]; selectedPeriod: string | null; onSelectPeriod: (period: string) => void }) {
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
    baseSalary: p.base_salary,
    grossSalary: p.gross_salary,
    netPay: p.net_pay,
  }));

  const ticks = data.map((d) => d.ts);

  // Find salary raise events
  const raises: { ts: number; label: string }[] = [];
  for (let i = 1; i < payslips.length; i++) {
    const prev = payslips[i - 1].base_salary;
    const curr = payslips[i].base_salary;
    if (prev && curr && curr !== prev) {
      const pctChange = ((curr - prev) / prev * 100).toFixed(1);
      raises.push({
        ts: periodToTimestamp(payslips[i].period),
        label: `+${pctChange}% raise`,
      });
    }
  }

  const handleClick = (state: any) => {
    if (state?.activeLabel != null) {
      const match = data.find((d) => d.ts === state.activeLabel);
      if (match) onSelectPeriod(match.period);
    }
  };

  const h = (key: string) => hidden.has(key);

  return (
    <div>
      <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-3">Salary Evolution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} onClick={handleClick} style={{ cursor: "pointer" }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
          <XAxis dataKey="ts" type="number" scale="time" domain={["dataMin", "dataMax"]} ticks={ticks} tickFormatter={formatTick} tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
          <Tooltip content={<ChartTooltip labelFormatter={(ts) => formatTick(ts as number)} valueFormatter={euroFormatter} />} />
          <Legend content={<InteractiveLegend hidden={hidden} onToggle={toggleSeries} />} />
          {selectedPeriod && (
            <ReferenceLine x={periodToTimestamp(selectedPeriod)} stroke="#facc15" strokeWidth={2} strokeOpacity={0.7} />
          )}
          {raises.map((r) => (
            <ReferenceLine key={r.ts} x={r.ts} stroke="#22c55e" strokeDasharray="4 4" label={{ value: r.label, position: "top", fill: "#22c55e", fontSize: 10 }} />
          ))}
          <Line type="monotone" dataKey="baseSalary" name="Base Salary" stroke="#94a3b8" strokeWidth={2} dot={h("baseSalary") ? false : { r: 3 }} activeDot={h("baseSalary") ? false : { r: 5 }} strokeOpacity={h("baseSalary") ? 0 : 1} />
          <Line type="monotone" dataKey="grossSalary" name="Gross" stroke="#60a5fa" strokeWidth={2} dot={h("grossSalary") ? false : { r: 3 }} activeDot={h("grossSalary") ? false : { r: 5 }} strokeOpacity={h("grossSalary") ? 0 : 1} />
          <Line type="monotone" dataKey="netPay" name="Net Pay" stroke="#2563eb" strokeWidth={2} dot={h("netPay") ? false : { r: 3 }} activeDot={h("netPay") ? false : { r: 5 }} strokeOpacity={h("netPay") ? 0 : 1} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
