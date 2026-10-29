/**
 * Shopviet247 - State Store & Reactive Manager
 * Quản lý trạng thái toàn cục ứng dụng: Giỏ hàng, View Router, Đơn hàng, Tài khoản, Theme và Toast
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'shopviet247_app_state_v1';

  // Trạng thái khởi tạo mặc định
  const initialState = {
    currentView: 'home',
    cart: [],
    user: {
      name: 'Minh Cường',
      email: 'minhcuong.dev@gmail.com',
      balance: 250000,
      isLoggedIn: false,
      phone: '0987654321',
      avatar: 'C'
    },
    currentOrder: null,
    orders: [],
    discountCode: { code: '', percent: 0, amount: 0 },
    theme: 'light',
    lang: 'VI',
    activeFilter: 'Tất cả',
    searchQuery: ''
  };

  window.ShopVietViews = window.ShopVietViews || {};

  window.ShopVietState = {
    state: JSON.parse(JSON.stringify(initialState)),
    listeners: [],

    // Đăng ký listener khi state thay đổi
    subscribe: function (fn) {
      if (typeof fn === 'function') {
        this.listeners.push(fn);
      }
    },

    // Phát tín hiệu thông báo
    notify: function (event, payload) {
      this.listeners.forEach(function (fn) {
        try {
          fn(event, payload);
        } catch (err) {
          console.error('[ShopVietState Notify Error]:', err);
        }
      });
      this.updateCartBadge();
      if (window.ShopVietApp && typeof window.ShopVietApp.updateHeaderAuthUI === 'function') {
        window.ShopVietApp.updateHeaderAuthUI();
      }
    },

    // Đăng nhập người dùng (hỗ trợ Firebase/Firestore Cloud Sync)
    login: function (userData) {
      userData = userData || {};
      const name = userData.name || (this.state.user ? this.state.user.name : 'Minh Cường') || 'Minh Cường';
      const email = userData.email || (this.state.user ? this.state.user.email : 'minhcuong.dev@gmail.com');
      const avatar = userData.avatar || (name ? name.charAt(0).toUpperCase() : 'C');

      this.state.user = Object.assign({}, this.state.user || {}, userData, {
        isLoggedIn: true,
        name: name,
        email: email,
        avatar: avatar
      });

      this.save();
      this.notify('user_login', this.state.user);
      if (window.ShopVietApp && typeof window.ShopVietApp.updateHeaderAuthUI === 'function') {
        window.ShopVietApp.updateHeaderAuthUI();
      }
    },

    // Đăng xuất an toàn khỏi hệ thống
    logout: function () {
      if (this.state.user) {
        this.state.user.isLoggedIn = false;
      }
      if (window.ShopVietFirebase && typeof window.ShopVietFirebase.logout === 'function') {
        window.ShopVietFirebase.logout();
      }
      this.save();
      this.notify('user_logout', this.state.user);
      if (window.ShopVietApp && typeof window.ShopVietApp.updateHeaderAuthUI === 'function') {
        window.ShopVietApp.updateHeaderAuthUI();
      }
      this.showToast('Bạn đã đăng xuất tài khoản an toàn!', 'info');
      this.navigate('home');
    },

    // Lưu trữ xuống localStorage
    save: function () {
      try {
        const payload = {
          cart: this.state.cart,
          user: this.state.user,
          orders: this.state.orders,
          theme: this.state.theme,
          lang: this.state.lang,
          discountCode: this.state.discountCode
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch (e) {
        console.warn('[ShopVietState] Không thể lưu vào LocalStorage:', e);
      }
    },

    // Đọc từ localStorage
    load: function () {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          this.state.cart = parsed.cart || [];
          this.state.user = Object.assign({}, initialState.user, parsed.user || {});
          this.state.orders = (parsed.orders && parsed.orders.length > 0) 
            ? parsed.orders 
            : (window.ShopVietData ? window.ShopVietData.defaultOrders : []);
          this.state.theme = parsed.theme || 'light';
          this.state.lang = parsed.lang || 'VI';
          this.state.discountCode = parsed.discountCode || { code: '', percent: 0, amount: 0 };
        } else {
          // Khởi tạo đơn hàng mẫu từ data
          if (window.ShopVietData && window.ShopVietData.defaultOrders) {
            this.state.orders = JSON.parse(JSON.stringify(window.ShopVietData.defaultOrders));
          }
        }
      } catch (e) {
        console.warn('[ShopVietState] Lỗi phục hồi LocalStorage, dùng mặc định:', e);
      }
      this.applyTheme(this.state.theme);
      this.updateCartBadge();
      return this.state;
    },

    // Áp dụng Giao diện Sáng/Tối
    applyTheme: function (themeName) {
      this.state.theme = themeName;
      const root = document.documentElement;
      const darkIcon = document.getElementById('themeIconDark');
      const lightIcon = document.getElementById('themeIconLight');

      if (themeName === 'dark') {
        root.classList.add('dark');
        if (darkIcon) darkIcon.classList.remove('hidden');
        if (lightIcon) lightIcon.classList.add('hidden');
      } else {
        root.classList.remove('dark');
        if (darkIcon) darkIcon.classList.add('hidden');
        if (lightIcon) lightIcon.classList.remove('hidden');
      }
    },

    // Chuyển đổi Dark/Light mode
    toggleTheme: function () {
      const nextTheme = this.state.theme === 'dark' ? 'light' : 'dark';
      this.applyTheme(nextTheme);
      this.save();
      this.showToast(`Đã chuyển sang chế độ ${nextTheme === 'dark' ? 'Tối (Dark Mode)' : 'Sáng (Light Mode)'}`, 'info');
      this.notify('theme_change', nextTheme);
    },

    // Chuyển đổi Ngôn ngữ
    toggleLang: function () {
      this.state.lang = this.state.lang === 'VI' ? 'EN' : 'VI';
      const langEl = document.getElementById('langText');
      if (langEl) langEl.textContent = this.state.lang;
      this.save();
      this.showToast(`Đã chuyển ngôn ngữ sang: ${this.state.lang === 'VI' ? 'Tiếng Việt' : 'English'}`, 'info');
      this.notify('lang_change', this.state.lang);
    },

    // Cập nhật số đếm trên nút giỏ hàng Header
    updateCartBadge: function () {
      const badge = document.getElementById('cartCount');
      if (!badge) return;
      const count = this.state.cart.reduce(function (sum, item) {
        return sum + (item.qty || 1);
      }, 0);
      badge.textContent = count;
      if (count > 0) {
        badge.classList.remove('scale-0');
        badge.classList.add('scale-100');
      } else {
        badge.classList.remove('scale-100');
      }
    },

    // Thêm món vào Giỏ hàng
    addToCart: function (productId, qty) {
      qty = parseInt(qty, 10) || 1;
      const product = window.ShopVietData ? window.ShopVietData.getProductById(productId) : null;
      if (!product) {
        this.showToast('Sản phẩm không tồn tại hoặc đã ngừng bán!', 'error');
        return false;
      }

      if (product.status === 'out_of_stock' || product.stock <= 0) {
        this.showToast('Sản phẩm này hiện đang tạm hết hàng!', 'warning');
        return false;
      }

      const existingIndex = this.state.cart.findIndex(function (item) {
        return item.id === productId;
      });

      if (existingIndex > -1) {
        this.state.cart[existingIndex].qty += qty;
      } else {
        this.state.cart.push({
          id: product.id,
          product: product,
          qty: qty
        });
      }

      this.save();
      this.notify('cart_updated', this.state.cart);
      this.showToast(`Đã thêm "${product.name.slice(0, 32)}..." vào giỏ hàng!`, 'success');
      return true;
    },

    // Xóa món khỏi giỏ hàng
    removeFromCart: function (productId) {
      const oldLen = this.state.cart.length;
      this.state.cart = this.state.cart.filter(function (item) {
        return item.id !== productId;
      });

      if (this.state.cart.length < oldLen) {
        this.save();
        this.notify('cart_updated', this.state.cart);
        this.showToast('Đã xóa sản phẩm khỏi giỏ hàng', 'info');
      }
    },

    // Cập nhật số lượng trong giỏ
    updateCartQty: function (productId, delta) {
      const item = this.state.cart.find(function (i) { return i.id === productId; });
      if (!item) return;

      item.qty += delta;
      if (item.qty <= 0) {
        this.removeFromCart(productId);
      } else {
        this.save();
        this.notify('cart_updated', this.state.cart);
      }
    },

    // Xóa trắng giỏ hàng
    clearCart: function () {
      this.state.cart = [];
      this.save();
      this.notify('cart_updated', this.state.cart);
    },

    // Tính tổng giỏ hàng
    getCartTotals: function () {
      const subtotal = this.state.cart.reduce(function (sum, item) {
        return sum + (item.product.price * item.qty);
      }, 0);

      let discountVal = 0;
      if (this.state.discountCode && this.state.discountCode.amount > 0) {
        discountVal = this.state.discountCode.amount;
      } else if (this.state.discountCode && this.state.discountCode.percent > 0) {
        discountVal = Math.round(subtotal * (this.state.discountCode.percent / 100));
      }

      const total = Math.max(0, subtotal - discountVal);
      const totalCount = this.state.cart.reduce(function (sum, item) {
        return sum + item.qty;
      }, 0);

      return {
        subtotal: subtotal,
        discount: discountVal,
        total: total,
        count: totalCount
      };
    },

    // Áp dụng mã giảm giá
    applyDiscount: function (code) {
      const clean = (code || '').trim().toUpperCase();
      if (!clean) {
        this.state.discountCode = { code: '', percent: 0, amount: 0 };
        this.save();
        this.notify('discount_changed', this.state.discountCode);
        return { success: false, message: 'Vui lòng nhập mã giảm giá!' };
      }

      // Danh sách voucher khuyến mãi
      const vouchers = {
        'AI2026': { percent: 15, desc: 'Giảm 15% tổng đơn' },
        'HSSV': { percent: 10, desc: 'Ưu đãi sinh viên giảm 10%' },
        'SHOPVIET': { amount: 20000, desc: 'Giảm 20.000đ cho đơn đầu' },
        'ANTIGRAVITY': { percent: 20, desc: 'Giảm 20% công cụ coding AI' }
      };

      if (vouchers[clean]) {
        const v = vouchers[clean];
        this.state.discountCode = {
          code: clean,
          percent: v.percent || 0,
          amount: v.amount || 0,
          desc: v.desc
        };
        this.save();
        this.notify('discount_changed', this.state.discountCode);
        this.showToast(`Áp dụng mã ${clean} thành công! (${v.desc})`, 'success');
        return { success: true, voucher: this.state.discountCode };
      } else {
        this.showToast(`Mã giảm giá "${clean}" không hợp lệ hoặc đã hết hạn!`, 'error');
        return { success: false, message: 'Mã giảm giá không hợp lệ' };
      }
    },

    // Điều hướng SPA Router
    navigate: function (viewName, params) {
      params = params || {};
      this.state.currentView = viewName;

      // Cập nhật giao diện menu Nav
      this.updateNavUI(viewName);

      const appMount = document.getElementById('appMount');
      if (!appMount) return;

      // Hiệu ứng fade in mượt
      appMount.style.opacity = '0';
      appMount.style.transform = 'translateY(6px)';

      setTimeout(() => {
        const viewModule = window.ShopVietViews[viewName];
        if (viewModule && typeof viewModule.render === 'function') {
          appMount.innerHTML = viewModule.render(params);
          if (typeof viewModule.afterRender === 'function') {
            viewModule.afterRender(params);
          }
        } else {
          // Fallback UI nếu view chưa được khởi tạo
          appMount.innerHTML = this.renderFallbackView(viewName, params);
        }

        // Tái tạo icon Lucide
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
          window.lucide.createIcons();
        }

        // Cuộn trang
        if (params.scrollTo) {
          const target = document.querySelector(params.scrollTo);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
          }
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        appMount.style.transition = 'opacity 0.25s ease-out, transform 0.25s ease-out';
        appMount.style.opacity = '1';
        appMount.style.transform = 'translateY(0)';
      }, 50);

      this.notify('view_changed', { view: viewName, params: params });
    },

    // Cập nhật trạng thái active của Menu Header
    updateNavUI: function (viewName) {
      const navButtons = document.querySelectorAll('.nav-btn');
      navButtons.forEach(function (btn) {
        const btnView = btn.getAttribute('data-view');
        if (btnView === viewName && !btn.hasAttribute('data-scroll')) {
          btn.className = 'nav-btn px-4 py-1.5 rounded-full font-semibold transition-all duration-200 bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white';
        } else {
          btn.className = 'nav-btn px-4 py-1.5 rounded-full font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all duration-200';
        }
      });
    },

    // Hiển thị Toast Notification nổi bật
    showToast: function (message, type) {
      type = type || 'info'; // 'success' | 'error' | 'warning' | 'info'
      const container = document.getElementById('toastContainer');
      if (!container) return;

      const toast = document.createElement('div');
      toast.className = 'pointer-events-auto flex items-center gap-3 p-4 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 transform translate-y-2 opacity-0 text-sm font-medium';

      // Màu sắc theo Type
      let iconSvg = '';
      let colorClass = '';

      if (type === 'success') {
        colorClass = 'bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white border-emerald-500/30 shadow-emerald-500/10';
        iconSvg = `<span class="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </span>`;
      } else if (type === 'error') {
        colorClass = 'bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white border-rose-500/30 shadow-rose-500/10';
        iconSvg = `<span class="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400 flex items-center justify-center shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </span>`;
      } else if (type === 'warning') {
        colorClass = 'bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white border-amber-500/30 shadow-amber-500/10';
        iconSvg = `<span class="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400 flex items-center justify-center shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </span>`;
      } else {
        colorClass = 'bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white border-indigo-500/30 shadow-indigo-500/10';
        iconSvg = `<span class="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400 flex items-center justify-center shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        </span>`;
      }

      toast.className += ' ' + colorClass;
      toast.innerHTML = `
        ${iconSvg}
        <div class="flex-1 pr-2">${message}</div>
        <button class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1" onclick="this.parentElement.remove()">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      `;

      container.appendChild(toast);

      // Animation in
      requestAnimationFrame(function () {
        toast.classList.remove('translate-y-2', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');
      });

      // Tự động gỡ sau 3.8s
      setTimeout(function () {
        toast.classList.add('opacity-0', 'translate-x-4');
        setTimeout(function () {
          if (toast.parentElement) toast.remove();
        }, 300);
      }, 3800);
    },

    // Định dạng tiền tệ VNĐ
    formatCurrency: function (number) {
      return (number || 0).toLocaleString('vi-VN') + ' đ';
    },

    // Giao diện dự phòng khi View chưa load xong
    renderFallbackView: function (viewName, params) {
      return `
        <div class="py-20 text-center space-y-4">
          <div class="inline-flex p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <svg class="w-10 h-10 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="2" x2="12" y2="6"/>
              <line x1="12" y1="18" x2="12" y2="22"/>
              <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
              <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
              <line x1="2" y1="12" x2="6" y2="12"/>
              <line x1="18" y1="12" x2="22" y2="12"/>
              <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
              <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
            </svg>
          </div>
          <h2 class="text-xl font-bold text-slate-900 dark:text-white">Đang tải phân hệ: ${viewName.toUpperCase()}</h2>
          <p class="text-slate-500 max-w-md mx-auto text-sm">Giao diện đang được khởi tạo bởi các chuyên viên hệ thống...</p>
          <div class="pt-4">
            <button onclick="ShopVietState.navigate('home')" class="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-500 transition shadow-sm">
              Trở về Trang Chủ
            </button>
          </div>
        </div>
      `;
    }
  };

  // Proxy getters/setters để đảm bảo tương thích 100% giữa ShopVietState.cart và ShopVietState.state.cart
  ['cart', 'user', 'orders', 'currentOrder', 'discountCode', 'theme', 'lang'].forEach(function (key) {
    if (!Object.prototype.hasOwnProperty.call(window.ShopVietState, key)) {
      Object.defineProperty(window.ShopVietState, key, {
        get: function () { return this.state[key]; },
        set: function (val) { this.state[key] = val; },
        configurable: true,
        enumerable: true
      });
    }
  });

})();
