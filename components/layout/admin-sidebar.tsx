"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Film,
  Building2,
  DoorOpen,
  Armchair,
  Clock,
  Ticket,
  DollarSign,
  Tag,
  BarChart3,
  ArrowLeft,
  LineChart,
  Users,
  Shield,
  ScrollText,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import type { UserRole } from "@/types/domain";
import { useSidebar } from "@/components/ui/sidebar";

export function AdminSidebar() {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const role =
    (user as { role?: UserRole } & { data?: { role?: UserRole } })?.role ??
    (user as { data?: { role?: UserRole } })?.data?.role ??
    "STAFF";
  const { open } = useSidebar();

  const contentItems = useMemo(
    () => [
      { label: t("movies"), href: "/admin/movies", icon: Film, roles: ["ADMIN"] as UserRole[] },
      {
        label: t("cinemas"),
        href: "/admin/cinemas",
        icon: Building2,
        roles: ["ADMIN"] as UserRole[],
      },
      { label: t("rooms"), href: "/admin/rooms", icon: DoorOpen, roles: ["ADMIN"] as UserRole[] },
      { label: t("seats"), href: "/admin/seats", icon: Armchair, roles: ["ADMIN"] as UserRole[] },
      {
        label: t("showtimes"),
        href: "/admin/showtimes",
        icon: Clock,
        roles: ["ADMIN", "STAFF"] as UserRole[],
      },
    ],
    [t]
  );

  const businessItems = useMemo(
    () => [
      {
        label: t("bookings"),
        href: "/admin/bookings",
        icon: Ticket,
        roles: ["ADMIN", "STAFF"] as UserRole[],
      },
      {
        label: t("pricing"),
        href: "/admin/pricing",
        icon: DollarSign,
        roles: ["ADMIN"] as UserRole[],
      },
      {
        label: t("promotions"),
        href: "/admin/promotions",
        icon: Tag,
        roles: ["ADMIN"] as UserRole[],
      },
    ],
    [t]
  );

  const systemItems = useMemo(
    () => [
      { label: t("users"), href: "/admin/users", icon: Users, roles: ["ADMIN"] as UserRole[] },
      { label: t("roles"), href: "/admin/roles", icon: Shield, roles: ["ADMIN"] as UserRole[] },
      {
        label: t("auditLogs"),
        href: "/admin/audit-logs",
        icon: ScrollText,
        roles: ["ADMIN"] as UserRole[],
      },
    ],
    [t]
  );

  const analyticsItems = useMemo(
    () => [
      {
        label: t("analytics"),
        href: "/admin/analytics",
        icon: LineChart,
        roles: ["ADMIN"] as UserRole[],
      },
      {
        label: t("reports"),
        href: "/admin/reports",
        icon: BarChart3,
        roles: ["ADMIN"] as UserRole[],
      },
    ],
    [t]
  );

  const visibleContentItems = contentItems.filter((item) => item.roles.includes(role));
  const visibleBusinessItems = businessItems.filter((item) => item.roles.includes(role));
  const visibleSystemItems = systemItems.filter((item) => item.roles.includes(role));
  const visibleAnalyticsItems = analyticsItems.filter((item) => item.roles.includes(role));

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  if (!open) return null;

  return (
    <Sidebar collapsible="none" className="sticky top-0 h-svh self-start border-r">
      <SidebarHeader className="border-b px-5 py-5">
        <Link href="/admin" className="flex items-center gap-3 text-lg font-bold">
          <LayoutDashboard className="text-primary h-6 w-6" />
          <span>{t("title")}</span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto px-1 py-1">
        {/* Overview */}
        {role === "ADMIN" && (
          <SidebarGroup className="px-2 py-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/admin"} size="lg">
                  <Link href="/admin">
                    <LayoutDashboard className="h-5 w-5" />
                    <span>{t("dashboard")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* Content Management */}
        <SidebarGroup className="px-2 py-2">
          <SidebarGroupLabel className="px-2 text-[11px] tracking-[0.08em] uppercase">Content</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleContentItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)} size="lg">
                    <Link href={item.href}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* System (RBAC) */}
        <SidebarGroup className="px-2 py-2">
          <SidebarGroupLabel className="px-2 text-[11px] tracking-[0.08em] uppercase">System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleSystemItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)} size="lg">
                    <Link href={item.href}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Business */}
        <SidebarGroup className="px-2 py-2">
          <SidebarGroupLabel className="px-2 text-[11px] tracking-[0.08em] uppercase">Business</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleBusinessItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)} size="lg">
                    <Link href={item.href}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Analytics */}
        <SidebarGroup className="px-2 py-2">
          <SidebarGroupLabel className="px-2 text-[11px] tracking-[0.08em] uppercase">Analytics</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleAnalyticsItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)} size="lg">
                    <Link href={item.href}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t px-4 py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={() => logout()}
              className="text-destructive hover:text-destructive"
            >
              <LogOut className="h-5 w-5" />
              <span>{tCommon("logout")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              <Link href="/" className="text-muted-foreground">
                <ArrowLeft className="h-5 w-5" />
                <span>{tCommon("backToSite")}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
