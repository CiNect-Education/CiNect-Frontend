"use client";

import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  /** Page size for pagination. Default 10. Set high to effectively disable client-side pagination. */
  pageSize?: number;
  /** Hide pagination controls (e.g. when using server-side pagination) */
  hidePagination?: boolean;
  /** Loading state (renders skeleton rows + disables pagination) */
  isLoading?: boolean;
  /** Optional wrapper className */
  className?: string;
  /** Optional className for the table chrome wrapper */
  tableClassName?: string;
  /** Empty message when no rows match */
  emptyMessage?: string;
  /** Optional element to render on the right side of the toolbar */
  toolbarRight?: React.ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
  pageSize = 10,
  hidePagination = false,
  isLoading = false,
  className,
  tableClassName,
  emptyMessage = "No results.",
  toolbarRight,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    initialState: { pagination: { pageSize } },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
  });

  const filteredCount = table.getFilteredRowModel().rows.length;
  const totalCount = table.getCoreRowModel().rows.length;
  const hasActiveSearch =
    !!searchKey && String(table.getColumn(searchKey)?.getFilterValue() ?? "").trim().length > 0;

  const skeletonRows = useMemo(() => Array.from({ length: Math.min(8, pageSize) }), [pageSize]);

  return (
    <div className={cn("space-y-4", className)}>
      {(searchKey || toolbarRight) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-[220px] flex-1 items-center gap-2">
            {searchKey && (
              <div className="relative w-full max-w-md">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder={searchPlaceholder}
                  value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
                  onChange={(event) =>
                    table.getColumn(searchKey)?.setFilterValue(event.target.value)
                  }
                  className="pl-9"
                />
              </div>
            )}
            {!isLoading && (
              <div className="text-muted-foreground hidden text-sm sm:block">
                {hasActiveSearch ? (
                  <>
                    {filteredCount} / {totalCount} results
                  </>
                ) : (
                  <>{totalCount} items</>
                )}
              </div>
            )}
          </div>
          {toolbarRight ? <div className="flex items-center gap-2">{toolbarRight}</div> : null}
        </div>
      )}

      <div
        className={cn(
          "rounded-md border bg-background/40 backdrop-blur supports-[backdrop-filter]:bg-background/20",
          tableClassName
        )}
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              skeletonRows.map((_, idx) => (
                <TableRow key={`sk_${idx}`}>
                  {columns.map((_, cidx) => (
                    <TableCell key={`sk_${idx}_${cidx}`}>
                      <Skeleton className="h-4 w-[70%]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="text-muted-foreground text-sm">{emptyMessage}</div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {!hidePagination && (
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground text-sm">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={isLoading || !table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={isLoading || !table.getCanNextPage()}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
