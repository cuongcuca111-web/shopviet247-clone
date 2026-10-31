/**
 * Shopviet247 - Data Repository
 * Chứa danh mục sản phẩm, danh sách sản phẩm hot, nhãn lọc và dữ liệu đơn hàng mẫu
 */

(function () {
  'use strict';

  // SVG Helper Icons for Product Brands (100% SVG độc bản, chuẩn nét 2px, bo góc, tương thích Light/Dark mode)
  const BRAND_ICONS = {
    cursor: `<svg class="w-8 h-8 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m4 4 7.07 17 2.51-7.39L21 11.07 4 4z"/><path d="m13.58 13.58 6.42 6.42"/></svg>`,
    gemini: `<svg class="w-10 h-10" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="brandGeminiGradData" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#4285F4"/><stop offset="30%" stop-color="#9B72CB"/><stop offset="70%" stop-color="#D96570"/><stop offset="100%" stop-color="#F4B400"/></linearGradient></defs><path d="M12 2C12 7.52 7.52 12 2 12c5.48 0 10 4.48 10 10 0-5.52 4.48-10 10-10-5.52 0-10-4.48-10-10z" fill="url(#brandGeminiGradData)"/><path d="M19 3v4M17 5h4" stroke="#F4B400" stroke-width="2" stroke-linecap="round"/></svg>`,
    chatgpt: `<svg class="w-8 h-8 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="9" ry="3.5"/><ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(120 12 12)"/></svg>`,
    claude: `<svg class="w-8 h-8 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9.5 2-1.5 5L3 8.5l5 1.5 1.5 5 1.5-5 5-1.5-5-1.5-1.5-5z"/><path d="m18 13-1 3-3 1 3 1 1 3 1-3 3-1-3-1-1-3z"/></svg>`,
    sonnet: `<svg class="w-8 h-8 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9.5 2-1.5 5L3 8.5l5 1.5 1.5 5 1.5-5 5-1.5-5-1.5-1.5-5z"/><path d="m18 13-1 3-3 1 3 1 1 3 1-3 3-1-3-1-1-3z"/></svg>`,
    antigravity: `<svg class="w-8 h-8 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><defs><linearGradient id="brandAntigravityGradData" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#a855f7"/><stop offset="100%" stop-color="#6366f1"/></linearGradient></defs><circle cx="12" cy="12" r="3.5" fill="url(#brandAntigravityGradData)"/><ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(-30 12 12)" stroke="currentColor" stroke-width="1.8"/><ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(30 12 12)" stroke="currentColor" stroke-width="1.8"/><circle cx="19.5" cy="7.5" r="1.5" fill="#a855f7"/><circle cx="4.5" cy="16.5" r="1.2" fill="#6366f1"/></svg>`,
    veo: `<svg class="w-8 h-8 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15.5 8 5.5-3.5v15L15.5 16"/><rect x="2" y="6" width="13.5" height="12" rx="2.5"/><circle cx="8.75" cy="12" r="2.5" fill="currentColor" fill-opacity="0.2"/><path d="M6 3.5 8 5.5M11.5 3.5 9.5 5.5" stroke="#f43f5e" stroke-width="2" stroke-linecap="round"/></svg>`,
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
        id: 'prod-6178',
        name: '[6 Tháng]Gemini Argon 4 Pro + 5TB Drive',
        category: 'cat_gemini',
        tag: 'Gemini - Antigravity - Veo',
        price: 69000,
        oldPrice: 250000,
        discount: '-72%',
        stock: 100,
        status: 'in_stock',
        rating: 5,
        reviewsCount: 1,
        soldCount: 0,
        badge: 'Bán chạy nhất',
        badgeColor: 'bg-indigo-600 text-white',
        autoDelivery: false,
        warranty: '18 tháng (1 đổi 1)',
        desc: 'Gói 6 tháng Gemini Argon 4 Pro kèm 5TB Cloud Drive chính chủ, tích hợp Antigravity 2.0 & Veo Video AI tự động 24/7.',
        iconType: 'gemini',
        imageUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjAgMTIwIiB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCI+CiAgPHJlY3Qgd2lkdGg9IjEyMCIgaGVpZ2h0PSIxMjAiIHJ4PSIyOCIgZmlsbD0iI2ZmZmZmZiIvPgogIDxkZWZzPgogICAgPGxpbmVhckdyYWRpZW50IGlkPSJnZW1pbmk2bUdyYWQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjMWE3M2U4Ii8+CiAgICAgIDxzdG9wIG9mZnNldD0iMzUlIiBzdG9wLWNvbG9yPSIjOGFiNGY4Ii8+CiAgICAgIDxzdG9wIG9mZnNldD0iNzAlIiBzdG9wLWNvbG9yPSIjYzU4YWY5Ii8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI2ZmNzU5NyIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZ2VtaW5pNm1QaWxsIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzRmNDZlNSIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiM3YzNhZWQiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgPC9kZWZzPgogIDxwYXRoIGQ9Ik02MCAxNiBDNjAgMzggNDMgNTQgMjAgNTQgQzQzIDU0IDYwIDcwIDYwIDkyIEM2MCA3MCA3NyA1NCAxMDAgNTQgQzc3IDU0IDYwIDM4IDYwIDE2IFoiIGZpbGw9InVybCgjZ2VtaW5pNm1HcmFkKSIvPgogIDxwYXRoIGQ9Ik05MiAyMCB2MTIgTTg2IDI2IGgxMiIgc3Ryb2tlPSIjRjRCNDAwIiBzdHJva2Utd2lkdGg9IjMuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CiAgPHJlY3QgeD0iMjYiIHk9IjkwIiB3aWR0aD0iNjgiIGhlaWdodD0iMjAiIHJ4PSIxMCIgZmlsbD0idXJsKCNnZW1pbmk2bVBpbGwpIi8+CiAgPHRleHQgeD0iNjAiIHk9IjEwNCIgZm9udC1mYW1pbHk9Ii1hcHBsZS1zeXN0ZW0sIEJsaW5rTWFjU3lzdGVtRm9udCwgJ1NlZ29lIFVJJywgUm9ib3RvLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIiBmb250LXdlaWdodD0iODAwIiBmaWxsPSIjZmZmZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBsZXR0ZXItc3BhY2luZz0iMC41Ij42TSBQUk88L3RleHQ+Cjwvc3ZnPg==',
        features: [
          'Bản quyền kích hoạt nhanh chóng 24/7',
          'Bảo hành 1 đổi 1 nhanh chóng',
          'Hỗ trợ kỹ thuật qua Zalo 0868668809'
        ]
      },
      {
        id: 'prod-3749',
        name: '[3 Tháng]Gemini Argon 4 Pro + 5TB Drive',
        category: 'cat_gemini',
        tag: 'Gemini - Antigravity - Veo',
        price: 49000,
        oldPrice: 109000,
        discount: '-55%',
        stock: 100,
        status: 'in_stock', // 'in_stock' | 'low_stock' | 'out_of_stock'
        rating: 5,
        reviewsCount: 128,
        soldCount: 460,
        badge: 'Bán chạy nhất',
        isBestSeller: true,
        badgeColor: 'bg-amber-500 text-white',
        autoDelivery: false,
        warranty: 'Bảo hành chính chủ 3 tháng',
        desc: 'Gói 3 tháng Gemini Argon 4 Pro kèm 5TB Cloud Drive chính chủ, tích hợp Antigravity 2.0 & Veo Video AI.',
        instructions: 'Sau khi thanh toán thành công, hệ thống gửi ngay Link kích hoạt vào màn hình và email. Click link để nhận tài khoản ngay lập tức!',
        iconType: 'gemini',
        imageUrl: 'data:image/webp;base64,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',
        features: [
          'Kích hoạt qua link mời chính chủ Google',
          'Tích hợp Antigravity 2.0 & Veo Video AI',
          'Bảo hành chính chủ 1 đổi 1',
          'Tự động cấp link ngay sau khi thanh toán'
        ]
      },
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
        imageUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjAgMTIwIiB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCI+PHJlY3Qgd2lkdGg9IjEyMCIgaGVpZ2h0PSIxMjAiIHJ4PSIyOCIgZmlsbD0iI2ZmZmZmZiIvPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0iZzQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiM0Mjg1RjQiLz48c3RvcCBvZmZzZXQ9IjM1JSIgc3RvcC1jb2xvcj0iIzlCNzJDQiIvPjxzdG9wIG9mZnNldD0iNzAlIiBzdG9wLWNvbG9yPSIjRDk2NTcwIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjRjRCNDAwIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHBhdGggZD0iTTYwIDE4IEM2MCA0MS4yIDQxLjIgNjAgMTggNjAgQzQxLjIgNjAgNjAgNzguOCA2MCAxMDIgQzYwIDc4LjggNzguOCA2MCAxMDIgNjAgQzc4LjggNjAgNjAgNDEuMiA2MCAxOCBaIiBmaWxsPSJ1cmwoI2c0KSIvPjxwYXRoIGQ9Ik05MiAyNCB2MTQgTTg1IDMxIGgxNCIgc3Ryb2tlPSIjRjRCNDAwIiBzdHJva2Utd2lkdGg9IjQiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvc3ZnPg==',
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
      const key = String(type).toLowerCase().trim();
      if (key === 'ag' || key === 'antigravity') return BRAND_ICONS.antigravity;
      if (key === 'veo') return BRAND_ICONS.veo;
      if (key === 'openai' || key === 'chatgpt') return BRAND_ICONS.chatgpt;
      if (key === 'google' || key === 'gemini') return BRAND_ICONS.gemini;
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
    if (typeof localStorage !== 'undefined') {
      const savedCustomProds = localStorage.getItem('shopviet_custom_products') || localStorage.getItem('shopviet_admin_products');
      if (savedCustomProds) {
        const parsed = JSON.parse(savedCustomProds);
        if (Array.isArray(parsed) && parsed.length > 0) {
          window.ShopVietData.products = parsed;
        }
      }
    }
  } catch (err) {
    console.warn('[ShopVietData] Không thể phục hồi sản phẩm từ localStorage:', err);
  }

})();
