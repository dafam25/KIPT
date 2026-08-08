# Nelayan + Kapal + Peta Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Nelayan, Kapal, and Peta Tracking modules (list + detail pages, dock-scheduling form, live fleet map) on top of the foundation shipped in the prior "Foundation + Dashboard" plan.

**Architecture:** Reuses the existing `DataContext`, `MapView`, `KpiCard`, and `TrendLineChart` components unmodified. Adds three new shared UI primitives (`StatusBadge`, `PageHeader`, `DataTable`) that every module page in this plan — and later plans — build on, plus per-vessel/per-fisherman aggregate helpers in `lib/stats.ts` following the existing pattern.

**Tech Stack:** Same as the foundation plan (Next.js 16, TypeScript, Tailwind v4, shadcn/ui, Recharts, react-leaflet) plus `html-to-image` for the ID card PNG export.

## Global Constraints

- No authentication, no backend/database — all data continues to flow through the existing `DataContext` (session-only mutations).
- All currency/number/date display goes through `lib/format.ts` (`formatRupiah`, `formatNumber`, `formatDate`, `formatPercent`) — never inline `Intl` calls or ad-hoc string formatting.
- Detail pages handle an unknown ID with a "data tidak ditemukan" state and a link back to the list, not a crash.
- New KPI cards introduced in this plan omit `deltaPercent`/`deltaLabel` (no fabricated trend data) — Plan 1's dashboard KPIs kept the mockup's decorative deltas by an earlier explicit human ruling specific to that page; new pages in this plan don't repeat that pattern since there's no equivalent mockup precedent forcing it here.
- Simplifications from the original mockup, agreed for this "simplified v1" pass:
  - `/kapal` ships the table + top KPI row only — the mockup's extra composition/GT/status donut side-panels are skipped for now.
  - `/kapal/jadwal-sandar`'s "timeline" is a sorted table (Dermaga, Kapal, Tanggal, Waktu Tiba, Durasi, Prioritas), not the mockup's visual Gantt/hour-grid.
  - `/peta-tracking` ships the map + fleet KPI row + searchable vessel list — the mockup's separate "Aktivitas Terbaru" feed and per-vessel movement timeline are deferred.
  - No "Edit Data" action on `/nelayan/[id]` in this pass — only "Unduh ID Card" (explicitly spec'd) ships as a working action.
- Automated tests are written only for `lib/` utilities (pure logic); pages/components are verified manually via the dev server, consistent with the foundation plan's testing approach.
- Node.js/npm may not be on the shell's default PATH in the execution environment — implementers should prepend `/c/Program Files/nodejs` to `PATH` if `npm`/`npx` aren't found directly.

---

### Task 1: Extend mock data and DataContext with `JadwalSandar`

**Files:**
- Modify: `scripts/seed-mock-data.ts`
- Create: `lib/mock-data/jadwal-sandar.ts` (generated output, committed)
- Modify: `context/data-context.tsx`

**Interfaces:**
- Consumes: `JadwalSandar` type from `lib/types.ts` (already defined), `kapalData` (already generated).
- Produces: `export const jadwalSandarData: JadwalSandar[]` from `lib/mock-data/jadwal-sandar.ts`; `useData()` gains `jadwalSandar: JadwalSandar[]` and `addJadwalSandar: (j: JadwalSandar) => void` — used by Task 12's dock-scheduling page.

- [ ] **Step 1: Add `JadwalSandar` generation to the seed script**

Edit `scripts/seed-mock-data.ts`. Change the type import on line 6 to also import `JadwalSandar`:

```ts
import type { Kapal, Nelayan, HasilTangkap, Koperasi, PasarIndustri, Notifikasi, JadwalSandar } from '../types';
```

Add a `DERMAGA` constant near the other constants (after `PELABUHAN` on line 13):

```ts
const DERMAGA = ['Dermaga 01', 'Dermaga 02', 'Dermaga 03'];
```

Add the `jadwalSandarData` generator after the `notifikasiData` block (after line 112, before the `writeModule` function):

```ts
const jadwalSandarData: JadwalSandar[] = Array.from({ length: 20 }, () => {
  const kapal = faker.helpers.arrayElement(kapalData);
  const jam = faker.number.int({ min: 6, max: 20 });
  return {
    id: faker.string.uuid(),
    kapalId: kapal.id,
    tanggal: faker.date.soon({ days: 14, refDate: SEED_DATE }).toISOString().slice(0, 10),
    dermaga: faker.helpers.arrayElement(DERMAGA),
    waktuTiba: `${String(jam).padStart(2, '0')}:${faker.helpers.arrayElement(['00', '15', '30', '45'])}`,
    durasiJam: faker.number.int({ min: 2, max: 6 }),
    prioritas: faker.helpers.arrayElement(['Rendah', 'Normal', 'Normal', 'Tinggi']),
  };
});
```

Add the corresponding `writeModule` call after line 126 (`writeModule('notifikasi.ts', ...)`):

```ts
writeModule('jadwal-sandar.ts', 'jadwalSandarData', 'JadwalSandar', jadwalSandarData);
```

- [ ] **Step 2: Regenerate mock data**

```bash
npm run seed
```

Expected: console logs a 7th "Wrote ..." line for `lib/mock-data/jadwal-sandar.ts`, and the other 6 files are byte-identical to before (same `SEED_DATE`, same faker call order up to the new generator — verify with `git diff --stat` showing only `jadwal-sandar.ts` as new and no changes to the other 6 mock-data files).

- [ ] **Step 3: Wire `jadwalSandar` into `DataContext`**

Edit `context/data-context.tsx`:

Add the import after line 9 (`import { notifikasiData } ...`):

```ts
import { jadwalSandarData } from '@/lib/mock-data/jadwal-sandar';
```

Add `JadwalSandar` to the type import on line 10:

```ts
import type { Nelayan, Kapal, HasilTangkap, Koperasi, PasarIndustri, Notifikasi, JadwalSandar } from '@/lib/types';
```

Add to the `DataContextValue` interface (after `notifikasi: Notifikasi[];` on line 18):

```ts
  jadwalSandar: JadwalSandar[];
```

Add to the interface's method list (after `addHasilTangkap: (h: HasilTangkap) => void;` on line 21):

```ts
  addJadwalSandar: (j: JadwalSandar) => void;
```

Add state (after line 34, `const [notifikasi, setNotifikasi] = ...`):

```ts
  const [jadwalSandar, setJadwalSandar] = useState<JadwalSandar[]>(jadwalSandarData);
```

Add the mutator (after the `addHasilTangkap` callback on line 38):

```ts
  const addJadwalSandar = useCallback((j: JadwalSandar) => setJadwalSandar((prev) => [j, ...prev]), []);
```

Add `jadwalSandar` and `addJadwalSandar` to both the `value` object literal and its `useMemo` dependency array (mirroring exactly how `hasilTangkap`/`addHasilTangkap` already appear in both places).

- [ ] **Step 4: Verify**

```bash
npx tsc --noEmit
npm test
npm run build
```

Expected: no type errors, all existing tests still pass, build succeeds.

- [ ] **Step 5: Commit**

```bash
git add scripts/seed-mock-data.ts lib/mock-data/jadwal-sandar.ts context/data-context.tsx
git commit -m "Add JadwalSandar mock data and wire it into DataContext"
```

---

### Task 2: Pagination helpers (`lib/table.ts`)

**Files:**
- Create: `lib/table.ts`
- Test: `lib/table.test.ts`

**Interfaces:**
- Produces: `paginate<T>(data: T[], page: number, pageSize: number): T[]`, `totalPages(itemCount: number, pageSize: number): number` — used by Task 6's `DataTable` component.

- [ ] **Step 1: Write the failing tests**

```ts
// lib/table.test.ts
import { describe, it, expect } from 'vitest';
import { paginate, totalPages } from './table';

describe('paginate', () => {
  it('returns the first page slice', () => {
    expect(paginate([1, 2, 3, 4, 5], 1, 2)).toEqual([1, 2]);
  });

  it('returns the second page slice', () => {
    expect(paginate([1, 2, 3, 4, 5], 2, 2)).toEqual([3, 4]);
  });

  it('returns a partial final page', () => {
    expect(paginate([1, 2, 3, 4, 5], 3, 2)).toEqual([5]);
  });

  it('returns an empty array for a page beyond the data', () => {
    expect(paginate([1, 2, 3], 5, 2)).toEqual([]);
  });
});

describe('totalPages', () => {
  it('rounds up to cover a partial last page', () => {
    expect(totalPages(5, 2)).toBe(3);
  });

  it('returns 1 for an empty list, never 0', () => {
    expect(totalPages(0, 10)).toBe(1);
  });

  it('returns 1 when everything fits on one page', () => {
    expect(totalPages(4, 10)).toBe(1);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- table`
Expected: FAIL — `./table` module not found.

- [ ] **Step 3: Implement**

```ts
// lib/table.ts
export function paginate<T>(data: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return data.slice(start, start + pageSize);
}

export function totalPages(itemCount: number, pageSize: number): number {
  return Math.max(1, Math.ceil(itemCount / pageSize));
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- table`
Expected: all 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/table.ts lib/table.test.ts
git commit -m "Add pagination helpers for the shared DataTable component"
```

---

### Task 3: Per-vessel/per-fisherman aggregate stats

**Files:**
- Modify: `lib/stats.ts`
- Modify: `lib/stats.test.ts`

**Interfaces:**
- Consumes: `HasilTangkap[]`, `Kapal[]` from `lib/types.ts`.
- Produces: `hasilTangkapForKapal(kapalId: string, list: HasilTangkap[]): HasilTangkap[]`, `totalJamMelaut(list: HasilTangkap[]): number`, `totalNilaiTangkapan(list: HasilTangkap[]): number`, `rataRataPerTripKg(list: HasilTangkap[]): number`, `kapalSandarCount(list: Kapal[]): number`, `kapalTidakAktifCount(list: Kapal[]): number` — used by Task 8 (nelayan detail), Task 11 (kapal detail), and Task 13 (peta tracking).

- [ ] **Step 1: Write the failing tests**

Append to `lib/stats.test.ts`:

```ts
import {
  hasilTangkapForKapal, totalJamMelaut, totalNilaiTangkapan, rataRataPerTripKg,
  kapalSandarCount, kapalTidakAktifCount,
} from './stats';

const hasilTangkapDenganWaktu: HasilTangkap[] = [
  {
    id: '1', kapalId: 'KAP-1', tanggal: '2025-05-10',
    waktuMulai: '06:00', waktuSelesai: '12:30',
    jenisIkan: [{ nama: 'Ikan Tongkol', beratKg: 100, jumlahEkor: 10, kondisi: 'Segar' }],
    estimasiNilai: 2_500_000,
  } as HasilTangkap,
  {
    id: '2', kapalId: 'KAP-1', tanggal: '2025-05-11',
    waktuMulai: '05:00', waktuSelesai: '09:00',
    jenisIkan: [{ nama: 'Ikan Cakalang', beratKg: 50, jumlahEkor: 5, kondisi: 'Segar' }],
    estimasiNilai: 1_250_000,
  } as HasilTangkap,
  {
    id: '3', kapalId: 'KAP-2', tanggal: '2025-05-11',
    waktuMulai: '06:00', waktuSelesai: '10:00',
    jenisIkan: [{ nama: 'Ikan Tongkol', beratKg: 30, jumlahEkor: 3, kondisi: 'Segar' }],
    estimasiNilai: 750_000,
  } as HasilTangkap,
];

const kapalBerbagaiStatus: Kapal[] = [
  { id: 'KAP-1', status: 'melaut' } as Kapal,
  { id: 'KAP-2', status: 'sandar' } as Kapal,
  { id: 'KAP-3', status: 'sandar' } as Kapal,
  { id: 'KAP-4', status: 'tidak_aktif' } as Kapal,
];

describe('hasilTangkapForKapal', () => {
  it('filters to only the given kapal', () => {
    const result = hasilTangkapForKapal('KAP-1', hasilTangkapDenganWaktu);
    expect(result.map((h) => h.id)).toEqual(['1', '2']);
  });
});

describe('totalJamMelaut', () => {
  it('sums hours between waktuMulai and waktuSelesai', () => {
    const kap1 = hasilTangkapForKapal('KAP-1', hasilTangkapDenganWaktu);
    expect(totalJamMelaut(kap1)).toBeCloseTo(6.5 + 4, 5);
  });
});

describe('totalNilaiTangkapan', () => {
  it('sums estimasiNilai', () => {
    const kap1 = hasilTangkapForKapal('KAP-1', hasilTangkapDenganWaktu);
    expect(totalNilaiTangkapan(kap1)).toBe(3_750_000);
  });
});

describe('rataRataPerTripKg', () => {
  it('divides total kg by trip count', () => {
    const kap1 = hasilTangkapForKapal('KAP-1', hasilTangkapDenganWaktu);
    expect(rataRataPerTripKg(kap1)).toBe(75);
  });

  it('returns 0 for an empty list', () => {
    expect(rataRataPerTripKg([])).toBe(0);
  });
});

describe('kapalSandarCount', () => {
  it('counts only sandar status', () => {
    expect(kapalSandarCount(kapalBerbagaiStatus)).toBe(2);
  });
});

describe('kapalTidakAktifCount', () => {
  it('counts only tidak_aktif status', () => {
    expect(kapalTidakAktifCount(kapalBerbagaiStatus)).toBe(1);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- stats`
Expected: FAIL — the new function names are not exported from `./stats`.

- [ ] **Step 3: Implement**

Append to `lib/stats.ts`:

```ts
export function hasilTangkapForKapal(kapalId: string, list: HasilTangkap[]): HasilTangkap[] {
  return list.filter((h) => h.kapalId === kapalId);
}

function jamFromRange(waktuMulai: string, waktuSelesai: string): number {
  const [mulaiH, mulaiM] = waktuMulai.split(':').map(Number);
  const [selesaiH, selesaiM] = waktuSelesai.split(':').map(Number);
  return (selesaiH * 60 + selesaiM - (mulaiH * 60 + mulaiM)) / 60;
}

export function totalJamMelaut(list: HasilTangkap[]): number {
  return list.reduce((sum, h) => sum + jamFromRange(h.waktuMulai, h.waktuSelesai), 0);
}

export function totalNilaiTangkapan(list: HasilTangkap[]): number {
  return list.reduce((sum, h) => sum + h.estimasiNilai, 0);
}

export function rataRataPerTripKg(list: HasilTangkap[]): number {
  if (list.length === 0) return 0;
  return totalHasilTangkapKg(list) / list.length;
}

export function kapalSandarCount(list: Kapal[]): number {
  return list.filter((k) => k.status === 'sandar').length;
}

export function kapalTidakAktifCount(list: Kapal[]): number {
  return list.filter((k) => k.status === 'tidak_aktif').length;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- stats`
Expected: all stats tests pass (existing + 8 new).

- [ ] **Step 5: Commit**

```bash
git add lib/stats.ts lib/stats.test.ts
git commit -m "Add per-vessel aggregate stats for nelayan/kapal detail pages"
```

---

### Task 4: `StatusBadge` component

**Files:**
- Create: `components/shared/status-badge.tsx`

**Interfaces:**
- Consumes: `Badge` from `components/ui/badge.tsx` (accepts `variant` and `className`).
- Produces: `<StatusBadge label={string} tone="success"|"warning"|"destructive"|"info"|"muted" />` — used by Task 7 (nelayan list), Task 10 (kapal list), Task 11 (kapal detail), Task 13 (peta tracking).

- [ ] **Step 1: Implement**

```tsx
// components/shared/status-badge.tsx
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type StatusTone = 'success' | 'warning' | 'destructive' | 'info' | 'muted';

const TONE_CLASSES: Record<StatusTone, string> = {
  success: 'bg-success/20 text-success border-success/30',
  warning: 'bg-warning/20 text-warning border-warning/30',
  destructive: 'bg-destructive/20 text-destructive border-destructive/30',
  info: 'bg-primary/20 text-primary border-primary/30',
  muted: 'bg-muted text-muted-foreground border-border',
};

export function StatusBadge({ label, tone }: { label: string; tone: StatusTone }) {
  return (
    <Badge variant="outline" className={cn('font-normal', TONE_CLASSES[tone])}>
      {label}
    </Badge>
  );
}
```

- [ ] **Step 2: Verify visually**

Temporarily render `<StatusBadge label="Aktif" tone="success" />`, `<StatusBadge label="Sandar" tone="warning" />`, `<StatusBadge label="Tidak Aktif" tone="destructive" />` on the dashboard placeholder area (or any existing page temporarily), run `npm run dev`, confirm each renders with a distinctly colored pill matching its tone. Remove the temporary render afterward.

- [ ] **Step 3: Commit**

```bash
git add components/shared/status-badge.tsx
git commit -m "Add StatusBadge shared component"
```

---

### Task 5: `PageHeader` component

**Files:**
- Create: `components/shared/page-header.tsx`

**Interfaces:**
- Consumes: `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbPage`, `BreadcrumbSeparator` from `components/ui/breadcrumb.tsx`.
- Produces: `<PageHeader crumbs={{ label: string; href?: string }[]} title={string} description?={string} actions?={ReactNode} />` — used by every list/detail page in this plan.

- [ ] **Step 1: Implement**

```tsx
// components/shared/page-header.tsx
import { Fragment, type ReactNode } from 'react';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export interface PageHeaderCrumb {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  crumbs: PageHeaderCrumb[];
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ crumbs, title, description, actions }: PageHeaderProps) {
  return (
    <div className="space-y-3">
      <Breadcrumb>
        <BreadcrumbList>
          {crumbs.map((crumb, i) => (
            <Fragment key={crumb.label}>
              <BreadcrumbItem>
                {crumb.href ? (
                  <Link href={crumb.href} className="transition-colors hover:text-foreground">
                    {crumb.label}
                  </Link>
                ) : (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {i < crumbs.length - 1 && <BreadcrumbSeparator />}
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
```

Note: this intentionally uses a plain `<Link>` instead of the shadcn `BreadcrumbLink` primitive — `BreadcrumbLink` is built on `@base-ui/react`'s polymorphic `render` prop, whose exact composition syntax for wrapping a Next.js `Link` isn't established elsewhere in this codebase. A plain styled `Link` inside `BreadcrumbItem` renders identically and avoids depending on an unverified API pattern.

- [ ] **Step 2: Verify visually**

Temporarily render:
```tsx
<PageHeader
  crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Nelayan' }]}
  title="Nelayan"
  description="Kelola data nelayan terdaftar"
/>
```
on any existing page, run `npm run dev`, confirm the breadcrumb shows "Dashboard / Nelayan" with "Dashboard" as a clickable link and "Nelayan" as plain text, and the title/description render below it. Remove the temporary render afterward.

- [ ] **Step 3: Commit**

```bash
git add components/shared/page-header.tsx
git commit -m "Add PageHeader shared component"
```

---

### Task 6: `DataTable` component

**Files:**
- Create: `components/shared/data-table.tsx`

**Interfaces:**
- Consumes: `paginate`, `totalPages` from `lib/table.ts` (Task 2); `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` from `components/ui/table.tsx`; `Input` from `components/ui/input.tsx`; `Button` from `components/ui/button.tsx`.
- Produces: `<DataTable data={T[]} columns={DataTableColumn<T>[]} getRowKey={(row: T) => string} searchPlaceholder?={string} filterFn?={(row: T, query: string) => boolean} pageSize?={number} emptyMessage?={string} onRowClick?={(row: T) => void} />` and the exported `DataTableColumn<T>` type (`{ header: string; cell: (row: T) => ReactNode; className?: string }`) — used by Task 7 (nelayan list), Task 10 (kapal list), Task 12 (jadwal sandar timeline table), Task 13 (peta tracking vessel list).

- [ ] **Step 1: Implement**

```tsx
// components/shared/data-table.tsx
'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { paginate, totalPages } from '@/lib/table';

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
            Halaman {pageSafe} dari {pageCount} ({filtered.length} data)
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={pageSafe <= 1} onClick={() => setPage(pageSafe - 1)}>
              Sebelumnya
            </Button>
            <Button variant="outline" size="sm" disabled={pageSafe >= pageCount} onClick={() => setPage(pageSafe + 1)}>
              Berikutnya
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify visually**

Temporarily render on any page (inside `DataProvider`):
```tsx
<DataTable
  data={[{ id: '1', nama: 'Budi' }, { id: '2', nama: 'Andi' }]}
  columns={[{ header: 'ID', cell: (r) => r.id }, { header: 'Nama', cell: (r) => r.nama }]}
  getRowKey={(r) => r.id}
  searchPlaceholder="Cari nama..."
  filterFn={(r, q) => r.nama.toLowerCase().includes(q)}
/>
```
Run `npm run dev`, confirm: table renders both rows, typing "andi" in the search box filters to one row, and with only 2 rows the pagination controls are correctly hidden (pageCount is 1). Remove the temporary render afterward.

- [ ] **Step 3: Commit**

```bash
git add components/shared/data-table.tsx
git commit -m "Add generic DataTable shared component with search and pagination"
```

---

### Task 7: Nelayan list page

**Files:**
- Create: `app/(dashboard)/nelayan/page.tsx`

**Interfaces:**
- Consumes: `useData()` (`nelayan`, `koperasi`, `kapal`), `PageHeader`, `DataTable`, `StatusBadge`, `formatDate` from `lib/format.ts`.
- Produces: the `/nelayan` route.

- [ ] **Step 1: Implement**

```tsx
// app/(dashboard)/nelayan/page.tsx
'use client';

import Link from 'next/link';
import { useData } from '@/context/data-context';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import type { Nelayan } from '@/lib/types';
import { formatDate } from '@/lib/format';

export default function NelayanListPage() {
  const { nelayan, koperasi, kapal } = useData();

  const columns: DataTableColumn<Nelayan>[] = [
    { header: 'ID', cell: (n) => <span className="font-mono text-xs">{n.id}</span> },
    {
      header: 'Nama',
      cell: (n) => (
        <Link href={`/nelayan/${n.id}`} className="font-medium text-primary hover:underline">
          {n.nama}
        </Link>
      ),
    },
    { header: 'Koperasi', cell: (n) => koperasi.find((k) => k.id === n.koperasiId)?.nama ?? '-' },
    { header: 'Kapal', cell: (n) => kapal.find((k) => k.id === n.kapalId)?.nama ?? '-' },
    { header: 'Bergabung', cell: (n) => formatDate(n.tanggalBergabung) },
    {
      header: 'Status',
      cell: (n) => (
        <StatusBadge
          label={n.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
          tone={n.status === 'aktif' ? 'success' : 'muted'}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Nelayan' }]}
        title="Nelayan"
        description="Kelola data nelayan terdaftar"
      />
      <DataTable
        data={nelayan}
        columns={columns}
        getRowKey={(n) => n.id}
        searchPlaceholder="Cari nama atau ID nelayan..."
        filterFn={(n, q) => n.nama.toLowerCase().includes(q) || n.id.toLowerCase().includes(q)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify against real data**

Run `npm run dev`, visit `/nelayan`, confirm: 60 seeded nelayan appear across paginated pages (10 per page → 6 pages), each row's Koperasi/Kapal columns show real names (not "-") for records with a valid `koperasiId`/`kapalId`, searching by a real nelayan's name (e.g. take one from `lib/mock-data/nelayan.ts`) narrows the table to that row, and clicking a name navigates to `/nelayan/<id>` (will 404 until Task 8 exists — that's expected for now).

- [ ] **Step 3: Commit**

```bash
git add "app/(dashboard)/nelayan/page.tsx"
git commit -m "Add Nelayan list page"
```

---

### Task 8: Nelayan detail page

**Files:**
- Create: `app/(dashboard)/nelayan/[id]/page.tsx`

**Interfaces:**
- Consumes: `useData()`, `PageHeader`, `TrendLineChart` from `components/dashboard/trend-line-chart.tsx`, `hasilTangkapForKapal`/`totalJamMelaut`/`totalNilaiTangkapan`/`rataRataPerTripKg`/`totalHasilTangkapKg`/`trenHasilTangkapHarian` from `lib/stats.ts`, `formatDate`/`formatNumber`/`formatRupiah` from `lib/format.ts`.
- Produces: the `/nelayan/[id]` route.

- [ ] **Step 1: Implement**

```tsx
// app/(dashboard)/nelayan/[id]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useData } from '@/context/data-context';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendLineChart } from '@/components/dashboard/trend-line-chart';
import {
  hasilTangkapForKapal, totalJamMelaut, totalNilaiTangkapan, rataRataPerTripKg,
  totalHasilTangkapKg, trenHasilTangkapHarian,
} from '@/lib/stats';
import { formatDate, formatNumber, formatRupiah } from '@/lib/format';

export default function NelayanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { nelayan, koperasi, kapal, hasilTangkap } = useData();

  const orang = nelayan.find((n) => n.id === id);

  if (!orang) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Data nelayan tidak ditemukan.</p>
        <Button variant="outline" onClick={() => router.push('/nelayan')}>
          Kembali ke Daftar Nelayan
        </Button>
      </div>
    );
  }

  const koperasiNelayan = koperasi.find((k) => k.id === orang.koperasiId);
  const kapalNelayan = kapal.find((k) => k.id === orang.kapalId);
  const trips = kapalNelayan ? hasilTangkapForKapal(kapalNelayan.id, hasilTangkap) : [];
  const sortedTrips = [...trips].sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  const terakhir = sortedTrips[0];

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Nelayan', href: '/nelayan' },
          { label: orang.nama },
        ]}
        title="Detail Nelayan ID"
      />

      <Card>
        <CardContent className="grid gap-6 p-6 md:grid-cols-[auto_1fr]">
          <img
            src={orang.fotoUrl || 'https://placehold.co/120x120?text=Foto'}
            alt={orang.nama}
            className="h-28 w-28 rounded-lg object-cover"
          />
          <div className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
            <div><span className="text-muted-foreground">ID Nelayan</span><p className="font-medium">{orang.id}</p></div>
            <div><span className="text-muted-foreground">Nama</span><p className="font-medium">{orang.nama}</p></div>
            <div><span className="text-muted-foreground">Tempat, Tanggal Lahir</span><p className="font-medium">{orang.tempatLahir}, {formatDate(orang.tanggalLahir)}</p></div>
            <div><span className="text-muted-foreground">Alamat</span><p className="font-medium">{orang.alamat}</p></div>
            <div><span className="text-muted-foreground">No. KTP</span><p className="font-medium">{orang.nik}</p></div>
            <div><span className="text-muted-foreground">No. HP</span><p className="font-medium">{orang.noHp}</p></div>
            <div><span className="text-muted-foreground">Tanggal Bergabung</span><p className="font-medium">{formatDate(orang.tanggalBergabung)}</p></div>
            <div><span className="text-muted-foreground">Koperasi</span><p className="font-medium">{koperasiNelayan?.nama ?? '-'}</p></div>
            <div><span className="text-muted-foreground">Pendamping / Penyuluh</span><p className="font-medium">{orang.pendamping}</p></div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="text-sm font-semibold">Ringkasan Aktivitas</CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-muted-foreground">Total Melaut</p><p className="text-lg font-semibold">{formatNumber(trips.length)} trip</p></div>
            <div><p className="text-muted-foreground">Aktivitas Terakhir</p><p className="text-lg font-semibold">{terakhir ? formatDate(terakhir.tanggal) : '-'}</p></div>
            <div><p className="text-muted-foreground">Total Jam Melaut</p><p className="text-lg font-semibold">{formatNumber(totalJamMelaut(trips))} jam</p></div>
            <div><p className="text-muted-foreground">Total Hasil Tangkap</p><p className="text-lg font-semibold">{formatNumber(totalHasilTangkapKg(trips))} kg</p></div>
            <div><p className="text-muted-foreground">Estimasi Nilai Tangkap</p><p className="text-lg font-semibold">{formatRupiah(totalNilaiTangkapan(trips))}</p></div>
            <div><p className="text-muted-foreground">Rata-rata / Trip</p><p className="text-lg font-semibold">{formatNumber(Math.round(rataRataPerTripKg(trips)))} kg</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="text-sm font-semibold">Kapal yang Digunakan</CardHeader>
          <CardContent className="text-sm">
            {kapalNelayan ? (
              <div className="space-y-1">
                <Link href={`/kapal/${kapalNelayan.id}`} className="font-medium text-primary hover:underline">
                  {kapalNelayan.nama}
                </Link>
                <p className="text-muted-foreground">ID Kapal: {kapalNelayan.id}</p>
                <p className="text-muted-foreground">Jenis: {kapalNelayan.jenis}</p>
                <p className="text-muted-foreground">GT / Ukuran: {kapalNelayan.gt} GT</p>
                <p className="text-muted-foreground">Pelabuhan Induk: {kapalNelayan.pelabuhanInduk}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">Belum ada kapal terkait.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="text-sm font-semibold">Grafik Hasil Tangkapan</CardHeader>
        <CardContent>
          <TrendLineChart data={trenHasilTangkapHarian(trips)} />
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Verify against real data**

Run `npm run dev`. Visit `/nelayan/<a real seeded ID from lib/mock-data/nelayan.ts>` — confirm all fields populate correctly, the "Kapal yang Digunakan" card shows the linked vessel and its link navigates to `/kapal/<id>` (will 404 until Task 11 — expected for now), and the trend chart renders (may be empty/flat if that vessel happens to have few catches, which is correct behavior, not a bug). Then visit `/nelayan/NOT-A-REAL-ID` and confirm the "tidak ditemukan" state renders with a working "Kembali" button instead of crashing.

- [ ] **Step 3: Commit**

```bash
git add "app/(dashboard)/nelayan/[id]/page.tsx"
git commit -m "Add Nelayan detail page"
```

---

### Task 9: ID Card component and download button

**Files:**
- Create: `components/nelayan/id-card.tsx`
- Create: `components/nelayan/id-card-download-button.tsx`
- Modify: `app/(dashboard)/nelayan/[id]/page.tsx`

**Interfaces:**
- Consumes: `Nelayan` type; `html-to-image`'s `toPng`.
- Produces: `<IdCard nelayan={Nelayan} koperasiNama?={string} kapalNama?={string} />`, `<IdCardDownloadButton nelayan={Nelayan} koperasiNama?={string} kapalNama?={string} />` — the latter is wired into the nelayan detail page's `PageHeader` actions slot.

- [ ] **Step 1: Install html-to-image**

```bash
npm install html-to-image
```

- [ ] **Step 2: Build the visual ID card**

```tsx
// components/nelayan/id-card.tsx
import type { Nelayan } from '@/lib/types';

export interface IdCardProps {
  nelayan: Nelayan;
  koperasiNama?: string;
  kapalNama?: string;
}

export function IdCard({ nelayan, koperasiNama, kapalNama }: IdCardProps) {
  return (
    <div className="w-80 rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950 p-5 text-white">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
        <span className="h-2 w-2 rounded-full bg-blue-400" />
        Nelayan ID
      </div>
      <div className="flex items-center gap-3">
        <img
          src={nelayan.fotoUrl || 'https://placehold.co/64x64?text=Foto'}
          alt={nelayan.nama}
          className="h-16 w-16 rounded-full object-cover"
        />
        <div>
          <p className="text-xs text-slate-300">{nelayan.id}</p>
          <p className="text-lg font-semibold">{nelayan.nama}</p>
        </div>
      </div>
      <div className="mt-4 space-y-2 text-sm">
        <p><span className="text-slate-400">Koperasi</span><br />{koperasiNama ?? '-'}</p>
        <p><span className="text-slate-400">Kapal</span><br />{kapalNama ?? '-'}</p>
        <p><span className="text-slate-400">Status</span><br />{nelayan.status === 'aktif' ? 'Aktif' : 'Nonaktif'}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Build the download button**

```tsx
// components/nelayan/id-card-download-button.tsx
'use client';

import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IdCard, type IdCardProps } from './id-card';

export function IdCardDownloadButton({ nelayan, koperasiNama, kapalNama }: IdCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `id-card-${nelayan.id}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <div className="pointer-events-none fixed -left-[9999px] top-0" aria-hidden>
        <div ref={cardRef}>
          <IdCard nelayan={nelayan} koperasiNama={koperasiNama} kapalNama={kapalNama} />
        </div>
      </div>
      <Button onClick={handleDownload} disabled={downloading}>
        <Download className="mr-2 h-4 w-4" />
        {downloading ? 'Memproses...' : 'Unduh ID Card'}
      </Button>
    </>
  );
}
```

- [ ] **Step 4: Wire the button into the nelayan detail page**

Edit `app/(dashboard)/nelayan/[id]/page.tsx` (created in Task 8):

Add the import:

```tsx
import { IdCardDownloadButton } from '@/components/nelayan/id-card-download-button';
```

Add an `actions` prop to the existing `<PageHeader>` call (it currently has no `actions` prop):

```tsx
      <PageHeader
        crumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Nelayan', href: '/nelayan' },
          { label: orang.nama },
        ]}
        title="Detail Nelayan ID"
        actions={
          <IdCardDownloadButton nelayan={orang} koperasiNama={koperasiNelayan?.nama} kapalNama={kapalNelayan?.nama} />
        }
      />
```

- [ ] **Step 5: Verify end-to-end**

Run `npm run dev`, visit a real `/nelayan/<id>`, click "Unduh ID Card", and confirm a PNG file named `id-card-<id>.png` downloads and, when opened, shows the fisherman's photo placeholder, ID, name, koperasi, kapal, and status rendered on the dark gradient card. If running headless, verify via a screenshot tool if available; otherwise verify the `toPng` call resolves without throwing (check the browser/dev-server console for errors) and that a `<a download>` click was triggered.

- [ ] **Step 6: Commit**

```bash
git add components/nelayan/id-card.tsx components/nelayan/id-card-download-button.tsx "app/(dashboard)/nelayan/[id]/page.tsx" package.json package-lock.json
git commit -m "Add ID card component with working PNG download"
```

---

### Task 10: Kapal list page

**Files:**
- Create: `app/(dashboard)/kapal/page.tsx`

**Interfaces:**
- Consumes: `useData()` (`kapal`, `nelayan`), `PageHeader`, `DataTable`, `StatusBadge`, `KpiCard`, `totalKapal`/`kapalMelautCount`/`kapalSandarCount`/`kapalTidakAktifCount` from `lib/stats.ts`, `formatNumber` from `lib/format.ts`.
- Produces: the `/kapal` route.

- [ ] **Step 1: Implement**

```tsx
// app/(dashboard)/kapal/page.tsx
'use client';

import Link from 'next/link';
import { Ship, Anchor, PauseCircle, AlertTriangle } from 'lucide-react';
import { useData } from '@/context/data-context';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { KpiCard } from '@/components/dashboard/kpi-card';
import type { Kapal, KapalStatus } from '@/lib/types';
import { totalKapal, kapalMelautCount, kapalSandarCount, kapalTidakAktifCount } from '@/lib/stats';
import { formatNumber } from '@/lib/format';

const STATUS_LABEL: Record<KapalStatus, string> = {
  melaut: 'Aktif Melaut',
  sandar: 'Sandar',
  tidak_aktif: 'Tidak Aktif',
  perbaikan: 'Perbaikan',
};

const STATUS_TONE: Record<KapalStatus, 'success' | 'warning' | 'destructive' | 'muted'> = {
  melaut: 'success',
  sandar: 'warning',
  tidak_aktif: 'destructive',
  perbaikan: 'muted',
};

export default function KapalListPage() {
  const { kapal, nelayan } = useData();

  const columns: DataTableColumn<Kapal>[] = [
    {
      header: 'Nama Kapal',
      cell: (k) => (
        <Link href={`/kapal/${k.id}`} className="font-medium text-primary hover:underline">
          {k.nama}
        </Link>
      ),
    },
    { header: 'ID Kapal', cell: (k) => <span className="font-mono text-xs">{k.id}</span> },
    { header: 'Jenis', cell: (k) => k.jenis },
    { header: 'GT', cell: (k) => `${k.gt} GT` },
    { header: 'Pelabuhan Induk', cell: (k) => k.pelabuhanInduk },
    { header: 'Nahkoda', cell: (k) => nelayan.find((n) => n.id === k.nahkodaId)?.nama ?? '-' },
    { header: 'Status', cell: (k) => <StatusBadge label={STATUS_LABEL[k.status]} tone={STATUS_TONE[k.status]} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Kapal' }]}
        title="Kapal"
        description="Kelola data kapal terdaftar"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Ship} label="Total Kapal" value={formatNumber(totalKapal(kapal))} accent="blue" />
        <KpiCard icon={Anchor} label="Aktif Melaut" value={formatNumber(kapalMelautCount(kapal))} accent="green" />
        <KpiCard icon={PauseCircle} label="Sandar" value={formatNumber(kapalSandarCount(kapal))} accent="cyan" />
        <KpiCard icon={AlertTriangle} label="Tidak Aktif" value={formatNumber(kapalTidakAktifCount(kapal))} accent="purple" />
      </div>
      <DataTable
        data={kapal}
        columns={columns}
        getRowKey={(k) => k.id}
        searchPlaceholder="Cari nama atau ID kapal..."
        filterFn={(k, q) => k.nama.toLowerCase().includes(q) || k.id.toLowerCase().includes(q)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify against real data**

Run `npm run dev`, visit `/kapal`, confirm: 4 KPI cards show plausible counts that sum correctly (`melaut + sandar + tidak_aktif + perbaikan` from the table should equal the Total Kapal count, though only 3 of the 4 statuses have their own KPI card — perbaikan is visible only in the table's Status column), the table lists all 40 seeded vessels across pages, and searching by a real vessel name narrows results.

- [ ] **Step 3: Commit**

```bash
git add "app/(dashboard)/kapal/page.tsx"
git commit -m "Add Kapal list page"
```

---

### Task 11: Kapal detail page

**Files:**
- Create: `app/(dashboard)/kapal/[id]/page.tsx`

**Interfaces:**
- Consumes: `useData()`, `PageHeader`, `StatusBadge`, `MapView` (dynamic import, `ssr: false` — same pattern as the dashboard page), `hasilTangkapForKapal` from `lib/stats.ts`, `formatDate`/`formatNumber`/`formatRupiah` from `lib/format.ts`.
- Produces: the `/kapal/[id]` route.

- [ ] **Step 1: Implement**

```tsx
// app/(dashboard)/kapal/[id]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useData } from '@/context/data-context';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { KapalStatus } from '@/lib/types';
import { hasilTangkapForKapal } from '@/lib/stats';
import { formatDate, formatNumber, formatRupiah } from '@/lib/format';

const MapView = dynamic(
  () => import('@/components/dashboard/map-view').then((mod) => mod.MapView),
  { ssr: false }
);

const STATUS_LABEL: Record<KapalStatus, string> = {
  melaut: 'Aktif Melaut',
  sandar: 'Sandar',
  tidak_aktif: 'Tidak Aktif',
  perbaikan: 'Perbaikan',
};

const STATUS_TONE: Record<KapalStatus, 'success' | 'warning' | 'destructive' | 'muted'> = {
  melaut: 'success',
  sandar: 'warning',
  tidak_aktif: 'destructive',
  perbaikan: 'muted',
};

export default function KapalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { kapal, nelayan, hasilTangkap } = useData();

  const kapalItem = kapal.find((k) => k.id === id);

  if (!kapalItem) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Data kapal tidak ditemukan.</p>
        <Button variant="outline" onClick={() => router.push('/kapal')}>
          Kembali ke Daftar Kapal
        </Button>
      </div>
    );
  }

  const nahkoda = nelayan.find((n) => n.id === kapalItem.nahkodaId);
  const trips = hasilTangkapForKapal(kapalItem.id, hasilTangkap);
  const recentTrips = [...trips].sort((a, b) => b.tanggal.localeCompare(a.tanggal)).slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Kapal', href: '/kapal' },
          { label: kapalItem.nama },
        ]}
        title="Detail Kapal"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between text-sm font-semibold">
            Spesifikasi Kapal
            <StatusBadge label={STATUS_LABEL[kapalItem.status]} tone={STATUS_TONE[kapalItem.status]} />
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-y-2 text-sm">
            <div><span className="text-muted-foreground">ID Kapal</span><p className="font-medium">{kapalItem.id}</p></div>
            <div><span className="text-muted-foreground">Jenis Kapal</span><p className="font-medium">{kapalItem.jenis}</p></div>
            <div><span className="text-muted-foreground">GT</span><p className="font-medium">{kapalItem.gt} GT</p></div>
            <div><span className="text-muted-foreground">Mesin</span><p className="font-medium">{kapalItem.mesinPk} PK</p></div>
            <div><span className="text-muted-foreground">Kecepatan</span><p className="font-medium">{kapalItem.kecepatanKnot} knot</p></div>
            <div><span className="text-muted-foreground">Pelabuhan Induk</span><p className="font-medium">{kapalItem.pelabuhanInduk}</p></div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Nahkoda</span>
              <p className="font-medium">
                {nahkoda ? (
                  <Link href={`/nelayan/${nahkoda.id}`} className="text-primary hover:underline">{nahkoda.nama}</Link>
                ) : '-'}
              </p>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Dokumen</span>
              <div className="mt-1 flex gap-2">
                <StatusBadge label="SIUP" tone={kapalItem.dokumen.siup ? 'success' : 'muted'} />
                <StatusBadge label="SLO" tone={kapalItem.dokumen.slo ? 'success' : 'muted'} />
                <StatusBadge label="Pas Kecil" tone={kapalItem.dokumen.pasKecil ? 'success' : 'muted'} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="text-sm font-semibold">Posisi Terkini</CardHeader>
          <CardContent>
            <MapView kapal={[kapalItem]} height={220} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="text-sm font-semibold">Riwayat Hasil Tangkapan Terbaru</CardHeader>
        <CardContent>
          {recentTrips.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada riwayat hasil tangkapan.</p>
          ) : (
            <div className="space-y-2 text-sm">
              {recentTrips.map((t) => (
                <div key={t.id} className="flex items-center justify-between border-b border-border py-2 last:border-0">
                  <span>{formatDate(t.tanggal)} · {t.lokasi}</span>
                  <span className="font-medium">
                    {formatNumber(t.jenisIkan.reduce((s, j) => s + j.beratKg, 0))} kg · {formatRupiah(t.estimasiNilai)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Verify against real data**

Run `npm run dev`, visit `/kapal/<a real seeded ID>`, confirm: spec fields populate, the mini-map renders with a single marker for this vessel (no SSR crash — this reuses the same `next/dynamic({ssr:false})` pattern already proven on the dashboard page), document badges show green for `true` and muted for `false`, and the catch history table shows up to 5 recent trips or the empty message if none. Visit `/kapal/NOT-A-REAL-ID` and confirm the not-found state.

- [ ] **Step 3: Commit**

```bash
git add "app/(dashboard)/kapal/[id]/page.tsx"
git commit -m "Add Kapal detail page"
```

---

### Task 12: Dock scheduling page (`/kapal/jadwal-sandar`)

**Files:**
- Create: `app/(dashboard)/kapal/jadwal-sandar/page.tsx`

**Interfaces:**
- Consumes: `useData()` (`kapal`, `jadwalSandar`, `addJadwalSandar` from Task 1), `PageHeader`, `DataTable`, `formatDate`/`formatNumber` from `lib/format.ts`, `Select`/`SelectTrigger`/`SelectContent`/`SelectItem`/`SelectValue` from `components/ui/select.tsx`, `Input`, `Button`.
- Produces: the `/kapal/jadwal-sandar` route.

- [ ] **Step 1: Implement**

```tsx
// app/(dashboard)/kapal/jadwal-sandar/page.tsx
'use client';

import { useState, type FormEvent } from 'react';
import { useData } from '@/context/data-context';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import type { JadwalSandar } from '@/lib/types';
import { formatDate } from '@/lib/format';

const DERMAGA_OPTIONS = ['Dermaga 01', 'Dermaga 02', 'Dermaga 03'];
const PRIORITAS_OPTIONS: JadwalSandar['prioritas'][] = ['Rendah', 'Normal', 'Tinggi'];

export default function JadwalSandarPage() {
  const { kapal, jadwalSandar, addJadwalSandar } = useData();

  const [kapalId, setKapalId] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [waktuTiba, setWaktuTiba] = useState('');
  const [durasiJam, setDurasiJam] = useState('4');
  const [dermaga, setDermaga] = useState(DERMAGA_OPTIONS[0]);
  const [prioritas, setPrioritas] = useState<JadwalSandar['prioritas']>('Normal');
  const [error, setError] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!kapalId || !tanggal || !waktuTiba) {
      setError('Pilih kapal, tanggal, dan waktu tiba terlebih dahulu.');
      return;
    }
    setError('');
    addJadwalSandar({
      id: crypto.randomUUID(),
      kapalId,
      tanggal,
      dermaga,
      waktuTiba,
      durasiJam: Number(durasiJam) || 1,
      prioritas,
    });
    setKapalId('');
    setTanggal('');
    setWaktuTiba('');
    setDurasiJam('4');
    setDermaga(DERMAGA_OPTIONS[0]);
    setPrioritas('Normal');
  }

  const columns: DataTableColumn<JadwalSandar>[] = [
    { header: 'Kapal', cell: (j) => kapal.find((k) => k.id === j.kapalId)?.nama ?? j.kapalId },
    { header: 'Dermaga', cell: (j) => j.dermaga },
    { header: 'Tanggal', cell: (j) => formatDate(j.tanggal) },
    { header: 'Waktu Tiba', cell: (j) => j.waktuTiba },
    { header: 'Durasi', cell: (j) => `${j.durasiJam} jam` },
    { header: 'Prioritas', cell: (j) => j.prioritas },
  ];

  const sortedJadwal = [...jadwalSandar].sort(
    (a, b) => a.tanggal.localeCompare(b.tanggal) || a.waktuTiba.localeCompare(b.waktuTiba)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Kapal', href: '/kapal' }, { label: 'Jadwal Sandar' }]}
        title="Jadwal Sandar"
        description="Kelola dan atur jadwal sandar kapal di pelabuhan"
      />

      <Card>
        <CardHeader className="text-sm font-semibold">Tambah Jadwal Sandar</CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground">Pilih Kapal</label>
              <Select value={kapalId} onValueChange={setKapalId}>
                <SelectTrigger><SelectValue placeholder="Pilih kapal" /></SelectTrigger>
                <SelectContent>
                  {kapal.map((k) => (
                    <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground">Tanggal Sandar</label>
              <Input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground">Waktu Tiba (ETA)</label>
              <Input type="time" value={waktuTiba} onChange={(e) => setWaktuTiba(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground">Durasi Sandar (Jam)</label>
              <Input type="number" min={1} max={24} value={durasiJam} onChange={(e) => setDurasiJam(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground">Pilih Dermaga</label>
              <Select value={dermaga} onValueChange={setDermaga}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DERMAGA_OPTIONS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground">Prioritas Sandar</label>
              <Select value={prioritas} onValueChange={(v) => setPrioritas(v as JadwalSandar['prioritas'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITAS_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-destructive sm:col-span-2 lg:col-span-3">{error}</p>}
            <div className="sm:col-span-2 lg:col-span-3">
              <Button type="submit">Simpan Jadwal</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="text-sm font-semibold">Daftar Jadwal Sandar</CardHeader>
        <CardContent>
          <DataTable data={sortedJadwal} columns={columns} getRowKey={(j) => j.id} pageSize={10} />
        </CardContent>
      </Card>
    </div>
  );
}
```

Note: `components/ui/select.tsx` wraps `@base-ui/react/select`, whose `Select.Root` accepts standard controlled `value`/`onValueChange` props and whose `SelectItem` accepts a `value` prop — confirmed by reading the installed component directly. Use it exactly as written above.

- [ ] **Step 2: Verify end-to-end**

Run `npm run dev`, visit `/kapal/jadwal-sandar`, confirm: the pre-seeded 20 jadwal entries appear in the table sorted by date/time; submitting the form with all fields filled adds a new row to the table immediately (no reload) with the correct kapal name resolved; submitting with a field missing shows the inline error message and does not add a row.

- [ ] **Step 3: Commit**

```bash
git add "app/(dashboard)/kapal/jadwal-sandar/page.tsx"
git commit -m "Add dock scheduling page with working booking form"
```

---

### Task 13: Peta Tracking page

**Files:**
- Create: `app/(dashboard)/peta-tracking/page.tsx`

**Interfaces:**
- Consumes: `useData()` (`kapal`), `PageHeader`, `DataTable`, `StatusBadge`, `KpiCard`, `MapView` (dynamic, `ssr: false`), `totalKapal`/`kapalMelautCount`/`kapalSandarCount`/`kapalTidakAktifCount` from `lib/stats.ts`, `formatNumber` from `lib/format.ts`.
- Produces: the `/peta-tracking` route (already linked from the sidebar's "Peta Tracking" and "Kapal" is a separate `/kapal` route — no sidebar changes needed, both hrefs already point at their correct, distinct pages per Task 11 of the foundation plan).

- [ ] **Step 1: Implement**

```tsx
// app/(dashboard)/peta-tracking/page.tsx
'use client';

import dynamic from 'next/dynamic';
import { Ship, Anchor, PauseCircle, AlertTriangle } from 'lucide-react';
import { useData } from '@/context/data-context';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { Kapal, KapalStatus } from '@/lib/types';
import { totalKapal, kapalMelautCount, kapalSandarCount, kapalTidakAktifCount } from '@/lib/stats';
import { formatNumber } from '@/lib/format';

const MapView = dynamic(
  () => import('@/components/dashboard/map-view').then((mod) => mod.MapView),
  { ssr: false }
);

const STATUS_LABEL: Record<KapalStatus, string> = {
  melaut: 'Aktif Melaut',
  sandar: 'Sandar',
  tidak_aktif: 'Tidak Aktif',
  perbaikan: 'Perbaikan',
};

const STATUS_TONE: Record<KapalStatus, 'success' | 'warning' | 'destructive' | 'muted'> = {
  melaut: 'success',
  sandar: 'warning',
  tidak_aktif: 'destructive',
  perbaikan: 'muted',
};

export default function PetaTrackingPage() {
  const { kapal } = useData();

  const columns: DataTableColumn<Kapal>[] = [
    { header: 'Nama Kapal', cell: (k) => k.nama },
    { header: 'Jenis', cell: (k) => k.jenis },
    { header: 'Status', cell: (k) => <StatusBadge label={STATUS_LABEL[k.status]} tone={STATUS_TONE[k.status]} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Peta Tracking' }]}
        title="Peta Tracking"
        description="Pantau pergerakan kapal secara real-time"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Ship} label="Total Kapal Aktif" value={formatNumber(totalKapal(kapal))} accent="blue" />
        <KpiCard icon={Anchor} label="Kapal Melaut" value={formatNumber(kapalMelautCount(kapal))} accent="green" />
        <KpiCard icon={PauseCircle} label="Kapal Sandar" value={formatNumber(kapalSandarCount(kapal))} accent="cyan" />
        <KpiCard icon={AlertTriangle} label="Kapal Tidak Aktif" value={formatNumber(kapalTidakAktifCount(kapal))} accent="purple" />
      </div>

      <MapView kapal={kapal} height={480} />

      <Card>
        <CardHeader className="text-sm font-semibold">Daftar Kapal Terpantau</CardHeader>
        <CardContent>
          <DataTable
            data={kapal}
            columns={columns}
            getRowKey={(k) => k.id}
            searchPlaceholder="Cari nama kapal..."
            filterFn={(k, q) => k.nama.toLowerCase().includes(q)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Verify against real data**

Run `npm run dev`, visit `/peta-tracking`, confirm: KPI counts match `/kapal`'s counts (same underlying data, same `lib/stats.ts` functions — they must never disagree), the map renders all 40 vessels with the same live-jitter behavior already proven on the dashboard page, and the vessel list below is searchable.

- [ ] **Step 3: Commit**

```bash
git add "app/(dashboard)/peta-tracking/page.tsx"
git commit -m "Add Peta Tracking page with live fleet map and vessel list"
```

---

## Self-Review Notes

- **Spec coverage:** implements the design spec's `/nelayan`, `/nelayan/[id]` (with working ID Card download), `/kapal`, `/kapal/[id]`, `/kapal/jadwal-sandar`, and `/peta-tracking` routes. `/koperasi`, `/pasar-industri`, `/hasil-tangkap`, `/laporan`, `/pengaturan`, `/bantuan`, `/notifikasi`, `/pencarian` remain for subsequent plans, as agreed.
- **Placeholder scan:** no TBD/TODO markers; every step has runnable code or an exact command. One explicit caveat is flagged in Task 12 (verify the real `Select` component API before trusting the plan's guessed prop names) since that file wasn't read during plan-writing — this is a legitimate, disclosed uncertainty, not a placeholder.
- **Type consistency:** `JadwalSandar`, `KapalStatus` are used identically to their `lib/types.ts` definitions across Tasks 1, 12, and the status-label maps in Tasks 10/11/13. `DataTableColumn<T>`/`DataTableProps<T>` from Task 6 are used with matching generic shapes in every consuming task. `hasilTangkapForKapal`/`totalJamMelaut`/`totalNilaiTangkapan`/`rataRataPerTripKg` signatures from Task 3 match their call sites in Tasks 8 and 11 exactly.
