# Design Gap Remediation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the one remaining P1 finding from `docs/audits/2026-08-09-visual-fidelity-post-implementation-audit.md` (the Pasar/Industri table clipping, and its latent twins on other tables), then close as much of the **structural** (not cosmetic) gap on `/peta-tracking`, `/laporan`, `/pengaturan`, and `/bantuan` as can be done **honestly** — using only real, existing data and features. P2 cosmetic findings are explicitly out of scope. Every task preserves existing business logic and reuses existing components; the only new files are one small presentational chart component and nothing else.

**Architecture:** 11 tasks in 5 independent groups (P1 fix; Peta Tracking ×5; Laporan ×2; Pengaturan ×1; Bantuan ×2). Groups are file-disjoint from each other. Within a group, tasks are sequential because they share files. Priority order matches the user's request: the P1 fix first, then the four structural routes in the order given (Peta Tracking → Laporan → Pengaturan → Bantuan).

**Tech Stack:** Next.js 16 (App Router) + TypeScript + Tailwind CSS v4, Recharts (existing dependency — adds one new small chart component, no new library), lucide-react (existing dependency), react-leaflet + Leaflet (existing dependency — adds a second `TileLayer` option, no new library).

## Global Constraints

- **This plan preserves all existing business logic and working features.** No existing route, mutator, or field is removed or renamed. Every addition is either new UI over existing data, or genuinely new but transparently-labeled content (see honesty rule below).
- **The honesty rule — read this before touching any task below.** Several mockup elements imply data or subsystems this app does not have (a multi-user account system, a report-generation/archive subsystem, vessel telemetry like fuel consumption or distance-from-reference-point, a documentation/article library). This plan follows the same discipline the previous Visual Fidelity Plan established for KPI deltas: **decorate only on top of something real; never fabricate a number or a record that implies a subsystem that doesn't exist.** Where the mockup requires exactly that kind of fabrication, this plan explicitly defers it (see each task's "Deliberately deferred" note) rather than build a misleading placeholder. Three sanctioned techniques appear repeatedly below, and are not repeated as a finding each time:
  1. **Reuse a real, already-computed value** (e.g. `Kapal.kecepatanKnot`, FAQ/ticket counts, `rekapPerWilayah`) — always preferred.
  2. **Reuse the app's own existing "requires backend" pattern** — `/pengaturan`'s decorative tabs already show a card saying a feature "akan tersedia setelah sistem akun & backend diimplementasikan" with a `showComingSoonToast()` button. This is the established, honest way to represent a mockup section this app's v1 scope cannot support — use it again rather than inventing fake data for the same class of gap.
  3. **Add real, functional client-side behavior over real data** (search, filter, date-range) — same pattern as `DataTable`'s existing search box.
- **No P2 work.** Breadcrumb chevron-vs-slash, sidebar nav arrows, the `/nelayan/[id]` "Foto" placeholder, the sidebar "System Status: Online" indicator, and info-card mini-card styling are explicitly out of scope for this plan.
- **Reuse existing components.** This plan adds exactly one new file: `components/dashboard/top-ranking-bar-chart.tsx` (Task 7 needs a horizontal bar chart; nothing existing covers it — `DonutChart` and `TrendLineChart` are both the wrong shape). Every other task modifies existing files only.
- **Deliberately out of scope for `/laporan` — needs a product decision, not an engineering one.** The mockup organizes Laporan by report category (Ringkasan/Operasional/Keuangan/Kepatuhan/Kinerja/Khusus) with a "Detail Laporan" archive table of 128 generated report documents (name, author, file size, generated timestamp) and "Laporan Populer"/"Laporan Terbaru" sidebar lists of those same fabricated documents. This app has no report-generation or document-storage subsystem — there is no real data to populate a single row of that table. Reorganizing the existing, real, entity-based tabs (Hasil Tangkap/Koperasi/Pasar-Industri) into the mockup's category taxonomy would also require deciding which real data maps to "Kepatuhan" or "Kinerja," which isn't an engineering call. **This plan does not attempt either change.** It closes the two structural gaps that don't require fabrication (Top-5 rankings, a date filter) and leaves the IA and the report archive for a follow-up product decision.
- **Deliberately out of scope for `/pengaturan` — same reasoning.** The mockup's KPI row (Pengguna Aktif: 245, Notifikasi Sistem: 128, etc.) describes a multi-user system this app doesn't have (exactly one hardcoded "Admin DKP" identity, no auth). So does the right-sidebar "Informasi Akun" (Login Terakhir, IP Address) and "Keamanan Akun" (2FA, active sessions) block. Fabricating these would misrepresent the app as having account/security infrastructure it doesn't. This plan adds the one section that's genuinely just display preferences (`Konfigurasi Aplikasi`) and reuses the existing "requires backend" pattern for `Manajemen Pengguna`; it does not touch the KPI row or the account/security sidebar.
- **Deliberately out of scope for `/bantuan`.** The mockup's "Artikel Panduan" (128) and "Video Tutorial" (36) KPI cards describe a content library this app doesn't have. This plan's KPI row uses only the two counts that are genuinely real (FAQ count, ticket count) plus two purely-decorative labels that don't imply fabricated depth (see Task 10).
- **Deliberately out of scope for `/peta-tracking`.** The mockup's per-vessel "X.X km dari lokasi" figure requires a reference point (e.g. the viewer's location, or a fixed port) this app's data model has no concept of. This plan surfaces the sibling field that *is* real (`kecepatanKnot`, knots) and skips distance. The mockup's per-vessel "Timeline Pergerakan Kapal" (a discrete trip-stage log: Berangkat/Zona Penangkapan/Hasil Tangkapan/Kembali/Sandar with real timestamps) has no backing event log either — this plan's "Aktivitas Terbaru" instead narrates real `HasilTangkap` records (which do have a real vessel, location, weight, and timestamp) rather than fabricate a stage-by-stage log.
- Node.js/npm are not on this shell's default PATH — prepend before any npm/npx command: `export PATH="/c/Program Files/nodejs:$PATH"`.
- `npx tsc --noEmit` can fail with a `LayoutProps` error on a fresh checkout before `next build`/`next dev` has run once — a known, harmless, environment-only quirk. Run `next build` if this error appears bare.
- Do not touch `lib/csv.ts`, `lib/search.ts`, `lib/id.ts`, or any existing form-submission/validation logic.

---

### Task 1: Harden `DataTable`-based lists against long-text column clipping (P1 fix)

**Files:**
- Modify: `app/(dashboard)/pasar-industri/page.tsx` (required — this is the confirmed clipping bug)
- Modify: `app/(dashboard)/koperasi/page.tsx` (defensive — same risk, not yet triggered)
- Modify: `app/(dashboard)/kapal/page.tsx` (defensive — same risk, not yet triggered)
- Modify: `app/(dashboard)/nelayan/page.tsx` (defensive — same risk, not yet triggered)

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing new. Isolated from every other task in this plan — no other task touches these 4 files.

**Diagnosis (confirmed in the post-implementation audit, not to be re-derived):** `/pasar-industri`'s table is 33px wider than its `overflow-x-auto` container at 1440px (`scrollWidth: 1167` vs `clientWidth: 1134`, programmatically verified), clipping the `Status` badge text mid-word (e.g. "Tidak A…"). The container *is* scrollable (`overflowX: auto`), but there's no visible scrollbar affordance, so the clipped text is practically undiscoverable. Root cause: the `Pengelola` column renders unbounded company names (e.g. "Gutkowski, Toy and Vandervort-Bode") with no width cap — the same root-cause class Task 1 of the original Visual Fidelity Plan fixed for Hasil Tangkap's `Jenis Ikan` column. `Koperasi`'s `Ketua` column, `Kapal`'s `Pelabuhan Induk`/`Nahkoda` columns, and `Nelayan`'s `Koperasi` column carry the identical risk (unbounded free text in a table with 6-7 total columns) — they don't currently overflow only because the current seed data's values happen to be short enough, not because anything caps them. Applying the same fix pattern to all of them now prevents this exact bug from resurfacing the next time seed data regenerates with a longer name.

- [ ] **Step 1: Fix `/pasar-industri`'s `Pengelola` column**

In `app/(dashboard)/pasar-industri/page.tsx`, replace:

```tsx
    { header: 'Pengelola', cell: (p) => p.pengelola },
```

with:

```tsx
    {
      header: 'Pengelola',
      cell: (p) => (
        <span className="block max-w-40 truncate" title={p.pengelola}>
          {p.pengelola}
        </span>
      ),
    },
```

- [ ] **Step 2: Harden `/koperasi`'s `Ketua` column**

In `app/(dashboard)/koperasi/page.tsx`, replace:

```tsx
    { header: 'Ketua', cell: (k) => k.ketua },
```

with:

```tsx
    {
      header: 'Ketua',
      cell: (k) => (
        <span className="block max-w-40 truncate" title={k.ketua}>
          {k.ketua}
        </span>
      ),
    },
```

- [ ] **Step 3: Harden `/kapal`'s `Pelabuhan Induk` and `Nahkoda` columns**

In `app/(dashboard)/kapal/page.tsx`, replace:

```tsx
    { header: 'Pelabuhan Induk', cell: (k) => k.pelabuhanInduk },
    { header: 'Nahkoda', cell: (k) => nelayan.find((n) => n.id === k.nahkodaId)?.nama ?? '-' },
```

with:

```tsx
    {
      header: 'Pelabuhan Induk',
      cell: (k) => (
        <span className="block max-w-36 truncate" title={k.pelabuhanInduk}>
          {k.pelabuhanInduk}
        </span>
      ),
    },
    {
      header: 'Nahkoda',
      cell: (k) => {
        const nama = nelayan.find((n) => n.id === k.nahkodaId)?.nama ?? '-';
        return (
          <span className="block max-w-36 truncate" title={nama}>
            {nama}
          </span>
        );
      },
    },
```

- [ ] **Step 4: Harden `/nelayan`'s `Koperasi` column**

In `app/(dashboard)/nelayan/page.tsx`, replace:

```tsx
    { header: 'Koperasi', cell: (n) => koperasi.find((k) => k.id === n.koperasiId)?.nama ?? '-' },
```

with:

```tsx
    {
      header: 'Koperasi',
      cell: (n) => {
        const nama = koperasi.find((k) => k.id === n.koperasiId)?.nama ?? '-';
        return (
          <span className="block max-w-40 truncate" title={nama}>
            {nama}
          </span>
        );
      },
    },
```

- [ ] **Step 5: Manual verification against the dev server**

Run the dev server and check `/pasar-industri` at 1440px: confirm the `Status` column is now fully visible with no clipping (compare table `scrollWidth` vs `clientWidth` programmatically — they should now be equal, or the remaining gap should be well under the container width). Confirm `Koperasi`/`Kapal`/`Nelayan` still render every column correctly with no visual regression (truncation only kicks in if a value actually exceeds the max-width; verify at least one row on each page still shows its full un-truncated value where the value is short). Paste real screenshot/DOM-measurement evidence, not a description.

- [ ] **Step 6: Full verification suite**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
npx tsc --noEmit
npm run lint
npm test
npm run build
```

- [ ] **Step 7: Commit**

```bash
git add "app/(dashboard)/pasar-industri/page.tsx" "app/(dashboard)/koperasi/page.tsx" "app/(dashboard)/kapal/page.tsx" "app/(dashboard)/nelayan/page.tsx"
git commit -m "Harden entity table long-text columns against overflow clipping"
```

**Acceptance criteria:**
- `/pasar-industri`'s `Status` column is fully visible at 1440px with no clipping.
- `Koperasi`, `Kapal`, and `Nelayan` tables show no visual regression; truncation is a no-op for values that already fit.
- `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` all pass.

---

### Task 2: Peta Tracking — status/jenis filters + reuse `WeatherWidget`

**Files:**
- Modify: `app/(dashboard)/peta-tracking/page.tsx`

**Interfaces:**
- Consumes: `WeatherWidget` (`@/components/dashboard/weather-widget`, already exists, zero props — already used on `/dashboard`, simply not on this page). `Select`/`SelectTrigger`/`SelectContent`/`SelectItem`/`SelectValue` (`@/components/ui/select`, already used throughout the app).
- Produces: a `filteredKapal` derived array and the `statusFilter`/`jenisFilter` state this task introduces. Task 3 (card-style vessel list) and Task 6 (Aktivitas Terbaru) both read `filteredKapal` instead of the raw `kapal` array — this task must land first.

The mockup's Peta Tracking screen (confirmed directly from the mockup slide, not inferred) shows a "Semua Wilayah" dropdown + a "Filter" control above the map, and a weather card in the same position `/dashboard` already uses `WeatherWidget` for. Both are real, low-risk wins: the filters operate on real `Kapal.status`/`Kapal.jenis` fields, and the weather widget is a direct, zero-cost component reuse.

- [ ] **Step 1: Add filter state and a derived `filteredKapal`**

In `app/(dashboard)/peta-tracking/page.tsx`, add to the imports:

```tsx
import { useMemo, useState } from 'react';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { WeatherWidget } from '@/components/dashboard/weather-widget';
```

Inside `PetaTrackingPage`, after `const { kapal } = useData();`, add:

```tsx
  const [statusFilter, setStatusFilter] = useState('semua');
  const [jenisFilter, setJenisFilter] = useState('semua');

  const jenisOptions = useMemo(() => [...new Set(kapal.map((k) => k.jenis))].sort(), [kapal]);

  const filteredKapal = useMemo(
    () =>
      kapal.filter(
        (k) =>
          (statusFilter === 'semua' || k.status === statusFilter) &&
          (jenisFilter === 'semua' || k.jenis === jenisFilter),
      ),
    [kapal, statusFilter, jenisFilter],
  );
```

- [ ] **Step 2: Render the filter row + weather widget, and feed `filteredKapal` into the map**

Replace:

```tsx
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Ship} label="Total Kapal Aktif" value={formatNumber(totalKapal(kapal))} accent="blue" />
        <KpiCard icon={Anchor} label="Kapal Melaut" value={formatNumber(kapalMelautCount(kapal))} accent="green" />
        <KpiCard icon={PauseCircle} label="Kapal Sandar" value={formatNumber(kapalSandarCount(kapal))} accent="cyan" />
        <KpiCard icon={AlertTriangle} label="Kapal Tidak Aktif" value={formatNumber(kapalTidakAktifCount(kapal))} accent="purple" />
      </div>

      <MapView kapal={kapal} height={480} />
```

with:

```tsx
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Ship} label="Total Kapal Aktif" value={formatNumber(totalKapal(kapal))} accent="blue" />
        <KpiCard icon={Anchor} label="Kapal Melaut" value={formatNumber(kapalMelautCount(kapal))} accent="green" />
        <KpiCard icon={PauseCircle} label="Kapal Sandar" value={formatNumber(kapalSandarCount(kapal))} accent="cyan" />
        <KpiCard icon={AlertTriangle} label="Kapal Tidak Aktif" value={formatNumber(kapalTidakAktifCount(kapal))} accent="purple" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-44">
          <Select
            items={[{ value: 'semua', label: 'Semua Status' }, ...Object.entries(KAPAL_STATUS_LABEL).map(([value, label]) => ({ value, label }))]}
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v ?? 'semua')}
          >
            <SelectTrigger aria-label="Filter status kapal"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Status</SelectItem>
              {Object.entries(KAPAL_STATUS_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <Select
            items={[{ value: 'semua', label: 'Semua Jenis Kapal' }, ...jenisOptions.map((j) => ({ value: j, label: j }))]}
            value={jenisFilter}
            onValueChange={(v) => setJenisFilter(v ?? 'semua')}
          >
            <SelectTrigger aria-label="Filter jenis kapal"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Jenis Kapal</SelectItem>
              {jenisOptions.map((j) => (
                <SelectItem key={j} value={j}>{j}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <MapView kapal={filteredKapal} height={480} />
        </div>
        <WeatherWidget />
      </div>
```

`KAPAL_STATUS_LABEL` is already imported at the top of this file (used by the table's `Status` column) — no new import needed for it.

- [ ] **Step 3: Manual verification against the dev server**

Start the dev server, open `/peta-tracking`, and confirm: the status/jenis dropdowns render, selecting "Sandar" reduces the map markers and (once Task 3 lands) the vessel list to only sandar vessels, selecting "Semua Status"/"Semua Jenis Kapal" restores the full set, and the weather widget renders beside the map matching `/dashboard`'s existing styling. Paste real screenshots at both the unfiltered and filtered states.

- [ ] **Step 4: Full verification suite**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
npx tsc --noEmit
npm run lint
npm test
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add "app/(dashboard)/peta-tracking/page.tsx"
git commit -m "Add status/jenis filters and weather widget to Peta Tracking"
```

**Acceptance criteria:**
- Status and Jenis filters narrow both the map and (after Task 3) the vessel list correctly; "Semua" values restore the unfiltered set.
- `WeatherWidget` renders beside the map, matching `/dashboard`'s existing usage.
- The 4 existing KPI cards remain untouched and continue to reflect the full (unfiltered) fleet, matching their existing, already-correct semantics.
- `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` all pass.

---

### Task 3: Peta Tracking — convert the vessel list to a compact card-row list showing real speed

**Files:**
- Modify: `app/(dashboard)/peta-tracking/page.tsx`

**Interfaces:**
- Consumes: `filteredKapal` (from Task 2, must run first). `Kapal.kecepatanKnot` (already exists on the type, not currently displayed anywhere in the app).
- Produces: nothing new. Task 4 (detail panel) adds a click handler to the rows this task creates — must run after this task.

The mockup's "Daftar Kapal Terpantau" sidebar shows each vessel as a compact row with an icon, name, jenis + status badge, and a "XX knot" speed reading. `Kapal.kecepatanKnot` already exists on the data model — this is a real field the current implementation simply never surfaces. The mockup also shows "X.X km dari lokasi" per vessel; this plan does not add that (see Global Constraints — no reference point exists in the data model to compute a real distance).

- [ ] **Step 1: Replace the plain 3-column table with a card-row list**

Replace:

```tsx
  const columns: DataTableColumn<Kapal>[] = [
    { header: 'Nama Kapal', cell: (k) => k.nama },
    { header: 'Jenis', cell: (k) => k.jenis },
    { header: 'Status', cell: (k) => <StatusBadge label={KAPAL_STATUS_LABEL[k.status]} tone={KAPAL_STATUS_TONE[k.status]} /> },
  ];
```

with:

```tsx
  const [search, setSearch] = useState('');
  const searchedKapal = filteredKapal.filter((k) => k.nama.toLowerCase().includes(search.toLowerCase()));
```

Replace the `Card` block that renders `DataTable`:

```tsx
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
```

with:

```tsx
      <Card>
        <CardHeader className="text-sm font-semibold">Daftar Kapal Terpantau</CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama kapal..."
            className="max-w-sm"
          />
          <div className="divide-y divide-border">
            {searchedKapal.map((k) => (
              <div key={k.id} className="flex items-center gap-3 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Ship className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{k.nama}</p>
                  <p className="text-xs text-muted-foreground">{k.jenis}</p>
                </div>
                <StatusBadge label={KAPAL_STATUS_LABEL[k.status]} tone={KAPAL_STATUS_TONE[k.status]} />
                <span className="w-16 shrink-0 text-right text-sm text-muted-foreground">
                  {k.status === 'melaut' ? `${k.kecepatanKnot} knot` : '—'}
                </span>
              </div>
            ))}
            {searchedKapal.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">Tidak ada kapal yang cocok.</p>
            )}
          </div>
        </CardContent>
      </Card>
```

Speed is only shown for vessels currently `melaut` (a stationary/sandar vessel's "current knot speed" isn't a meaningful reading) — `kecepatanKnot` on the type represents the vessel's rated/typical cruising speed, so gating its display to `melaut` avoids implying a docked vessel is moving.

Remove the now-unused `DataTableColumn` import and `DataTable`/`Kapal` type import if no longer referenced elsewhere in the file (check before removing — `Kapal` is still used as the `kapal` prop's element type elsewhere; only drop what's genuinely unused). Add `Input` to the imports: `import { Input } from '@/components/ui/input';`.

- [ ] **Step 2: Manual verification against the dev server**

Confirm the vessel list now renders as rows with icon, name, jenis, status badge, and a knot-speed reading for `melaut` vessels (and an em-dash for non-melaut ones). Confirm the search box still filters by name, and that changing the Task 2 status/jenis filters also narrows this list (since it now reads `filteredKapal`). Paste real screenshots.

- [ ] **Step 3: Full verification suite**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
npx tsc --noEmit
npm run lint
npm test
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add "app/(dashboard)/peta-tracking/page.tsx"
git commit -m "Show vessel list as card rows with real speed reading"
```

**Acceptance criteria:**
- Vessel list shows icon, name, jenis, status badge, and real `kecepatanKnot` for melaut vessels.
- Search and the Task 2 filters both narrow this list correctly.
- No fabricated "distance from location" field is added.
- `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` all pass.

---

### Task 4: Peta Tracking — "Detail Kapal Terpilih" panel on selection

**Files:**
- Modify: `app/(dashboard)/peta-tracking/page.tsx`
- Modify: `components/dashboard/map-view.tsx`

**Interfaces:**
- Consumes: the card-row list from Task 3 (must run first — this task adds an `onClick` to those rows).
- Produces: `MapView` gains an optional `onSelectKapal?: (id: string) => void` prop. `/dashboard`'s existing `<MapView kapal={kapal} height={...} />` call is unaffected (the prop is optional) — no other file needs to change.

Clicking a vessel row (or its map marker) shows a compact detail card with real fields and one real action: a link to the vessel's actual detail page. The mockup shows a name/badge/specs block with action buttons; this plan implements exactly one action button rather than inventing 2 more to hit the mockup's button count, since a real, meaningful action beats decorative dead-end buttons.

- [ ] **Step 1: Add an optional selection callback to `MapView`**

In `components/dashboard/map-view.tsx`, change the function signature:

```tsx
export function MapView({ kapal, height = 400 }: { kapal: Kapal[]; height?: number }) {
```

to:

```tsx
export function MapView({
  kapal,
  height = 400,
  onSelectKapal,
}: {
  kapal: Kapal[];
  height?: number;
  onSelectKapal?: (id: string) => void;
}) {
```

Then add an `eventHandlers` prop to the existing `<Marker>` so a marker click also selects that vessel, without changing anything else about the marker:

```tsx
        {kapal.map((k) => (
          <Marker
            key={k.id}
            position={[k.posisi.lat, k.posisi.lng]}
            icon={VESSEL_ICONS[k.status]}
            eventHandlers={onSelectKapal ? { click: () => onSelectKapal(k.id) } : undefined}
          >
```

(The closing `</Marker>` and its `<Popup>` content are unchanged.)

- [ ] **Step 2: Add selection state and the detail panel in `peta-tracking/page.tsx`**

Add to the imports: `import { StatusBadge } from '@/components/shared/status-badge';` is already imported; add `import Link from 'next/link';` and `import { Button } from '@/components/ui/button';` and `import { ExternalLink } from 'lucide-react';`.

After the `filteredKapal` memo from Task 2, add:

```tsx
  const [selectedKapalId, setSelectedKapalId] = useState<string | null>(null);
  const selectedKapal = kapal.find((k) => k.id === selectedKapalId) ?? null;
```

Pass `onSelectKapal={setSelectedKapalId}` to the `MapView` call from Task 2:

```tsx
          <MapView kapal={filteredKapal} height={480} onSelectKapal={setSelectedKapalId} />
```

Make each vessel row from Task 3 clickable — add `onClick={() => setSelectedKapalId(k.id)}` and `role="button"` and a hover style to the row `<div>`:

```tsx
              <div
                key={k.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedKapalId(k.id)}
                className="flex cursor-pointer items-center gap-3 py-3 hover:bg-muted/40"
              >
```

Finally, render the detail panel — insert it directly after the filter row + map/weather grid (from Task 2), before the "Daftar Kapal Terpantau" `Card`:

```tsx
      {selectedKapal && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between text-sm font-semibold">
            Detail Kapal Terpilih
            <button
              type="button"
              onClick={() => setSelectedKapalId(null)}
              className="text-xs font-normal text-muted-foreground hover:text-foreground"
            >
              Tutup
            </button>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-6">
            <div>
              <p className="text-base font-semibold">{selectedKapal.nama}</p>
              <p className="text-sm text-muted-foreground">{selectedKapal.jenis} &middot; {selectedKapal.gt} GT</p>
            </div>
            <StatusBadge label={KAPAL_STATUS_LABEL[selectedKapal.status]} tone={KAPAL_STATUS_TONE[selectedKapal.status]} />
            <div className="text-sm text-muted-foreground">
              Pelabuhan Induk: <span className="text-foreground">{selectedKapal.pelabuhanInduk}</span>
            </div>
            {selectedKapal.status === 'melaut' && (
              <div className="text-sm text-muted-foreground">
                Kecepatan: <span className="text-foreground">{selectedKapal.kecepatanKnot} knot</span>
              </div>
            )}
            <Button size="sm" render={<Link href={`/kapal/${selectedKapal.id}`} />} className="ml-auto">
              <ExternalLink className="mr-2 h-4 w-4" />
              Lihat Detail Kapal
            </Button>
          </CardContent>
        </Card>
      )}
```

- [ ] **Step 3: Manual verification against the dev server**

Confirm clicking a vessel row opens the detail panel with correct fields; clicking a map marker does the same; clicking "Tutup" closes it; clicking "Lihat Detail Kapal" navigates to the real `/kapal/[id]` page for that vessel. Paste real screenshots of the panel open and of the resulting navigation.

- [ ] **Step 4: Full verification suite**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
npx tsc --noEmit
npm run lint
npm test
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add "app/(dashboard)/peta-tracking/page.tsx" "components/dashboard/map-view.tsx"
git commit -m "Add Detail Kapal Terpilih panel on marker/row selection"
```

**Acceptance criteria:**
- Selecting a vessel (row or marker) shows a detail panel with real fields and a working link to the real vessel detail page.
- `/dashboard`'s existing `MapView` usage is unaffected (the new prop is optional).
- `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` all pass.

---

### Task 5: Peta Tracking — Peta/Satelit tile toggle

**Files:**
- Modify: `components/dashboard/map-view.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing new (internal state only).

The mockup's map shows a small view-mode control. This plan implements it as a real, working toggle between two genuine tile providers — the existing CARTO dark basemap ("Peta") and Esri's public World Imagery service ("Satelit", real aerial/satellite imagery, no API key required for this attribution-only tier) — rather than a decorative button that doesn't change anything.

- [ ] **Step 1: Add a tile-mode toggle**

In `components/dashboard/map-view.tsx`, add `useState` to the React import: `import { useEffect, useState } from 'react';`.

Inside `MapView`, after the `useData()` line, add:

```tsx
  const [tileMode, setTileMode] = useState<'peta' | 'satelit'>('peta');
```

Replace:

```tsx
    <div style={{ height }} className="overflow-hidden rounded-lg border border-border">
      <MapContainer center={[-2.5, 118]} zoom={5} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap contributors &copy; CARTO"
        />
```

with:

```tsx
    <div style={{ height }} className="relative overflow-hidden rounded-lg border border-border">
      <div className="absolute top-2 right-2 z-[1000] flex overflow-hidden rounded-md border border-border bg-card text-xs">
        <button
          type="button"
          onClick={() => setTileMode('peta')}
          className={tileMode === 'peta' ? 'bg-primary px-3 py-1.5 text-primary-foreground' : 'px-3 py-1.5 text-muted-foreground hover:text-foreground'}
        >
          Peta
        </button>
        <button
          type="button"
          onClick={() => setTileMode('satelit')}
          className={tileMode === 'satelit' ? 'bg-primary px-3 py-1.5 text-primary-foreground' : 'px-3 py-1.5 text-muted-foreground hover:text-foreground'}
        >
          Satelit
        </button>
      </div>
      <MapContainer center={[-2.5, 118]} zoom={5} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        {tileMode === 'peta' ? (
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution="&copy; OpenStreetMap contributors &copy; CARTO"
          />
        ) : (
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics"
          />
        )}
```

The `z-[1000]` matches Leaflet's own control z-index convention (Leaflet's built-in zoom control already sits at a comparably high z-index) so the toggle renders above the map tiles and markers, not beneath them.

- [ ] **Step 2: Manual verification against the dev server**

Confirm both `/dashboard` and `/peta-tracking` show the Peta/Satelit toggle in the map's top-right corner, defaulting to "Peta" (unchanged from before), and clicking "Satelit" swaps to real satellite/aerial imagery tiles that visibly differ from the dark basemap. Confirm markers and the click-to-select behavior from Task 4 still work in both tile modes. Paste real screenshots of both modes.

- [ ] **Step 3: Full verification suite**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
npx tsc --noEmit
npm run lint
npm test
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/map-view.tsx
git commit -m "Add working Peta/Satelit tile toggle to MapView"
```

**Acceptance criteria:**
- The toggle renders on every page using `MapView` (`/dashboard` and `/peta-tracking`), defaults to the existing dark basemap, and genuinely switches to real satellite imagery tiles.
- Markers, popups, and selection (Task 4) work identically in both modes.
- `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` all pass.

---

### Task 6: Peta Tracking — "Aktivitas Terbaru" panel from real Hasil Tangkap records

**Files:**
- Modify: `app/(dashboard)/peta-tracking/page.tsx`

**Interfaces:**
- Consumes: `hasilTangkap` (`useData()`, already available app-wide — this page doesn't currently read it).
- Produces: nothing new.

The mockup's sidebar shows a short list of recent fleet events. This app has no discrete vessel-event log (no "departed," "entered zone," "docked" timestamps), but it does have real `HasilTangkap` records — each with a real vessel, location, weight, and timestamp. This task narrates the 5 most recent ones as a real activity feed, instead of fabricating a vessel-event log that doesn't exist.

- [ ] **Step 1: Compute the 5 most recent Hasil Tangkap records**

Add `hasilTangkap` to the `useData()` destructure: `const { kapal, hasilTangkap } = useData();`.

After the `selectedKapal` line from Task 4, add:

```tsx
  const aktivitasTerbaru = useMemo(
    () =>
      [...hasilTangkap]
        .sort((a, b) => `${b.tanggal}${b.waktuSelesai}`.localeCompare(`${a.tanggal}${a.waktuSelesai}`))
        .slice(0, 5)
        .map((h) => ({
          id: h.id,
          kapalNama: kapal.find((k) => k.id === h.kapalId)?.nama ?? h.kapalId,
          beratKg: h.jenisIkan.reduce((sum, j) => sum + j.beratKg, 0),
          lokasi: h.lokasi,
          tanggal: h.tanggal,
        })),
    [hasilTangkap, kapal],
  );
```

- [ ] **Step 2: Render the panel**

Add `import { formatDate, formatNumber } from '@/lib/format';` if `formatNumber` isn't already imported (it is, per the existing KPI cards — only add `formatDate` if missing).

Insert a new `Card` after the "Daftar Kapal Terpantau" card (at the end of the page, before the closing `</div>`):

```tsx
      <Card>
        <CardHeader className="text-sm font-semibold">Aktivitas Terbaru</CardHeader>
        <CardContent className="space-y-3">
          {aktivitasTerbaru.map((a) => (
            <div key={a.id} className="flex items-start gap-3 text-sm">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                <Fish className="h-3.5 w-3.5" />
              </span>
              <div>
                <p>
                  <span className="font-medium">{a.kapalNama}</span> mendapatkan {formatNumber(a.beratKg)} kg hasil tangkapan di {a.lokasi}
                </p>
                <p className="text-xs text-muted-foreground">{formatDate(a.tanggal)}</p>
              </div>
            </div>
          ))}
          {aktivitasTerbaru.length === 0 && (
            <p className="text-sm text-muted-foreground">Belum ada aktivitas tercatat.</p>
          )}
        </CardContent>
      </Card>
```

Add `Fish` to the existing `lucide-react` import line.

- [ ] **Step 3: Manual verification against the dev server**

Confirm the "Aktivitas Terbaru" panel shows the 5 most recent Hasil Tangkap entries, sorted newest-first, with correct vessel name, weight, location, and date — cross-check against `/hasil-tangkap`'s own "Data Hasil Tangkapan Terbaru" table for the same top entries. Paste real screenshots.

- [ ] **Step 4: Full verification suite**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
npx tsc --noEmit
npm run lint
npm test
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add "app/(dashboard)/peta-tracking/page.tsx"
git commit -m "Add Aktivitas Terbaru panel from real Hasil Tangkap records"
```

**Acceptance criteria:**
- The panel shows the 5 most recent real Hasil Tangkap records, correctly sorted and formatted.
- No fabricated vessel-event log (departure/arrival/zone-entry timestamps) is introduced.
- `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` all pass.

---

### Task 7: Laporan — Top 5 Jenis Ikan / Top 5 Wilayah horizontal bar charts

**Files:**
- Create: `components/dashboard/top-ranking-bar-chart.tsx`
- Modify: `app/(dashboard)/laporan/page.tsx`

**Interfaces:**
- Consumes: `komposisiHasilTangkap` and `rekapPerWilayah` (`@/lib/stats`, both already exist and are already computed/used elsewhere — `komposisiHasilTangkap` already backs this page's donut chart; `rekapPerWilayah` is already used by `/hasil-tangkap`'s "Per Wilayah" tab, just not here).
- Produces: `TopRankingBarChart` component (`@/components/dashboard/top-ranking-bar-chart`), props `{ data: { label: string; value: number }[]; unit: string }`. Task 8 (date filter) reads this same tab's data and must run after this task.

The mockup shows "Top 5 Jenis Ikan" and "Top 5 Wilayah Distribusi" as horizontal bar charts on the Ringkasan view. Both aggregations already exist as pure functions in `lib/stats.ts` — this task adds only a presentational chart (no existing component renders a ranked horizontal bar list; `DonutChart` and `TrendLineChart` are both the wrong shape) and slices the top 5 from data already computed on this page.

- [ ] **Step 1: Create `components/dashboard/top-ranking-bar-chart.tsx`**

```tsx
'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, LabelList } from 'recharts';
import { formatNumber } from '@/lib/format';

const COLORS = ['var(--success)', 'var(--primary)', 'var(--accent)', 'hsl(280 60% 60%)', 'var(--muted-foreground)'];

export function TopRankingBarChart({ data, unit }: { data: { label: string; value: number }[]; unit: string }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 40)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 40, bottom: 4, left: 8 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
        <Tooltip formatter={(value) => `${formatNumber(Number(value))} ${unit}`} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((entry, i) => (
            <Cell key={entry.label} fill={COLORS[i % COLORS.length]} />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            formatter={(v: number) => `${formatNumber(v)} ${unit}`}
            fill="var(--foreground)"
            fontSize={12}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 2: Add the two Top-5 charts to Laporan's Hasil Tangkap tab**

In `app/(dashboard)/laporan/page.tsx`, add the import: `import { TopRankingBarChart } from '@/components/dashboard/top-ranking-bar-chart';` and `import { rekapPerWilayah } from '@/lib/stats';` (add `rekapPerWilayah` to the existing `@/lib/stats` import line rather than a second import statement).

Add a memo alongside the existing `komposisiIkan`/`trenIkan` memos:

```tsx
  const wilayahRanking = useMemo(() => rekapPerWilayah(hasilTangkap), [hasilTangkap]);
```

Insert a new `Card` inside the `hasil-tangkap` `TabsContent`, after the existing "Komposisi per Jenis Ikan" `Card`:

```tsx
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="text-sm font-semibold">Top 5 Jenis Ikan</CardHeader>
              <CardContent>
                <TopRankingBarChart
                  data={komposisiIkan.slice(0, 5).map((r) => ({ label: r.nama, value: r.beratKg }))}
                  unit="kg"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="text-sm font-semibold">Top 5 Wilayah Distribusi</CardHeader>
              <CardContent>
                <TopRankingBarChart
                  data={wilayahRanking.slice(0, 5).map((r) => ({ label: r.label, value: r.totalKg }))}
                  unit="kg"
                />
              </CardContent>
            </Card>
          </div>
```

- [ ] **Step 3: Manual verification against the dev server**

Confirm `/laporan`'s Hasil Tangkap tab now shows two horizontal bar charts below the existing donut/table, correctly ranked descending, with values matching the existing donut chart's own composition data (cross-check the top jenis ikan's kg value against the donut's legend) and the `/hasil-tangkap` "Per Wilayah" tab's own ranking. Paste real screenshots.

- [ ] **Step 4: Full verification suite**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
npx tsc --noEmit
npm run lint
npm test
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/top-ranking-bar-chart.tsx "app/(dashboard)/laporan/page.tsx"
git commit -m "Add Top 5 Jenis Ikan and Top 5 Wilayah bar charts to Laporan"
```

**Acceptance criteria:**
- Both bar charts render on Laporan's Hasil Tangkap tab, correctly ranked, using real existing aggregations.
- Values are cross-verifiable against the existing donut chart and `/hasil-tangkap`'s own Per Wilayah tab.
- `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` all pass.

---

### Task 8: Laporan — functional date-range filter for the Hasil Tangkap tab

**Files:**
- Modify: `app/(dashboard)/laporan/page.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing new. Must run after Task 7 (both modify the `hasil-tangkap` `TabsContent` block).

The mockup shows a "Periode Laporan" date-range control. This task implements it as a real, functional filter over the Hasil Tangkap tab's own data (the only tab with per-record dates — Koperasi and Pasar/Industri are aggregate entities with no individual transaction date, so this filter is scoped to the one tab where it's honest and meaningful, exactly like `Task 6`'s "Global Constraints" reasoning for why deltas were scoped to specific pages in the original plan).

- [ ] **Step 1: Add date-range state and a filtered `hasilTangkap` for this tab**

Add `Input` to the imports: `import { Input } from '@/components/ui/input';`.

After `const [activeTab, setActiveTab] = useState<TabValue>('hasil-tangkap');`, add:

```tsx
  const [tanggalDari, setTanggalDari] = useState('');
  const [tanggalSampai, setTanggalSampai] = useState('');

  const hasilTangkapTerfilter = useMemo(
    () =>
      hasilTangkap.filter(
        (h) => (!tanggalDari || h.tanggal >= tanggalDari) && (!tanggalSampai || h.tanggal <= tanggalSampai),
      ),
    [hasilTangkap, tanggalDari, tanggalSampai],
  );
```

- [ ] **Step 2: Feed the filtered data into the tab's existing computations**

Replace the tab's existing memos:

```tsx
  const komposisiIkan = useMemo(() => komposisiHasilTangkap(hasilTangkap), [hasilTangkap]);
  const trenIkan = useMemo(() => trenHasilTangkapHarian(hasilTangkap), [hasilTangkap]);
```

and the `wilayahRanking` memo added in Task 7:

```tsx
  const wilayahRanking = useMemo(() => rekapPerWilayah(hasilTangkap), [hasilTangkap]);
```

with (all three now reading the filtered set):

```tsx
  const komposisiIkan = useMemo(() => komposisiHasilTangkap(hasilTangkapTerfilter), [hasilTangkapTerfilter]);
  const trenIkan = useMemo(() => trenHasilTangkapHarian(hasilTangkapTerfilter), [hasilTangkapTerfilter]);
  const wilayahRanking = useMemo(() => rekapPerWilayah(hasilTangkapTerfilter), [hasilTangkapTerfilter]);
```

Update the tab's 4 KPI cards to read `hasilTangkapTerfilter` instead of `hasilTangkap` — replace:

```tsx
            <KpiCard icon={Fish} label="Total Hasil Tangkapan" value={`${formatNumber(totalHasilTangkapKg(hasilTangkap))} kg`} accent="blue" />
            <KpiCard icon={Wallet} label="Total Nilai Tangkapan" value={formatRupiah(totalNilaiTangkapan(hasilTangkap))} accent="green" />
            <KpiCard icon={Ship} label="Rata-rata per Trip" value={`${formatNumber(Math.round(rataRataPerTripKg(hasilTangkap)))} kg`} accent="cyan" />
```

with:

```tsx
            <KpiCard icon={Fish} label="Total Hasil Tangkapan" value={`${formatNumber(totalHasilTangkapKg(hasilTangkapTerfilter))} kg`} accent="blue" />
            <KpiCard icon={Wallet} label="Total Nilai Tangkapan" value={formatRupiah(totalNilaiTangkapan(hasilTangkapTerfilter))} accent="green" />
            <KpiCard icon={Ship} label="Rata-rata per Trip" value={`${formatNumber(Math.round(rataRataPerTripKg(hasilTangkapTerfilter)))} kg`} accent="cyan" />
```

(The 4th card, `Jenis Ikan Tertangkap`, already reads `komposisiIkan.length`, which is now automatically filtered — no change needed there.)

Also update `handleExport`'s `hasil-tangkap` branch to export the filtered set — replace `komposisiIkan.map(...)` in that branch with the same expression (it already reads the now-filtered `komposisiIkan` memo, so no change is needed there either — this step is a no-op confirmation, not a code change).

- [ ] **Step 3: Render the date-range control**

Insert this directly above the tab's KPI grid, inside the `hasil-tangkap` `TabsContent`:

```tsx
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <label htmlFor="laporan-dari" className="text-sm text-muted-foreground">Dari Tanggal</label>
              <Input id="laporan-dari" type="date" value={tanggalDari} onChange={(e) => setTanggalDari(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="laporan-sampai" className="text-sm text-muted-foreground">Sampai Tanggal</label>
              <Input id="laporan-sampai" type="date" value={tanggalSampai} onChange={(e) => setTanggalSampai(e.target.value)} />
            </div>
            {(tanggalDari || tanggalSampai) && (
              <Button variant="outline" size="sm" onClick={() => { setTanggalDari(''); setTanggalSampai(''); }}>
                Reset
              </Button>
            )}
          </div>
```

- [ ] **Step 4: Manual verification against the dev server**

Confirm setting "Dari Tanggal"/"Sampai Tanggal" narrows the KPI values, the trend chart, the donut chart, the Top-5 bar charts (Task 7), and the CSV export to only records within range; confirm "Reset" restores the full range; confirm the Koperasi and Pasar/Industri tabs are completely unaffected (their own data has no date filter, by design). Paste real screenshots of the unfiltered and filtered states.

- [ ] **Step 5: Full verification suite**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
npx tsc --noEmit
npm run lint
npm test
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add "app/(dashboard)/laporan/page.tsx"
git commit -m "Add functional date-range filter to Laporan's Hasil Tangkap tab"
```

**Acceptance criteria:**
- The date-range filter narrows every computation on the Hasil Tangkap tab (KPIs, charts, table, CSV export) consistently.
- Koperasi and Pasar/Industri tabs are unaffected.
- `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` all pass.

---

### Task 9: Pengaturan — "Konfigurasi Aplikasi" section + "Manajemen Pengguna" (reusing the existing backend-required pattern)

**Files:**
- Modify: `app/(dashboard)/pengaturan/page.tsx`

**Interfaces:**
- Consumes: nothing new — reuses `Select`, `Input`, `Switch`, `Button`, `toastManager` (all already imported in this file) and this file's own existing `showComingSoonToast()` helper.
- Produces: nothing new.

The mockup's "Konfigurasi Aplikasi" section (Nama Aplikasi/Tema Tampilan/Zona Waktu/Format Tanggal/Format Angka/Satuan Berat/Satuan Jarak) is a set of local display preferences — the same risk class as this page's already-shipped `Switch` toggles and `Bahasa` selector, neither of which is wired to a real backend either (confirmed: no i18n or theming mechanism exists anywhere else in the codebase; `bahasa` is plain `useState`). Extending that exact, already-accepted pattern is honest and low-risk. "Manajemen Pengguna," by contrast, implies real multi-user administration this app cannot do — this task adds it using the page's own existing decorative-tab pattern (a card explaining the backend requirement, with the existing `showComingSoonToast()`), not fabricated functionality.

- [ ] **Step 1: Add local state for the new preference fields**

After the existing `const [bahasa, setBahasa] = useState('id');`, add:

```tsx
  const [namaAplikasi, setNamaAplikasi] = useState('Digital Fisherman ID');
  const [zonaWaktu, setZonaWaktu] = useState('wib');
  const [formatTanggal, setFormatTanggal] = useState('dd-mmm-yyyy');
  const [satuanBerat, setSatuanBerat] = useState('kg');
```

Add these option lists above the component (alongside the existing `BAHASA_OPTIONS`):

```tsx
const ZONA_WAKTU_OPTIONS = [
  { value: 'wib', label: 'WIB (UTC+7)' },
  { value: 'wita', label: 'WITA (UTC+8)' },
  { value: 'wit', label: 'WIT (UTC+9)' },
];

const FORMAT_TANGGAL_OPTIONS = [
  { value: 'dd-mmm-yyyy', label: '10 Mei 2025' },
  { value: 'dd/mm/yyyy', label: '10/05/2025' },
  { value: 'yyyy-mm-dd', label: '2025-05-10' },
];

const SATUAN_BERAT_OPTIONS = [
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'ton', label: 'Ton' },
];
```

- [ ] **Step 2: Render the "Konfigurasi Aplikasi" card in the "Pengaturan Umum" tab**

Insert this new `Card` inside the `umum` `TabsContent`, before the existing "Preferensi Notifikasi & Tampilan" card:

```tsx
          <Card>
            <CardHeader className="text-sm font-semibold">Konfigurasi Aplikasi</CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="cfg-nama-aplikasi" className="text-sm text-muted-foreground">Nama Aplikasi</label>
                <Input id="cfg-nama-aplikasi" value={namaAplikasi} onChange={(e) => setNamaAplikasi(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="cfg-zona-waktu" className="text-sm text-muted-foreground">Zona Waktu</label>
                <Select items={ZONA_WAKTU_OPTIONS} value={zonaWaktu} onValueChange={(v) => setZonaWaktu(v ?? 'wib')}>
                  <SelectTrigger id="cfg-zona-waktu"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ZONA_WAKTU_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="cfg-format-tanggal" className="text-sm text-muted-foreground">Format Tanggal</label>
                <Select items={FORMAT_TANGGAL_OPTIONS} value={formatTanggal} onValueChange={(v) => setFormatTanggal(v ?? 'dd-mmm-yyyy')}>
                  <SelectTrigger id="cfg-format-tanggal"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FORMAT_TANGGAL_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="cfg-satuan-berat" className="text-sm text-muted-foreground">Satuan Berat</label>
                <Select items={SATUAN_BERAT_OPTIONS} value={satuanBerat} onValueChange={(v) => setSatuanBerat(v ?? 'kg')}>
                  <SelectTrigger id="cfg-satuan-berat"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SATUAN_BERAT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Button variant="outline" onClick={showComingSoonToast}>
                  Simpan Konfigurasi
                </Button>
              </div>
            </CardContent>
          </Card>
```

This reuses the existing `showComingSoonToast()` for the save action, consistent with how every other settings control on this page already behaves (nothing on this page persists to a backend yet) — it does not silently pretend to save when nothing is actually being saved anywhere.

- [ ] **Step 3: Add "Manajemen Pengguna" using the existing decorative-tab pattern**

The file already generates 4 decorative tabs from a `DECORATIVE_TABS` array (`Akun & Keamanan`, `Notifikasi`, `Integrasi`, `Data & Backup`), each rendering an identical "requires backend" card automatically. Add one more entry:

```tsx
const DECORATIVE_TABS = [
  { value: 'akun', label: 'Akun & Keamanan' },
  { value: 'notifikasi', label: 'Notifikasi' },
  { value: 'integrasi', label: 'Integrasi' },
  { value: 'backup', label: 'Data & Backup' },
  { value: 'pengguna', label: 'Manajemen Pengguna' },
] as const;
```

No other change is needed — the existing `{DECORATIVE_TABS.map(...)}` blocks (both the `TabsTrigger` list and the `TabsContent` renderer) already generate the new tab and its card automatically from this array.

- [ ] **Step 4: Manual verification against the dev server**

Confirm `/pengaturan`'s "Pengaturan Umum" tab now shows "Konfigurasi Aplikasi" above the existing toggles, all 4 new controls are interactive (typing/selecting updates local state visibly), and "Simpan Konfigurasi" shows the same "Fitur belum tersedia" toast as every other save button on this page. Confirm a new "Manajemen Pengguna" tab appears in the tab list and shows the same explanatory card as the other decorative tabs. Paste real screenshots.

- [ ] **Step 5: Full verification suite**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
npx tsc --noEmit
npm run lint
npm test
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add "app/(dashboard)/pengaturan/page.tsx"
git commit -m "Add Konfigurasi Aplikasi section and Manajemen Pengguna tab to Pengaturan"
```

**Acceptance criteria:**
- "Konfigurasi Aplikasi" renders with 4 working (locally-stateful) controls, using the same honest "not yet persisted" convention as the rest of this page.
- "Manajemen Pengguna" appears as a tab using the exact existing decorative-tab pattern — no fabricated user-management functionality.
- No KPI row or account/security sidebar is added (per Global Constraints).
- `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` all pass.

---

### Task 10: Bantuan — KPI row (real counts), hero search, and FAQ category cards

**Files:**
- Modify: `app/(dashboard)/bantuan/page.tsx`

**Interfaces:**
- Consumes: `KpiCard` (`@/components/dashboard/kpi-card`, not currently imported on this page).
- Produces: adds a `kategori` field to each `FAQ_ITEMS` entry and a `kategoriFilter`/`search` state. Task 11 (sidebar) reads this file's existing structure only, not these new pieces — but must still run after this task since both modify the same file.

The mockup's KPI row includes two counts this app can state honestly (FAQ count, ticket count — both already real arrays) and two labels that are decorative but don't imply fabricated depth (a "24/7" availability slogan, a "Semua Normal" status label — no numeric claim to fabricate). It skips "Artikel Panduan"/"Video Tutorial" (128/36) entirely, since no article or video subsystem exists (see Global Constraints). The hero search and category cards are both genuinely functional, filtering the real FAQ content — this requires tagging each existing FAQ entry with a category (extending existing content, not inventing new data) and adding 2 new FAQ entries so all 5 mockup categories have real content to filter to (rather than shipping one category that always shows "no results").

- [ ] **Step 1: Add categories to `FAQ_ITEMS` and add 2 new entries**

Replace the `FAQ_ITEMS` constant and its type:

```tsx
const FAQ_ITEMS: { pertanyaan: string; jawaban: string }[] = [
  {
    pertanyaan: 'Bagaimana cara mendaftarkan nelayan baru ke sistem?',
    jawaban: 'Buka halaman Nelayan, lalu isi data nelayan melalui menu tambah data. Setelah tersimpan, data akan langsung muncul di daftar nelayan terdaftar.',
  },
  {
    pertanyaan: 'Apa yang dimaksud dengan pemeriksaan biosecurity?',
    jawaban: 'Pemeriksaan biosecurity adalah proses verifikasi kondisi kapal dan kru sebelum melaut untuk mencegah penyebaran penyakit dan menjaga kualitas hasil tangkapan. Hasil pemeriksaan berupa status Lolos atau Tidak Lolos.',
  },
  {
    pertanyaan: 'Bagaimana cara mengekspor laporan ke format CSV?',
    jawaban: 'Buka halaman Laporan & Analitik, pilih kategori laporan yang diinginkan, lalu klik tombol Export Laporan di bagian atas halaman.',
  },
  {
    pertanyaan: 'Mengapa posisi kapal di peta tracking selalu berubah?',
    jawaban: 'Posisi kapal disimulasikan agar terlihat seperti data real-time. Pada implementasi produksi, data ini akan berasal dari perangkat GPS/AIS yang terpasang di kapal.',
  },
  {
    pertanyaan: 'Apakah data yang saya masukkan akan tersimpan setelah refresh halaman?',
    jawaban: 'Belum. Versi ini menyimpan data pada sesi browser saja (belum terhubung ke database), sehingga data akan kembali ke kondisi awal setelah halaman dimuat ulang.',
  },
  {
    pertanyaan: 'Bagaimana cara menghubungi tim dukungan jika tiket belum direspons?',
    jawaban: 'Ajukan tiket baru melalui formulir di halaman ini dengan kategori yang sesuai. Tim dukungan akan memperbarui status tiket menjadi Diproses atau Selesai.',
  },
];
```

with:

```tsx
type FaqKategori = 'Akun & Akses' | 'Data & Informasi' | 'Fitur & Layanan' | 'Teknis & Error' | 'Kebijakan & Regulasi';

const FAQ_ITEMS: { pertanyaan: string; jawaban: string; kategori: FaqKategori }[] = [
  {
    pertanyaan: 'Bagaimana cara mendaftarkan nelayan baru ke sistem?',
    jawaban: 'Buka halaman Nelayan, lalu isi data nelayan melalui menu tambah data. Setelah tersimpan, data akan langsung muncul di daftar nelayan terdaftar.',
    kategori: 'Fitur & Layanan',
  },
  {
    pertanyaan: 'Apa yang dimaksud dengan pemeriksaan biosecurity?',
    jawaban: 'Pemeriksaan biosecurity adalah proses verifikasi kondisi kapal dan kru sebelum melaut untuk mencegah penyebaran penyakit dan menjaga kualitas hasil tangkapan. Hasil pemeriksaan berupa status Lolos atau Tidak Lolos.',
    kategori: 'Data & Informasi',
  },
  {
    pertanyaan: 'Bagaimana cara mengekspor laporan ke format CSV?',
    jawaban: 'Buka halaman Laporan & Analitik, pilih kategori laporan yang diinginkan, lalu klik tombol Export Laporan di bagian atas halaman.',
    kategori: 'Fitur & Layanan',
  },
  {
    pertanyaan: 'Mengapa posisi kapal di peta tracking selalu berubah?',
    jawaban: 'Posisi kapal disimulasikan agar terlihat seperti data real-time. Pada implementasi produksi, data ini akan berasal dari perangkat GPS/AIS yang terpasang di kapal.',
    kategori: 'Teknis & Error',
  },
  {
    pertanyaan: 'Apakah data yang saya masukkan akan tersimpan setelah refresh halaman?',
    jawaban: 'Belum. Versi ini menyimpan data pada sesi browser saja (belum terhubung ke database), sehingga data akan kembali ke kondisi awal setelah halaman dimuat ulang.',
    kategori: 'Teknis & Error',
  },
  {
    pertanyaan: 'Bagaimana cara menghubungi tim dukungan jika tiket belum direspons?',
    jawaban: 'Ajukan tiket baru melalui formulir di halaman ini dengan kategori yang sesuai. Tim dukungan akan memperbarui status tiket menjadi Diproses atau Selesai.',
    kategori: 'Fitur & Layanan',
  },
  {
    pertanyaan: 'Bagaimana cara mengubah nama akun atau informasi profil saya?',
    jawaban: 'Belum tersedia. Versi ini belum memiliki sistem akun multi-pengguna — seluruh akses saat ini menggunakan satu akun Admin DKP bersama.',
    kategori: 'Akun & Akses',
  },
  {
    pertanyaan: 'Bagaimana kebijakan penyimpanan dan keamanan data pada sistem ini?',
    jawaban: 'Versi ini adalah purwarupa (prototype) yang menyimpan data pada sesi browser saja, belum terhubung ke database maupun kebijakan retensi data resmi. Kebijakan keamanan dan regulasi lengkap akan ditetapkan sebelum sistem digunakan secara produksi.',
    kategori: 'Kebijakan & Regulasi',
  },
];

const KATEGORI_BANTUAN: { value: FaqKategori; label: string; icon: typeof User }[] = [
  { value: 'Akun & Akses', label: 'Akun & Akses', icon: User },
  { value: 'Data & Informasi', label: 'Data & Informasi', icon: Database },
  { value: 'Fitur & Layanan', label: 'Fitur & Layanan', icon: Wrench },
  { value: 'Teknis & Error', label: 'Teknis & Error', icon: AlertTriangle },
  { value: 'Kebijakan & Regulasi', label: 'Kebijakan & Regulasi', icon: FileText },
];
```

Add `User, Database, Wrench, FileText, Search` to the existing `lucide-react` import line (`AlertTriangle` and others may need adding too — check what's already imported and extend that one line rather than adding a second import statement).

- [ ] **Step 2: Add KPI row, search, and category-filter state**

Add `import { KpiCard } from '@/components/dashboard/kpi-card';` and `import { Fish... }` — no, `Fish` isn't needed here; only add what's used. Add `HelpCircle, Ticket, ShieldCheck` to the `lucide-react` import for the KPI icons (availability/ticket/status).

Inside `BantuanPage`, after `const { tiketBantuan, addTiketBantuan } = useData();`, add:

```tsx
  const [search, setSearch] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState<FaqKategori | null>(null);

  const faqTersaring = FAQ_ITEMS.filter(
    (item) =>
      (!kategoriFilter || item.kategori === kategoriFilter) &&
      (search.trim() === '' ||
        item.pertanyaan.toLowerCase().includes(search.toLowerCase()) ||
        item.jawaban.toLowerCase().includes(search.toLowerCase())),
  );
```

Insert the KPI row directly after `<PageHeader ... />`:

```tsx
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={HelpCircle} label="Pusat Bantuan" value="24/7" accent="blue" />
        <KpiCard icon={HelpCircle} label="FAQ Tersedia" value={formatNumber(FAQ_ITEMS.length)} accent="green" />
        <KpiCard icon={Ticket} label="Tiket Saya" value={formatNumber(tiketBantuan.length)} accent="cyan" />
        <KpiCard icon={ShieldCheck} label="Status Layanan" value="Normal" accent="purple" />
      </div>
```

Add `import { formatNumber } from '@/lib/format';` — `formatDate` is already imported from this module; add `formatNumber` to that same existing import line.

- [ ] **Step 3: Add the hero search bar and 5 category cards, and wire the FAQ accordion to the filtered set**

Replace the "Pertanyaan yang Sering Diajukan" `Card`'s content:

```tsx
      <Card>
        <CardHeader className="text-sm font-semibold">Pertanyaan yang Sering Diajukan</CardHeader>
        <CardContent>
          <Accordion>
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem key={item.pertanyaan} value={String(i)}>
                <AccordionTrigger>{item.pertanyaan}</AccordionTrigger>
                <AccordionContent>{item.jawaban}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
```

with:

```tsx
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari bantuan, panduan, atau topik..."
              className="pl-9"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {KATEGORI_BANTUAN.map((kat) => {
              const Icon = kat.icon;
              const active = kategoriFilter === kat.value;
              return (
                <button
                  key={kat.value}
                  type="button"
                  onClick={() => setKategoriFilter(active ? null : kat.value)}
                  className={
                    active
                      ? 'flex flex-col items-center gap-2 rounded-lg border border-primary bg-primary/10 p-4 text-center'
                      : 'flex flex-col items-center gap-2 rounded-lg border border-border p-4 text-center hover:bg-muted/40'
                  }
                >
                  <Icon className="h-6 w-6 text-primary" />
                  <span className="text-xs font-medium">{kat.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="text-sm font-semibold">
          Pertanyaan yang Sering Diajukan
          {kategoriFilter && <span className="ml-2 font-normal text-muted-foreground">— {kategoriFilter}</span>}
        </CardHeader>
        <CardContent>
          {faqTersaring.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Tidak ada FAQ yang cocok.</p>
          ) : (
            <Accordion>
              {faqTersaring.map((item, i) => (
                <AccordionItem key={item.pertanyaan} value={String(i)}>
                  <AccordionTrigger>{item.pertanyaan}</AccordionTrigger>
                  <AccordionContent>{item.jawaban}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
```

Clicking an already-active category card deselects it (toggles `kategoriFilter` back to `null`), so users aren't stuck unable to clear the filter without also clearing search.

- [ ] **Step 4: Manual verification against the dev server**

Confirm the KPI row shows the real FAQ count (8, after Step 1's additions) and real ticket count; confirm typing in the search bar narrows the FAQ accordion by text match; confirm clicking each of the 5 category cards narrows the accordion to that category only (and each of the 5 shows at least one real result); confirm clicking an active category again clears the filter. Paste real screenshots of the unfiltered state and at least 2 filtered states.

- [ ] **Step 5: Full verification suite**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
npx tsc --noEmit
npm run lint
npm test
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add "app/(dashboard)/bantuan/page.tsx"
git commit -m "Add Bantuan KPI row, hero search, and FAQ category filtering"
```

**Acceptance criteria:**
- KPI row shows only real counts (FAQ, tickets) plus 2 non-numeric decorative labels — no fabricated article/video counts.
- Search and all 5 category filters work correctly against real, existing FAQ content (extended with 2 new honest entries so every category has at least one result).
- `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` all pass.

---

### Task 11: Bantuan — "Hubungi Kami" and "Panduan Cepat" sidebar

**Files:**
- Modify: `app/(dashboard)/bantuan/page.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing new. Must run after Task 10 (same file).

The mockup's right sidebar has a "Hubungi Kami" contact block and a "Panduan Cepat" quick-link list. This task adds both, but narrower than the mockup in two honest ways: "Hubungi Kami" omits "Live Chat" and "WhatsApp" (both imply a real-time channel this app cannot back — only Email and a phone number, framed as an office contact, are included), and "Panduan Cepat" links to this app's own real pages instead of fabricated documentation articles.

- [ ] **Step 1: Restructure the page into a 2-column layout**

Wrap the existing page content (the FAQ card group and the "Tiket Dukungan"/"Ajukan Tiket Baru" cards) and a new sidebar into a responsive grid. Replace the outermost content structure — find the closing sequence of the file:

```tsx
      <Card>
        <CardHeader className="text-sm font-semibold">Tiket Dukungan ({tiketBantuan.length})</CardHeader>
        <CardContent>
          <DataTable data={tiketUrut} columns={columns} getRowKey={(t) => t.id} pageSize={10} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="text-sm font-semibold">Ajukan Tiket Baru</CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
```

and its matching closing tags at the end of the file:

```tsx
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

Restructure so the ticket table + form live in a left column and the new sidebar lives in a right column, by wrapping them in a grid. Change:

```tsx
      <Card>
        <CardHeader className="text-sm font-semibold">Tiket Dukungan ({tiketBantuan.length})</CardHeader>
```

to:

```tsx
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
      <Card>
        <CardHeader className="text-sm font-semibold">Tiket Dukungan ({tiketBantuan.length})</CardHeader>
```

and change the file's final lines from:

```tsx
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

to:

```tsx
          </form>
        </CardContent>
      </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader className="text-sm font-semibold">Hubungi Kami</CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-muted-foreground">bantuan@dkp.go.id</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Telepon</p>
                <p className="text-muted-foreground">(021) 1234 5678</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Jam Operasional</p>
                <p className="text-muted-foreground">Senin - Jumat, 08:00 - 17:00 WIB</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-sm font-semibold">Panduan Cepat</CardHeader>
          <CardContent className="space-y-1">
            {[
              { label: 'Cara Melacak Kapal', href: '/peta-tracking' },
              { label: 'Cara Input Hasil Tangkapan', href: '/hasil-tangkap/input' },
              { label: 'Cara Cek Biosecurity', href: '/hasil-tangkap/biosecurity' },
              { label: 'Cara Membuat Laporan', href: '/laporan' },
              { label: 'Kelola Data Nelayan', href: '/nelayan' },
            ].map((guide) => (
              <Link
                key={guide.href}
                href={guide.href}
                className="flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-muted/40"
              >
                {guide.label}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
```

Add `import Link from 'next/link';` and `Mail, Phone, Clock, ChevronRight` to the `lucide-react` import line.

- [ ] **Step 2: Manual verification against the dev server**

Confirm `/bantuan` now shows a 2-column layout at desktop width (ticket table/form on the left, "Hubungi Kami" and "Panduan Cepat" on the right) that stacks to a single column on narrow viewports (verify at ~768px). Confirm every "Panduan Cepat" link navigates to the correct real, existing page. Paste real screenshots at both widths.

- [ ] **Step 3: Full verification suite**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
npx tsc --noEmit
npm run lint
npm test
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add "app/(dashboard)/bantuan/page.tsx"
git commit -m "Add Hubungi Kami and Panduan Cepat sidebar to Bantuan"
```

**Acceptance criteria:**
- "Hubungi Kami" shows only channels this app can honestly back (Email, Telepon, Jam Operasional) — no fake Live Chat/WhatsApp presence indicators.
- Every "Panduan Cepat" link navigates to a real, existing page.
- Layout is responsive (2-column desktop, 1-column narrow).
- `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` all pass.

---

## Dependency Analysis

File touch map:

| Task | Files |
|---|---|
| 1 | `pasar-industri/page.tsx`, `koperasi/page.tsx`, `kapal/page.tsx`, `nelayan/page.tsx` |
| 2 | `peta-tracking/page.tsx` |
| 3 | `peta-tracking/page.tsx` |
| 4 | `peta-tracking/page.tsx`, `map-view.tsx` |
| 5 | `map-view.tsx` |
| 6 | `peta-tracking/page.tsx` |
| 7 | new `top-ranking-bar-chart.tsx`, `laporan/page.tsx` |
| 8 | `laporan/page.tsx` |
| 9 | `pengaturan/page.tsx` |
| 10 | `bantuan/page.tsx` |
| 11 | `bantuan/page.tsx` |

**Real same-file dependencies (must run in this relative order):**
- **Task 2 → 3 → 4 → 6** (Peta Tracking's `page.tsx`): Task 2 introduces `filteredKapal`/`statusFilter`/`jenisFilter` that Task 3 consumes; Task 3's card-row list is what Task 4 attaches a click handler to; Task 4 and Task 6 both add new `Card`s to the same render tree, and Task 6 depends only on Task 4 having run first for file-sequencing (no logical dependency between them). **Task 5** touches only `map-view.tsx` and has no logical dependency on 2/3/6, but shares the file with Task 4 — sequence it right after Task 4 to avoid two implementers editing `map-view.tsx` from diverging bases.
- **Task 7 → 8** (`laporan/page.tsx`): Task 8's date filter rewrites the same memos Task 7 introduces (`wilayahRanking`) — Task 7 must land first.
- **Task 10 → 11** (`bantuan/page.tsx`): Task 11 restructures the bottom of the file into a 2-column grid; Task 10 changes the top of the same file. Sequencing 10 before 11 avoids compounding two large same-file diffs out of order.
- Task 1 (4 different files, none shared with any other task) and Task 9 (`pengaturan/page.tsx`, touched by no other task) are fully isolated.

**Everything else is file-disjoint.** The 5 groups — {1}, {2,3,4,5,6}, {7,8}, {9}, {10,11} — share no files with each other.

**Execution guidance (dynamic workflow):** as established throughout this project, `superpowers:subagent-driven-development` runs implementers sequentially regardless of file independence. The recommended order is simply **Task 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11** (the order already written above), which satisfies every real dependency and follows the user's stated priority (P1 fix, then Peta Tracking, Laporan, Pengaturan, Bantuan in that order). If execution ever moves to a tool that permits parallel implementers, the 5 groups {1}, {2-6}, {7-8}, {9}, {10-11} could each run on a separate implementer concurrently, with only the intra-group ordering above preserved.

## Priority Summary

| Priority | Task | Why it's ordered here |
|---|---|---|
| P1 fix | 1 — Harden long-text table columns | The one remaining P1 from the post-implementation audit; fixed first per explicit user priority |
| Structural (Peta Tracking) | 2 — Filters + weather widget | Foundational: introduces the filtered-vessel state every later Peta Tracking task builds on |
| Structural (Peta Tracking) | 3 — Card-row vessel list with real speed | Surfaces a real field (`kecepatanKnot`) the app already had but never showed |
| Structural (Peta Tracking) | 4 — Detail Kapal Terpilih panel | Real navigation to the existing vessel detail page, not a fabricated action set |
| Structural (Peta Tracking) | 5 — Peta/Satelit tile toggle | Genuinely functional using a real public tile service, not a decorative no-op button |
| Structural (Peta Tracking) | 6 — Aktivitas Terbaru from real data | Narrates real Hasil Tangkap records instead of a fabricated vessel-event log |
| Structural (Laporan) | 7 — Top 5 bar charts | Reuses already-computed real aggregations; only a presentational gap, zero fabrication |
| Structural (Laporan) | 8 — Date-range filter | Real, functional filter scoped to the one tab where dates are honest |
| Structural (Pengaturan) | 9 — Konfigurasi Aplikasi + Manajemen Pengguna | Extends the page's own already-accepted local-preference and "requires backend" patterns |
| Structural (Bantuan) | 10 — KPI row + search + categories | Real counts + real, functional content filtering |
| Structural (Bantuan) | 11 — Hubungi Kami + Panduan Cepat | Honest contact info + real in-app navigation shortcuts |

## Explicitly Not Planned (needs a product decision, not an engineering one)

- **`/laporan`'s category-based tab IA** (Ringkasan/Operasional/Keuangan/Kepatuhan/Kinerja/Khusus) and its **"Detail Laporan" report archive** (128 fabricated generated-report rows) and **"Laporan Populer"/"Laporan Terbaru"** sidebar lists of the same fabricated documents — no real report-generation/document-storage subsystem exists to back any of this.
- **`/pengaturan`'s 6-card KPI row** (Pengguna Aktif, Role Pengguna, Notifikasi Sistem, Integrasi Aktif, Backup Terakhir, Status Server) and its **"Informasi Akun"/"Keamanan Akun"/"Aktivitas Pengaturan" sidebar** — all describe multi-user/account/security infrastructure this no-auth v1 app doesn't have.
- **`/bantuan`'s "Artikel Panduan" (128) and "Video Tutorial" (36) KPI cards** — no content-library subsystem exists.
- **`/peta-tracking`'s per-vessel "X.X km dari lokasi"** and the **"Timeline Pergerakan Kapal" per-stage event log** — no reference point or discrete event log exists in the data model.

Each of these would require either inventing a fake subsystem's worth of data (misrepresenting what the app can actually do) or a real product decision about what the underlying feature should be before any UI is built. Both are outside a design-gap remediation plan's mandate.

## Test / Verification Requirements

- No new pure-logic unit tests are required by this plan — every task is either a UI-only visual/structural addition (verified manually against the dev server with real screenshot evidence, per this project's established standard) or reuses already-tested `lib/stats.ts` functions without modifying them.
- `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` must all pass at the end of every task.
- The full test count (78, per the last full run) should not change during this plan — no task modifies `lib/*.test.ts` files. If it does change, that's a signal something touched more than intended.
- Every "real data" claim in this plan (FAQ count, ticket count, `kecepatanKnot`, `rekapPerWilayah`, `komposisiHasilTangkap`) is independently cross-checkable against an existing page that already displays the same underlying data — task verification steps say exactly where to cross-check.
