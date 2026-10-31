/**
 * Shopviet247 - Secret Admin Portal View Module
 * Tệp: js/views/admin.js
 * 
 * Cổng Quản Trị Bí Mật (minhcuong111) chuẩn xác theo phong cách Ảnh 3:
 * - Bảo mật truy cập: Phím tắt Ctrl + Shift + A, Hash #admin, Mã PIN xác thực (minhcuong111 / admin2026)
 * - Header Modal chuẩn Ảnh 3: Icon bánh răng gradient tím/xanh, Tiêu đề "Phiên quản trị (minhcuong111)", Badge "Admin Session", Dòng phụ "Bạn vẫn đang dùng tài khoản Minh Cuong • Phiên: 59:54 • Cấu hình: v12", nút Làm mới, Về Trang chủ, Đăng xuất
 * - Tab 1: Giá & gói (Quản lý sản phẩm: thêm/sửa/xóa, giá bán, giá gốc, tồn kho, trạng thái, ảnh/icon, lưu localStorage, realtime cập nhật view Home)
 * - Tab 2: Thanh toán VietQR & Đơn hàng (Duyệt đơn, xem ảnh bill, thống kê doanh thu)
 * - Tab 3: Cấu hình VietQR (Cấu hình STK, Chủ TK, Ngân hàng, Live VietQR Preview)
 */

(function () {
  'use strict';

  // Khởi tạo namespace toàn cục
  window.ShopVietViews = window.ShopVietViews || {};

  // Hằng số bảo mật và lưu trữ
  const STORAGE_KEYS = {
    ADMIN_AUTH: 'shopviet_admin_authenticated',
    PRODUCTS: 'shopviet_admin_products',
    VIETQR_CONFIG: 'shopviet_vietqr_config',
    ACTIVE_TAB: 'shopviet_admin_active_tab'
  };

  // Mã PIN quản trị hợp lệ
  const VALID_PINS = ['minhcuong111', 'admin2026'];

  // Cấu hình VietQR mặc định - Chuẩn Sacombank 100071864927 LE BUI MINH CUONG
  const DEFAULT_VIETQR_CONFIG = {
    bankId: '970403', // Sacombank BIN 970403
    bin: '970403',
    bankName: 'Sacombank (Ngân hàng TMCP Sài Gòn Thương Tín)',
    shortName: 'Sacombank',
    accountNumber: '100071864927',
    accountName: 'LE BUI MINH CUONG',
    memoPrefix: 'SHOPVIET',
    brandColor: '#004b91'
  };

  // Hàm kiểm tra quyền Admin tối cao: Chỉ email minhcuong111aaa@gmail.com
  function isAllowedAdminUser() {
    const u = window.ShopVietState && window.ShopVietState.state && window.ShopVietState.state.user;
    return Boolean(u && u.isLoggedIn && u.email === 'minhcuong111aaa@gmail.com');
  }

  // Danh sách ngân hàng hỗ trợ VietQR
  const SUPPORTED_BANKS = [
    { id: '970422', code: 'MB', name: 'MB Bank (Ngân hàng Quân Đội)' },
    { id: '970407', code: 'TCB', name: 'Techcombank' },
    { id: '970436', code: 'VCB', name: 'Vietcombank' },
    { id: '970415', code: 'CTG', name: 'VietinBank' },
    { id: '970418', code: 'BIDV', name: 'BIDV' },
    { id: '970416', code: 'ACB', name: 'ACB (Ngân hàng Á Châu)' },
    { id: '970432', code: 'VPB', name: 'VPBank' },
    { id: '970423', code: 'TPB', name: 'TPBank' },
    { id: '970454', code: 'VIB', name: 'VIB (Quốc Tế)' },
    { id: '970403', code: 'STB', name: 'Sacombank' }
  ];

  // Khôi phục sản phẩm từ LocalStorage nếu đã có trước đó
  function restoreProductsFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS) || localStorage.getItem('shopviet_custom_products');
      if (saved && window.ShopVietData) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          window.ShopVietData.products = parsed;
        }
      }
    } catch (e) {
      console.warn('[Admin Restore Products Error]:', e);
    }
  }

  // Khởi động khôi phục dữ liệu
  restoreProductsFromStorage();

  // Biến trạng thái nội bộ của Admin Module
  let currentActiveTab = 'pricing'; // 'pricing' | 'orders' | 'vietqr' | 'vouchers' | 'schedules'
  let sessionCountdownSeconds = 59 * 60 + 54; // 59:54
  let sessionIntervalTimer = null;
  let editingProductId = null; // null = tạo mới, string = sửa

  // Lịch sử & Trạng thái Trạm Phát Sóng Thời Gian Thực (Realtime Sync Hub)
  function getBroadcastHistory() {
    try {
      const saved = localStorage.getItem('shopviet_broadcast_history');
      if (saved) {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr) && arr.length > 0) return arr;
      }
    } catch (e) {}
    return [
      {
        id: 'hist-init',
        type: 'system_init',
        title: 'Khởi động trạm phát sóng',
        detail: 'Trạm Realtime Sync Hub đã sẵn sàng hoạt động (shopviet_realtime_sync)',
        time: new Date().toLocaleTimeString('vi-VN'),
        date: new Date().toLocaleDateString('vi-VN'),
        timestamp: Date.now(),
        status: 'delivered'
      }
    ];
  }

  function getBroadcastTypeTitle(type) {
    switch (type) {
      case 'products_updated': return '📦 Cập nhật Sản phẩm';
      case 'vietqr_updated': return '💳 Cập nhật Cấu hình VietQR';
      case 'orders_updated': return '📋 Cập nhật Đơn hàng & License';
      case 'vouchers_updated': return '🎁 Cập nhật Mã giảm giá';
      case 'schedules_updated': return '📅 Cập nhật Lịch hẹn khách';
      case 'test_ping': return '⚡ Phát Tín Hiệu Thử Nghiệm (Ping)';
      default: return '📡 Tín hiệu Realtime';
    }
  }

  function recordBroadcast(type, detail) {
    const timeStr = new Date().toLocaleTimeString('vi-VN');
    const dateStr = new Date().toLocaleDateString('vi-VN');
    const ts = Date.now();
    try {
      localStorage.setItem('shopviet_last_broadcast_time', new Date().toISOString());
      localStorage.setItem('shopviet_last_broadcast_type', type);
      const history = getBroadcastHistory();
      history.unshift({
        id: 'bc-' + ts,
        type: type,
        title: getBroadcastTypeTitle(type),
        detail: detail || 'Đồng bộ dữ liệu thời gian thực lên mọi máy khách',
        time: timeStr,
        date: dateStr,
        timestamp: ts,
        status: 'delivered'
      });
      if (history.length > 25) history.pop();
      localStorage.setItem('shopviet_broadcast_history', JSON.stringify(history));
    } catch (e) {}
  }

  function getLastBroadcastTimeDisplay() {
    try {
      const saved = localStorage.getItem('shopviet_last_broadcast_time');
      if (saved) {
        const d = new Date(saved);
        if (!isNaN(d.getTime())) {
          return d.toLocaleTimeString('vi-VN') + ' ' + d.toLocaleDateString('vi-VN');
        }
      }
    } catch (e) {}
    return 'Vừa mới đây (Live)';
  }

  // Lấy cấu hình VietQR hiện tại
  function getVietQRConfig() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VIETQR_CONFIG);
      if (saved) return Object.assign({}, DEFAULT_VIETQR_CONFIG, JSON.parse(saved));
    } catch (e) {
      console.warn('[Get VietQR Config Error]:', e);
    }
    return DEFAULT_VIETQR_CONFIG;
  }

  // Lưu cấu hình VietQR
  function saveVietQRConfig(config) {
    try {
      localStorage.setItem(STORAGE_KEYS.VIETQR_CONFIG, JSON.stringify(config));
    } catch (e) {
      console.warn('[Save VietQR Config Error]:', e);
    }
  }

  // Kiểm tra trạng thái xác thực Admin (hỗ trợ kiểm tra trực tiếp quyền từ ShopVietState.isAdmin)
  function isAuthenticated() {
    return sessionStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true' ||
           localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true' ||
           (window.ShopVietState && typeof window.ShopVietState.isAdmin === 'function' && window.ShopVietState.isAdmin());
  }

  // Đặt trạng thái xác thực
  function setAuthenticated(status) {
    if (status) {
      sessionStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
      localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
      localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
    }
  }

  // Helper định dạng tiền VNĐ
  function formatVND(num) {
    return (Number(num) || 0).toLocaleString('vi-VN') + ' đ';
  }

  // Helper định dạng thời gian phiên
  function formatSessionTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Helper định dạng ngày giờ chuẩn Việt Nam
  function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  }

  // Helper Toast
  function notify(msg, type) {
    if (window.ShopVietState && typeof window.ShopVietState.showToast === 'function') {
      window.ShopVietState.showToast(msg, type);
    } else {
      alert(msg);
    }
  }

  // =========================================================================
  // GIAO DIỆN MODAL NHẬP MÃ PIN XÁC THỰC BẢO MẬT
  // =========================================================================
  function renderPinAuthModal() {
    return `
      <div id="adminPinBackdrop" class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
        <div id="adminPinCard" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 animate-slide-up relative overflow-hidden">
          
          <!-- Decorative Top Glow -->
          <div class="absolute -top-20 -left-20 w-44 h-44 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute -top-20 -right-20 w-44 h-44 bg-violet-500/15 rounded-full blur-3xl pointer-events-none"></div>

          <!-- Header -->
          <div class="text-center space-y-3 relative z-10">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/25">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div>
              <h3 class="text-xl font-extrabold text-slate-900 dark:text-white">Cổng Quản Trị Bí Mật</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Vui lòng nhập mã PIN quản trị viên (minhcuong111)</p>
            </div>
          </div>

          <!-- PIN Form -->
          <form id="adminPinForm" class="mt-6 space-y-4 relative z-10" onsubmit="event.preventDefault(); window.ShopVietViews.admin.submitPin();">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Mã PIN xác thực</label>
              <div class="relative">
                <input 
                  type="password" 
                  id="adminPinInput" 
                  placeholder="Nhập mã PIN bí mật..." 
                  autocomplete="current-password"
                  autofocus
                  class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm tracking-widest font-mono"
                >
                <button 
                  type="button" 
                  id="adminTogglePinEye" 
                  onclick="window.ShopVietViews.admin.togglePinVisibility()" 
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  <svg id="adminEyeSvg" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
              </div>
              <p id="adminPinError" class="text-xs text-rose-500 font-medium mt-1.5 hidden flex items-center gap-1">
                <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>Mã PIN không chính xác! Vui lòng thử lại.</span>
              </p>
            </div>

            <!-- Hint Box -->
            <div class="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-indigo-700 dark:text-indigo-300 flex items-center justify-between">
              <span>Gợi ý mã PIN mặc định:</span>
              <code class="font-mono font-bold bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 cursor-pointer" onclick="document.getElementById('adminPinInput').value='minhcuong111'">minhcuong111</code>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2 pt-2">
              <button 
                type="button" 
                onclick="window.ShopVietViews.admin.close()" 
                class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Hủy bỏ
              </button>
              <button 
                type="submit" 
                class="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-md shadow-indigo-500/25 flex items-center justify-center gap-1.5"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                  <polyline points="10 17 15 12 10 7"/>
                  <line x1="15" x2="3" y1="12" y2="12"/>
                </svg>
                <span>Vào Quản Trị</span>
              </button>
            </div>
          </form>

        </div>
      </div>
    `;
  }

  // =========================================================================
  // GIAO DIỆN PHIÊN QUẢN TRỊ MODAL CHUẨN XÁC THEO PHONG CÁCH ẢNH 3
  // =========================================================================
  function renderAdminPortalModal() {
    const products = (window.ShopVietData && window.ShopVietData.products) || [];
    const orders = (window.ShopVietState && window.ShopVietState.state && window.ShopVietState.state.orders) || [];
    const vouchers = (window.ShopVietState && window.ShopVietState.getVouchers) ? window.ShopVietState.getVouchers() : [];
    const schedules = (window.ShopVietState && window.ShopVietState.getSchedules) ? window.ShopVietState.getSchedules() : [];
    const vietqr = getVietQRConfig();

    return `
      <div id="adminPortalBackdrop" class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 lg:p-6 animate-fade-in">
        <div id="adminPortalContainer" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-7xl h-[92vh] max-h-[920px] flex flex-col overflow-hidden animate-slide-up">
          
          <!-- ==================== HEADER MODAL CHUẨN ẢNH 3 ==================== -->
          <div class="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-50/70 dark:bg-slate-950/70 shrink-0">
            
            <!-- Left Info Cluster -->
            <div class="flex items-center gap-3.5">
              <!-- Icon Bánh Răng Cài Đặt Tím/Xanh -->
              <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                <svg class="w-6 h-6 animate-spin-slow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </div>

              <!-- Tiêu đề lớn & Dòng phụ -->
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Phiên quản trị (minhcuong111)</span>
                  </h2>
                  <!-- Badge xanh Admin Session -->
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Admin Session
                  </span>
                </div>
                <!-- Dòng phụ chuẩn Ảnh 3 -->
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Bạn vẫn đang dùng tài khoản <strong class="text-slate-700 dark:text-slate-200">Minh Cuong</strong> • Phiên: <span id="adminSessionTimer" class="font-mono font-semibold text-indigo-600 dark:text-indigo-400">${formatSessionTime(sessionCountdownSeconds)}</span> • Cấu hình: <span class="font-semibold text-slate-700 dark:text-slate-300">v12</span>
                </p>
              </div>
            </div>

            <!-- Cụm Nút Phải: Làm Mới, Về Trang Chủ, Đăng Xuất (Đã tinh gọn chuẩn Clean SaaS, bảo toàn 100% logic ngầm) -->
            <div class="flex items-center gap-2">
              <!-- Nút Làm Mới -->
              <button 
                type="button" 
                onclick="window.ShopVietViews.admin.refreshData()" 
                title="Làm mới dữ liệu (Refresh)"
                class="p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-xs font-semibold flex items-center gap-1.5"
              >
                <svg class="w-4 h-4 text-slate-500 hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                  <path d="M3 3v5h5"/>
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
                  <path d="M16 21h5v-5"/>
                </svg>
                <span class="hidden sm:inline">Làm mới</span>
              </button>

              <!-- Nút Về Trang Chủ -->
              <button 
                type="button" 
                onclick="window.ShopVietViews.admin.close()" 
                class="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition flex items-center gap-1.5"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                <span>Về Trang chủ</span>
              </button>

              <!-- Nút Đăng Xuất (Thoát Admin) -->
              <button 
                type="button" 
                onclick="window.ShopVietViews.admin.logout()" 
                class="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-xs font-semibold transition flex items-center gap-1.5"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" x2="9" y1="12" y2="12"/>
                </svg>
                <span>Đăng xuất</span>
              </button>
            </div>

          </div>

          <!-- ==================== THANH TAB ĐIỀU HƯỚNG NGANG ==================== -->
          <div class="px-5 pt-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2 overflow-x-auto shrink-0">
            <!-- Tab 1: Giá & gói -->
            <button 
              type="button" 
              onclick="window.ShopVietViews.admin.switchTab('pricing')" 
              id="adminTabBtn-pricing"
              class="admin-nav-tab px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${currentActiveTab === 'pricing' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
              <span>Giá & gói</span>
              <span class="px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400 font-semibold">${products.length}</span>
            </button>

            <!-- Tab 2: Thanh toán VietQR & Đơn hàng -->
            <button 
              type="button" 
              onclick="window.ShopVietViews.admin.switchTab('orders')" 
              id="adminTabBtn-orders"
              class="admin-nav-tab px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${currentActiveTab === 'orders' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              <span>Thanh toán VietQR & Đơn hàng</span>
              <span class="px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400 font-semibold">${orders.length}</span>
            </button>

            <!-- Tab 3: Cấu hình VietQR -->
            <button 
              type="button" 
              onclick="window.ShopVietViews.admin.switchTab('vietqr')" 
              id="adminTabBtn-vietqr"
              class="admin-nav-tab px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${currentActiveTab === 'vietqr' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              <span>Cấu hình VietQR</span>
            </button>

            <!-- Tab 4: Mã quà tặng & Giảm giá -->
            <button 
              type="button" 
              onclick="window.ShopVietViews.admin.switchTab('vouchers')" 
              id="adminTabBtn-vouchers"
              class="admin-nav-tab px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${currentActiveTab === 'vouchers' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 12 20 22 4 22 4 12" />
                <rect x="2" y="7" width="20" height="5" />
                <line x1="12" y1="22" x2="12" y2="7" />
                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
              </svg>
              <span>Mã quà tặng & Giảm giá</span>
              <span class="px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400 font-semibold" id="adminVoucherTabBadge">${vouchers.length}</span>
            </button>

            <!-- Tab 5: Quản lý khách & Hẹn lịch (Excel) -->
            <button 
              type="button" 
              onclick="window.ShopVietViews.admin.switchTab('schedules')" 
              id="adminTabBtn-schedules"
              class="admin-nav-tab px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${currentActiveTab === 'schedules' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" />
                <path d="M3 15h18" />
                <path d="M9 3v18" />
                <path d="M15 3v18" />
              </svg>
              <span>Hẹn lịch khách (Excel)</span>
              <span class="px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-[10px] text-emerald-700 dark:text-emerald-300 font-bold" id="adminScheduleTabBadge">${schedules.length}</span>
            </button>
          </div>

          <!-- ==================== BODY CONTENT THEO TAB ==================== -->
          <div id="adminTabContent" class="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950/50">
            ${renderTabBody(currentActiveTab)}
          </div>

        </div>
      </div>
    `;
  }

  // Helper render Tab Body
  function renderTabBody(tabName) {
    if (tabName === 'orders') {
      return renderTabOrders();
    } else if (tabName === 'vietqr') {
      return renderTabVietQR();
    } else if (tabName === 'vouchers') {
      return renderTabVouchers();
    } else if (tabName === 'schedules') {
      return renderTabSchedules();
    } else if (tabName === 'realtime') {
      return renderTabRealtime();
    }
    return renderTabPricing();
  }

  // =========================================================================
  // TAB 1: GIÁ & GÓI (QUẢN LÝ SẢN PHẨM)
  // =========================================================================
  function renderTabPricing() {
    const products = (window.ShopVietData && window.ShopVietData.products) || [];

    return `
      <div class="space-y-5">
        
        <!-- Toolbar Phía Trên: Nút Thêm Sản Phẩm Mới & Ô Tìm Kiếm -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          
          <div class="flex items-center gap-2">
            <!-- Nút + Thêm sản phẩm mới theo đúng yêu cầu đề bài -->
            <button 
              type="button" 
              onclick="window.ShopVietViews.admin.openProductModal(null)" 
              class="bg-indigo-600 text-white font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm hover:bg-indigo-700 flex items-center gap-1.5 shadow-sm transition-colors shrink-0"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <span>Thêm sản phẩm mới</span>
            </button>

            <!-- Nút Khôi phục dữ liệu gốc -->
            <button 
              type="button" 
              onclick="window.ShopVietViews.admin.resetDefaultProducts()" 
              title="Khôi phục danh sách sản phẩm mẫu ban đầu"
              class="p-2 sm:px-3 sm:py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition"
            >
              Khôi phục mẫu
            </button>
          </div>

          <!-- Ô Tìm kiếm sản phẩm -->
          <div class="relative flex-1 max-w-sm">
            <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input 
              type="text" 
              id="adminProductSearchInput" 
              oninput="window.ShopVietViews.admin.filterProductTable(this.value)" 
              placeholder="Tìm kiếm sản phẩm theo tên, danh mục..." 
              class="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
          </div>

        </div>

        <!-- Bảng Danh Sách Sản Phẩm Trực Quan -->
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs sm:text-sm">
              <thead class="bg-slate-50 dark:bg-slate-950/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th class="py-3 px-3.5 w-16 text-center">ẢNH / ICON</th>
                  <th class="py-3 px-4">TÊN SẢN PHẨM</th>
                  <th class="py-3 px-3.5">DANH MỤC</th>
                  <th class="py-3 px-3.5">GIÁ BÁN (VNĐ)</th>
                  <th class="py-3 px-3.5">GIÁ GỐC (VNĐ)</th>
                  <th class="py-3 px-3 text-center">TỒN KHO</th>
                  <th class="py-3 px-3 text-center">TRẠNG THÁI</th>
                  <th class="py-3 px-4 text-right">THAO TÁC</th>
                </tr>
              </thead>
              <tbody id="adminProductTableBody" class="divide-y divide-slate-100 dark:divide-slate-800/80">
                ${products.map(renderProductTableRow).join('')}
              </tbody>
            </table>
          </div>

          ${products.length === 0 ? `
            <div class="py-12 text-center text-slate-400 text-sm">
              Chưa có sản phẩm nào. Hãy bấm "+ Thêm sản phẩm mới" để bắt đầu!
            </div>
          ` : ''}
        </div>

      </div>
    `;
  }

  // Render 1 dòng trong bảng sản phẩm
  function renderProductTableRow(prod) {
    const iconSvg = (window.ShopVietData && typeof window.ShopVietData.getBrandIcon === 'function') 
      ? window.ShopVietData.getBrandIcon(prod.iconType || 'gemini') 
      : `<svg class="w-5 h-5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/></svg>`;

    let statusBadge = '';
    if (prod.status === 'out_of_stock' || prod.stock <= 0) {
      statusBadge = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/50">Hết hàng</span>`;
    } else if (prod.status === 'low_stock' || prod.stock <= 5) {
      statusBadge = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50">Sắp hết</span>`;
    } else {
      statusBadge = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50">Còn hàng</span>`;
    }

    return `
      <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group">
        <!-- ẢNH / ICON -->
        <td class="py-3 px-3.5 text-center">
          <div class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center p-2 mx-auto border border-slate-200 dark:border-slate-700 shadow-sm">
            ${iconSvg}
          </div>
        </td>

        <!-- TÊN SẢN PHẨM -->
        <td class="py-3 px-4">
          <div class="font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">${prod.name}</div>
          <div class="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
            <span>ID: <code class="font-mono text-slate-400">${prod.id}</code></span>
            ${prod.badge ? `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold ${prod.badgeColor || 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'} shadow-xs inline-block">${prod.badge}</span>` : ''}
          </div>
        </td>

        <!-- DANH MỤC -->
        <td class="py-3 px-3.5">
          <span class="inline-block px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
            ${prod.tag || 'AI Tool'}
          </span>
        </td>

        <!-- GIÁ BÁN -->
        <td class="py-3 px-3.5 font-bold text-indigo-600 dark:text-indigo-400">
          ${formatVND(prod.price)}
        </td>

        <!-- GIÁ GỐC -->
        <td class="py-3 px-3.5 text-slate-400 line-through text-xs">
          ${formatVND(prod.oldPrice || prod.price * 2)}
        </td>

        <!-- TỒN KHO -->
        <td class="py-3 px-3 text-center font-bold text-slate-800 dark:text-slate-200">
          ${prod.stock}
        </td>

        <!-- TRẠNG THÁI -->
        <td class="py-3 px-3 text-center">
          ${statusBadge}
        </td>

        <!-- THAO TÁC -->
        <td class="py-3 px-4 text-right">
          <div class="flex items-center justify-end gap-1.5">
            <button 
              type="button" 
              onclick="window.ShopVietViews.admin.openProductModal('${prod.id}')" 
              class="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold transition flex items-center gap-1"
            >
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              <span>Sửa</span>
            </button>
            <button 
              type="button" 
              onclick="window.ShopVietViews.admin.deleteProduct('${prod.id}')" 
              class="px-2 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-semibold transition"
              title="Xóa sản phẩm"
            >
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  // =========================================================================
  // TAB 2: THANH TOÁN VIETQR & ĐƠN HÀNG
  // =========================================================================
  function renderTabOrders() {
    const orders = (window.ShopVietState && window.ShopVietState.state && window.ShopVietState.state.orders) || [];
    
    // Tính toán thống kê nhanh
    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.amount || o.total) || 0), 0);
    const completedCount = orders.filter(o => o.status === 'completed').length;
    const pendingCount = orders.filter(o => o.status === 'pending').length;

    return `
      <div class="space-y-5">
        
        <!-- Thống Kê 3 Khối -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            </div>
            <div>
              <div class="text-xs font-medium text-slate-500">Tổng Đơn Hàng</div>
              <div class="text-xl font-black text-slate-900 dark:text-white mt-0.5">${orders.length} đơn</div>
            </div>
          </div>

          <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <div class="text-xs font-medium text-slate-500">Đã Hoàn Tất</div>
              <div class="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">${completedCount} đơn</div>
            </div>
          </div>

          <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div>
              <div class="text-xs font-medium text-slate-500">Doanh Thu Tích Lũy</div>
              <div class="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">${formatVND(totalRevenue)}</div>
            </div>
          </div>
        </div>

        <!-- Bảng Danh Sách Đơn Hàng -->
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div class="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h4 class="font-bold text-slate-900 dark:text-white text-sm">Danh Sách Đơn Hàng VietQR Mới Nhất</h4>
            <span class="text-xs text-slate-500">Đồng bộ tự động từ hệ thống thanh toán</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs sm:text-sm">
              <thead class="bg-slate-50 dark:bg-slate-950/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th class="py-3 px-4">MÃ ĐƠN</th>
                  <th class="py-3 px-3.5">NGÀY TẠO</th>
                  <th class="py-3 px-3.5">KHÁCH HÀNG</th>
                  <th class="py-3 px-4">GÓI SẢN PHẨM</th>
                  <th class="py-3 px-3.5">SỐ TIỀN</th>
                  <th class="py-3 px-3 text-center">TRẠNG THÁI</th>
                  <th class="py-3 px-3 text-center">BILL CHUYỂN KHOẢN</th>
                  <th class="py-3 px-4 text-right">THAO TÁC</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800/80">
                ${orders.length > 0 ? orders.map(renderOrderTableRow).join('') : `
                  <tr>
                    <td colspan="8" class="py-12 text-center text-slate-400">Chưa có đơn hàng nào phát sinh</td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  }

  // Render 1 dòng trong bảng đơn hàng
  function renderOrderTableRow(order, index) {
    const code = order.orderCode || order.id || `DJ2026${index + 100}`;
    const dateStr = order.createdAtFormatted || order.date || 'Hôm nay';
    const customerEmail = order.userEmail || (order.user && order.user.email) || (order.customer && order.customer.email) || (order.email) || 'cuongcuca111@gmail.com';
    const customerName = order.customerName || (order.user && order.user.name) || (order.customer && order.customer.name) || 'Minh Cường';
    const productName = order.productName || (order.items && order.items[0] && order.items[0].name) || 'Antigravity + Gemini Pro';
    const amount = order.amount || order.total || order.price || 69000;
    const isCompleted = order.status === 'completed';

    return `
      <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
        <!-- MÃ ĐƠN -->
        <td class="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
          ${code}
        </td>

        <!-- NGÀY TẠO -->
        <td class="py-3 px-3.5 text-xs text-slate-500">
          ${dateStr}
        </td>

        <!-- KHÁCH HÀNG -->
        <td class="py-3 px-3">
          <div class="font-bold text-slate-900 dark:text-white text-xs truncate max-w-[200px]" title="${customerEmail}">
            ${customerEmail}
          </div>
          <div class="text-[10px] text-slate-400 font-medium">
            ${customerName} • VietQR Sacombank
          </div>
        </td>

        <!-- GÓI SẢN PHẨM -->
        <td class="py-3 px-4 max-w-xs">
          <div class="font-medium text-slate-800 dark:text-slate-200 line-clamp-1">${productName}</div>
          ${order.licenseKey ? `<div class="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 line-clamp-1 mt-0.5">Key: ${order.licenseKey}</div>` : ''}
        </td>

        <!-- SỐ TIỀN -->
        <td class="py-3 px-3.5 font-bold text-slate-900 dark:text-white">
          ${formatVND(amount)}
        </td>

        <!-- TRẠNG THÁI -->
        <td class="py-3 px-3 text-center">
          ${order.status === 'completed' ? `
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              ✓ Hoàn tất
            </span>
          ` : order.status === 'pending_review' ? `
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 animate-pulse">
              <span>⏳</span> Chờ duyệt
            </span>
          ` : `
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
              Chờ thanh toán
            </span>
          `}
        </td>

        <!-- BILL CHUYỂN KHOẢN -->
        <td class="py-3 px-3 text-center">
          <button 
            type="button" 
            onclick="window.ShopVietViews.admin.viewBillModal('${code}', '${amount}')" 
            class="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
            <span>Xem bill</span>
          </button>
        </td>

        <!-- THAO TÁC -->
        <td class="py-3 px-4 text-right">
          <div class="flex items-center justify-end gap-1.5 flex-wrap">
            ${!isCompleted ? `
              <button 
                type="button" 
                onclick="window.ShopVietViews.admin.openDeliveryModal('${code}')" 
                class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1 cursor-pointer"
              >
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Duyệt đơn</span>
              </button>
            ` : `
              <button 
                type="button" 
                onclick="window.ShopVietViews.admin.openDeliveryModal('${code}')" 
                class="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-sm transition flex items-center gap-1 cursor-pointer" 
                title="Sửa link bản quyền riêng hoặc gửi lại tin nhắn dặn dò"
              >
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                <span>Tùy chỉnh gửi link</span>
              </button>
            `}
          </div>
          ${order.customDeliveryLink ? `
            <span class="text-[10px] text-emerald-600 dark:text-emerald-400 block font-mono mt-1">Đã gửi link riêng</span>
          ` : isCompleted ? `
            <span class="text-[10px] text-slate-400 block font-medium mt-1">Đã kích hoạt</span>
          ` : ''}
        </td>
      </tr>
    `;
  }

  // =========================================================================
  // TAB 3: CẤU HÌNH VIETQR
  // =========================================================================
  function renderTabVietQR() {
    const config = getVietQRConfig();
    const qrPreviewUrl = `https://api.vietqr.io/image/${config.bankId}-${config.accountNumber}-compact2.png?amount=69000&accountName=${encodeURIComponent(config.accountName)}&addInfo=${encodeURIComponent(config.memoPrefix + ' DEMO')}`;

    return `
      <div class="max-w-4xl mx-auto space-y-6">
        
        <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          <!-- Cột Trái: Form Chỉnh Sửa Thông Tin Ngân Hàng -->
          <div class="md:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div>
              <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <svg class="w-4 h-4 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                <span>Cấu hình tài khoản nhận tiền VietQR</span>
              </h3>
              <p class="text-xs text-slate-500 mt-1">Thông tin này sẽ được gắn tự động vào mã QR tạo ra khi khách bấm Đặt Hàng.</p>
            </div>

            <form id="adminVietQRForm" onsubmit="event.preventDefault(); window.ShopVietViews.admin.saveVietQRSettings();" class="space-y-4 pt-2">
              
              <!-- Chọn Ngân Hàng -->
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Ngân hàng thụ hưởng</label>
                <select 
                  id="adminVietQRBank" 
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  onchange="window.ShopVietViews.admin.updateQRPreview()"
                >
                  ${SUPPORTED_BANKS.map(b => `
                    <option value="${b.id}" ${b.id === config.bankId ? 'selected' : ''}>${b.name} (${b.code})</option>
                  `).join('')}
                </select>
              </div>

              <!-- Số Tài Khoản (STK) -->
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Số tài khoản (STK)</label>
                <input 
                  type="text" 
                  id="adminVietQRAccountNumber" 
                  value="${config.accountNumber}" 
                  placeholder="Ví dụ: 00223366888" 
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                  oninput="window.ShopVietViews.admin.updateQRPreview()"
                >
              </div>

              <!-- Tên Chủ Tài Khoản -->
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Tên chủ tài khoản (In hoa không dấu)</label>
                <input 
                  type="text" 
                  id="adminVietQRAccountName" 
                  value="${config.accountName}" 
                  placeholder="Ví dụ: NGUYEN VAN HUY" 
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase font-semibold"
                  oninput="window.ShopVietViews.admin.updateQRPreview()"
                >
              </div>

              <!-- Tiền Tố Lời Nhắn Chuyển Khoản -->
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">Tiền tố cú pháp chuyển khoản</label>
                <input 
                  type="text" 
                  id="adminVietQRMemoPrefix" 
                  value="${config.memoPrefix}" 
                  placeholder="Ví dụ: SHOPVIET" 
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold uppercase"
                  oninput="window.ShopVietViews.admin.updateQRPreview()"
                >
                <span class="text-[11px] text-slate-400 mt-1 block">Ví dụ tạo nội dung: <code>${config.memoPrefix} DJ202688</code></span>
              </div>

              <!-- Nút Lưu -->
              <div class="pt-2">
                <button 
                  type="submit" 
                  class="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-500/20 transition flex items-center justify-center gap-2"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  <span>Lưu Cấu Hình VietQR</span>
                </button>
              </div>

            </form>
          </div>

          <!-- Cột Phải: Live VietQR Preview -->
          <div class="md:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Xem Trước Mã VietQR Live</span>
            
            <div class="p-3 bg-white rounded-2xl shadow-lg border border-slate-200 max-w-[240px] w-full">
              <img 
                id="adminVietQRPreviewImg" 
                src="${qrPreviewUrl}" 
                alt="VietQR Preview" 
                class="w-full h-auto rounded-xl object-contain"
                onerror="this.src='https://api.vietqr.io/image/970422-00223366888-compact2.png'"
              >
            </div>

            <div class="text-xs text-slate-500 space-y-1">
              <div class="font-bold text-slate-900 dark:text-white" id="adminPreviewBankTitle">${config.bankName}</div>
              <div class="font-mono" id="adminPreviewSTK">STK: ${config.accountNumber}</div>
              <div class="font-semibold text-indigo-600 dark:text-indigo-400" id="adminPreviewOwner">${config.accountName}</div>
            </div>
          </div>

        </div>

      </div>
    `;
  }

  // =========================================================================
  // TAB 4: MÃ QUÀ TẶNG & GIẢM GIÁ (VOUCHERS & GIFTS)
  // =========================================================================
  function renderTabVouchers() {
    const vouchers = (window.ShopVietState && window.ShopVietState.getVouchers) ? window.ShopVietState.getVouchers() : [];
    
    // Thống kê nhanh
    const totalCount = vouchers.length;
    const usedCount = vouchers.filter(v => v.isUsed).length;
    const availableCount = totalCount - usedCount;
    const totalDiscountGiven = vouchers.filter(v => v.isUsed).reduce((sum, v) => sum + (Number(v.value) || 0), 0);

    return `
      <div class="space-y-5">
        
        <!-- Thống Kê 4 Khối Thẻ Hiện Đại -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <!-- Tổng mã -->
          <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
            <div class="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 12 20 22 4 22 4 12" />
                <rect x="2" y="7" width="20" height="5" />
                <line x1="12" y1="22" x2="12" y2="7" />
                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
              </svg>
            </div>
            <div>
              <div class="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Tổng mã voucher</div>
              <div class="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">${totalCount} mã</div>
            </div>
          </div>

          <!-- Sẵn sàng dùng -->
          <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
            <div class="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <div class="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Chưa sử dụng</div>
              <div class="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">${availableCount} mã</div>
            </div>
          </div>

          <!-- Đã dùng -->
          <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
            <div class="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div>
              <div class="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Đã sử dụng</div>
              <div class="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">${usedCount} mã</div>
            </div>
          </div>

          <!-- Tổng tiền đã giảm -->
          <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
            <div class="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <div>
              <div class="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Tổng tiền đã giảm</div>
              <div class="text-lg sm:text-xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">${formatVND(totalDiscountGiven)}</div>
            </div>
          </div>
        </div>

        <!-- Toolbar Phía Trên: Nút + Tạo mã mới & Ô Tìm kiếm -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          
          <div class="flex items-center gap-2">
            <!-- Nút + Tạo mã mới -->
            <button 
              type="button" 
              onclick="window.ShopVietViews.admin.openVoucherModal()" 
              class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-colors shrink-0"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <span>Tạo mã mới</span>
            </button>

            <!-- Nút Nạp mã mặc định mẫu -->
            <button 
              type="button" 
              onclick="window.ShopVietViews.admin.resetDefaultVouchers()" 
              title="Khôi phục mã mẫu nếu rỗng"
              class="p-2 sm:px-3 sm:py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition"
            >
              Khôi phục mẫu
            </button>
          </div>

          <!-- Ô Tìm kiếm voucher -->
          <div class="relative flex-1 max-w-sm">
            <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input 
              type="text" 
              id="adminVoucherSearchInput" 
              oninput="window.ShopVietViews.admin.filterVouchers(this.value)" 
              placeholder="Tìm mã voucher, người dùng, loại mã..." 
              class="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
          </div>

        </div>

        <!-- Bảng Danh Sách Voucher -->
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div class="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h4 class="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <svg class="w-4 h-4 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 12 20 22 4 22 4 12"/>
                <rect x="2" y="7" width="20" height="5"/>
                <line x1="12" y1="22" x2="12" y2="7"/>
                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
              </svg>
              <span>Kho mã quà tặng & giảm giá</span>
              <span class="text-xs px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold" id="adminVoucherTableBadge">${vouchers.length} mã</span>
            </h4>
            <span class="text-xs text-slate-500">Mã có hiệu lực áp dụng tại trang Đặt hàng & Nạp ví</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs sm:text-sm" id="adminVoucherTable">
              <thead class="bg-slate-50 dark:bg-slate-950/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th class="py-3 px-4">MÃ VOUCHER</th>
                  <th class="py-3 px-3.5">LOẠI MÃ</th>
                  <th class="py-3 px-3.5">GIÁ TRỊ GIẢM</th>
                  <th class="py-3 px-3.5 text-center">TRẠNG THÁI</th>
                  <th class="py-3 px-4">NGƯỜI ĐÃ DÙNG (EMAIL)</th>
                  <th class="py-3 px-3.5">ĐƠN HÀNG</th>
                  <th class="py-3 px-3.5">THỜI GIAN</th>
                  <th class="py-3 px-4 text-right">THAO TÁC</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800/80" id="adminVoucherTableTbody">
                ${vouchers.length > 0 ? vouchers.map(renderVoucherTableRow).join('') : `
                  <tr>
                    <td colspan="8" class="py-12 text-center text-slate-400">
                      <div class="flex flex-col items-center justify-center gap-2">
                        <svg class="w-10 h-10 text-slate-300 dark:text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /></svg>
                        <span>Chưa có mã voucher nào. Hãy bấm "+ Tạo mã mới" để thêm mã đầu tiên!</span>
                      </div>
                    </td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  }

  // Render 1 dòng trong bảng voucher
  function renderVoucherTableRow(v) {
    const isUsed = !!v.isUsed;
    const isPercent = v.type === 'percent_discount' || (v.percent !== undefined && v.percent !== null);
    const typeLabel = v.type === 'wallet_gift' 
      ? 'Nạp tiền vào ví' 
      : (isPercent ? 'Giảm theo % đơn hàng' : 'Giảm số tiền cố định (VNĐ)');
    const typeBadge = v.type === 'wallet_gift' 
      ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800'
      : (isPercent 
        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
        : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800');

    const discountText = isPercent ? `-${v.percent || v.value}%` : `-${formatVND(v.value)}`;

    return `
      <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors" data-code="${(v.code || '').toLowerCase()}" data-user="${(v.usedBy || '').toLowerCase()}">
        <!-- MÃ VOUCHER -->
        <td class="py-3 px-4">
          <div class="flex items-center gap-2">
            <span class="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/60">${v.code}</span>
            <button 
              type="button" 
              onclick="navigator.clipboard.writeText('${v.code}'); window.ShopVietState.showToast('Đã sao chép mã ${v.code}!', 'info');" 
              title="Sao chép mã"
              class="text-slate-400 hover:text-indigo-600 transition p-1"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </button>
          </div>
        </td>

        <!-- LOẠI MÃ -->
        <td class="py-3 px-3.5">
          <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${typeBadge}">
            ${typeLabel}
          </span>
        </td>

        <!-- GIÁ TRỊ GIẢM -->
        <td class="py-3 px-3.5 font-bold text-emerald-600 dark:text-emerald-400 text-sm">
          ${discountText}
        </td>

        <!-- TRẠNG THÁI -->
        <td class="py-3 px-3.5 text-center">
          ${isUsed ? `
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
              Đã sử dụng
            </span>
          ` : `
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Chưa sử dụng
            </span>
          `}
        </td>

        <!-- NGƯỜI ĐÃ DÙNG (EMAIL) -->
        <td class="py-3 px-4">
          ${isUsed && v.usedBy ? `
            <div class="flex items-center gap-1.5">
              <div class="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                ${v.usedBy.charAt(0).toUpperCase()}
              </div>
              <span class="font-medium text-slate-800 dark:text-slate-200 text-xs">${v.usedBy}</span>
            </div>
            <div class="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">Đã được giảm ${discountText}</div>
          ` : `
            <span class="text-slate-400 text-xs">-</span>
          `}
        </td>

        <!-- ĐƠN HÀNG -->
        <td class="py-3 px-3.5">
          ${v.orderCode ? `
            <span class="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">${v.orderCode}</span>
          ` : `
            <span class="text-slate-400">-</span>
          `}
        </td>

        <!-- THỜI GIAN -->
        <td class="py-3 px-3.5 text-xs text-slate-500">
          ${isUsed && v.usedAt ? `
            <div class="font-medium text-slate-700 dark:text-slate-300">${formatDateTime(v.usedAt)}</div>
            <div class="text-[10px] text-slate-400">Tạo: ${formatDateTime(v.createdAt)}</div>
          ` : `
            <div>Tạo: ${formatDateTime(v.createdAt)}</div>
          `}
        </td>

        <!-- THAO TÁC -->
        <td class="py-3 px-4 text-right">
          <button 
            type="button" 
            onclick="window.ShopVietViews.admin.deleteVoucher('${v.code}')" 
            title="Xóa voucher" 
            class="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
        </td>
      </tr>
    `;
  }

  // =========================================================================
  // TAB 5: QUẢN LÝ KHÁCH & HẸN LỊCH (EXCEL / SPREADSHEET)
  // =========================================================================
  function renderTabSchedules() {
    const schedules = (window.ShopVietState && window.ShopVietState.getSchedules) ? window.ShopVietState.getSchedules() : [];
    
    // Thống kê hạn dùng
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let activeCount = 0;
    let expiringCount = 0;
    let expiredCount = 0;

    schedules.forEach(s => {
      const exp = new Date(s.expireDate);
      exp.setHours(0, 0, 0, 0);
      const diffMs = exp.getTime() - today.getTime();
      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (daysLeft > 7) {
        activeCount++;
      } else if (daysLeft > 0) {
        expiringCount++;
      } else {
        expiredCount++;
      }
    });

    return `
      <div class="space-y-5">
        
        <!-- Thống Kê 4 Khối Thẻ Hiện Đại -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <!-- Tổng khách hẹn lịch -->
          <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
            <div class="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div>
              <div class="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Tổng khách hẹn lịch</div>
              <div class="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">${schedules.length} khách</div>
            </div>
          </div>

          <!-- Đang hoạt động -->
          <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
            <div class="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div>
              <div class="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Đang sử dụng (>7 ngày)</div>
              <div class="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">${activeCount} khách</div>
            </div>
          </div>

          <!-- Sắp hết hạn -->
          <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
            <div class="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div>
              <div class="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Sắp hết hạn (≤7 ngày)</div>
              <div class="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">${expiringCount} khách</div>
            </div>
          </div>

          <!-- Đã hết hạn -->
          <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
            <div class="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            </div>
            <div>
              <div class="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Đã hết hạn</div>
              <div class="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5">${expiredCount} khách</div>
            </div>
          </div>
        </div>

        <!-- Toolbar Phía Trên: Nút + Thêm email khách hàng, Xuất Excel & Ô Tìm kiếm -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          
          <div class="flex items-center flex-wrap gap-2">
            <!-- Nút + Thêm email khách hàng -->
            <button 
              type="button" 
              onclick="window.ShopVietViews.admin.openScheduleModal(null)" 
              class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-colors shrink-0"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <span>Thêm email khách hàng</span>
            </button>

            <!-- Nút Xuất Excel (CSV) -->
            <button 
              type="button" 
              onclick="window.ShopVietViews.admin.exportSchedulesToExcel()" 
              class="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-colors shrink-0"
              title="Xuất bảng tính hiện tại ra file CSV tương thích Microsoft Excel"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <polyline points="9 15 12 18 15 15"/>
              </svg>
              <span>Xuất Excel</span>
            </button>

            <!-- Nút Khôi phục dữ liệu mẫu -->
            <button 
              type="button" 
              onclick="window.ShopVietViews.admin.resetDefaultSchedules()" 
              title="Khôi phục danh sách hẹn lịch mẫu" 
              class="p-2 sm:px-3 sm:py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition shrink-0"
            >
              Khôi phục mẫu
            </button>
          </div>

          <!-- Ô Tìm Kiếm Email khách, Quản lý, Gói -->
          <div class="relative w-full sm:w-72">
            <svg class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input 
              type="text" 
              id="adminScheduleSearchInput"
              oninput="window.ShopVietViews.admin.filterSchedules(this.value)" 
              placeholder="Tìm email khách, slot, gói..." 
              class="w-full pl-9 pr-4 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            >
          </div>

        </div>

        <!-- Bảng Tính Excel Thông Minh (Smart Spreadsheet Table) -->
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div class="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
            <div class="flex items-center gap-2">
              <span class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <svg class="w-4 h-4 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18"/>
                </svg>
                <span>Bảng tính Excel quản lý khách & hẹn lịch slot</span>
              </span>
              <span class="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 text-xs font-semibold" id="adminScheduleTableBadge">
                ${schedules.length} bản ghi
              </span>
            </div>
            <div class="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Click trực tiếp vào ô để sửa & ấn nút <b>Lưu</b> (hoặc Enter) để đồng bộ tức thì lên Đám Mây Cloud</span>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/50 text-[11px] text-slate-500 uppercase tracking-wider font-bold">
                  <th class="py-3 px-3 text-center w-12">STT</th>
                  <th class="py-3 px-3.5">Email Khách Hàng</th>
                  <th class="py-3 px-3.5">Email Quản Lý / Slot</th>
                  <th class="py-3 px-3.5">Gói Dịch Vụ</th>
                  <th class="py-3 px-3 text-center">Ngày Bắt Đầu</th>
                  <th class="py-3 px-3 text-center">Ngày Hết Hạn</th>
                  <th class="py-3 px-3.5 text-center">Trạng Thái Hạn Dùng</th>
                  <th class="py-3 px-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody id="adminScheduleTableTbody" class="divide-y divide-slate-100 dark:divide-slate-800/60">
                ${schedules.length > 0 ? schedules.map((s, idx) => renderScheduleTableRow(s, idx)).join('') : `
                  <tr>
                    <td colspan="8" class="py-12 text-center text-slate-400">Chưa có lịch hẹn khách hàng nào được tạo</td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  }

  // Render 1 dòng trong Bảng Excel Hẹn Lịch với Inline Editable & Nút Lưu Cloud
  function renderScheduleTableRow(s, index) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(s.expireDate);
    exp.setHours(0, 0, 0, 0);
    const diffMs = exp.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    let statusBadge = '';
    if (daysLeft > 7) {
      statusBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 shadow-sm"><span class="w-2 h-2 rounded-full bg-emerald-500"></span>Còn ${daysLeft} ngày</span>`;
    } else if (daysLeft > 0) {
      statusBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-300 dark:border-amber-800 shadow-sm animate-pulse"><span class="w-2 h-2 rounded-full bg-amber-500"></span>Sắp hết (${daysLeft} ngày)</span>`;
    } else {
      statusBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-300 dark:border-rose-800 shadow-sm"><span class="w-2 h-2 rounded-full bg-rose-500"></span>Đã hết hạn</span>`;
    }

    const customerEmail = s.customerEmail || 'cuongcuca111@gmail.com';
    const customerName = s.customerName || 'Minh Cường';
    const managerEmail = s.managerEmail || 'slot1-pro@shopviet.vip';
    const serviceName = s.serviceName || '[1 Tháng] Gemini Argon 4 Pro + 5TB Drive';
    const notes = s.notes || '';

    return `
      <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors" data-id="${s.id}" data-customer="${customerEmail.toLowerCase()}" data-manager="${managerEmail.toLowerCase()}" data-service="${serviceName.toLowerCase()}" data-notes="${notes.toLowerCase()}">
        <!-- STT -->
        <td class="py-2.5 px-3 text-center font-mono text-slate-400 font-semibold text-xs">
          ${index + 1}
        </td>

        <!-- EMAIL KHÁCH HÀNG (INLINE EDITABLE) -->
        <td class="py-2 px-3">
          <input 
            type="text" 
            id="sched-customer-${s.id}" 
            value="${customerEmail}" 
            placeholder="cuongcuca111@gmail.com"
            onkeydown="if(event.key==='Enter') window.ShopVietViews.admin.saveInlineSchedule('${s.id}')"
            title="Click trực tiếp vào ô để sửa Email Khách Hàng (Enter để Lưu)"
            class="w-full bg-transparent hover:bg-slate-100/80 dark:hover:bg-slate-800/80 border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 dark:text-white focus:outline-none transition-all"
          />
          <div class="px-2 text-[10px] text-slate-400 font-medium truncate max-w-[200px]" title="${customerName}">
            ${customerName}
          </div>
        </td>

        <!-- EMAIL QUẢN LÝ / SLOT (INLINE EDITABLE) -->
        <td class="py-2 px-3">
          <input 
            type="text" 
            id="sched-manager-${s.id}" 
            value="${managerEmail}" 
            placeholder="slot1-pro@shopviet.vip"
            onkeydown="if(event.key==='Enter') window.ShopVietViews.admin.saveInlineSchedule('${s.id}')"
            title="Click trực tiếp vào ô để sửa Email Slot (Enter để Lưu)"
            class="w-full bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/40 hover:border-indigo-400 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 rounded-lg px-2.5 py-1 text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400 focus:outline-none transition-all"
          />
        </td>

        <!-- GÓI DỊCH VỤ (INLINE EDITABLE) -->
        <td class="py-2 px-3 max-w-[220px]">
          <input 
            type="text" 
            id="sched-service-${s.id}" 
            value="${serviceName}" 
            placeholder="Tên gói dịch vụ..."
            onkeydown="if(event.key==='Enter') window.ShopVietViews.admin.saveInlineSchedule('${s.id}')"
            title="Click trực tiếp vào ô để sửa Gói Dịch Vụ (Enter để Lưu)"
            class="w-full bg-transparent hover:bg-slate-100/80 dark:hover:bg-slate-800/80 border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none transition-all"
          />
          ${notes ? `<div class="px-2 text-[10px] text-slate-400 line-clamp-1 italic">${notes}</div>` : ''}
        </td>

        <!-- NGÀY BẮT ĐẦU (INLINE EDITABLE) -->
        <td class="py-2 px-2 text-center">
          <input 
            type="date" 
            id="sched-start-${s.id}" 
            value="${s.startDate || ''}" 
            onchange="window.ShopVietViews.admin.updateScheduleDaysLeftBadge('${s.id}')"
            onkeydown="if(event.key==='Enter') window.ShopVietViews.admin.saveInlineSchedule('${s.id}')"
            title="Click để chọn Ngày bắt đầu"
            class="bg-transparent hover:bg-slate-100/80 dark:hover:bg-slate-800/80 border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 rounded-lg px-1.5 py-1 text-xs font-mono text-slate-600 dark:text-slate-400 focus:outline-none transition-all"
          />
        </td>

        <!-- NGÀY HẾT HẠN (INLINE EDITABLE) -->
        <td class="py-2 px-2 text-center">
          <input 
            type="date" 
            id="sched-expire-${s.id}" 
            value="${s.expireDate || ''}" 
            onchange="window.ShopVietViews.admin.updateScheduleDaysLeftBadge('${s.id}')"
            onkeydown="if(event.key==='Enter') window.ShopVietViews.admin.saveInlineSchedule('${s.id}')"
            title="Click để chọn Ngày hết hạn"
            class="bg-transparent hover:bg-slate-100/80 dark:hover:bg-slate-800/80 border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 rounded-lg px-1.5 py-1 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:outline-none transition-all"
          />
        </td>

        <!-- TRẠNG THÁI HẠN DÙNG (TỰ ĐỘNG CẬP NHẬT TỨC THÌ) -->
        <td class="py-2 px-3.5 text-center whitespace-nowrap" id="sched-badge-cell-${s.id}">
          ${statusBadge}
        </td>

        <!-- THAO TÁC: NÚT LƯU CLOUD (THAY NÚT BÚT CHÌ) & NÚT XÓA -->
        <td class="py-2 px-3 text-right whitespace-nowrap">
          <div class="flex items-center justify-end gap-1.5">
            <button 
              type="button" 
              id="btn-save-sched-${s.id}" 
              onclick="window.ShopVietViews.admin.saveInlineSchedule('${s.id}')" 
              title="Lưu thay đổi dòng này lên Đám mây Cloud (không mất khi reset hoặc đổi máy)" 
              class="px-2.5 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
            >
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              <span>Lưu</span>
            </button>
            <button 
              type="button" 
              onclick="window.ShopVietViews.admin.deleteSchedule('${s.id}')" 
              title="Xóa lịch hẹn" 
              class="p-1.5 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-all"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  // =========================================================================
  // MODAL THÊM / SỬA KHÁCH HÀNG HẸN LỊCH EXCEL (#adminAddScheduleModal)
  // =========================================================================
  function renderScheduleModal(scheduleId) {
    let schedule = null;
    if (scheduleId) {
      const list = (window.ShopVietState && window.ShopVietState.getSchedules) ? window.ShopVietState.getSchedules() : [];
      schedule = list.find(s => s.id === scheduleId);
    }

    const isEdit = !!schedule;
    const customerEmail = schedule ? schedule.customerEmail : 'cuongcuca111@gmail.com';
    const customerName = schedule ? schedule.customerName : 'Minh Cường';
    const managerEmail = schedule ? schedule.managerEmail : 'slot1-pro@shopviet.vip';
    const serviceName = schedule ? schedule.serviceName : '[1 Tháng] Gemini Argon 4 Pro + 5TB Drive';
    const startDate = schedule ? schedule.startDate : new Date().toISOString().split('T')[0];
    const defaultExpire = new Date();
    defaultExpire.setMonth(defaultExpire.getMonth() + 1);
    const expireDate = schedule ? schedule.expireDate : defaultExpire.toISOString().split('T')[0];
    const notes = schedule ? schedule.notes : '';

    return `
      <div id="adminAddScheduleModal" class="fixed inset-0 z-[65] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-slide-up">
          
          <!-- Header Modal -->
          <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/70">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <div>
                <h3 class="font-extrabold text-base text-slate-900 dark:text-white">${isEdit ? 'Cập Nhật Lịch Hẹn Khách Hàng' : 'Thêm Email Khách Hàng Vào Bảng Excel'}</h3>
                <p class="text-xs text-slate-500">${isEdit ? `Mã lịch: ${schedule.id}` : 'Quản lý lịch hẹn slot bản quyền trực tiếp trên bảng tính'}</p>
              </div>
            </div>

            <button 
              type="button" 
              onclick="window.ShopVietViews.admin.closeScheduleModal()" 
              class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <!-- Body Form -->
          <form id="scheduleForm" onsubmit="event.preventDefault(); window.ShopVietViews.admin.saveScheduleFromModal('${scheduleId || ''}');" class="p-6 space-y-4 text-xs sm:text-sm">
            
            <!-- Email & Tên khách hàng -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email Khách Hàng (*)</label>
                <input 
                  type="email" 
                  id="modalSchCustomerEmail" 
                  required 
                  value="${customerEmail}"
                  placeholder="cuongcuca111@gmail.com" 
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
              </div>
              <div>
                <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tên Khách Hàng</label>
                <input 
                  type="text" 
                  id="modalSchCustomerName" 
                  value="${customerName}"
                  placeholder="Minh Cường" 
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
              </div>
            </div>

            <!-- Email Quản Lý (Slot) -->
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email Quản Lý Slot (*)</label>
              <input 
                type="text" 
                id="modalSchManagerEmail" 
                required 
                value="${managerEmail}"
                placeholder="slot1-pro@shopviet.vip hoặc admin-slot@shopviet.vip" 
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono font-semibold text-indigo-600 dark:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
              <p class="text-[11px] text-slate-400 mt-1">Dùng để phân chia slot quản trị và thông báo khi gia hạn.</p>
            </div>

            <!-- Gói Dịch Vụ -->
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Gói Dịch Vụ (*)</label>
              <select 
                id="modalSchService" 
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
              >
                <option value="[1 Tháng] Gemini Argon 4 Pro + 5TB Drive" ${serviceName.includes('Argon') || serviceName.includes('Gemini') ? 'selected' : ''}>[1 Tháng] Gemini Argon 4 Pro + 5TB Drive</option>
                <option value="[1 Năm] Gemini Argon 4 Pro + 2TB Google One" ${serviceName.includes('1 Năm] Gemini') ? 'selected' : ''}>[1 Năm] Gemini Argon 4 Pro + 2TB Google One</option>
                <option value="Cursor Pro 1 Tháng Chính Chủ" ${serviceName.includes('Cursor') ? 'selected' : ''}>Cursor Pro 1 Tháng Chính Chủ</option>
                <option value="ChatGPT Plus Chính Chủ GPT-4o" ${serviceName.includes('ChatGPT') ? 'selected' : ''}>ChatGPT Plus Chính Chủ GPT-4o</option>
                <option value="Canva Pro Edu 1 Năm Vĩnh Viễn" ${serviceName.includes('Canva') ? 'selected' : ''}>Canva Pro Edu 1 Năm Vĩnh Viễn</option>
                <option value="CapCut Pro 1 Năm Bản Quyền" ${serviceName.includes('CapCut') ? 'selected' : ''}>CapCut Pro 1 Năm Bản Quyền</option>
                <option value="Claude 3.5 Sonnet / Opus Pro" ${serviceName.includes('Claude') ? 'selected' : ''}>Claude 3.5 Sonnet / Opus Pro</option>
              </select>
            </div>

            <!-- Ngày bắt đầu & Ngày hết hạn -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Ngày Bắt Đầu</label>
                <input 
                  type="date" 
                  id="modalSchStartDate" 
                  value="${startDate}" 
                  class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
              </div>
              <div>
                <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Ngày Hết Hạn (*)</label>
                <input 
                  type="date" 
                  id="modalSchExpireDate" 
                  required 
                  value="${expireDate}" 
                  class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono font-bold text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
              </div>
            </div>

            <!-- Nút chọn nhanh thời hạn -->
            <div>
              <span class="block text-[11px] font-bold text-slate-500 mb-1.5">Chọn nhanh thời hạn (tính từ ngày bắt đầu):</span>
              <div class="flex flex-wrap gap-1.5">
                <button type="button" onclick="window.ShopVietViews.admin.setScheduleQuickExpire(1)" class="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold transition">+1 Tháng</button>
                <button type="button" onclick="window.ShopVietViews.admin.setScheduleQuickExpire(3)" class="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold transition">+3 Tháng</button>
                <button type="button" onclick="window.ShopVietViews.admin.setScheduleQuickExpire(6)" class="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold transition">+6 Tháng</button>
                <button type="button" onclick="window.ShopVietViews.admin.setScheduleQuickExpire(12)" class="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold transition">+1 Năm</button>
                <button type="button" onclick="window.ShopVietViews.admin.setScheduleQuickExpire(18)" class="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold transition">+18 Tháng</button>
              </div>
            </div>

            <!-- Ghi Chú -->
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Ghi Chú</label>
              <textarea 
                id="modalSchNotes" 
                rows="2" 
                placeholder="Khách VIP nâng cấp chính chủ, cần gọi nhắc trước 3 ngày..." 
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >${notes}</textarea>
            </div>

            <!-- Footer Buttons -->
            <div class="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button 
                type="button" 
                onclick="window.ShopVietViews.admin.closeScheduleModal()" 
                class="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition text-xs"
              >
                Hủy
              </button>
              <button 
                type="submit" 
                class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 text-xs"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
                <span>Lưu vào bảng Excel</span>
              </button>
            </div>

          </form>

        </div>
      </div>
    `;
  }

  // =========================================================================
  // TAB 6: TRẠM PHÁT SÓNG THỜI GIAN THỰC (REALTIME SYNC HUB)
  // =========================================================================
  function renderTabRealtime() {
    const products = (window.ShopVietData && window.ShopVietData.products) || [];
    const vouchers = (window.ShopVietState && window.ShopVietState.getVouchers) ? window.ShopVietState.getVouchers() : [];
    const orders = (window.ShopVietState && window.ShopVietState.state && window.ShopVietState.state.orders) || [];
    const lastTimeDisplay = getLastBroadcastTimeDisplay();
    const history = getBroadcastHistory();

    return `
      <div class="max-w-5xl mx-auto space-y-6 animate-fade-in">
        
        <!-- BANNER TRẠM PHÁT SÓNG REALTIME CHÍNH -->
        <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-emerald-950 p-6 sm:p-8 text-white border border-indigo-500/20 shadow-2xl">
          <!-- Background Glow Effect -->
          <div class="absolute -top-24 -right-24 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>

          <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div class="space-y-3">
              <div class="flex flex-wrap items-center gap-2.5">
                <div class="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <svg class="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/>
                    <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/>
                    <circle cx="12" cy="2"/>
                    <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/>
                    <path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1"/>
                  </svg>
                </div>
                <div>
                  <h3 class="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                    <span>Trạm Phát Sóng Thời Gian Thực (Realtime Sync Hub)</span>
                  </h3>
                  <p class="text-xs text-slate-300 font-medium">Trung tâm phát tín hiệu đồng bộ đa tab, đa thiết bị và Cloud Realtime tức thì</p>
                </div>
              </div>

              <!-- Badges -->
              <div class="flex flex-wrap items-center gap-2 pt-1">
                <!-- Huy hiệu 🟢 Phát sóng Live Active -->
                <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 backdrop-blur-sm shadow-sm">
                  <span class="relative flex h-2.5 w-2.5">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                  </span>
                  <span>🟢 Phát sóng Live Active</span>
                </span>

                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/10 text-slate-200 border border-white/10">
                  <svg class="w-3.5 h-3.5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                  <span>Kênh: shopviet_realtime_sync</span>
                </span>

                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/10 text-slate-200 border border-white/10">
                  <svg class="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  <span>Độ trễ: &lt; 30ms</span>
                </span>
              </div>
            </div>

            <!-- Nút Hành Động Phát Sóng Nổi Bật -->
            <div class="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
              <!-- NÚT MASTER PHỤ TRONG TRẠM REALTIME HUB -->
              <button 
                type="button" 
                onclick="window.ShopVietViews.admin.masterPublish()" 
                class="px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 text-white font-black text-xs sm:text-sm tracking-wide shadow-xl shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span class="relative flex h-2.5 w-2.5 shrink-0">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                </span>
                <svg class="w-4 h-4 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                  <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
                  <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
                  <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
                  <path d="M12 9V4s3.03.55 4 2c1.08 1.62 0 5 0 5"/>
                </svg>
                <span>🚀 XUẤT BẢN &amp; ĐỒNG BỘ TOÀN CẦU TỨC THÌ</span>
              </button>

              <button 
                type="button" 
                onclick="window.ShopVietViews.admin.broadcastTestPing()" 
                class="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-xl shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg class="w-4 h-4 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
                <span>⚡ Phát Tín Hiệu Đồng Bộ Thử Nghiệm (Broadcast Test Ping)</span>
              </button>

              <button 
                type="button" 
                onclick="window.ShopVietViews.admin.broadcastProductsSync()" 
                class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/15 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg class="w-3.5 h-3.5 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                  <path d="M3 3v5h5"/>
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
                  <path d="M16 21h5v-5"/>
                </svg>
                <span>Phát sóng đồng bộ lại toàn bộ Sản phẩm</span>
              </button>
            </div>
          </div>
        </div>

        <!-- BENTO THÔNG SỐ TRẠM PHÁT SÓNG (4 CARD) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Card 1: Số lượng sản phẩm đang đồng bộ -->
          <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sản phẩm đồng bộ</span>
              <div class="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
              </div>
            </div>
            <div class="mt-4">
              <div class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white" id="adminRealtimeProductCount">${products.length}</div>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Đang phát trực tiếp tới tất cả máy khách</span>
              </p>
            </div>
          </div>

          <!-- Card 2: Thời gian phát sóng cuối cùng -->
          <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Lần phát sóng cuối</span>
              <div class="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
            </div>
            <div class="mt-4">
              <div class="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-mono" id="adminRealtimeLastBroadcast">${lastTimeDisplay}</div>
              <p class="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <span>⚡ Cập nhật tự động khi Admin lưu</span>
              </p>
            </div>
          </div>

          <!-- Card 3: Cấu hình VietQR hiện thời -->
          <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">VietQR Live Target</span>
              <div class="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              </div>
            </div>
            <div class="mt-4">
              <div class="text-sm font-bold text-slate-900 dark:text-white truncate">100071864927</div>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">LE BUI MINH CUONG (STB)</p>
            </div>
          </div>

          <!-- Card 4: Gói Voucher & Đơn hàng -->
          <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Hệ sinh thái đồng bộ</span>
              <div class="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              </div>
            </div>
            <div class="mt-4">
              <div class="text-base font-bold text-slate-900 dark:text-white">${vouchers.length} Vouchers • ${orders.length} Đơn</div>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Đồng bộ đa luồng 2 chiều</p>
            </div>
          </div>
        </div>

        <!-- CỘT CHỨC NĂNG PHÁT SÓNG NHANH & NHẬT KÝ BROADCAST -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <!-- Trái: Khối điều khiển phát sóng thủ công -->
          <div class="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div>
              <h4 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                <span>Khối Điều Khiển Tín Hiệu Thủ Công</span>
              </h4>
              <p class="text-xs text-slate-500 mt-0.5">Bấm để ép phát sóng tín hiệu tới tất cả tab & client đang mở trang.</p>
            </div>

            <div class="space-y-2.5 pt-1">
              <!-- Nút 1: Test Ping -->
              <button 
                type="button" 
                onclick="window.ShopVietViews.admin.broadcastTestPing()" 
                class="w-full px-4 py-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-bold text-xs flex items-center justify-between transition cursor-pointer"
              >
                <div class="flex items-center gap-2.5">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span>⚡ Phát Tín Hiệu Đồng Bộ Thử Nghiệm</span>
                </div>
                <span class="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-200/60 dark:bg-emerald-800/60">Test Ping</span>
              </button>

              <!-- Nút 2: Phát sóng Sản phẩm -->
              <button 
                type="button" 
                onclick="window.ShopVietViews.admin.broadcastProductsSync()" 
                class="w-full px-4 py-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 font-bold text-xs flex items-center justify-between transition cursor-pointer"
              >
                <div class="flex items-center gap-2.5">
                  <svg class="w-4 h-4 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                  <span>📦 Phát Sóng Đồng Bộ Lại Sản Phẩm</span>
                </div>
                <span class="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-200/60 dark:bg-indigo-800/60">${products.length} Gói</span>
              </button>

              <!-- Nút 3: Phát sóng VietQR -->
              <button 
                type="button" 
                onclick="window.ShopVietViews.admin.broadcastVietQRSync()" 
                class="w-full px-4 py-3 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 font-bold text-xs flex items-center justify-between transition cursor-pointer"
              >
                <div class="flex items-center gap-2.5">
                  <svg class="w-4 h-4 text-sky-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                  <span>💳 Phát Sóng Cấu Hình VietQR Mới</span>
                </div>
                <span class="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-sky-200/60 dark:bg-sky-800/60">Sacombank</span>
              </button>

              <!-- Nút 4: Đồng bộ Cloud 2 chiều toàn hệ thống -->
              <button 
                type="button" 
                onclick="window.ShopVietViews.admin.syncCloudAll()" 
                class="w-full px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-between transition cursor-pointer"
              >
                <div class="flex items-center gap-2.5">
                  <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>
                  <span>☁️ Đồng Bộ 2 Chiều Cloud REST API</span>
                </div>
                <span class="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700">REST Sync</span>
              </button>
            </div>

            <!-- Giải thích cơ chế -->
            <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5 leading-relaxed">
              <p class="font-semibold text-slate-700 dark:text-slate-300">💡 Cơ chế Tự Động Phát Sóng:</p>
              <p>Mỗi khi bạn Lưu/Sửa/Xóa sản phẩm, Cập nhật VietQR, Tạo Voucher hoặc Duyệt Đơn trong Admin Portal, hệ thống sẽ <strong>tự động phát tín hiệu</strong> qua BroadcastChannel & Cloud Event Bus.</p>
              <p>Tất cả khách hàng đang xem trang chủ, giỏ hàng hoặc cổng thanh toán sẽ nhận được dữ liệu mới nhất mà <strong>không cần bấm F5</strong> tải lại trang!</p>
            </div>
          </div>

          <!-- Phải: Nhật ký phát sóng trực quan (Broadcast History) -->
          <div class="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h4 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <svg class="w-4 h-4 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                    <span>Nhật Ký Tín Hiệu Phát Sóng Gần Nhất</span>
                  </h4>
                  <p class="text-xs text-slate-500 mt-0.5">Lưu vết các đợt phát sóng tự động và thủ công của Admin Portal</p>
                </div>
                <button 
                  type="button" 
                  onclick="window.ShopVietViews.admin.clearBroadcastHistory()" 
                  class="text-[11px] font-semibold text-slate-400 hover:text-rose-500 transition"
                  title="Xóa lịch sử"
                >
                  Xóa log
                </button>
              </div>

              <!-- Danh sách log -->
              <div class="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                ${history.map(item => `
                  <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/80 flex items-start justify-between gap-3 text-xs">
                    <div class="space-y-0.5">
                      <div class="flex items-center gap-2">
                        <span class="font-bold text-slate-800 dark:text-slate-200">${item.title}</span>
                        <span class="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">Delivered</span>
                      </div>
                      <p class="text-slate-500 dark:text-slate-400 text-[11px]">${item.detail}</p>
                    </div>
                    <div class="text-right shrink-0">
                      <span class="text-[11px] font-mono font-semibold text-slate-400 dark:text-slate-500 block">${item.time}</span>
                      <span class="text-[10px] text-slate-400 block">${item.date || ''}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Footer log -->
            <div class="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between text-[11px] text-slate-400">
              <span class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>WebSockets & BroadcastChannel Sync Active</span>
              </span>
              <span class="font-mono">Shopviet247 Cloud v12</span>
            </div>
          </div>

        </div>

      </div>
    `;
  }

  // =========================================================================
  // MODAL TẠO MÃ QUÀ TẶNG & GIẢM GIÁ MỚI (#adminCreateVoucherModal)
  // =========================================================================
  function renderCreateVoucherModal() {
    return `
      <div id="adminCreateVoucherModal" class="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-slide-up">
          
          <!-- Header Modal -->
          <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/70">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 12 20 22 4 22 4 12" />
                  <rect x="2" y="7" width="20" height="5" />
                  <line x1="12" y1="22" x2="12" y2="7" />
                  <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                  <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                </svg>
              </div>
              <div>
                <h3 class="font-extrabold text-base text-slate-900 dark:text-white">Tạo Mã Quà Tặng & Giảm Giá Mới</h3>
                <p class="text-xs text-slate-500">Mã có hiệu lực sử dụng ngay lập tức</p>
              </div>
            </div>

            <button 
              type="button" 
              onclick="window.ShopVietViews.admin.closeVoucherModal()" 
              class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <!-- Body Form -->
          <form id="createVoucherForm" onsubmit="event.preventDefault(); window.ShopVietViews.admin.createVoucherSubmit(event);" class="p-6 space-y-4 text-xs sm:text-sm">
            
            <!-- Mã Code & Nút Random -->
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Mã Voucher (*)</label>
              <div class="flex gap-2">
                <input 
                  type="text" 
                  id="voucherCodeInput" 
                  required 
                  placeholder="Ví dụ: DISCOUNT20K, VIP100K..." 
                  class="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white uppercase font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                <button 
                  type="button" 
                  onclick="window.ShopVietViews.admin.generateRandomVoucherCode()" 
                  class="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition shrink-0"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                  <span>Sinh ngẫu nhiên</span>
                </button>
              </div>
              <p class="text-[11px] text-slate-400 mt-1">Mã tự động chuyển thành chữ HOA không dấu.</p>
            </div>

            <!-- Loại Mã -->
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Loại mã (*)</label>
              <select 
                id="voucherTypeInput" 
                onchange="window.ShopVietViews.admin.onVoucherTypeChange(this.value)"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="percent_discount" selected>Giảm theo phần trăm (%) - Mặc định</option>
                <option value="order_discount">Giảm số tiền cố định (VNĐ)</option>
                <option value="wallet_gift">Mã quà tặng nạp tiền vào Ví</option>
              </select>
            </div>

            <!-- Giá trị giảm -->
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1" id="voucherValueLabel">Giá trị giảm (% hoặc VNĐ) (*)</label>
              <input 
                type="number" 
                id="voucherValueInput" 
                required 
                min="1" 
                max="99" 
                step="1" 
                value="20" 
                placeholder="Nhập số % (VD: 20 tức giảm 20%) hoặc số tiền VNĐ (VD: 20000)" 
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
              >
              <!-- Các nút chọn nhanh -->
              <div class="flex items-center gap-1.5 mt-2 flex-wrap" id="voucherQuickSelectBtns">
                <span class="text-[11px] text-slate-400">Chọn nhanh:</span>
                <button type="button" onclick="document.getElementById('voucherValueInput').value = 10; window.ShopVietViews.admin.generateRandomVoucherCode();" class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600">10%</button>
                <button type="button" onclick="document.getElementById('voucherValueInput').value = 20; window.ShopVietViews.admin.generateRandomVoucherCode();" class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600">20%</button>
                <button type="button" onclick="document.getElementById('voucherValueInput').value = 30; window.ShopVietViews.admin.generateRandomVoucherCode();" class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600">30%</button>
                <button type="button" onclick="document.getElementById('voucherValueInput').value = 50; window.ShopVietViews.admin.generateRandomVoucherCode();" class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600">50%</button>
                <button type="button" onclick="document.getElementById('voucherValueInput').value = 20000; window.ShopVietViews.admin.generateRandomVoucherCode();" class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600">20k</button>
                <button type="button" onclick="document.getElementById('voucherValueInput').value = 50000; window.ShopVietViews.admin.generateRandomVoucherCode();" class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600">50k</button>
              </div>
            </div>

            <!-- Thiết lập dùng 1 lần -->
            <div class="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
              <div>
                <div class="font-bold text-slate-800 dark:text-slate-200 text-xs">Giới hạn sử dụng 1 lần</div>
                <div class="text-[11px] text-slate-500">Mỗi mã chỉ được 1 khách nhập thành công 1 lần duy nhất</div>
              </div>
              <input type="checkbox" id="voucherSingleUseInput" checked class="w-4 h-4 text-indigo-600 rounded">
            </div>

            <!-- Footer Buttons -->
            <div class="pt-2 flex items-center justify-end gap-2">
              <button 
                type="button" 
                onclick="window.ShopVietViews.admin.closeVoucherModal()" 
                class="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition"
              >
                Hủy bỏ
              </button>
              <button 
                type="submit" 
                class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Tạo mã ngay</span>
              </button>
            </div>

          </form>

        </div>
      </div>
    `;
  }

  // =========================================================================
  // MODAL POPUP: CHỈNH SỬA & THÊM MỚI SẢN PHẨM
  // =========================================================================
  function renderProductEditModal(productId) {
    const isEdit = !!productId;
    let prod = {
      id: `prod-${Date.now().toString().slice(-4)}`,
      name: '',
      category: 'cat_gemini',
      tag: 'Gemini - Antigravity - Veo',
      price: 69000,
      oldPrice: 250000,
      discount: '-72%',
      stock: 100,
      status: 'in_stock',
      iconType: 'gemini',
      imageUrl: '',
      badge: 'Bán chạy nhất',
      warranty: '18 tháng (1 đổi 1)',
      desc: 'Mô tả tính năng gói sản phẩm bản quyền tự động 24/7...'
    };

    if (isEdit && window.ShopVietData && window.ShopVietData.products) {
      const found = window.ShopVietData.products.find(p => p.id === productId);
      if (found) prod = Object.assign({}, found);
    }

    // Nhận diện Badge chuẩn & chế độ tùy chỉnh
    const standardBadges = ['Bán chạy nhất', 'HOT', 'Rẻ vô địch', 'Mới ra mắt', 'Khuyên dùng', 'Flash Sale'];
    const currentBadge = (prod.badge || 'Bán chạy nhất').trim();
    const matchedStandard = standardBadges.find(b => b.toLowerCase() === currentBadge.toLowerCase());
    const isCustom = !matchedStandard && currentBadge !== '';
    const badgeSelectValue = isCustom ? 'custom' : (matchedStandard || 'Bán chạy nhất');

    return `
      <div id="productEditBackdrop" class="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
          
          <!-- Header -->
          <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/70">
            <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span class="flex items-center gap-1.5">
                ${isEdit 
                  ? `<svg class="w-4 h-4 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg><span>Chỉnh Sửa Sản Phẩm</span>` 
                  : `<svg class="w-4 h-4 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg><span>Thêm Sản Phẩm Mới</span>`
                }
              </span>
              <code class="text-xs font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">${prod.id}</code>
            </h3>
            <button 
              type="button" 
              onclick="document.getElementById('productEditBackdrop').remove()" 
              class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <!-- Body Form -->
          <form id="productEditForm" onsubmit="event.preventDefault(); window.ShopVietViews.admin.saveProduct('${prod.id}', ${isEdit});" class="flex-1 overflow-y-auto p-6 space-y-4 text-xs sm:text-sm">
            
            <!-- Tên sản phẩm -->
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tên sản phẩm (*)</label>
              <input 
                type="text" 
                id="editProdName" 
                value="${prod.name.replace(/"/g, '&quot;')}" 
                required 
                placeholder="Ví dụ: [LINK] Antigravity + Gemini Pro 18 Tháng" 
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
              >
            </div>

            <!-- Giá Bán & Giá Gốc -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Giá bán (VNĐ) (*)</label>
                <input 
                  type="number" 
                  id="editProdPrice" 
                  value="${prod.price}" 
                  required 
                  min="0" 
                  step="1000" 
                  placeholder="Ví dụ: 69000" 
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
              </div>

              <div>
                <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Giá gốc niêm yết (VNĐ)</label>
                <input 
                  type="number" 
                  id="editProdOldPrice" 
                  value="${prod.oldPrice || prod.price * 2}" 
                  min="0" 
                  step="1000" 
                  placeholder="Ví dụ: 250000" 
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
              </div>
            </div>

            <!-- Danh Mục & Tag -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Danh mục sản phẩm</label>
                <select 
                  id="editProdCategory" 
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="cat_gemini" ${prod.category === 'cat_gemini' ? 'selected' : ''}>Gemini Pro & Antigravity</option>
                  <option value="cat_cursor" ${prod.category === 'cat_cursor' ? 'selected' : ''}>Cursor New</option>
                  <option value="cat_chatgpt" ${prod.category === 'cat_chatgpt' ? 'selected' : ''}>ChatGPT Plus</option>
                  <option value="cat_canva" ${prod.category === 'cat_canva' ? 'selected' : ''}>Canva Pro</option>
                  <option value="cat_capcut" ${prod.category === 'cat_capcut' ? 'selected' : ''}>Capcut Pro</option>
                  <option value="cat_api" ${prod.category === 'cat_api' ? 'selected' : ''}>API AI Coding</option>
                </select>
              </div>

              <div>
                <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nhãn Tag bộ lọc</label>
                <input 
                  type="text" 
                  id="editProdTag" 
                  value="${prod.tag || 'Tất cả'}" 
                  placeholder="Ví dụ: Cursor New, Capcut, Canva..." 
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
              </div>
            </div>

            <!-- Tồn Kho & Trạng Thái -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Số lượng tồn kho</label>
                <input 
                  type="number" 
                  id="editProdStock" 
                  value="${prod.stock || 100}" 
                  min="0" 
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                >
              </div>

              <div>
                <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Trạng thái kho hàng</label>
                <select 
                  id="editProdStatus" 
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="in_stock" ${prod.status === 'in_stock' ? 'selected' : ''}>Còn hàng (In Stock)</option>
                  <option value="low_stock" ${prod.status === 'low_stock' ? 'selected' : ''}>Sắp hết hàng (Low Stock)</option>
                  <option value="out_of_stock" ${prod.status === 'out_of_stock' ? 'selected' : ''}>Hết hàng (Out of Stock)</option>
                </select>
              </div>
            </div>

            <!-- ẢNH ĐẠI DIỆN SẢN PHẨM (TẢI LÊN FILE HOẶC DÁN URL) -->
            <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <div class="flex items-center justify-between">
                <label class="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
                  <svg class="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <span>Ảnh đại diện sản phẩm (Tải lên hoặc URL)</span>
                </label>
                <span class="text-[11px] text-slate-400">Ưu tiên ảnh vuông 1:1 hoặc 16:9</span>
              </div>

              <div class="flex items-center gap-4">
                <!-- Khung Preview Ảnh Trực Quan -->
                <div class="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                  <img 
                    id="adminProdImagePreview" 
                    src="${prod.imageUrl || ''}" 
                    alt="Xem trước ảnh" 
                    class="${prod.imageUrl ? '' : 'hidden'} w-full h-full object-cover"
                  />
                  <div id="adminProdImagePlaceholder" class="${prod.imageUrl ? 'hidden' : 'flex'} flex-col items-center justify-center text-slate-400 p-2 text-center">
                    <svg class="w-6 h-6 mb-1 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                    <span class="text-[9px] font-medium leading-tight">Chưa có ảnh</span>
                  </div>
                </div>

                <!-- Cột Nút Hành Động & Input URL -->
                <div class="flex-1 space-y-2">
                  <div class="flex items-center gap-2">
                    <input type="file" id="adminProdFileInput" accept="image/*" class="hidden" onchange="window.ShopVietViews.admin.handleProductImageUpload(this)">
                    <button 
                      type="button" 
                      onclick="document.getElementById('adminProdFileInput').click()" 
                      class="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200/60 dark:border-indigo-800 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      <span>Chọn ảnh từ máy...</span>
                    </button>
                    <button 
                      type="button" 
                      onclick="window.ShopVietViews.admin.clearProductImage()" 
                      class="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium text-xs transition cursor-pointer"
                      title="Xóa ảnh về mặc định"
                    >
                      Xóa ảnh
                    </button>
                  </div>
                  
                  <div>
                    <input 
                      type="text" 
                      id="editProdImageUrl" 
                      value="${prod.imageUrl || ''}" 
                      placeholder="Hoặc dán link URL ảnh (https://...)" 
                      oninput="window.ShopVietViews.admin.handleProductImageUrlInput(this.value)"
                      class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    >
                  </div>
                </div>
              </div>
            </div>

            <!-- Icon Loại Thương Hiệu -->
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Thương hiệu / Icon nhận diện</label>
              <select 
                id="editProdIconType" 
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="gemini" ${prod.iconType === 'gemini' ? 'selected' : ''}>Gemini / Google AI</option>
                <option value="cursor" ${prod.iconType === 'cursor' ? 'selected' : ''}>Cursor IDE</option>
                <option value="chatgpt" ${prod.iconType === 'chatgpt' ? 'selected' : ''}>ChatGPT / OpenAI</option>
                <option value="api" ${prod.iconType === 'api' ? 'selected' : ''}>API Token Coding</option>
                <option value="canva" ${prod.iconType === 'canva' ? 'selected' : ''}>Canva Pro</option>
                <option value="capcut" ${prod.iconType === 'capcut' ? 'selected' : ''}>Capcut Pro</option>
                <option value="copilot" ${prod.iconType === 'copilot' ? 'selected' : ''}>GitHub Copilot</option>
                <option value="server" ${prod.iconType === 'server' ? 'selected' : ''}>VPS / Server Cloud</option>
              </select>
            </div>

            <!-- Badge & Bảo hành -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="block font-bold text-slate-700 dark:text-slate-300 text-xs sm:text-sm">Huy hiệu nổi bật (Badge & Mark)</label>
                <select 
                  id="editProdBadgeSelect" 
                  onchange="const c = document.getElementById('editProdBadgeCustomWrap'); if(c) { c.classList.toggle('hidden', this.value !== 'custom'); const hid = document.getElementById('editProdBadge'); if(hid && this.value !== 'custom') hid.value = this.value; }"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-xs sm:text-sm cursor-pointer"
                >
                  <option value="Bán chạy nhất" ${badgeSelectValue === 'Bán chạy nhất' ? 'selected' : ''}>⭐ Bán chạy nhất (Best Seller - Vàng Gold)</option>
                  <option value="HOT" ${badgeSelectValue === 'HOT' ? 'selected' : ''}>🔥 HOT (Đang sốt - Đỏ Cam Neon)</option>
                  <option value="Rẻ vô địch" ${badgeSelectValue === 'Rẻ vô địch' ? 'selected' : ''}>🏷️ Rẻ vô địch (Siêu tiết kiệm - Xanh Emerald)</option>
                  <option value="Mới ra mắt" ${badgeSelectValue === 'Mới ra mắt' ? 'selected' : ''}>✨ Mới ra mắt (New Arrival - Tím Cyber)</option>
                  <option value="Khuyên dùng" ${badgeSelectValue === 'Khuyên dùng' ? 'selected' : ''}>💎 Khuyên dùng (Pro Choice - Xanh Dương)</option>
                  <option value="Flash Sale" ${badgeSelectValue === 'Flash Sale' ? 'selected' : ''}>⚡ Flash Sale (Giảm sốc - Hồng Đỏ)</option>
                  <option value="custom" ${badgeSelectValue === 'custom' ? 'selected' : ''}>✍️ Tùy chỉnh chữ riêng...</option>
                </select>
                <div id="editProdBadgeCustomWrap" class="${isCustom ? '' : 'hidden'} mt-1.5">
                  <input 
                    type="text" 
                    id="editProdBadgeCustom" 
                    value="${isCustom ? currentBadge.replace(/"/g, '&quot;') : ''}"
                    placeholder="Nhập tên huy hiệu riêng (VD: Phiên bản VIP, Limited...)" 
                    oninput="const hid = document.getElementById('editProdBadge'); if(hid) hid.value = this.value.trim();"
                    class="w-full px-3.5 py-2 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <input type="hidden" id="editProdBadge" value="${currentBadge.replace(/"/g, '&quot;')}" />
              </div>

              <div>
                <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Thời hạn bảo hành</label>
                <input 
                  type="text" 
                  id="editProdWarranty" 
                  value="${prod.warranty || '18 tháng (1 đổi 1)'}" 
                  placeholder="Ví dụ: 18 tháng (1 đổi 1)" 
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
              </div>
            </div>

            <!-- Mô tả sản phẩm -->
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Mô tả chi tiết</label>
              <textarea 
                id="editProdDesc" 
                rows="3" 
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >${prod.desc || ''}</textarea>
            </div>

            <!-- Nút Hành Động -->
            <div class="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button 
                type="button" 
                onclick="document.getElementById('productEditBackdrop').remove()" 
                class="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Hủy bỏ
              </button>
              <button 
                type="submit" 
                class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition flex items-center gap-1.5"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Lưu Sản Phẩm</span>
              </button>
            </div>

          </form>

        </div>
      </div>
    `;
  }

  // =========================================================================
  // MODAL XEM ẢNH BILL CHUYỂN KHOẢN
  // =========================================================================
  function renderBillModal(orderCode, amount) {
    const config = getVietQRConfig();
    return `
      <div id="adminBillBackdrop" class="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onclick="if(event.target === this) this.remove()">
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-up p-6 text-center space-y-4">
          <div class="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          </div>

          <div>
            <span class="text-xs font-bold text-emerald-600 uppercase tracking-wider">Hóa đơn điện tử VietQR</span>
            <h4 class="text-lg font-black text-slate-900 dark:text-white mt-1">Đã Xác Thực Thanh Toán</h4>
            <div class="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-2">${formatVND(amount)}</div>
          </div>

          <!-- Thông tin chuyển khoản -->
          <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 text-left text-xs space-y-2 border border-slate-100 dark:border-slate-800">
            <div class="flex justify-between">
              <span class="text-slate-400">Mã đơn hàng:</span>
              <span class="font-mono font-bold text-slate-800 dark:text-slate-200">${orderCode}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Ngân hàng nhận:</span>
              <span class="font-semibold text-slate-800 dark:text-slate-200">${config.bankName.split(' ')[0]} Bank</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Chủ tài khoản:</span>
              <span class="font-semibold text-slate-800 dark:text-slate-200">${config.accountName}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Nội dung CK:</span>
              <span class="font-mono font-bold text-indigo-600 dark:text-indigo-400">${config.memoPrefix} ${orderCode.replace('#', '')}</span>
            </div>
          </div>

          <button 
            type="button" 
            onclick="document.getElementById('adminBillBackdrop').remove()" 
            class="w-full py-2.5 rounded-xl bg-slate-900 text-white dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 font-semibold text-xs transition"
          >
            Đóng
          </button>
        </div>
      </div>
    `;
  }

  // Modal Admin Duyệt Đơn & Gửi Link Riêng Cho Khách
  function renderDeliveryModal(order) {
    const code = order.orderCode || order.id || 'ORDER';
    const customerEmail = order.userEmail || (order.customer && order.customer.email) || (order.user && order.user.email) || (order.email) || 'cuongcuca111@gmail.com';
    const customerName = order.customerName || (order.user && order.user.name) || (order.customer && order.customer.name) || 'Minh Cường';
    const productName = order.productName || (order.items && order.items[0] && order.items[0].name) || 'Gói Bản Quyền Pro';
    const amount = order.amount || order.total || order.price || 69000;
    const currentLink = order.customDeliveryLink || (order.licenseKey && order.licenseKey.startsWith('http') ? order.licenseKey : '') || 'https://one.google.com/inv/gemini-pro-shopviet247-vip';
    const currentMsg = order.adminMessage || (order.deliveryInfo && order.deliveryInfo.guide) || 'Cảm ơn bạn đã mua hàng tại Shopviet247! Bạn bấm vào đường link trên để kích hoạt bản quyền nhé.';

    return `
      <div id="adminDeliveryBackdrop" class="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onclick="if(event.target === this) this.remove()">
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up p-6 space-y-5 relative" onclick="event.stopPropagation()">
          <!-- Close button -->
          <button 
            type="button" 
            onclick="document.getElementById('adminDeliveryBackdrop').remove()" 
            class="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white flex items-center justify-center transition cursor-pointer text-sm"
          >
            ✕
          </button>

          <!-- Header -->
          <div class="flex items-start gap-3.5">
            <div class="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 shadow-inner">
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5v-2z"/>
              </svg>
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-900 dark:text-white">Duyệt Đơn & Gửi Link Riêng Cho Khách</h3>
              <div class="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">#${code}</div>
            </div>
          </div>

          <!-- Tóm tắt đơn hàng -->
          <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 space-y-1.5 text-xs">
            <div class="flex justify-between items-center">
              <span class="text-slate-500">Khách hàng:</span>
              <span class="font-semibold text-slate-800 dark:text-slate-200">${customerName} <span class="text-slate-400 font-normal">(${customerEmail})</span></span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-500">Gói sản phẩm:</span>
              <span class="font-medium text-slate-800 dark:text-slate-200 line-clamp-1">${productName}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-500">Số tiền thanh toán:</span>
              <span class="font-bold text-emerald-600 dark:text-emerald-400">${formatVND(amount)}</span>
            </div>
          </div>

          <!-- Form nhập liệu -->
          <div class="space-y-4">
            <div>
              <label class="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                <svg class="w-3.5 h-3.5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
                <span>Link kích hoạt bản quyền riêng:</span>
              </label>
              <input 
                type="text" 
                id="adminDeliveryLinkInput" 
                value="${currentLink}" 
                placeholder="https://one.google.com/inv/gemini-..." 
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <p class="text-[11px] text-slate-400 mt-1">Đường dẫn này sẽ hiển thị trực tiếp cho khách hàng trong trang Đơn hàng / Bản quyền để họ kích hoạt ngay.</p>
            </div>

            <div>
              <label class="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                <svg class="w-3.5 h-3.5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <span>Lời nhắn / Hướng dẫn dặn dò riêng cho khách:</span>
              </label>
              <textarea 
                id="adminDeliveryMessageInput" 
                rows="3" 
                placeholder="Lời nhắn kèm theo cho khách..." 
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              >${currentMsg}</textarea>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button 
              type="button" 
              onclick="document.getElementById('adminDeliveryBackdrop').remove()" 
              class="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition cursor-pointer"
            >
              Hủy
            </button>
            <button 
              type="button" 
              onclick="window.ShopVietViews.admin.submitApproveWithDelivery('${code}')" 
              class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Phê duyệt & gửi ngay</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // CONTROLLER LOGIC: CÁC HÀM XỬ LÝ SỰ KIỆN ADMIN
  // =========================================================================
  window.ShopVietViews.admin = {
    // 1. Mở Cổng Portal Admin
    open: function () {
      // Kiểm tra bảo mật tài khoản admin
      if (!isAllowedAdminUser()) {
        notify('Truy cập bị từ chối: Cổng quản trị chỉ dành riêng cho tài khoản minhcuong111aaa@gmail.com!', 'error');
        if (window.location.hash === '#admin') {
          window.location.hash = '#home';
        }
        this.close();
        return;
      }

      let modalMount = document.getElementById('adminMount');
      if (!modalMount) {
        modalMount = document.createElement('div');
        modalMount.id = 'adminMount';
        document.body.appendChild(modalMount);
      }

      // Khi là minhcuong111aaa@gmail.com, cấp quyền xác thực và mở thẳng phiên quản trị
      setAuthenticated(true);
      modalMount.innerHTML = renderAdminPortalModal();
      this.startSessionTimer();
    },

    // 2. Đóng Cổng Portal Admin
    close: function () {
      const modalMount = document.getElementById('adminMount');
      if (modalMount) modalMount.innerHTML = '';
      if (sessionIntervalTimer) clearInterval(sessionIntervalTimer);

      // Nếu URL đang là #admin thì reset hash về trang hiện tại
      if (window.location.hash === '#admin') {
        history.replaceState(null, null, ' ');
      }
    },

    // 3. Render hỗ trợ SPA View Router nếu gọi qua ShopVietState.navigate('admin')
    render: function () {
      if (!isAllowedAdminUser()) {
        notify('Truy cập bị từ chối: Cổng quản trị chỉ dành riêng cho tài khoản minhcuong111aaa@gmail.com!', 'error');
        setTimeout(() => {
          if (window.ShopVietState) window.ShopVietState.navigate('home');
        }, 50);
        return `
          <div class="max-w-lg mx-auto my-12 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900/50 text-center space-y-4 shadow-xl">
            <div class="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h3 class="text-lg font-black text-slate-900 dark:text-white">Truy Cập Bị Từ Chối</h3>
            <p class="text-xs text-slate-500 leading-relaxed">Cổng quản trị Portal Admin chỉ dành riêng cho tài khoản quản trị viên tối cao: <br><strong class="text-rose-600 dark:text-rose-400 font-mono">minhcuong111aaa@gmail.com</strong></p>
            <div class="pt-2">
              <button onclick="ShopVietState.navigate('home')" class="px-5 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-indigo-600 font-semibold text-xs">Về Trang Chủ</button>
            </div>
          </div>
        `;
      }
      setAuthenticated(true);
      return renderAdminPortalModal();
    },

    // 4. afterRender
    afterRender: function () {
      if (isAuthenticated()) {
        this.startSessionTimer();
      }
    },

    // 5. Xác thực mã PIN
    submitPin: function () {
      const pinInput = document.getElementById('adminPinInput');
      const errEl = document.getElementById('adminPinError');
      const cardEl = document.getElementById('adminPinCard');

      if (!pinInput) return;
      const entered = pinInput.value.trim();

      if (VALID_PINS.includes(entered)) {
        setAuthenticated(true);
        notify('Xác thực quyền Quản trị viên (minhcuong111) thành công!', 'success');
        this.open();
      } else {
        if (errEl) errEl.classList.remove('hidden');
        if (cardEl) {
          cardEl.classList.add('animate-bounce');
          setTimeout(() => cardEl.classList.remove('animate-bounce'), 600);
        }
        pinInput.focus();
        pinInput.select();
      }
    },

    // 6. Ẩn/Hiện PIN
    togglePinVisibility: function () {
      const pinInput = document.getElementById('adminPinInput');
      if (!pinInput) return;
      if (pinInput.type === 'password') {
        pinInput.type = 'text';
      } else {
        pinInput.type = 'password';
      }
    },

    // 7. Đăng xuất Admin
    logout: function () {
      setAuthenticated(false);
      this.close();
      notify('Đã đăng xuất khỏi Phiên Quản Trị an toàn!', 'info');
    },

    // 8. Chuyển Tab (5 Tab kinh doanh cốt lõi, tự động fallback mượt về pricing nếu gọi realtime hoặc overview)
    switchTab: function (tabKey) {
      if (tabKey === 'realtime' || tabKey === 'overview' || !tabKey) {
        tabKey = 'pricing';
      }
      currentActiveTab = tabKey;
      const tabContent = document.getElementById('adminTabContent');
      if (tabContent) {
        tabContent.innerHTML = renderTabBody(tabKey);
      }

      // Cập nhật style tab button
      document.querySelectorAll('.admin-nav-tab').forEach(btn => {
        btn.className = 'admin-nav-tab px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200';
      });
      const activeBtn = document.getElementById(`adminTabBtn-${tabKey}`);
      if (activeBtn) {
        activeBtn.className = 'admin-nav-tab px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30';
      }
    },

    // 9. Làm mới dữ liệu kèm đồng bộ từ Đám Mây
    refreshData: async function () {
      if (window.ShopVietState && typeof window.ShopVietState.syncAllFromCloud === 'function') {
        await window.ShopVietState.syncAllFromCloud().catch(function () {});
      }
      restoreProductsFromStorage();
      const tabContent = document.getElementById('adminTabContent');
      if (tabContent) {
        tabContent.innerHTML = renderTabBody(currentActiveTab);
      }
      notify('Đã làm mới dữ liệu và đồng bộ với Đám Mây!', 'info');
    },

    // 9b. Đồng bộ Đám Mây 2 chiều tức thì cho Toàn Hệ Thống (Sản phẩm, Voucher, Excel, Đơn hàng)
    syncCloudAll: async function () {
      const btn = document.getElementById('adminCloudSyncBtn');
      const icon = document.getElementById('adminCloudSyncIcon');
      const text = document.getElementById('adminCloudSyncText');
      if (icon) icon.classList.add('animate-spin');
      if (text) text.textContent = 'Đang đồng bộ...';
      if (btn) btn.disabled = true;

      try {
        if (window.ShopVietState && typeof window.ShopVietState.syncAllFromCloud === 'function') {
          await window.ShopVietState.syncAllFromCloud();
        }
        if (window.ShopVietState && typeof window.ShopVietState.pushAllToCloud === 'function') {
          await window.ShopVietState.pushAllToCloud();
        }
        restoreProductsFromStorage();
        const tabContent = document.getElementById('adminTabContent');
        if (tabContent) {
          tabContent.innerHTML = renderTabBody(currentActiveTab);
        }
        notify('Đã đồng bộ toàn hệ thống (Sản phẩm, Voucher, Excel, Đơn hàng) lên Cloud thành công!', 'success');
      } catch (err) {
        console.error('[Admin Cloud Sync Error]:', err);
        notify('Lỗi trong quá trình đồng bộ Cloud: ' + (err.message || err), 'error');
      } finally {
        if (icon) icon.classList.remove('animate-spin');
        if (text) text.textContent = 'Đồng bộ Cloud';
        if (btn) btn.disabled = false;
      }
    },

    // 10. Mở Modal Thêm / Sửa Sản phẩm
    openProductModal: function (productId) {
      const existing = document.getElementById('productEditBackdrop');
      if (existing) existing.remove();

      const container = document.createElement('div');
      container.innerHTML = renderProductEditModal(productId);
      document.body.appendChild(container.firstElementChild);
    },

    // 10.0 Nén ảnh bằng HTML5 Canvas siêu nhẹ (< 25KB WebP/JPEG)
    compressImage: function (file, maxWidth, maxHeight, quality) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target.result;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            if (width > maxWidth || height > maxHeight) {
              if (width / height > maxWidth / maxHeight) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
              } else {
                width = Math.round((width * maxHeight) / height);
                height = maxHeight;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            // Xuất ra WebP hoặc JPEG dung lượng siêu nhẹ < 25KB
            const compressedDataUrl = canvas.toDataURL('image/webp', quality || 0.85);
            resolve(compressedDataUrl);
          };
        };
      });
    },

    // 10.1 Xử lý Tải ảnh sản phẩm từ máy (Tự động nén Canvas siêu nhẹ)
    handleProductImageUpload: async function (input) {
      if (!input || !input.files || !input.files[0]) return;
      const file = input.files[0];
      try {
        const compressedDataUrl = await this.compressImage(file, 256, 256, 0.85);
        const preview = document.getElementById('adminProdImagePreview');
        const placeholder = document.getElementById('adminProdImagePlaceholder');
        const urlInput = document.getElementById('editProdImageUrl');
        if (preview) {
          preview.src = compressedDataUrl;
          preview.classList.remove('hidden');
        }
        if (placeholder) {
          placeholder.classList.add('hidden');
          placeholder.classList.remove('flex');
        }
        if (urlInput) {
          urlInput.value = compressedDataUrl;
        }
        console.log('[ShopVietAdmin] Đã nén ảnh thành công với Canvas WebP 256x256 siêu nhẹ!');
      } catch (err) {
        console.warn('[ShopVietAdmin] Lỗi nén ảnh:', err);
      }
    },

    // 10.2 Xử lý Nhập URL ảnh trực tiếp
    handleProductImageUrlInput: function (url) {
      const preview = document.getElementById('adminProdImagePreview');
      const placeholder = document.getElementById('adminProdImagePlaceholder');
      const trimmed = (url || '').trim();
      if (trimmed) {
        if (preview) {
          preview.src = trimmed;
          preview.classList.remove('hidden');
        }
        if (placeholder) {
          placeholder.classList.add('hidden');
          placeholder.classList.remove('flex');
        }
      } else {
        if (preview) {
          preview.src = '';
          preview.classList.add('hidden');
        }
        if (placeholder) {
          placeholder.classList.remove('hidden');
          placeholder.classList.add('flex');
        }
      }
    },

    // 10.3 Xóa ảnh đại diện sản phẩm
    clearProductImage: function () {
      const urlInput = document.getElementById('editProdImageUrl');
      const fileInput = document.getElementById('adminProdFileInput');
      const preview = document.getElementById('adminProdImagePreview');
      const placeholder = document.getElementById('adminProdImagePlaceholder');
      if (urlInput) urlInput.value = '';
      if (fileInput) fileInput.value = '';
      if (preview) {
        preview.src = '';
        preview.classList.add('hidden');
      }
      if (placeholder) {
        placeholder.classList.remove('hidden');
        placeholder.classList.add('flex');
      }
    },

    // 11. Lưu Sản Phẩm (Thêm hoặc Sửa)
    saveProduct: function (productId, isEdit) {
      const name = document.getElementById('editProdName').value.trim();
      const price = Number(document.getElementById('editProdPrice').value) || 0;
      const oldPrice = Number(document.getElementById('editProdOldPrice').value) || (price * 2);
      const category = document.getElementById('editProdCategory').value;
      const tag = document.getElementById('editProdTag').value.trim();
      const stock = Number(document.getElementById('editProdStock').value) || 0;
      const status = document.getElementById('editProdStatus').value;
      const iconType = document.getElementById('editProdIconType').value;
      
      // Đọc giá trị badge thông minh từ Dropdown & Custom Input
      const badgeSelect = document.getElementById('editProdBadgeSelect');
      const badgeCustom = document.getElementById('editProdBadgeCustom');
      let badge = 'Bán chạy nhất';
      if (badgeSelect) {
        if (badgeSelect.value === 'custom') {
          badge = (badgeCustom && badgeCustom.value.trim()) ? badgeCustom.value.trim() : 'Tùy chỉnh';
        } else {
          badge = badgeSelect.value;
        }
      } else if (document.getElementById('editProdBadge')) {
        badge = document.getElementById('editProdBadge').value.trim() || 'Bán chạy nhất';
      }

      // Tự động gán badgeColor theo loại Mark chuẩn ShopViet247
      function getMarkBadgeColor(bName) {
        const b = (bName || '').toLowerCase();
        if (b.includes('hot')) {
          return 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-rose-500/30';
        }
        if (b.includes('rẻ') || b.includes('tiết kiệm')) {
          return 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/30';
        }
        if (b.includes('mới') || b.includes('new')) {
          return 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-purple-500/30';
        }
        if (b.includes('khuyên dùng') || b.includes('pro')) {
          return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-blue-500/30';
        }
        if (b.includes('flash') || b.includes('sale')) {
          return 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-pink-500/30';
        }
        if (b.includes('bán chạy') || b.includes('best seller')) {
          return 'bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-white shadow-amber-500/30';
        }
        return 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-indigo-500/30';
      }

      const badgeColor = getMarkBadgeColor(badge);
      const isBestSeller = Boolean(badge.toLowerCase().includes('bán chạy') || badge.toLowerCase().includes('best seller'));

      const warranty = document.getElementById('editProdWarranty').value.trim();
      const desc = document.getElementById('editProdDesc').value.trim();
      const imageUrlInput = document.getElementById('editProdImageUrl');
      const imageUrl = imageUrlInput ? imageUrlInput.value.trim() : '';

      if (!name) {
        notify('Vui lòng nhập tên sản phẩm!', 'warning');
        return;
      }

      // Tính % discount
      let discount = '';
      if (oldPrice > price) {
        const pct = Math.round((1 - price / oldPrice) * 100);
        discount = `-${pct}%`;
      }

      window.ShopVietData = window.ShopVietData || {};
      window.ShopVietData.products = window.ShopVietData.products || [];

      if (isEdit) {
        // Cập nhật sản phẩm cũ
        const idx = window.ShopVietData.products.findIndex(p => p.id === productId);
        if (idx > -1) {
          window.ShopVietData.products[idx] = Object.assign({}, window.ShopVietData.products[idx], {
            name,
            price,
            oldPrice,
            discount,
            category,
            tag,
            stock,
            status,
            iconType,
            badge,
            badgeColor,
            isBestSeller,
            warranty,
            desc,
            imageUrl
          });
        }
      } else {
        // Tạo sản phẩm mới
        const newProd = {
          id: productId,
          name,
          category,
          tag: tag || 'Tất cả',
          price,
          oldPrice,
          discount,
          stock,
          status,
          rating: 5.0,
          reviewsCount: 1,
          soldCount: 0,
          badge: badge || 'Bán chạy nhất',
          badgeColor: badgeColor,
          isBestSeller: isBestSeller,
          autoDelivery: false,
          warranty: warranty || '12 tháng (1 đổi 1)',
          desc,
          iconType: iconType || 'gemini',
          imageUrl: imageUrl || '',
          features: [
            'Bản quyền kích hoạt nhanh chóng 24/7',
            'Bảo hành 1 đổi 1 nhanh chóng',
            'Hỗ trợ kỹ thuật qua Zalo 0868668809'
          ]
        };
        window.ShopVietData.products.unshift(newProd);
      }

      // Lưu trữ xuống localStorage và đồng bộ Đám Mây Đa Thiết Bị
      try {
        const jsonStr = JSON.stringify(window.ShopVietData.products);
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, jsonStr);
        localStorage.setItem('shopviet_custom_products', jsonStr);
        localStorage.setItem('shopviet_admin_products', jsonStr);
        if (window.ShopVietState && typeof window.ShopVietState.saveCustomProducts === 'function') {
          window.ShopVietState.saveCustomProducts(window.ShopVietData.products);
        }
      } catch (e) {
        console.warn('[Save Products LocalStorage Error]:', e);
      }

      if (window.ShopVietState && typeof window.ShopVietState.pushAllToCloud === 'function') {
        window.ShopVietState.pushAllToCloud().catch(function (e) {
          console.warn('[Admin Save Product Cloud Sync Error]:', e);
        });
      }

      // Đóng modal sửa
      const editModal = document.getElementById('productEditBackdrop');
      if (editModal) editModal.remove();

      // Cập nhật lại bảng tab pricing trong admin
      const tabContent = document.getElementById('adminTabContent');
      if (tabContent && currentActiveTab === 'pricing') {
        tabContent.innerHTML = renderTabPricing();
      }

      // NẾU NGƯỜI DÙNG ĐANG Ở TRANG CHỦ (HOME), TỰ ĐỘNG RE-RENDER NGAY LẬP TỨC
      if (window.ShopVietState && window.ShopVietState.state && window.ShopVietState.state.currentView === 'home') {
        window.ShopVietState.navigate('home');
      }

      // PHÁT SÓNG TÍN HIỆU ĐỒNG BỘ REALTIME TỚI TẤT CẢ MÁY KHÁCH
      if (window.ShopVietState && window.ShopVietState.broadcastAdminChange) {
        window.ShopVietState.broadcastAdminChange('products_updated', {
          productId: productId,
          productName: name,
          action: isEdit ? 'edit' : 'create',
          count: window.ShopVietData.products.length,
          timestamp: Date.now()
        });
      }
      recordBroadcast('products_updated', `Lưu sản phẩm "${name}"`);

      notify(`Đã lưu sản phẩm "${name.slice(0, 30)}..." và đồng bộ Cloud thành công!`, 'success');
      notify('⚡ Đã phát sóng dữ liệu thay đổi lên Cloud Realtime thành công! Mọi máy khách đang cập nhật tức thì.', 'success');
    },

    // 12. Xóa Sản Phẩm
    deleteProduct: function (productId) {
      if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi hệ thống không?')) return;

      if (window.ShopVietData && window.ShopVietData.products) {
        window.ShopVietData.products = window.ShopVietData.products.filter(p => p.id !== productId);
        try {
          const jsonStr = JSON.stringify(window.ShopVietData.products);
          localStorage.setItem(STORAGE_KEYS.PRODUCTS, jsonStr);
          localStorage.setItem('shopviet_custom_products', jsonStr);
        } catch (e) {
          console.warn('[Delete Product LocalStorage Error]:', e);
        }

        if (window.ShopVietState && typeof window.ShopVietState.pushAllToCloud === 'function') {
          window.ShopVietState.pushAllToCloud().catch(function (e) {
            console.warn('[Admin Delete Product Cloud Sync Error]:', e);
          });
        }

        // Cập nhật lại bảng tab pricing
        const tabContent = document.getElementById('adminTabContent');
        if (tabContent && currentActiveTab === 'pricing') {
          tabContent.innerHTML = renderTabPricing();
        }

        // Cập nhật lại view home nếu đang mở
        if (window.ShopVietState && window.ShopVietState.state && window.ShopVietState.state.currentView === 'home') {
          window.ShopVietState.navigate('home');
        }

        // PHÁT SÓNG TÍN HIỆU ĐỒNG BỘ REALTIME TỚI TẤT CẢ MÁY KHÁCH
        if (window.ShopVietState && window.ShopVietState.broadcastAdminChange) {
          window.ShopVietState.broadcastAdminChange('products_updated', {
            productId: productId,
            action: 'delete',
            count: window.ShopVietData.products.length,
            timestamp: Date.now()
          });
        }
        recordBroadcast('products_updated', `Xóa sản phẩm ID: ${productId}`);

        notify('Đã xóa sản phẩm và đồng bộ Cloud thành công!', 'info');
        notify('⚡ Đã phát sóng dữ liệu thay đổi lên Cloud Realtime thành công! Mọi máy khách đang cập nhật tức thì.', 'success');
      }
    },

    // 13. Khôi phục sản phẩm mặc định
    resetDefaultProducts: function () {
      if (!confirm('Khôi phục toàn bộ danh sách sản phẩm về mẫu mặc định ban đầu?')) return;
      localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
      location.reload();
    },

    // 14. Lọc bảng sản phẩm theo từ khóa
    filterProductTable: function (keyword) {
      const tbody = document.getElementById('adminProductTableBody');
      if (!tbody) return;

      const prods = (window.ShopVietData && window.ShopVietData.products) || [];
      const clean = (keyword || '').toLowerCase().trim();

      const matched = prods.filter(p => {
        return p.name.toLowerCase().includes(clean) || 
               (p.tag && p.tag.toLowerCase().includes(clean)) ||
               (p.category && p.category.toLowerCase().includes(clean)) ||
               p.id.toLowerCase().includes(clean);
      });

      tbody.innerHTML = matched.map(renderProductTableRow).join('');
    },

    // 15. Duyệt hoàn tất đơn hàng
    approveOrder: function (orderCode) {
      if (window.ShopVietState && window.ShopVietState.state && window.ShopVietState.state.orders) {
        const ord = window.ShopVietState.state.orders.find(o => (o.orderCode === orderCode || o.id === orderCode || o.orderCode === '#' + orderCode || ('#' + o.orderCode) === orderCode));
        if (ord) {
          ord.status = 'completed';
          ord.statusText = 'Đã hoàn tất';
          if (!ord.licenseKey) {
            ord.licenseKey = `KEY-${Date.now().toString().slice(-6)}-PRO-ACTIVE`;
          }
          window.ShopVietState.save();
          if (window.ShopVietFirebase && typeof window.ShopVietFirebase.syncOrderToCloud === 'function') {
            window.ShopVietFirebase.syncOrderToCloud(ord).catch(() => {});
          }
          if (window.ShopVietState && typeof window.ShopVietState.pushAllToCloud === 'function') {
            window.ShopVietState.pushAllToCloud().catch(() => {});
          }
        }
      }

      // Re-render tab orders
      const tabContent = document.getElementById('adminTabContent');
      if (tabContent && currentActiveTab === 'orders') {
        tabContent.innerHTML = renderTabOrders();
      }

      if (window.ShopVietState && window.ShopVietState.broadcastAdminChange) {
        window.ShopVietState.broadcastAdminChange('orders_updated', {
          orderCode: orderCode,
          status: 'completed',
          timestamp: Date.now()
        });
      }
      recordBroadcast('orders_updated', `Duyệt đơn hàng ${orderCode}`);

      notify(`Đã duyệt hoàn tất và kích hoạt license cho đơn hàng ${orderCode}!`, 'success');
      notify('⚡ Đã phát sóng dữ liệu thay đổi lên Cloud Realtime thành công! Mọi máy khách đang cập nhật tức thì.', 'success');
    },

    // 15b. Mở Modal Admin Duyệt Đơn & Gửi Link Riêng Cho Khách
    openDeliveryModal: function (orderCode) {
      let ord = null;
      if (window.ShopVietState && window.ShopVietState.state && window.ShopVietState.state.orders) {
        ord = window.ShopVietState.state.orders.find(o => (o.orderCode === orderCode || o.id === orderCode || o.orderCode === '#' + orderCode || ('#' + o.orderCode) === orderCode));
      }
      if (!ord) {
        ord = {
          orderCode: orderCode,
          id: orderCode,
          customerName: 'Khách hàng',
          productName: 'Gói Bản Quyền VIP',
          amount: 69000
        };
      }

      const existing = document.getElementById('adminDeliveryBackdrop');
      if (existing) existing.remove();

      const container = document.createElement('div');
      container.innerHTML = renderDeliveryModal(ord);
      document.body.appendChild(container.firstElementChild);
    },

    // 15c. Xác nhận Phê Duyệt & Gửi Link
    submitApproveWithDelivery: function (orderCode) {
      const linkInput = document.getElementById('adminDeliveryLinkInput');
      const msgInput = document.getElementById('adminDeliveryMessageInput');
      const deliveryLink = (linkInput ? linkInput.value : '').trim();
      const message = (msgInput ? msgInput.value : '').trim();

      if (window.ShopVietState && window.ShopVietState.state && window.ShopVietState.state.orders) {
        let ord = window.ShopVietState.state.orders.find(o => (o.orderCode === orderCode || o.id === orderCode || o.orderCode === '#' + orderCode || ('#' + o.orderCode) === orderCode));
        if (ord) {
          ord.status = 'completed';
          ord.statusText = 'Đã hoàn tất';
          ord.customDeliveryLink = deliveryLink;
          ord.adminMessage = message;
          ord.licenseKey = deliveryLink || ord.licenseKey || 'KEY-PRO-ACTIVE';
          ord.approvedAt = new Date().toISOString();
          
          const customerEmail = (ord.customer && typeof ord.customer === 'object' && ord.customer.email) || 
                                (ord.user && ord.user.email) || 
                                (typeof ord.customer === 'string' && ord.customer.includes('@') ? ord.customer : 'cuongcuca111@gmail.com');

          ord.deliveryInfo = {
            account: customerEmail,
            licenseKey: deliveryLink || ord.licenseKey || 'KEY-PRO-ACTIVE',
            guide: message
          };

          window.ShopVietState.save();

          // Đồng bộ nếu có Cloud Sync / Firebase
          if (window.ShopVietFirebase && typeof window.ShopVietFirebase.syncOrderToCloud === 'function') {
            window.ShopVietFirebase.syncOrderToCloud(ord).catch(() => {});
          }
          if (window.ShopVietState && typeof window.ShopVietState.pushAllToCloud === 'function') {
            window.ShopVietState.pushAllToCloud().catch(() => {});
          }
        }
      }

      // Đóng modal #adminDeliveryBackdrop
      const modal = document.getElementById('adminDeliveryBackdrop');
      if (modal) modal.remove();

      // Re-render lại tab orders trong admin
      const tabContent = document.getElementById('adminTabContent');
      if (tabContent && currentActiveTab === 'orders') {
        tabContent.innerHTML = renderTabOrders();
      }

      if (window.ShopVietState && window.ShopVietState.broadcastAdminChange) {
        window.ShopVietState.broadcastAdminChange('orders_updated', {
          orderCode: orderCode,
          status: 'completed',
          timestamp: Date.now()
        });
      }
      recordBroadcast('orders_updated', `Giao link đơn hàng #${orderCode}`);

      notify(`Đã phê duyệt đơn hàng #${orderCode} và bàn giao link riêng thành công!`, 'success');
      notify('⚡ Đã phát sóng dữ liệu thay đổi lên Cloud Realtime thành công! Mọi máy khách đang cập nhật tức thì.', 'success');
    },

    // 16. Xem hóa đơn / Bill
    viewBillModal: function (orderCode, amount) {
      const existing = document.getElementById('adminBillBackdrop');
      if (existing) existing.remove();

      const container = document.createElement('div');
      container.innerHTML = renderBillModal(orderCode, amount);
      document.body.appendChild(container.firstElementChild);
    },

    // 17. Cập nhật preview VietQR khi gõ form
    updateQRPreview: function () {
      const bankSelect = document.getElementById('adminVietQRBank');
      const accountInput = document.getElementById('adminVietQRAccountNumber');
      const ownerInput = document.getElementById('adminVietQRAccountName');
      const memoInput = document.getElementById('adminVietQRMemoPrefix');
      const previewImg = document.getElementById('adminVietQRPreviewImg');
      const previewTitle = document.getElementById('adminPreviewBankTitle');
      const previewSTK = document.getElementById('adminPreviewSTK');
      const previewOwner = document.getElementById('adminPreviewOwner');

      if (!bankSelect || !accountInput || !ownerInput) return;

      const bankId = bankSelect.value;
      const bankName = bankSelect.options[bankSelect.selectedIndex].text;
      const account = accountInput.value.trim() || '00223366888';
      const owner = ownerInput.value.trim().toUpperCase() || 'NGUYEN VAN HUY';
      const memo = (memoInput ? memoInput.value.trim().toUpperCase() : 'SHOPVIET') || 'SHOPVIET';

      if (previewTitle) previewTitle.textContent = bankName;
      if (previewSTK) previewSTK.textContent = `STK: ${account}`;
      if (previewOwner) previewOwner.textContent = owner;

      if (previewImg) {
        previewImg.src = `https://api.vietqr.io/image/${bankId}-${account}-compact2.png?amount=69000&accountName=${encodeURIComponent(owner)}&addInfo=${encodeURIComponent(memo + ' DEMO')}`;
      }
    },

    // 18. Lưu cấu hình VietQR
    saveVietQRSettings: function () {
      const bankSelect = document.getElementById('adminVietQRBank');
      const accountInput = document.getElementById('adminVietQRAccountNumber');
      const ownerInput = document.getElementById('adminVietQRAccountName');
      const memoInput = document.getElementById('adminVietQRMemoPrefix');

      const selectedBank = SUPPORTED_BANKS.find(b => b.id === bankSelect.value) || { name: bankSelect.options[bankSelect.selectedIndex].text, code: 'STB' };

      const config = {
        bankId: bankSelect.value,
        bin: bankSelect.value,
        bankName: selectedBank.name || bankSelect.options[bankSelect.selectedIndex].text,
        shortName: selectedBank.code || 'Sacombank',
        accountNumber: accountInput.value.trim(),
        accountName: ownerInput.value.trim().toUpperCase(),
        memoPrefix: memoInput.value.trim().toUpperCase() || 'SHOPVIET',
        brandColor: '#004b91'
      };

      saveVietQRConfig(config);

      // PHÁT SÓNG TÍN HIỆU ĐỒNG BỘ REALTIME TỚI TẤT CẢ MÁY KHÁCH
      if (window.ShopVietState && window.ShopVietState.broadcastAdminChange) {
        window.ShopVietState.broadcastAdminChange('vietqr_updated', {
          config: config,
          timestamp: Date.now()
        });
      }
      recordBroadcast('vietqr_updated', `Cập nhật VietQR ${config.shortName} - ${config.accountNumber} (${config.accountName})`);

      notify('Đã lưu cấu hình tài khoản VietQR thành công! Các luồng thanh toán sẽ cập nhật tức thì.', 'success');
      notify('⚡ Đã phát sóng dữ liệu thay đổi lên Cloud Realtime thành công! Mọi máy khách đang cập nhật tức thì.', 'success');
    },

    // 19. Bộ đếm thời gian phiên (Session Countdown)
    startSessionTimer: function () {
      if (sessionIntervalTimer) clearInterval(sessionIntervalTimer);
      sessionIntervalTimer = setInterval(() => {
        sessionCountdownSeconds--;
        if (sessionCountdownSeconds <= 0) {
          sessionCountdownSeconds = 60 * 60;
        }
        const timerEl = document.getElementById('adminSessionTimer');
        if (timerEl) {
          timerEl.textContent = formatSessionTime(sessionCountdownSeconds);
        }
      }, 1000);
    },

    // 20. Quản lý mã quà tặng & giảm giá (Vouchers)
    openVoucherModal: function () {
      const existing = document.getElementById('adminCreateVoucherModal');
      if (existing) existing.remove();

      const container = document.createElement('div');
      container.innerHTML = renderCreateVoucherModal();
      document.body.appendChild(container.firstElementChild);
      this.generateRandomVoucherCode();
    },

    closeVoucherModal: function () {
      const modal = document.getElementById('adminCreateVoucherModal');
      if (modal) modal.remove();
    },

    onVoucherTypeChange: function (type) {
      const valInput = document.getElementById('voucherValueInput');
      const label = document.getElementById('voucherValueLabel');
      if (type === 'percent_discount') {
        if (label) label.textContent = 'Giá trị giảm (% phần trăm) (*)';
        if (valInput) {
          valInput.min = '1';
          valInput.max = '99';
          valInput.step = '1';
          valInput.value = '20';
          valInput.placeholder = 'Ví dụ: 20 tức giảm 20%';
        }
      } else {
        if (label) label.textContent = 'Số tiền giảm (VNĐ) (*)';
        if (valInput) {
          valInput.min = '1000';
          valInput.removeAttribute('max');
          valInput.step = '1000';
          valInput.value = '20000';
          valInput.placeholder = 'Ví dụ: 20000, 50000, 100000...';
        }
      }
      this.generateRandomVoucherCode();
    },

    generateRandomVoucherCode: function () {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let randomPart = '';
      for (let i = 0; i < 4; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const valInput = document.getElementById('voucherValueInput');
      const typeInput = document.getElementById('voucherTypeInput');
      const isPercent = typeInput ? typeInput.value === 'percent_discount' : true;
      const rawVal = valInput ? parseInt(valInput.value, 10) || 20 : 20;
      let prefix = 'SV20';
      if (isPercent) {
        prefix = 'SV' + Math.min(99, Math.max(1, rawVal)) + 'P';
      } else {
        prefix = 'SV' + Math.round(rawVal / 1000) + 'K';
      }
      const codeInput = document.getElementById('voucherCodeInput');
      if (codeInput) {
        codeInput.value = prefix + '-' + randomPart;
      }
    },

    createVoucherSubmit: async function (e) {
      if (e && e.preventDefault) e.preventDefault();
      const codeInput = document.getElementById('voucherCodeInput');
      const typeInput = document.getElementById('voucherTypeInput');
      const valInput = document.getElementById('voucherValueInput');
      const singleUseInput = document.getElementById('voucherSingleUseInput');

      if (!codeInput || !valInput) return;

      const code = codeInput.value.trim().toUpperCase();
      const type = typeInput ? typeInput.value : 'percent_discount';
      const rawVal = parseInt(valInput.value, 10) || 0;
      const singleUse = singleUseInput ? singleUseInput.checked : true;

      if (!code) {
        notify('Vui lòng nhập mã voucher!', 'error');
        return;
      }
      if (rawVal <= 0) {
        notify('Giá trị giảm phải lớn hơn 0!', 'error');
        return;
      }

      if (type === 'percent_discount' && (rawVal < 1 || rawVal > 99)) {
        notify('Mã giảm theo phần trăm phải từ 1% đến 99%!', 'error');
        return;
      }

      const vouchers = (window.ShopVietState && window.ShopVietState.getVouchers) ? window.ShopVietState.getVouchers() : [];
      const exists = vouchers.some(function (v) {
        return v.code && v.code.trim().toUpperCase() === code;
      });
      if (exists) {
        notify(`Mã voucher "${code}" đã tồn tại trong hệ thống!`, 'error');
        return;
      }

      let newVoucher;
      if (type === 'percent_discount') {
        const percent = Math.min(99, Math.max(1, rawVal));
        newVoucher = {
          code: code,
          type: 'percent_discount',
          percent: percent,
          value: percent,
          singleUse: singleUse,
          isUsed: false,
          usedBy: null,
          usedAt: null,
          orderCode: null,
          createdAt: new Date().toISOString()
        };
      } else {
        newVoucher = {
          code: code,
          type: type,
          value: rawVal,
          singleUse: singleUse,
          isUsed: false,
          usedBy: null,
          usedAt: null,
          orderCode: null,
          createdAt: new Date().toISOString()
        };
      }

      vouchers.unshift(newVoucher);
      if (window.ShopVietState && window.ShopVietState.saveVouchers) {
        window.ShopVietState.saveVouchers(vouchers);
      }

      // BẮT BUỘC ĐẨY NGAY LÊN CLOUD REST API
      if (window.ShopVietState && typeof window.ShopVietState.pushAllToCloud === 'function') {
        try {
          await window.ShopVietState.pushAllToCloud();
        } catch (err) {
          console.warn('[Admin] pushAllToCloud error:', err);
        }
      }

      this.closeVoucherModal();
      this.switchTab('vouchers');
      const tabBadge = document.getElementById('adminVoucherTabBadge');
      if (tabBadge && window.ShopVietState.getVouchers) {
        tabBadge.textContent = window.ShopVietState.getVouchers().length;
      }
      const labelText = type === 'percent_discount' ? `${newVoucher.percent}%` : formatVND(rawVal);
      if (window.ShopVietState && window.ShopVietState.broadcastAdminChange) {
        window.ShopVietState.broadcastAdminChange('vouchers_updated', {
          action: 'create',
          code: code,
          timestamp: Date.now()
        });
      }
      recordBroadcast('vouchers_updated', `Tạo voucher ${code}`);
      notify(`Đã tạo thành công mã voucher "${code}" giảm ${labelText}! Tự động đồng bộ toàn hệ thống.`, 'success');
      notify('⚡ Đã phát sóng dữ liệu thay đổi lên Cloud Realtime thành công! Mọi máy khách đang cập nhật tức thì.', 'success');
    },

    deleteVoucher: function (code) {
      if (!confirm(`Bạn có chắc chắn muốn xóa mã voucher "${code}" khỏi hệ thống?`)) {
        return;
      }
      if (window.ShopVietState && window.ShopVietState.deleteVoucher) {
        const res = window.ShopVietState.deleteVoucher(code);
        if (res.success) {
          if (window.ShopVietState && typeof window.ShopVietState.pushAllToCloud === 'function') {
            window.ShopVietState.pushAllToCloud().catch(function () {});
          }
          if (window.ShopVietState && window.ShopVietState.broadcastAdminChange) {
            window.ShopVietState.broadcastAdminChange('vouchers_updated', {
              action: 'delete',
              code: code,
              timestamp: Date.now()
            });
          }
          recordBroadcast('vouchers_updated', `Xóa voucher ${code}`);
          this.switchTab('vouchers');
          const tabBadge = document.getElementById('adminVoucherTabBadge');
          if (tabBadge && window.ShopVietState.getVouchers) {
            tabBadge.textContent = window.ShopVietState.getVouchers().length;
          }
          notify(`Đã xóa mã voucher "${code}" thành công!`, 'info');
          notify('⚡ Đã phát sóng dữ liệu thay đổi lên Cloud Realtime thành công! Mọi máy khách đang cập nhật tức thì.', 'success');
        } else {
          notify(res.message || 'Không thể xóa mã!', 'error');
        }
      }
    },

    resetDefaultVouchers: function () {
      if (window.ShopVietState && window.ShopVietState.saveVouchers) {
        const list = [
          {
            code: 'VIP20P',
            type: 'percent_discount',
            percent: 20,
            value: 20,
            singleUse: true,
            isUsed: false,
            usedBy: null,
            usedAt: null,
            orderCode: null,
            createdAt: '2026-03-20T00:00:00.000Z'
          },
          {
            code: 'DISCOUNT20K',
            type: 'order_discount',
            value: 20000,
            singleUse: true,
            isUsed: false,
            usedBy: null,
            usedAt: null,
            orderCode: null,
            createdAt: '2026-03-20T00:00:00.000Z'
          },
          {
            code: 'VIP50K',
            type: 'order_discount',
            value: 50000,
            singleUse: true,
            isUsed: false,
            usedBy: null,
            usedAt: null,
            orderCode: null,
            createdAt: '2026-03-20T00:00:00.000Z'
          }
        ];
        window.ShopVietState.saveVouchers(list);
        if (window.ShopVietState && typeof window.ShopVietState.pushAllToCloud === 'function') {
          window.ShopVietState.pushAllToCloud().catch(function () {});
        }
        this.switchTab('vouchers');
        const tabBadge = document.getElementById('adminVoucherTabBadge');
        if (tabBadge) {
          tabBadge.textContent = list.length;
        }
        notify('Đã khôi phục danh sách voucher mẫu ban đầu!', 'success');
      }
    },

    filterVouchers: function (query) {
      const q = (query || '').trim().toLowerCase();
      const rows = document.querySelectorAll('#adminVoucherTableTbody tr');
      let matchCount = 0;
      rows.forEach(row => {
        const code = row.getAttribute('data-code') || '';
        const user = row.getAttribute('data-user') || '';
        const text = row.innerText.toLowerCase();
        if (!q || code.includes(q) || user.includes(q) || text.includes(q)) {
          row.style.display = '';
          matchCount++;
        } else {
          row.style.display = 'none';
        }
      });
      const badge = document.getElementById('adminVoucherTableBadge');
      if (badge) {
        badge.textContent = `${matchCount} mã`;
      }
    },

    // ==================== QUẢN LÝ LỊCH HẸN KHÁCH & SLOT EXCEL ====================
    openScheduleModal: function (scheduleId) {
      this.closeScheduleModal();
      const div = document.createElement('div');
      div.id = 'adminScheduleModalContainer';
      div.innerHTML = renderScheduleModal(scheduleId);
      document.body.appendChild(div);
    },

    closeScheduleModal: function () {
      const modal = document.getElementById('adminAddScheduleModal');
      if (modal) modal.remove();
      const cont = document.getElementById('adminScheduleModalContainer');
      if (cont) cont.remove();
    },

    setScheduleQuickExpire: function (months) {
      const startInput = document.getElementById('modalSchStartDate');
      let baseDate = new Date();
      if (startInput && startInput.value) {
        const parsed = new Date(startInput.value);
        if (!isNaN(parsed.getTime())) {
          baseDate = parsed;
        }
      }
      const expDate = new Date(baseDate);
      expDate.setMonth(expDate.getMonth() + Number(months));
      const expInput = document.getElementById('modalSchExpireDate');
      if (expInput) {
        expInput.value = expDate.toISOString().split('T')[0];
      }
    },

    saveScheduleFromModal: function (scheduleId) {
      const emailInput = document.getElementById('modalSchCustomerEmail');
      const nameInput = document.getElementById('modalSchCustomerName');
      const managerInput = document.getElementById('modalSchManagerEmail');
      const serviceInput = document.getElementById('modalSchService');
      const startInput = document.getElementById('modalSchStartDate');
      const expInput = document.getElementById('modalSchExpireDate');
      const notesInput = document.getElementById('modalSchNotes');

      if (!emailInput || !expInput) return;

      const customerEmail = emailInput.value.trim().toLowerCase();
      const customerName = (nameInput ? nameInput.value : '').trim() || customerEmail.split('@')[0];
      const managerEmail = (managerInput ? managerInput.value : '').trim() || 'admin-slot@shopviet.vip';
      const serviceName = (serviceInput ? serviceInput.value : '').trim() || '[1 Tháng] Gemini Argon 4 Pro + 5TB Drive';
      const startDate = (startInput ? startInput.value : '').trim() || new Date().toISOString().split('T')[0];
      const expireDate = expInput.value.trim();
      const notes = (notesInput ? notesInput.value : '').trim();

      if (!customerEmail || !customerEmail.includes('@')) {
        notify('Vui lòng nhập địa chỉ email khách hàng hợp lệ!', 'error');
        return;
      }
      if (!expireDate) {
        notify('Vui lòng chọn ngày hết hạn cho khách!', 'error');
        return;
      }

      const scheduleData = {
        customerEmail: customerEmail,
        customerName: customerName,
        managerEmail: managerEmail,
        serviceName: serviceName,
        startDate: startDate,
        expireDate: expireDate,
        notes: notes
      };

      if (window.ShopVietState) {
        if (scheduleId) {
          window.ShopVietState.updateSchedule(scheduleId, scheduleData);
          notify(`Đã cập nhật lịch hẹn cho ${customerEmail}!`, 'success');
        } else {
          window.ShopVietState.addSchedule(scheduleData);
          notify(`Đã thêm ${customerEmail} vào bảng tính Excel!`, 'success');
        }

        if (typeof window.ShopVietState.pushAllToCloud === 'function') {
          window.ShopVietState.pushAllToCloud().catch(function () {});
        }

        if (window.ShopVietState && window.ShopVietState.broadcastAdminChange) {
          window.ShopVietState.broadcastAdminChange('schedules_updated', {
            id: scheduleId || 'new',
            customer: customerEmail,
            timestamp: Date.now()
          });
        }
        recordBroadcast('schedules_updated', `Lịch hẹn: ${customerEmail}`);
        notify('⚡ Đã phát sóng dữ liệu thay đổi lên Cloud Realtime thành công! Mọi máy khách đang cập nhật tức thì.', 'success');

        this.closeScheduleModal();
        this.switchTab('schedules');

        const tabBadge = document.getElementById('adminScheduleTabBadge');
        if (tabBadge && window.ShopVietState.getSchedules) {
          tabBadge.textContent = window.ShopVietState.getSchedules().length;
        }
      }
    },

    deleteSchedule: function (id) {
      if (!confirm('Bạn có chắc chắn muốn xóa lịch hẹn này khỏi bảng Excel không?')) {
        return;
      }
      if (window.ShopVietState && window.ShopVietState.deleteSchedule) {
        const ok = window.ShopVietState.deleteSchedule(id);
        if (ok) {
          if (typeof window.ShopVietState.pushAllToCloud === 'function') {
            window.ShopVietState.pushAllToCloud().catch(function () {});
          }
          if (window.ShopVietState && window.ShopVietState.broadcastAdminChange) {
            window.ShopVietState.broadcastAdminChange('schedules_updated', {
              id: id,
              action: 'delete',
              timestamp: Date.now()
            });
          }
          recordBroadcast('schedules_updated', `Xóa lịch hẹn ID: ${id}`);
          this.switchTab('schedules');
          const tabBadge = document.getElementById('adminScheduleTabBadge');
          if (tabBadge && window.ShopVietState.getSchedules) {
            tabBadge.textContent = window.ShopVietState.getSchedules().length;
          }
          notify('Đã xóa lịch hẹn khỏi bảng Excel thành công!', 'info');
          notify('⚡ Đã phát sóng dữ liệu thay đổi lên Cloud Realtime thành công! Mọi máy khách đang cập nhật tức thì.', 'success');
        } else {
          notify('Không tìm thấy lịch hẹn cần xóa!', 'error');
        }
      }
    },

    // ==================== INLINE EDIT & SAVE SCHEDULE CLOUD ====================
    saveInlineSchedule: async function (id) {
      const customerInput = document.getElementById(`sched-customer-${id}`);
      const managerInput = document.getElementById(`sched-manager-${id}`);
      const serviceInput = document.getElementById(`sched-service-${id}`);
      const startInput = document.getElementById(`sched-start-${id}`);
      const expireInput = document.getElementById(`sched-expire-${id}`);
      const saveBtn = document.getElementById(`btn-save-sched-${id}`);

      if (!customerInput || !managerInput || !expireInput) return;

      const customerEmail = customerInput.value.trim().toLowerCase();
      const managerEmail = managerInput.value.trim();
      const serviceName = serviceInput ? serviceInput.value.trim() : '';
      const startDate = startInput ? startInput.value.trim() : '';
      const expireDate = expireInput.value.trim();

      if (!customerEmail || !customerEmail.includes('@')) {
        notify('Vui lòng nhập Email Khách Hàng hợp lệ!', 'error');
        customerInput.focus();
        return;
      }
      if (!managerEmail) {
        notify('Vui lòng nhập Email Quản Lý / Slot!', 'error');
        managerInput.focus();
        return;
      }
      if (!expireDate) {
        notify('Vui lòng chọn Ngày Hết Hạn!', 'error');
        expireInput.focus();
        return;
      }

      const schedules = (window.ShopVietState && window.ShopVietState.getSchedules) ? window.ShopVietState.getSchedules() : [];
      const item = schedules.find(s => s.id === id);
      if (!item) {
        notify('Không tìm thấy bản ghi cần lưu!', 'error');
        return;
      }

      // Cập nhật giá trị
      item.customerEmail = customerEmail;
      item.managerEmail = managerEmail;
      if (serviceName) item.serviceName = serviceName;
      if (startDate) item.startDate = startDate;
      item.expireDate = expireDate;

      // Cập nhật thuộc tính dataset dòng để tìm kiếm chuẩn xác
      const tr = document.querySelector(`tr[data-id="${id}"]`);
      if (tr) {
        tr.setAttribute('data-customer', customerEmail.toLowerCase());
        tr.setAttribute('data-manager', managerEmail.toLowerCase());
        tr.setAttribute('data-service', serviceName.toLowerCase());
      }

      // 1. Lưu LocalStorage ngay lập tức
      if (window.ShopVietState && window.ShopVietState.saveSchedules) {
        window.ShopVietState.saveSchedules(schedules);
      }

      // 2. Cập nhật badge hạn dùng tức thì trên giao diện
      this.updateScheduleDaysLeftBadge(id);

      // 3. Hiệu ứng nút Lưu Đám Mây: Đang lưu... -> Đã lưu ✓
      let originalBtnHTML = '';
      if (saveBtn) {
        originalBtnHTML = saveBtn.innerHTML;
        saveBtn.disabled = true;
        saveBtn.classList.remove('bg-emerald-50', 'text-emerald-700', 'dark:bg-emerald-950/60', 'dark:text-emerald-400', 'border-emerald-300', 'dark:border-emerald-800');
        saveBtn.classList.add('bg-indigo-600', 'text-white', 'border-indigo-600');
        saveBtn.innerHTML = `
          <svg class="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <span>Đang lưu...</span>
        `;
      }

      // 4. Đẩy ngay lên Cloud REST để không bị mất khi reset trang web hoặc đăng nhập trên máy khác
      try {
        if (window.ShopVietState && typeof window.ShopVietState.pushAllToCloud === 'function') {
          await window.ShopVietState.pushAllToCloud();
        }
        if (saveBtn) {
          saveBtn.classList.remove('bg-indigo-600', 'text-white', 'border-indigo-600');
          saveBtn.classList.add('bg-emerald-600', 'text-white', 'border-emerald-600');
          saveBtn.innerHTML = `
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>Đã lưu ✓</span>
          `;
          setTimeout(() => {
            saveBtn.disabled = false;
            saveBtn.classList.remove('bg-emerald-600', 'text-white', 'border-emerald-600');
            saveBtn.classList.add('bg-emerald-50', 'text-emerald-700', 'dark:bg-emerald-950/60', 'dark:text-emerald-400', 'border-emerald-300', 'dark:border-emerald-800');
            saveBtn.innerHTML = originalBtnHTML;
          }, 2000);
        }
        notify(`Đã lưu "${managerEmail}" lên Đám mây Cloud thành công! Không bị mất dữ liệu khi đổi máy.`, 'success');
      } catch (err) {
        console.warn('[Save Inline Schedule Cloud Sync Error]:', err);
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.classList.remove('bg-indigo-600', 'text-white', 'border-indigo-600');
          saveBtn.classList.add('bg-emerald-50', 'text-emerald-700', 'dark:bg-emerald-950/60', 'dark:text-emerald-400', 'border-emerald-300', 'dark:border-emerald-800');
          saveBtn.innerHTML = originalBtnHTML;
        }
        notify(`Đã lưu cục bộ! Đám mây sẽ tự đồng bộ khi có kết nối mạng.`, 'info');
      }
    },

    updateScheduleDaysLeftBadge: function (id) {
      const expireInput = document.getElementById(`sched-expire-${id}`);
      const badgeCell = document.getElementById(`sched-badge-cell-${id}`);
      if (!expireInput || !badgeCell || !expireInput.value) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const exp = new Date(expireInput.value);
      exp.setHours(0, 0, 0, 0);
      const diffMs = exp.getTime() - today.getTime();
      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      let statusBadge = '';
      if (daysLeft > 7) {
        statusBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 shadow-sm"><span class="w-2 h-2 rounded-full bg-emerald-500"></span>Còn ${daysLeft} ngày</span>`;
      } else if (daysLeft > 0) {
        statusBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-300 dark:border-amber-800 shadow-sm animate-pulse"><span class="w-2 h-2 rounded-full bg-amber-500"></span>Sắp hết (${daysLeft} ngày)</span>`;
      } else {
        statusBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-300 dark:border-rose-800 shadow-sm"><span class="w-2 h-2 rounded-full bg-rose-500"></span>Đã hết hạn</span>`;
      }
      badgeCell.innerHTML = statusBadge;
    },

    quickEditSchedule: function (id, field) {
      const list = (window.ShopVietState && window.ShopVietState.getSchedules) ? window.ShopVietState.getSchedules() : [];
      const item = list.find(s => s.id === id);
      if (!item) return;

      if (field === 'managerEmail') {
        const newVal = prompt('Nhập Email Quản Lý / Slot mới:', item.managerEmail);
        if (newVal !== null && newVal.trim()) {
          window.ShopVietState.updateSchedule(id, { managerEmail: newVal.trim() });
          if (typeof window.ShopVietState.pushAllToCloud === 'function') {
            window.ShopVietState.pushAllToCloud().catch(function () {});
          }
          this.switchTab('schedules');
          notify('Đã cập nhật Email Quản Lý!', 'success');
        }
      } else if (field === 'expireDate') {
        const newVal = prompt('Nhập Ngày Hết Hạn mới (YYYY-MM-DD):', item.expireDate);
        if (newVal !== null && newVal.trim()) {
          window.ShopVietState.updateSchedule(id, { expireDate: newVal.trim() });
          if (typeof window.ShopVietState.pushAllToCloud === 'function') {
            window.ShopVietState.pushAllToCloud().catch(function () {});
          }
          this.switchTab('schedules');
          notify('Đã cập nhật Ngày Hết Hạn!', 'success');
        }
      }
    },

    exportSchedulesToExcel: function () {
      const schedules = (window.ShopVietState && window.ShopVietState.getSchedules) ? window.ShopVietState.getSchedules() : [];
      if (!schedules || schedules.length === 0) {
        notify('Danh sách khách hàng đang trống, không thể xuất file!', 'warning');
        return;
      }

      const BOM = '\uFEFF';
      let csv = BOM + 'STT,Mã Lịch,Email Khách Hàng,Tên Khách Hàng,Email Quản Lý (Slot),Gói Dịch Vụ,Ngày Bắt Đầu,Ngày Hết Hạn,Số Ngày Còn Lại,Trạng Thái Hạn Dùng,Ghi Chú\r\n';
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const escapeCsv = function (str) {
        return `"${String(str || '').replace(/"/g, '""')}"`;
      };

      schedules.forEach(function (s, idx) {
        const exp = new Date(s.expireDate);
        exp.setHours(0, 0, 0, 0);
        const diffMs = exp.getTime() - today.getTime();
        const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        const status = daysLeft > 7 ? `Còn ${daysLeft} ngày` : (daysLeft > 0 ? `Sắp hết (${daysLeft} ngày)` : 'Đã hết hạn');

        const row = [
          idx + 1,
          escapeCsv(s.id),
          escapeCsv(s.customerEmail),
          escapeCsv(s.customerName),
          escapeCsv(s.managerEmail),
          escapeCsv(s.serviceName),
          escapeCsv(s.startDate),
          escapeCsv(s.expireDate),
          daysLeft,
          escapeCsv(status),
          escapeCsv(s.notes)
        ];
        csv += row.join(',') + '\r\n';
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'danh_sach_khach_hang_shopviet247.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      notify('Đã xuất danh sách khách hàng sang file Excel (CSV) thành công!', 'success');
    },

    filterSchedules: function (query) {
      const q = (query || '').trim().toLowerCase();
      const rows = document.querySelectorAll('#adminScheduleTableTbody tr');
      let matchCount = 0;
      rows.forEach(row => {
        const custInp = row.querySelector('[id^="sched-customer-"]');
        const mgrInp = row.querySelector('[id^="sched-manager-"]');
        const srvInp = row.querySelector('[id^="sched-service-"]');
        const customer = (custInp ? custInp.value : row.getAttribute('data-customer') || '').toLowerCase();
        const manager = (mgrInp ? mgrInp.value : row.getAttribute('data-manager') || '').toLowerCase();
        const service = (srvInp ? srvInp.value : row.getAttribute('data-service') || '').toLowerCase();
        const notes = (row.getAttribute('data-notes') || '').toLowerCase();
        const text = row.innerText.toLowerCase();
        if (!q || customer.includes(q) || manager.includes(q) || service.includes(q) || notes.includes(q) || text.includes(q)) {
          row.style.display = '';
          matchCount++;
        } else {
          row.style.display = 'none';
        }
      });
      const badge = document.getElementById('adminScheduleTableBadge');
      if (badge) {
        badge.textContent = `${matchCount} bản ghi`;
      }
    },

    resetDefaultSchedules: function () {
      if (window.ShopVietState && window.ShopVietState.saveSchedules) {
        const DEFAULT_SCHEDULES = [
          {
            id: 'SCH-001',
            customerEmail: 'cuongcuca111@gmail.com',
            customerName: 'Minh Cường',
            managerEmail: 'slot1-pro@shopviet.vip',
            serviceName: '[1 Tháng] Gemini Argon 4 Pro + 5TB Drive',
            startDate: '2026-10-29',
            expireDate: '2026-11-29',
            notes: 'Khách VIP nâng cấp chính chủ'
          },
          {
            id: 'SCH-002',
            customerEmail: 'huy.dev99@gmail.com',
            customerName: 'Nguyễn Huy',
            managerEmail: 'slot2-cursor@shopviet.vip',
            serviceName: 'Cursor Pro 1 Tháng Chính Chủ',
            startDate: '2026-10-25',
            expireDate: '2026-11-01',
            notes: 'Sắp hết hạn cần nhắc gia hạn'
          }
        ];
        window.ShopVietState.saveSchedules(DEFAULT_SCHEDULES);
        if (typeof window.ShopVietState.pushAllToCloud === 'function') {
          window.ShopVietState.pushAllToCloud().catch(function () {});
        }
        this.switchTab('schedules');
        const tabBadge = document.getElementById('adminScheduleTabBadge');
        if (tabBadge) {
          tabBadge.textContent = DEFAULT_SCHEDULES.length;
        }
        notify('Đã khôi phục danh sách hẹn lịch mẫu ban đầu!', 'success');
      }
    },

    // 21. Phát tín hiệu thử nghiệm Realtime Hub (Broadcast Test Ping)
    broadcastTestPing: function () {
      const payload = {
        msg: 'Admin vừa gửi tín hiệu đồng bộ!',
        time: new Date().toLocaleTimeString('vi-VN'),
        timestamp: Date.now()
      };
      if (window.ShopVietState && typeof window.ShopVietState.broadcastAdminChange === 'function') {
        window.ShopVietState.broadcastAdminChange('test_ping', payload);
      } else {
        try {
          if (typeof BroadcastChannel !== 'undefined') {
            const bc = new BroadcastChannel('shopviet_realtime_sync');
            bc.postMessage({ type: 'test_ping', payload: payload, timestamp: Date.now() });
            bc.close();
          }
        } catch (e) {}
        window.dispatchEvent(new CustomEvent('shopviet_realtime_change', { detail: { type: 'test_ping', payload: payload } }));
      }
      recordBroadcast('test_ping', 'Admin vừa gửi tín hiệu đồng bộ!');
      notify('⚡ Đã phát sóng dữ liệu thay đổi lên Cloud Realtime thành công! Mọi máy khách đang cập nhật tức thì.', 'success');
      if (currentActiveTab === 'realtime') {
        const tabContent = document.getElementById('adminTabContent');
        if (tabContent) tabContent.innerHTML = renderTabRealtime();
      }
    },

    // 22. Phát sóng đồng bộ lại toàn bộ Sản phẩm
    broadcastProductsSync: function () {
      const prods = (window.ShopVietData && window.ShopVietData.products) || [];
      const payload = {
        action: 'sync_all',
        count: prods.length,
        timestamp: Date.now()
      };
      if (window.ShopVietState && typeof window.ShopVietState.broadcastAdminChange === 'function') {
        window.ShopVietState.broadcastAdminChange('products_updated', payload);
      } else {
        try {
          if (typeof BroadcastChannel !== 'undefined') {
            const bc = new BroadcastChannel('shopviet_realtime_sync');
            bc.postMessage({ type: 'products_updated', payload: payload, timestamp: Date.now() });
            bc.close();
          }
        } catch (e) {}
        window.dispatchEvent(new CustomEvent('shopviet_realtime_change', { detail: { type: 'products_updated', payload: payload } }));
      }
      recordBroadcast('products_updated', `Đồng bộ toàn bộ ${prods.length} sản phẩm`);
      notify('⚡ Đã phát sóng dữ liệu thay đổi lên Cloud Realtime thành công! Mọi máy khách đang cập nhật tức thì.', 'success');
      if (currentActiveTab === 'realtime') {
        const tabContent = document.getElementById('adminTabContent');
        if (tabContent) tabContent.innerHTML = renderTabRealtime();
      }
    },

    // 23. Phát sóng đồng bộ Cấu hình VietQR
    broadcastVietQRSync: function () {
      const config = getVietQRConfig();
      const payload = {
        config: config,
        timestamp: Date.now()
      };
      if (window.ShopVietState && typeof window.ShopVietState.broadcastAdminChange === 'function') {
        window.ShopVietState.broadcastAdminChange('vietqr_updated', payload);
      } else {
        try {
          if (typeof BroadcastChannel !== 'undefined') {
            const bc = new BroadcastChannel('shopviet_realtime_sync');
            bc.postMessage({ type: 'vietqr_updated', payload: payload, timestamp: Date.now() });
            bc.close();
          }
        } catch (e) {}
        window.dispatchEvent(new CustomEvent('shopviet_realtime_change', { detail: { type: 'vietqr_updated', payload: payload } }));
      }
      recordBroadcast('vietqr_updated', `Cập nhật cấu hình VietQR (${config.accountName} - ${config.accountNumber})`);
      notify('⚡ Đã phát sóng dữ liệu thay đổi lên Cloud Realtime thành công! Mọi máy khách đang cập nhật tức thì.', 'success');
      if (currentActiveTab === 'realtime') {
        const tabContent = document.getElementById('adminTabContent');
        if (tabContent) tabContent.innerHTML = renderTabRealtime();
      }
    },

    // 24. Xóa nhật ký phát sóng
    clearBroadcastHistory: function () {
      localStorage.removeItem('shopviet_broadcast_history');
      notify('Đã xóa sạch nhật ký phát sóng!', 'info');
      if (currentActiveTab === 'realtime') {
        const tabContent = document.getElementById('adminTabContent');
        if (tabContent) tabContent.innerHTML = renderTabRealtime();
      }
    },

    // 25. MASTER ACTION: XUẤT BẢN & ĐỒNG BỘ TOÀN CẦU TỨC THÌ
    masterPublish: async function () {
      const btn = document.getElementById('adminMasterPublishBtn');
      const icon = document.getElementById('adminMasterPublishIcon');
      const text = document.getElementById('adminMasterPublishText');

      if (btn) btn.disabled = true;
      if (text) text.textContent = 'Đang xuất bản lên Cloud...';
      if (icon) icon.classList.add('animate-spin');

      try {
        const now = Date.now();
        const isoNow = new Date(now).toISOString();

        // 1. Lấy toàn bộ sản phẩm hiện tại, cập nhật updatedAt
        const prods = (window.ShopVietData && window.ShopVietData.products) || [];
        if (window.ShopVietState) {
          window.ShopVietState.setLastUpdatedAt(now);
          if (typeof window.ShopVietState.saveCustomProducts === 'function') {
            window.ShopVietState.saveCustomProducts(prods);
          }
        }

        // 2. Đẩy toàn bộ dữ liệu trực tiếp lên GitHub Cloud Storage & Fallback REST
        let pushSuccess = false;
        if (window.ShopVietState && typeof window.ShopVietState.pushAllToCloud === 'function') {
          pushSuccess = await window.ShopVietState.pushAllToCloud(false);
        }

        // 3. Phát sóng realtime tín hiệu master_publish tới tất cả thiết bị
        if (window.ShopVietState && typeof window.ShopVietState.broadcastAdminChange === 'function') {
          window.ShopVietState.broadcastAdminChange('master_publish', {
            action: 'master_publish',
            products: prods,
            count: prods.length,
            timestamp: now,
            updatedAt: now,
            isoTimestamp: isoNow,
            source: 'admin_master_publish'
          }, true);
        }

        // 4. Ghi nhận nhật ký phát sóng trong Admin Portal
        recordBroadcast('master_publish', `Xuất bản toàn cầu (${prods.length} sản phẩm)`);

        // 5. Hiển thị Toast / Modal thành công rực rỡ
        notify('🎉 Đã phát sóng cập nhật dữ liệu tới toàn bộ các thiết bị đang truy cập!', 'success');

        // Bắn CustomEvent shopviet_realtime_update để màn hình Home nhấp nháy phát sáng
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
          try {
            window.dispatchEvent(new CustomEvent('shopviet_realtime_update', {
              detail: {
                type: 'master_publish',
                message: '🔔 Cửa hàng vừa cập nhật sản phẩm mới!',
                updatedAt: now
              }
            }));
          } catch (eEvt) {}
        }

        // Cập nhật lại tab realtime nếu đang mở
        if (currentActiveTab === 'realtime') {
          const tabContent = document.getElementById('adminTabContent');
          if (tabContent) tabContent.innerHTML = renderTabRealtime();
        }
      } catch (err) {
        console.warn('[Admin Master Publish Error]:', err);
        notify('Lỗi xuất bản lên Đám Mây: ' + (err.message || 'Vui lòng kiểm tra kết nối mạng!'), 'error');
      } finally {
        if (btn) btn.disabled = false;
        if (text) text.textContent = '🚀 XUẤT BẢN & ĐỒNG BỘ TOÀN CẦU TỨC THÌ';
        if (icon) icon.classList.remove('animate-spin');
      }
    },

    // Helper export ra ngoài
    getVietQRConfig: getVietQRConfig,
    isAllowedAdminUser: isAllowedAdminUser
  };

  // Tự động lắng nghe phím tắt toàn cục và Hash khi file script được nạp
  window.addEventListener('keydown', function (e) {
    // Ctrl + Shift + A hoặc Cmd + Shift + A -> Mở Portal Admin Bí Mật
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      window.ShopVietViews.admin.open();
    }
  });

  window.addEventListener('hashchange', function () {
    if (window.location.hash === '#admin') {
      window.ShopVietViews.admin.open();
    }
  });

  // Kiểm tra ngay khi tải trang nếu URL có hash #admin
  if (window.location.hash === '#admin') {
    window.addEventListener('DOMContentLoaded', function () {
      setTimeout(() => window.ShopVietViews.admin.open(), 200);
    });
  }

})();
