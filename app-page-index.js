/**
 * Financial Dashboard Application
 * This script handles data fetching, visualization, and interaction for a financial tracking dashboard.
 */

// ==========================================
// Configuration and Globals
// ==========================================
const spid = localStorage.getItem('spid');
const id = localStorage.getItem('id');
const email = localStorage.getItem('email');

const SPREADSHEET_URL = `https://script.google.com/macros/s/AKfycbxX0U_DDwXQ9WjTlytdzk1O2ZJk2eu-7nivoCMBAlaZts0mCDvO3u2va-xV60Wi-bak_Q/exec?spid=${spid}&id=${id}&email=${email}`;
const CONFIG = {
  urls: {
    base: `${SPREADSHEET_URL}&dataset=`,
    account: "accdta",
    transactions: "resTrx",
    savingPlans: "trgSave",
    loanData: "bckdata",
    accountData: "DataAccRek"
  },
  refreshInterval: 300000, // 5 minutes
  colorClasses: ['card-color-1', 'card-color-2', 'card-color-3', 'card-color-4', 'card-color-5'],
  textClasses: ['text-color-1', 'text-color-2', 'text-color-3', 'text-color-4', 'text-color-5'],
  categoryIcons: {
    'makanan': 'las la-utensils',
    'transportasi': 'las la-car',
    'hiburan': 'las la-film',
    'belanja': 'las la-shopping-bag',
    'utilitas': 'las la-lightbulb',
    'gaji': 'las la-money-bill',
    'freelance': 'las la-laptop',
    'investasi': 'las la-chart-line',
    'tabungan': 'las la-piggy-bank',
    'lainnya': 'las la-ellipsis-h'
  }
};

// ==========================================
// Application Initialization
// ==========================================

/**
 * Initialize the application
 * Sets up event listeners and loads initial data
 */
function initializeApp() {
  checkAuthentication();
  setupEventListeners();
  loadDashboardData().then(() => {
    hidePreloader();
  });
}

/**
 * Check if user is authenticated
 * Redirects to login page if not authenticated
 */
function checkAuthentication() {
  const savedUser = localStorage.getItem('user');
  const outputElements = document.querySelectorAll('.output');
  
  if (savedUser) {
    outputElements.forEach(el => el.textContent = savedUser);
    loadBudgetProgress();
  } else {
    window.location.href = "login.html";
  }
}

/**
 * Setup all event listeners for the application
 */
function setupEventListeners() {
  // Core functionality event listeners
  document.getElementById("LogOutSistem").addEventListener("click", logoutUser);
  document.getElementById("pembahruandata").addEventListener("click", refreshSavingPlans);
  
  // Category detail listeners
  const distributionElement = document.querySelector('.Pengeluaran-distribution');
  if (distributionElement) {
    distributionElement.addEventListener('click', function(e) {
      if (e.target && e.target.classList.contains('data-trnswhose')) {
        handleCategoryClick(e.target);
      }
    });
  }
  
  // Set auto-refresh interval
  setInterval(updateTransactionData, CONFIG.refreshInterval);
}

/**
 * Handle logout action
 * @param {Event} e - Click event
 */
function logoutUser(e) {
  e.preventDefault();
  localStorage.clear();
  window.location.href = "index.html";
}

/**
 * Handle category button click to show transaction details
 * @param {HTMLElement} target - The clicked element
 */
function handleCategoryClick(target) {
  const dataValue = target.getAttribute('data-value');
  const datadetail = JSON.parse(localStorage.getItem('data'));
  document.getElementById('juduldetail').innerText = dataValue;

  if (datadetail && Array.isArray(datadetail)) {
    // Filter transactions by category
    const transactionDetail = datadetail.filter(item => item.kategori === dataValue);
    
    if (transactionDetail.length > 0) {
      displayTransactions(transactionDetail);
      // Show the modal after content is loaded
      setTimeout(() => {
        const sidebarModal = new bootstrap.Modal(document.getElementById('sidebarModal'));
        sidebarModal.show();
      }, 100);
    } else {
      console.error("No transactions match category: " + dataValue);
    }
  } else {
    console.error("Transaction data not found or invalid in localStorage");
  }
}

// ==========================================
// Data Fetching Functions
// ==========================================

/**
 * Fetch data from the API
 * @param {string} endpoint - API endpoint to fetch from
 * @return {Promise<Array>} - Promise resolving to the fetched data
 */
async function fetchData(endpoint) {
  const url = `${CONFIG.urls.base}${endpoint}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data && data.values) {
      return data.values;
    } else if (data && data.value) {
      return data.value;
    } else {
      return data;
    }
  } catch (error) {
    window.location.href = "login.html";
    console.error(`Failed to fetch ${endpoint} data:`, error);
    return [];
  }
}

/**
 * Load all dashboard data
 */
async function loadDashboardData() {
  await Promise.all([
    updateTransactionData(),
    loadSavingPlans(),
    loadAccountData(),
    loadLoanData()
  ]);
}

/**
 * Fetch and update transaction data
 */
async function updateTransactionData() {
  const transactionData = await fetchData(CONFIG.urls.transactions);
  localStorage.setItem('data', JSON.stringify(transactionData));
  
  if (!Array.isArray(transactionData)) {
    console.error('Transaction data must be an array:', transactionData);
    return;
  }
  
  const summary = calculateSummary(transactionData);
  const chartData = processChartData(transactionData);
  const recentTransactions = getRecentTransactions(transactionData);
  
  updateSummaryCards(summary);
  updateCharts(chartData);
  updateRecentTransactions(recentTransactions);
}

/**
 * Fetch and display account data
 */
async function loadAccountData() {
  const accountData = await fetchData(CONFIG.urls.accountData);
  displayAccountData(accountData);
}

/**
 * Fetch and display loan data
 */
async function loadLoanData() {
  const data = await fetchData(CONFIG.urls.loanData);
  displayLoanData(data.byLoan);
}

/**
 * Fetch and display saving plans
 */
async function loadSavingPlans() {
  const savingPlans = await fetchData(CONFIG.urls.savingPlans);
  displaySavingPlans(savingPlans);
}

/**
 * Refresh saving plans data and reload the page
 * @param {Event} event - Click event
 */
async function refreshSavingPlans(event) {
  event.preventDefault();
  document.getElementById("loadingOverlay").style.display = "flex";
  
  try {
    const savingPlans = await fetchData(CONFIG.urls.savingPlans);
    localStorage.setItem('saving_plan_Index', JSON.stringify(savingPlans));
    window.location.reload();
  } catch (error) {
    console.error('Failed to refresh saving plans:', error);
    document.getElementById("loadingOverlay").style.display = "none";
  }
}

// ==========================================
// Data Processing Functions
// ==========================================

/**
 * Calculate financial summary from transaction data
 * @param {Array} data - Transaction data
 * @return {Object} - Summary of financial data
 */
function calculateSummary(data) {
  if (!Array.isArray(data)) {
    console.error('Data must be an array:', data);
    return {
      totalPemasukan: 0,
      totalPengeluaran: 0,
      totalTabungan: 0,
      sisaBudget: 0
    };
  }

  return {
    totalPemasukan: data.reduce((sum, item) => 
      item.jenis === 'Pemasukan' ? sum + (Number(item.jumlah) || 0) : sum, 0),
    totalPengeluaran: data.reduce((sum, item) => 
      item.jenis === 'Pengeluaran' ? sum + (Number(item.jumlah) || 0) : sum, 0),
    totalTabungan: data.reduce((sum, item) => 
      item.kategori === 'Tabungan' ? sum + (Number(item.jumlah) || 0) : sum, 0),
    sisaBudget: data.reduce((sum, item) => {
      if (item.jenis === 'Pemasukan') return sum + (Number(item.jumlah) || 0);
      if (item.jenis === 'Pengeluaran') return sum - (Number(item.jumlah) || 0);
      return sum;
    }, 0)
  };
}

/**
 * Process transaction data for charts
 * @param {Array} data - Transaction data
 * @return {Object} - Processed data for charts
 */
function processChartData(data) {
  if (!Array.isArray(data)) {
    console.error('Data must be an array:', data);
    return {
      categories: [],
      amounts: [],
      months: [],
      Pemasukan: [],
      Pengeluaran: []
    };
  }

  const categories = {};
  const months = {};
  
  data.forEach(item => {
    // Process category data
    if (item.jenis === 'Pengeluaran') {
      if (!categories[item.kategori]) {
        categories[item.kategori] = 0;
      }
      categories[item.kategori] += Number(item.jumlah) || 0;
    }
    
    // Process monthly data
    const date = new Date(item.tanggal);
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
    if (!months[monthKey]) {
      months[monthKey] = { Pemasukan: 0, Pengeluaran: 0 };
    }
    if (item.jenis === 'Pemasukan') {
      months[monthKey].Pemasukan += Number(item.jumlah) || 0;
    } else if (item.jenis === 'Pengeluaran') {
      months[monthKey].Pengeluaran += Number(item.jumlah) || 0;
    }
  });

  // If no transaction data, use dummy data
  if (Object.keys(categories).length === 0) {
    return {
      categories: ['Makanan', 'Transportasi', 'Hiburan', 'Belanja', 'Utilitas', 'Lainnya'],
      amounts: [2500000, 1500000, 1000000, 2000000, 1000000, 500000],
      months: ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06'],
      Pemasukan: [12000000, 13500000, 12800000, 14200000, 15000000, 15000000],
      Pengeluaran: [7500000, 8200000, 7800000, 8900000, 8200000, 8500000]
    };
  }

  // Convert to sorted arrays
  const sortedMonths = Object.keys(months).sort();
  
  return {
    categories: Object.keys(categories),
    amounts: Object.values(categories),
    months: sortedMonths,
    Pemasukan: sortedMonths.map(key => months[key].Pemasukan),
    Pengeluaran: sortedMonths.map(key => months[key].Pengeluaran)
  };
}

/**
 * Get recent transactions
 * @param {Array} data - Transaction data
 * @return {Array} - Recent transactions sorted by date
 */
function getRecentTransactions(data) {
  return data
    .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
    .slice(0, 10);
}

/**
 * Filter transactions based on type and period
 * @param {Array} transactions - Transaction data
 * @return {Array} - Filtered transactions
 */
function filterTransactions(transactions) {
  // Filter by type
  const typeFilter = document.querySelector('.filter-btn.active').dataset.type;
  let filtered = transactions;
  
  if (typeFilter !== 'all') {
    filtered = transactions.filter(item => item.jenis === typeFilter);
  }
  
  // Filter by period
  const periodFilter = document.getElementById('periodFilter').value;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  switch (periodFilter) {
    case 'today':
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.tanggal);
        itemDate.setHours(0, 0, 0, 0);
        return itemDate.getTime() === today.getTime();
      });
      break;
    case 'week':
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.tanggal);
        return itemDate >= weekAgo && itemDate <= today;
      });
      break;
    case 'month':
      const monthFilter = document.getElementById('monthFilter');
      const yearFilter = document.getElementById('yearFilter');
      
      if (monthFilter.style.display !== 'none') {
        const selectedMonth = parseInt(monthFilter.value) - 1; // 0-based month
        const selectedYear = parseInt(yearFilter.value);
        
        filtered = filtered.filter(item => {
          const itemDate = new Date(item.tanggal);
          return itemDate.getMonth() === selectedMonth && itemDate.getFullYear() === selectedYear;
        });
      } else {
        // Current month
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        filtered = filtered.filter(item => {
          const itemDate = new Date(item.tanggal);
          return itemDate >= firstDayOfMonth && itemDate <= lastDayOfMonth;
        });
      }
      break;
    case 'year':
      const selectedYear = parseInt(document.getElementById('yearFilter').value);
      
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.tanggal);
        return itemDate.getFullYear() === selectedYear;
      });
      break;
  }
  
  return filtered;
}

/**
 * Group transactions by date
 * @param {Array} transactions - Transaction data
 * @return {Object} - Transactions grouped by date
 */
function groupTransactionsByDate(transactions) {
  const grouped = {};

  // Sort transactions by date (newest first)
  const sortedTransactions = transactions.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

  // Group transactions by date
  sortedTransactions.forEach(transaction => {
    const dateStr = formatDate(transaction.tanggal);
    
    if (!grouped[dateStr]) {
      grouped[dateStr] = [];
    }
    
    grouped[dateStr].push(transaction);
  });

  return grouped;
}

// ==========================================
// UI Update Functions
// ==========================================

/**
 * Update summary cards with calculated data
 * @param {Object} summary - Financial summary data
 */
function updateSummaryCards(summary) {
  document.getElementById('totalPemasukan').textContent = formatRupiah(summary.totalPemasukan);
  document.getElementById('totalPengeluaran').textContent = formatRupiah(summary.totalPengeluaran);
  document.getElementById('totalTabungan').textContent = formatRupiah(summary.totalTabungan);
  document.getElementById('sisaBudget').textContent = formatRupiah(summary.sisaBudget);
}

/**
 * Update all charts with processed data
 * @param {Object} chartData - Processed chart data
 */
function updateCharts(chartData) {
  updateExpenseDistribution(chartData);
  updateFinancialTrends(chartData);
}

/**
 * Update expense distribution visualization
 * @param {Object} chartData - Chart data containing categories and amounts
 */
function updateExpenseDistribution(chartData) {
  const distributionElement = document.querySelector('.Pengeluaran-distribution');
  if (!distributionElement) return;
  
  distributionElement.innerHTML = '';
  
  const totalPengeluaran = chartData.amounts.reduce((sum, amount) => sum + amount, 0);
  
  chartData.categories.forEach((category, index) => {
    const amount = chartData.amounts[index];
    const percentage = ((amount / totalPengeluaran) * 100).toFixed(1);
    
    // Determine the icon and color based on category
    let iconColor = 'text-secondary';
    
    switch(category.toLowerCase()) {
      case 'makanan':
        iconColor = 'text-primary';
        break;
      case 'transportasi':
        iconColor = 'text-success';
        break;
      case 'hiburan':
        iconColor = 'text-info';
        break;
      case 'perlengkapan rumah':
        iconColor = 'text-warning';
        break;
      case 'hutang-pengeluaran':
        iconColor = 'text-danger';
        break;
    }
    
    const expenseItem = document.createElement('div');
    expenseItem.className = 'Pengeluaran-item mb-3';
    expenseItem.innerHTML = `
      <div class="data-trnswhose d-flex justify-content-between align-items-center mb-1">
        <div class="d-flex align-items-center">
          <span class="fw-bold">${category}</span>
        </div>
        <span class="text-dark">${formatRupiah(amount)}</span>
      </div>
      <div class="progress" style="height: 8px;">
        <div class="progress-bar ${iconColor.replace('text-', 'bg-')}" 
             role="progressbar" 
             style="width: ${percentage}%" 
             aria-valuenow="${percentage}" 
             aria-valuemin="0" 
             aria-valuemax="100">
        </div>
      </div>
      <div class="d-flex justify-content-between mt-1">
        <small class="text-muted">${percentage}% dari total</small>
        <button class="data-trnswhose btn btn-sm btn-primary" data-value="${category}">Detail</button>
      </div>
    `;
    
    distributionElement.appendChild(expenseItem);
  });
}

/**
 * Update financial trends visualization
 * @param {Object} chartData - Chart data containing monthly information
 */
function updateFinancialTrends(chartData) {
  const trendList = document.querySelector('.trend-list');
  if (!trendList) return;
  
  trendList.innerHTML = '';
  
  // Combine income and expense data
  const trendData = chartData.months.map((month, index) => ({
    month: month,
    Pemasukan: chartData.Pemasukan[index],
    Pengeluaran: chartData.Pengeluaran[index],
    balance: chartData.Pemasukan[index] - chartData.Pengeluaran[index]
  }));

  // Display trend data
  trendData.forEach(item => {
    const trendItem = document.createElement('div');
    trendItem.className = 'trend-item';
    
    const monthName = formatMonthName(item.month);
    const balanceClass = item.balance >= 0 ? 'Pemasukan' : 'Pengeluaran';
    
    trendItem.innerHTML = `
      <div class="trend-header">
        <span class="trend-date">${monthName}</span>
        <span class="trend-amount ${balanceClass}">
          ${formatRupiah(Math.abs(item.balance))}
          ${item.balance >= 0 ? '(Surplus)' : '(Defisit)'}
        </span>
      </div>
      <div class="trend-details mb-2">
          <span class="trend-category">Pemasukan: ${formatRupiah(item.Pemasukan)}</span>
      </div>
      <div class="trend-details">
          <span class="trend-category text-danger">Pengeluaran: ${formatRupiah(item.Pengeluaran)}</span>
      </div>
    `;
    
    trendList.appendChild(trendItem);
  });
}

/**
 * Display recent transactions on the dashboard
 * @param {Array} transactions - Recent transaction data
 */
function updateRecentTransactions(transactions) {
  const container = document.getElementById('recentTransactions');
  if (!container) return;
  
  container.innerHTML = '';
  
  // Use the grouped transactions helper function
  const groupedTransactions = groupTransactionsByDate(transactions);

  // Display grouped transactions
  Object.entries(groupedTransactions).forEach(([date, dayTransactions]) => {
    const dateGroup = document.createElement('div');
    dateGroup.className = 'mb-3';
    
    // Add date header
    const dateHeader = document.createElement('div');
    dateHeader.className = 'transaction-date mb-2';
    dateHeader.textContent = date;
    dateGroup.appendChild(dateHeader);

    // Add transactions for that date
    dayTransactions.forEach(transaction => {
      const card = createTransactionCard(transaction);
      dateGroup.appendChild(card);
    });

    container.appendChild(dateGroup);
  });
}

/**
 * Display saving plans
 * @param {Array} data - Saving plans data
 */
function displaySavingPlans(data) {
  const container = document.getElementById('data-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  const top3 = data.slice(0, 3);
  top3.forEach(item => {
    const el = document.createElement('div');
    el.className = 'd-flex align-items-center flex-wrap';
    el.innerHTML = `
      <div class="cart_cont">
        <a href="product-view.html"><h5>${item.judul}</h5></a>
      </div>
      <div class="page-wrap">  
        <div class="meter">
          <span class="progress" style="width: ${item.persen_tercapai}%"></span>
          <div class="label">${item.persen_tercapai}% dari ${formatRupiah(item.target_nominal)}</div>
        </div>
      </div>
    `;
    container.appendChild(el);
  });
}

/**
 * Load and display budget progress
 */
function loadBudgetProgress() {
  const budgetData = [
    {
      kategori: "MAKANAN & MINUMAN",
      target: 2000000,
      terpakai: 1500000,
      persen_tercapai: 75
    },
    {
      kategori: "TRANSPORTASI",
      target: 1000000,
      terpakai: 400000,
      persen_tercapai: 40
    },
    {
      kategori: "HIBURAN DAN JALAN-JALAN",
      target: 500000,
      terpakai: 600000,
      persen_tercapai: 120
    }
  ];

  displayBudgetProgress(budgetData);
}

/**
 * Display budget progress
 * @param {Array} budgetData - Budget data
 */
function displayBudgetProgress(budgetData) {
  const container = document.getElementById('budget-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  budgetData.forEach(item => {
    const el = document.createElement('div');
    el.className = 'd-flex align-items-center flex-wrap';
    
    const melebihiTarget = item.terpakai > item.target;
    const persentaseKelebihan = melebihiTarget ? ((item.terpakai / item.target) * 100 - 100).toFixed(1) : 0;
    const progressBarClass = melebihiTarget ? 'bg-danger' : '';
    const progressWidth = melebihiTarget ? 100 : item.persen_tercapai;
    
    el.innerHTML = `
      <div class="cart_cont w-100">
        <div data-value="${item.kategori}" class="transaksi_data d-flex justify-content-between align-items-center mb-2">
          <h6 class="mb-0">${item.kategori}</h6>
          ${melebihiTarget ? 
            `<span class="badge bg-danger">
              <i class="las la-exclamation-triangle"></i> 
              Melampaui ${persentaseKelebihan}%
            </span>` : 
            ''}
        </div>
        <div class="page-wrap">
          <div class="meter">
            <span class="progress ${progressBarClass}" style="width: ${progressWidth}%"></span>
            <div class="label">${formatRupiah(item.terpakai)} dari ${formatRupiah(item.target)}</div>
          </div>
        </div>
      </div>
    `;
    container.appendChild(el);
  });
}

/**
 * Display account data
 * @param {Array} data - Account data
 */
function displayAccountData(data) {
  const container = document.getElementById('dataaccount');
  if (!container) return;
  
  container.innerHTML = '';
  
  data.forEach((item, index) => {
    const el = document.createElement('div');
    el.className = 'col-12';
    const randomClass = CONFIG.colorClasses[index % CONFIG.colorClasses.length];
    const rancolo = CONFIG.textClasses[index % CONFIG.textClasses.length];
    
    el.innerHTML = `
      <div class="d-flex align-items-center p-2 rounded ${randomClass}">
        <div class="flex-grow-1 ms-2">
          <div class="small text-muted">${item.Keterangan}</div>
          <div class="fw-bold ${rancolo}">${formatRupiah(item.Nilai)}</div>
          <div class="d-flex gap-3"> 
            <div class="small text-success fw-semibold"> +${formatRupiah(item.Pemasukan)}</div>
            <div class="small text-danger fw-semibold"> -${formatRupiah(item.Pengeluaran)}</div>
          </div>
        </div>
      </div>
    `;
    container.appendChild(el);
  });
}

/**
 * Display loan data
 * @param {Array} data - Loan data
 */
function displayLoanData(data) {
  const container = document.getElementById('DataHutang');
  if (!container) return;
  
  container.innerHTML = '';
  
  data.forEach((item, index) => {
    if (item.status.toLowerCase() === "belum lunas") {
      let el = document.createElement('div');
      el.className = 'col-12';
      const randomClass = CONFIG.colorClasses[index % CONFIG.colorClasses.length];
      const rancolo = CONFIG.textClasses[index % CONFIG.textClasses.length];
      
      el.innerHTML = `
        <div class="d-flex align-items-center p-2 rounded ${randomClass}">
          <div class="flex-grow-1 ms-2">
            <div class="small text-muted">${item.KeteranganLoan}</div>
            <div class="fw-bold ${rancolo}">${formatRupiah(item.nilaiHutang)}</div>
            <div class="d-flex gap-3"> 
              <div class="small text-success fw-semibold"> 
                ${item.jatuhTempo ? formatDate(item.jatuhTempo) : "Tanggal Kosong"}
              </div>
              <div class="small text-danger fw-semibold">${item.status}</div>
            </div>
          </div>
        </div>
      `;
      container.appendChild(el);
    }
  });
}

/**
 * Display transactions in a modal or detail view
 * @param {Array} transactions - Transaction data to display
 */
function displayTransactions(transactions) {
  const transactionList = document.getElementById('sidebarContent');
  if (!transactionList || !transactions.length) return;
      
  // Clear existing content
  transactionList.innerHTML = '';
  
  // Group transactions by date
  const groupedTransactions = groupTransactionsByDate(transactions);
  
  // Display grouped transactions
  for (const [date, items] of Object.entries(groupedTransactions)) {
    // Add date header
    const dateHeader = document.createElement('div');
    dateHeader.className = 'transaction-date-header py-2 px-3 bg-light mb-3';
    dateHeader.innerHTML = `<strong>${date}</strong>`;
    transactionList.appendChild(dateHeader);
    
    // Add each transaction
    items.forEach(item => {
        const transactionItem = document.createElement('div');
        transactionItem.className = `transaction-card ${category}`;
        
        transactionItem.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="mb-1 text-warning">${item.keterangan}</h6>
                    <h6 class="mb-1 text-danger fw-semibold">${item.sumber}</h6>
                </div>
                <div class="text-end">
                    <div class="transaction-date">${formatTime(item.tanggal)}</div>
                </div>
            </div>
            <div class="d-flex justify-content-between align-items-center">
                <div class="transaction-amount px-1 text-warning">
                    ${formatRupiah(item.jumlah)}
                </div>
                <span class="transaction-category"> ${item.jenis} </span>
            </div>
        `;
      transactionList.appendChild(transactionItem);
    });
  }
}

function groupTransactionsByDate(transactions) {
    const grouped = {};
    const sortedTransactions = transactions.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

    sortedTransactions.forEach(transaction => {
        const dateStr = formatDate(transaction.tanggal);
        
        if (!grouped[dateStr]) {
            grouped[dateStr] = [];
        }
        
        grouped[dateStr].push(transaction);
    });

    return grouped;
}
function formatRupiah(angka) {
    angka = Number(angka);
    if (isNaN(angka) || angka === 0) {
        return 'Rp 0';
    }
    if (angka >= 1000000000) {
        return 'Rp ' + (angka / 1000000000).toFixed(1) + ' Milyar';
    }
    if (angka >= 1000000) {
        return 'Rp ' + (angka / 1000000).toFixed(1) + ' Juta';
    }
    if (angka >= 1000) {
        return 'Rp ' + (angka / 1000).toFixed(1) + ' Ribu';
    }
    return 'Rp ' + angka.toString();
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
}

function formatTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}
function formatMonthName(monthKey) {
    const [year, month] = monthKey.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}
function formatBulanTahun(dateStr) {
    const bulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const date = new Date(dateStr);
    const namaBulan = bulan[date.getMonth()];
    const tahun = date.getFullYear();
    return `${namaBulan}-${tahun}`;
}
function hidePreloader() {
    $('.preloader').fadeOut(500, function() { 
    $('.preloader').remove(); 
    });
}

function setupEventListeners() {
    document.getElementById("LogOutSistem").addEventListener("click", logoutUser);
    document.getElementById("pembahruandata").addEventListener("click", refreshSavingPlans);
    
    setInterval(updateTransactionData, 300000); // Refresh every 5 minutes
}
function createTransactionCard(item, category) {
    const transactionItem = document.createElement('div');
    transactionItem.className = `transaction-card ${category}`;
    
    const iconClass = getCategoryIcon(item.kategori);
    
    transactionItem.innerHTML = `
    <div class="d-flex justify-content-between align-items-center">
        <div>
            <h6 class="mb-1 ${category === 'Perpindahan' ? 'text-success' : ''}">${category === 'Perpindahan' ? `+ ${item.subKategori}` : `${item.keterangan}`}</h6>
            <h6 class="mb-1 text-danger fw-semibold">${category === 'Perpindahan' ? `- ${item.kategori}` : `- ${item.sumber}`}</h6>
        </div>
        <div class="text-end">
            <div class="transaction-date">${formatTime(item.tanggal)}</div>
        </div>
    </div>
    <div class="d-flex justify-content-between align-items-center">
        <div class="transaction-amount px-1 ${category === 'Perpindahan' ? 'text-success' : 'text-danger'}">
            ${category === 'Perpindahan' ? formatRupiah(item.jumlah) : `${category === 'Pemasukan' ? '+' : '-'} ${formatRupiah(item.jumlah)}`}
        </div>
        <span class="transaction-category"> ${item.jenis} </span>
    </div>
    `;
    
    return transactionItem;
}
function getCategoryIcon(category) {
    const categoryMap = {
    'makanan': 'las la-utensils',
    'transportasi': 'las la-car',
    'hiburan': 'las la-film',
    'belanja': 'las la-shopping-bag',
    'utilitas': 'las la-lightbulb',
    'gaji': 'las la-money-bill',
    'freelance': 'las la-laptop',
    'investasi': 'las la-chart-line',
    'tabungan': 'las la-piggy-bank',
    'lainnya': 'las la-ellipsis-h'
    };
    
    for (const [key, icon] of Object.entries(categoryMap)) {
    if (category.toLowerCase().includes(key)) {
        return icon;
    }
    }
    
    return 'las la-ellipsis-h';  // Default icon
    }

document.addEventListener('DOMContentLoaded', initializeApp);