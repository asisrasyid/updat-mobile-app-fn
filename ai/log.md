# log.md — Changelog E-FinMen

> Semua perubahan pada project harus dicatat di sini. Format: tanggal ISO, tipe, file, deskripsi.
> **Rule**: Append-only. Entry terbaru di bawah.

---

## Format Entry

```
### [YYYY-MM-DD] <tipe>: <judul singkat>
- **File:** path/file.ext
- **Deskripsi:** Apa yang berubah dan kenapa.
- **Impact:** Halaman / fitur yang terpengaruh.
```

**Tipe:** `feat` | `fix` | `refactor` | `style` | `docs` | `infra` | `perf` | `break`

---

## 2026-03-22

### [2026-03-22] docs: Inisialisasi ai/ — knowledge base AI agent
- **File:** `ai/system_snap.md`, `ai/log.md`, `ai/memory.md`, `ai/user.md`
- **Deskripsi:** Membuat folder `ai/` sebagai context base untuk semua AI agent yang mengerjakan project ini. Mendokumentasikan arsitektur sistem, model data, bug list, stack teknologi secara lengkap.
- **Impact:** Dokumentasi — tidak ada perubahan runtime.

### [2026-03-22] docs: Update CLAUDE.md dengan design system & rules
- **File:** `CLAUDE.md`
- **Deskripsi:** Menambahkan design system komprehensif: color tokens (Indigo primary, Emerald accent), typography (Plus Jakarta Sans + Inter), spacing system, shadow scale, border radius, component guidelines. Menambahkan development rules: wajib catat log, update memory, konsistensi desain.
- **Impact:** Menjadi panduan wajib untuk semua pekerjaan selanjutnya.

### [2026-03-22] style: Membuat design-system.css — design tokens & components baru
- **File:** `assets/css/design-system.css`
- **Deskripsi:** File CSS baru dengan CSS custom properties (design tokens), typography scale menggunakan Plus Jakarta Sans + Inter, utility classes, card component, button variants, badge, form input styles. Menggantikan warna merah template e-commerce dengan Indigo fintech professional.
- **Impact:** Semua halaman yang mengimport file ini mendapat tampilan baru.

### [2026-03-22] fix: Perbaiki service-worker.js — variable names undefined
- **File:** `service-worker.js`
- **Deskripsi:** Fix bug B-01: variabel `cacheName` → `CACHE_NAME`, `filesToCache` → `urlsToCache`. Tambah proper activate event untuk cache busting, skip API calls dari caching, offline fallback. Cache name diupdate ke `efinmen-v1`.
- **Impact:** PWA sekarang berfungsi, offline mode aktif.

### [2026-03-22] infra: Buat js/core/ — shared modules
- **File:** `js/core/config.js`, `js/core/api.js`, `js/core/auth.js`, `js/core/utils.js`
- **Deskripsi:** Buat 4 shared modules: config (konstanta & URL terpusat), api (fetch wrapper dengan retry & timeout), auth (auth guard terpusat), utils (formatRupiah, formatDate, escapeHtml, dll). Menghilangkan duplikasi kode di 10+ file.
- **Impact:** Semua halaman yang adopsi core modules tidak perlu copy-paste logic lagi.

### [2026-03-22] style: Redesign login.html — visual baru professional
- **File:** `login.html`
- **Deskripsi:** Total redesign login page. Brand hero area dengan gradient Indigo, card form dengan rounded corners, input dengan icon, password toggle, inline error state (bukan SweetAlert), loading spinner di button. Hapus theme settings panel dari halaman login (tidak relevan). Auto-redirect jika sudah login. Import design-system.css.
- **Impact:** First impression user jauh lebih professional dan modern.

### [2026-03-22] style: Redesign riwayat-transaksi.html
- **File:** `riwayat-transaksi.html`
- **Deskripsi:** Total redesign. Filter chips horizontal scroll (Semua/Pemasukan/Pengeluaran/Perpindahan), period select dropdown, transaction cards dengan left-border color coding, fn-bottom-nav standar, FAB. Hapus semua inline styles lama, adopsi design-system.css. Gunakan core modules (config, utils, auth). Fix duplikasi formatRupiah dan auth check.
- **Impact:** Riwayat transaksi tampil konsisten dengan halaman lain.

### [2026-03-22] style: Redesign plan-saveing.html
- **File:** `plan-saveing.html`
- **Deskripsi:** Total redesign. Hero section gradient amber (warna tabungan), 3 stat cards (Terkumpul, Sisa, Plan Aktif) overlap di bawah hero, tab navigation (Progress/Buat Plan/Riwayat), saving plan cards dengan progress bar berwarna, tabel riwayat. Hapus e-commerce template nav, sidebar desktop, dead links. Adopsi design-system.css dan core modules.
- **Impact:** Halaman tabungan tampil professional dan mobile-friendly.

---

### [2026-03-22] style: Redesign index.html — dashboard baru
- **File:** `index.html`
- **Deskripsi:** Total redesign dashboard. fn-header dengan greeting + tombol refresh/user dropdown, fn-hero dengan saldo ringkasan, 2x2 stat grid (Pemasukan/Pengeluaran/Tabungan/Sisa), sections: Rekening, Hutang & Piutang, Tabs Tabungan+Budget, Distribusi Pengeluaran, Tren, Transaksi Terbaru. Bottom sheet modal menggantikan modal kanan lama. fn-bottom-nav + FAB. Tambah js/core imports. Hapus slick/jquery-ui/nice-select CSS.
- **Impact:** Dashboard utama tampil konsisten dengan design system.

### [2026-03-22] style: Redesign Transaksi-save.html — form transaksi baru
- **File:** `Transaksi-save.html`
- **Deskripsi:** Total redesign form catat transaksi. fn-header dengan back button, greeting card gradient indigo, form card dengan section labels, input Rp prefix visual, Jenis Transaksi accent color (hijau/merah/biru), submit button gradient full-width. Semua ID dipertahankan untuk kompatibilitas app-transaksi-page.js. Hapus e-commerce template lama.
- **Impact:** Form transaksi tampil professional dan konsisten.

### [2026-03-22] style: Redesign budgeting-view.html
- **File:** `budgeting-view.html`
- **Deskripsi:** Total redesign. Hero gradient violet-indigo dengan greeting user, 3 stat cards overlap (Anggaran/Terpakai/Sisa), custom tab navigation (Resume/Kategori/Riwayat), budget category cards dengan left-border color-coded (hijau/kuning/merah sesuai % pemakaian), progress bar per kategori, donut chart SVG pure CSS untuk visualisasi budget vs spent, bottom sheet modal untuk tambah anggaran (menggantikan Bootstrap modal), period filter pills untuk riwayat. Hapus theme settings panel, e-commerce header, mobile sidebar, footer. Adopsi design-system.css dan js/core modules. Preserve semua IDs asli.
- **Impact:** Budgeting page tampil professional dan konsisten dengan halaman lain.

---

### [2026-03-22] style: Rebuild login.html — migrasi ke css/app.css
- **File:** `login.html`
- **Deskripsi:** Total overwrite login.html. Migrasi dari design-system.css ke css/app.css (design system v2.0). Gunakan kelas native app.css: `.login-page`, `.login-brand`, `.login-logo`, `.login-logo__icon`, `.login-logo__name`, `.login-logo__tagline`, `.login-form-area`, `.login-title`, `.login-subtitle`, `.input-group`, `.input`, `.label`, `.form-group`, `.form-error`, `.btn.btn-primary.btn-full.btn-lg`, `.preloader`, `.preloader__brand`, `.preloader__ring`. Password toggle button di dalam `.input-suffix`. Hapus semua dependency lama: Bootstrap, jQuery, sweetalert2, app.js, style.css, design-system.css. Script inline saja. Service worker registration dipertahankan.
- **Impact:** Login page tampil konsisten dengan design system v2 (dark hero, white card, premium neobank style).

### [2026-03-22] feat: Build dashboard.js — logika dashboard v2 berbasis core.js
- **File:** `js/dashboard.js`
- **Deskripsi:** Full rewrite logika halaman dashboard. Menggunakan Config, API, Auth, Utils dari core.js (tidak ada duplikasi). Fungsi: `initDashboard`, `loadAll` (Promise.all 4 API calls paralel), `renderSummary`, `renderAccounts` (horizontal scroll, 5 color variants), `renderLoans` (filter belum lunas, icon hutang/piutang), `renderSavings` (max 3, progress bar warna dinamis), `renderDistribution` (top 6 pengeluaran per kategori, click buka detail sheet), `renderTrend` (6 bulan terakhir, dual bar proporsional), `renderRecent` (grouped by date via Utils.groupByDate), `renderTrxItem` (helper), `openDetailSheet` / `closeDetailSheet`. Scroll listener untuk header transparan ke opaque saat scrollY > 60.
- **Impact:** Dashboard halaman utama — semua data tampil otomatis dari API.

### [2026-03-22] feat: Rebuild index.html — dashboard page v2 (app.css only)
- **File:** `index.html`
- **Deskripsi:** Full rewrite index.html. Migrasi penuh ke css/app.css (design system v2). Struktur: preloader, loading-overlay, app-header dark (transparan di atas hero, opaque saat scroll), hero section (saldo bersih + 3 hero pills terpisah heroPemasukan/heroPengeluaran/heroTabungan), content-area (rounded top overlap hero), stat-grid 4 kartu (totalPemasukan, totalPengeluaran, totalTabungan, sisaBudget), sections: Rekening, Hutang & Piutang, Target Tabungan, Distribusi Pengeluaran, Tren Bulanan, Transaksi Terbaru, detail bottom-sheet, app-nav (5 item + FAB center). Script: core.js → dashboard.js. Tanpa Bootstrap, jQuery, SweetAlert2, file CSS lama.
- **Impact:** Dashboard utama tampil konsisten dengan design system v2, semua data dirender oleh dashboard.js.

### [2026-03-22] feat: Build js/transaksi.js — logika form transaksi v2
- **File:** `js/transaksi.js`
- **Deskripsi:** Full clean rewrite logika form catat transaksi. Menggunakan Config, API, Auth, Utils dari core.js tanpa duplikasi. Fungsi: `initTransaksi` (guard + bindLogout + loadFormData + setupFormSubmit + setupSegmented), `loadFormData` (cache-first via localStorage Config.KEYS.dropdowns, fallback fetch API.get), `refreshData` (force fetch + update cache), `setupDropdowns` (populate bySumber, JenisTransaksi, bind events), `setupSegmented` (segmented control sync ke JenisTransaksi hidden select), `activateSegmentedBtn` (active/active--income/expense/transfer classes), `updateFormCardAccent` (border-left dynamic per jenis), `onJenisChange` (reset downstream, toggle inputSumberContainer/dropdownSumberContainer, populate kategori), `onKategoriChange` (populate enumDropdown: bySumber untuk Perpindahan, bySave untuk Tabungan, byKelompok sinon), `onSubkategoriChange` (set inputSumber Perpindahan, show DataLain, show loanShow), `setupFormSubmit` (validate 4 fields, API.post FormData, toast/Swal handler), `setSubmitLoading` (spinner state pada button), helper functions: `populateSelect`, `resetSelect`, `setHidden`, `show`, `hide`, `resetHiddenDivs`, `resetHiddenInputs`. Preserve semua ID form persis sesuai spec.
- **Impact:** Form catat transaksi berfungsi penuh dengan dropdown dinamis dan submit ke Google Apps Script.

### [2026-03-22] feat: Rebuild Transaksi-save.html — form transaksi v2 (app.css only)
- **File:** `Transaksi-save.html`
- **Deskripsi:** Full rewrite Transaksi-save.html. Migrasi ke css/app.css (design system v2). Struktur: preloader, loading-overlay, app-header light (back button + refresh + logout), greeting user, segmented control (#typeSegmented: Pengeluaran/Pemasukan/Pindah), form card (#formCard, border-left accent dinamis), form fields: hidden inputs (paramcek, inputJenis, inputKategori, inputSubkategori, inputSumber, inputDataaLain), JenisTransaksi hidden select, keteranganDropdown, enumDropdown, dropdownSumberContainer (bySumber), inputSumberContainer (manualSumberInput, display:none Perpindahan), keterangan text, jumlah dengan .input-rp prefix, loanShow section (display:none), DataLain section (display:none), submit button full-width. Scripts: sweetalert2 → core.js → transaksi.js. Tanpa Bootstrap, jQuery, file lama.
- **Impact:** Form transaksi tampil konsisten design system v2 dan dioperasikan oleh transaksi.js.

> Entry berikutnya ditambah di bawah saat ada perubahan.
