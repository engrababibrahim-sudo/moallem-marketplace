import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  if (!toggleTheme) return null;
  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={dark ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"}
      title={dark ? "الوضع الفاتح" : "الوضع الداكن"}
      className="inline-flex items-center gap-2 rounded-full border border-[#182431]/15 bg-white px-3 py-2 text-xs font-bold shadow-sm hover:bg-[#fff0e2] dark:border-white/15 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span>{dark ? "فاتح" : "داكن"}</span>
    </button>
  );
}
