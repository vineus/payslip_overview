"use client";

import { useState, useEffect, useCallback } from "react";
import { FileUpload } from "@/components/file-upload";
import { OverviewCards } from "@/components/overview-cards";
import { MonthlyChart } from "@/components/monthly-chart";
import { SalaryBreakdown } from "@/components/salary-breakdown";
import { CompositionChart } from "@/components/composition-chart";
import { SalaryEvolution } from "@/components/salary-evolution";
import { LeaveEvolution } from "@/components/leave-evolution";
import { LeaveBalances } from "@/components/leave-balances";
import { YtdSummary } from "@/components/ytd-summary";
import { PayslipTable } from "@/components/payslip-table";
import { ThemeToggle } from "@/components/theme-toggle";

type PayslipRow = Record<string, unknown>;

export default function Home() {
  const [payslips, setPayslips] = useState<PayslipRow[]>([]);
  const [latest, setLatest] = useState<PayslipRow | null>(null);
  const [previous, setPrevious] = useState<PayslipRow | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [allPayslips, setAllPayslips] = useState<PayslipRow[]>([]);
  const fetchData = useCallback(async () => {
    const [statsRes, listRes] = await Promise.all([
      fetch("/api/stats"),
      fetch("/api/payslips"),
    ]);
    const stats = await statsRes.json();
    const list = await listRes.json();
    setPayslips(stats.payslips || []);
    setLatest(stats.latest);
    setPrevious(stats.previous);
    setAllPayslips(list || []);
    if (stats.latest && !selectedPeriod) {
      setSelectedPeriod(stats.latest.period as string);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedIdx = payslips.findIndex((p) => p.period === selectedPeriod);
  const selectedPayslip = selectedIdx >= 0 ? payslips[selectedIdx] : undefined;
  const previousPayslip = selectedIdx > 0 ? payslips[selectedIdx - 1] : null;

  const handleDelete = async (id: number) => {
    await fetch(`/api/payslips/${id}`, { method: "DELETE" });
    fetchData();
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <header className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Payslip Overview</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Upload payslip PDFs to see your salary analytics
            </p>
          </div>
          <ThemeToggle />
        </header>

        <FileUpload onUploadComplete={fetchData} />

        {payslips.length > 0 && (
          <>
            <OverviewCards latest={selectedPayslip || latest} previous={previousPayslip || previous} />

            {selectedPeriod && (() => {
              const periods = payslips.map((p) => p.period as string);
              const currentIdx = periods.indexOf(selectedPeriod);
              const formatPeriodLong = (p: string) => {
                const [year, month] = p.split("-");
                const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                return `${months[parseInt(month) - 1]} ${year}`;
              };
              return (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-zinc-500 uppercase tracking-wide">Selected month</span>
                  <button
                    onClick={() => currentIdx > 0 && setSelectedPeriod(periods[currentIdx - 1])}
                    disabled={currentIdx <= 0}
                    className="px-2 py-1 rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    &larr;
                  </button>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-3 py-1.5 text-sm font-semibold appearance-none cursor-pointer hover:border-zinc-500 focus:outline-none focus:border-blue-500"
                  >
                    {periods.map((p) => (
                      <option key={p} value={p}>{formatPeriodLong(p)}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => currentIdx < periods.length - 1 && setSelectedPeriod(periods[currentIdx + 1])}
                    disabled={currentIdx >= periods.length - 1}
                    className="px-2 py-1 rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    &rarr;
                  </button>
                  {selectedPeriod !== (latest as PayslipRow & { period: string })?.period && (
                    <button
                      onClick={() => setSelectedPeriod(latest?.period as string)}
                      className="text-xs text-blue-500 hover:text-blue-400 underline ml-2"
                    >
                      Reset to latest
                    </button>
                  )}
                </div>
              );
            })()}

            <MonthlyChart
              payslips={payslips as never[]}
              selectedPeriod={selectedPeriod}
              onSelectPeriod={setSelectedPeriod}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <SalaryBreakdown payslip={selectedPayslip as never} />
              <CompositionChart payslip={selectedPayslip as never} />
            </div>

            <SalaryEvolution payslips={payslips as never[]} selectedPeriod={selectedPeriod} onSelectPeriod={setSelectedPeriod} />

            <LeaveEvolution payslips={payslips as never[]} selectedPeriod={selectedPeriod} onSelectPeriod={setSelectedPeriod} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <LeaveBalances payslip={(selectedPayslip || latest) as never} period={selectedPeriod} />
              <YtdSummary payslip={(selectedPayslip || latest) as never} period={selectedPeriod} />
            </div>

            <PayslipTable
              payslips={allPayslips as never[]}
              onDelete={handleDelete}
              selectedPeriod={selectedPeriod}
              onSelectPeriod={setSelectedPeriod}
            />
          </>
        )}
      </div>
    </div>
  );
}
