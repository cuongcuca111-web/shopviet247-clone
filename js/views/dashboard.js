/**
 * Shopviet247 - User Dashboard View Module
 * Hiện thực hóa Màn hình Quản lý Người dùng chuẩn Clean SaaS UI Enterprise
 */

(function () {
  'use strict';

  window.ShopVietViews = window.ShopVietViews || {};

  let activeTab = 'overview'; // 'overview' | 'orders' | 'wallet' | 'referral' | 'gift' | 'security' | 'profile'
  let activeModalOrder = null;

  // Dữ liệu đơn hàng mặc định chuẩn nếu chưa có trong state
  const DEFAULT_INITIAL_ORDERS = [
    {
      id: 'SV-98421',
      productId: 'prod-chatgpt',
      productName: 'ChatGPT Plus 1 Tháng (Chính chủ)',
      date: '28/10/2026',
      price: 499000,
      total: 499000,
      status: 'completed',
      statusText: 'Hoàn tất',
      deliveryInfo: {
        account: 'huy.account@chatgpt.vip',
        licenseKey: 'p***_OpenAI_SecuredKey_8942_Pro',
        note: 'Tài khoản chính chủ đã kích hoạt sẵn gói Plus. Đổi pass mail thoải mái.',
        warranty: 'Bảo hành 1 đổi 1 trong 30 ngày',
        guide: '1. Truy cập https://chatgpt.com\n2. Đăng nhập bằng Email và Password trên\n3. Bắt đầu sử dụng GPT-4o và Voice Mode không giới hạn.'
      }
    },
    {
      id: 'SV-96102',
      productId: 'prod-cursor',
      productName: 'Cursor Pro 1 Tháng Chính Chủ - Nâng Cấp Email',
      date: '15/10/2026',
      price: 260000,
      total: 260000,
      status: 'completed',
      statusText: 'Hoàn tất',
      deliveryInfo: {
        account: 'huy.nguyen@example.com',
        licenseKey: 'CURSOR-PRO-INVITE: https://cursor.com/invite/sv247-vip-889',
        note: 'Đã gửi lời mời kích hoạt vào email cá nhân. Nhấn chấp nhận để nhận Pro.',
        warranty: 'Bảo hành 1 đổi 1 suốt thời gian sử dụng',
        guide: '1. Mở email cá nhân huy.nguyen@example.com\n2. Bấm "Accept Invite"\n3. Mở phần mềm Cursor và bắt đầu lập trình AI.'
      }
    }
  ];

  const dashboardView = {
    /**
     * Render HTML giao diện Dashboard 2 cột
     */
    render: function (params) {
      if (params && params.tab) {
        activeTab = params.tab;
      }

      // Lấy state hiện tại của User & Orders
      const user = (window.ShopVietState && window.ShopVietState.state && window.ShopVietState.state.user) 
        ? window.ShopVietState.state.user 
        : {
            name: 'Nguyễn Văn Huy',
            email: 'huy.nguyen@example.com',
            balance: 0,
            isLoggedIn: true,
            role: 'Thành viên VIP',
            avatar: 'H'
          };

      // Đồng bộ orders
      let orders = (window.ShopVietState && window.ShopVietState.state && window.ShopVietState.state.orders && window.ShopVietState.state.orders.length > 0)
        ? window.ShopVietState.state.orders
        : DEFAULT_INITIAL_ORDERS;

      // Chuẩn hóa định dạng hiển thị đơn hàng
      const normalizedOrders = orders.map(function (ord, idx) {
        const id = ord.id ? (ord.id.startsWith('SV-') ? ord.id : 'SV-' + ord.id.replace(/[^0-9]/g, '')) : `SV-984${idx + 21}`;
        const productName = ord.productName || (ord.product ? ord.product.name : 'ChatGPT Plus 1 Tháng');
        const date = ord.date ? (ord.date.includes(' ') ? ord.date.split(' ')[0] : ord.date) : '28/10/2026';
        const total = ord.total || ord.price || 499000;
        const totalFormatted = (total).toLocaleString('vi-VN') + 'đ';
        const deliveryInfo = ord.deliveryInfo || {
          account: user.email || 'huy.nguyen@example.com',
          licenseKey: ord.licenseKey || `SV-KEY-${id}-AI-PRO-2026`,
          note: ord.deliveryType || 'Kích hoạt tự động qua email hoặc link mời bản quyền.',
          warranty: 'Bảo hành 1 đổi 1 suốt thời gian sử dụng',
          guide: 'Đăng nhập vào dịch vụ chính thức và bắt đầu sử dụng. Cần trợ giúp vui lòng liên hệ CSKH 24/7.'
        };

        return {
          id: id,
          productName: productName,
          date: date,
          total: total,
          totalFormatted: totalFormatted,
          statusText: 'Hoàn tất',
          deliveryInfo: deliveryInfo
        };
      });

      const orderCount = normalizedOrders.length;
      const userBalanceFormatted = (user.balance || 0).toLocaleString('vi-VN') + 'đ';

      return `
        <div class="py-4 sm:py-6 animate-fade-in">
          
          <!-- Bố cục Màn hình Dashboard 2 cột: grid grid-cols-1 lg:grid-cols-12 gap-6 -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            <!-- ================= a. SIDEBAR BÊN TRÁI (4 COLS) ================= -->
            <aside class="lg:col-span-4 xl:col-span-3 space-y-4">
              
              <!-- Card Thông tin Tài khoản -->
              <div class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
                <!-- Avatar tròn nền xám than chữ "H" hoặc "C" trắng lớn -->
                <div class="w-12 h-12 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-lg shadow-sm select-none">
                  ${(user.name || 'H').trim().charAt(0).toUpperCase()}
                </div>
                
                <!-- Tên người dùng & Email -->
                <h2 class="text-base font-bold text-slate-900 dark:text-white mt-2.5">
                  ${user.name || 'Nguyễn Văn Huy'}
                </h2>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 break-all">
                  ${user.email || 'huy.nguyen@example.com'}
                </p>

                <!-- Badge tài khoản: "Thành viên VIP" -->
                <div class="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 shadow-xs">
                  <!-- Star / Crown SVG icon -->
                  <svg class="w-3.5 h-3.5 text-amber-500 fill-amber-400" viewBox="0 0 24 24">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  <span>Thành viên VIP</span>
                </div>
              </div>

              <!-- Danh sách menu dọc với icon -->
              <div class="bg-white dark:bg-slate-900 rounded-2xl p-2.5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1 text-sm font-medium">
                
                <!-- "Tổng quan" (Đang active) -->
                <button type="button" data-tab="overview" class="dashboard-nav-item w-full ${activeTab === 'overview' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'} rounded-xl px-4 py-2.5 flex items-center gap-3 transition-colors text-left cursor-pointer">
                  <svg class="w-4 h-4 shrink-0 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <rect width="7" height="9" x="3" y="3" rx="1" />
                    <rect width="7" height="5" x="14" y="3" rx="1" />
                    <rect width="7" height="9" x="14" y="12" rx="1" />
                    <rect width="7" height="5" x="3" y="16" rx="1" />
                  </svg>
                  <span>Tổng quan</span>
                </button>

                <!-- "Đơn hàng" (Badge số lượng đơn) -->
                <button type="button" data-tab="orders" class="dashboard-nav-item w-full ${activeTab === 'orders' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'} rounded-xl px-4 py-2.5 flex items-center justify-between transition-colors text-left cursor-pointer">
                  <div class="flex items-center gap-3">
                    <svg class="w-4 h-4 shrink-0 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                      <path d="M3 6h18" />
                      <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                    <span>Đơn hàng</span>
                  </div>
                  <span class="bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 text-xs px-2 py-0.5 rounded-full font-bold">
                    ${orderCount}
                  </span>
                </button>

                <!-- "Ví của tôi" (Hiển thị số dư) -->
                <button type="button" data-tab="wallet" class="dashboard-nav-item w-full ${activeTab === 'wallet' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'} rounded-xl px-4 py-2.5 flex items-center justify-between transition-colors text-left cursor-pointer">
                  <div class="flex items-center gap-3">
                    <svg class="w-4 h-4 shrink-0 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <rect width="20" height="14" x="2" y="5" rx="2" />
                      <line x1="2" x2="22" y1="10" y2="10" />
                    </svg>
                    <span>Ví của tôi</span>
                  </div>
                  <span class="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                    ${userBalanceFormatted}
                  </span>
                </button>

                <!-- "Giới thiệu bạn bè" -->
                <button type="button" data-tab="referral" class="dashboard-nav-item w-full ${activeTab === 'referral' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'} rounded-xl px-4 py-2.5 flex items-center justify-between transition-colors text-left cursor-pointer">
                  <div class="flex items-center gap-3">
                    <svg class="w-4 h-4 shrink-0 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span>Giới thiệu bạn bè</span>
                  </div>
                  <span class="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400 px-1.5 py-0.5 rounded">
                    +50k
                  </span>
                </button>

                <!-- "Thẻ quà tặng" -->
                <button type="button" data-tab="gift" class="dashboard-nav-item w-full ${activeTab === 'gift' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'} rounded-xl px-4 py-2.5 flex items-center gap-3 transition-colors text-left cursor-pointer">
                  <svg class="w-4 h-4 shrink-0 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <rect x="3" y="8" width="18" height="14" rx="2" />
                    <path d="M12 8v14" />
                    <path d="M19 12H5" />
                    <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
                  </svg>
                  <span>Thẻ quà tặng</span>
                </button>

                <!-- "Bảo mật & Mật khẩu" -->
                <button type="button" data-tab="security" class="dashboard-nav-item w-full ${activeTab === 'security' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'} rounded-xl px-4 py-2.5 flex items-center gap-3 transition-colors text-left cursor-pointer">
                  <svg class="w-4 h-4 shrink-0 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span>Bảo mật & Mật khẩu</span>
                </button>

                <!-- "Hồ sơ cá nhân" -->
                <button type="button" data-tab="profile" class="dashboard-nav-item w-full ${activeTab === 'profile' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'} rounded-xl px-4 py-2.5 flex items-center gap-3 transition-colors text-left cursor-pointer">
                  <svg class="w-4 h-4 shrink-0 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  <span>Hồ sơ cá nhân</span>
                </button>

                <!-- "Đăng xuất" (Màu đỏ text-rose-600 hover:bg-rose-50 rounded-xl) -->
                <div class="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button type="button" id="logoutBtn" class="w-full text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl px-4 py-2.5 flex items-center gap-3 transition-colors text-left cursor-pointer font-medium">
                    <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" x2="9" y1="12" y2="12" />
                    </svg>
                    <span>Đăng xuất</span>
                  </button>
                </div>

              </div>

            </aside>

            <!-- ================= b. KHU VỰC NỘI DUNG CHÍNH BÊN PHẢI (8-9 COLS) ================= -->
            <main class="lg:col-span-8 xl:col-span-9 space-y-6">
              
              <!-- Header: Tiêu đề lớn "Tổng quan tài khoản", bên phải có cụm 2 nút -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
                <div>
                  <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
                    Tổng quan tài khoản
                  </h1>
                  <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Chào mừng trở lại, ${user.name || 'Nguyễn Văn Huy'}! Quản lý đơn hàng và mã kích hoạt tự động.
                  </p>
                </div>

                <!-- Cụm 2 nút: "Nạp tiền VietQR" & "Mua tiếp" -->
                <div class="flex items-center gap-2.5 shrink-0">
                  <!-- Nút "Nạp tiền VietQR" -->
                  <button type="button" id="openVietQrBtn" class="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer">
                    <!-- Icon QR Code SVG -->
                    <svg class="w-4 h-4 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect width="5" height="5" x="3" y="3" rx="1" />
                      <rect width="5" height="5" x="16" y="3" rx="1" />
                      <rect width="5" height="5" x="3" y="16" rx="1" />
                      <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
                      <path d="M21 21v.01" />
                      <path d="M12 7v3a2 2 0 0 1-2 2H7" />
                      <path d="M3 12h.01" />
                      <path d="M12 3h.01" />
                      <path d="M12 16v.01" />
                      <path d="M16 12h1" />
                      <path d="M21 12v.01" />
                      <path d="M12 21v-1" />
                    </svg>
                    <span>Nạp tiền VietQR</span>
                  </button>

                  <!-- Nút "Mua tiếp" -->
                  <button type="button" id="buyMoreBtn" class="bg-slate-900 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                      <path d="M3 6h18" />
                      <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                    <span>Mua tiếp</span>
                  </button>
                </div>
              </div>

              <!-- Hàng 3 thẻ thống kê (Stats Cards: grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6) -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                <!-- Thẻ 1: Số dư ví -->
                <div class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-indigo-300 dark:hover:border-indigo-700 transition-all">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Số dư ví
                    </span>
                    <div class="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect width="20" height="14" x="2" y="5" rx="2" />
                        <line x1="2" x2="22" y1="10" y2="10" />
                      </svg>
                    </div>
                  </div>
                  <div class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
                    ${userBalanceFormatted}
                  </div>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1">
                    <span>Nạp thêm bằng VietQR để thanh toán 1 chạm</span>
                  </p>
                </div>

                <!-- Thẻ 2: Đơn hàng đã mua -->
                <div class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-300 dark:hover:border-emerald-700 transition-all">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Đơn hàng đã mua
                    </span>
                    <div class="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        <polyline points="3.29 7 12 12 20.71 7" />
                        <line x1="12" x2="12" y1="22" y2="12" />
                      </svg>
                    </div>
                  </div>
                  <div class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
                    ${orderCount}
                  </div>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                    Xem lại thông tin gói trong từng đơn
                  </p>
                </div>

                <!-- Thẻ 3: Đang chờ thanh toán -->
                <div class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-amber-300 dark:hover:border-amber-700 transition-all">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Đang chờ thanh toán
                    </span>
                    <div class="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                  </div>
                  <div class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
                    0
                  </div>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                    Hoàn tất trước khi đơn hết hạn
                  </p>
                </div>

              </div>

              <!-- Bảng "Đơn hàng gần đây" Clean SaaS -->
              <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                
                <!-- Header bảng: Tiêu đề "Lịch sử đơn hàng" + link "Xem tất cả đơn hàng" -->
                <div class="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Lịch sử đơn hàng</span>
                      <span class="text-xs font-normal text-slate-400">(${orderCount} đơn)</span>
                    </h3>
                  </div>
                  <button type="button" id="viewAllOrdersLink" class="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 cursor-pointer">
                    <span>Xem tất cả đơn hàng</span>
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                <!-- Cấu trúc bảng Clean SaaS: w-full text-sm text-left border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-sm -->
                <div class="overflow-x-auto">
                  <table class="w-full text-sm text-left">
                    <thead class="bg-slate-50/80 dark:bg-slate-800/60 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                      <tr>
                        <th scope="col" class="py-3 px-4 sm:px-5">MÃ ĐƠN HÀNG</th>
                        <th scope="col" class="py-3 px-4">SẢN PHẨM</th>
                        <th scope="col" class="py-3 px-4">NGÀY ĐẶT</th>
                        <th scope="col" class="py-3 px-4">TỔNG TIỀN</th>
                        <th scope="col" class="py-3 px-4">TRẠNG THÁI</th>
                        <th scope="col" class="py-3 px-4 sm:px-5 text-right">THAO TÁC</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                      ${normalizedOrders.map(function (order) {
                        return `
                          <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                            <!-- MÃ ĐƠN HÀNG -->
                            <td class="py-3.5 px-4 sm:px-5 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                              ${order.id}
                            </td>

                            <!-- SẢN PHẨM -->
                            <td class="py-3.5 px-4 max-w-[240px]">
                              <div class="font-semibold text-slate-900 dark:text-white truncate" title="${order.productName}">
                                ${order.productName}
                              </div>
                              <div class="text-[11px] text-slate-400 truncate">
                                ${order.deliveryInfo.account ? 'Gán cho: ' + order.deliveryInfo.account : 'Tự động bàn giao'}
                              </div>
                            </td>

                            <!-- NGÀY ĐẶT -->
                            <td class="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                              ${order.date}
                            </td>

                            <!-- TỔNG TIỀN -->
                            <td class="py-3.5 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                              ${order.totalFormatted}
                            </td>

                            <!-- TRẠNG THÁI: Trạng thái "Hoàn tất": Badge xanh lá bg-emerald-50 text-emerald-600 border border-emerald-200/60 text-xs px-2.5 py-1 rounded-full font-medium -->
                            <td class="py-3.5 px-4 whitespace-nowrap">
                              <span class="bg-emerald-50 text-emerald-600 border border-emerald-200/60 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/60 text-xs px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1">
                                <svg class="w-3 h-3 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span>Hoàn tất</span>
                              </span>
                            </td>

                            <!-- THAO TÁC: Nút "Xem chi tiết →" ở cuối -->
                            <td class="py-3.5 px-4 sm:px-5 text-right whitespace-nowrap">
                              <button type="button" data-order-id="${order.id}" class="view-order-detail-btn inline-flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
                                <span>Xem chi tiết</span>
                                <span>→</span>
                              </button>
                            </td>
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                </div>

              </div>

            </main>

          </div>

          <!-- ================= MODAL XEM CHI TIẾT ĐƠN HÀNG ================= -->
          <div id="orderDetailModal" class="hidden fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-slide-up relative">
              
              <div class="flex items-start justify-between">
                <div>
                  <span class="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400" id="modalOrderId">SV-98421</span>
                  <h3 class="text-lg font-bold text-slate-900 dark:text-white mt-0.5" id="modalOrderProduct">
                    ChatGPT Plus 1 Tháng
                  </h3>
                </div>
                <button type="button" id="closeDetailModalBtn" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <!-- Hộp Bàn Giao Tài Khoản & Key Kích Hoạt -->
              <div class="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Thông tin bàn giao bản quyền</span>
                  <span class="text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-200/60">
                    Bảo hành 1 đổi 1
                  </span>
                </div>

                <!-- Tài khoản / Email -->
                <div>
                  <span class="text-[11px] text-slate-500 block">Tài khoản / Email bàn giao:</span>
                  <div class="flex items-center justify-between gap-2 mt-1">
                    <code id="modalOrderAccount" class="text-xs font-mono font-bold text-slate-900 dark:text-white select-all bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 flex-1 truncate">
                      huy.account@chatgpt.vip
                    </code>
                    <button type="button" id="copyAccountBtn" class="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-xs font-semibold shrink-0 cursor-pointer">
                      Copy
                    </button>
                  </div>
                </div>

                <!-- Password / Key -->
                <div>
                  <span class="text-[11px] text-slate-500 block">Mật khẩu / Key kích hoạt:</span>
                  <div class="flex items-center justify-between gap-2 mt-1">
                    <code id="modalOrderKey" class="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 select-all bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 flex-1 truncate">
                      p***_OpenAI_SecuredKey_8942
                    </code>
                    <button type="button" id="copyKeyBtn" class="px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 text-xs font-semibold shrink-0 cursor-pointer shadow-sm">
                      Copy Key
                    </button>
                  </div>
                </div>
              </div>

              <!-- Hướng dẫn sử dụng 1 đổi 1 -->
              <div class="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 pt-1">
                <div class="font-bold text-slate-800 dark:text-slate-200">Hướng dẫn sử dụng & Bảo hành:</div>
                <div id="modalOrderGuide" class="bg-amber-50/60 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200/60 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 text-xs whitespace-pre-line leading-relaxed">
                  Đăng nhập chính thức tại trang chủ dịch vụ. Sản phẩm được bảo hành 1 đổi 1 trong suốt thời gian kích hoạt.
                </div>
              </div>

              <!-- Nút hỗ trợ & Đóng -->
              <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" id="closeDetailModalBtn2" class="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                  Đóng
                </button>
                <button type="button" onclick="ShopVietState.showToast('CSKH Zalo CSKH: 0987.654.321 sẵn sàng hỗ trợ 24/7', 'info')" class="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500 text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                  <span>Liên hệ hỗ trợ 24/7</span>
                </button>
              </div>

            </div>
          </div>

          <!-- ================= MODAL NẠP TIỀN VIETQR ================= -->
          <div id="vietQrModal" class="hidden fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-slide-up relative">
              
              <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <!-- VietQR logo text -->
                    <span>Nạp tiền VietQR tự động</span>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">Tức thì 5s</span>
                  </h3>
                  <p class="text-xs text-slate-500">Quét mã QR bằng mọi ứng dụng ngân hàng hoặc ví MoMo</p>
                </div>
                <button type="button" id="closeVietQrModalBtn" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <!-- VietQR Mockup Card -->
              <div class="flex flex-col items-center bg-gradient-to-b from-indigo-50/50 to-white dark:from-slate-800/80 dark:to-slate-900 p-4 rounded-2xl border border-indigo-100 dark:border-slate-700 text-center">
                
                <!-- VietQR Visual Box -->
                <div class="p-3 bg-white rounded-xl shadow-md border border-slate-200/80 mb-3">
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=2|99|09876543210|CONG%20TY%20SHOPVIET247|0|0|NAP%20HUY984" alt="VietQR Nạp Tiền" class="w-40 h-40 object-contain rounded-lg">
                </div>

                <div class="w-full space-y-2 text-xs text-left bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700">
                  <div class="flex justify-between items-center">
                    <span class="text-slate-400">Ngân hàng:</span>
                    <strong class="text-slate-900 dark:text-white">MB Bank (Quân Đội)</strong>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-slate-400">Số tài khoản:</span>
                    <div class="flex items-center gap-1.5">
                      <strong class="font-mono text-slate-900 dark:text-white">9876543210</strong>
                      <button type="button" onclick="navigator.clipboard.writeText('9876543210'); ShopVietState.showToast('Đã copy số tài khoản MB Bank!', 'success')" class="text-indigo-600 text-[11px] hover:underline font-bold">Copy</button>
                    </div>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-slate-400">Chủ tài khoản:</span>
                    <strong class="text-slate-900 dark:text-white">CONG TY SHOPVIET247</strong>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-slate-400">Nội dung CK:</span>
                    <div class="flex items-center gap-1.5">
                      <strong class="font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-slate-900 px-2 py-0.5 rounded font-bold">NAP HUY984</strong>
                      <button type="button" onclick="navigator.clipboard.writeText('NAP HUY984'); ShopVietState.showToast('Đã copy cú pháp chuyển khoản!', 'success')" class="text-indigo-600 text-[11px] hover:underline font-bold">Copy</button>
                    </div>
                  </div>
                </div>

              </div>

              <!-- Gợi ý số tiền nạp nhanh -->
              <div class="space-y-1.5">
                <span class="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Chọn nhanh số tiền nạp:</span>
                <div class="grid grid-cols-4 gap-2">
                  <button type="button" onclick="ShopVietViews.dashboard.handleQuickDeposit(50000)" class="py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200">50.000đ</button>
                  <button type="button" onclick="ShopVietViews.dashboard.handleQuickDeposit(100000)" class="py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200">100.000đ</button>
                  <button type="button" onclick="ShopVietViews.dashboard.handleQuickDeposit(200000)" class="py-2 text-xs font-bold rounded-xl border border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300">200.000đ</button>
                  <button type="button" onclick="ShopVietViews.dashboard.handleQuickDeposit(500000)" class="py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200">500.000đ</button>
                </div>
              </div>

              <!-- Nút xác nhận -->
              <div class="pt-2">
                <button type="button" onclick="ShopVietViews.dashboard.handleConfirmDeposit()" class="w-full py-3 rounded-xl bg-slate-900 text-white dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 font-bold text-sm shadow-md transition-all active:scale-[0.99] cursor-pointer">
                  Tôi đã chuyển khoản thành công
                </button>
              </div>

            </div>
          </div>

        </div>
      `;
    },

    /**
     * Khởi tạo các sự kiện tương tác sau khi mount view
     */
    afterRender: function () {
      // 1. Nút Đăng xuất
      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
          if (window.ShopVietState && typeof window.ShopVietState.logout === 'function') {
            window.ShopVietState.logout();
          } else if (window.ShopVietState) {
            if (window.ShopVietState.state && window.ShopVietState.state.user) {
              window.ShopVietState.state.user.isLoggedIn = false;
            }
            if (window.ShopVietState.user) {
              window.ShopVietState.user.isLoggedIn = false;
            }
            window.ShopVietState.save();
            window.ShopVietState.showToast('Bạn đã đăng xuất tài khoản an toàn!', 'info');
            window.ShopVietState.navigate('home');
          }
        });
      }

      // 2. Nút "Mua tiếp" -> Chuyển về Home
      const buyMoreBtn = document.getElementById('buyMoreBtn');
      if (buyMoreBtn) {
        buyMoreBtn.addEventListener('click', function () {
          window.ShopVietState.navigate('home', { scrollTo: '#productsSection' });
        });
      }

      // 3. Nút "Nạp tiền VietQR"
      const openVietQrBtn = document.getElementById('openVietQrBtn');
      const vietQrModal = document.getElementById('vietQrModal');
      const closeVietQrModalBtn = document.getElementById('closeVietQrModalBtn');

      if (openVietQrBtn && vietQrModal) {
        openVietQrBtn.addEventListener('click', function () {
          vietQrModal.classList.remove('hidden');
        });
      }

      if (closeVietQrModalBtn && vietQrModal) {
        closeVietQrModalBtn.addEventListener('click', function () {
          vietQrModal.classList.add('hidden');
        });
      }

      // 4. Các nút "Xem chi tiết →" trên bảng đơn hàng
      const detailBtns = document.querySelectorAll('.view-order-detail-btn');
      const orderDetailModal = document.getElementById('orderDetailModal');
      const closeDetailModalBtn = document.getElementById('closeDetailModalBtn');
      const closeDetailModalBtn2 = document.getElementById('closeDetailModalBtn2');

      const orders = (window.ShopVietState && window.ShopVietState.state && window.ShopVietState.state.orders && window.ShopVietState.state.orders.length > 0)
        ? window.ShopVietState.state.orders
        : DEFAULT_INITIAL_ORDERS;

      detailBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          const orderId = btn.getAttribute('data-order-id');
          const found = orders.find(function (o) {
            return o.id === orderId || (o.id && o.id.includes(orderId.replace('SV-', '')));
          }) || orders[0];

          if (found && orderDetailModal) {
            const modalOrderId = document.getElementById('modalOrderId');
            const modalOrderProduct = document.getElementById('modalOrderProduct');
            const modalOrderAccount = document.getElementById('modalOrderAccount');
            const modalOrderKey = document.getElementById('modalOrderKey');
            const modalOrderGuide = document.getElementById('modalOrderGuide');

            const delInfo = found.deliveryInfo || {
              account: (window.ShopVietState.state.user && window.ShopVietState.state.user.email) || 'huy.nguyen@example.com',
              licenseKey: found.licenseKey || 'SV-KEY-8942-PRO-VIP',
              guide: 'Đăng nhập vào trang chủ và bắt đầu sử dụng. Bảo hành 1 đổi 1 suốt thời gian hiệu lực.'
            };

            if (modalOrderId) modalOrderId.textContent = orderId;
            if (modalOrderProduct) modalOrderProduct.textContent = found.productName || 'ChatGPT Plus 1 Tháng';
            if (modalOrderAccount) modalOrderAccount.textContent = delInfo.account || 'huy.nguyen@example.com';
            if (modalOrderKey) modalOrderKey.textContent = delInfo.licenseKey || found.licenseKey || 'SV-LICENSE-KEY-VIP';
            if (modalOrderGuide) modalOrderGuide.textContent = delInfo.guide || 'Sản phẩm được kích hoạt tự động. Bảo hành 1 đổi 1.';

            orderDetailModal.classList.remove('hidden');
          }
        });
      });

      if (closeDetailModalBtn && orderDetailModal) {
        closeDetailModalBtn.addEventListener('click', function () {
          orderDetailModal.classList.add('hidden');
        });
      }
      if (closeDetailModalBtn2 && orderDetailModal) {
        closeDetailModalBtn2.addEventListener('click', function () {
          orderDetailModal.classList.add('hidden');
        });
      }

      // 5. Nút Copy tài khoản & Copy Key trong modal
      const copyAccountBtn = document.getElementById('copyAccountBtn');
      if (copyAccountBtn) {
        copyAccountBtn.addEventListener('click', function () {
          const accEl = document.getElementById('modalOrderAccount');
          if (accEl) {
            navigator.clipboard.writeText(accEl.textContent.trim());
            window.ShopVietState.showToast('Đã sao chép Email tài khoản!', 'success');
          }
        });
      }

      const copyKeyBtn = document.getElementById('copyKeyBtn');
      if (copyKeyBtn) {
        copyKeyBtn.addEventListener('click', function () {
          const keyEl = document.getElementById('modalOrderKey');
          if (keyEl) {
            navigator.clipboard.writeText(keyEl.textContent.trim());
            window.ShopVietState.showToast('Đã sao chép License Key thành công!', 'success');
          }
        });
      }

      // 6. Navigation tabs bên sidebar
      const navItems = document.querySelectorAll('.dashboard-nav-item');
      navItems.forEach(function (item) {
        item.addEventListener('click', function () {
          const tab = item.getAttribute('data-tab');
          if (tab === 'overview' || tab === 'orders') {
            activeTab = tab;
            window.ShopVietState.navigate('dashboard', { tab: tab });
          } else if (tab === 'wallet') {
            const qrModal = document.getElementById('vietQrModal');
            if (qrModal) qrModal.classList.remove('hidden');
          } else {
            window.ShopVietState.showToast(`Phân hệ "${item.textContent.trim()}" đang hoạt động bình thường!`, 'info');
          }
        });
      });

      // 7. Xem tất cả đơn hàng
      const viewAllOrdersLink = document.getElementById('viewAllOrdersLink');
      if (viewAllOrdersLink) {
        viewAllOrdersLink.addEventListener('click', function () {
          window.ShopVietState.showToast('Bạn đang xem toàn bộ đơn hàng trong tài khoản!', 'info');
        });
      }
    },

    /**
     * Nạp nhanh số tiền được chọn vào ví
     */
    handleQuickDeposit: function (amount) {
      if (!window.ShopVietState || !window.ShopVietState.state) return;
      window.ShopVietState.state.user = window.ShopVietState.state.user || {};
      window.ShopVietState.state.user.balance = (window.ShopVietState.state.user.balance || 0) + amount;
      window.ShopVietState.save();

      const qrModal = document.getElementById('vietQrModal');
      if (qrModal) qrModal.classList.add('hidden');

      window.ShopVietState.showToast(`Nạp thành công +${amount.toLocaleString('vi-VN')}đ vào ví!`, 'success');
      window.ShopVietState.navigate('dashboard');
    },

    /**
     * Xác nhận đã chuyển khoản thành công
     */
    handleConfirmDeposit: function () {
      this.handleQuickDeposit(200000);
    }
  };

  // Gắn vào window.ShopVietViews.dashboard
  window.ShopVietViews.dashboard = dashboardView;

})();
