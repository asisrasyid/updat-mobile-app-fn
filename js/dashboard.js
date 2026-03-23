/**
 * dashboard.js — E-FinMen Dashboard Page Logic v2.0
 * Uses Config, API, Auth, Utils from core.js (loaded before this file).
 * 2026-03-22
 */

/* ============================================================
   INIT
   ============================================================ */
function initDashboard() {
  if (!Auth.guard()) return;

  Auth.bindLogout('#btnLogout');

  document.getElementById('btnRefresh').addEventListener('click', loadAll);

  // Scroll listener: make header opaque when scrolled
  window.addEventListener('scroll', () => {
    const header = document.getElementById('appHeader');
    if (!header) return;
    if (window.scrollY > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, { passive: true });

  // Detail sheet close
  document.getElementById('closeDetailSheet').addEventListener('click', () => {
    Utils.closeSheet('detailSheet', 'backdropDetail');
  });
  document.getElementById('backdropDetail').addEventListener('click', () => {
    Utils.closeSheet('detailSheet', 'backdropDetail');
  });

  loadAll();
}

/* ============================================================
   LOAD ALL
   ============================================================ */
async function loadAll() {
  Utils.setLoading(true);

  try {
    const [transactions, savingPlans, accounts, dropdowns] = await Promise.all([
      API.get(Config.DS.transactions),
      API.get(Config.DS.savingPlans),
      API.get(Config.DS.accountRek),
      API.get(Config.DS.dropdowns),
    ]);

    // Cache transactions
    const trxArray = Array.isArray(transactions) ? transactions : [];
    localStorage.setItem(Config.KEYS.transactions, JSON.stringify(trxArray));

    renderSummary(trxArray);
    renderAccounts(Array.isArray(accounts) ? accounts : []);
    renderLoans(dropdowns || {});
    renderSavings(Array.isArray(savingPlans) ? savingPlans : []);
    renderDistribution(trxArray);
    renderTrend(trxArray);
    renderRecent(trxArray);

  } catch (err) {
    Utils.toast(API.errorMsg(err), 'error');
  } finally {
    Utils.setLoading(false);
    Utils.hidePreloader();
  }
}

/* ============================================================
   RENDER SUMMARY
   ============================================================ */
function renderSummary(transactions) {
  const s = Utils.calcSummary(transactions);

  // Hero balance
  _setText('heroBalance', Utils.fRp(s.saldo));

  // Stat-grid values (canonical IDs per spec)
  _setText('totalPemasukan',  Utils.fRp(s.pemasukan));
  _setText('totalPengeluaran', Utils.fRp(s.pengeluaran));
  _setText('totalTabungan',   Utils.fRp(s.tabungan));
  _setText('sisaBudget',      Utils.fRp(s.saldo));

  // Hero pill values (separate IDs to avoid duplicates)
  _setText('heroPemasukan',   Utils.fRp(s.pemasukan));
  _setText('heroPengeluaran', Utils.fRp(s.pengeluaran));
  _setText('heroTabungan',    Utils.fRp(s.tabungan));
}

function _setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

/* ============================================================
   RENDER ACCOUNTS
   ============================================================ */
function renderAccounts(data) {
  const container = document.getElementById('accountScroll');
  if (!container) return;

  if (!data || data.length === 0) {
    container.innerHTML = `<div class="empty" style="padding:var(--sp-8) var(--sp-6);">
      <div class="empty__icon"><i class="las la-credit-card"></i></div>
      <div class="empty__title">Belum ada rekening</div>
    </div>`;
    return;
  }

  const variants = ['', '--emerald', '--amber', '--rose', '--sky'];

  container.innerHTML = data.map((acc, i) => {
    const variant = variants[i % variants.length];
    const cls = variant ? `account-card account-card${variant}` : 'account-card';
    return `
      <div class="${Utils.esc(cls)}">
        <div class="account-card__name">${Utils.esc(acc.Keterangan || 'Rekening')}</div>
        <div class="account-card__balance">${Utils.fRp(acc.Nilai || 0)}</div>
        <div class="account-card__flow">
          <div class="account-card__flow-item">
            <span>+${Utils.fRp(acc.Pemasukan || 0)}</span>
            Masuk
          </div>
          <div class="account-card__flow-item">
            <span>-${Utils.fRp(acc.Pengeluaran || 0)}</span>
            Keluar
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/* ============================================================
   RENDER LOANS
   ============================================================ */
function renderLoans(data) {
  const container = document.getElementById('loanList');
  if (!container) return;

  const loans = Array.isArray(data.byLoan) ? data.byLoan : [];
  const active = loans.filter(item => {
    return item.status && item.status.toLowerCase() === 'belum lunas';
  });

  if (active.length === 0) {
    container.innerHTML = `
      <div class="empty" style="padding:var(--sp-6);">
        <div class="empty__icon"><i class="las la-handshake"></i></div>
        <div class="empty__title">Tidak ada hutang/piutang aktif</div>
        <div class="empty__desc">Semua sudah lunas</div>
      </div>
    `;
    return;
  }

  container.innerHTML = active.map(item => {
    const isHutang = (item.jenis || '').toLowerCase() === 'hutang';
    const iconClass = isHutang ? 'la-arrow-up' : 'la-arrow-down';
    const typeClass = isHutang ? 'hutang' : 'piutang';
    const badgeClass = isHutang ? 'badge--expense' : 'badge--income';
    const label = isHutang ? 'Hutang' : 'Piutang';

    return `
      <div class="loan-item">
        <div class="loan-item__icon loan-item__icon--${Utils.esc(typeClass)}">
          <i class="las ${iconClass}"></i>
        </div>
        <div class="loan-item__info">
          <div class="loan-item__name">${Utils.esc(item.KeteranganLoan || '-')}</div>
          <div class="loan-item__type">
            <span class="badge ${Utils.esc(badgeClass)}">${label}</span>
          </div>
        </div>
        <div class="loan-item__amount loan-item__amount--${Utils.esc(typeClass)}">
          ${Utils.fRp(item.nilaiHutang || 0)}
        </div>
      </div>
    `;
  }).join('');
}

/* ============================================================
   RENDER SAVINGS
   ============================================================ */
function renderSavings(data) {
  const container = document.getElementById('savingList');
  if (!container) return;

  if (!data || data.length === 0) {
    container.innerHTML = `
      <div class="empty">
        <div class="empty__icon"><i class="las la-piggy-bank"></i></div>
        <div class="empty__title">Belum ada target tabungan</div>
        <div class="empty__desc">Tambahkan target tabungan pertama kamu</div>
      </div>
    `;
    return;
  }

  const list = data.slice(0, 3);

  container.innerHTML = list.map(plan => {
    const pct = Math.min(Number(plan.persen_tercapai) || 0, 100);
    const target = Number(plan.target_nominal) || 0;
    const collected = (pct * target) / 100;

    let fillClass = 'progress-fill--expense';
    if (pct >= 80) fillClass = 'progress-fill--income';
    else if (pct >= 50) fillClass = 'progress-fill--saving';

    return `
      <div class="saving-card">
        <div class="saving-card__header">
          <div class="saving-card__title">${Utils.esc(plan.judul || 'Target')}</div>
          <div class="saving-card__pct">${pct.toFixed(0)}%</div>
        </div>
        <div class="progress-track">
          <div class="progress-fill ${fillClass}" style="width:${pct}%;"></div>
        </div>
        <div class="saving-card__amounts">
          <span class="saving-card__collected">${Utils.fRp(collected)}</span>
          <span class="saving-card__target">dari ${Utils.fRp(target)}</span>
        </div>
      </div>
    `;
  }).join('');
}

/* ============================================================
   RENDER DISTRIBUTION
   ============================================================ */
function renderDistribution(transactions) {
  const container = document.getElementById('distContainer');
  if (!container) return;

  const expenses = (transactions || []).filter(t => t.jenis === 'Pengeluaran');

  if (expenses.length === 0) {
    container.innerHTML = `
      <div class="empty">
        <div class="empty__icon"><i class="las la-chart-pie"></i></div>
        <div class="empty__title">Belum ada pengeluaran</div>
      </div>
    `;
    return;
  }

  // Group by kategori, sum jumlah
  const grouped = {};
  expenses.forEach(t => {
    const cat = t.kategori || 'Lainnya';
    grouped[cat] = (grouped[cat] || 0) + (Number(t.jumlah) || 0);
  });

  // Sort desc, top 6
  const sorted = Object.entries(grouped)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const total = sorted.reduce((sum, [, v]) => sum + v, 0);
  const colors = ['#FF4F6E', '#FFB800', '#6366F1', '#10D9A0', '#38BDF8', '#F59E0B'];

  container.innerHTML = sorted.map(([cat, amount], i) => {
    const pct = total > 0 ? ((amount / total) * 100).toFixed(1) : '0.0';
    const color = colors[i % colors.length];

    return `
      <div class="dist-item" data-kategori="${Utils.esc(cat)}">
        <div class="dist-item__color" style="background:${color};"></div>
        <div class="dist-item__info">
          <div class="dist-item__name">${Utils.esc(cat)}</div>
          <div class="dist-item__bar-row">
            <div class="progress-track" style="flex:1;height:5px;">
              <div class="progress-fill" style="width:${pct}%;background:${color};"></div>
            </div>
            <div class="dist-item__pct">${pct}%</div>
          </div>
        </div>
        <div class="dist-item__right">
          <div class="dist-item__amount">${Utils.fRp(amount)}</div>
        </div>
      </div>
    `;
  }).join('');

  // Click to open detail sheet
  container.querySelectorAll('.dist-item').forEach(el => {
    el.addEventListener('click', () => {
      const kategori = el.dataset.kategori;
      openDetailSheet(kategori, expenses);
    });
  });
}

/* ============================================================
   RENDER TREND
   ============================================================ */
function renderTrend(transactions) {
  const container = document.getElementById('trendList');
  if (!container) return;

  if (!transactions || transactions.length === 0) {
    container.innerHTML = `
      <div class="empty">
        <div class="empty__icon"><i class="las la-chart-bar"></i></div>
        <div class="empty__title">Belum ada data tren</div>
      </div>
    `;
    return;
  }

  // Build last 6 month keys
  const now = new Date();
  const monthKeys = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthKeys.push(`${d.getFullYear()}-${d.getMonth() + 1}`);
  }

  // Group transactions by month
  const byMonth = {};
  (transactions || []).forEach(t => {
    if (!t.tanggal) return;
    const d = new Date(t.tanggal);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    if (!byMonth[key]) byMonth[key] = { pemasukan: 0, pengeluaran: 0 };
    const n = Number(t.jumlah) || 0;
    if (t.jenis === 'Pemasukan')   byMonth[key].pemasukan   += n;
    if (t.jenis === 'Pengeluaran') byMonth[key].pengeluaran += n;
  });

  // Find max value for proportional bars
  let maxVal = 0;
  monthKeys.forEach(key => {
    const m = byMonth[key] || { pemasukan: 0, pengeluaran: 0 };
    if (m.pemasukan   > maxVal) maxVal = m.pemasukan;
    if (m.pengeluaran > maxVal) maxVal = m.pengeluaran;
  });
  if (maxVal === 0) maxVal = 1;

  container.innerHTML = monthKeys.map(key => {
    const m = byMonth[key] || { pemasukan: 0, pengeluaran: 0 };
    const incPct = Math.round((m.pemasukan   / maxVal) * 100);
    const expPct = Math.round((m.pengeluaran / maxVal) * 100);
    const balance = m.pemasukan - m.pengeluaran;
    const balClass = balance >= 0 ? 'trend-item__balance--surplus' : 'trend-item__balance--deficit';
    const balPrefix = balance >= 0 ? '+' : '';

    return `
      <div class="trend-item">
        <div class="trend-item__month">${Utils.fMonth(key)}</div>
        <div class="trend-item__bars">
          <div class="trend-item__bar-row">
            <div class="trend-item__bar-label text-xs" style="color:var(--income);">In</div>
            <div class="trend-item__bar-track">
              <div class="trend-item__bar-fill trend-item__bar-fill--income" style="width:${incPct}%;"></div>
            </div>
          </div>
          <div class="trend-item__bar-row">
            <div class="trend-item__bar-label text-xs" style="color:var(--expense);">Out</div>
            <div class="trend-item__bar-track">
              <div class="trend-item__bar-fill trend-item__bar-fill--expense" style="width:${expPct}%;"></div>
            </div>
          </div>
        </div>
        <div class="trend-item__balance ${balClass}">${balPrefix}${Utils.fRp(balance)}</div>
      </div>
    `;
  }).join('');
}

/* ============================================================
   RENDER RECENT TRANSACTIONS
   ============================================================ */
function renderRecent(transactions) {
  const container = document.getElementById('recentList');
  if (!container) return;

  if (!transactions || transactions.length === 0) {
    container.innerHTML = `
      <div class="empty">
        <div class="empty__icon"><i class="las la-exchange-alt"></i></div>
        <div class="empty__title">Belum ada transaksi</div>
        <div class="empty__desc">Tambah transaksi pertama kamu sekarang</div>
      </div>
    `;
    return;
  }

  const recent = [...transactions]
    .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
    .slice(0, Config.RECENT_LIMIT);

  const groups = Utils.groupByDate(recent);

  container.innerHTML = Object.entries(groups).map(([dateLabel, trxList]) => {
    const items = trxList.map(t => renderTrxItem(t)).join('');
    return `
      <div class="trx-date">${Utils.esc(dateLabel)}</div>
      ${items}
    `;
  }).join('');
}

/* ============================================================
   RENDER TRX ITEM
   ============================================================ */
function renderTrxItem(t) {
  const cls      = Utils.getTrxClass(t.jenis, t.kategori);
  const icon     = Utils.getCategoryIcon(t.kategori);
  const title    = t.keterangan || t.kategori || '-';
  const sub      = (t.kategori || '') + (t.subKategori ? ' / ' + t.subKategori : '');
  const prefix   = t.jenis === 'Pemasukan' ? '+' : '-';
  const time     = Utils.fTime(t.tanggal);

  return `
    <div class="trx-item">
      <div class="trx-item__icon trx-item__icon--${Utils.esc(cls)}">
        <i class="las ${Utils.esc(icon)}"></i>
      </div>
      <div class="trx-item__info">
        <div class="trx-item__title">${Utils.esc(title)}</div>
        <div class="trx-item__sub">${Utils.esc(sub)}</div>
      </div>
      <div class="trx-item__right">
        <div class="trx-item__amount trx-item__amount--${Utils.esc(cls)}">${prefix}${Utils.fRp(t.jumlah)}</div>
        ${time ? `<div class="trx-item__time">${Utils.esc(time)}</div>` : ''}
      </div>
    </div>
  `;
}

/* ============================================================
   DETAIL SHEET
   ============================================================ */
function openDetailSheet(kategori, transactions) {
  const titleEl   = document.getElementById('detailSheetTitle');
  const contentEl = document.getElementById('detailContent');
  if (!titleEl || !contentEl) return;

  titleEl.textContent = kategori;

  const filtered = (transactions || []).filter(t => t.kategori === kategori)
    .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

  if (filtered.length === 0) {
    contentEl.innerHTML = `
      <div class="empty">
        <div class="empty__icon"><i class="las la-inbox"></i></div>
        <div class="empty__title">Tidak ada transaksi</div>
      </div>
    `;
  } else {
    contentEl.innerHTML = `<div class="detail-list">${filtered.map(t => renderTrxItem(t)).join('')}</div>`;
  }

  Utils.openSheet('detailSheet', 'backdropDetail');
}

/* ============================================================
   BOOT
   ============================================================ */
document.addEventListener('DOMContentLoaded', initDashboard);
