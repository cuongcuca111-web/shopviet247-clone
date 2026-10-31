/**
 * Shopviet247 - User Dashboard View Module
 * Hiện thực hóa Màn hình Quản lý Người dùng chuẩn Clean SaaS UI Enterprise
 * Hỗ trợ các Phân hệ Tương tác:
 * 1. Tổng quan (overview)
 * 2. Đơn hàng (orders)
 * 3. Thẻ quà tặng (giftcards)
 * 4. Giới thiệu bạn bè (referral)
 * 5. Bảo mật & Mật khẩu (security)
 * 6. Hồ sơ cá nhân (profile)
 */

(function () {
  'use strict';

  window.ShopVietViews = window.ShopVietViews || {};

  // Tab đang hoạt động mặc định
  let activeTab = 'overview';
  let activeModalOrder = null;
  let currentOrderFilter = 'all'; // 'all' | 'completed' | 'pending'
  let orderSearchQuery = '';
  let selectedDepositAmount = 200000;

  // Cấu hình ngân hàng Sacombank chuẩn theo quy định hệ thống
  const SACOMBANK_CONFIG = {
    bankName: 'Sacombank (Ngân hàng TMCP Sài Gòn Thương Tín)',
    shortName: 'Sacombank',
    accountNumber: '100071864927',
    accountName: 'LE BUI MINH CUONG',
    bin: '970403'
  };

  // Dữ liệu đơn hàng mẫu mặc định cho tài khoản Admin Minh Cường
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
      userEmail: 'minhcuong111aaa@gmail.com',
      deliveryInfo: {
        account: 'cuong.account@chatgpt.vip',
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
      userEmail: 'minhcuong111aaa@gmail.com',
      deliveryInfo: {
        account: 'minhcuong111aaa@gmail.com',
        licenseKey: 'CURSOR-PRO-INVITE: https://cursor.com/invite/sv247-vip-889',
        note: 'Đã gửi lời mời kích hoạt vào email cá nhân. Nhấn chấp nhận để nhận Pro.',
        warranty: 'Bảo hành 1 đổi 1 suốt thời gian sử dụng',
        guide: '1. Mở email cá nhân minhcuong111aaa@gmail.com\n2. Bấm "Accept Invite"\n3. Mở phần mềm Cursor và bắt đầu lập trình AI.'
      }
    },
    {
      id: 'SV-95210',
      productId: 'prod-canva',
      productName: 'Canva Pro Nâng Cấp Email Chính Chủ 1 Năm',
      date: '10/10/2026',
      price: 180000,
      total: 180000,
      status: 'completed',
      statusText: 'Hoàn tất',
      userEmail: 'minhcuong111aaa@gmail.com',
      deliveryInfo: {
        account: 'minhcuong111aaa@gmail.com',
        licenseKey: 'CANVA-TEAM-INVITE-LINK-VIP-2026',
        note: 'Đã thêm email cá nhân vào Đội ngũ Canva Pro Edu / Brand Kit đầy đủ bản quyền.',
        warranty: 'Bảo hành 1 đổi 1 trọn đời gói',
        guide: '1. Đăng nhập https://canva.com bằng email của bạn\n2. Chuyển sang Không gian làm việc Pro\n3. Sử dụng không giới hạn mẫu thiết kế VIP.'
      }
    }
  ];

  /**
   * Lấy User hiện tại từ State (nếu chưa đăng nhập thì trả về Guest)
   */
  function getCurrentUser() {
    if (window.ShopVietState && window.ShopVietState.state && window.ShopVietState.state.user && window.ShopVietState.state.user.isLoggedIn) {
      return window.ShopVietState.state.user;
    }
    return {
      name: 'Khách hàng',
      email: '',
      balance: 0,
      phone: '',
      isLoggedIn: false,
      role: 'Khách',
      avatar: 'K',
      twoFactorEnabled: false
    };
  }

  /**
   * Lấy danh sách đơn hàng được cô lập 100% của chính user hiện tại
   */
  function getUserOrders(user) {
    if (!user || !user.isLoggedIn || !user.email) {
      return [];
    }
    const userEmail = user.email.toLowerCase().trim();

    // Dùng hàm getUserOrders chuẩn của ShopVietState để lọc cô lập 100% theo userEmail
    let allOrders = [];
    if (window.ShopVietState && typeof window.ShopVietState.getUserOrders === 'function') {
      allOrders = window.ShopVietState.getUserOrders(userEmail);
    } else if (window.ShopVietState && window.ShopVietState.state && window.ShopVietState.state.orders) {
      allOrders = window.ShopVietState.state.orders.filter(function (ord) {
        const ordEmail = (ord.userEmail || (ord.customer && ord.customer.email) || '').trim().toLowerCase();
        return ordEmail === userEmail;
      });
    }

    return allOrders.map(function (ord, idx) {
      const id = ord.id ? (ord.id.startsWith('SV-') ? ord.id : 'SV-' + ord.id.replace(/[^0-9]/g, '')) : `SV-984${idx + 21}`;
      const productName = ord.productName || (ord.product ? ord.product.name : (ord.items && ord.items[0] ? ord.items[0].name : 'Gói dịch vụ AI Pro'));
      const date = ord.createdAtFormatted ? (ord.createdAtFormatted.includes(' ') ? ord.createdAtFormatted.split(' ')[1] : ord.createdAtFormatted) : (ord.date ? (ord.date.includes(' ') ? ord.date.split(' ')[0] : ord.date) : '28/10/2026');
      const total = ord.amount || ord.total || ord.price || 0;
      const status = ord.status || 'completed';
      const statusText = status === 'pending_review' ? 'Chờ duyệt' : (status === 'pending' ? 'Chờ thanh toán' : 'Hoàn tất');
      const deliveryInfo = ord.deliveryInfo || {
        account: ord.userEmail || user.email,
        licenseKey: ord.licenseKey || `SV-KEY-${id}-AI-PRO-2026`,
        note: ord.deliveryType || 'Kích hoạt tự động qua email hoặc link mời bản quyền.',
        warranty: 'Bảo hành 1 đổi 1 suốt thời gian sử dụng',
        guide: 'Đăng nhập vào dịch vụ chính thức và bắt đầu sử dụng. Cần trợ giúp vui lòng liên hệ CSKH 24/7.'
      };

      return {
        id: id,
        productId: ord.productId || 'prod-ai',
        productName: productName,
        date: date,
        total: total,
        totalFormatted: total.toLocaleString('vi-VN') + 'đ',
        status: status,
        statusText: statusText,
        userEmail: ord.userEmail || user.email,
        deliveryInfo: deliveryInfo,
        customDeliveryLink: ord.customDeliveryLink || (ord.deliveryInfo && ord.deliveryInfo.customDeliveryLink) || '',
        adminMessage: ord.adminMessage || (ord.deliveryInfo && ord.deliveryInfo.adminMessage) || '',
        licenseKey: ord.licenseKey || (ord.deliveryInfo && ord.deliveryInfo.licenseKey) || ''
      };
    });
  }

  /**
   * Quản lý Lịch sử biến động số dư Ví trong LocalStorage theo tài khoản độc lập
   */
  function getWalletTransactions(userEmail) {
    if (!userEmail) return [];
    const cleanEmail = userEmail.trim().toLowerCase();
    const key = 'shopviet247_wallet_tx_' + cleanEmail;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Lỗi đọc lịch sử ví:', e);
    }

    // Chỉ tài khoản Admin Minh Cường có sẵn giao dịch mẫu khớp số dư 250.000đ
    if (cleanEmail === 'minhcuong111aaa@gmail.com') {
      const defaultTx = [
        {
          id: 'TX-892101',
          type: 'deposit',
          typeName: 'Nạp tiền VietQR Sacombank',
          amount: 500000,
          amountFormatted: '+500.000đ',
          balanceAfter: 500000,
          date: '28/10/2026 14:15',
          status: 'completed',
          statusText: 'Thành công',
          note: 'Nạp qua VietQR Sacombank (STK: 100071864927)'
        },
        {
          id: 'TX-892102',
          type: 'payment',
          typeName: 'Thanh toán đơn hàng SV-98421',
          amount: -499000,
          amountFormatted: '-499.000đ',
          balanceAfter: 1000,
          date: '28/10/2026 14:20',
          status: 'completed',
          statusText: 'Thành công',
          note: 'Mua ChatGPT Plus 1 Tháng (Chính chủ)'
        },
        {
          id: 'TX-892103',
          type: 'deposit',
          typeName: 'Nạp tiền VietQR Sacombank',
          amount: 249000,
          amountFormatted: '+249.000đ',
          balanceAfter: 250000,
          date: '29/10/2026 09:30',
          status: 'completed',
          statusText: 'Thành công',
          note: 'Nạp qua VietQR Sacombank (STK: 100071864927)'
        }
      ];

      try {
        localStorage.setItem(key, JSON.stringify(defaultTx));
      } catch (e) {}

      return defaultTx;
    }

    return [];
  }

  /**
   * Lưu biến động số dư mới vào ví
   */
  function addWalletTransaction(userEmail, txData) {
    const key = 'shopviet247_wallet_tx_' + (userEmail || 'default');
    let list = getWalletTransactions(userEmail);
    list.unshift(txData);
    try {
      localStorage.setItem(key, JSON.stringify(list));
    } catch (e) {}
    return list;
  }

  /**
   * Quản lý Giftcodes đã sử dụng của User
   */
  function getUsedGiftcodes(userEmail) {
    const key = 'shopviet247_used_giftcodes_' + (userEmail || 'default');
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function addUsedGiftcode(userEmail, code, amount) {
    const key = 'shopviet247_used_giftcodes_' + (userEmail || 'default');
    let list = getUsedGiftcodes(userEmail);
    list.push({
      code: code,
      amount: amount,
      usedAt: new Date().toLocaleString('vi-VN')
    });
    try {
      localStorage.setItem(key, JSON.stringify(list));
    } catch (e) {}
  }

  /**
   * Tạo Fallback SVG mã QR Sacombank Napas 24/7
   */
  function getFallbackQrSvg(amount, memo) {
    return `
      <svg class="w-48 h-48 mx-auto" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" rx="16" fill="white"/>
        <!-- Corner Finder Patterns -->
        <rect x="15" y="15" width="46" height="46" rx="8" fill="#004b91"/>
        <rect x="23" y="23" width="30" height="30" rx="4" fill="white"/>
        <rect x="29" y="29" width="18" height="18" rx="2" fill="#004b91"/>

        <rect x="139" y="15" width="46" height="46" rx="8" fill="#004b91"/>
        <rect x="147" y="23" width="30" height="30" rx="4" fill="white"/>
        <rect x="153" y="29" width="18" height="18" rx="2" fill="#004b91"/>

        <rect x="15" y="139" width="46" height="46" rx="8" fill="#004b91"/>
        <rect x="23" y="147" width="30" height="30" rx="4" fill="white"/>
        <rect x="29" y="153" width="18" height="18" rx="2" fill="#004b91"/>

        <!-- QR Data Blocks -->
        <rect x="75" y="20" width="12" height="12" rx="2" fill="#1e293b"/>
        <rect x="95" y="20" width="12" height="12" rx="2" fill="#1e293b"/>
        <rect x="115" y="20" width="12" height="12" rx="2" fill="#1e293b"/>
        <rect x="75" y="40" width="20" height="10" rx="2" fill="#1e293b"/>
        <rect x="105" y="40" width="15" height="10" rx="2" fill="#1e293b"/>
        
        <rect x="20" y="75" width="15" height="12" rx="2" fill="#1e293b"/>
        <rect x="45" y="75" width="12" height="20" rx="2" fill="#1e293b"/>
        <rect x="145" y="75" width="18" height="12" rx="2" fill="#1e293b"/>
        <rect x="170" y="75" width="12" height="20" rx="2" fill="#1e293b"/>

        <rect x="75" y="145" width="20" height="12" rx="2" fill="#1e293b"/>
        <rect x="105" y="145" width="15" height="12" rx="2" fill="#1e293b"/>
        <rect x="135" y="145" width="25" height="12" rx="2" fill="#1e293b"/>
        <rect x="170" y="145" width="12" height="12" rx="2" fill="#1e293b"/>
        <rect x="75" y="165" width="35" height="15" rx="2" fill="#1e293b"/>
        <rect x="120" y="165" width="25" height="15" rx="2" fill="#1e293b"/>
        <rect x="155" y="165" width="25" height="15" rx="2" fill="#1e293b"/>

        <!-- Sacombank Napas Badge in Center -->
        <rect x="62" y="78" width="76" height="44" rx="8" fill="#004b91" stroke="white" stroke-width="2"/>
        <text x="100" y="96" font-family="system-ui, sans-serif" font-size="9" font-weight="900" fill="white" text-anchor="middle" letter-spacing="0.5">SACOMBANK</text>
        <text x="100" y="112" font-family="system-ui, sans-serif" font-size="8" font-weight="700" fill="#f59e0b" text-anchor="middle">VIETQR 24/7</text>
      </svg>
    `;
  }

  const dashboardView = {
    /**
     * Render HTML giao diện Dashboard 2 cột hoàn chỉnh
     */
    render: function (params) {
      if (params && params.tab) {
        activeTab = params.tab === 'wallet' ? 'orders' : params.tab;
      } else if (activeTab === 'wallet') {
        activeTab = 'orders';
      }

      const user = getCurrentUser();
      const userOrders = getUserOrders(user);
      const orderCount = userOrders.length;
      const userBalanceFormatted = (user.balance || 0).toLocaleString('vi-VN') + 'đ';

      return `
        <div class="py-4 sm:py-6 animate-fade-in font-sans">
          
          <!-- Bố cục Màn hình Dashboard 2 cột: Sidebar (3-4 cols) & Nội dung (8-9 cols) -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            <!-- ================= a. SIDEBAR BÊN TRÁI ================= -->
            <aside class="lg:col-span-4 xl:col-span-3 space-y-4">
              
              <!-- Card Thông tin Tài khoản -->
              <div class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
                
                <!-- Avatar tròn chữ cái đầu hoặc ảnh đại diện -->
                <div id="sidebarUserAvatar" class="w-14 h-14 rounded-full bg-gradient-to-tr from-slate-900 to-indigo-800 text-white font-black flex items-center justify-center text-xl shadow-md select-none border-2 border-white dark:border-slate-800">
                  ${(user.avatar && user.avatar.length <= 2) ? user.avatar.toUpperCase() : ((user.name || 'C').trim().charAt(0).toUpperCase())}
                </div>
                
                <!-- Tên người dùng & Email -->
                <h2 id="sidebarUserName" class="text-base font-bold text-slate-900 dark:text-white mt-2.5 truncate max-w-[200px]">
                  ${user.name || 'Minh Cường'}
                </h2>
                <p id="sidebarUserEmail" class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 break-all">
                  ${user.email || 'minhcuong.dev@gmail.com'}
                </p>

                <!-- Badge tài khoản VIP -->
                <div class="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 shadow-xs">
                  <svg class="w-3.5 h-3.5 text-amber-500 fill-amber-400" viewBox="0 0 24 24">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  <span>${user.role || 'Thành viên VIP'}</span>
                </div>
              </div>

              <!-- Danh sách menu 7 tab tương tác -->
              <nav class="bg-white dark:bg-slate-900 rounded-2xl p-2.5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1 text-sm font-medium">
                
                <!-- 1. "Tổng quan" -->
                <button type="button" data-tab="overview" id="tabBtn-overview" class="dashboard-tab-btn w-full ${activeTab === 'overview' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'} rounded-xl px-4 py-2.5 flex items-center justify-between transition-all text-left cursor-pointer">
                  <div class="flex items-center gap-3">
                    <svg class="w-4 h-4 shrink-0 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <rect width="7" height="9" x="3" y="3" rx="1" />
                      <rect width="7" height="5" x="14" y="3" rx="1" />
                      <rect width="7" height="9" x="14" y="12" rx="1" />
                      <rect width="7" height="5" x="3" y="16" rx="1" />
                    </svg>
                    <span>Tổng quan</span>
                  </div>
                </button>

                <!-- 2. "Đơn hàng" -->
                <button type="button" data-tab="orders" id="tabBtn-orders" class="dashboard-tab-btn w-full ${activeTab === 'orders' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'} rounded-xl px-4 py-2.5 flex items-center justify-between transition-all text-left cursor-pointer">
                  <div class="flex items-center gap-3">
                    <svg class="w-4 h-4 shrink-0 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                      <path d="M3 6h18" />
                      <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                    <span>Đơn hàng</span>
                  </div>
                  <span id="sidebarOrderBadge" class="bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 text-xs px-2 py-0.5 rounded-full font-bold">
                    ${orderCount}
                  </span>
                </button>

                <!-- 3. "Thẻ quà tặng" -->
                <button type="button" data-tab="giftcards" id="tabBtn-giftcards" class="dashboard-tab-btn w-full ${activeTab === 'giftcards' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'} rounded-xl px-4 py-2.5 flex items-center justify-between transition-all text-left cursor-pointer">
                  <div class="flex items-center gap-3">
                    <svg class="w-4 h-4 shrink-0 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <rect x="3" y="8" width="18" height="14" rx="2" />
                      <path d="M12 8v14" />
                      <path d="M19 12H5" />
                      <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
                    </svg>
                    <span>Thẻ quà tặng</span>
                  </div>
                </button>

                <!-- 6. "Bảo mật & Mật khẩu" -->
                <button type="button" data-tab="security" id="tabBtn-security" class="dashboard-tab-btn w-full ${activeTab === 'security' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'} rounded-xl px-4 py-2.5 flex items-center justify-between transition-all text-left cursor-pointer">
                  <div class="flex items-center gap-3">
                    <svg class="w-4 h-4 shrink-0 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <span>Bảo mật & Mật khẩu</span>
                  </div>
                </button>

                <!-- 7. "Hồ sơ cá nhân" -->
                <button type="button" data-tab="profile" id="tabBtn-profile" class="dashboard-tab-btn w-full ${activeTab === 'profile' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'} rounded-xl px-4 py-2.5 flex items-center justify-between transition-all text-left cursor-pointer">
                  <div class="flex items-center gap-3">
                    <svg class="w-4 h-4 shrink-0 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    <span>Hồ sơ cá nhân</span>
                  </div>
                </button>

                <!-- "Đăng xuất" an toàn -->
                <div class="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button type="button" id="logoutBtn" class="w-full text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl px-4 py-2.5 flex items-center gap-3 transition-colors text-left cursor-pointer font-semibold">
                    <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" x2="9" y1="12" y2="12" />
                    </svg>
                    <span>Đăng xuất</span>
                  </button>
                </div>

              </nav>

            </aside>

            <!-- ================= b. KHU VỰC NỘI DUNG CHÍNH (8-9 COLS) ================= -->
            <main id="dashboardMainArea" class="lg:col-span-8 xl:col-span-9 space-y-6">
              ${dashboardView.renderTabContent(activeTab, user, userOrders)}
            </main>

          </div>

          <!-- ================= MODAL XEM CHI TIẾT ĐƠN HÀNG & LICENSE KEY ================= -->
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

                <!-- Khối thông báo khi đơn đang chờ duyệt giao dịch -->
                <div id="modalOrderWaitingNotice" class="hidden p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-medium space-y-1">
                  <div class="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                    <svg class="w-4 h-4 animate-spin text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-linecap="round"></circle>
                      <polyline points="12 6 12 12 14 14"></polyline>
                    </svg>
                    <span>Đang chờ Admin phê duyệt giao dịch</span>
                  </div>
                  <p class="text-[11px] leading-relaxed text-amber-700 dark:text-amber-300/90 pl-6">
                    Đơn hàng của bạn đang được Ban quản trị đối soát giao dịch Sacombank và chuẩn bị bàn giao đường link bản quyền riêng. Vui lòng quay lại sau ít phút!
                  </p>
                </div>

                <!-- Tài khoản / Email -->
                <div>
                  <span class="text-[11px] text-slate-500 block font-medium">Tài khoản / Email bàn giao:</span>
                  <div class="flex items-center justify-between gap-2 mt-1">
                    <code id="modalOrderAccount" class="text-xs font-mono font-bold text-slate-900 dark:text-white select-all bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 flex-1 truncate">
                      cuong.account@chatgpt.vip
                    </code>
                    <button type="button" id="copyAccountBtn" class="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-xs font-semibold shrink-0 cursor-pointer transition-colors">
                      Sao chép
                    </button>
                  </div>
                </div>

                <!-- Password / Key / Đường link -->
                <div>
                  <span class="text-[11px] text-slate-500 block font-medium">Đường link / Key kích hoạt bàn giao riêng:</span>
                  <div class="flex items-center justify-between gap-2 mt-1">
                    <code id="modalOrderKey" class="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 select-all bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 flex-1 truncate">
                      p***_OpenAI_SecuredKey_8942
                    </code>
                    <a id="openOrderLinkBtn" href="#" target="_blank" rel="noopener noreferrer" class="hidden px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0 transition shadow-sm items-center gap-1 inline-flex">
                      <span>Mở link ↗</span>
                    </a>
                    <button type="button" id="copyKeyBtn" class="px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 text-xs font-semibold shrink-0 cursor-pointer shadow-sm transition-colors">
                      Sao chép Key
                    </button>
                  </div>
                </div>
              </div>

              <!-- Hướng dẫn sử dụng 1 đổi 1 -->
              <div class="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 pt-1">
                <div class="font-bold text-slate-800 dark:text-slate-200">Hướng dẫn sử dụng & Bảo hành:</div>
                <div id="modalOrderGuide" class="bg-amber-50/70 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200/60 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 text-xs whitespace-pre-line leading-relaxed">
                  Đăng nhập chính thức tại trang chủ dịch vụ. Sản phẩm được bảo hành 1 đổi 1 trong suốt thời gian kích hoạt.
                </div>
              </div>

              <!-- Nút hỗ trợ & Đóng -->
              <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" id="closeDetailModalBtn2" class="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                  Đóng
                </button>
                <button type="button" onclick="ShopVietState.showToast('CSKH Zalo / Hotline 0987.654.321 sẵn sàng hỗ trợ 24/7', 'info')" class="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500 text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                  <span>Hỗ trợ kỹ thuật 24/7</span>
                </button>
              </div>

            </div>
          </div>

          <!-- ================= MODAL NẠP TIỀN VIETQR SACOMBANK ================= -->
          <div id="vietQrModal" class="hidden fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-slide-up relative">
              
              <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Nạp tiền VietQR Sacombank</span>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">Tự động 5s</span>
                  </h3>
                  <p class="text-xs text-slate-500 mt-0.5">Quét mã bằng app Sacombank hoặc bất kỳ ứng dụng ngân hàng nào</p>
                </div>
                <button type="button" id="closeVietQrModalBtn" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <!-- VietQR Sacombank Visual Box -->
              <div class="flex flex-col items-center bg-gradient-to-b from-blue-50/50 to-white dark:from-slate-800/80 dark:to-slate-900 p-4 rounded-2xl border border-blue-100 dark:border-slate-700 text-center">
                
                <div id="sacombankQrContainer" class="p-2.5 bg-white rounded-xl shadow-md border border-slate-200/80 mb-3">
                  <img id="sacombankQrImg" src="https://api.vietqr.io/image/970403-100071864927-compact2.jpg?amount=${selectedDepositAmount}&addInfo=NAP%20${encodeURIComponent(user.name ? user.name.replace(/\s+/g, '') : 'MC2026')}&accountName=LE%20BUI%20MINH%20CUONG" alt="VietQR Sacombank" class="w-44 h-44 object-contain rounded-lg" onerror="this.outerHTML=ShopVietViews.dashboard.getQrFallbackHtml()">
                </div>

                <!-- Bảng thông tin thanh toán Sacombank -->
                <div class="w-full space-y-2 text-xs text-left bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700">
                  <div class="flex justify-between items-center">
                    <span class="text-slate-400">Ngân hàng:</span>
                    <strong class="text-slate-900 dark:text-white font-semibold">Sacombank (BIN: 970403)</strong>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-slate-400">Số tài khoản:</span>
                    <div class="flex items-center gap-1.5">
                      <strong class="font-mono text-slate-900 dark:text-white font-bold text-sm">100071864927</strong>
                      <button type="button" onclick="navigator.clipboard.writeText('100071864927'); ShopVietState.showToast('Đã sao chép STK Sacombank: 100071864927', 'success')" class="text-indigo-600 dark:text-indigo-400 text-[11px] hover:underline font-bold">Copy</button>
                    </div>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-slate-400">Chủ tài khoản:</span>
                    <strong class="text-slate-900 dark:text-white font-bold">LE BUI MINH CUONG</strong>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-slate-400">Nội dung CK:</span>
                    <div class="flex items-center gap-1.5">
                      <strong id="depositMemoText" class="font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-slate-900 px-2 py-0.5 rounded font-bold">NAP ${user.name ? user.name.replace(/\s+/g, '').toUpperCase() : 'CUONG2026'}</strong>
                      <button type="button" onclick="ShopVietViews.dashboard.copyDepositMemo()" class="text-indigo-600 dark:text-indigo-400 text-[11px] hover:underline font-bold">Copy</button>
                    </div>
                  </div>
                </div>

              </div>

              <!-- Các nút nạp nhanh 50k, 100k, 200k, 500k -->
              <div class="space-y-1.5">
                <span class="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Chọn nhanh số tiền nạp:</span>
                <div class="grid grid-cols-4 gap-2">
                  <button type="button" data-amount="50000" class="deposit-amount-btn py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-all">50.000đ</button>
                  <button type="button" data-amount="100000" class="deposit-amount-btn py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-all">100.000đ</button>
                  <button type="button" data-amount="200000" class="deposit-amount-btn py-2 text-xs font-bold rounded-xl border-2 border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 transition-all">200.000đ</button>
                  <button type="button" data-amount="500000" class="deposit-amount-btn py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-all">500.000đ</button>
                </div>
              </div>

              <!-- Nút xác nhận nạp tiền tự động -->
              <div class="pt-2">
                <button type="button" id="confirmDepositBtn" class="w-full py-3 rounded-xl bg-slate-900 text-white dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 font-bold text-sm shadow-md transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2">
                  <svg class="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Tôi đã chuyển khoản thành công</span>
                </button>
              </div>

            </div>
          </div>

        </div>
      `;
    },

    /**
     * Render Nội dung tương ứng cho từng Tab
     */
    renderTabContent: function (tabKey, user, orders) {
      user = user || getCurrentUser();
      orders = orders || getUserOrders(user);

      switch (tabKey) {
        case 'wallet':
        case 'orders':
          return this.renderOrdersTab(user, orders);
        case 'referral':
          return this.renderReferralTab(user);
        case 'giftcards':
          return this.renderGiftcardsTab(user);
        case 'security':
          return this.renderSecurityTab(user);
        case 'profile':
          return this.renderProfileTab(user);
        case 'overview':
        default:
          return this.renderOverviewTab(user, orders);
      }
    },

    // ==========================================
    // TAB 1: TỔNG QUAN (OVERVIEW)
    // ==========================================
    renderOverviewTab: function (user, orders) {
      const orderCount = orders.length;
      const pendingCount = orders.filter(o => o.status === 'pending').length;
      const recentOrders = orders.slice(0, 5);

      return `
        <!-- Header: Tiêu đề lớn & nút thao tác nhanh -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
              Tổng quan tài khoản
            </h1>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Chào mừng trở lại, <span class="font-semibold text-slate-700 dark:text-slate-200">${user.name || 'Minh Cường'}</span>! Quản lý đơn hàng và mã kích hoạt tự động.
            </p>
          </div>

          <!-- Nút thao tác nhanh: "Mua tiếp" -->
          <div class="flex items-center gap-2.5 shrink-0">
            <button type="button" id="overviewBuyMoreBtn" class="bg-slate-900 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 flex items-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span>Mua tiếp</span>
            </button>
          </div>
        </div>

        <!-- 3 Stats Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <!-- Thẻ 1: Trạng thái tài khoản -->
          <div class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-300 dark:hover:border-emerald-700 transition-all">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Trạng thái tài khoản
              </span>
              <div class="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="m9 12 2 2 4-4"/>
                </svg>
              </div>
            </div>
            <div class="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
              <span>Thành viên chính thức</span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1">
              <span>Đã kích hoạt bảo mật & bảo hành 1 đổi 1</span>
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
              Đơn hàng của tài khoản ${user.email || ''}
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
              ${pendingCount}
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              ${pendingCount > 0 ? 'Vui lòng hoàn tất trước khi hết hạn' : 'Không có đơn nào chờ thanh toán'}
            </p>
          </div>

        </div>

        <!-- Bảng Đơn hàng gần đây -->
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          
          <div class="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Lịch sử đơn hàng gần nhất</span>
              <span class="text-xs font-normal text-slate-400">(${recentOrders.length} đơn)</span>
            </h3>
            <button type="button" id="overviewViewAllOrdersLink" class="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 cursor-pointer">
              <span>Xem tất cả đơn hàng</span>
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

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
                ${recentOrders.length === 0 ? `
                  <tr>
                    <td colspan="6" class="py-12 text-center text-slate-400">
                      <div class="flex flex-col items-center justify-center space-y-2">
                        <svg class="w-8 h-8 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                          <path d="M3 6h18" />
                          <path d="M16 10a4 4 0 0 1-8 0" />
                        </svg>
                        <p class="text-xs font-semibold text-slate-600 dark:text-slate-400">Tài khoản này chưa có đơn hàng nào</p>
                        <button onclick="window.ShopVietState.navigate('home', { scrollTo: '#productsSection' })" class="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                          Khám phá sản phẩm ngay →
                        </button>
                      </div>
                    </td>
                  </tr>
                ` : recentOrders.map(function (order) {
                  return `
                    <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td class="py-3.5 px-4 sm:px-5 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        ${order.id}
                      </td>
                      <td class="py-3.5 px-4 max-w-[240px]">
                        <div class="font-semibold text-slate-900 dark:text-white truncate" title="${order.productName}">
                          ${order.productName}
                        </div>
                        <div class="text-[11px] text-slate-400 truncate">
                          ${order.deliveryInfo && order.deliveryInfo.account ? 'Bàn giao: ' + order.deliveryInfo.account : 'Kích hoạt tự động'}
                        </div>
                      </td>
                      <td class="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        ${order.date}
                      </td>
                      <td class="py-3.5 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        ${order.totalFormatted}
                      </td>
                      <td class="py-3.5 px-4 whitespace-nowrap">
                        ${order.status === 'pending_review' ? `
                          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 animate-pulse">⏳ Chờ duyệt</span>
                        ` : order.status === 'pending' ? `
                          <span class="bg-amber-50 text-amber-600 border border-amber-200/60 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/60 text-xs px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1">
                            <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            <span>Chờ thanh toán</span>
                          </span>
                        ` : `
                          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300">✓ Hoàn tất</span>
                        `}
                      </td>
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
      `;
    },

    // ==========================================
    // TAB 2: ĐƠN HÀNG (ORDERS)
    // ==========================================
    renderOrdersTab: function (user, orders) {
      let filteredOrders = orders;
      if (currentOrderFilter === 'completed') {
        filteredOrders = filteredOrders.filter(o => o.status === 'completed');
      } else if (currentOrderFilter === 'pending') {
        filteredOrders = filteredOrders.filter(o => o.status === 'pending' || o.status === 'pending_review');
      }

      if (orderSearchQuery.trim()) {
        const q = orderSearchQuery.toLowerCase().trim();
        filteredOrders = filteredOrders.filter(o => 
          o.id.toLowerCase().includes(q) || 
          o.productName.toLowerCase().includes(q) ||
          (o.deliveryInfo && o.deliveryInfo.account && o.deliveryInfo.account.toLowerCase().includes(q))
        );
      }

      const totalCount = orders.length;
      const completedCount = orders.filter(o => o.status === 'completed').length;
      const pendingCount = orders.filter(o => o.status === 'pending' || o.status === 'pending_review').length;

      return `
        <!-- Header Quản lý đơn hàng -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
              Quản lý Đơn hàng
            </h1>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Xem toàn bộ các đơn hàng đã đặt, nhận License key bản quyền và bảo hành 1 đổi 1.
            </p>
          </div>

          <button type="button" onclick="window.ShopVietState.navigate('home', { scrollTo: '#productsSection' })" class="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer self-start sm:self-auto">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>Đặt mua thêm</span>
          </button>
        </div>

        <!-- Thanh công cụ: Bộ lọc trạng thái & Ô Tìm kiếm -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <!-- Bộ lọc 3 trạng thái -->
          <div class="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
            <button type="button" data-order-filter="all" class="order-filter-btn px-3 py-1.5 rounded-lg transition-all ${currentOrderFilter === 'all' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}">
              Tất cả (${totalCount})
            </button>
            <button type="button" data-order-filter="completed" class="order-filter-btn px-3 py-1.5 rounded-lg transition-all ${currentOrderFilter === 'completed' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}">
              Hoàn tất (${completedCount})
            </button>
            <button type="button" data-order-filter="pending" class="order-filter-btn px-3 py-1.5 rounded-lg transition-all ${currentOrderFilter === 'pending' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}">
              Chờ thanh toán (${pendingCount})
            </button>
          </div>

          <!-- Ô tìm kiếm đơn hàng -->
          <div class="relative w-full sm:w-64">
            <input type="text" id="orderSearchInput" value="${orderSearchQuery}" placeholder="Tìm mã đơn, tên sản phẩm..." class="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <svg class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

        </div>

        <!-- Bảng danh sách đơn hàng chi tiết -->
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm text-left">
              <thead class="bg-slate-50/80 dark:bg-slate-800/60 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th scope="col" class="py-3 px-4 sm:px-5">MÃ ĐƠN HÀNG</th>
                  <th scope="col" class="py-3 px-4">SẢN PHẨM & TÀI KHOẢN</th>
                  <th scope="col" class="py-3 px-4">NGÀY ĐẶT</th>
                  <th scope="col" class="py-3 px-4">TỔNG TIỀN</th>
                  <th scope="col" class="py-3 px-4">TRẠNG THÁI</th>
                  <th scope="col" class="py-3 px-4 sm:px-5 text-right">THAO TÁC</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                ${filteredOrders.length === 0 ? `
                  <tr>
                    <td colspan="6" class="py-12 text-center text-slate-400">
                      <div class="flex flex-col items-center justify-center space-y-2">
                        <svg class="w-8 h-8 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                          <path d="M3 6h18" />
                          <path d="M16 10a4 4 0 0 1-8 0" />
                        </svg>
                        <p class="text-sm">Không tìm thấy đơn hàng nào phù hợp!</p>
                      </div>
                    </td>
                  </tr>
                ` : filteredOrders.map(function (order) {
                  return `
                    <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td class="py-3.5 px-4 sm:px-5 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        ${order.id}
                      </td>
                      <td class="py-3.5 px-4 max-w-[280px]">
                        <div class="font-semibold text-slate-900 dark:text-white truncate" title="${order.productName}">
                          ${order.productName}
                        </div>
                        <div class="text-[11px] text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                          <span class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>${order.deliveryInfo && order.deliveryInfo.account ? order.deliveryInfo.account : order.userEmail}</span>
                        </div>
                      </td>
                      <td class="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        ${order.date}
                      </td>
                      <td class="py-3.5 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        ${order.totalFormatted}
                      </td>
                      <td class="py-3.5 px-4 whitespace-nowrap">
                        ${order.status === 'pending_review' ? `
                          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 animate-pulse">⏳ Chờ duyệt</span>
                        ` : order.status === 'pending' ? `
                          <span class="bg-amber-50 text-amber-600 border border-amber-200/60 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/60 text-xs px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1">
                            <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            <span>Chờ thanh toán</span>
                          </span>
                        ` : `
                          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300">✓ Hoàn tất</span>
                        `}
                      </td>
                      <td class="py-3.5 px-4 sm:px-5 text-right whitespace-nowrap">
                        <button type="button" data-order-id="${order.id}" class="view-order-detail-btn inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-500 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs">
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
      `;
    },

    // ==========================================
    // TAB 3: VÍ CỦA TÔI (ĐÃ CHUYỂN HƯỚNG HOÀN TOÀN SANG ĐƠN HÀNG)
    // ==========================================
    renderWalletTab: function (user, orders) {
      orders = orders || getUserOrders(user);
      return this.renderOrdersTab(user, orders);
    },

    // ==========================================
    // TAB 4: GIỚI THIỆU BẠN BÈ (REFERRAL)
    // ==========================================
    renderReferralTab: function (user) {
      const referralLink = `https://cuongcuca111-web.github.io/shopviet247-clone/?ref=MC2026`;

      return `
        <!-- Header Giới thiệu bạn bè -->
        <div class="pb-3 border-b border-slate-200/80 dark:border-slate-800">
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
            Giới thiệu bạn bè
          </h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Chia sẻ liên kết của bạn để cùng nhận voucher ưu đãi và hoa hồng vĩnh viễn trên mọi đơn hàng.
          </p>
        </div>

        <!-- Khung link giới thiệu chuyên nghiệp -->
        <div class="bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/80 dark:from-slate-800/80 dark:via-slate-900 dark:to-slate-800/80 p-6 rounded-2xl border border-indigo-200/80 dark:border-slate-700 shadow-sm space-y-4">
          <div class="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-sm">
            <svg class="w-5 h-5 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span>Đường link giới thiệu độc quyền của bạn</span>
          </div>

          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div class="relative flex-1">
              <input type="text" id="referralLinkInput" readonly value="${referralLink}" class="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs sm:text-sm text-slate-900 dark:text-white font-semibold select-all focus:outline-none">
            </div>
            <button type="button" id="copyReferralLinkBtn" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm px-5 py-3 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shrink-0">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
              </svg>
              <span>Sao chép link</span>
            </button>
          </div>

          <p class="text-xs text-slate-500 dark:text-slate-400">
            Mã giới thiệu của bạn: <strong class="font-mono text-indigo-600 dark:text-indigo-400 text-sm">MC2026</strong> • Nhận thưởng ngay khi người được giới thiệu thanh toán đơn hàng đầu tiên.
          </p>
        </div>

        <!-- 3 Thẻ Thống Kê Giới Thiệu -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Số lượt click</span>
            <div class="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">142</div>
            <p class="text-xs text-slate-400 mt-1">Lượt truy cập qua link của bạn</p>
          </div>

          <div class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Bạn bè đã đăng ký</span>
            <div class="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">3</div>
            <p class="text-xs text-slate-400 mt-1">Tài khoản đã tạo thành công</p>
          </div>

          <div class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Hoa hồng tích lũy</span>
            <div class="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2">150.000đ</div>
            <p class="text-xs text-slate-400 mt-1">Đã tích lũy vào tài khoản</p>
          </div>

        </div>

        <!-- Chính sách nhận thưởng 3 bước -->
        <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <h3 class="text-base font-bold text-slate-900 dark:text-white">
            Quy trình nhận thưởng 3 bước đơn giản:
          </h3>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed">
            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-1.5">
              <div class="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">1</div>
              <div class="font-bold text-slate-900 dark:text-white text-sm">Gửi liên kết mời</div>
              <p class="text-slate-500">Gửi đường link cá nhân cho bạn bè qua Zalo, Messenger, Telegram hoặc Facebook.</p>
            </div>

            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-1.5">
              <div class="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">2</div>
              <div class="font-bold text-slate-900 dark:text-white text-sm">Bạn bè đăng ký</div>
              <p class="text-slate-500">Bạn bè tạo tài khoản và nhận ngay gói quà chào mừng 100.000đ trên Shopviet247.</p>
            </div>

            <div class="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1.5">
              <div class="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-sm">3</div>
              <div class="font-bold text-emerald-800 dark:text-emerald-200 text-sm">Nhận ngay 50.000đ</div>
              <p class="text-emerald-700 dark:text-emerald-300">Nhận ngay voucher 50.000đ khi bạn bè hoàn tất đơn hàng đầu tiên.</p>
            </div>
          </div>
        </div>
      `;
    },

    // ==========================================
    // TAB 5: THẺ QUÀ TẶNG (GIFTCARDS)
    // ==========================================
    renderGiftcardsTab: function (user) {
      const usedGiftcodes = getUsedGiftcodes(user.email);

      return `
        <!-- Header Thẻ quà tặng -->
        <div class="pb-3 border-b border-slate-200/80 dark:border-slate-800">
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
            Thẻ quà tặng & Mã ưu đãi
          </h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Nhập mã Giftcode để nhận ưu đãi giảm giá hoặc kích hoạt gói quà tặng độc quyền.
          </p>
        </div>

        <!-- Form Đổi Thẻ Quà Tặng -->
        <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="8" width="18" height="14" rx="2" />
                <path d="M12 8v14" />
                <path d="M19 12H5" />
              </svg>
            </span>
            <h2 class="text-base font-bold text-slate-900 dark:text-white">Kích hoạt Thẻ quà tặng Giftcode</h2>
          </div>

          <form id="giftcardRedeemForm" class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div class="relative flex-1">
              <input type="text" id="giftcardCodeInput" placeholder="Nhập mã thẻ quà tặng (VD: SHOPVIET50K, VIPMEMBER...)" class="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-sm uppercase tracking-wider text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold">
            </div>
            <button type="submit" id="redeemGiftcardBtn" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shrink-0">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Đổi quà ngay</span>
            </button>
          </form>

          <p class="text-xs text-slate-500 dark:text-slate-400">
            Ưu đãi tương ứng sẽ được kích hoạt ngay lập tức cho tài khoản của bạn để thanh toán mọi tài khoản AI.
          </p>
        </div>



        <!-- Danh sách thẻ quà tặng đã kích hoạt -->
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 space-y-3">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white">Lịch sử thẻ quà tặng đã đổi:</h3>
          <div id="usedGiftcodesList" class="space-y-2">
            ${usedGiftcodes.length === 0 ? `
              <p class="text-xs text-slate-400 py-2">Bạn chưa kích hoạt mã quà tặng nào. Hãy nhập mã phía trên để nhận ngay ưu đãi!</p>
            ` : usedGiftcodes.map(function (g) {
              return `
                <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 text-xs">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <strong class="font-mono text-slate-900 dark:text-white font-bold">${g.code}</strong>
                    <span class="text-slate-400">(${g.usedAt})</span>
                  </div>
                  <span class="font-bold text-emerald-600 dark:text-emerald-400">+${(g.amount || 0).toLocaleString('vi-VN')}đ</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    },

    // ==========================================
    // TAB 6: BẢO MẬT & MẬT KHẨ (SECURITY)
    // ==========================================
    renderSecurityTab: function (user) {
      return `
        <!-- Header Bảo mật -->
        <div class="pb-3 border-b border-slate-200/80 dark:border-slate-800">
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
            Bảo mật & Mật khẩu
          </h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Quản lý và cập nhật mật khẩu tài khoản của bạn để đảm bảo an toàn tối đa.
          </p>
        </div>

        <!-- Form Đổi Mật Khẩu -->
        <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </span>
            <h2 class="text-base font-bold text-slate-900 dark:text-white">Thay đổi mật khẩu đăng nhập</h2>
          </div>

          <form id="changePasswordForm" class="space-y-4 max-w-lg">
            
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Mật khẩu hiện tại
              </label>
              <input type="password" id="currentPasswordInput" placeholder="Nhập mật khẩu hiện tại (Mặc định: 12345678)" required class="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Mật khẩu mới
              </label>
              <input type="password" id="newPasswordInput" placeholder="Tối thiểu 6 ký tự bảo mật" required class="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Xác nhận mật khẩu mới
              </label>
              <input type="password" id="confirmNewPasswordInput" placeholder="Nhập lại mật khẩu mới" required class="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>

            <button type="submit" id="updatePasswordBtn" class="bg-slate-900 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500 hover:bg-slate-800 text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer">
              Cập nhật mật khẩu
            </button>
          </form>
        </div>
      `;
    },

    // ==========================================
    // TAB 7: HỒ SƠ CÁ NHÂN (PROFILE)
    // ==========================================
    renderProfileTab: function (user) {
      const avatars = ['C', 'H', 'VIP', 'AI', 'PRO', 'DEV'];

      return `
        <!-- Header Hồ sơ cá nhân -->
        <div class="pb-3 border-b border-slate-200/80 dark:border-slate-800">
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
            Hồ sơ cá nhân
          </h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Cập nhật thông tin tài khoản, số điện thoại liên hệ và ảnh đại diện hiển thị trên toàn hệ thống.
          </p>
        </div>

        <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          
          <!-- Avatar Selector -->
          <div class="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div id="profileAvatarPreview" class="w-16 h-16 rounded-full bg-slate-900 text-white font-black text-2xl flex items-center justify-center shadow-md border-2 border-indigo-500">
              ${(user.avatar && user.avatar.length <= 3) ? user.avatar.toUpperCase() : ((user.name || 'C').trim().charAt(0).toUpperCase())}
            </div>
            
            <div class="space-y-2 text-center sm:text-left">
              <span class="text-xs font-bold text-slate-700 dark:text-slate-300 block uppercase tracking-wider">Chọn ảnh đại diện / Ký hiệu:</span>
              <div class="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                ${avatars.map(function (av) {
                  return `
                    <button type="button" data-avatar="${av}" class="profile-avatar-option w-8 h-8 rounded-full border ${user.avatar === av ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'} text-xs font-bold transition-all hover:scale-105 cursor-pointer">
                      ${av}
                    </button>
                  `;
                }).join('')}
              </div>
            </div>
          </div>

          <!-- Form Chỉnh sửa thông tin -->
          <form id="profileEditForm" class="space-y-4 max-w-lg">
            
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Họ và tên
              </label>
              <input type="text" id="profileNameInput" value="${user.name || 'Minh Cường'}" required class="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Địa chỉ Email (Cố định tài khoản)
              </label>
              <input type="email" id="profileEmailInput" readonly value="${user.email || 'minhcuong.dev@gmail.com'}" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-sm text-slate-500 dark:text-slate-400 font-mono focus:outline-none cursor-not-allowed">
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Số điện thoại liên hệ
              </label>
              <input type="tel" id="profilePhoneInput" value="${user.phone || '0987654321'}" class="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>

            <div class="pt-2">
              <button type="submit" id="saveProfileBtn" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Lưu thông tin hồ sơ</span>
              </button>
            </div>

          </form>

        </div>
      `;
    },

    /**
     * Khởi tạo các sự kiện tương tác sau khi mount view
     */
    afterRender: function () {
      const user = getCurrentUser();
      const userOrders = getUserOrders(user);

      // 1. Chuyển đổi qua lại giữa 7 Tab trên Sidebar
      const tabButtons = document.querySelectorAll('.dashboard-tab-btn');
      tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const tab = btn.getAttribute('data-tab');
          this.switchTab(tab);
        });
      });

      // 2. Nút Đăng xuất
      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          if (window.ShopVietState && typeof window.ShopVietState.logout === 'function') {
            window.ShopVietState.logout();
          } else if (window.ShopVietState) {
            if (window.ShopVietState.state && window.ShopVietState.state.user) {
              window.ShopVietState.state.user.isLoggedIn = false;
            }
            window.ShopVietState.save();
            window.ShopVietState.showToast('Bạn đã đăng xuất tài khoản an toàn!', 'info');
            window.ShopVietState.navigate('home');
          }
        });
      }

      // 3. Khởi tạo modal chi tiết và modal VietQR Sacombank
      this.bindModalEvents(user, userOrders);

      // 4. Khởi tạo sự kiện riêng cho từng Tab hiện tại
      this.bindTabEvents(activeTab, user, userOrders);
    },

    /**
     * Chuyển tab mượt mà không load lại trang
     */
    switchTab: function (tabKey) {
      if (tabKey === 'wallet') {
        tabKey = 'orders';
      }
      activeTab = tabKey;
      const user = getCurrentUser();
      const userOrders = getUserOrders(user);

      // Cập nhật class active trên các nút menu sidebar
      const tabButtons = document.querySelectorAll('.dashboard-tab-btn');
      tabButtons.forEach(btn => {
        const t = btn.getAttribute('data-tab');
        if (t === tabKey) {
          btn.className = 'dashboard-tab-btn w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-xs rounded-xl px-4 py-2.5 flex items-center justify-between transition-all text-left cursor-pointer';
        } else {
          btn.className = 'dashboard-tab-btn w-full text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white rounded-xl px-4 py-2.5 flex items-center justify-between transition-all text-left cursor-pointer';
        }
      });

      // Render nội dung tab vào main container
      const mainArea = document.getElementById('dashboardMainArea');
      if (mainArea) {
        mainArea.style.opacity = '0';
        mainArea.style.transform = 'translateY(6px)';
        mainArea.style.transition = 'opacity 0.2s ease, transform 0.2s ease';

        setTimeout(() => {
          mainArea.innerHTML = this.renderTabContent(tabKey, user, userOrders);
          mainArea.style.opacity = '1';
          mainArea.style.transform = 'translateY(0)';

          // Tái gắn sự kiện cho tab mới
          this.bindTabEvents(tabKey, user, userOrders);
          this.bindModalEvents(user, userOrders);
        }, 80);
      }
    },

    /**
     * Gắn sự kiện chi tiết theo từng tab
     */
    bindTabEvents: function (tabKey, user, userOrders) {
      if (tabKey === 'wallet') {
        tabKey = 'orders';
      }
      if (tabKey === 'overview') {
        this.bindOverviewEvents();
      } else if (tabKey === 'orders') {
        this.bindOrdersEvents(user, userOrders);
      } else if (tabKey === 'referral') {
        this.bindReferralEvents(user);
      } else if (tabKey === 'giftcards') {
        this.bindGiftcardsEvents(user);
      } else if (tabKey === 'security') {
        this.bindSecurityEvents(user);
      } else if (tabKey === 'profile') {
        this.bindProfileEvents(user);
      }
    },

    /**
     * Sự kiện cho Tab 1: Tổng quan
     */
    bindOverviewEvents: function () {
      const qrBtn = document.getElementById('overviewOpenQrBtn');
      const vietQrModal = document.getElementById('vietQrModal');
      if (qrBtn && vietQrModal) {
        qrBtn.addEventListener('click', () => {
          vietQrModal.classList.remove('hidden');
        });
      }

      const buyMoreBtn = document.getElementById('overviewBuyMoreBtn');
      if (buyMoreBtn) {
        buyMoreBtn.addEventListener('click', () => {
          window.ShopVietState.navigate('home', { scrollTo: '#productsSection' });
        });
      }

      const viewAllOrdersLink = document.getElementById('overviewViewAllOrdersLink');
      if (viewAllOrdersLink) {
        viewAllOrdersLink.addEventListener('click', () => {
          this.switchTab('orders');
        });
      }
    },

    /**
     * Sự kiện cho Tab 2: Đơn hàng
     */
    bindOrdersEvents: function (user, userOrders) {
      // 1. Bộ lọc trạng thái đơn hàng
      const filterBtns = document.querySelectorAll('.order-filter-btn');
      filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          currentOrderFilter = btn.getAttribute('data-order-filter');
          this.switchTab('orders');
        });
      });

      // 2. Ô tìm kiếm đơn hàng realtime
      const searchInput = document.getElementById('orderSearchInput');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          orderSearchQuery = e.target.value;
          const mainArea = document.getElementById('dashboardMainArea');
          if (mainArea) {
            mainArea.innerHTML = this.renderOrdersTab(user, userOrders);
            this.bindOrdersEvents(user, userOrders);
            this.bindModalEvents(user, userOrders);
          }
        });
      }
    },

    /**
     * Sự kiện cho Tab 3: Ví của tôi (Đã vô hiệu hóa)
     */
    bindWalletEvents: function (user) {
      // Đã vô hiệu hóa tính năng Ví
    },

    /**
     * Sự kiện cho Tab 4: Giới thiệu bạn bè
     */
    bindReferralEvents: function (user) {
      const copyBtn = document.getElementById('copyReferralLinkBtn');
      const linkInput = document.getElementById('referralLinkInput');
      if (copyBtn && linkInput) {
        copyBtn.addEventListener('click', () => {
          navigator.clipboard.writeText(linkInput.value.trim());
          window.ShopVietState.showToast('Đã sao chép link giới thiệu của bạn! Hãy gửi cho bạn bè để cùng nhận ưu đãi.', 'success');
        });
      }
    },

    /**
     * Sự kiện cho Tab 5: Thẻ quà tặng
     */
    bindGiftcardsEvents: function (user) {
      const form = document.getElementById('giftcardRedeemForm');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const input = document.getElementById('giftcardCodeInput');
          if (!input) return;
          const code = input.value.trim().toUpperCase();
          if (!code) {
            window.ShopVietState.showToast('Vui lòng nhập mã thẻ quà tặng!', 'warning');
            return;
          }

          this.handleRedeemGiftcode(code);
        });
      }
    },

    /**
     * Điền nhanh mã giftcode vào ô input và kích hoạt
     */
    fillGiftcode: function (code) {
      const input = document.getElementById('giftcardCodeInput');
      if (input) {
        input.value = code;
        this.handleRedeemGiftcode(code);
      }
    },

    /**
     * Xử lý Đổi mã Giftcode
     */
    handleRedeemGiftcode: function (code) {
      const user = getCurrentUser();
      const usedList = getUsedGiftcodes(user.email);

      // Kiểm tra xem đã dùng mã này chưa
      const isUsed = usedList.some(item => item.code === code);
      if (isUsed) {
        window.ShopVietState.showToast(`Bạn đã sử dụng mã thẻ quà tặng "${code}" này rồi!`, 'warning');
        return;
      }

      // Danh mục mã quà tặng hợp lệ
      const giftCatalog = {
        'SHOPVIET50K': 50000,
        'FREEAI2026': 20000,
        'VIPMEMBER': 100000
      };

      if (!giftCatalog[code]) {
        window.ShopVietState.showToast(`Mã thẻ "${code}" không hợp lệ hoặc đã hết lượt áp dụng!`, 'error');
        return;
      }

      const rewardAmount = giftCatalog[code];

      // 1. Cộng số dư vào user
      window.ShopVietState.state.user = window.ShopVietState.state.user || {};
      window.ShopVietState.state.user.balance = (window.ShopVietState.state.user.balance || 0) + rewardAmount;
      window.ShopVietState.save();

      // 2. Ghi nhận mã đã sử dụng
      addUsedGiftcode(user.email, code, rewardAmount);

      // 3. Ghi vào lịch sử ví
      addWalletTransaction(user.email, {
        id: 'TX-GIFT-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
        type: 'giftcard',
        typeName: `Đổi thẻ quà tặng ${code}`,
        amount: rewardAmount,
        amountFormatted: `+${rewardAmount.toLocaleString('vi-VN')}đ`,
        balanceAfter: window.ShopVietState.state.user.balance,
        date: new Date().toLocaleString('vi-VN'),
        status: 'completed',
        statusText: 'Thành công',
        note: `Kích hoạt thành công mã ưu đãi độc quyền ${code}`
      });

      // 4. Cập nhật số dư nếu có phần tử hiển thị
      const sidebarWalletBadge = document.getElementById('sidebarWalletBadge');
      if (sidebarWalletBadge && window.ShopVietState.state.user && window.ShopVietState.state.user.balance !== undefined) {
        sidebarWalletBadge.textContent = window.ShopVietState.state.user.balance.toLocaleString('vi-VN') + 'đ';
      }

      // 5. Hiển thị thông báo thành công
      window.ShopVietState.showToast(`🎉 Chúc mừng bạn! Đã kích hoạt mã ${code} thành công, nhận +${rewardAmount.toLocaleString('vi-VN')}đ ưu đãi!`, 'success');

      // Tái render tab giftcards
      this.switchTab('giftcards');
    },

    /**
     * Sự kiện cho Tab 6: Bảo mật & Mật khẩu
     */
    bindSecurityEvents: function (user) {
      // 1. Form đổi mật khẩu
      const form = document.getElementById('changePasswordForm');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const currentPass = document.getElementById('currentPasswordInput').value;
          const newPass = document.getElementById('newPasswordInput').value;
          const confirmPass = document.getElementById('confirmNewPasswordInput').value;

          if (newPass.length < 6) {
            window.ShopVietState.showToast('Mật khẩu mới phải có tối thiểu 6 ký tự!', 'warning');
            return;
          }

          if (newPass !== confirmPass) {
            window.ShopVietState.showToast('Mật khẩu xác nhận không khớp với mật khẩu mới!', 'error');
            return;
          }

          // Kiểm tra và cập nhật trong cloud users sync
          try {
            const CLOUD_USERS_KEY = 'shopviet247_cloud_users_sync';
            let users = [];
            const raw = localStorage.getItem(CLOUD_USERS_KEY);
            if (raw) users = JSON.parse(raw);
            const idx = users.findIndex(u => u.email === user.email);
            if (idx > -1) {
              users[idx].password = newPass;
            } else {
              users.push({ email: user.email, password: newPass, name: user.name });
            }
            localStorage.setItem(CLOUD_USERS_KEY, JSON.stringify(users));
          } catch (err) {}

          window.ShopVietState.showToast('Cập nhật mật khẩu tài khoản thành công! Hãy ghi nhớ mật khẩu mới.', 'success');
          form.reset();
        });
      }
    },

    /**
     * Sự kiện cho Tab 7: Hồ sơ cá nhân
     */
    bindProfileEvents: function (user) {
      // 1. Chọn avatar
      const avatarOptions = document.querySelectorAll('.profile-avatar-option');
      const avatarPreview = document.getElementById('profileAvatarPreview');

      avatarOptions.forEach(opt => {
        opt.addEventListener('click', () => {
          const chosen = opt.getAttribute('data-avatar');
          avatarOptions.forEach(o => {
            o.className = 'profile-avatar-option w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all hover:scale-105 cursor-pointer';
          });
          opt.className = 'profile-avatar-option w-8 h-8 rounded-full border-2 border-indigo-600 bg-indigo-600 text-white text-xs font-bold transition-all hover:scale-105 cursor-pointer';

          if (avatarPreview) {
            avatarPreview.textContent = chosen;
          }
          window.ShopVietState.state.user.avatar = chosen;
        });
      });

      // 2. Form cập nhật thông tin cá nhân
      const profileForm = document.getElementById('profileEditForm');
      if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const nameInput = document.getElementById('profileNameInput');
          const phoneInput = document.getElementById('profilePhoneInput');

          const newName = nameInput ? nameInput.value.trim() : user.name;
          const newPhone = phoneInput ? phoneInput.value.trim() : user.phone;

          if (!newName) {
            window.ShopVietState.showToast('Vui lòng nhập Họ và tên của bạn!', 'warning');
            return;
          }

          // Cập nhật State toàn cục
          window.ShopVietState.state.user = window.ShopVietState.state.user || {};
          window.ShopVietState.state.user.name = newName;
          window.ShopVietState.state.user.phone = newPhone;
          if (!window.ShopVietState.state.user.avatar) {
            window.ShopVietState.state.user.avatar = newName.charAt(0).toUpperCase();
          }

          window.ShopVietState.save();

          // Đồng bộ sang Cloud Firestore nếu có
          if (window.ShopVietFirebase && typeof window.ShopVietFirebase.syncUserToCloud === 'function') {
            window.ShopVietFirebase.syncUserToCloud(window.ShopVietState.state.user);
          }

          // Cập nhật giao diện Sidebar Dashboard
          const sidebarUserName = document.getElementById('sidebarUserName');
          const sidebarUserAvatar = document.getElementById('sidebarUserAvatar');
          if (sidebarUserName) sidebarUserName.textContent = newName;
          if (sidebarUserAvatar) sidebarUserAvatar.textContent = (window.ShopVietState.state.user.avatar || 'C').toUpperCase();

          // Cập nhật Header Profile UI ngay lập tức
          if (window.ShopVietApp && typeof window.ShopVietApp.updateHeaderAuthUI === 'function') {
            window.ShopVietApp.updateHeaderAuthUI();
          }
          window.ShopVietState.notify('user_login', window.ShopVietState.state.user);

          window.ShopVietState.showToast('Cập nhật hồ sơ cá nhân thành công!', 'success');
        });
      }
    },

    /**
     * Gắn sự kiện các Modal: License Key & VietQR Sacombank
     */
    bindModalEvents: function (user, userOrders) {
      // 1. Modal Xem chi tiết đơn hàng
      const detailBtns = document.querySelectorAll('.view-order-detail-btn');
      const orderDetailModal = document.getElementById('orderDetailModal');
      const closeDetailModalBtn = document.getElementById('closeDetailModalBtn');
      const closeDetailModalBtn2 = document.getElementById('closeDetailModalBtn2');

      detailBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const orderId = btn.getAttribute('data-order-id');
          const allOrders = (window.ShopVietState && window.ShopVietState.state && window.ShopVietState.state.orders) || [];
          const origOrder = allOrders.find(o => o.id === orderId);
          const found = (userOrders && userOrders.find(o => o.id === orderId)) || origOrder || (userOrders && userOrders[0]);

          if (found && orderDetailModal) {
            const modalOrderId = document.getElementById('modalOrderId');
            const modalOrderProduct = document.getElementById('modalOrderProduct');
            const modalOrderAccount = document.getElementById('modalOrderAccount');
            const modalOrderKey = document.getElementById('modalOrderKey');
            const modalOrderGuide = document.getElementById('modalOrderGuide');
            const modalOrderWaitingNotice = document.getElementById('modalOrderWaitingNotice');
            const openOrderLinkBtn = document.getElementById('openOrderLinkBtn');
            const copyKeyBtn = document.getElementById('copyKeyBtn');

            const delInfo = found.deliveryInfo || (origOrder && origOrder.deliveryInfo) || {
              account: (user && user.email) || 'minhcuong.dev@gmail.com',
              licenseKey: 'SV-LICENSE-KEY-VIP-2026',
              guide: 'Đăng nhập vào trang chủ và bắt đầu sử dụng. Bảo hành 1 đổi 1.'
            };

            if (modalOrderId) modalOrderId.textContent = found.id;
            if (modalOrderProduct) modalOrderProduct.textContent = found.productName;
            if (modalOrderAccount) modalOrderAccount.textContent = delInfo.account || (user && user.email) || 'minhcuong.dev@gmail.com';

            const deliveryLink = found.customDeliveryLink || (origOrder && origOrder.customDeliveryLink) || (found.deliveryInfo && found.deliveryInfo.licenseKey) || found.licenseKey || (delInfo && delInfo.licenseKey) || '';

            const currentStatus = found.status || (origOrder && origOrder.status);

            if (currentStatus === 'pending_review') {
              if (modalOrderWaitingNotice) modalOrderWaitingNotice.classList.remove('hidden');
              if (copyKeyBtn) copyKeyBtn.classList.add('hidden');
              if (openOrderLinkBtn) openOrderLinkBtn.classList.add('hidden');
              if (modalOrderKey) {
                modalOrderKey.textContent = 'Đang chờ Admin đối soát & bàn giao...';
              }
            } else {
              if (modalOrderWaitingNotice) modalOrderWaitingNotice.classList.add('hidden');
              if (copyKeyBtn) copyKeyBtn.classList.remove('hidden');
              if (modalOrderKey) {
                modalOrderKey.textContent = deliveryLink || 'Đang chờ Admin cấp link';
              }
              if (openOrderLinkBtn) {
                if (deliveryLink && (deliveryLink.startsWith('http://') || deliveryLink.startsWith('https://'))) {
                  openOrderLinkBtn.classList.remove('hidden');
                  openOrderLinkBtn.href = deliveryLink;
                } else {
                  openOrderLinkBtn.classList.add('hidden');
                }
              }
            }

            const adminMsg = found.adminMessage || (origOrder && origOrder.adminMessage) || (delInfo && delInfo.adminMessage);
            if (modalOrderGuide) {
              if (adminMsg) {
                modalOrderGuide.innerHTML = `
                  <div class="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-indigo-100 dark:border-indigo-900/40">
                    <div class="flex items-center gap-2 font-bold text-indigo-800 dark:text-indigo-300">
                      <div class="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-inner relative border border-indigo-200/50 dark:border-indigo-800/50">
                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                          <circle cx="9" cy="10" r="1" fill="currentColor"/>
                          <circle cx="12" cy="10" r="1" fill="currentColor"/>
                          <circle cx="15" cy="10" r="1" fill="currentColor"/>
                        </svg>
                        <span class="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                          <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                      </div>
                      <span class="text-xs tracking-tight">Lời nhắn từ Admin Minh Cường:</span>
                    </div>
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Chính chủ
                    </span>
                  </div>
                  <div class="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-indigo-100 dark:border-indigo-900/40 shadow-xs mb-2">
                    <p class="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium italic select-text">${adminMsg}</p>
                  </div>
                  <div class="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] pt-1.5 border-t border-amber-200/50 dark:border-amber-900/40">
                    <svg class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      <path d="m9 12 2 2 4-4"/>
                    </svg>
                    <span>Chính sách: Bảo hành 1 đổi 1 suốt thời gian sử dụng. Hỗ trợ kỹ thuật 24/7.</span>
                  </div>`;
              } else {
                modalOrderGuide.innerHTML = `
                  <div class="space-y-2">
                    <p class="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">${delInfo.guide || 'Sản phẩm được kích hoạt tự động. Bảo hành 1 đổi 1 trong suốt thời gian sử dụng.'}</p>
                    <div class="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] pt-1.5 border-t border-amber-200/50 dark:border-amber-900/40">
                      <svg class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        <path d="m9 12 2 2 4-4"/>
                      </svg>
                      <span>Chính sách: Bảo hành 1 đổi 1 suốt thời gian sử dụng. Hỗ trợ kỹ thuật 24/7.</span>
                    </div>
                  </div>`;
              }
            }

            orderDetailModal.classList.remove('hidden');
          }
        });
      });

      const closeDetail = () => {
        if (orderDetailModal) orderDetailModal.classList.add('hidden');
      };
      if (closeDetailModalBtn) closeDetailModalBtn.addEventListener('click', closeDetail);
      if (closeDetailModalBtn2) closeDetailModalBtn2.addEventListener('click', closeDetail);

      // Copy tài khoản & Copy Key trong modal
      const copyAccountBtn = document.getElementById('copyAccountBtn');
      if (copyAccountBtn) {
        copyAccountBtn.addEventListener('click', () => {
          const el = document.getElementById('modalOrderAccount');
          if (el) {
            navigator.clipboard.writeText(el.textContent.trim());
            window.ShopVietState.showToast('Đã sao chép Email tài khoản!', 'success');
          }
        });
      }

      const copyKeyBtn = document.getElementById('copyKeyBtn');
      if (copyKeyBtn) {
        copyKeyBtn.addEventListener('click', () => {
          const el = document.getElementById('modalOrderKey');
          if (el) {
            navigator.clipboard.writeText(el.textContent.trim());
            window.ShopVietState.showToast('Đã sao chép License Key thành công!', 'success');
          }
        });
      }

      // 2. Modal Nạp tiền VietQR Sacombank
      const vietQrModal = document.getElementById('vietQrModal');
      const closeVietQrModalBtn = document.getElementById('closeVietQrModalBtn');
      if (closeVietQrModalBtn && vietQrModal) {
        closeVietQrModalBtn.addEventListener('click', () => {
          vietQrModal.classList.add('hidden');
        });
      }

      // Nút chọn nhanh số tiền nạp
      const amountBtns = document.querySelectorAll('.deposit-amount-btn');
      amountBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const amt = parseInt(btn.getAttribute('data-amount'), 10);
          selectedDepositAmount = amt;

          amountBtns.forEach(b => {
            b.className = 'deposit-amount-btn py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-all';
          });
          btn.className = 'deposit-amount-btn py-2 text-xs font-bold rounded-xl border-2 border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 transition-all';

          // Cập nhật ảnh QR Sacombank
          this.updateSacombankQr(amt, user);
        });
      });

      // Nút xác nhận nạp tiền tự động
      const confirmDepositBtn = document.getElementById('confirmDepositBtn');
      if (confirmDepositBtn) {
        confirmDepositBtn.addEventListener('click', () => {
          this.handleQuickDeposit(selectedDepositAmount);
        });
      }
    },

    /**
     * Cập nhật ảnh VietQR Sacombank theo số tiền
     */
    updateSacombankQr: function (amount, user) {
      user = user || getCurrentUser();
      const memo = 'NAP ' + (user.name ? user.name.replace(/\s+/g, '').toUpperCase() : 'CUONG2026');
      const qrImg = document.getElementById('sacombankQrImg');
      if (qrImg) {
        const url = `https://api.vietqr.io/image/${SACOMBANK_CONFIG.bin}-${SACOMBANK_CONFIG.accountNumber}-compact2.jpg?amount=${amount}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(SACOMBANK_CONFIG.accountName)}`;
        qrImg.src = url;
      }
    },

    /**
     * Sao chép cú pháp nạp tiền
     */
    copyDepositMemo: function () {
      const el = document.getElementById('depositMemoText');
      if (el) {
        const text = el.textContent.trim();
        navigator.clipboard.writeText(text);
        window.ShopVietState.showToast(`Đã sao chép cú pháp chuyển khoản: ${text}`, 'success');
      }
    },

    /**
     * Trả về HTML Fallback khi ảnh QR api.vietqr.io lỗi
     */
    getQrFallbackHtml: function () {
      const user = getCurrentUser();
      const memo = 'NAP ' + (user.name ? user.name.replace(/\s+/g, '').toUpperCase() : 'CUONG2026');
      return getFallbackQrSvg(selectedDepositAmount, memo);
    },

    /**
     * Xử lý Nạp thành công số tiền vào ví
     */
    handleQuickDeposit: function (amount) {
      const user = getCurrentUser();
      amount = amount || 200000;

      // Cộng tiền vào State
      window.ShopVietState.state.user = window.ShopVietState.state.user || {};
      window.ShopVietState.state.user.balance = (window.ShopVietState.state.user.balance || 0) + amount;
      window.ShopVietState.save();

      // Thêm giao dịch vào lịch sử ví
      addWalletTransaction(user.email, {
        id: 'TX-DEP-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
        type: 'deposit',
        typeName: 'Nạp tiền VietQR Sacombank',
        amount: amount,
        amountFormatted: `+${amount.toLocaleString('vi-VN')}đ`,
        balanceAfter: window.ShopVietState.state.user.balance,
        date: new Date().toLocaleString('vi-VN'),
        status: 'completed',
        statusText: 'Thành công',
        note: `Nạp tự động qua VietQR Sacombank Napas 24/7 (STK: ${SACOMBANK_CONFIG.accountNumber})`
      });

      // Ẩn modal VietQR
      const vietQrModal = document.getElementById('vietQrModal');
      if (vietQrModal) vietQrModal.classList.add('hidden');

      // Cập nhật số dư nếu có phần tử hiển thị
      const sidebarWalletBadge = document.getElementById('sidebarWalletBadge');
      if (sidebarWalletBadge && window.ShopVietState.state.user && window.ShopVietState.state.user.balance !== undefined) {
        sidebarWalletBadge.textContent = window.ShopVietState.state.user.balance.toLocaleString('vi-VN') + 'đ';
      }

      window.ShopVietState.showToast(`Nạp thành công +${amount.toLocaleString('vi-VN')}đ qua Sacombank! Số dư: ${window.ShopVietState.state.user.balance.toLocaleString('vi-VN')}đ`, 'success');

      // Cập nhật tab nếu đang ở overview
      if (activeTab === 'overview') {
        this.switchTab('overview');
      }
    }
  };

  // Gắn vào window.ShopVietViews.dashboard
  window.ShopVietViews.dashboard = dashboardView;

})();
