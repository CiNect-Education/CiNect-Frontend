import { Header } from "@/components/layout/header";
import { CinectAmbientBg } from "@/components/layout/cinect-ambient-bg";
import { Footer } from "@/components/layout/footer";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AccountNav } from "@/components/layout/account-nav";
import { RequireAuth } from "@/lib/auth-guards";
import { ChatbotWidget } from "@/components/shared/chatbot-widget";
import { ClientOnly } from "@/components/system/client-only";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <div className="cinect-page-bg isolate flex min-h-screen flex-col">
        <CinectAmbientBg />
        <Header />
        <main className="cinect-app-main relative flex-1 pb-16 md:pb-8">
          <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
            <div className="flex flex-col gap-8 lg:flex-row">
              <aside className="w-full shrink-0 lg:w-56">
                <AccountNav />
              </aside>
              <div className="min-w-0 flex-1">{children}</div>
            </div>
          </div>
        </main>
        <Footer />
        <BottomNav />
        <ClientOnly>
          <ChatbotWidget />
        </ClientOnly>
      </div>
    </RequireAuth>
  );
}
