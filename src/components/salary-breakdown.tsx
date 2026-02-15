"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList,
} from "recharts";
import { ChartTooltip } from "./chart-tooltip";

interface PayslipRow {
  period: string;
  gross_salary: number | null;
  employee_contributions: number | null;
  meal_vouchers: number | null;
  income_tax: number | null;
  net_pay: number | null;
  bonus: number | null;
  base_salary: number | null;
}

const euroFormatter = (v: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);

export function SalaryBreakdown({ payslip }: { payslip: PayslipRow | null }) {
  if (!payslip) return null;

  const items = [
    { name: "Base Salary", value: payslip.base_salary || 0, color: "#60a5fa" },
    ...(payslip.bonus ? [{ name: "Bonus", value: payslip.bonus, color: "#34d399" }] : []),
    { name: "Contributions", value: -(payslip.employee_contributions || 0), color: "#a78bfa" },
    { name: "Meal Vouchers", value: -(payslip.meal_vouchers || 0), color: "#fbbf24" },
    { name: "Income Tax", value: -(payslip.income_tax || 0), color: "#f97316" },
    { name: "Net Pay", value: payslip.net_pay || 0, color: "#2563eb" },
  ];

  return (
    <div>
      <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-3">
        Salary Breakdown — {payslip.period}
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={items} layout="vertical" margin={{ left: 10, right: 60 }}>
          <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
          <Tooltip content={<ChartTooltip valueFormatter={(v) => euroFormatter(Math.abs(v))} />} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {items.map((item, i) => (
              <Cell key={i} fill={item.color} />
            ))}
            <LabelList
              dataKey="value"
              position="right"
              formatter={(v) => euroFormatter(v as number)}
              style={{ fontSize: 10, fill: "#71717a" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
