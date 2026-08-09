# Visual Fidelity Audit — Digital Fisherman ID Dashboard vs. Design Reference

**Date:** 2026-08-09
**Scope:** Visual/layout fidelity only (layout, spacing, typography, color, cards, tables, charts, sidebar, header, icons, alignment, responsive, component consistency). Functional/feature gaps are covered separately (see `docs/audits/` history / prior gap-remediation plan) and are **not** repeated here.
**Method:** All 18 slides of `Presentation web desainnya.pptx` were exported to PNG via PowerPoint COM automation and viewed directly. All 19 implemented routes were screenshotted at 1440px width against the live app (`npm run dev`) using Playwright + system Chrome, with viewport height auto-expanded to each page's actual content height to avoid missing below-the-fold content. Every finding below was visually confirmed against both the mockup slide and the corresponding live screenshot — nothing here is inferred from code alone.
**Out of scope for this document:** anything already flagged and fixed in the two prior audits (functional P0/P1 gap-remediation) and anything explicitly marked "out of scope" by the original design spec (decorative photorealistic imagery replaced with a lighter UI, no real map in the mockup vs. our real Leaflet map, no file upload, no auth/user-management screens). These are noted at the end for completeness but are **not** counted as gaps.

---

## How to read this

Findings are grouped two ways:
1. **Cross-cutting / component-level** — a single shared component or pattern used across most/all routes. Fixing one of these fixes every page that uses it, so these are the highest-leverage findings regardless of nominal priority.
2. **Per-route** — findings specific to one page's content/layout that aren't explained by a cross-cutting issue.

Only differences are listed. Anything visually matching the reference is omitted per the request; a short "already matching" list is included at the end for context, not as filler.

---

## Cross-Cutting / Component-Level Findings

### P0 — Broken or clipped content

**1. Table content is cut off on `/hasil-tangkap` — the Status column is clipped off the right edge of the viewport at 1440px width.**
The "Data Hasil Tangkapan Terbaru" table's `Jenis Ikan` column renders every caught species for a trip as one comma-joined string (e.g. "Ikan Layang, Ikan Tongkol, Ikan Kembung, Ikan Cakalang"). On rows with 3-4 species this pushes the table wider than its container, and the last column header renders as literally "St" with the status badge invisible — not scrolled-to, genuinely clipped with no visible scrollbar affordance at this viewport width. This is the only outright broken rendering found in the audit; every other finding is a stylistic gap, not a defect. Confirmed via full-height screenshot at 1440px — the column reappears once the browser is manually widened, confirming it's an overflow issue, not a missing column.

### P1 — Systemic stylistic mismatch (same pattern, many pages)

**2. Header has no logo/emblem icon.** Every mockup slide shows a coat-of-arms/agency shield icon to the left of "DIGITAL FISHERMAN ID". The live header is text-only. This is the single most visible branding element missing and it's present on literally every screen in the reference.

**3. KPI card icons are muted/flat; the reference uses vivid solid-color icon badges.** Every `KpiCard` in the app renders its icon inside a low-opacity tinted square (e.g. `bg-primary/10`-style treatment). In the mockup, every KPI icon sits in a solid, saturated, rounded-square badge (deep blue/green/purple/orange) that reads as a distinct color block, not a tint. This affects all ~90 KPI card instances across every module.

**4. KPI cards outside `/dashboard` never show a delta/trend indicator.** The mockup shows a "↑ X.X%" (or ↓, in red) next to *every* KPI value on *every* page — list pages, form pages, tracking, settings, help. In the live app, only `/dashboard`'s 4 cards show deltas; every other page's KPI cards (Nelayan, Kapal, Koperasi, Pasar/Industri, Hasil Tangkap, Laporan, Peta Tracking) show a static number with a plain caption underneath and no trend arrow at all. This is the largest single source of "looks flatter than the reference" across the whole app.

**5. `DataTable` pagination style doesn't match anywhere it's used.** Every mockup table shows numbered page buttons ("1 2 3 … 31") plus a "Menampilkan 1-8 dari 245" count. The shared `DataTable` component renders "Halaman X dari Y (Z data)" with plain "Sebelumnya"/"Berikutnya" text buttons — no numbered pages, no chevron icons. Since this is one shared component, this single gap accounts for the pagination style on every list page in the app (Nelayan, Kapal, Koperasi, Pasar/Industri, Peta Tracking's vessel list, Jadwal Sandar, Notifikasi if paginated).

**6. Entity tables never show a circular avatar/logo icon per row.** The mockup consistently prefixes each row's name (koperasi, pasar/industri, vessel) with a small circular icon or photo thumbnail. None of our tables (Koperasi, Pasar/Industri, Kapal, Nelayan) do this — names are plain text links with no leading visual anchor.

**7. Multi-step forms use plain text labels instead of a numbered stepper.** `/hasil-tangkap/input` and `/hasil-tangkap/biosecurity` show their 3 steps as `1. Data Kapal & Trip   2. Detail Ikan   3. Review & Simpan` — plain text, the active one colored, no circles, no connecting line, no checkmarks for completed steps. Every mockup form screen uses a proper stepper: numbered circles connected by a line, with the current step highlighted and completed steps checked off. This is a single reusable pattern that would fix both forms at once.

**8. Trend charts are plain lines; the reference consistently uses gradient-filled area charts.** `TrendLineChart` (used on `/dashboard`, `/hasil-tangkap`, `/laporan`) renders a bare line with point markers and no fill. Every equivalent chart in the mockup (Dashboard's "Grafik Hasil Tangkapan", Hasil Tangkap's summary chart, all three Laporan trend charts) uses a soft gradient fill under the line, which is what gives the reference its "richer" visual weight even though the underlying chart type and data shape are otherwise very close.

**9. "Tambah X" action buttons have no leading "+" icon.** Every add-button in the mockup ("+ Tambah Kapal", "+ Tambah Koperasi", "+ Tambah Pasar / Industri") shows a plus icon before the label. The live buttons ("Tambah Nelayan", "Tambah Kapal") are plain text with no icon.

**10. Several pages leave large unstyled empty space below their content at normal viewport height.** `/pengaturan` (any tab), `/hasil-tangkap/input`, `/hasil-tangkap/biosecurity`, and `/kapal/jadwal-sandar` all render a compact card near the top of the page and then 400-600px of plain dark background below it before the viewport ends. The mockup never has this — every screen is filled edge-to-edge with sidebar widgets (tips, history, account info, quick stats) that our implementation omits. This isn't about adding decorative filler; it's that the current layouts read as visibly incomplete/unbalanced compared to the reference's consistently dense composition.

**11. Vessel status is not visually encoded on the map.** `/peta-tracking`'s KPI row breaks vessels down by status (Melaut/Sandar/Tidak Aktif), but every marker on the map itself is an identical cyan dot. The mockup uses distinctly colored markers (green/blue/red/yellow) matching each status, so at a glance you can see the fleet's state distribution on the map itself, not just in the KPI row above it.

### P2 — Minor/cosmetic, low impact

**12. Breadcrumb separator is a chevron (`>`) where the mockup uses a slash (`/`).** Cosmetic-only, present on every page.

**13. Sidebar nav items have no trailing chevron arrow.** The mockup shows a small `>` on the right edge of every nav item (active and inactive). Ours has none. Very minor given the active item is already color-highlighted.

**14. Photo placeholders render as a plain gray box with the literal word "Foto"** (`/nelayan/[id]`) rather than a generic person-silhouette icon. Since `fotoUrl` is always empty in the seed data, this placeholder is what every nelayan detail page actually shows, so it's more visible in practice than its "just a fallback" framing suggests — worth a quick pass even though it's cosmetic.

**15. No "System Status: Online" indicator or bottom decorative illustration in the sidebar.** Present on every mockup slide's sidebar footer; the reasoning for the decorative control-room photo being cut aligns with the design spec's own decision to drop photorealistic decoration, but the small "System Status: Online" text+dot indicator is not decorative — it's a legitimate, cheap-to-add status affordance the reference includes and ours doesn't.

**16. Info-card "stat" rows (e.g. `/nelayan/[id]`'s "Ringkasan Aktivitas Kapal") render as plain label/value pairs instead of the mockup's individually-bordered icon-boxed mini-cards.** Same underlying data, flatter presentation.

---

## Per-Route Findings (beyond the cross-cutting list above)

### Dashboard
- Notification panel ("Notifikasi & Peringatan") renders every item as an identically-styled bordered box with a generic gear/info icon; only the one `peringatan`-type item gets a distinct (red) treatment. The mockup gives every notification a color-coded left accent/icon matching its type (red for warnings, blue for info) and caps the list at 2 with a "Lihat Semua Notifikasi" link — ours lists all 5 in the DataContext with no cap and no "see all" link to `/notifikasi`.
- Weather widget otherwise matches the reference well (icon+temp+condition, then icon-labeled rows for wind/wave/current) — flagged here only to note it's one of the closer matches, not a gap.

### Nelayan (list)
- KPI row is present (4 cards: Total, Aktif, Terverifikasi, Tergabung Koperasi) but per finding #4 above, none show a delta.
- No "NO." row-number column (mockup includes one on every list table).

### Nelayan (detail)
- No status/verification badges (Aktif, Terverifikasi) rendered near the name at all, despite the data being available and prominently badged in the mockup right next to the name/ID.
- "Kapal yang Digunakan" card is missing the vessel's `Mesin`, `Status` badge, and `Dokumen` badges (SIUP/SLO/Pas Kecil) that the mockup shows — only ID, Jenis, GT, and Pelabuhan Induk are rendered.
- The catch-history trend chart for a nelayan with only one recorded trip renders as an almost-empty grid with a single point — not a bug, but visually reads as broken next to the mockup's always-populated 6-month chart. Worth being aware of for any future "empty/sparse state" pass, low priority since it's a data-availability artifact of this specific example record, not a layout defect.

### Kapal (list)
- Confirmed same KPI/table/pagination gaps as the cross-cutting list; no route-specific gaps beyond those.

### Peta Tracking
- No "Peta"/"Satelit" toggle above the map (mockup has both view modes as tabs).
- No status/type/wilayah filter dropdowns above the map.
- No "Detail Kapal Terpilih" panel when a vessel is selected (name, badge, specs, and 3 action buttons in the mockup).
- No "Aktivitas Terbaru" timeline panel.
- Vessel list on the right is a plain 3-column table (Nama, Jenis, Status); the mockup uses a card list with a vessel thumbnail, distance-from-location, and current knot speed per row.

### Hasil Tangkap (list)
- No date picker or "Export Laporan" button in the page header area (present in the mockup for this specific page, in addition to `/laporan`'s own export).
- No "Top 5 Kapal Berdasarkan Hasil" ranked list widget.

### Hasil Tangkap (input / biosecurity forms)
- Beyond the stepper (#7): no inline "Ringkasan Hasil Tangkapan" running-total mini-cards while filling the form (mockup shows Total Berat/Estimasi Nilai/Jumlah Jenis/Jumlah ABK updating live as you type); no right-hand "Tips" checklist panel.
- Biosecurity checklist: the mockup shows 8 checklist items; the app's `BIOSECURITY_CHECKLIST_ITEMS` has 7. Visually this means the form is one row shorter than the reference's 2-column, 4-row grid (ours renders an uneven final row). Flagging here as a layout/grid-completeness observation; whether to add the 8th criterion is a content/data decision, not covered by this visual-only audit.

### Kapal / Jadwal Sandar
- Missing the "Ketersediaan Dermaga" gantt-style timeline (colored horizontal bars per dermaga across a 24-hour axis) — the single most distinctive visual element of this page in the mockup. The current implementation is a plain form + list table with no timeline visualization at all.
- "Prioritas" column in the schedule table is plain text; no color coding despite 3 distinct priority levels (Rendah/Normal/Tinggi) that would benefit from the same badge treatment used elsewhere in the app (`StatusBadge` already exists and could show this distinction, though that crosses into implementation — noting only the visual gap here).

### Koperasi / Pasar-Industri (list)
- Only 4 KPI cards where the mockup shows 5 (missing "Nilai Transaksi" as its own KPI card — the value exists in the table but isn't surfaced as a headline number).
- Search is a single live-filter box; the mockup uses a 3-field filter panel (Nama, Lokasi, Status) with explicit "Cari"/"Reset" buttons. Functionally simpler, visually much sparser than the reference's filter row.
- No "Aksi" column (view/analytics icon buttons) — navigation relies on the name being a link, which is a reasonable simplification but means the table has one fewer visual column than every equivalent mockup table.
- No right-hand sidebar (trend chart, "Sebaran" map, "Top 5 by Volume" ranked list) — present on both Koperasi and Pasar/Industri mockup slides.

### Laporan & Analitik
- Tab set is organized by data entity (Hasil Tangkap / Koperasi / Pasar-Industri) where the mockup organizes by report category (Ringkasan / Operasional / Keuangan / Kepatuhan / Kinerja / Khusus) — a different information architecture, not just a styling gap. This is the single largest structural deviation from the mockup found in this audit.
- No date-range picker (mockup: "01 Mei 2025 - 10 Mei 2025" selector next to Export).
- No "Laporan Populer" / "Laporan Terbaru" sidebar lists, no multi-report browsing table (mockup's "Detail Laporan" table with Nama/Kategori/Periode/Dibuat Oleh/Ukuran/Status/Aksi) — the live page only shows the single active tab's own summary+chart+table, not a report archive.
- No horizontal bar charts (mockup uses them for "Top 5 Jenis Ikan"/"Top 5 Wilayah"; our equivalent data is presented as a plain table instead).

### Notifikasi
- No KPI row at all (mockup: 4 category-count cards — Peringatan/Informasi/Sukses/Sistem — each with a count and %).
- Rendered as a plain vertical card list rather than the mockup's data table (Waktu/Jenis/Judul/Deskripsi/Status/Aksi columns) with pagination.
- No "Tandai Semua Dibaca" bulk action (mockup has this as a header button).
- All 20 notifications render in one unpaginated scroll; mockup paginates at 10/page.

### Pengaturan
- No KPI row (mockup: 6 cards — Pengguna Aktif, Role Pengguna, Notifikasi Sistem, Integrasi Aktif, Backup Terakhir, Status Server).
- "Pengaturan Umum" tab shows only 4 toggles with labels that don't correspond to any toggle in the mockup (mockup's "Pengaturan Fitur" section has 6 differently-labeled toggles: Tracking Kapal Real-time, Pencatatan Hasil Tangkapan, Notifikasi Otomatis, Laporan Otomatis, Integrasi Sistem Eksternal, Mode Pemeliharaan). No "Konfigurasi Aplikasi" section (Nama Aplikasi/Tema/Bahasa/Zona Waktu/Format dropdowns), no "Manajemen Pengguna" section, no right sidebar (Informasi Akun, Keamanan Akun, Aktivitas Pengaturan). Given no-auth/no-backend is an explicit v1 boundary per the design spec, several of these (user management, account info, server status) may be intentionally out of scope functionally — flagging the visual gap for completeness, not asserting they should be built.
- Preferensi tab (just added in a recent plan) is otherwise the closest tab to matching mockup intent (a real Bahasa selector) but sits inside the same underfilled-page layout as every other tab (#10 above).

### Bantuan
- No KPI row (mockup: 6 cards — Pusat Bantuan 24/7, FAQ Tersedia, Artikel Panduan, Video Tutorial, Tiket Saya, Status Layanan).
- No hero search bar ("Cari bantuan, panduan, atau topik...") or "Kategori Bantuan" category-card row (5 colored cards: Akun & Akses, Data & Informasi, Fitur & Layanan, Teknis & Error, Kebijakan & Regulasi).
- No "Hubungi Kami" (Live Chat/Email/Telepon/WhatsApp) or "Panduan Cepat" sidebar.
- Ticket list is a table with plain-text status; mockup uses colored status pills (Dalam Proses blue / Menunggu Respon orange / Selesai green) — our `StatusBadge` component already supports this pattern and is simply not applied here.
- FAQ accordion and the overall three-section structure (FAQ → tickets → new-ticket form) otherwise track the mockup's intent reasonably well.

### Pencarian
- Results render as a data table (Kategori/Nama/ID columns); the mockup shows 4 colored action-shortcut cards (Input Hasil Tangkapan, Jadwal Sandar, Status Lolos Biosecurity, Riwayat Tangkapan) as "search results" instead of actual matched records. This is a fundamentally different interpretation of what a search-results page shows, not a styling difference — noting it as a structural finding rather than assigning it a priority tier, since the current table-of-real-matches approach may be the more correct product behavior even though it doesn't visually match the mockup.

---

## Explicitly Not Flagged (already matching, or deliberate out-of-scope deviations)

- Overall page skeleton — dark navy sidebar + header + content area — matches the reference on every route.
- `/peta-tracking` and `/dashboard` use a real Leaflet map instead of the mockup's decorative 3D harbor illustration. This is a deliberate, spec-documented functional upgrade (the design spec explicitly chose a working map over decorative art), not a fidelity gap.
- Tab labels on `/hasil-tangkap` (Ringkasan/Per Jenis Ikan/Per Kapal/Per Wilayah) and `/pengaturan` (Pengaturan Umum/Akun & Keamanan/Notifikasi/Integrasi/Data & Backup/Preferensi) match the mockup's category names exactly.
- FAQ accordion pattern on `/bantuan` matches the mockup's expand/collapse chevron style.
- Weather widget structure on `/dashboard` matches closely (see Dashboard section above).
- Absence of decorative photorealistic imagery (harbor photos, phone mockups, control-room illustration, satellite graphics) throughout the app is a deliberate, spec-documented scope reduction, not an oversight — the design spec explicitly replaced these with a lighter functional UI.
- No file-upload UI (Bantuan/Biosecurity "Dokumentasi" sections in the mockup) — no backend exists to store files in this v1, consistent with the project's explicit no-backend scope.

---

## Summary Counts

| Priority | Count | Nature |
|---|---|---|
| P0 | 1 | Genuine rendering defect (clipped table column) |
| P1 | 10 | Systemic component/pattern gaps affecting most or all routes |
| P2 | 5 | Cosmetic/minor, low visual impact |
| Per-route (non-cross-cutting) | ~25 | Page-specific content/widget gaps, mostly on Laporan, Notifikasi, Pengaturan, Bantuan, and Peta Tracking |

The highest-leverage fixes are the 10 P1 cross-cutting items — each lives in one shared component (`KpiCard`, `DataTable`, the header, a stepper pattern, chart components) and would visibly improve every page that uses it, rather than requiring page-by-page work. The P0 table-overflow issue is the only item that should be treated as a bug rather than a design gap.
