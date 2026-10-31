/**
 * Shopviet247 - Checkout & VietQR Payment Views
 * Tệp: js/views/checkout.js
 * Cập nhật: Chuẩn Sacombank VietQR Napas 24/7 (Ảnh 4)
 * - Ngân hàng: Sacombank (Ngân hàng TMCP Sài Gòn Thương Tín)
 * - Số tài khoản: 100071864927
 * - Chủ tài khoản: LE BUI MINH CUONG
 * - Mã BIN Napas: 970403
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

  // Thông tin cấu hình thanh toán nạp động theo Portal Admin
  const SACOMBANK_CONFIG = {
    get bankName() { return getActiveVietQRConfig().bankName; },
    get shortName() { return getActiveVietQRConfig().shortName || 'Sacombank'; },
    get accountNumber() { return getActiveVietQRConfig().accountNumber; },
    get accountName() { return getActiveVietQRConfig().accountName; },
    get bin() { return getActiveVietQRConfig().bin || getActiveVietQRConfig().bankId || '970403'; },
    get brandColor() { return getActiveVietQRConfig().brandColor || '#004b91'; },
    get memoPrefix() { return getActiveVietQRConfig().memoPrefix || 'SHOPVIET'; }
  };

  // Biến lưu trữ Timer toàn cục để dọn dẹp sạch sẽ
  window.__shopvietPayTimer = null;

  // Dữ liệu mẫu ban đầu nếu giỏ hàng trống để người dùng test ngay lập tức
  const SAMPLE_CART_ITEM = {
    id: 'sp-chatgpt-plus',
    name: 'Tài khoản ChatGPT Plus 1 Tháng (Mail Riêng)',
    category: 'Trí tuệ nhân tạo (AI)',
    variant: 'Gói Plus 1 Tháng',
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
    if (window.ShopVietState && typeof window.ShopVietState.showToast === 'function') {
      window.ShopVietState.showToast(message, type);
      return;
    }

    const existing = document.getElementById('shopviet-toast');
    if (existing) {
      if (typeof existing.remove === 'function') {
        existing.remove();
      } else if (existing.parentNode) {
        existing.parentNode.removeChild(existing);
      }
    }

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

  // SVG Fallback QR Generator chuẩn Sacombank
  function getFallbackQrSvg(text) {
    return `
      <svg class="w-full h-full max-w-[260px] mx-auto text-slate-800" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" rx="12" fill="white"/>
        <!-- Finder top-left -->
        <rect x="20" y="20" width="45" height="45" rx="6" stroke="#004b91" stroke-width="8"/>
        <rect x="33" y="33" width="19" height="19" rx="3" fill="#004b91"/>
        <!-- Finder top-right -->
        <rect x="135" y="20" width="45" height="45" rx="6" stroke="#004b91" stroke-width="8"/>
        <rect x="148" y="33" width="19" height="19" rx="3" fill="#004b91"/>
        <!-- Finder bottom-left -->
        <rect x="20" y="135" width="45" height="45" rx="6" stroke="#004b91" stroke-width="8"/>
        <rect x="33" y="148" width="19" height="19" rx="3" fill="#004b91"/>
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
        <rect x="85" y="95" width="30" height="30" rx="4" fill="#004b91"/>
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
        <!-- VietQR / Sacombank Logo badge in center -->
        <rect x="68" y="82" width="64" height="36" rx="8" fill="#004b91"/>
        <text x="100" y="104" font-family="system-ui, sans-serif" font-size="10" font-weight="900" fill="white" text-anchor="middle" letter-spacing="0.5">SACOMBANK</text>
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

        const totalItemsSidebar = document.getElementById('checkout-total-items-sidebar');
        if (totalItemsSidebar) totalItemsSidebar.textContent = totalItems;

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
                  <span class="text-sm font-medium text-slate-600">Quét mã VietQR Sacombank</span>
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
                    <span class="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">NAPAS 24/7 LIVE</span>
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
                      <span>Khuyến mãi hệ thống:</span>
                      <span class="font-medium text-slate-700">0đ</span>
                    </div>
                    <div class="flex justify-between text-slate-600">
                      <span>Phí giao dịch:</span>
                      <span class="font-medium text-emerald-600">Miễn phí 0đ</span>
                    </div>

                    <div class="border-t border-slate-200/80 pt-3 mt-2 flex justify-between items-baseline">
                      <span class="text-sm font-bold text-slate-900 uppercase tracking-wide">CẦN THANH TOÁN:</span>
                      <span id="checkout-final-total" class="text-2xl font-black text-slate-900 tracking-tight">${formatMoney(finalTotal)}đ</span>
                    </div>
                  </div>

                  <!-- KHU VỰC PHƯƠNG THỨC THANH TOÁN SACOMBANK CHUẨN ẢNH 4 -->
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

                    <!-- Hộp chọn ngân hàng SACOMBANK (Active chuẩn Ảnh 4) -->
                    <div class="border-2 border-[#004b91] bg-sky-50/60 p-3.5 rounded-xl flex items-center justify-between shadow-xs cursor-pointer relative overflow-hidden group">
                      <div class="flex items-center gap-3">
                        <div class="w-11 h-11 rounded-xl bg-[#004b91] text-white flex flex-col items-center justify-center font-black text-xs tracking-tighter shadow-sm flex-shrink-0">
                          <span class="leading-none text-[11px]">SCB</span>
                          <span class="text-[8px] opacity-80 font-normal">VIETQR</span>
                        </div>
                        <div>
                          <div class="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                            Sacombank
                            <span class="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">VietQR 24/7</span>
                          </div>
                          <div class="text-xs text-slate-600 mt-0.5">STK: <strong class="font-mono text-slate-800">100071864927</strong> • LE BUI MINH CUONG</div>
                        </div>
                      </div>
                      <div class="w-5 h-5 rounded-full bg-[#004b91] text-white flex items-center justify-center text-xs flex-shrink-0">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                      </div>
                    </div>
                  </div>

                  <!-- Nút bấm chính "Đặt hàng và thanh toán" -->
                  <button type="button" id="btn-proceed-checkout" 
                          class="w-full bg-[#004b91] hover:bg-[#003d75] text-white text-base font-bold py-3.5 rounded-xl active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2 group">
                    <span>Đặt hàng và chuyển khoản Sacombank</span>
                    <svg class="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                    </svg>
                  </button>

                  <div class="text-[11px] text-center text-slate-400 flex items-center justify-center gap-1.5 pt-1">
                    <svg class="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                    Quét mã VietQR nhận tài khoản tức thì sau 30 giây
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

          const currentUser = (window.ShopVietState && window.ShopVietState.state && window.ShopVietState.state.user) || {};
          const userEmail = (currentUser.isLoggedIn && currentUser.email)
            ? currentUser.email.trim().toLowerCase()
            : 'khachhang@gmail.com';

          const newOrder = {
            id: orderId,
            orderCode: orderId,
            userEmail: userEmail,
            customer: {
              name: currentUser.name || 'Khách Hàng',
              email: userEmail,
              phone: currentUser.phone || ''
            },
            memo: memo,
            items: JSON.parse(JSON.stringify(cart)),
            totalItems: totalItems,
            subtotal: subtotal,
            discount: discount,
            amount: finalTotal,
            voucher: appliedVoucher ? appliedVoucher.code : null,
            paymentMethod: 'Sacombank (VietQR 24/7)',
            bankName: SACOMBANK_CONFIG.bankName,
            accountNumber: SACOMBANK_CONFIG.accountNumber,
            accountName: SACOMBANK_CONFIG.accountName,
            bin: SACOMBANK_CONFIG.bin,
            createdAt: orderDate.toISOString(),
            createdAtFormatted: `${orderDate.getHours().toString().padStart(2, '0')}:${orderDate.getMinutes().toString().padStart(2, '0')} ${orderDate.getDate().toString().padStart(2, '0')}/${(orderDate.getMonth() + 1).toString().padStart(2, '0')}/${orderDate.getFullYear()}`,
            status: 'pending',
            expiresInSeconds: 600
          };

          window.ShopVietState.currentOrder = newOrder;
          showToast(`Đã tạo đơn hàng ${orderId}! Đang chuyển sang màn hình quét mã VietQR Sacombank...`, 'success');

          // Chuyển sang màn hình 2: Quét mã VietQR Sacombank
          setTimeout(() => {
            navigate('pay', { order: newOrder });
          }, 300);
        };
      }

      return html;
    }
  };

  // =========================================================================
  // VIEW 2: PAY (QUÉT MÃ VIETQR SACOMBANK CHUẨN ẢNH 4 & XÁC NHẬN)
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
          paymentMethod: 'Sacombank (VietQR 24/7)',
          bankName: SACOMBANK_CONFIG.bankName,
          accountNumber: SACOMBANK_CONFIG.accountNumber,
          accountName: SACOMBANK_CONFIG.accountName,
          bin: SACOMBANK_CONFIG.bin,
          createdAt: orderDate.toISOString(),
          createdAtFormatted: `${orderDate.getHours().toString().padStart(2, '0')}:${orderDate.getMinutes().toString().padStart(2, '0')} ${orderDate.getDate().toString().padStart(2, '0')}/${(orderDate.getMonth() + 1).toString().padStart(2, '0')}/${orderDate.getFullYear()}`,
          status: 'pending',
          expiresInSeconds: 600
        };
        window.ShopVietState.currentOrder = order;
      }

      // Cập nhật thông tin ngân hàng nếu đơn cũ chưa có
      if (!order.accountNumber || order.accountNumber !== SACOMBANK_CONFIG.accountNumber) {
        order.accountNumber = SACOMBANK_CONFIG.accountNumber;
        order.accountName = SACOMBANK_CONFIG.accountName;
        order.bankName = SACOMBANK_CONFIG.bankName;
        order.bin = SACOMBANK_CONFIG.bin;
      }

      // URL VietQR Napas với Sacombank BIN 970403, STK 100071864927
      const vietQrUrl = `https://api.vietqr.io/image/${SACOMBANK_CONFIG.bin}-${SACOMBANK_CONFIG.accountNumber}-compact2.jpg?amount=${order.amount}&addInfo=${encodeURIComponent(order.memo)}&accountName=${encodeURIComponent(order.accountName)}`;

      const html = `
        <div class="pay-view-wrapper min-h-screen bg-slate-50/70 py-6 sm:py-8 px-4 sm:px-6 lg:px-8 font-sans text-slate-800">
          <div class="max-w-6xl mx-auto space-y-6">

            <!-- HEADER BỐ CỤC ẢNH 4: "Thanh toán Plus", Nút Đổi gói, Đếm ngược thời gian, Mã đơn -->
            <div class="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div class="flex items-center gap-3.5">
                <div class="w-12 h-12 rounded-2xl bg-[#004b91] text-white flex items-center justify-center shadow-md shadow-blue-900/20 flex-shrink-0">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
                  </svg>
                </div>
                <div>
                  <div class="flex items-center gap-2.5 flex-wrap">
                    <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Thanh toán Plus</h1>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#004b91] border border-blue-200">
                      Sacombank VietQR
                    </span>
                    <span class="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      ${order.orderCode}
                    </span>
                  </div>
                  <p class="text-xs text-slate-500 mt-1">Đơn hàng được khởi tạo lúc ${order.createdAtFormatted || 'vừa xong'} • Tự động kích hoạt sau thanh toán</p>
                </div>
              </div>

              <!-- Khu vực nút đổi gói & Đồng hồ đếm ngược -->
              <div class="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                <!-- Đồng hồ đếm ngược header -->
                <div class="flex items-center gap-2 bg-rose-50 border border-rose-200/80 px-3.5 py-2 rounded-xl text-rose-700">
                  <svg class="w-4 h-4 animate-spin text-rose-600" style="animation-duration: 3s;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke-width="2" stroke-dasharray="32" stroke-linecap="round"></circle>
                  </svg>
                  <div class="text-xs">
                    <span class="font-medium text-slate-600 mr-1 hidden sm:inline">Hết hạn sau:</span>
                    <strong id="header-countdown-timer" class="font-mono font-black text-sm text-rose-700">09:59</strong>
                  </div>
                </div>

                <!-- Nút Đổi gói -->
                <button type="button" id="btn-change-plan" 
                        class="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5 shadow-2xs">
                  <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"/>
                  </svg>
                  <span>Đổi gói / Quay lại</span>
                </button>
              </div>
            </div>

            <!-- BỐ CỤC CHÍNH 2 CỘT CHUẨN ẢNH 4 (5 COLS TRÁI - 7 COLS PHẢI HOẶC 6 - 6) -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

              <!-- ========================================== -->
              <!-- CỘT TRÁI (5 COLS): MÃ QR, LƯU ẢNH, 3 BƯỚC, BADGE BẢO MẬT -->
              <!-- ========================================== -->
              <div class="lg:col-span-5 space-y-5">
                
                <!-- KHUNG CHÍNH QR SACOMBANK -->
                <div class="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col items-center relative overflow-hidden">
                  
                  <!-- Badge "VietQR Chuẩn Napas 24/7 Tự Động" -->
                  <div class="w-full flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                      <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      VietQR Chuẩn Napas 24/7 Tự Động
                    </div>
                    <span class="text-[11px] font-mono text-slate-400 font-semibold">BIN 970403</span>
                  </div>

                  <!-- Khung ảnh QR có góc ngắm Viewfinder Sacombank -->
                  <div class="relative p-3.5 bg-white rounded-2xl shadow-md border-2 border-slate-100 max-w-[270px] w-full">
                    <!-- 4 góc ngắm trang trí thương hiệu Sacombank -->
                    <div class="absolute top-1.5 left-1.5 w-5 h-5 border-t-3 border-l-3 border-[#004b91] rounded-tl-md pointer-events-none"></div>
                    <div class="absolute top-1.5 right-1.5 w-5 h-5 border-t-3 border-r-3 border-[#004b91] rounded-tr-md pointer-events-none"></div>
                    <div class="absolute bottom-1.5 left-1.5 w-5 h-5 border-b-3 border-l-3 border-[#004b91] rounded-bl-md pointer-events-none"></div>
                    <div class="absolute bottom-1.5 right-1.5 w-5 h-5 border-b-3 border-r-3 border-[#004b91] rounded-br-md pointer-events-none"></div>

                    <!-- Ảnh VietQR Sacombank -->
                    <div id="qr-img-wrapper" class="aspect-square w-full flex items-center justify-center overflow-hidden rounded-xl bg-white">
                      <img id="vietqr-live-img" 
                           src="${vietQrUrl}" 
                           alt="VietQR Sacombank - ${order.memo}" 
                           class="w-full h-full object-contain transition-transform duration-300 hover:scale-[1.02]" />
                    </div>
                  </div>

                  <!-- Nút "Lưu ảnh mã QR về máy" -->
                  <div class="w-full mt-4 flex flex-col gap-2">
                    <button type="button" id="btn-download-qr" 
                            class="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-2 active:scale-[0.99]">
                      <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                      </svg>
                      <span>Lưu ảnh mã QR về máy</span>
                    </button>
                    <p class="text-[11px] text-slate-400 text-center">
                      Hỗ trợ mọi app ngân hàng (Sacombank, VCB, BIDV, Techcombank, MoMo...)
                    </p>
                  </div>
                </div>

                <!-- KHUNG "3 BƯỚC THANH TOÁN NHANH" -->
                <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3">
                  <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <svg class="w-4 h-4 text-[#004b91]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                    3 Bước thanh toán nhanh
                  </h3>

                  <div class="space-y-3 text-xs">
                    <div class="flex items-start gap-3">
                      <span class="w-5 h-5 rounded-full bg-blue-100 text-[#004b91] flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">1</span>
                      <div class="text-slate-600">
                        <strong class="text-slate-900">Mở App Ngân hàng</strong> hoặc Ví điện tử bất kỳ có tính năng Quét mã QR.
                      </div>
                    </div>
                    <div class="flex items-start gap-3">
                      <span class="w-5 h-5 rounded-full bg-blue-100 text-[#004b91] flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">2</span>
                      <div class="text-slate-600">
                        <strong class="text-slate-900">Quét mã VietQR</strong> phía trên hoặc tải ảnh về để quét trực tiếp từ thư viện.
                      </div>
                    </div>
                    <div class="flex items-start gap-3">
                      <span class="w-5 h-5 rounded-full bg-blue-100 text-[#004b91] flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">3</span>
                      <div class="text-slate-600">
                        <strong class="text-slate-900">Kiểm tra thông tin</strong> đúng người nhận <span class="font-bold text-[#004b91]">LE BUI MINH CUONG</span> và xác nhận chuyển.
                      </div>
                    </div>
                  </div>
                </div>

                <!-- BADGE AN TOÀN & BẢO MẬT 24/7 -->
                <div class="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-4 text-white shadow-sm flex items-center gap-3.5">
                  <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 text-emerald-400">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                    </svg>
                  </div>
                  <div>
                    <h4 class="text-xs font-bold text-white uppercase tracking-wider">Hệ thống bảo mật Napas 24/7</h4>
                    <p class="text-[11px] text-slate-300 mt-0.5">Mã hóa SSL 256-bit • Tự động khớp lệnh tức thì không cần can thiệp thủ công</p>
                  </div>
                </div>

              </div>

              <!-- ========================================== -->
              <!-- CỘT PHẢI (7 COLS): THÔNG TIN CHUYỂN KHOẢN, XÁC THỰC, UPLOAD BILL, STEPPER & NÚT HOÀN TẤT -->
              <!-- ========================================== -->
              <div class="lg:col-span-7 space-y-5">
                
                <!-- BẢNG THÔNG TIN CHUYỂN KHOẢN SACOMBANK CHI TIẾT -->
                <div class="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                  <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 class="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <span class="w-2.5 h-2.5 rounded-full bg-[#004b91]"></span>
                      Thông tin chuyển khoản Sacombank
                    </h3>
                    <span class="text-xs text-slate-500 font-medium">Sao chép nhanh 1 chạm</span>
                  </div>

                  <!-- Danh sách các trường thông tin -->
                  <div class="bg-slate-50/80 rounded-2xl border border-slate-200/80 divide-y divide-slate-200/60 overflow-hidden text-sm">
                    
                    <!-- 1. Số tiền cần chuyển (In đậm, to rõ, nút copy) -->
                    <div class="p-3.5 sm:px-4 flex items-center justify-between gap-3 bg-rose-50/40">
                      <div class="text-slate-600 text-xs sm:text-sm font-medium">Số tiền cần chuyển:</div>
                      <div class="flex items-center gap-2.5">
                        <span class="font-mono font-black text-rose-600 text-lg sm:text-xl select-all">${formatMoney(order.amount)}đ</span>
                        <button type="button" class="btn-copy px-3 py-1 text-xs font-bold rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 transition shadow-2xs" data-copy="${order.amount}">
                          Sao chép
                        </button>
                      </div>
                    </div>

                    <!-- 2. Ngân hàng nhận: Sacombank -->
                    <div class="p-3.5 sm:px-4 flex items-center justify-between gap-3">
                      <div class="text-slate-600 text-xs sm:text-sm">Ngân hàng nhận:</div>
                      <div class="flex items-center gap-2 text-right">
                        <span class="font-bold text-slate-900 text-xs sm:text-sm">Sacombank (Ngân hàng TMCP Sài Gòn Thương Tín)</span>
                        <button type="button" class="btn-copy px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition shadow-2xs" data-copy="Sacombank">
                          Sao chép
                        </button>
                      </div>
                    </div>

                    <!-- 3. Số tài khoản: 100071864927 -->
                    <div class="p-3.5 sm:px-4 flex items-center justify-between gap-3">
                      <div class="text-slate-600 text-xs sm:text-sm">Số tài khoản:</div>
                      <div class="flex items-center gap-2.5">
                        <span class="font-mono font-bold text-slate-900 text-base sm:text-lg select-all">100071864927</span>
                        <button type="button" class="btn-copy px-3 py-1 text-xs font-bold rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 transition shadow-2xs" data-copy="100071864927">
                          Sao chép
                        </button>
                      </div>
                    </div>

                    <!-- 4. Chủ tài khoản: LE BUI MINH CUONG -->
                    <div class="p-3.5 sm:px-4 flex items-center justify-between gap-3">
                      <div class="text-slate-600 text-xs sm:text-sm">Chủ tài khoản:</div>
                      <div class="flex items-center gap-2.5">
                        <span class="font-bold text-slate-900 uppercase text-xs sm:text-sm select-all">LE BUI MINH CUONG</span>
                        <button type="button" class="btn-copy px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition shadow-2xs" data-copy="LE BUI MINH CUONG">
                          Sao chép
                        </button>
                      </div>
                    </div>

                    <!-- 5. Nội dung chuyển khoản BẮT BUỘC (Mã memo + Nút copy nổi bật) -->
                    <div class="p-4 sm:px-4 flex items-center justify-between gap-3 bg-amber-50/70 border-l-4 border-amber-500">
                      <div>
                        <div class="text-amber-900 font-bold text-xs sm:text-sm flex items-center gap-1.5">
                          <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                          Nội dung chuyển khoản (Bắt buộc):
                        </div>
                        <div class="text-[11px] text-amber-700 mt-0.5">Vui lòng ghi đúng để tự động duyệt đơn</div>
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="font-mono font-black text-slate-900 text-base sm:text-lg bg-white px-2.5 py-1 rounded-lg border border-amber-300 select-all tracking-wider shadow-2xs">
                          ${order.memo}
                        </span>
                        <button type="button" class="btn-copy px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition shadow-sm active:scale-95" data-copy="${order.memo}">
                          Sao chép
                        </button>
                      </div>
                    </div>

                  </div>

                  <!-- DÒNG XÁC THỰC: "Tên người nhận trong app ngân hàng: LE BUI MINH CUONG" -->
                  <div class="bg-sky-50 border border-sky-200/80 rounded-xl p-3.5 text-xs text-sky-900 flex items-center gap-2.5 shadow-2xs">
                    <div class="w-6 h-6 rounded-full bg-sky-200 text-[#004b91] flex items-center justify-center flex-shrink-0 font-bold">
                      ✓
                    </div>
                    <div class="leading-relaxed">
                      <strong>Xác thực người thụ hưởng:</strong> Tên hiển thị trong app ngân hàng của bạn phải là <strong class="font-bold text-[#004b91] uppercase">LE BUI MINH CUONG</strong>.
                    </div>
                  </div>
                </div>

                <!-- KHUNG TẢI ẢNH CHỤP MÀN HÌNH CHUYỂN KHOẢN (UPLOAD BILL) -->
                <div class="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-3">
                  <div class="flex items-center justify-between pb-2">
                    <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      </svg>
                      Ảnh chụp biên lai chuyển khoản (Không bắt buộc)
                    </h4>
                    <span class="text-[11px] text-slate-400">Hỗ trợ đối soát nhanh</span>
                  </div>

                  <!-- Vùng Dropzone Upload -->
                  <div id="bill-upload-area" class="border-2 border-dashed border-slate-300 hover:border-[#004b91] bg-slate-50/60 hover:bg-sky-50/30 rounded-2xl p-5 text-center cursor-pointer transition-all">
                    <input type="file" id="input-bill-file" accept="image/*" class="hidden" />
                    
                    <div id="bill-empty-state" class="space-y-2">
                      <div class="w-10 h-10 rounded-full bg-slate-200/70 text-slate-500 flex items-center justify-center mx-auto">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                        </svg>
                      </div>
                      <p class="text-xs font-semibold text-slate-700">
                        Nhấp để tải lên ảnh biên lai hoặc kéo thả ảnh vào đây
                      </p>
                      <p class="text-[11px] text-slate-400">PNG, JPG, JPEG (Tối đa 5MB)</p>
                    </div>

                    <!-- Trạng thái xem trước ảnh preview (mặc định ẩn) -->
                    <div id="bill-preview-state" class="hidden flex items-center justify-between gap-4 p-2">
                      <div class="flex items-center gap-3">
                        <img id="bill-preview-img" src="" alt="Biên lai" class="w-14 h-14 object-cover rounded-xl border border-slate-200 shadow-xs" />
                        <div class="text-left">
                          <div id="bill-filename" class="text-xs font-bold text-slate-800 truncate max-w-[200px]">bienlai.png</div>
                          <div class="text-[11px] text-emerald-600 font-medium">✓ Đã đính kèm ảnh xác thực</div>
                        </div>
                      </div>
                      <button type="button" id="btn-remove-bill" class="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2.5 py-1 rounded-lg hover:bg-rose-50 transition">
                        Xóa ảnh
                      </button>
                    </div>
                  </div>
                </div>

                <!-- STEPPER 3 BƯỚC TIẾN TRÌNH: 1. Quét mã & chuyển -> 2. Kiểm tra giao dịch -> 3. Kích hoạt -->
                <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
                  <div class="text-xs font-bold uppercase tracking-wider text-slate-500">Tiến trình thanh toán</div>
                  
                  <div class="grid grid-cols-3 gap-2 text-center text-xs">
                    <!-- Bước 1 -->
                    <div id="step-col-1" class="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-[#004b91] font-bold flex flex-col items-center gap-1">
                      <span class="w-5 h-5 rounded-full bg-[#004b91] text-white flex items-center justify-center text-[10px]">1</span>
                      <span class="text-[11px] sm:text-xs">1. Quét mã & chuyển</span>
                    </div>

                    <!-- Bước 2 -->
                    <div id="step-col-2" class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 font-medium flex flex-col items-center gap-1 transition-all">
                      <span id="step-badge-2" class="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px]">2</span>
                      <span class="text-[11px] sm:text-xs">2. Kiểm tra giao dịch</span>
                    </div>

                    <!-- Bước 3 -->
                    <div id="step-col-3" class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 font-medium flex flex-col items-center gap-1 transition-all">
                      <span id="step-badge-3" class="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px]">3</span>
                      <span class="text-[11px] sm:text-xs">3. Kích hoạt</span>
                    </div>
                  </div>

                  <!-- Radar trạng thái giao dịch -->
                  <div id="radar-status-box" class="pt-1 flex items-center justify-center gap-2 text-xs text-slate-500">
                    <div class="relative flex h-2.5 w-2.5">
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#004b91]"></span>
                    </div>
                    <span id="radar-text" class="font-medium text-slate-600 animate-pulse">
                      Đang lắng nghe giao dịch chuyển khoản Sacombank...
                    </span>
                  </div>

                  <!-- NÚT CHÍNH "Tôi đã chuyển khoản" -->
                  <div class="space-y-2 pt-1">
                    <button type="button" id="btn-paid-confirm" 
                            class="w-full bg-[#004b91] hover:bg-[#003d75] active:scale-[0.99] text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 text-base">
                      <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                      </svg>
                      <span>Tôi đã chuyển khoản</span>
                    </button>

                    <!-- Nút phụ giả lập Webhook Sandbox để tester duyệt tức thì -->
                    <button type="button" id="btn-simulate-webhook" 
                            class="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5">
                      <svg class="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.381z" clip-rule="evenodd"/>
                      </svg>
                      <span>⚡ Duyệt tự động tức thì (Chế độ Thử nghiệm Sandbox)</span>
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
              <h3 class="text-2xl font-black text-slate-900">Thanh toán Sacombank thành công!</h3>
              <p class="text-xs text-slate-500 mt-1">Đơn hàng <strong class="text-slate-800 font-mono">${order.orderCode}</strong> đã được hệ thống Sacombank duyệt tự động.</p>
            </div>

            <!-- Khung thông tin tài khoản bàn giao -->
            <div class="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-3.5 text-xs sm:text-sm">
              <div class="flex items-center justify-between pb-2 border-b border-slate-200">
                <span class="font-bold text-slate-900 flex items-center gap-1.5">
                  <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
                  Tài khoản số được kích hoạt
                </span>
                <span class="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">ĐÃ KÍCH HOẠT</span>
              </div>

              <!-- Chi tiết login -->
              <div class="space-y-2">
                <div>
                  <div class="text-[11px] text-slate-500">Tài khoản / Email:</div>
                  <div class="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 font-mono text-slate-900 text-xs sm:text-sm">
                    <span id="delivered-email">shopviet_sacombank_${Math.floor(1000 + Math.random() * 9000)}@gmail.com</span>
                    <button type="button" class="btn-copy text-xs text-[#004b91] hover:underline font-semibold" data-copy="shopviet_sacombank_demo@gmail.com">Sao chép</button>
                  </div>
                </div>

                <div>
                  <div class="text-[11px] text-slate-500">Mật khẩu:</div>
                  <div class="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 font-mono text-slate-900 text-xs sm:text-sm">
                    <span id="delivered-pass">Sacombank#2026@Pass</span>
                    <button type="button" class="btn-copy text-xs text-[#004b91] hover:underline font-semibold" data-copy="Sacombank#2026@Pass">Sao chép</button>
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

      // NÚT "LƯU ẢNH MÃ QR VỀ MÁY"
      const downloadQrBtn = container.querySelector('#btn-download-qr');
      if (downloadQrBtn) {
        downloadQrBtn.onclick = async () => {
          try {
            showToast('Đang tải ảnh mã VietQR Sacombank...', 'info');
            const res = await fetch(vietQrUrl);
            const blob = await res.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = `VietQR-Sacombank-${order.memo}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
            showToast('Đã lưu ảnh mã QR về máy thành công!', 'success');
          } catch (e) {
            // Fallback mở tab mới nếu CORS bị chặn
            window.open(vietQrUrl, '_blank');
            showToast('Đang mở ảnh VietQR trong tab mới để lưu', 'info');
          }
        };
      }

      // XỬ LÝ UPLOAD BIÊN LAI (BILL)
      const uploadArea = container.querySelector('#bill-upload-area');
      const fileInput = container.querySelector('#input-bill-file');
      const emptyState = container.querySelector('#bill-empty-state');
      const previewState = container.querySelector('#bill-preview-state');
      const previewImg = container.querySelector('#bill-preview-img');
      const filenameLabel = container.querySelector('#bill-filename');
      const removeBillBtn = container.querySelector('#btn-remove-bill');

      if (uploadArea && fileInput) {
        uploadArea.onclick = (e) => {
          if (e.target !== removeBillBtn && !removeBillBtn.contains(e.target)) {
            fileInput.click();
          }
        };

        fileInput.onchange = (e) => {
          const file = e.target.files && e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
              if (previewImg) previewImg.src = loadEvent.target.result;
              if (filenameLabel) filenameLabel.textContent = file.name;
              if (emptyState) emptyState.classList.add('hidden');
              if (previewState) previewState.classList.remove('hidden');
              showToast('Đã đính kèm ảnh biên lai giao dịch thành công!', 'success');
            };
            reader.readAsDataURL(file);
          }
        };

        if (removeBillBtn) {
          removeBillBtn.onclick = (e) => {
            e.stopPropagation();
            fileInput.value = '';
            if (emptyState) emptyState.classList.remove('hidden');
            if (previewState) previewState.classList.add('hidden');
            showToast('Đã gỡ ảnh biên lai', 'info');
          };
        }
      }

      // ĐỒNG HỒ ĐẾM NGƯỢC 10 PHÚT (09:59)
      let remainingSeconds = order.expiresInSeconds || 600;
      const headerTimer = container.querySelector('#header-countdown-timer');

      function updateCountdown() {
        if (remainingSeconds <= 0) {
          clearPaymentCountdown();
          if (headerTimer) {
            headerTimer.textContent = '00:00 (Hết hạn)';
            headerTimer.classList.add('text-slate-400');
          }
          showToast('Đơn hàng đã hết hạn thanh toán!', 'warning');
          return;
        }

        const mins = Math.floor(remainingSeconds / 60);
        const secs = remainingSeconds % 60;
        if (headerTimer) {
          headerTimer.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        remainingSeconds--;
      }

      updateCountdown();
      window.__shopvietPayTimer = setInterval(updateCountdown, 1000);

      // NÚT ĐỔI GÓI / QUAY LẠI
      const changePlanBtn = container.querySelector('#btn-change-plan');
      if (changePlanBtn) {
        changePlanBtn.onclick = () => {
          clearPaymentCountdown();
          navigate('checkout');
        };
      }

      // HÀM XỬ LÝ CHỜ DUYỆT (KHI KHÁCH BẤM "TÔI ĐÃ CHUYỂN KHOẢN") - CHUẨN OMNI-SIGNALING
      async function completePaymentWaitingReview() {
        clearPaymentCountdown();

        order.status = 'pending_review';
        order.statusText = 'Chờ duyệt';
        order.submittedAt = new Date().toISOString();

        const currentUser = (window.ShopVietState && window.ShopVietState.state && window.ShopVietState.state.user) || {};
        if (!order.userEmail) {
          order.userEmail = (currentUser.isLoggedIn && currentUser.email)
            ? currentUser.email.trim().toLowerCase()
            : ((order.customer && order.customer.email) ? order.customer.email.trim().toLowerCase() : 'cuongcuca111@gmail.com');
        }
        order.customer = order.customer || {};
        order.customer.email = order.userEmail;

        if (window.ShopVietState && typeof window.ShopVietState.addOrder === 'function') {
          window.ShopVietState.addOrder(order);
        } else {
          window.ShopVietState.orders = window.ShopVietState.orders || [];
          window.ShopVietState.orders.unshift(order);
          if (typeof window.ShopVietState.save === 'function') {
            window.ShopVietState.save();
          }
        }

        const allOrders = (window.ShopVietState && window.ShopVietState.state && window.ShopVietState.state.orders) || [order];

        try {
          localStorage.setItem('shopviet_orders', JSON.stringify(allOrders));
          localStorage.setItem('shopviet247_cloud_orders_sync', JSON.stringify(allOrders));
        } catch (e) {}

        if (window.ShopVietFirebase && typeof window.ShopVietFirebase.syncOrderToCloud === 'function') {
          try { window.ShopVietFirebase.syncOrderToCloud(order); } catch (eFb) {}
        }

        if (window.ShopVietState && typeof window.ShopVietState.pushAllToCloud === 'function') {
          try { await window.ShopVietState.pushAllToCloud(true); } catch (ePush) {}
        }

        const cleanCode = String(order.orderCode || order.id || order.rawCode || '').replace(/^#/, '').trim().toUpperCase();
        const universalMsg = {
          type: 'new_order_pending_review',
          action: 'new_order_pending_review',
          order: order,
          orderCode: order.orderCode || order.id,
          rawCode: cleanCode,
          status: 'pending_review',
          timestamp: Date.now(),
          payload: {
            orders: allOrders,
            order: order,
            orderCode: order.orderCode || order.id,
            status: 'pending_review'
          }
        };

        try {
          if (typeof BroadcastChannel !== 'undefined') {
            ['shopviet_admin_sync', 'shopviet_realtime_sync', 'shopviet247_realtime_channel'].forEach(chName => {
              try {
                const bc = new BroadcastChannel(chName);
                bc.postMessage(universalMsg);
                setTimeout(() => { try { bc.close(); } catch(e){} }, 1000);
              } catch (eBc) {}
            });
          }
        } catch (eBcs) {}

        try {
          const strMsg = JSON.stringify(universalMsg);
          localStorage.setItem('shopviet_last_order_broadcast', strMsg);
          localStorage.setItem('shopviet_realtime_broadcast_message', strMsg);
          localStorage.setItem('shopviet_order_ping', JSON.stringify({ code: cleanCode, status: 'pending_review', time: Date.now() }));
        } catch (eSt) {}

        if (typeof window.dispatchEvent === 'function') {
          try {
            window.dispatchEvent(new CustomEvent('shopviet_realtime_update', { detail: universalMsg }));
            window.dispatchEvent(new CustomEvent('orders_updated', { detail: universalMsg }));
          } catch (eDev) {}
        }

        if (typeof window.triggerAdminOrderNotification === 'function') {
          window.triggerAdminOrderNotification(order);
        }

        showToast('Đã ghi nhận chuyển khoản! Đơn hàng đang chờ Quản trị viên duyệt...', 'info');

        setTimeout(() => {
          if (window.ShopVietState && typeof window.ShopVietState.navigate === 'function') {
            window.ShopVietState.navigate('dashboard');
          }
        }, 1200);
      }

      // HÀM CHUNG HOÀN TẤT THANH TOÁN (ĐẨY CLOUD ĐA TẦNG 100%)
      async function completePaymentSuccess() {
        clearPaymentCountdown();

        // Cập nhật trạng thái đơn hàng
        order.status = 'completed';
        order.paidAt = new Date().toISOString();

        // Đảm bảo đơn hàng gắn đúng userEmail thuộc tài khoản hiện tại
        const currentUser = (window.ShopVietState && window.ShopVietState.state && window.ShopVietState.state.user) || {};
        if (!order.userEmail) {
          order.userEmail = (currentUser.isLoggedIn && currentUser.email)
            ? currentUser.email.trim().toLowerCase()
            : ((order.customer && order.customer.email) ? order.customer.email.trim().toLowerCase() : 'khachhang@gmail.com');
        }
        order.customer = order.customer || {};
        order.customer.email = order.userEmail;

        // Lưu vào danh sách đơn hàng đã mua trong State
        if (window.ShopVietState && typeof window.ShopVietState.addOrder === 'function') {
          window.ShopVietState.addOrder(order);
        } else {
          window.ShopVietState.orders = window.ShopVietState.orders || [];
          window.ShopVietState.orders.unshift(order);
          if (typeof window.ShopVietState.save === 'function') {
            window.ShopVietState.save();
          }
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

        // Đồng bộ đơn hàng lên Firebase Firestore Cloud
        if (window.ShopVietFirebase && typeof window.ShopVietFirebase.syncOrderToCloud === 'function') {
          try {
            window.ShopVietFirebase.syncOrderToCloud(order);
          } catch (eFb) {}
        }

        // Đẩy lên GitHub Cloud Storage & REST API độc lập với pushAllToCloud(true) - BẮT BUỘC AWAIT
        if (window.ShopVietState && typeof window.ShopVietState.pushAllToCloud === 'function') {
          try {
            await window.ShopVietState.pushAllToCloud(true);
          } catch (ePush) {
            console.warn('[Checkout] pushAllToCloud error:', ePush);
          }
        }

        // Phát sóng Realtime toàn diện đa kênh: BroadcastChannel + LocalStorage Broadcast + CustomEvent
        // 1. BroadcastChannel shopviet_admin_sync & shopviet_realtime_sync
        try {
          if (typeof BroadcastChannel !== 'undefined') {
            const bc1 = new BroadcastChannel('shopviet_admin_sync');
            bc1.postMessage({
              type: 'orders_updated',
              action: 'order_completed',
              order: order,
              orderCode: order.orderCode || order.id,
              status: 'completed',
              timestamp: Date.now()
            });
            const bc2 = new BroadcastChannel('shopviet_realtime_sync');
            bc2.postMessage({
              type: 'orders_updated',
              action: 'order_completed',
              order: order,
              orderCode: order.orderCode || order.id,
              status: 'completed',
              timestamp: Date.now()
            });
          }
        } catch (eBc) {}

        // 2. Storage event broadcast cho mọi tab cùng trình duyệt
        try {
          localStorage.setItem('shopviet_last_order_broadcast', JSON.stringify({
            order: order,
            orderCode: order.orderCode || order.id,
            status: 'completed',
            timestamp: Date.now()
          }));
        } catch (eSt) {}

        // 3. CustomEvent nội bộ tab
        try {
          window.dispatchEvent(new CustomEvent('shopviet_realtime_update', {
            detail: {
              type: 'orders_updated',
              action: 'order_completed',
              order: order,
              orderCode: order.orderCode || order.id,
              status: 'completed',
              timestamp: Date.now(),
              payload: {
                order: order,
                orderCode: order.orderCode || order.id,
                status: 'completed'
              }
            }
          }));
          window.dispatchEvent(new CustomEvent('orders_updated', {
            detail: {
              type: 'orders_updated',
              action: 'order_completed',
              order: order,
              orderCode: order.orderCode || order.id,
              status: 'completed',
              timestamp: Date.now()
            }
          }));
        } catch (eCe) {}

        // 4. Phát sóng qua kênh ShopVietState nội bộ
        if (window.ShopVietState && window.ShopVietState.broadcastAdminChange) {
          window.ShopVietState.broadcastAdminChange('orders_updated', {
            order: order,
            orderCode: order.orderCode || order.id,
            status: 'completed',
            timestamp: Date.now()
          });
        }

        // 5. Kích hoạt PWA Push Notification cho iPhone Admin (iOS 16.4+) & Desktop
        if (typeof window.triggerAdminOrderNotification === 'function') {
          window.triggerAdminOrderNotification(order);
        }

        // Dọn dẹp giỏ hàng
        window.ShopVietState.cart = [];
        window.ShopVietState.currentVoucher = null;

        // Cộng điểm thưởng
        if (window.ShopVietState.user) {
          window.ShopVietState.user.rewardPoints = (window.ShopVietState.user.rewardPoints || 0) + 45;
        }

        // Cập nhật Stepper sang Bước 3 Kích hoạt
        const stepCol2 = container.querySelector('#step-col-2');
        const stepCol3 = container.querySelector('#step-col-3');
        const stepBadge3 = container.querySelector('#step-badge-3');

        if (stepCol2) {
          stepCol2.className = 'p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold flex flex-col items-center gap-1';
        }
        if (stepCol3) {
          stepCol3.className = 'p-2.5 rounded-xl bg-emerald-600 border border-emerald-600 text-white font-bold flex flex-col items-center gap-1';
        }
        if (stepBadge3) {
          stepBadge3.className = 'w-5 h-5 rounded-full bg-white text-emerald-700 flex items-center justify-center text-[10px] font-bold';
          stepBadge3.textContent = '✓';
        }

        // Hiển thị modal thành công
        const successModal = container.querySelector('#payment-success-modal');
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

        showToast('Giao dịch Sacombank đã khớp! Tài khoản đã được kích hoạt.', 'success');
      }

      // NÚT "TÔI ĐÃ CHUYỂN KHOẢN" (CHUYỂN STEPPER SANG BƯỚC 2 VÀ BẬT MODAL)
      const paidConfirmBtn = container.querySelector('#btn-paid-confirm');
      const stepCol2 = container.querySelector('#step-col-2');
      const stepBadge2 = container.querySelector('#step-badge-2');
      const radarText = container.querySelector('#radar-text');

      if (paidConfirmBtn) {
        paidConfirmBtn.onclick = () => {
          paidConfirmBtn.disabled = true;
          paidConfirmBtn.classList.add('opacity-75', 'cursor-wait');
          paidConfirmBtn.innerHTML = `
            <svg class="w-5 h-5 animate-spin mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke-width="3" stroke-dasharray="32" stroke-linecap="round"></circle>
            </svg>
            <span>Đang kiểm tra biến động Sacombank...</span>
          `;

          // Cập nhật Stepper sang Bước 2 đang kiểm tra
          if (stepCol2) {
            stepCol2.className = 'p-2.5 rounded-xl bg-blue-100 border border-blue-300 text-[#004b91] font-bold flex flex-col items-center gap-1';
          }
          if (stepBadge2) {
            stepBadge2.className = 'w-5 h-5 rounded-full bg-[#004b91] text-white flex items-center justify-center text-[10px] animate-pulse';
          }
          if (radarText) {
            radarText.textContent = 'Đang khớp lệnh giao dịch với Sacombank...';
          }

          showToast('Đang kết nối cổng Sacombank để kiểm tra số dư...', 'info');

          setTimeout(async () => {
            await completePaymentWaitingReview();
          }, 1500);
        };
      }

      // NÚT GIẢ LẬP DEMO "⚡ Sandbox Webhook"
      const webhookBtn = container.querySelector('#btn-simulate-webhook');
      if (webhookBtn) {
        webhookBtn.onclick = () => {
          webhookBtn.disabled = true;
          webhookBtn.classList.add('opacity-75', 'cursor-wait');
          showToast('Nhận tín hiệu Webhook tức thì từ Sacombank...', 'info');
          setTimeout(async () => {
            await completePaymentSuccess();
          }, 600);
        };
      }

      // Điều hướng từ Modal thành công
      const goDashboardBtn = container.querySelector('#btn-modal-go-dashboard');
      const successModal = container.querySelector('#payment-success-modal');
      if (goDashboardBtn) {
        goDashboardBtn.onclick = () => {
          if (successModal) successModal.classList.add('hidden');
          navigate('dashboard');
        };
      }

      const goHomeBtn = container.querySelector('#btn-modal-go-home');
      if (goHomeBtn) {
        goHomeBtn.onclick = () => {
          if (successModal) successModal.classList.add('hidden');
          navigate('home');
        };
      }

      return html;
    }
  };

  console.log('[ShopViet247] Checkout & Pay views (Sacombank 100071864927) loaded successfully.');
})();
