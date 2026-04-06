"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { DataTable } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import type { ColumnDef } from "@tanstack/react-table";
import type { Promotion } from "@/types/domain";
import {
  useAdminPromotions,
  useCreatePromotion,
  useUpdatePromotion,
  useDeletePromotion,
} from "@/hooks/queries/use-admin";
import { unwrapList } from "@/lib/admin-data";

type PromotionFormValues = {
  title: string;
  description?: string;
  code?: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minPurchase?: number;
  maxDiscount?: number;
  usageLimit?: number;
  startDate: string;
  endDate: string;
  status: "ACTIVE" | "INACTIVE" | "EXPIRED";
};

export default function AdminPromotionsPage() {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const promotionFormSchema = useMemo(
    () =>
      z.object({
        title: z.string().min(1, t("validation.titleRequired")),
        description: z.string().optional(),
        code: z.string().optional(),
        discountType: z.enum(["PERCENTAGE", "FIXED"]),
        discountValue: z.coerce.number().min(0),
        minPurchase: z.coerce.number().min(0).optional(),
        maxDiscount: z.coerce.number().min(0).optional(),
        usageLimit: z.coerce.number().min(0).optional(),
        startDate: z.string().min(1, t("validation.startDateRequired")),
        endDate: z.string().min(1, t("validation.endDateRequired")),
        status: z.enum(["ACTIVE", "INACTIVE", "EXPIRED"]),
      }),
    [t]
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null);

  const { data: promotionsRes, isLoading: promotionsLoading } = useAdminPromotions();
  const promotions = unwrapList<Promotion>(promotionsRes?.data ?? promotionsRes);
  const createMutation = useCreatePromotion();
  const updateMutation = useUpdatePromotion();
  const deleteMutation = useDeletePromotion();

  const form = useForm<PromotionFormValues>({
    resolver: zodResolver(promotionFormSchema),
    defaultValues: {
      title: "",
      description: "",
      code: "",
      discountType: "PERCENTAGE",
      discountValue: 0,
      minPurchase: 0,
      maxDiscount: 0,
      usageLimit: 0,
      startDate: "",
      endDate: "",
      status: "ACTIVE",
    },
  });

  function openCreate() {
    setEditingPromotion(null);
    const today = new Date().toISOString().slice(0, 10);
    const end = new Date();
    end.setMonth(end.getMonth() + 1);
    form.reset({
      title: "",
      description: "",
      code: "",
      discountType: "PERCENTAGE",
      discountValue: 10,
      minPurchase: 0,
      maxDiscount: 0,
      usageLimit: 0,
      startDate: today,
      endDate: end.toISOString().slice(0, 10),
      status: "ACTIVE",
    });
    setDialogOpen(true);
  }

  const openEdit = useCallback(
    (p: Promotion) => {
    setEditingPromotion(p);
    form.reset({
      title: p.title,
      description: p.description ?? "",
      code: p.code ?? "",
      discountType: p.discountType,
      discountValue: p.discountValue,
      minPurchase: p.minPurchase ?? 0,
      maxDiscount: p.maxDiscount ?? 0,
      usageLimit: p.usageLimit ?? 0,
      startDate: p.startDate.slice(0, 10),
      endDate: p.endDate.slice(0, 10),
      status: p.status,
    });
    setDialogOpen(true);
    },
    [form]
  );

  async function onSubmit(values: PromotionFormValues) {
    const payload = {
      ...values,
      minPurchase: values.minPurchase || undefined,
      maxDiscount: values.maxDiscount || undefined,
      usageLimit: values.usageLimit || undefined,
    };
    if (editingPromotion) {
      await updateMutation.mutateAsync({ ...payload, id: editingPromotion.id });
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

  const columns: ColumnDef<Promotion>[] = useMemo(
    () => [
      {
        accessorKey: "title",
        header: t("colTitle"),
      },
      {
        accessorKey: "code",
        header: t("colCode"),
        cell: ({ row }) => row.original.code || "—",
      },
      {
        id: "discount",
        header: t("colDiscount"),
        cell: ({ row }) => {
          const p = row.original;
          return p.discountType === "PERCENTAGE"
            ? `${p.discountValue}%`
            : `${p.discountValue?.toLocaleString()} ₫`;
        },
      },
      {
        id: "usage",
        header: t("colUsage"),
        cell: ({ row }) => {
          const p = row.original;
          const used = p.usageCount ?? 0;
          const limit = p.usageLimit;
          return limit != null ? `${used}/${limit}` : `${used}`;
        },
      },
      {
        id: "dates",
        header: t("colDates"),
        cell: ({ row }) => {
          const p = row.original;
          return `${format(new Date(p.startDate), "MMM d")} – ${format(new Date(p.endDate), "MMM d")}`;
        },
      },
      {
        accessorKey: "status",
        header: t("colStatus"),
        cell: ({ row }) => {
          const s = row.original.status;
          const variant = s === "ACTIVE" ? "default" : s === "EXPIRED" ? "destructive" : "outline";
          const label =
            s === "ACTIVE"
              ? t("promoStatusActive")
              : s === "INACTIVE"
                ? t("promoStatusInactive")
                : s === "EXPIRED"
                  ? t("promoStatusExpired")
                  : s;
          return <Badge variant={variant}>{label}</Badge>;
        },
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
              aria-label={t("ariaEditPromotion")}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteTarget(row.original)}
              aria-label={t("ariaDeletePromotion")}
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
      title={t("promotions")}
      description={t("descPromotions")}
      breadcrumbs={[{ label: t("title"), href: "/admin" }, { label: t("promotions") }]}
      actions={
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t("createPromotionBtn")}
        </Button>
      }
    >
      <DataTable
        columns={columns}
        data={promotions}
        searchKey="title"
        searchPlaceholder={t("searchPromotions")}
        className="cinect-glass rounded-lg border p-4"
        isLoading={promotionsLoading}
        emptyMessage={t("emptyPromotions")}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="cinect-glass max-w-lg border">
          <DialogHeader>
            <DialogTitle>
              {editingPromotion ? t("editPromotion") : t("createPromotion")}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("colTitle")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("labelDescription")}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t("optional")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("colCode")}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t("promoCodeExample")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="discountType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("promoDiscountType")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PERCENTAGE">{t("promoDiscPercentage")}</SelectItem>
                          <SelectItem value="FIXED">{t("promoDiscFixed")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="discountValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("labelDiscountValue")}</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="minPurchase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min Purchase (₫)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxDiscount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Discount (₫)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="usageLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("labelUsageLimit")}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("labelPromoStart")}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("labelPromoEnd")}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("colStatus")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ACTIVE">{t("promoStatusActive")}</SelectItem>
                        <SelectItem value="INACTIVE">{t("promoStatusInactive")}</SelectItem>
                        <SelectItem value="EXPIRED">{t("promoStatusExpired")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  {tCommon("cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingPromotion ? t("updateUserBtn") : tCommon("create")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="cinect-glass border">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deletePromotion")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deletePromotionDesc", { title: deleteTarget?.title ?? "" })}
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
