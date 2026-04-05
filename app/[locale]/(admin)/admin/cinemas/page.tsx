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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ColumnDef } from "@tanstack/react-table";
import type { Cinema } from "@/types/domain";
import {
  useAdminCinemas,
  useCreateCinema,
  useUpdateCinema,
  useDeleteCinema,
} from "@/hooks/queries/use-admin";

type CinemaFormValues = {
  name: string;
  address: string;
  city: string;
  district?: string;
  phone?: string;
  email?: string;
};

export default function AdminCinemasPage() {
  const t = useTranslations("admin");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
  const cinemaFormSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t("validation.nameRequired")),
        address: z.string().min(1, t("validation.addressRequired")),
        city: z.string().min(1, t("validation.cityRequired")),
        district: z.string().optional(),
        phone: z.string().optional(),
        email: z
          .union([z.literal(""), z.string().email(t("validation.emailInvalid"))])
          .optional(),
      }),
    [t]
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCinema, setEditingCinema] = useState<Cinema | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Cinema | null>(null);

  const { data: cinemasRes, isLoading: cinemasLoading } = useAdminCinemas();
  const cinemas = cinemasRes?.data ?? [];
  const createMutation = useCreateCinema();
  const updateMutation = useUpdateCinema();
  const deleteMutation = useDeleteCinema();

  const form = useForm<CinemaFormValues>({
    resolver: zodResolver(cinemaFormSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      district: "",
      phone: "",
      email: "",
    },
  });

  function openCreate() {
    setEditingCinema(null);
    form.reset({
      name: "",
      address: "",
      city: "",
      district: "",
      phone: "",
      email: "",
    });
    setDialogOpen(true);
  }

  const openEdit = useCallback(
    (cinema: Cinema) => {
    setEditingCinema(cinema);
    form.reset({
      name: cinema.name,
      address: cinema.address,
      city: cinema.city,
      district: cinema.district ?? "",
      phone: cinema.phone ?? "",
      email: cinema.email ?? "",
    });
    setDialogOpen(true);
    },
    [form]
  );

  async function onSubmit(values: CinemaFormValues) {
    const payload = {
      ...values,
      slug: values.name.toLowerCase().replace(/\s+/g, "-"),
      amenities: [] as string[],
    };
    if (editingCinema) {
      await updateMutation.mutateAsync({ ...payload, id: editingCinema.id });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setDialogOpen(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync({ id: deleteTarget.id });
    setDeleteTarget(null);
  }

  const columns: ColumnDef<Cinema>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: t("colName"),
      },
      {
        accessorKey: "city",
        header: t("colCity"),
      },
      {
        accessorKey: "address",
        header: t("colAddress"),
      },
      {
        id: "rooms",
        header: t("colRooms"),
        cell: ({ row }) => row.original.rooms?.length ?? 0,
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
              aria-label={t("ariaEditCinema")}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteTarget(row.original)}
              aria-label={t("ariaDeleteCinema")}
            >
              <Trash2 className="text-destructive h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [openEdit, t]
  );

  return (
    <AdminPageShell
      title={t("cinemas")}
      description={t("descCinemas")}
      breadcrumbs={[{ label: t("title"), href: "/admin" }, { label: t("cinemas") }]}
      actions={
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t("addCinemaBtn")}
        </Button>
      }
    >
      <DataTable
        columns={columns}
        data={cinemas}
        searchKey="name"
        searchPlaceholder={t("searchCinemas")}
        className="cinect-glass rounded-lg border p-4"
        isLoading={cinemasLoading}
        emptyMessage={t("emptyCinemas")}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="cinect-glass max-w-lg border">
          <DialogHeader>
            <DialogTitle>{editingCinema ? t("editCinema") : t("addCinema")}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("colName")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("colAddress")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("colCity")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="district"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("colDistrict")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tAuth("phone")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
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
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  {tCommon("cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingCinema ? t("updateUserBtn") : tCommon("create")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="cinect-glass border">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteCinema")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteCinemaDesc", { name: deleteTarget?.name ?? "" })}
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
