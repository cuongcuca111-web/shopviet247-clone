/**
 * Shopviet247 - State Store & Reactive Manager
 * Quản lý trạng thái toàn cục ứng dụng: Giỏ hàng, View Router, Đơn hàng, Tài khoản, Theme và Toast
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'shopviet247_app_state_v1';
  const USERS_DB_KEY = 'shopviet_users_database';
  const CLOUD_DB_URL = 'https://api.restful-api.dev/objects/ff808181a09d98f701a1878bee264ca3';

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

  // Tài khoản Khách hàng mặc định sẵn sàng đăng nhập trên mọi thiết bị
  const DEFAULT_USER_CUONG = {
    id: 'usr_cuongcuca111',
    name: 'Minh Cường',
    email: 'cuongcuca111@gmail.com',
    phone: '0868668809',
    role: 'user',
    password: '123456',
    balance: 250000,
    createdAt: '2026-03-20T10:00:00.000Z'
  };

  // Cấu hình kho mã quà tặng & giảm giá
  const VOUCHERS_KEY = 'shopviet_vouchers';
  const DEFAULT_VOUCHERS = [
    {
      code: 'DISCOUNT20K',
      type: 'order_discount', // 'order_discount' hoặc 'wallet_gift'
      value: 20000,
      singleUse: true,
      isUsed: false,
      usedBy: null,
      usedAt: null,
      orderCode: null,
      createdAt: '2026-03-20T00:00:00.000Z'
    },
    {
      code: 'VIP50K',
      type: 'order_discount',
      value: 50000,
      singleUse: true,
      isUsed: false,
      usedBy: null,
      usedAt: null,
      orderCode: null,
      createdAt: '2026-03-20T00:00:00.000Z'
    }
  ];

  // Cấu hình danh sách khách hẹn lịch & quản lý slot Excel
  const SCHEDULES_KEY = 'shopviet_customer_schedules_db';
  const DEFAULT_SCHEDULES = [
    {
      id: 'SCH-001',
      customerEmail: 'cuongcuca111@gmail.com',
      customerName: 'Minh Cường',
      managerEmail: 'slot1-pro@shopviet.vip',
      serviceName: '[1 Tháng] Gemini Argon 4 Pro + 5TB Drive',
      startDate: '2026-10-29',
      expireDate: '2026-11-29',
      notes: 'Khách VIP nâng cấp chính chủ'
    },
    {
      id: 'SCH-002',
      customerEmail: 'huy.dev99@gmail.com',
      customerName: 'Nguyễn Huy',
      managerEmail: 'slot2-cursor@shopviet.vip',
      serviceName: 'Cursor Pro 1 Tháng Chính Chủ',
      startDate: '2026-10-25',
      expireDate: '2026-11-01',
      notes: 'Sắp hết hạn cần nhắc gia hạn'
    }
  ];

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
          list = [Object.assign({}, DEFAULT_ADMIN), Object.assign({}, DEFAULT_USER_CUONG)];
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

          // Luôn đảm bảo tài khoản người dùng mặc định cuongcuca111@gmail.com tồn tại
          const cuongIdx = list.findIndex(function (u) {
            return u.email && u.email.trim().toLowerCase() === DEFAULT_USER_CUONG.email.toLowerCase();
          });
          if (cuongIdx === -1) {
            list.push(Object.assign({}, DEFAULT_USER_CUONG));
            localStorage.setItem(USERS_DB_KEY, JSON.stringify(list));
          } else {
            if (typeof list[cuongIdx].balance !== 'number') {
              list[cuongIdx].balance = DEFAULT_USER_CUONG.balance;
            }
          }
        }
        return list;
      } catch (e) {
        console.warn('[ShopVietState] Lỗi đọc users_db:', e);
        return [Object.assign({}, DEFAULT_ADMIN), Object.assign({}, DEFAULT_USER_CUONG)];
      }
    },

    // Alias hỗ trợ cả 2 chuẩn gọi getUsersDB và getUsersDatabase
    getUsersDatabase: function () {
      return this.getUsersDB();
    },

    // Lưu danh sách tài khoản vào localStorage
    saveUsersDB: function (users) {
      try {
        localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
      } catch (e) {
        console.warn('[ShopVietState] Lỗi lưu users_db:', e);
      }
    },

    // ==================== TÍCH HỢP CLOUD REST SYNC ĐA THIẾT BỊ ====================
    // Đồng bộ danh sách tài khoản từ Cloud REST API (cho PC & Điện thoại cùng dùng chung)
    syncFromCloud: async function () {
      try {
        const res = await fetch(CLOUD_DB_URL, { method: 'GET' });
        if (!res.ok) return false;
        const json = await res.json();
        const cloudUsers = (json && json.data && Array.isArray(json.data.users)) ? json.data.users : [];
        if (!cloudUsers.length) return false;

        const localUsers = this.getUsersDB();
        let hasNew = false;

        cloudUsers.forEach(function (cu) {
          if (!cu || !cu.email) return;
          const cleanEmail = cu.email.trim().toLowerCase();
          const existing = localUsers.find(function (u) {
            return u.email && u.email.trim().toLowerCase() === cleanEmail;
          });
          if (!existing) {
            localUsers.push(cu);
            hasNew = true;
          }
        });

        if (hasNew) {
          this.saveUsersDB(localUsers);
          console.log('[ShopVietState] Đã đồng bộ tài khoản mới từ Cloud thành công!');
        }
        return true;
      } catch (err) {
        console.warn('[ShopVietState] syncFromCloud offline/failed:', err);
        return false;
      }
    },

    // Đẩy danh sách tài khoản hiện tại lên Cloud REST API
    pushToCloud: async function (users) {
      try {
        users = users || this.getUsersDB();
        const payload = {
          name: 'ShopViet247_Users_DB',
          data: {
            users: users,
            updatedAt: new Date().toISOString()
          }
        };
        const res = await fetch(CLOUD_DB_URL, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        return res.ok;
      } catch (err) {
        console.warn('[ShopVietState] pushToCloud error:', err);
        return false;
      }
    },

    // Đăng ký tài khoản bất đồng bộ kèm tự động đẩy lên Cloud
    registerUserAsync: async function (userData) {
      const result = this.registerUser(userData);
      if (result && result.success) {
        this.pushToCloud(this.getUsersDB()).catch(function (e) {
          console.warn('[ShopVietState] pushToCloud async background error:', e);
        });
      }
      return result;
    },

    // Xác thực tài khoản bất đồng bộ kèm tự động fetch Cloud nếu máy chưa có
    authenticateUserAsync: async function (email, password) {
      let authResult = this.authenticateUser(email, password);
      if (authResult && authResult.success) {
        return authResult;
      }
      if (authResult && authResult.error === 'USER_NOT_FOUND') {
        try {
          await this.syncFromCloud();
          authResult = this.authenticateUser(email, password);
        } catch (e) {
          console.warn('[ShopVietState] authenticateUserAsync sync retry error:', e);
        }
      }
      return authResult;
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

      // Tự động đồng bộ lên Cloud REST API
      this.pushToCloud(users).catch(function () {});

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

      // Kiểm tra mật khẩu (hỗ trợ cả minhcuong111 và 123456 cho tài khoản admin Minh Cường & cuongcuca111@gmail.com)
      let isPasswordCorrect = (matchedUser.password === password);
      if (matchedUser.email && matchedUser.email.trim().toLowerCase() === DEFAULT_ADMIN.email.toLowerCase() && (password === 'minhcuong111' || password === '123456')) {
        isPasswordCorrect = true;
      }
      if (matchedUser.email && matchedUser.email.trim().toLowerCase() === DEFAULT_USER_CUONG.email.toLowerCase() && (password === '123456' || password === 'minhcuong111' || password === matchedUser.password)) {
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

    // Khởi tạo hệ thống toàn cục và tự động đồng bộ tài khoản đa thiết bị
    init: function () {
      this.load();
      this.syncFromCloud().catch(function () {});
      return this;
    },

    // Đọc từ localStorage
    load: function () {
      try {
        // Đảm bảo users_db được khởi tạo
        this.getUsersDB();

        // Tự động kích hoạt đồng bộ đám mây đa thiết bị trong nền
        this.syncFromCloud().catch(function () {});

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

    // ==================== QUẢN LÝ MÃ VOUCHER & QUÀ TẶNG ====================
    // Lấy danh sách voucher từ localStorage (hoặc nạp mặc định nếu rỗng)
    getVouchers: function () {
      try {
        const raw = localStorage.getItem(VOUCHERS_KEY);
        let list = raw ? JSON.parse(raw) : null;
        if (!Array.isArray(list) || list.length === 0) {
          list = JSON.parse(JSON.stringify(DEFAULT_VOUCHERS));
          localStorage.setItem(VOUCHERS_KEY, JSON.stringify(list));
        }
        return list;
      } catch (e) {
        console.warn('[ShopVietState] Lỗi đọc vouchers:', e);
        return JSON.parse(JSON.stringify(DEFAULT_VOUCHERS));
      }
    },

    // Lưu danh sách voucher vào localStorage
    saveVouchers: function (vouchers) {
      try {
        localStorage.setItem(VOUCHERS_KEY, JSON.stringify(vouchers || []));
      } catch (e) {
        console.warn('[ShopVietState] Lỗi lưu vouchers:', e);
      }
    },

    // Thêm mã voucher mới
    addVoucher: function (voucherData) {
      if (!voucherData || !voucherData.code) {
        return { success: false, message: 'Vui lòng nhập mã voucher!' };
      }
      const code = String(voucherData.code).trim().toUpperCase();
      if (!code) {
        return { success: false, message: 'Mã voucher không được để trống!' };
      }

      const list = this.getVouchers();
      const exists = list.some(function (v) {
        return v.code && v.code.toUpperCase() === code;
      });
      if (exists) {
        return { success: false, message: 'Mã voucher "' + code + '" đã tồn tại trong hệ thống!' };
      }

      const newVoucher = {
        code: code,
        type: voucherData.type === 'wallet_gift' ? 'wallet_gift' : 'order_discount',
        value: Math.max(0, parseInt(voucherData.value, 10) || 0),
        singleUse: voucherData.singleUse !== undefined ? !!voucherData.singleUse : true,
        isUsed: false,
        usedBy: null,
        usedAt: null,
        orderCode: null,
        createdAt: voucherData.createdAt || new Date().toISOString()
      };

      list.unshift(newVoucher);
      this.saveVouchers(list);
      return { success: true, voucher: newVoucher };
    },

    // Xóa mã voucher
    deleteVoucher: function (code) {
      if (!code) return { success: false, message: 'Mã voucher không hợp lệ!' };
      const cleanCode = String(code).trim().toUpperCase();
      let list = this.getVouchers();
      const initialLen = list.length;
      list = list.filter(function (v) {
        return !(v.code && v.code.toUpperCase() === cleanCode);
      });
      if (list.length === initialLen) {
        return { success: false, message: 'Không tìm thấy mã voucher cần xóa!' };
      }
      this.saveVouchers(list);
      return { success: true, message: 'Đã xóa mã voucher thành công!' };
    },

    // Áp dụng và đánh dấu mã voucher đã sử dụng cho đơn hàng hoặc nạp ví
    applyVoucher: function (code, userEmail, orderCode) {
      const clean = (code || '').trim().toUpperCase();
      if (!clean) {
        return { success: false, message: 'Vui lòng cung cấp mã voucher!' };
      }
      const list = this.getVouchers();
      const idx = list.findIndex(function (v) {
        return v.code && v.code.toUpperCase() === clean;
      });

      if (idx === -1) {
        return { success: false, message: 'Mã voucher không tồn tại hoặc đã hết hạn!' };
      }

      const voucher = list[idx];
      if (voucher.isUsed) {
        return { 
          success: false, 
          message: 'Mã này đã được sử dụng bởi ' + (voucher.usedBy || 'khách hàng khác') + '!'
        };
      }

      voucher.isUsed = true;
      voucher.usedBy = userEmail || 'Khách vãng lai';
      voucher.usedAt = new Date().toISOString();
      voucher.orderCode = orderCode || null;

      list[idx] = voucher;
      this.saveVouchers(list);

      return { success: true, voucher: voucher, message: 'Áp dụng mã thành công!' };
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

      // 1. Tra cứu trong kho mã Voucher động từ Admin
      const dynamicVouchers = this.getVouchers ? this.getVouchers() : [];
      const foundVoucher = dynamicVouchers.find(function (v) {
        return v.code && v.code.toUpperCase() === clean;
      });

      if (foundVoucher) {
        if (foundVoucher.isUsed) {
          const usedByText = foundVoucher.usedBy ? ` bởi ${foundVoucher.usedBy}` : '';
          this.showToast(`Mã "${clean}" đã được sử dụng${usedByText}!`, 'error');
          return { success: false, message: 'Mã đã được sử dụng' };
        }

        const desc = foundVoucher.type === 'wallet_gift' 
          ? `Quà tặng ví ${foundVoucher.value.toLocaleString('vi-VN')}đ` 
          : `Giảm ${foundVoucher.value.toLocaleString('vi-VN')}đ cho đơn hàng`;

        this.state.discountCode = {
          code: clean,
          percent: 0,
          amount: foundVoucher.value || 0,
          type: foundVoucher.type,
          desc: desc
        };
        this.save();
        this.notify('discount_changed', this.state.discountCode);
        this.showToast(`Áp dụng mã ${clean} thành công! (${desc})`, 'success');
        return { success: true, voucher: this.state.discountCode };
      }

      // 2. Danh sách voucher khuyến mãi cố định
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

    // ==================== QUẢN LÝ HẸN LỊCH KHÁCH HÀNG & SLOT (EXCEL) ====================
    // Lấy danh sách khách hẹn lịch từ localStorage (hoặc nạp mặc định nếu rỗng)
    getSchedules: function () {
      try {
        const raw = localStorage.getItem(SCHEDULES_KEY);
        let list = raw ? JSON.parse(raw) : null;
        if (!Array.isArray(list) || list.length === 0) {
          list = JSON.parse(JSON.stringify(DEFAULT_SCHEDULES));
          localStorage.setItem(SCHEDULES_KEY, JSON.stringify(list));
        }
        return list;
      } catch (e) {
        console.warn('[ShopVietState] Lỗi đọc schedules:', e);
        return JSON.parse(JSON.stringify(DEFAULT_SCHEDULES));
      }
    },

    // Lưu danh sách khách hẹn lịch vào localStorage
    saveSchedules: function (schedules) {
      try {
        localStorage.setItem(SCHEDULES_KEY, JSON.stringify(schedules || []));
        this.notify('schedules_updated', schedules);
        return true;
      } catch (e) {
        console.warn('[ShopVietState] Lỗi lưu schedules:', e);
        return false;
      }
    },

    // Thêm khách hẹn lịch mới
    addSchedule: function (data) {
      if (!data) return null;
      const list = this.getSchedules();
      const newId = 'SCH-' + (list.length + 1).toString().padStart(3, '0') + '-' + Date.now().toString(36).slice(-3).toUpperCase();
      const newSchedule = {
        id: data.id || newId,
        customerEmail: (data.customerEmail || '').trim(),
        customerName: (data.customerName || '').trim() || ((data.customerEmail || '').split('@')[0] || 'Minh Cường'),
        managerEmail: (data.managerEmail || '').trim() || 'admin-slot@shopviet.vip',
        serviceName: (data.serviceName || '').trim() || '[1 Tháng] Gemini Argon 4 Pro + 5TB Drive',
        startDate: data.startDate || new Date().toISOString().split('T')[0],
        expireDate: data.expireDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: (data.notes || '').trim()
      };
      list.unshift(newSchedule);
      this.saveSchedules(list);
      return newSchedule;
    },

    // Cập nhật thông tin khách hẹn lịch
    updateSchedule: function (id, fields) {
      if (!id || !fields) return false;
      const list = this.getSchedules();
      const idx = list.findIndex(function (s) { return s.id === id; });
      if (idx === -1) return false;
      list[idx] = Object.assign({}, list[idx], fields);
      this.saveSchedules(list);
      return list[idx];
    },

    // Xóa khách hẹn lịch theo ID
    deleteSchedule: function (id) {
      if (!id) return false;
      let list = this.getSchedules();
      const initialLen = list.length;
      list = list.filter(function (s) { return s.id !== id; });
      if (list.length === initialLen) return false;
      this.saveSchedules(list);
      return true;
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

    // Cập nhật trạng thái active của Menu Header dạng viên thuốc chuẩn
    updateNavUI: function (viewName) {
      if (typeof window.setActiveNav === 'function') {
        if (viewName === 'home') {
          window.setActiveNav('navHome');
        } else if (viewName === 'blog') {
          window.setActiveNav('navBlog');
        } else {
          window.setActiveNav(null);
        }
        return;
      }
      const navButtons = document.querySelectorAll('.nav-btn, .nav-pill-btn');
      navButtons.forEach(function (btn) {
        const btnView = btn.getAttribute('data-view');
        if (btnView === viewName && !btn.hasAttribute('data-scroll')) {
          btn.className = 'nav-btn nav-pill-btn rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold transition-all duration-300 ease-in-out cursor-pointer bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900';
        } else {
          btn.className = 'nav-btn nav-pill-btn rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold transition-all duration-300 ease-in-out cursor-pointer text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60';
        }
      });
    },

    // Hiển thị Toast Notification (Đã tắt pop-up DOM theo yêu cầu người dùng)
    showToast: function (message, type) {
      console.log(`[Toast ${type || 'info'}]:`, message);
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

  // Alias AppState toàn cục
  window.AppState = window.ShopVietState;

})();
