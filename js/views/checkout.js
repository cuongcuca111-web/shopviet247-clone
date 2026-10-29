/**
 * Shopviet247 - Checkout & VietQR Payment Views
 * Tệp: js/views/checkout.js
 * Bao gồm:
 * 1. window.ShopVietViews.checkout - Màn hình Kiểm tra đơn hàng & Tạo đơn hàng (Bước 1)
 * 2. window.ShopVietViews.pay - Màn hình Quét mã VietQR Live & Bàn giao tài khoản (Bước 2)
 */

(function () {
  'use strict';

  // Khởi tạo namespace toàn cục nếu chưa có
  window.ShopVietViews = window.ShopVietViews || {};
  window.ShopVietState = window.ShopVietState || {
    cart: [],
    currentOrder: null,
    orders: [],
    user: {
      name: 'Nguyễn Khách Hàng',
      email: 'khachhang@gmail.com',
      walletBalance: 0,
      rewardPoints: 120
    }
  };

  // Biến lưu trữ Timer toàn cục để dọn dẹp sạch sẽ
  window.__shopvietPayTimer = null;

  // Dữ liệu mẫu ban đầu nếu giỏ hàng trống để người dùng test ngay lập tức
  const SAMPLE_CART_ITEM = {
    id: 'sp-chatgpt-plus',
    name: 'Tài khoản ChatGPT Plus 1 Tháng (Mail Riêng)',
    category: 'Trí tuệ nhân tạo (AI)',
    variant: 'Mặc định',
    stock: 'Còn hàng',
    price: 45000,
    originalPrice: 79000,
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=240&auto=format&fit=crop&q=80'
  };

  // Danh sách mã giảm giá hợp lệ
  const DISCOUNT_CODES = {
    'AI2026': { code: 'AI2026', amount: 15000, desc: 'Giảm 15.000đ đơn hàng AI' },
    'HSSV': { code: 'HSSV', amount: 10000, desc: 'Ưu đãi học sinh sinh viên 10.000đ' },
    'SHOPVIET': { code: 'SHOPVIET', amount: 5000, desc: 'Khách hàng thân thiết 5.000đ' }
  };

  // Helper format tiền tệ VNĐ
  function formatMoney(amount) {
    if (isNaN(amount) || amount === null || amount === undefined) return '0';
    return Number(amount).toLocaleString('vi-VN');
  }

  // Helper tạo ID đơn hàng ngẫu nhiên (#DJ2026XXXX)
  function generateOrderCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let suffix = '';
    for (let i = 0; i < 4; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `#DJ2026${suffix}`;
  }

  // Helper tạo mã nội dung chuyển khoản 8 ký tự
  function generateTransferMemo() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let memo = '';
    for (let i = 0; i < 8; i++) {
      memo += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return memo;
  }

  // Helper điều hướng view
  function navigate(viewName, params) {
    if (window.ShopVietApp && typeof window.ShopVietApp.navigateTo === 'function') {
      window.ShopVietApp.navigateTo(viewName, params);
      return;
    }
    if (window.ShopVietViews && window.ShopVietViews[viewName] && typeof window.ShopVietViews[viewName].render === 'function') {
      const container = getTargetContainer();
      if (container) {
        window.ShopVietViews[viewName].render(container, params);
      }
    }
    window.location.hash = `#${viewName}`;
  }

  // Helper tìm container chính
  function getTargetContainer(provided) {
    if (provided && typeof provided === 'object' && provided.nodeType === 1) {
      return provided;
    }
    if (typeof provided === 'string') {
      const el = document.getElementById(provided) || document.querySelector(provided);
      if (el) return el;
    }
    return (
      document.getElementById('main-content') ||
      document.getElementById('app') ||
      document.getElementById('view-container') ||
      document.querySelector('main') ||
      document.body
    );
  }

  // Dọn dẹp timer đếm ngược
  function clearPaymentCountdown() {
    if (window.__shopvietPayTimer) {
      clearInterval(window.__shopvietPayTimer);
      window.__shopvietPayTimer = null;
    }
  }

  // Toast thông báo thanh lịch
  function showToast(message, type = 'info') {
    const existing = document.getElementById('shopviet-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'shopviet-toast';
    const bgColors = {
      success: 'bg-emerald-600 text-white',
      error: 'bg-rose-600 text-white',
      info: 'bg-slate-900 text-white',
      warning: 'bg-amber-600 text-white'
    };
    const icons = {
      success: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`,
      error: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`,
      info: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
      warning: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`
    };

    toast.className = `fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl transition-all duration-300 transform translate-y-4 opacity-0 ${bgColors[type] || bgColors.info}`;
    toast.innerHTML = `
      <div class="flex-shrink-0">${icons[type] || icons.info}</div>
      <div class="text-sm font-medium pr-2">${message}</div>
    `;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-4', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
    });

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-4');
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  // Copy to clipboard helper
  function copyTextToClipboard(text, btnElement, successMsg = 'Đã chép!') {
    if (!navigator.clipboard) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    } else {
      navigator.clipboard.writeText(text);
    }

    if (btnElement) {
      const originalHtml = btnElement.innerHTML;
      btnElement.innerHTML = `
        <svg class="w-3.5 h-3.5 text-emerald-600 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>
        <span class="text-emerald-700 font-bold">${successMsg}</span>
      `;
      btnElement.classList.add('bg-emerald-50', 'border-emerald-300');
      setTimeout(() => {
        btnElement.innerHTML = originalHtml;
        btnElement.classList.remove('bg-emerald-50', 'border-emerald-300');
      }, 2000);
    }

    showToast(`Đã sao chép: ${text}`, 'success');
  }

  // SVG Fallback QR Generator
  function getFallbackQrSvg(text) {
    return `
      <svg class="w-full h-full max-w-[260px] mx-auto text-slate-800" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" rx="12" fill="white"/>
        <!-- Finder top-left -->
        <rect x="20" y="20" width="45" height="45" rx="6" stroke="#0f172a" stroke-width="8"/>
        <rect x="33" y="33" width="19" height="19" rx="3" fill="#0f172a"/>
        <!-- Finder top-right -->
        <rect x="135" y="20" width="45" height="45" rx="6" stroke="#0f172a" stroke-width="8"/>
        <rect x="148" y="33" width="19" height="19" rx="3" fill="#0f172a"/>
        <!-- Finder bottom-left -->
        <rect x="20" y="135" width="45" height="45" rx="6" stroke="#0f172a" stroke-width="8"/>
        <rect x="33" y="148" width="19" height="19" rx="3" fill="#0f172a"/>
        <!-- Random QR Pattern Matrix Blocks -->
        <rect x="75" y="25" width="10" height="10" fill="#0f172a"/>
        <rect x="95" y="25" width="10" height="10" fill="#0f172a"/>
        <rect x="115" y="25" width="10" height="10" fill="#0f172a"/>
        <rect x="75" y="45" width="20" height="10" fill="#0f172a"/>
        <rect x="105" y="45" width="10" height="20" fill="#0f172a"/>
        <rect x="25" y="75" width="10" height="10" fill="#0f172a"/>
        <rect x="45" y="75" width="20" height="10" fill="#0f172a"/>
        <rect x="75" y="75" width="50" height="10" fill="#0f172a"/>
        <rect x="135" y="75" width="10" height="20" fill="#0f172a"/>
        <rect x="155" y="75" width="20" height="10" fill="#0f172a"/>
        <rect x="25" y="95" width="30" height="10" fill="#0f172a"/>
        <rect x="65" y="95" width="10" height="30" fill="#0f172a"/>
        <rect x="85" y="95" width="30" height="30" rx="4" fill="#0f172a"/>
        <rect x="125" y="95" width="20" height="10" fill="#0f172a"/>
        <rect x="155" y="95" width="10" height="20" fill="#0f172a"/>
        <rect x="175" y="95" width="10" height="30" fill="#0f172a"/>
        <rect x="25" y="115" width="10" height="10" fill="#0f172a"/>
        <rect x="45" y="115" width="10" height="10" fill="#0f172a"/>
        <rect x="125" y="115" width="10" height="20" fill="#0f172a"/>
        <rect x="145" y="115" width="20" height="10" fill="#0f172a"/>
        <rect x="75" y="135" width="20" height="10" fill="#0f172a"/>
        <rect x="105" y="135" width="20" height="20" fill="#0f172a"/>
        <rect x="135" y="135" width="10" height="10" fill="#0f172a"/>
        <rect x="155" y="135" width="20" height="10" fill="#0f172a"/>
        <rect x="75" y="155" width="10" height="20" fill="#0f172a"/>
        <rect x="95" y="165" width="20" height="10" fill="#0f172a"/>
        <rect x="125" y="155" width="10" height="20" fill="#0f172a"/>
        <rect x="145" y="155" width="10" height="10" fill="#0f172a"/>
        <rect x="165" y="165" width="15" height="10" fill="#0f172a"/>
        <!-- VietQR / MB Logo badge in center -->
        <rect x="80" y="80" width="40" height="40" rx="8" fill="#1e3a8a"/>
        <text x="100" y="104" font-family="system-ui, sans-serif" font-size="12" font-weight="900" fill="white" text-anchor="middle">MB</text>
      </svg>
    `;
  }

  // =========================================================================
  // VIEW 1: CHECKOUT (KIỂM TRA ĐƠN HÀNG & TẠO ĐƠN)
  // =========================================================================
  window.ShopVietViews.checkout = {
    render: function (targetOrParams, maybeParams) {
      clearPaymentCountdown();

      let container = null;
      let params = {};

      if (targetOrParams && (targetOrParams.nodeType === 1 || typeof targetOrParams === 'string')) {
        container = getTargetContainer(targetOrParams);
        params = maybeParams || {};
      } else {
        container = getTargetContainer();
        params = targetOrParams || {};
      }

      // Đảm bảo cart có ít nhất 1 sản phẩm
      if (!window.ShopVietState.cart || window.ShopVietState.cart.length === 0) {
        window.ShopVietState.cart = [Object.assign({}, SAMPLE_CART_ITEM)];
      }

      let appliedVoucher = window.ShopVietState.currentVoucher || null;

      // Hàm tính toán tổng tiền
      function calculateTotals() {
        const cart = window.ShopVietState.cart || [];
        const totalItems = cart.reduce((acc, item) => acc + (Number(item.quantity) || 1), 0);
        const subtotal = cart.reduce((acc, item) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
        let discount = 0;
        if (appliedVoucher) {
          discount = appliedVoucher.amount || 0;
        }
        const finalTotal = Math.max(0, subtotal - discount);
        return { totalItems, subtotal, discount, finalTotal };
      }

      function updateCheckoutDOM() {
        const { totalItems, subtotal, discount, finalTotal } = calculateTotals();

        // Cập nhật các trường số liệu
        const totalItemsEl = document.getElementById('checkout-total-items');
        if (totalItemsEl) totalItemsEl.textContent = totalItems;

        const subtotalEl = document.getElementById('checkout-subtotal');
        if (subtotalEl) subtotalEl.textContent = `${formatMoney(subtotal)}đ`;

        const voucherRowEl = document.getElementById('checkout-voucher-row');
        const voucherAmountEl = document.getElementById('checkout-voucher-amount');
        if (voucherRowEl && voucherAmountEl) {
          if (discount > 0 && appliedVoucher) {
            voucherRowEl.classList.remove('hidden');
            voucherAmountEl.textContent = `-${formatMoney(discount)}đ`;
          } else {
            voucherRowEl.classList.add('hidden');
          }
        }

        const finalTotalEl = document.getElementById('checkout-final-total');
        if (finalTotalEl) finalTotalEl.textContent = `${formatMoney(finalTotal)}đ`;

        // Render lại danh sách sản phẩm
        const itemsContainer = document.getElementById('checkout-items-list');
        if (itemsContainer) {
          itemsContainer.innerHTML = renderCartItemsList();
          bindItemEvents();
        }
      }

      function renderCartItemsList() {
        const cart = window.ShopVietState.cart || [];
        if (cart.length === 0) {
          return `
            <div class="py-12 text-center text-slate-500">
              <svg class="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
              </svg>
              <p class="font-medium">Giỏ hàng của bạn đang trống</p>
              <button id="btn-re-add-sample" class="mt-3 text-xs text-blue-600 hover:underline">Thêm sản phẩm mẫu ChatGPT Plus để thử nghiệm</button>
            </div>
          `;
        }

        return cart
          .map(
            (item, index) => `
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 border-b border-slate-100 last:border-0" data-item-id="${item.id}">
            <div class="flex items-center gap-3.5 flex-1 min-w-0">
              <img src="${item.image || SAMPLE_CART_ITEM.image}" alt="${item.name}" 
                   class="w-16 h-16 rounded-xl object-cover border border-slate-200/80 shadow-sm flex-shrink-0"
                   onerror="this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=240&auto=format&fit=crop&q=80'" />
              <div class="min-w-0 flex-1">
                <h4 class="text-sm font-semibold text-slate-900 truncate" title="${item.name}">${item.name}</h4>
                <div class="flex items-center gap-2 mt-1">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                    Phân loại: ${item.variant || 'Mặc định'}
                  </span>
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    ● ${item.stock || 'Còn hàng'}
                  </span>
                </div>
                <div class="mt-1.5 flex items-baseline gap-2">
                  <span class="text-base font-bold text-slate-900">${formatMoney(item.price)}đ</span>
                  ${item.originalPrice ? `<span class="text-xs text-slate-400 line-through">${formatMoney(item.originalPrice)}đ</span>` : ''}
                </div>
              </div>
            </div>

            <!-- Controls: Tăng giảm số lượng & Xóa -->
            <div class="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
              <div class="inline-flex items-center border border-slate-200 rounded-xl bg-slate-50/50 p-1">
                <button type="button" class="btn-qty-minus w-7 h-7 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition" data-index="${index}">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/></svg>
                </button>
                <span class="w-8 text-center text-sm font-semibold text-slate-900 select-none">${item.quantity || 1}</span>
                <button type="button" class="btn-qty-plus w-7 h-7 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition" data-index="${index}">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                </button>
              </div>
              <button type="button" class="btn-item-delete p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition" data-index="${index}" title="Xóa sản phẩm">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
          </div>
        `
          )
          .join('');
      }

      function bindItemEvents() {
        const minusBtns = container.querySelectorAll('.btn-qty-minus');
        minusBtns.forEach((btn) => {
          btn.onclick = () => {
            const idx = parseInt(btn.dataset.index, 10);
            if (window.ShopVietState.cart[idx]) {
              if (window.ShopVietState.cart[idx].quantity > 1) {
                window.ShopVietState.cart[idx].quantity--;
              } else {
                window.ShopVietState.cart.splice(idx, 1);
              }
              updateCheckoutDOM();
            }
          };
        });

        const plusBtns = container.querySelectorAll('.btn-qty-plus');
        plusBtns.forEach((btn) => {
          btn.onclick = () => {
            const idx = parseInt(btn.dataset.index, 10);
            if (window.ShopVietState.cart[idx]) {
              window.ShopVietState.cart[idx].quantity = (window.ShopVietState.cart[idx].quantity || 1) + 1;
              updateCheckoutDOM();
            }
          };
        });

        const delBtns = container.querySelectorAll('.btn-item-delete');
        delBtns.forEach((btn) => {
          btn.onclick = () => {
            const idx = parseInt(btn.dataset.index, 10);
            window.ShopVietState.cart.splice(idx, 1);
            showToast('Đã xóa sản phẩm khỏi đơn hàng', 'info');
            updateCheckoutDOM();
          };
        });

        const reAddBtn = container.querySelector('#btn-re-add-sample');
        if (reAddBtn) {
          reAddBtn.onclick = () => {
            window.ShopVietState.cart = [Object.assign({}, SAMPLE_CART_ITEM)];
            updateCheckoutDOM();
            showToast('Đã thêm sản phẩm mẫu ChatGPT Plus', 'success');
          };
        }
      }

      // Xây dựng giao diện HTML tổng thể của view checkout
      const { totalItems, subtotal, discount, finalTotal } = calculateTotals();

      const html = `
        <div class="checkout-view-wrapper min-h-screen bg-slate-50/60 py-8 px-4 sm:px-6 lg:px-8 font-sans text-slate-800">
          <div class="max-w-6xl mx-auto space-y-8">
            
            <!-- THANH TIẾN TRÌNH (STEPPER) NGANG CĂN GIỮA -->
            <div class="stepper-container flex items-center justify-center max-w-xl mx-auto">
              <div class="flex items-center gap-3">
                <!-- Bước 1: Active -->
                <div class="flex items-center gap-2">
                  <span class="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold shadow-md">1</span>
                  <span class="text-sm font-bold text-slate-900">Kiểm tra đơn hàng</span>
                </div>
                
                <!-- Đường nối / Mũi tên -->
                <div class="w-12 sm:w-20 h-0.5 bg-slate-300 mx-1"></div>

                <!-- Bước 2: Chờ -->
                <div class="flex items-center gap-2 opacity-60">
                  <span class="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-semibold">2</span>
                  <span class="text-sm font-medium text-slate-600">Quét mã VietQR</span>
                </div>
              </div>
            </div>

            <!-- BỐ CỤC 2 CỘT (7 COLS TRÁI - 5 COLS PHẢI) -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              <!-- CỘT TRÁI (7 COLS): SẢN PHẨM & MÃ GIẢM GIÁ -->
              <div class="lg:col-span-7 space-y-6">
                
                <!-- Card Sản phẩm -->
                <div class="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                  <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                    <div class="flex items-center gap-2.5">
                      <svg class="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                      </svg>
                      <h2 class="text-lg font-bold text-slate-900">Sản phẩm thanh toán</h2>
                    </div>
                    <span class="text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-full">
                      <span id="checkout-total-items">${totalItems}</span> món
                    </span>
                  </div>

                  <!-- Danh sách sản phẩm -->
                  <div id="checkout-items-list" class="divide-y divide-slate-100">
                    ${renderCartItemsList()}
                  </div>
                </div>

                <!-- Card Mã giảm giá -->
                <div class="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                  <div class="flex items-center gap-2 mb-3">
                    <svg class="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0115 5v1.077a3 3 0 011.584 2.617l.832 3.99A3 3 0 0114.478 16H5.522a3 3 0 01-2.938-3.316l.832-3.99A3 3 0 015 6.077V5zm3.707 4.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L11 10.586l-1.293-1.293z" clip-rule="evenodd"/>
                    </svg>
                    <h3 class="text-sm font-bold text-slate-900">Mã ưu đãi / Giảm giá</h3>
                  </div>

                  <div class="flex gap-2">
                    <div class="relative flex-1">
                      <input type="text" id="input-voucher-code" placeholder="Nhập mã giảm giá (không bắt buộc)" 
                             class="w-full uppercase font-mono text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition" />
                      <button type="button" id="btn-clear-voucher" class="hidden absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </div>
                    <button type="button" id="btn-apply-voucher" 
                            class="bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white rounded-xl px-5 py-2.5 text-sm font-semibold transition shadow-sm flex items-center justify-center">
                      Áp dụng
                    </button>
                  </div>

                  <!-- Tag gợi ý mã sẵn có -->
                  <div class="mt-3 flex flex-wrap items-center gap-2">
                    <span class="text-xs text-slate-500">Mã có sẵn:</span>
                    <button type="button" class="btn-preset-voucher text-xs font-mono font-medium px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 hover:bg-emerald-100 transition" data-code="AI2026">
                      AI2026 (-15k)
                    </button>
                    <button type="button" class="btn-preset-voucher text-xs font-mono font-medium px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/60 hover:bg-blue-100 transition" data-code="HSSV">
                      HSSV (-10k)
                    </button>
                  </div>

                  <!-- Thông báo trạng thái voucher -->
                  <div id="voucher-status-msg" class="mt-3 hidden text-xs flex items-center gap-1.5"></div>
                </div>

              </div>

              <!-- CỘT PHẢI (5 COLS): CARD TẠO ĐƠN HÀNG -->
              <div class="lg:col-span-5 space-y-6">
                <div class="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5">
                  <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 class="text-lg font-bold text-slate-900">Tạo đơn hàng</h3>
                    <span class="text-xs text-slate-400 font-mono">BẢO MẬT SSL 256-BIT</span>
                  </div>

                  <!-- Bảng kê chi tiết giá -->
                  <div class="space-y-2.5 text-sm">
                    <div class="flex justify-between text-slate-600">
                      <span>Số lượng sản phẩm:</span>
                      <span id="checkout-total-items-sidebar" class="font-semibold text-slate-900">${totalItems}</span>
                    </div>
                    <div class="flex justify-between text-slate-600">
                      <span>Giá gốc:</span>
                      <span id="checkout-subtotal" class="font-semibold text-slate-900">${formatMoney(subtotal)}đ</span>
                    </div>
                    <div id="checkout-voucher-row" class="flex justify-between text-emerald-600 ${discount > 0 ? '' : 'hidden'} font-medium">
                      <span>Giảm giá voucher:</span>
                      <span id="checkout-voucher-amount" class="font-bold">-${formatMoney(discount)}đ</span>
                    </div>
                    <div class="flex justify-between text-slate-600">
                      <span>Khuyến mãi:</span>
                      <span class="font-medium text-slate-700">0đ</span>
                    </div>
                    <div class="flex justify-between text-slate-600">
                      <span>Giá sỉ:</span>
                      <span class="font-medium text-slate-700">0đ</span>
                    </div>

                    <div class="border-t border-slate-200/80 pt-3 mt-2 flex justify-between items-baseline">
                      <span class="text-sm font-bold text-slate-900 uppercase tracking-wide">CẦN THANH TOÁN:</span>
                      <span id="checkout-final-total" class="text-2xl font-black text-slate-900 tracking-tight">${formatMoney(finalTotal)}đ</span>
                    </div>
                  </div>

                  <!-- KHU VỰC PHƯƠNG THỨC THANH TOÁN -->
                  <div class="pt-3 border-t border-slate-100 space-y-3">
                    <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500">Phương thức thanh toán</h4>
                    
                    <!-- Hộp số dư ví -->
                    <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs text-slate-700">
                      <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                        <span>Số dư ví: <strong class="text-slate-900">0đ</strong></span>
                      </div>
                      <label class="flex items-center gap-1.5 cursor-pointer select-none">
                        <input type="checkbox" id="cb-use-wallet" disabled class="rounded border-slate-300 text-slate-900 focus:ring-0 opacity-50 cursor-not-allowed" />
                        <span class="text-slate-400">Ưu tiên dùng số dư</span>
                      </label>
                    </div>

                    <!-- Hộp chọn ngân hàng MB BANK (Active) -->
                    <div class="border-2 border-slate-900 bg-slate-50/70 p-3.5 rounded-xl flex items-center justify-between shadow-sm cursor-pointer">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-lg bg-blue-900 text-white flex items-center justify-center font-black text-sm tracking-tighter shadow-sm">
                          MB
                        </div>
                        <div>
                          <div class="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                            MB BANK
                            <span class="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">VietQR 24/7</span>
                          </div>
                          <div class="text-xs text-slate-500">Ngân hàng Quân Đội • Tự động duyệt đơn 30s</div>
                        </div>
                      </div>
                      <div class="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                      </div>
                    </div>
                  </div>

                  <!-- Nút bấm chính "Đặt hàng và thanh toán" -->
                  <button type="button" id="btn-proceed-checkout" 
                          class="w-full bg-slate-900 text-white text-base font-bold py-3.5 rounded-xl hover:bg-slate-800 active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2 group">
                    <span>Đặt hàng và thanh toán</span>
                    <svg class="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                    </svg>
                  </button>

                  <div class="text-[11px] text-center text-slate-400 flex items-center justify-center gap-1.5 pt-1">
                    <svg class="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                    Bàn giao tài khoản tự động ngay sau khi quét mã
                  </div>

                </div>
              </div>

            </div>

          </div>
        </div>
      `;

      container.innerHTML = html;
      bindItemEvents();

      // Xử lý sự kiện Voucher
      const voucherInput = container.querySelector('#input-voucher-code');
      const voucherBtn = container.querySelector('#btn-apply-voucher');
      const voucherClearBtn = container.querySelector('#btn-clear-voucher');
      const voucherStatus = container.querySelector('#voucher-status-msg');
      const presetBtns = container.querySelectorAll('.btn-preset-voucher');

      presetBtns.forEach((btn) => {
        btn.onclick = () => {
          if (voucherInput) {
            voucherInput.value = btn.dataset.code;
            if (voucherBtn) voucherBtn.click();
          }
        };
      });

      if (voucherBtn) {
        voucherBtn.onclick = () => {
          const code = (voucherInput ? voucherInput.value : '').trim().toUpperCase();
          if (!code) {
            showToast('Vui lòng nhập mã giảm giá', 'warning');
            return;
          }

          if (DISCOUNT_CODES[code]) {
            appliedVoucher = DISCOUNT_CODES[code];
            window.ShopVietState.currentVoucher = appliedVoucher;
            if (voucherStatus) {
              voucherStatus.className = 'mt-3 text-xs text-emerald-700 bg-emerald-50 p-2 rounded-lg flex items-center gap-1.5 border border-emerald-200';
              voucherStatus.innerHTML = `
                <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                <span>Áp dụng thành công mã <strong>${appliedVoucher.code}</strong>: ${appliedVoucher.desc}</span>
              `;
              voucherStatus.classList.remove('hidden');
            }
            if (voucherClearBtn) voucherClearBtn.classList.remove('hidden');
            updateCheckoutDOM();
            showToast(`Đã áp dụng mã giảm giá: ${appliedVoucher.code}`, 'success');
          } else {
            appliedVoucher = null;
            window.ShopVietState.currentVoucher = null;
            if (voucherStatus) {
              voucherStatus.className = 'mt-3 text-xs text-rose-700 bg-rose-50 p-2 rounded-lg flex items-center gap-1.5 border border-rose-200';
              voucherStatus.innerHTML = `
                <svg class="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                <span>Mã giảm giá không tồn tại hoặc đã hết hạn!</span>
              `;
              voucherStatus.classList.remove('hidden');
            }
            updateCheckoutDOM();
            showToast('Mã giảm giá không hợp lệ', 'error');
          }
        };
      }

      if (voucherClearBtn) {
        voucherClearBtn.onclick = () => {
          if (voucherInput) voucherInput.value = '';
          appliedVoucher = null;
          window.ShopVietState.currentVoucher = null;
          if (voucherStatus) voucherStatus.classList.add('hidden');
          voucherClearBtn.classList.add('hidden');
          updateCheckoutDOM();
          showToast('Đã hủy áp dụng mã giảm giá', 'info');
        };
      }

      // Xử lý sự kiện "Đặt hàng và thanh toán"
      const proceedBtn = container.querySelector('#btn-proceed-checkout');
      if (proceedBtn) {
        proceedBtn.onclick = () => {
        const cart = window.ShopVietState.cart || [];
        if (cart.length === 0) {
          showToast('Giỏ hàng trống! Vui lòng chọn sản phẩm.', 'error');
          return;
        }

        const { finalTotal, subtotal, discount, totalItems } = calculateTotals();
        const orderId = generateOrderCode();
        const memo = generateTransferMemo();
        const orderDate = new Date();

        const newOrder = {
          id: orderId,
          orderCode: orderId,
          memo: memo,
          items: JSON.parse(JSON.stringify(cart)),
          totalItems: totalItems,
          subtotal: subtotal,
          discount: discount,
          amount: finalTotal,
          voucher: appliedVoucher ? appliedVoucher.code : null,
          paymentMethod: 'MB BANK (VietQR)',
          accountNumber: '00223366888',
          accountName: 'NGUYEN VAN HUY',
          bankName: 'MB Bank (Ngân hàng Quân Đội)',
          createdAt: orderDate.toISOString(),
          createdAtFormatted: `${orderDate.getHours().toString().padStart(2, '0')}:${orderDate.getMinutes().toString().padStart(2, '0')} ${orderDate.getDate().toString().padStart(2, '0')}/${(orderDate.getMonth() + 1).toString().padStart(2, '0')}/${orderDate.getFullYear()}`,
          status: 'pending',
          expiresInSeconds: 600
        };

        window.ShopVietState.currentOrder = newOrder;
        showToast(`Đã tạo đơn hàng ${orderId}! Đang chuyển sang thanh toán...`, 'success');

        // Chuyển sang màn hình 2: Quét mã VietQR
        setTimeout(() => {
          navigate('pay', { order: newOrder });
        }, 350);
      };
      }

      return html;
    }
  };

  // =========================================================================
  // VIEW 2: PAY (QUÉT MÃ VIETQR LIVE & XÁC NHẬN THANH TOÁN)
  // =========================================================================
  window.ShopVietViews.pay = {
    render: function (targetOrParams, maybeParams) {
      clearPaymentCountdown();

      let container = null;
      let params = {};

      if (targetOrParams && (targetOrParams.nodeType === 1 || typeof targetOrParams === 'string')) {
        container = getTargetContainer(targetOrParams);
        params = maybeParams || {};
      } else {
        container = getTargetContainer();
        params = targetOrParams || {};
      }

      // Lấy thông tin đơn hàng hiện tại
      let order = params.order || window.ShopVietState.currentOrder;

      // Nếu không có đơn hàng nào, tạo đơn mặc định để demo mượt mà
      if (!order) {
        const orderId = generateOrderCode();
        const memo = generateTransferMemo();
        const orderDate = new Date();
        order = {
          id: orderId,
          orderCode: orderId,
          memo: memo,
          items: [Object.assign({}, SAMPLE_CART_ITEM)],
          totalItems: 1,
          subtotal: 45000,
          discount: 0,
          amount: 45000,
          paymentMethod: 'MB BANK (VietQR)',
          accountNumber: '00223366888',
          accountName: 'NGUYEN VAN HUY',
          bankName: 'MB Bank (Ngân hàng Quân Đội)',
          createdAt: orderDate.toISOString(),
          createdAtFormatted: `${orderDate.getHours().toString().padStart(2, '0')}:${orderDate.getMinutes().toString().padStart(2, '0')} ${orderDate.getDate().toString().padStart(2, '0')}/${(orderDate.getMonth() + 1).toString().padStart(2, '0')}/${orderDate.getFullYear()}`,
          status: 'pending',
          expiresInSeconds: 600
        };
        window.ShopVietState.currentOrder = order;
      }

      const vietQrUrl = `https://api.vietqr.io/image/970422-00223366888-qrxY91.jpg?amount=${order.amount}&addInfo=${encodeURIComponent(order.memo)}&accountName=${encodeURIComponent(order.accountName || 'NGUYEN VAN HUY')}`;

      const html = `
        <div class="pay-view-wrapper min-h-screen bg-slate-50/60 py-8 px-4 sm:px-6 lg:px-8 font-sans text-slate-800">
          <div class="max-w-5xl mx-auto space-y-8">

            <!-- THANH TIẾN TRÌNH (STEPPER) 3 BƯỚC -->
            <div class="stepper-container flex items-center justify-center max-w-2xl mx-auto px-4">
              <div class="flex items-center gap-2 sm:gap-4 w-full justify-between sm:justify-center">
                <!-- Bước 1: Giỏ hàng (Đã tick V xanh lá) -->
                <div class="flex items-center gap-2">
                  <span class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs sm:text-sm font-bold shadow-sm">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                  </span>
                  <span class="text-xs sm:text-sm font-medium text-slate-600 hidden xs:inline">1. Giỏ hàng</span>
                </div>

                <div class="flex-1 max-w-[40px] sm:max-w-[70px] h-0.5 bg-emerald-500"></div>

                <!-- Bước 2: Đặt hàng (Đã tick V xanh lá) -->
                <div class="flex items-center gap-2">
                  <span class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs sm:text-sm font-bold shadow-sm">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                  </span>
                  <span class="text-xs sm:text-sm font-medium text-slate-600 hidden xs:inline">2. Đặt hàng</span>
                </div>

                <div class="flex-1 max-w-[40px] sm:max-w-[70px] h-0.5 bg-slate-300"></div>

                <!-- Bước 3: Thanh toán VietQR (Đang active) -->
                <div class="flex items-center gap-2">
                  <span class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs sm:text-sm font-bold shadow-md ring-4 ring-slate-900/10">
                    3
                  </span>
                  <span class="text-xs sm:text-sm font-bold text-slate-900">3. Thanh toán VietQR</span>
                </div>
              </div>
            </div>

            <!-- CARD CHÍNH: QUÉT MÃ ĐỂ THANH TOÁN -->
            <div class="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-md">
              
              <!-- THANH CÔNG CỤ GÓC TRÊN -->
              <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
                <div>
                  <div class="flex items-center gap-3">
                    <h2 class="text-xl sm:text-2xl font-black text-slate-900">Quét mã để thanh toán</h2>
                    <span class="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                      ${order.orderCode}
                    </span>
                  </div>
                  <p class="text-xs text-slate-500 mt-1">Đơn hàng được khởi tạo lúc ${order.createdAtFormatted || 'vừa xong'}</p>
                </div>

                <!-- 3 nút hành động -->
                <div class="flex items-center flex-wrap gap-2 w-full sm:w-auto">
                  <!-- Nút làm mới trạng thái -->
                  <button type="button" id="btn-refresh-status" 
                          class="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5" title="Kiểm tra tiền về">
                    <svg id="icon-refresh-spin" class="w-3.5 h-3.5 text-slate-600 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                    <span>Làm mới</span>
                  </button>

                  <!-- Nút đổi phương thức -->
                  <button type="button" id="btn-change-method" 
                          class="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5" title="Quay lại chọn phương thức khác">
                    <svg class="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                    </svg>
                    <span>Đổi phương thức</span>
                  </button>

                  <!-- Nút hủy đơn (viền đỏ) -->
                  <button type="button" id="btn-cancel-order" 
                          class="px-3 py-2 text-xs font-medium text-rose-600 hover:text-white border border-rose-200 hover:bg-rose-600 rounded-xl transition flex items-center gap-1.5" title="Hủy đơn hàng này">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                    <span>Hủy đơn</span>
                  </button>
                </div>
              </div>

              <!-- BỐ CỤC 2 CỘT BÊN TRONG -->
              <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">

                <!-- CỘT TRÁI (7 COLS): KHUNG MÃ QR VÀ BẢNG THÔNG TIN CHUYỂN KHOẢN -->
                <div class="lg:col-span-7 space-y-6">
                  
                  <!-- Khung chứa mã QR lớn -->
                  <div class="flex flex-col items-center justify-center p-6 bg-slate-50/70 border border-slate-200/80 rounded-2xl relative overflow-hidden group">
                    <div class="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full bg-blue-600"></span>
                      Mã VietQR Tự Động Khớp Lệnh MB Bank
                    </div>

                    <!-- Khung ảnh QR có góc ngắm Viewfinder -->
                    <div class="relative p-3 bg-white rounded-2xl shadow-sm border border-slate-200 max-w-[280px] w-full">
                      <!-- 4 góc ngắm trang trí -->
                      <div class="absolute top-1 left-1 w-4 h-4 border-t-2 border-l-2 border-slate-900 rounded-tl-sm pointer-events-none"></div>
                      <div class="absolute top-1 right-1 w-4 h-4 border-t-2 border-r-2 border-slate-900 rounded-tr-sm pointer-events-none"></div>
                      <div class="absolute bottom-1 left-1 w-4 h-4 border-b-2 border-l-2 border-slate-900 rounded-bl-sm pointer-events-none"></div>
                      <div class="absolute bottom-1 right-1 w-4 h-4 border-b-2 border-r-2 border-slate-900 rounded-br-sm pointer-events-none"></div>

                      <!-- Ảnh VietQR -->
                      <div id="qr-img-wrapper" class="aspect-square w-full flex items-center justify-center overflow-hidden rounded-xl bg-white">
                        <img id="vietqr-live-img" 
                             src="${vietQrUrl}" 
                             alt="VietQR MB Bank - ${order.orderCode}" 
                             class="w-full h-full object-contain transition-transform duration-300 group-hover:scale-[1.02]" />
                      </div>
                    </div>

                    <p class="text-[11px] text-slate-400 mt-3 text-center">
                      Mở app ngân hàng bất kỳ (MB, Vietcombank, Techcombank, MoMo...) để quét mã
                    </p>
                  </div>

                  <!-- BẢNG THÔNG TIN CHUYỂN KHOẢN CHI TIẾT (5 DÒNG KÈM NÚT COPY) -->
                  <div class="space-y-3">
                    <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <svg class="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                      Thông tin chuyển khoản thủ công
                    </h3>

                    <div class="bg-slate-50/80 rounded-2xl border border-slate-200/80 divide-y divide-slate-200/60 overflow-hidden text-sm">
                      
                      <!-- 1. Ngân hàng nhận -->
                      <div class="p-3.5 sm:px-4 flex items-center justify-between gap-3">
                        <div class="text-slate-500 text-xs sm:text-sm">Ngân hàng nhận:</div>
                        <div class="flex items-center gap-2 text-right">
                          <span class="font-bold text-slate-900 text-xs sm:text-sm">MB Bank (Ngân hàng Quân Đội)</span>
                        </div>
                      </div>

                      <!-- 2. Số tài khoản -->
                      <div class="p-3.5 sm:px-4 flex items-center justify-between gap-3">
                        <div class="text-slate-500 text-xs sm:text-sm">Số tài khoản:</div>
                        <div class="flex items-center gap-2">
                          <span class="font-mono font-bold text-slate-900 text-base sm:text-lg select-all">00223366888</span>
                          <button type="button" class="btn-copy px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition shadow-2xs" data-copy="00223366888">
                            Sao chép
                          </button>
                        </div>
                      </div>

                      <!-- 3. Chủ tài khoản -->
                      <div class="p-3.5 sm:px-4 flex items-center justify-between gap-3">
                        <div class="text-slate-500 text-xs sm:text-sm">Chủ tài khoản:</div>
                        <div class="flex items-center gap-2">
                          <span class="font-bold text-slate-900 uppercase text-xs sm:text-sm select-all">NGUYEN VAN HUY</span>
                          <button type="button" class="btn-copy px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition shadow-2xs" data-copy="NGUYEN VAN HUY">
                            Sao chép
                          </button>
                        </div>
                      </div>

                      <!-- 4. Số tiền -->
                      <div class="p-3.5 sm:px-4 flex items-center justify-between gap-3">
                        <div class="text-slate-500 text-xs sm:text-sm">Số tiền:</div>
                        <div class="flex items-center gap-2">
                          <span class="font-mono font-black text-rose-600 text-base sm:text-lg select-all">${formatMoney(order.amount)}đ</span>
                          <button type="button" class="btn-copy px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition shadow-2xs" data-copy="${order.amount}">
                            Sao chép
                          </button>
                        </div>
                      </div>

                      <!-- 5. Nội dung chuyển khoản -->
                      <div class="p-3.5 sm:px-4 flex items-center justify-between gap-3 bg-amber-50/50">
                        <div class="text-amber-900 font-semibold text-xs sm:text-sm flex items-center gap-1">
                          Nội dung CK:
                        </div>
                        <div class="flex items-center gap-2">
                          <span class="font-mono font-black text-slate-900 text-base sm:text-lg bg-white px-2 py-0.5 rounded border border-amber-300 select-all tracking-wider">${order.memo}</span>
                          <button type="button" class="btn-copy px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition shadow-sm" data-copy="${order.memo}">
                            Sao chép
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>

                  <!-- Khung cảnh báo màu cam nhạt -->
                  <div class="bg-amber-50 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-800 leading-relaxed mt-4 flex items-start gap-2.5 shadow-2xs">
                    <svg class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                    <div>
                      <strong>⚠️ Lưu ý quan trọng:</strong> Vui lòng nhập <strong>CHÍNH XÁC</strong> nội dung chuyển khoản <code class="font-mono font-bold bg-amber-100/80 px-1 py-0.5 rounded text-amber-900">${order.memo}</code> để hệ thống tự động nhận diện và hoàn tất đơn trong 30 giây.
                    </div>
                  </div>

                </div>

                <!-- CỘT PHẢI (5 COLS): HỘP ĐƠN HÀNG, RADAR VÀ NÚT DEMO WEBHOOK -->
                <div class="lg:col-span-5 space-y-5">
                  
                  <!-- Hộp 1: Thông tin đơn hàng -->
                  <div class="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/80 space-y-3">
                    <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500">Chi tiết đơn hàng</h3>
                    
                    <div class="space-y-2 text-xs sm:text-sm">
                      <div class="flex justify-between">
                        <span class="text-slate-500">Mã đơn hàng:</span>
                        <span class="font-mono font-bold text-slate-900">${order.orderCode}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-slate-500">Ngày tạo:</span>
                        <span class="text-slate-700">${order.createdAtFormatted || 'Vừa xong'}</span>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="text-slate-500">Trạng thái:</span>
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200/70">
                          <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                          Chờ thanh toán
                        </span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-slate-500">Phương thức:</span>
                        <span class="font-medium text-slate-800">MB BANK (VietQR 24/7)</span>
                      </div>
                    </div>
                  </div>

                  <!-- Hộp 2: CẦN THANH TOÁN & ĐỒNG HỒ ĐẾM NGƯỢC RADAR -->
                  <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4 text-center">
                    <div>
                      <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Số tiền cần thanh toán</span>
                      <div class="text-3xl font-black text-slate-900 tracking-tight mt-1">
                        ${formatMoney(order.amount)}đ
                      </div>
                    </div>

                    <!-- Đồng hồ đếm ngược -->
                    <div class="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                      <div class="text-[11px] text-slate-500 font-medium">Đơn hàng sẽ tự hủy sau:</div>
                      <div id="payment-countdown-timer" class="text-2xl font-mono font-black text-rose-600 tracking-wider mt-0.5">
                        09:59
                      </div>
                      <div class="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
                        <div id="countdown-progress-bar" class="bg-rose-500 h-full rounded-full transition-all duration-1000" style="width: 100%;"></div>
                      </div>
                    </div>

                    <!-- Hiệu ứng Radar xoay tròn kiểm tra giao dịch -->
                    <div class="pt-2 flex items-center justify-center gap-2.5 text-xs text-slate-500">
                      <div class="relative flex h-3 w-3">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
                      </div>
                      <span class="font-medium animate-pulse">Đang lắng nghe giao dịch từ MB Bank...</span>
                    </div>
                  </div>

                  <!-- Hộp 3: NÚT GIẢ LẬP DEMO "⚡ Xác nhận đã thanh toán (Demo Webhook)" -->
                  <div class="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-200/80 space-y-3">
                    <div class="flex items-center gap-2">
                      <span class="flex h-2 w-2 rounded-full bg-emerald-500"></span>
                      <h4 class="text-xs font-bold uppercase tracking-wider text-emerald-900">Môi trường thử nghiệm (Sandbox)</h4>
                    </div>
                    <p class="text-xs text-emerald-800 leading-relaxed">
                      Bạn không cần chuyển tiền thật! Bấm nút bên dưới để giả lập hệ thống nhận Webhook thanh toán thành công 100%.
                    </p>

                    <button type="button" id="btn-simulate-webhook" 
                            class="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm group">
                      <svg class="w-4 h-4 text-emerald-200 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.381z" clip-rule="evenodd"/>
                      </svg>
                      <span>⚡ Xác nhận đã thanh toán (Demo Webhook)</span>
                    </button>
                  </div>

                </div>

              </div>

            </div>

          </div>
        </div>

        <!-- MODAL BÀN GIAO TÀI KHOẢN SAU KHI THANH TOÁN THÀNH CÔNG -->
        <div id="payment-success-modal" class="fixed inset-0 z-50 hidden flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300">
          <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 transform transition-transform duration-300 scale-95 space-y-6">
            
            <!-- Icon chúc mừng thành công -->
            <div class="text-center">
              <div class="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
              </div>
              <h3 class="text-2xl font-black text-slate-900">Thanh toán thành công!</h3>
              <p class="text-xs text-slate-500 mt-1">Đơn hàng <strong class="text-slate-800 font-mono">${order.orderCode}</strong> đã được hệ thống duyệt tự động.</p>
            </div>

            <!-- Khung thông tin tài khoản bàn giao -->
            <div class="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-3.5 text-xs sm:text-sm">
              <div class="flex items-center justify-between pb-2 border-b border-slate-200">
                <span class="font-bold text-slate-900 flex items-center gap-1.5">
                  <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
                  Tài khoản số được bàn giao
                </span>
                <span class="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">ĐÃ KÍCH HOẠT</span>
              </div>

              <!-- Chi tiết login -->
              <div class="space-y-2">
                <div>
                  <div class="text-[11px] text-slate-500">Tài khoản / Email:</div>
                  <div class="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 font-mono text-slate-900 text-xs sm:text-sm">
                    <span id="delivered-email">shopviet_plus_${Math.floor(1000 + Math.random() * 9000)}@gmail.com</span>
                    <button type="button" class="btn-copy text-xs text-slate-500 hover:text-slate-900" data-copy="shopviet_plus_demo@gmail.com">Sao chép</button>
                  </div>
                </div>

                <div>
                  <div class="text-[11px] text-slate-500">Mật khẩu:</div>
                  <div class="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 font-mono text-slate-900 text-xs sm:text-sm">
                    <span id="delivered-pass">VietAI#2026@Pass</span>
                    <button type="button" class="btn-copy text-xs text-slate-500 hover:text-slate-900" data-copy="VietAI#2026@Pass">Sao chép</button>
                  </div>
                </div>

                <div class="text-[11px] text-slate-500 pt-1 leading-relaxed">
                  💡 <em>Lưu ý: Bạn cũng có thể xem lại thông tin này bất kỳ lúc nào tại mục <strong>Lịch sử đơn hàng</strong> trong Dashboard.</em>
                </div>
              </div>
            </div>

            <!-- Tích lũy điểm thưởng -->
            <div class="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-xs text-amber-900">
              <span class="flex items-center gap-1.5 font-medium">
                🎁 Điểm thưởng nhận được:
              </span>
              <span class="font-bold font-mono text-sm text-amber-700">+45 Điểm</span>
            </div>

            <!-- Nút hành động -->
            <div class="flex flex-col sm:flex-row gap-3 pt-2">
              <button type="button" id="btn-modal-go-dashboard" 
                      class="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm transition text-center shadow-md">
                Xem trong Dashboard
              </button>
              <button type="button" id="btn-modal-go-home" 
                      class="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-3 px-4 rounded-xl text-xs sm:text-sm transition text-center">
                Về trang chủ
              </button>
            </div>

          </div>
        </div>
      `;

      container.innerHTML = html;

      // Xử lý lỗi ảnh QR fallback
      const qrImg = container.querySelector('#vietqr-live-img');
      const qrWrapper = container.querySelector('#qr-img-wrapper');
      if (qrImg && qrWrapper) {
        qrImg.onerror = () => {
          qrWrapper.innerHTML = getFallbackQrSvg(order.orderCode);
        };
      }

      // Gắn sự kiện copy cho các nút
      const copyButtons = container.querySelectorAll('.btn-copy');
      copyButtons.forEach((btn) => {
        btn.onclick = () => {
          const textToCopy = btn.dataset.copy;
          copyTextToClipboard(textToCopy, btn);
        };
      });

      // ĐỒNG HỒ ĐẾM NGƯỢC 10 PHÚT (09:59)
      let remainingSeconds = order.expiresInSeconds || 600;
      const timerDisplay = container.querySelector('#payment-countdown-timer');
      const progressBar = container.querySelector('#countdown-progress-bar');

      function updateCountdown() {
        if (remainingSeconds <= 0) {
          clearPaymentCountdown();
          if (timerDisplay) {
            timerDisplay.textContent = '00:00 (Hết hạn)';
            timerDisplay.classList.add('text-slate-400');
          }
          if (progressBar) progressBar.style.width = '0%';
          showToast('Đơn hàng đã hết hạn thanh toán!', 'warning');
          return;
        }

        const mins = Math.floor(remainingSeconds / 60);
        const secs = remainingSeconds % 60;
        if (timerDisplay) {
          timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        if (progressBar) {
          const percent = (remainingSeconds / 600) * 100;
          progressBar.style.width = `${percent}%`;
        }
        remainingSeconds--;
      }

      updateCountdown();
      window.__shopvietPayTimer = setInterval(updateCountdown, 1000);

      // Nút "Làm mới trạng thái"
      const refreshBtn = container.querySelector('#btn-refresh-status');
      const spinIcon = container.querySelector('#icon-refresh-spin');
      if (refreshBtn) {
        refreshBtn.onclick = () => {
          if (spinIcon) spinIcon.classList.add('animate-spin');
          showToast('Đang đồng bộ giao dịch ngân hàng MB...', 'info');
          setTimeout(() => {
            if (spinIcon) spinIcon.classList.remove('animate-spin');
            showToast('Chưa ghi nhận biến động số dư. Vui lòng thử lại sau giây lát!', 'warning');
          }, 1200);
        };
      }

      // Nút "Đổi phương thức"
      const changeMethodBtn = container.querySelector('#btn-change-method');
      if (changeMethodBtn) {
        changeMethodBtn.onclick = () => {
          clearPaymentCountdown();
          navigate('checkout');
        };
      }

      // Nút "Hủy đơn"
      const cancelBtn = container.querySelector('#btn-cancel-order');
      if (cancelBtn) {
        cancelBtn.onclick = () => {
          if (confirm(`Bạn có chắc chắn muốn hủy đơn hàng ${order.orderCode} không?`)) {
            clearPaymentCountdown();
            window.ShopVietState.currentOrder = null;
            showToast('Đã hủy đơn hàng thành công', 'info');
            navigate('home');
          }
        };
      }

      // NÚT GIẢ LẬP DEMO "⚡ Xác nhận đã thanh toán (Demo Webhook)"
      const webhookBtn = container.querySelector('#btn-simulate-webhook');
      const successModal = container.querySelector('#payment-success-modal');

      if (webhookBtn) {
        webhookBtn.onclick = () => {
          webhookBtn.disabled = true;
          webhookBtn.classList.add('opacity-75', 'cursor-wait');
          showToast('Đang nhận tín hiệu Webhook từ MB Bank...', 'info');

          setTimeout(() => {
            clearPaymentCountdown();

            // Cập nhật trạng thái đơn hàng
            order.status = 'completed';
            order.paidAt = new Date().toISOString();

            // Lưu vào danh sách đơn hàng đã mua
            window.ShopVietState.orders = window.ShopVietState.orders || [];
            window.ShopVietState.orders.unshift(order);

            // Dọn dẹp giỏ hàng
            window.ShopVietState.cart = [];
            window.ShopVietState.currentVoucher = null;

            // Cộng điểm thưởng
            if (window.ShopVietState.user) {
              window.ShopVietState.user.rewardPoints = (window.ShopVietState.user.rewardPoints || 0) + 45;
            }

            // Hiển thị modal thành công
            if (successModal) {
              successModal.classList.remove('hidden');
              const modalBox = successModal.querySelector('.scale-95');
              if (modalBox) {
                setTimeout(() => {
                  modalBox.classList.remove('scale-95');
                  modalBox.classList.add('scale-100');
                }, 50);
              }
            }

            showToast('Giao dịch đã khớp! Thanh toán thành công.', 'success');
          }, 900);
        };
      }

      // Điều hướng từ Modal thành công
      const goDashboardBtn = container.querySelector('#btn-modal-go-dashboard');
      if (goDashboardBtn) {
        goDashboardBtn.onclick = () => {
          successModal.classList.add('hidden');
          navigate('dashboard');
        };
      }

      const goHomeBtn = container.querySelector('#btn-modal-go-home');
      if (goHomeBtn) {
        goHomeBtn.onclick = () => {
          successModal.classList.add('hidden');
          navigate('home');
        };
      }

      return html;
    }
  };

  console.log('[ShopViet247] Checkout & Pay views loaded successfully.');
})();
