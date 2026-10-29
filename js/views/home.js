/**
 * Shopviet247 - Home View Module
 * Hiện thực hóa Trang chủ chuẩn Clean SaaS UI (Hero 5:7, Banner Neon Cursor, 2x2 Features, Categories, Lưới 5 Cột)
 */

window.ShopVietViews = window.ShopVietViews || {};

window.ShopVietViews.home = (function () {
  'use strict';

  // Helper render thumbnail với gradient & SVG sắc nét
  function renderThumbnail(prod) {
    const brandGradients = {
      cursor: 'from-slate-950 via-indigo-950 to-indigo-900 border-indigo-800/40',
      gemini: 'from-slate-950 via-blue-950 to-blue-900 border-blue-800/40',
      chatgpt: 'from-slate-950 via-emerald-950 to-teal-900 border-emerald-800/40',
      claude: 'from-slate-950 via-amber-950 to-orange-950 border-amber-800/40',
      sonnet: 'from-slate-950 via-amber-950 to-orange-950 border-amber-800/40',
      api: 'from-slate-950 via-amber-950 to-orange-950 border-amber-800/40',
      canva: 'from-slate-950 via-cyan-950 to-sky-900 border-cyan-800/40',
      capcut: 'from-slate-950 via-pink-950 to-rose-900 border-pink-800/40',
      copilot: 'from-slate-950 via-purple-950 to-indigo-950 border-purple-800/40',
      server: 'from-slate-950 via-slate-900 to-emerald-950 border-emerald-800/40'
    };

    const gradientClass = brandGradients[prod.iconType] || 'from-slate-950 via-indigo-950 to-slate-900 border-slate-800';

    return `
      <div class="relative w-full aspect-square bg-gradient-to-br ${gradientClass} rounded-xl overflow-hidden flex items-center justify-center p-6 border transition-transform duration-300 group-hover:scale-[1.02]">
        <!-- Ambient radial glow -->
        <div class="absolute inset-0 bg-radial from-indigo-500/10 via-transparent to-transparent opacity-60"></div>

        <!-- Top Badges -->
        <div class="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
          ${prod.discount ? `
            <span class="px-2 py-0.5 text-[10px] font-black rounded-lg bg-rose-500 text-white shadow-sm shadow-rose-500/30">
              ${prod.discount}
            </span>
          ` : ''}
          ${prod.badge ? `
            <span class="px-2 py-0.5 text-[10px] font-bold rounded-lg ${prod.badgeColor || 'bg-indigo-600 text-white'} shadow-sm">
              ${prod.badge}
            </span>
          ` : ''}
        </div>

        <!-- Product SVG Center Icon or Image with Glowing Backdrop -->
        <div class="relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center ${prod.imageUrl ? 'p-0 overflow-hidden' : 'p-3.5'} shadow-xl group-hover:scale-110 group-hover:bg-white/10 transition-all duration-300">
          ${prod.imageUrl 
            ? `<img src="${prod.imageUrl}" alt="${prod.name}" class="w-full h-full object-cover rounded-2xl" />`
            : (window.ShopVietData ? window.ShopVietData.getBrandIcon(prod.iconType) : '')}
        </div>

        <!-- Bottom brand label overlay -->
        <div class="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[10px] text-slate-400 font-medium z-10">
          <span class="uppercase tracking-wider font-bold text-slate-300">${prod.tag || 'AI Software'}</span>
          <span>${prod.warranty ? prod.warranty.split(' ')[0] + ' ' + (prod.warranty.split(' ')[1] || '') : ''}</span>
        </div>
      </div>
    `;
  }

  // Helper render Badge Tồn Kho
  function renderStockBadge(prod) {
    if (prod.status === 'out_of_stock' || prod.stock <= 0) {
      return `
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-500 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/50">
          <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          Hết hàng
        </span>
      `;
    } else if (prod.status === 'low_stock' || prod.stock <= 5) {
      return `
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50">
          <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
          Sắp hết hàng (còn ${prod.stock})
        </span>
      `;
    } else {
      return `
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Còn hàng (${prod.stock})
        </span>
      `;
    }
  }

  return {
    render: function (params) {
      params = params || {};
      const data = window.ShopVietData || { categories: [], products: [], filterTags: [] };
      const currentFilter = window.ShopVietState ? (window.ShopVietState.state.activeFilter || 'Tất cả') : 'Tất cả';
      const searchQuery = window.ShopVietState ? (window.ShopVietState.state.searchQuery || '') : '';

      // Lọc danh sách sản phẩm theo Tag và Từ khóa
      let displayedProducts = data.products || [];
      if (currentFilter && currentFilter !== 'Tất cả') {
        displayedProducts = displayedProducts.filter(function (p) {
          return p.tag === currentFilter || (p.category && p.category.toLowerCase().includes(currentFilter.toLowerCase()));
        });
      }

      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        displayedProducts = displayedProducts.filter(function (p) {
          return (p.name && p.name.toLowerCase().includes(query)) ||
                 (p.desc && p.desc.toLowerCase().includes(query)) ||
                 (p.tag && p.tag.toLowerCase().includes(query));
        });
      }

      return `
        <div class="space-y-10 sm:space-y-14">

          <!-- ==================== HERO SECTION (TỶ LỆ 5:7 TRÊN DESKTOP) ==================== -->
          <section class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            <!-- CỘT TRÁI (5 COLS): CARD TRẮNG LỚN TỔNG QUAN & TÌM KIẾM -->
            <div class="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
              
              <!-- Background Ambient Accent -->
              <div class="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-indigo-500/10 to-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

              <div>
                <!-- Badge Xanh Lá Nhạt -->
                <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50 font-medium text-xs">
                  <svg class="w-3.5 h-3.5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                  <span>Tự động giao hàng sau khi thanh toán</span>
                </div>

                <!-- H1 Lớn Đậm -->
                <h1 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight mt-4 tracking-tight">
                  Công cụ AI hạt dẻ cho học sinh, sinh viên — <span class="bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 bg-clip-text text-transparent">kích hoạt trong vài phút</span>
                </h1>

                <!-- Mô Tả Phụ -->
                <p class="text-slate-500 dark:text-slate-400 text-sm sm:text-base mt-3 leading-relaxed">
                  AI Coding hạt dẻ, công cụ làm việc online dễ mua, giá rõ và theo dõi đơn ngay trên web.
                </p>

                <!-- Thanh Tìm Kiếm Tích Hợp -->
                <form id="heroSearchForm" onsubmit="ShopVietViews.home.handleSearchSubmit(event)" class="mt-6">
                  <div class="rounded-2xl border border-slate-200 dark:border-slate-700/80 p-1.5 flex items-center bg-slate-50/70 dark:bg-slate-800/60 shadow-inner focus-within:border-indigo-500 dark:focus-within:border-indigo-400 transition-colors">
                    <svg class="w-4 h-4 text-slate-400 ml-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="m21 21-4.3-4.3"/>
                    </svg>
                    <input 
                      id="heroSearchInput" 
                      type="text" 
                      value="${searchQuery}" 
                      placeholder="Tìm ChatGPT, Cursor, VPS..." 
                      class="bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none px-3 flex-1"
                    />
                    ${searchQuery ? `
                      <button type="button" onclick="ShopVietViews.home.clearSearch()" class="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mr-1" title="Xóa tìm kiếm">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    ` : ''}
                    <button type="submit" class="bg-slate-900 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500 text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-800 flex items-center gap-1.5 shadow-sm active:scale-95 transition-all shrink-0">
                      <span>Tìm sản phẩm</span>
                    </button>
                  </div>
                </form>
              </div>

              <!-- Danh Sách Tag Lọc Nhanh (Pills Ngang) -->
              <div class="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                <div class="flex items-center justify-between text-xs text-slate-400 font-medium mb-2.5">
                  <span>Lọc nhanh theo nhóm:</span>
                  ${currentFilter !== 'Tất cả' ? `
                    <button onclick="ShopVietViews.home.filterByTag('Tất cả')" class="text-indigo-600 dark:text-indigo-400 hover:underline">
                      Xem tất cả
                    </button>
                  ` : ''}
                </div>
                <div class="flex flex-wrap items-center gap-1.5">
                  ${(data.filterTags || []).map(tag => {
                    const isSelected = tag === currentFilter;
                    return `
                      <button 
                        type="button" 
                        onclick="ShopVietViews.home.filterByTag('${tag}')" 
                        class="px-3 py-1.5 rounded-xl text-xs transition-all duration-200 cursor-pointer ${
                          isSelected 
                            ? 'bg-slate-900 text-white font-medium dark:bg-indigo-600 shadow-sm' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                        }"
                      >
                        ${tag}
                      </button>
                    `;
                  }).join('')}
                </div>
              </div>

            </div>

            <!-- CỘT PHẢI (7 COLS): BANNER NEON CURSOR AI & LƯỚI 2X2 FEATURES -->
            <div class="lg:col-span-7 flex flex-col justify-between gap-4">
              
              <!-- BANNER QUẢNG CÁO NỀN TỐI NEON CHO CURSOR -->
              <div class="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-7 border border-slate-800 shadow-md relative overflow-hidden flex flex-col justify-between group">
                
                <!-- Glowing Ambient Orbs -->
                <div class="absolute -right-8 -bottom-8 w-56 h-56 bg-indigo-500/25 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/35 transition-all duration-500"></div>
                <div class="absolute top-0 right-1/4 w-32 h-32 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none"></div>

                <div class="relative z-10 space-y-3 max-w-lg">
                  <div class="flex items-center gap-2">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                      Hot product 2026
                    </span>
                    <span class="text-xs text-indigo-300 font-semibold">• Bản quyền chính chủ</span>
                  </div>

                  <h2 class="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                    CURSOR PRO — AI CODING TOOL TỐI THƯỢNG
                  </h2>

                  <p class="text-slate-300 text-xs sm:text-sm leading-relaxed">
                    Tăng 500% tốc độ code với Claude 3.5 Sonnet & GPT-4o tích hợp sẵn. Nâng cấp trực tiếp trên email cá nhân, kích hoạt trong 60 giây.
                  </p>
                </div>

                <div class="relative z-10 mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
                  <div class="flex items-baseline gap-2">
                    <span class="text-2xl font-extrabold text-white">120.000đ</span>
                    <span class="text-xs text-slate-400 line-through">520.000đ</span>
                    <span class="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800/40">-77%</span>
                  </div>

                  <button 
                    onclick="ShopVietViews.modal.open('prod-002')" 
                    class="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-600/30 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Xem chi tiết ngay</span>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </button>
                </div>

              </div>

              <!-- LƯỚI 2X2 GỒM 4 THẺ TÍNH NĂNG NHỎ -->
              <div class="grid grid-cols-2 gap-3.5">
                
                <!-- Card 1: Thanh toán VietQR -->
                <div class="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-start gap-3 hover:border-indigo-300 dark:hover:border-indigo-600/50 hover:shadow-sm transition-all">
                  <div class="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect width="5" height="5" x="3" y="3" rx="1"/>
                      <rect width="5" height="5" x="16" y="3" rx="1"/>
                      <rect width="5" height="5" x="3" y="16" rx="1"/>
                      <path d="M21 16h-3a2 2 0 0 0-2 2v3"/>
                      <path d="M21 21v.01"/>
                      <path d="M12 7v3a2 2 0 0 1-2 2H7"/>
                      <path d="M3 12h.01"/>
                      <path d="M12 3h.01"/>
                      <path d="M12 16v.01"/>
                      <path d="M16 12h1"/>
                      <path d="M21 12v.01"/>
                      <path d="M12 21v-1"/>
                    </svg>
                  </div>
                  <div>
                    <h4 class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Thanh toán VietQR</h4>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Tự động nhận diện 30s</p>
                  </div>
                </div>

                <!-- Card 2: Giao hàng tự động -->
                <div class="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-start gap-3 hover:border-emerald-300 dark:hover:border-emerald-600/50 hover:shadow-sm transition-all">
                  <div class="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>
                    </svg>
                  </div>
                  <div>
                    <h4 class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Giao hàng tự động</h4>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Nhận tài khoản ngay qua web</p>
                  </div>
                </div>

                <!-- Card 3: Dashboard đơn hàng -->
                <div onclick="ShopVietState.navigate('dashboard')" class="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-start gap-3 hover:border-indigo-300 dark:hover:border-indigo-600/50 hover:shadow-sm transition-all cursor-pointer">
                  <div class="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect width="7" height="9" x="3" y="3" rx="1"/>
                      <rect width="7" height="5" x="14" y="3" rx="1"/>
                      <rect width="7" height="9" x="14" y="12" rx="1"/>
                      <rect width="7" height="5" x="3" y="16" rx="1"/>
                    </svg>
                  </div>
                  <div>
                    <h4 class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1">
                      <span>Dashboard đơn hàng</span>
                      <svg class="w-3 h-3 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </h4>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Quản lý gói & gia hạn dễ dàng</p>
                  </div>
                </div>

                <!-- Card 4: Lịch sử mua hàng -->
                <div onclick="ShopVietState.navigate('dashboard', { tab: 'orders' })" class="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-start gap-3 hover:border-indigo-300 dark:hover:border-indigo-600/50 hover:shadow-sm transition-all cursor-pointer group">
                  <div class="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                      <path d="M3 6h18" />
                      <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                      <span>Lịch sử mua hàng</span>
                    </div>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      Tra cứu đơn & nhận link bản quyền
                    </p>
                  </div>
                </div>

              </div>

            </div>

          </section>

          <!-- ==================== KHU VỰC "DANH MỤC" ==================== -->
          <section class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Danh mục nổi bật</span>
                  <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    ${(data.categories || []).length} nhóm
                  </span>
                </h2>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Lựa chọn giải pháp công nghệ theo nhu cầu học tập & làm việc</p>
              </div>

              <button 
                onclick="ShopVietViews.home.filterByTag('Tất cả')" 
                class="text-xs sm:text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Xem tất cả</span>
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>

            <!-- Hàng Ngang Các Thẻ Danh Mục Nhỏ Bo Tròn -->
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
              ${(data.categories || []).map(cat => `
                <div 
                  onclick="ShopVietViews.home.filterByTag('${cat.tag}')" 
                  class="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600/60 transition-all duration-200 cursor-pointer flex items-center gap-3 group"
                >
                  <div class="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center p-2 shrink-0 group-hover:scale-105 transition-transform duration-200">
                    ${cat.icon}
                  </div>
                  <div class="min-w-0">
                    <h3 class="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      ${cat.name}
                    </h3>
                    <p class="text-[11px] text-slate-400 font-medium truncate mt-0.5">${cat.count}</p>
                  </div>
                </div>
              `).join('')}
            </div>
          </section>

          <!-- ==================== KHU VỰC "SẢN PHẨM HOT" ==================== -->
          <section id="productsSection" class="space-y-6 pt-2">
            
            <!-- Header Khu Vực Sản Phẩm -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/70 dark:border-slate-800/80">
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    Sản phẩm nổi bật
                  </h2>
                  <span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50">
                    ${displayedProducts.length} sản phẩm
                  </span>
                </div>
                <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  ${searchQuery ? `Kết quả tìm kiếm cho từ khóa "<strong class="text-slate-800 dark:text-slate-200">${searchQuery}</strong>"` : 'Bản quyền công cụ AI hàng đầu, bảo hành 1 đổi 1 suốt chu kỳ'}
                </p>
              </div>

              <!-- Filter Tags Pills (Secondary Selector) -->
              <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none max-w-full">
                ${(data.filterTags || []).map(tag => {
                  const isSelected = tag === currentFilter;
                  return `
                    <button 
                      type="button" 
                      onclick="ShopVietViews.home.filterByTag('${tag}')" 
                      class="px-3 py-1.5 rounded-full text-xs font-semibold transition shrink-0 cursor-pointer ${
                        isSelected 
                          ? 'bg-slate-900 text-white font-medium dark:bg-indigo-600 shadow-xs' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                      }"
                    >
                      ${tag}
                    </button>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- LƯỚI 5 CỘT TRÊN DESKTOP: grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 -->
            ${displayedProducts.length === 0 ? `
              <div class="py-16 text-center space-y-3 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
                <div class="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                </div>
                <h3 class="text-base font-bold text-slate-800 dark:text-slate-200">Không tìm thấy sản phẩm phù hợp</h3>
                <p class="text-xs text-slate-500 max-w-sm mx-auto">Vui lòng thử tìm với từ khóa khác hoặc chuyển danh mục về "Tất cả".</p>
                <button onclick="ShopVietViews.home.clearSearch()" class="mt-2 px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-indigo-600 text-xs font-semibold hover:opacity-90">
                  Xem toàn bộ kho hàng
                </button>
              </div>
            ` : `
              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                ${displayedProducts.map(prod => {
                  const isOutOfStock = prod.status === 'out_of_stock' || prod.stock <= 0;

                  return `
                    <div 
                      class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3 sm:p-3.5 flex flex-col justify-between shadow-xs hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600/50 hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
                      onclick="ShopVietViews.modal.open('${prod.id}')"
                    >
                      <!-- Top Thumbnail -->
                      <div>
                        ${renderThumbnail(prod)}

                        <!-- Product Title (Giới hạn 2 dòng) -->
                        <h3 class="line-clamp-2 text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mt-3 leading-snug">
                          ${prod.name}
                        </h3>

                        <!-- Rating & Sold Count -->
                        <div class="flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-400">
                          <span class="flex items-center gap-1 text-amber-500 font-bold">
                            <svg class="w-3.5 h-3.5 text-amber-400 fill-current inline-block" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg> ${prod.rating || '5.0'}
                          </span>
                          <span>•</span>
                          <span>${prod.soldCount ? `${(prod.soldCount / 1000).toFixed(1)}k đã bán` : 'Mới mở bán'}</span>
                        </div>

                        <!-- Stock Status Badge -->
                        <div class="mt-2">
                          ${renderStockBadge(prod)}
                        </div>
                      </div>

                      <!-- Bottom Price & CTA Button -->
                      <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                        <div class="flex flex-col min-w-0">
                          <span class="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                            ${window.ShopVietState ? window.ShopVietState.formatCurrency(prod.price) : `${prod.price.toLocaleString('vi-VN')} đ`}
                          </span>
                          ${prod.oldPrice ? `
                            <span class="text-[11px] text-slate-400 line-through truncate -mt-0.5">
                              ${window.ShopVietState ? window.ShopVietState.formatCurrency(prod.oldPrice) : `${prod.oldPrice.toLocaleString('vi-VN')} đ`}
                            </span>
                          ` : ''}
                        </div>

                        ${isOutOfStock ? `
                          <button 
                            disabled 
                            onclick="event.stopPropagation()" 
                            class="bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500 text-xs font-semibold px-3 py-1.5 rounded-full cursor-not-allowed shrink-0"
                          >
                            Hết hàng
                          </button>
                        ` : `
                          <button 
                            onclick="event.stopPropagation(); ShopVietViews.modal.open('${prod.id}')" 
                            class="bg-slate-900 hover:bg-slate-800 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500 text-xs font-semibold px-3.5 py-1.5 rounded-full active:scale-95 transition-all shadow-xs hover:shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer"
                          >
                            <svg class="w-3.5 h-3.5 text-indigo-400 dark:text-indigo-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                            <span>Mua ngay</span>
                          </button>
                        `}
                      </div>

                    </div>
                  `;
                }).join('')}
              </div>
            `}

          </section>

        </div>
      `;
    },

    // Hàm filter theo Tag
    filterByTag: function (tag) {
      if (window.ShopVietState) {
        window.ShopVietState.state.activeFilter = tag;
        // Nếu đang có tìm kiếm mà đổi danh mục, giữ nguyên hoặc xóa
        const appMount = document.getElementById('appMount');
        if (appMount) {
          appMount.innerHTML = this.render();
          const target = document.getElementById('productsSection');
          if (target && tag !== 'Tất cả') {
            target.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }
    },

    // Xử lý gửi form tìm kiếm
    handleSearchSubmit: function (e) {
      if (e) e.preventDefault();
      const input = document.getElementById('heroSearchInput');
      const query = input ? input.value : '';
      if (window.ShopVietState) {
        window.ShopVietState.state.searchQuery = query;
        const appMount = document.getElementById('appMount');
        if (appMount) {
          appMount.innerHTML = this.render();
          const target = document.getElementById('productsSection');
          if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }
    },

    // Xóa bộ lọc tìm kiếm
    clearSearch: function () {
      if (window.ShopVietState) {
        window.ShopVietState.state.searchQuery = '';
        window.ShopVietState.state.activeFilter = 'Tất cả';
        const appMount = document.getElementById('appMount');
        if (appMount) {
          appMount.innerHTML = this.render();
        }
      }
    },

    // Lifecycle hook sau khi view được render
    afterRender: function () {
      // Tự động focus hoặc gán sự kiện nếu cần
    }
  };

})();
