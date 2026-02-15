import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AccountNav } from "@/components/layout/account-nav";
import { RequireAuth } from "@/lib/auth-guards";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
            <div className="flex flex-col gap-8 lg:flex-row">
              <aside className="w-full shrink-0 lg:w-56">
                <AccountNav />
              </aside>
              <div className="flex-1">{children}</div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </RequireAuth>
  );
}
