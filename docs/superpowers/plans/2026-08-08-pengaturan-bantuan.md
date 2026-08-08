# Pengaturan & Bantuan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the last two remaining routes from the design spec: `/pengaturan` (config tabs with local-state feature toggles, decorative-only tabs showing a "coming soon" toast) and `/bantuan` (FAQ accordion, dummy ticket list, new-ticket form). Both routes are already linked from the sidebar (`components/layout/nav-items.ts` has had `Pengaturan`/`Bantuan` entries since Plan 1) and both currently 404, since neither page exists yet. **This is the final plan needed to complete every route in the design spec's routing table.**

**Architecture:** Four tasks. Task 1 adds the ticket data model (`TiketBantuan`), extends the deterministic seed script to generate 6 dummy tickets, and wires a `tiketBantuan` array + `addTiketBantuan` mutator into `DataContext` — following the exact same pattern already used for every other locally-added record type (`addHasilTangkap`, `addJadwalSandar`, `addBiosecurityCheck`). Task 2 adds four missing shared UI primitives that this plan needs and no existing plan built: `Switch`, `Accordion`, `Toast`, and `Textarea`. Three of these wrap `@base-ui/react` sub-packages that are already an installed dependency (no new npm package), following the identical thin-wrapper convention every other `components/ui/*.tsx` file already uses (`Tabs` wraps `@base-ui/react/tabs`, `Select` wraps `@base-ui/react/select`, etc.) — this is completing the existing primitive set, not introducing a new architecture. `Textarea` needs no primitive at all (native `<textarea>`, styled to match `Input`'s conventions). Task 3 builds `/pengaturan` on top of Task 2. Task 4 builds `/bantuan` on top of both Task 1 and Task 2.

**Tech Stack:** Next.js 16 (App Router) + TypeScript + Tailwind CSS v4, shadcn/ui on `@base-ui/react` (already a dependency — no new npm packages needed by this plan), React Context (`DataContext`), `@faker-js/faker` (already a dependency, used only by the existing seed script), Vitest for `lib/`-only unit tests (this plan adds no new non-trivial `lib/` logic, so it adds no new test files — consistent with the project's stated testing policy).

## Global Constraints

- **Deviation from every prior plan's "no new shared UI components" rule, and why it's justified here:** `/pengaturan` needs real feature toggles (spec: "feature toggles") and `/bantuan` needs a real FAQ accordion (spec: "FAQ accordion") and a multi-line ticket description field — none of `Switch`, `Accordion`, or `Textarea` exist in `components/ui/` today, and the spec's own interactivity section requires a toast ("shows a ... toast instead of doing anything"). All three missing interactive primitives (`Switch`, `Accordion`, `Toast`) wrap `@base-ui/react` sub-packages already present in `node_modules` as part of the existing `@base-ui/react` dependency — confirmed present: `node_modules/@base-ui/react/switch`, `.../accordion`, `.../toast`. This plan is completing the same primitive set every other page already draws from (`Tabs`, `Select`, `Dialog`, `Sheet` all follow this identical wrapping convention), not introducing new architecture. Do not add any UI primitive beyond these four; do not reach for a Dialog for the ticket form (see below).
- **No Dialog for the ticket form:** `components/ui/dialog.tsx` exists in this codebase but has never actually been used by any page (`grep -r Dialog app/` returns nothing) — meaning it would be an unproven, first-time consumer if used here. The spec only requires "a new-ticket form," not a modal. Build it as an inline `Card` section on `/bantuan`, matching the established inline-form convention already used by `/kapal/jadwal-sandar` and `/hasil-tangkap/input`. This keeps this already-large plan from compounding risk with a fifth "first use of a component" in one plan.
- **`onCheckedChange` vs. `onValueChange` — do NOT apply the Select/Tabs null-guard pattern to `Switch`.** `Select`'s and `Tabs`' `onValueChange` pass a value that can be `null` (`(value: T | null, eventDetails) => void`), which is why those call sites need `(v) => setX(v ?? fallback)`. `Switch`'s `onCheckedChange` signature (confirmed in `node_modules/@base-ui/react/switch/root/SwitchRoot.d.ts`) is `(checked: boolean, eventDetails: SwitchRoot.ChangeEventDetails) => void` — `checked` is always a definite `boolean`, never `null`. A plain `<Switch checked={x} onCheckedChange={setX} />` is correct and type-checks cleanly (a callback with fewer declared parameters is assignable to a prop type expecting more, since the extra `eventDetails` argument is simply ignored) — do not wrap it in an unnecessary arrow function or null-coalesce.
- **Seed-script determinism — the single riskiest step in this plan.** `scripts/seed-mock-data.ts` calls `faker.seed(20250510)` once at the top, and every array below it consumes faker's PRNG sequentially — every existing mock-data file's exact content depends on the exact order faker calls happen in this file today. **New faker calls for `tiketBantuanData` MUST be inserted after the existing `biosecurityCheckData` array (the last currently-defined array) and before the `function writeModule` declaration** — never earlier in the file. Inserting earlier would shift every subsequent faker call's output, silently changing already-shipped, already-reviewed data in `nelayan.ts`, `kapal.ts`, `koperasi.ts`, `pasar-industri.ts`, `hasil-tangkap.ts`, `notifikasi.ts`, and `jadwal-sandar.ts` — a regression that would only show up as inexplicably-different values on five already-merged pages. Task 1's Step 5 verifies this explicitly with a diff.
- No new npm dependencies. `Switch`/`Accordion`/`Toast` come from the already-installed `@base-ui/react` package; `Textarea` is a plain native element.
- `Toast`'s manager (`createToastManager()`) is a plain object usable outside React — `toastManager.add({...})` can be called directly from any `onClick` handler with no hook needed. The `<Toaster />` component (rendering `<Toast.Provider>` + the viewport) must be mounted exactly once, in the shared `app/(dashboard)/layout.tsx`, so toasts triggered from any page are visible.
- `/pengaturan` and `/bantuan` are already wired into `components/layout/nav-items.ts` since Plan 1 — no task in this plan touches that file.
- Node.js/npm are not on this shell's default PATH — prepend before any npm/npx command: `export PATH="/c/Program Files/nodejs:$PATH"`.
- `npx tsc --noEmit` can fail with a `LayoutProps` error on a fresh checkout before `next build`/`next dev` has run once — a known, harmless, environment-only quirk. Run `next build` if this error appears bare.
- Do not touch any other route or `lib/stats.ts`, `lib/csv.ts`, `lib/search.ts` — out of scope for this plan.

---

### Task 1: Ticket data model, seed data, and `DataContext` wiring

**Files:**
- Modify: `lib/types.ts`
- Modify: `scripts/seed-mock-data.ts`
- Create (generated, not hand-written): `lib/mock-data/tiket-bantuan.ts`
- Modify: `context/data-context.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: `TiketKategori`, `TiketStatus`, `TiketBantuan` types (`lib/types.ts`); `tiketBantuanData: TiketBantuan[]` (`lib/mock-data/tiket-bantuan.ts`); `tiketBantuan: TiketBantuan[]` and `addTiketBantuan: (t: TiketBantuan) => void` on `useData()`. Task 4 consumes all of these.

- [ ] **Step 1: Add the ticket type to `lib/types.ts`**

Append at the end of `lib/types.ts`:

```ts
export type TiketKategori = 'Teknis' | 'Akun' | 'Data' | 'Lainnya';
export type TiketStatus = 'Terbuka' | 'Diproses' | 'Selesai';

export interface TiketBantuan {
  id: string;
  judul: string;
  kategori: TiketKategori;
  deskripsi: string;
  status: TiketStatus;
  dibuatPada: string;
}
```

- [ ] **Step 2: Extend the seed script's import line**

In `scripts/seed-mock-data.ts`, change:

```ts
import type { Kapal, Nelayan, HasilTangkap, Koperasi, PasarIndustri, Notifikasi, JadwalSandar, BiosecurityCheck } from '../lib/types';
```

to:

```ts
import type { Kapal, Nelayan, HasilTangkap, Koperasi, PasarIndustri, Notifikasi, JadwalSandar, BiosecurityCheck, TiketBantuan } from '../lib/types';
```

- [ ] **Step 3: Insert the ticket data generation block in the correct position**

Find the existing `biosecurityCheckData` array — it ends with this exact code (the last array currently defined in the file, immediately before `function writeModule`):

```ts
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

function writeModule(fileName: string, exportName: string, typeName: string, data: unknown) {
```

**Insert the following block between that closing `});` and `function writeModule` — after `biosecurityCheckData`'s closing `});`, before `function writeModule`, nowhere else:**

```ts
const KATEGORI_TIKET: TiketBantuan['kategori'][] = ['Teknis', 'Akun', 'Data', 'Lainnya'];
const STATUS_TIKET: TiketBantuan['status'][] = ['Terbuka', 'Diproses', 'Selesai'];

const tiketBantuanData: TiketBantuan[] = Array.from({ length: 6 }, () => ({
  id: faker.string.uuid(),
  judul: faker.lorem.sentence({ min: 4, max: 8 }),
  kategori: faker.helpers.arrayElement(KATEGORI_TIKET),
  deskripsi: faker.lorem.sentences(2),
  status: faker.helpers.arrayElement(STATUS_TIKET),
  dibuatPada: faker.date.recent({ days: 20, refDate: SEED_DATE }).toISOString(),
}));

function writeModule(fileName: string, exportName: string, typeName: string, data: unknown) {
```

(The last line above duplicates the existing `function writeModule` line — this is shown only so you can locate the exact insertion point unambiguously; do not create a second copy of the function declaration.)

- [ ] **Step 4: Add the new `writeModule` call**

Find the last line of the existing `writeModule(...)` call list:

```ts
writeModule('jadwal-sandar.ts', 'jadwalSandarData', 'JadwalSandar', jadwalSandarData);
```

Add immediately after it:

```ts
writeModule('tiket-bantuan.ts', 'tiketBantuanData', 'TiketBantuan', tiketBantuanData);
```

- [ ] **Step 5: Run the seed script and verify no pre-existing file changed**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
npm run seed
git status --short lib/mock-data/
```

Expected: `git status` shows exactly one change — `lib/mock-data/tiket-bantuan.ts` as a new untracked file. **If any of `nelayan.ts`, `kapal.ts`, `koperasi.ts`, `pasar-industri.ts`, `hasil-tangkap.ts`, `notifikasi.ts`, or `jadwal-sandar.ts` shows as modified, STOP — this means the new generation block was inserted in the wrong position (before an existing array instead of after all of them) and has corrupted already-shipped data. Undo, re-check the insertion point against Step 3, and re-run.** Paste the literal `git status --short` output in your report either way.

Read the generated `lib/mock-data/tiket-bantuan.ts` and confirm it has the same generated-file header and shape as every other file in that directory (6 records, each with a valid `kategori` and `status`).

- [ ] **Step 6: Wire `tiketBantuan` into `DataContext`**

In `context/data-context.tsx`:

Add to the import list: `import { tiketBantuanData } from '@/lib/mock-data/tiket-bantuan';` (alongside the other `mock-data` imports) and add `TiketBantuan` to the `import type { ... } from '@/lib/types';` line.

Add to the `DataContextValue` interface:

```ts
  tiketBantuan: TiketBantuan[];
  addTiketBantuan: (t: TiketBantuan) => void;
```

Add inside `DataProvider`, alongside the other `useState` calls:

```ts
  const [tiketBantuan, setTiketBantuan] = useState<TiketBantuan[]>(tiketBantuanData);
```

Add alongside the other `useCallback`-wrapped mutators:

```ts
  const addTiketBantuan = useCallback((t: TiketBantuan) => setTiketBantuan((prev) => [t, ...prev]), []);
```

Add `tiketBantuan` and `addTiketBantuan` to both the `value` object and its `useMemo` dependency array, in the same position/style as the other fields.

- [ ] **Step 7: Verification**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
npx tsc --noEmit
npm run lint
npm test
npm run build
```

Expected: all four clean. No new route is added by this task (no page consumes `tiketBantuan` yet), so the build's route list is unchanged from before this task.

- [ ] **Step 8: Commit**

```bash
git add lib/types.ts scripts/seed-mock-data.ts lib/mock-data/tiket-bantuan.ts context/data-context.tsx
git commit -m "Add TiketBantuan data model, seed data, and DataContext wiring"
```

**Acceptance criteria:**
- `TiketBantuan` type exists with the exact shape specified.
- `lib/mock-data/tiket-bantuan.ts` is generated by `npm run seed`, contains exactly 6 records, and is the ONLY new/changed file under `lib/mock-data/` after running the seed script (verified via pasted `git status --short` output).
- `useData()` exposes `tiketBantuan` and `addTiketBantuan`, following the exact same `useCallback`/`useMemo` pattern as every other field.
- `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` all pass.

---

### Task 2: Missing shared UI primitives (`Switch`, `Accordion`, `Toast`, `Textarea`)

**Files:**
- Create: `components/ui/switch.tsx`
- Create: `components/ui/accordion.tsx`
- Create: `components/ui/textarea.tsx`
- Create: `components/ui/toast.tsx`
- Modify: `app/(dashboard)/layout.tsx`

**Interfaces:**
- Consumes: `@base-ui/react/switch`, `@base-ui/react/accordion`, `@base-ui/react/toast` (already-installed dependency); `cn` (`@/lib/utils`).
- Produces: `Switch` (`@/components/ui/switch`); `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent` (`@/components/ui/accordion`); `Textarea` (`@/components/ui/textarea`); `Toaster`, `toastManager` (`@/components/ui/toast`). Task 3 consumes `Switch` and `toastManager`. Task 4 consumes `Accordion`/`AccordionItem`/`AccordionTrigger`/`AccordionContent`, `Textarea`, and `toastManager`.

- [ ] **Step 1: Create `components/ui/switch.tsx`**

```tsx
'use client';

import { Switch as SwitchPrimitive } from '@base-ui/react/switch';
import { cn } from '@/lib/utils';

function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent bg-muted transition-colors data-[checked]:bg-primary disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block h-4 w-4 translate-x-0.5 rounded-full bg-background shadow-sm transition-transform data-[checked]:translate-x-4"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
```

(`data-checked`/`data-unchecked` attribute names confirmed against `node_modules/@base-ui/react/switch/root/SwitchRootDataAttributes.js` during planning — do not guess a different attribute name if you re-derive this.)

- [ ] **Step 2: Create `components/ui/accordion.tsx`**

```tsx
'use client';

import { Accordion as AccordionPrimitive } from '@base-ui/react/accordion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

function Accordion(props: AccordionPrimitive.Root.Props) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn('border-b border-border', className)}
      {...props}
    />
  );
}

function AccordionTrigger({ className, children, ...props }: AccordionPrimitive.Trigger.Props) {
  return (
    <AccordionPrimitive.Header>
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          'flex w-full items-center justify-between py-4 text-left text-sm font-medium hover:underline [&[data-panel-open]>svg]:rotate-180',
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({ className, children, ...props }: AccordionPrimitive.Panel.Props) {
  return (
    <AccordionPrimitive.Panel data-slot="accordion-content" className="overflow-hidden text-sm" {...props}>
      <div className={cn('pb-4 text-muted-foreground', className)}>{children}</div>
    </AccordionPrimitive.Panel>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
```

(`data-panel-open` attribute name confirmed against `node_modules/@base-ui/react/collapsible/trigger/CollapsibleTriggerDataAttributes.js` during planning, which the accordion trigger's open-state mapping reuses.)

- [ ] **Step 3: Create `components/ui/textarea.tsx`**

```tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex min-h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm dark:bg-input/30',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
```

(No `@base-ui/react` package exists for textarea — confirmed during planning — this is a plain native element styled to match `components/ui/input.tsx`'s conventions, same as every shadcn textarea.)

- [ ] **Step 4: Create `components/ui/toast.tsx`**

```tsx
'use client';

import { Toast } from '@base-ui/react/toast';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const toastManager = Toast.createToastManager();

export function Toaster() {
  return (
    <Toast.Provider toastManager={toastManager}>
      <ToastList />
    </Toast.Provider>
  );
}

function ToastList() {
  const { toasts } = Toast.useToastManager();
  return (
    <Toast.Portal>
      <Toast.Viewport className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <Toast.Root
            key={toast.id}
            toast={toast}
            className={cn(
              'relative rounded-lg border border-border bg-card p-4 pr-8 shadow-lg',
              'data-[starting-style]:translate-x-full data-[ending-style]:translate-x-full',
              'transition-transform duration-200',
            )}
          >
            <Toast.Title className="text-sm font-semibold" />
            <Toast.Description className="mt-1 text-sm text-muted-foreground" />
            <Toast.Close
              className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground hover:bg-muted"
              aria-label="Tutup notifikasi"
            >
              <X className="h-3.5 w-3.5" />
            </Toast.Close>
          </Toast.Root>
        ))}
      </Toast.Viewport>
    </Toast.Portal>
  );
}
```

(`Toast.Title`/`Toast.Description` automatically render the toast's `title`/`description` fields from context when given no `children` — confirmed against `node_modules/@base-ui/react/toast/title/ToastTitle.js`'s `useToastLabelPart` call during planning. `toastManager.add({ title, description })` can be called from anywhere, including outside a component, per `createToastManager`'s own doc comment: "A global manager for toasts to use outside of a React component.")

- [ ] **Step 5: Mount `Toaster` once in the shared dashboard layout**

In `app/(dashboard)/layout.tsx`, add the import and render `<Toaster />` once, as a sibling of the existing outer `<div className="flex h-screen">`'s content (not nested inside `<main>`, so it isn't affected by page-level scrolling):

```tsx
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Toaster } from '@/components/ui/toast';

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-background p-6">{children}</main>
      </div>
      <Toaster />
    </div>
  );
}
```

- [ ] **Step 6: Manual verification against the dev server**

Since neither `/pengaturan` nor `/bantuan` exists yet, verify these primitives render correctly using a temporary throwaway test: add a `<Switch defaultChecked />`, an `<Accordion><AccordionItem value="1"><AccordionTrigger>Test</AccordionTrigger><AccordionContent>Content</AccordionContent></AccordionItem></Accordion>`, a `<Textarea placeholder="test" />`, and a button calling `toastManager.add({ title: 'Test', description: 'Test toast' })` onto any existing page temporarily (e.g. `/dashboard`), confirm all four render and interact correctly in the browser (switch toggles visually, accordion expands/collapses, textarea accepts multi-line input, toast appears and auto-dismisses), then **revert that temporary change before committing** — it must not be part of this task's diff. Paste real evidence (rendered HTML/screenshareable description) of each of the four working, then confirm via `git diff` that the temporary test page edit was fully reverted.

- [ ] **Step 7: Full verification suite**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
npx tsc --noEmit
npm run lint
npm test
npm run build
```

Expected: all four clean. No new route is added (these are components, not pages), so the build's route list is unchanged except that every existing page now also renders `<Toaster />` (invisible until a toast is added) — spot-check one existing page (e.g. `/dashboard`) still renders normally.

- [ ] **Step 8: Commit**

```bash
git add components/ui/switch.tsx components/ui/accordion.tsx components/ui/textarea.tsx components/ui/toast.tsx "app/(dashboard)/layout.tsx"
git commit -m "Add Switch, Accordion, Textarea, and Toast UI primitives"
```

**Acceptance criteria:**
- All four primitives render and interact correctly (verified manually, then the verification scaffolding fully reverted).
- `Toaster` is mounted exactly once, in `app/(dashboard)/layout.tsx`, and does not break any existing page's layout.
- `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` all pass.
- No file outside the 5 listed files is modified in the final commit.

---

### Task 3: `/pengaturan` page

**Files:**
- Create: `app/(dashboard)/pengaturan/page.tsx`

**Interfaces:**
- Consumes: `Switch` (`@/components/ui/switch`), `toastManager` (`@/components/ui/toast`), `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent`, `Card`/`CardContent`/`CardHeader`, `Button` (all pre-existing), `PageHeader` (`@/components/shared/page-header`).
- Produces: the `/pengaturan` route. Nothing else depends on this page.

**Depends on:** Task 2 (uses `Switch` and `toastManager`).

- [ ] **Step 1: Create `app/(dashboard)/pengaturan/page.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toastManager } from '@/components/ui/toast';

const DECORATIVE_TABS = [
  { value: 'akun', label: 'Akun & Keamanan' },
  { value: 'notifikasi', label: 'Notifikasi' },
  { value: 'integrasi', label: 'Integrasi' },
  { value: 'backup', label: 'Data & Backup' },
  { value: 'preferensi', label: 'Preferensi' },
] as const;

function showComingSoonToast() {
  toastManager.add({
    title: 'Fitur belum tersedia',
    description: 'Fitur ini memerlukan sistem akun & backend, tersedia di versi mendatang.',
  });
}

export default function PengaturanPage() {
  const [notifikasiCuaca, setNotifikasiCuaca] = useState(true);
  const [notifikasiKapal, setNotifikasiKapal] = useState(true);
  const [sinkronisasiOtomatis, setSinkronisasiOtomatis] = useState(false);
  const [tampilanKompak, setTampilanKompak] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Pengaturan' }]}
        title="Pengaturan"
        description="Kelola preferensi dan konfigurasi sistem"
      />
      <Tabs defaultValue="umum">
        <TabsList>
          <TabsTrigger value="umum">Pengaturan Umum</TabsTrigger>
          {DECORATIVE_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="umum" className="pt-4">
          <Card>
            <CardHeader className="text-sm font-semibold">Preferensi Notifikasi & Tampilan</CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Notifikasi Peringatan Cuaca</p>
                  <p className="text-xs text-muted-foreground">Terima notifikasi saat ada peringatan cuaca ekstrem</p>
                </div>
                <Switch checked={notifikasiCuaca} onCheckedChange={setNotifikasiCuaca} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Notifikasi Kapal Melaut</p>
                  <p className="text-xs text-muted-foreground">Terima notifikasi saat status kapal berubah menjadi melaut</p>
                </div>
                <Switch checked={notifikasiKapal} onCheckedChange={setNotifikasiKapal} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Sinkronisasi Data Otomatis</p>
                  <p className="text-xs text-muted-foreground">Perbarui data secara otomatis setiap beberapa menit</p>
                </div>
                <Switch checked={sinkronisasiOtomatis} onCheckedChange={setSinkronisasiOtomatis} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Mode Tampilan Kompak</p>
                  <p className="text-xs text-muted-foreground">Kurangi jarak antar elemen pada tabel dan daftar</p>
                </div>
                <Switch checked={tampilanKompak} onCheckedChange={setTampilanKompak} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {DECORATIVE_TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="pt-4">
            <Card>
              <CardHeader className="text-sm font-semibold">{tab.label}</CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Pengaturan {tab.label.toLowerCase()} akan tersedia setelah sistem akun & backend diimplementasikan.
                </p>
                <Button variant="outline" onClick={showComingSoonToast}>
                  Simpan Perubahan
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 2: Manual verification against the dev server**

Run `export PATH="/c/Program Files/nodejs:$PATH" && npm run dev`, then:
1. Click "Pengaturan" in the sidebar — confirm it navigates to `/pengaturan`.
2. On "Pengaturan Umum", toggle each of the 4 switches; confirm each visually flips state independently and stays flipped when switching to another tab and back (local `useState`, not reset by tab navigation within the same page load).
3. Switch to each of the 5 decorative tabs; confirm each shows its own label and a "Simpan Perubahan" button.
4. Click "Simpan Perubahan" on any decorative tab; confirm a toast appears with the exact text "Fitur ini memerlukan sistem akun & backend, tersedia di versi mendatang." and auto-dismisses after a few seconds.
5. Refresh the page; confirm all 4 switches reset to their initial defaults (proving state is not persisted, per spec).

Paste real, literal terminal/browser output.

- [ ] **Step 3: Full verification suite**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
npx tsc --noEmit
npm run lint
npm test
npm run build
```

Expected: all four clean; build emits `/pengaturan` as a route.

- [ ] **Step 4: Commit**

```bash
git add "app/(dashboard)/pengaturan/page.tsx"
git commit -m "Add Pengaturan page with feature toggles and decorative tabs"
```

**Acceptance criteria:**
- `/pengaturan` is reachable from the sidebar.
- "Pengaturan Umum" has 4 working, independent toggles using local state (reset on refresh).
- All 5 other tabs are decorative and show the exact toast text from the spec when their button is clicked.
- `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` all pass.

---

### Task 4: `/bantuan` page

**Files:**
- Create: `app/(dashboard)/bantuan/page.tsx`

**Interfaces:**
- Consumes: `useData()` (provides `tiketBantuan`, `addTiketBantuan` from Task 1); `Accordion`/`AccordionItem`/`AccordionTrigger`/`AccordionContent`, `Textarea`, `toastManager` (from Task 2); `PageHeader`, `DataTable`/`DataTableColumn`, `StatusBadge` (pre-existing); `Card`/`CardContent`/`CardHeader`, `Input`, `Select`/`SelectTrigger`/`SelectContent`/`SelectItem`/`SelectValue`, `Button` (pre-existing); `generateLocalId` (`@/lib/id`, pre-existing); `formatDate` (`@/lib/format`, pre-existing); `TiketKategori`, `TiketBantuan` types (`@/lib/types`).
- Produces: the `/bantuan` route. Nothing else depends on this page.

**Depends on:** Task 1 AND Task 2. Must run after both are committed.

- [ ] **Step 1: Create `app/(dashboard)/bantuan/page.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { useData } from '@/context/data-context';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toastManager } from '@/components/ui/toast';
import type { TiketBantuan, TiketKategori, TiketStatus } from '@/lib/types';
import { generateLocalId } from '@/lib/id';
import { formatDate } from '@/lib/format';

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

const KATEGORI_OPTIONS: TiketKategori[] = ['Teknis', 'Akun', 'Data', 'Lainnya'];

const STATUS_TONE: Record<TiketStatus, 'warning' | 'info' | 'success'> = {
  Terbuka: 'warning',
  Diproses: 'info',
  Selesai: 'success',
};

export default function BantuanPage() {
  const { tiketBantuan, addTiketBantuan } = useData();
  const [judul, setJudul] = useState('');
  const [kategori, setKategori] = useState<TiketKategori>('Teknis');
  const [deskripsi, setDeskripsi] = useState('');
  const [error, setError] = useState('');

  const tiketUrut = [...tiketBantuan].sort((a, b) => b.dibuatPada.localeCompare(a.dibuatPada));

  const columns: DataTableColumn<TiketBantuan>[] = [
    { header: 'Judul', cell: (t) => t.judul },
    { header: 'Kategori', cell: (t) => t.kategori },
    { header: 'Status', cell: (t) => <StatusBadge label={t.status} tone={STATUS_TONE[t.status]} /> },
    { header: 'Tanggal Dibuat', cell: (t) => formatDate(t.dibuatPada) },
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!judul.trim() || !deskripsi.trim()) {
      setError('Judul dan deskripsi tiket wajib diisi.');
      return;
    }
    addTiketBantuan({
      id: generateLocalId('TIK'),
      judul: judul.trim(),
      kategori,
      deskripsi: deskripsi.trim(),
      status: 'Terbuka',
      dibuatPada: new Date().toISOString(),
    });
    setJudul('');
    setKategori('Teknis');
    setDeskripsi('');
    setError('');
    toastManager.add({ title: 'Tiket berhasil diajukan', description: 'Tim dukungan akan segera meninjau tiket Anda.' });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Bantuan' }]}
        title="Bantuan"
        description="Pusat bantuan, pertanyaan umum, dan pengajuan tiket dukungan"
      />

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
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm text-muted-foreground">Judul</label>
              <Input value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="Ringkasan singkat masalah Anda" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground">Kategori</label>
              <Select
                items={KATEGORI_OPTIONS.map((k) => ({ value: k, label: k }))}
                value={kategori}
                onValueChange={(v) => setKategori((v ?? 'Teknis') as TiketKategori)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KATEGORI_OPTIONS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {k}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm text-muted-foreground">Deskripsi</label>
              <Textarea
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                placeholder="Jelaskan masalah Anda secara detail"
              />
            </div>
            {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
            <div className="sm:col-span-2">
              <Button type="submit">Ajukan Tiket</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Note on the `Select items={...}` prop above:** Plan 6's final review found that `@base-ui/react/select`'s `SelectValue` only resolves a human-readable label in the trigger when given an `items` list — omitting it renders the raw value string instead (this exact bug shipped once already, on `/notifikasi`, and was fixed post-review). Confirmed during planning: `components/ui/select.tsx`'s `Select` export is `SelectPrimitive.Root` directly (`const Select = SelectPrimitive.Root`, no prop stripping), so `items` goes on `<Select items={...}>` — exactly as written above, not on `<SelectTrigger>`. `KATEGORI_OPTIONS` here is a flat `string[]`, so `items` is built as `KATEGORI_OPTIONS.map((k) => ({ value: k, label: k }))` (label equals value for this field, but the prop is still required for the trigger to show anything at all).

- [ ] **Step 2: Manual verification against the dev server**

Run `export PATH="/c/Program Files/nodejs:$PATH" && npm run dev`, then:
1. Click "Bantuan" in the sidebar — confirm it navigates to `/bantuan`.
2. Click each FAQ question; confirm it expands to show its answer and collapses when clicked again.
3. Confirm the ticket table shows exactly 6 seeded tickets (cross-check against `lib/mock-data/tiket-bantuan.ts`), sorted newest-`dibuatPada`-first, each with a correctly-toned status badge (Terbuka=warning, Diproses=info, Selesai=success).
4. Submit the new-ticket form with a real judul/kategori/deskripsi; confirm a 7th row appears at the top of the ticket table immediately (no reload), a success toast appears, and the form clears.
5. Submit the form with empty fields; confirm the inline validation error appears and no ticket is added.
6. Confirm the Kategori `Select`'s collapsed trigger shows a real category name (e.g. "Teknis"), not a blank or malformed value — this is the same class of defect Plan 6's final review caught and fixed on `/notifikasi`; do not let it recur here.

Paste real, literal terminal/browser output.

- [ ] **Step 3: Full verification suite**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
npx tsc --noEmit
npm run lint
npm test
npm run build
```

Expected: all four clean; build emits `/bantuan` as a route. **This task completes every route in the design spec's routing table — after this task's build succeeds, cross-check the full route list against the spec's Section 3 table and confirm every single row now has a corresponding emitted route.**

- [ ] **Step 4: Commit**

```bash
git add "app/(dashboard)/bantuan/page.tsx"
git commit -m "Add Bantuan page with FAQ accordion, ticket list, and new-ticket form"
```

**Acceptance criteria:**
- `/bantuan` is reachable from the sidebar.
- FAQ accordion expands/collapses correctly for all 6 items.
- Ticket table shows all seeded tickets plus any newly-submitted ones, correctly sorted and status-toned.
- New-ticket form validates required fields, adds a ticket via `addTiketBantuan`, shows a success toast, and clears itself.
- The Kategori `Select`'s trigger shows a real label, not a blank/raw value.
- `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` all pass.

---

## Routes created/changed

| Route | Change |
|---|---|
| `/pengaturan` | **New** — config tabs, feature toggles, decorative-tab toasts (Task 3) |
| `/bantuan` | **New** — FAQ accordion, ticket list, new-ticket form (Task 4) |

No route is deleted. No nav change is needed (both were already linked since Plan 1). **After this plan merges, every route in the design spec's Section 3 table exists.**

## Dependency analysis

- **Task 1** (`lib/types.ts`, `scripts/seed-mock-data.ts`, `lib/mock-data/tiket-bantuan.ts`, `context/data-context.tsx`): no dependency on Task 2. Touches only its own files.
- **Task 2** (4 new `components/ui/*.tsx` files + `app/(dashboard)/layout.tsx`): no dependency on Task 1. Touches only its own files.
- **Task 3** (`/pengaturan`): depends only on Task 2 (`Switch`, `toastManager`). Does not need Task 1.
- **Task 4** (`/bantuan`): depends on **both** Task 1 (`tiketBantuan`, `addTiketBantuan`, `TiketBantuan`/`TiketKategori`/`TiketStatus`) and Task 2 (`Accordion`, `Textarea`, `toastManager`).

**Parallelization:** Task 1 and Task 2 are code-independent — disjoint file sets, neither consumes the other's output — technically safe to run in parallel. Task 3 could also run in parallel with Task 1 (it only needs Task 2). `superpowers:subagent-driven-development` unconditionally forbids dispatching multiple implementer subagents in parallel regardless of independence (the same rule applied in every prior plan this project), so execution proceeds sequentially: **Task 1 → Task 2 → Task 3 → Task 4** (chosen order; Task 3 could equally run before Task 1 since it has no dependency on it, but sequential execution makes the exact order among independent tasks a matter of preference, not correctness — Task 4 must always run last since it is the only task depending on both predecessors).

If execution ever moves to a tool/skill that does permit parallel implementers, {Task 1, Task 2} is the pair to run concurrently first, then Task 3 could join once Task 2 lands, with Task 4 always last.

## Risks / blockers

- **Seed-script insertion point (Task 1) is the highest risk in this plan** — see the dedicated Global Constraints entry and Step 5's explicit `git status` diff-check. Getting this wrong silently corrupts five already-shipped, already-reviewed pages' data with no compile-time signal.
- **Four new UI primitives in one plan (Task 2) is more novel surface area than any prior plan in this project.** Each is verified against actual `@base-ui/react` type definitions and internal state-attribute mappings during planning (not guessed), but the task reviewer should independently re-verify the two trickiest attribute names (`data-checked` for Switch, `data-panel-open` for Accordion) against the same source files rather than trusting the plan's citation alone.
- **The `Select` trigger-label gotcha (Task 4) is a known, recently-discovered defect class** — Plan 6's final review caught this exact bug (`items` prop omitted → raw value shown instead of label) on `/notifikasi`. Task 4's code block already has `items={...}` correctly placed on `<Select>` (confirmed during planning against `components/ui/select.tsx`, where `Select` is `SelectPrimitive.Root` directly) — the task reviewer should still spot-check the rendered trigger text, not just the presence of the prop, since this is exactly the kind of defect that looks fine in a dropdown-open screenshot and only shows up in the collapsed state.
- **Toast auto-dismiss timing is not deterministic across manual test runs** (default 5000ms per `ToastProvider`'s default) — verification steps should confirm the toast *appears*, not race to confirm the exact dismiss timing.
- **No blocker identified that would prevent starting Task 1 or Task 2 immediately** — both are fully self-contained given the current state of `master`.

## Test / verification requirements

- No new `lib/` unit tests are needed — this plan adds no new non-trivial pure-logic module (the ticket data model is a plain type + seed data + context wiring, consistent with how `Koperasi`/`PasarIndustri`/`JadwalSandar`/`BiosecurityCheck` were introduced without dedicated test files in earlier plans).
- Task 1's Step 5 `git status --short lib/mock-data/` check is the one verification step in this plan that substitutes for a unit test — it is the only way to catch a seed-script regression, since nothing else would flag five files' silently-changed values.
- Manual dev-server verification for all four tasks, with literal pasted evidence per the standing verification-integrity rule (a prior incident on this project involved fabricated/truncated IDs, and a separate incident involved an implementer report making an unverified claim that didn't survive independent re-checking).
- `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` must all pass at the end of every task.
- Task 4's build step doubles as the plan's (and the whole project's) completion check: every route in the spec's routing table should now be emitted.
