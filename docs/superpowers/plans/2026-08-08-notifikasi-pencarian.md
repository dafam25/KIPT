# Notifikasi & Pencarian Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the two remaining global pages from the design spec: `/notifikasi` (all notifications with a category filter) and `/pencarian?q=` (global search results from the header search bar). Both are already linked from the UI today (the header's notification bell links to `/notifikasi`, the header's search form submits to `/pencarian?q=...`) and both currently 404, since neither page exists yet.

**Architecture:** Two tasks. Task 1 adds an optional category-filter prop to the existing `NotificationFeed` component (already used on `/dashboard`) and builds `/notifikasi` around it. Task 2 adds a small, framework-free `lib/search.ts` matching utility (spec-mandated: "Global search matches by name/ID within Nelayan, Kapal, and Hasil Tangkap only") and builds `/pencarian` around it, wrapped in a `Suspense` boundary as Next.js requires for any Client Component reading `useSearchParams()`.

**Tech Stack:** Next.js 16 (App Router) + TypeScript + Tailwind CSS v4, shadcn/ui on `@base-ui/react`, React Context (`DataContext`, read-only for this plan), Vitest for `lib/` unit tests.

## Global Constraints

- No new shared UI components. `PageHeader`, `DataTable`, `Select`/`SelectTrigger`/`SelectContent`/`SelectItem`/`SelectValue` are reused exactly as they exist today. `NotificationFeed` gets one new **optional** prop (backward compatible — its existing `/dashboard` usage, `<NotificationFeed limit={5} />`, must keep rendering identically) rather than being duplicated into a new component.
- **`useSearchParams()` + Suspense (new gotcha for this plan, confirmed against `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-search-params.md`):** "During production builds, a static page that calls `useSearchParams` from a Client Component must be wrapped in a `Suspense` boundary, otherwise the build fails with the Missing Suspense boundary... error." In dev mode this silently appears to work without `Suspense` since routes render on-demand — the failure only surfaces in `npm run build`. `/pencarian`'s page component must therefore be a thin wrapper: `export default function PencarianPage() { return <Suspense fallback={...}><PencarianResults /></Suspense>; }`, with the actual `useSearchParams()` call living in the inner `PencarianResults` function in the same file (not a new file — two functions in one file is not a new shared component).
- `Select` wraps `@base-ui/react/select` — `onValueChange` signature is `(value: T | null, eventDetails) => void`, so plain string setters must be wrapped: `onValueChange={(v) => setX(v ?? fallback)}`. This is already used correctly elsewhere in the codebase (e.g. `app/(dashboard)/kapal/jadwal-sandar/page.tsx:80`) — follow the same pattern.
- `/notifikasi` and `/pencarian` are **global pages, not sidebar nav items** — per the design spec they are reached via the header's bell icon (`components/layout/notification-bell.tsx:12`, already links to `/notifikasi`) and the header's search form (`components/layout/header.tsx:19`, already submits to `/pencarian?q=...`). Neither route belongs in `components/layout/nav-items.ts`, and no task in this plan touches that file.
- **Data model constraint:** `HasilTangkap` has no `nama` field (unlike `Nelayan`/`Kapal`). The global search matches it by `id` and `lokasi` instead — this is a deliberate design decision for this plan, not a spec-literal requirement, since the spec only says "matches by name/ID" without defining what "name" means for a record type that has none. `HasilTangkap` also has no detail route (`/hasil-tangkap/[id]` does not exist per the spec's routing table) — search results for it link to `/hasil-tangkap` (the list/summary page), not a nonexistent per-record page.
- Node.js/npm are not on this shell's default PATH — prepend before any npm/npx command: `export PATH="/c/Program Files/nodejs:$PATH"`.
- `npx tsc --noEmit` can fail with a `LayoutProps` error on a fresh checkout before `next build`/`next dev` has run once — a known, harmless, environment-only quirk. Run `next build` if this error appears bare.
- Read-only feature: no `DataContext` mutators are added, except that `/notifikasi` continues to call the pre-existing `markNotifikasiDibaca` exactly as `/dashboard` already does via `NotificationFeed` — no new mutator is introduced.
- Do not touch `/nelayan`, `/kapal`, `/hasil-tangkap`, `/koperasi`, `/pasar-industri`, `/laporan`, `MapView`, or `lib/stats.ts`/`lib/csv.ts` — out of scope for this plan.

---

### Task 1: `/notifikasi` page + category filter on `NotificationFeed`

**Files:**
- Modify: `components/dashboard/notification-feed.tsx`
- Create: `app/(dashboard)/notifikasi/page.tsx`

**Interfaces:**
- Consumes: `useData()` (`@/context/data-context`, already provides `notifikasi`, `markNotifikasiDibaca`); `PageHeader` (`@/components/shared/page-header`); `Select`/`SelectTrigger`/`SelectContent`/`SelectItem`/`SelectValue` (`@/components/ui/select`); `NotifikasiJenis` type (`@/lib/types`).
- Produces: `NotificationFeed` gains an optional `filterJenis?: NotifikasiJenis | 'semua'` prop (default `'semua'`, meaning no filtering — identical to today's behavior when omitted). The `/notifikasi` route.

- [ ] **Step 1: Extend `NotificationFeed` with an optional category filter**

Open `components/dashboard/notification-feed.tsx`. Replace:

```tsx
export function NotificationFeed({ limit = 5 }: { limit?: number }) {
  const { notifikasi, markNotifikasiDibaca } = useData();
  const items = [...notifikasi]
    .sort((a, b) => b.waktu.localeCompare(a.waktu))
    .slice(0, limit);

  return (
    <div className="space-y-2">
      {items.map((n) => {
```

with:

```tsx
export function NotificationFeed({
  limit,
  filterJenis = 'semua',
}: {
  limit?: number;
  filterJenis?: NotifikasiJenis | 'semua';
}) {
  const { notifikasi, markNotifikasiDibaca } = useData();
  const filtered = filterJenis === 'semua' ? notifikasi : notifikasi.filter((n) => n.jenis === filterJenis);
  const sorted = [...filtered].sort((a, b) => b.waktu.localeCompare(a.waktu));
  const items = typeof limit === 'number' ? sorted.slice(0, limit) : sorted;

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Belum ada notifikasi.</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((n) => {
```

No other line in this file changes — the closing `))}`, `</div>` etc. stay exactly as they are. `limit` is now optional with no default (previously defaulted to `5`); every existing call site must keep working, so verify the only current call site is unaffected:

- [ ] **Step 2: Confirm the existing call site is unaffected**

Read `app/(dashboard)/dashboard/page.tsx` — it calls `<NotificationFeed limit={5} />` (no `filterJenis`). Since `filterJenis` defaults to `'semua'` (no filtering) and `limit={5}` is passed explicitly, this call site's behavior is byte-for-byte identical to before your change. Do not modify `app/(dashboard)/dashboard/page.tsx` in this task — confirm by reading it, not by editing it.

- [ ] **Step 3: Create `app/(dashboard)/notifikasi/page.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { NotificationFeed } from '@/components/dashboard/notification-feed';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import type { NotifikasiJenis } from '@/lib/types';

type Kategori = NotifikasiJenis | 'semua';

const KATEGORI_OPTIONS: { value: Kategori; label: string }[] = [
  { value: 'semua', label: 'Semua Kategori' },
  { value: 'peringatan', label: 'Peringatan' },
  { value: 'informasi', label: 'Informasi' },
  { value: 'sukses', label: 'Sukses' },
  { value: 'sistem', label: 'Sistem' },
];

export default function NotifikasiPage() {
  const [kategori, setKategori] = useState<Kategori>('semua');

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Notifikasi' }]}
        title="Notifikasi"
        description="Semua notifikasi dan peringatan sistem"
      />
      <div className="max-w-xs">
        <Select value={kategori} onValueChange={(v) => setKategori((v ?? 'semua') as Kategori)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {KATEGORI_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <NotificationFeed filterJenis={kategori} />
    </div>
  );
}
```

- [ ] **Step 4: Manual verification against the dev server**

Run `export PATH="/c/Program Files/nodejs:$PATH" && npm run dev`, then:
1. Click the bell icon in the header — confirm it navigates to `/notifikasi` (proving the pre-existing link now resolves instead of 404).
2. Confirm all 18 seeded notifications render (cross-check the count against `lib/mock-data/notifikasi.ts`), sorted newest-`waktu`-first.
3. Change the category filter through each of the 5 options; confirm the list narrows to only that `jenis` (cross-check against `lib/mock-data/notifikasi.ts`'s `jenis` field counts) and back to all 18 on "Semua Kategori".
4. Click an unread notification; confirm it visually marks as read (same interaction already working on `/dashboard`) and stays read after switching the category filter and back.
5. Confirm `/dashboard` still renders its 5-item notification feed identically to before this task (no `filterJenis` prop passed there, so no visible change) — paste real curl/HTML evidence of the dashboard's notification card still showing exactly 5 items.

Paste real, literal terminal/browser output — not a paraphrase.

- [ ] **Step 5: Full verification suite**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
npx tsc --noEmit
npm run lint
npm test
npm run build
```

Expected: all four clean; build emits `/notifikasi` as a route.

- [ ] **Step 6: Commit**

```bash
git add components/dashboard/notification-feed.tsx "app/(dashboard)/notifikasi/page.tsx"
git commit -m "Add Notifikasi page with category filter"
```

**Acceptance criteria:**
- `/notifikasi` is reachable from the header's bell icon and lists every seeded notification.
- The category filter narrows the list to the selected `jenis` and includes a "Semua Kategori" option showing everything.
- `/dashboard`'s existing notification feed is visually unchanged (still exactly 5 items, unfiltered).
- `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` all pass.
- No file outside `components/dashboard/notification-feed.tsx` and `app/(dashboard)/notifikasi/page.tsx` is modified.

---

### Task 2: Global search (`lib/search.ts` + `/pencarian` page)

**Files:**
- Create: `lib/search.ts`
- Test: `lib/search.test.ts`
- Create: `app/(dashboard)/pencarian/page.tsx`

**Interfaces:**
- Consumes: `Nelayan`, `Kapal`, `HasilTangkap` types (`@/lib/types`); `useData()` (`@/context/data-context`); `PageHeader`, `DataTable`/`DataTableColumn` (`@/components/shared/*`).
- Produces: `searchGlobal(query: string, nelayan: Nelayan[], kapal: Kapal[], hasilTangkap: HasilTangkap[]): SearchResult[]` and the `SearchResult` interface, both exported from `lib/search.ts`. The `/pencarian` route.

- [ ] **Step 1: Write the failing tests**

Create `lib/search.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { searchGlobal } from './search';
import type { Nelayan, Kapal, HasilTangkap } from './types';

const nelayan: Nelayan[] = [
  { id: 'NEL-2505-000001', nama: 'Budi Santoso' } as Nelayan,
  { id: 'NEL-2505-000002', nama: 'Siti Aminah' } as Nelayan,
];

const kapal: Kapal[] = [
  { id: 'KAP-2505-00001', nama: 'KM Bahari Jaya' } as Kapal,
  { id: 'KAP-2505-00002', nama: 'KM Samudra Indah' } as Kapal,
];

const hasilTangkap: HasilTangkap[] = [
  { id: 'ht-uuid-1', lokasi: 'Perairan Selat Bali' } as HasilTangkap,
  { id: 'ht-uuid-2', lokasi: 'Perairan Utara Jawa' } as HasilTangkap,
];

describe('searchGlobal', () => {
  it('returns an empty array for an empty or whitespace-only query', () => {
    expect(searchGlobal('', nelayan, kapal, hasilTangkap)).toEqual([]);
    expect(searchGlobal('   ', nelayan, kapal, hasilTangkap)).toEqual([]);
  });

  it('matches nelayan by nama, case-insensitively', () => {
    const result = searchGlobal('budi', nelayan, kapal, hasilTangkap);
    expect(result).toEqual([
      { id: 'NEL-2505-000001', kategori: 'Nelayan', judul: 'Budi Santoso', subjudul: 'NEL-2505-000001', href: '/nelayan/NEL-2505-000001' },
    ]);
  });

  it('matches nelayan by id', () => {
    const result = searchGlobal('000002', nelayan, kapal, hasilTangkap);
    expect(result.map((r) => r.id)).toEqual(['NEL-2505-000002']);
  });

  it('matches kapal by nama, case-insensitively', () => {
    const result = searchGlobal('bahari', nelayan, kapal, hasilTangkap);
    expect(result).toEqual([
      { id: 'KAP-2505-00001', kategori: 'Kapal', judul: 'KM Bahari Jaya', subjudul: 'KAP-2505-00001', href: '/kapal/KAP-2505-00001' },
    ]);
  });

  it('matches kapal by id', () => {
    const result = searchGlobal('kap-2505-00002', nelayan, kapal, hasilTangkap);
    expect(result.map((r) => r.id)).toEqual(['KAP-2505-00002']);
  });

  it('matches hasil tangkap by lokasi, case-insensitively', () => {
    const result = searchGlobal('selat bali', nelayan, kapal, hasilTangkap);
    expect(result).toEqual([
      { id: 'ht-uuid-1', kategori: 'Hasil Tangkap', judul: 'Perairan Selat Bali', subjudul: 'ht-uuid-1', href: '/hasil-tangkap' },
    ]);
  });

  it('matches hasil tangkap by id', () => {
    const result = searchGlobal('ht-uuid-2', nelayan, kapal, hasilTangkap);
    expect(result.map((r) => r.id)).toEqual(['ht-uuid-2']);
  });

  it('returns results from all three categories when the query matches across them', () => {
    const mixedNelayan: Nelayan[] = [{ id: 'NEL-1', nama: 'Perairan Man' } as Nelayan];
    const result = searchGlobal('perairan', mixedNelayan, kapal, hasilTangkap);
    expect(result.map((r) => r.kategori)).toEqual(['Nelayan', 'Hasil Tangkap', 'Hasil Tangkap']);
  });

  it('returns an empty array when nothing matches', () => {
    expect(searchGlobal('zzz-no-match-zzz', nelayan, kapal, hasilTangkap)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `export PATH="/c/Program Files/nodejs:$PATH" && npx vitest run lib/search.test.ts`
Expected: FAIL — `lib/search.ts` does not exist yet.

- [ ] **Step 3: Implement `lib/search.ts`**

```ts
import type { Nelayan, Kapal, HasilTangkap } from './types';

export interface SearchResult {
  id: string;
  kategori: 'Nelayan' | 'Kapal' | 'Hasil Tangkap';
  judul: string;
  subjudul: string;
  href: string;
}

export function searchGlobal(
  query: string,
  nelayan: Nelayan[],
  kapal: Kapal[],
  hasilTangkap: HasilTangkap[],
): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const nelayanResults: SearchResult[] = nelayan
    .filter((n) => n.nama.toLowerCase().includes(q) || n.id.toLowerCase().includes(q))
    .map((n) => ({ id: n.id, kategori: 'Nelayan', judul: n.nama, subjudul: n.id, href: `/nelayan/${n.id}` }));

  const kapalResults: SearchResult[] = kapal
    .filter((k) => k.nama.toLowerCase().includes(q) || k.id.toLowerCase().includes(q))
    .map((k) => ({ id: k.id, kategori: 'Kapal', judul: k.nama, subjudul: k.id, href: `/kapal/${k.id}` }));

  const hasilResults: SearchResult[] = hasilTangkap
    .filter((h) => h.id.toLowerCase().includes(q) || h.lokasi.toLowerCase().includes(q))
    .map((h) => ({ id: h.id, kategori: 'Hasil Tangkap', judul: h.lokasi, subjudul: h.id, href: '/hasil-tangkap' }));

  return [...nelayanResults, ...kapalResults, ...hasilResults];
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `export PATH="/c/Program Files/nodejs:$PATH" && npx vitest run lib/search.test.ts`
Expected: PASS — all 9 tests green.

- [ ] **Step 5: Create `app/(dashboard)/pencarian/page.tsx`**

```tsx
'use client';

import { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useData } from '@/context/data-context';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { searchGlobal, type SearchResult } from '@/lib/search';

function PencarianResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const { nelayan, kapal, hasilTangkap } = useData();
  const results = useMemo(() => searchGlobal(q, nelayan, kapal, hasilTangkap), [q, nelayan, kapal, hasilTangkap]);

  const columns: DataTableColumn<SearchResult>[] = [
    { header: 'Kategori', cell: (r) => r.kategori },
    {
      header: 'Nama / Judul',
      cell: (r) => (
        <Link href={r.href} className="font-medium text-primary hover:underline">
          {r.judul}
        </Link>
      ),
    },
    { header: 'ID', cell: (r) => <span className="font-mono text-xs">{r.subjudul}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Pencarian' }]}
        title="Hasil Pencarian"
        description={q ? `Menampilkan hasil untuk "${q}"` : 'Masukkan kata kunci pencarian di kolom pencarian atas'}
      />
      <DataTable
        data={results}
        columns={columns}
        getRowKey={(r) => `${r.kategori}-${r.id}`}
        emptyMessage={q ? `Tidak ada hasil untuk "${q}"` : 'Masukkan kata kunci pencarian di kolom pencarian atas'}
      />
    </div>
  );
}

export default function PencarianPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Memuat hasil pencarian...</p>}>
      <PencarianResults />
    </Suspense>
  );
}
```

- [ ] **Step 6: Manual verification against the dev server**

Run `export PATH="/c/Program Files/nodejs:$PATH" && npm run dev`, then:
1. Type a real nelayan name (copied from `lib/mock-data/nelayan.ts`) into the header search box and submit; confirm it navigates to `/pencarian?q=<name>` and shows that nelayan as a result linking to `/nelayan/<id>`.
2. Repeat with a real kapal name from `lib/mock-data/kapal.ts` — confirm it links to `/kapal/<id>`.
3. Repeat with a substring of a real `lokasi` value from `lib/mock-data/hasil-tangkap.ts` — confirm it appears as a "Hasil Tangkap" result linking to `/hasil-tangkap`.
4. Try a query matching nothing (e.g. `zzz-no-match-zzz`) — confirm the empty-state message renders.
5. Navigate directly to `/pencarian` with no `q` param — confirm it does not crash and shows the "enter a keyword" prompt (this also proves the `Suspense` boundary works correctly in dev).

Paste real, literal terminal/browser output — not a paraphrase.

- [ ] **Step 7: Full verification suite, with special attention to the build step**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
npx tsc --noEmit
npm run lint
npm test
npm run build
```

**This task's `npm run build` step is the one that actually exercises the Suspense-boundary requirement** — `npm run dev` will not catch a missing `Suspense` wrapper (see Global Constraints). Confirm the build output does not contain a "Missing Suspense boundary" or "useSearchParams() should be wrapped in a suspense boundary" error, and that `/pencarian` appears in the emitted route list.

- [ ] **Step 8: Commit**

```bash
git add lib/search.ts lib/search.test.ts "app/(dashboard)/pencarian/page.tsx"
git commit -m "Add global search (lib/search.ts + /pencarian page)"
```

**Acceptance criteria:**
- `/pencarian?q=...` is reachable from the header's search form and shows matching Nelayan/Kapal/Hasil-Tangkap records.
- Matching is case-insensitive substring matching on name/ID (Nelayan, Kapal) or ID/lokasi (Hasil Tangkap).
- An empty or non-matching query shows an appropriate message, not a crash or a raw empty table with no explanation.
- `npm run build` succeeds with no Suspense-boundary error.
- `npx tsc --noEmit`, `npm run lint`, `npm test` all pass.
- No file outside `lib/search.ts`, `lib/search.test.ts`, `app/(dashboard)/pencarian/page.tsx` is modified.

---

## Routes created/changed

| Route | Change |
|---|---|
| `/notifikasi` | **New** — all notifications with category filter (Task 1) |
| `/pencarian` | **New** — global search results (Task 2) |

No route is deleted. No nav change is needed — both routes are reached via the header (bell icon, search form), already wired since Plan 1.

## Dependency analysis

- **Task 1** (`components/dashboard/notification-feed.tsx` + `app/(dashboard)/notifikasi/page.tsx`): no dependency on Task 2. Touches only its own files.
- **Task 2** (`lib/search.ts` + `app/(dashboard)/pencarian/page.tsx`): no dependency on Task 1. Touches only its own files.

**Parallelization:** Task 1 and Task 2 are fully code-independent — disjoint file sets, neither imports from or is consumed by the other. They are technically safe to run in parallel. `superpowers:subagent-driven-development` unconditionally forbids dispatching multiple implementer subagents in parallel regardless of independence (the same rule applied in Plans 4 and 5), so execution proceeds sequentially: **Task 1 → Task 2** (or the reverse order — there is no ordering constraint between them; Task 1 is listed first only because it was researched first).

If execution ever moves to a tool/skill that does permit parallel implementers, this is the pair to run concurrently.

## Risks / blockers

- **The Suspense/`useSearchParams` build-time gotcha (Task 2) is the main risk in this plan.** It fails silently in `npm run dev` and only surfaces in `npm run build`, so a task reviewer relying only on dev-server screenshots could wrongly approve a broken build. Task 2's Step 7 explicitly calls out running the build and checking for the specific error string.
- **`NotificationFeed`'s signature change (Task 1) is a shared-component edit** — low risk since it's purely additive (new optional prop, old behavior preserved when omitted), but the task reviewer should specifically confirm the `/dashboard` call site was not touched and still renders identically, per Step 2's explicit instruction to read-not-edit that file.
- **Search result key collisions:** `getRowKey={(r) => \`${r.kategori}-${r.id}\`}` guards against two different entity types coincidentally sharing an `id` string (unlikely given the ID formats — `NEL-...`, `KAP-...`, and raw UUIDs never collide in practice — but the prefix costs nothing and removes the theoretical risk).
- **No blocker identified that would prevent starting either task immediately** — both are fully self-contained given the current state of `master`.

## Test / verification requirements

- `lib/search.test.ts`: unit tests for `searchGlobal` covering all three entity types, case-insensitivity, empty query, and no-match cases.
- No new tests needed for `NotificationFeed`'s extension — this project's stated testing policy is `lib/`-only unit tests with UI verified manually (consistent with `DataTable`, `KpiCard`, and every other shared UI component having no test file).
- Manual dev-server verification for both new pages, with literal pasted evidence per the standing verification-integrity rule (a prior incident on this project involved fabricated/truncated IDs in a self-report).
- `npm run build` must be run and its output checked for the Suspense-boundary error string specifically for Task 2 — this is the one check in this plan that a dev-server-only verification would miss entirely.
- `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` must all pass at the end of every task.
