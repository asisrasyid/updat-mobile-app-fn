// Fungsi untuk memperbarui theme_color di manifest
function updateManifestThemeColor(color) {
    // Mengambil manifest yang ada
    const manifestPath = window.location.protocol === 'file:' 
        ? './manifest.json' 
        : '/manifest.json';

    fetch(manifestPath)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(manifest => {
            // Memperbarui theme_color
            manifest.theme_color = color;
            
            // Menyimpan manifest yang diperbarui
            localStorage.setItem('manifest_cache', JSON.stringify(manifest));
            
            // Memperbarui service worker jika diperlukan
            if ('serviceWorker' in navigator && (window.location.protocol === 'http:' || window.location.protocol === 'https:')) {
                navigator.serviceWorker.getRegistrations().then(registrations => {
                    registrations.forEach(registration => {
                        registration.update();
                    });
                });
            }
        })
        .catch(error => {
            console.error('Error updating manifest:', error);
            // Fallback: langsung update localStorage saja
            const manifestCache = localStorage.getItem('manifest_cache');
            if (manifestCache) {
                const manifest = JSON.parse(manifestCache);
                manifest.theme_color = color;
                localStorage.setItem('manifest_cache', JSON.stringify(manifest));
            }
        });
}

// Mendengarkan perubahan warna dari localStorage
window.addEventListener('storage', function(e) {
    if (e.key === 'theme_secondary_color') {
        updateManifestThemeColor(e.newValue);
    }
}); 