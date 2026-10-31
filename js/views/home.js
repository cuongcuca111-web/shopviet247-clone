/**
 * Shopviet247 - Home View Module
 * Hiện thực hóa Trang chủ chuẩn Clean SaaS UI (Hero 5:7, Banner Neon Cursor, 2x2 Features, Categories, Lưới 5 Cột)
 */

window.ShopVietViews = window.ShopVietViews || {};

window.ShopVietViews.home = (function () {
  'use strict';

  // Helper render an toàn ảnh đại diện sản phẩm (chống vỡ thẻ, chống tràn mã onerror và tương thích 100% SVG/WebP/PNG)
  function renderSafeProductImage(prod, imgClass, fallbackClass) {
    imgClass = imgClass || 'w-full h-full object-cover rounded-2xl';
    fallbackClass = fallbackClass || 'w-full h-full p-3.5 flex items-center justify-center';
    if (!prod) return '';
    const iconSvg = (window.ShopVietData && typeof window.ShopVietData.getBrandIcon === 'function')
      ? window.ShopVietData.getBrandIcon(prod.iconType)
      : '';

    let rawUrl = (prod.imageUrl || '').trim();
    if (!rawUrl) {
      return `<div class="${fallbackClass}">${iconSvg}</div>`;
    }

    // Nếu imageUrl bắt đầu trực tiếp bằng khối thẻ <svg
    if (rawUrl.startsWith('<svg') || rawUrl.startsWith('<?xml')) {
      return `<div class="${fallbackClass} overflow-hidden">${rawUrl}</div>`;
    }

    // Chuyển đổi an toàn dấu ngoặc kép và ký tự đặc biệt trong URL
    let safeSrc = rawUrl;
    if (safeSrc.startsWith('data:image/svg+xml;utf8,') || safeSrc.startsWith('data:image/svg+xml,')) {
      const prefix = safeSrc.startsWith('data:image/svg+xml;utf8,') ? 'data:image/svg+xml;utf8,' : 'data:image/svg+xml,';
      const svgBody = safeSrc.substring(prefix.length);
      safeSrc = prefix + svgBody.replace(/"/g, '%22').replace(/#/g, '%23');
    } else {
      safeSrc = safeSrc.replace(/"/g, '&quot;');
    }

    return `<img src="${safeSrc}" alt="" class="${imgClass}" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='flex';" /><div style="display:none;" class="${fallbackClass}">${iconSvg}</div>`;
  }

  // Helper render huy hiệu Mark động với icon SVG & viền sáng sắc nét (Dành cho hiển thị phụ)
  function renderProductMarkBadge(badge, customBadgeColor) {
    if (!badge) return '';
    const bLower = badge.toLowerCase();

    // 1. HOT (Đang sốt - Đỏ Cam Neon kèm icon ngọn lửa rực sáng)
    if (bLower.includes('hot')) {
      return `
        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10.5px] font-black rounded-lg bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 text-white shadow-md shadow-rose-500/35 border border-rose-300/40 ring-1 ring-rose-400/30 backdrop-blur-md tracking-tight group-hover:scale-105 transition-transform duration-200">
          <svg class="w-3 h-3 text-amber-200 fill-current animate-pulse shrink-0" viewBox="0 0 24 24">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
          </svg>
          <span class="drop-shadow-xs">${badge}</span>
        </span>
      `;
    }

    // 2. Rẻ vô địch / Tiết kiệm (Xanh Emerald kèm icon tag giảm giá)
    if (bLower.includes('rẻ') || bLower.includes('tiết kiệm')) {
      return `
        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10.5px] font-black rounded-lg bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white shadow-md shadow-emerald-500/30 border border-emerald-300/40 ring-1 ring-emerald-400/30 backdrop-blur-md tracking-tight group-hover:scale-105 transition-transform duration-200">
          <svg class="w-3 h-3 text-emerald-100 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
            <line x1="7" y1="7" x2="7.01" y2="7"/>
          </svg>
          <span class="drop-shadow-xs">${badge}</span>
        </span>
      `;
    }

    // 3. Mới ra mắt / New Arrival (Tím Cyber kèm icon tia sáng lấp lánh)
    if (bLower.includes('mới') || bLower.includes('new')) {
      return `
        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10.5px] font-black rounded-lg bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600 text-white shadow-md shadow-purple-500/30 border border-purple-300/40 ring-1 ring-purple-400/30 backdrop-blur-md tracking-tight group-hover:scale-105 transition-transform duration-200">
          <svg class="w-3 h-3 text-purple-200 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z"/>
          </svg>
          <span class="drop-shadow-xs">${badge}</span>
        </span>
      `;
    }

    // 4. Khuyên dùng / Pro Choice (Xanh Dương Cyber kèm icon viên kim cương/khiên)
    if (bLower.includes('khuyên dùng') || bLower.includes('pro')) {
      return `
        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10.5px] font-black rounded-lg bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 text-white shadow-md shadow-blue-500/30 border border-cyan-300/40 ring-1 ring-cyan-400/30 backdrop-blur-md tracking-tight group-hover:scale-105 transition-transform duration-200">
          <svg class="w-3 h-3 text-cyan-100 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="6 3 18 3 22 9 12 22 2 9 6 3"/>
            <polyline points="11 3 11 22"/>
          </svg>
          <span class="drop-shadow-xs">${badge}</span>
        </span>
      `;
    }

    // 5. Flash Sale (Hồng Đỏ rực rỡ kèm tia chớp)
    if (bLower.includes('flash') || bLower.includes('sale')) {
      return `
        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10.5px] font-black rounded-lg bg-gradient-to-r from-pink-600 via-rose-600 to-red-600 text-white shadow-md shadow-pink-500/35 border border-pink-300/40 ring-1 ring-pink-400/30 backdrop-blur-md tracking-tight group-hover:scale-105 transition-transform duration-200">
          <svg class="w-3 h-3 text-yellow-200 fill-current shrink-0 animate-pulse" viewBox="0 0 24 24">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          <span class="drop-shadow-xs">${badge}</span>
        </span>
      `;
    }

    // 6. Custom Badge hoặc giá trị tùy chỉnh riêng
    const bgClass = customBadgeColor || 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-indigo-500/30';
    return `
      <span class="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-lg ${bgClass} shadow-sm border border-white/20 backdrop-blur-xs">
        <svg class="w-2.5 h-2.5 text-white/80 shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="4"/>
        </svg>
        <span>${badge}</span>
      </span>
    `;
  }

  // Helper render Bookmark Hanging Ribbon độc bản ở góc trên bên phải (Top-Right) chuẩn Ảnh 2
  function renderTopRightRibbon(prod) {
    if (!prod) return '';
    const badgeText = (prod.badge || (prod.isBestSeller ? 'Bán chạy nhất' : '')).trim();
    if (!badgeText) return '';

    const bLower = badgeText.toLowerCase();

    let gradientClass = '';
    let shadowStyle = '';
    let highlightClass = '';
    let iconSvg = '';
    let labelHtml = '';

    // 1. Bán chạy nhất / Best Seller (Vàng Gold Hoàng Gia)
    if (prod.isBestSeller || bLower.includes('bán chạy') || bLower.includes('best seller')) {
      gradientClass = 'bg-gradient-to-b from-amber-300 via-amber-500 to-orange-600';
      shadowStyle = 'filter: drop-shadow(0 4px 6px rgba(234, 88, 12, 0.5));';
      highlightClass = 'bg-yellow-200/90';
      iconSvg = `
        <svg class="w-3.5 h-3.5 text-yellow-100 fill-current drop-shadow-sm mb-0.5 animate-pulse" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      `;
      labelHtml = 'BÁN<br/>CHẠY';
    }
    // 2. HOT / Cực Hot / Thịnh hành (Đỏ Cam Rực Lửa AI)
    else if (bLower.includes('hot') || bLower.includes('thịnh hành')) {
      gradientClass = 'bg-gradient-to-b from-rose-400 via-red-500 to-orange-600';
      shadowStyle = 'filter: drop-shadow(0 4px 6px rgba(225, 29, 72, 0.5));';
      highlightClass = 'bg-rose-200/90';
      iconSvg = `
        <svg class="w-3.5 h-3.5 text-amber-200 fill-current drop-shadow-sm mb-0.5 animate-pulse" viewBox="0 0 24 24">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
        </svg>
      `;
      labelHtml = 'CỰC<br/>HOT';
    }
    // 3. Rẻ vô địch / Siêu tiết kiệm / Giá rẻ (Xanh Ngọc Emerald & Diamond Tag)
    else if (bLower.includes('rẻ') || bLower.includes('tiết kiệm')) {
      gradientClass = 'bg-gradient-to-b from-emerald-300 via-teal-500 to-emerald-700';
      shadowStyle = 'filter: drop-shadow(0 4px 6px rgba(16, 185, 129, 0.5));';
      highlightClass = 'bg-emerald-200/90';
      iconSvg = `
        <svg class="w-3.5 h-3.5 text-emerald-100 shrink-0 drop-shadow-sm mb-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
          <line x1="7" y1="7" x2="7.01" y2="7"/>
        </svg>
      `;
      labelHtml = bLower.includes('tiết kiệm') ? 'TIẾT<br/>KIỆM' : 'RẺ<br/>NHẤT';
    }
    // 4. Mới ra mắt / New Arrival (Xanh Cyan / Sky Cyber & Sparkle)
    else if (bLower.includes('mới') || bLower.includes('new')) {
      gradientClass = 'bg-gradient-to-b from-cyan-300 via-sky-500 to-blue-600';
      shadowStyle = 'filter: drop-shadow(0 4px 6px rgba(14, 165, 233, 0.5));';
      highlightClass = 'bg-cyan-200/90';
      iconSvg = `
        <svg class="w-3.5 h-3.5 text-cyan-100 shrink-0 drop-shadow-sm mb-0.5 fill-current animate-pulse" viewBox="0 0 24 24">
          <path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z"/>
        </svg>
      `;
      labelHtml = 'HÀNG<br/>MỚI';
    }
    // 5. Khuyên dùng / Đặc quyền VIP / Pro Choice (Tím Hoàng Gia & Vương Miện)
    else if (bLower.includes('khuyên dùng') || bLower.includes('pro') || bLower.includes('vip')) {
      gradientClass = 'bg-gradient-to-b from-violet-300 via-purple-500 to-indigo-700';
      shadowStyle = 'filter: drop-shadow(0 4px 6px rgba(139, 92, 246, 0.5));';
      highlightClass = 'bg-purple-200/90';
      iconSvg = `
        <svg class="w-3.5 h-3.5 text-purple-100 shrink-0 drop-shadow-sm mb-0.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>
        </svg>
      `;
      labelHtml = bLower.includes('vip') ? 'BẢN<br/>VIP' : 'KHUYÊN<br/>DÙNG';
    }
    // 6. Flash Sale (Hồng Đỏ Rực Rỡ & Tia Chớp)
    else if (bLower.includes('flash') || bLower.includes('sale')) {
      gradientClass = 'bg-gradient-to-b from-pink-400 via-rose-600 to-red-700';
      shadowStyle = 'filter: drop-shadow(0 4px 6px rgba(244, 63, 94, 0.5));';
      highlightClass = 'bg-pink-200/90';
      iconSvg = `
        <svg class="w-3.5 h-3.5 text-yellow-200 fill-current shrink-0 drop-shadow-sm mb-0.5 animate-pulse" viewBox="0 0 24 24">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
      `;
      labelHtml = 'FLASH<br/>SALE';
    }
    // 7. Badge Tùy chỉnh (Custom) / Kim Cương Đa Giác
    else {
      gradientClass = 'bg-gradient-to-b from-indigo-300 via-indigo-600 to-slate-800';
      shadowStyle = 'filter: drop-shadow(0 4px 6px rgba(99, 102, 241, 0.5));';
      highlightClass = 'bg-indigo-200/90';
      iconSvg = `
        <svg class="w-3.5 h-3.5 text-indigo-100 shrink-0 drop-shadow-sm mb-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="6 3 18 3 22 9 12 22 2 9 6 3"/>
          <polyline points="11 3 11 22"/>
        </svg>
      `;
      // Tách chữ thành 2 dòng gọn gàng
      const words = badgeText.split(/\s+/);
      if (words.length >= 2) {
        labelHtml = `${words[0].toUpperCase()}<br/>${words.slice(1).join(' ').toUpperCase()}`;
      } else if (badgeText.length > 5) {
        labelHtml = `${badgeText.slice(0, 4).toUpperCase()}<br/>${badgeText.slice(4).toUpperCase()}`;
      } else {
        labelHtml = badgeText.toUpperCase();
      }
    }

    return `
      <div 
        class="absolute top-0 right-3 sm:right-3.5 z-20 pointer-events-none transition-transform duration-300 group-hover:translate-y-0.5"
        style="${shadowStyle}"
      >
        <div 
          class="w-8 sm:w-9 pt-1.5 pb-3 px-0.5 ${gradientClass} text-white font-black flex flex-col items-center justify-center text-center relative"
          style="clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 50% 82%, 0% 100%); -webkit-clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 50% 82%, 0% 100%);"
        >
          <!-- Highlight viền trên ruy băng -->
          <div class="absolute top-0 inset-x-0 h-0.5 ${highlightClass}"></div>
          <!-- Vệt sáng phản chiếu (Shimmer Overlay) -->
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"></div>

          <!-- Icon SVG Độc Bản -->
          ${iconSvg}

          <!-- Chữ Ruy Băng -->
          <span class="text-[7.5px] sm:text-[8px] font-black uppercase tracking-tight text-white leading-[1.05] drop-shadow">
            ${labelHtml}
          </span>
        </div>
      </div>
    `;
  }

  // Helper render thumbnail với gradient & SVG sắc nét
  function renderThumbnail(prod) {
    const brandGradients = {
      cursor: 'from-slate-950 via-indigo-950 to-indigo-900 border-indigo-800/40',
      gemini: 'from-slate-950 via-blue-950 to-blue-900 border-blue-800/40',
      antigravity: 'from-slate-950 via-purple-950 to-indigo-950 border-purple-800/40',
      veo: 'from-slate-950 via-rose-950 to-amber-950 border-rose-800/40',
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
        <div class="absolute inset-0 bg-radial from-indigo-500/10 via-transparent to-transparent opacity-60 pointer-events-none"></div>

        <!-- Top Left: Huy hiệu Giảm Giá (Sale Tag) duy nhất -->
        <div class="absolute top-2.5 left-2.5 flex flex-col items-start gap-1.5 z-10 pointer-events-none">
          ${prod.discount ? `
            <span class="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-black rounded-full bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 text-white shadow-md shadow-rose-500/35 border border-white/20 backdrop-blur-md tracking-tight group-hover:scale-105 transition-transform duration-200">
              <svg class="w-2.5 h-2.5 text-white/90 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="19" y1="5" x2="5" y2="19"/>
                <circle cx="6.5" cy="6.5" r="2.5" fill="currentColor"/>
                <circle cx="17.5" cy="17.5" r="2.5" fill="currentColor"/>
              </svg>
              <span>${prod.discount}</span>
            </span>
          ` : ''}
        </div>

        <!-- Top Right: Hanging Bookmark Ribbon độc bản đồng bộ vị trí ảnh 2 -->
        ${renderTopRightRibbon(prod)}

        <!-- Product SVG Center Icon or Image with Glowing Backdrop -->
        <div class="relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center ${prod.imageUrl ? 'p-0 overflow-hidden' : 'p-3.5'} shadow-xl group-hover:scale-110 group-hover:bg-white/10 transition-all duration-300">
          ${renderSafeProductImage(prod, 'w-full h-full object-cover rounded-2xl', 'w-full h-full p-3.5 flex items-center justify-center')}
        </div>

        <!-- Bottom brand label overlay (Đã bỏ chữ 1 tháng, nhãn thương hiệu mở rộng lấp trọn vẹn khoảng trống) -->
        <div class="absolute bottom-2 left-2.5 right-2.5 z-10 pointer-events-none">
          <div class="w-full text-center bg-slate-900/60 dark:bg-slate-950/70 backdrop-blur-md py-0.5 px-2 rounded-md border border-white/10 shadow-xs">
            <span class="uppercase tracking-wider font-extrabold text-[9.5px] sm:text-[10px] text-slate-200 truncate block">
              ${prod.tag || 'AI Software'}
            </span>
          </div>
        </div>
      </div>
    `;
  }

  // Helper render Badge Tồn Kho
  function renderStockBadge(prod) {
    if (prod.status === 'out_of_stock' || prod.stock <= 0) {
      return `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/25 shadow-2xs">
          <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          <span>Tạm hết slot</span>
        </span>
      `;
    } else if (prod.status === 'low_stock' || prod.stock <= 5) {
      return `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 shadow-2xs">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span>Chỉ còn ${prod.stock} slot</span>
        </span>
      `;
    } else {
      return `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shadow-2xs">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Còn ${prod.stock} slot</span>
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

      // Lấy danh sách sản phẩm thật (Ưu tiên từ getCustomProducts trong State, nếu không có fallback về ShopVietData)
      const allProducts = (window.ShopVietState && typeof window.ShopVietState.getCustomProducts === 'function' && window.ShopVietState.getCustomProducts().length > 0)
        ? window.ShopVietState.getCustomProducts()
        : ((window.ShopVietData && window.ShopVietData.products) ? window.ShopVietData.products : []);

      // Helper phân loại thẻ theo Tag chuẩn Lucian #292
      function isProductMatchingTag(p, tag) {
        if (!tag || tag === 'Tất cả') return true;
        if (p.tag === tag) return true;
        if (p.category && p.category.toLowerCase().includes(tag.toLowerCase())) return true;
        if (tag.includes('Gemini') && ((p.name && p.name.includes('Gemini')) || (p.tag && p.tag.includes('Gemini')))) return true;
        if (tag.includes('Cursor') && ((p.name && p.name.includes('Cursor')) || (p.tag && p.tag.includes('Cursor')))) return true;
        return false;
      }

      // Lọc danh sách sản phẩm theo Từ khóa tìm kiếm
      let searchProducts = allProducts || [];
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        searchProducts = searchProducts.filter(function (p) {
          return (p.name && p.name.toLowerCase().includes(query)) ||
                 (p.desc && p.desc.toLowerCase().includes(query)) ||
                 (p.tag && p.tag.toLowerCase().includes(query));
        });
      }

      // Danh sách sản phẩm thực tế hiển thị theo bộ lọc đang kích hoạt
      const matchingProducts = searchProducts.filter(function (p) {
        return isProductMatchingTag(p, currentFilter);
      });
      const displayedProducts = matchingProducts;

      // Xác định sản phẩm tiêu biểu cho Hero Banner (Ưu tiên sản phẩm isBestSeller -> hoặc sản phẩm đầu tiên có sẵn trong kho)
      let heroProduct = allProducts.find(function (p) { return p.isBestSeller; });
      if (!heroProduct && allProducts.length > 0) {
        heroProduct = allProducts[0];
      }
      if (!heroProduct) {
        heroProduct = {
          id: 'prod-001',
          name: '[1 Tháng] Gemini Argon 4 Pro + 5TB Drive - Antigravity Pro',
          price: 19000,
          oldPrice: 250000,
          discount: '-92%',
          badge: 'Bán chạy nhất',
          desc: 'Kích hoạt ngay bằng link mời Google One chính chủ. Sử dụng Gemini Advanced 1.5 Pro/Flash, tích hợp Antigravity 2.0 Agentic coding và tặng kèm 500 Credits Veo Video AI.'
        };
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
                  <span id="heroBadgeText"><span class="u267-sw"><span>Tự động giao hàng sau khi thanh toán</span></span></span>
                </div>

                <!-- H1 Lớn Đậm -->
                <h1 id="heroTitleText" class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight mt-4 tracking-tight">
                  <span class="u267-sw u267-block"><span>Công cụ AI hạt dẻ cho học sinh, sinh viên — <span class="bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 bg-clip-text text-transparent">kích hoạt trong vài phút</span></span></span>
                </h1>

                <!-- Mô Tả Phụ -->
                <p id="heroDescText" class="text-slate-500 dark:text-slate-400 text-sm sm:text-base mt-3 leading-relaxed">
                  <span class="u267-sw u267-block"><span>AI Coding hạt dẻ, công cụ làm việc online dễ mua, giá rõ và theo dõi đơn ngay trên web.</span></span>
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
                <div class="flex flex-wrap items-center gap-1.5" role="toolbar" aria-label="Bộ lọc nhanh">
                  ${(data.filterTags || []).map(tag => {
                    const isSelected = tag === currentFilter;
                    return `
                      <button 
                        type="button" 
                        role="button"
                        aria-pressed="${isSelected ? 'true' : 'false'}"
                        data-tag="${tag}"
                        onclick="ShopVietViews.home.filterByTag('${tag}')" 
                        class="u292-f ${isSelected ? 'is-active' : ''}"
                      >
                        ${tag}
                      </button>
                    `;
                  }).join('')}
                </div>
              </div>

            </div>

            <!-- CỘT PHẢI (7 COLS): BANNER NEON NỔI BẬT & LƯỚI 2X2 FEATURES -->
            <div class="lg:col-span-7 flex flex-col justify-between gap-4">
              
              <!-- BANNER QUẢNG CÁO NỀN TỐI NEON CHO SẢN PHẨM NỔI BẬT THỰC TẾ -->
              <div data-product-card="true" data-product-id="${heroProduct.id || 'prod-001'}" class="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-7 border border-slate-800 shadow-md relative overflow-hidden flex flex-col justify-between group transition-all duration-500">
                
                <!-- Glowing Ambient Orbs -->
                <div class="absolute -right-8 -bottom-8 w-56 h-56 bg-indigo-500/25 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/35 transition-all duration-500"></div>
                <div class="absolute top-0 right-1/4 w-32 h-32 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none"></div>

                <div class="relative z-10 space-y-3 max-w-lg">
                  <div class="flex items-center gap-2">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                      ${heroProduct.badge || 'Hot product 2026'}
                    </span>
                    <span class="text-xs text-indigo-300 font-semibold">• Bản quyền chính chủ</span>
                  </div>

                  <h2 class="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug line-clamp-2">
                    ${(heroProduct.name || 'GEMINI ARGON 4 PRO').toUpperCase()}
                  </h2>

                  <p class="text-slate-300 text-xs sm:text-sm leading-relaxed line-clamp-2">
                    ${heroProduct.desc || 'Tăng tốc độ làm việc vượt trội với AI thế hệ mới. Nâng cấp trực tiếp trên email cá nhân, kích hoạt trong vài phút.'}
                  </p>
                </div>

                <div class="relative z-10 mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
                  <div class="flex items-baseline gap-2">
                    <span class="text-2xl font-extrabold text-white">
                      ${window.ShopVietState ? window.ShopVietState.formatCurrency(heroProduct.price) : `${(heroProduct.price || 0).toLocaleString('vi-VN')} đ`}
                    </span>
                    ${heroProduct.oldPrice ? `
                      <span class="text-xs text-slate-400 line-through">
                        ${window.ShopVietState ? window.ShopVietState.formatCurrency(heroProduct.oldPrice) : `${heroProduct.oldPrice.toLocaleString('vi-VN')} đ`}
                      </span>
                    ` : ''}
                    ${heroProduct.discount ? `
                      <span class="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800/40">${heroProduct.discount}</span>
                    ` : ''}
                  </div>

                  <button 
                    onclick="ShopVietViews.modal.open('${heroProduct.id || 'prod-001'}')" 
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
                <div onclick="window.ShopVietState ? window.ShopVietState.navigate('dashboard', { tab: 'orders' }) : (window.location.hash = '#dashboard?tab=orders')" class="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-start gap-3 hover:border-indigo-300 dark:hover:border-indigo-600/50 hover:shadow-sm transition-all cursor-pointer group">
                  <div class="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10 9 9 9 8 9"/>
                    </svg>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                      <span>Lịch sử mua hàng</span>
                    </div>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      Quản lý gói & xem link bàn giao
                    </p>
                  </div>
                </div>

              </div>

            </div>

          </section>

          <!-- ==================== [ELEMENT] DRAG-TO-RESIZE RESPONSIVE PREVIEW (LUCIAN #257) ==================== -->
          <!-- Lucian UX/UI Prompt #257 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#257 -->
          <section id="responsiveSimulatorSection" class="relative overflow-hidden rounded-3xl p-6 sm:p-8 lg:p-10 border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl shadow-xl shadow-slate-200/50 dark:shadow-black/40">
            <!-- Background Ambient Glow & Lighting -->
            <div class="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>
            <div class="absolute -bottom-24 -left-24 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div class="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              <!-- Left Column: Storytelling & Value Props (7 cols) -->
              <div class="lg:col-span-7 space-y-5">
                <!-- Badge -->
                <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold tracking-wide">
                  <span class="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                  <span>LUCIAN #257 · RESPONSIVE SIMULATOR 60FPS</span>
                </div>

                <div class="space-y-2">
                  <h2 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    Mô Phỏng Trải Nghiệm <span class="bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 bg-clip-text text-transparent">Đa Nền Tảng</span>
                  </h2>
                  <p class="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                    Kiểm nghiệm độ mượt mà của ShopSkill247 trên mọi kích thước màn hình. Chọn các chế độ Desktop (1280px), Tablet (768px), Mobile (390px) hoặc kéo thả thanh trượt bên phải để kích hoạt động cơ Container Queries tự thích ứng 60fps.
                  </p>
                </div>

                <!-- 3 Feature Highlights Cards -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div class="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/80">
                    <div class="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs mb-2">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                    </div>
                    <div class="text-xs font-bold text-slate-900 dark:text-white">Container Queries</div>
                    <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">3 cột &rarr; 2 cột &rarr; 1 cột tự tái cấu trúc</div>
                  </div>

                  <div class="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/80">
                    <div class="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-xs mb-2">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                    </div>
                    <div class="text-xs font-bold text-slate-900 dark:text-white">Adaptive Menu</div>
                    <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Gập sang menu Hamburger khi &le; 200px</div>
                  </div>

                  <div class="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/80">
                    <div class="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold text-xs mb-2">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    </div>
                    <div class="text-xs font-bold text-slate-900 dark:text-white">Thước Đo Breakpoint</div>
                    <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Phát sáng flash nhấp nháy khi qua mốc</div>
                  </div>
                </div>

                <!-- Guidance tip -->
                <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
                  <svg class="w-4 h-4 text-indigo-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  <span>Phím tắt: Bấm phím mũi tên <strong>Trái / Phải</strong> trên thanh cầm để tinh chỉnh kích thước &plusmn;40px!</span>
                </div>
              </div>

              <!-- Right Column: Interactive Lucian #257 Simulator (5 cols) -->
              <div class="lg:col-span-5 flex justify-center items-center">
                <!-- Wrapper Pedestal with Neon Ambient Border -->
                <div class="relative p-2 sm:p-3 rounded-[36px] bg-gradient-to-b from-slate-200/60 via-slate-100/40 to-slate-200/30 dark:from-slate-800/80 dark:via-slate-900/60 dark:to-slate-950/80 border border-white/60 dark:border-slate-700/60 shadow-2xl shadow-indigo-500/10">
                  
                  <!-- LUCIAN #257 ROOT COMPONENT -->
                  <div class="ux u257" id="lucian257Simulator">
                    <div class="u257-tb">
                      <div class="u257-sg" role="group" aria-label="Device"></div>
                      <span class="u257-px" aria-live="polite">1280px</span>
                    </div>
                    <div class="u257-ru" aria-hidden="true"></div>
                    <div class="u257-st">
                      <div class="u257-fr">
                        <div class="u257-pg">
                          <div class="u257-nv">
                            <b><i></i>SkillShop</b>
                            <span>Trang chủ</span>
                            <span>Sản phẩm</span>
                            <span>Blog</span>
                            <em class="u257-hb" title="Menu"></em>
                          </div>
                          <div class="u257-hr">
                            <h4>Nền tảng Kỹ năng & Công cụ AI đỉnh cao</h4>
                            <span>Khám phá ngay</span>
                          </div>
                          <div class="u257-gd">
                            <i title="Cursor Pro">
                              <span class="u257-card-t">Cursor Pro</span>
                              <span class="u257-card-p">69.000đ</span>
                            </i>
                            <i title="Gemini Advanced">
                              <span class="u257-card-t">Gemini Adv</span>
                              <span class="u257-card-p">89.000đ</span>
                            </i>
                            <i title="ChatGPT Plus">
                              <span class="u257-card-t">ChatGPT+</span>
                              <span class="u257-card-p">99.000đ</span>
                            </i>
                          </div>
                        </div>
                      </div>
                      <span class="u257-hd" role="slider" tabindex="0" aria-label="Preview width" aria-valuemin="320" aria-valuemax="1440"></span>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </section>

          <!-- ==================== KHU VỰC "SẢN PHẨM HOT" (LUCIAN #292) ==================== -->
          <!-- Lucian UX/UI Prompt #292 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#292 -->
          <section id="productsSection" class="u292 space-y-6 pt-2">
            
            <!-- Header Khu Vực Sản Phẩm -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/70 dark:border-slate-800/80">
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    Sản phẩm nổi bật
                  </h2>
                  <span id="u292CountBadge" class="u292-n font-bold" aria-live="polite">
                    <span id="u292CountVal" class="u292-n-val">${matchingProducts.length}</span> sản phẩm sẵn có
                  </span>
                </div>
                <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  ${searchQuery ? `Kết quả tìm kiếm cho từ khóa "<strong class="text-slate-800 dark:text-slate-200">${searchQuery}</strong>"` : 'Bản quyền công cụ AI hàng đầu, bảo hành 1 đổi 1 suốt chu kỳ'}
                </p>
              </div>

              <!-- Filter Tags Pills (Secondary Selector) - Chuẩn Lucian UX/UI Prompt #292 -->
              <div class="u292-fs" role="toolbar" aria-label="Bộ lọc danh mục sản phẩm">
                ${(data.filterTags || []).map(tag => {
                  const isSelected = tag === currentFilter;
                  return `
                    <button 
                      type="button" 
                      role="button"
                      aria-pressed="${isSelected ? 'true' : 'false'}"
                      data-tag="${tag}"
                      onclick="ShopVietViews.home.filterByTag('${tag}')" 
                      class="u292-f ${isSelected ? 'is-active' : ''}"
                    >
                      ${tag}
                    </button>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- LƯỚI 5 CỘT TRÊN DESKTOP (LUCIAN #292 FILTER-AND-REFLOW GALLERY): grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 -->
            <div id="productListGrid" class="u292-g grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              ${searchProducts.map(prod => {
                const isOutOfStock = prod.status === 'out_of_stock' || prod.stock <= 0;
                const isMatch = isProductMatchingTag(prod, currentFilter);

                return `
                  <div 
                    data-product-card="true" 
                    data-product-id="${prod.id}"
                    data-product-tag="${prod.tag || ''}"
                    data-product-category="${prod.category || ''}"
                    data-product-name="${(prod.name || '').replace(/"/g, '&quot;')}"
                    class="u292-t ${isMatch ? '' : 'out'} bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3 sm:p-3.5 flex flex-col justify-between shadow-xs hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600/50 hover:-translate-y-1 transition-all duration-500 group cursor-pointer"
                    style="${isMatch ? '' : 'display: none;'}"
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

              <!-- Empty State Card (Lucian #292 Reflow Empty State) -->
              <div id="u292EmptyState" class="u292-empty py-16 text-center space-y-3 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 transition-all duration-300 ease-out" style="${matchingProducts.length === 0 ? '' : 'display: none; opacity: 0;'}">
                <div class="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                </div>
                <h3 class="text-base font-bold text-slate-800 dark:text-slate-200">Không tìm thấy sản phẩm phù hợp</h3>
                <p class="text-xs text-slate-500 max-w-sm mx-auto">Vui lòng thử tìm với từ khóa khác hoặc chuyển danh mục về "Tất cả".</p>
                <button onclick="ShopVietViews.home.clearSearch()" class="mt-2 px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-indigo-600 text-xs font-semibold hover:opacity-90">
                  Xem toàn bộ kho hàng
                </button>
              </div>

            </div>

          </section>

        </div>
      `;
    },

    // Hàm filter theo Tag - Chuẩn Lucian UX/UI Prompt #292 (Filter-and-Reflow Gallery)
    filterByTag: function (tag) {
      if (!window.ShopVietState) return;

      const currentFilter = window.ShopVietState.state.activeFilter || 'Tất cả';
      if (currentFilter === tag) return;

      window.ShopVietState.state.activeFilter = tag;

      // 1. Đồng bộ trạng thái active & aria-pressed cho toàn bộ các nút chip lọc (.u292-f)
      const allFilterButtons = document.querySelectorAll('.u292-f');
      allFilterButtons.forEach(btn => {
        const btnTag = btn.getAttribute('data-tag');
        const isSelected = btnTag === tag;
        btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
        if (isSelected) {
          btn.classList.add('is-active');
        } else {
          btn.classList.remove('is-active');
        }
      });

      const grid = document.getElementById('productListGrid');
      const emptyState = document.getElementById('u292EmptyState');
      const countValEl = document.getElementById('u292CountVal');

      // Nếu grid không tồn tại trong DOM (ví dụ đang ở view khác), render lại view bình thường
      if (!grid) {
        const appMount = document.getElementById('appMount');
        if (appMount) {
          appMount.innerHTML = this.render();
          const target = document.getElementById('productsSection');
          if (target && tag !== 'Tất cả') {
            target.scrollIntoView({ behavior: 'smooth' });
          }
        }
        return;
      }

      // Helper kiểm tra card có khớp với tag hay không
      function checkCardMatches(card, filterTag) {
        if (!filterTag || filterTag === 'Tất cả') return true;
        const cTag = card.getAttribute('data-product-tag') || '';
        const cCat = card.getAttribute('data-product-category') || '';
        const cName = card.getAttribute('data-product-name') || '';
        if (cTag === filterTag) return true;
        if (cCat && cCat.toLowerCase().includes(filterTag.toLowerCase())) return true;
        if (filterTag.includes('Gemini') && (cName.includes('Gemini') || cTag.includes('Gemini'))) return true;
        if (filterTag.includes('Cursor') && (cName.includes('Cursor') || cTag.includes('Cursor'))) return true;
        return false;
      }

      // Rolling Counter Animation (Lăn số mượt mà tabular-nums)
      function rollCounter(el, start, end, duration) {
        if (!el) return;
        duration = duration || 400;
        const startTime = performance.now();
        function update(now) {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic
          const current = Math.round(start + (end - start) * ease);
          el.textContent = current;
          if (progress < 1) {
            requestAnimationFrame(update);
          } else {
            el.textContent = end;
          }
        }
        requestAnimationFrame(update);
      }

      const cards = Array.from(grid.querySelectorAll('.u292-t'));
      let visibleCount = 0;
      cards.forEach(card => {
        if (checkCardMatches(card, tag)) visibleCount++;
      });

      const oldCount = countValEl ? parseInt(countValEl.textContent || '0', 10) : 0;
      rollCounter(countValEl, oldCount, visibleCount, 400);

      // Cuộn êm ái tới khu vực sản phẩm nếu bấm từ Hero banner
      const productsSection = document.getElementById('productsSection');
      if (productsSection) {
        const rect = productsSection.getBoundingClientRect();
        if (rect.top < -100 || rect.top > window.innerHeight) {
          productsSection.scrollIntoView({ behavior: 'smooth' });
        }
      }

      // Kiểm tra accessibility prefers-reduced-motion
      const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        cards.forEach(card => {
          const matches = checkCardMatches(card, tag);
          if (matches) {
            card.classList.remove('out');
            card.style.display = '';
            card.style.transform = '';
            card.style.opacity = '';
          } else {
            card.classList.add('out');
            card.style.display = 'none';
          }
        });
        if (emptyState) {
          emptyState.style.display = visibleCount === 0 ? '' : 'none';
          emptyState.style.opacity = visibleCount === 0 ? '1' : '0';
        }
        return;
      }

      // ==================== REFLOW PHYSICS 60FPS (LUCIAN #292) ====================
      // BƯỚC 1: FIRST (F) - Ghi nhận tọa độ ban đầu của các thẻ đang hiển thị
      const firstPositions = new Map();
      cards.forEach(card => {
        if (!card.classList.contains('out') && card.style.display !== 'none') {
          firstPositions.set(card, card.getBoundingClientRect());
        }
      });

      // Phân loại thẻ: exiting (chuẩn bị biến mất), staying (tiếp tục hiển thị), entering (chuẩn bị xuất hiện)
      const exitingCards = [];
      const stayingCards = [];
      const enteringCards = [];

      cards.forEach(card => {
        const matches = checkCardMatches(card, tag);
        const isCurrentlyVisible = !card.classList.contains('out') && card.style.display !== 'none';
        if (isCurrentlyVisible && !matches) {
          exitingCards.push(card);
        } else if (isCurrentlyVisible && matches) {
          stayingCards.push(card);
        } else if (!isCurrentlyVisible && matches) {
          enteringCards.push(card);
        }
      });

      // BƯỚC 2: Thẻ không khớp thu nhỏ dần scale(0.2) và mờ dần opacity: 0
      exitingCards.forEach(card => {
        card.style.transition = 'transform .22s cubic-bezier(.4,0,1,1), opacity .22s ease-in';
        card.classList.add('out');
      });

      // Sau 200ms khi exitingCards đã thu nhỏ xong, kích hoạt Reflow FLIP lấp khoảng trống
      setTimeout(() => {
        // Ẩn hoàn toàn exitingCards khỏi layout
        exitingCards.forEach(card => {
          card.style.display = 'none';
        });

        // Đưa enteringCards vào DOM layout nhưng khởi tạo scale(0) mờ
        enteringCards.forEach(card => {
          card.classList.remove('out');
          card.style.display = '';
          card.style.opacity = '0';
          card.style.transform = 'scale(0)';
          card.style.transition = 'none';
        });

        if (emptyState) {
          if (visibleCount === 0) {
            emptyState.style.display = '';
            requestAnimationFrame(() => {
              emptyState.style.opacity = '1';
              emptyState.style.transform = 'scale(1)';
            });
          } else {
            emptyState.style.opacity = '0';
            emptyState.style.transform = 'scale(0.95)';
            setTimeout(() => {
              if (emptyState.style.opacity === '0') emptyState.style.display = 'none';
            }, 250);
          }
        }

        // BƯỚC 3: LAST (L) - Đo đạc tọa độ mới sau khi layout đã reflow
        const lastPositions = new Map();
        stayingCards.forEach(card => {
          lastPositions.set(card, card.getBoundingClientRect());
        });

        // BƯỚC 4: INVERT (I) - Nghịch đảo vị trí thẻ staying
        stayingCards.forEach(card => {
          const first = firstPositions.get(card);
          const last = lastPositions.get(card);
          if (first && last) {
            const dx = first.left - last.left;
            const dy = first.top - last.top;
            if (dx !== 0 || dy !== 0) {
              card.style.transition = 'none';
              card.style.transform = `translate(${dx}px, ${dy}px)`;
            }
          }
        });

        // Ép reflow trình duyệt
        grid.offsetHeight;

        // BƯỚC 5: PLAY (P) - Các thẻ lướt tới lấp đầy khoảng trống với đường cong nguyên bản Lucian #292
        requestAnimationFrame(() => {
          // Thẻ staying lướt về vị trí mới
          stayingCards.forEach((card, idx) => {
            const stagger = (idx % 5) * 35; // so le mượt mà 35ms
            card.style.transition = `transform .6s cubic-bezier(.3,1.25,.4,1) ${stagger}ms, opacity .35s ease`;
            card.style.transform = 'translate(0, 0) scale(1)';
            card.style.opacity = '1';
          });

          // Thẻ entering nở to từ scale(0) lên scale(1) tại vị trí mới
          enteringCards.forEach((card, idx) => {
            const stagger = (idx % 5) * 35 + 50;
            card.style.transition = `transform .6s cubic-bezier(.3,1.25,.4,1) ${stagger}ms, opacity .35s ease`;
            card.style.transform = 'scale(1)';
            card.style.opacity = '1';
          });

          // Dọn dẹp inline transition sau khi hoàn tất để nhường lại cho hover CSS
          setTimeout(() => {
            cards.forEach(card => {
              if (!card.classList.contains('out')) {
                card.style.transition = '';
                card.style.transform = '';
                card.style.opacity = '';
              }
            });
          }, 700);
        });

      }, 200);
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
      // 1. Gắn listener lắng nghe sự kiện đồng bộ thời gian thực từ window
      this.initRealtimeListener();

      // 2. Khởi tạo Mô phỏng Trải nghiệm Đa nền tảng (Lucian #257)
      if (typeof this.initLucian257 === 'function') {
        this.initLucian257();
      }

      // 3. Nếu có cờ pending highlight (sau khi chuyển view về home)
      if (window._shopviet_pending_highlight) {
        window._shopviet_pending_highlight = false;
        this.highlightProductCards();
      }
    },

    /**
     * Render lại danh sách sản phẩm thời gian thực mà không làm giật trang hoặc nhảy vị trí cuộn
     */
    renderProducts: function () {
      const currentView = (window.ShopVietState && window.ShopVietState.state && window.ShopVietState.state.currentView) || 'home';
      if (currentView === 'home') {
        const appMount = document.getElementById('appMount');
        if (appMount) {
          const currentScrollY = window.scrollY;
          appMount.innerHTML = this.render();
          window.scrollTo(0, currentScrollY);
          if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
          }
          if (typeof this.initLucian257 === 'function') {
            this.initLucian257();
          }
        }
      } else if (window.ShopVietState && typeof window.ShopVietState.renderCurrentRoute === 'function') {
        window.ShopVietState.renderCurrentRoute(true);
      }
    },

    /**
     * Khởi tạo listener lắng nghe sự kiện shopviet_realtime_update từ window
     */
    initRealtimeListener: function () {
      if (window._shopviet_home_realtime_bound) return;
      window._shopviet_home_realtime_bound = true;

      const self = this;
      window.addEventListener('shopviet_realtime_update', function (e) {
        console.log('[ShopVietRealtime] Đã nhận sự kiện shopviet_realtime_update:', e ? e.detail : null);

        // 1. Kích hoạt hiệu ứng icon mây xoay tít & pill nháy sáng trên Header (#header-sync-btn)
        self.triggerHeaderLivePulse();

        // 2. Thông báo Toast nổi bật: Đã ẩn theo yêu cầu người dùng để không làm phiền trải nghiệm, tính năng cập nhật ngầm và nhấp nháy icon Live Cloud vẫn hoạt động 100%
        // const msg = (e && e.detail && e.detail.message) || '🔔 Cửa hàng vừa cập nhật sản phẩm mới!';
        // self.showRealtimeUpdateToast(msg);

        // 3. Nếu đang ở view home (hoặc view mặc định), cập nhật lại danh sách sản phẩm và áp dụng highlight viền sáng 1.5s
        const currentView = (window.ShopVietState && window.ShopVietState.state && window.ShopVietState.state.currentView) || 'home';
        if (currentView === 'home') {
          self.renderProducts();

          // Kích hoạt hiệu ứng highlight viền sáng (ring glow transition 1.5s)
          setTimeout(function () {
            self.highlightProductCards();
          }, 80);
        } else {
          // Đánh dấu pending để khi user quay lại trang chủ sẽ thấy highlight
          window._shopviet_pending_highlight = true;
        }
      });
    },

    /**
     * Kích hoạt hiệu ứng icon mây xoay tít và pill nháy sáng hiệu ứng xanh ngọc (emerald glow) trên Header
     */
    triggerHeaderLivePulse: function () {
      const syncBtn = document.getElementById('header-sync-btn');
      const syncIcon = document.getElementById('cloudSyncHeaderIcon');
      if (syncBtn) {
        syncBtn.classList.add(
          'ring-4',
          'ring-emerald-400/60',
          'bg-emerald-100/90',
          'dark:bg-emerald-900/80',
          'scale-105',
          'shadow-lg',
          'shadow-emerald-500/25'
        );
        if (syncIcon) {
          syncIcon.classList.add('animate-spin');
        }
        setTimeout(function () {
          syncBtn.classList.remove(
            'ring-4',
            'ring-emerald-400/60',
            'bg-emerald-100/90',
            'dark:bg-emerald-900/80',
            'scale-105',
            'shadow-lg',
            'shadow-emerald-500/25'
          );
          if (syncIcon) {
            syncIcon.classList.remove('animate-spin');
          }
        }, 1800);
      }
    },

    /**
     * Hiển thị toast thông báo tinh tế hoặc notification badge nhỏ
     */
    showRealtimeUpdateToast: function (message) {
      const msg = message || '🔔 Admin vừa cập nhật dữ liệu cửa hàng thời gian thực!';
      let toast = document.getElementById('shopviet-realtime-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'shopviet-realtime-toast';
        toast.className = 'fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/95 dark:bg-slate-800/95 text-white border border-emerald-500/50 shadow-2xl shadow-emerald-500/20 backdrop-blur-md transform transition-all duration-500 translate-y-12 opacity-0 pointer-events-none select-none';
        document.body.appendChild(toast);
      }

      toast.innerHTML = `
        <span class="relative flex h-3 w-3 shrink-0">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
        </span>
        <div class="flex items-center gap-2">
          <span class="text-xs sm:text-sm font-semibold tracking-tight text-emerald-300">${msg}</span>
        </div>
      `;

      requestAnimationFrame(function () {
        toast.classList.remove('translate-y-12', 'opacity-0', 'pointer-events-none');
        toast.classList.add('translate-y-0', 'opacity-100');
      });

      if (toast._timer) clearTimeout(toast._timer);
      toast._timer = setTimeout(function () {
        toast.classList.add('translate-y-12', 'opacity-0', 'pointer-events-none');
        toast.classList.remove('translate-y-0', 'opacity-100');
      }, 3500);

      if (window.ShopVietState && typeof window.ShopVietState.showToast === 'function') {
        window.ShopVietState.showToast(msg, 'success');
      }
    },

    /**
     * Thêm hiệu ứng highlight viền sáng (ring glow transition 1.5s) cho các thẻ sản phẩm
     */
    highlightProductCards: function () {
      const cards = document.querySelectorAll('[data-product-card="true"], #productListGrid > div');
      if (!cards || cards.length === 0) return;

      cards.forEach(function (card) {
        card.classList.add(
          'ring-2',
          'ring-emerald-400',
          'dark:ring-emerald-500',
          'shadow-xl',
          'shadow-emerald-500/30',
          'scale-[1.01]'
        );
      });

      setTimeout(function () {
        cards.forEach(function (card) {
          card.classList.remove(
            'ring-2',
            'ring-emerald-400',
            'dark:ring-emerald-500',
            'shadow-xl',
            'shadow-emerald-500/30',
            'scale-[1.01]'
          );
        });
      }, 1500);
    },

    /**
     * Kích hoạt thủ công sự kiện shopviet_realtime_update
     */
    triggerRealtimeUpdate: function (detail) {
      window.dispatchEvent(new CustomEvent('shopviet_realtime_update', { detail: detail || {} }));
    },

    /**
     * Lucian UX/UI Prompt #257 · Drag-to-resize responsive preview engine
     * MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#257
     */
    initLucian257: function () {
      var root = document.getElementById('lucian257Simulator') || document.querySelector('.u257');
      if (!root) return;
      if (root._u257_init) return;
      root._u257_init = true;

      var sg = root.querySelector('.u257-sg'),
          px = root.querySelector('.u257-px'),
          ru = root.querySelector('.u257-ru'),
          st = root.querySelector('.u257-st'),
          fr = root.querySelector('.u257-fr'),
          hd = root.querySelector('.u257-hd');

      if (!sg || !px || !ru || !st || !fr || !hd) return;

      var DV = [['Desktop', 1280], ['Tablet', 768], ['Mobile', 390]];
      var IC = [
        '<rect x="1.5" y="2.5" width="12" height="8" rx="1.3" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M5 13.5h5M7.5 10.5v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
        '<rect x="3" y="1.5" width="9" height="12" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M6.5 11.5h2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
        '<rect x="4.5" y="1.5" width="6" height="12" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M6.8 11.5h1.4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>'
      ];
      var MIN = 320, MAX = 1440, W = 312 - 18, WMIN = 108, BP = [[640, 'sm'], [768, 'md'], [1024, 'lg'], [1280, 'xl']];
      function toPx(v) { return WMIN + (v - MIN) / (MAX - MIN) * (W - WMIN); }
      function toV(p) { return MIN + (p - WMIN) / (W - WMIN) * (MAX - MIN); }

      sg.innerHTML = '';
      ru.innerHTML = '';

      var B = DV.map(function (d, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'u257-dv';
        b.setAttribute('aria-label', d[0] + ' (' + d[1] + 'px)');
        b.setAttribute('title', d[0] + ' ' + d[1] + 'px');
        b.innerHTML = '<svg viewBox="0 0 15 15" aria-hidden="true">' + IC[i] + '</svg>';
        b.addEventListener('click', function () { set(d[1]); });
        sg.appendChild(b);
        return b;
      });

      var R = BP.map(function (b) {
        var t = document.createElement('i');
        t.style.left = toPx(b[0]) + 'px';
        t.textContent = b[1];
        ru.appendChild(t);
        return t;
      });

      var v = 1280, zone = -1;
      function zoneOf(x) {
        var z = 0;
        BP.forEach(function (b, i) { if (x >= b[0]) z = i + 1; });
        return z;
      }

      function set(nv) {
        v = Math.max(MIN, Math.min(MAX, Math.round(nv)));
        var p = toPx(v);
        fr.style.width = p + 'px';
        hd.style.left = p + 'px';
        px.textContent = v + 'px';
        hd.setAttribute('aria-valuenow', v);
        B.forEach(function (b, i) {
          b.setAttribute('aria-pressed', DV[i][1] === v ? 'true' : 'false');
        });
        var z = zoneOf(v);
        if (zone >= 0 && z !== zone) {
          var t = R[Math.min(z, zone)];
          if (t) {
            t.classList.remove('is-flash');
            void t.offsetWidth;
            t.classList.add('is-flash');
          }
        }
        zone = z;
      }

      var drag = null;
      hd.addEventListener('pointerdown', function (e) {
        var r = st.getBoundingClientRect();
        drag = { k: (r.width > 0 ? st.offsetWidth / r.width : 1), left: r.left };
        fr.classList.add('is-drag');
        hd.classList.add('is-drag');
        try { hd.setPointerCapture(e.pointerId); } catch (er) {}
      });

      hd.addEventListener('pointermove', function (e) {
        if (!drag) return;
        set(toV((e.clientX - drag.left) * drag.k));
      });

      function up() {
        drag = null;
        fr.classList.remove('is-drag');
        hd.classList.remove('is-drag');
      }
      hd.addEventListener('pointerup', up);
      hd.addEventListener('pointercancel', up);

      hd.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 40 : e.key === 'ArrowLeft' ? -40 : 0;
        if (d) {
          e.preventDefault();
          set(v + d);
        }
      });

      set(1280);
    },
    renderSafeProductImage: renderSafeProductImage
  };

  // Expose helper and Lucian #257 to global views namespace
  if (typeof window !== 'undefined') {
    window.ShopVietViews.renderSafeProductImage = renderSafeProductImage;
    window.Lucian257 = {
      init: function () {
        if (window.ShopVietViews && window.ShopVietViews.home && typeof window.ShopVietViews.home.initLucian257 === 'function') {
          window.ShopVietViews.home.initLucian257();
        }
      }
    };
  }

  // Tự động kích hoạt listener toàn cục ngay khi nạp file
  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        if (window.ShopVietViews && window.ShopVietViews.home) {
          if (typeof window.ShopVietViews.home.initRealtimeListener === 'function') {
            window.ShopVietViews.home.initRealtimeListener();
          }
          if (typeof window.ShopVietViews.home.initLucian257 === 'function') {
            window.ShopVietViews.home.initLucian257();
          }
        }
      });
    } else {
      setTimeout(function () {
        if (window.ShopVietViews && window.ShopVietViews.home) {
          if (typeof window.ShopVietViews.home.initRealtimeListener === 'function') {
            window.ShopVietViews.home.initRealtimeListener();
          }
          if (typeof window.ShopVietViews.home.initLucian257 === 'function') {
            window.ShopVietViews.home.initLucian257();
          }
        }
      }, 0);
    }
  }

})();
