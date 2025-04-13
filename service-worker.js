const CACHE_NAME = 'my-app-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  'assets/css/bootstrap.min.css',
	'assets/css/jquery-ui.css',
	'assets/css/slick.css',
	'assets/css/line-awesome.css',
	'assets/css/nice-select.css',
	'assets/css/style.css',
	'assets/css/responsive.css',
  	'assets/js/bootstrap.bundle.min.js',
	'assets/js/jquery-3.5.1.min.js',
	'assets/js/jquery-ui.min.js',
	'assets/js/slick.min.js',
	'assets/js/jquery.nice-select.min.js',
	'assets/js/app.js',
	'/assets/sweetalert2/sweetalert2.min.js',
  '/assets/sweetalert2/sweetalert2.min.css',
  // Tambahkan file lain seperti logo, script, dll.
];

self.addEventListener('install', function(e) {
  console.log('[ServiceWorker] Installed');
});

self.addEventListener('fetch', function(event) {
  // Bisa disesuaikan jika ingin offline support
});

// Menambahkan handler untuk manifest.json
self.addEventListener('fetch', event => {
    if (event.request.url.endsWith('manifest.json')) {
        event.respondWith(
            caches.match(event.request).then(response => {
                // Cek apakah ada cache manifest yang diperbarui
                return fetch(event.request).then(networkResponse => {
                    // Simpan response network ke cache
                    const responseToCache = networkResponse.clone();
                    caches.open('manifest-cache').then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                    return networkResponse;
                }).catch(() => {
                    // Jika offline atau file://, gunakan cache
                    return response || new Response(JSON.stringify({
                        name: "Finance Management",
                        short_name: "E-FinMen",
                        start_url: "/",
                        display: "standalone",
                        background_color: "#ffffff",
                        theme_color: localStorage.getItem('theme_secondary_color') || "#18181b",
                        orientation: "portrait",
                        icons: [
                            {
                                src: "https://cdn-icons-png.flaticon.com/512/906/906334.png",
                                sizes: "192x192",
                                type: "image/png"
                            }
                        ]
                    }), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                });
            })
        );
    }
});
