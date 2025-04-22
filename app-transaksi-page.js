// Global constants and variables
const SPREADSHEET_URL = "https://script.google.com/macros/s/AKfycbyBfKNeW5yhAyL8BdaJo6AhkbVfEPeorcqOMjPElrCCZJU9sQpCKpWwGAAqSYqKSqFw2g/exec";

// Check user authentication
document.addEventListener('DOMContentLoaded', function() {
  // Authentication check
  const savedUser = localStorage.getItem('user');
  const outputElements = document.querySelectorAll('.output');
  
  if (savedUser) {
    outputElements.forEach(el => el.textContent = savedUser);
    // Initialize form data
    initializeFormData();
  } else {
    window.location.href = "login.html";
  }
  
  // Form submission handler
  setupFormSubmission();
  
  // Logout handler
  document.getElementById("LogOutSistem").addEventListener("click", function(e) {
    e.preventDefault();
    localStorage.clear();
    window.location.href = "index.html";
  });
  
  // Data refresh handler
  document.getElementById("pembahruandata").addEventListener("click", function(event) {
    event.preventDefault();
    refreshData();
  });
});

// Initialize dropdown data
function initializeFormData() {
  const datalocaldrop = localStorage.getItem('data-drop');
  
  if (datalocaldrop) {
    const processedData = JSON.parse(datalocaldrop);
    setupDropdowns(processedData);
  } else {
    fetchDropdownData();
  }
}

// Fetch dropdown data from server
function fetchDropdownData() {
  fetch(`${SPREADSHEET_URL}?dataset=bckdata`)
    .then(res => res.json())
    .then(data => {
      localStorage.setItem('data-drop', JSON.stringify(data));
      setupDropdowns(data);
      $('.preloader').fadeOut(500, function() { 
        $('.preloader').remove(); 
      });
    })
    .catch(err => console.error('Failed to fetch data:', err));
}

// Refresh data from server
function refreshData() {
  document.getElementById("loadingOverlay").style.display = "flex";
  
  fetch(`${SPREADSHEET_URL}?dataset=bckdata`)
    .then(res => res.json())
    .then(data => {
      localStorage.setItem('data-drop', JSON.stringify(data));
      window.location.reload();
    })
    .catch(err => {
      console.error('Failed to fetch data:', err);
      document.getElementById("loadingOverlay").style.display = "none";
    });
}

// Setup form submission handler
function setupFormSubmission() {
  const submitButton = document.getElementById("submitButton");
  const form = document.getElementById("dataForm");
  
  if (!form) return;
  
  form.addEventListener("submit", function(e) {
    e.preventDefault();
    submitButton.disabled = true;
    submitButton.textContent = "Menyimpan Data.";
    
    const formData = new FormData(form);
    
    fetch(SPREADSHEET_URL, {
      method: "POST",
      body: formData,
      redirect: 'follow'
    })
    .then(res => res.json())
    .then(response => {
      if (!response.success) {
        showAlert('Ups!', response.message, 'warning');
      } else {
        showAlert('Berhasil Simpan!', response.message, 'success');
        form.reset();
        resetDivDisplay();
      }
      submitButton.disabled = false;
      submitButton.textContent = "Simpan Data";
    })
    .catch(err => {
      showAlert('Ups!', err, 'warning');
      submitButton.disabled = false;
      submitButton.textContent = "Simpan Data";
      console.log(err);
    });
  });
}

// Show SweetAlert message
function showAlert(title, text, icon) {
  Swal.fire({
    title: title,
    text: text,
    icon: icon,
    confirmButtonText: icon === 'success' ? 'Sip!' : 'Sorry!'
  });
}

// Setup dropdown elements and their event handlers
function setupDropdowns(data) {
  const elements = {
    jenisDropdown: document.getElementById("JenisTransaksi"),
    kelompokDropdown: document.getElementById("keteranganDropdown"),
    enumDropdown: document.getElementById("enumDropdown"),
    sumberDropdown: document.getElementById("bySumber"),
    manualSumberInput: document.getElementById("manualSumberInput"),
    inputSumber: document.getElementById("inputSumber"),
    inputLoanData: document.getElementById("loanDropdown"),
    showLoan: document.getElementById("loanShow"),
    inputJenis: document.getElementById("inputJenis"),
    inputKategori: document.getElementById("inputKategori"),
    inputSubkategori: document.getElementById("inputSubkategori"),
    dropdownSumberContainer: document.getElementById("dropdownSumberContainer"),
    inputSumberContainer: document.getElementById("inputSumberContainer"),
    dataLain: document.getElementById("DataLain"),
    inputDataLain: document.getElementById("inputDataaLain")
  };

  // Populate source dropdown
  populateSourceDropdown(data, elements);
  
  // Setup transaction type dropdown
  populateTransactionTypes(data, elements);
  
  // Setup event listeners for all dropdowns
  setupDropdownEventListeners(data, elements);
  
  // Hide preloader if it exists
  $('.preloader').fadeOut(500, function() { 
    $('.preloader').remove(); 
  });
}

// Populate source dropdown
function populateSourceDropdown(data, elements) {
  data.bySumber.forEach(sumber => {
    const opt = document.createElement("option");
    opt.value = sumber;
    opt.textContent = sumber;
    elements.sumberDropdown.appendChild(opt);
  });
}

// Populate transaction types
function populateTransactionTypes(data, elements) {
  Object.keys(data.byJenis).forEach(jenis => {
    const opt = document.createElement("option");
    opt.value = jenis;
    opt.textContent = jenis;
    elements.jenisDropdown.appendChild(opt);
  });
}

// Setup event listeners for all dropdowns
function setupDropdownEventListeners(data, elements) {
  // Source dropdown change
  elements.sumberDropdown.addEventListener("change", function() {
    elements.inputSumber.value = this.value;
  });
  
  // Manual source input change
  elements.manualSumberInput.addEventListener("input", function() {
    elements.inputSumber.value = this.value;
  });
  
  // Transaction type dropdown change
  elements.jenisDropdown.addEventListener("change", function() {
    handleTransactionTypeChange(this.value, data, elements);
  });
  
  // Group dropdown change
  elements.kelompokDropdown.addEventListener("change", function() {
    handleGroupChange(this.value, data, elements);
  });
  
  // Detail dropdown change
  elements.enumDropdown.addEventListener("change", function() {
    handleDetailChange(this.value, elements);
  });
  
  // Loan data dropdown change
  if (elements.inputLoanData) {
    elements.inputLoanData.addEventListener("change", function() {
      elements.inputSubkategori.value = this.value;
    });
  }
  
  // Additional data input change
  const dataLainInput = document.getElementById("DataLainInput");
  if (dataLainInput) {
    dataLainInput.addEventListener("change", function() {
      elements.inputDataLain.value = this.value;
    });
  }
}

// Handle transaction type change
function handleTransactionTypeChange(selectedJenis, data, elements) {
  elements.inputJenis.value = selectedJenis;
  
  // Reset dropdowns based on transaction type
  if (selectedJenis.toLowerCase() === "perpindahan") {
    elements.kelompokDropdown.innerHTML = '<option>Pilih Asal</option>';
    elements.enumDropdown.innerHTML = '<option>Pilih Tujuan</option>';
  } else if (selectedJenis.toLowerCase() === "pemasukan"){
    elements.kelompokDropdown.innerHTML = '<option>Pilih Kelompok</option>';
    elements.enumDropdown.innerHTML = '<option>Pilih Keterangan</option>';
    elements.sumberDropdown.innerHTML = '<option>Tujuan</option>'
  } {
    elements.kelompokDropdown.innerHTML = '<option>Pilih Kelompok</option>';
    elements.enumDropdown.innerHTML = '<option>Pilih Keterangan</option>';
  }
  
  // Reset values
  elements.inputKategori.value = '';
  elements.inputSubkategori.value = '';
  elements.inputSumber.value = '';
  
  // Configure source input visibility based on transaction type
  if (selectedJenis.toLowerCase() === "pengeluaran" || selectedJenis.toLowerCase() === "pemasukan") {
    elements.sumberDropdown.style.display = "block";
    elements.dropdownSumberContainer.style.display = "block";
    elements.inputSumberContainer.style.display = "none";
    elements.manualSumberInput.required = false;
    elements.inputSumber.value = elements.sumberDropdown.value || "";
  } else {
    elements.sumberDropdown.style.display = "none";
    elements.dropdownSumberContainer.style.display = "none";
    //elements.inputSumberContainer.style.display = "block";
    elements.manualSumberInput.required = true;
    elements.inputSumber.value = elements.manualSumberInput.value;
  }
  
  // Populate group dropdown based on transaction type
  if (data.byJenis[selectedJenis] && selectedJenis.toLowerCase() === "perpindahan") {
    data.bySumber.forEach(kelompok => {
      const opt = document.createElement("option");
      opt.value = kelompok;
      opt.textContent = kelompok;
      elements.kelompokDropdown.appendChild(opt);
    });
  } else if (data.byJenis[selectedJenis]) {
    data.byJenis[selectedJenis].forEach(kelompok => {
      const opt = document.createElement("option");
      opt.value = kelompok;
      opt.textContent = kelompok;
      elements.kelompokDropdown.appendChild(opt);
    });
  }
}

// Handle group change
function handleGroupChange(selectedKelompok, data, elements) {
  elements.inputKategori.value = selectedKelompok;
  const jenisValue = elements.jenisDropdown.value;
  
  elements.inputSubkategori.value = '';
  elements.enumDropdown.innerHTML = '<option>Pilih Keterangan</option>';
  
  // Populate detail dropdown based on group
  if (jenisValue.toLowerCase() === "perpindahan") {
    data.bySumber.forEach(keterangan => {
      if (keterangan != selectedKelompok) {
        const opt = document.createElement("option");
        opt.value = keterangan;
        opt.textContent = keterangan;
        elements.enumDropdown.appendChild(opt);
      }
    });
  } else if (selectedKelompok.toLowerCase() === "tabungan") {
    data.bySave.forEach(keterangan => {
      const opt = document.createElement("option");
      opt.value = keterangan;
      opt.textContent = keterangan;
      elements.enumDropdown.appendChild(opt);
    });
  } else if (data.byKelompok[selectedKelompok]) {
    data.byKelompok[selectedKelompok].forEach(keterangan => {
      const opt = document.createElement("option");
      opt.value = keterangan;
      opt.textContent = keterangan;
      elements.enumDropdown.appendChild(opt);
    });
  }
  
  // Populate loan data dropdown
  if (elements.inputLoanData) {
    elements.inputLoanData.innerHTML = '<option>Pilih Loan</option>';
    const loanData = data.byLoan.map(item => item.KeteranganLoan);
    loanData.forEach(loan => {
      const opt = document.createElement("option");
      opt.value = loan;
      opt.textContent = loan;
      elements.inputLoanData.appendChild(opt);
    });
  }
}

// Handle detail change
function handleDetailChange(selectedSubkategori, elements) {
  elements.inputSubkategori.value = selectedSubkategori;
  elements.manualSumberInput.value = elements.inputKategori.value;
  
  // Show additional fields based on selection
  if (selectedSubkategori.toLowerCase() === "pinjaman pribadi") {
    elements.dataLain.style.display = "block";
  } else if (elements.inputJenis.value.toLowerCase() === "pengeluaran" && 
             selectedSubkategori.toLowerCase() === "pribadi") {
    elements.showLoan.style.display = "block";
  }
}

// Reset display of divs
function resetDivDisplay() {
  const divsToHide = [
    "DataLainInput",
    "DataLain",
    "inputSumberContainer",
    "loanShow"
  ];
  
  divsToHide.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
}