/**
 * Shopviet247 - Data Repository
 * Chứa danh mục sản phẩm, danh sách sản phẩm hot, nhãn lọc và dữ liệu đơn hàng mẫu
 */

(function () {
  'use strict';

  // SVG Helper Icons for Product Brands
  const BRAND_ICONS = {
    cursor: `<svg class="w-8 h-8 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 3 7 18 3-7 7-3L3 3z"/><path d="m13 13 6 6"/></svg>`,
    gemini: `<svg class="w-8 h-8 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z"/></svg>`,
    chatgpt: `<svg class="w-8 h-8 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`,
    canva: `<svg class="w-8 h-8 text-cyan-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M8 12a4 4 0 1 0 8 0 4 4 0 1 0-8 0Z"/></svg>`,
    capcut: `<svg class="w-8 h-8 text-pink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 8 6 4-6 4Z"/></svg>`,
    api: `<svg class="w-8 h-8 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
    copilot: `<svg class="w-8 h-8 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="16" height="16" x="4" y="4" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`,
    server: `<svg class="w-8 h-8 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="8" x="2" y="2" rx="2"/><rect width="20" height="8" x="2" y="14" rx="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>`
  };

  window.ShopVietData = {
    // 6 Danh Mục Sản Phẩm Chính
    categories: [
      {
        id: 'cat_cursor',
        name: 'Cursor New',
        count: '8 sản phẩm',
        tag: 'Cursor New',
        badge: 'Dev Tool',
        icon: BRAND_ICONS.cursor,
        color: 'from-indigo-500/10 to-indigo-500/20 border-indigo-200 dark:border-indigo-900/50',
        textColor: 'text-indigo-600 dark:text-indigo-400',
        desc: 'Tài khoản Cursor Pro, Business & Key kích hoạt tự động theo tháng'
      },
      {
        id: 'cat_gemini',
        name: 'Gemini Pro & Antigravity',
        count: '12 sản phẩm',
        tag: 'Gemini - Antigravity - Veo',
        badge: 'Google AI',
        icon: BRAND_ICONS.gemini,
        color: 'from-blue-500/10 to-blue-500/20 border-blue-200 dark:border-blue-900/50',
        textColor: 'text-blue-600 dark:text-blue-400',
        desc: 'Gemini Advanced 2M Context, Antigravity 2.0 & Veo Video AI siêu tốc'
      },
      {
        id: 'cat_chatgpt',
        name: 'ChatGPT Plus',
        count: '15 sản phẩm',
        tag: 'Tất cả',
        badge: 'OpenAI',
        icon: BRAND_ICONS.chatgpt,
        color: 'from-emerald-500/10 to-emerald-500/20 border-emerald-200 dark:border-emerald-900/50',
        textColor: 'text-emerald-600 dark:text-emerald-400',
        desc: 'Tài khoản GPT-4o, O1 Pro, DALL-E 3 chính chủ riêng tư không giới hạn'
      },
      {
        id: 'cat_canva',
        name: 'Canva Pro',
        count: '6 sản phẩm',
        tag: 'Canva',
        badge: 'Design',
        icon: BRAND_ICONS.canva,
        color: 'from-cyan-500/10 to-cyan-500/20 border-cyan-200 dark:border-cyan-900/50',
        textColor: 'text-cyan-600 dark:text-cyan-400',
        desc: 'Bản quyền Canva Pro giáo viên & sinh viên vĩnh viễn, kích hoạt mail riêng'
      },
      {
        id: 'cat_capcut',
        name: 'Capcut Pro',
        count: '10 sản phẩm',
        tag: 'Capcut',
        badge: 'Video VIP',
        icon: BRAND_ICONS.capcut,
        color: 'from-pink-500/10 to-pink-500/20 border-pink-200 dark:border-pink-900/50',
        textColor: 'text-pink-600 dark:text-pink-400',
        desc: 'Capcut Pro PC và Mobile, mở khóa toàn bộ voice AI và hiệu ứng Pro'
      },
      {
        id: 'cat_api',
        name: 'API AI Coding',
        count: '9 sản phẩm',
        tag: 'API AI CODING',
        badge: 'API Token',
        icon: BRAND_ICONS.api,
        color: 'from-amber-500/10 to-amber-500/20 border-amber-200 dark:border-amber-900/50',
        textColor: 'text-amber-600 dark:text-amber-400',
        desc: 'Token Claude 3.5 Sonnet, GPT-4o, Gemini Flash kết nối Cursor, Cline'
      }
    ],

    // Nhãn lọc sản phẩm (Filter Tags)
    filterTags: [
      "Tất cả",
      "Cursor New",
      "Gemini - Antigravity - Veo",
      "API AI CODING",
      "Capcut",
      "Canva"
    ],

    // Danh sách 10 Sản Phẩm Hot
    products: [
      {
        id: 'prod-001',
        name: '[LINK] Antigravity + Gemini Pro 18 Tháng - Mail Phụ Kèm Quà Tặng',
        category: 'cat_gemini',
        tag: 'Gemini - Antigravity - Veo',
        price: 69000,
        oldPrice: 250000,
        discount: '-72%',
        stock: 111,
        status: 'in_stock', // 'in_stock' | 'low_stock' | 'out_of_stock'
        rating: 5.0,
        reviewsCount: 342,
        soldCount: 1420,
        badge: 'Bán chạy nhất',
        badgeColor: 'bg-emerald-500 text-white',
        autoDelivery: true,
        warranty: '18 tháng (1 đổi 1)',
        desc: 'Kích hoạt ngay bằng link mời Google One chính chủ. Sử dụng Gemini Advanced 1.5 Pro/Flash, tích hợp Antigravity 2.0 Agentic coding và tặng kèm 500 Credits Veo Video AI.',
        instructions: 'Sau khi thanh toán thành công, hệ thống gửi ngay Link kích hoạt vào màn hình và email. Click link để nhận tài khoản ngay lập tức!',
        iconType: 'gemini',
        features: [
          'Kích hoạt qua link mời chính chủ Google',
          'Tích hợp Antigravity 2.0 & Veo Video AI',
          'Bảo hành trọn vẹn 18 tháng',
          'Tự động gửi link sau 5 giây thanh toán'
        ]
      },
      {
        id: 'prod-002',
        name: 'Cursor Pro 1 Tháng Chính Chủ - Nâng Cấp Email Cá Nhân',
        category: 'cat_cursor',
        tag: 'Cursor New',
        price: 120000,
        oldPrice: 520000,
        discount: '-77%',
        stock: 45,
        status: 'in_stock',
        rating: 4.9,
        reviewsCount: 218,
        soldCount: 980,
        badge: 'Hot Dev',
        badgeColor: 'bg-indigo-600 text-white',
        autoDelivery: true,
        warranty: '30 ngày (1 đổi 1)',
        desc: 'Tài khoản Cursor Pro nâng cấp trực tiếp trên email bạn đang dùng. Không giới hạn Fast Requests GPT-4o, Claude 3.5 Sonnet và tính năng Agent Composer.',
        instructions: 'Nhập email tài khoản Cursor của bạn vào ô ghi chú. Hệ thống kích hoạt gói Pro tự động trong 1 phút.',
        iconType: 'cursor',
        features: [
          'Nâng cấp chính chủ email cá nhân',
          'Dùng full Claude 3.5 Sonnet & GPT-4o',
          'Không giới hạn Composer & Chat AI',
          'Hỗ trợ gia hạn liên tục các tháng sau'
        ]
      },
      {
        id: 'prod-003',
        name: 'ChatGPT Plus 1 Tháng Private - Full O1 & GPT-4o Riêng Tư',
        category: 'cat_chatgpt',
        tag: 'Tất cả',
        price: 180000,
        oldPrice: 499000,
        discount: '-64%',
        stock: 28,
        status: 'in_stock',
        rating: 5.0,
        reviewsCount: 520,
        soldCount: 2310,
        badge: 'Riêng tư 100%',
        badgeColor: 'bg-blue-600 text-white',
        autoDelivery: true,
        warranty: '30 ngày (1 đổi 1)',
        desc: 'Tài khoản OpenAI ChatGPT Plus riêng biệt 1 người dùng, đổi mật khẩu tùy thích. Trải nghiệm O1-preview, O1-mini, Canvas, DALL-E 3 và Voice Mode tốc độ cao.',
        instructions: 'Tài khoản và mật khẩu gốc được cấp ngay lập tức kèm mã 2FA trực tiếp trên web.',
        iconType: 'chatgpt',
        features: [
          'Tài khoản cấp mới 1 người dùng riêng tư',
          'Đầy đủ mô hình O1, GPT-4o, DALL-E 3',
          'Advanced Voice Mode cực mượt',
          'Bảo hành full 30 ngày 1 đổi 1'
        ]
      },
      {
        id: 'prod-004',
        name: 'API Claude 3.5 Sonnet 10M Token/Ngày Tốc Độ Cao Cho Dev',
        category: 'cat_api',
        tag: 'API AI CODING',
        price: 95000,
        oldPrice: 250000,
        discount: '-62%',
        stock: 67,
        status: 'in_stock',
        rating: 4.9,
        reviewsCount: 129,
        soldCount: 640,
        badge: 'Dành cho Coder',
        badgeColor: 'bg-amber-500 text-slate-950 font-bold',
        autoDelivery: true,
        warranty: '30 ngày',
        desc: 'API Endpoint proxy tiêu chuẩn OpenAI compatible, tương thích 100% với Antigravity, Cline, Roo Code, Aider, Cursor IDE và Continue.dev.',
        instructions: 'Key API và đường dẫn Base URL proxy được tạo tự động và hiển thị ngay sau khi quét mã QR.',
        iconType: 'api',
        features: [
          'Chuẩn OpenAI Endpoint Format',
          'Hạn mức 10.000.000 Tokens/ngày',
          'Độ trễ thấp < 350ms từ VN Server',
          'Tương thích Antigravity & Cline'
        ]
      },
      {
        id: 'prod-005',
        name: 'Capcut Pro 1 Năm Bản Quyền - Hỗ Trợ PC & Điện Thoại',
        category: 'cat_capcut',
        tag: 'Capcut',
        price: 150000,
        oldPrice: 990000,
        discount: '-85%',
        stock: 14,
        status: 'in_stock',
        rating: 4.8,
        reviewsCount: 310,
        soldCount: 1850,
        badge: 'Tiết kiệm 85%',
        badgeColor: 'bg-pink-600 text-white',
        autoDelivery: true,
        warranty: '12 tháng (1 đổi 1)',
        desc: 'Mở khóa toàn bộ tính năng VIP: xóa phông tự động bằng AI, trích xuất phụ đề tự động nhiều thứ tiếng, voice AI lồng tiếng chuẩn và toàn bộ kho hiệu ứng Pro.',
        instructions: 'Cấp mã kích hoạt tài khoản hoặc mail đăng nhập, đồng bộ dữ liệu trên cả máy tính lẫn điện thoại.',
        iconType: 'capcut',
        features: [
          'Dùng đồng thời cả PC Windows/Mac & Mobile',
          'Mở khóa 100% hiệu ứng & lọc VIP',
          'Render video 4K 60fps không watermark',
          'Bảo hành chính sách 12 tháng trọn gói'
        ]
      },
      {
        id: 'prod-006',
        name: 'Canva Pro Giáo Viên Không Giới Hạn - Kích Hoạt Mail Riêng',
        category: 'cat_canva',
        tag: 'Canva',
        price: 45000,
        oldPrice: 199000,
        discount: '-77%',
        stock: 99,
        status: 'in_stock',
        rating: 4.9,
        reviewsCount: 485,
        soldCount: 3120,
        badge: 'Giá rẻ HSSV',
        badgeColor: 'bg-cyan-600 text-white',
        autoDelivery: true,
        warranty: 'Vĩnh viễn',
        desc: 'Kích hoạt Canva Pro qua lời mời vào lớp học giáo viên vĩnh viễn trên chính Gmail của bạn. Truy cập kho 100+ triệu tài nguyên ảnh, video, đồ họa bản quyền.',
        instructions: 'Nhập email Canva vào đơn, hệ thống gửi email mời tham gia nhóm Edu Pro ngay lập tức.',
        iconType: 'canva',
        features: [
          'Kích hoạt trên chính Gmail cá nhân',
          'Kho 100M+ hình ảnh, template bản quyền',
          'Tính năng Xóa phông Magic 1-click',
          'Không giới hạn thời gian sử dụng'
        ]
      },
      {
        id: 'prod-007',
        name: 'Veo AI Video Generator 500 Credits - Tạo Video 1080p Siêu Thực',
        category: 'cat_gemini',
        tag: 'Gemini - Antigravity - Veo',
        price: 85000,
        oldPrice: 220000,
        discount: '-61%',
        stock: 3,
        status: 'low_stock',
        rating: 4.9,
        reviewsCount: 88,
        soldCount: 290,
        badge: 'Sắp hết hàng',
        badgeColor: 'bg-rose-500 text-white animate-pulse',
        autoDelivery: true,
        warranty: '30 ngày',
        desc: 'Gói 500 Credits tạo video điện ảnh siêu thực độ phân giải Full HD bằng mô hình DeepMind Veo thế hệ mới nhất. Render video 6-10s chỉ trong vài chục giây.',
        instructions: 'Cấp token tài khoản Google AI Studio có sẵn Credits để sử dụng trực tiếp qua web studio.',
        iconType: 'gemini',
        features: [
          'Mô hình DeepMind Veo mới nhất',
          'Độ phân giải video 1080p sắc nét',
          '500 Credits tạo được ~50 video',
          'Hỗ trợ Prompt tiếng Việt & tiếng Anh'
        ]
      },
      {
        id: 'prod-008',
        name: 'Midjourney Standard 1 Tháng - Private Mode & Fast Hours',
        category: 'cat_chatgpt',
        tag: 'Tất cả',
        price: 210000,
        oldPrice: 750000,
        discount: '-72%',
        stock: 8,
        status: 'in_stock',
        rating: 5.0,
        reviewsCount: 156,
        soldCount: 710,
        badge: 'Đồ họa đỉnh cao',
        badgeColor: 'bg-purple-600 text-white',
        autoDelivery: true,
        warranty: '30 ngày',
        desc: 'Tài khoản Midjourney v6.1 Standard với 15 giờ tạo ảnh nhanh Fast GPU, chế độ Relax Mode không giới hạn và chế độ riêng tư Stealth Mode.',
        instructions: 'Hệ thống gửi ngay thông tin tài khoản Discord độc lập đã kích hoạt sẵn gói Standard.',
        iconType: 'chatgpt',
        features: [
          '15 giờ tạo ảnh Fast GPU v6.1',
          'Tạo ảnh Relax không giới hạn',
          'Dùng bot riêng trong server cá nhân',
          'Bảo hành 30 ngày 1 đổi 1'
        ]
      },
      {
        id: 'prod-009',
        name: 'GitHub Copilot Business 1 Năm - Kích Hoạt Mail Chính Chủ',
        category: 'cat_api',
        tag: 'API AI CODING',
        price: 290000,
        oldPrice: 1200000,
        discount: '-76%',
        stock: 0,
        status: 'out_of_stock',
        rating: 4.9,
        reviewsCount: 94,
        soldCount: 420,
        badge: 'Tạm hết hàng',
        badgeColor: 'bg-slate-500 text-white',
        autoDelivery: false,
        warranty: '12 tháng',
        desc: 'Gói Copilot Business hỗ trợ lập trình viên autocomplete siêu tốc trên VS Code, JetBrains, Visual Studio. Tích hợp Chat Copilot và PR summarization.',
        instructions: 'Vui lòng nhấn nhận thông báo khi có hàng lại. Dự kiến bổ sung kho trong 24 giờ tới.',
        iconType: 'copilot',
        features: [
          'Hỗ trợ autocomplete code theo ngữ cảnh',
          'Tích hợp GPT-4o Copilot Chat trong IDE',
          'Bảo mật code doanh nghiệp',
          'Bảo hành 1 năm trọn gói'
        ]
      },
      {
        id: 'prod-010',
        name: 'VPS AI 4 vCPU 8GB RAM Chạy Bot 24/7 Tốc Độ Cao VN',
        category: 'cat_api',
        tag: 'API AI CODING',
        price: 160000,
        oldPrice: 450000,
        discount: '-64%',
        stock: 19,
        status: 'in_stock',
        rating: 4.8,
        reviewsCount: 67,
        soldCount: 310,
        badge: 'Server riêng',
        badgeColor: 'bg-slate-900 text-emerald-400 border border-emerald-500/40',
        autoDelivery: true,
        warranty: '30 ngày',
        desc: 'Máy chủ ảo VPS NVMe tốc độ cao đặt tại Datacenter Viettel/VNPT. Cấu hình 4 Core vCPU, 8GB RAM, 80GB SSD NVMe tối ưu chạy Docker, Bot Telegram, Cronjob AI.',
        instructions: 'IP và mật khẩu root SSH được gửi tự động sau khi giao dịch thành công.',
        iconType: 'server',
        features: [
          '4 vCPU Intel Xeon / AMD EPYC',
          '8GB RAM DDR4 ECC & 80GB NVMe SSD',
          'Băng thông 1Gbps không giới hạn',
          'Hỗ trợ cài sẵn Ubuntu 22.04 / 24.04 Docker'
        ]
      }
    ],

    // Đơn hàng mẫu cho Dashboard
    defaultOrders: [
      {
        id: 'DJ2026889',
        date: '2026-03-28 14:20:35',
        productId: 'prod-001',
        productName: '[LINK] Antigravity + Gemini Pro 18 Tháng - Mail Phụ Kèm Quà Tặng',
        price: 69000,
        quantity: 1,
        total: 69000,
        status: 'completed', // completed | pending | failed
        statusText: 'Đã hoàn tất',
        paymentMethod: 'VietQR (MB Bank - Tự động)',
        deliveryType: 'Link mời Google One',
        licenseKey: 'INVITE-LINK: https://one.google.com/inv/gemini-pro-ag26-889-subviet'
      },
      {
        id: 'DJ2026771',
        date: '2026-03-25 09:15:10',
        productId: 'prod-002',
        productName: 'Cursor Pro 1 Tháng Chính Chủ - Nâng Cấp Email Cá Nhân',
        price: 120000,
        quantity: 1,
        total: 120000,
        status: 'completed',
        statusText: 'Đã hoàn tất',
        paymentMethod: 'VietQR (Techcombank)',
        deliveryType: 'Email mời Cursor Team',
        licenseKey: 'CURSOR-PRO-TEAM: Đã gán gói Pro thành công cho email: huy.nguyen@example.com'
      }
    ],

    // Helper Lấy chi tiết Icon
    getBrandIcon: function (type) {
      return BRAND_ICONS[type] || BRAND_ICONS.cursor;
    },

    // Helper Tìm sản phẩm theo ID
    getProductById: function (id) {
      return this.products.find(function (p) { return p.id === id; }) || null;
    },

    // Helper Lọc sản phẩm theo Tag
    getProductsByTag: function (tag) {
      if (!tag || tag === 'Tất cả') return this.products;
      return this.products.filter(function (p) {
        return p.tag === tag || (p.category && p.category.includes(tag.toLowerCase()));
      });
    }
  };

  // Tự động khôi phục danh sách sản phẩm đã được Admin tùy chỉnh từ LocalStorage
  try {
    const savedCustomProds = localStorage.getItem('shopviet_admin_products');
    if (savedCustomProds) {
      const parsed = JSON.parse(savedCustomProds);
      if (Array.isArray(parsed) && parsed.length > 0) {
        window.ShopVietData.products = parsed;
      }
    }
  } catch (err) {
    console.warn('[ShopVietData] Không thể phục hồi sản phẩm từ localStorage:', err);
  }

})();
