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
} from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import type { UserRole } from "@/types/domain";

export function AdminSidebar() {
  const t = useTranslations("admin");
  const pathname = usePathname();
  const { user } = useAuth();
  const role = (user as { role?: UserRole } & { data?: { role?: UserRole } })?.role
    ?? (user as { data?: { role?: UserRole } })?.data?.role
    ?? "STAFF";

  const contentItems = useMemo(
    () => [
      { label: t("movies"), href: "/admin/movies", icon: Film, roles: ["ADMIN"] as UserRole[] },
      { label: t("cinemas"), href: "/admin/cinemas", icon: Building2, roles: ["ADMIN"] as UserRole[] },
      { label: t("rooms"), href: "/admin/rooms", icon: DoorOpen, roles: ["ADMIN"] as UserRole[] },
      { label: t("seats"), href: "/admin/seats", icon: Armchair, roles: ["ADMIN"] as UserRole[] },
      { label: t("showtimes"), href: "/admin/showtimes", icon: Clock, roles: ["ADMIN", "STAFF"] as UserRole[] },
    ],
    [t]
  );

  const businessItems = useMemo(
    () => [
      { label: t("bookings"), href: "/admin/bookings", icon: Ticket, roles: ["ADMIN", "STAFF"] as UserRole[] },
      { label: t("pricing"), href: "/admin/pricing", icon: DollarSign, roles: ["ADMIN"] as UserRole[] },
      { label: t("promotions"), href: "/admin/promotions", icon: Tag, roles: ["ADMIN"] as UserRole[] },
    ],
    [t]
  );

  const systemItems = useMemo(
    () => [
      { label: t("users"), href: "/admin/users", icon: Users, roles: ["ADMIN"] as UserRole[] },
      { label: t("roles"), href: "/admin/roles", icon: Shield, roles: ["ADMIN"] as UserRole[] },
      { label: t("auditLogs"), href: "/admin/audit-logs", icon: ScrollText, roles: ["ADMIN"] as UserRole[] },
    ],
    [t]
  );

  const analyticsItems = useMemo(
    () => [
      { label: t("analytics"), href: "/admin/analytics", icon: LineChart, roles: ["ADMIN"] as UserRole[] },
      { label: t("reports"), href: "/admin/reports", icon: BarChart3, roles: ["ADMIN"] as UserRole[] },
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

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-4">
        <Link href="/admin" className="flex items-center gap-2 font-bold">
          <LayoutDashboard className="h-5 w-5 text-primary" />
          <span>{t("title")}</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* Overview */}
        {role === "ADMIN" && (
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/admin"}
                >
                  <Link href="/admin">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>{t("dashboard")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* Content Management */}
        <SidebarGroup>
          <SidebarGroupLabel>Content</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleContentItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* System (RBAC) */}
        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleSystemItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Business */}
        <SidebarGroup>
          <SidebarGroupLabel>Business</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleBusinessItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Analytics */}
        <SidebarGroup>
          <SidebarGroupLabel>Analytics</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleAnalyticsItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/" className="text-muted-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to site</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
