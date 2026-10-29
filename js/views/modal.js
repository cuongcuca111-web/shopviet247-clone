/**
 * Shopviet247 - Quick Buy Modal View Module
 * Popup Mua Nhanh chuẩn Clean SaaS UI, Backdrop Blur, Reactive Quantity & Live Subtotal
 */

window.ShopVietViews = window.ShopVietViews || {};

window.ShopVietViews.modal = (function () {
  'use strict';

  let currentProduct = null;
  let currentQty = 1;
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
      chatgpt: 'from-slate-950 via-emerald-950 to-teal-900 border-emerald-800/40',
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
                <span class="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
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
              
              <!-- THÔNG TIN SẢN PHẨM -->
              <div class="flex items-start gap-3.5 p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                <!-- Square Thumbnail (64x64px) -->
                <div class="w-16 h-16 rounded-xl bg-gradient-to-br ${gradient} border border-slate-700/50 flex items-center justify-center p-2.5 shrink-0 shadow-sm relative overflow-hidden">
                  <div class="relative z-10 w-9 h-9 flex items-center justify-center">
                    ${window.ShopVietData ? window.ShopVietData.getBrandIcon(currentProduct.iconType) : ''}
                  </div>
                </div>

                <!-- Title, Badges & Price -->
                <div class="flex-1 min-w-0">
                  <h4 class="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                    ${currentProduct.name}
                  </h4>

                  <div class="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200/60 dark:border-emerald-800/50">
                      ⚡ Giao tự động
                    </span>

                    ${isOutOfStock ? `
                      <span class="px-2 py-0.5 rounded-md bg-rose-50 text-rose-500 dark:bg-rose-950/60 dark:text-rose-400 text-[10px] font-bold border border-rose-200/60 dark:border-rose-800/50">
                        Hết hàng
                      </span>
                    ` : isLowStock ? `
                      <span class="px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 text-[10px] font-bold border border-amber-200/60 dark:border-amber-800/50">
                        Sắp hết hàng
                      </span>
                    ` : `
                      <span class="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 text-[10px] font-bold border border-indigo-200/60 dark:border-indigo-800/50">
                        Còn hàng
                      </span>
                    `}
                  </div>

                  <div class="mt-2 flex items-baseline gap-2">
                    <span class="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                      ${window.ShopVietState ? window.ShopVietState.formatCurrency(currentProduct.price) : `${currentProduct.price.toLocaleString('vi-VN')} đ`}
                    </span>
                    ${currentProduct.oldPrice ? `
                      <span class="text-xs text-slate-400 line-through">
                        ${window.ShopVietState ? window.ShopVietState.formatCurrency(currentProduct.oldPrice) : `${currentProduct.oldPrice.toLocaleString('vi-VN')} đ`}
                      </span>
                    ` : ''}
                  </div>
                </div>
              </div>

              <!-- DÒNG TRẠNG THÁI TỒN KHO & BẢO HÀNH -->
              <div class="flex items-center justify-between text-xs py-1 px-1">
                <span class="font-semibold ${isOutOfStock ? 'text-rose-500' : isLowStock ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'} flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full ${isOutOfStock ? 'bg-rose-500' : isLowStock ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}"></span>
                  Tồn kho • ${isOutOfStock ? 'Hết hàng tạm thời' : `Còn ${currentProduct.stock} slot`}
                </span>
                <span class="text-slate-400 dark:text-slate-500">
                  🛡️ ${currentProduct.warranty || 'Bảo hành 1 đổi 1'}
                </span>
              </div>

              <!-- HƯỚNG DẪN NHẬN HÀNG TỰ ĐỘNG -->
              <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2.5">
                <span class="text-amber-500 shrink-0 mt-0.5 text-sm">⚡</span>
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

                <!-- HIỂN THỊ TỔNG TẠM TÍNH -->
                <div class="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between">
                  <span class="text-xs font-semibold text-slate-600 dark:text-slate-300">Tổng tạm tính:</span>
                  <span id="modalTotalPrice" class="text-lg font-black text-indigo-600 dark:text-indigo-400">
                    ${window.ShopVietState ? window.ShopVietState.formatCurrency(currentProduct.price * currentQty) : `${(currentProduct.price * currentQty).toLocaleString('vi-VN')} đ`}
                  </span>
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
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
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
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
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

      if (currentProduct && totalEl && window.ShopVietState) {
        totalEl.textContent = window.ShopVietState.formatCurrency(currentProduct.price * currentQty);
      }

      if (currentProduct) {
        const maxStock = currentProduct.stock || 99;
        if (btnMinus) btnMinus.disabled = currentQty <= 1;
        if (btnPlus) btnPlus.disabled = currentQty >= maxStock;
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

      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let suffix = '';
      for (let i = 0; i < 4; i++) {
        suffix += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const orderCode = `#DJ2026${suffix}`;

      let memo = '';
      for (let i = 0; i < 8; i++) {
        memo += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Nạp cấu hình VietQR động từ Portal Admin (Mặc định: Sacombank 100071864927 LE BUI MINH CUONG)
      const vietqrConfig = getActiveVietQRConfig();
      const totalAmount = currentProduct.price * currentQty;
      const orderDate = new Date();

      const order = {
        id: orderCode,
        orderCode: orderCode,
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
        subtotal: totalAmount,
        discount: 0,
        amount: totalAmount,
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

      if (window.ShopVietState) {
        window.ShopVietState.currentOrder = order;
      }

      // Mở trực tiếp Popup Quét mã Sacombank VietQR kế thừa chuẩn bố cục Ảnh 4
      this.openPaymentModal(order);
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
                          id="quickpay-live-qr" 
                          src="${vietQrUrl}" 
                          alt="VietQR ${vietqrConfig.shortName} - ${order.memo}" 
                          class="w-full h-full object-contain"
                        />
                      </div>
                    </div>

                    <button 
                      type="button" 
                      onclick="ShopVietViews.modal.downloadQr('${vietQrUrl}', '${order.orderCode}')" 
                      class="mt-3.5 w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
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
                    <div class="p-3.5 sm:px-4 flex items-center justify-between gap-3 bg-rose-50/50 dark:bg-rose-950/20">
                      <span class="text-slate-600 dark:text-slate-400 font-medium">Số tiền cần chuyển:</span>
                      <div class="flex items-center gap-2">
                        <span class="font-mono font-black text-rose-600 dark:text-rose-400 text-base sm:text-lg">${formatMoney(order.amount)}đ</span>
                        <button type="button" onclick="ShopVietViews.modal.copyField('${order.amount}', 'Số tiền')" class="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50">Copy</button>
                      </div>
                    </div>

                    <!-- 2. Ngân hàng thụ hưởng -->
                    <div class="p-3.5 sm:px-4 flex items-center justify-between gap-3">
                      <span class="text-slate-600 dark:text-slate-400 font-medium">Ngân hàng thụ hưởng:</span>
                      <div class="flex items-center gap-2 text-right">
                        <span class="font-bold text-slate-900 dark:text-white">${vietqrConfig.bankName}</span>
                        <button type="button" onclick="ShopVietViews.modal.copyField('${vietqrConfig.bankName}', 'Ngân hàng')" class="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200">Copy</button>
                      </div>
                    </div>

                    <!-- 3. Số tài khoản (NẠP ĐỘNG TỪ PORTAL ADMIN) -->
                    <div class="p-3.5 sm:px-4 flex items-center justify-between gap-3 bg-blue-50/40 dark:bg-blue-950/20">
                      <span class="text-slate-600 dark:text-slate-400 font-medium">Số tài khoản (STK):</span>
                      <div class="flex items-center gap-2">
                        <span class="font-mono font-black text-[#004b91] dark:text-blue-400 text-base sm:text-lg tracking-wider">${vietqrConfig.accountNumber}</span>
                        <button type="button" onclick="ShopVietViews.modal.copyField('${vietqrConfig.accountNumber}', 'Số tài khoản')" class="px-2 py-1 bg-[#004b91] text-white rounded-lg text-xs font-bold hover:bg-blue-800 shadow-sm">Sao chép STK</button>
                      </div>
                    </div>

                    <!-- 4. Tên chủ tài khoản (NẠP ĐỘNG TỪ PORTAL ADMIN) -->
                    <div class="p-3.5 sm:px-4 flex items-center justify-between gap-3">
                      <span class="text-slate-600 dark:text-slate-400 font-medium">Tên chủ tài khoản:</span>
                      <div class="flex items-center gap-2">
                        <span class="font-black text-slate-900 dark:text-white uppercase">${vietqrConfig.accountName}</span>
                        <button type="button" onclick="ShopVietViews.modal.copyField('${vietqrConfig.accountName}', 'Chủ tài khoản')" class="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200">Copy</button>
                      </div>
                    </div>

                    <!-- 5. Nội dung chuyển khoản -->
                    <div class="p-3.5 sm:px-4 flex items-center justify-between gap-3 bg-amber-50/40 dark:bg-amber-950/20">
                      <div>
                        <span class="text-slate-600 dark:text-slate-400 font-medium block">Nội dung chuyển khoản:</span>
                        <span class="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Bắt buộc nhập chính xác để kích hoạt tự động</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="font-mono font-black text-amber-700 dark:text-amber-400 text-sm sm:text-base">${order.memo}</span>
                        <button type="button" onclick="ShopVietViews.modal.copyField('${order.memo}', 'Nội dung chuyển khoản')" class="px-2 py-1 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 shadow-sm">Sao chép mã</button>
                      </div>
                    </div>

                  </div>

                  <!-- Radar quét tín hiệu VietQR Realtime -->
                  <div class="p-3.5 rounded-2xl bg-slate-900 text-white flex items-center gap-3">
                    <div class="relative w-7 h-7 flex items-center justify-center shrink-0">
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
                      <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </div>
                    <div class="text-xs">
                      <p class="font-bold text-emerald-400">Radar Khớp Lệnh Sacombank VietQR Đang Chạy</p>
                      <p class="text-[11px] text-slate-300 mt-0.5">Hệ thống tự động phát hiện số dư và bàn giao sản phẩm ngay lập tức</p>
                    </div>
                  </div>

                  <!-- Nút hành động thanh toán -->
                  <div class="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
                    <button 
                      type="button" 
                      id="btn-quickpay-confirm"
                      onclick="ShopVietViews.modal.confirmPaid('${order.orderCode}')" 
                      class="w-full sm:flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                      <span>Tôi đã chuyển khoản thành công</span>
                    </button>

                    <button 
                      type="button" 
                      onclick="ShopVietViews.modal.simulateWebhook('${order.orderCode}')" 
                      class="w-full sm:w-auto py-3 px-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                      title="Mô phỏng ngân hàng gửi biến động số dư tức thì"
                    >
                      <span class="text-amber-500">⚡</span>
                      <span>Webhook Sandbox</span>
                    </button>
                  </div>

                </div>

              </div>
            </div>

            <!-- SUCCESS STATE MODAL CONTAINER (Ẩn ban đầu, hiện khi thành công) -->
            <div id="quickpay-success-container" class="hidden p-6 sm:p-8 text-center space-y-5 animate-slide-up">
              <div class="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              </div>

              <div>
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 mb-2">
                  ✓ Giao dịch đã khớp lệnh tức thì
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

    // Xác nhận đã thanh toán
    confirmPaid: function (orderCode) {
      const confirmBtn = document.getElementById('btn-quickpay-confirm');
      if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.classList.add('opacity-75', 'cursor-wait');
        confirmBtn.innerHTML = `
          <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="3" stroke-dasharray="32" stroke-linecap="round"></circle></svg>
          <span>Đang kiểm tra biến động...</span>
        `;
      }

      if (window.ShopVietState && typeof window.ShopVietState.showToast === 'function') {
        window.ShopVietState.showToast('Đang kết nối cổng Sacombank kiểm tra giao dịch...', 'info');
      }

      setTimeout(() => {
        this.finishPaymentSuccess(orderCode);
      }, 1200);
    },

    // Giả lập webhook tức thì
    simulateWebhook: function (orderCode) {
      if (window.ShopVietState && typeof window.ShopVietState.showToast === 'function') {
        window.ShopVietState.showToast('⚡ Nhận tín hiệu Webhook tức thì từ Sacombank!', 'info');
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
        if (window.ShopVietState.orders) {
          window.ShopVietState.orders.unshift(order);
        }
        if (window.ShopVietFirebase && typeof window.ShopVietFirebase.syncOrderToCloud === 'function') {
          window.ShopVietFirebase.syncOrderToCloud(order);
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
    },

    // Alias hỗ trợ tương thích ngược
    openQuickBuy: function (productId) {
      return this.open(productId);
    }
  };

})();
