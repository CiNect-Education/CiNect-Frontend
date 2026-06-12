"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreateContentReport } from "@/hooks/queries/use-community";
import { Flag } from "lucide-react";
import { toast } from "sonner";

type ContentReportDialogProps = {
  targetType: "REVIEW" | "POST";
  targetId: string;
};

const REASONS = ["SPAM", "SPOILER", "HARASSMENT", "OTHER"] as const;

export function ContentReportDialog({ targetType, targetId }: ContentReportDialogProps) {
  const t = useTranslations("community");
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<(typeof REASONS)[number]>("SPAM");
  const [details, setDetails] = useState("");
  const report = useCreateContentReport();

  async function submit() {
    try {
      await report.mutateAsync({ targetType, targetId, reason, details: details.trim() || undefined });
      toast.success(t("reportSubmitted"));
      setOpen(false);
      setDetails("");
    } catch {
      toast.error(t("reportError"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="text-muted-foreground h-7 gap-1 px-1 text-xs">
          <Flag className="h-3 w-3" />
          {t("report")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("reportTitle")}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-wrap gap-2">
          {REASONS.map((r) => (
            <Button
              key={r}
              type="button"
              size="sm"
              variant={reason === r ? "default" : "outline"}
              onClick={() => setReason(r)}
            >
              {t(`reportReason_${r}`)}
            </Button>
          ))}
        </div>
        <Textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder={t("reportDetailsPlaceholder")}
          rows={3}
        />
        <Button onClick={submit} disabled={report.isPending} className="w-full">
          {t("reportSubmit")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
