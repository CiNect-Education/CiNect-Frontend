import { cn } from "@/lib/utils";

export const authFieldClass =
  "h-11 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-primary/30";

export function authLabelClass(className?: string) {
  return cn("text-slate-700", className);
}

export const authSubmitClass =
  "h-11 w-full text-sm font-bold uppercase tracking-wide";
