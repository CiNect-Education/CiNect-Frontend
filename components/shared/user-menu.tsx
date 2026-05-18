"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/providers/auth-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, ShoppingBag, Crown, Bell, LogOut, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

type UserMenuProps = {
  variant?: "default" | "header";
};

export function UserMenu({ variant = "default" }: UserMenuProps) {
  const t = useTranslations("nav");
  const tAccount = useTranslations("account");
  const { isAuthenticated, user, logout } = useAuth();

  if (!isAuthenticated) {
    if (variant === "header") {
      return (
        <Link
          href="/login"
          className={cn(
            "cinect-header-auth flex items-center gap-2 text-sm font-semibold whitespace-nowrap transition-colors"
          )}
        >
          <User className="h-5 w-5 shrink-0" strokeWidth={1.75} />
          <span className="hidden md:inline">{t("login")}</span>
        </Link>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="font-semibold">
          <Link href="/login">{t("login")}</Link>
        </Button>
        <Button variant="cta" size="sm" asChild>
          <Link href="/register">{t("register")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-9 w-9 rounded-full",
            variant === "header" && "text-white hover:bg-white/10 hover:text-[#f3ea28]"
          )}
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/20 text-primary text-xs">
              {user?.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href="/account/profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {t("profile")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/orders" className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            {tAccount("tickets")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/membership" className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            {t("membership")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            {t("notifications")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {(user?.role === "ADMIN" || user?.role === "STAFF") && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/admin" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                {t("admin")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem
          onClick={() => logout()}
          className="text-destructive flex cursor-pointer items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          {t("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
