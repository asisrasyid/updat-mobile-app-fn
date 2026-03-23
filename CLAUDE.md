# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**E-FinMen** — Personal Finance Management PWA. Static frontend communicating with Google Apps Script as backend/database layer. Mobile-first. UI language: Bahasa Indonesia.

---

## Development Commands

```bash
# Format semua file
npx prettier --write .

# Serve lokal (pilih salah satu)
npx serve .
python -m http.server 8080
```

No build step. Pure static files — open directly in browser or serve with any static server.

---

## AI Agent Protocol

**Sebelum mulai kerja:**
1. Baca `ai/system_snap.md` — arsitektur, model data, bug list
2. Baca `ai/user.md` — task aktif dan statusnya
3. Baca `ai/memory.md` — milestone & keputusan arsitektur

**Setelah selesai kerja:**
1. Update checklist di `ai/user.md` — tandai task yang selesai
2. Catat semua perubahan di `ai/log.md` — format: `[YYYY-MM-DD] tipe: deskripsi`
3. Update milestone di `ai/memory.md` jika ada milestone baru tercapai

**Rule wajib setiap pekerjaan:**
- Setiap file HTML yang disentuh harus mengimport `assets/css/design-system.css`
- Setiap perubahan JS — cek dulu apakah ada di `js/core/utils.js` (hindari duplikasi)
- Setiap bug yang ditemukan — catat di `ai/system_snap.md` bagian Bug List
- Tidak boleh ada kode duplikasi baru untuk `formatRupiah`, `formatDate`, auth check, logout

---

## Architecture

### Backend: Google Apps Script
All persistence goes through a single Web App URL (defined in `js/core/config.js`):
```js
`https://script.google.com/macros/s/<SCRIPT_ID>/exec?spid=${spid}&id=${id}&email=${email}&dataset=${key}`
```

Dataset keys: `accdta` | `resTrx` | `trgSave` | `bckdata` | `DataAccRek`

POST transaksi: `FormData` to `SPREADSHEET_URL` without `&dataset`.

### Auth
All pages check `localStorage.getItem('user')` — redirect to `login.html` if null. Use `js/core/auth.js` (do not copy-paste this check).

### Shared Modules (`js/core/`)
- `config.js` — SPREADSHEET_URL, dataset keys, all constants
- `api.js` — fetch wrapper with error handling and retry
- `auth.js` — auth guard, logout, session helpers
- `utils.js` — `formatRupiah`, `formatDate`, `formatTime`, `formatMonthName`, etc.

### Key JS Files
- `app-index-page.js` — dashboard logic (charts, summaries, transactions, saving plans)
- `app-transaksi-page.js` — transaction form logic (dynamic dropdowns, form submit)
- `progresbar.js` — savings progress bar rendering

---

## Design System

### Brand Identity
**Tema**: Corporate Startup · Casual · Elegant · Professional
**Kepribadian merek**: Dipercaya seperti bank, terasa dekat seperti teman, tampil seperti startup fintech kelas dunia.

---

### Color Palette

#### Primary — Indigo
Warna utama: kepercayaan, profesional, modern fintech.

| Token | Hex | Penggunaan |
|---|---|---|
| `--color-primary` | `#4F46E5` | CTA utama, link aktif, elemen fokus |
| `--color-primary-dark` | `#3730A3` | Hover state tombol primary |
| `--color-primary-light` | `#818CF8` | Secondary accent, icon |
| `--color-primary-bg` | `#EEF2FF` | Background highlight ringan |

#### Accent — Emerald (Uang & Pertumbuhan)
| Token | Hex | Penggunaan |
|---|---|---|
| `--color-success` | `#10B981` | Pemasukan, angka positif, sukses |
| `--color-success-light` | `#D1FAE5` | Badge sukses, background |

#### Semantic Colors
| Token | Hex | Penggunaan |
|---|---|---|
| `--color-warning` | `#F59E0B` | Tabungan, target, peringatan |
| `--color-warning-light` | `#FEF3C7` | Badge warning background |
| `--color-danger` | `#EF4444` | Pengeluaran, error, over budget |
| `--color-danger-light` | `#FEE2E2` | Badge danger background |
| `--color-info` | `#0EA5E9` | Informasi, perpindahan |
| `--color-info-light` | `#E0F2FE` | Badge info background |

#### Neutral — Background & Surface
| Token | Hex | Penggunaan |
|---|---|---|
| `--color-bg` | `#F8FAFC` | Background halaman |
| `--color-surface` | `#FFFFFF` | Card, modal, input background |
| `--color-border` | `#E2E8F0` | Border card, divider, input |
| `--color-border-focus` | `#818CF8` | Border input saat fokus |

#### Text
| Token | Hex | Penggunaan |
|---|---|---|
| `--color-text-primary` | `#0F172A` | Judul, teks utama |
| `--color-text-secondary` | `#475569` | Label, teks pendukung |
| `--color-text-muted` | `#94A3B8` | Placeholder, teks lemah |
| `--color-text-inverse` | `#FFFFFF` | Teks di atas background gelap |

**LARANGAN WARNA:**
- Jangan pakai merah `#FD3D57` (warna template e-commerce lama) untuk elemen baru
- Jangan hardcode hex — selalu pakai CSS variable
- Jangan pakai warna di luar palette di atas tanpa alasan yang dicatat

---

### Typography

#### Font Families
```css
/* Heading & Display */
font-family: 'Plus Jakarta Sans', sans-serif;
/* Body, UI, Label */
font-family: 'Inter', sans-serif;
```

Import via Google Fonts (sudah ada di `design-system.css`):
```html
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');
```

#### Type Scale
| Token | Size | Weight | Line Height | Penggunaan |
|---|---|---|---|---|
| `--text-xs` | 11px | 400 | 1.5 | Timestamp, label kecil |
| `--text-sm` | 13px | 400 | 1.5 | Teks pendukung, badge |
| `--text-base` | 15px | 400 | 1.6 | Body text default |
| `--text-md` | 16px | 500 | 1.5 | Label form, deskripsi |
| `--text-lg` | 18px | 600 | 1.4 | Subheading |
| `--text-xl` | 22px | 700 | 1.3 | Angka nominal penting |
| `--text-2xl` | 28px | 700 | 1.2 | Heading section |
| `--text-3xl` | 36px | 800 | 1.1 | Display / hero |

**Rules tipografi:**
- Semua angka nominal (Rupiah) pakai `font-variant-numeric: tabular-nums`
- Heading halaman: `Plus Jakarta Sans` weight 700+
- Label form, navigasi: `Inter` weight 500
- Teks panjang/paragraf: `Inter` weight 400

---

### Spacing System

Base unit: **4px**

| Token | Value | Penggunaan tipikal |
|---|---|---|
| `--space-1` | 4px | Gap antar icon & teks kecil |
| `--space-2` | 8px | Padding badge, gap item list |
| `--space-3` | 12px | Padding button small |
| `--space-4` | 16px | Padding card content, gap standar |
| `--space-5` | 20px | Padding section kecil |
| `--space-6` | 24px | Padding card, margin section |
| `--space-8` | 32px | Margin antar section |
| `--space-10` | 40px | Padding halaman besar |
| `--space-12` | 48px | Hero section padding |

---

### Border Radius

| Token | Value | Penggunaan |
|---|---|---|
| `--radius-sm` | 6px | Button small, badge |
| `--radius-md` | 10px | Input, button default |
| `--radius-lg` | 14px | Card |
| `--radius-xl` | 20px | Modal, bottom sheet |
| `--radius-full` | 9999px | Pill, avatar |

---

### Shadows

| Token | Value | Penggunaan |
|---|---|---|
| `--shadow-xs` | `0 1px 2px rgba(15,23,42,0.05)` | Input subtle |
| `--shadow-sm` | `0 2px 4px rgba(15,23,42,0.06)` | Card default |
| `--shadow-md` | `0 4px 12px rgba(15,23,42,0.08)` | Card hover, dropdown |
| `--shadow-lg` | `0 8px 24px rgba(15,23,42,0.12)` | Modal, bottom sheet |
| `--shadow-primary` | `0 4px 12px rgba(79,70,229,0.25)` | Button primary shadow |

---

### Component Rules

#### Cards
```css
background: var(--color-surface);
border-radius: var(--radius-lg);     /* 14px */
box-shadow: var(--shadow-sm);
border: 1px solid var(--color-border);
padding: var(--space-6);             /* 24px */
```
- Hindari card dengan border saja (tanpa shadow) — terlalu flat
- Jangan pakai shadow-lg di card biasa — hanya untuk modal

#### Buttons
- **Primary**: `background: var(--color-primary)`, `box-shadow: var(--shadow-primary)`
- **Secondary**: `background: var(--color-primary-bg)`, `color: var(--color-primary)`
- **Danger**: `background: var(--color-danger)`
- Border radius: `var(--radius-md)` — 10px
- Padding: `12px 20px` (default), `8px 14px` (small)
- Font: Inter 500, 14px
- Semua button wajib ada `:hover` dan `:active` state

#### Form Inputs
- Border: `1.5px solid var(--color-border)`
- Border radius: `var(--radius-md)`
- Focus: border `var(--color-border-focus)`, box-shadow `0 0 0 3px rgba(129,140,248,0.2)`
- Background: `var(--color-surface)`
- Font: Inter 15px
- Padding: `12px 16px`
- Label: Inter 500 13px, color `var(--color-text-secondary)`

#### Bottom Navigation (Mobile)
- Background: `var(--color-surface)`
- Border top: `1px solid var(--color-border)`
- Box shadow: `0 -4px 12px rgba(15,23,42,0.06)`
- Height: 64px
- Active icon: `var(--color-primary)` + small dot indicator
- Inactive: `var(--color-text-muted)`

#### Transaction Cards
- Pemasukan: left border `4px solid var(--color-success)`
- Pengeluaran: left border `4px solid var(--color-danger)`
- Perpindahan: left border `4px solid var(--color-info)`

#### Summary/Stat Cards
- Selalu tampilkan dengan gradient halus atau icon berwarna
- Nominal: `var(--text-xl)`, `Plus Jakarta Sans` 700
- Label: `var(--text-sm)`, `Inter` 400, muted

#### Progress Bar
- Track background: `var(--color-border)`
- Fill: gradient primary ke primary-light
- Height: 8px, border-radius full
- Over budget: fill `var(--color-danger)`

---

### Animation & Transition

```css
/* Default transition untuk UI */
transition: all 0.2s ease;

/* Page/modal entrance */
transition: transform 0.3s ease, opacity 0.3s ease;

/* Hover lift effect untuk card */
transform: translateY(-2px);
box-shadow: var(--shadow-md);
```

- Jangan pakai `transition: all` di element yang berat (gunakan spesifik: `color`, `background`, `transform`)
- Loading skeleton: `animation: shimmer 1.5s infinite`

---

### Mobile-First Rules

- Default layout: single column, padding `var(--space-4)` (16px)
- Bottom navigation: sticky, z-index 100, height 64px — SELALU ada di semua halaman
- Header: sticky, height 56px, z-index 90
- Konten area: `padding-bottom: 80px` (ruang untuk bottom nav)
- FAB (Floating Action Button) untuk aksi utama (+ Transaksi): `position: fixed`, bottom 80px, right 16px
- Modal: gunakan bottom sheet di mobile (slide up dari bawah), bukan dialog tengah
- Font minimum: 13px — jangan lebih kecil dari ini di mobile

---

## Development Rules

### Wajib dilakukan setiap mengubah kode:
1. Import `assets/css/design-system.css` di setiap HTML yang disentuh (setelah bootstrap, sebelum style.css)
2. Gunakan CSS variables — jangan hardcode warna atau ukuran
3. Test tampilan di width 375px (iPhone SE) dan 414px (iPhone standard)
4. Setiap fungsi utility baru — taruh di `js/core/utils.js`, bukan inline
5. Setiap fetch/API call baru — pakai `js/core/api.js`, bukan fetch langsung
6. Catat perubahan di `ai/log.md`

### Dilarang:
- Menambah `formatRupiah`, `formatDate`, atau auth check baru — sudah ada di `js/core/utils.js`
- Hardcode warna hex di CSS/HTML baru
- Membuat modal dengan width fixed pixel
- Menambah `<style>` inline di HTML untuk styling yang seharusnya di CSS
- Copy-paste SPREADSHEET_URL ke file baru — gunakan `js/core/config.js`
