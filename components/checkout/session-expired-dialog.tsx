"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface SessionExpiredDialogProps {
  open: boolean;
  onReturn: () => void;
}

export function SessionExpiredDialog({ open, onReturn }: SessionExpiredDialogProps) {
  const t = useTranslations("checkout");

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="[&>button]:hidden">
        <DialogHeader>
          <DialogTitle>{t("sessionExpiredTitle")}</DialogTitle>
          <DialogDescription>{t("sessionExpiredDescription")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onReturn}>{t("returnToSeatSelection")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
