const spid = localStorage.getItem('spid');
const id = localStorage.getItem('id')
const email = localStorage.getItem('email')

const SPREADSHEET_URL = `https://script.google.com/macros/s/AKfycbxX0U_DDwXQ9WjTlytdzk1O2ZJk2eu-7nivoCMBAlaZts0mCDvO3u2va-xV60Wi-bak_Q/exec?spid=${spid}&id=${id}&email=${email}`;
const CONFIG = {
    urls: {
        base: `${SPREADSHEET_URL}&dataset=`,
        account: "accdta",
        transactions: "resTrx",
        savingPlans: "trgSave",
        loanData: "bckdata",
        accountData: "DataAccRek"
    }
};

function initializeApp() {
    checkAuthentication();
    setupEventListeners();
    loadDashboardData().then(() => {
        $('.preloader').fadeOut(500, function () {
            $('.preloader').remove();
        });
    });
}

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

function logoutUser(e) {
    e.preventDefault();
    localStorage.clear();
    window.location.href = "index.html";
}
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
async function loadDashboardData() {
    await Promise.all([
        updateTransactionData(),
        loadSavingPlans(),
        loadAccountData(),
        loadLoanData()
    ]);

    hidePreloader();
}
async function updateTransactionData() {
    const transactionData = await fetchData(CONFIG.urls.transactions);
    localStorage.setItem('data', JSON.stringify(transactionData));
    console.log(transactionData);
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

async function loadAccountData() {
    const accountData = await fetchData(CONFIG.urls.accountData);
    displayAccountData(accountData);
}
async function loadLoanData() {
    const data = await fetchData(CONFIG.urls.loanData);
    displayLoanData(data.byLoan);
}
async function loadSavingPlans() {
    const savingPlans = await fetchData(CONFIG.urls.savingPlans);
    displaySavingPlans(savingPlans);
}
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

function displaySavingPlans(data) {
    const container = document.getElementById('data-container');
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
// Budget Progress Functions
function loadBudgetProgress() {
    const budgetData = [{
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

function displayBudgetProgress(budgetData) {
    const container = document.getElementById('budget-container');
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
        </span>` : ''}
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

function displayAccountData(data) {
    const container = document.getElementById('dataaccount');
    container.innerHTML = '';

    const colorClasses = ['card-color-1', 'card-color-2', 'card-color-3', 'card-color-4', 'card-color-5'];
    const textClass = ['text-color-1', 'text-color-2', 'text-color-3', 'text-color-4', 'text-color-5'];

    data.forEach((item, index) => {
        const el = document.createElement('div');
        el.className = 'col-12';
        const randomClass = colorClasses[index % colorClasses.length];
        const rancolo = textClass[index % textClass.length];
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

function displayLoanData(data) {
    const container = document.getElementById('DataHutang');
    container.innerHTML = '';

    const colorClasses = ['card-color-1', 'card-color-2', 'card-color-3', 'card-color-4', 'card-color-5'];
    const textClass = ['text-color-1', 'text-color-2', 'text-color-3', 'text-color-4', 'text-color-5'];

    data.forEach((item, index) => {
        if (item.status.toLowerCase() === "belum lunas") {
            let el = document.createElement('div');
            el.className = 'col-12';
            const randomClass = colorClasses[index % colorClasses.length];
            const rancolo = textClass[index % textClass.length];
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

// Transaction Data Processing Functions
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
            months[monthKey] = {
                Pemasukan: 0,
                Pengeluaran: 0
            };
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

    return {
        categories: Object.keys(categories),
        amounts: Object.values(categories),
        months: Object.keys(months).sort(),
        Pemasukan: Object.keys(months).sort().map(key => months[key].Pemasukan),
        Pengeluaran: Object.keys(months).sort().map(key => months[key].Pengeluaran)
    };
}

function getRecentTransactions(data) {
    return data
        .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
        .slice(0, 10);
}

// UI Update Functions
function updateSummaryCards(summary) {
    document.getElementById('totalPemasukan').textContent = formatRupiah(summary.totalPemasukan);
    document.getElementById('totalPengeluaran').textContent = formatRupiah(summary.totalPengeluaran);
    document.getElementById('totalTabungan').textContent = formatRupiah(summary.totalTabungan);
    document.getElementById('sisaBudget').textContent = formatRupiah(summary.sisaBudget);
}

function updateCharts(chartData) {
    updateExpenseDistribution(chartData);
    updateFinancialTrends(chartData);
}

function updateExpenseDistribution(chartData) {
    const distributionElement = document.querySelector('.Pengeluaran-distribution');
    if (!distributionElement) return;

    distributionElement.innerHTML = '';

    const totalPengeluaran = chartData.amounts.reduce((sum, amount) => sum + amount, 0);

    chartData.categories.forEach((category, index) => {
        const amount = chartData.amounts[index];
        const percentage = ((amount / totalPengeluaran) * 100).toFixed(1);

        const expenseItem = document.createElement('div');
        expenseItem.className = 'Pengeluaran-item mb-3';

        let icon = 'las la-ellipsis-h';
        let iconColor = 'text-secondary';

        switch (category.toLowerCase()) {
            case 'makanan':
                icon = 'las la-utensils';
                iconColor = 'text-primary';
                break;
            case 'transportasi':
                icon = 'las la-car';
                iconColor = 'text-success';
                break;
            case 'hiburan':
                icon = 'las la-film';
                iconColor = 'text-info';
                break;
            case 'perlengkapan rumah':
                icon = 'las la-shopping-bag';
                iconColor = 'text-warning';
                break;
            case 'Hutang-pengeluaran':
                icon = 'las la-lightbulb';
                iconColor = 'text-danger';
                break;
            case 'perawatan pribadi':
                icon = 'las la-ellipsis-h';
                iconColor = 'text-secondary';
                break;
        }

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

function updateRecentTransactions(transactions) {
    const container = document.getElementById('recentTransactions');
    if (!container) return;

    container.innerHTML = '';

    // Group transactions by date
    const groupedTransactions = transactions.reduce((groups, transaction) => {
        const date = transaction.tanggal;
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(transaction);
        return groups;
    }, {});

    // Sort dates from newest to oldest
    Object.keys(groupedTransactions)
        .sort((a, b) => new Date(b) - new Date(a))
        .forEach(date => {
            const dateGroup = document.createElement('div');
            dateGroup.className = 'mb-3';

            // Add date header
            const dateHeader = document.createElement('div');
            dateHeader.className = 'transaction-date mb-2';
            dateHeader.textContent = formatDate(date);
            dateGroup.appendChild(dateHeader);

            // Add transactions for that date
            groupedTransactions[date].forEach(transaction => {
                let card = document.createElement('div');
                card.className = `transaction-card ${transaction.jenis}`;

                if (transaction.jenis === "Perpindahan") {
                    card.innerHTML = `
<div class="d-flex justify-content-between align-items-center">
  <div>
    <h6 class="mb-1 text-success fw-semibold"> + ${transaction.subKategori}</h6>
    <h6 class="mb-1 text-danger fw-semibold"> - ${transaction.kategori}</h6>
    <span class="transaction-category"> ${transaction.keterangan} </span>
  </div>
  <div class="text-end">
    <div class="transaction-amount text-success">
      ${formatRupiah(transaction.jumlah)}
    </div>
    <div class="transaction-date">${formatTime(transaction.tanggal)}</div>
  </div>
</div>
`;
                } else {
                    card.innerHTML = `
<div class="d-flex justify-content-between align-items-center">
  <div>
    <h6 class="mb-1">${transaction.keterangan}</h6>
    <span class="transaction-category">${transaction.kategori} / ${transaction.subKategori} </span>
  </div>
  <div class="text-end">
    <div class="transaction-amount ${transaction.jenis}">
      ${transaction.jenis === 'Pemasukan' ? '+' : '-'} ${formatRupiah(transaction.jumlah)}
    </div>
    <div class="transaction-date">${formatTime(transaction.tanggal)}</div>
  </div>
</div>
`;
                }
                dateGroup.appendChild(card);
            });

            container.appendChild(dateGroup);
        });
}

// Utility Functions
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

function formatMonthName(monthKey) {
    const [year, month] = monthKey.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('id-ID', {
        month: 'long',
        year: 'numeric'
    });
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    return date.toLocaleDateString('id-ID', options);
}

function formatTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
    });
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
    $('.preloader').fadeOut(500, function () {
        $('.preloader').remove();
    });
}

// Setup Event Listeners
function setupEventListeners() {
    document.getElementById("LogOutSistem").addEventListener("click", logoutUser);
    document.getElementById("pembahruandata").addEventListener("click", refreshSavingPlans);

    // Set auto-refresh interval
    setInterval(updateTransactionData, 300000); // Refresh every 5 minutes
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);

const distributionElement = document.querySelector('.Pengeluaran-distribution');

distributionElement.addEventListener('click', function (e) {
    if (e.target && e.target.classList.contains('data-trnswhose')) {
        const dataValue = e.target.getAttribute('data-value');
        const datadetail = JSON.parse(localStorage.getItem('data'));
        document.getElementById('juduldetail').innerText = dataValue;

        if (datadetail && Array.isArray(datadetail)) {
            const transactionDetail = datadetail.filter(item => item.kategori === dataValue);

            if (transactionDetail.length > 0) {
                displayTransactions(transactionDetail)
                setTimeout(() => {
                    const sidebarModal = new bootstrap.Modal(document.getElementById('sidebarModal'));
                    sidebarModal.show();
                }, 100);
            } else {
                console.error("Tidak ada transaksi yang cocok dengan kategori: " + dataValue);
            }
        } else {
            console.error("Data detail tidak valid atau tidak ditemukan di localStorage.");
        }
    }
});

function DetailTransaksi(transactions) {
    const container = document.getElementById('sidebarContent');
    if (!container || !Array.isArray(transactions) || transactions.length === 0) return;

    container.innerHTML = ''; 
    const groupedTransactions = transactions.reduce((groups, transaction) => {
        const date = transaction.tanggal;
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(transaction);
        return groups;
    }, {});
    Object.keys(groupedTransactions)
        .sort((a, b) => new Date(b) - new Date(a))
        .forEach(date => {
            const dateGroup = document.createElement('div');
            dateGroup.className = 'mb-3';

            // Add date header
            const dateHeader = document.createElement('div');
            dateHeader.className = 'transaction-date mb-2';
            dateHeader.textContent = formatDate(date); // Pastikan formatDate ada
            dateGroup.appendChild(dateHeader);

            // Add transactions for that date
            groupedTransactions[date].forEach(transaction => {
                let card = document.createElement('div');
                card.className = `transaction-card ${transaction.jenis}`;

                if (transaction.jenis === "Perpindahan") {
                    card.innerHTML = `
<div class="d-flex justify-content-between align-items-center">
  <div>
    <h6 class="mb-1 text-success fw-semibold"> + ${transaction.subKategori}</h6>
    <h6 class="mb-1 text-danger fw-semibold"> - ${transaction.kategori}</h6>
    <span class="transaction-category"> ${transaction.keterangan} </span>
  </div>
  <div class="text-end">
    <div class="transaction-amount text-success">
      ${formatRupiah(transaction.jumlah)}  <!-- Pastikan formatRupiah berfungsi dengan baik -->
    </div>
    <div class="transaction-date">${formatTime(transaction.tanggal)}</div> <!-- Pastikan formatTime ada -->
  </div>
</div>
`;
                } else {
                    card.innerHTML = `
<div class="d-flex justify-content-between align-items-center">
  <div>
    <h6 class="mb-1">${transaction.keterangan}</h6>
    <span class="transaction-category">${transaction.kategori} / ${transaction.subKategori} </span>
  </div>
  <div class="text-end">
    <div class="transaction-amount ${transaction.jenis}">
      ${transaction.jenis === 'Pemasukan' ? '+' : '-'} ${formatRupiah(transaction.jumlah)}
    </div>
    <div class="transaction-date">${formatTime(transaction.tanggal)}</div>
  </div>
</div>
`;
                }
                dateGroup.appendChild(card);
            });

            container.appendChild(dateGroup);
        });
}

function displayTransactions(transactions) {
    const transactionList = document.getElementById('sidebarContent');
    const allTransactions = transactions;

    if (allTransactions.length > 0) {
        transactionList.innerHTML = '';

        // Group transactions by date
        const groupedTransactions = groupTransactionsByDate(allTransactions);

        // Display grouped transactions
        for (const [date, items] of Object.entries(groupedTransactions)) {
            // Add date header
            const dateHeader = document.createElement('div');
            dateHeader.className = 'transaction-date-header py-2 px-3 bg-light mb-3';
            dateHeader.innerHTML = `<strong>${date}</strong>`;
            transactionList.appendChild(dateHeader);

            // Add each transaction
            items.forEach(item => {
                let transactionItem;

                if (item.jenis === "Perpindahan") {
                    transactionItem = createTransactionCard(item, 'Perpindahan');
                } else if (item.kategori === "Tabungan") {
                    transactionItem = createTransactionCard(item, 'Tabungan');
                } else {
                    transactionItem = createTransactionCard(item, item.jenis);
                }

                transactionList.appendChild(transactionItem);
            });
        }
    }
}

function createTransactionCard(item, category) {
    const transactionItem = document.createElement('div');
    transactionItem.className = `transaction-card ${category}`;

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
