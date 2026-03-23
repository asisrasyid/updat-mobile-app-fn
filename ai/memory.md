# memory.md — Milestone & Catatan Penting

> "Papan milestone" untuk AI agent. Apa yang sudah selesai, sedang berjalan, dan harus dilanjutkan. Update setiap milestone tercapai.

---

## Status Project

**Fase aktif: M1 — Infrastruktur Core**

---

## ✅ Selesai

### M0 — Analisis & Foundation (2026-03-22)
- Review menyeluruh seluruh codebase
- Identifikasi semua bug, duplikasi, masalah UX/infra
- Buat `ai/` folder dengan 4 file context lengkap
- `CLAUDE.md` diperbarui: design system + development rules
- `assets/css/design-system.css` dibuat (design tokens, components)

---

## 🔄 Sedang Berjalan

### M1 — Infrastruktur Core
Target: shared JS modules, hilangkan duplikasi, fix service worker.

- [ ] `js/core/config.js`
- [ ] `js/core/api.js`
- [ ] `js/core/auth.js`
- [ ] `js/core/utils.js`
- [ ] Fix `service-worker.js`

---

## 📋 Mendatang

### M2 — Visual Transformation
- Apply design-system.css ke semua halaman
- Redesign login.html, registrasi.html (first impression)
- Redesign index.html (dashboard)
- Redesign Transaksi-save.html
- Redesign riwayat, budgeting, plan-saving
- Standardisasi header + bottom nav

### M3 — UX Flow & Bug Fixes
- Fix modal hardcode width
- Fix dead links
- Real-time form validation
- Budget data dari API
- Toast notification system
- Fix null safety issues

### M4 — Polish
- XSS prevention (innerHTML sanitasi)
- Page transition animations
- Skeleton loading states
- PWA full audit

---

## Keputusan Arsitektur

| Tanggal | Keputusan | Alasan |
|---|---|---|
| 2026-03-22 | Tetap Vanilla JS, tidak migrasi framework | Avoid full rewrite; PWA butuh bundle kecil |
| 2026-03-22 | Design tokens via CSS custom properties | Theme switching tetap jalan, no preprocessor |
| 2026-03-22 | Primary color: Indigo `#4F46E5` | Menggantikan merah e-commerce; fintech-appropriate |
| 2026-03-22 | Font: Plus Jakarta Sans + Inter | Modern, readable, tersedia Google Fonts gratis |

---

## Catatan Teknis Penting

- `SPREADSHEET_URL` terekspos di frontend — by design (Google Apps Script limitation). Jangan "fix" dengan cara yang break fungsionalitas.
- `localStorage` sebagai state — tidak akan diubah ke IndexedDB dalam scope ini.
- `input-transaksi.js` & `app-page-index.js` = legacy. Jangan hapus sebelum verifikasi tidak ada halaman yang bergantung.
- jQuery vendor sudah ada — boleh pakai untuk interactions existing. Fitur baru: pakai vanilla JS.
- Semua teks UI dalam Bahasa Indonesia — pertahankan konsistensi bahasa.
