"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { User, ShoppingBag, Crown, Bell, Gift, Ticket } from "lucide-react";

export function AccountNav() {
  const t = useTranslations("account");
  const pathname = usePathname();

  const items = [
    { label: t("profile"), href: "/account/profile", icon: User },
    { label: t("orders"), href: "/account/orders", icon: ShoppingBag },
    { label: t("tickets") ?? "Tickets", href: "/account/tickets", icon: Ticket },
    { label: t("membership"), href: "/account/membership", icon: Crown },
    { label: t("notifications"), href: "/account/notifications", icon: Bell },
    { label: t("gifts"), href: "/account/gifts", icon: Gift },
  ];

  return (
    <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
