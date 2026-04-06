"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SendHorizontal, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSupportChatbot } from "@/hooks/queries/use-support";

type Msg = { role: "user" | "assistant"; text: string };

function MascotChatIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="bot-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="31" fill="url(#bot-bg)" />
      <rect x="15" y="16" rx="12" ry="12" width="34" height="26" fill="#ffffff" fillOpacity="0.96" />
      <circle cx="26" cy="29" r="3.4" fill="#0f172a" />
      <circle cx="38" cy="29" r="3.4" fill="#0f172a" />
      <path d="M24 36c2 2 4.8 3 8 3s6-1 8-3" stroke="#0f172a" strokeWidth="2.4" strokeLinecap="round" />
      <rect x="21" y="44" width="22" height="10" rx="4" fill="#ffffff" fillOpacity="0.96" />
      <rect x="24" y="46.5" width="4" height="5" rx="1" fill="#22d3ee" />
      <rect x="30" y="46.5" width="4" height="5" rx="1" fill="#60a5fa" />
      <rect x="36" y="46.5" width="4" height="5" rx="1" fill="#8b5cf6" />
      <circle cx="32" cy="13.5" r="2.6" fill="#ffffff" />
      <rect x="30.9" y="10.5" width="2.2" height="4" rx="1" fill="#ffffff" />
    </svg>
  );
}

export function ChatbotWidget() {
  const t = useTranslations("support");
  const locale = useLocale();
  const askBot = useSupportChatbot();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);

  const quickPrompts = useMemo(
    () => [t("chatbotQuickMovies"), t("chatbotQuickShowtimes"), t("chatbotQuickPromotions")],
    [t]
  );

  function sendMessage(message: string) {
    const content = message.trim();
    if (!content || askBot.isPending) return;
    setMessages((prev) => [...prev, { role: "user", text: content }]);
    setInput("");

    askBot.mutate(
      { message: content, locale },
      {
        onSuccess: (res) => {
          const reply = res.data?.reply?.trim() || t("chatbotFallback");
          setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
        },
        onError: () => {
          setMessages((prev) => [...prev, { role: "assistant", text: t("chatbotError") }]);
        },
      }
    );
  }

  return (
    <div className="pointer-events-none fixed right-4 bottom-20 z-[90] md:bottom-6">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            size="icon"
            className={cn(
              "pointer-events-auto relative h-14 w-14 overflow-hidden rounded-full border-0 p-0 shadow-xl",
              "bg-gradient-to-br from-cyan-400 via-sky-500 to-violet-600",
              "ring-cyan-200/40 dark:ring-violet-300/20 ring-4",
              "transition-all duration-300 ease-out hover:scale-105 hover:shadow-2xl",
              open && "scale-105 ring-8 shadow-2xl"
            )}
            aria-label={t("chatbotLauncherAria")}
          >
            <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_45%)]" />
            {open ? (
              <X className="relative z-10 h-6 w-6 text-white" />
            ) : (
              <MascotChatIcon className="relative z-10 h-11 w-11" />
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="end"
          side="top"
          sideOffset={12}
          className={cn(
            "pointer-events-auto w-[min(92vw,390px)] rounded-2xl border-0 p-0",
            "bg-background/95 supports-[backdrop-filter]:bg-background/80 backdrop-blur-xl",
            "shadow-[0_18px_55px_-14px_rgba(2,6,23,0.45)]",
            "data-[state=open]:duration-300 data-[state=closed]:duration-200"
          )}
        >
          <div className="border-b px-4 py-3">
            <div className="flex items-center">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-500/20 p-2 text-cyan-600 dark:text-violet-300">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h3 className="text-base font-semibold">{t("chatbotTitle")}</h3>
              </div>
            </div>
            <p className="text-muted-foreground text-sm">{t("chatbotHint")}</p>
          </div>

          <ScrollArea className="h-[420px] px-4 py-3">
            <div className="space-y-3">
              {messages.length === 0 ? (
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">{t("chatbotEmpty")}</p>
                  <div className="flex flex-wrap gap-2">
                    {quickPrompts.map((qp) => (
                      <Button
                        key={qp}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => sendMessage(qp)}
                        className="pointer-events-auto"
                      >
                        {qp}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m, idx) => (
                  <div key={`${m.role}-${idx}`} className={m.role === "user" ? "text-right" : "text-left"}>
                    <div
                      className={cn(
                        "inline-block max-w-[92%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap",
                        m.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground border"
                      )}
                    >
                      {m.text}
                    </div>
                  </div>
                ))
              )}

              {askBot.isPending && (
                <div className="text-left">
                  <div className="bg-muted text-foreground inline-block rounded-xl border px-3 py-2 text-sm">
                    {t("chatbotThinking")}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="border-t p-3">
            <div className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("chatbotPlaceholder")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
              />
              <Button
                type="button"
                size="icon"
                onClick={() => sendMessage(input)}
                disabled={askBot.isPending || !input.trim()}
                aria-label={t("chatbotSend")}
              >
                <SendHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
