
const spreadsheetUrl3 = "https://script.google.com/macros/s/AKfycbyBfKNeW5yhAyL8BdaJo6AhkbVfEPeorcqOMjPElrCCZJU9sQpCKpWwGAAqSYqKSqFw2g/exec?dataset=accdta"; // Ganti dgn URL kamu		

const savedUser = localStorage.getItem('user');
const outputElements = document.querySelectorAll('.output');
			if (savedUser) {
				outputElements.forEach(el => el.textContent = savedUser);
			 }
				else {
					fetch(spreadsheetUrl3)
					.then(response => response.json())
					.then(data => {
						const user = data.value || 'User Tidak Dikenal';
						localStorage.setItem('user', user);
						outputElements.forEach(el => el.textContent = user);
					})
					.catch(err => {
						console.error('Gagal mengambil data:', err);
						outputElements.forEach(el => el.textContent = 'Gagal memuat data');
					});
				}
			
			
			const spreadsheetUrl2 = "https://script.google.com/macros/s/AKfycbyBfKNeW5yhAyL8BdaJo6AhkbVfEPeorcqOMjPElrCCZJU9sQpCKpWwGAAqSYqKSqFw2g/exec"; 
			const submitButton = document.getElementById("submitButton");   
			document.getElementById("dataForm").addEventListener("submit", function(e){
				e.preventDefault();
				submitButton.disabled = true;
  				submitButton.textContent = "Menyimpan Data.";
				const form = e.target;
				const formData = new FormData(form);
				fetch(spreadsheetUrl2, {
				  method: "POST",
				  body: formData,
				  redirect: 'follow'
				})
				.then(res => res.json())
				.then(text => {
				if(!text.success) {
					Swal.fire({
					title: 'Ups!',
					text: text.message,
					icon: 'warning',
					confirmButtonText: 'Sorry!'
				  });
				} else {
					Swal.fire({
					title: 'Berhasil Simpan!',
					text: text.message,
					icon: 'success',
					confirmButtonText: 'Sip!'
				  });
				  form.reset();
				}  
				submitButton.disabled = false;
      			submitButton.textContent = "Simpan Data"
				})
				.catch(err => {
				  Swal.fire({
					title: 'Ups!',
					text: err,
					icon: 'warning',
					confirmButtonText: 'Sorry!'
				  });
		  	submitButton.disabled = false;
      		submitButton.textContent = "Simpan Data"
				  console.log(err);
				  document.getElementById("result").innerText = "❌ Terjadi kesalahan.";
				});
			  });
			
			  const spreadsheetUrl = "https://script.google.com/macros/s/AKfycbyBfKNeW5yhAyL8BdaJo6AhkbVfEPeorcqOMjPElrCCZJU9sQpCKpWwGAAqSYqKSqFw2g/exec?dataset=bckdata"; // Ganti dgn URL kamu		
		fetch(spreadsheetUrl)
				.then(res => res.json())
				.then(data => {
				  const jenisDropdown = document.getElementById("JenisTransaksi");
				  const kelompokDropdown = document.getElementById("keteranganDropdown");
				  const enumDropdown = document.getElementById("enumDropdown");
				  const sumberDropdown = document.getElementById("bySumber");
				  const manualSumberInput = document.getElementById("manualSumberInput");
				  const inputSumber = document.getElementById("inputSumber");
		  
				  const inputJenis = document.getElementById("inputJenis");
				  const inputKategori = document.getElementById("inputKategori");
				  const inputSubkategori = document.getElementById("inputSubkategori");

				  const dropdownSumberContainer = document.getElementById("dropdownSumberContainer");
				  const inputSumberContainer = document.getElementById("inputSumberContainer");

				  data.bySumber.forEach(sumber => {
				  const opt = document.createElement("option");
				  opt.value = sumber;
				  opt.textContent = sumber;
				  sumberDropdown.appendChild(opt);
				});
					
					// Jika sumber dipilih dari dropdown
					sumberDropdown.addEventListener("change", function () {
						inputSumber.value = this.value;
					});
					
					// Jika user mengetik manual sumber
					manualSumberInput.addEventListener("input", function () {
						inputSumber.value = this.value;
					});
				  // 1. Isi dropdown Jenis
				  
				  Object.keys(data.byJenis).forEach(jenis => {
					const opt = document.createElement("option");
					opt.value = jenis;
					opt.textContent = jenis;
					jenisDropdown.appendChild(opt);
				  });

				  jenisDropdown.addEventListener("change", function () {
					  const selectedJenis = this.value;
					  inputJenis.value = selectedJenis; 
					  
					  if (selectedJenis.toLowerCase() === "perpindahan") {
 						   kelompokDropdown.innerHTML = '<option>Pilih Asal</option>';
 						   enumDropdown.innerHTML = '<option>Pilih Tujuan</option>';
 						 } else {
 						   kelompokDropdown.innerHTML = '<option>Pilih Kelompok</option>';
 						   enumDropdown.innerHTML = '<option>Pilih Keterangan</option>';
 						 }

					  //kelompokDropdown.innerHTML = '<option>Pilih Kelompok</option>';
					  //enumDropdown.innerHTML = '<option>Pilih Keterangan</option>';
					  inputKategori.value = '';
					  inputSubkategori.value = '';
					  inputSumber.value = '';
					  if (selectedJenis.toLowerCase() === "pengeluaran") {
  						  sumberDropdown.style.display = "block";
  						  dropdownSumberContainer.style.display = "block";
  						  inputSumberContainer.style.display = "none";
  						  manualSumberInput.required = false;
  						  inputSumber.value = sumberDropdown.value || "";
  						} else {
  						  sumberDropdown.style.display = "none";
  						  dropdownSumberContainer.style.display = "none";
  						  inputSumberContainer.style.display = "block";
  						  manualSumberInput.required = true;
  						  inputSumber.value = manualSumberInput.value;
  						}
					  
						if (data.byJenis[selectedJenis]) {
							data.byJenis[selectedJenis].forEach(kelompok => {
								const opt = document.createElement("option");
								opt.value = kelompok;
								opt.textContent = kelompok;
								kelompokDropdown.appendChild(opt);
							});
						}
					});
					
					kelompokDropdown.addEventListener("change", function () {
						const selectedKelompok = this.value;
						inputKategori.value = selectedKelompok;
						
						enumDropdown.innerHTML = '<option>Pilih Keterangan</option>';
						inputSubkategori.value = '';
						
						if (data.byKelompok[selectedKelompok]) {
							data.byKelompok[selectedKelompok].forEach(keterangan => {
								const opt = document.createElement("option");
								opt.value = keterangan;
								opt.textContent = keterangan;
								enumDropdown.appendChild(opt);
							});
						}
					});
					
					enumDropdown.addEventListener("change", function () {
						const selectedSubkategori = this.value;
						inputSubkategori.value = selectedSubkategori;
					});
					sumberDropdown.addEventListener("change", function () {
						inputSumber.value = this.value;
					});
					
					// Saat user input manual sumber
					manualSumberInput.addEventListener("input", function () {
						inputSumber.value = this.value;
					});
				});
				