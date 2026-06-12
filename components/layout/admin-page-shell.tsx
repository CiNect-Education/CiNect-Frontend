"use client";

import { PageHeader } from "@/components/shared/page-header";

interface AdminPageShellProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function AdminPageShell({ title, description, actions, children }: AdminPageShellProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 lg:py-8">
      <PageHeader title={title} description={description} actions={actions} />
      <div className="mt-6 space-y-6">{children}</div>
    </div>
  );
}
