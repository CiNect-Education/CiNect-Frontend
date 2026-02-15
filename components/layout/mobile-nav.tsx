"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, Film } from "lucide-react";
import { LanguageToggle } from "@/components/shared/language-toggle";
import { ThemeToggle } from "@/components/shared/theme-toggle";

const NAV_ITEMS = [
  { key: "movies", href: "/movies" },
  { key: "showtimes", href: "/showtimes" },
  { key: "cinemas", href: "/cinemas" },
  { key: "promotions", href: "/promotions" },
  { key: "campaigns", href: "/campaigns" },
  { key: "membership", href: "/membership" },
  { key: "gift", href: "/gift" },
  { key: "news", href: "/news" },
  { key: "support", href: "/support" },
] as const;

export function MobileNav() {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b p-4">
          <SheetTitle className="flex items-center gap-2 text-left">
            <Film className="h-5 w-5 text-primary" />
            CinemaConnect
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col p-4">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {t(item.key)}
            </Link>
          ))}
          <div className="mt-4 flex items-center gap-2 border-t pt-4">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
