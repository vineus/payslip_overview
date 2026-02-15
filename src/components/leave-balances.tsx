"use client";

interface PayslipRow {
  cp_n2_balance: number | null;
  cp_n1_balance: number | null;
  cp_n_balance: number | null;
  rtt_balance: number | null;
}

function BalanceCard({ label, value, color }: { label: string; value: number | null; color: string }) {
  return (
    <div className={`rounded-lg border p-3 ${color}`}>
      <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">{label}</div>
      <div className="text-lg font-semibold mt-0.5">
        {value !== null ? `${value.toFixed(2)} days` : "—"}
      </div>
    </div>
  );
}

export function LeaveBalances({ payslip, period }: { payslip: PayslipRow | null; period: string | null }) {
  if (!payslip) return null;

  const formatPeriod = (p: string) => {
    const [year, month] = p.split("-");
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  return (
    <div>
      <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-3">
        Leave Balances {period && <span className="text-zinc-400">— {formatPeriod(period)}</span>}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <BalanceCard
          label="CP N-2"
          value={payslip.cp_n2_balance}
          color="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
        />
        <BalanceCard
          label="CP N-1"
          value={payslip.cp_n1_balance}
          color="bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800"
        />
        <BalanceCard
          label="CP N"
          value={payslip.cp_n_balance}
          color="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
        />
        <BalanceCard
          label="RTT"
          value={payslip.rtt_balance}
          color="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
        />
      </div>
    </div>
  );
}
