"use client";

import { usePathname } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Home, Clock, Ticket, Crown, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { key: "home", href: "/", icon: Home },
  { key: "showtimes", href: "/showtimes", icon: Clock },
  { key: "tickets", href: "/account/orders", icon: Ticket },
  { key: "membership", href: "/membership", icon: Crown },
  { key: "account", href: "/account/profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  // Remove locale prefix for matching
  const path = pathname.replace(/^\/(vi|en)/, "") || "/";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-md md:hidden">
      <div className="flex items-center justify-around py-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = path === item.href || (item.href !== "/" && path.startsWith(item.href));
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.key.charAt(0).toUpperCase() + item.key.slice(1)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
