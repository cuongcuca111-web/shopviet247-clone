/**
 * Shopviet247 - Quick Buy Modal View Module
 * Popup Mua Nhanh chuẩn Clean SaaS UI, Backdrop Blur, Reactive Quantity & Live Subtotal
 */

window.ShopVietViews = window.ShopVietViews || {};

window.ShopVietViews.modal = (function () {
  'use strict';

  let currentProduct = null;
  let currentQty = 1;

  // Lắng nghe phím Escape để đóng modal tiện lợi
  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      window.ShopVietViews.modal.close();
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

    // Xử lý khi nhấn "Mua ngay"
    handleBuyNow: function () {
      if (!currentProduct) return;
      if (window.ShopVietState) {
        // Thêm vào giỏ hàng đảm bảo checkout view có dữ liệu
        window.ShopVietState.addToCart(currentProduct.id, currentQty);
        // Đóng modal và chuyển ngay sang view Checkout
        this.close();
        window.ShopVietState.navigate('checkout', {
          productId: currentProduct.id,
          qty: currentQty
        });
      }
    },

    // Đóng Quick Buy Modal
    close: function () {
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
