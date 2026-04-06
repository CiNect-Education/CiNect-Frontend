"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";
import { useClaimDailyCheckin, useDailyCheckinStatus } from "@/hooks/queries/use-membership";

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function DailyCheckinPopup() {
  const t = useTranslations("account");
  const { isAuthenticated, isLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const [manuallyClosed, setManuallyClosed] = useState(false);
  const statusQuery = useDailyCheckinStatus(isAuthenticated && !isLoading);
  const claimMutation = useClaimDailyCheckin();
  const status = statusQuery.data?.data;
  const canClaim = status?.eligibleToday === true;

  const storageKey = useMemo(() => `daily-checkin-popup-seen:${todayKey()}`, []);

  useEffect(() => {
    if (!isAuthenticated || !status || manuallyClosed) return;
    if (!canClaim) return;
    if (typeof window !== "undefined" && window.localStorage.getItem(storageKey) === "1") return;
    setOpen(true);
  }, [isAuthenticated, status, manuallyClosed, storageKey]);

  const closePopup = () => {
    setOpen(false);
    setManuallyClosed(true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, "1");
    }
  };

  const claim = () => {
    claimMutation.mutate(undefined, {
      onSuccess: (res) => {
        const reward = res.data?.rewardPoints ?? 0;
        toast.success(t("dailyCheckinClaimedToast", { points: reward }));
        closePopup();
      },
      onError: (err) => {
        const message = err instanceof Error ? err.message : t("dailyCheckinClaimFailed");
        toast.error(message);
      },
    });
  };

  if (!isAuthenticated || !canClaim) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md border-primary/30 overflow-hidden border">
        <div className="from-primary/25 via-primary/10 to-transparent absolute inset-x-0 top-0 h-24 bg-gradient-to-b" />
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarCheck2 className="text-primary h-5 w-5" />
            {t("dailyCheckinPopupTitle")}
          </DialogTitle>
          <DialogDescription>{t("dailyCheckinPopupDesc")}</DialogDescription>
        </DialogHeader>

        <div className="from-primary/15 to-primary/5 space-y-2 rounded-lg border bg-gradient-to-br p-3">
          <div className="flex items-center justify-between text-sm">
            <span>{t("dailyCheckinTodayReward")}</span>
            <Badge>
              <Sparkles className="mr-1 h-3 w-3" />+{status.rewardPoints}
            </Badge>
          </div>
          <div className="text-muted-foreground text-xs">
            {t("dailyCheckinCurrentStreak")}: {status.streak}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={closePopup}>
            {t("dailyCheckinMaybeLater")}
          </Button>
          <Button onClick={claim} disabled={claimMutation.isPending}>
            {claimMutation.isPending ? t("dailyCheckinClaiming") : t("dailyCheckinClaimNow")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

