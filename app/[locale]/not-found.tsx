import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  const t = useTranslations("common");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <div className="bg-muted mb-4 rounded-full p-4">
        <FileQuestion className="text-muted-foreground h-8 w-8" />
      </div>
      <h2 className="mb-2 text-xl font-bold">{t("pageNotFound")}</h2>
      <p className="text-muted-foreground mb-6 max-w-md text-sm">{t("pageNotFoundDesc")}</p>
      <Button asChild>
        <Link href="/">{t("goHome")}</Link>
      </Button>
    </div>
  );
}
