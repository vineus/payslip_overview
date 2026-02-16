"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";

const modes = ["system", "light", "dark"] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="w-8 h-8" />;

  const cycle = () => {
    const idx = modes.indexOf(theme as (typeof modes)[number]);
    setTheme(modes[(idx + 1) % modes.length]);
  };

  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  return (
    <button
      onClick={cycle}
      className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      title={`Theme: ${theme}`}
    >
      <Icon className="w-5 h-5" />
    </button>
  );
}
