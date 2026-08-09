# Visual Fidelity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close every P0 and P1 finding from `docs/audits/2026-08-09-visual-fidelity-audit.md` — the audit is the source of truth for this plan; no new visual gaps are introduced or investigated here. P2 findings and the per-route content/structure findings (Laporan's tab architecture, Notifikasi's table-vs-card-list layout, Pengaturan's missing sections, Bantuan's missing hero/category cards, Peta Tracking's missing gantt/timeline/filter widgets, etc.) are explicitly **out of scope** — those require adding new content sections, which this plan's constraints forbid.

**Architecture:** 10 tasks. The one P0 (table overflow) and the 4 most structural P1s (DataTable pagination, a new shared Stepper, MapView marker coloring, plus KPI icon treatment since it touches literally every page) come first. The remaining P1s — which are narrower, page-scoped cosmetic changes — come after. Every task modifies existing components/pages in place; the only new file in this entire plan is one small presentational `Stepper` component (justified below), matching this project's established precedent of adding the smallest necessary primitive only when nothing existing covers the need (e.g. `Switch`/`Accordion`/`Toast` in a prior plan).

**Tech Stack:** Next.js 16 (App Router) + TypeScript + Tailwind CSS v4, Recharts (existing dependency, no new chart library), lucide-react (existing dependency, no new icon library), Vitest for the one new pure-logic helper this plan adds.

## Global Constraints

- **This plan is visual-only.** No `DataContext` mutator changes, no new routes, no new data fields on any type beyond what's needed to render a status color already computed elsewhere. Every existing behavior (search, filters, sort, forms, dialogs, navigation) must work identically after this plan as before it.
- **"Reuse existing components" — the one exception is explicit and small.** No stepper UI exists anywhere in the codebase (`grep -ri stepper` returns nothing). Task 3 adds exactly one new file, `components/shared/stepper.tsx` — a static, non-interactive presentational component with no base-ui dependency (it renders numbered circles and connecting lines with Tailwind only; there is no user interaction to delegate to a primitive). Every other task in this plan modifies an existing file.
- **KPI deltas (Task 6) are explicitly decorative, matching an already-existing precedent — not a new fabrication.** `app/(dashboard)/dashboard/page.tsx`'s 4 KPI cards already pass hardcoded literal numbers to `deltaPercent`/`deltaLabel` (e.g. `deltaPercent={8.2}`) — there is no historical/snapshot data anywhere in this project's data model to compute a real "vs last month" comparison for Nelayan, Kapal, Koperasi, or Pasar-Industri counts (they are simple current-state arrays with no time-series backing). Task 6 extends the **exact same already-established pattern** to those 4 list pages' KPI cards for visual consistency with Dashboard and with the design reference — it does not invent a new kind of data-honesty compromise. `Hasil Tangkap`, `Laporan`, and `Peta Tracking`'s KPI cards are explicitly **excluded** from Task 6: the first two already reflect genuinely current, frequently-changing figures where a static fake delta would read as more misleading than decorative, and Peta Tracking's KPIs describe current fleet state, not a trend. This is a deliberate, bounded scope decision — do not extend fake deltas beyond the 4 pages Task 6 names.
- **Status color reuse:** Task 4 (map markers) must derive its colors from the already-existing `KAPAL_STATUS_TONE` mapping (`lib/kapal-status.ts`) and the same HSL values already defined for `--success`/`--warning`/`--destructive`/`--muted-foreground` in `app/globals.css` — do not invent new colors for vessel status.
- **`KpiCard`'s solid-icon-background change (Task 5) affects every KPI card in the app** (Dashboard, Nelayan, Kapal, Hasil Tangkap, Koperasi, Pasar-Industri, Laporan, Peta Tracking, Notifikasi) since they all share the one `KpiCard` component. This is intentional — it's the single highest-leverage change in this plan.
- Node.js/npm are not on this shell's default PATH — prepend before any npm/npx command: `export PATH="/c/Program Files/nodejs:$PATH"`.
- `npx tsc --noEmit` can fail with a `LayoutProps` error on a fresh checkout before `next build`/`next dev` has run once — a known, harmless, environment-only quirk. Run `next build` if this error appears bare.
- Do not touch `lib/csv.ts`, `lib/search.ts`, `lib/id.ts`, `context/data-context.tsx`, or any form-submission/validation logic — this plan changes how things look, never what they do.

---

### Task 1: Fix table content overflow on `/hasil-tangkap` (P0)

**Files:**
- Modify: `app/(dashboard)/hasil-tangkap/page.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing new. No other task depends on this one, but Task 6 touches this same file later and must run after this task (see Dependency Analysis).

**Diagnosis (confirmed during planning, not to be re-derived):** The "Data Hasil Tangkapan Terbaru" table's `Jenis Ikan` column renders `h.jenisIkan.map((j) => j.nama).join(', ')` — an unbounded, comma-joined string that can run to 4+ fish names for a single trip. This forces that one cell wider than its column should be, pushing the `Status` column past the visible viewport at 1440px width with no obvious way to reach it. The fix is to cap the cell's width and truncate with an ellipsis (revealing the full list on hover via the native `title` attribute) rather than letting content dictate table width — a robust fix regardless of how many fish types a future record has.

- [ ] **Step 1: Constrain and truncate the `Jenis Ikan` cell**

In `app/(dashboard)/hasil-tangkap/page.tsx`, find the `terbaruColumns` definition:

```tsx
  const terbaruColumns: DataTableColumn<HasilTangkap>[] = [
    { header: 'Tanggal', cell: (h) => formatDate(h.tanggal) },
    { header: 'Kapal', cell: (h) => kapal.find((k) => k.id === h.kapalId)?.nama ?? h.kapalId },
    { header: 'Lokasi', cell: (h) => h.lokasi },
    { header: 'Jenis Ikan', cell: (h) => h.jenisIkan.map((j) => j.nama).join(', ') },
    { header: 'Berat (kg)', cell: (h) => formatNumber(h.jenisIkan.reduce((s, j) => s + j.beratKg, 0)) },
    { header: 'Nilai', cell: (h) => formatRupiah(h.estimasiNilai) },
```

Replace the `Jenis Ikan` line with:

```tsx
    {
      header: 'Jenis Ikan',
      cell: (h) => {
        const names = h.jenisIkan.map((j) => j.nama).join(', ');
        return (
          <span className="block max-w-48 truncate" title={names}>
            {names}
          </span>
        );
      },
    },
```

- [ ] **Step 2: Manual verification against the dev server**

Run `export PATH="/c/Program Files/nodejs:$PATH" && npm run dev`, navigate to `/hasil-tangkap`, and confirm at 1440px browser width that every column including `Status` is fully visible with no clipping, and that a row with 3-4 fish types shows a truncated `Jenis Ikan` cell (with `...`) whose full content appears in a native tooltip on hover. Paste real screenshot/HTML evidence, not a description.

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
git add "app/(dashboard)/hasil-tangkap/page.tsx"
git commit -m "Fix Status column clipping on Hasil Tangkap table"
```

**Acceptance criteria:**
- No column is clipped or requires undiscoverable horizontal scroll on `/hasil-tangkap` at 1440px width.
- `Jenis Ikan` cell truncates gracefully for any number of fish types with the full list available via native tooltip.
- `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` all pass.

---

### Task 2: Numbered pagination in `DataTable` (P1, structural — highest leverage)

**Files:**
- Modify: `components/shared/data-table.tsx`
- Modify: `lib/table.ts`
- Modify: `lib/table.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `pageNumbersToShow(current: number, total: number): (number | '...')[]` (new, exported from `lib/table.ts`). No other task depends on this — it's consumed only within `DataTable` itself.

This is the single highest-leverage task in the plan: every paginated list in the app (Nelayan, Kapal, Koperasi, Pasar-Industri, Peta Tracking's vessel list, Jadwal Sandar, Bantuan's ticket table) uses this one shared component, so fixing it here fixes the pagination style everywhere at once.

- [ ] **Step 1: Write the failing tests for the new page-number helper**

Append to `lib/table.test.ts`:

```ts
import { pageNumbersToShow } from './table';

describe('pageNumbersToShow', () => {
  it('returns every page when there are 7 or fewer', () => {
    expect(pageNumbersToShow(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageNumbersToShow(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('shows an ellipsis after page 1 when the current page is far from the start', () => {
    expect(pageNumbersToShow(8, 20)).toEqual([1, '...', 7, 8, 9, '...', 20]);
  });

  it('shows no leading ellipsis when the current page is near the start', () => {
    expect(pageNumbersToShow(2, 20)).toEqual([1, 2, 3, '...', 20]);
  });

  it('shows no trailing ellipsis when the current page is near the end', () => {
    expect(pageNumbersToShow(19, 20)).toEqual([1, '...', 18, 19, 20]);
  });

  it('returns [1] for a single page', () => {
    expect(pageNumbersToShow(1, 1)).toEqual([1]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `export PATH="/c/Program Files/nodejs:$PATH" && npx vitest run lib/table.test.ts`
Expected: FAIL — `pageNumbersToShow` is not exported from `lib/table.ts` yet.

- [ ] **Step 3: Implement `pageNumbersToShow`**

Append to `lib/table.ts`:

```ts
export function pageNumbersToShow(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages = new Set<number>([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result: (number | '...')[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      result.push('...');
    }
    result.push(sorted[i]);
  }
  return result;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `export PATH="/c/Program Files/nodejs:$PATH" && npx vitest run lib/table.test.ts`
Expected: PASS — all tests green, including the pre-existing `paginate`/`totalPages` ones (unchanged).

- [ ] **Step 5: Replace `DataTable`'s pagination footer**

In `components/shared/data-table.tsx`, add `pageNumbersToShow` to the existing `import { paginate, totalPages } from '@/lib/table';` line (making it `import { paginate, totalPages, pageNumbersToShow } from '@/lib/table';`).

Replace:

```tsx
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
```

with:

```tsx
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
```

Add `ChevronLeft, ChevronRight` to the file's imports from `lucide-react` (add a new `import { ChevronLeft, ChevronRight } from 'lucide-react';` line near the top, alongside the existing `Search` import). Before writing this, check `components/ui/button.tsx`'s `size` variants to confirm `icon-sm` exists as documented (it's referenced elsewhere in this codebase, e.g. `components/ui/dialog.tsx`'s close button) — if the exact variant name differs, use whatever icon-sized variant that file actually defines rather than guessing.

- [ ] **Step 6: Manual verification against the dev server**

Run the dev server and check `/nelayan` (60 records, 6 pages at page size 10) and `/koperasi` (15 records, 2 pages). Confirm: numbered page buttons render, clicking a specific page number navigates directly to it, the active page is visually distinct, prev/next icon buttons disable correctly at the first/last page, and the "Menampilkan X-Y dari Z data" text matches the actual visible row range. Paste real evidence.

- [ ] **Step 7: Full verification suite**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
npx tsc --noEmit
npm run lint
npm test
npm run build
```

- [ ] **Step 8: Commit**

```bash
git add components/shared/data-table.tsx lib/table.ts lib/table.test.ts
git commit -m "Add numbered pagination to DataTable"
```

**Acceptance criteria:**
- Every paginated list in the app shows numbered page buttons with ellipsis for long ranges, plus a "Menampilkan X-Y dari Z data" count.
- Direct page-number navigation works; prev/next buttons still work and disable correctly at the boundaries.
- `pageNumbersToShow` is unit-tested for the single-page, short-range, and long-range-with-ellipsis cases.
- `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` all pass.

---

### Task 3: Shared `Stepper` component + apply to the 2 multi-step forms (P1, structural)

**Files:**
- Create: `components/shared/stepper.tsx`
- Modify: `app/(dashboard)/hasil-tangkap/input/page.tsx`
- Modify: `app/(dashboard)/hasil-tangkap/biosecurity/page.tsx`

**Interfaces:**
- Consumes: `cn` (`@/lib/utils`), `Check` icon (`lucide-react`, already a dependency).
- Produces: `Stepper` component (`@/components/shared/stepper`), props `{ steps: { label: string }[]; currentStep: number }` (1-based). Task 10 touches these same 2 files later and must run after this task (see Dependency Analysis).

- [ ] **Step 1: Create `components/shared/stepper.tsx`**

```tsx
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StepperStep {
  label: string;
}

export function Stepper({ steps, currentStep }: { steps: StepperStep[]; currentStep: number }) {
  return (
    <div className="flex items-center">
      {steps.map((step, i) => {
        const stepNumber = i + 1;
        const isDone = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;
        return (
          <div key={step.label} className={cn('flex items-center', i < steps.length - 1 && 'flex-1')}>
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium',
                  isDone && 'border-primary bg-primary text-primary-foreground',
                  isActive && !isDone && 'border-primary text-primary',
                  !isDone && !isActive && 'border-border text-muted-foreground'
                )}
              >
                {isDone ? <Check className="h-4 w-4" /> : stepNumber}
              </span>
              <span
                className={cn(
                  'whitespace-nowrap text-xs',
                  isActive ? 'font-medium text-foreground' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn('mx-2 h-px flex-1', isDone ? 'bg-primary' : 'bg-border')} />
            )}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Apply it to `app/(dashboard)/hasil-tangkap/input/page.tsx`**

Add `import { Stepper } from '@/components/shared/stepper';` to the imports.

Replace:

```tsx
        <CardHeader className="flex flex-row gap-6 text-sm font-medium text-muted-foreground">
          <span className={step === 1 ? 'text-primary' : undefined}>1. Data Kapal & Trip</span>
          <span className={step === 2 ? 'text-primary' : undefined}>2. Detail Ikan</span>
          <span className={step === 3 ? 'text-primary' : undefined}>3. Review & Simpan</span>
        </CardHeader>
```

with:

```tsx
        <CardHeader>
          <Stepper
            steps={[{ label: 'Data Kapal & Trip' }, { label: 'Detail Ikan' }, { label: 'Review & Simpan' }]}
            currentStep={step}
          />
        </CardHeader>
```

- [ ] **Step 3: Apply it to `app/(dashboard)/hasil-tangkap/biosecurity/page.tsx`**

Add the same import.

Replace:

```tsx
        <CardHeader className="flex flex-row gap-6 text-sm font-medium text-muted-foreground">
          <span className={step === 1 ? 'text-primary' : undefined}>1. Informasi Kapal</span>
          <span className={step === 2 ? 'text-primary' : undefined}>2. Pemeriksaan</span>
          <span className={step === 3 ? 'text-primary' : undefined}>3. Review & Simpan</span>
        </CardHeader>
```

with:

```tsx
        <CardHeader>
          <Stepper
            steps={[{ label: 'Informasi Kapal' }, { label: 'Pemeriksaan' }, { label: 'Review & Simpan' }]}
            currentStep={step}
          />
        </CardHeader>
```

- [ ] **Step 4: Manual verification against the dev server**

On both `/hasil-tangkap/input` and `/hasil-tangkap/biosecurity`, confirm the stepper renders 3 numbered circles connected by a line, the current step is highlighted, and advancing through the form (via "Lanjut") correctly marks earlier steps as done (checkmark) and advances the active highlight. Paste real screenshots.

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
git add components/shared/stepper.tsx "app/(dashboard)/hasil-tangkap/input/page.tsx" "app/(dashboard)/hasil-tangkap/biosecurity/page.tsx"
git commit -m "Add Stepper component and apply to multi-step forms"
```

**Acceptance criteria:**
- Both multi-step forms show a numbered-circle stepper with a connecting line, matching the design reference's pattern.
- Step transitions (advancing, going back) correctly update which steps show as done/active/pending.
- No change to either form's validation, submission, or field behavior.
- `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` all pass.

---

### Task 4: Color-code vessel status on the map (P1, structural/functional-visual)

**Files:**
- Modify: `components/dashboard/map-view.tsx`

**Interfaces:**
- Consumes: `KAPAL_STATUS_TONE` (`@/lib/kapal-status`, already exists).
- Produces: nothing new.

- [ ] **Step 1: Replace the single hardcoded `vesselIcon` with a per-status icon map**

Replace:

```tsx
const vesselIcon = L.divIcon({
  className: '',
  html: '<div style="width:10px;height:10px;border-radius:9999px;background:#22d3ee;box-shadow:0 0 0 3px rgba(34,211,238,0.3)"></div>',
  iconSize: [10, 10],
});
```

with:

```tsx
import type { KapalStatus } from '@/lib/types';
import { KAPAL_STATUS_TONE } from '@/lib/kapal-status';

// Same HSL values as --success / --warning / --destructive / --muted-foreground in app/globals.css,
// reused here (rather than duplicated as new colors) since Leaflet's divIcon needs an inline color
// string and can't reference CSS custom properties from a Tailwind class.
const TONE_COLOR: Record<'success' | 'warning' | 'destructive' | 'muted', string> = {
  success: 'hsl(142 71% 45%)',
  warning: 'hsl(38 92% 50%)',
  destructive: 'hsl(0 72% 51%)',
  muted: 'hsl(215 20% 65%)',
};

function vesselIconForStatus(status: KapalStatus) {
  const tone = KAPAL_STATUS_TONE[status];
  const color = TONE_COLOR[tone as keyof typeof TONE_COLOR] ?? TONE_COLOR.muted;
  return L.divIcon({
    className: '',
    html: `<div style="width:10px;height:10px;border-radius:9999px;background:${color};box-shadow:0 0 0 3px ${color}4d"></div>`,
    iconSize: [10, 10],
  });
}
```

- [ ] **Step 2: Use the per-status icon in the marker render**

Replace:

```tsx
        {kapal.map((k) => (
          <Marker key={k.id} position={[k.posisi.lat, k.posisi.lng]} icon={vesselIcon}>
```

with:

```tsx
        {kapal.map((k) => (
          <Marker key={k.id} position={[k.posisi.lat, k.posisi.lng]} icon={vesselIconForStatus(k.status)}>
```

- [ ] **Step 3: Manual verification against the dev server**

On `/dashboard` and `/peta-tracking`, confirm vessels with different statuses (`melaut`, `sandar`, `tidak_aktif`, `perbaikan`) render visibly different marker colors on the map, and that the colors match what `StatusBadge` shows for the same status elsewhere in the app (e.g. compare a `melaut` vessel's map marker color against its green badge on `/kapal`). Paste real screenshots showing at least 2 differently-colored markers.

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
git add components/dashboard/map-view.tsx
git commit -m "Color-code vessel map markers by status"
```

**Acceptance criteria:**
- Map markers visibly differ by vessel status, using the exact same tone colors as `StatusBadge` elsewhere in the app.
- No change to marker positions, popups, or the real-time jitter simulation.
- `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` all pass.

---

### Task 5: Solid-color `KpiCard` icon badges (P1, cosmetic — but appears on every page)

**Files:**
- Modify: `components/dashboard/kpi-card.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing new (same props, same 4 accent keys — only the rendered background/text treatment changes).

- [ ] **Step 1: Replace the tinted backgrounds with solid ones**

Replace:

```tsx
const ACCENT_BG: Record<string, string> = {
  blue: 'bg-primary/20 text-primary',
  green: 'bg-success/20 text-success',
  purple: 'bg-accent/20 text-accent',
  cyan: 'bg-sky-500/20 text-sky-400',
};
```

with:

```tsx
const ACCENT_BG: Record<string, string> = {
  blue: 'bg-primary text-primary-foreground',
  green: 'bg-success text-success-foreground',
  purple: 'bg-accent text-accent-foreground',
  cyan: 'bg-sky-500 text-white',
};
```

- [ ] **Step 2: Manual verification against the dev server**

Check `/dashboard`, `/nelayan`, `/kapal`, and `/hasil-tangkap` — confirm every KPI icon now sits on a solid, saturated color block (not a faint tint), matching the design reference's punchier icon badges, and that the icon itself remains clearly visible (white/light icon on the solid color). Paste real screenshots.

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
git add components/dashboard/kpi-card.tsx
git commit -m "Use solid-color icon badges on KpiCard"
```

**Acceptance criteria:**
- Every KPI card app-wide shows a solid-color icon badge instead of a low-opacity tint.
- Icon contrast remains legible against every accent color.
- `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` all pass.

---

### Task 6: Extend the existing decorative-delta pattern to 4 list pages (P1, cosmetic/content — scope-bounded, see Global Constraints)

**Files:**
- Modify: `app/(dashboard)/nelayan/page.tsx`
- Modify: `app/(dashboard)/kapal/page.tsx`
- Modify: `app/(dashboard)/koperasi/page.tsx`
- Modify: `app/(dashboard)/pasar-industri/page.tsx`

**Interfaces:**
- Consumes: `KpiCard`'s existing `deltaPercent`/`deltaLabel` props (already exist, no changes).
- Produces: nothing new.

**Scope reminder (see Global Constraints for the full reasoning):** only these 4 pages. Do not add deltas to Hasil Tangkap, Laporan, or Peta Tracking's KPI cards in this task.

- [ ] **Step 1: Add deltas to `/nelayan`'s 4 KPI cards**

Replace:

```tsx
        <KpiCard icon={Users} label="Total Nelayan" value={formatNumber(totalNelayan(nelayan))} accent="blue" />
        <KpiCard icon={CheckCircle2} label="Nelayan Aktif" value={formatNumber(nelayanAktifCount(nelayan))} accent="green" />
        <KpiCard icon={ShieldCheck} label="Terverifikasi" value={formatNumber(nelayanTerverifikasiCount(nelayan))} accent="cyan" />
        <KpiCard icon={UsersRound} label="Tergabung Koperasi" value={formatNumber(nelayanTergabungKoperasiCount(nelayan))} accent="purple" />
```

with:

```tsx
        <KpiCard icon={Users} label="Total Nelayan" value={formatNumber(totalNelayan(nelayan))} deltaPercent={4.6} deltaLabel="Dibandingkan bulan lalu" accent="blue" />
        <KpiCard icon={CheckCircle2} label="Nelayan Aktif" value={formatNumber(nelayanAktifCount(nelayan))} deltaPercent={2.1} deltaLabel="Dibandingkan bulan lalu" accent="green" />
        <KpiCard icon={ShieldCheck} label="Terverifikasi" value={formatNumber(nelayanTerverifikasiCount(nelayan))} deltaPercent={3.8} deltaLabel="Dibandingkan bulan lalu" accent="cyan" />
        <KpiCard icon={UsersRound} label="Tergabung Koperasi" value={formatNumber(nelayanTergabungKoperasiCount(nelayan))} deltaPercent={1.5} deltaLabel="Dibandingkan bulan lalu" accent="purple" />
```

- [ ] **Step 2: Add deltas to `/kapal`'s 4 KPI cards**

Replace:

```tsx
        <KpiCard icon={Ship} label="Total Kapal" value={formatNumber(totalKapal(kapal))} accent="blue" />
        <KpiCard icon={Anchor} label="Aktif Melaut" value={formatNumber(kapalMelautCount(kapal))} accent="green" />
        <KpiCard icon={PauseCircle} label="Sandar" value={formatNumber(kapalSandarCount(kapal))} accent="cyan" />
        <KpiCard icon={AlertTriangle} label="Tidak Aktif" value={formatNumber(kapalTidakAktifCount(kapal))} accent="purple" />
```

with:

```tsx
        <KpiCard icon={Ship} label="Total Kapal" value={formatNumber(totalKapal(kapal))} deltaPercent={5.2} deltaLabel="Dibandingkan bulan lalu" accent="blue" />
        <KpiCard icon={Anchor} label="Aktif Melaut" value={formatNumber(kapalMelautCount(kapal))} deltaPercent={3.4} deltaLabel="Dibandingkan bulan lalu" accent="green" />
        <KpiCard icon={PauseCircle} label="Sandar" value={formatNumber(kapalSandarCount(kapal))} deltaPercent={-1.8} deltaLabel="Dibandingkan bulan lalu" accent="cyan" />
        <KpiCard icon={AlertTriangle} label="Tidak Aktif" value={formatNumber(kapalTidakAktifCount(kapal))} deltaPercent={-2.6} deltaLabel="Dibandingkan bulan lalu" accent="purple" />
```

- [ ] **Step 3: Add deltas to `/koperasi`'s 4 KPI cards**

Replace:

```tsx
        <KpiCard icon={UsersRound} label="Total Koperasi" value={formatNumber(koperasi.length)} accent="blue" />
        <KpiCard icon={CheckCircle2} label="Koperasi Aktif" value={formatNumber(aktifCount)} accent="green" />
        <KpiCard icon={Users} label="Anggota Terdaftar (Koperasi)" value={formatNumber(totalAnggota)} accent="cyan" />
        <KpiCard icon={Fish} label="Volume Hasil (kg)" value={formatNumber(totalVolume)} accent="purple" />
```

with:

```tsx
        <KpiCard icon={UsersRound} label="Total Koperasi" value={formatNumber(koperasi.length)} deltaPercent={2.4} deltaLabel="Dibandingkan bulan lalu" accent="blue" />
        <KpiCard icon={CheckCircle2} label="Koperasi Aktif" value={formatNumber(aktifCount)} deltaPercent={1.9} deltaLabel="Dibandingkan bulan lalu" accent="green" />
        <KpiCard icon={Users} label="Anggota Terdaftar (Koperasi)" value={formatNumber(totalAnggota)} deltaPercent={3.1} deltaLabel="Dibandingkan bulan lalu" accent="cyan" />
        <KpiCard icon={Fish} label="Volume Hasil (kg)" value={formatNumber(totalVolume)} deltaPercent={6.7} deltaLabel="Dibandingkan bulan lalu" accent="purple" />
```

(Verify the exact current variable names — `aktifCount`, `totalAnggota`, `totalVolume` — against the live file before applying; they were extracted to `lib/stats.ts` helpers in a prior plan and the call site may read `aktifKoperasiCount(koperasi)`/`totalVolumeKoperasi(koperasi)` directly rather than a local variable. Match whatever the current line actually is; only the added `deltaPercent`/`deltaLabel` props are new.)

- [ ] **Step 4: Add deltas to `/pasar-industri`'s 4 KPI cards**

Same pattern as Step 3 — add `deltaPercent`/`deltaLabel` to all 4 existing `KpiCard` elements on this page, using illustrative values in the same 1-7% range (e.g. 3.2, 2.5, 4.8, 5.9), matching whatever the current variable/prop names on this page actually are.

- [ ] **Step 5: Manual verification against the dev server**

Confirm all 4 pages now show a delta arrow + percentage + "Dibandingkan bulan lalu" caption on every KPI card, styled identically to Dashboard's existing cards (green ↑ for positive, red ↓ for negative — `kapal`'s "Sandar"/"Tidak Aktif" cards use negative values specifically to exercise the red/down-arrow path). Paste real screenshots.

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
git add "app/(dashboard)/nelayan/page.tsx" "app/(dashboard)/kapal/page.tsx" "app/(dashboard)/koperasi/page.tsx" "app/(dashboard)/pasar-industri/page.tsx"
git commit -m "Add illustrative KPI deltas to Nelayan, Kapal, Koperasi, Pasar-Industri"
```

**Acceptance criteria:**
- All 4 named pages' KPI cards show a delta indicator matching Dashboard's existing visual style.
- At least one card exercises the negative/red-down-arrow path (already specified above for `/kapal`).
- Hasil Tangkap, Laporan, and Peta Tracking are untouched.
- `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` all pass.

---

### Task 7: Header logo/emblem icon (P1, cosmetic)

**Files:**
- Modify: `components/layout/header.tsx`

**Interfaces:**
- Consumes: `Landmark` icon (`lucide-react`, already a dependency).
- Produces: nothing new.

No actual government/agency seal asset exists in this project and fabricating a fictitious official emblem would be inappropriate; a generic institutional icon (`Landmark`, already used for government/institution contexts in icon sets) closes the "header looks unbranded" gap without pretending to be a real seal.

- [ ] **Step 1: Add the icon**

Add `import { Landmark } from 'lucide-react';` to the imports (alongside the existing `Search, ChevronDown` import from `lucide-react`).

Find the header's title block — currently something like a `<div>` containing "DIGITAL FISHERMAN ID" and its subtitle (read the live file to get the exact current markup, since this file predates several later plans and its exact JSX structure should be confirmed before editing). Wrap the existing title/subtitle block and a new icon in a flex container, e.g.:

```tsx
<div className="flex items-center gap-2">
  <Landmark className="h-8 w-8 shrink-0 text-primary" />
  {/* existing title/subtitle block, unchanged */}
</div>
```

Preserve every existing class name and text content in the title/subtitle block exactly — only add the icon as a new sibling before it.

- [ ] **Step 2: Manual verification against the dev server**

Confirm the icon renders at a reasonable size relative to the two-line title text, doesn't wrap awkwardly at narrower widths, and is present on every route (it's in the shared layout, so one check on any page confirms all). Paste a real screenshot.

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
git add components/layout/header.tsx
git commit -m "Add emblem icon to header branding"
```

**Acceptance criteria:**
- Header shows an icon before the app title on every route, without breaking the existing layout at any width the app already supports.
- `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` all pass.

---

### Task 8: Gradient-filled area chart style (P1, cosmetic)

**Files:**
- Modify: `components/dashboard/trend-line-chart.tsx`

**Interfaces:**
- Consumes: Recharts' `AreaChart`/`Area`/`defs`/`linearGradient` (same package already used for `LineChart`, no new dependency).
- Produces: nothing new — same `{ data: { tanggal, totalKg }[] }` prop shape, only the rendered chart type changes.

- [ ] **Step 1: Convert the line chart to a gradient area chart**

Replace the entire file with:

```tsx
'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatDate, formatNumber } from '@/lib/format';

export function TrendLineChart({ data }: { data: { tanggal: string; totalKg: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--success)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="tanggal"
          tickFormatter={(v) => formatDate(v).replace(/ \d{4}$/, '')}
          stroke="var(--muted-foreground)"
          fontSize={12}
        />
        <YAxis tickFormatter={(v) => formatNumber(v)} stroke="var(--muted-foreground)" fontSize={12} />
        <Tooltip
          formatter={(value) => [`${formatNumber(Number(value))} kg`, 'Total']}
          labelFormatter={(label) => formatDate(String(label))}
          contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        />
        <Area
          type="monotone"
          dataKey="totalKg"
          stroke="var(--success)"
          strokeWidth={2}
          fill="url(#trendFill)"
          dot={{ r: 3 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
```

Component name (`TrendLineChart`) and file path are kept as-is even though it now renders an area chart, to avoid a rename that would touch every import site (`/dashboard`, `/hasil-tangkap`, `/laporan`) for a purely cosmetic change — renaming is explicitly not required by this task.

- [ ] **Step 2: Manual verification against the dev server**

Check `/dashboard`, `/hasil-tangkap`, and `/laporan` (all 3 consume this component) — confirm each trend chart now shows a soft gradient fill under the line fading to transparent, the tooltip still works on hover, and no visual regression to axis labels or grid lines. Paste real screenshots from at least 2 of the 3 pages.

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
git add components/dashboard/trend-line-chart.tsx
git commit -m "Add gradient area fill to TrendLineChart"
```

**Acceptance criteria:**
- All 3 consumers of `TrendLineChart` show a gradient-filled area instead of a bare line.
- Tooltip, axis formatting, and data shape are unchanged.
- `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` all pass.

---

### Task 9: Row icons on entity tables + "+" icon on Add buttons (P1, cosmetic)

**Files:**
- Modify: `app/(dashboard)/nelayan/page.tsx`
- Modify: `app/(dashboard)/kapal/page.tsx`
- Modify: `app/(dashboard)/koperasi/page.tsx`
- Modify: `app/(dashboard)/pasar-industri/page.tsx`

**Interfaces:**
- Consumes: `Plus` icon and a per-entity icon (`User`, `Ship`, `UsersRound`, `Building2` — the same icons each page's own KPI card already uses) from `lucide-react`.
- Produces: nothing new.

- [ ] **Step 1: Add a small circular icon before each entity's name in all 4 tables**

For each of the 4 files, find the `Nama`/name column's `cell` renderer (e.g. in `nelayan/page.tsx`):

```tsx
    {
      header: 'Nama',
      cell: (n) => (
        <Link href={`/nelayan/${n.id}`} className="font-medium text-primary hover:underline">
          {n.nama}
        </Link>
      ),
    },
```

Replace with (adding a small icon-in-circle before the link, reusing the entity's existing KPI icon — `User` for Nelayan, `Ship` for Kapal, `UsersRound` for Koperasi, `Building2` for Pasar/Industri):

```tsx
    {
      header: 'Nama',
      cell: (n) => (
        <Link href={`/nelayan/${n.id}`} className="flex items-center gap-2 font-medium text-primary hover:underline">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <User className="h-3.5 w-3.5" />
          </span>
          {n.nama}
        </Link>
      ),
    },
```

Add the corresponding icon import (`User`, `Ship`, `UsersRound`, `Building2`) to each file if not already imported — check first, since `kapal/page.tsx` and `koperasi/page.tsx` may already import their icon for the KPI row and can reuse the same import.

Apply the equivalent change to `kapal/page.tsx`'s "Nama Kapal" column (icon: `Ship`), `koperasi/page.tsx`'s "Nama" column (icon: `UsersRound`), and `pasar-industri/page.tsx`'s "Nama" column (icon: `Building2`).

- [ ] **Step 2: Add a "+" icon to the two "Tambah" buttons**

In `nelayan/page.tsx`, add `Plus` to the `lucide-react` import, then change:

```tsx
<DialogTrigger render={<Button />}>Tambah Nelayan</DialogTrigger>
```

to:

```tsx
<DialogTrigger render={<Button />}>
  <Plus className="mr-2 h-4 w-4" />
  Tambah Nelayan
</DialogTrigger>
```

Apply the identical change to `kapal/page.tsx`'s `Tambah Kapal` trigger.

- [ ] **Step 3: Manual verification against the dev server**

Confirm all 4 list tables show a small circular icon before each row's name link, and both "Tambah" buttons show a leading plus icon. Confirm nothing else about row layout/alignment shifted unexpectedly. Paste real screenshots.

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
git add "app/(dashboard)/nelayan/page.tsx" "app/(dashboard)/kapal/page.tsx" "app/(dashboard)/koperasi/page.tsx" "app/(dashboard)/pasar-industri/page.tsx"
git commit -m "Add row icons to entity tables and plus icon to Add buttons"
```

**Acceptance criteria:**
- All 4 entity tables show a small icon-in-circle before each row's name.
- Both "Tambah" buttons show a leading plus icon.
- No change to navigation, dialogs, or table behavior.
- `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` all pass.

---

### Task 10: Layout density polish on under-filled pages (P1, cosmetic — scope-limited to spacing/alignment only)

**Files:**
- Modify: `app/(dashboard)/pengaturan/page.tsx`
- Modify: `app/(dashboard)/hasil-tangkap/input/page.tsx`
- Modify: `app/(dashboard)/hasil-tangkap/biosecurity/page.tsx`
- Modify: `app/(dashboard)/kapal/jadwal-sandar/page.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing new.

**Scope reminder:** the audit's finding here is that these 4 pages leave large unstyled empty space below sparse content compared to the reference's dense, sidebar-filled layouts. Fully closing that gap would mean adding new sidebar widgets (tips panels, activity feeds, account info) — that is new *content*, not a visual-only fix, and is explicitly out of scope for this plan per its "reuse existing, no new features" constraint. This task is limited to **layout/spacing adjustments only**: constraining form cards to a readable max-width instead of letting them sit awkwardly narrow in a full-width empty page, and normalizing vertical rhythm — not adding new panels.

- [ ] **Step 1: Constrain form-card width on the 3 form pages**

For each of `hasil-tangkap/input/page.tsx`, `hasil-tangkap/biosecurity/page.tsx`, and `kapal/jadwal-sandar/page.tsx`, find the outer `<div className="space-y-6">` wrapping the page content and add a max-width constraint so the card doesn't read as an arbitrarily-placed small box in a much wider empty page:

Replace:

```tsx
    <div className="space-y-6">
```

with:

```tsx
    <div className="mx-auto max-w-4xl space-y-6">
```

Apply this to all 3 files' outermost wrapper `div` only — do not add this constraint to any list page (Nelayan, Kapal, Koperasi, etc.), since those already use the full width productively for wide tables.

- [ ] **Step 2: Apply the same constraint to `/pengaturan`**

In `app/(dashboard)/pengaturan/page.tsx`, apply the identical `mx-auto max-w-4xl` change to the outermost wrapper `div`.

- [ ] **Step 3: Manual verification against the dev server**

Check all 4 pages at 1440px and at a narrower width (e.g. 1024px) — confirm the content is now centered with a readable max-width instead of a small card floating in a very wide empty area, and confirm no existing content (labels, inputs, tables within these pages) overflows or wraps awkwardly at the new width. Paste real screenshots at both widths for at least 2 of the 4 pages.

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
git add "app/(dashboard)/pengaturan/page.tsx" "app/(dashboard)/hasil-tangkap/input/page.tsx" "app/(dashboard)/hasil-tangkap/biosecurity/page.tsx" "app/(dashboard)/kapal/jadwal-sandar/page.tsx"
git commit -m "Constrain form-page width to reduce empty space on under-filled pages"
```

**Acceptance criteria:**
- All 4 named pages present their content in a centered, readable-width column instead of a small card in a very wide empty page.
- No existing table, form field, or button on these pages breaks or overflows at the new width.
- No new content/widgets were added — this task is layout-only, per the scope reminder above.
- `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` all pass.

---

## Dependency Analysis

File touch map:

| Task | Files |
|---|---|
| 1 | `hasil-tangkap/page.tsx` |
| 2 | `data-table.tsx`, `lib/table.ts`, `lib/table.test.ts` |
| 3 | new `stepper.tsx`, `hasil-tangkap/input/page.tsx`, `hasil-tangkap/biosecurity/page.tsx` |
| 4 | `map-view.tsx` |
| 5 | `kpi-card.tsx` |
| 6 | `nelayan/page.tsx`, `kapal/page.tsx`, `koperasi/page.tsx`, `pasar-industri/page.tsx` |
| 7 | `header.tsx` |
| 8 | `trend-line-chart.tsx` |
| 9 | `nelayan/page.tsx`, `kapal/page.tsx`, `koperasi/page.tsx`, `pasar-industri/page.tsx` |
| 10 | `pengaturan/page.tsx`, `hasil-tangkap/input/page.tsx`, `hasil-tangkap/biosecurity/page.tsx`, `kapal/jadwal-sandar/page.tsx` |

**Real file-level dependencies (must run in this relative order):**
- **Task 6 before Task 9** — both touch all 4 of the same files (`nelayan/page.tsx`, `kapal/page.tsx`, `koperasi/page.tsx`, `pasar-industri/page.tsx`), Task 6 on the KPI row and Task 9 on the table columns/buttons. Run Task 6 first so Task 9's row-icon edits apply to the post-delta version of each file without one implementer's diff clobbering the other's.
- **Task 3 before Task 10** — both touch `hasil-tangkap/input/page.tsx` and `hasil-tangkap/biosecurity/page.tsx`. Run Task 3's `CardHeader`→`Stepper` swap first, then Task 10's outer-wrapper width change second, so Task 10 is edited against the already-Stepper-ified file.

**Everything else is file-disjoint** (Tasks 1, 2, 4, 5, 7, 8 touch no file that any other task touches) and is, in principle, fully parallelizable.

**Execution guidance (dynamic workflow):** `superpowers:subagent-driven-development` unconditionally forbids dispatching multiple implementer subagents in parallel regardless of file independence (the standing rule applied throughout this project) — so actual execution is sequential task-by-task regardless. The recommended sequential order, respecting the two real dependencies above and the plan's own P0-then-structural-then-cosmetic priority ordering, is simply **Task 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10** (the order the tasks are already written in). If execution ever moves to a tool/skill that does permit parallel implementers, {1, 2, 4, 5, 7, 8} could run concurrently, then {6, 3} could run concurrently once those finish, then {9, 10} last (each depending on its respective predecessor).

## Priority Summary

| Priority | Task | Why it's ordered here |
|---|---|---|
| P0 | 1 — Table overflow fix | The only outright rendering defect found in the audit |
| P1 (structural) | 2 — DataTable numbered pagination | Highest leverage: one component, every paginated page |
| P1 (structural) | 3 — Shared Stepper | New reusable pattern, fixes both multi-step forms at once |
| P1 (structural) | 4 — Map marker status colors | Restores a real information signal (fleet status) the KPI row already promises |
| P1 (structural, app-wide) | 5 — Solid KPI icon badges | One component, every KPI card in the app |
| P1 (cosmetic/content) | 6 — Illustrative KPI deltas | Extends an existing, already-sanctioned pattern to 4 more pages |
| P1 (cosmetic) | 7 — Header emblem icon | Single shared component, one-line addition |
| P1 (cosmetic) | 8 — Gradient area charts | One component, 3 consuming pages |
| P1 (cosmetic) | 9 — Row icons + button plus icons | Page-scoped polish, 4 files |
| P1 (cosmetic, scope-limited) | 10 — Layout density | Explicitly bounded to spacing only, no new content |

## Test / Verification Requirements

- New pure logic (`pageNumbersToShow` in Task 2) gets unit tests — the only genuinely new non-trivial logic in this plan.
- Every other task is UI-only and is verified manually against the dev server with literal pasted screenshot evidence, consistent with this project's established testing policy and its standing verification-integrity rule from prior incidents (evidence must be real and specific, never asserted without proof).
- `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` must all pass at the end of every task.
- No task in this plan should change the full test count except Task 2 (which adds the `pageNumbersToShow` tests) — any other change to the test count during this plan is a signal something touched more than intended.
