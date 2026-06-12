"use client";

import dynamic from "next/dynamic";
import { useDeferredMount } from "@/lib/use-deferred-mount";

const ChatbotWidget = dynamic(
  () => import("@/components/shared/chatbot-widget").then((m) => m.ChatbotWidget),
  { ssr: false },
);

const PostShowReviewPrompt = dynamic(
  () => import("@/components/community/post-show-review-prompt").then((m) => m.PostShowReviewPrompt),
  { ssr: false },
);

export function DeferredPublicWidgets() {
  const ready = useDeferredMount(2000);
  if (!ready) return null;

  return (
    <>
      <ChatbotWidget />
      <PostShowReviewPrompt />
    </>
  );
}
