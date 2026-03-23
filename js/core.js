/**
 * core.js — E-FinMen Core Module v2.0
 * Config + API + Auth + Utils — satu file, tidak ada duplikasi.
 * 2026-03-22
 */

/* ============================================================
   CONFIG
   ============================================================ */
const Config = (() => {
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxX0U_DDwXQ9WjTlytdzk1O2ZJk2eu-7nivoCMBAlaZts0mCDvO3u2va-xV60Wi-bak_Q/exec';

  function getUrl() {
    const spid  = localStorage.getItem('spid')  || '';
    const id    = localStorage.getItem('id')    || '';
    const email = localStorage.getItem('email') || '';
    return `${SCRIPT_URL}?spid=${encodeURIComponent(spid)}&id=${encodeURIComponent(id)}&email=${encodeURIComponent(email)}`;
  }

  return {
    SCRIPT_URL,
    getUrl,

    DS: {
      account:      'accdta',
      transactions: 'resTrx',
      savingPlans:  'trgSave',
      dropdowns:    'bckdata',
      accountRek:   'DataAccRek',
    },

    KEYS: {
      user:        'user',
      id:          'id',
      email:       'email',
      spid:        'spid',
      transactions:'data',
      dropdowns:   'data-drop',
      savingPlans: 'saving_plan_Index',
      budgetData:  'budgetData',
    },

    RECENT_LIMIT: 10,
  };
})();


/* ============================================================
   API
   ============================================================ */
const API = (() => {
  async function get(dataset) {
    const url = `${Config.getUrl()}&dataset=${dataset}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data && data.values !== undefined) return data.values;
    if (data && data.value  !== undefined) return data.value;
    return data;
  }

  async function post(formData) {
    const res = await fetch(Config.getUrl(), {
      method: 'POST',
      body: formData,
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  function errorMsg(err) {
    if (!navigator.onLine) return 'Tidak ada koneksi internet.';
    if (err && err.name === 'TimeoutError') return 'Koneksi timeout. Coba lagi.';
    return 'Terjadi kesalahan. Periksa koneksi.';
  }

  return { get, post, errorMsg };
})();


/* ============================================================
   AUTH
   ============================================================ */
const Auth = (() => {
  function isLoggedIn() {
    return !!localStorage.getItem(Config.KEYS.user);
  }

  function guard() {
    if (!isLoggedIn()) {
      window.location.href = 'login.html';
      return false;
    }
    // Fill .user-name elements
    const name = localStorage.getItem(Config.KEYS.user) || '';
    document.querySelectorAll('.user-name').forEach(el => el.textContent = name);
    return true;
  }

  function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
  }

  function saveSession({ user, id, email, spid, dt }) {
    localStorage.setItem(Config.KEYS.user,  user);
    localStorage.setItem(Config.KEYS.id,    id);
    localStorage.setItem(Config.KEYS.email, email);
    localStorage.setItem(Config.KEYS.spid,  spid);
    if (dt) localStorage.setItem('dt', JSON.stringify(dt));
  }

  function bindLogout(selector = '#btnLogout') {
    document.querySelectorAll(selector).forEach(el => {
      el.addEventListener('click', e => { e.preventDefault(); logout(); });
    });
  }

  return { isLoggedIn, guard, logout, saveSession, bindLogout };
})();


/* ============================================================
   UTILS
   ============================================================ */
const Utils = (() => {

  // ── Format Rupiah (ringkas) ──
  function fRp(n) {
    n = Number(n);
    if (isNaN(n) || n === 0) return 'Rp 0';
    const abs = Math.abs(n);
    let str;
    if (abs >= 1_000_000_000) str = (abs / 1_000_000_000).toFixed(1) + 'M';
    else if (abs >= 1_000_000) str = (abs / 1_000_000).toFixed(1) + ' Jt';
    else if (abs >= 1_000)     str = (abs / 1_000).toFixed(1) + ' Rb';
    else                       str = abs.toString();
    return (n < 0 ? '-' : '') + 'Rp ' + str;
  }

  // ── Format Rupiah (penuh) ──
  function fRpFull(n) {
    n = Number(n);
    if (isNaN(n)) return 'Rp 0';
    return 'Rp ' + Math.abs(n).toLocaleString('id-ID');
  }

  // ── Format Tanggal ──
  function fDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  }

  function fDateShort(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' });
  }

  function fTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });
  }

  function fMonth(monthKey) {
    if (!monthKey) return '';
    const [y, m] = monthKey.split('-');
    return new Date(y, m - 1).toLocaleDateString('id-ID', { month:'long', year:'numeric' });
  }

  // ── XSS ──
  function esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }

  // ── Preloader ──
  function hidePreloader() {
    const el = document.querySelector('.preloader');
    if (el) {
      el.classList.add('hide');
      setTimeout(() => el.remove(), 450);
    }
  }

  // ── Loading overlay ──
  function setLoading(show) {
    let el = document.getElementById('loadingOverlay');
    if (!el) return;
    el.style.display = show ? 'flex' : 'none';
  }

  // ── Toast ──
  function toast(msg, type = 'info', duration = 3000) {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const icons = { success: 'la-check-circle', error: 'la-exclamation-circle', info: 'la-info-circle' };
    const colors = { success: 'var(--income)', error: 'var(--expense)', info: 'var(--indigo-500)' };

    const t = document.createElement('div');
    t.className = `toast toast--${type}`;
    t.innerHTML = `
      <i class="las ${icons[type] || icons.info}" style="color:${colors[type]};font-size:20px;"></i>
      <span class="toast__msg">${esc(msg)}</span>
    `;
    container.appendChild(t);

    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translateY(-8px)';
      t.style.transition = 'all 0.3s';
      setTimeout(() => t.remove(), 300);
    }, duration);
  }

  // ── Bottom Sheet ──
  function openSheet(sheetId, backdropId) {
    document.getElementById(backdropId || 'backdrop').classList.add('open');
    document.getElementById(sheetId).classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeSheet(sheetId, backdropId) {
    document.getElementById(backdropId || 'backdrop').classList.remove('open');
    document.getElementById(sheetId).classList.remove('open');
    document.body.style.overflow = '';
  }

  // ── Calculate summary from transactions ──
  function calcSummary(data) {
    if (!Array.isArray(data)) return { pemasukan:0, pengeluaran:0, tabungan:0, saldo:0 };
    return data.reduce((s, item) => {
      const n = Number(item.jumlah) || 0;
      if (item.jenis === 'Pemasukan')   { s.pemasukan   += n; s.saldo += n; }
      if (item.jenis === 'Pengeluaran') { s.pengeluaran += n; s.saldo -= n; }
      if (item.kategori === 'Tabungan') { s.tabungan    += n; }
      return s;
    }, { pemasukan:0, pengeluaran:0, tabungan:0, saldo:0 });
  }

  // ── Group transactions by date ──
  function groupByDate(trx) {
    const sorted = [...trx].sort((a,b) => new Date(b.tanggal) - new Date(a.tanggal));
    const groups = {};
    sorted.forEach(t => {
      const key = fDate(t.tanggal);
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });
    return groups;
  }

  // ── Get category icon ──
  function getCategoryIcon(kategori) {
    const map = {
      'makanan':           'la-utensils',
      'transportasi':      'la-car',
      'hiburan':           'la-film',
      'belanja':           'la-shopping-bag',
      'kesehatan':         'la-heartbeat',
      'pendidikan':        'la-graduation-cap',
      'tagihan':           'la-file-invoice',
      'tabungan':          'la-piggy-bank',
      'investasi':         'la-chart-line',
      'gaji':              'la-money-bill',
      'lainnya':           'la-ellipsis-h',
    };
    const k = (kategori || '').toLowerCase();
    for (const [key, icon] of Object.entries(map)) {
      if (k.includes(key)) return icon;
    }
    return 'la-exchange-alt';
  }

  // ── Get transaction type CSS class ──
  function getTrxClass(jenis, kategori) {
    if (jenis === 'Pemasukan')    return 'income';
    if (jenis === 'Pengeluaran') {
      if ((kategori || '').toLowerCase() === 'tabungan') return 'saving';
      return 'expense';
    }
    if (jenis === 'Perpindahan')  return 'transfer';
    return 'expense';
  }

  return {
    fRp, fRpFull, fDate, fDateShort, fTime, fMonth,
    esc, hidePreloader, setLoading, toast,
    openSheet, closeSheet,
    calcSummary, groupByDate, getCategoryIcon, getTrxClass
  };
})();
