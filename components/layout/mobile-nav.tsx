"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Film,
  Clock,
  Building2,
  Tag,
  Newspaper,
  Megaphone,
  Crown,
  Gift,
  HeadphonesIcon,
  Ticket,
  LayoutGrid,
  LogIn,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";

const MAIN_NAV = [
  { key: "movies", href: "/movies", icon: Film },
  { key: "showtimes", href: "/showtimes", icon: Clock },
  { key: "cinemas", href: "/cinemas", icon: Building2 },
  { key: "promotions", href: "/promotions", icon: Tag },
  { key: "news", href: "/news", icon: Newspaper },
] as const;

const SECONDARY_NAV = [
  { key: "campaigns", href: "/campaigns", icon: Megaphone },
  { key: "membership", href: "/membership", icon: Crown },
  { key: "gift", href: "/gift", icon: Gift },
  { key: "support", href: "/support", icon: HeadphonesIcon },
] as const;

export function MobileNav() {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const pathname = usePathname();
  const path = pathname.replace(/^\/(vi|en)/, "") || "/";

  const initials =
    user?.fullName
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase() || "U";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <LayoutGrid className="h-5 w-5" />
          <span className="sr-only">Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-80 flex-col p-0">
        {/* ─── Header ─── */}
        <SheetHeader className="bg-muted/30 border-b px-5 py-4">
          <SheetTitle className="flex items-center gap-2.5 text-left">
            <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
              <Film className="text-primary-foreground h-4 w-4" />
            </div>
            <span className="text-lg font-bold tracking-tight">CiNect</span>
          </SheetTitle>
        </SheetHeader>

        {/* ─── User Section ─── */}
        <div className="border-b px-5 py-4">
          {isAuthenticated && user ? (
            <Link
              href="/account/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3"
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/15 text-primary text-sm font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{user.fullName}</p>
                <p className="text-muted-foreground truncate text-xs">{t("profile")}</p>
              </div>
            </Link>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 gap-2" asChild>
                <Link href="/login" onClick={() => setOpen(false)}>
                  <LogIn className="h-4 w-4" />
                  {t("login")}
                </Link>
              </Button>
              <Button size="sm" className="flex-1 gap-2" asChild>
                <Link href="/register" onClick={() => setOpen(false)}>
                  <UserPlus className="h-4 w-4" />
                  {t("register")}
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* ─── Quick Book CTA ─── */}
        <div className="px-5 pt-4">
          <Button className="w-full gap-2" asChild>
            <Link href="/showtimes" onClick={() => setOpen(false)}>
              <Ticket className="h-4 w-4" />
              {t("bookNow")}
            </Link>
          </Button>
        </div>

        {/* ─── Navigation ─── */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {/* Main navigation */}
          <div className="text-muted-foreground/60 mb-2 px-2 text-[10px] font-bold tracking-widest uppercase">
            {t("mainMenu")}
          </div>
          <ul className="space-y-0.5">
            {MAIN_NAV.map((item) => {
              const Icon = item.icon;
              const isActive =
                path === item.href || (item.href !== "/" && path.startsWith(item.href));
              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
                    {t(item.key)}
                  </Link>
                </li>
              );
            })}
          </ul>

          <Separator className="my-4" />

          {/* Secondary navigation */}
          <div className="text-muted-foreground/60 mb-2 px-2 text-[10px] font-bold tracking-widest uppercase">
            {t("more")}
          </div>
          <ul className="space-y-0.5">
            {SECONDARY_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = path.startsWith(item.href);
              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
                    {t(item.key)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ─── Footer ─── */}
        <div className="bg-muted/30 border-t px-5 py-3">
          <p className="text-muted-foreground/50 text-center text-[10px]">
            CiNect &copy; {new Date().getFullYear()}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
