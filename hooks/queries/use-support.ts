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
