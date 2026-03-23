# system_snap.md — Notebook System E-FinMen

> Dokumen ini adalah referensi penuh tentang arsitektur, komponen, dan cara kerja sistem apps E-FinMen. Wajib dibaca AI agent sebelum mengerjakan task apapun.

---

## Identitas Aplikasi

- **Nama**: E-FinMen (Finance Management)
- **Tipe**: PWA (Progressive Web App) — mobile-first
- **Bahasa UI**: Bahasa Indonesia
- **Target User**: Individual / keluarga untuk manajemen keuangan pribadi
- **Tema Brand**: Corporate Startup · Casual · Elegant · Professional
- **Color Primary**: `#4F46E5` (Indigo) — sejak redesign 2026-03-22
- **Font Heading**: Plus Jakarta Sans · **Font Body**: Inter

---

## Stack Teknologi

| Layer | Teknologi |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JS (ES6+) |
| UI Framework | Bootstrap 5 |
| Backend/DB | Google Apps Script + Google Sheets |
| Icons | Line Awesome |
| Notifications | SweetAlert2 |
| jQuery | 3.5.1 (vendor — hindari tambah ketergantungan baru) |
| Build Tool | Tidak ada — static files |
| Formatter | Prettier 3.5.3 |

---

## Arsitektur Backend: Google Apps Script

Seluruh data diakses via satu Web App URL. Format:
```
https://script.google.com/macros/s/<SCRIPT_ID>/exec
  ?spid=<spreadsheet_id>&id=<user_id>&email=<user_email>&dataset=<key>
```

**Dataset yang tersedia:**

| Key | Isi |
|---|---|
| `accdta` | Account/user data |
| `resTrx` | Daftar transaksi |
| `trgSave` | Saving plans |
| `bckdata` | Dropdown data (jenis, kategori, sumber, loan) |
| `DataAccRek` | Account rekening (saldo per rekening) |

**POST transaksi:** `FormData` dikirim ke `SPREADSHEET_URL` tanpa `&dataset`.

**Struktur response API:**
```js
// Response bisa salah satu dari:
{ "values": [...] }   // array data
{ "value": "..." }    // single value
[...]                 // langsung array
```

---

## Model Data

### Transaksi
```json
{
  "tanggal": "2024-01-15",
  "jenis": "Pengeluaran | Pemasukan | Perpindahan",
  "kategori": "Makanan | Transportasi | ...",
  "subKategori": "string",
  "keterangan": "string",
  "jumlah": 150000,
  "sumber": "BCA | Mandiri | ..."
}
```

### Saving Plan
```json
{ "judul": "string", "target_nominal": 5000000, "persen_tercapai": 60 }
```

### Account Rekening
```json
{ "Keterangan": "BCA", "Nilai": 2500000, "Pemasukan": 3000000, "Pengeluaran": 500000 }
```

### Loan
```json
{ "KeteranganLoan": "string", "nilaiHutang": 1000000, "jenis": "Hutang | Piutang", "status": "Belum Lunas | Lunas" }
```

### Dropdown Data (`bckdata`)
```json
{
  "bySumber": ["BCA", "Mandiri", ...],
  "byJenis": { "Pengeluaran": [...], "Pemasukan": [...], "Perpindahan": [...] },
  "byKelompok": { "Makanan": ["Makan Siang", ...] },
  "bySave": ["Tabungan Rumah", ...],
  "byLoan": [{ "KeteranganLoan": "...", ... }]
}
```

---

## Autentikasi

- **Metode**: localStorage-based (tidak ada server session)
- **Auth Guard**: Setiap halaman cek `localStorage.getItem('user')` → redirect ke `login.html` jika null
- **Logout**: `localStorage.clear()` → redirect ke `index.html`

**localStorage Keys:**

| Key | Isi |
|---|---|
| `user` | Nama user |
| `id` | User ID |
| `email` | Email user |
| `spid` | Spreadsheet ID (per user) |
| `data` | Cache transaksi (JSON array) |
| `data-drop` | Cache dropdown data |
| `saving_plan_Index` | Cache saving plans |
| `theme_primary_color` | Warna tema primary |
| `theme_secondary_color` | Warna tema secondary |

---

## Struktur File

```
updat-mobile-app-fn/
├── ai/                       ← Context AI agent
│   ├── system_snap.md        ← Dokumentasi sistem (INI)
│   ├── log.md                ← Changelog
│   ├── memory.md             ← Milestones
│   └── user.md               ← Task aktif
│
├── assets/css/
│   ├── design-system.css     ← [NEW] Design tokens & components
│   ├── style.css             ← CSS utama (dari template e-commerce)
│   └── responsive.css
│
├── js/core/                  ← [NEW] Shared modules
│   ├── config.js             ← Konstanta & URL
│   ├── api.js                ← Fetch wrapper
│   ├── auth.js               ← Auth guard
│   └── utils.js              ← formatRupiah, formatDate, dll
│
├── index.html                ← Dashboard
├── login.html                ← Login
├── registrasi.html           ← Register
├── Transaksi-save.html       ← Input transaksi
├── riwayat-transaksi.html    ← History
├── budgeting-view.html       ← Budget tracker
├── plan-saveing.html         ← Saving plans
├── wish-list.html            ← Wish list
├── settup-fn.html            ← Settings
│
├── app-index-page.js         ← Logic dashboard
├── app-transaksi-page.js     ← Logic form transaksi
├── progersbar.js             ← Progress bar
├── service-worker.js         ← PWA SW (ada bug)
└── manifest.json             ← PWA manifest
```

---

## Bug List Aktif

| # | File | Bug | Severity |
|---|---|---|---|
| B-01 | `service-worker.js` | `cacheName` & `filesToCache` undefined | HIGH |
| B-02 | `index.html` | Budget data hardcoded, bukan dari API | MEDIUM |
| B-03 | `index.html` | Modal width 400px hardcoded | MEDIUM |
| B-04 | Multiple | Dead link ke `account.html` (tidak ada) | MEDIUM |
| B-05 | Multiple | `SPREADSHEET_URL` duplikasi di setiap file | HIGH |
| B-06 | Multiple | `formatRupiah`, auth check — duplikasi 5+ file | HIGH |
| B-07 | `app-index-page.js` | `data.byLoan` crash jika null | MEDIUM |
| B-08 | Multiple | `innerHTML` tanpa sanitasi — XSS risk | HIGH |

---

## Halaman & JS Mapping

| Halaman | JS | Fungsi |
|---|---|---|
| `index.html` | `app-index-page.js` | Dashboard: summary, chart, transaksi, saving, hutang |
| `login.html` | inline | Form login |
| `registrasi.html` | inline | Form registrasi |
| `Transaksi-save.html` | `app-transaksi-page.js` | Form input transaksi |
| `riwayat-transaksi.html` | inline | History dengan filter |
| `budgeting-view.html` | inline | Budget per kategori |
| `plan-saveing.html` | inline + `progersbar.js` | Target tabungan |
| `wish-list.html` | inline | Wish list |
| `settup-fn.html` | inline | Pengaturan |
