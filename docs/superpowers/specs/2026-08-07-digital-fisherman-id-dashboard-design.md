# Digital Fisherman ID Dashboard — Design

## Background

`Presentation web desainnya.pptx` contains 18 slides of AI-mocked-up UI screens for
"Digital Fisherman ID" — a dashboard for a fisheries agency (DKP-style) to track
fishermen, vessels, catch records, cooperatives, and markets/industry. This spec
covers building a working v1 of that dashboard as a real Next.js app.

**Context:** real project intended for a government-agency audience (DKP or
similar). No GPS hardware exists yet on vessels, so v1 uses dummy/simulated
location data. No authentication in v1. Data is mock-only (no database) — CRUD
actions update in-memory/session state and are lost on refresh.

## Modules covered (all, simplified)

Dashboard, Nelayan (fishermen), Kapal (vessels), Hasil Tangkap (catch records),
Koperasi (cooperatives), Pasar/Industri (markets & processing), Peta Tracking
(live vessel map), Laporan & Analitik (reports), Pengaturan (settings), Bantuan
(help center), plus global Notifikasi and Pencarian (search) pages.

## 1. Architecture & Tech Stack

- **Framework:** Next.js 14+ (App Router) + TypeScript
- **Styling:** Tailwind CSS with CSS variables for the dark-navy theme
  (background, accent blue/green/purple/cyan) matching the mockup, applied
  consistently across all components
- **UI primitives:** shadcn/ui (table, tabs, dialog, dropdown-menu, badge,
  sheet for mobile sidebar, breadcrumb)
- **Charts:** Recharts (line chart for trends, donut for composition, bar for
  top-5 rankings)
- **Map:** react-leaflet + CARTO Dark Matter tiles (free, no API key), custom
  markers for vessel positions
- **Visual assets:** the mockup uses large AI-generated photorealistic harbor/
  satellite images as decoration on nearly every page. v1 replaces these with
  lightweight vector illustrations/icons (e.g. undraw-style SVGs or simple
  gradient panels) instead of sourcing/generating a matching photo set —
  cheaper to build, easier to re-brand per agency later, and keeps focus on
  the functional widgets (map, charts, tables) rather than decorative art.
- **Formatting:** a shared `lib/format.ts` wraps `Intl.NumberFormat('id-ID')`
  / `Intl.DateTimeFormat('id-ID')` for currency (Rp), numbers, and dates, used
  everywhere a value is displayed so formatting never drifts between pages.
- **Mock data generation:** `@faker-js/faker` in a seed script, generating
  Indonesian-appropriate names/locations once and persisting the output as a
  static TS/JSON module (not regenerated per render, so data stays stable
  across navigations)
- **State:** React Context for data that changes during a session (form
  submissions, settings toggles, simulated vessel movement). Nothing persists
  server-side in v1 — this is an explicit, agreed scope limit, not an oversight.
- **No auth in v1** — the app lands directly on `/dashboard`.
- **Responsive scope:** desktop-first (this is an internal ops dashboard,
  matching every mockup screen). Sidebar collapses into the shadcn `sheet`
  component below `md` breakpoint so the app is usable on a tablet, but no
  dedicated phone layout is designed for the dense table/chart pages.

## 2. Data Model

```ts
Nelayan       { id, nama, nik, ttl, alamat, noHp, fotoUrl, status, terverifikasi,
                tanggalBergabung, koperasiId, kapalId, pendamping }

Kapal         { id, nama, jenis, gt, mesinPk, kecepatanKnot, pelabuhanInduk,
                status: 'melaut' | 'sandar' | 'tidak_aktif' | 'perbaikan',
                posisi: { lat, lng }, dokumen: { siup, slo, pasKecil }, nahkodaId }

HasilTangkap  { id, kapalId, tanggal, waktuMulai, waktuSelesai, lokasi,
                jenisIkan: { nama, beratKg, jumlahEkor, kondisi }[],
                estimasiNilai, status: 'verified' | 'pending' }

Koperasi      { id, nama, lokasi, ketua, jumlahAnggota, volumeKg,
                nilaiTransaksi, status }

PasarIndustri { id, nama, jenis, lokasi, pengelola, volumeKg,
                nilaiTransaksi, status }

BiosecurityCheck { id, kapalId, petugas, tanggal, checklist (8 items),
                    hasil: 'lolos' | 'tidak_lolos', nomorSertifikat }

JadwalSandar  { id, kapalId, tanggal, dermaga, waktuTiba, durasiJam, prioritas }

Notifikasi    { id, jenis: 'peringatan' | 'informasi' | 'sukses' | 'sistem',
                judul, deskripsi, waktu, dibaca }
```

Relations: `Nelayan.kapalId → Kapal`, `Nelayan.koperasiId → Koperasi`,
`HasilTangkap.kapalId → Kapal`. All summary numbers (total nelayan, total
kapal, etc.) are derived from these arrays via `lib/stats.ts` helpers rather
than hardcoded separately, so the dashboard, reports, and module pages never
disagree with each other.

**ID format convention:** generated IDs follow the mockup's pattern so new
entries added through forms look consistent with seeded data:
`NEL-{YYMM}-{6-digit seq}` (nelayan), `KAP-{YYMM}-{5-digit seq}` (kapal),
`BS-{YYYY-MM-DD}-{seq}` (biosecurity certificate). A small `lib/id.ts` helper
generates the next sequence number from the in-memory dataset.

## 3. Pages & Routing

Shared layout `app/(dashboard)/layout.tsx` provides Sidebar + Header (search,
notifications, profile) for every route below.

| Route | Contents |
|---|---|
| `/` | Redirects to `/dashboard` |
| `/dashboard` | KPI cards, mini map, weather (static mock value), catch trend, composition donut, recent notifications |
| `/nelayan` | Fishermen table with search/filter |
| `/nelayan/[id]` | Profile detail, activity summary, catch chart, related vessel, **Unduh ID Card** button |
| `/kapal` | Vessel table + composition by type/GT/status |
| `/kapal/[id]` | Vessel detail (specs, documents, current position, recent catches) |
| `/kapal/jadwal-sandar` | Dock booking form + timeline |
| `/peta-tracking` | Live map of all vessels + list & movement timeline |
| `/hasil-tangkap` | Summary with tabs (Per Jenis Ikan / Per Kapal / Per Wilayah) + recent table |
| `/hasil-tangkap/input` | Multi-step catch entry form |
| `/hasil-tangkap/biosecurity` | Multi-step biosecurity check form (lolos/tidak lolos outcome) |
| `/koperasi`, `/koperasi/[id]` | Cooperative table + detail |
| `/pasar-industri`, `/pasar-industri/[id]` | Market/industry table + detail |
| `/laporan` | Report category tabs, trend charts, table, working CSV export |
| `/pengaturan` | Config tabs, feature toggles (local state, not persisted) |
| `/bantuan` | FAQ accordion, dummy ticket list, new-ticket form (local state) |
| `/notifikasi` | All notifications with category filter |
| `/pencarian?q=` | Global search results from the header search bar |

Global search matches by name/ID within **Nelayan, Kapal, and Hasil Tangkap
only**, matching the search bar's placeholder text in the mockup — not all six
entities, to keep the matching logic simple.

**Simplification vs. the mockup:** the original deck has the sidebar's "Kapal"
submenu and the top-level "Peta Tracking" item each opening a nearly identical
live-map page (same breadcrumb pattern, same widgets). These are merged into
one `/peta-tracking` page linked from both nav entries, avoiding duplicated
map/data-sync logic for no user-facing difference.

**Shared components:** `KpiCard`, `DataTable` (generic search/filter/pagination),
`StatusBadge`, `DonutChart`, `TrendLineChart`, `PageHeader` (breadcrumb + title
+ actions), `MultiStepForm` shell, `MapView` (react-leaflet wrapper + vessel
markers).

## 4. Interactivity Level per Module (v1)

- **Fully functional (local state, no backend):** catch-entry form, biosecurity
  check form, dock-schedule form, settings toggles, help-ticket creation,
  add-nelayan/add-kapal dialogs — all write to a React Context so tables/dashboard
  update immediately without a reload, but reset on browser refresh.
- **Simulated real-time:** vessel positions on the map jitter slightly every
  few seconds via `setInterval`, to feel "live" without real GPS hardware.
- **Read-only, computed from mock data:** all KPIs, charts, and summary tables
  in Koperasi, Pasar/Industri, and Laporan.
- **Real export:** the "Export Laporan" button generates an actual CSV from
  the currently displayed mock data (client-side `Blob` + download) — a
  genuinely working feature, not just UI.
- **ID Card download:** on `/nelayan/[id]`, "Unduh ID Card" renders that
  fisherman's card (photo, ID, name, koperasi, vessel — same fields as the
  mockup's phone-screen ID card) to a canvas via `html-to-image` and triggers
  a PNG download. This is the closest thing to a "hero feature" of the
  Digital Fisherman ID concept, so it's real, not a stub.
- **Decorative-only in v1:** Pengaturan tabs other than "Pengaturan Umum" and
  feature toggles (Akun & Keamanan, Notifikasi, Integrasi, Data & Backup,
  Preferensi/language switch) render their mockup layout but actions show a
  "Fitur ini memerlukan sistem akun & backend, tersedia di versi mendatang"
  toast instead of doing anything — consistent with no-auth/no-backend being
  an explicit v1 boundary, not something to fake per-tab.

## 5. Error Handling & Testing

- Forms use simple client-side validation (required fields, number/date
  format) with inline error messages — no server validation needed since
  there is no backend yet.
- Detail pages (`/nelayan/[id]`, etc.) handle an unknown ID with a "data not
  found" state and a back button, rather than crashing.
- Tables show an explicit "Belum ada data" empty state (not just a blank
  area) when a filter/search matches nothing or a list starts empty.
- Testing: unit tests for `lib/stats.ts` (aggregate calculations) and the CSV
  export utility, since those are the only non-trivial logic. UI pages are
  verified manually in the browser, consistent with this being a visual
  dashboard deliverable.

## Out of scope for v1 (explicitly deferred)

- Real authentication / role-based access control
- Real GPS/AIS integration for vessel tracking
- A real database / persistence across sessions
- Server-side validation or multi-user concurrency handling
