/**
 * ShopSkill247 Progressive Web App - Service Worker
 * Version: shopskill247-pwa-v1.4
 * Strategy: Network-First falling back to Cache (luôn ưu tiên dữ liệu mới, offline mở tức thì)
 */

const CACHE_NAME = 'shopskill247-pwa-v1.4';

const CORE_STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './favicon.svg',
  './icon-192.png',
  './icon-512.png',
  './js/firebase-config.js',
  './js/data.js',
  './js/state.js',
  './js/views/home.js',
  './js/views/modal.js',
  './js/views/checkout.js',
  './js/views/auth.js',
  './js/views/dashboard.js',
  './js/views/admin.js',
  './js/views/blog.js',
  './js/app.js'
];

// 1. Cài đặt Service Worker và lưu trước tài nguyên cốt lõi
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[PWA-SW] Đang cache tài nguyên cốt lõi v1.4...');
      // Dùng map để nếu 1 file lỗi nhỏ vẫn không làm hỏng toàn bộ quá trình install
      const cachePromises = CORE_STATIC_ASSETS.map((asset) => {
        return cache.add(asset).catch((err) => {
          console.warn('[PWA-SW] Bỏ qua tài nguyên tùy chọn:', asset, err.message);
        });
      });
      await Promise.all(cachePromises);
    }).then(() => self.skipWaiting())
  );
});

// 2. Kích hoạt và dọn dẹp các cache phiên bản cũ
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[PWA-SW] Đang xóa cache cũ:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      console.log('[PWA-SW] Đã kích hoạt Service Worker mới nhất và chiếm quyền điều khiển (claim).');
      return self.clients.claim();
    })
  );
});

// 3. Xử lý yêu cầu mạng: Chiến lược Network-First falling back to Cache
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Bỏ qua các request không phải GET
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Bỏ qua chrome-extension, scheme không phải http/https
  if (!url.protocol.startsWith('http')) return;

  // Bỏ qua các kết nối Firebase Firestore / Realtime polling / Google Auth
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('securetoken.googleapis.com')
  ) {
    return;
  }

  event.respondWith(
    fetch(req)
      .then((networkResponse) => {
        // Nếu fetch thành công và là dữ liệu hợp lệ, cập nhật vào cache
        if (networkResponse && networkResponse.status === 200) {
          // Chỉ cache các request từ cùng origin hoặc CDN tĩnh
          const shouldCache =
            url.origin === self.location.origin ||
            url.hostname.includes('fonts.googleapis.com') ||
            url.hostname.includes('fonts.gstatic.com') ||
            url.hostname.includes('cdn.tailwindcss.com') ||
            url.hostname.includes('unpkg.com');

          if (shouldCache) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, responseClone);
            });
          }
        }
        return networkResponse;
      })
      .catch(async () => {
        // Khi mất mạng hoặc mạng gián đoạn, lấy từ Cache
        const cached = await caches.match(req);
        if (cached) {
          return cached;
        }

        // Nếu là yêu cầu điều hướng trang (SPA navigation fallback)
        if (req.mode === 'navigate') {
          const fallbackPage = await caches.match('./index.html') || await caches.match('./');
          if (fallbackPage) return fallbackPage;
        }

        // Trả về thông báo offline thân thiện
        return new Response(
          '<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><title>Offline - ShopSkill247</title><style>body{background:#080A15;color:#e2e8f0;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;padding:20px;}h1{color:#818cf8;}</style></head><body><div><h1>⚡ ShopSkill247 Đang Ở Chế Độ Offline</h1><p>Bạn đang không có kết nối mạng. Hãy kết nối internet để cập nhật dữ liệu tài khoản mới nhất!</p></div></body></html>',
          {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          }
        );
      })
  );
});

// =========================================================================
// 4. PWA Push Notification iPhone Admin (iOS 16.4+) & Desktop
// =========================================================================

// Xử lý khi Admin chạm vào thông báo trên màn hình khóa iPhone / Desktop
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url)
    ? event.notification.data.url
    : './#admin';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 1. Nếu có tab hoặc cửa sổ PWA đang mở, focus vào và chuyển hướng tới #admin
      for (const client of clientList) {
        if ('focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // 2. Nếu chưa có cửa sổ nào đang mở, mở cửa sổ PWA mới
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Xử lý sự kiện Web Push từ Cloud Server (nếu có cấu hình Web Push)
self.addEventListener('push', (event) => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch (e) {
      payload = { title: '🔔 Đơn hàng mới!', body: event.data.text() };
    }
  }

  const title = payload.title || '🔔 Đơn hàng mới ShopSkill247!';
  const options = {
    body: payload.body || 'Khách vừa báo chuyển khoản. Bấm để duyệt đơn ngay!',
    icon: payload.icon || './icon-192.png',
    badge: payload.badge || './favicon.svg',
    vibrate: [200, 100, 200, 100, 200],
    tag: payload.tag || 'admin-order-notification',
    renotify: true,
    data: {
      url: payload.url || './#admin'
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
