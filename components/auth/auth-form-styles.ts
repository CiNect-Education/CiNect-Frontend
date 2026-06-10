import { cn } from "@/lib/utils";

export const authFieldClass =
  "h-11 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-primary/30";

export function authLabelClass(className?: string) {
  return cn("text-slate-700", className);
}

export const authSubmitClass =
  "h-11 w-full text-sm font-bold uppercase tracking-wide";

/** Eye toggle inside white auth fields — avoid theme `muted` hover on light inputs. */
export const authPasswordToggleClass =
  "absolute right-1 top-1/2 z-10 h-9 w-9 -translate-y-1/2 shrink-0 rounded-md border-0 bg-transparent p-0 text-slate-500 shadow-none hover:!bg-slate-100 hover:!text-slate-800 focus-visible:!bg-slate-100 focus-visible:!text-slate-800 focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-0 active:!bg-slate-200/80 active:!text-slate-900";
