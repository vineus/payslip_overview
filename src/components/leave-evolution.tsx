"use client";

import { useState } from "react";
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, ReferenceLine, Tooltip,
} from "recharts";
import { ChartTooltip } from "./chart-tooltip";
import { StackToggle } from "./cumulative-toggle";
import { InteractiveLegend } from "./interactive-legend";

interface PayslipRow {
  period: string;
  cp_n1_balance: number | null;
  cp_n_balance: number | null;
  rtt_balance: number | null;
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

export function LeaveEvolution({ payslips, selectedPeriod, onSelectPeriod }: { payslips: PayslipRow[]; selectedPeriod: string | null; onSelectPeriod: (period: string) => void }) {
  const [stacked, setStacked] = useState(false);
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
    "CP N-1": p.cp_n1_balance ?? 0,
    "CP N": p.cp_n_balance ?? 0,
    RTT: p.rtt_balance ?? 0,
  }));

  const ticks = data.map((d) => d.ts);

  // Detect CP resets (June: CP N transfers to CP N-1)
  const cpResets: number[] = [];
  for (let i = 1; i < payslips.length; i++) {
    const month = parseInt(payslips[i].period.split("-")[1]);
    if (month === 6) {
      cpResets.push(periodToTimestamp(payslips[i].period));
    }
  }

  // Detect RTT resets (January)
  const rttResets: number[] = [];
  for (let i = 1; i < payslips.length; i++) {
    const month = parseInt(payslips[i].period.split("-")[1]);
    if (month === 1) {
      rttResets.push(periodToTimestamp(payslips[i].period));
    }
  }

  const handleChartClick = (state: any) => {
    if (state?.activeLabel != null) {
      const match = data.find((d) => d.ts === state.activeLabel);
      if (match) onSelectPeriod(match.period);
    }
  };

  const h = (key: string) => hidden.has(key);

  const sharedChildren = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
      <XAxis dataKey="ts" type="number" scale="time" domain={["dataMin", "dataMax"]} ticks={ticks} tickFormatter={formatTick} tick={{ fontSize: 11 }} />
      <YAxis tick={{ fontSize: 11 }} />
      <Tooltip content={<ChartTooltip labelFormatter={(ts) => formatTick(ts as number)} valueFormatter={(v) => `${v.toFixed(2)} days`} showTotal={stacked} />} />
      <Legend content={<InteractiveLegend hidden={hidden} onToggle={toggleSeries} />} />
      {selectedPeriod && (
        <ReferenceLine x={periodToTimestamp(selectedPeriod)} stroke="#facc15" strokeWidth={2} strokeOpacity={0.7} />
      )}
      {cpResets.map((ts) => (
        <ReferenceLine key={`cp-${ts}`} x={ts} stroke="#f97316" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: "CP Reset", position: "insideTopLeft", fill: "#f97316", fontSize: 10 }} />
      ))}
      {rttResets.map((ts) => (
        <ReferenceLine key={`rtt-${ts}`} x={ts} stroke="#22c55e" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: "RTT Reset", position: "insideTopRight", fill: "#22c55e", fontSize: 10 }} />
      ))}
    </>
  );

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wide">Leave Balance Evolution</h3>
        <StackToggle enabled={stacked} onChange={setStacked} />
      </div>
      <ResponsiveContainer width="100%" height={280}>
        {stacked ? (
          <AreaChart data={data} onClick={handleChartClick} style={{ cursor: "pointer" }}>
            {sharedChildren}
            <Area type="monotone" dataKey="CP N-1" stackId="1" stroke="#f97316" fill="#f97316" fillOpacity={h("CP N-1") ? 0 : 0.4} strokeOpacity={h("CP N-1") ? 0 : 1} />
            <Area type="monotone" dataKey="CP N" stackId="1" stroke="#2563eb" fill="#2563eb" fillOpacity={h("CP N") ? 0 : 0.4} strokeOpacity={h("CP N") ? 0 : 1} />
            <Area type="monotone" dataKey="RTT" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={h("RTT") ? 0 : 0.4} strokeOpacity={h("RTT") ? 0 : 1} />
          </AreaChart>
        ) : (
          <LineChart data={data} onClick={handleChartClick} style={{ cursor: "pointer" }}>
            {sharedChildren}
            <Line type="monotone" dataKey="CP N-1" stroke="#f97316" strokeWidth={2} dot={h("CP N-1") ? false : { r: 3 }} activeDot={h("CP N-1") ? false : { r: 5 }} strokeOpacity={h("CP N-1") ? 0 : 1} />
            <Line type="monotone" dataKey="CP N" stroke="#2563eb" strokeWidth={2} dot={h("CP N") ? false : { r: 3 }} activeDot={h("CP N") ? false : { r: 5 }} strokeOpacity={h("CP N") ? 0 : 1} />
            <Line type="monotone" dataKey="RTT" stroke="#22c55e" strokeWidth={2} dot={h("RTT") ? false : { r: 3 }} activeDot={h("RTT") ? false : { r: 5 }} strokeOpacity={h("RTT") ? 0 : 1} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
