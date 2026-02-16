"use client";

interface LegendEntry {
  value: string;
  color: string;
  dataKey?: string;
}

export function InteractiveLegend({
  payload,
  hidden,
  onToggle,
}: {
  payload?: LegendEntry[];
  hidden: Set<string>;
  onToggle: (key: string) => void;
}) {
  if (!payload?.length) return null;
  return (
    <div className="flex justify-center gap-4 text-sm">
      {payload.map((entry) => {
        const key = (entry.dataKey || entry.value) as string;
        const isHidden = hidden.has(key);
        return (
          <button
            key={key}
            onClick={(e) => { e.stopPropagation(); onToggle(key); }}
            className={`flex items-center gap-1.5 cursor-pointer transition-opacity ${isHidden ? "opacity-30" : "hover:opacity-80"}`}
          >
            <span
              className="inline-block w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className={isHidden ? "line-through" : ""}>{entry.value}</span>
          </button>
        );
      })}
    </div>
  );
}
