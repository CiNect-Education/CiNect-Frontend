"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
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
  Plus,
  Trash2,
  Download,
  Upload,
  Save,
  Eye,
  EyeOff,
  Accessibility,
  Grid3X3,
} from "lucide-react";
import { useAdminRooms, useAdminCinemas, useAdminRoomSeats, useUpdateRoomSeats, useImportRoomSeats } from "@/hooks/queries/use-admin";
import type { Seat, SeatType } from "@/types/domain";
import { cn } from "@/lib/utils";

type SeatCellType = SeatType | "WHEELCHAIR" | "AISLE";

interface GridCell {
  type: SeatCellType;
  seatId?: string;
  row: string;
  number: number;
}

const SEAT_TYPE_COLORS: Record<SeatCellType, string> = {
  STANDARD: "bg-blue-500/80 hover:bg-blue-500",
  VIP: "bg-amber-500/80 hover:bg-amber-500",
  COUPLE: "bg-pink-500/80 hover:bg-pink-500",
  DISABLED: "bg-gray-400/60",
  WHEELCHAIR: "bg-emerald-600/80 hover:bg-emerald-600",
  AISLE: "bg-transparent border border-dashed border-muted-foreground/30",
};

function buildGridFromSeats(
  seats: Seat[],
  rows: number,
  columns: number
): GridCell[][] {
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
    const rowIdx = seat.row.charCodeAt(0) - 65;
    const colIdx = seat.number - 1;
    if (rowIdx >= 0 && rowIdx < rows && colIdx >= 0 && colIdx < columns) {
      grid[rowIdx][colIdx] = {
        type: (seat.type === "STANDARD" || seat.type === "VIP" || seat.type === "COUPLE" || seat.type === "DISABLED" ? seat.type : "STANDARD") as SeatCellType,
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
  const [cinemaFilter, setCinemaFilter] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedType, setSelectedType] = useState<SeatCellType>("STANDARD");
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const dragStartRef = useRef<{ r: number; c: number } | null>(null);

  const { data: roomsRes } = useAdminRooms(cinemaFilter ? { cinemaId: cinemaFilter } : undefined);
  const { data: cinemasRes } = useAdminCinemas();
  const { data: seatsRes } = useAdminRoomSeats(roomId);
  const updateSeats = useUpdateRoomSeats();
  const importSeats = useImportRoomSeats();

  const rooms = roomsRes?.data ?? [];
  const cinemas = cinemasRes?.data ?? [];
  const seats = seatsRes?.data ?? [];
  const selectedRoom = rooms.find((r) => r.id === roomId);

  const [grid, setGrid] = useState<GridCell[][]>([]);

  const rows = selectedRoom?.rows ?? 0;
  const columns = selectedRoom?.columns ?? 0;

  useEffect(() => {
    if (roomId && rows > 0 && columns > 0) {
      setGrid(buildGridFromSeats(seats, rows, columns));
    } else {
      setGrid([]);
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
      const layout = JSON.parse(text);
      await importSeats.mutateAsync({ roomId, layout });
    };
    input.click();
  };

  return (
    <div>
      <PageHeader
        title={t("seats")}
        description="Design and manage seat maps for each screening room."
        breadcrumbs={[
          { label: t("title"), href: "/admin" },
          { label: t("seats") },
        ]}
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Seat Map Editor</CardTitle>
          <CardDescription>
            Select a cinema and room to view and edit the seat layout.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Select
              value={cinemaFilter || "all"}
              onValueChange={(v) => {
                setCinemaFilter(v === "all" ? "" : v);
                setRoomId("");
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Cinema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All cinemas</SelectItem>
                {cinemas.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={roomId}
              onValueChange={setRoomId}
              disabled={!cinemaFilter}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Room" />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {roomId && grid.length > 0 && (
            <>
              <div className="flex flex-wrap items-center gap-2 border-y py-3">
                <span className="text-sm font-medium">Toolbar:</span>
                <Select
                  value={selectedType}
                  onValueChange={(v) => setSelectedType(v as SeatCellType)}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(SEAT_TYPE_COLORS) as SeatCellType[]).map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={() => applyToSelected("type")}>
                  Change type
                </Button>
                <Button size="sm" variant="outline" onClick={() => applyToSelected("disable")}>
                  Disable
                </Button>
                <Button size="sm" variant="outline" onClick={() => applyToSelected("delete")}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={addRow}>
                  Add row
                </Button>
                <Button size="sm" variant="outline" onClick={addColumn}>
                  Add column
                </Button>
                <Button size="sm" variant="outline" onClick={handleExport}>
                  <Download className="mr-1 h-4 w-4" />
                  Export JSON
                </Button>
                <Button size="sm" variant="outline" onClick={handleImport}>
                  <Upload className="mr-1 h-4 w-4" />
                  Import JSON
                </Button>
                <div className="flex items-center gap-2 ml-4">
                  <Switch
                    id="preview"
                    checked={previewMode}
                    onCheckedChange={setPreviewMode}
                  />
                  <Label htmlFor="preview">Preview mode</Label>
                </div>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={updateSeats.isPending}
                >
                  <Save className="mr-1 h-4 w-4" />
                  Save
                </Button>
              </div>

              <div
                className="inline-flex flex-col gap-0.5 p-4 rounded-lg bg-muted/50"
                onMouseLeave={handleMouseUp}
                onMouseUp={handleMouseUp}
              >
                {grid.map((row, r) => (
                  <div key={r} className="flex gap-0.5 justify-center">
                    {row.map((cell, c) => {
                      const key = cellKey(r, c);
                      const isSelected = selectedCells.has(key);
                      const isAisle = cell.type === "AISLE";
                      const isPreview = previewMode;
                      return (
                        <button
                          key={key}
                          type="button"
                          className={cn(
                            "w-8 h-8 rounded flex items-center justify-center text-xs font-medium transition-colors border",
                            SEAT_TYPE_COLORS[cell.type],
                            isSelected && "ring-2 ring-primary ring-offset-2",
                            isAisle && "cursor-default",
                            !previewMode && !isAisle && "cursor-pointer"
                          )}
                          onMouseDown={!previewMode ? handleCellMouseDown(r, c) : undefined}
                          onMouseEnter={!previewMode ? handleCellMouseEnter(r, c) : undefined}
                        >
                          {cell.type === "WHEELCHAIR" ? (
                            <Accessibility className="h-4 w-4 text-white" />
                          ) : !isAisle && !previewMode ? (
                            cell.number
                          ) : isAisle ? null : (
                            <Armchair className="h-4 w-4 text-white/80" />
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
            <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
              No layout. Add rows/columns or import a layout.
            </div>
          )}

          {!roomId && (
            <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
              Select a cinema and room to load the seat map.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Seat Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6">
            {(Object.entries(SEAT_TYPE_COLORS) as [SeatCellType, string][]).map(
              ([type, color]) => (
                <div key={type} className="flex items-center gap-2 text-sm">
                  <div
                    className={cn(
                      "h-6 w-8 rounded border flex items-center justify-center",
                      color
                    )}
                  >
                    {type === "WHEELCHAIR" ? (
                      <Accessibility className="h-4 w-4 text-white" />
                    ) : type !== "AISLE" ? (
                      <Armchair className="h-4 w-4 text-white/80" />
                    ) : null}
                  </div>
                  <span>{type}</span>
                </div>
              )
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Click to select • Shift+click for range • Ctrl+click for multi-select •
            Drag to select rectangle
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
