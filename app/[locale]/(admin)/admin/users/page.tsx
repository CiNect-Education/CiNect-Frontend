"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { DataTable } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ColumnDef } from "@tanstack/react-table";
import type { User } from "@/types/domain";
import type { UserRole } from "@/types/domain";
import {
  useAdminUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useAdminCinemas,
} from "@/hooks/queries/use-admin";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

function toList<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  if (v && typeof v === "object" && "data" in v && Array.isArray((v as { data: unknown }).data))
    return (v as { data: T[] }).data;
  return [];
}

type CreateUserFormValues = {
  fullName: string;
  email: string;
  password: string;
  role: "ADMIN" | "STAFF" | "USER";
  city?: string;
};

type EditUserFormValues = {
  fullName: string;
  email: string;
  role: "ADMIN" | "STAFF" | "USER";
  city?: string;
  cinemaIds?: string[];
};

export default function AdminUsersPage() {
  const t = useTranslations("admin");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("nav");
  const createUserSchema = useMemo(
    () =>
      z.object({
        fullName: z.string().min(1, t("validation.fullNameRequired")),
        email: z.string().email(t("validation.emailInvalid")),
        password: z.string().min(6, t("validation.passwordMin6")),
        role: z.enum(["ADMIN", "STAFF", "USER"]),
        city: z.string().optional(),
      }),
    [t]
  );
  const editUserSchema = useMemo(
    () =>
      z.object({
        fullName: z.string().min(1, t("validation.fullNameRequired")),
        email: z.string().email(t("validation.emailInvalid")),
        role: z.enum(["ADMIN", "STAFF", "USER"]),
        city: z.string().optional(),
        cinemaIds: z.array(z.string()).optional(),
      }),
    [t]
  );
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const { data: usersRes, isLoading: usersLoading } = useAdminUsers();
  const actualUsers = toList<User>(usersRes?.data ?? usersRes);

  const { data: cinemasRes } = useAdminCinemas();
  const actualCinemas = toList<{ id: string; name: string }>(cinemasRes?.data ?? cinemasRes);

  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  const createForm = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      role: "USER",
      city: "",
    },
  });

  const editForm = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      fullName: "",
      email: "",
      role: "USER",
      city: "",
      cinemaIds: [],
    },
  });

  function openCreate() {
    setEditingUser(null);
    createForm.reset({
      fullName: "",
      email: "",
      password: "",
      role: "USER",
      city: "",
    });
    setCreateDialogOpen(true);
  }

  const openEdit = useCallback(
    (user: User) => {
    setEditingUser(user);
    const cinemaIds = (user as User & { cinemaIds?: string[] }).cinemaIds ?? [];
    editForm.reset({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      city: user.city ?? "",
      cinemaIds,
    });
    setEditDialogOpen(true);
    },
    [editForm]
  );

  async function onCreateSubmit(values: CreateUserFormValues) {
    await createMutation.mutateAsync({
      fullName: values.fullName,
      email: values.email,
      password: values.password,
      role: values.role as UserRole,
      city: values.city || undefined,
    });
    setCreateDialogOpen(false);
  }

  async function onEditSubmit(values: EditUserFormValues) {
    if (!editingUser) return;
    await updateMutation.mutateAsync({
      id: editingUser.id,
      fullName: values.fullName,
      email: values.email,
      role: values.role as UserRole,
      city: values.city || undefined,
      ...(values.cinemaIds?.length ? { cinemaIds: values.cinemaIds } : {}),
    } as Parameters<typeof updateMutation.mutateAsync>[0]);
    setEditDialogOpen(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync({ id: deleteTarget.id });
    setDeleteTarget(null);
  }

  const columns: ColumnDef<User>[] = useMemo(
    () => [
      { accessorKey: "fullName", header: t("colName") },
      { accessorKey: "email", header: t("colEmail") },
      {
        accessorKey: "role",
        header: tAuth("role"),
        cell: ({ row }) => {
          const r = row.original.role;
          return r === "ADMIN"
            ? t("roleAdmin")
            : r === "STAFF"
              ? t("roleStaff")
              : r === "USER"
                ? t("roleUser")
                : r;
        },
      },
      { accessorKey: "city", header: tNav("city"), cell: ({ row }) => row.original.city ?? "—" },
      {
        accessorKey: "createdAt",
        header: t("colCreated"),
        cell: ({ row }) =>
          row.original.createdAt ? format(new Date(row.original.createdAt), "dd/MM/yyyy") : "—",
      },
      {
        id: "actions",
        header: t("colActions"),
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openEdit(row.original)}
              aria-label={t("ariaEditUser")}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteTarget(row.original)}
              aria-label={t("ariaDeleteUser")}
            >
              <Trash2 className="text-destructive h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [openEdit, t, tAuth, tNav]
  );

  return (
    <AdminPageShell
      title={t("users")}
      description={t("descUsers")}
      breadcrumbs={[{ label: t("title"), href: "/admin" }, { label: t("users") }]}
      actions={
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t("addUserBtn")}
        </Button>
      }
    >
      <DataTable
        columns={columns}
        data={actualUsers}
        searchKey="fullName"
        searchPlaceholder={t("searchUsers")}
        className="cinect-glass rounded-lg border p-4"
        isLoading={usersLoading}
        emptyMessage={t("emptyUsers")}
      />

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="cinect-glass max-w-lg border">
          <DialogHeader>
            <DialogTitle>{t("createUser")}</DialogTitle>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tAuth("fullName")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tAuth("email")}</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tAuth("password")}</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tAuth("role")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectRole")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ADMIN">{t("roleAdmin")}</SelectItem>
                        <SelectItem value="STAFF">{t("roleStaff")}</SelectItem>
                        <SelectItem value="USER">{t("roleUser")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tNav("city")}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t("optional")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  {tCommon("cancel")}
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {tCommon("create")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="cinect-glass max-w-lg border">
          <DialogHeader>
            <DialogTitle>{t("editUser")}</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tAuth("fullName")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tAuth("email")}</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tAuth("role")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectRole")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ADMIN">{t("roleAdmin")}</SelectItem>
                        <SelectItem value="STAFF">{t("roleStaff")}</SelectItem>
                        <SelectItem value="USER">{t("roleUser")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tNav("city")}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t("optional")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {editForm.watch("role") === "STAFF" && (
                <FormField
                  control={editForm.control}
                  name="cinemaIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("assignedCinemas")}</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-between font-normal",
                                !field.value?.length && "text-muted-foreground"
                              )}
                            >
                              {field.value?.length
                                ? t("cinemasSelectedCount", { count: field.value.length })
                                : t("selectCinemas")}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <div className="max-h-64 space-y-2 overflow-y-auto p-2">
                            {actualCinemas.map((c) => (
                              <label key={c.id} className="flex cursor-pointer items-center gap-2">
                                <Checkbox
                                  checked={field.value?.includes(c.id) ?? false}
                                  onCheckedChange={(checked) => {
                                    const current = field.value ?? [];
                                    if (checked) {
                                      field.onChange([...current, c.id]);
                                    } else {
                                      field.onChange(current.filter((id) => id !== c.id));
                                    }
                                  }}
                                />
                                <span className="text-sm">{c.name}</span>
                              </label>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  {tCommon("cancel")}
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {t("updateUserBtn")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="cinect-glass border">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteUser")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteUserDesc", { name: deleteTarget?.fullName ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {tCommon("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageShell>
  );
}
