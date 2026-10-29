/**
 * Shopviet247 - State Store & Reactive Manager
 * Quản lý trạng thái toàn cục ứng dụng: Giỏ hàng, View Router, Đơn hàng, Tài khoản, Theme và Toast
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'shopviet247_app_state_v1';
  const USERS_DB_KEY = 'shopviet_users_database';

  // Tài khoản Quản trị viên mặc định
  const DEFAULT_ADMIN = {
    id: 'usr_admin_minhcuong',
    email: 'minhcuong111aaa@gmail.com',
    password: 'minhcuong111',
    name: 'Minh Cường',
    role: 'admin',
    balance: 250000,
    phone: '0987654321',
    avatar: 'C',
    createdAt: '2026-01-01T00:00:00.000Z'
  };

  // Trạng thái khởi tạo mặc định (Khách vãng lai chưa đăng nhập)
  const initialState = {
    currentView: 'home',
    cart: [],
    user: {
      name: 'Khách',
      email: '',
      balance: 0,
      isLoggedIn: false,
      role: 'guest',
      phone: '',
      avatar: 'K'
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

    // ==================== CƠ SỞ DỮ LIỆU TÀI KHOẢN (USERS_DB) ====================
    // Lấy toàn bộ danh sách tài khoản từ localStorage key shopviet_users_database
    getUsersDB: function () {
      try {
        const raw = localStorage.getItem(USERS_DB_KEY);
        let list = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(list) || list.length === 0) {
          list = [Object.assign({}, DEFAULT_ADMIN)];
          localStorage.setItem(USERS_DB_KEY, JSON.stringify(list));
        } else {
          // Luôn đảm bảo tài khoản Admin chuẩn tồn tại và có quyền admin
          const adminIdx = list.findIndex(function (u) {
            return u.email && u.email.trim().toLowerCase() === DEFAULT_ADMIN.email.toLowerCase();
          });
          if (adminIdx === -1) {
            list.unshift(Object.assign({}, DEFAULT_ADMIN));
            localStorage.setItem(USERS_DB_KEY, JSON.stringify(list));
          } else {
            if (list[adminIdx].role !== 'admin') {
              list[adminIdx].role = 'admin';
            }
            if (typeof list[adminIdx].balance !== 'number') {
              list[adminIdx].balance = DEFAULT_ADMIN.balance;
            }
          }
        }
        return list;
      } catch (e) {
        console.warn('[ShopVietState] Lỗi đọc users_db:', e);
        return [Object.assign({}, DEFAULT_ADMIN)];
      }
    },

    // Lưu danh sách tài khoản vào localStorage
    saveUsersDB: function (users) {
      try {
        localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
      } catch (e) {
        console.warn('[ShopVietState] Lỗi lưu users_db:', e);
      }
    },

    // Tìm kiếm tài khoản theo email (không phân biệt hoa/thường)
    findUserByEmail: function (email) {
      if (!email) return null;
      const cleanEmail = email.trim().toLowerCase();
      const users = this.getUsersDB();
      return users.find(function (u) {
        return u.email && u.email.trim().toLowerCase() === cleanEmail;
      }) || null;
    },

    // Đăng ký tài khoản mới có kiểm tra tính hợp lệ và chống trùng lặp
    registerUser: function (userData) {
      userData = userData || {};
      const email = (userData.email || '').trim().toLowerCase();
      const password = (userData.password || '').trim();
      const name = (userData.name || '').trim() || email.split('@')[0];
      const phone = (userData.phone || '').trim();

      if (!email || !email.includes('@')) {
        return { success: false, error: 'INVALID_EMAIL', message: 'Địa chỉ Email không hợp lệ!' };
      }
      if (!password || password.length < 6) {
        return { success: false, error: 'WEAK_PASSWORD', message: 'Mật khẩu phải có ít nhất 6 ký tự!' };
      }

      const users = this.getUsersDB();
      const existing = users.find(function (u) {
        return u.email && u.email.trim().toLowerCase() === email;
      });

      if (existing) {
        return {
          success: false,
          error: 'EMAIL_EXISTS',
          message: 'Email này đã được đăng ký, vui lòng đăng nhập!'
        };
      }

      const newUser = {
        id: 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        email: email,
        password: password,
        name: name,
        phone: phone,
        balance: 0,
        role: 'user',
        avatar: name.charAt(0).toUpperCase(),
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      this.saveUsersDB(users);

      // Đồng bộ lên Cloud Firestore nếu có
      if (window.ShopVietFirebase && typeof window.ShopVietFirebase.syncUserToCloud === 'function') {
        window.ShopVietFirebase.syncUserToCloud(newUser);
      }

      return { success: true, user: newUser };
    },

    // Xác thực đăng nhập tài khoản thực tế
    authenticateUser: function (email, password) {
      email = (email || '').trim().toLowerCase();
      password = (password || '').trim();

      if (!email) {
        return { success: false, error: 'EMPTY_EMAIL', message: 'Vui lòng nhập địa chỉ Email!' };
      }
      if (!password) {
        return { success: false, error: 'EMPTY_PASSWORD', message: 'Vui lòng nhập mật khẩu!' };
      }

      const users = this.getUsersDB();
      const matchedUser = users.find(function (u) {
        return u.email && u.email.trim().toLowerCase() === email;
      });

      // Nếu KHÔNG tìm thấy email: Báo lỗi rõ ràng và tuyệt đối không cho đăng nhập
      if (!matchedUser) {
        return {
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'Tài khoản không tồn tại! Vui lòng bấm Đăng ký ngay để tạo tài khoản mới.'
        };
      }

      // Kiểm tra mật khẩu (hỗ trợ cả minhcuong111 và 123456 cho tài khoản admin Minh Cường)
      let isPasswordCorrect = (matchedUser.password === password);
      if (matchedUser.email === DEFAULT_ADMIN.email && (password === 'minhcuong111' || password === '123456')) {
        isPasswordCorrect = true;
      }

      // Nếu mật khẩu không khớp: Báo lỗi và tuyệt đối không cho đăng nhập
      if (!isPasswordCorrect) {
        return {
          success: false,
          error: 'WRONG_PASSWORD',
          message: 'Mật khẩu không chính xác! Vui lòng thử lại.'
        };
      }

      return { success: true, user: matchedUser };
    },

    // Helper phân quyền Quản trị viên
    isAdmin: function () {
      return Boolean(
        this.state.user &&
        this.state.user.isLoggedIn &&
        this.state.user.email &&
        this.state.user.email.trim().toLowerCase() === DEFAULT_ADMIN.email.toLowerCase()
      );
    },

    // ==================== CÔ LẬP ĐƠN HÀNG & DỮ LIỆU ĐỘC LẬP THEO TÀI KHOẢN ====================
    // Lấy danh sách đơn hàng thuộc sở hữu độc lập của tài khoản đang đăng nhập
    getUserOrders: function (email) {
      const currentUser = this.state.user;
      const targetEmail = (email || (currentUser && currentUser.isLoggedIn ? currentUser.email : '')).trim().toLowerCase();
      if (!targetEmail) {
        return [];
      }
      const allOrders = this.state.orders || [];
      return allOrders.filter(function (order) {
        const orderEmail = (order.userEmail || (order.customer && order.customer.email) || '').trim().toLowerCase();
        return orderEmail === targetEmail;
      });
    },

    // Thêm đơn hàng mới được gắn chặt chẽ vào email tài khoản
    addOrder: function (order) {
      if (!order) return;
      const currentUser = this.state.user;
      const userEmail = (currentUser && currentUser.isLoggedIn && currentUser.email)
        ? currentUser.email.toLowerCase()
        : (order.customer && order.customer.email ? order.customer.email.toLowerCase() : 'guest@shopviet247.com');

      order.userEmail = userEmail;
      order.customer = order.customer || {};
      order.customer.email = userEmail;

      this.state.orders = this.state.orders || [];
      this.state.orders.unshift(order);
      this.save();

      if (window.ShopVietFirebase && typeof window.ShopVietFirebase.syncOrderToCloud === 'function') {
        window.ShopVietFirebase.syncOrderToCloud(order);
      }

      this.notify('orders_updated', this.state.orders);
    },

    // Cập nhật số dư ví độc lập cho tài khoản cụ thể
    updateUserBalance: function (email, newBalance) {
      email = (email || '').trim().toLowerCase();
      const users = this.getUsersDB();
      const idx = users.findIndex(function (u) {
        return u.email && u.email.trim().toLowerCase() === email;
      });
      if (idx > -1) {
        users[idx].balance = newBalance;
        this.saveUsersDB(users);
      }
      if (this.state.user && this.state.user.email && this.state.user.email.trim().toLowerCase() === email) {
        this.state.user.balance = newBalance;
        this.save();
        this.notify('user_balance_updated', this.state.user);
      }
    },

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

    // Đăng nhập người dùng (đồng bộ dữ liệu thực tế từ users_db)
    login: function (userData) {
      userData = userData || {};
      const email = (userData.email || (this.state.user ? this.state.user.email : '')).trim().toLowerCase();
      const users = this.getUsersDB();
      let matchedUser = users.find(function (u) {
        return u.email && u.email.trim().toLowerCase() === email;
      });

      if (!matchedUser) {
        // Tự động tạo nếu đăng nhập qua bên thứ 3 (Google/Telegram)
        matchedUser = {
          id: userData.id || ('usr_' + Date.now().toString(36)),
          name: userData.name || email.split('@')[0],
          email: email,
          phone: userData.phone || '',
          balance: typeof userData.balance === 'number' ? userData.balance : 0,
          role: userData.role || (email === DEFAULT_ADMIN.email ? 'admin' : 'user'),
          avatar: userData.avatar || (userData.name || email).charAt(0).toUpperCase(),
          createdAt: new Date().toISOString()
        };
        users.push(matchedUser);
        this.saveUsersDB(users);
      }

      this.state.user = {
        id: matchedUser.id,
        name: matchedUser.name,
        email: matchedUser.email,
        phone: matchedUser.phone || '',
        balance: typeof matchedUser.balance === 'number' ? matchedUser.balance : 0,
        role: matchedUser.role || (matchedUser.email === DEFAULT_ADMIN.email ? 'admin' : 'user'),
        avatar: matchedUser.avatar || (matchedUser.name || matchedUser.email).charAt(0).toUpperCase(),
        isLoggedIn: true,
        isOnline: true
      };

      this.save();
      this.notify('user_login', this.state.user);
      if (window.ShopVietApp && typeof window.ShopVietApp.updateHeaderAuthUI === 'function') {
        window.ShopVietApp.updateHeaderAuthUI();
      }
    },

    // Đăng xuất an toàn khỏi hệ thống (xóa session người dùng)
    logout: function () {
      this.state.user = {
        name: 'Khách',
        email: '',
        balance: 0,
        isLoggedIn: false,
        role: 'guest',
        phone: '',
        avatar: 'K'
      };
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
        // Đảm bảo users_db được khởi tạo
        this.getUsersDB();

        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          this.state.cart = parsed.cart || [];
          
          // Kiểm tra tính hợp lệ của user đã lưu
          if (parsed.user && parsed.user.isLoggedIn && parsed.user.email) {
            const matchedInDb = this.findUserByEmail(parsed.user.email);
            if (matchedInDb) {
              this.state.user = Object.assign({}, matchedInDb, { isLoggedIn: true });
            } else {
              this.state.user = Object.assign({}, initialState.user);
            }
          } else {
            this.state.user = Object.assign({}, initialState.user);
          }

          // Khôi phục đơn hàng và đảm bảo mỗi đơn có userEmail
          if (parsed.orders && Array.isArray(parsed.orders) && parsed.orders.length > 0) {
            this.state.orders = parsed.orders.map(function (o) {
              if (!o.userEmail) {
                o.userEmail = (o.customer && o.customer.email) ? o.customer.email : DEFAULT_ADMIN.email;
              }
              return o;
            });
          } else if (window.ShopVietData && window.ShopVietData.defaultOrders) {
            this.state.orders = window.ShopVietData.defaultOrders.map(function (o) {
              return Object.assign({}, o, { userEmail: DEFAULT_ADMIN.email });
            });
          } else {
            this.state.orders = [];
          }

          this.state.theme = parsed.theme || 'light';
          this.state.lang = parsed.lang || 'VI';
          this.state.discountCode = parsed.discountCode || { code: '', percent: 0, amount: 0 };
        } else {
          // Khởi tạo đơn hàng mẫu cho tài khoản admin
          if (window.ShopVietData && window.ShopVietData.defaultOrders) {
            this.state.orders = window.ShopVietData.defaultOrders.map(function (o) {
              return Object.assign({}, o, { userEmail: DEFAULT_ADMIN.email });
            });
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

      // Kiểm tra bảo mật Cổng Portal Admin
      if (viewName === 'admin') {
        const u = this.state.user;
        const isAdmin = Boolean(u && u.isLoggedIn && u.email === 'minhcuong111aaa@gmail.com');
        if (!isAdmin) {
          this.showToast('Truy cập bị từ chối: Cổng quản trị chỉ dành riêng cho tài khoản minhcuong111aaa@gmail.com!', 'error');
          if (window.location.hash === '#admin') {
            window.location.hash = '#home';
          }
          this.navigate('home');
          return;
        }
      }

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
    },

    // Lấy cấu hình VietQR động từ Portal Admin (Mặc định: Sacombank 100071864927 LE BUI MINH CUONG)
    getVietQRConfig: function () {
      const DEFAULT_CONFIG = {
        bankId: '970403', // Sacombank BIN 970403
        bin: '970403',
        bankName: 'Sacombank (Ngân hàng TMCP Sài Gòn Thương Tín)',
        shortName: 'Sacombank',
        accountNumber: '100071864927',
        accountName: 'LE BUI MINH CUONG',
        memoPrefix: 'SHOPVIET',
        brandColor: '#004b91'
      };
      try {
        const saved = localStorage.getItem('shopviet_vietqr_config');
        if (saved) {
          const parsed = JSON.parse(saved);
          return Object.assign({}, DEFAULT_CONFIG, parsed, {
            bin: parsed.bin || parsed.bankId || DEFAULT_CONFIG.bin,
            shortName: parsed.shortName || (parsed.bankName ? parsed.bankName.split(' ')[0] : DEFAULT_CONFIG.shortName)
          });
        }
      } catch (e) {
        console.warn('[Get VietQR Config error]', e);
      }
      return DEFAULT_CONFIG;
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
