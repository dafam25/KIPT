'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { paginate, totalPages, pageNumbersToShow } from '@/lib/table';

export interface DataTableColumn<T> {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  getRowKey: (row: T) => string;
  searchPlaceholder?: string;
  filterFn?: (row: T, query: string) => boolean;
  pageSize?: number;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  data,
  columns,
  getRowKey,
  searchPlaceholder = 'Cari...',
  filterFn,
  pageSize = 10,
  emptyMessage = 'Belum ada data',
  onRowClick,
}: DataTableProps<T>) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!filterFn || !query.trim()) return data;
    const q = query.trim().toLowerCase();
    return data.filter((row) => filterFn(row, q));
  }, [data, query, filterFn]);

  const pageCount = totalPages(filtered.length, pageSize);
  const pageSafe = Math.min(page, pageCount);
  const pageItems = paginate(filtered, pageSafe, pageSize);

  return (
    <div className="space-y-3">
      {filterFn && (
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder={searchPlaceholder}
            className="pl-9"
          />
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.header} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-8 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
            {pageItems.map((row) => (
              <TableRow
                key={getRowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={onRowClick ? 'cursor-pointer' : undefined}
              >
                {columns.map((col) => (
                  <TableCell key={col.header} className={col.className}>
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {pageCount > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Menampilkan {(pageSafe - 1) * pageSize + 1}-{Math.min(pageSafe * pageSize, filtered.length)} dari {filtered.length} data
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={pageSafe <= 1}
              onClick={() => setPage(pageSafe - 1)}
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {pageNumbersToShow(pageSafe, pageCount).map((p, i) =>
              p === '...' ? (
                <span key={`ellipsis-${i}`} className="px-1.5">
                  …
                </span>
              ) : (
                <Button
                  key={p}
                  variant={p === pageSafe ? 'default' : 'outline'}
                  size="icon-sm"
                  onClick={() => setPage(p)}
                  aria-current={p === pageSafe ? 'page' : undefined}
                >
                  {p}
                </Button>
              )
            )}
            <Button
              variant="outline"
              size="icon-sm"
              disabled={pageSafe >= pageCount}
              onClick={() => setPage(pageSafe + 1)}
              aria-label="Halaman berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
