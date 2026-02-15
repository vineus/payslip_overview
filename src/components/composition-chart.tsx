"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { ChartTooltip } from "./chart-tooltip";

interface PayslipRow {
  gross_salary: number | null;
  net_pay: number | null;
  income_tax: number | null;
  employee_contributions: number | null;
  meal_vouchers: number | null;
}

const COLORS = ["#2563eb", "#f97316", "#a78bfa", "#fbbf24"];

const euroFormatter = (v: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);

export function CompositionChart({ payslip }: { payslip: PayslipRow | null }) {
  if (!payslip || !payslip.gross_salary) return null;

  const data = [
    { name: "Net Pay", value: payslip.net_pay || 0 },
    { name: "Income Tax", value: payslip.income_tax || 0 },
    { name: "Contributions", value: payslip.employee_contributions || 0 },
    { name: "Meal Vouchers", value: payslip.meal_vouchers || 0 },
  ].filter((d) => d.value > 0);

  return (
    <div>
      <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-3">
        Salary Composition
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={90}
            dataKey="value"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            label={(props: any) => `${props.name} ${((props.percent ?? 0) * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip valueFormatter={euroFormatter} />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
