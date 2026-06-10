"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CinectContactSection } from "@/components/support/cinect-contact-section";
import { useSupportChatbot } from "@/hooks/queries/use-support";

const FAQ_KEYS = [
  { q: "faqBookingQ" as const, a: "faqBookingA" as const },
  { q: "faqCancelQ" as const, a: "faqCancelA" as const },
  { q: "faqPointsQ" as const, a: "faqPointsA" as const },
  { q: "faqPasswordQ" as const, a: "faqPasswordA" as const },
  { q: "faqPromoQ" as const, a: "faqPromoA" as const },
];

export default function SupportPage() {
  const t = useTranslations("support");
  const tNav = useTranslations("nav");
  const locale = useLocale();
  const supportBot = useSupportChatbot();
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "assistant"; text: string }[]
  >([]);

  function onAskBot() {
    const content = chatInput.trim();
    if (!content) return;
    setChatMessages((prev) => [...prev, { role: "user", text: content }]);
    setChatInput("");
    supportBot.mutate(
      { message: content, locale },
      {
        onSuccess: (res) => {
          const reply = res.data?.reply ?? "";
          setChatMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              text: reply || t("chatbotFallback"),
            },
          ]);
        },
        onError: () => {
          setChatMessages((prev) => [...prev, { role: "assistant", text: t("chatbotError") }]);
        },
      }
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <PageHeader
        title={t("title")}
      />

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

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">{t("chatbotTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground text-sm">{t("chatbotHint")}</p>
              <ScrollArea className="h-72 rounded-md border p-3">
                <div className="space-y-3">
                  {chatMessages.map((m, idx) => (
                    <div
                      key={`${m.role}-${idx}`}
                      className={m.role === "user" ? "text-right" : "text-left"}
                    >
                      <div
                        className={
                          m.role === "user"
                            ? "bg-primary text-primary-foreground inline-block max-w-[90%] rounded-lg px-3 py-2 text-sm"
                            : "bg-muted inline-block max-w-[90%] rounded-lg px-3 py-2 text-sm"
                        }
                      >
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={t("chatbotPlaceholder")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onAskBot();
                    }
                  }}
                />
                <Button type="button" onClick={onAskBot} disabled={supportBot.isPending}>
                  {supportBot.isPending ? t("chatbotThinking") : t("chatbotSend")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <CinectContactSection />
      </div>
    </div>
  );
}
