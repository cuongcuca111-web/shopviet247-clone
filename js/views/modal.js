/**
 * Shopviet247 - Quick Buy Modal View Module
 * Popup Mua Nhanh chuẩn Clean SaaS UI, Backdrop Blur, Reactive Quantity & Live Subtotal
 */

window.ShopVietViews = window.ShopVietViews || {};

window.ShopVietViews.modal = (function () {
  'use strict';

  // Bộ chuẩn hóa mã Voucher / Coupon tương thích toàn diện iOS Smart Punctuation & Unicode
  const normalizeVoucherCode = (typeof window !== 'undefined' && window.ShopVietNormalizeVoucher)
    ? window.ShopVietNormalizeVoucher
    : function (str) {
        if (!str) return '';
        return String(str)
          .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-')
          .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '')
          .trim()
          .toUpperCase();
      };
  if (typeof window !== 'undefined' && !window.ShopVietNormalizeVoucher) {
    window.ShopVietNormalizeVoucher = normalizeVoucherCode;
  }

  let currentProduct = null;
  let currentQty = 1;
  let appliedVoucher = null; // Voucher đang áp dụng trong Modal Mua Nhanh
  let quickPayTimer = null;

  // Lắng nghe phím Escape để đóng modal tiện lợi
  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      window.ShopVietViews.modal.close();
    }
  }

  // Helper format tiền VNĐ
  function formatMoney(amount) {
    if (isNaN(amount) || amount === null || amount === undefined) return '0';
    return Number(amount).toLocaleString('vi-VN');
  }

  // Helper render an toàn ảnh đại diện sản phẩm (chống vỡ thẻ, chống tràn mã onerror và tương thích 100% SVG/WebP/PNG)
  function renderSafeProductImage(prod, imgClass, fallbackClass) {
    if (window.ShopVietViews && typeof window.ShopVietViews.renderSafeProductImage === 'function') {
      return window.ShopVietViews.renderSafeProductImage(prod, imgClass, fallbackClass);
    }
    imgClass = imgClass || 'w-full h-full object-cover rounded-2xl';
    fallbackClass = fallbackClass || 'relative z-10 w-10 h-10 flex items-center justify-center';
    if (!prod) return '';
    const iconSvg = (window.ShopVietData && typeof window.ShopVietData.getBrandIcon === 'function')
      ? window.ShopVietData.getBrandIcon(prod.iconType)
      : '';

    let rawUrl = (prod.imageUrl || '').trim();
    if (!rawUrl) {
      return `<div class="${fallbackClass}">${iconSvg}</div>`;
    }

    if (rawUrl.startsWith('<svg') || rawUrl.startsWith('<?xml')) {
      return `<div class="${fallbackClass} overflow-hidden">${rawUrl}</div>`;
    }

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

  // Helper nạp động cấu hình VietQR từ Portal Admin (Mặc định: Sacombank 100071864927 LE BUI MINH CUONG)
  function getActiveVietQRConfig() {
    if (window.ShopVietState && typeof window.ShopVietState.getVietQRConfig === 'function') {
      return window.ShopVietState.getVietQRConfig();
    }
    if (window.ShopVietViews && window.ShopVietViews.admin && typeof window.ShopVietViews.admin.getVietQRConfig === 'function') {
      return window.ShopVietViews.admin.getVietQRConfig();
    }
    try {
      const saved = localStorage.getItem('shopviet_vietqr_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      bankId: '970403',
      bin: '970403',
      bankName: 'Sacombank (Ngân hàng TMCP Sài Gòn Thương Tín)',
      shortName: 'Sacombank',
      accountNumber: '100071864927',
      accountName: 'LE BUI MINH CUONG',
      memoPrefix: 'SHOPVIET',
      brandColor: '#004b91'
    };
  }

  // Helper sao chép clipboard
  function copyToClipboard(text, label) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(text).then(() => {
        if (window.ShopVietState && typeof window.ShopVietState.showToast === 'function') {
          window.ShopVietState.showToast(`Đã sao chép ${label || 'nội dung'}: ${text}`, 'success');
        }
      }).catch(() => {
        fallbackCopy(text, label);
      });
    } else {
      fallbackCopy(text, label);
    }
  }

  function fallbackCopy(text, label) {
    const tempInput = document.createElement('textarea');
    tempInput.value = text;
    tempInput.style.position = 'fixed';
    tempInput.style.opacity = '0';
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
      document.execCommand('copy');
      if (window.ShopVietState && typeof window.ShopVietState.showToast === 'function') {
        window.ShopVietState.showToast(`Đã sao chép ${label || 'nội dung'}: ${text}`, 'success');
      }
    } catch (err) {
      console.warn('Copy error:', err);
    }
    document.body.removeChild(tempInput);
  }

  // Dọn dẹp timer đếm ngược thanh toán
  function clearPaymentTimer() {
    if (quickPayTimer) {
      clearInterval(quickPayTimer);
      quickPayTimer = null;
    }
  }

  // Helper gradient theo iconType
  function getGradientClass(iconType) {
    const gradients = {
      cursor: 'from-slate-950 via-indigo-950 to-indigo-900 border-indigo-800/40',
      gemini: 'from-slate-950 via-blue-950 to-blue-900 border-blue-800/40',
      antigravity: 'from-slate-950 via-purple-950 to-indigo-950 border-purple-800/40',
      veo: 'from-slate-950 via-rose-950 to-amber-950 border-rose-800/40',
      chatgpt: 'from-slate-950 via-emerald-950 to-teal-900 border-emerald-800/40',
      claude: 'from-slate-950 via-amber-950 to-orange-950 border-amber-800/40',
      api: 'from-slate-950 via-amber-950 to-orange-950 border-amber-800/40',
      canva: 'from-slate-950 via-cyan-950 to-sky-900 border-cyan-800/40',
      capcut: 'from-slate-950 via-pink-950 to-rose-900 border-pink-800/40',
      copilot: 'from-slate-950 via-purple-950 to-indigo-950 border-purple-800/40',
      server: 'from-slate-950 via-slate-900 to-emerald-950 border-emerald-800/40'
    };
    return gradients[iconType] || 'from-slate-950 via-indigo-950 to-slate-900 border-slate-800';
  }

  return {
    // Mở Quick Buy Modal (chấp nhận object Product hoặc string ID)
    open: function (productOrId) {
      if (!productOrId) return;

      if (typeof productOrId === 'string') {
        currentProduct = window.ShopVietData ? window.ShopVietData.getProductById(productOrId) : null;
      } else {
        currentProduct = productOrId;
      }

      if (!currentProduct) {
        if (window.ShopVietState) {
          window.ShopVietState.showToast('Không tìm thấy thông tin sản phẩm!', 'error');
        }
        return;
      }

      currentQty = 1;
      appliedVoucher = null;
      if (window.ShopVietState) {
        window.ShopVietState.appliedQuickBuyVoucher = null;
      }
      const modalMount = document.getElementById('modalMount');
      if (!modalMount) return;

      const isOutOfStock = currentProduct.status === 'out_of_stock' || currentProduct.stock <= 0;
      const isLowStock = currentProduct.status === 'low_stock' || currentProduct.stock <= 5;
      const gradient = getGradientClass(currentProduct.iconType);

      modalMount.innerHTML = `
        <!-- BACKDROP BLUR OVERLAY -->
        <div 
          id="quickBuyBackdrop" 
          class="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity animate-fade-in"
          onclick="if(event.target === this) ShopVietViews.modal.close()"
        >
          <!-- MODAL CONTAINER CARD -->
          <div 
            class="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden transform transition-all animate-slide-up flex flex-col"
            onclick="event.stopPropagation()"
          >
            
            <!-- HEADER MODAL -->
            <div class="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 flex items-center justify-center">
                  <svg class="w-5 h-5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                </span>
                <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Mua nhanh sản phẩm
                </h3>
              </div>

              <!-- Close Button -->
              <button 
                type="button" 
                onclick="ShopVietViews.modal.close()" 
                class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Đóng (Esc)"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <!-- BODY MODAL -->
            <div class="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              
              <!-- THÔNG TIN SẢN PHẨM (ĐỒNG BỘ CHUẨN XÁC THEO CARD SẢN PHẨM ẢNH 4) -->
              <div class="flex items-start gap-3.5 p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                <!-- Square Thumbnail Chuẩn Sang Trọng Như Card Ảnh 4 (Nền trắng/dark, bo góc 2xl, đổ bóng tinh tế) -->
                <div class="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-md flex items-center justify-center ${currentProduct.imageUrl ? 'p-0' : 'p-2.5'} shrink-0 overflow-hidden relative group">
                  ${renderSafeProductImage(currentProduct, 'w-full h-full object-cover rounded-2xl', 'relative z-10 w-10 h-10 flex items-center justify-center')}
                </div>

                <!-- Title, Badges & Price -->
                <div class="flex-1 min-w-0">
                  <h4 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                    ${currentProduct.name}
                  </h4>

                  <!-- Badges: Badge Giảm Giá, Badge Bán Chạy Nhất & Tình Trạng Hàng -->
                  <div class="flex flex-wrap items-center gap-1.5 mt-1.5">
                    ${currentProduct.discount ? `
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black rounded-full bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-xs">
                        <svg class="w-2.5 h-2.5 text-white shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                          <line x1="19" y1="5" x2="5" y2="19"/>
                          <circle cx="6.5" cy="6.5" r="2.5" fill="currentColor"/>
                          <circle cx="17.5" cy="17.5" r="2.5" fill="currentColor"/>
                        </svg>
                        <span>${currentProduct.discount}</span>
                      </span>
                    ` : `
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black rounded-full bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-xs">
                        <span>-68%</span>
                      </span>
                    `}

                    ${currentProduct.badge ? `
                      <span class="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-amber-500 text-white shadow-xs uppercase tracking-wider flex items-center gap-1">
                        <svg class="w-3 h-3 text-yellow-100 fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                        <span>${currentProduct.badge}</span>
                      </span>
                    ` : ''}

                    ${isOutOfStock ? `
                      <span class="px-2 py-0.5 rounded-md bg-rose-50 text-rose-500 dark:bg-rose-950/60 dark:text-rose-400 text-[10px] font-bold border border-rose-200/60 dark:border-rose-800/50">
                        Hết hàng
                      </span>
                    ` : isLowStock ? `
                      <span class="px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 text-[10px] font-bold border border-amber-200/60 dark:border-amber-800/50">
                        Sắp hết hàng
                      </span>
                    ` : ''}
                  </div>

                  <!-- Giá bán & Giá gốc gạch ngang chuẩn xác Ảnh 4 -->
                  <div class="mt-2 flex items-baseline gap-2">
                    <span class="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400">
                      ${window.ShopVietState ? window.ShopVietState.formatCurrency(currentProduct.price || 19000) : `${(currentProduct.price || 19000).toLocaleString('vi-VN')} đ`}
                    </span>
                    <span class="line-through text-slate-400 text-xs sm:text-sm font-semibold">
                      ${window.ShopVietState ? window.ShopVietState.formatCurrency(currentProduct.oldPrice || 59000) : `${(currentProduct.oldPrice || 59000).toLocaleString('vi-VN')} đ`}
                    </span>
                  </div>
                </div>
              </div>

              <!-- DÒNG TRẠNG THÁI TỒN KHO & BẢO HÀNH CAO CẤP -->
              <div class="flex items-center justify-between text-xs py-1.5 px-1 flex-wrap gap-2">
                <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${isOutOfStock ? 'bg-rose-500/10 text-rose-500 border border-rose-500/25' : isLowStock ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'} shadow-2xs">
                  <span class="relative flex h-2 w-2">
                    <span class="${isOutOfStock ? '' : 'animate-ping'} absolute inline-flex h-full w-full rounded-full ${isOutOfStock ? 'bg-rose-400' : isLowStock ? 'bg-amber-400' : 'bg-emerald-400'} opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2 w-2 ${isOutOfStock ? 'bg-rose-500' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500'}"></span>
                  </span>
                  <span>Tình trạng: ${isOutOfStock ? 'Tạm hết slot' : `Còn ${currentProduct.stock || 110} slot sẵn sàng`}</span>
                </span>
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <svg class="w-3.5 h-3.5 text-emerald-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <path d="m9 12 2 2 4-4"/>
                  </svg>
                  <span>${currentProduct.warranty || 'Bảo hành chính chủ 1 đổi 1'}</span>
                </span>
              </div>

              <!-- HƯỚNG DẪN NHẬN HÀNG TỰ ĐỘNG -->
              <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2.5">
                <span class="text-amber-500 shrink-0 mt-0.5">
                  <svg class="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                </span>
                <p class="leading-relaxed">
                  Tài khoản hoặc Key kích hoạt sẽ được cấp <strong class="text-slate-700 dark:text-slate-300">ngay trên màn hình và gửi qua email</strong> trong vòng 30 giây sau khi quét mã VietQR thành công.
                </p>
              </div>

              <!-- BỘ CHỌN SỐ LƯỢNG -->
              ${!isOutOfStock ? `
                <div class="pt-2 pb-1 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <div>
                    <label class="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Số lượng
                    </label>
                    <span class="text-[11px] text-slate-400">Tối đa ${currentProduct.stock} gói</span>
                  </div>

                  <div class="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow-xs">
                    <button 
                      type="button" 
                      id="modalBtnMinus"
                      onclick="ShopVietViews.modal.updateQty(-1)" 
                      class="w-9 h-9 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition font-bold text-base cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      –
                    </button>
                    <input 
                      type="number" 
                      id="modalQtyInput" 
                      value="${currentQty}" 
                      min="1" 
                      max="${currentProduct.stock}" 
                      onchange="ShopVietViews.modal.setQty(this.value)" 
                      class="w-12 h-9 text-center bg-transparent text-sm font-bold text-slate-900 dark:text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button 
                      type="button" 
                      id="modalBtnPlus"
                      onclick="ShopVietViews.modal.updateQty(1)" 
                      class="w-9 h-9 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition font-bold text-base cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>
                </div>

                <!-- Ô NHẬP MÃ GIẢM GIÁ / VOUCHER -->
                <div class="pt-2 pb-1 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                  <div class="flex items-center justify-between">
                    <label for="quickBuyVoucherInput" class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <svg class="w-3.5 h-3.5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                        <line x1="7" y1="7" x2="7.01" y2="7"/>
                      </svg>
                      <span>Mã giảm giá</span>
                    </label>
                  </div>
                  <div class="flex items-center gap-2">
                    <input 
                      type="text" 
                      id="quickBuyVoucherInput"
                      autocapitalize="characters"
                      autocomplete="off"
                      autocorrect="off"
                      spellcheck="false"
                      oninput="this.value = window.ShopVietNormalizeVoucher ? window.ShopVietNormalizeVoucher(this.value) : this.value.toUpperCase();" 
                      placeholder="" 
                      class="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 font-mono text-xs uppercase font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      onkeydown="if(event.key==='Enter'){event.preventDefault();ShopVietViews.modal.applyVoucherInQuickBuy();}"
                    />
                    <button 
                      type="button" 
                      id="quickBuyVoucherBtn"
                      onclick="ShopVietViews.modal.applyVoucherInQuickBuy()" 
                      class="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shrink-0 shadow-xs active:scale-95 cursor-pointer"
                    >
                      Áp dụng
                    </button>
                  </div>
                  <div id="quickBuyVoucherMsg" class="text-[11px] font-medium hidden"></div>
                </div>

                <!-- HIỂN THỊ TỔNG TẠM TÍNH -->
                <div class="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between">
                  <span class="text-xs font-semibold text-slate-600 dark:text-slate-300">Tổng tạm tính:</span>
                  <div id="modalTotalPrice" class="text-right">
                    <span class="text-lg font-black text-indigo-600 dark:text-indigo-400">
                      ${window.ShopVietState ? window.ShopVietState.formatCurrency(currentProduct.price * currentQty) : `${(currentProduct.price * currentQty).toLocaleString('vi-VN')} đ`}
                    </span>
                  </div>
                </div>
              ` : `
                <div class="py-4 text-center p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40 text-xs font-semibold text-rose-600 dark:text-rose-400">
                  Sản phẩm này hiện đang tạm hết slot. Vui lòng quay lại sau hoặc liên hệ hỗ trợ để được ưu tiên bổ sung.
                </div>
              `}

            </div>

            <!-- FOOTER MODAL (CHIA 2 NÚT NGANG NHAU) -->
            <div class="px-5 py-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
              ${isOutOfStock ? `
                <button 
                  type="button" 
                  onclick="ShopVietViews.modal.close()" 
                  class="w-full py-2.5 px-4 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-sm cursor-pointer hover:bg-slate-300 transition"
                >
                  Đóng cửa sổ
                </button>
              ` : `
                <div class="grid grid-cols-2 gap-3">
                  <!-- Nút 1: Thêm Vào Giỏ -->
                  <button 
                    type="button" 
                    onclick="ShopVietViews.modal.handleAddToCart()" 
                    class="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-semibold py-2.5 px-4 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-750 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                      <path d="M3 6h18"/>
                      <path d="M16 10a4 4 0 0 1-8 0"/>
                    </svg>
                    <span>Thêm vào giỏ</span>
                  </button>

                  <!-- Nút 2: Mua Ngay -->
                  <button 
                    type="button" 
                    onclick="ShopVietViews.modal.handleBuyNow()" 
                    class="bg-slate-900 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500 text-sm font-semibold py-2.5 px-4 rounded-xl hover:bg-slate-800 flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    <span>Mua ngay</span>
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
              `}
            </div>

          </div>
        </div>
      `;

      // Bắt đầu lắng nghe bàn phím
      if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
        window.addEventListener('keydown', handleKeyDown);
      }
      this.refreshQtyUI();
    },

    // Cập nhật số lượng bằng phím +/-
    updateQty: function (delta) {
      if (!currentProduct) return;
      const maxStock = currentProduct.stock || 99;
      currentQty = Math.max(1, Math.min(maxStock, currentQty + delta));
      this.refreshQtyUI();
    },

    // Đặt số lượng từ ô input
    setQty: function (val) {
      if (!currentProduct) return;
      const maxStock = currentProduct.stock || 99;
      let parsed = parseInt(val, 10);
      if (isNaN(parsed) || parsed < 1) parsed = 1;
      if (parsed > maxStock) parsed = maxStock;
      currentQty = parsed;
      this.refreshQtyUI();
    },

    // Làm mới UI số lượng và giá tạm tính
    refreshQtyUI: function () {
      const input = document.getElementById('modalQtyInput');
      const totalEl = document.getElementById('modalTotalPrice');
      const btnMinus = document.getElementById('modalBtnMinus');
      const btnPlus = document.getElementById('modalBtnPlus');

      if (input) input.value = currentQty;

      if (currentProduct && totalEl) {
        const subtotal = currentProduct.price * currentQty;
        if (appliedVoucher) {
          let discount = 0;
          if (appliedVoucher.percent) {
            discount = Math.round(subtotal * appliedVoucher.percent / 100);
          } else if (appliedVoucher.calculatedDiscount !== undefined) {
            discount = appliedVoucher.calculatedDiscount;
          } else {
            discount = appliedVoucher.value || appliedVoucher.amount || 0;
          }
          discount = Math.min(discount, subtotal);
          appliedVoucher.calculatedDiscount = discount;
          const finalPrice = Math.max(0, subtotal - discount);

          totalEl.innerHTML = `
            <div class="flex flex-col items-end">
              <div class="flex items-center gap-1.5">
                <span class="line-through text-slate-400 text-xs font-semibold">${formatMoney(subtotal)}đ</span>
                <span class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/70 px-1.5 py-0.5 rounded">- ${formatMoney(discount)}đ</span>
              </div>
              <span class="text-lg font-black text-emerald-600 dark:text-emerald-400">${formatMoney(finalPrice)}đ</span>
            </div>
          `;
        } else {
          const formatted = window.ShopVietState ? window.ShopVietState.formatCurrency(subtotal) : `${formatMoney(subtotal)} đ`;
          totalEl.innerHTML = `<span class="text-lg font-black text-indigo-600 dark:text-indigo-400">${formatted}</span>`;
        }
      }

      if (currentProduct) {
        const maxStock = currentProduct.stock || 99;
        if (btnMinus) btnMinus.disabled = currentQty <= 1;
        if (btnPlus) btnPlus.disabled = currentQty >= maxStock;
      }
    },

    // Áp dụng mã giảm giá trong Modal Mua Nhanh (Ảnh 4)
    applyVoucherInQuickBuy: async function () {
      const input = document.getElementById('quickBuyVoucherInput');
      const msgEl = document.getElementById('quickBuyVoucherMsg');
      const btn = document.getElementById('quickBuyVoucherBtn');
      const rawCode = input ? normalizeVoucherCode(input.value) : '';

      if (!rawCode) {
        if (msgEl) {
          msgEl.className = 'text-[11px] font-medium text-rose-500 block';
          msgEl.textContent = 'Vui lòng nhập mã giảm giá!';
        }
        return;
      }

      const originalBtnHtml = btn ? btn.innerHTML : 'Áp dụng';
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<svg class="w-3.5 h-3.5 animate-spin inline-block mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke-width="4" class="opacity-25"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg> <span>Đang kiểm tra...</span>`;
      }

      // JIT Realtime Fetch: Kéo trực tiếp voucher mới nhất từ Cloud qua GitHub raw với no-store cache
      try {
        const cloudUrl = 'https://raw.githubusercontent.com/cuongcuca111-web/shopviet247-clone/main/cloud-db.json?_t=' + Date.now();
        let cloudVouchers = null;
        try {
          const res = await fetch(cloudUrl, { cache: 'no-store' });
          if (res.ok) {
            const cloudData = await res.json();
            if (cloudData && Array.isArray(cloudData.vouchers)) {
              cloudVouchers = cloudData.vouchers;
            }
          }
        } catch (fetchErr) {
          console.warn('[Modal] JIT GitHub fetch error, fallback local:', fetchErr);
        }

        // Fallback đọc file local cloud-db.json nếu offline hoặc raw GitHub bị hạn chế
        if (!cloudVouchers) {
          try {
            const localRes = await fetch('./cloud-db.json?_t=' + Date.now(), { cache: 'no-store' });
            if (localRes.ok) {
              const localData = await localRes.json();
              if (localData && Array.isArray(localData.vouchers)) {
                cloudVouchers = localData.vouchers;
              }
            }
          } catch (localErr) {}
        }

        // Nếu Cloud DB có danh sách vouchers, gộp ngay vào danh sách local của window.ShopVietState
        if (cloudVouchers && window.ShopVietState) {
          const localVouchers = typeof window.ShopVietState.getVouchers === 'function' ? window.ShopVietState.getVouchers() : [];
          const merged = [...localVouchers];
          cloudVouchers.forEach(function (cv) {
            if (!cv || !cv.code) return;
            const cCode = cv.code.trim().toUpperCase();
            const idx = merged.findIndex(function (lv) {
              return lv && lv.code && lv.code.trim().toUpperCase() === cCode;
            });
            if (idx === -1) {
              merged.push(cv);
            } else {
              merged[idx] = Object.assign({}, merged[idx], cv);
            }
          });

          if (typeof window.ShopVietState.saveVouchers === 'function') {
            window.ShopVietState.saveVouchers(merged);
          } else {
            try {
              localStorage.setItem('shopviet_vouchers', JSON.stringify(merged));
            } catch (e) {}
          }
        }
      } catch (err) {
        console.warn('[Modal] JIT Realtime Fetch failed:', err);
      }

      // Kích hoạt thêm đồng bộ đồng thời từ Cloud REST API (nếu có)
      if (window.ShopVietState && typeof window.ShopVietState.syncAllFromCloud === 'function') {
        try {
          await window.ShopVietState.syncAllFromCloud(false);
        } catch (syncErr) {
          console.warn('[Modal] JIT syncAllFromCloud error:', syncErr);
        }
      }

      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalBtnHtml;
      }

      const vouchers = (window.ShopVietState && typeof window.ShopVietState.getVouchers === 'function')
        ? window.ShopVietState.getVouchers()
        : [];

      let v = vouchers.find(function (item) {
        return item && item.code && normalizeVoucherCode(item.code) === rawCode;
      });

      // Kiểm tra danh sách mã tĩnh bổ sung nếu không tìm thấy trong vouchers
      if (!v) {
        const staticVouchers = {
          'SV30P-XA8S': { code: 'SV30P-XA8S', type: 'percent_discount', percent: 30, isUsed: false, desc: 'Giảm 30% tổng đơn hàng' },
          'AI2026': { code: 'AI2026', type: 'percent_discount', percent: 15, isUsed: false, desc: 'Giảm 15% tổng đơn' },
          'HSSV': { code: 'HSSV', type: 'percent_discount', percent: 10, isUsed: false, desc: 'Ưu đãi sinh viên giảm 10%' },
          'SHOPVIET': { code: 'SHOPVIET', type: 'order_discount', value: 20000, isUsed: false, desc: 'Giảm 20.000đ cho đơn đầu' },
          'ANTIGRAVITY': { code: 'ANTIGRAVITY', type: 'percent_discount', percent: 20, isUsed: false, desc: 'Giảm 20% công cụ coding AI' }
        };
        if (staticVouchers[rawCode]) {
          v = staticVouchers[rawCode];
        }
      }

      if (!v) {
        if (msgEl) {
          msgEl.className = 'text-[11px] font-medium text-rose-500 dark:text-rose-400 block';
          msgEl.textContent = 'Mã giảm giá không hợp lệ hoặc không tồn tại!';
        }
        if (window.ShopVietState && typeof window.ShopVietState.showToast === 'function') {
          window.ShopVietState.showToast('Mã giảm giá không hợp lệ hoặc không tồn tại!', 'error');
        }
        return;
      }

      if (v.isUsed) {
        if (msgEl) {
          msgEl.className = 'text-[11px] font-medium text-rose-500 dark:text-rose-400 block';
          msgEl.textContent = 'Mã giảm giá này đã được sử dụng!';
        }
        if (window.ShopVietState && typeof window.ShopVietState.showToast === 'function') {
          window.ShopVietState.showToast('Mã giảm giá này đã được sử dụng!', 'error');
        }
        return;
      }

      const total = currentProduct ? currentProduct.price * currentQty : 0;
      let discountAmount = 0;
      let discountPercent = 0;

      const isPercent = v.type === 'percent_discount' || (v.percent !== undefined && v.percent !== null);
      if (isPercent) {
        discountPercent = parseInt(v.percent || v.value, 10) || 0;
        discountAmount = Math.round(total * (discountPercent / 100));
        v.percent = discountPercent;
      } else {
        const fixedVal = parseInt(v.value || v.amount, 10) || 0;
        discountAmount = Math.min(total, fixedVal);
      }

      const finalTotal = Math.max(0, total - discountAmount);

      appliedVoucher = Object.assign({}, v, {
        calculatedDiscount: discountAmount,
        discountAmount: discountAmount,
        finalTotal: finalTotal
      });

      // Lưu trạng thái voucher Mua Nhanh vào window.ShopVietState
      if (window.ShopVietState) {
        window.ShopVietState.appliedQuickBuyVoucher = Object.assign({}, v, {
          discountAmount: discountAmount,
          finalTotal: finalTotal,
          subtotal: total
        });
        window.ShopVietState.currentVoucher = {
          code: v.code,
          amount: discountAmount,
          discountAmount: discountAmount,
          percent: discountPercent,
          ...v
        };
      }

      this.refreshQtyUI();

      const formatMoneyFn = (window.ShopVietData && typeof window.ShopVietData.formatMoney === 'function')
        ? window.ShopVietData.formatMoney
        : function (amt) { return Number(amt || 0).toLocaleString('vi-VN') + 'đ'; };

      if (msgEl) {
        msgEl.className = 'text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between gap-1 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 mt-1.5';
        const percentBadge = isPercent ? ` (-${discountPercent}%)` : '';
        msgEl.innerHTML = `
          <span class="flex items-center gap-1.5 min-w-0">
            <svg class="w-4 h-4 text-emerald-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <span class="truncate">Đã áp dụng mã <strong class="font-mono text-xs text-emerald-700 dark:text-emerald-300">${v.code}</strong>${percentBadge} - Tiết kiệm <strong class="text-emerald-700 dark:text-emerald-300 font-bold">${formatMoneyFn(discountAmount)}</strong>!</span>
          </span>
          <button type="button" onclick="ShopVietViews.modal.removeVoucherInQuickBuy()" class="text-rose-500 hover:text-rose-700 underline text-[10px] font-semibold cursor-pointer ml-2 shrink-0">Gỡ mã</button>
        `;
      }

      if (input) {
        input.disabled = true;
        input.classList.add('opacity-75', 'bg-slate-100', 'dark:bg-slate-800');
      }
      if (btn) {
        btn.disabled = true;
        btn.classList.add('opacity-50', 'cursor-not-allowed');
      }

      if (window.ShopVietState && typeof window.ShopVietState.showToast === 'function') {
        const toastMsg = isPercent 
          ? `✓ Áp dụng mã ${v.code} (-${discountPercent}%) thành công! Tiết kiệm ${formatMoneyFn(discountAmount)}`
          : `✓ Áp dụng mã ${v.code} thành công! Tiết kiệm ${formatMoneyFn(discountAmount)}`;
        window.ShopVietState.showToast(toastMsg, 'success');
      }
    },

    // Gỡ mã giảm giá trong Modal Mua Nhanh
    removeVoucherInQuickBuy: function () {
      appliedVoucher = null;
      if (window.ShopVietState) {
        window.ShopVietState.appliedQuickBuyVoucher = null;
        window.ShopVietState.currentVoucher = null;
      }
      const input = document.getElementById('quickBuyVoucherInput');
      const msgEl = document.getElementById('quickBuyVoucherMsg');
      const btn = document.getElementById('quickBuyVoucherBtn');
      if (input) {
        input.value = '';
        input.disabled = false;
        input.classList.remove('opacity-75', 'bg-slate-100', 'dark:bg-slate-800');
      }
      if (btn) {
        btn.disabled = false;
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
      }
      if (msgEl) {
        msgEl.className = 'hidden';
        msgEl.innerHTML = '';
      }
      this.refreshQtyUI();
      if (window.ShopVietState && typeof window.ShopVietState.showToast === 'function') {
        window.ShopVietState.showToast('Đã gỡ mã giảm giá', 'info');
      }
    },

    // Xử lý khi nhấn "Thêm vào giỏ"
    handleAddToCart: function () {
      if (!currentProduct) return;
      if (window.ShopVietState) {
        window.ShopVietState.addToCart(currentProduct.id, currentQty);
      }
      this.close();
    },

    // Xử lý khi nhấn "Mua ngay" - Mở trực tiếp Popup Thanh toán Sacombank VietQR động (Yêu cầu 5)
    handleBuyNow: function () {
      if (!currentProduct) return;

      const currentUser = window.ShopVietState && window.ShopVietState.state && window.ShopVietState.state.user;
      if (!currentUser || !currentUser.email) {
        // Khách chưa đăng nhập!
        if (currentProduct) {
          localStorage.setItem('shopviet_pending_purchase', JSON.stringify({
            productId: currentProduct.id,
            qty: currentQty || 1
          }));
        }
        if (window.ShopVietState && typeof window.ShopVietState.showToast === 'function') {
          window.ShopVietState.showToast('Vui lòng tạo tài khoản hoặc đăng nhập để tiếp tục thanh toán và nhận license key tự động!', 'warning');
        }
        this.close();
        if (window.ShopVietState && typeof window.ShopVietState.navigate === 'function') {
          window.ShopVietState.navigate('auth');
        }
        return;
      }

      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let suffix = '';
      for (let i = 0; i < 4; i++) {
        suffix += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const rawCode = `DJ2026${suffix}`; // Mã chuẩn đồng nhất: ví dụ DJ2026MERR
      const orderCode = `#${rawCode}`;    // Hiển thị có dấu #: #DJ2026MERR
      const memo = rawCode;               // Nội dung CK chính là rawCode: DJ2026MERR (ĐỒNG NHẤT 100%)

      // Nạp cấu hình VietQR động từ Portal Admin (Mặc định: Sacombank 100071864927 LE BUI MINH CUONG)
      const vietqrConfig = getActiveVietQRConfig();
      const subtotal = currentProduct.price * currentQty;
      let discount = 0;
      let voucherCode = null;

      const activeVoucher = appliedVoucher || (window.ShopVietState && window.ShopVietState.appliedQuickBuyVoucher);
      if (activeVoucher) {
        voucherCode = activeVoucher.code;
        if (activeVoucher.percent) {
          discount = Math.round(subtotal * (activeVoucher.percent / 100));
        } else if (activeVoucher.discountAmount !== undefined) {
          discount = activeVoucher.discountAmount;
        } else if (activeVoucher.calculatedDiscount !== undefined) {
          discount = activeVoucher.calculatedDiscount;
        } else {
          discount = activeVoucher.value || activeVoucher.amount || 0;
        }
        discount = Math.min(discount, subtotal);
      }

      const totalAmount = Math.max(0, subtotal - discount);
      const orderDate = new Date();

      const order = {
        id: orderCode,
        orderCode: orderCode,
        rawCode: rawCode,
        memo: memo,
        items: [{
          id: currentProduct.id,
          name: currentProduct.name,
          category: currentProduct.tag || currentProduct.category || 'AI Software',
          price: currentProduct.price,
          originalPrice: currentProduct.oldPrice || currentProduct.price,
          quantity: currentQty,
          iconType: currentProduct.iconType
        }],
        totalItems: currentQty,
        subtotal: subtotal,
        discount: discount,
        amount: totalAmount,
        voucherCode: voucherCode,
        appliedVoucher: voucherCode,
        paymentMethod: `${vietqrConfig.shortName || 'Sacombank'} (VietQR 24/7)`,
        bankName: vietqrConfig.bankName,
        accountNumber: vietqrConfig.accountNumber,
        accountName: vietqrConfig.accountName,
        bin: vietqrConfig.bin || vietqrConfig.bankId || '970403',
        createdAt: orderDate.toISOString(),
        createdAtFormatted: `${orderDate.getHours().toString().padStart(2, '0')}:${orderDate.getMinutes().toString().padStart(2, '0')} ${orderDate.getDate().toString().padStart(2, '0')}/${(orderDate.getMonth() + 1).toString().padStart(2, '0')}/${orderDate.getFullYear()}`,
        status: 'pending',
        expiresInSeconds: 600
      };

      // Đánh dấu mã voucher đã sử dụng trong hệ thống và đồng bộ ngay lên Cloud
      if (activeVoucher && window.ShopVietState && typeof window.ShopVietState.applyVoucher === 'function') {
        const userEmail = (currentUser && currentUser.email) || 'guest';
        window.ShopVietState.applyVoucher(activeVoucher.code, userEmail, orderCode);
        if (typeof window.ShopVietState.pushAllToCloud === 'function') {
          window.ShopVietState.pushAllToCloud().catch(console.warn);
        }
      }

      // Đặt lại appliedVoucher
      appliedVoucher = null;
      if (window.ShopVietState) {
        window.ShopVietState.appliedQuickBuyVoucher = null;
      }

      if (window.ShopVietState) {
        window.ShopVietState.currentOrder = order;
      }

      // Mở trực tiếp Popup Quét mã Sacombank VietQR kế thừa chuẩn bố cục Ảnh 4
      this.openPaymentModal(order);
    },

    // Helper tạo đối tượng đơn hàng hợp lệ chuẩn DJ... phục vụ 1-Click Checkout trực tiếp
    createOrder: function (product, qty, voucher) {
      if (!product) return null;
      qty = Math.max(1, parseInt(qty, 10) || 1);
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let suffix = '';
      for (let i = 0; i < 4; i++) {
        suffix += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const rawCode = `DJ2026${suffix}`;
      const orderCode = `#${rawCode}`;
      const memo = rawCode;
      const vietqrConfig = getActiveVietQRConfig();
      const subtotal = (product.price || 0) * qty;
      let discount = 0;
      let voucherCode = null;

      const activeVoucher = voucher || appliedVoucher || (window.ShopVietState && window.ShopVietState.appliedQuickBuyVoucher);
      if (activeVoucher) {
        voucherCode = activeVoucher.code;
        if (activeVoucher.percent) {
          discount = Math.round(subtotal * (activeVoucher.percent / 100));
        } else if (activeVoucher.discountAmount !== undefined) {
          discount = activeVoucher.discountAmount;
        } else if (activeVoucher.calculatedDiscount !== undefined) {
          discount = activeVoucher.calculatedDiscount;
        } else {
          discount = activeVoucher.value || activeVoucher.amount || 0;
        }
        discount = Math.min(discount, subtotal);
      }

      const totalAmount = Math.max(0, subtotal - discount);
      const orderDate = new Date();

      return {
        id: orderCode,
        orderCode: orderCode,
        rawCode: rawCode,
        memo: memo,
        items: [{
          id: product.id,
          name: product.name,
          category: product.tag || product.category || 'AI Software',
          price: product.price,
          originalPrice: product.oldPrice || product.price,
          quantity: qty,
          iconType: product.iconType
        }],
        totalItems: qty,
        subtotal: subtotal,
        discount: discount,
        amount: totalAmount,
        voucherCode: voucherCode,
        appliedVoucher: voucherCode,
        paymentMethod: `${vietqrConfig.shortName || 'Sacombank'} (VietQR 24/7)`,
        bankName: vietqrConfig.bankName,
        accountNumber: vietqrConfig.accountNumber,
        accountName: vietqrConfig.accountName,
        bin: vietqrConfig.bin || vietqrConfig.bankId || '970403',
        createdAt: orderDate.toISOString(),
        createdAtFormatted: `${orderDate.getHours().toString().padStart(2, '0')}:${orderDate.getMinutes().toString().padStart(2, '0')} ${orderDate.getDate().toString().padStart(2, '0')}/${(orderDate.getMonth() + 1).toString().padStart(2, '0')}/${orderDate.getFullYear()}`,
        status: 'pending',
        expiresInSeconds: 600
      };
    },

    // Mở trực tiếp Modal Thanh toán VietQR Động theo cấu hình Portal Admin
    openPaymentModal: function (order) {
      clearPaymentTimer();
      const modalMount = document.getElementById('modalMount');
      if (!modalMount) return;

      const vietqrConfig = getActiveVietQRConfig();
      const vietQrUrl = `https://api.vietqr.io/image/${vietqrConfig.bin || '970403'}-${vietqrConfig.accountNumber}-compact2.jpg?amount=${order.amount}&addInfo=${encodeURIComponent(order.memo)}&accountName=${encodeURIComponent(order.accountName)}`;

      modalMount.innerHTML = `
        <div id="quickPayBackdrop" class="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in" onclick="if(event.target === this) ShopVietViews.modal.close()">
          <div class="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl my-auto overflow-hidden animate-slide-up flex flex-col max-h-[92vh]" onclick="event.stopPropagation()">
            
            <!-- HEADER POPUP THANH TOÁN (ẢNH 4) -->
            <div class="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-[#004b91] text-white flex items-center justify-center shadow-md shadow-blue-900/20 shrink-0">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
                  </svg>
                </div>
                <div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <h3 class="text-base sm:text-lg font-black text-slate-900 dark:text-white">Thanh toán Mua Nhanh</h3>
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#004b91] border border-blue-200 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-800/60">
                      ${vietqrConfig.shortName || 'Sacombank'} VietQR
                    </span>
                    <span class="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      ${order.orderCode}
                    </span>
                  </div>
                  <p class="text-[11px] text-slate-500 mt-0.5">Tài khoản & Key kích hoạt sẽ được cấp tự động ngay trên màn hình trong 30 giây</p>
                </div>
              </div>

              <!-- Khu vực Đồng hồ & Nút Đóng -->
              <div class="flex items-center gap-3">
                <div class="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/50 border border-rose-200/80 dark:border-rose-900/60 px-3 py-1.5 rounded-xl text-rose-700 dark:text-rose-400">
                  <svg class="w-3.5 h-3.5 animate-spin text-rose-600" style="animation-duration: 3s;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke-width="2" stroke-dasharray="32" stroke-linecap="round"></circle>
                  </svg>
                  <div class="text-xs">
                    <span class="font-medium mr-1 hidden sm:inline">Hết hạn:</span>
                    <strong id="quickpay-countdown-timer" class="font-mono font-black text-xs sm:text-sm text-rose-700 dark:text-rose-400">09:59</strong>
                  </div>
                </div>

                <button type="button" onclick="ShopVietViews.modal.close()" class="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition" title="Đóng">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>

            <!-- BODY 2 CỘT CHUẨN BỐ CỤC ẢNH 4 -->
            <div id="quickpay-main-content" class="p-4 sm:p-6 overflow-y-auto space-y-6">
              <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                <!-- CỘT TRÁI (5 COLS): MÃ QR, 4 GÓC VIEWFINDER, LƯU ẢNH, 3 BƯỚC -->
                <div class="lg:col-span-5 space-y-4">
                  <div class="bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col items-center">
                    
                    <div class="w-full flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60 dark:border-slate-800 text-xs">
                      <div class="inline-flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        VietQR Chuẩn Napas 24/7
                      </div>
                      <span class="font-mono text-[11px] text-slate-400 font-semibold">BIN ${vietqrConfig.bin || '970403'}</span>
                    </div>

                    <!-- Khung ảnh QR có 4 góc ngắm Viewfinder Sacombank -->
                    <div class="relative p-3 bg-white rounded-2xl shadow-md border-2 border-slate-100 max-w-[240px] w-full">
                      <div class="absolute top-1.5 left-1.5 w-4 h-4 border-t-2 border-l-2 border-[#004b91] rounded-tl pointer-events-none"></div>
                      <div class="absolute top-1.5 right-1.5 w-4 h-4 border-t-2 border-r-2 border-[#004b91] rounded-tr pointer-events-none"></div>
                      <div class="absolute bottom-1.5 left-1.5 w-4 h-4 border-b-2 border-l-2 border-[#004b91] rounded-bl pointer-events-none"></div>
                      <div class="absolute bottom-1.5 right-1.5 w-4 h-4 border-b-2 border-r-2 border-[#004b91] rounded-br pointer-events-none"></div>

                      <div class="aspect-square w-full flex items-center justify-center overflow-hidden rounded-xl bg-white">
                        <img 
                          id="quickpay-qr-img" 
                          src="${vietQrUrl}" 
                          alt="VietQR ${vietqrConfig.shortName} - ${order.memo}" 
                          class="w-full h-full object-contain"
                        />
                      </div>
                    </div>

                    <button 
                      type="button" 
                      id="btn-quickpay-download-qr"
                      onclick="ShopVietViews.modal.downloadQr('${vietQrUrl}', '${order.orderCode}')" 
                      class="mt-3.5 w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                      <span>Lưu ảnh mã QR về máy</span>
                    </button>
                  </div>

                  <!-- 3 Bước thanh toán nhanh -->
                  <div class="bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
                    <h4 class="font-bold text-slate-700 dark:text-slate-300 uppercase text-[11px] tracking-wider">3 Bước Thanh Toán Nhanh</h4>
                    <p class="text-slate-500 leading-relaxed">
                      1. Mở App Ngân hàng bất kỳ (Sacombank, VCB, MB, MoMo...)<br>
                      2. Quét mã VietQR trên hoặc nhập STK <strong class="text-slate-800 dark:text-slate-200 font-mono">${vietqrConfig.accountNumber}</strong><br>
                      3. Xác nhận đúng người nhận <strong class="text-[#004b91] dark:text-blue-400">${vietqrConfig.accountName}</strong>.
                    </p>
                  </div>
                </div>

                <!-- CỘT PHẢI (7 COLS): BẢNG THÔNG TIN STK NẠP ĐỘNG TỪ PORTAL ADMIN & NÚT HÀNH ĐỘNG -->
                <div class="lg:col-span-7 space-y-4">
                  <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
                    
                    <!-- 1. Số tiền cần chuyển -->
                    <div class="p-3.5 sm:px-4 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40">
                      <div>
                        <span class="text-slate-600 dark:text-slate-400 font-medium block">Số tiền cần chuyển:</span>
                        ${order.discount > 0 ? `
                          <span class="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                            <svg class="w-3.5 h-3.5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                            <span>Đã áp dụng voucher <strong class="font-mono">${order.voucherCode || order.appliedVoucher || ''}</strong> (-${formatMoney(order.discount)}đ)</span>
                          </span>
                        ` : ''}
                      </div>
                      <div class="flex items-center gap-2">
                        <div class="text-right">
                          ${order.discount > 0 ? `<div class="text-[11px] text-slate-400 line-through">${formatMoney(order.subtotal)}đ</div>` : ''}
                          <span id="quickpay-display-amount" class="font-bold text-base sm:text-lg text-emerald-600 dark:text-emerald-400 font-mono">${formatMoney(order.amount)}đ</span>
                        </div>
                        <button type="button" id="btn-quickpay-copy-amount" onclick="ShopVietViews.modal.copyField('${order.amount}', 'Số tiền')" class="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer">Copy</button>
                      </div>
                    </div>

                    <!-- 2. Ngân hàng thụ hưởng -->
                    <div class="p-3.5 sm:px-4 flex items-center justify-between gap-3">
                      <span class="text-slate-600 dark:text-slate-400 font-medium">Ngân hàng thụ hưởng:</span>
                      <div class="flex items-center gap-2 text-right">
                        <span class="font-bold text-slate-900 dark:text-white">${vietqrConfig.bankName}</span>
                        <button type="button" onclick="ShopVietViews.modal.copyField('${vietqrConfig.bankName}', 'Ngân hàng')" class="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer">Copy</button>
                      </div>
                    </div>

                    <!-- 3. Số tài khoản (NẠP ĐỘNG TỪ PORTAL ADMIN) -->
                    <div class="p-3.5 sm:px-4 flex items-center justify-between gap-3 bg-slate-50/30 dark:bg-slate-800/30">
                      <span class="text-slate-600 dark:text-slate-400 font-medium">Số tài khoản (STK):</span>
                      <div class="flex items-center gap-2">
                        <span class="font-bold font-mono text-base text-slate-900 dark:text-white tracking-wider">${vietqrConfig.accountNumber}</span>
                        <button type="button" onclick="ShopVietViews.modal.copyField('${vietqrConfig.accountNumber}', 'Số tài khoản')" class="px-2 py-1 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer">Sao chép STK</button>
                      </div>
                    </div>

                    <!-- 4. Tên chủ tài khoản (NẠP ĐỘNG TỪ PORTAL ADMIN) -->
                    <div class="p-3.5 sm:px-4 flex items-center justify-between gap-3">
                      <span class="text-slate-600 dark:text-slate-400 font-medium">Tên chủ tài khoản:</span>
                      <div class="flex items-center gap-2">
                        <span class="font-bold text-slate-900 dark:text-white uppercase">${vietqrConfig.accountName}</span>
                        <button type="button" onclick="ShopVietViews.modal.copyField('${vietqrConfig.accountName}', 'Chủ tài khoản')" class="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer">Copy</button>
                      </div>
                    </div>

                    <!-- 5. Nội dung chuyển khoản -->
                    <div class="p-3.5 sm:px-4 flex items-center justify-between gap-3 bg-slate-50/30 dark:bg-slate-800/30">
                      <div>
                        <span class="text-slate-600 dark:text-slate-400 font-medium block">Nội dung chuyển khoản:</span>
                        <span class="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Bắt buộc nhập chính xác để kích hoạt tự động</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="font-mono font-bold text-slate-900 dark:text-white text-base">${order.memo}</span>
                        <button type="button" onclick="ShopVietViews.modal.copyField('${order.memo}', 'Nội dung chuyển khoản')" class="px-2 py-1 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer">Sao chép mã</button>
                      </div>
                    </div>

                  </div>

                  <!-- Hộp thông báo xử lý tự động & nhận kết quả chuẩn yêu cầu -->
                  <div class="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/30 text-white shadow-md relative overflow-hidden">
                    <div class="absolute -right-6 -bottom-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none"></div>
                    <div class="flex items-start gap-3 relative z-10">
                      <div class="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5 shadow-2xs">
                        <svg class="w-4 h-4 text-indigo-300 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14"/>
                        </svg>
                      </div>
                      <div class="text-xs space-y-1.5 leading-relaxed">
                        <p class="font-bold text-indigo-200">
                          Hệ thống sẽ tự động xử lý trong ít phút sau khi xác nhận thanh toán thành công.
                        </p>
                        <p class="text-slate-300 text-[11.5px] flex items-center gap-1.5 flex-wrap">
                          <svg class="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          <span>Hãy kiểm tra <button type="button" onclick="window.ShopVietViews.modal.close(); if(window.ShopVietState){window.ShopVietState.navigate('dashboard');}" class="text-white font-bold underline decoration-indigo-400 hover:text-indigo-200 cursor-pointer transition-colors">lịch sử mua hàng</button> để nhận kết quả.</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- Nút hành động thanh toán -->
                  <div class="pt-1">
                    <button 
                      type="button" 
                      id="btn-quickpay-confirm"
                      onclick="ShopVietViews.modal.confirmPaid('${order.orderCode}')" 
                      class="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                      <span>Tôi đã chuyển khoản thành công</span>
                    </button>
                  </div>

                </div>

              </div>
            </div>

            <!-- WAITING REVIEW STATE MODAL CONTAINER (Hiện khi khách bấm Tôi đã chuyển khoản) -->
            <div id="quickpay-waiting-container" class="hidden p-6 sm:p-8 text-center space-y-5 animate-slide-up">
              <div class="relative w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/20">
                <svg class="w-8 h-8 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-linecap="round"></circle>
                  <path d="M12 6v6l4 2"></path>
                </svg>
                <span class="absolute -top-1 -right-1 flex h-4 w-4">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-4 w-4 bg-amber-500 p-0.5 text-white items-center justify-center">
                    <svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  </span>
                </span>
              </div>

              <div>
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800 mb-2">
                  <svg class="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span>Đã ghi nhận thông tin chuyển khoản</span>
                </span>
                <h3 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Đơn Hàng Đang Chờ Phê Duyệt</h3>
                <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  Giao dịch của bạn đã được chuyển tới Ban quản trị Shopviet247. Đơn hàng sẽ được Admin đối soát với Sacombank và gửi đường link bản quyền riêng cho bạn sau ít phút!
                </p>
              </div>

              <!-- Chi tiết đơn chờ duyệt -->
              <div class="max-w-lg mx-auto p-4 rounded-2xl bg-amber-50/50 dark:bg-slate-800/60 border border-amber-200/80 dark:border-slate-700 text-left space-y-2.5">
                <div class="flex items-center justify-between text-xs pb-2 border-b border-amber-200/60 dark:border-slate-700">
                  <span class="text-slate-500">Mã đơn hàng:</span>
                  <span class="font-mono font-bold text-indigo-600 dark:text-indigo-400" id="waiting-order-code">${order.orderCode}</span>
                </div>
                <div class="flex items-center justify-between text-xs pb-2 border-b border-amber-200/60 dark:border-slate-700">
                  <span class="text-slate-500">Gói sản phẩm:</span>
                  <span class="font-bold text-slate-900 dark:text-white">${order.items[0] ? order.items[0].name : 'Công cụ AI Bản Quyền'}</span>
                </div>
                <div class="flex items-center justify-between text-xs pb-2 border-b border-amber-200/60 dark:border-slate-700">
                  <span class="text-slate-500">Tồn kho còn lại:</span>
                  <span class="font-bold text-amber-700 dark:text-amber-400 font-mono" id="waiting-product-stock">Đang cập nhật...</span>
                </div>
                <div class="flex items-center justify-between text-xs">
                  <span class="text-slate-500">Số tiền:</span>
                  <span class="font-bold text-emerald-600 dark:text-emerald-400">${window.ShopVietState ? window.ShopVietState.formatCurrency(order.amount) : order.amount + 'đ'}</span>
                </div>
              </div>

              <!-- 2 Nút hành động -->
              <div class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button 
                  type="button" 
                  onclick="ShopVietViews.modal.goToOrdersTab()" 
                  class="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Xem đơn hàng của tôi</span>
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
                <button 
                  type="button" 
                  onclick="ShopVietViews.modal.close()" 
                  class="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm rounded-xl transition cursor-pointer"
                >
                  <span>Đóng & Về trang chủ</span>
                </button>
              </div>
            </div>

            <!-- SUCCESS STATE MODAL CONTAINER (Ẩn ban đầu, hiện khi thành công) -->
            <div id="quickpay-success-container" class="hidden p-6 sm:p-8 text-center space-y-5 animate-slide-up">
              <div class="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 13l4 4L19 7"/>
                </svg>
              </div>

              <div>
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 mb-2">
                  <svg class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>Giao dịch đã khớp lệnh tức thì</span>
                </span>
                <h3 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Thanh Toán & Kích Hoạt Thành Công!</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Cảm ơn bạn đã tin tưởng dịch vụ tại Shopviet247</p>
              </div>

              <!-- Hộp bàn giao bản quyền / Key tự động -->
              <div class="max-w-lg mx-auto p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left space-y-3">
                <div class="flex items-center justify-between text-xs pb-2 border-b border-slate-200 dark:border-slate-700">
                  <span class="text-slate-500">Sản phẩm:</span>
                  <span class="font-bold text-slate-900 dark:text-white">${order.items[0] ? order.items[0].name : 'Công cụ AI Bản Quyền'}</span>
                </div>
                <div class="flex items-center justify-between text-xs pb-2 border-b border-slate-200 dark:border-slate-700">
                  <span class="text-slate-500">Mã đơn hàng:</span>
                  <span class="font-mono font-bold text-indigo-600 dark:text-indigo-400">${order.orderCode}</span>
                </div>
                <div class="space-y-1.5">
                  <span class="text-xs font-bold text-slate-700 dark:text-slate-300 block">Thông tin kích hoạt / License Key:</span>
                  <div class="flex items-center gap-2">
                    <input 
                      type="text" 
                      id="quickpay-license-key" 
                      readonly 
                      value="SV2026-KEY-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}" 
                      class="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 select-all"
                    />
                    <button 
                      type="button" 
                      onclick="ShopVietViews.modal.copyField(document.getElementById('quickpay-license-key').value, 'Key bản quyền')" 
                      class="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      Copy Key
                    </button>
                  </div>
                </div>
              </div>

              <!-- Nút điều hướng -->
              <div class="flex items-center justify-center gap-3 pt-2">
                <button 
                  type="button" 
                  onclick="ShopVietViews.modal.close(); window.ShopVietState.navigate('dashboard', { tab: 'orders' });" 
                  class="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500 text-xs font-bold transition shadow-sm"
                >
                  Xem Quản Lý Đơn Hàng
                </button>
                <button 
                  type="button" 
                  onclick="ShopVietViews.modal.close(); window.ShopVietState.navigate('home');" 
                  class="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
                >
                  Về Trang Chủ
                </button>
              </div>
            </div>

          </div>
        </div>
      `;

      // Bắt đầu đếm ngược 10:00
      this.startCountdown(600);
    },

    // Đếm ngược thời gian thanh toán
    startCountdown: function (seconds) {
      clearPaymentTimer();
      let left = seconds;
      const timerEl = document.getElementById('quickpay-countdown-timer');

      quickPayTimer = setInterval(() => {
        left--;
        if (left <= 0) {
          clearPaymentTimer();
          if (timerEl) timerEl.textContent = '00:00 (Hết hạn)';
          return;
        }
        const m = Math.floor(left / 60);
        const s = left % 60;
        if (timerEl) {
          timerEl.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
      }, 1000);
    },

    // Helper sao chép trường dữ liệu
    copyField: function (val, label) {
      copyToClipboard(val, label);
    },

    // Áp dụng mã giảm giá / Voucher ngay trên Popup thanh toán Sacombank
    applyCoupon: async function (orderCode) {
      const input = document.getElementById('quickpay-coupon-input');
      const msgEl = document.getElementById('quickpay-coupon-message');
      const rawCode = input ? normalizeVoucherCode(input.value) : '';

      if (!rawCode) {
        if (msgEl) {
          msgEl.className = 'text-[11px] font-medium text-rose-500 block';
          msgEl.textContent = 'Vui lòng nhập mã giảm giá!';
        }
        return;
      }

      // JIT Realtime Fetch: Kéo trực tiếp voucher mới nhất từ Cloud qua GitHub raw
      try {
        const cloudUrl = 'https://raw.githubusercontent.com/cuongcuca111-web/shopviet247-clone/main/cloud-db.json?_t=' + Date.now();
        let cloudVouchers = null;
        try {
          const res = await fetch(cloudUrl, { cache: 'no-store' });
          if (res.ok) {
            const cloudData = await res.json();
            if (cloudData && Array.isArray(cloudData.vouchers)) {
              cloudVouchers = cloudData.vouchers;
            }
          }
        } catch (fetchErr) {}

        if (!cloudVouchers) {
          try {
            const localRes = await fetch('./cloud-db.json?_t=' + Date.now(), { cache: 'no-store' });
            if (localRes.ok) {
              const localData = await localRes.json();
              if (localData && Array.isArray(localData.vouchers)) {
                cloudVouchers = localData.vouchers;
              }
            }
          } catch (localErr) {}
        }

        if (cloudVouchers && window.ShopVietState) {
          const localVouchers = typeof window.ShopVietState.getVouchers === 'function' ? window.ShopVietState.getVouchers() : [];
          const merged = [...localVouchers];
          cloudVouchers.forEach(function (cv) {
            if (!cv || !cv.code) return;
            const cCode = cv.code.trim().toUpperCase();
            const idx = merged.findIndex(function (lv) {
              return lv && lv.code && lv.code.trim().toUpperCase() === cCode;
            });
            if (idx === -1) {
              merged.push(cv);
            } else {
              merged[idx] = Object.assign({}, merged[idx], cv);
            }
          });
          if (typeof window.ShopVietState.saveVouchers === 'function') {
            window.ShopVietState.saveVouchers(merged);
          }
        }
      } catch (e) {}

      // JIT Cloud Sync: Đồng bộ danh sách voucher mới nhất từ Cloud REST API
      if (window.ShopVietState && typeof window.ShopVietState.syncAllFromCloud === 'function') {
        try {
          await window.ShopVietState.syncAllFromCloud(false);
        } catch (e) {}
      }

      const vouchers = (window.ShopVietState && typeof window.ShopVietState.getVouchers === 'function')
        ? window.ShopVietState.getVouchers()
        : [];

      let v = vouchers.find(function (item) {
        return item && item.code && normalizeVoucherCode(item.code) === rawCode;
      });

      if (!v) {
        const staticVouchers = {
          'SV30P-XA8S': { code: 'SV30P-XA8S', type: 'percent_discount', percent: 30, isUsed: false, desc: 'Giảm 30% tổng đơn hàng' },
          'AI2026': { code: 'AI2026', type: 'percent_discount', percent: 15, isUsed: false },
          'HSSV': { code: 'HSSV', type: 'percent_discount', percent: 10, isUsed: false },
          'SHOPVIET': { code: 'SHOPVIET', type: 'order_discount', value: 20000, isUsed: false },
          'ANTIGRAVITY': { code: 'ANTIGRAVITY', type: 'percent_discount', percent: 20, isUsed: false }
        };
        if (staticVouchers[rawCode]) v = staticVouchers[rawCode];
      }

      const currentOrder = window.ShopVietState ? window.ShopVietState.currentOrder : null;
      if (!currentOrder) {
        if (msgEl) {
          msgEl.className = 'text-[11px] font-medium text-rose-500 block';
          msgEl.textContent = 'Không tìm thấy đơn hàng cần áp dụng giảm giá!';
        }
        return;
      }

      // Kiểm tra voucher tồn tại, hợp lệ và chưa dùng
      if (v && !v.isUsed) {
        const subtotal = Number(currentOrder.subtotal || currentOrder.amount || 0);
        let discount = 0;
        let discountLabel = '';
        if (v.type === 'percent_discount' || (v.percent !== undefined && v.percent !== null)) {
          const p = parseInt(v.percent || v.value, 10) || 0;
          discount = Math.round((subtotal * p) / 100);
          discountLabel = `-${p}% (-${discount.toLocaleString('vi-VN')}đ)`;
        } else {
          const voucherVal = Number(v.value || v.amount || 0);
          discount = Math.min(voucherVal, subtotal);
          discountLabel = `-${discount.toLocaleString('vi-VN')}đ`;
        }
        const newAmount = Math.max(0, subtotal - discount);

        currentOrder.discount = discount;
        currentOrder.amount = newAmount;
        currentOrder.appliedVoucher = v.code;

        // Đánh dấu mã đã dùng và đồng bộ Cloud
        const userEmail = (window.ShopVietState.state && window.ShopVietState.state.user && window.ShopVietState.state.user.email) || 'guest';
        if (typeof window.ShopVietState.applyVoucher === 'function') {
          window.ShopVietState.applyVoucher(v.code, userEmail, orderCode);
        }
        if (typeof window.ShopVietState.pushAllToCloud === 'function') {
          window.ShopVietState.pushAllToCloud().catch(console.warn);
        }

        // Cập nhật số tiền hiển thị trên màn hình
        const displayAmountEl = document.getElementById('quickpay-display-amount');
        if (displayAmountEl) {
          displayAmountEl.innerHTML = `
            <span class="line-through text-slate-400 text-xs sm:text-sm mr-1.5 font-normal">${formatMoney(subtotal)}đ</span>
            <span>${formatMoney(newAmount)}đ</span>
          `;
        }

        // Cập nhật nút copy số tiền
        const copyAmountBtn = document.getElementById('btn-quickpay-copy-amount');
        if (copyAmountBtn) {
          copyAmountBtn.setAttribute('onclick', `ShopVietViews.modal.copyField('${newAmount}', 'Số tiền')`);
        }

        // Tự động tạo lại ảnh QR VietQR tương ứng với số tiền mới và cập nhật src của #quickpay-qr-img
        const vietqrConfig = getActiveVietQRConfig();
        const newQrUrl = `https://api.vietqr.io/image/${vietqrConfig.bin || '970403'}-${vietqrConfig.accountNumber}-compact2.jpg?amount=${newAmount}&addInfo=${encodeURIComponent(currentOrder.memo)}&accountName=${encodeURIComponent(currentOrder.accountName)}`;

        const qrImg = document.getElementById('quickpay-qr-img') || document.getElementById('quickpay-live-qr');
        if (qrImg) {
          qrImg.src = newQrUrl;
        }

        // Cập nhật nút tải ảnh QR
        const downloadBtn = document.getElementById('btn-quickpay-download-qr');
        if (downloadBtn) {
          downloadBtn.setAttribute('onclick', `ShopVietViews.modal.downloadQr('${newQrUrl}', '${currentOrder.orderCode}')`);
        }

        // Hiển thị thông báo màu xanh
        const formattedDiscount = (window.ShopVietState && typeof window.ShopVietState.formatCurrency === 'function')
          ? window.ShopVietState.formatCurrency(discount)
          : formatMoney(discount) + 'đ';

        if (msgEl) {
          msgEl.className = 'text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block';
          msgEl.textContent = `Đã áp dụng mã ${v.code}! Giảm ngay ${formattedDiscount}`;
        }

        if (input) {
          input.disabled = true;
          input.classList.add('opacity-75', 'bg-slate-100', 'dark:bg-slate-800');
        }

        // Hiển thị Toast thông báo thành công
        if (window.ShopVietState && typeof window.ShopVietState.showToast === 'function') {
          window.ShopVietState.showToast(`Đã áp dụng mã ${v.code}! Giảm ngay ${formattedDiscount}`, 'success');
        }
      } else {
        // Nếu mã không hợp lệ hoặc đã dùng
        if (msgEl) {
          msgEl.className = 'text-[11px] font-medium text-rose-500 dark:text-rose-400 block';
          msgEl.textContent = 'Mã giảm giá không tồn tại hoặc đã được sử dụng!';
        }
        if (window.ShopVietState && typeof window.ShopVietState.showToast === 'function') {
          window.ShopVietState.showToast('Mã giảm giá không tồn tại hoặc đã được sử dụng!', 'error');
        }
      }
    },

    // Helper tải ảnh QR
    downloadQr: function (url, orderCode) {
      const a = document.createElement('a');
      a.href = url;
      a.download = `VietQR_${orderCode || 'DonHang'}.jpg`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if (window.ShopVietState && typeof window.ShopVietState.showToast === 'function') {
        window.ShopVietState.showToast('Đang tải mã VietQR về thiết bị...', 'info');
      }
    },

    // Xác nhận đã thanh toán -> Đưa vào hàng đợi chờ Ban quản trị duyệt
    // Xác nhận đã thanh toán -> Đưa vào hàng đợi chờ Ban quản trị duyệt (Đẩy Cloud Đa Tầng 100%)
    confirmPaid: async function (orderCode) {
      const confirmBtn = document.getElementById('btn-quickpay-confirm');
      if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.classList.add('opacity-75', 'cursor-wait');
        confirmBtn.innerHTML = `
          <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="3" stroke-dasharray="32" stroke-linecap="round"></circle></svg>
          <span>Đang lưu giao dịch & đồng bộ Cloud...</span>
        `;
      }

      if (window.ShopVietState && typeof window.ShopVietState.showToast === 'function') {
        window.ShopVietState.showToast('Đang ghi nhận thông tin chuyển khoản & đồng bộ Cloud...', 'info');
      }

      await this.finishPaymentWaitingReview(orderCode);
    },

    // Xử lý hoàn tất trạng thái Chờ phê duyệt (Khi khách bấm "Tôi đã chuyển khoản")
    finishPaymentWaitingReview: async function (orderCode) {
      clearPaymentTimer();

      const order = window.ShopVietState ? window.ShopVietState.currentOrder : null;
      let updatedStock = null;

      if (order) {
        order.status = 'pending_review';
        order.statusText = 'Chờ duyệt';
        order.submittedAt = new Date().toISOString();
        const userEmail = (window.ShopVietState.state && window.ShopVietState.state.user && window.ShopVietState.state.user.email) || 'Khách vãng lai';
        order.userEmail = userEmail;

        // Tự động trừ số lượng còn hàng (stock) của sản phẩm
        if (!order.stockDeducted && order.items && order.items.length > 0) {
          order.stockDeducted = true;
          const boughtItem = order.items[0];
          const prodId = boughtItem.id;
          const buyQty = Number(boughtItem.quantity) || 1;

          window.ShopVietData = window.ShopVietData || {};
          window.ShopVietData.products = window.ShopVietData.products || [];

          let targetProd = window.ShopVietData.products.find(p => p.id === prodId);
          if (!targetProd && boughtItem.name) {
            targetProd = window.ShopVietData.products.find(p => p.name === boughtItem.name);
          }

          if (targetProd) {
            const currentStock = typeof targetProd.stock === 'number' ? targetProd.stock : parseInt(targetProd.stock, 10) || 100;
            const newStock = Math.max(0, currentStock - buyQty);
            targetProd.stock = newStock;
            updatedStock = newStock;
            if (newStock === 0) {
              targetProd.status = 'out_of_stock';
            } else if (newStock <= 5) {
              targetProd.status = 'low_stock';
            }

            // 1. Lưu đồng bộ vào TẤT CẢ các key LocalStorage
            const jsonStr = JSON.stringify(window.ShopVietData.products);
            try {
              localStorage.setItem('shopviet_custom_products', jsonStr);
              localStorage.setItem('shopviet_admin_products', jsonStr);
              localStorage.setItem('shopviet247_custom_products_v1', jsonStr);
            } catch (e) {}

            // 2. Cập nhật State
            if (window.ShopVietState && typeof window.ShopVietState.saveCustomProducts === 'function') {
              window.ShopVietState.saveCustomProducts(window.ShopVietData.products);
            }

            // 3. ĐẨY LÊN GITHUB CLOUD STORAGE NGAY LẬP TỨC
            if (window.ShopVietState && typeof window.ShopVietState.pushAllToCloud === 'function') {
              window.ShopVietState.pushAllToCloud(true).catch(function (e) {
                console.warn('[Modal Stock Cloud Push Error]:', e);
              });
            }

            // 4. Phát sóng Realtime để các tab khác và Admin đều cập nhật số lượng tồn kho
            if (window.ShopVietState && window.ShopVietState.broadcastAdminChange) {
              window.ShopVietState.broadcastAdminChange('products_updated', {
                productId: targetProd.id,
                productName: targetProd.name,
                newStock: newStock,
                timestamp: Date.now()
              });
            }

            // 5. Re-render trang chủ nếu đang hiển thị
            if (window.ShopVietViews && window.ShopVietViews.home) {
              if (typeof window.ShopVietViews.home.renderProducts === 'function') {
                window.ShopVietViews.home.renderProducts();
              }
              const homeContainer = document.getElementById('view-home');
              if (homeContainer && !homeContainer.classList.contains('hidden') && typeof window.ShopVietViews.home.render === 'function') {
                homeContainer.innerHTML = window.ShopVietViews.home.render();
                if (window.ShopVietViews.home.afterRender) {
                  window.ShopVietViews.home.afterRender();
                }
              }
            }
          }
        }

        // 1. Cập nhật state.orders và lưu vào bộ nhớ cục bộ
        if (window.ShopVietState && window.ShopVietState.state) {
          if (!Array.isArray(window.ShopVietState.state.orders)) {
            window.ShopVietState.state.orders = [];
          }
          const exists = window.ShopVietState.state.orders.some(function (o) { return (o.id && o.id === order.id) || (o.orderCode && o.orderCode === order.orderCode); });
          if (!exists) {
            window.ShopVietState.state.orders.unshift(order);
          }
        }
        if (window.ShopVietState && Array.isArray(window.ShopVietState.orders)) {
          const exists2 = window.ShopVietState.orders.some(function (o) { return (o.id && o.id === order.id) || (o.orderCode && o.orderCode === order.orderCode); });
          if (!exists2) {
            window.ShopVietState.orders.unshift(order);
          }
        }

        if (window.ShopVietState && typeof window.ShopVietState.save === 'function') {
          window.ShopVietState.save();
        }

        // Lưu trực tiếp vào shopviet_orders
        try {
          let currentOrders = [];
          const rawLocal = localStorage.getItem('shopviet_orders');
          if (rawLocal) {
            const p = JSON.parse(rawLocal);
            if (Array.isArray(p)) currentOrders = p;
          }
          const filtered = currentOrders.filter(function (o) {
            if (!o) return false;
            return o.id !== order.id && o.orderCode !== order.orderCode && o.rawCode !== order.rawCode;
          });
          filtered.unshift(order);
          localStorage.setItem('shopviet_orders', JSON.stringify(filtered));
        } catch (e) {}

        // Lưu trực tiếp vào shopviet247_cloud_orders_sync
        try {
          let syncOrders = [];
          const rawSync = localStorage.getItem('shopviet247_cloud_orders_sync');
          if (rawSync) {
            const p = JSON.parse(rawSync);
            if (Array.isArray(p)) syncOrders = p;
          }
          const filteredSync = syncOrders.filter(function (o) {
            if (!o) return false;
            return o.id !== order.id && o.orderCode !== order.orderCode && o.rawCode !== order.rawCode;
          });
          filteredSync.unshift(order);
          localStorage.setItem('shopviet247_cloud_orders_sync', JSON.stringify(filteredSync));
        } catch (e) {}

        // 2. Đồng bộ Firestore nếu khả dụng
        if (window.ShopVietFirebase && typeof window.ShopVietFirebase.syncOrderToCloud === 'function') {
          try {
            window.ShopVietFirebase.syncOrderToCloud(order);
          } catch (eFb) {}
        }

        // 3. Đẩy lên GitHub Cloud Storage & REST API độc lập với pushAllToCloud(true) - BẮT BUỘC AWAIT
        if (window.ShopVietState && typeof window.ShopVietState.pushAllToCloud === 'function') {
          try {
            await window.ShopVietState.pushAllToCloud(true);
          } catch (e) {
            console.warn('[Modal] pushAllToCloud error:', e);
          }
        }

        // 4. Phát sóng Realtime toàn diện đa kênh: BroadcastChannel + LocalStorage Broadcast + CustomEvent
        // 4.1 BroadcastChannel shopviet_admin_sync & shopviet_realtime_sync
        try {
          if (typeof BroadcastChannel !== 'undefined') {
            const bc1 = new BroadcastChannel('shopviet_admin_sync');
            bc1.postMessage({
              type: 'new_order_pending_review',
              action: 'new_order_pending_review',
              order: order,
              orderCode: order.orderCode || orderCode,
              status: 'pending_review',
              timestamp: Date.now()
            });
            const bc2 = new BroadcastChannel('shopviet_realtime_sync');
            bc2.postMessage({
              type: 'new_order_pending_review',
              action: 'new_order_pending_review',
              order: order,
              orderCode: order.orderCode || orderCode,
              status: 'pending_review',
              timestamp: Date.now()
            });
          }
        } catch (eBc) {}

        // 4.2 Storage event broadcast cho mọi tab cùng trình duyệt
        try {
          localStorage.setItem('shopviet_last_order_broadcast', JSON.stringify({
            order: order,
            orderCode: order.orderCode || orderCode,
            status: 'pending_review',
            timestamp: Date.now()
          }));
        } catch (eSt) {}

        // 4.3 CustomEvent nội bộ tab
        try {
          window.dispatchEvent(new CustomEvent('shopviet_realtime_update', {
            detail: {
              type: 'new_order_pending_review',
              action: 'new_order_pending_review',
              order: order,
              orderCode: order.orderCode || orderCode,
              status: 'pending_review',
              timestamp: Date.now(),
              payload: {
                order: order,
                orderCode: order.orderCode || orderCode,
                status: 'pending_review'
              }
            }
          }));
          window.dispatchEvent(new CustomEvent('orders_updated', {
            detail: {
              type: 'orders_updated',
              action: 'new_order_pending_review',
              order: order,
              orderCode: order.orderCode || orderCode,
              status: 'pending_review',
              timestamp: Date.now()
            }
          }));
        } catch (eCe) {}

        // 4.4 Phát sóng qua kênh ShopVietState nội bộ
        if (window.ShopVietState && window.ShopVietState.broadcastAdminChange) {
          window.ShopVietState.broadcastAdminChange('orders_updated', {
            order: order,
            orderCode: order.orderCode || orderCode,
            status: 'pending_review',
            timestamp: Date.now()
          });
        }

        // 5. Kích hoạt PWA Push Notification cho iPhone Admin (iOS 16.4+) & Desktop
        if (typeof window.triggerAdminOrderNotification === 'function') {
          window.triggerAdminOrderNotification(order);
        }
      }

      const mainContent = document.getElementById('quickpay-main-content');
      const waitingContainer = document.getElementById('quickpay-waiting-container');
      const waitingCodeEl = document.getElementById('waiting-order-code');
      const waitingStockEl = document.getElementById('waiting-product-stock');

      if (waitingCodeEl && orderCode) {
        waitingCodeEl.textContent = orderCode;
      }
      if (waitingStockEl) {
        if (updatedStock !== null) {
          waitingStockEl.innerHTML = `<span class="text-emerald-600 dark:text-emerald-400 font-bold">Còn ${updatedStock} gói</span>`;
        } else {
          waitingStockEl.textContent = 'Còn hàng';
        }
      }
      if (mainContent) mainContent.classList.add('hidden');
      if (waitingContainer) waitingContainer.classList.remove('hidden');

      if (window.ShopVietState && typeof window.ShopVietState.showToast === 'function') {
        window.ShopVietState.showToast('Đã ghi nhận giao dịch & cập nhật tồn kho! Đơn của bạn sẽ được duyệt sau ít phút.', 'success');
      }
    },


    // Điều hướng vào tab Đơn hàng trong trang Dashboard
    goToOrdersTab: function () {
      this.close();
      if (window.ShopVietState && typeof window.ShopVietState.navigate === 'function') {
        window.ShopVietState.navigate('dashboard', { tab: 'orders' });
      }
    },

    // Giả lập webhook tức thì
    simulateWebhook: function (orderCode) {
      if (window.ShopVietState && typeof window.ShopVietState.showToast === 'function') {
        window.ShopVietState.showToast('Nhận tín hiệu Webhook tức thì từ Sacombank!', 'info');
      }
      setTimeout(() => {
        this.finishPaymentSuccess(orderCode);
      }, 500);
    },

    // Hoàn tất đơn hàng và hiển thị giao diện bàn giao bản quyền
    finishPaymentSuccess: function (orderCode) {
      clearPaymentTimer();

      const order = window.ShopVietState ? window.ShopVietState.currentOrder : null;
      if (order) {
        order.status = 'completed';
        order.paidAt = new Date().toISOString();

        // Tự động trừ số lượng còn hàng (stock) nếu chưa trừ
        if (!order.stockDeducted && order.items && order.items.length > 0) {
          order.stockDeducted = true;
          const boughtItem = order.items[0];
          const prodId = boughtItem.id;
          const buyQty = boughtItem.quantity || 1;
          if (window.ShopVietData && Array.isArray(window.ShopVietData.products)) {
            const targetProd = window.ShopVietData.products.find(p => p.id === prodId);
            if (targetProd) {
              const currentStock = typeof targetProd.stock === 'number' ? targetProd.stock : parseInt(targetProd.stock, 10) || 111;
              const newStock = Math.max(0, currentStock - buyQty);
              targetProd.stock = newStock;
              if (newStock === 0) {
                targetProd.status = 'out_of_stock';
              } else if (newStock <= 5) {
                targetProd.status = 'low_stock';
              }
              try {
                localStorage.setItem('shopviet_custom_products', JSON.stringify(window.ShopVietData.products));
              } catch (e) {}
              if (window.ShopVietViews && window.ShopVietViews.home && typeof window.ShopVietViews.home.render === 'function') {
                const homeContainer = document.getElementById('view-home');
                if (homeContainer && !homeContainer.classList.contains('hidden')) {
                  homeContainer.innerHTML = window.ShopVietViews.home.render();
                  if (window.ShopVietViews.home.afterRender) {
                    window.ShopVietViews.home.afterRender();
                  }
                }
              }
            }
          }
        }

        if (window.ShopVietState.orders) {
          window.ShopVietState.orders.unshift(order);
        }
        if (window.ShopVietFirebase && typeof window.ShopVietFirebase.syncOrderToCloud === 'function') {
          window.ShopVietFirebase.syncOrderToCloud(order);
          if (typeof window.ShopVietState.pushAllToCloud === 'function') {
            window.ShopVietState.pushAllToCloud().catch(console.warn);
          }
        }
      }

      const mainContent = document.getElementById('quickpay-main-content');
      const successContainer = document.getElementById('quickpay-success-container');

      if (mainContent) mainContent.classList.add('hidden');
      if (successContainer) successContainer.classList.remove('hidden');

      if (window.ShopVietState && typeof window.ShopVietState.showToast === 'function') {
        window.ShopVietState.showToast('Giao dịch Sacombank đã khớp! Bản quyền đã được kích hoạt.', 'success');
      }
    },

    // Đóng Quick Buy Modal & dọn dẹp
    close: function () {
      clearPaymentTimer();
      const modalMount = document.getElementById('modalMount');
      if (modalMount) {
        modalMount.innerHTML = '';
      }
      if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
        window.removeEventListener('keydown', handleKeyDown);
      }
      currentProduct = null;
      currentQty = 1;
      appliedVoucher = null;
      if (window.ShopVietState) {
        window.ShopVietState.appliedQuickBuyVoucher = null;
      }
    },

    // Getter / Setter voucher đang áp dụng
    get appliedVoucher() {
      return appliedVoucher;
    },
    set appliedVoucher(v) {
      appliedVoucher = v;
    },

    // Cấu hình VietQR
    getActiveVietQRConfig: getActiveVietQRConfig,

    // Alias hỗ trợ tương thích ngược
    openQuickBuy: function (productId) {
      return this.open(productId);
    }
  };

})();
