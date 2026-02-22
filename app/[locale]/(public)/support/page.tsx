"use client";

import { useTranslations } from "next-intl";
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
import { Mail, Phone, MapPin } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactFormSchema, type ContactFormInput } from "@/lib/schemas/common";
import { useSubmitContactForm } from "@/hooks/queries/use-support";

const FAQ_ITEMS = [
  {
    q: "How do I book movie tickets online?",
    a: "You can book tickets online by selecting a movie, choosing a showtime, selecting your seats, and completing payment through our website or app.",
  },
  {
    q: "Can I cancel or refund my tickets?",
    a: "Tickets can be cancelled at least 2 hours before the showtime. Refunds will be processed to your account within 3-5 business days.",
  },
  {
    q: "How do I earn member points?",
    a: "Every purchase of tickets or concessions automatically earns points. 1 point = 1,000 VND spent.",
  },
  {
    q: "I forgot my password. How do I reset it?",
    a: "Click 'Forgot password' on the login page, enter your registered email, and follow the instructions sent to your inbox.",
  },
  {
    q: "Does CiNect have any promotions?",
    a: "We regularly offer special promotions. Visit our Promotions page to see the latest deals and exclusive member offers.",
  },
];

export default function SupportPage() {
  const t = useTranslations("support");
  const submitForm = useSubmitContactForm();

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

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 lg:px-6">
      <PageHeader
        title={t("title") || "Support"}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: t("title") || "Support" }]}
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* FAQ */}
        <div>
          <h2 className="mb-4 text-xl font-semibold">{t("faq") || "FAQ"}</h2>
          <Accordion type="single" collapsible className="w-full">
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-sm">{item.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Contact */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("contact") || "Contact"}</CardTitle>
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
                Ho Chi Minh City, Vietnam
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("contactForm") || "Send us a message"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" placeholder="Your name" {...register("name")} className="mt-1" />
                  {errors.name && (
                    <p className="text-destructive mt-1 text-xs">{errors.name.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    {...register("email")}
                    className="mt-1"
                  />
                  {errors.email && (
                    <p className="text-destructive mt-1 text-xs">{errors.email.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="Subject"
                    {...register("subject")}
                    className="mt-1"
                  />
                  {errors.subject && (
                    <p className="text-destructive mt-1 text-xs">{errors.subject.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Describe your issue..."
                    rows={4}
                    {...register("message")}
                    className="mt-1"
                  />
                  {errors.message && (
                    <p className="text-destructive mt-1 text-xs">{errors.message.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={submitForm.isPending}>
                  {submitForm.isPending ? "Sending..." : "Send"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
