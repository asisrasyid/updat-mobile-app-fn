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
