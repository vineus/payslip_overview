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
}

export function ChartTooltip({
  active,
  label,
  payload,
  labelFormatter,
  valueFormatter = (v) => String(v),
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const formattedLabel = labelFormatter && label !== undefined ? labelFormatter(label) : label;

  return (
    <div className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm shadow-lg">
      {formattedLabel && (
        <div className="font-semibold text-zinc-100 mb-1">{formattedLabel}</div>
      )}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-zinc-200">
          <span
            className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span>{entry.name} : {valueFormatter(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}
