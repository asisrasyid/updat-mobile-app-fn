/**
 * transaksi.js — E-FinMen Transaction Form Logic v2.0
 * Full clean rewrite — uses Config, API, Auth, Utils from core.js
 * 2026-03-22
 */

/* ============================================================
   STATE
   ============================================================ */
let _dropdownData = null; // cached API response

/* ============================================================
   INIT
   ============================================================ */
function initTransaksi() {
  if (!Auth.guard()) return;
  Auth.bindLogout('#btnLogout');

  document.getElementById('pembahruandata').addEventListener('click', refreshData);

  loadFormData();
  setupFormSubmit();
  setupSegmented();
}

/* ============================================================
   DATA LOADING
   ============================================================ */
async function loadFormData() {
  const cached = localStorage.getItem(Config.KEYS.dropdowns);
  if (cached) {
    try {
      const data = JSON.parse(cached);
      _dropdownData = data;
      setupDropdowns(data);
      Utils.hidePreloader();
      return;
    } catch (e) {
      // corrupt cache — fall through to fetch
    }
  }

  try {
    const data = await API.get(Config.DS.dropdowns);
    _dropdownData = data;
    localStorage.setItem(Config.KEYS.dropdowns, JSON.stringify(data));
    setupDropdowns(data);
  } catch (err) {
    Utils.toast(API.errorMsg(err), 'error');
  } finally {
    Utils.hidePreloader();
  }
}

async function refreshData() {
  Utils.setLoading(true);
  try {
    const data = await API.get(Config.DS.dropdowns);
    _dropdownData = data;
    localStorage.setItem(Config.KEYS.dropdowns, JSON.stringify(data));
    setupDropdowns(data);
    Utils.toast('Data berhasil diperbarui', 'success');
  } catch (err) {
    Utils.toast(API.errorMsg(err), 'error');
  } finally {
    Utils.setLoading(false);
  }
}

/* ============================================================
   DROPDOWN SETUP
   ============================================================ */
function setupDropdowns(data) {
  if (!data) return;

  // Populate #bySumber
  const sumberEl = document.getElementById('bySumber');
  if (sumberEl && Array.isArray(data.bySumber)) {
    populateSelect(sumberEl, data.bySumber, 'Pilih Rekening');
    sumberEl.addEventListener('change', onSumberChange);
  }

  // Populate #JenisTransaksi (hidden select)
  const jenisEl = document.getElementById('JenisTransaksi');
  if (jenisEl && data.byJenis) {
    populateSelect(jenisEl, Object.keys(data.byJenis), 'Pilih Jenis');
  }

  // Bind keteranganDropdown change
  const kategoriEl = document.getElementById('keteranganDropdown');
  if (kategoriEl) {
    kategoriEl.addEventListener('change', onKategoriChange);
  }

  // Bind enumDropdown change
  const enumEl = document.getElementById('enumDropdown');
  if (enumEl) {
    enumEl.addEventListener('change', onSubkategoriChange);
  }

  // Default: set Pengeluaran as initial type
  activateSegmentedBtn('Pengeluaran');
}

/* ============================================================
   SEGMENTED CONTROL
   ============================================================ */
function setupSegmented() {
  const btns = document.querySelectorAll('#typeSegmented .segmented-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-type');
      activateSegmentedBtn(type);
    });
  });
}

function activateSegmentedBtn(type) {
  const btns = document.querySelectorAll('#typeSegmented .segmented-btn');

  btns.forEach(btn => {
    btn.classList.remove('active', 'active--income', 'active--expense', 'active--transfer');
    if (btn.getAttribute('data-type') === type) {
      btn.classList.add('active');
      if (type === 'Pemasukan')   btn.classList.add('active--income');
      if (type === 'Pengeluaran') btn.classList.add('active--expense');
      if (type === 'Perpindahan') btn.classList.add('active--transfer');
    }
  });

  // Sync hidden select
  const jenisEl = document.getElementById('JenisTransaksi');
  if (jenisEl) {
    jenisEl.value = type;
    jenisEl.dispatchEvent(new Event('change'));
  }

  // Update form card accent border
  updateFormCardAccent(type);
}

function updateFormCardAccent(type) {
  const card = document.getElementById('formCard');
  if (!card) return;
  const colorMap = {
    'Pengeluaran': 'var(--expense)',
    'Pemasukan':   'var(--income)',
    'Perpindahan': 'var(--transfer)',
  };
  card.style.borderLeft = `4px solid ${colorMap[type] || 'var(--border)'}`;
}

/* ============================================================
   JENIS CHANGE HANDLER
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const jenisEl = document.getElementById('JenisTransaksi');
  if (jenisEl) {
    jenisEl.addEventListener('change', onJenisChange);
  }
});

function onJenisChange() {
  const jenisEl = document.getElementById('JenisTransaksi');
  if (!jenisEl) return;
  const jenis = jenisEl.value;

  // Save to hidden input
  setHidden('inputJenis', jenis);

  // Reset downstream
  resetSelect('keteranganDropdown', 'Pilih Kategori');
  resetSelect('enumDropdown', 'Pilih Sub Kategori');
  setHidden('inputKategori', '');
  setHidden('inputSubkategori', '');
  setHidden('inputSumber', '');

  hide('loanShow');
  hide('DataLain');

  const data = _dropdownData;
  if (!data) return;

  if (jenis === 'Perpindahan') {
    // Show manual sumber container, hide dropdown container
    show('inputSumberContainer');
    hide('dropdownSumberContainer');
    // Kategori = list of rekening (asal dana)
    if (Array.isArray(data.bySumber)) {
      populateSelect(document.getElementById('keteranganDropdown'), data.bySumber, 'Pilih Rekening Asal');
    }
  } else {
    // Normal: show dropdown sumber, hide manual
    hide('inputSumberContainer');
    show('dropdownSumberContainer');
    // Kategori = keys from byJenis[jenis]
    const kategoriList = (data.byJenis && data.byJenis[jenis]) ? data.byJenis[jenis] : [];
    populateSelect(document.getElementById('keteranganDropdown'), kategoriList, 'Pilih Kategori');
  }
}

/* ============================================================
   SUMBER CHANGE HANDLER (regular dropdown)
   ============================================================ */
function onSumberChange() {
  const sumberEl = document.getElementById('bySumber');
  if (!sumberEl) return;
  setHidden('inputSumber', sumberEl.value);
}

/* ============================================================
   KATEGORI CHANGE HANDLER
   ============================================================ */
function onKategoriChange() {
  const kategoriEl = document.getElementById('keteranganDropdown');
  if (!kategoriEl) return;
  const kategori = kategoriEl.value;

  setHidden('inputKategori', kategori);

  // Reset enum
  resetSelect('enumDropdown', 'Pilih Sub Kategori');
  setHidden('inputSubkategori', '');
  hide('loanShow');
  hide('DataLain');

  const data = _dropdownData;
  if (!data || !kategori) return;

  const jenis = document.getElementById('inputJenis').value;
  let subList = [];

  if (jenis === 'Perpindahan') {
    // enum = bySumber minus selected origin
    const asal = kategori;
    subList = (data.bySumber || []).filter(s => s !== asal);
  } else if (kategori === 'Tabungan') {
    subList = data.bySave || [];
  } else {
    subList = (data.byKelompok && data.byKelompok[kategori]) ? data.byKelompok[kategori] : [];
  }

  populateSelect(document.getElementById('enumDropdown'), subList, 'Pilih Sub Kategori');

  // Populate loan dropdown if data available
  populateLoanDropdown(data.byLoan);
}

/* ============================================================
   SUB-KATEGORI CHANGE HANDLER
   ============================================================ */
function onSubkategoriChange() {
  const enumEl = document.getElementById('enumDropdown');
  if (!enumEl) return;
  const subkat = enumEl.value;

  setHidden('inputSubkategori', subkat);

  const jenis   = document.getElementById('inputJenis').value;
  const kategori = document.getElementById('inputKategori').value;

  // For Perpindahan: manualSumberInput = asal rekening (inputKategori)
  if (jenis === 'Perpindahan') {
    const manualEl = document.getElementById('manualSumberInput');
    if (manualEl) manualEl.value = kategori;
    // inputSumber = tujuan (enumDropdown value)
    setHidden('inputSumber', subkat);
  }

  // Show extra date if subkategori = 'Pinjaman Pribadi'
  if (subkat === 'Pinjaman Pribadi') {
    show('DataLain');
  } else {
    hide('DataLain');
    document.getElementById('DataLainInput').value = '';
    setHidden('inputDataaLain', '');
  }

  // Show loan section if Pengeluaran and kategori contains hutang-related keywords
  const showLoan = jenis === 'Pengeluaran' &&
    (kategori.toLowerCase().includes('hutang') || kategori.toLowerCase().includes('pribadi'));
  if (showLoan) {
    show('loanShow');
  } else {
    hide('loanShow');
  }
}

/* ============================================================
   LOAN DROPDOWN
   ============================================================ */
function populateLoanDropdown(byLoan) {
  const loanEl = document.getElementById('loanDropdown');
  if (!loanEl || !Array.isArray(byLoan) || byLoan.length === 0) return;

  loanEl.innerHTML = '<option value="">Pilih Pinjaman</option>';
  byLoan.forEach(item => {
    const label = item.KeteranganLoan || JSON.stringify(item);
    const opt = document.createElement('option');
    opt.value = label;
    opt.textContent = label;
    loanEl.appendChild(opt);
  });
}

/* ============================================================
   FORM SUBMIT
   ============================================================ */
function setupFormSubmit() {
  const form = document.getElementById('dataForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validation
    const jenis     = document.getElementById('inputJenis').value.trim();
    const kategori  = document.getElementById('inputKategori').value.trim();
    const subkat    = document.getElementById('inputSubkategori').value.trim();
    const jumlahEl  = document.getElementById('jumlah');
    const jumlah    = jumlahEl ? jumlahEl.value.trim() : '';

    if (!jenis) {
      Utils.toast('Pilih jenis transaksi terlebih dahulu.', 'error');
      return;
    }
    if (!kategori) {
      Utils.toast('Pilih kategori terlebih dahulu.', 'error');
      return;
    }
    if (!subkat) {
      Utils.toast('Pilih sub kategori terlebih dahulu.', 'error');
      return;
    }
    if (!jumlah || Number(jumlah) <= 0) {
      Utils.toast('Masukkan jumlah yang valid.', 'error');
      return;
    }

    // Apply extra date if filled
    const dataLainInput = document.getElementById('DataLainInput');
    if (dataLainInput && dataLainInput.value) {
      setHidden('inputDataaLain', dataLainInput.value);
    }

    // For Perpindahan: ensure inputSumber = tujuan rekening (enum value)
    if (jenis === 'Perpindahan') {
      const tujuan = document.getElementById('enumDropdown').value;
      setHidden('inputSumber', tujuan);
    } else {
      // For Pemasukan/Pengeluaran: use bySumber dropdown value
      const sumberEl = document.getElementById('bySumber');
      if (sumberEl) setHidden('inputSumber', sumberEl.value);
    }

    setSubmitLoading(true);

    try {
      const formData = new FormData(form);
      const result = await API.post(formData);

      if (result && result.status === 'error') {
        throw new Error(result.message || 'Server error');
      }

      Utils.toast('Transaksi berhasil disimpan!', 'success');
      form.reset();
      resetHiddenDivs();
      resetHiddenInputs();

      // Re-activate default segmented button state
      activateSegmentedBtn('Pengeluaran');

      // Clear saved data cache so dashboard refreshes
      localStorage.removeItem(Config.KEYS.transactions);

    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan',
        text: API.errorMsg(err),
        confirmButtonColor: '#4F46E5',
        background: '#ffffff',
        customClass: { popup: 'swal-popup' },
      });
    } finally {
      setSubmitLoading(false);
    }
  });
}

/* ============================================================
   SUBMIT LOADING STATE
   ============================================================ */
function setSubmitLoading(loading) {
  const btn = document.getElementById('submitButton');
  if (!btn) return;
  btn.disabled = loading;
  if (loading) {
    btn.innerHTML = '<div class="spinner spinner--sm"></div> Menyimpan...';
  } else {
    btn.innerHTML = '<i class="las la-check-circle"></i> Simpan Transaksi';
  }
}

/* ============================================================
   HELPERS
   ============================================================ */
function populateSelect(el, items, placeholder) {
  if (!el) return;
  el.innerHTML = `<option value="">${placeholder || 'Pilih...'}</option>`;
  if (!Array.isArray(items)) return;
  items.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item;
    opt.textContent = item;
    el.appendChild(opt);
  });
}

function resetSelect(id, placeholder) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = `<option value="">${placeholder || 'Pilih...'}</option>`;
}

function setHidden(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

function show(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = '';
}

function hide(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

function resetHiddenDivs() {
  hide('loanShow');
  hide('DataLain');
  hide('inputSumberContainer');
  show('dropdownSumberContainer');
  const manualEl = document.getElementById('manualSumberInput');
  if (manualEl) manualEl.value = '';
  const dataLainInput = document.getElementById('DataLainInput');
  if (dataLainInput) dataLainInput.value = '';
}

function resetHiddenInputs() {
  ['inputJenis', 'inputKategori', 'inputSubkategori', 'inputSumber', 'inputDataaLain'].forEach(id => {
    setHidden(id, '');
  });
}

/* ============================================================
   ENTRY POINT
   ============================================================ */
document.addEventListener('DOMContentLoaded', initTransaksi);
