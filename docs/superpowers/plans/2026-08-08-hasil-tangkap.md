# Hasil Tangkap Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Hasil Tangkap (catch records) module: a summary/analytics page with tabbed breakdowns, a working multi-step catch-entry form, and a working multi-step biosecurity-check form.

**Architecture:** Reuses existing shared components (`PageHeader`, `DataTable`, `StatusBadge`, `KpiCard`, `TrendLineChart`, `DonutChart`) and the existing `DataContext`/`lib/stats.ts` pattern unmodified in spirit — this plan only *extends* them the same way prior plans did. Two new small `lib/` modules (`lib/biosecurity.ts`, `lib/jenis-ikan.ts`) centralize domain constants/logic that both the mock-data seed script and the interactive forms need to share.

**Tech Stack:** Same as prior plans (Next.js 16, TypeScript, Tailwind v4, shadcn/ui-on-base-ui, Recharts) — no new dependencies.

## Global Constraints

- No authentication, no backend/database — all data flows through the existing `DataContext` (session-only mutations).
- All currency/number/date display goes through `lib/format.ts` (`formatRupiah`, `formatNumber`, `formatDate`, `formatPercent`) — never inline `Intl` calls.
- **Every new route must be reachable from the UI.** A prior plan shipped a fully-working page with zero inbound links, caught only by the final whole-branch review. In this plan, `/hasil-tangkap/input` and `/hasil-tangkap/biosecurity` MUST both be linked from `/hasil-tangkap`'s `PageHeader` actions (built directly into Task 4 — do not treat this as optional polish).
- **This codebase's `Button` wraps `@base-ui/react/button`, NOT Radix.** To render a `Button` as a link, use `<Button render={<Link href="..." />}>Label</Button>` — **never** `<Button asChild><Link>...</Link></Button>` (shadcn/Radix's pattern), which does not compile here. The `Button`'s own children become the rendered element's children.
- **This codebase's `Select` wraps `@base-ui/react/select`.** `onValueChange` has signature `(value: T | null, eventDetails) => void` — a plain `string` setter doesn't type-check directly. Always wrap: `onValueChange={(v) => setX(v ?? fallback)}`.
- Detail/form pages handle bad state gracefully (e.g., an empty required field shows an inline error and blocks submission) rather than crashing or silently doing nothing.
- Automated tests are written only for `lib/` utilities (pure logic); pages are verified manually via the dev server.
- Node.js/npm may not be on the shell's default PATH — prepend `/c/Program Files/nodejs` to `PATH` if `npm`/`npx` aren't found directly.

---

### Task 1: Biosecurity checklist domain logic (`lib/biosecurity.ts`)

**Files:**
- Create: `lib/biosecurity.ts`
- Test: `lib/biosecurity.test.ts`

**Interfaces:**
- Produces: `BiosecurityChecklistItem` type (`{ key: string; label: string; deskripsi: string; options: readonly [string, string]; problemValue: string }`), `BIOSECURITY_CHECKLIST_ITEMS: BiosecurityChecklistItem[]` (7 items), `determineBiosecurityHasil(values: Record<string, string>): 'lolos' | 'tidak_lolos'` — used by Task 2 (seed script), Task 6 (biosecurity form page), consumed as the single source of truth for what "passing" biosecurity means so the seed data and the live form can never disagree.

- [ ] **Step 1: Write the failing tests**

```ts
// lib/biosecurity.test.ts
import { describe, it, expect } from 'vitest';
import { BIOSECURITY_CHECKLIST_ITEMS, determineBiosecurityHasil } from './biosecurity';

describe('BIOSECURITY_CHECKLIST_ITEMS', () => {
  it('has exactly 7 items with unique keys', () => {
    expect(BIOSECURITY_CHECKLIST_ITEMS).toHaveLength(7);
    const keys = BIOSECURITY_CHECKLIST_ITEMS.map((i) => i.key);
    expect(new Set(keys).size).toBe(7);
  });
});

describe('determineBiosecurityHasil', () => {
  it('returns lolos when no values are provided (no problems matched)', () => {
    expect(determineBiosecurityHasil({})).toBe('lolos');
  });

  it('returns lolos when every item has its non-problem value', () => {
    const values: Record<string, string> = {};
    for (const item of BIOSECURITY_CHECKLIST_ITEMS) {
      values[item.key] = item.options.find((o) => o !== item.problemValue)!;
    }
    expect(determineBiosecurityHasil(values)).toBe('lolos');
  });

  it('returns tidak_lolos when any single item has its problem value', () => {
    const values: Record<string, string> = { hamaPenyakit: 'Ditemukan' };
    expect(determineBiosecurityHasil(values)).toBe('tidak_lolos');
  });

  it('returns tidak_lolos when the awakKapal item is unhealthy', () => {
    const values: Record<string, string> = { awakKapal: 'Sakit' };
    expect(determineBiosecurityHasil(values)).toBe('tidak_lolos');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- biosecurity`
Expected: FAIL — `./biosecurity` module not found.

- [ ] **Step 3: Implement**

```ts
// lib/biosecurity.ts
export interface BiosecurityChecklistItem {
  key: string;
  label: string;
  deskripsi: string;
  options: readonly [string, string];
  problemValue: string;
}

export const BIOSECURITY_CHECKLIST_ITEMS: BiosecurityChecklistItem[] = [
  { key: 'kebersihanKapal', label: '1. Kebersihan Kapal', deskripsi: 'Kebersihan dek, palka, dan ruang mesin', options: ['Bersih', 'Kotor'], problemValue: 'Kotor' },
  { key: 'airBallast', label: '2. Air Ballast', deskripsi: 'Pemeriksaan dan pertukaran air ballast', options: ['Sesuai', 'Tidak Sesuai'], problemValue: 'Tidak Sesuai' },
  { key: 'alatTangkap', label: '3. Alat Tangkap', deskripsi: 'Kondisi dan kebersihan alat tangkap', options: ['Sesuai', 'Tidak Sesuai'], problemValue: 'Tidak Sesuai' },
  { key: 'dokumenKesehatan', label: '4. Dokumen Kesehatan', deskripsi: 'Kelengkapan dokumen kesehatan awak kapal', options: ['Lengkap', 'Tidak Lengkap'], problemValue: 'Tidak Lengkap' },
  { key: 'hamaPenyakit', label: '5. Hama & Penyakit', deskripsi: 'Hama dan penyakit berbahaya pada kapal', options: ['Tidak Ditemukan', 'Ditemukan'], problemValue: 'Ditemukan' },
  { key: 'limbahBuangan', label: '6. Limbah & Buangan', deskripsi: 'Pengelolaan limbah dan buangan kapal', options: ['Sesuai', 'Tidak Sesuai'], problemValue: 'Tidak Sesuai' },
  { key: 'awakKapal', label: '7. Awak Kapal', deskripsi: 'Pemeriksaan kesehatan awak kapal', options: ['Sehat', 'Sakit'], problemValue: 'Sakit' },
];

export function determineBiosecurityHasil(values: Record<string, string>): 'lolos' | 'tidak_lolos' {
  const bermasalah = BIOSECURITY_CHECKLIST_ITEMS.some((item) => values[item.key] === item.problemValue);
  return bermasalah ? 'tidak_lolos' : 'lolos';
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- biosecurity`
Expected: all 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/biosecurity.ts lib/biosecurity.test.ts
git commit -m "Add biosecurity checklist domain logic"
```

---

### Task 2: BiosecurityCheck mock data, shared jenis-ikan constant, DataContext wiring

**Files:**
- Create: `lib/jenis-ikan.ts`
- Modify: `scripts/seed-mock-data.ts`
- Create: `lib/mock-data/biosecurity-check.ts` (generated output, committed)
- Modify: `context/data-context.tsx`

**Interfaces:**
- Consumes: `BIOSECURITY_CHECKLIST_ITEMS`, `determineBiosecurityHasil` from `lib/biosecurity.ts` (Task 1); `nextBiosecurityId` from `lib/id.ts` (already exists).
- Produces: `export const JENIS_IKAN_OPTIONS: readonly string[]` from `lib/jenis-ikan.ts` — used by Task 5's catch-entry form. `export const biosecurityCheckData: BiosecurityCheck[]` from `lib/mock-data/biosecurity-check.ts`. `useData()` gains `biosecurityCheck: BiosecurityCheck[]` and `addBiosecurityCheck: (b: BiosecurityCheck) => void` — used by Task 6.

- [ ] **Step 1: Create the shared jenis-ikan constant**

```ts
// lib/jenis-ikan.ts
export const JENIS_IKAN_OPTIONS = [
  'Ikan Tongkol',
  'Ikan Cakalang',
  'Ikan Kembung',
  'Ikan Tuna',
  'Ikan Layang',
  'Ikan Tenggiri',
] as const;
```

- [ ] **Step 2: Point the seed script's fish-name list at the shared constant**

Edit `scripts/seed-mock-data.ts`. Replace this line:
```ts
const IKAN = ['Ikan Tongkol', 'Ikan Cakalang', 'Ikan Kembung', 'Ikan Tuna', 'Ikan Layang', 'Ikan Tenggiri'];
```
with:
```ts
import { JENIS_IKAN_OPTIONS } from '../lib/jenis-ikan';
```
(add this import near the top, alongside the other `lib/` imports), and update every remaining reference to `IKAN` in the file to `JENIS_IKAN_OPTIONS` (there is exactly one: inside the `hasilTangkapData` generator's `faker.helpers.arrayElements(IKAN, ...)` call). The array contents and order are identical, so this must NOT change any generated output — verify with `git diff` after reseeding (Step 6) that `lib/mock-data/hasil-tangkap.ts` shows no changes.

- [ ] **Step 3: Add the BiosecurityCheck generator to the seed script**

Add to the type import (currently `import type { Kapal, Nelayan, HasilTangkap, Koperasi, PasarIndustri, Notifikasi, JadwalSandar } from '../lib/types';`), append `BiosecurityCheck`:
```ts
import type { Kapal, Nelayan, HasilTangkap, Koperasi, PasarIndustri, Notifikasi, JadwalSandar, BiosecurityCheck } from '../lib/types';
```

Add `nextBiosecurityId` to the existing `lib/id` import (currently `import { nextNelayanId, nextKapalId } from '../lib/id';`):
```ts
import { nextNelayanId, nextKapalId, nextBiosecurityId } from '../lib/id';
```

Add an import for the checklist logic:
```ts
import { BIOSECURITY_CHECKLIST_ITEMS, determineBiosecurityHasil } from '../lib/biosecurity';
```

Add the generator after the `jadwalSandarData` block (after line ~127, before the `writeModule` function definition):

```ts
const biosecurityIds: string[] = [];
const biosecurityCheckData: BiosecurityCheck[] = Array.from({ length: 15 }, () => {
  const kapal = faker.helpers.arrayElement(kapalData);
  const tanggal = faker.date.recent({ days: 20, refDate: SEED_DATE });
  const values: Record<string, string> = {};
  for (const item of BIOSECURITY_CHECKLIST_ITEMS) {
    values[item.key] = faker.helpers.arrayElement(item.options);
  }
  const id = nextBiosecurityId(biosecurityIds, tanggal);
  biosecurityIds.push(id);
  return {
    id,
    kapalId: kapal.id,
    petugas: `${faker.person.fullName()}, A.Md`,
    tanggal: tanggal.toISOString().slice(0, 10),
    checklist: BIOSECURITY_CHECKLIST_ITEMS.map((item) => ({ label: item.label, hasil: values[item.key] })),
    hasil: determineBiosecurityHasil(values),
    nomorSertifikat: id,
  };
});
```

Note: `id` and `nomorSertifikat` are deliberately the same value here — the certificate number IS the record's natural unique identifier, so there's no separate UUID.

Add the corresponding `writeModule` call after the `jadwal-sandar.ts` line:
```ts
writeModule('biosecurity-check.ts', 'biosecurityCheckData', 'BiosecurityCheck', biosecurityCheckData);
```

- [ ] **Step 4: Regenerate mock data**

```bash
npm run seed
```

Expected: console logs an 8th "Wrote ..." line for `lib/mock-data/biosecurity-check.ts`, and `git diff --stat` shows the other 7 mock-data files are byte-identical to before (confirming Step 2's constant-extraction and the new generator's placement — strictly after all pre-existing generators — didn't disturb prior determinism).

- [ ] **Step 5: Wire `biosecurityCheck` into `DataContext`**

Edit `context/data-context.tsx`:

Add the import (alongside the other `lib/mock-data/*` imports):
```ts
import { biosecurityCheckData } from '@/lib/mock-data/biosecurity-check';
```

Add `BiosecurityCheck` to the type import:
```ts
import type { Nelayan, Kapal, HasilTangkap, Koperasi, PasarIndustri, Notifikasi, JadwalSandar, BiosecurityCheck } from '@/lib/types';
```

Add to the `DataContextValue` interface: `biosecurityCheck: BiosecurityCheck[];` and `addBiosecurityCheck: (b: BiosecurityCheck) => void;` (mirroring exactly how `jadwalSandar`/`addJadwalSandar` already appear).

Add state: `const [biosecurityCheck, setBiosecurityCheck] = useState<BiosecurityCheck[]>(biosecurityCheckData);`

Add the mutator: `const addBiosecurityCheck = useCallback((b: BiosecurityCheck) => setBiosecurityCheck((prev) => [b, ...prev]), []);`

Add `biosecurityCheck` and `addBiosecurityCheck` to both the `value` object literal and its `useMemo` dependency array.

- [ ] **Step 6: Verify**

```bash
npx tsc --noEmit
npm test
npm run build
```

Expected: no type errors, all tests pass, build succeeds. Also re-confirm Step 4's determinism claim now that Steps 2-5 are all in place: run `npm run seed` once more and check `git status`/`git diff` shows no unexpected changes to the 7 pre-existing mock-data files.

- [ ] **Step 7: Commit**

```bash
git add lib/jenis-ikan.ts scripts/seed-mock-data.ts lib/mock-data/biosecurity-check.ts context/data-context.tsx
git commit -m "Add BiosecurityCheck mock data and wire it into DataContext"
```

---

### Task 3: Catch-record aggregation helpers (`lib/stats.ts`)

**Files:**
- Modify: `lib/stats.ts`
- Modify: `lib/stats.test.ts`

**Interfaces:**
- Consumes: `HasilTangkap[]`, `Kapal[]` from `lib/types.ts`.
- Produces: `rekapPerKapal(list: HasilTangkap[], kapal: Kapal[]): { label: string; totalKg: number; jumlahTrip: number }[]`, `rekapPerWilayah(list: HasilTangkap[]): { label: string; totalKg: number; jumlahTrip: number }[]` — both sorted descending by `totalKg`. Used by Task 4's "Per Kapal"/"Per Wilayah" tabs.

- [ ] **Step 1: Write the failing tests**

Append to `lib/stats.test.ts`:

```ts
import { rekapPerKapal, rekapPerWilayah } from './stats';

const hasilTangkapDenganLokasi: HasilTangkap[] = [
  { id: '1', kapalId: 'KAP-1', tanggal: '2025-05-10', lokasi: 'Perairan Selat Bali', jenisIkan: [{ nama: 'Ikan Tongkol', beratKg: 100, jumlahEkor: 10, kondisi: 'Segar' }] } as HasilTangkap,
  { id: '2', kapalId: 'KAP-1', tanggal: '2025-05-11', lokasi: 'Perairan Selat Bali', jenisIkan: [{ nama: 'Ikan Cakalang', beratKg: 50, jumlahEkor: 5, kondisi: 'Segar' }] } as HasilTangkap,
  { id: '3', kapalId: 'KAP-2', tanggal: '2025-05-11', lokasi: 'Perairan Utara Jawa', jenisIkan: [{ nama: 'Ikan Tongkol', beratKg: 30, jumlahEkor: 3, kondisi: 'Segar' }] } as HasilTangkap,
];

const kapalUntukRekap: Kapal[] = [
  { id: 'KAP-1', nama: 'KM. Bahari Jaya' } as Kapal,
  { id: 'KAP-2', nama: 'KM. Samudra Indah' } as Kapal,
];

describe('rekapPerKapal', () => {
  it('groups by kapal, resolves the name, and sorts descending by total weight', () => {
    expect(rekapPerKapal(hasilTangkapDenganLokasi, kapalUntukRekap)).toEqual([
      { label: 'KM. Bahari Jaya', totalKg: 150, jumlahTrip: 2 },
      { label: 'KM. Samudra Indah', totalKg: 30, jumlahTrip: 1 },
    ]);
  });

  it('falls back to the raw kapalId if no matching vessel is found', () => {
    const result = rekapPerKapal(hasilTangkapDenganLokasi, []);
    expect(result.find((r) => r.label === 'KAP-1')).toBeTruthy();
  });
});

describe('rekapPerWilayah', () => {
  it('groups by lokasi and sorts descending by total weight', () => {
    expect(rekapPerWilayah(hasilTangkapDenganLokasi)).toEqual([
      { label: 'Perairan Selat Bali', totalKg: 150, jumlahTrip: 2 },
      { label: 'Perairan Utara Jawa', totalKg: 30, jumlahTrip: 1 },
    ]);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- stats`
Expected: FAIL — `rekapPerKapal`/`rekapPerWilayah` are not exported from `./stats`.

- [ ] **Step 3: Implement**

Append to `lib/stats.ts`:

```ts
export function rekapPerKapal(
  list: HasilTangkap[],
  kapal: Kapal[],
): { label: string; totalKg: number; jumlahTrip: number }[] {
  const totals = new Map<string, { totalKg: number; jumlahTrip: number }>();
  for (const h of list) {
    const beratTrip = h.jenisIkan.reduce((s, j) => s + j.beratKg, 0);
    const current = totals.get(h.kapalId) ?? { totalKg: 0, jumlahTrip: 0 };
    totals.set(h.kapalId, { totalKg: current.totalKg + beratTrip, jumlahTrip: current.jumlahTrip + 1 });
  }
  return [...totals.entries()]
    .map(([kapalId, v]) => ({
      label: kapal.find((k) => k.id === kapalId)?.nama ?? kapalId,
      totalKg: v.totalKg,
      jumlahTrip: v.jumlahTrip,
    }))
    .sort((a, b) => b.totalKg - a.totalKg);
}

export function rekapPerWilayah(
  list: HasilTangkap[],
): { label: string; totalKg: number; jumlahTrip: number }[] {
  const totals = new Map<string, { totalKg: number; jumlahTrip: number }>();
  for (const h of list) {
    const beratTrip = h.jenisIkan.reduce((s, j) => s + j.beratKg, 0);
    const current = totals.get(h.lokasi) ?? { totalKg: 0, jumlahTrip: 0 };
    totals.set(h.lokasi, { totalKg: current.totalKg + beratTrip, jumlahTrip: current.jumlahTrip + 1 });
  }
  return [...totals.entries()]
    .map(([lokasi, v]) => ({ label: lokasi, totalKg: v.totalKg, jumlahTrip: v.jumlahTrip }))
    .sort((a, b) => b.totalKg - a.totalKg);
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- stats`
Expected: all stats tests pass (existing + 3 new).

- [ ] **Step 5: Commit**

```bash
git add lib/stats.ts lib/stats.test.ts
git commit -m "Add per-kapal and per-wilayah catch aggregation helpers"
```

---

### Task 4: Hasil Tangkap summary page

**Files:**
- Create: `app/(dashboard)/hasil-tangkap/page.tsx`

**Interfaces:**
- Consumes: `useData()` (`hasilTangkap`, `kapal`), `PageHeader`, `DataTable`/`DataTableColumn`, `StatusBadge`, `KpiCard`, `TrendLineChart`, `DonutChart`, `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` from `components/ui/tabs.tsx`, `totalHasilTangkapKg`/`totalNilaiTangkapan`/`rataRataPerTripKg`/`komposisiHasilTangkap`/`trenHasilTangkapHarian`/`rekapPerKapal`/`rekapPerWilayah` from `lib/stats.ts`.
- Produces: the `/hasil-tangkap` route, with working links to `/hasil-tangkap/input` and `/hasil-tangkap/biosecurity` (built in Tasks 5-6).

- [ ] **Step 1: Implement**

```tsx
// app/(dashboard)/hasil-tangkap/page.tsx
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Fish, Wallet, Ship, Layers } from 'lucide-react';
import { useData } from '@/context/data-context';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { TrendLineChart } from '@/components/dashboard/trend-line-chart';
import { DonutChart } from '@/components/dashboard/donut-chart';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { HasilTangkap } from '@/lib/types';
import {
  totalHasilTangkapKg, totalNilaiTangkapan, rataRataPerTripKg,
  komposisiHasilTangkap, trenHasilTangkapHarian, rekapPerKapal, rekapPerWilayah,
} from '@/lib/stats';
import { formatNumber, formatRupiah, formatDate } from '@/lib/format';

type RekapRow = { label: string; totalKg: number; jumlahTrip: number };
type JenisRow = { nama: string; beratKg: number; persen: number };

export default function HasilTangkapPage() {
  const { hasilTangkap, kapal } = useData();

  const komposisi = useMemo(() => komposisiHasilTangkap(hasilTangkap), [hasilTangkap]);
  const tren = useMemo(() => trenHasilTangkapHarian(hasilTangkap), [hasilTangkap]);
  const perKapal = useMemo(() => rekapPerKapal(hasilTangkap, kapal), [hasilTangkap, kapal]);
  const perWilayah = useMemo(() => rekapPerWilayah(hasilTangkap), [hasilTangkap]);
  const terbaru = useMemo(
    () => [...hasilTangkap].sort((a, b) => b.tanggal.localeCompare(a.tanggal)).slice(0, 10),
    [hasilTangkap],
  );

  const jenisIkanColumns: DataTableColumn<JenisRow>[] = [
    { header: 'Jenis Ikan', cell: (r) => r.nama },
    { header: 'Berat (kg)', cell: (r) => formatNumber(r.beratKg) },
    { header: 'Persentase', cell: (r) => `${r.persen.toFixed(1)}%` },
  ];

  const rekapColumns: DataTableColumn<RekapRow>[] = [
    { header: 'Nama', cell: (r) => r.label },
    { header: 'Total Berat (kg)', cell: (r) => formatNumber(r.totalKg) },
    { header: 'Jumlah Trip', cell: (r) => formatNumber(r.jumlahTrip) },
  ];

  const terbaruColumns: DataTableColumn<HasilTangkap>[] = [
    { header: 'Tanggal', cell: (h) => formatDate(h.tanggal) },
    { header: 'Kapal', cell: (h) => kapal.find((k) => k.id === h.kapalId)?.nama ?? h.kapalId },
    { header: 'Lokasi', cell: (h) => h.lokasi },
    { header: 'Jenis Ikan', cell: (h) => h.jenisIkan.map((j) => j.nama).join(', ') },
    { header: 'Berat (kg)', cell: (h) => formatNumber(h.jenisIkan.reduce((s, j) => s + j.beratKg, 0)) },
    { header: 'Nilai', cell: (h) => formatRupiah(h.estimasiNilai) },
    {
      header: 'Status',
      cell: (h) => (
        <StatusBadge
          label={h.status === 'verified' ? 'Terverifikasi' : 'Menunggu'}
          tone={h.status === 'verified' ? 'success' : 'warning'}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Hasil Tangkap' }]}
        title="Hasil Tangkap"
        description="Pantau hasil tangkapan ikan secara real-time"
        actions={
          <>
            <Button variant="outline" render={<Link href="/hasil-tangkap/biosecurity" />}>
              Cek Biosecurity
            </Button>
            <Button render={<Link href="/hasil-tangkap/input" />}>
              Input Hasil Tangkap
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Fish} label="Total Hasil Tangkapan" value={`${formatNumber(totalHasilTangkapKg(hasilTangkap))} kg`} accent="blue" />
        <KpiCard icon={Wallet} label="Total Nilai Tangkapan" value={formatRupiah(totalNilaiTangkapan(hasilTangkap))} accent="green" />
        <KpiCard icon={Ship} label="Rata-rata per Trip" value={`${formatNumber(Math.round(rataRataPerTripKg(hasilTangkap)))} kg`} accent="cyan" />
        <KpiCard icon={Layers} label="Jenis Ikan Tertangkap" value={`${formatNumber(komposisi.length)} Jenis`} accent="purple" />
      </div>

      <Card>
        <CardContent className="p-4">
          <Tabs defaultValue="ringkasan">
            <TabsList>
              <TabsTrigger value="ringkasan">Ringkasan</TabsTrigger>
              <TabsTrigger value="jenis-ikan">Per Jenis Ikan</TabsTrigger>
              <TabsTrigger value="kapal">Per Kapal</TabsTrigger>
              <TabsTrigger value="wilayah">Per Wilayah</TabsTrigger>
            </TabsList>
            <TabsContent value="ringkasan" className="pt-4">
              <TrendLineChart data={tren} />
            </TabsContent>
            <TabsContent value="jenis-ikan" className="space-y-4 pt-4">
              <DonutChart data={komposisi} />
              <DataTable data={komposisi} columns={jenisIkanColumns} getRowKey={(r) => r.nama} />
            </TabsContent>
            <TabsContent value="kapal" className="pt-4">
              <DataTable data={perKapal} columns={rekapColumns} getRowKey={(r) => r.label} />
            </TabsContent>
            <TabsContent value="wilayah" className="pt-4">
              <DataTable data={perWilayah} columns={rekapColumns} getRowKey={(r) => r.label} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="text-sm font-semibold">Data Hasil Tangkapan Terbaru</CardHeader>
        <CardContent>
          <DataTable data={terbaru} columns={terbaruColumns} getRowKey={(h) => h.id} pageSize={10} />
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Verify against real data**

Run `npm run dev`, visit `/hasil-tangkap`, confirm: 4 KPI values are non-zero and plausible against the 80 seeded `hasilTangkap` records; all 4 tabs switch content correctly (Ringkasan shows a line chart, Per Jenis Ikan shows a donut + table, Per Kapal and Per Wilayah show sorted-descending tables); "Data Hasil Tangkapan Terbaru" shows 10 rows with real vessel names, correct status badges; the "Input Hasil Tangkap" and "Cek Biosecurity" buttons render as real links (inspect the HTML for real `<a href="/hasil-tangkap/input">`/`<a href="/hasil-tangkap/biosecurity">` — both will 404 until Tasks 5-6 exist, which is expected for now, but the *links themselves* must be present).

- [ ] **Step 3: Commit**

```bash
git add "app/(dashboard)/hasil-tangkap/page.tsx"
git commit -m "Add Hasil Tangkap summary page with tabbed breakdowns"
```

---

### Task 5: Catch-entry multi-step form

**Files:**
- Create: `app/(dashboard)/hasil-tangkap/input/page.tsx`

**Interfaces:**
- Consumes: `useData()` (`kapal`, `addHasilTangkap`), `PageHeader`, `JENIS_IKAN_OPTIONS` from `lib/jenis-ikan.ts` (Task 2), `generateLocalId` from `lib/id.ts`, `JenisIkanTangkapan` type from `lib/types.ts`.
- Produces: the `/hasil-tangkap/input` route.

- [ ] **Step 1: Implement**

```tsx
// app/(dashboard)/hasil-tangkap/input/page.tsx
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '@/context/data-context';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { JENIS_IKAN_OPTIONS } from '@/lib/jenis-ikan';
import { generateLocalId } from '@/lib/id';
import { formatNumber, formatRupiah } from '@/lib/format';
import type { JenisIkanTangkapan } from '@/lib/types';

const KONDISI_OPTIONS: JenisIkanTangkapan['kondisi'][] = ['Segar', 'Tidak ada hasil'];
const NILAI_PER_KG = 25000;

interface IkanRow {
  nama: string;
  beratKg: string;
  jumlahEkor: string;
  kondisi: JenisIkanTangkapan['kondisi'];
}

function emptyRow(): IkanRow {
  return { nama: JENIS_IKAN_OPTIONS[0], beratKg: '', jumlahEkor: '', kondisi: 'Segar' };
}

export default function InputHasilTangkapPage() {
  const router = useRouter();
  const { kapal, addHasilTangkap } = useData();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [kapalId, setKapalId] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [waktuMulai, setWaktuMulai] = useState('');
  const [waktuSelesai, setWaktuSelesai] = useState('');
  const [lokasi, setLokasi] = useState('');
  const [rows, setRows] = useState<IkanRow[]>([emptyRow()]);
  const [error, setError] = useState('');

  function handleNextFromStep1(e: FormEvent) {
    e.preventDefault();
    if (!kapalId || !tanggal || !waktuMulai || !waktuSelesai || !lokasi) {
      setError('Lengkapi semua informasi kapal dan trip terlebih dahulu.');
      return;
    }
    setError('');
    setStep(2);
  }

  function handleNextFromStep2() {
    const valid = rows.every((r) => r.nama && Number(r.beratKg) > 0 && Number(r.jumlahEkor) > 0);
    if (!valid) {
      setError('Lengkapi berat dan jumlah untuk setiap jenis ikan.');
      return;
    }
    setError('');
    setStep(3);
  }

  function updateRow(index: number, patch: Partial<IkanRow>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(index: number) {
    setRows((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  const totalBerat = rows.reduce((s, r) => s + (Number(r.beratKg) || 0), 0);
  const estimasiNilai = totalBerat * NILAI_PER_KG;
  const kapalTerpilih = kapal.find((k) => k.id === kapalId);

  function handleSubmit() {
    addHasilTangkap({
      id: generateLocalId('HT'),
      kapalId,
      tanggal,
      waktuMulai,
      waktuSelesai,
      lokasi,
      jenisIkan: rows.map((r) => ({
        nama: r.nama,
        beratKg: Number(r.beratKg) || 0,
        jumlahEkor: Number(r.jumlahEkor) || 0,
        kondisi: r.kondisi,
      })),
      estimasiNilai,
      status: 'pending',
    });
    router.push('/hasil-tangkap');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Hasil Tangkap', href: '/hasil-tangkap' },
          { label: 'Input Hasil Tangkap' },
        ]}
        title="Input Hasil Tangkapan"
        description="Catat jenis, jumlah, lokasi, dan waktu hasil tangkapan"
      />

      <Card>
        <CardHeader className="flex flex-row gap-6 text-sm font-medium text-muted-foreground">
          <span className={step === 1 ? 'text-primary' : undefined}>1. Data Kapal & Trip</span>
          <span className={step === 2 ? 'text-primary' : undefined}>2. Detail Ikan</span>
          <span className={step === 3 ? 'text-primary' : undefined}>3. Review & Simpan</span>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

          {step === 1 && (
            <form onSubmit={handleNextFromStep1} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm text-muted-foreground">Pilih Kapal</label>
                <Select value={kapalId} onValueChange={(v) => setKapalId(v ?? '')}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Pilih kapal" /></SelectTrigger>
                  <SelectContent>
                    {kapal.map((k) => (
                      <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-muted-foreground">Tanggal Tangkap</label>
                <Input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-muted-foreground">Waktu Mulai</label>
                <Input type="time" value={waktuMulai} onChange={(e) => setWaktuMulai(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-muted-foreground">Waktu Selesai</label>
                <Input type="time" value={waktuSelesai} onChange={(e) => setWaktuSelesai(e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm text-muted-foreground">Lokasi Penangkapan</label>
                <Input value={lokasi} onChange={(e) => setLokasi(e.target.value)} placeholder="Contoh: Perairan Utara Jawa" />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit">Lanjut</Button>
              </div>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="p-2">Jenis Ikan</th>
                      <th className="p-2">Berat (kg)</th>
                      <th className="p-2">Jumlah (Ekor)</th>
                      <th className="p-2">Kondisi</th>
                      <th className="p-2">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="p-2">
                          <Select value={row.nama} onValueChange={(v) => updateRow(i, { nama: v ?? row.nama })}>
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {JENIS_IKAN_OPTIONS.map((nama) => (
                                <SelectItem key={nama} value={nama}>{nama}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-2">
                          <Input type="number" min={0} value={row.beratKg} onChange={(e) => updateRow(i, { beratKg: e.target.value })} />
                        </td>
                        <td className="p-2">
                          <Input type="number" min={0} value={row.jumlahEkor} onChange={(e) => updateRow(i, { jumlahEkor: e.target.value })} />
                        </td>
                        <td className="p-2">
                          <Select value={row.kondisi} onValueChange={(v) => updateRow(i, { kondisi: (v ?? row.kondisi) as JenisIkanTangkapan['kondisi'] })}>
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {KONDISI_OPTIONS.map((k) => (
                                <SelectItem key={k} value={k}>{k}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => removeRow(i)}>Hapus</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button type="button" variant="outline" onClick={addRow}>+ Tambah Jenis Ikan</Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>Kembali</Button>
                <Button type="button" onClick={handleNextFromStep2}>Lanjut</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 text-sm">
              <div className="grid gap-2 sm:grid-cols-2">
                <p><span className="text-muted-foreground">Kapal</span><br /><span className="font-medium">{kapalTerpilih?.nama ?? '-'}</span></p>
                <p><span className="text-muted-foreground">Lokasi</span><br /><span className="font-medium">{lokasi}</span></p>
                <p><span className="text-muted-foreground">Tanggal</span><br /><span className="font-medium">{tanggal}</span></p>
                <p><span className="text-muted-foreground">Waktu</span><br /><span className="font-medium">{waktuMulai} - {waktuSelesai}</span></p>
              </div>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="p-2">Jenis Ikan</th>
                      <th className="p-2">Berat (kg)</th>
                      <th className="p-2">Jumlah (Ekor)</th>
                      <th className="p-2">Kondisi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="p-2">{row.nama}</td>
                        <td className="p-2">{formatNumber(Number(row.beratKg) || 0)}</td>
                        <td className="p-2">{formatNumber(Number(row.jumlahEkor) || 0)}</td>
                        <td className="p-2">{row.kondisi}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                <span>Total Berat: <strong>{formatNumber(totalBerat)} kg</strong></span>
                <span>Estimasi Nilai: <strong>{formatRupiah(estimasiNilai)}</strong></span>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep(2)}>Kembali</Button>
                <Button type="button" onClick={handleSubmit}>Simpan</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

Note: the jenis-ikan editor uses a plain native `<table>`, not the shared `DataTable` — `DataTable` is a read-only display component with cell renderers, not an editable grid, so forcing it into this role would fight the component rather than reuse it. A plain table with inline `Input`/`Select` cells is the right tool here.

- [ ] **Step 2: Verify end-to-end**

Run `npm run dev`, visit `/hasil-tangkap/input`:
- Submitting step 1 with a field missing shows the inline error and does not advance.
- Filling step 1 and clicking "Lanjut" advances to step 2 with one empty ikan row.
- Adding a second row via "+ Tambah Jenis Ikan", filling both rows, and clicking "Lanjut" (with a field left empty) shows the inline error and does not advance; filling everything advances to step 3.
- Step 3 shows correct computed totals (`totalBerat` and `estimasiNilai = totalBerat * 25000`).
- Clicking "Simpan" navigates back to `/hasil-tangkap` and the new record appears at the top of "Data Hasil Tangkapan Terbaru" with status "Menunggu" (since new records are `status: 'pending'`).

If browser automation (Playwright/Puppeteer) is available in this session, use it to drive this interaction for real and paste the evidence into the report; otherwise verify as thoroughly as possible via code inspection plus confirming initial render, and disclose which method was used.

- [ ] **Step 3: Commit**

```bash
git add "app/(dashboard)/hasil-tangkap/input/page.tsx"
git commit -m "Add catch-entry multi-step form"
```

---

### Task 6: Biosecurity-check multi-step form

**Files:**
- Create: `app/(dashboard)/hasil-tangkap/biosecurity/page.tsx`

**Interfaces:**
- Consumes: `useData()` (`kapal`, `biosecurityCheck`, `addBiosecurityCheck`), `PageHeader`, `StatusBadge`, `BIOSECURITY_CHECKLIST_ITEMS`/`determineBiosecurityHasil` from `lib/biosecurity.ts` (Task 1), `nextBiosecurityId` from `lib/id.ts`.
- Produces: the `/hasil-tangkap/biosecurity` route.

- [ ] **Step 1: Implement**

```tsx
// app/(dashboard)/hasil-tangkap/biosecurity/page.tsx
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '@/context/data-context';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { BIOSECURITY_CHECKLIST_ITEMS, determineBiosecurityHasil } from '@/lib/biosecurity';
import { nextBiosecurityId } from '@/lib/id';
import { formatDate } from '@/lib/format';

const METODE_OPTIONS = ['Pemeriksaan Fisik & Dokumen', 'Pemeriksaan Fisik', 'Pemeriksaan Dokumen'];

export default function BiosecurityCheckPage() {
  const router = useRouter();
  const { kapal, biosecurityCheck, addBiosecurityCheck } = useData();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [kapalId, setKapalId] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [petugas, setPetugas] = useState('');
  const [metode, setMetode] = useState(METODE_OPTIONS[0]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  function handleNextFromStep1(e: FormEvent) {
    e.preventDefault();
    if (!kapalId || !tanggal || !petugas) {
      setError('Lengkapi informasi kapal dan petugas pemeriksa terlebih dahulu.');
      return;
    }
    setError('');
    setStep(2);
  }

  function handleNextFromStep2() {
    const lengkap = BIOSECURITY_CHECKLIST_ITEMS.every((item) => values[item.key]);
    if (!lengkap) {
      setError('Lengkapi seluruh hasil pemeriksaan sebelum melanjutkan.');
      return;
    }
    setError('');
    setStep(3);
  }

  const hasil = determineBiosecurityHasil(values);
  const kapalTerpilih = kapal.find((k) => k.id === kapalId);

  function handleSubmit() {
    const nomorSertifikat = nextBiosecurityId(
      biosecurityCheck.map((b) => b.nomorSertifikat),
      new Date(tanggal),
    );
    addBiosecurityCheck({
      id: nomorSertifikat,
      kapalId,
      petugas,
      tanggal,
      checklist: BIOSECURITY_CHECKLIST_ITEMS.map((item) => ({ label: item.label, hasil: values[item.key] })),
      hasil,
      nomorSertifikat,
    });
    router.push('/hasil-tangkap');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Hasil Tangkap', href: '/hasil-tangkap' },
          { label: 'Status Lolos Biosecurity' },
        ]}
        title="Input Status Lolos Biosecurity"
        description="Catat dan verifikasi hasil pemeriksaan biosecurity kapal di pelabuhan"
      />

      <Card>
        <CardHeader className="flex flex-row gap-6 text-sm font-medium text-muted-foreground">
          <span className={step === 1 ? 'text-primary' : undefined}>1. Informasi Kapal</span>
          <span className={step === 2 ? 'text-primary' : undefined}>2. Pemeriksaan</span>
          <span className={step === 3 ? 'text-primary' : undefined}>3. Review & Simpan</span>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

          {step === 1 && (
            <form onSubmit={handleNextFromStep1} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm text-muted-foreground">Pilih Kapal</label>
                <Select value={kapalId} onValueChange={(v) => setKapalId(v ?? '')}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Pilih kapal" /></SelectTrigger>
                  <SelectContent>
                    {kapal.map((k) => (
                      <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-muted-foreground">Tanggal Pemeriksaan</label>
                <Input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-muted-foreground">Petugas Pemeriksa</label>
                <Input value={petugas} onChange={(e) => setPetugas(e.target.value)} placeholder="Nama petugas" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-muted-foreground">Metode Pemeriksaan</label>
                <Select value={metode} onValueChange={(v) => setMetode(v ?? metode)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {METODE_OPTIONS.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Button type="submit">Lanjut</Button>
              </div>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {BIOSECURITY_CHECKLIST_ITEMS.map((item) => (
                  <div key={item.key} className="space-y-1.5">
                    <label className="text-sm text-muted-foreground">{item.label}</label>
                    <Select
                      value={values[item.key] ?? ''}
                      onValueChange={(v) => setValues((prev) => ({ ...prev, [item.key]: v ?? '' }))}
                    >
                      <SelectTrigger className="w-full"><SelectValue placeholder="Pilih hasil" /></SelectTrigger>
                      <SelectContent>
                        {item.options.map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>Kembali</Button>
                <Button type="button" onClick={handleNextFromStep2}>Lanjut ke Review</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 text-sm">
              <div className="grid gap-2 sm:grid-cols-2">
                <p><span className="text-muted-foreground">Kapal</span><br /><span className="font-medium">{kapalTerpilih?.nama ?? '-'}</span></p>
                <p><span className="text-muted-foreground">Petugas</span><br /><span className="font-medium">{petugas}</span></p>
                <p><span className="text-muted-foreground">Tanggal</span><br /><span className="font-medium">{formatDate(tanggal)}</span></p>
                <p><span className="text-muted-foreground">Metode</span><br /><span className="font-medium">{metode}</span></p>
              </div>
              <div className="space-y-1 rounded-lg border border-border p-3">
                {BIOSECURITY_CHECKLIST_ITEMS.map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium">{values[item.key]}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                <span>Status Lolos Biosecurity</span>
                <StatusBadge label={hasil === 'lolos' ? 'Lolos' : 'Tidak Lolos'} tone={hasil === 'lolos' ? 'success' : 'destructive'} />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep(2)}>Kembali</Button>
                <Button type="button" onClick={handleSubmit}>Simpan</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Verify end-to-end**

Run `npm run dev`, visit `/hasil-tangkap/biosecurity`:
- Submitting step 1 with a field missing shows the inline error and does not advance.
- Advancing to step 2, leaving one checklist item unset, and clicking "Lanjut ke Review" shows the inline error and does not advance.
- Setting every checklist item to its non-problem value (e.g. all "Sesuai"/"Bersih"/"Sehat"/"Tidak Ditemukan") and advancing to step 3 shows "Lolos" with a green `StatusBadge`.
- Going back to step 2, changing one item to its problem value (e.g. "Hama & Penyakit" → "Ditemukan"), and advancing again shows "Tidak Lolos" with a red `StatusBadge` — this proves `determineBiosecurityHasil` is genuinely wired to the live form inputs, not hardcoded.
- Clicking "Simpan" navigates back to `/hasil-tangkap` without error.

If browser automation is available, use it to drive this interaction for real (including the lolos→tidak_lolos flip) and paste the evidence into the report; otherwise verify as thoroughly as possible via code inspection and disclose the method used.

- [ ] **Step 3: Commit**

```bash
git add "app/(dashboard)/hasil-tangkap/biosecurity/page.tsx"
git commit -m "Add biosecurity-check multi-step form"
```

---

## Self-Review Notes

- **Spec coverage:** implements the design spec's `/hasil-tangkap`, `/hasil-tangkap/input`, and `/hasil-tangkap/biosecurity` routes in full, including the "Summary with tabs (Per Jenis Ikan / Per Kapal / Per Wilayah)" requirement and both multi-step forms as explicitly functional (not stubs) per the spec's interactivity table. `/koperasi`, `/pasar-industri`, `/laporan`, `/pengaturan`, `/bantuan`, `/notifikasi`, `/pencarian` remain for subsequent plans, as agreed.
- **Placeholder scan:** no TBD/TODO markers; every step has runnable code or an exact command.
- **Type consistency:** `BiosecurityChecklistItem`, `determineBiosecurityHasil`'s `Record<string,string>` input, and `JENIS_IKAN_OPTIONS` are defined once (Tasks 1-2) and consumed with matching shapes in Tasks 2, 5, and 6. `rekapPerKapal`/`rekapPerWilayah`'s `{ label, totalKg, jumlahTrip }` return shape (Task 3) matches its consumption in Task 4's `RekapRow` type exactly. The Global Constraints' `Button`+`Link` (`render` prop) and `Select`+`onValueChange` (nullable value) patterns — both discovered the hard way in prior plans — are applied consistently in every new page in this plan.
