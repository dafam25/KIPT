# Gap Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the 6 P0/P1 gaps identified in the post-completion gap analysis: (1) the pre-existing `Select` "raw value in trigger" bug in the 3 forms that pick a vessel by ID, (2) missing `htmlFor`/`id` label-control associations across every form in the app, (3) a missing KPI row on `/nelayan`, (4) a missing Add-Nelayan dialog, (5) a missing Add-Kapal dialog, and (6) `/pengaturan`'s Preferensi tab not actually showing a language-switch control despite the spec naming it. The remaining items from the gap analysis (CSV BOM/anchor robustness, donut chart palette, `peringkatVolume`'s not-found contract, `/laporan` duplication, `/pengaturan`'s tab overflow, `Textarea`'s `aria-invalid` styling, unseeded `Terbuka` ticket) are explicitly P2 and out of scope for this plan.

**Architecture:** Four tasks, fully file-disjoint. Task 1 fixes the `Select` bug and adds label associations across 4 existing form pages — pure bug-fix/accessibility work, no new components. Task 2 adds 3 new `lib/stats.ts` functions plus a KPI row and an Add-Nelayan dialog to `/nelayan`. Task 3 adds an Add-Kapal dialog to `/kapal`. Task 4 gives `/pengaturan`'s Preferensi tab a real language-switch `Select` in place of its generic decorative placeholder, while preserving the exact same decorative (toast-only) save behavior as every other non-Umum tab. Tasks 2 and 3 are the first real consumers of `components/ui/dialog.tsx`, which has existed since Plan 1 but was never used — no new UI primitive is created, only a first real usage of an existing one.

**Tech Stack:** Next.js 16 (App Router) + TypeScript + Tailwind CSS v4, shadcn/ui on `@base-ui/react` (all components used already exist: `Dialog`, `Select`, `Switch`, `Input`, `Button`, `KpiCard`), React Context (`DataContext` — `addNelayan`/`addKapal` mutators already exist and are wired, just never called from any UI until this plan), Vitest for the 3 new `lib/stats.ts` functions.

## Global Constraints

- **No new shared UI components.** `Dialog`, `Select`, `Switch`, `Input`, `Button`, `KpiCard` all already exist and are reused exactly as-is. This plan's two dialogs are the first real *usage* of `components/ui/dialog.tsx`, not a new component.
- **`Select`'s `items` prop is required whenever `value` and the displayed label differ** (confirmed root cause of the pre-existing bug, already fixed twice in prior plans on `/notifikasi` and `/bantuan`): `items={list.map((x) => ({ value: x.id, label: x.nama }))}` goes on the `Select` root. Selects where `value` already equals the displayed label (e.g. `DERMAGA_OPTIONS`, `PRIORITAS_OPTIONS`, `KONDISI_OPTIONS`, biosecurity checklist options, `KATEGORI_OPTIONS`) do **not** have this bug and do not need the `items` prop — only add `items` where `value` is an ID/enum distinct from its label.
- **`onCheckedChange`/`onOpenChange` vs. `onValueChange`:** `Switch.onCheckedChange` and `Dialog.onOpenChange` both have the signature `(value: boolean, eventDetails) => void` — `value` is always a definite boolean, never `null`. When updating a *standalone* boolean state, pass the setter directly (`onOpenChange={setOpen}`). When updating one field of an object state (as both new dialogs' forms do), a wrapping arrow function is required to spread into the object — that is not the anti-pattern, it's necessary: `onCheckedChange={(v) => setForm((f) => ({ ...f, slo: v }))}`. `Select`/`Tabs`' `onValueChange` still passes `T | null` and still needs `(v) => setX(v ?? fallback)`.
- **`Nelayan.fotoUrl` is always `''` in every seeded record** (confirmed: `grep fotoUrl lib/mock-data/nelayan.ts` shows only empty strings) — new nelayan added via the dialog use `fotoUrl: ''` too, matching the existing dataset exactly. No placeholder-image logic is needed or should be added.
- **New IDs reuse existing helpers**: `nextNelayanId(existingIds, date?)` and `nextKapalId(existingIds, date?)` already exist in `lib/id.ts` and are already used by the seed script — call them the same way (`nextNelayanId(nelayan.map((n) => n.id))`), don't reinvent ID generation.
- **New `Kapal.posisi` defaults to a fixed coordinate** (`{ lat: -6.2, lng: 106.8 }`, within Jakarta's coastal waters and within the seed data's lat/lng bounds) since there is no coordinate-picker UI in this project and adding one is out of scope — a newly-registered vessel simply starts at a fixed default position, consistent with `status: 'sandar'` (not yet tracked as melaut).
- **New `Kapal.dokumen.siup` is hardcoded `true`** — every single seeded `Kapal` record has `siup: true` with no exceptions (confirmed by reading the seed script), so this is effectively a constant in this data model, not a real per-vessel toggle. `slo`/`pasKecil` are exposed as `Switch` toggles in the Add-Kapal dialog since seed data varies both.
- **`/pengaturan`'s Preferensi tab remains decorative** — spec §4 explicitly lists "Preferensi/language switch" among the tabs that "render their mockup layout but actions show a ... toast instead of doing anything." This plan makes the tab *show* a real language `Select` (closing the visual gap) but the "Simpan Perubahan" button still only shows the toast — selecting a language does not translate anything. Do not wire this to any i18n mechanism; none exists in this project and adding one is far out of scope.
- Node.js/npm are not on this shell's default PATH — prepend before any npm/npx command: `export PATH="/c/Program Files/nodejs:$PATH"`.
- `npx tsc --noEmit` can fail with a `LayoutProps` error on a fresh checkout before `next build`/`next dev` has run once — a known, harmless, environment-only quirk. Run `next build` if this error appears bare.
- Do not touch any route not named in this plan's tasks, and do not touch `lib/csv.ts`, `lib/search.ts`, `lib/id.ts`, or any `components/ui/*.tsx` file — every fix in this plan is achieved by consuming existing primitives/helpers from application code, not modifying them.

---

### Task 1: Fix the `Select` trigger bug and add accessibility label associations in existing forms

**Files:**
- Modify: `app/(dashboard)/kapal/jadwal-sandar/page.tsx`
- Modify: `app/(dashboard)/hasil-tangkap/input/page.tsx`
- Modify: `app/(dashboard)/hasil-tangkap/biosecurity/page.tsx`
- Modify: `app/(dashboard)/bantuan/page.tsx`

**Interfaces:**
- Consumes: nothing new — only adds `items` props and `id`/`htmlFor` attributes to already-imported `Select`/`SelectTrigger`/`Input`/`Textarea` usages.
- Produces: nothing new. Purely a bug fix + accessibility enhancement with no interface changes.

- [ ] **Step 1: `app/(dashboard)/kapal/jadwal-sandar/page.tsx` — fix the "Pilih Kapal" `Select` and add label associations to all 6 fields**

Replace:

```tsx
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground">Pilih Kapal</label>
              <Select value={kapalId} onValueChange={(v) => setKapalId(v ?? '')}>
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
              <Select value={dermaga} onValueChange={(v) => setDermaga(v ?? DERMAGA_OPTIONS[0])}>
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
              <Select value={prioritas} onValueChange={(v) => setPrioritas((v ?? 'Normal') as JadwalSandar['prioritas'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITAS_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
```

with:

```tsx
            <div className="space-y-1.5">
              <label htmlFor="jadwal-kapal" className="text-sm text-muted-foreground">Pilih Kapal</label>
              <Select
                items={kapal.map((k) => ({ value: k.id, label: k.nama }))}
                value={kapalId}
                onValueChange={(v) => setKapalId(v ?? '')}
              >
                <SelectTrigger id="jadwal-kapal"><SelectValue placeholder="Pilih kapal" /></SelectTrigger>
                <SelectContent>
                  {kapal.map((k) => (
                    <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="jadwal-tanggal" className="text-sm text-muted-foreground">Tanggal Sandar</label>
              <Input id="jadwal-tanggal" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="jadwal-waktu-tiba" className="text-sm text-muted-foreground">Waktu Tiba (ETA)</label>
              <Input id="jadwal-waktu-tiba" type="time" value={waktuTiba} onChange={(e) => setWaktuTiba(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="jadwal-durasi" className="text-sm text-muted-foreground">Durasi Sandar (Jam)</label>
              <Input id="jadwal-durasi" type="number" min={1} max={24} value={durasiJam} onChange={(e) => setDurasiJam(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="jadwal-dermaga" className="text-sm text-muted-foreground">Pilih Dermaga</label>
              <Select value={dermaga} onValueChange={(v) => setDermaga(v ?? DERMAGA_OPTIONS[0])}>
                <SelectTrigger id="jadwal-dermaga"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DERMAGA_OPTIONS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="jadwal-prioritas" className="text-sm text-muted-foreground">Prioritas Sandar</label>
              <Select value={prioritas} onValueChange={(v) => setPrioritas((v ?? 'Normal') as JadwalSandar['prioritas'])}>
                <SelectTrigger id="jadwal-prioritas"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITAS_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
```

Note: `dermaga` and `prioritas` do NOT get an `items` prop — their `value` already equals the displayed label (`DERMAGA_OPTIONS`/`PRIORITAS_OPTIONS` are plain string arrays used directly as both value and label), so they never had the raw-value bug. Only `kapal` (a real entity picker, `value={k.id}` displaying `{k.nama}`) needed the fix.

- [ ] **Step 2: `app/(dashboard)/hasil-tangkap/input/page.tsx` — fix "Pilih Kapal" and add label associations to Step 1's 5 fields**

Replace (inside the `step === 1` block):

```tsx
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
```

with:

```tsx
              <div className="space-y-1.5">
                <label htmlFor="input-kapal" className="text-sm text-muted-foreground">Pilih Kapal</label>
                <Select
                  items={kapal.map((k) => ({ value: k.id, label: k.nama }))}
                  value={kapalId}
                  onValueChange={(v) => setKapalId(v ?? '')}
                >
                  <SelectTrigger id="input-kapal" className="w-full"><SelectValue placeholder="Pilih kapal" /></SelectTrigger>
                  <SelectContent>
                    {kapal.map((k) => (
                      <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="input-tanggal" className="text-sm text-muted-foreground">Tanggal Tangkap</label>
                <Input id="input-tanggal" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="input-waktu-mulai" className="text-sm text-muted-foreground">Waktu Mulai</label>
                <Input id="input-waktu-mulai" type="time" value={waktuMulai} onChange={(e) => setWaktuMulai(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="input-waktu-selesai" className="text-sm text-muted-foreground">Waktu Selesai</label>
                <Input id="input-waktu-selesai" type="time" value={waktuSelesai} onChange={(e) => setWaktuSelesai(e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label htmlFor="input-lokasi" className="text-sm text-muted-foreground">Lokasi Penangkapan</label>
                <Input id="input-lokasi" value={lokasi} onChange={(e) => setLokasi(e.target.value)} placeholder="Contoh: Perairan Utara Jawa" />
              </div>
```

Do not touch Step 2's per-row `Select`/`Input` cells (jenis ikan, berat, jumlah, kondisi) — they live inside a `<table>` with `<th>` column headers instead of `<label>` elements, so there is no missing label-association there; adding one would require restructuring the table, which is out of scope.

- [ ] **Step 3: `app/(dashboard)/hasil-tangkap/biosecurity/page.tsx` — fix "Pilih Kapal" and add label associations to Step 1's 4 fields plus Step 2's dynamic checklist labels**

Replace (inside the `step === 1` block):

```tsx
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
```

with:

```tsx
              <div className="space-y-1.5">
                <label htmlFor="bio-kapal" className="text-sm text-muted-foreground">Pilih Kapal</label>
                <Select
                  items={kapal.map((k) => ({ value: k.id, label: k.nama }))}
                  value={kapalId}
                  onValueChange={(v) => setKapalId(v ?? '')}
                >
                  <SelectTrigger id="bio-kapal" className="w-full"><SelectValue placeholder="Pilih kapal" /></SelectTrigger>
                  <SelectContent>
                    {kapal.map((k) => (
                      <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="bio-tanggal" className="text-sm text-muted-foreground">Tanggal Pemeriksaan</label>
                <Input id="bio-tanggal" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="bio-petugas" className="text-sm text-muted-foreground">Petugas Pemeriksa</label>
                <Input id="bio-petugas" value={petugas} onChange={(e) => setPetugas(e.target.value)} placeholder="Nama petugas" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="bio-metode" className="text-sm text-muted-foreground">Metode Pemeriksaan</label>
                <Select value={metode} onValueChange={(v) => setMetode(v ?? metode)}>
                  <SelectTrigger id="bio-metode" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {METODE_OPTIONS.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
```

Then replace the Step 2 dynamic checklist block:

```tsx
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
```

with:

```tsx
                {BIOSECURITY_CHECKLIST_ITEMS.map((item) => (
                  <div key={item.key} className="space-y-1.5">
                    <label htmlFor={`bio-check-${item.key}`} className="text-sm text-muted-foreground">{item.label}</label>
                    <Select
                      value={values[item.key] ?? ''}
                      onValueChange={(v) => setValues((prev) => ({ ...prev, [item.key]: v ?? '' }))}
                    >
                      <SelectTrigger id={`bio-check-${item.key}`} className="w-full"><SelectValue placeholder="Pilih hasil" /></SelectTrigger>
                      <SelectContent>
                        {item.options.map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
```

`item.key` is already unique per checklist item (it's used as the React `key` on the same element), so `bio-check-${item.key}` produces unique DOM ids across the 8 rendered rows.

- [ ] **Step 4: `app/(dashboard)/bantuan/page.tsx` — add label associations to all 3 fields (no `Select` bug here — `Kategori`'s `Select` already has the correct `items` prop from Plan 7)**

Replace:

```tsx
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
```

with:

```tsx
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="tiket-judul" className="text-sm text-muted-foreground">Judul</label>
              <Input id="tiket-judul" value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="Ringkasan singkat masalah Anda" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="tiket-kategori" className="text-sm text-muted-foreground">Kategori</label>
              <Select
                items={KATEGORI_OPTIONS.map((k) => ({ value: k, label: k }))}
                value={kategori}
                onValueChange={(v) => setKategori((v ?? 'Teknis') as TiketKategori)}
              >
                <SelectTrigger id="tiket-kategori">
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
              <label htmlFor="tiket-deskripsi" className="text-sm text-muted-foreground">Deskripsi</label>
              <Textarea
                id="tiket-deskripsi"
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                placeholder="Jelaskan masalah Anda secara detail"
              />
            </div>
```

- [ ] **Step 5: Manual verification against the dev server**

Run `export PATH="/c/Program Files/nodejs:$PATH" && npm run dev`, then:
1. On `/kapal/jadwal-sandar`, `/hasil-tangkap/input`, and `/hasil-tangkap/biosecurity`: select a real vessel from "Pilih Kapal" and confirm the collapsed trigger shows the vessel's **name**, not its ID.
2. On all 4 pages: click each `<label>` text and confirm focus moves to (or the control activates for) its paired control — this is the direct behavioral proof that `htmlFor`/`id` pairing works, not just that the attributes exist in the markup.
3. Confirm no visual regression on any of the 4 pages (labels/controls look identical to before — this change is attribute-only, no className changes).

Paste real, literal terminal/browser output.

- [ ] **Step 6: Full verification suite**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
npx tsc --noEmit
npm run lint
npm test
npm run build
```

Expected: all four clean; route list unchanged (no new routes, all 4 touched files are pre-existing pages).

- [ ] **Step 7: Commit**

```bash
git add "app/(dashboard)/kapal/jadwal-sandar/page.tsx" "app/(dashboard)/hasil-tangkap/input/page.tsx" "app/(dashboard)/hasil-tangkap/biosecurity/page.tsx" "app/(dashboard)/bantuan/page.tsx"
git commit -m "Fix Select trigger bug and add label-control associations in existing forms"
```

**Acceptance criteria:**
- All 3 "Pilih Kapal" `Select` triggers show the vessel name after selection, not the raw ID.
- All 19 `<label>` elements across the 4 files have a matching `id` on their paired control via `htmlFor`.
- No visual or functional regression on any of the 4 pages.
- `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` all pass.

---

### Task 2: `/nelayan` KPI row + Add-Nelayan dialog

**Files:**
- Modify: `lib/stats.ts`
- Modify: `lib/stats.test.ts`
- Modify: `app/(dashboard)/nelayan/page.tsx`

**Interfaces:**
- Consumes: `Dialog`/`DialogTrigger`/`DialogContent`/`DialogHeader`/`DialogTitle`/`DialogDescription`/`DialogFooter` (`@/components/ui/dialog`, pre-existing, first real usage); `Select`/`SelectTrigger`/`SelectContent`/`SelectItem`/`SelectValue` (pre-existing); `KpiCard` (pre-existing); `nextNelayanId` (`@/lib/id`, pre-existing); `addNelayan` (`useData()`, pre-existing mutator, first UI caller).
- Produces (added to `lib/stats.ts`): `nelayanAktifCount(list: Nelayan[]): number`, `nelayanTerverifikasiCount(list: Nelayan[]): number`, `nelayanTergabungKoperasiCount(list: Nelayan[]): number`.

- [ ] **Step 1: Write the failing tests**

Append to `lib/stats.test.ts` (add the 3 new function names to the existing `import { ... } from './stats';` block — `Nelayan` is already imported in this file's type-import line):

```ts
describe('nelayanAktifCount', () => {
  it('counts only aktif status', () => {
    const list: Nelayan[] = [
      { id: 'N1', status: 'aktif' } as Nelayan,
      { id: 'N2', status: 'nonaktif' } as Nelayan,
      { id: 'N3', status: 'aktif' } as Nelayan,
    ];
    expect(nelayanAktifCount(list)).toBe(2);
  });
});

describe('nelayanTerverifikasiCount', () => {
  it('counts only terverifikasi true', () => {
    const list: Nelayan[] = [
      { id: 'N1', terverifikasi: true } as Nelayan,
      { id: 'N2', terverifikasi: false } as Nelayan,
    ];
    expect(nelayanTerverifikasiCount(list)).toBe(1);
  });
});

describe('nelayanTergabungKoperasiCount', () => {
  it('counts only non-null koperasiId', () => {
    const list: Nelayan[] = [
      { id: 'N1', koperasiId: 'KOP-1' } as Nelayan,
      { id: 'N2', koperasiId: null } as Nelayan,
    ];
    expect(nelayanTergabungKoperasiCount(list)).toBe(1);
  });

  it('returns 0 for an empty list', () => {
    expect(nelayanTergabungKoperasiCount([])).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `export PATH="/c/Program Files/nodejs:$PATH" && npx vitest run lib/stats.test.ts`
Expected: FAIL — the 3 new functions are not exported from `lib/stats.ts` yet.

- [ ] **Step 3: Implement the 3 new functions in `lib/stats.ts`**

Append at the end of `lib/stats.ts` (no import changes needed — `Nelayan` is already imported):

```ts
export function nelayanAktifCount(list: Nelayan[]): number {
  return list.filter((n) => n.status === 'aktif').length;
}

export function nelayanTerverifikasiCount(list: Nelayan[]): number {
  return list.filter((n) => n.terverifikasi).length;
}

export function nelayanTergabungKoperasiCount(list: Nelayan[]): number {
  return list.filter((n) => n.koperasiId !== null).length;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `export PATH="/c/Program Files/nodejs:$PATH" && npx vitest run lib/stats.test.ts`
Expected: PASS — all tests green, including the pre-existing ones (unchanged).

- [ ] **Step 5: Rewrite `app/(dashboard)/nelayan/page.tsx`**

Replace the entire file with:

```tsx
'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Users, CheckCircle2, ShieldCheck, UsersRound } from 'lucide-react';
import { useData } from '@/context/data-context';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import type { Nelayan } from '@/lib/types';
import { formatDate, formatNumber } from '@/lib/format';
import { totalNelayan, nelayanAktifCount, nelayanTerverifikasiCount, nelayanTergabungKoperasiCount } from '@/lib/stats';
import { nextNelayanId } from '@/lib/id';

const NONE_VALUE = 'none';

function emptyForm() {
  return {
    nama: '', nik: '', tempatLahir: '', tanggalLahir: '', alamat: '', noHp: '', pendamping: '',
    koperasiId: NONE_VALUE, kapalId: NONE_VALUE,
  };
}

export default function NelayanListPage() {
  const { nelayan, koperasi, kapal, addNelayan } = useData();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.nama.trim() || !form.nik.trim() || !form.tempatLahir.trim() || !form.tanggalLahir || !form.alamat.trim() || !form.noHp.trim() || !form.pendamping.trim()) {
      setError('Lengkapi semua data nelayan terlebih dahulu.');
      return;
    }
    addNelayan({
      id: nextNelayanId(nelayan.map((n) => n.id)),
      nama: form.nama.trim(),
      nik: form.nik.trim(),
      tempatLahir: form.tempatLahir.trim(),
      tanggalLahir: form.tanggalLahir,
      alamat: form.alamat.trim(),
      noHp: form.noHp.trim(),
      fotoUrl: '',
      status: 'aktif',
      terverifikasi: false,
      tanggalBergabung: new Date().toISOString().slice(0, 10),
      koperasiId: form.koperasiId === NONE_VALUE ? null : form.koperasiId,
      kapalId: form.kapalId === NONE_VALUE ? null : form.kapalId,
      pendamping: form.pendamping.trim(),
    });
    setForm(emptyForm());
    setError('');
    setOpen(false);
  }

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
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button />}>Tambah Nelayan</DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Tambah Nelayan</DialogTitle>
                <DialogDescription>Daftarkan nelayan baru ke sistem Digital Fisherman ID.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="nelayan-nama" className="text-sm text-muted-foreground">Nama</label>
                  <Input id="nelayan-nama" value={form.nama} onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="nelayan-nik" className="text-sm text-muted-foreground">NIK</label>
                  <Input id="nelayan-nik" value={form.nik} onChange={(e) => setForm((f) => ({ ...f, nik: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="nelayan-no-hp" className="text-sm text-muted-foreground">No HP</label>
                  <Input id="nelayan-no-hp" value={form.noHp} onChange={(e) => setForm((f) => ({ ...f, noHp: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="nelayan-tempat-lahir" className="text-sm text-muted-foreground">Tempat Lahir</label>
                  <Input id="nelayan-tempat-lahir" value={form.tempatLahir} onChange={(e) => setForm((f) => ({ ...f, tempatLahir: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="nelayan-tanggal-lahir" className="text-sm text-muted-foreground">Tanggal Lahir</label>
                  <Input id="nelayan-tanggal-lahir" type="date" value={form.tanggalLahir} onChange={(e) => setForm((f) => ({ ...f, tanggalLahir: e.target.value }))} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="nelayan-alamat" className="text-sm text-muted-foreground">Alamat</label>
                  <Input id="nelayan-alamat" value={form.alamat} onChange={(e) => setForm((f) => ({ ...f, alamat: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="nelayan-pendamping" className="text-sm text-muted-foreground">Pendamping</label>
                  <Input id="nelayan-pendamping" value={form.pendamping} onChange={(e) => setForm((f) => ({ ...f, pendamping: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="nelayan-koperasi" className="text-sm text-muted-foreground">Koperasi</label>
                  <Select
                    items={[{ value: NONE_VALUE, label: 'Tanpa Koperasi' }, ...koperasi.map((k) => ({ value: k.id, label: k.nama }))]}
                    value={form.koperasiId}
                    onValueChange={(v) => setForm((f) => ({ ...f, koperasiId: v ?? NONE_VALUE }))}
                  >
                    <SelectTrigger id="nelayan-koperasi"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>Tanpa Koperasi</SelectItem>
                      {koperasi.map((k) => (
                        <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="nelayan-kapal" className="text-sm text-muted-foreground">Kapal</label>
                  <Select
                    items={[{ value: NONE_VALUE, label: 'Tanpa Kapal' }, ...kapal.map((k) => ({ value: k.id, label: k.nama }))]}
                    value={form.kapalId}
                    onValueChange={(v) => setForm((f) => ({ ...f, kapalId: v ?? NONE_VALUE }))}
                  >
                    <SelectTrigger id="nelayan-kapal"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>Tanpa Kapal</SelectItem>
                      {kapal.map((k) => (
                        <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
                <DialogFooter className="sm:col-span-2">
                  <Button type="submit">Simpan</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Users} label="Total Nelayan" value={formatNumber(totalNelayan(nelayan))} accent="blue" />
        <KpiCard icon={CheckCircle2} label="Nelayan Aktif" value={formatNumber(nelayanAktifCount(nelayan))} accent="green" />
        <KpiCard icon={ShieldCheck} label="Terverifikasi" value={formatNumber(nelayanTerverifikasiCount(nelayan))} accent="cyan" />
        <KpiCard icon={UsersRound} label="Tergabung Koperasi" value={formatNumber(nelayanTergabungKoperasiCount(nelayan))} accent="purple" />
      </div>
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

This preserves every existing column/search/filter behavior of the page unchanged — only the `PageHeader`'s `actions`, a new KPI row, and the dialog are added.

- [ ] **Step 6: Manual verification against the dev server**

Run `export PATH="/c/Program Files/nodejs:$PATH" && npm run dev`, then:
1. Confirm `/nelayan` now shows 4 KPI cards (Total Nelayan, Nelayan Aktif, Terverifikasi, Tergabung Koperasi) with plausible non-zero values, and cross-check at least one value against a direct count from `lib/mock-data/nelayan.ts`.
2. Click "Tambah Nelayan"; confirm the dialog opens.
3. Submit with empty fields; confirm the inline validation error appears and the dialog stays open.
4. Fill in all required fields (leave Koperasi/Kapal as "Tanpa Koperasi"/"Tanpa Kapal"), submit; confirm the dialog closes, a new row appears in the table with the entered name, and the "Total Nelayan"/KPI values increment by 1.
5. Repeat, this time picking a real koperasi and a real kapal from the dropdowns; confirm the new row's Koperasi/Kapal columns show the correct names, and confirm both Select triggers showed real names (not raw IDs) both while choosing and after the dialog reopens fresh.
6. Confirm the existing search box, column links, and status badges on `/nelayan` still work exactly as before (regression check on unchanged functionality).

Paste real, literal terminal/browser output.

- [ ] **Step 7: Full verification suite**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
npx tsc --noEmit
npm run lint
npm test
npm run build
```

Expected: all four clean; route list unchanged (`/nelayan` already existed).

- [ ] **Step 8: Commit**

```bash
git add lib/stats.ts lib/stats.test.ts "app/(dashboard)/nelayan/page.tsx"
git commit -m "Add Nelayan KPI row and Add-Nelayan dialog"
```

**Acceptance criteria:**
- `/nelayan` shows a 4-card KPI row matching every other module's list page.
- "Tambah Nelayan" opens a dialog, validates required fields, and adds a new nelayan via `addNelayan` that immediately appears in the table and KPI counts.
- Koperasi/Kapal `Select`s in the dialog show real names in their triggers, not raw IDs.
- No regression to existing `/nelayan` functionality (search, links, status badges).
- `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` all pass.

---

### Task 3: Add-Kapal dialog

**Files:**
- Modify: `app/(dashboard)/kapal/page.tsx`

**Interfaces:**
- Consumes: `Dialog`/`DialogTrigger`/`DialogContent`/`DialogHeader`/`DialogTitle`/`DialogDescription`/`DialogFooter`, `Select`/`SelectTrigger`/`SelectContent`/`SelectItem`/`SelectValue`, `Switch` (all pre-existing); `nextKapalId` (`@/lib/id`, pre-existing); `addKapal` (`useData()`, pre-existing mutator, first UI caller).
- Produces: nothing new — no other task depends on this one.

- [ ] **Step 1: Rewrite `app/(dashboard)/kapal/page.tsx`**

Replace the entire file with:

```tsx
'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Ship, Anchor, PauseCircle, AlertTriangle } from 'lucide-react';
import { useData } from '@/context/data-context';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import type { Kapal } from '@/lib/types';
import { totalKapal, kapalMelautCount, kapalSandarCount, kapalTidakAktifCount } from '@/lib/stats';
import { formatNumber } from '@/lib/format';
import { KAPAL_STATUS_LABEL, KAPAL_STATUS_TONE } from '@/lib/kapal-status';
import { nextKapalId } from '@/lib/id';

const JENIS_KAPAL_OPTIONS: Kapal['jenis'][] = ['Purse Seine', 'Longline', 'Gillnet', 'Kapal Motor', 'Kapal Tanpa Motor'];
const NONE_NAHKODA = 'none';

function emptyForm() {
  return {
    nama: '', jenis: JENIS_KAPAL_OPTIONS[0] as Kapal['jenis'], gt: '', mesinPk: '', kecepatanKnot: '',
    pelabuhanInduk: '', nahkodaId: NONE_NAHKODA, slo: false, pasKecil: false,
  };
}

export default function KapalListPage() {
  const { kapal, nelayan, addKapal } = useData();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.nama.trim() || !form.pelabuhanInduk.trim() || !form.gt || !form.mesinPk || !form.kecepatanKnot) {
      setError('Lengkapi semua data kapal terlebih dahulu.');
      return;
    }
    addKapal({
      id: nextKapalId(kapal.map((k) => k.id)),
      nama: form.nama.trim(),
      jenis: form.jenis,
      gt: Number(form.gt) || 0,
      mesinPk: Number(form.mesinPk) || 0,
      kecepatanKnot: Number(form.kecepatanKnot) || 0,
      pelabuhanInduk: form.pelabuhanInduk.trim(),
      status: 'sandar',
      posisi: { lat: -6.2, lng: 106.8 },
      dokumen: { siup: true, slo: form.slo, pasKecil: form.pasKecil },
      nahkodaId: form.nahkodaId === NONE_NAHKODA ? null : form.nahkodaId,
    });
    setForm(emptyForm());
    setError('');
    setOpen(false);
  }

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
    { header: 'Status', cell: (k) => <StatusBadge label={KAPAL_STATUS_LABEL[k.status]} tone={KAPAL_STATUS_TONE[k.status]} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Kapal' }]}
        title="Kapal"
        description="Kelola data kapal terdaftar"
        actions={
          <>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger render={<Button />}>Tambah Kapal</DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Tambah Kapal</DialogTitle>
                  <DialogDescription>Daftarkan kapal baru ke sistem Digital Fisherman ID.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label htmlFor="kapal-nama" className="text-sm text-muted-foreground">Nama Kapal</label>
                    <Input id="kapal-nama" value={form.nama} onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="kapal-jenis" className="text-sm text-muted-foreground">Jenis Kapal</label>
                    <Select
                      items={JENIS_KAPAL_OPTIONS.map((j) => ({ value: j, label: j }))}
                      value={form.jenis}
                      onValueChange={(v) => setForm((f) => ({ ...f, jenis: (v ?? f.jenis) as Kapal['jenis'] }))}
                    >
                      <SelectTrigger id="kapal-jenis"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {JENIS_KAPAL_OPTIONS.map((j) => (
                          <SelectItem key={j} value={j}>{j}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="kapal-pelabuhan" className="text-sm text-muted-foreground">Pelabuhan Induk</label>
                    <Input id="kapal-pelabuhan" value={form.pelabuhanInduk} onChange={(e) => setForm((f) => ({ ...f, pelabuhanInduk: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="kapal-gt" className="text-sm text-muted-foreground">GT</label>
                    <Input id="kapal-gt" type="number" min={0} value={form.gt} onChange={(e) => setForm((f) => ({ ...f, gt: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="kapal-mesin" className="text-sm text-muted-foreground">Mesin (PK)</label>
                    <Input id="kapal-mesin" type="number" min={0} value={form.mesinPk} onChange={(e) => setForm((f) => ({ ...f, mesinPk: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="kapal-kecepatan" className="text-sm text-muted-foreground">Kecepatan (Knot)</label>
                    <Input id="kapal-kecepatan" type="number" min={0} value={form.kecepatanKnot} onChange={(e) => setForm((f) => ({ ...f, kecepatanKnot: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label htmlFor="kapal-nahkoda" className="text-sm text-muted-foreground">Nahkoda</label>
                    <Select
                      items={[{ value: NONE_NAHKODA, label: 'Tanpa Nahkoda' }, ...nelayan.map((n) => ({ value: n.id, label: n.nama }))]}
                      value={form.nahkodaId}
                      onValueChange={(v) => setForm((f) => ({ ...f, nahkodaId: v ?? NONE_NAHKODA }))}
                    >
                      <SelectTrigger id="kapal-nahkoda"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_NAHKODA}>Tanpa Nahkoda</SelectItem>
                        {nelayan.map((n) => (
                          <SelectItem key={n.id} value={n.id}>{n.nama}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between sm:col-span-2">
                    <label htmlFor="kapal-slo" className="text-sm text-muted-foreground">SLO Tersedia</label>
                    <Switch id="kapal-slo" checked={form.slo} onCheckedChange={(v) => setForm((f) => ({ ...f, slo: v }))} />
                  </div>
                  <div className="flex items-center justify-between sm:col-span-2">
                    <label htmlFor="kapal-pas-kecil" className="text-sm text-muted-foreground">Pas Kecil Tersedia</label>
                    <Switch id="kapal-pas-kecil" checked={form.pasKecil} onCheckedChange={(v) => setForm((f) => ({ ...f, pasKecil: v }))} />
                  </div>
                  {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
                  <DialogFooter className="sm:col-span-2">
                    <Button type="submit">Simpan</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Button variant="outline" render={<Link href="/kapal/jadwal-sandar" />}>
              Jadwal Sandar
            </Button>
          </>
        }
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

This preserves the existing "Jadwal Sandar" link button unchanged (now a sibling of the new dialog inside a fragment) and every existing column/KPI/search behavior.

- [ ] **Step 2: Manual verification against the dev server**

Run `export PATH="/c/Program Files/nodejs:$PATH" && npm run dev`, then:
1. Confirm the existing "Jadwal Sandar" button still navigates to `/kapal/jadwal-sandar` (regression check — it's now a sibling of the new dialog).
2. Click "Tambah Kapal"; confirm the dialog opens with all fields, including the two `Switch` toggles.
3. Submit with empty required fields; confirm validation blocks it.
4. Fill in Nama, Jenis, Pelabuhan Induk, GT, Mesin, Kecepatan (leave Nahkoda as "Tanpa Nahkoda", leave both switches off), submit; confirm the dialog closes, a new row appears with status "Sandar", and the "Total Kapal"/"Sandar" KPI values increment by 1.
5. Repeat, this time picking a real nelayan as Nahkoda and toggling both switches on; confirm the new row's Nahkoda column shows the correct name and the Nahkoda `Select` trigger showed a real name (not a raw ID) throughout.
6. Confirm the existing search box, column links, and status badges on `/kapal` still work exactly as before.

Paste real, literal terminal/browser output.

- [ ] **Step 3: Full verification suite**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
npx tsc --noEmit
npm run lint
npm test
npm run build
```

Expected: all four clean; route list unchanged.

- [ ] **Step 4: Commit**

```bash
git add "app/(dashboard)/kapal/page.tsx"
git commit -m "Add Add-Kapal dialog"
```

**Acceptance criteria:**
- "Tambah Kapal" opens a dialog, validates required fields, and adds a new kapal via `addKapal` that immediately appears in the table and KPI counts with status "Sandar".
- Nahkoda `Select` in the dialog shows real names in its trigger, not raw IDs.
- Existing "Jadwal Sandar" button still works.
- No regression to existing `/kapal` functionality.
- `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` all pass.

---

### Task 4: `/pengaturan` Preferensi tab — real language-switch UI

**Files:**
- Modify: `app/(dashboard)/pengaturan/page.tsx`

**Interfaces:**
- Consumes: `Select`/`SelectTrigger`/`SelectContent`/`SelectItem`/`SelectValue` (pre-existing, new import for this file — `pengaturan/page.tsx` currently imports `Switch` but not `Select`).
- Produces: nothing new.

- [ ] **Step 1: Add the `Select` import**

Change:

```tsx
import { Switch } from '@/components/ui/switch';
```

to:

```tsx
import { Switch } from '@/components/ui/switch';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
```

- [ ] **Step 2: Pull "Preferensi" out of `DECORATIVE_TABS`**

Replace:

```tsx
const DECORATIVE_TABS = [
  { value: 'akun', label: 'Akun & Keamanan' },
  { value: 'notifikasi', label: 'Notifikasi' },
  { value: 'integrasi', label: 'Integrasi' },
  { value: 'backup', label: 'Data & Backup' },
  { value: 'preferensi', label: 'Preferensi' },
] as const;
```

with:

```tsx
const DECORATIVE_TABS = [
  { value: 'akun', label: 'Akun & Keamanan' },
  { value: 'notifikasi', label: 'Notifikasi' },
  { value: 'integrasi', label: 'Integrasi' },
  { value: 'backup', label: 'Data & Backup' },
] as const;

const BAHASA_OPTIONS = [
  { value: 'id', label: 'Bahasa Indonesia' },
  { value: 'en', label: 'English' },
];
```

`DECORATIVE_TABS` now drives only the 4 truly-generic decorative tabs; "Preferensi" gets its own explicit trigger and content block below since it needs a language `Select` instead of the generic placeholder paragraph.

- [ ] **Step 3: Add local state for the language selection**

Change:

```tsx
export default function PengaturanPage() {
  const [notifikasiCuaca, setNotifikasiCuaca] = useState(true);
  const [notifikasiKapal, setNotifikasiKapal] = useState(true);
  const [sinkronisasiOtomatis, setSinkronisasiOtomatis] = useState(false);
  const [tampilanKompak, setTampilanKompak] = useState(false);
```

to:

```tsx
export default function PengaturanPage() {
  const [notifikasiCuaca, setNotifikasiCuaca] = useState(true);
  const [notifikasiKapal, setNotifikasiKapal] = useState(true);
  const [sinkronisasiOtomatis, setSinkronisasiOtomatis] = useState(false);
  const [tampilanKompak, setTampilanKompak] = useState(false);
  const [bahasa, setBahasa] = useState('id');
```

- [ ] **Step 4: Add the "Preferensi" tab trigger and its dedicated content**

Replace:

```tsx
        <TabsList>
          <TabsTrigger value="umum">Pengaturan Umum</TabsTrigger>
          {DECORATIVE_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
```

with:

```tsx
        <TabsList>
          <TabsTrigger value="umum">Pengaturan Umum</TabsTrigger>
          {DECORATIVE_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
          <TabsTrigger value="preferensi">Preferensi</TabsTrigger>
        </TabsList>
```

Then, immediately after the `{DECORATIVE_TABS.map((tab) => ( ... ))}` block that renders the generic `TabsContent`s and before the closing `</Tabs>`, add a dedicated `TabsContent` for Preferensi:

```tsx
        <TabsContent value="preferensi" className="pt-4">
          <Card>
            <CardHeader className="text-sm font-semibold">Preferensi</CardHeader>
            <CardContent className="space-y-4">
              <div className="max-w-xs space-y-1.5">
                <label htmlFor="pengaturan-bahasa" className="text-sm text-muted-foreground">Bahasa</label>
                <Select items={BAHASA_OPTIONS} value={bahasa} onValueChange={(v) => setBahasa(v ?? 'id')}>
                  <SelectTrigger id="pengaturan-bahasa"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BAHASA_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" onClick={showComingSoonToast}>
                Simpan Perubahan
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
```

Selecting a language only updates local `bahasa` state — it does not translate anything. Clicking "Simpan Perubahan" shows the exact same `showComingSoonToast()` toast as every other decorative tab, preserving the spec's decorative-only contract for this tab.

- [ ] **Step 5: Manual verification against the dev server**

Run `export PATH="/c/Program Files/nodejs:$PATH" && npm run dev`, then:
1. Navigate to `/pengaturan`, click the "Preferensi" tab; confirm it now shows a "Bahasa" `Select` with "Bahasa Indonesia"/"English" options, instead of the old generic placeholder paragraph.
2. Confirm the `Select`'s collapsed trigger shows "Bahasa Indonesia" by default, and updates to show "English" (a real label, not a raw value like `en`) after selecting it.
3. Click "Simpan Perubahan" on the Preferensi tab; confirm the exact same toast text as the other decorative tabs appears ("Fitur ini memerlukan sistem akun & backend, tersedia di versi mendatang.").
4. Confirm the other 4 decorative tabs (Akun & Keamanan, Notifikasi, Integrasi, Data & Backup) are unchanged.
5. Confirm "Pengaturan Umum"'s 4 toggles are unchanged.

Paste real, literal terminal/browser output.

- [ ] **Step 6: Full verification suite**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
npx tsc --noEmit
npm run lint
npm test
npm run build
```

Expected: all four clean; route list unchanged.

- [ ] **Step 7: Commit**

```bash
git add "app/(dashboard)/pengaturan/page.tsx"
git commit -m "Give Pengaturan's Preferensi tab a real language-switch control"
```

**Acceptance criteria:**
- Preferensi tab shows a working `Select` with a real language label in its trigger at every state (default, after selection).
- Preferensi's "Simpan Perubahan" still shows the exact same decorative toast as the other 4 tabs — no actual language switching occurs.
- The other 4 decorative tabs and "Pengaturan Umum" are unchanged.
- `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` all pass.

---

## Routes created/changed

No route is created or deleted. All 4 tasks modify existing pages in place: `/kapal/jadwal-sandar`, `/hasil-tangkap/input`, `/hasil-tangkap/biosecurity`, `/bantuan`, `/nelayan`, `/kapal`, `/pengaturan`.

## Dependency analysis

- **Task 1** (`kapal/jadwal-sandar/page.tsx`, `hasil-tangkap/input/page.tsx`, `hasil-tangkap/biosecurity/page.tsx`, `bantuan/page.tsx`): no dependency on any other task.
- **Task 2** (`lib/stats.ts`, `lib/stats.test.ts`, `nelayan/page.tsx`): no dependency on any other task.
- **Task 3** (`kapal/page.tsx`): no dependency on any other task.
- **Task 4** (`pengaturan/page.tsx`): no dependency on any other task.

All 4 tasks are **fully file-disjoint** — no two tasks touch the same file. This is a stronger independence guarantee than any prior plan in this project.

**Parallelization:** All 4 tasks are technically safe to run in parallel — disjoint file sets, no shared new interfaces between them (each task only consumes pre-existing, already-merged code). `superpowers:subagent-driven-development` unconditionally forbids dispatching multiple implementer subagents in parallel regardless of independence (the same rule applied in every prior plan this project), so execution proceeds sequentially: **Task 1 → Task 2 → Task 3 → Task 4** (arbitrary order among them — no task depends on another).

If execution ever moves to a tool/skill that does permit parallel implementers, all 4 tasks could run concurrently.

## Risks / blockers

- **Regression risk on `/nelayan` and `/kapal` (Tasks 2, 3):** both tasks fully rewrite an already-shipped, working page rather than patching it incrementally, because the new dialog needs to sit in the `PageHeader`'s `actions` slot alongside (or replacing) existing content. The task reviewer must diff the new file against the pre-existing one line-by-line to confirm every pre-existing column, KPI card, search behavior, and (for `/kapal`) the "Jadwal Sandar" button survived unchanged — this is the single most important check for both tasks.
- **`Select` `items` prop correctness (all 4 tasks use it):** per the standing rule from two prior incidents in this project (`/notifikasi`, `/bantuan`), every new or modified `Select` whose `value` differs from its displayed label must have `items` on the `Select` root, and every task reviewer should spot-check the actual rendered trigger text, not just the presence of the prop.
- **`htmlFor`/`id` collisions:** all chosen ids are prefixed per-page/per-form (`jadwal-*`, `input-*`, `bio-*`, `tiket-*`, `nelayan-*`, `kapal-*`, `pengaturan-*`) specifically to avoid collision with each other and with any future page — the task reviewer for Task 1 should confirm no two ids on the same page are identical (the dynamic `bio-check-${item.key}` ids are the one case worth double-checking for genuine per-item uniqueness).
- **No blocker identified that would prevent starting any task immediately** — all 4 are fully self-contained given the current state of `master`.

## Test / verification requirements

- `lib/stats.test.ts`: unit tests for the 3 new Nelayan aggregate functions (Task 2) — the only new non-trivial `lib/` logic in this plan.
- No new tests needed for Tasks 1, 3, 4 — pure UI/JSX changes, consistent with this project's stated testing policy (manual UI verification).
- Manual dev-server verification for all four tasks, with literal pasted evidence per the standing verification-integrity rule from prior incidents on this project.
- `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` must all pass at the end of every task.
- Tasks 2 and 3 specifically require a side-by-side diff check (old file vs. new file) to confirm zero regression to already-shipped functionality, since both fully rewrite an existing page file rather than patching it.
