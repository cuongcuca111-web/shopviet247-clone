/**
 * Shopviet247 - Data Repository
 * Chứa danh mục sản phẩm, danh sách sản phẩm hot, nhãn lọc và dữ liệu đơn hàng mẫu
 */

(function () {
  'use strict';

  // SVG Helper Icons for Product Brands (100% SVG độc bản, chuẩn nét 2px, bo góc, tương thích Light/Dark mode)
  const BRAND_ICONS = {
    cursor: `<svg class="w-8 h-8 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m4 4 7.07 17 2.51-7.39L21 11.07 4 4z"/><path d="m13.58 13.58 6.42 6.42"/></svg>`,
    gemini: `<svg class="w-10 h-10" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="geminiGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#4285F4"/><stop offset="30%" stop-color="#9B72CB"/><stop offset="70%" stop-color="#D96570"/><stop offset="100%" stop-color="#F4B400"/></linearGradient></defs><path d="M12 2C12 7.52 7.52 12 2 12c5.48 0 10 4.48 10 10 0-5.52 4.48-10 10-10-5.52 0-10-4.48-10-10z" fill="url(#geminiGrad)"/><path d="M19 3v4M17 5h4" stroke="#F4B400" stroke-width="2" stroke-linecap="round"/></svg>`,
    chatgpt: `<svg class="w-8 h-8 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="9" ry="3.5"/><ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(120 12 12)"/></svg>`,
    claude: `<svg class="w-8 h-8 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9.5 2-1.5 5L3 8.5l5 1.5 1.5 5 1.5-5 5-1.5-5-1.5-1.5-5z"/><path d="m18 13-1 3-3 1 3 1 1 3 1-3 3-1-3-1-1-3z"/></svg>`,
    sonnet: `<svg class="w-8 h-8 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9.5 2-1.5 5L3 8.5l5 1.5 1.5 5 1.5-5 5-1.5-5-1.5-1.5-5z"/><path d="m18 13-1 3-3 1 3 1 1 3 1-3 3-1-3-1-1-3z"/></svg>`,
    canva: `<svg class="w-8 h-8 text-cyan-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12c0 3.5 2.5 6.5 6 6.5 1 0 1.5-.5 1.5-1.5 0-.5 0-1 .5-1.5.5-.5 1-.5 1.5-.5h1.5c4.5 0 8.5-3.5 8.5-8 0-4-3.5-7-9.5-7z"/></svg>`,
    capcut: `<svg class="w-8 h-8 text-pink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="3"/><path d="m10 9 5 3-5 3V9z"/><path d="M2 8h20M2 16h20"/></svg>`,
    api: `<svg class="w-8 h-8 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
    copilot: `<svg class="w-8 h-8 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="14" x="3" y="6" rx="3"/><circle cx="8.5" cy="13" r="1.5" fill="currentColor"/><circle cx="15.5" cy="13" r="1.5" fill="currentColor"/><path d="M12 2v4M9 22h6"/></svg>`,
    server: `<svg class="w-8 h-8 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="8" x="2" y="2" rx="2"/><rect width="20" height="8" x="2" y="14" rx="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>`
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

    // Danh sách Sản Phẩm Thật Duy Nhất (Chuẩn Nguồn Chân Lý Đồng Bộ Toàn Hệ Thống)
    products: [
      {
        id: 'prod-001',
        name: '[1 Tháng] Gemini Argon 4 Pro + 5TB Drive',
        category: 'cat_gemini',
        tag: 'Gemini - Antigravity - Veo',
        price: 19000,
        oldPrice: 59000,
        discount: '-68%',
        stock: 110,
        status: 'in_stock', // 'in_stock' | 'low_stock' | 'out_of_stock'
        rating: 5.0,
        reviewsCount: 342,
        soldCount: 1420,
        badge: 'Bán chạy nhất',
        isBestSeller: true,
        badgeColor: 'bg-emerald-500 text-white',
        autoDelivery: false,
        warranty: 'Bảo hành chính chủ',
        desc: 'Kích hoạt ngay bằng link mời Google One chính chủ. Sử dụng Gemini Advanced 1.5 Pro/Flash, tích hợp Antigravity 2.0 Agentic coding và tặng kèm 500 Credits Veo Video AI.',
        instructions: 'Sau khi thanh toán thành công, hệ thống gửi ngay Link kích hoạt vào màn hình và email. Click link để nhận tài khoản ngay lập tức!',
        iconType: 'gemini',
        imageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><rect width="120" height="120" rx="28" fill="%23ffffff"/><defs><linearGradient id="g4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%234285F4"/><stop offset="35%" stop-color="%239B72CB"/><stop offset="70%" stop-color="%23D96570"/><stop offset="100%" stop-color="%23F4B400"/></linearGradient></defs><path d="M60 18 C60 41.2 41.2 60 18 60 C41.2 60 60 78.8 60 102 C60 78.8 78.8 60 102 60 C78.8 60 60 41.2 60 18 Z" fill="url(%23g4)"/><path d="M92 24 v14 M85 31 h14" stroke="%23F4B400" stroke-width="4" stroke-linecap="round"/></svg>',
        features: [
          'Kích hoạt qua link mời chính chủ Google',
          'Tích hợp Antigravity 2.0 & Veo Video AI',
          'Bảo hành chính chủ 1 đổi 1',
          'Tự động cấp link ngay sau khi thanh toán'
        ]
      }
    ],

    // Đơn hàng mẫu cho Dashboard
    defaultOrders: [
      {
        id: 'DJ2026889',
        date: '2026-03-28 14:20:35',
        productId: 'prod-001',
        productName: '[1 Tháng] Gemini Argon 4 Pro + 5TB Drive',
        price: 19000,
        quantity: 1,
        total: 19000,
        status: 'completed', // completed | pending | failed
        statusText: 'Đã hoàn tất',
        paymentMethod: 'VietQR (MB Bank - Tự động)',
        deliveryType: 'Link mời Google One',
        licenseKey: 'INVITE-LINK: https://one.google.com/inv/gemini-pro-ag26-889-subviet'
      }
    ],

    // Helper Lấy chi tiết Icon
    getBrandIcon: function (type) {
      if (!type) return BRAND_ICONS.cursor;
      const key = String(type).toLowerCase();
      if (key === 'sonnet' || key === 'claude') return BRAND_ICONS.claude;
      return BRAND_ICONS[key] || BRAND_ICONS.cursor;
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
    },

    // Helper format tiền tệ VNĐ chuẩn xác
    formatMoney: function (amount) {
      if (isNaN(amount) || amount === null || amount === undefined) return '0đ';
      return Number(amount).toLocaleString('vi-VN') + 'đ';
    }
  };

  // Tự động khôi phục danh sách sản phẩm đã được Admin tùy chỉnh từ LocalStorage (Đồng bộ đa nguồn)
  try {
    const savedCustomProds = localStorage.getItem('shopviet_custom_products') || localStorage.getItem('shopviet_admin_products');
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
