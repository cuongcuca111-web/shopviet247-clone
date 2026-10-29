/**
 * Shopviet247 - Secret Admin Portal View Module
 * Tệp: js/views/admin.js
 * 
 * Cổng Quản Trị Bí Mật (minhcuong111) chuẩn xác theo phong cách Ảnh 3:
 * - Bảo mật truy cập: Phím tắt Ctrl + Shift + A, Hash #admin, Mã PIN xác thực (minhcuong111 / admin2026)
 * - Header Modal chuẩn Ảnh 3: Icon bánh răng gradient tím/xanh, Tiêu đề "Phiên quản trị (minhcuong111)", Badge "Admin Session", Dòng phụ "Bạn vẫn đang dùng tài khoản Minh Cuong • Phiên: 59:54 • Cấu hình: v12", nút Làm mới 🔄, Về Trang chủ, Đăng xuất
 * - Tab 1: 🏷️ Giá & gói (Quản lý sản phẩm: thêm/sửa/xóa, giá bán, giá gốc, tồn kho, trạng thái, ảnh/icon, lưu localStorage, realtime cập nhật view Home)
 * - Tab 2: 💳 Thanh toán VietQR & Đơn hàng (Duyệt đơn, xem ảnh bill, thống kê doanh thu)
 * - Tab 3: ⚙️ Cấu hình VietQR (Cấu hình STK, Chủ TK, Ngân hàng, Live VietQR Preview)
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
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
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
  let currentActiveTab = 'pricing'; // 'pricing' | 'orders' | 'vietqr'
  let sessionCountdownSeconds = 59 * 60 + 54; // 59:54
  let sessionIntervalTimer = null;
  let editingProductId = null; // null = tạo mới, string = sửa

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

            <!-- Cụm Nút Phải Chuẩn Ảnh 3: Làm Mới 🔄, Về Trang Chủ, Đăng Xuất -->
            <div class="flex items-center gap-2">
              <!-- Nút Làm Mới 🔄 -->
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
              <span class="text-base">🏷️</span>
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
              <span class="text-base">💳</span>
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
              <span class="text-base">⚙️</span>
              <span>Cấu hình VietQR</span>
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
    }
    return renderTabPricing();
  }

  // =========================================================================
  // TAB 1: 🏷️ GIÁ & GÓI (QUẢN LÝ SẢN PHẨM)
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
              <span>+ Thêm sản phẩm mới</span>
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
            ${prod.badge ? `<span class="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">${prod.badge}</span>` : ''}
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
              <span>✏️</span>
              <span>Sửa</span>
            </button>
            <button 
              type="button" 
              onclick="window.ShopVietViews.admin.deleteProduct('${prod.id}')" 
              class="px-2 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-semibold transition"
              title="Xóa sản phẩm"
            >
              <span>🗑️</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  // =========================================================================
  // TAB 2: 💳 THANH TOÁN VIETQR & ĐƠN HÀNG
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
    const customer = order.customerName || (order.user && order.user.name) || 'Khách vãng lai';
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
        <td class="py-3 px-3.5">
          <div class="font-semibold text-slate-800 dark:text-slate-200">${customer}</div>
          <div class="text-[10px] text-slate-400">VietQR MB Bank</div>
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
          ${isCompleted ? `
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Hoàn tất
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
            class="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
            <span>Xem bill</span>
          </button>
        </td>

        <!-- THAO TÁC -->
        <td class="py-3 px-4 text-right">
          ${!isCompleted ? `
            <button 
              type="button" 
              onclick="window.ShopVietViews.admin.approveOrder('${code}')" 
              class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition"
            >
              ✓ Duyệt hoàn tất
            </button>
          ` : `
            <span class="text-xs text-slate-400 font-medium">Đã kích hoạt</span>
          `}
        </td>
      </tr>
    `;
  }

  // =========================================================================
  // TAB 3: ⚙️ CẤU HÌNH VIETQR
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
                <span>⚙️ Cấu Hình Tài Khoản Nhận Tiền VietQR</span>
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
      badge: 'Bán chạy nhất',
      warranty: '18 tháng (1 đổi 1)',
      desc: 'Mô tả tính năng gói sản phẩm bản quyền tự động 24/7...'
    };

    if (isEdit && window.ShopVietData && window.ShopVietData.products) {
      const found = window.ShopVietData.products.find(p => p.id === productId);
      if (found) prod = Object.assign({}, found);
    }

    return `
      <div id="productEditBackdrop" class="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
          
          <!-- Header -->
          <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/70">
            <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>${isEdit ? '✏️ Chỉnh Sửa Sản Phẩm' : '✨ Thêm Sản Phẩm Mới'}</span>
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
              <div>
                <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Huy hiệu nổi bật (Badge)</label>
                <input 
                  type="text" 
                  id="editProdBadge" 
                  value="${prod.badge || 'Bán chạy nhất'}" 
                  placeholder="Ví dụ: Bán chạy nhất, Hot Dev..." 
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
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

    // 8. Chuyển Tab
    switchTab: function (tabKey) {
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

    // 9. Làm mới dữ liệu
    refreshData: function () {
      restoreProductsFromStorage();
      const tabContent = document.getElementById('adminTabContent');
      if (tabContent) {
        tabContent.innerHTML = renderTabBody(currentActiveTab);
      }
      notify('Đã làm mới dữ liệu phiên quản trị!', 'info');
    },

    // 10. Mở Modal Thêm / Sửa Sản phẩm
    openProductModal: function (productId) {
      const existing = document.getElementById('productEditBackdrop');
      if (existing) existing.remove();

      const container = document.createElement('div');
      container.innerHTML = renderProductEditModal(productId);
      document.body.appendChild(container.firstElementChild);
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
      const badge = document.getElementById('editProdBadge').value.trim();
      const warranty = document.getElementById('editProdWarranty').value.trim();
      const desc = document.getElementById('editProdDesc').value.trim();

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
            warranty,
            desc
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
          badge: badge || 'Mới',
          badgeColor: 'bg-indigo-600 text-white',
          autoDelivery: false,
          warranty: warranty || '12 tháng (1 đổi 1)',
          desc,
          iconType: iconType || 'gemini',
          features: [
            'Bản quyền kích hoạt nhanh chóng 24/7',
            'Bảo hành 1 đổi 1 nhanh chóng',
            'Hỗ trợ kỹ thuật qua Zalo 0868668809'
          ]
        };
        window.ShopVietData.products.unshift(newProd);
      }

      // Lưu trữ xuống localStorage
      try {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(window.ShopVietData.products));
      } catch (e) {
        console.warn('[Save Products LocalStorage Error]:', e);
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

      notify(`Đã lưu sản phẩm "${name.slice(0, 30)}..." thành công!`, 'success');
    },

    // 12. Xóa Sản Phẩm
    deleteProduct: function (productId) {
      if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi hệ thống không?')) return;

      if (window.ShopVietData && window.ShopVietData.products) {
        window.ShopVietData.products = window.ShopVietData.products.filter(p => p.id !== productId);
        try {
          localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(window.ShopVietData.products));
        } catch (e) {
          console.warn('[Delete Product LocalStorage Error]:', e);
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

        notify('Đã xóa sản phẩm thành công!', 'info');
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
        const ord = window.ShopVietState.state.orders.find(o => (o.orderCode === orderCode || o.id === orderCode));
        if (ord) {
          ord.status = 'completed';
          ord.statusText = 'Đã hoàn tất';
          if (!ord.licenseKey) {
            ord.licenseKey = `KEY-${Date.now().toString().slice(-6)}-PRO-ACTIVE`;
          }
          window.ShopVietState.save();
        }
      }

      // Re-render tab orders
      const tabContent = document.getElementById('adminTabContent');
      if (tabContent && currentActiveTab === 'orders') {
        tabContent.innerHTML = renderTabOrders();
      }

      notify(`Đã duyệt hoàn tất và kích hoạt license cho đơn hàng ${orderCode}!`, 'success');
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
      notify('Đã lưu cấu hình tài khoản VietQR thành công! Các luồng thanh toán sẽ cập nhật tức thì.', 'success');
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
