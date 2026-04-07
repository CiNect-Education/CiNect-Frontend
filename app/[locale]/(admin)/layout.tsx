import type { CSSProperties } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { LanguageToggle } from "@/components/shared/language-toggle";
import { RequireAuthAndRole } from "@/lib/auth-guards";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuthAndRole roles={["ADMIN", "STAFF"]}>
      <SidebarProvider
        className="h-svh w-full overflow-hidden"
        style={
          {
            "--sidebar-width": "17rem",
            "--sidebar-width-icon": "3.5rem",
          } as CSSProperties
        }
      >
        <AdminSidebar />
        <SidebarInset className="min-w-0 h-svh w-full overflow-y-auto">
          <header className="bg-background sticky top-0 z-20 flex h-14 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-6" />
            <div className="flex-1" />
            <LanguageToggle />
            <ThemeToggle />
          </header>
          <main className="flex-1 p-4 lg:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </RequireAuthAndRole>
  );
}
