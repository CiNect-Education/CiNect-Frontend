"use client";

import { memo, type ReactNode } from "react";
import { Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const hintButtonClass =
  "text-muted-foreground hover:text-foreground inline-flex shrink-0 rounded-full p-0.5 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

type ChecklistItem = {
  key: string;
  label: string;
  complete: boolean;
};

type CompletionHintProps = {
  description: string;
  items: ChecklistItem[];
  doneLabel: string;
  pendingLabel: string;
  srLabel?: string;
};

export const ProfileCompletionHint = memo(function ProfileCompletionHint({
  description,
  items,
  doneLabel,
  pendingLabel,
  srLabel = "More information",
}: CompletionHintProps) {
  return (
    <HoverCard openDelay={120} closeDelay={200}>
      <HoverCardTrigger asChild>
        <button type="button" className={hintButtonClass} aria-label={srLabel}>
          <Info className="h-3.5 w-3.5" />
        </button>
      </HoverCardTrigger>
      <HoverCardContent align="start" side="top" sideOffset={6} className="w-72 p-3">
        <p className="text-xs leading-relaxed">{description}</p>
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li key={item.key} className="flex items-center justify-between gap-3 text-xs">
              <span>{item.label}</span>
              <Badge variant={item.complete ? "default" : "secondary"} className="text-[10px]">
                {item.complete ? doneLabel : pendingLabel}
              </Badge>
            </li>
          ))}
        </ul>
      </HoverCardContent>
    </HoverCard>
  );
});

type FieldHintProps = {
  hint: string;
  srLabel?: string;
  content?: ReactNode;
};

export function FieldHintTooltip({ hint, srLabel = "More information", content }: FieldHintProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className={hintButtonClass} aria-label={srLabel}>
            <Info className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[280px] text-xs leading-relaxed">
          {content ?? hint}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
