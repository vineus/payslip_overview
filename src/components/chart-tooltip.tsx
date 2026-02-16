"use client";

interface TooltipPayload {
  name: string;
  value: number;
  color?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: TooltipPayload[];
  labelFormatter?: (label: string | number) => string;
  valueFormatter?: (value: number) => string;
  showTotal?: boolean;
}

export function ChartTooltip({
  active,
  label,
  payload,
  labelFormatter,
  valueFormatter = (v) => String(v),
  showTotal,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const formattedLabel = labelFormatter && label !== undefined ? labelFormatter(label) : label;

  return (
    <div className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm shadow-lg">
      {formattedLabel && (
        <div className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">{formattedLabel}</div>
      )}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200">
          <span
            className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span>{entry.name} : {valueFormatter(entry.value)}</span>
        </div>
      ))}
      {showTotal && payload.length > 1 && (
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold border-t border-zinc-200 dark:border-zinc-700 mt-1 pt-1">
          <span className="inline-block w-2.5 h-2.5 flex-shrink-0" />
          <span>Total : {valueFormatter(payload.reduce((sum, e) => sum + e.value, 0))}</span>
        </div>
      )}
    </div>
  );
}
