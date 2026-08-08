# Koperasi + Pasar/Industri Modules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Koperasi (cooperatives) and Pasar/Industri (markets & processing) modules: list + detail pages for both, reusing existing shared infrastructure with no new components.

**Architecture:** Both entities follow the exact list+detail pattern already established by Nelayan/Kapal — `PageHeader` + `DataTable` for the list, a not-found-guarded detail page below it. Unlike prior plans, this one requires **zero new shared components or `lib/` modules** — `DataTable`, `PageHeader`, `StatusBadge`, `KpiCard`, and `useData()` already provide everything needed. `Koperasi` and `PasarIndustri` are read-only reference data in this app (per the design spec, no admin-created records for these entities), so `DataContext` needs no new mutators either.

**Tech Stack:** Same as all prior plans (Next.js 16, TypeScript, Tailwind v4, shadcn/ui-on-base-ui) — no new dependencies.

## Global Constraints

- No authentication, no backend/database — all data flows through the existing `DataContext` (already has `koperasi: Koperasi[]` and `pasarIndustri: PasarIndustri[]`, both read-only — no `addKoperasi`/`addPasarIndustri` mutators exist or are needed).
- All currency/number/date display goes through `lib/format.ts` (`formatRupiah`, `formatNumber`).
- Detail pages handle an unknown ID with a "data tidak ditemukan" state and a link back to the list, not a crash.
- **This codebase's `Button` wraps `@base-ui/react/button`, NOT Radix.** A prior plan's final review found `<Button render={<Link/>}>` triggers a console warning and an invalid `type="button"` attribute (not a real accessibility bug, but unnecessary noise). None of this plan's tasks need a button-styled link — every navigation in this plan is a plain `<Link>` styled as text (matching how `DataTable`'s "Nama" column links already work elsewhere) — so this pattern should not appear anywhere in this plan's diff.
- **This codebase's `Select` wraps `@base-ui/react/select`** (`onValueChange` is nullable) — not relevant to this plan since neither module has a form.
- KPI cards introduced in this plan omit `deltaPercent`/`deltaLabel` (no fabricated trend data), consistent with every KPI card added since the foundation plan's dashboard.
- Automated tests are written only for `lib/` utilities; this plan adds no new `lib/` code, so it adds no new automated tests — verification is manual via the dev server, same as every list/detail page in prior plans.
- Node.js/npm may not be on the shell's default PATH — prepend `/c/Program Files/nodejs` to `PATH` if `npm`/`npx` aren't found directly.

---

### Task 1: Koperasi list page

**Files:**
- Create: `app/(dashboard)/koperasi/page.tsx`

**Interfaces:**
- Consumes: `useData()` (`koperasi`), `PageHeader`, `DataTable`/`DataTableColumn`, `StatusBadge`, `KpiCard`, `formatNumber`/`formatRupiah` from `lib/format.ts`.
- Produces: the `/koperasi` route.

- [ ] **Step 1: Implement**

```tsx
// app/(dashboard)/koperasi/page.tsx
'use client';

import Link from 'next/link';
import { UsersRound, CheckCircle2, Users, Fish } from 'lucide-react';
import { useData } from '@/context/data-context';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { KpiCard } from '@/components/dashboard/kpi-card';
import type { Koperasi } from '@/lib/types';
import { formatNumber, formatRupiah } from '@/lib/format';

export default function KoperasiListPage() {
  const { koperasi } = useData();

  const totalAnggota = koperasi.reduce((sum, k) => sum + k.jumlahAnggota, 0);
  const totalVolume = koperasi.reduce((sum, k) => sum + k.volumeKg, 0);
  const aktifCount = koperasi.filter((k) => k.status === 'Aktif').length;

  const columns: DataTableColumn<Koperasi>[] = [
    {
      header: 'Nama Koperasi',
      cell: (k) => (
        <Link href={`/koperasi/${k.id}`} className="font-medium text-primary hover:underline">
          {k.nama}
        </Link>
      ),
    },
    { header: 'Lokasi', cell: (k) => k.lokasi },
    { header: 'Ketua', cell: (k) => k.ketua },
    { header: 'Anggota', cell: (k) => formatNumber(k.jumlahAnggota) },
    { header: 'Volume (kg)', cell: (k) => formatNumber(k.volumeKg) },
    { header: 'Nilai Transaksi', cell: (k) => formatRupiah(k.nilaiTransaksi) },
    {
      header: 'Status',
      cell: (k) => (
        <StatusBadge label={k.status} tone={k.status === 'Aktif' ? 'success' : 'muted'} />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Koperasi' }]}
        title="Koperasi"
        description="Cari dan kelola data koperasi perikanan"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={UsersRound} label="Total Koperasi" value={formatNumber(koperasi.length)} accent="blue" />
        <KpiCard icon={CheckCircle2} label="Koperasi Aktif" value={formatNumber(aktifCount)} accent="green" />
        <KpiCard icon={Users} label="Total Anggota" value={formatNumber(totalAnggota)} accent="cyan" />
        <KpiCard icon={Fish} label="Volume Hasil (kg)" value={formatNumber(totalVolume)} accent="purple" />
      </div>
      <DataTable
        data={koperasi}
        columns={columns}
        getRowKey={(k) => k.id}
        searchPlaceholder="Cari nama atau lokasi koperasi..."
        filterFn={(k, q) => k.nama.toLowerCase().includes(q) || k.lokasi.toLowerCase().includes(q)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify against real data**

Run `npm run dev`, visit `/koperasi`, confirm: 4 KPI values are non-zero and plausible against the 15 seeded `koperasi` records; the table lists all 15 records across pages; searching by a real koperasi's name or a real lokasi substring narrows results; clicking a name navigates to `/koperasi/<id>` (will 404 until Task 2 exists — expected for now).

- [ ] **Step 3: Commit**

```bash
git add "app/(dashboard)/koperasi/page.tsx"
git commit -m "Add Koperasi list page"
```

---

### Task 2: Koperasi detail page

**Files:**
- Create: `app/(dashboard)/koperasi/[id]/page.tsx`

**Interfaces:**
- Consumes: `useData()` (`koperasi`, `nelayan`, `kapal`), `PageHeader`, `DataTable`/`DataTableColumn`, `StatusBadge`, `formatNumber`/`formatRupiah`.
- Produces: the `/koperasi/[id]` route.

- [ ] **Step 1: Implement**

```tsx
// app/(dashboard)/koperasi/[id]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useData } from '@/context/data-context';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Nelayan } from '@/lib/types';
import { formatNumber, formatRupiah } from '@/lib/format';

export default function KoperasiDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { koperasi, nelayan, kapal } = useData();

  const item = koperasi.find((k) => k.id === id);

  if (!item) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Data koperasi tidak ditemukan.</p>
        <Button variant="outline" onClick={() => router.push('/koperasi')}>
          Kembali ke Daftar Koperasi
        </Button>
      </div>
    );
  }

  const anggota = nelayan.filter((n) => n.koperasiId === item.id);
  const peringkat = [...koperasi].sort((a, b) => b.volumeKg - a.volumeKg).findIndex((k) => k.id === item.id) + 1;

  const anggotaColumns: DataTableColumn<Nelayan>[] = [
    {
      header: 'Nama',
      cell: (n) => (
        <Link href={`/nelayan/${n.id}`} className="font-medium text-primary hover:underline">
          {n.nama}
        </Link>
      ),
    },
    { header: 'Kapal', cell: (n) => kapal.find((k) => k.id === n.kapalId)?.nama ?? '-' },
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
        crumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Koperasi', href: '/koperasi' },
          { label: item.nama },
        ]}
        title="Detail Koperasi"
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between text-sm font-semibold">
          {item.nama}
          <StatusBadge label={item.status} tone={item.status === 'Aktif' ? 'success' : 'muted'} />
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-y-2 text-sm sm:grid-cols-3">
          <div><span className="text-muted-foreground">Lokasi</span><p className="font-medium">{item.lokasi}</p></div>
          <div><span className="text-muted-foreground">Ketua</span><p className="font-medium">{item.ketua}</p></div>
          <div><span className="text-muted-foreground">Jumlah Anggota</span><p className="font-medium">{formatNumber(item.jumlahAnggota)}</p></div>
          <div><span className="text-muted-foreground">Volume Hasil</span><p className="font-medium">{formatNumber(item.volumeKg)} kg</p></div>
          <div><span className="text-muted-foreground">Nilai Transaksi</span><p className="font-medium">{formatRupiah(item.nilaiTransaksi)}</p></div>
          <div><span className="text-muted-foreground">Peringkat Volume</span><p className="font-medium">#{peringkat} dari {koperasi.length}</p></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="text-sm font-semibold">Anggota Nelayan ({anggota.length})</CardHeader>
        <CardContent>
          {anggota.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada nelayan terdaftar di koperasi ini.</p>
          ) : (
            <DataTable data={anggota} columns={anggotaColumns} getRowKey={(n) => n.id} pageSize={10} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Verify against real data**

Run `npm run dev`, visit `/koperasi/<a real seeded ID from lib/mock-data/koperasi.ts>`, confirm: all fields populate correctly, "Peringkat Volume" shows a number between 1 and 15, "Anggota Nelayan" lists the real nelayan whose `koperasiId` matches this koperasi (cross-check against `lib/mock-data/nelayan.ts`), and each listed nelayan's name links to `/nelayan/<id>` correctly. Visit `/koperasi/NOT-A-REAL-ID` and confirm the not-found state renders with a working "Kembali" button.

- [ ] **Step 3: Commit**

```bash
git add "app/(dashboard)/koperasi/[id]/page.tsx"
git commit -m "Add Koperasi detail page"
```

---

### Task 3: Pasar/Industri list page

**Files:**
- Create: `app/(dashboard)/pasar-industri/page.tsx`

**Interfaces:**
- Consumes: `useData()` (`pasarIndustri`), `PageHeader`, `DataTable`/`DataTableColumn`, `StatusBadge`, `KpiCard`, `formatNumber`/`formatRupiah`.
- Produces: the `/pasar-industri` route.

- [ ] **Step 1: Implement**

```tsx
// app/(dashboard)/pasar-industri/page.tsx
'use client';

import Link from 'next/link';
import { Building2, CheckCircle2, Fish, Wallet } from 'lucide-react';
import { useData } from '@/context/data-context';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { KpiCard } from '@/components/dashboard/kpi-card';
import type { PasarIndustri } from '@/lib/types';
import { formatNumber, formatRupiah } from '@/lib/format';

export default function PasarIndustriListPage() {
  const { pasarIndustri } = useData();

  const totalVolume = pasarIndustri.reduce((sum, p) => sum + p.volumeKg, 0);
  const totalNilai = pasarIndustri.reduce((sum, p) => sum + p.nilaiTransaksi, 0);
  const aktifCount = pasarIndustri.filter((p) => p.status === 'Aktif').length;

  const columns: DataTableColumn<PasarIndustri>[] = [
    {
      header: 'Nama',
      cell: (p) => (
        <Link href={`/pasar-industri/${p.id}`} className="font-medium text-primary hover:underline">
          {p.nama}
        </Link>
      ),
    },
    { header: 'Jenis', cell: (p) => p.jenis },
    { header: 'Lokasi', cell: (p) => p.lokasi },
    { header: 'Pengelola', cell: (p) => p.pengelola },
    { header: 'Volume (kg)', cell: (p) => formatNumber(p.volumeKg) },
    { header: 'Nilai Transaksi', cell: (p) => formatRupiah(p.nilaiTransaksi) },
    {
      header: 'Status',
      cell: (p) => <StatusBadge label={p.status} tone={p.status === 'Aktif' ? 'success' : 'muted'} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Pasar / Industri' }]}
        title="Pasar / Industri"
        description="Cari dan kelola data pasar dan industri hasil perikanan"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Building2} label="Total Pasar / Industri" value={formatNumber(pasarIndustri.length)} accent="blue" />
        <KpiCard icon={CheckCircle2} label="Aktif" value={formatNumber(aktifCount)} accent="green" />
        <KpiCard icon={Fish} label="Volume Distribusi (kg)" value={formatNumber(totalVolume)} accent="cyan" />
        <KpiCard icon={Wallet} label="Nilai Transaksi" value={formatRupiah(totalNilai)} accent="purple" />
      </div>
      <DataTable
        data={pasarIndustri}
        columns={columns}
        getRowKey={(p) => p.id}
        searchPlaceholder="Cari nama atau lokasi pasar/industri..."
        filterFn={(p, q) => p.nama.toLowerCase().includes(q) || p.lokasi.toLowerCase().includes(q)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify against real data**

Run `npm run dev`, visit `/pasar-industri`, confirm: 4 KPI values are non-zero and plausible against the 12 seeded `pasarIndustri` records; the table lists all 12 records; searching narrows results; clicking a name navigates to `/pasar-industri/<id>` (will 404 until Task 4 exists — expected for now).

- [ ] **Step 3: Commit**

```bash
git add "app/(dashboard)/pasar-industri/page.tsx"
git commit -m "Add Pasar/Industri list page"
```

---

### Task 4: Pasar/Industri detail page

**Files:**
- Create: `app/(dashboard)/pasar-industri/[id]/page.tsx`

**Interfaces:**
- Consumes: `useData()` (`pasarIndustri`), `PageHeader`, `StatusBadge`, `formatNumber`/`formatRupiah`.
- Produces: the `/pasar-industri/[id]` route.

- [ ] **Step 1: Implement**

```tsx
// app/(dashboard)/pasar-industri/[id]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useData } from '@/context/data-context';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatNumber, formatRupiah } from '@/lib/format';

export default function PasarIndustriDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { pasarIndustri } = useData();

  const item = pasarIndustri.find((p) => p.id === id);

  if (!item) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Data pasar/industri tidak ditemukan.</p>
        <Button variant="outline" onClick={() => router.push('/pasar-industri')}>
          Kembali ke Daftar Pasar / Industri
        </Button>
      </div>
    );
  }

  const peringkat = [...pasarIndustri].sort((a, b) => b.volumeKg - a.volumeKg).findIndex((p) => p.id === item.id) + 1;

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Pasar / Industri', href: '/pasar-industri' },
          { label: item.nama },
        ]}
        title="Detail Pasar / Industri"
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between text-sm font-semibold">
          {item.nama}
          <StatusBadge label={item.status} tone={item.status === 'Aktif' ? 'success' : 'muted'} />
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-y-2 text-sm sm:grid-cols-3">
          <div><span className="text-muted-foreground">Jenis</span><p className="font-medium">{item.jenis}</p></div>
          <div><span className="text-muted-foreground">Lokasi</span><p className="font-medium">{item.lokasi}</p></div>
          <div><span className="text-muted-foreground">Pengelola</span><p className="font-medium">{item.pengelola}</p></div>
          <div><span className="text-muted-foreground">Volume Distribusi</span><p className="font-medium">{formatNumber(item.volumeKg)} kg</p></div>
          <div><span className="text-muted-foreground">Nilai Transaksi</span><p className="font-medium">{formatRupiah(item.nilaiTransaksi)}</p></div>
          <div><span className="text-muted-foreground">Peringkat Volume</span><p className="font-medium">#{peringkat} dari {pasarIndustri.length}</p></div>
        </CardContent>
      </Card>
    </div>
  );
}
```

Note: unlike Koperasi, `PasarIndustri` has no relational field to any other entity in `lib/types.ts` (no `nelayan`/`kapal`/`hasilTangkap` link), so this detail page is intentionally a single info card plus the computed volume ranking — there is no real "related records" table to show without inventing a relationship the data model doesn't have.

- [ ] **Step 2: Verify against real data**

Run `npm run dev`, visit `/pasar-industri/<a real seeded ID from lib/mock-data/pasar-industri.ts>`, confirm all fields populate correctly and "Peringkat Volume" shows a number between 1 and 12. Visit `/pasar-industri/NOT-A-REAL-ID` and confirm the not-found state renders with a working "Kembali" button.

- [ ] **Step 3: Commit**

```bash
git add "app/(dashboard)/pasar-industri/[id]/page.tsx"
git commit -m "Add Pasar/Industri detail page"
```

---

## Dependency Analysis

Unlike every prior plan in this project, **all 4 tasks in this plan are mutually independent at the code level**:

- No task creates a new shared component or `lib/` module that a later task consumes (everything needed — `DataTable`, `PageHeader`, `StatusBadge`, `KpiCard`, `useData()` — already exists from prior plans).
- No two tasks touch the same file.
- The only relationship between tasks is a soft one (Task 1's list links to Task 2's route, Task 3's list links to Task 4's route) — each task compiles, runs, and is independently reviewable without its "partner" task existing yet (verified by each task's own Step 2, which explicitly expects a 404 on the not-yet-built partner route).

This means the four tasks could, in principle, be implemented in any order or even concurrently without merge conflicts. In practice, execute them sequentially in numeric order per `superpowers:subagent-driven-development`'s explicit rule against dispatching multiple implementer subagents in parallel (a hard constraint to avoid concurrent-commit conflicts in the same worktree, independent of whether the underlying tasks are logically parallelizable).

## Self-Review Notes

- **Spec coverage:** implements the design spec's `/koperasi`, `/koperasi/[id]`, `/pasar-industri`, `/pasar-industri/[id]` routes in full. `/laporan`, `/pengaturan`, `/bantuan`, `/notifikasi`, `/pencarian` remain for a subsequent plan.
- **Placeholder scan:** no TBD/TODO markers; every step has runnable code or an exact command.
- **Type consistency:** `Koperasi`/`PasarIndustri` field names used in all four tasks match `lib/types.ts` exactly (`nama`, `lokasi`, `ketua`, `jumlahAnggota`, `volumeKg`, `nilaiTransaksi`, `status` for Koperasi; `nama`, `jenis`, `lokasi`, `pengelola`, `volumeKg`, `nilaiTransaksi`, `status` for PasarIndustri). `DataTableColumn<T>`/`DataTableProps<T>` used identically to every prior plan's usage.
