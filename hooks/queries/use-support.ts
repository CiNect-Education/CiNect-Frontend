import { useApiMutation } from "@/hooks/use-api-mutation";
import type { ContactFormInput, SupportTicketInput } from "@/lib/schemas/common";

export function useSubmitContactForm() {
  return useApiMutation<void, ContactFormInput>("post", "/support/contact", {
    successMessage: "Your message has been sent. We will get back to you shortly.",
  });
}

export function useSubmitSupportTicket() {
  return useApiMutation<void, SupportTicketInput>("post", "/support/ticket", {
    successMessage: "Support ticket created successfully.",
  });
}

export type SupportChatbotInput = {
  message: string;
  locale?: string;
};

export type SupportChatbotOutput = {
  reply: string;
};

export function useSupportChatbot() {
  return useApiMutation<SupportChatbotOutput, SupportChatbotInput>("post", "/support/chatbot");
}
