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
import type { Room, RoomFormat } from "@/types/domain";
import {
  useAdminRooms,
  useAdminCinemas,
  useCreateRoom,
  useUpdateRoom,
  useDeleteRoom,
} from "@/hooks/queries/use-admin";
import { unwrapList } from "@/lib/admin-data";

const ALL_CINEMAS_VALUE = "__ALL_CINEMAS__";

type RoomFormValues = {
  name: string;
  cinemaId: string;
  format: "2D" | "3D" | "IMAX" | "4DX" | "DOLBY";
  totalSeats: number;
  rows: number;
  columns: number;
  isActive: boolean;
};

export default function AdminRoomsPage() {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const roomFormSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t("validation.nameRequired")),
        cinemaId: z.string().min(1, t("validation.cinemaRequired")),
        format: z.enum(["2D", "3D", "IMAX", "4DX", "DOLBY"]),
        totalSeats: z.coerce.number().min(0),
        rows: z.coerce.number().min(1),
        columns: z.coerce.number().min(1),
        isActive: z.boolean(),
      }),
    [t]
  );
  const [cinemaFilter, setCinemaFilter] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);

  const { data: roomsRes, isLoading: roomsLoading } = useAdminRooms(
    cinemaFilter ? { cinemaId: cinemaFilter } : undefined
  );
  const { data: cinemasRes } = useAdminCinemas();
  const rooms = unwrapList<Room>(roomsRes?.data ?? roomsRes);
  const cinemas = unwrapList<{ id: string; name: string }>(cinemasRes?.data ?? cinemasRes);
  const createMutation = useCreateRoom();
  const updateMutation = useUpdateRoom();
  const deleteMutation = useDeleteRoom();

  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      name: "",
      cinemaId: "",
      format: "2D",
      totalSeats: 0,
      rows: 1,
      columns: 1,
      isActive: true,
    },
  });

  function openCreate() {
    setEditingRoom(null);
    form.reset({
      name: "",
      cinemaId: cinemaFilter || "",
      format: "2D",
      totalSeats: 0,
      rows: 1,
      columns: 1,
      isActive: true,
    });
    setDialogOpen(true);
  }

  const openEdit = useCallback(
    (room: Room) => {
    setEditingRoom(room);
    form.reset({
      name: room.name,
      cinemaId: room.cinemaId,
      format: room.format,
      totalSeats: room.totalSeats,
      rows: room.rows,
      columns: room.columns,
      isActive: room.isActive,
    });
    setDialogOpen(true);
    },
    [form]
  );

  async function onSubmit(values: RoomFormValues) {
    if (editingRoom) {
      await updateMutation.mutateAsync({ ...values, id: editingRoom.id });
    } else {
      await createMutation.mutateAsync(values);
    }
    setDialogOpen(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync({ id: deleteTarget.id });
    setDeleteTarget(null);
  }

  const columns: ColumnDef<Room>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: t("colName"),
      },
      {
        id: "cinema",
        header: t("cinema"),
        cell: ({ row }) => row.original.cinemaName ?? row.original.cinemaId ?? "—",
      },
      {
        accessorKey: "format",
        header: t("labelFormat"),
      },
      {
        accessorKey: "totalSeats",
        header: t("colSeats"),
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
              aria-label={t("ariaEditRoom")}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteTarget(row.original)}
              aria-label={t("ariaDeleteRoom")}
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
      title={t("rooms")}
      description={t("descRooms")}
      breadcrumbs={[{ label: t("title"), href: "/admin" }, { label: t("rooms") }]}
      actions={
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t("addRoomBtn")}
        </Button>
      }
    >
      <div className="cinect-glass mb-4 rounded-lg border p-4">
        <Select
          value={cinemaFilter || ALL_CINEMAS_VALUE}
          onValueChange={(v) => setCinemaFilter(v === ALL_CINEMAS_VALUE ? "" : v)}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder={t("allCinemasFilter")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CINEMAS_VALUE}>{t("allCinemasFilter")}</SelectItem>
            {cinemas.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={rooms}
        searchKey="name"
        searchPlaceholder={t("searchRooms")}
        className="cinect-glass rounded-lg border p-4"
        isLoading={roomsLoading}
        emptyMessage={t("emptyRooms")}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="cinect-glass max-w-lg border">
          <DialogHeader>
            <DialogTitle>{editingRoom ? t("editRoom") : t("addRoom")}</DialogTitle>
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
                name="cinemaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("cinema")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectCinema")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
                name="format"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("labelFormat")}</FormLabel>
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
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="totalSeats"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("labelTotalSeats")}</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rows"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("labelRows")}</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="columns"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("labelColumns")}</FormLabel>
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
                  {editingRoom ? t("updateUserBtn") : tCommon("create")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="cinect-glass border">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteRoom")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteRoomDesc", { name: deleteTarget?.name ?? "" })}
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
