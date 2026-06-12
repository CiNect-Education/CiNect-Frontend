"use client";

import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CinectContactSection } from "@/components/support/cinect-contact-section";

const FAQ_KEYS = [
  { q: "faqBookingQ" as const, a: "faqBookingA" as const },
  { q: "faqCancelQ" as const, a: "faqCancelA" as const },
  { q: "faqPointsQ" as const, a: "faqPointsA" as const },
  { q: "faqPasswordQ" as const, a: "faqPasswordA" as const },
  { q: "faqPromoQ" as const, a: "faqPromoA" as const },
];

export default function SupportPage() {
  const t = useTranslations("support");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <PageHeader title={t("title")} />

      <div className="space-y-10">
        <div className="max-w-4xl">
          <h2 className="mb-4 text-xl font-semibold">{t("faq")}</h2>
          <Accordion type="single" collapsible className="w-full">
            {FAQ_KEYS.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-sm">{t(item.q)}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm">{t(item.a)}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <CinectContactSection />
      </div>
    </div>
  );
}
