"use client";

import { useState, useMemo } from "react";
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PricingRule | null>(null);

  const { data: rulesRes } = useAdminPricingRules();
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

  function openEdit(rule: PricingRule) {
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
  }

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
        header: "Seat Type",
      },
      {
        accessorKey: "dayType",
        header: "Day Type",
      },
      {
        accessorKey: "timeSlot",
        header: "Time Slot",
      },
      {
        accessorKey: "roomFormat",
        header: "Format",
      },
      {
        accessorKey: "price",
        header: "Price",
        cell: ({ row }) => (row.original.price?.toLocaleString() ?? "0") + " ₫",
      },
      {
        accessorKey: "isActive",
        header: "Active",
        cell: ({ row }) => (row.original.isActive ? "Yes" : "No"),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openEdit(row.original)}
              aria-label="Edit pricing rule"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteTarget(row.original)}
              aria-label="Delete pricing rule"
            >
              <Trash2 className="text-destructive h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <AdminPageShell
      title={t("pricing")}
      description="Configure ticket pricing rules by cinema, room type, day, and time."
      breadcrumbs={[{ label: t("title"), href: "/admin" }, { label: t("pricing") }]}
      actions={
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Rule
        </Button>
      }
    >
      <DataTable columns={columns} data={rules} searchPlaceholder="Search rules..." />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRule ? "Edit Rule" : "Add Rule"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="seatType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seat Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(["STANDARD", "VIP", "COUPLE", "DISABLED"] as SeatType[]).map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
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
                      <FormLabel>Day Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(["WEEKDAY", "WEEKEND", "HOLIDAY"] as DayType[]).map((d) => (
                            <SelectItem key={d} value={d}>
                              {d}
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
                      <FormLabel>Time Slot</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(["MORNING", "AFTERNOON", "EVENING", "NIGHT"] as TimeSlot[]).map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
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
                      <FormLabel>Room Format</FormLabel>
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
                    <FormLabel>Cinema (optional)</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="All cinemas" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">All cinemas</SelectItem>
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
                    <FormLabel>Price (₫)</FormLabel>
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
                    <FormLabel>Active</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingRule ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pricing Rule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this rule? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageShell>
  );
}
