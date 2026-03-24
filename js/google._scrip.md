# Google Apps Script — E-FinMen Backend
> Salin seluruh kode di bawah ke Google Apps Script editor, lalu deploy sebagai Web App.

```javascript
// ─── Konstanta ────────────────────────────────────────────────────────────────
// USER_SHEET: spreadsheet untuk manajemen user (user list & data spreed)
const USER_SHEET = '1MJfxYZ-t03HLSennEfT0KuWe4V5OFNt4FdS2pxa7ctA';

// ─── Helper: JSON response ────────────────────────────────────────────────────
function _json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── doPost ───────────────────────────────────────────────────────────────────
// Menangani: simpan transaksi, edit budget, tambah kategori budget
function doPost(e) {
  try {
    const paramCek        = e.parameter.paramcek;
    const spreddsheetName = e.parameter.spid;
    const idcek           = e.parameter.id;
    const emailcek        = e.parameter.email;

    // Validasi session user
    const userSheet = SpreadsheetApp.openById(USER_SHEET).getSheetByName('user');
    const dataRange = userSheet.getDataRange().getValues();
    let proses = false;

    for (let i = 0; i < dataRange.length; i++) {
      const id            = dataRange[i][0];
      const email         = dataRange[i][4];
      const spreedSheetId = dataRange[i][5];
      if (idcek == id && emailcek == email && spreddsheetName == spreedSheetId) {
        proses = true;
        break;
      }
    }

    if (!proses) {
      return _json({ success: false, message: 'Validasi gagal: ID, email, atau spreadsheet tidak sesuai.' });
    }

    const SHEET_ID = spreddsheetName;

    // ── Edit nilai budget di sheet Budgeting ──────────────────────────────────
    if (paramCek === 'editbudget') {
      const sheet  = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Budgeting'); // FIX B1: was 'Transaksi'
      const values = sheet.getDataRange().getValues();
      const nama   = e.parameter.nama;
      const nilai  = e.parameter.nilai; // FIX B2: was e.paramCek.nilai

      if (!nama || !nilai) { // FIX B3: was !nama && !nilai (logika salah)
        return _json({ success: false, message: '❗Data tidak lengkap. Mohon isi semua field.' });
      }

      let found = false;
      for (let i = 1; i < values.length; i++) {
        if (values[i][1] === nama) { // FIX B4: was valuesi[1] (typo)
          sheet.getRange(i + 1, 3).setValue(Number(nilai)); // col C = budget
          found = true;
        }
      }

      return found
        ? _json({ success: true,  message: `Data ${nama} berhasil diperbarui.` })
        : _json({ success: false, message: `Data ${nama} tidak ditemukan.` });

    // ── Tambah entri kategori ke sheet Back Data ──────────────────────────────
    } else if (paramCek === 'simpanBudget') {
      const enumKeterangan = e.parameter.namaBuget;
      const kelompok       = e.parameter.kelompok || enumKeterangan; // FIX B5: keterangan was duplicate of enumKeterangan
      const jenis          = 'Pengeluaran';

      if (!enumKeterangan) {
        return _json({ success: false, message: '❗Data tidak lengkap. Mohon isi nama budget.' });
      }

      const dataSendt = [enumKeterangan.trim(), kelompok.trim(), jenis];
      saveToSheet(dataSendt, 'Back Data', SHEET_ID); // FIX B6: was missing SHEET_ID arg

      return _json({ success: true, message: '✅ Data berhasil disimpan.' });

    // ── Simpan transaksi baru ─────────────────────────────────────────────────
    } else {
      const result = parseMessage(e.parameter);
      if (result.data) {
        saveToSheet(result.data, 'Transaksi', SHEET_ID);
        return _json({ success: true, message: '✅ Transaksi berhasil disimpan.' });
      }
      // Sertakan field yang kosong di pesan error untuk memudahkan debug
      return _json({
        success: false,
        message: '❗Data tidak lengkap. Field kosong: ' + result.missing.join(', ')
      });
    }

  } catch (error) {
    Logger.log('Error di doPost: ' + error.stack);
    return _json({ success: false, message: '❌ Terjadi kesalahan: ' + error.message });
  }
}

// ─── parseMessage ─────────────────────────────────────────────────────────────
// Mem-parse parameter form transaksi. Return { data, missing } atau { data: null, missing }
//
// Mapping field name (dari name attribute form HTML) → kolom sheet Transaksi:
//   inputJenis       → col D (Jenis)
//   inputKategori    → col B (Kategori)
//   inputSubkategori → col C (SubKategori)
//   keterangan       → col F (Keterangan) — opsional, default '-'
//   jumlah           → col E (Jumlah)
//   inputSumber      → col G (Sumber)
//   DataLain         → col H (DataLain)   — opsional, default '-'
function parseMessage(parameter) {
  const Jenis       = parameter.inputJenis;
  const Kategori    = parameter.inputKategori;
  const Subkategori = parameter.inputSubkategori;
  const Jumlah      = parameter.jumlah;
  const Sumber      = parameter.inputSumber;
  // keterangan & DataLain opsional — default '-' jika kosong
  const Keterangan  = (parameter.keterangan  && parameter.keterangan.trim()  !== '') ? parameter.keterangan  : '-';
  const DataLain    = (parameter.DataLain     && parameter.DataLain.trim()    !== '') ? parameter.DataLain    : '-';

  // Cek field wajib, kumpulkan yang kosong untuk debug
  const missing = [];
  if (!Jenis)       missing.push('inputJenis');
  if (!Kategori)    missing.push('inputKategori');
  if (!Subkategori) missing.push('inputSubkategori');
  if (!Jumlah)      missing.push('jumlah');
  if (!Sumber)      missing.push('inputSumber');

  if (missing.length > 0) return { data: null, missing };

  // Untuk Perpindahan: kolom Sumber diisi Kategori (rekening asal)
  if (Jenis === 'Perpindahan') {
    return { data: [Kategori.trim(), Subkategori.trim(), Jenis.trim(), Jumlah.trim(), Keterangan.trim(), Kategori.trim(), DataLain.trim()], missing: [] };
  }

  return { data: [Kategori.trim(), Subkategori.trim(), Jenis.trim(), Jumlah.trim(), Keterangan.trim(), Sumber.trim(), DataLain.trim()], missing: [] };
}

// ─── saveToSheet ──────────────────────────────────────────────────────────────
// Simpan data ke sheet tertentu dalam spreadsheet user.
// - Sheet 'Transaksi': prepend timestamp di kolom pertama
// - Sheet lain (Back Data, dll): simpan apa adanya
function saveToSheet(data, namaSheet, SHEET_ID) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(namaSheet);
  if (namaSheet === 'Transaksi') {
    sheet.appendRow([new Date(), ...data]);
  } else {
    sheet.appendRow(data);
  }
}

// ─── saveToSheetRegis ─────────────────────────────────────────────────────────
// Simpan data registrasi ke USER_SHEET (bukan spreadsheet user).
function saveToSheetRegis(data, jenisdata) {
  if (jenisdata === 'user') {
    SpreadsheetApp.openById(USER_SHEET).getSheetByName('user').appendRow(data);
  } else if (jenisdata === 'spredddata') {
    const sheet = SpreadsheetApp.openById(USER_SHEET).getSheetByName('data spreed');
    sheet.appendRow([new Date(), ...data]);
  }
}

// ─── doGet ────────────────────────────────────────────────────────────────────
// Menangani semua GET request: login, registrasi, dan pengambilan data.
function doGet(e) {
  const prm = e.parameter.dataset;

  // ── Login (tidak perlu validasi session) ──────────────────────────────────
  if (prm === 'login') {
    return handleLogin(e);
  }

  // ── Registrasi (tidak perlu validasi session) ─────────────────────────────
  // FIX B7: sebelumnya blok ini kosong sehingga handleRegis tidak pernah dipanggil
  if (prm === 'Regis') {
    return handleRegis(e);
  }

  // ── Endpoint terproteksi: validasi session terlebih dahulu ─────────────────
  const spreddsheetName = e.parameter.spid;
  const emailcek        = e.parameter.email;

  const userSheet = SpreadsheetApp.openById(USER_SHEET).getSheetByName('user');
  const dataRange = userSheet.getDataRange().getValues();
  let proses = false;

  for (let i = 0; i < dataRange.length; i++) {
    const email         = dataRange[i][4];
    const spreedSheetId = dataRange[i][5];
    if (emailcek == email && spreddsheetName == spreedSheetId) {
      proses = true;
      break;
    }
  }

  if (!proses) {
    // FIX B8: sebelumnya return success: true padahal validasi GAGAL
    return _json({ success: false, message: 'Validasi gagal: email atau spreadsheet tidak sesuai.' });
  }

  const SHEET_ID = spreddsheetName;

  // ── bckdata: dropdown data (jenis, kategori, sumber, saving, loan) ─────────
  if (prm === 'bckdata') {
    return getBckdata(SHEET_ID);
  }

  // ── trgSave: daftar saving plan ───────────────────────────────────────────
  if (prm === 'trgSave') {
    const sheet  = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Saveing-Plan');
    const values = sheet.getDataRange().getValues();
    const hasil  = [];
    for (let i = 1; i < values.length; i++) {
      const b = values[i];
      hasil.push({
        id:                  b[0],
        judul:               b[1],
        target_nominal:      b[2],
        target_tanggal:      b[3],
        persen_tercapai:     b[4],
        nominal_dikumpulkan: b[5],
      });
    }
    return _json({ value: hasil });
  }

  // ── accdta: nilai akun utama (single cell) ────────────────────────────────
  if (prm === 'accdta') {
    const sheet     = SpreadsheetApp.openById(SHEET_ID).getSheetByName('DataAkun');
    const cellValue = sheet.getRange('A2').getValue();
    return _json({ value: cellValue });
  }

  // ── resTrx: daftar transaksi ──────────────────────────────────────────────
  if (prm === 'resTrx') {
    const sheet  = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Transaksi');
    const values = sheet.getDataRange().getValues();
    const hasil  = [];
    for (let i = 1; i < values.length; i++) {
      const b = values[i];
      hasil.push({
        tanggal:     b[0],
        kategori:    b[1],
        subKategori: b[2],
        jenis:       b[3],
        jumlah:      b[4],
        keterangan:  b[5],
        sumber:      b[6],
        dataLain:    b[7],
      });
    }
    return _json({ values: hasil });
  }

  // ── DataAccRek: saldo per rekening ────────────────────────────────────────
  if (prm === 'DataAccRek') {
    const sheet  = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Rekap Saldo');
    const values = sheet.getDataRange().getValues();
    const hasil  = [];
    for (let i = 1; i < values.length; i++) {
      const b = values[i];
      if (b[1] !== '' && b[1] != null) {
        hasil.push({
          Keterangan:  b[1],
          Nilai:       b[2],
          Pemasukan:   b[3],
          Pengeluaran: b[4],
        });
      }
    }
    return _json({ values: hasil });
  }

  // ── data-budget: daftar budget per kategori ───────────────────────────────
  if (prm === 'data-budget') {
    const sheet  = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Budgeting');
    const values = sheet.getDataRange().getValues();
    const hasil  = [];
    for (let i = 1; i < values.length; i++) {
      const b = values[i];
      hasil.push({
        name:   b[1],
        budget: b[2],
        spent:  b[3],
        status: b[5],
      });
    }
    return _json({ values: hasil });
  }

  return _json({ value: 'Dataset tidak ditemukan.' });
}

// ─── handleLogin ──────────────────────────────────────────────────────────────
function handleLogin(e) {
  const username = e.parameter.usr;
  const password = e.parameter.psr;

  const sheet = SpreadsheetApp.openById(USER_SHEET).getSheetByName('user');
  const rows  = sheet.getDataRange().getValues();

  for (let i = 0; i < rows.length; i++) {
    const id            = rows[i][0];
    const userName      = rows[i][1];
    const psword        = rows[i][2];
    const nama          = rows[i][3];
    const email         = rows[i][4];
    const spreedSheetId = rows[i][5];

    if (userName == username) {
      if (psword == password) {
        return _json({
          success: true,
          message: 'Login berhasil.',
          data: { id, nama, email, spreedSheetId },
        });
      }
      return _json({ success: false, message: 'Password salah.' });
    }
  }

  return _json({ success: false, message: 'Username tidak ditemukan.' });
}

// ─── handleRegis ──────────────────────────────────────────────────────────────
function handleRegis(e) {
  const username   = e.parameter.usr;
  const pasdata    = e.parameter.psw;
  const nameData   = e.parameter.name;
  const emailData  = e.parameter.email;
  const spreedData = e.parameter.spreddsheet;

  const sheet     = SpreadsheetApp.openById(USER_SHEET).getSheetByName('user');
  const dataRange = sheet.getDataRange().getValues();
  let lastId      = 0;

  for (let i = 0; i < dataRange.length; i++) {
    const id       = parseInt(dataRange[i][0], 10) || 0;
    const userName = dataRange[i][1];
    if (userName == username) {
      return _json({ success: false, message: 'Username sudah digunakan, pilih username lain.' });
    }
    lastId = id;
  }

  if (!isSpreadsheetIdValid(spreedData)) {
    return _json({ success: false, message: 'ID Spreadsheet tidak valid atau tidak bisa diakses.' });
  }

  const newId = (lastId + 1).toString();
  saveToSheetRegis([newId.trim(), username.trim(), pasdata.trim(), nameData.trim(), emailData.trim()], 'user');
  saveToSheetRegis([newId.trim(), spreedData.trim()], 'spredddata');

  return _json({ success: true, message: `Selamat datang ${nameData}, selamat bergabung!` });
}

// ─── getBckdata ───────────────────────────────────────────────────────────────
// Membaca sheet 'Back Data' dan 'Loan', mengembalikan struktur dropdown lengkap.
// Response: { byJenis, byKelompok, bySumber, bySave, byLoan }
function getBckdata(SHEET_ID) {
  const sheet     = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Back Data');
  const loanSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Loan');
  const data      = sheet.getDataRange().getValues();
  const loanData  = loanSheet.getDataRange().getValues();

  const result = { byJenis: {}, byKelompok: {}, bySumber: [], bySave: [], byLoan: [] };

  // Proses data Loan
  for (let i = 1; i < loanData.length; i++) {
    const lon            = loanData[i];
    const KeteranganLoan = lon[1];
    if (KeteranganLoan && KeteranganLoan.toString().trim() !== '') {
      result.byLoan.push({
        Nomor:         lon[0],
        KeteranganLoan,
        jatuhTempo:    lon[2],
        status:        lon[3],
        deadline:      lon[4],
        nilaiHutang:   lon[5],
        nilaiBayar:    lon[6],
        jenis:         lon[8],
      });
    }
  }

  // Proses data Back Data (dropdown jenis, kategori, sumber, saving)
  for (let i = 1; i < data.length; i++) {
    const row            = data[i];
    const EnumKeterangan = row[0]; // col A
    const Kelompok       = row[1]; // col B
    const Jenis          = row[2]; // col C
    const Sumber         = row[4]; // col E
    const Save           = row[7]; // col H

    if (!result.byJenis[Jenis]) result.byJenis[Jenis] = [];
    if (!result.byJenis[Jenis].includes(Kelompok)) result.byJenis[Jenis].push(Kelompok);

    if (!result.byKelompok[Kelompok]) result.byKelompok[Kelompok] = [];
    if (!result.byKelompok[Kelompok].includes(EnumKeterangan)) result.byKelompok[Kelompok].push(EnumKeterangan);

    if (Sumber && Sumber.toString().trim() !== '' && !result.bySumber.includes(Sumber)) {
      result.bySumber.push(Sumber);
    }
    if (Save && Save.toString().trim() !== '' && !result.bySave.includes(Save)) {
      result.bySave.push(Save);
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── isSpreadsheetIdValid ─────────────────────────────────────────────────────
function isSpreadsheetIdValid(spreadsheetId) {
  try {
    SpreadsheetApp.openById(spreadsheetId).getName();
    return true;
  } catch (e) {
    return false;
  }
}
```

---

## Ringkasan Bug yang Diperbaiki

| # | Lokasi | Bug | Fix |
|---|---|---|---|
| B1 | `editbudget` | Sheet `'Transaksi'` → seharusnya `'Budgeting'` | Ganti nama sheet |
| B2 | `editbudget` | `e.paramCek.nilai` → typo property chain | `e.parameter.nilai` |
| B3 | `editbudget` | `!nama && !nilai` → logika salah (lolos jika salah satu ada) | Ganti ke `!nama \|\| !nilai` |
| B4 | `editbudget` | `valuesi[1]` → typo variabel | `values[i][1]` |
| B5 | `simpanBudget` | `keterangan` = `enumKeterangan` → variabel duplikat | Pisah ke param `kelompok` |
| B6 | `simpanBudget` | `saveToSheet(data, "Back Data")` → SHEET_ID hilang | Tambah arg ketiga `SHEET_ID` |
| B7 | `doGet` — blok `Regis` | Blok kosong → registrasi unreachable | Pindah logika registrasi ke sini |
| B8 | `doGet` — validasi gagal | Return `success: true` padahal validasi GAGAL | Ganti ke `success: false` |
| B9 | `doGet` | Duplikat blok login di dalam else (dead code) | Dihapus, ekstrak ke `handleLogin()` |

## Mapping Dataset ↔ Sheet

| `dataset` param | Sheet | Response key | Dipakai di |
|---|---|---|---|
| `login` | `user` (USER_SHEET) | `data` | `login.html` |
| `Regis` | `user` + `data spreed` | — | `registrasi.html` |
| `resTrx` | `Transaksi` | `values` | dashboard, riwayat |
| `bckdata` | `Back Data` + `Loan` | *(plain object)* | form transaksi |
| `trgSave` | `Saveing-Plan` | `value` | dashboard, saving plan |
| `accdta` | `DataAkun` | `value` | dashboard |
| `DataAccRek` | `Rekap Saldo` | `values` | dashboard |
| `data-budget` | `Budgeting` | `values` | budgeting view |
