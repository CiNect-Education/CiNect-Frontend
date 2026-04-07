import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Film } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("auth");

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mb-8 flex flex-col items-center gap-3">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <Film className="text-primary h-7 w-7" />
          <span>CiNect</span>
        </Link>
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          <Link href="/">{t("backToHome")}</Link>
        </Button>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
