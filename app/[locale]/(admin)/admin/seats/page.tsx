"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Armchair,
  Trash2,
  Download,
  Upload,
  Save,
  Accessibility,
} from "lucide-react";
import {
  useAdminRooms,
  useAdminCinemas,
  useAdminRoomSeats,
  useUpdateRoomSeats,
  useImportRoomSeats,
} from "@/hooks/queries/use-admin";
import type { Seat, SeatType } from "@/types/domain";
import { cn } from "@/lib/utils";
import { unwrapList } from "@/lib/admin-data";
import { useAuth } from "@/providers/auth-provider";
import { ApiErrorState } from "@/components/system/api-error-state";

type SeatCellType = SeatType | "WHEELCHAIR" | "AISLE";
const ALL_CINEMAS_VALUE = "__ALL_CINEMAS__";
const NO_ROOM_VALUE = "__NO_ROOM__";

interface GridCell {
  type: SeatCellType;
  seatId?: string;
  row: string;
  number: number;
}

function isSameGrid(a: GridCell[][], b: GridCell[][]): boolean {
  if (a.length !== b.length) return false;
  for (let r = 0; r < a.length; r++) {
    if (a[r].length !== b[r].length) return false;
    for (let c = 0; c < a[r].length; c++) {
      const x = a[r][c];
      const y = b[r][c];
      if (
        x.type !== y.type ||
        x.seatId !== y.seatId ||
        x.row !== y.row ||
        x.number !== y.number
      ) {
        return false;
      }
    }
  }
  return true;
}

const SEAT_TYPE_STYLES: Record<
  SeatCellType,
  { fill?: string; className: string; iconClassName?: string }
> = {
  STANDARD: { fill: "hsl(var(--chart-2))", className: "hover:opacity-95", iconClassName: "text-white/90" },
  VIP: { fill: "hsl(var(--primary))", className: "hover:opacity-95", iconClassName: "text-white/90" },
  COUPLE: { fill: "hsl(var(--chart-4))", className: "hover:opacity-95", iconClassName: "text-white/90" },
  DISABLED: { fill: "hsl(var(--muted-foreground) / 0.55)", className: "opacity-70 cursor-not-allowed", iconClassName: "text-white/80" },
  WHEELCHAIR: { fill: "hsl(var(--chart-3))", className: "hover:opacity-95", iconClassName: "text-white/90" },
  AISLE: { className: "bg-transparent border border-dashed border-muted-foreground/30" },
};

function buildGridFromSeats(seats: Seat[], rows: number, columns: number): GridCell[][] {
  const grid: GridCell[][] = [];
  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < columns; c++) {
      grid[r][c] = {
        type: "AISLE",
        row: String.fromCharCode(65 + r),
        number: c + 1,
      };
    }
  }
  for (const seat of seats) {
    const rowLabel =
      (seat as unknown as { row?: unknown; rowLabel?: unknown }).row ??
      (seat as unknown as { row?: unknown; rowLabel?: unknown }).rowLabel;
    const rowStr = typeof rowLabel === "string" ? rowLabel : "";
    if (!rowStr) continue;
    const rowIdx = rowStr.charCodeAt(0) - 65;
    const colIdx = seat.number - 1;
    if (rowIdx >= 0 && rowIdx < rows && colIdx >= 0 && colIdx < columns) {
      grid[rowIdx][colIdx] = {
        type: (seat.type === "STANDARD" ||
        seat.type === "VIP" ||
        seat.type === "COUPLE" ||
        seat.type === "DISABLED"
          ? seat.type
          : "STANDARD") as SeatCellType,
        seatId: seat.id,
        row: seat.row,
        number: seat.number,
      };
    }
  }
  return grid;
}

function gridToSeats(grid: GridCell[][], roomId: string): Partial<Seat>[] {
  const seats: Partial<Seat>[] = [];
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      const cell = grid[r][c];
      if (cell.type !== "AISLE") {
        const typeToSave = cell.type === "WHEELCHAIR" ? "DISABLED" : cell.type;
        seats.push({
          id: cell.seatId,
          roomId,
          row: String.fromCharCode(65 + r),
          number: c + 1,
          type: typeToSave,
          status: "AVAILABLE",
        });
      }
    }
  }
  return seats;
}

export default function AdminSeatsPage() {
  const t = useTranslations("admin");
  const tb = useTranslations("booking");
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [cinemaFilter, setCinemaFilter] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedType, setSelectedType] = useState<SeatCellType>("STANDARD");
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const dragStartRef = useRef<{ r: number; c: number } | null>(null);

  const {
    data: roomsRes,
    error: roomsError,
    refetch: refetchRooms,
  } = useAdminRooms(cinemaFilter ? { cinemaId: cinemaFilter } : undefined, {
    enabled: isAuthenticated && !authLoading,
  });
  const {
    data: cinemasRes,
    error: cinemasError,
    refetch: refetchCinemas,
  } = useAdminCinemas(undefined, { enabled: isAuthenticated && !authLoading });
  const {
    data: seatsRes,
    error: seatsError,
    refetch: refetchSeats,
  } = useAdminRoomSeats(roomId, {
    enabled: !!roomId && isAuthenticated && !authLoading,
  });
  const updateSeats = useUpdateRoomSeats();
  const importSeats = useImportRoomSeats();

  const rooms = unwrapList<{
    id: string;
    name: string;
    rows: number;
    columns: number;
    cinemaId?: string;
    cinemaName?: string;
  }>(roomsRes?.data ?? roomsRes);
  const cinemas = unwrapList<{ id: string; name: string }>(cinemasRes?.data ?? cinemasRes);
  const seatsRaw = unwrapList<Seat>(seatsRes?.data ?? seatsRes);
  const seats = useMemo(() => seatsRaw ?? [], [seatsRaw]);
  const selectedRoom = rooms.find((r) => r.id === roomId);

  const [grid, setGrid] = useState<GridCell[][]>([]);

  const rows = selectedRoom?.rows ?? 0;
  const columns = selectedRoom?.columns ?? 0;

  useEffect(() => {
    if (roomId && rows > 0 && columns > 0) {
      const next = buildGridFromSeats(seats, rows, columns);
      setGrid((prev) => (isSameGrid(prev, next) ? prev : next));
    } else {
      setGrid((prev) => (prev.length === 0 ? prev : []));
    }
  }, [roomId, rows, columns, seats]);

  const cellKey = (r: number, c: number) => `${r}-${c}`;

  const toggleCellSelection = useCallback(
    (r: number, c: number, shiftKey: boolean, ctrlKey: boolean) => {
      const key = cellKey(r, c);
      setSelectedCells((prev) => {
        const next = new Set(prev);
        if (ctrlKey) {
          if (next.has(key)) next.delete(key);
          else next.add(key);
        } else if (shiftKey && prev.size > 0) {
          const [first] = prev;
          const [fr, fc] = first.split("-").map(Number);
          const r1 = Math.min(fr, r);
          const r2 = Math.max(fr, r);
          const c1 = Math.min(fc, c);
          const c2 = Math.max(fc, c);
          for (let ri = r1; ri <= r2; ri++) {
            for (let ci = c1; ci <= c2; ci++) {
              next.add(cellKey(ri, ci));
            }
          }
        } else {
          next.clear();
          next.add(key);
        }
        return next;
      });
    },
    []
  );

  const handleCellMouseDown = (r: number, c: number) => (e: React.MouseEvent) => {
    dragStartRef.current = { r, c };
    toggleCellSelection(r, c, e.shiftKey, e.ctrlKey);
  };

  const handleCellMouseEnter = (r: number, c: number) => () => {
    if (dragStartRef.current) {
      const { r: r0, c: c0 } = dragStartRef.current;
      const r1 = Math.min(r0, r);
      const r2 = Math.max(r0, r);
      const c1 = Math.min(c0, c);
      const c2 = Math.max(c0, c);
      const next = new Set<string>();
      for (let ri = r1; ri <= r2; ri++) {
        for (let ci = c1; ci <= c2; ci++) {
          next.add(cellKey(ri, ci));
        }
      }
      setSelectedCells(next);
    }
  };

  const handleMouseUp = () => {
    dragStartRef.current = null;
  };

  const applyToSelected = (action: "type" | "disable" | "delete") => {
    if (selectedCells.size === 0) return;
    setGrid((prev) => {
      const next = prev.map((row) => row.map((cell) => ({ ...cell })));
      for (const key of selectedCells) {
        const [r, c] = key.split("-").map(Number);
        if (r >= 0 && r < next.length && c >= 0 && c < next[0].length) {
          if (action === "type") next[r][c].type = selectedType;
          else if (action === "disable") next[r][c].type = "DISABLED";
          else if (action === "delete") next[r][c].type = "AISLE";
        }
      }
      return next;
    });
  };

  const addRow = () => {
    setGrid((prev) => {
      const cols = prev[0]?.length ?? 0;
      const newRow: GridCell[] = Array.from({ length: cols }, (_, c) => ({
        type: "AISLE",
        row: String.fromCharCode(65 + prev.length),
        number: c + 1,
      }));
      return [...prev, newRow];
    });
  };

  const addColumn = () => {
    setGrid((prev) =>
      prev.map((row, r) => [
        ...row,
        {
          type: "AISLE" as SeatCellType,
          row: String.fromCharCode(65 + r),
          number: row.length + 1,
        },
      ])
    );
  };

  const handleSave = async () => {
    if (!roomId || grid.length === 0) return;
    const seatsToSave = gridToSeats(grid, roomId);
    await updateSeats.mutateAsync({ roomId, seats: seatsToSave });
  };

  const handleExport = () => {
    const layout = {
      rows: grid.length,
      columns: grid[0]?.length ?? 0,
      cells: grid.map((row, r) =>
        row.map((cell, c) => ({
          type: cell.type,
          row: String.fromCharCode(65 + r),
          number: c + 1,
        }))
      ),
    };
    const blob = new Blob([JSON.stringify(layout, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `room-${roomId}-layout.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !roomId) return;
      const text = await file.text();
      const layout = JSON.parse(text) as {
        cells?: Array<Array<{ type?: string; row?: string; number?: number }>>;
        rows?: number;
        columns?: number;
      };
      const seats =
        Array.isArray(layout.cells)
          ? layout.cells.flatMap((row, r) =>
              (Array.isArray(row) ? row : []).flatMap((cell, c) => {
                const type = String(cell?.type ?? "AISLE");
                if (type === "AISLE") return [];
                return [
                  {
                    row: String(cell?.row ?? String.fromCharCode(65 + r)),
                    number: Number(cell?.number ?? c + 1),
                    type: type === "WHEELCHAIR" ? "DISABLED" : type,
                    isAisle: false,
                  },
                ];
              })
            )
          : [];
      await importSeats.mutateAsync({ roomId, layout: { seats } });
    };
    input.click();
  };

  return (
    <AdminPageShell
      title={t("seats")}
      description={t("descSeats")}
      breadcrumbs={[{ label: t("title"), href: "/admin" }, { label: t("seats") }]}
    >
      {(cinemasError || roomsError || seatsError) ? (
        <ApiErrorState
          error={(seatsError ?? roomsError ?? cinemasError) as Error}
          onRetry={() => {
            void refetchCinemas();
            void refetchRooms();
            void refetchSeats();
          }}
          className="py-10"
        />
      ) : null}
      <Card className="cinect-glass mb-6 border">
        <CardHeader>
          <CardTitle className="text-lg">{t("seatMapEditorTitle")}</CardTitle>
          <CardDescription>{t("seatMapEditorDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Select
              value={cinemaFilter || ALL_CINEMAS_VALUE}
              onValueChange={(v) => {
                setCinemaFilter(v === ALL_CINEMAS_VALUE ? "" : v);
                setRoomId("");
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t("cinemaFilterPlaceholder")} />
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
            <Select
              value={roomId || NO_ROOM_VALUE}
              onValueChange={(v) => {
                const nextRoomId = v === NO_ROOM_VALUE ? "" : v;
                setRoomId(nextRoomId);
                if (!cinemaFilter && nextRoomId) {
                  const r = rooms.find((x) => x.id === nextRoomId);
                  if (r?.cinemaId) setCinemaFilter(r.cinemaId);
                }
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t("selectRoom")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_ROOM_VALUE}>{t("selectRoom")}</SelectItem>
                {rooms.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.cinemaName ? `${r.cinemaName} — ` : ""}
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {roomId && grid.length > 0 && (
            <>
              <div className="flex flex-wrap items-center gap-2 border-y py-3">
                <span className="text-sm font-medium">{t("seatsToolbar")}:</span>
                <Select
                  value={selectedType}
                  onValueChange={(v) => setSelectedType(v as SeatCellType)}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(SEAT_TYPE_STYLES) as SeatCellType[]).map((typeKey) => (
                      <SelectItem key={typeKey} value={typeKey}>
                        {typeKey === "STANDARD"
                          ? tb("standard")
                          : typeKey === "VIP"
                            ? tb("vip")
                            : typeKey === "COUPLE"
                              ? tb("couple")
                              : typeKey === "DISABLED"
                                ? tb("disabled")
                                : typeKey === "WHEELCHAIR"
                                  ? tb("wheelchair")
                                  : tb("aisle")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={() => applyToSelected("type")}>
                  {t("seatsChangeType")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => applyToSelected("disable")}>
                  {t("seatsDisable")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => applyToSelected("delete")}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={addRow}>
                  {t("seatsAddRow")}
                </Button>
                <Button size="sm" variant="outline" onClick={addColumn}>
                  {t("seatsAddColumn")}
                </Button>
                <Button size="sm" variant="outline" onClick={handleExport}>
                  <Download className="mr-1 h-4 w-4" />
                  {t("seatsExportJson")}
                </Button>
                <Button size="sm" variant="outline" onClick={handleImport}>
                  <Upload className="mr-1 h-4 w-4" />
                  {t("seatsImportJson")}
                </Button>
                <div className="ml-4 flex items-center gap-2">
                  <Switch id="preview" checked={previewMode} onCheckedChange={setPreviewMode} />
                  <Label htmlFor="preview">{t("previewMode")}</Label>
                </div>
                <Button size="sm" onClick={handleSave} disabled={updateSeats.isPending}>
                  <Save className="mr-1 h-4 w-4" />
                  {t("seatsSave")}
                </Button>
              </div>

              <div
                className="bg-muted/50 inline-flex flex-col gap-0.5 rounded-lg p-4"
                onMouseLeave={handleMouseUp}
                onMouseUp={handleMouseUp}
              >
                {grid.map((row, r) => (
                  <div key={r} className="flex justify-center gap-0.5">
                    {row.map((cell, c) => {
                      const key = cellKey(r, c);
                      const isSelected = selectedCells.has(key);
                      const isAisle = cell.type === "AISLE";
                      const styleDef = SEAT_TYPE_STYLES[cell.type];
                      return (
                        <button
                          key={key}
                          type="button"
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded border text-xs font-medium transition-colors",
                            styleDef.className,
                            isSelected && "ring-primary ring-2 ring-offset-2",
                            isAisle && "cursor-default",
                            !previewMode && !isAisle && "cursor-pointer"
                          )}
                          style={styleDef.fill ? { backgroundColor: styleDef.fill } : undefined}
                          onMouseDown={!previewMode ? handleCellMouseDown(r, c) : undefined}
                          onMouseEnter={!previewMode ? handleCellMouseEnter(r, c) : undefined}
                        >
                          {cell.type === "WHEELCHAIR" ? (
                            <Accessibility className={cn("h-4 w-4", styleDef.iconClassName ?? "text-white")} />
                          ) : !isAisle && !previewMode ? (
                            cell.number
                          ) : isAisle ? null : (
                            <Armchair className={cn("h-4 w-4", styleDef.iconClassName ?? "text-white/80")} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </>
          )}

          {roomId && (!selectedRoom || grid.length === 0) && (
            <div className="text-muted-foreground flex h-48 flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 text-center">
              <div>{t("seatsNoLayout")}</div>
              {selectedRoom && (rows <= 0 || columns <= 0) ? (
                <div className="text-xs">
                  Room này đang thiếu kích thước (rows/columns). Hãy vào Admin → Rooms và cập nhật rows/columns &gt; 0
                  rồi quay lại.
                </div>
              ) : null}
            </div>
          )}

          {!roomId && (
            <div className="text-muted-foreground flex h-48 items-center justify-center rounded-lg border border-dashed">
              {t("seatsSelectCinemaRoom")}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="cinect-glass border">
        <CardHeader>
          <CardTitle className="text-lg">{t("seatTypesTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6">
            {(Object.entries(SEAT_TYPE_STYLES) as [
              SeatCellType,
              { fill?: string; className: string; iconClassName?: string },
            ][]).map(([type, def]) => (
              <div key={type} className="flex items-center gap-2 text-sm">
                <div
                  className={cn("flex h-6 w-8 items-center justify-center rounded border", def.className)}
                  style={def.fill ? { backgroundColor: def.fill } : undefined}
                >
                  {type === "WHEELCHAIR" ? (
                    <Accessibility className={cn("h-4 w-4", def.iconClassName ?? "text-white")} />
                  ) : type !== "AISLE" ? (
                    <Armchair className={cn("h-4 w-4", def.iconClassName ?? "text-white/80")} />
                  ) : null}
                </div>
                <span>
                  {type === "STANDARD"
                    ? tb("standard")
                    : type === "VIP"
                      ? tb("vip")
                      : type === "COUPLE"
                        ? tb("couple")
                        : type === "DISABLED"
                          ? tb("disabled")
                          : type === "WHEELCHAIR"
                            ? tb("wheelchair")
                            : tb("aisle")}
                </span>
              </div>
            ))}
          </div>
          <p className="text-muted-foreground mt-2 text-xs">{t("seatsEditHint")}</p>
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
