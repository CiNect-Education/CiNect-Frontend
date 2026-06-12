import type { CSSProperties } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { CinectAmbientBg } from "@/components/layout/cinect-ambient-bg";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { LanguageToggle } from "@/components/shared/language-toggle";
import { RequireAuthAndRole } from "@/lib/auth-guards";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuthAndRole roles={["ADMIN", "STAFF"]}>
      <div className="cinect-page-bg cinect-admin-shell isolate flex h-svh w-full overflow-hidden">
        <CinectAmbientBg />
        <SidebarProvider
          className="relative z-10 flex h-full min-h-0 w-full overflow-hidden bg-transparent"
          style={
            {
              "--sidebar-width": "17rem",
              "--sidebar-width-icon": "3.5rem",
            } as CSSProperties
          }
        >
          <AdminSidebar />
          <SidebarInset className="min-w-0 h-svh w-full overflow-y-auto bg-transparent">
            <header className="cinect-admin-header sticky top-0 z-20 flex h-14 items-center gap-2 border-b px-4">
              <SidebarTrigger />
              <Separator orientation="vertical" className="h-6 opacity-40" />
              <div className="flex-1" />
              <LanguageToggle />
              <ThemeToggle />
            </header>
            <main className="relative flex-1 p-4 lg:p-6">{children}</main>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </RequireAuthAndRole>
  );
}
