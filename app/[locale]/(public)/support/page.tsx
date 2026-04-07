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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mail, Phone, MapPin } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactFormSchema, type ContactFormInput } from "@/lib/schemas/common";
import { useSubmitContactForm, useSupportChatbot } from "@/hooks/queries/use-support";

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
  const submitForm = useSubmitContactForm();
  const supportBot = useSupportChatbot();
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "assistant"; text: string }[]
  >([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormInput>({
    resolver: zodResolver(contactFormSchema),
  });

  function onSubmit(data: ContactFormInput) {
    submitForm.mutate(data, {
      onSuccess: () => reset(),
    });
  }

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
    <div className="mx-auto max-w-4xl px-4 py-8 lg:px-6">
      <PageHeader
        title={t("title")}
        breadcrumbs={[{ label: tNav("home"), href: "/" }, { label: t("title") }]}
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
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
                  {chatMessages.length === 0 ? (
                    <p className="text-muted-foreground text-sm">{t("chatbotEmpty")}</p>
                  ) : (
                    chatMessages.map((m, idx) => (
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
                    ))
                  )}
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

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("contact")}</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                support@cinect.vn
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                1900 0000
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {t("officeAddress")}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("contactForm")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="name">{t("name")}</Label>
                  <Input
                    id="name"
                    placeholder={t("placeholderYourName")}
                    {...register("name")}
                    className="mt-1"
                  />
                  {errors.name && (
                    <p className="text-destructive mt-1 text-xs">{errors.name.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email">{t("email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("placeholderEmail")}
                    {...register("email")}
                    className="mt-1"
                  />
                  {errors.email && (
                    <p className="text-destructive mt-1 text-xs">{errors.email.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="subject">{t("subject")}</Label>
                  <Input
                    id="subject"
                    placeholder={t("placeholderSubject")}
                    {...register("subject")}
                    className="mt-1"
                  />
                  {errors.subject && (
                    <p className="text-destructive mt-1 text-xs">{errors.subject.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="message">{t("message")}</Label>
                  <Textarea
                    id="message"
                    placeholder={t("placeholderMessage")}
                    rows={4}
                    {...register("message")}
                    className="mt-1"
                  />
                  {errors.message && (
                    <p className="text-destructive mt-1 text-xs">{errors.message.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={submitForm.isPending}>
                  {submitForm.isPending ? t("sending") : t("sendMessage")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
