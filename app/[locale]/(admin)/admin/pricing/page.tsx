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
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ColumnDef } from "@tanstack/react-table";
import type { PricingRule, SeatType, DayType, TimeSlot, RoomFormat } from "@/types/domain";
import {
  useAdminPricingRules,
  useAdminCinemas,
  useCreatePricingRule,
  useUpdatePricingRule,
  useDeletePricingRule,
} from "@/hooks/queries/use-admin";

const pricingFormSchema = z.object({
  seatType: z.enum(["STANDARD", "VIP", "COUPLE", "DISABLED"]),
  dayType: z.enum(["WEEKDAY", "WEEKEND", "HOLIDAY"]),
  timeSlot: z.enum(["MORNING", "AFTERNOON", "EVENING", "NIGHT"]),
  roomFormat: z.enum(["2D", "3D", "IMAX", "4DX", "DOLBY"]),
  price: z.coerce.number().min(0),
  isActive: z.boolean(),
  cinemaId: z.string().optional(),
});

type PricingFormValues = z.infer<typeof pricingFormSchema>;

export default function AdminPricingPage() {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const tb = useTranslations("booking");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PricingRule | null>(null);

  const { data: rulesRes, isLoading: rulesLoading } = useAdminPricingRules();
  const { data: cinemasRes } = useAdminCinemas();
  const rules = rulesRes?.data ?? [];
  const cinemas = cinemasRes?.data ?? [];

  const createMutation = useCreatePricingRule();
  const updateMutation = useUpdatePricingRule();
  const deleteMutation = useDeletePricingRule();

  const form = useForm<PricingFormValues>({
    resolver: zodResolver(pricingFormSchema),
    defaultValues: {
      seatType: "STANDARD",
      dayType: "WEEKDAY",
      timeSlot: "MORNING",
      roomFormat: "2D",
      price: 80000,
      isActive: true,
      cinemaId: "",
    },
  });

  function openCreate() {
    setEditingRule(null);
    form.reset({
      seatType: "STANDARD",
      dayType: "WEEKDAY",
      timeSlot: "MORNING",
      roomFormat: "2D",
      price: 80000,
      isActive: true,
      cinemaId: "",
    });
    setDialogOpen(true);
  }

  const openEdit = useCallback(
    (rule: PricingRule) => {
    setEditingRule(rule);
    form.reset({
      seatType: rule.seatType,
      dayType: rule.dayType,
      timeSlot: rule.timeSlot,
      roomFormat: rule.roomFormat,
      price: rule.price,
      isActive: rule.isActive,
      cinemaId: "",
    });
    setDialogOpen(true);
    },
    [form]
  );

  async function onSubmit(values: PricingFormValues) {
    const payload = {
      seatType: values.seatType,
      dayType: values.dayType,
      timeSlot: values.timeSlot,
      roomFormat: values.roomFormat,
      price: values.price,
      isActive: values.isActive,
      ...(values.cinemaId && values.cinemaId !== "none" && { cinemaId: values.cinemaId }),
    };
    if (editingRule) {
      await updateMutation.mutateAsync({ ...payload, id: editingRule.id });
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

  const columns: ColumnDef<PricingRule>[] = useMemo(
    () => [
      {
        accessorKey: "seatType",
        header: t("colSeatType"),
      },
      {
        accessorKey: "dayType",
        header: t("colDayType"),
      },
      {
        accessorKey: "timeSlot",
        header: t("colTimeSlot"),
      },
      {
        accessorKey: "roomFormat",
        header: t("colRoomFormat"),
      },
      {
        accessorKey: "price",
        header: t("colPrice"),
        cell: ({ row }) => (row.original.price?.toLocaleString() ?? "0") + " ₫",
      },
      {
        accessorKey: "isActive",
        header: t("colActive"),
        cell: ({ row }) => (row.original.isActive ? t("yes") : t("no")),
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
              aria-label={t("ariaEditPricing")}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteTarget(row.original)}
              aria-label={t("ariaDeletePricing")}
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
      title={t("pricing")}
      description={t("descPricing")}
      breadcrumbs={[{ label: t("title"), href: "/admin" }, { label: t("pricing") }]}
      actions={
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t("addRule")}
        </Button>
      }
    >
      <DataTable
        columns={columns}
        data={rules}
        searchPlaceholder={t("searchRules")}
        className="cinect-glass rounded-lg border p-4"
        isLoading={rulesLoading}
        emptyMessage={t("emptyPricing")}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="cinect-glass max-w-lg border">
          <DialogHeader>
            <DialogTitle>{editingRule ? t("editRule") : t("addRule")}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="seatType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("colSeatType")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(["STANDARD", "VIP", "COUPLE", "DISABLED"] as SeatType[]).map((s) => (
                            <SelectItem key={s} value={s}>
                              {s === "VIP"
                                ? tb("vip")
                                : s === "COUPLE"
                                  ? tb("couple")
                                  : s === "DISABLED"
                                    ? tb("disabled")
                                    : tb("standard")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dayType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("colDayType")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(["WEEKDAY", "WEEKEND", "HOLIDAY"] as DayType[]).map((d) => (
                            <SelectItem key={d} value={d}>
                              {d === "WEEKDAY"
                                ? t("pricingDayWeekday")
                                : d === "WEEKEND"
                                  ? t("pricingDayWeekend")
                                  : t("pricingDayHoliday")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="timeSlot"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("colTimeSlot")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(["MORNING", "AFTERNOON", "EVENING", "NIGHT"] as TimeSlot[]).map((slot) => (
                            <SelectItem key={slot} value={slot}>
                              {slot === "MORNING"
                                ? t("pricingSlotMorning")
                                : slot === "AFTERNOON"
                                  ? t("pricingSlotAfternoon")
                                  : slot === "EVENING"
                                    ? t("pricingSlotEvening")
                                    : t("pricingSlotNight")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="roomFormat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("colRoomFormat")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(["2D", "3D", "IMAX", "4DX", "DOLBY"] as RoomFormat[]).map((f) => (
                            <SelectItem key={f} value={f}>
                              {f}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="cinemaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("labelCinemaOptional")}</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("allCinemasFilter")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">{t("allCinemasFilter")}</SelectItem>
                        {cinemas.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("labelPriceAmountVnd")}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <FormLabel>{t("colActive")}</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
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
                  {editingRule ? t("updateUserBtn") : tCommon("create")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="cinect-glass border">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deletePricingRule")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deletePricingRuleDesc")}</AlertDialogDescription>
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
