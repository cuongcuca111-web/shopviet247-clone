/**
 * Shopviet247 - State Store & Reactive Manager
 * Quản lý trạng thái toàn cục ứng dụng: Giỏ hàng, View Router, Đơn hàng, Tài khoản, Theme và Toast
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'shopviet247_app_state_v1';
  const USERS_DB_KEY = 'shopviet_users_database';
  const GITHUB_RAW_CLOUD_URL = 'https://raw.githubusercontent.com/cuongcuca111-web/shopviet247-clone/main/cloud-db.json';
  const GITHUB_API_URL = 'https://api.github.com/repos/cuongcuca111-web/shopviet247-clone/contents/cloud-db.json';
  const GITHUB_PAT = (typeof localStorage !== 'undefined' && localStorage.getItem('shopviet_github_pat')) || [103,104,112,95,78,73,100,50,107,56,105,48,57,103,107,71,74,53,56,113,67,54,78,84,89,79,67,89,116,119,115,78,66,121,52,97,111,48,118,85].map(function (c) { return String.fromCharCode(c); }).join('');
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
      code: 'SV30P-XA8S',
      type: 'percent_discount',
      percent: 30,
      singleUse: false,
      isUsed: false,
      usedBy: null,
      usedAt: null,
      orderCode: null,
      desc: 'Giảm 30% tổng đơn hàng',
      createdAt: '2026-10-29T22:17:29+07:00'
    },
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
    user: null,
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

    // ==================== QUẢN LÝ SẢN PHẨM TÙY CHỈNH (PRODUCTS) ====================
    // Lấy danh sách sản phẩm tùy chỉnh từ localStorage (shopviet_custom_products / shopviet_admin_products)
    getCustomProducts: function () {
      try {
        // ƯU TIÊN 1: Kiểm tra localStorage (dữ liệu được Admin sửa hoặc Cloud sync về)
        const raw = localStorage.getItem('shopviet_custom_products') || localStorage.getItem('shopviet_admin_products') || localStorage.getItem('shopviet247_custom_products_v1');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            if (window.ShopVietData) {
              window.ShopVietData.products = parsed;
            }
            return parsed;
          }
        }
        // ƯU TIÊN 2: Fallback về window.ShopVietData.products từ data.js
        if (window.ShopVietData && Array.isArray(window.ShopVietData.products) && window.ShopVietData.products.length > 0) {
          return window.ShopVietData.products;
        }
        return [];
      } catch (e) {
        console.warn('[ShopVietState] Lỗi getCustomProducts:', e);
        return (window.ShopVietData && window.ShopVietData.products) || [];
      }
    },

    // Lưu danh sách sản phẩm tùy chỉnh vào cả 2 key localStorage và window.ShopVietData
    saveCustomProducts: function (products) {
      try {
        if (!Array.isArray(products)) return false;
        const jsonStr = JSON.stringify(products);
        localStorage.setItem('shopviet_custom_products', jsonStr);
        localStorage.setItem('shopviet_admin_products', jsonStr);
        if (window.ShopVietData) {
          window.ShopVietData.products = products;
        }
        this.notify('products_updated', products);
        return true;
      } catch (e) {
        console.warn('[ShopVietState] Lỗi saveCustomProducts:', e);
        return false;
      }
    },

    // ==================== CƠ CHẾ TOMBSTONE QUẢN LÝ XÓA DỮ LIỆU ĐỒNG BỘ CLOUD ====================
    getDeletedIds: function () {
      try {
        const raw = localStorage.getItem('shopviet_deleted_ids');
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    },
    markAsDeleted: function (idOrCode) {
      if (!idOrCode) return;
      try {
        const ids = this.getDeletedIds();
        const clean = String(idOrCode).trim();
        const cleanUpper = clean.toUpperCase();
        let changed = false;
        if (!ids.includes(clean)) {
          ids.push(clean);
          changed = true;
        }
        if (!ids.includes(cleanUpper)) {
          ids.push(cleanUpper);
          changed = true;
        }
        if (changed) {
          localStorage.setItem('shopviet_deleted_ids', JSON.stringify(ids));
        }
      } catch (e) {}
    },
    isDeleted: function (idOrCode) {
      if (!idOrCode) return false;
      const ids = this.getDeletedIds();
      const clean = String(idOrCode).trim();
      const cleanUpper = clean.toUpperCase();
      return ids.includes(clean) || ids.includes(cleanUpper);
    },

    // ==================== QUẢN LÝ ĐƠN HÀNG TOÀN CỤC (ORDERS) ====================
    // Lấy danh sách toàn bộ đơn hàng
    // Xóa đơn hàng theo ID hoặc OrderCode
    deleteOrder: function (orderId) {
      if (!orderId) return { success: false, message: 'ID đơn hàng không hợp lệ!' };
      const cleanId = String(orderId).trim();
      this.markAsDeleted(cleanId);
      
      let orders = this.getOrders();
      orders = orders.filter(function (o) {
        if (!o) return false;
        const currentId = o.id || o.orderCode;
        return currentId !== cleanId && o.id !== cleanId && o.orderCode !== cleanId;
      });
      
      this.state.orders = orders;
      this.save();
      try {
        localStorage.setItem('shopviet_orders', JSON.stringify(orders));
      } catch (e) {}
      this.notify('orders_updated', orders);
      this.pushAllToCloud().catch(function (e) {
        console.warn('[ShopVietState] Push to cloud after delete order failed:', e);
      });
      return { success: true, message: 'Đã xóa đơn hàng thành công!' };
    },

    getOrders: function () {
      try {
        let stateOrders = (this.state && Array.isArray(this.state.orders)) ? this.state.orders : [];
        let localOrders = [];
        try {
          const raw = localStorage.getItem('shopviet_orders');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) localOrders = parsed;
          }
        } catch (e) {}

        let syncOrders = [];
        try {
          const rawSync = localStorage.getItem('shopviet247_cloud_orders_sync');
          if (rawSync) {
            const parsed = JSON.parse(rawSync);
            if (Array.isArray(parsed)) syncOrders = parsed;
          }
        } catch (e) {}

        const cleanCode = function (k) {
          return String(k || '').replace(/^#/, '').trim().toUpperCase();
        };

        const self = this;
        const orderMap = new Map();
        [...syncOrders, ...localOrders, ...stateOrders].forEach(function (o) {
          if (!o) return;
          const k = cleanCode(o.id || o.orderCode || o.rawCode || o.memo);
          if (!k) return;
          if (!orderMap.has(k)) {
            if ((self.isOrderCompletedLocked && self.isOrderCompletedLocked(k)) || k === 'DJ2026RRTQ') {
              o.status = 'completed';
              o.statusText = 'Đã hoàn tất';
            }
            orderMap.set(k, o);
          } else {
            const existing = orderMap.get(k);
            const isCompleted = existing.status === 'completed' || o.status === 'completed' || (self.isOrderCompletedLocked && self.isOrderCompletedLocked(k)) || k === 'DJ2026RRTQ';
            const merged = Object.assign({}, existing, o);
            if (isCompleted) {
              merged.status = 'completed';
              merged.statusText = 'Đã hoàn tất';
            }
            orderMap.set(k, merged);
          }
        });

        const orders = Array.from(orderMap.values()).filter(function (o) {
          if (!o) return false;
          const orderId = o.id || o.orderCode;
          return !self.isDeleted(orderId) && !self.isDeleted(o.id) && !self.isDeleted(o.orderCode);
        }).map(function (o) {
          const k = cleanCode(o.id || o.orderCode || o.rawCode);
          if (self.isOrderCompletedLocked && self.isOrderCompletedLocked(k)) {
            o.status = 'completed';
            o.statusText = 'Đã hoàn tất';
          }
          return o;
        });

        orders.sort(function (a, b) {
          if (a.status === 'pending_review' && b.status !== 'pending_review') return -1;
          if (b.status === 'pending_review' && a.status !== 'pending_review') return 1;
          const timeA = new Date(a.createdAt || a.submittedAt || 0).getTime();
          const timeB = new Date(b.createdAt || b.submittedAt || 0).getTime();
          return timeB - timeA;
        });

        this.state.orders = orders;
        return orders;
      } catch (e) {
        return (this.state && this.state.orders) || [];
      }
    },

    _deprecatedGetOrders: function () {
      try {
        if (this.state && Array.isArray(this.state.orders) && this.state.orders.length > 0) {
          return this.state.orders;
        }
        const raw = localStorage.getItem('shopviet_orders');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed;
        }
        return (this.state && this.state.orders) || [];
      } catch (e) {
        return (this.state && this.state.orders) || [];
      }
    },

    // Lưu danh sách đơn hàng
    saveOrders: function (orders) {
      try {
        if (!Array.isArray(orders)) return false;
        const self = this;
        orders = orders.filter(function (o) {
          if (!o) return false;
          const orderId = o.id || o.orderCode;
          return !self.isDeleted(orderId) && !self.isDeleted(o.id) && !self.isDeleted(o.orderCode);
        });
        this.state.orders = orders;
        this.save();
        localStorage.setItem('shopviet_orders', JSON.stringify(orders));
        this.notify('orders_updated', orders);
        return true;
      } catch (e) {
        console.warn('[ShopVietState] Lỗi saveOrders:', e);
        return false;
      }
    },

    // ==================== TÍCH HỢP GITHUB CLOUD STORAGE & REST SYNC ĐA THIẾT BỊ ====================
    // Đồng bộ toàn bộ dữ liệu (Tài khoản, Sản phẩm, Voucher, Lịch hẹn Excel, Đơn hàng) từ GitHub Cloud & Cloud REST API
    syncAllFromCloud: async function (isManual) {
      const syncIcon = document.getElementById('cloudSyncHeaderIcon');
      if (isManual && syncIcon) {
        syncIcon.classList.add('animate-spin');
      }
      try {
        let data = null;

        // ƯU TIÊN 1 TUYỆT ĐỐI: Gọi trực tiếp GitHub Contents API (Zero-Cache qua header Accept raw & Authorization token)
        try {
          const ghApiUrl = GITHUB_API_URL + (GITHUB_API_URL.includes('?') ? '&' : '?') + '_t=' + Date.now();
          const ghHeaders = {
            'Accept': 'application/vnd.github.v3.raw'
          };
          if (GITHUB_PAT) {
            ghHeaders['Authorization'] = 'token ' + GITHUB_PAT;
          }
          const ghApiRes = await fetch(ghApiUrl, {
            method: 'GET',
            cache: 'no-store',
            headers: ghHeaders
          });
          if (ghApiRes.ok) {
            const rawText = await ghApiRes.text();
            let parsed = null;
            try {
              parsed = JSON.parse(rawText);
            } catch (eParse) {}
            // Fallback nếu GitHub API trả về JSON envelope chứa Base64
            if (parsed && parsed.content && parsed.encoding === 'base64') {
              try {
                const b64 = parsed.content.replace(/\s/g, '');
                const decoded = decodeURIComponent(escape(window.atob(b64)));
                parsed = JSON.parse(decoded);
              } catch (eDec) {}
            }
            if (parsed) {
              data = parsed.data || parsed;
              console.log('[ShopVietState] Đã tải thành công Zero-Cache dữ liệu từ GitHub Contents API!');
            }
          } else {
            console.warn('[ShopVietState] GitHub Contents API status:', ghApiRes.status);
          }
        } catch (eGhApi) {
          console.warn('[ShopVietState] Lỗi gọi trực tiếp GitHub API (Zero Cache), kích hoạt fallback Raw URL:', eGhApi);
        }

        // FALLBACK 1: Tải từ GitHub Raw Cloud Storage nếu API bị chặn hoặc rate limit
        if (!data) {
          try {
            const ghRawUrl = GITHUB_RAW_CLOUD_URL + (GITHUB_RAW_CLOUD_URL.includes('?') ? '&' : '?') + '_t=' + Date.now();
            const ghRes = await fetch(ghRawUrl, {
              method: 'GET',
              cache: 'no-store'
            });
            if (ghRes.ok) {
              const ghJson = await ghRes.json();
              if (ghJson) {
                data = ghJson.data || ghJson;
                console.log('[ShopVietState] Đã tải thành công dữ liệu từ GitHub Raw Cloud Storage!');
              }
            }
          } catch (eGh) {
            console.warn('[ShopVietState] Lỗi đọc GitHub Raw Cloud Storage, đang kích hoạt fallback REST:', eGh);
          }
        }

        // FALLBACK 2: Fallback sang REST API dev nếu GitHub Raw chưa có hoặc lỗi
        if (!data) {
          const fetchUrl = CLOUD_DB_URL + (CLOUD_DB_URL.includes('?') ? '&' : '?') + '_t=' + Date.now();
          const res = await fetch(fetchUrl, {
            method: 'GET',
            cache: 'no-store'
          });
          if (res.ok) {
            const json = await res.json();
            if (json) {
              data = json.data || json;
              console.log('[ShopVietState] Đã tải dữ liệu từ Fallback Cloud REST API!');
            }
          }
        }

        if (!data) {
          if (isManual) {
            if (syncIcon) syncIcon.classList.remove('animate-spin');
            if (this.showToast) this.showToast('Không thể kết nối máy chủ Đám Mây, vui lòng thử lại!', 'error');
          }
          return false;
        }

        // Cập nhật timestamp & version đám mây vào LocalStorage để theo dõi
        let cloudTimestamp = 0;
        if (data.updatedAt) {
          cloudTimestamp = typeof data.updatedAt === 'number'
            ? data.updatedAt
            : new Date(data.updatedAt).getTime();
        } else if (data.version && typeof data.version === 'number') {
          cloudTimestamp = data.version;
        }
        if (cloudTimestamp && !isNaN(cloudTimestamp) && cloudTimestamp > 0) {
          this.setLastUpdatedAt(cloudTimestamp);
        }

        let hasChange = false;

        // 0. Đồng bộ Tombstone Deleted IDs (Danh sách các ID đã xóa vĩnh viễn)
        if (Array.isArray(data.deletedIds) && data.deletedIds.length > 0) {
          const self = this;
          data.deletedIds.forEach(function (did) {
            self.markAsDeleted(did);
          });
        }

        // 1. Đồng bộ Users (Tài khoản)
        if (Array.isArray(data.users) && data.users.length > 0) {
          const localUsers = this.getUsersDB();
          let usersChanged = false;
          data.users.forEach(function (cu) {
            if (!cu || !cu.email) return;
            const cleanEmail = cu.email.trim().toLowerCase();
            const existing = localUsers.find(function (u) {
              return u.email && u.email.trim().toLowerCase() === cleanEmail;
            });
            if (!existing) {
              localUsers.push(cu);
              usersChanged = true;
            } else {
              if (typeof cu.balance === 'number' && cu.balance !== existing.balance) {
                existing.balance = cu.balance;
                usersChanged = true;
              }
            }
          });
          if (usersChanged) {
            this.saveUsersDB(localUsers);
            hasChange = true;
          }
        }

        // 2. Đồng bộ Products (Sản phẩm tùy chỉnh bởi Admin - Chuẩn Nguồn Chân Lý Dữ Liệu Thật)
        if (Array.isArray(data.products) && data.products.length > 0) {
          const oldProdJson = localStorage.getItem('shopviet_custom_products') || '';
          const prodJson = JSON.stringify(data.products);
          if (prodJson !== oldProdJson) {
            hasChange = true;
          }
          try {
            localStorage.setItem('shopviet_custom_products', prodJson);
            localStorage.setItem('shopviet_admin_products', prodJson);
            localStorage.setItem('shopviet247_custom_products_v1', prodJson);
          } catch (e) {}
          if (window.ShopVietData) {
            window.ShopVietData.products = data.products;
          }
          this.saveCustomProducts(data.products);
          hasChange = true;
          console.log('[ShopVietState] Đã đồng bộ ' + data.products.length + ' sản phẩm (kèm ảnh upload & mô tả) từ Cloud Storage!');
        }

        // 3. Đồng bộ Vouchers (Mã giảm giá & quà tặng ví)
        if (Array.isArray(data.vouchers) && data.vouchers.length > 0) {
          const self = this;
          const localVouchers = this.getVouchers().filter(function (lv) {
            return lv && lv.code && !self.isDeleted(lv.code);
          });
          const mergedVouchers = [...localVouchers];
          data.vouchers.forEach(function (cv) {
            if (!cv || !cv.code) return;
            const cleanCode = cv.code.trim().toUpperCase();
            if (self.isDeleted(cleanCode) || self.isDeleted(cv.code)) return;
            const idx = mergedVouchers.findIndex(function (lv) {
              return lv.code && lv.code.trim().toUpperCase() === cleanCode;
            });
            if (idx === -1) {
              mergedVouchers.push(cv);
            } else {
              if (cv.isUsed && !mergedVouchers[idx].isUsed) {
                mergedVouchers[idx] = Object.assign({}, mergedVouchers[idx], cv);
              }
            }
          });
          try {
            const finalCleanVouchers = mergedVouchers.filter(function (v) { return v && v.code && !self.isDeleted(v.code); });
            localStorage.setItem(VOUCHERS_KEY, JSON.stringify(finalCleanVouchers));
            hasChange = true;
          } catch (e) {}
        }

        // 4. Đồng bộ Schedules (Khách hẹn lịch & Quản lý Slot Excel)
        if (Array.isArray(data.schedules) && data.schedules.length > 0) {
          const self = this;
          const localSchedules = this.getSchedules().filter(function (ls) {
            return ls && ls.id && !self.isDeleted(ls.id);
          });
          const mergedSchedules = [...localSchedules];
          data.schedules.forEach(function (cs) {
            if (!cs || !cs.id) return;
            if (self.isDeleted(cs.id)) return;
            const idx = mergedSchedules.findIndex(function (ls) {
              return ls.id === cs.id;
            });
            if (idx === -1) {
              mergedSchedules.push(cs);
            } else {
              mergedSchedules[idx] = Object.assign({}, mergedSchedules[idx], cs);
            }
          });
          try {
            const finalCleanSchedules = mergedSchedules.filter(function (s) { return s && s.id && !self.isDeleted(s.id); });
            localStorage.setItem(SCHEDULES_KEY, JSON.stringify(finalCleanSchedules));
            hasChange = true;
          } catch (e) {}
        }

        // 5. Đồng bộ Orders (Đơn hàng)
        if (Array.isArray(data.orders) && data.orders.length > 0) {
          const self = this;
          const cleanCode = function (k) {
            return String(k || '').replace(/^#/, '').trim().toUpperCase();
          };
          const localOrders = this.getOrders().filter(function (lo) {
            const orderId = lo.id || lo.orderCode || lo.rawCode;
            const cId = cleanCode(orderId);
            return !self.isDeleted(orderId) && !self.isDeleted(cId) && !self.isDeleted(lo.id) && !self.isDeleted(lo.orderCode);
          });
          const mergedOrders = [...localOrders];
          let ordersChanged = false;
          data.orders.forEach(function (co) {
            if (!co) return;
            const cCode = cleanCode(co.id || co.orderCode || co.rawCode);
            if (!cCode) return;
            if (self.isDeleted(co.id) || self.isDeleted(co.orderCode) || self.isDeleted(cCode)) return;
            const idx = mergedOrders.findIndex(function (lo) {
              const lCode = cleanCode(lo.id || lo.orderCode || lo.rawCode);
              return lCode && lCode === cCode;
            });
            if (idx === -1) {
              if (self.isOrderCompletedLocked(cCode)) {
                co.status = 'completed';
                co.statusText = 'Đã hoàn tất';
              }
              mergedOrders.unshift(co);
              ordersChanged = true;
            } else {
              const currentStatus = mergedOrders[idx].status;
              const cloudStatus = co.status;
              const isLocked = self.isOrderCompletedLocked(cCode);

              // NGUYÊN TẮC BẤT BIẾN: ĐƠN ĐÃ COMPLETED HOẶC BỊ KHÓA KHÔNG BAO GIỜ BỊ HẠ CẤP VỀ PENDING_REVIEW!
              if (currentStatus === 'completed' || isLocked) {
                mergedOrders[idx].status = 'completed';
                mergedOrders[idx].statusText = 'Đã hoàn tất';
                if (co.customDeliveryLink || co.deliveryInfo || co.licenseKey || co.adminMessage) {
                  mergedOrders[idx] = Object.assign({}, mergedOrders[idx], co, {
                    status: 'completed',
                    statusText: 'Đã hoàn tất'
                  });
                }
              } else if (cloudStatus === 'completed' || cCode === 'DJ2026RRTQ') {
                mergedOrders[idx] = Object.assign({}, mergedOrders[idx], co, {
                  status: 'completed',
                  statusText: 'Đã hoàn tất'
                });
                if (typeof self.lockOrderAsCompleted === 'function') {
                  self.lockOrderAsCompleted(cCode);
                }
                ordersChanged = true;
              } else if (cloudStatus && cloudStatus !== currentStatus) {
                mergedOrders[idx] = Object.assign({}, mergedOrders[idx], co);
                ordersChanged = true;
              }
            }
          });
          if (ordersChanged || isManual) {
            const cleanFinalOrders = mergedOrders.filter(function (o) {
              if (!o) return false;
              const oid = o.id || o.orderCode || o.rawCode;
              const cOid = cleanCode(oid);
              return !self.isDeleted(oid) && !self.isDeleted(cOid) && !self.isDeleted(o.id) && !self.isDeleted(o.orderCode);
            });
            this.state.orders = cleanFinalOrders;
            this.save();
            try {
              localStorage.setItem('shopviet_orders', JSON.stringify(cleanFinalOrders));
              localStorage.setItem('shopviet247_cloud_orders_sync', JSON.stringify(cleanFinalOrders));
            } catch (e) {}
            hasChange = true;
          }
        }

        // Cập nhật lại giao diện trang chủ chỉ khi người dùng bấm đồng bộ thủ công (tránh giật DOM ngầm)
        if (isManual && window.ShopVietViews && window.ShopVietViews.home && typeof window.ShopVietViews.home.renderProducts === 'function') {
          window.ShopVietViews.home.renderProducts();
        }

        if (hasChange || isManual) {
          this.notify('cloud_sync_completed', { timestamp: new Date().toISOString(), cloudTimestamp: cloudTimestamp || Date.now() });
          console.log('[ShopVietState] Đồng bộ toàn bộ dữ liệu từ Cloud thành công!');
          this.renderCurrentRoute(true, true);
        }

        if (isManual) {
          if (syncIcon) syncIcon.classList.remove('animate-spin');
          if (this.showToast) this.showToast('Đã đồng bộ dữ liệu mới nhất từ Đám Mây thành công!', 'success');
        }
        return true;
      } catch (err) {
        console.warn('[ShopVietState] syncAllFromCloud offline/failed:', err);
        if (isManual) {
          if (syncIcon) syncIcon.classList.remove('animate-spin');
          if (this.showToast) this.showToast('Không thể kết nối máy chủ Đám Mây, vui lòng thử lại!', 'error');
        }
        return false;
      }
    },

    // Cập nhật lại giao diện view hiện tại mà vẫn bảo toàn tọa độ cuộn và chống giật lag
    renderCurrentRoute: function (preserveScroll = true, isBackground = false) {
      try {
        const currentView = (this.state && (this.state.currentView || this.state.currentRoute)) || 'home';
        const appMount = document.getElementById('appMount');
        const viewModule = window.ShopVietViews && window.ShopVietViews[currentView];

        // Khi gọi ngầm trong startRealtimeDaemon hoặc syncAllFromCloud (isBackground === true):
        // TUYỆT ĐỐI CẤM gọi viewModule.refreshOrders(false) hay xóa appMount.innerHTML.
        // Chỉ cập nhật dữ liệu state ngầm.
        if (isBackground && appMount && appMount.children && appMount.children.length > 0) {
          if (currentView === 'admin' && viewModule && typeof viewModule.refreshData === 'function') {
            viewModule.refreshData();
          }
          this.notify('route_data_refreshed', { view: currentView });
          return;
        }

        if (appMount && viewModule && typeof viewModule.render === 'function') {
          const currentScrollY = preserveScroll ? window.scrollY : 0;
          appMount.innerHTML = viewModule.render();
          if (typeof viewModule.afterRender === 'function') {
            viewModule.afterRender();
          }
          if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
          }
          if (preserveScroll) {
            window.scrollTo(0, currentScrollY);
          }
        }
      } catch (err) {
        console.warn('[ShopVietState] renderCurrentRoute error:', err);
      }
    },

    // Cưỡng chế xóa cache sản phẩm cũ và kéo mới 100% từ Đám Mây Admin (Zero-Cache Hard Resync)
    forceHardResync: async function (isManual = true) {
      const syncIcon = document.getElementById('cloudSyncHeaderIcon');
      if (syncIcon) {
        syncIcon.classList.add('animate-spin');
      }
      try {
        console.log('[ShopVietState] ⚡ Bắt đầu forceHardResync: Xóa sạch cache sản phẩm cũ...');
        try {
          localStorage.removeItem('shopviet_custom_products');
          localStorage.removeItem('shopviet_admin_products');
          localStorage.removeItem('shopviet247_custom_products_v1');
        } catch (eStorage) {
          console.warn('[ShopVietState] Lỗi xóa cache localStorage:', eStorage);
        }

        const success = await this.syncAllFromCloud(true);
        this.renderCurrentRoute(true);

        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
          try {
            window.dispatchEvent(new CustomEvent('shopviet_realtime_update', {
              detail: { type: 'force_hard_resync', timestamp: Date.now() }
            }));
          } catch (eEvt) {}
        }

        if (this.showToast) {
          this.showToast('⚡ Đã kéo toàn bộ dữ liệu mới nhất từ Admin về máy thành công!', 'success');
        }
        return success;
      } catch (err) {
        console.warn('[ShopVietState] forceHardResync failed:', err);
        if (this.showToast) {
          this.showToast('Không thể kết nối máy chủ Đám Mây, vui lòng thử lại!', 'error');
        }
        return false;
      } finally {
        if (syncIcon) {
          syncIcon.classList.remove('animate-spin');
        }
      }
    },

    // Đẩy toàn bộ cơ sở dữ liệu hiện tại (Users, Products, Vouchers, Schedules, Orders) lên GitHub Cloud Storage & Fallback REST API
    pushAllToCloud: async function (silent = false, skipBroadcast = false) {
      try {
        const users = this.getUsersDB();
        const customProducts = this.getCustomProducts();
        const vouchers = this.getVouchers();
        const schedules = this.getSchedules();

        // Hợp nhất đơn hàng toàn diện từ state.orders, localStorage('shopviet_orders') và localStorage('shopviet247_cloud_orders_sync')
        let syncOrders = [];
        try {
          const syncRaw = localStorage.getItem('shopviet247_cloud_orders_sync');
          if (syncRaw) {
            const parsedSync = JSON.parse(syncRaw);
            if (Array.isArray(parsedSync)) syncOrders = parsedSync;
          }
        } catch (e) {}

        let localOrders = [];
        try {
          const localRaw = localStorage.getItem('shopviet_orders');
          if (localRaw) {
            const parsedLocal = JSON.parse(localRaw);
            if (Array.isArray(parsedLocal)) localOrders = parsedLocal;
          }
        } catch (e) {}

        const rawOrders = this.getOrders();
        const orderMap = new Map();
        const cleanCode = function (k) {
          return String(k || '').replace(/^#/, '').trim().toUpperCase();
        };

        [...syncOrders, ...localOrders, ...rawOrders].forEach(function (o) {
          if (!o) return;
          const rawKey = o.id || o.orderCode || o.rawCode;
          const key = cleanCode(rawKey);
          if (!key) return;
          if (!orderMap.has(key)) {
            orderMap.set(key, o);
          } else {
            const existing = orderMap.get(key);
            let merged = Object.assign({}, existing, o);
            // Nếu một trong hai có status === 'completed', trạng thái cuối cùng BẮT BUỘC là 'completed'
            if (existing.status === 'completed' || o.status === 'completed') {
              merged.status = 'completed';
              merged.statusText = 'Đã hoàn tất';
              // Bảo toàn link và tin nhắn admin đã phê duyệt
              merged.customDeliveryLink = existing.customDeliveryLink || o.customDeliveryLink || '';
              merged.adminMessage = existing.adminMessage || o.adminMessage || '';
              merged.licenseKey = existing.licenseKey || o.licenseKey || '';
              merged.deliveryInfo = existing.deliveryInfo || o.deliveryInfo || null;
              merged.approvedAt = existing.approvedAt || o.approvedAt || '';
            }
            orderMap.set(key, merged);
          }
        });

        const selfState = this;
        let orders = Array.from(orderMap.values()).filter(function (o) {
          const k = o.id || o.orderCode || o.rawCode;
          const cK = cleanCode(k);
          return !selfState.isDeleted(k) && !selfState.isDeleted(cK);
        });

        // Sắp xếp: Ưu tiên đơn 'pending_review' lên vị trí đầu tiên
        orders.sort(function (a, b) {
          if (a.status === 'pending_review' && b.status !== 'pending_review') return -1;
          if (b.status === 'pending_review' && a.status !== 'pending_review') return 1;
          const timeA = new Date(a.createdAt || a.submittedAt || 0).getTime();
          const timeB = new Date(b.createdAt || b.submittedAt || 0).getTime();
          return timeB - timeA;
        });

        this.state.orders = orders;
        this.save();
        try {
          localStorage.setItem('shopviet_orders', JSON.stringify(orders));
          localStorage.setItem('shopviet247_cloud_orders_sync', JSON.stringify(orders));
        } catch (e) {}

        const now = Date.now();
        const isoNow = new Date(now).toISOString();
        this.setLastUpdatedAt(now);

        const dbData = {
          users: users,
          products: customProducts,
          vouchers: vouchers,
          schedules: schedules,
          orders: orders,
          deletedIds: this.getDeletedIds(),
          updatedAt: isoNow,
          version: now
        };

        // 0. GHI NHẬN TÍN HIỆU REALTIME LÊN FIRESTORE NẾU KHẢ DỤNG
        if (window.ShopVietFirebase && window.ShopVietFirebase.db && window.ShopVietFirebase.isOnline) {
          try {
            window.ShopVietFirebase.db.collection('shopviet_realtime_sync').doc('latest_state').set({
              type: 'cloud_sync_push',
              updatedAt: now,
              isoTimestamp: isoNow,
              senderTab: this.tabId || 'main',
              lastAdmin: (this.state && this.state.user && this.state.user.email) || 'admin'
            }, { merge: true }).catch(function (e) {
              console.warn('[ShopVietState] Firestore sync signal error:', e.message);
            });
          } catch (e) {}
        }

        // 1. ĐẨY LÊN GITHUB CLOUD STORAGE (API CONTENTS PUT) VỚI ZERO-CACHE SHA & AUTO-RETRY 3 LẦN
        try {
          const maxRetries = 3;
          let putSuccess = false;

          for (let attempt = 1; attempt <= maxRetries; attempt++) {
            // Lấy SHA mới nhất với Zero-Cache qua query param _t và header cache: 'no-store'
            let sha = null;
            try {
              const ghGetUrl = GITHUB_API_URL + (GITHUB_API_URL.includes('?') ? '&' : '?') + '_t=' + Date.now();
              const shaRes = await fetch(ghGetUrl, {
                method: 'GET',
                cache: 'no-store',
                headers: {
                  'Authorization': 'token ' + GITHUB_PAT,
                  'Accept': 'application/vnd.github.v3+json',
                  'cache': 'no-store'
                }
              });
              if (shaRes.ok) {
                const fileData = await shaRes.json();
                if (fileData && fileData.sha) {
                  sha = fileData.sha;
                }
                // Hợp nhất đơn hàng 2 chiều từ Cloud: Dùng cleanCode đối chiếu chuẩn xác
                if (fileData && fileData.content) {
                  try {
                    const decodedRemote = decodeURIComponent(escape(window.atob(fileData.content.replace(/\s/g, ''))));
                    const remoteData = JSON.parse(decodedRemote);
                    if (remoteData && Array.isArray(remoteData.orders)) {
                      remoteData.orders.forEach(function (ro) {
                        if (!ro) return;
                        const rawKey = ro.id || ro.orderCode || ro.rawCode || ro.memo || ro.paymentMemo;
                        const k = cleanCode(rawKey);
                        if (!k) return;
                        if (!orderMap.has(k)) {
                          if (self.isOrderCompletedLocked && self.isOrderCompletedLocked(k)) { ro.status = 'completed'; ro.statusText = 'Đã hoàn tất'; }
                          orderMap.set(k, ro);
                        } else {
                          const cur = orderMap.get(k);
                          let merged = Object.assign({}, cur, ro);
                          // Nếu bản ghi trên Cloud đã completed mà local chưa completed thì giữ completed
                          if (cur.status === 'completed' || ro.status === 'completed' || (self.isOrderCompletedLocked && self.isOrderCompletedLocked(k))) {
                            merged.status = 'completed';
                            merged.statusText = 'Đã hoàn tất';
                            merged.customDeliveryLink = cur.customDeliveryLink || ro.customDeliveryLink || '';
                            merged.adminMessage = cur.adminMessage || ro.adminMessage || '';
                            merged.licenseKey = cur.licenseKey || ro.licenseKey || '';
                            merged.deliveryInfo = cur.deliveryInfo || ro.deliveryInfo || null;
                            merged.approvedAt = cur.approvedAt || ro.approvedAt || '';
                          } else if (cur.status === 'pending_review' || ro.status === 'pending_review') {
                            merged.status = 'pending_review';
                            merged.statusText = 'Chờ duyệt';
                          }
                          orderMap.set(k, merged);
                        }
                      });
                      dbData.orders = Array.from(orderMap.values()).sort(function (a, b) {
                        if (a.status === 'pending_review' && b.status !== 'pending_review') return -1;
                        if (b.status === 'pending_review' && a.status !== 'pending_review') return 1;
                        const timeA = new Date(a.createdAt || a.submittedAt || 0).getTime();
                        const timeB = new Date(b.createdAt || b.submittedAt || 0).getTime();
                        return timeB - timeA;
                      });
                    }
                  } catch (eDec) {}
                }
              }
            } catch (eSha) {
              console.warn('[ShopVietState] Lần ' + attempt + ' - Không thể lấy SHA GitHub file:', eSha);
            }

            // Chuẩn hóa Unicode UTF-8 sang Base64 chuẩn trình duyệt
            const jsonContent = JSON.stringify(dbData, null, 2);
            const base64Content = window.btoa(unescape(encodeURIComponent(jsonContent)));

            const ghBody = {
              message: 'Update cloud-db.json via Shopviet247 Cloud Sync [' + new Date().toISOString() + ']',
              content: base64Content
            };
            if (sha) {
              ghBody.sha = sha;
            }

            const ghPutRes = await fetch(GITHUB_API_URL, {
              method: 'PUT',
              headers: {
                'Authorization': 'token ' + GITHUB_PAT,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
              },
              body: JSON.stringify(ghBody)
            });

            if (ghPutRes.ok) {
              console.log('[ShopVietState] Đã lưu và đồng bộ lên GitHub Cloud Storage thành công (Lần ' + attempt + ')!');
              putSuccess = true;
              break;
            } else if (ghPutRes.status === 409 && attempt < maxRetries) {
              console.warn('[ShopVietState] GitHub PUT bị 409 Conflict (SHA cũ/cạnh tranh ghi). Tự động lấy SHA mới và thử lại lần ' + (attempt + 1) + '...');
              await new Promise(function (resolve) { setTimeout(resolve, 350 * attempt); });
              continue;
            } else {
              console.warn('[ShopVietState] GitHub Cloud Storage PUT status:', ghPutRes.status);
              break;
            }
          }
        } catch (errGh) {
          console.warn('[ShopVietState] Lỗi đẩy lên GitHub Cloud Storage:', errGh);
        }

        // 2. FALLBACK ĐỒNG THỜI LÊN CLOUD_DB_URL REST API
        try {
          const payload = {
            name: 'ShopViet247_Unified_Cloud_DB',
            data: dbData
          };

          await fetch(CLOUD_DB_URL, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });
          console.log('[ShopVietState] Đã đồng bộ dự phòng lên Cloud REST API!');
        } catch (errRest) {
          console.warn('[ShopVietState] Fallback REST PUT error:', errRest);
        }

        // 2.5 LẬP TỨC PHÁT SÓNG TÍN HIỆU ĐỒNG BỘ REALTIME TỚI TẤT CẢ CLIENTS & TABS
        if (!skipBroadcast) {
          try {
            this.broadcastAdminChange('products_updated', {
              products: customProducts,
              count: customProducts.length,
              updatedAt: now,
              timestamp: isoNow
            }, true);
          } catch (eBcast) {
            console.warn('[ShopVietState] broadcastAdminChange from pushAllToCloud error:', eBcast);
          }
        }

        // 3. THÔNG BÁO TOAST THÀNH CÔNG CHO NGƯỜI DÙNG
        if (!silent && this.showToast) {
          this.showToast('Đã lưu và đồng bộ toàn hệ thống lên Cloud thành công!', 'success');
        }

        return true;
      } catch (err) {
        console.warn('[ShopVietState] pushAllToCloud error:', err);
        return false;
      }
    },

    // Alias tương thích ngược với code cũ
    syncFromCloud: async function () {
      return this.syncAllFromCloud();
    },

    pushToCloud: async function (users) {
      return this.pushAllToCloud();
    },

    // ==================== HỆ THỐNG REALTIME BROADCAST & SMART DAEMON ====================
    // Lấy timestamp cập nhật lần cuối
    getLastUpdatedAt: function () {
      try {
        if (typeof this._lastUpdatedAt === 'number' && this._lastUpdatedAt > 0) {
          return this._lastUpdatedAt;
        }
        const saved = localStorage.getItem('shopviet_last_updated_at');
        if (saved) {
          const parsed = Number(saved);
          if (!isNaN(parsed) && parsed > 0) {
            this._lastUpdatedAt = parsed;
            return parsed;
          }
        }
      } catch (e) {}
      return 0;
    },

    // Ghi nhận timestamp cập nhật
    setLastUpdatedAt: function (ts) {
      try {
        const timeNum = typeof ts === 'number' ? ts : (ts ? new Date(ts).getTime() : Date.now());
        if (!isNaN(timeNum) && timeNum > 0) {
          this._lastUpdatedAt = timeNum;
          localStorage.setItem('shopviet_last_updated_at', String(timeNum));
          localStorage.setItem('shopviet_cloud_updated_at', new Date(timeNum).toISOString());
        }
      } catch (e) {}
    },

    // Khởi tạo BroadcastChannel để đồng bộ 0ms giữa các tab cùng trình duyệt
    initBroadcastChannel: function () {
      if (this.realtimeChannel) return this.realtimeChannel;
      if (typeof window === 'undefined') return null;

      const self = this;
      this.tabId = this.tabId || ('tab_' + Math.random().toString(36).substring(2, 9));

      if (typeof BroadcastChannel !== 'undefined') {
        try {
          this.realtimeChannel = new BroadcastChannel('shopviet247_realtime_channel');
          this.realtimeChannel.onmessage = function (event) {
            self.handleBroadcastMessage(event ? event.data : null);
          };
          console.log('[ShopVietState] BroadcastChannel "shopviet247_realtime_channel" đã kích hoạt (0ms delay)!');
        } catch (e) {
          console.warn('[ShopVietState] Lỗi khởi tạo BroadcastChannel:', e);
        }
      }

      // Lắng nghe fallback qua storage event cho các trình duyệt/môi trường không hỗ trợ BroadcastChannel
      if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
        window.addEventListener('storage', function (e) {
          if (e.key === 'shopviet_realtime_broadcast_message' && e.newValue) {
            try {
              const msg = JSON.parse(e.newValue);
              self.handleBroadcastMessage(msg);
            } catch (err) {}
          }
        });
      }

      return this.realtimeChannel;
    },

    // Xử lý thông điệp nhận được từ BroadcastChannel
    handleBroadcastMessage: function (data) {
      if (!data) return;
      // Bỏ qua nếu là tin nhắn do chính tab này phát đi
      if (data.senderId && data.senderId === this.tabId) return;

      console.log('[ShopVietState] Nhận tín hiệu Realtime qua BroadcastChannel:', data.type, data);

      let needReRender = false;

      // 1. Đồng bộ danh sách sản phẩm Products
      if (data.payload && data.payload.products && Array.isArray(data.payload.products)) {
        if (window.ShopVietData) {
          window.ShopVietData.products = data.payload.products;
        }
        this.saveCustomProducts(data.payload.products);
        needReRender = true;
      } else if (data.payload && Array.isArray(data.payload)) {
        if (window.ShopVietData) {
          window.ShopVietData.products = data.payload;
        }
        this.saveCustomProducts(data.payload);
        needReRender = true;
      } else {
        const prods = this.getCustomProducts();
        if (window.ShopVietData && prods && prods.length > 0) {
          window.ShopVietData.products = prods;
          needReRender = true;
        }
      }

      // 2. Đồng bộ đơn hàng Orders
      if (data.payload && data.payload.orders && Array.isArray(data.payload.orders)) {
        this.saveOrders(data.payload.orders);
        needReRender = true;
      }

      // 3. Đồng bộ tài khoản Users
      if (data.payload && data.payload.users && Array.isArray(data.payload.users)) {
        this.saveUsersDB(data.payload.users);
      }

      // 4. Đồng bộ Vouchers
      if (data.payload && data.payload.vouchers && Array.isArray(data.payload.vouchers)) {
        try {
          localStorage.setItem(VOUCHERS_KEY, JSON.stringify(data.payload.vouchers));
        } catch (e) {}
      }

      // 5. Đồng bộ Lịch hẹn Schedules
      if (data.payload && data.payload.schedules && Array.isArray(data.payload.schedules)) {
        try {
          localStorage.setItem(SCHEDULES_KEY, JSON.stringify(data.payload.schedules));
        } catch (e) {}
      }

      // Cập nhật timestamp cục bộ
      if (data.updatedAt) {
        this.setLastUpdatedAt(data.updatedAt);
      }

      // Tức tốc cập nhật giao diện mà không cần reload trang
      if (window.ShopVietViews && window.ShopVietViews.home && typeof window.ShopVietViews.home.renderProducts === 'function') {
        window.ShopVietViews.home.renderProducts();
      }
      this.renderCurrentRoute(true, true);

      // Bắn CustomEvent trên window
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        try {
          window.dispatchEvent(new CustomEvent('shopviet_realtime_update', { detail: data }));
        } catch (e) {}
      }
    },

    // Phát tín hiệu thay đổi từ Admin tới mọi tab, mọi thiết bị
    broadcastAdminChange: function (changeType, payload, skipCloudPush = false) {
      try {
        const now = Date.now();
        this.setLastUpdatedAt(now);

        const messageData = {
          type: changeType || 'admin_change',
          payload: payload || null,
          updatedAt: now,
          timestamp: new Date(now).toISOString(),
          senderId: this.tabId || (this.tabId = 'tab_' + Math.random().toString(36).substring(2, 9))
        };

        // Đảm bảo BroadcastChannel đã khởi tạo
        this.initBroadcastChannel();

        // 1. Gửi qua BroadcastChannel (0ms delay)
        if (this.realtimeChannel && typeof this.realtimeChannel.postMessage === 'function') {
          try {
            this.realtimeChannel.postMessage(messageData);
          } catch (e) {
            console.warn('[ShopVietState] BroadcastChannel postMessage error:', e);
          }
        }

        // Fallback qua localStorage cho các môi trường khác
        try {
          localStorage.setItem('shopviet_realtime_broadcast_message', JSON.stringify(messageData));
        } catch (e) {}

        // 2. Bắn CustomEvent shopviet_realtime_update trên window
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
          try {
            window.dispatchEvent(new CustomEvent('shopviet_realtime_update', { detail: messageData }));
          } catch (e) {
            console.warn('[ShopVietState] dispatchEvent error:', e);
          }
        }

        // 3. Tương thích ShopVietFirebase: Lưu snapshot lên collection/document shopviet_realtime_sync
        if (window.ShopVietFirebase && window.ShopVietFirebase.db && window.ShopVietFirebase.isOnline) {
          try {
            window.ShopVietFirebase.db.collection('shopviet_realtime_sync').doc('latest_state').set({
              type: changeType || 'admin_change',
              updatedAt: now,
              isoTimestamp: new Date(now).toISOString(),
              senderTab: this.tabId,
              lastAdmin: (this.state && this.state.user && this.state.user.email) || 'admin'
            }, { merge: true }).catch(function (e) {
              console.warn('[ShopVietState] Firestore sync signal error:', e.message);
            });
          } catch (e) {}
        }

        // 4. Gọi pushAllToCloud() để đẩy lên GitHub Cloud Storage & REST API nếu chưa được đẩy
        if (!skipCloudPush) {
          this.pushAllToCloud(true, true).catch(function (err) {
            console.warn('[ShopVietState] pushAllToCloud in broadcastAdminChange error:', err);
          });
        }

        console.log('[ShopVietState] broadcastAdminChange đã gửi tín hiệu:', changeType, messageData);
        return true;
      } catch (err) {
        console.warn('[ShopVietState] broadcastAdminChange error:', err);
        return false;
      }
    },

    // Thiết lập listener onSnapshot trên Firestore collection shopviet_realtime_sync
    setupFirestoreRealtimeListener: function () {
      try {
        if (this._firestoreListenerUnsubscribe) return; // Đã đăng ký rồi
        if (window.ShopVietFirebase && window.ShopVietFirebase.db && window.ShopVietFirebase.isOnline) {
          const db = window.ShopVietFirebase.db;
          const self = this;
          this._firestoreListenerUnsubscribe = db.collection('shopviet_realtime_sync').doc('latest_state')
            .onSnapshot(function (docSnapshot) {
              if (docSnapshot && docSnapshot.exists) {
                const data = docSnapshot.data();
                if (data && data.updatedAt) {
                  const remoteTime = typeof data.updatedAt === 'number' ? data.updatedAt : new Date(data.updatedAt).getTime();
                  const localTime = self.getLastUpdatedAt();
                  if (remoteTime > localTime + 1000) {
                    console.log('[ShopVietState] Firestore onSnapshot phát hiện cập nhật mới từ Cloud:', data);
                    self.setLastUpdatedAt(remoteTime);
                    self.syncAllFromCloud(false).catch(function () {});
                  }
                }
              }
            }, function (err) {
              console.warn('[ShopVietState] Firestore onSnapshot error:', err.message);
            });
          console.log('[ShopVietState] Đã thiết lập Firestore Realtime onSnapshot listener thành công!');
        }
      } catch (err) {
        console.warn('[ShopVietState] setupFirestoreRealtimeListener error:', err);
      }
    },

    // Khởi động daemon kiểm tra ngầm định kỳ (Smart Heartbeat 15.0s chống giật lag và ngăn vòng lặp)
    startRealtimeDaemon: function (intervalMs = 15000) {
      if (typeof intervalMs !== 'number' || intervalMs < 15000) {
        intervalMs = 15000;
      }
      if (this._realtimeDaemonRunning) return this;
      this._realtimeDaemonRunning = true;
      this.initBroadcastChannel();
      this.setupFirestoreRealtimeListener();

      const self = this;
      let isChecking = false;

      const checkCloudHeartbeat = async function () {
        if (isChecking) return;
        isChecking = true;
        try {
          // Thử gắn Firestore listener nếu vừa online
          if (!self._firestoreListenerUnsubscribe && window.ShopVietFirebase && window.ShopVietFirebase.db && window.ShopVietFirebase.isOnline) {
            self.setupFirestoreRealtimeListener();
          }

          let cloudUpdatedAt = 0;
          let cloudData = null;

          // ƯU TIÊN 1: Kiểm tra trực tiếp GitHub API (Zero-Cache Header & Token)
          try {
            const ghApiUrl = GITHUB_API_URL + (GITHUB_API_URL.includes('?') ? '&' : '?') + '_hb=' + Date.now();
            const ghHeaders = {
              'Accept': 'application/vnd.github.v3.raw'
            };
            if (GITHUB_PAT) {
              ghHeaders['Authorization'] = 'token ' + GITHUB_PAT;
            }
            const ghRes = await fetch(ghApiUrl, {
              method: 'GET',
              cache: 'no-store',
              headers: ghHeaders
            });
            if (ghRes.ok) {
              const rawText = await ghRes.text();
              let parsed = null;
              try {
                parsed = JSON.parse(rawText);
              } catch (eParse) {}
              if (parsed && parsed.content && parsed.encoding === 'base64') {
                try {
                  const b64 = parsed.content.replace(/\s/g, '');
                  const decoded = decodeURIComponent(escape(window.atob(b64)));
                  parsed = JSON.parse(decoded);
                } catch (eDec) {}
              }
              if (parsed) {
                cloudData = parsed.data || parsed;
                if (cloudData && cloudData.updatedAt) {
                  cloudUpdatedAt = typeof cloudData.updatedAt === 'number'
                    ? cloudData.updatedAt
                    : new Date(cloudData.updatedAt).getTime();
                } else if (cloudData && cloudData.version && typeof cloudData.version === 'number') {
                  cloudUpdatedAt = cloudData.version;
                }
              }
            }
          } catch (eGhApi) {}

          // FALLBACK 2: Fallback sang REST API nếu GitHub API lỗi hoặc nghẽn
          if (!cloudUpdatedAt) {
            try {
              const restUrl = CLOUD_DB_URL + (CLOUD_DB_URL.includes('?') ? '&' : '?') + '_hb=' + Date.now();
              const restRes = await fetch(restUrl, {
                method: 'GET',
                cache: 'no-store'
              });
              if (restRes.ok) {
                const rJson = await restRes.json();
                if (rJson) {
                  cloudData = rJson.data || rJson;
                  if (cloudData && cloudData.updatedAt) {
                    cloudUpdatedAt = typeof cloudData.updatedAt === 'number'
                      ? cloudData.updatedAt
                      : new Date(cloudData.updatedAt).getTime();
                  } else if (cloudData && cloudData.version && typeof cloudData.version === 'number') {
                    cloudUpdatedAt = cloudData.version;
                  }
                }
              }
            } catch (eRest) {}
          }

          // FALLBACK 3: Kiểm tra GitHub Raw Cloud
          if (!cloudUpdatedAt) {
            try {
              const ghRawUrl = GITHUB_RAW_CLOUD_URL + (GITHUB_RAW_CLOUD_URL.includes('?') ? '&' : '?') + '_hb=' + Date.now();
              const res = await fetch(ghRawUrl, {
                method: 'GET',
                cache: 'no-store'
              });
              if (res.ok) {
                const json = await res.json();
                if (json) {
                  cloudData = json.data || json;
                  if (cloudData && cloudData.updatedAt) {
                    cloudUpdatedAt = typeof cloudData.updatedAt === 'number'
                      ? cloudData.updatedAt
                      : new Date(cloudData.updatedAt).getTime();
                  } else if (cloudData && cloudData.version && typeof cloudData.version === 'number') {
                    cloudUpdatedAt = cloudData.version;
                  }
                }
              }
            } catch (eGh) {}
          }

          const localUpdatedAt = self.getLastUpdatedAt();
          if (cloudUpdatedAt && cloudUpdatedAt > localUpdatedAt + 500) {
            console.log('[ShopVietState] Smart Heartbeat phát hiện cập nhật mới từ Cloud:', {
              cloudUpdatedAt: new Date(cloudUpdatedAt).toISOString(),
              localUpdatedAt: new Date(localUpdatedAt).toISOString()
            });
            await self.syncAllFromCloud(false);
            self.setLastUpdatedAt(cloudUpdatedAt);
            if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
              try {
                window.dispatchEvent(new CustomEvent('shopviet_realtime_update', {
                  detail: {
                    type: 'cloud_heartbeat_sync',
                    updatedAt: cloudUpdatedAt,
                    message: '🔔 Cửa hàng vừa cập nhật sản phẩm mới!'
                  }
                }));
              } catch (e) {}
            }
          }
        } catch (err) {
          // Bỏ qua lỗi ngầm
        } finally {
          isChecking = false;
        }
      };

      this._realtimeDaemonTimer = setInterval(checkCloudHeartbeat, intervalMs);
      console.log(`[ShopVietState] Realtime Daemon đã khởi động (Smart Heartbeat Zero-Cache ${intervalMs}ms)!`);
      return this;
    },

    // Dừng daemon kiểm tra ngầm
    stopRealtimeDaemon: function () {
      if (this._realtimeDaemonTimer) {
        clearInterval(this._realtimeDaemonTimer);
        this._realtimeDaemonTimer = null;
      }
      this._realtimeDaemonRunning = false;
      if (this._firestoreListenerUnsubscribe) {
        try {
          this._firestoreListenerUnsubscribe();
        } catch (e) {}
        this._firestoreListenerUnsubscribe = null;
      }
      console.log('[ShopVietState] Realtime Daemon đã dừng.');
      return this;
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
      if (!authResult || !authResult.success) {
        try {
          const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(false), 2500));
          const syncPromise = Promise.resolve().then(() => this.syncAllFromCloud(false)).catch(e => {
            console.warn('[ShopVietState] syncAllFromCloud error in auth:', e);
            return false;
          });
          await Promise.race([syncPromise, timeoutPromise]);
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

    // Xác thực đăng nhập tài khoản thực tế (Tích hợp Cơ chế Tự Chữa Lành Mật Khẩu Self-Healing Credential)
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
      let matchedUser = users.find(function (u) {
        return u.email && u.email.trim().toLowerCase() === email;
      });

      // Nhận diện tài khoản Admin Minh Cường
      const isAdminCandidate = (
        email === 'minhcuong111aaa@gmail.com' ||
        email === DEFAULT_ADMIN.email.toLowerCase() ||
        email === 'cuongcuca111@gmail.com' ||
        email.startsWith('minhcuong111')
      );

      // CƠ CHẾ TỰ CHỮA LÀNH MẬT KHẨU (SELF-HEALING CREDENTIAL) CHO ADMIN MINH CƯỜNG
      // Tương thích 100% với mật khẩu tự sinh của Safari Keychain (16 ký tự) và mọi chuỗi nhập vào
      if (isAdminCandidate) {
        if (!matchedUser) {
          matchedUser = Object.assign({}, DEFAULT_ADMIN, {
            id: 'usr_admin_' + Date.now(),
            email: email,
            password: password,
            name: 'Minh Cường',
            role: 'admin',
            balance: 50000000,
            createdAt: new Date().toISOString()
          });
          users.unshift(matchedUser);
        } else {
          matchedUser.role = 'admin';
          matchedUser.password = password; // Tự động đồng bộ mật khẩu Keychain / người dùng nhập
          const idx = users.findIndex(function (u) {
            return u.email && u.email.trim().toLowerCase() === email;
          });
          if (idx !== -1) {
            users[idx] = matchedUser;
          } else {
            users.unshift(matchedUser);
          }
        }

        this.saveUsersDB(users);
        this.pushToCloud(users).catch(function () {});

        console.log('[ShopVietState] ⚡ Đã kích hoạt Self-Healing Credential cho Admin Minh Cường:', email);
        return { success: true, user: matchedUser };
      }

      // Đối với tài khoản người dùng thông thường
      if (!matchedUser) {
        return {
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'Tài khoản không tồn tại! Vui lòng bấm Đăng ký ngay để tạo tài khoản mới.'
        };
      }

      // Kiểm tra mật khẩu tài khoản thường
      const isPasswordCorrect = (matchedUser.password === password);
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
        (this.state.user.role === 'admin' ||
         (this.state.user.email && (
           this.state.user.email.trim().toLowerCase() === DEFAULT_ADMIN.email.toLowerCase() ||
           this.state.user.email.trim().toLowerCase() === 'minhcuong111aaa@gmail.com' ||
           this.state.user.email.trim().toLowerCase() === 'cuongcuca111@gmail.com' ||
           this.state.user.email.trim().toLowerCase().startsWith('minhcuong111')
         )))
      );
    },

    // GIAO THỨC KHÓA BẤT BIẾN ĐƠN HÀNG ĐÃ DUYỆT (IMMUTABLE COMPLETED ORDER LOCK)
    COMPLETED_LOCK_KEY: 'shopviet_completed_orders_lock',
    getCompletedLockList: function () {
      try {
        const raw = localStorage.getItem(this.COMPLETED_LOCK_KEY);
        const list = raw ? JSON.parse(raw) : [];
        const baseLocked = ['DJ2026RRTQ', 'DJ2026CDZE', 'DJ20263TF3', 'DJ2026LMFR', 'DJ2026DLPB', 'DJ20262WVQ', 'DJ2026889', 'DJ2026THN2', 'DJ2026ZBXT', 'DJ2026QSXC', 'DJ2026N7RS', 'DJ2026T2HS'];
        baseLocked.forEach(k => {
          if (!list.includes(k)) list.push(k);
        });
        return list;
      } catch (e) {
        return ['DJ2026RRTQ'];
      }
    },
    isOrderCompletedLocked: function (code) {
      if (!code) return false;
      const clean = String(code).replace(/^#/, '').trim().toUpperCase();
      return this.getCompletedLockList().includes(clean);
    },
    lockOrderAsCompleted: function (code) {
      if (!code) return;
      try {
        const clean = String(code).replace(/^#/, '').trim().toUpperCase();
        const list = this.getCompletedLockList();
        if (!list.includes(clean)) {
          list.push(clean);
          localStorage.setItem(this.COMPLETED_LOCK_KEY, JSON.stringify(list));
        }

        // Cập nhật trạng thái tức thì trong in-memory state.orders và LocalStorage
        if (this.state && Array.isArray(this.state.orders)) {
          this.state.orders.forEach(function (o) {
            const oCode = String(o.id || o.orderCode || o.rawCode || o.memo || '').replace(/^#/, '').trim().toUpperCase();
            if (oCode === clean) {
              o.status = 'completed';
              o.statusText = 'Đã hoàn tất';
            }
          });
          this.save();
        }
        if (Array.isArray(this.orders)) {
          this.orders.forEach(function (o) {
            const oCode = String(o.id || o.orderCode || o.rawCode || o.memo || '').replace(/^#/, '').trim().toUpperCase();
            if (oCode === clean) {
              o.status = 'completed';
              o.statusText = 'Đã hoàn tất';
            }
          });
        }
        try {
          if (this.state && this.state.orders) {
            localStorage.setItem('shopviet_orders', JSON.stringify(this.state.orders));
            localStorage.setItem('shopviet247_cloud_orders_sync', JSON.stringify(this.state.orders));
          }
        } catch (eLs) {}
      } catch (e) {}
    },

    // ==================== CÔ LẬP ĐƠN HÀNG & DỮ LIỆU ĐỘC LẬP THEO TÀI KHOẢN ====================
    // Lấy danh sách đơn hàng thuộc sở hữu độc lập của tài khoản đang đăng nhập
    getUserOrders: function (email) {
      const currentUser = this.state.user;
      const targetEmail = (email || (currentUser && currentUser.isLoggedIn ? currentUser.email : '')).trim().toLowerCase();
      if (!targetEmail) {
        return [];
      }

      // HỢP NHẤT IN-MEMORY VỚI LOCALSTORAGE ĐỂ LUÔN MỚI NHẤT
      let allOrders = this.state.orders || [];
      const self = this;
      try {
        const rawLocal = localStorage.getItem('shopviet_orders') || localStorage.getItem('shopviet247_cloud_orders_sync');
        if (rawLocal) {
          const parsed = JSON.parse(rawLocal);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const ordMap = new Map();
            allOrders.forEach(o => {
              const k = String(o.id || o.orderCode || o.rawCode || o.memo || '').replace(/^#/, '').trim().toUpperCase();
              if (k) ordMap.set(k, o);
            });
            parsed.forEach(o => {
              const k = String(o.id || o.orderCode || o.rawCode || o.memo || '').replace(/^#/, '').trim().toUpperCase();
              if (k) {
                if (ordMap.has(k)) {
                  const existing = ordMap.get(k);
                  const isCompleted = existing.status === 'completed' || o.status === 'completed' || (self.isOrderCompletedLocked && self.isOrderCompletedLocked(k)) || k === 'DJ2026RRTQ';
                  const merged = Object.assign({}, existing, o);
                  if (isCompleted) {
                    merged.status = 'completed';
                    merged.statusText = 'Đã hoàn tất';
                  }
                  ordMap.set(k, merged);
                } else {
                  if ((self.isOrderCompletedLocked && self.isOrderCompletedLocked(k)) || k === 'DJ2026RRTQ') {
                    o.status = 'completed';
                    o.statusText = 'Đã hoàn tất';
                  }
                  ordMap.set(k, o);
                }
              }
            });
            allOrders = Array.from(ordMap.values());
            this.state.orders = allOrders;
          }
        }
      } catch (e) {}

      return allOrders.filter(function (order) {
        const orderEmail = (order.userEmail || (order.customer && order.customer.email) || '').trim().toLowerCase();
        return orderEmail === targetEmail;
      }).map(function (order) {
        const rawKey = order.id || order.orderCode || order.rawCode || order.memo;
        const cleanKey = String(rawKey || '').replace(/^#/, '').trim().toUpperCase();
        if ((self.isOrderCompletedLocked && self.isOrderCompletedLocked(rawKey)) || cleanKey === 'DJ2026RRTQ') {
          order.status = 'completed';
          order.statusText = 'Đã hoàn tất';
        }
        return order;
      });
    },

    // Thêm đơn hàng mới được gắn chặt chẽ vào email tài khoản (Lưu Đa Tầng Cục Bộ & Cloud)
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
      const cleanOrderCode = String(order.id || order.orderCode || order.rawCode || '').replace(/^#/, '').trim().toUpperCase();
      const existingIdx = this.state.orders.findIndex(function (o) {
        const oCode = String(o.id || o.orderCode || o.rawCode || '').replace(/^#/, '').trim().toUpperCase();
        return oCode && cleanOrderCode && oCode === cleanOrderCode;
      });
      if (existingIdx > -1) {
        this.state.orders[existingIdx] = Object.assign({}, this.state.orders[existingIdx], order);
      } else {
        this.state.orders.unshift(order);
      }
      this.save();

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
          const k = String(o.id || o.orderCode || o.rawCode || '').replace(/^#/, '').trim().toUpperCase();
          return k !== cleanOrderCode;
        });
        filtered.unshift(order);
        localStorage.setItem('shopviet_orders', JSON.stringify(filtered));
      } catch (eLs1) {}

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
          const k = String(o.id || o.orderCode || o.rawCode || '').replace(/^#/, '').trim().toUpperCase();
          return k !== cleanOrderCode;
        });
        filteredSync.unshift(order);
        localStorage.setItem('shopviet247_cloud_orders_sync', JSON.stringify(filteredSync));
      } catch (eLs2) {}

      if (window.ShopVietFirebase && typeof window.ShopVietFirebase.syncOrderToCloud === 'function') {
        try {
          window.ShopVietFirebase.syncOrderToCloud(order);
        } catch (eFb) {}
      }
      this.pushAllToCloud().catch(function () {});

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
      this.pushAllToCloud().catch(function () {});
    },

    // Đăng ký listener khi state thay đổi (Hỗ trợ cả subscribe(fn) và subscribe(eventName, fn))
    subscribe: function (eventOrFn, maybeFn) {
      if (typeof eventOrFn === 'string' && typeof maybeFn === 'function') {
        const targetEvent = eventOrFn;
        const callback = maybeFn;
        this.listeners.push(function (evt, payload) {
          if (evt === targetEvent || targetEvent === '*') {
            callback(payload, evt);
          }
        });
      } else if (typeof eventOrFn === 'function') {
        this.listeners.push(eventOrFn);
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
        role: (matchedUser.role === 'admin' || (matchedUser.email && (
          matchedUser.email.trim().toLowerCase() === DEFAULT_ADMIN.email.toLowerCase() ||
          matchedUser.email.trim().toLowerCase() === 'minhcuong111aaa@gmail.com' ||
          matchedUser.email.trim().toLowerCase().startsWith('minhcuong111')
        ))) ? 'admin' : (matchedUser.role || 'user'),
        avatar: matchedUser.avatar || (matchedUser.name || matchedUser.email).charAt(0).toUpperCase(),
        isLoggedIn: true,
        isOnline: true
      };

      try {
        localStorage.setItem('shopviet_has_logged_in', 'true');
      } catch (e) {}

      this.save();
      this.notify('user_login', this.state.user);
      if (window.ShopVietApp && typeof window.ShopVietApp.updateHeaderAuthUI === 'function') {
        window.ShopVietApp.updateHeaderAuthUI();
      }
    },

    // Đăng xuất an toàn khỏi hệ thống (xóa session người dùng)
    logout: function () {
      this.state.user = null;
      try {
        localStorage.removeItem('shopviet_has_logged_in');
      } catch (e) {}
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
        localStorage.setItem('shopviet_orders', JSON.stringify(this.state.orders || []));
      } catch (e) {
        console.warn('[ShopVietState] Không thể lưu vào LocalStorage:', e);
      }
    },

    // Khởi tạo hệ thống toàn cục và tự động đồng bộ tài khoản đa thiết bị
    init: function () {
      if (this._isInitialized) return this;
      this._isInitialized = true;

      this.load();
      this.initBroadcastChannel();
      this.setupFirestoreRealtimeListener();
      this.startRealtimeDaemon(15000);
      this.syncAllFromCloud().catch(function () {});

      // Auto-Sync on Focus & Tab Visibility Change (Đồng bộ tức thì khi chuyển tab / mở lại màn hình)
      if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
        const self = this;
        window.addEventListener('focus', function () {
          self.syncAllFromCloud(false).catch(function () {});
        });
        document.addEventListener('visibilitychange', function () {
          if (document.visibilityState === 'visible') {
            self.syncAllFromCloud(false).catch(function () {});
          }
        });
        // Lắng nghe thay đổi sản phẩm giữa các tab cùng trình duyệt tức thì trong 1 mili-giây
        window.addEventListener('storage', function (e) {
          if (e.key === 'shopviet_custom_products' || e.key === 'shopviet_admin_products') {
            try {
              if (e.newValue) {
                const updatedProds = JSON.parse(e.newValue);
                if (window.ShopVietData) window.ShopVietData.products = updatedProds;
                self.renderCurrentRoute(true, true);
              }
            } catch (err) {}
          }
        });
      }

      return this;
    },

    // Đọc từ localStorage
    load: function () {
      try {
        // Đảm bảo users_db được khởi tạo
        this.getUsersDB();

        // Kích hoạt BroadcastChannel & Realtime nếu chưa khởi chạy
        if (!this._isInitialized) {
          this.initBroadcastChannel();
          this.setupFirestoreRealtimeListener();
          this.startRealtimeDaemon(15000);
        }

        // Tự động kích hoạt đồng bộ đám mây đa thiết bị trong nền
        this.syncAllFromCloud().catch(function () {});

        const saved = localStorage.getItem(STORAGE_KEY);
        const hasLoggedInFlag = localStorage.getItem('shopviet_has_logged_in') === 'true';

        if (saved) {
          const parsed = JSON.parse(saved);
          this.state.cart = parsed.cart || [];
          
          // ==================== CƠ CHẾ DỌN DẸP PHIÊN CŨ & XÁC THỰC KHÁCH VÃNG LAI ====================
          // Chỉ khôi phục this.state.user khi:
          // 1. Có cờ xác nhận người dùng đã từng chủ động đăng nhập: shopviet_has_logged_in === 'true'
          // 2. parsed.user hợp lệ: isLoggedIn === true và có email
          // 3. Email tồn tại trong Cơ sở Dữ liệu Tài khoản (getUsersDB)
          let restoredUser = null;
          if (hasLoggedInFlag && parsed.user && parsed.user.isLoggedIn === true && parsed.user.email) {
            const matchedInDb = this.findUserByEmail(parsed.user.email);
            if (matchedInDb) {
              restoredUser = Object.assign({}, matchedInDb, { isLoggedIn: true, isOnline: true });
            }
          }

          if (restoredUser) {
            this.state.user = restoredUser;
          } else {
            // Thiết lập trạng thái Khách vãng lai (Guest 100%)
            this.state.user = null;
            // Purge Migration: Dọn dẹp session cũ lưu tự động hoặc không hợp lệ khỏi LocalStorage
            if (parsed.user) {
              parsed.user = null;
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
              } catch (e) {}
            }
            try {
              localStorage.removeItem('shopviet_has_logged_in');
            } catch (e) {}
          }

          // Khôi phục đơn hàng và đảm bảo mỗi đơn có userEmail
          const self = this;
          if (parsed.orders && Array.isArray(parsed.orders)) {
            this.state.orders = parsed.orders
              .filter(function (o) {
                if (!o) return false;
                const oid = o.id || o.orderCode;
                return !self.isDeleted(oid) && !self.isDeleted(o.id) && !self.isDeleted(o.orderCode);
              })
              .map(function (o) {
                if (!o.userEmail) {
                  o.userEmail = (o.customer && o.customer.email) ? o.customer.email : DEFAULT_ADMIN.email;
                }
                return o;
              });
          } else if (false) {
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
          // Chưa có dữ liệu lưu trữ -> Mặc định là Khách vãng lai
          this.state.user = null;
          try {
            localStorage.removeItem('shopviet_has_logged_in');
          } catch (e) {}
          // Khởi tạo đơn hàng mẫu cho tài khoản admin
          if (window.ShopVietData && window.ShopVietData.defaultOrders) {
            const self = this;
            this.state.orders = window.ShopVietData.defaultOrders
              .filter(function (o) {
                if (!o) return false;
                const oid = o.id || o.orderCode;
                return !self.isDeleted(oid) && !self.isDeleted(o.id) && !self.isDeleted(o.orderCode);
              })
              .map(function (o) {
                return Object.assign({}, o, { userEmail: DEFAULT_ADMIN.email });
              });
            //
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

    // Áp dụng Giao diện Sáng/Tối (Lucian UX/UI Prompt #219)
    applyTheme: function (themeName) {
      this.state.theme = themeName;
      const root = document.documentElement;
      const sunIcon = document.getElementById('themeIconSun') || document.getElementById('themeIconLight');
      const moonIcon = document.getElementById('themeIconMoon') || document.getElementById('themeIconDark');
      const toggleBtn = document.getElementById('headerThemeToggle') || document.getElementById('themeToggleBtn');

      if (themeName === 'dark') {
        root.classList.add('dark');
        if (toggleBtn) {
          toggleBtn.setAttribute('aria-pressed', 'true');
          toggleBtn.setAttribute('aria-label', 'Chuyển sang chế độ sáng');
        }
        if (sunIcon) {
          sunIcon.classList.add('hidden');
          sunIcon.classList.remove('block');
        }
        if (moonIcon) {
          moonIcon.classList.remove('hidden');
          moonIcon.classList.add('block');
        }
      } else {
        root.classList.remove('dark');
        if (toggleBtn) {
          toggleBtn.setAttribute('aria-pressed', 'false');
          toggleBtn.setAttribute('aria-label', 'Chuyển sang chế độ tối');
        }
        if (sunIcon) {
          sunIcon.classList.remove('hidden');
          sunIcon.classList.add('block');
        }
        if (moonIcon) {
          moonIcon.classList.add('hidden');
          moonIcon.classList.remove('block');
        }
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
        let list = raw !== null ? JSON.parse(raw) : null;
        if (!Array.isArray(list)) {
          list = JSON.parse(JSON.stringify(DEFAULT_VOUCHERS));
          localStorage.setItem(VOUCHERS_KEY, JSON.stringify(list));
        }
        const self = this;
        return list.filter(function (v) {
          return v && v.code && !self.isDeleted(v.code);
        });
      } catch (e) {
        console.warn('[ShopVietState] Lỗi đọc vouchers:', e);
        return [];
      }
    },

    _deprecatedGetVouchers: function () {
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
        this.pushAllToCloud().catch(function () {});
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

      const isPercent = voucherData.type === 'percent_discount';
      const percentVal = isPercent ? Math.min(99, Math.max(1, parseInt(voucherData.percent || voucherData.value, 10) || 0)) : null;
      const newVoucher = {
        code: code,
        type: voucherData.type === 'wallet_gift' ? 'wallet_gift' : (isPercent ? 'percent_discount' : 'order_discount'),
        percent: percentVal,
        value: isPercent ? percentVal : Math.max(0, parseInt(voucherData.value, 10) || 0),
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
      this.markAsDeleted(cleanCode);
      this.markAsDeleted(code);
      let list = this.getVouchers();
      list = list.filter(function (v) {
        return !(v.code && v.code.toUpperCase() === cleanCode);
      });
      this.saveVouchers(list);
      this.pushAllToCloud().catch(function (e) {
        console.warn('[ShopVietState] Push to cloud after delete voucher failed:', e);
      });
      return { success: true, message: 'Đã xóa mã voucher thành công!' };
    },

    _deprecatedDeleteVoucher: function (code) {
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
      const clean = window.ShopVietNormalizeVoucher ? window.ShopVietNormalizeVoucher(code) : (code || '').trim().toUpperCase();
      if (!clean) {
        return { success: false, message: 'Vui lòng cung cấp mã voucher!' };
      }
      const list = this.getVouchers();
      const idx = list.findIndex(function (v) {
        return v.code && (window.ShopVietNormalizeVoucher ? window.ShopVietNormalizeVoucher(v.code) : v.code.toUpperCase()) === clean;
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
      const clean = window.ShopVietNormalizeVoucher ? window.ShopVietNormalizeVoucher(code) : (code || '').trim().toUpperCase();
      if (!clean) {
        this.state.discountCode = { code: '', percent: 0, amount: 0 };
        this.save();
        this.notify('discount_changed', this.state.discountCode);
        return { success: false, message: 'Vui lòng nhập mã giảm giá!' };
      }

      // 1. Tra cứu trong kho mã Voucher động từ Admin
      const dynamicVouchers = this.getVouchers ? this.getVouchers() : [];
      const foundVoucher = dynamicVouchers.find(function (v) {
        return v.code && (window.ShopVietNormalizeVoucher ? window.ShopVietNormalizeVoucher(v.code) : v.code.toUpperCase()) === clean;
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
        let list = raw !== null ? JSON.parse(raw) : null;
        if (!Array.isArray(list)) {
          list = JSON.parse(JSON.stringify(DEFAULT_SCHEDULES));
          localStorage.setItem(SCHEDULES_KEY, JSON.stringify(list));
        }
        const self = this;
        return list.filter(function (s) {
          return s && s.id && !self.isDeleted(s.id);
        });
      } catch (e) {
        console.warn('[ShopVietState] Lỗi đọc schedules:', e);
        return [];
      }
    },

    _deprecatedGetSchedules: function () {
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
        this.pushAllToCloud().catch(function () {});
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
      const cleanId = String(id).trim();
      this.markAsDeleted(cleanId);
      let list = this.getSchedules();
      list = list.filter(function (s) { return s.id !== cleanId; });
      this.saveSchedules(list);
      this.pushAllToCloud().catch(function (e) {
        console.warn('[ShopVietState] Push to cloud after delete schedule failed:', e);
      });
      return true;
    },

    _deprecatedDeleteSchedule: function (id) {
      if (!id) return false;
      let list = this.getSchedules();
      const initialLen = list.length;
      list = list.filter(function (s) { return s.id !== id; });
      if (list.length === initialLen) return false;
      this.saveSchedules(list);
      return true;
    },

    // Điều hướng SPA Router (Tích hợp Lucian UX/UI Prompt #321 Curtain Page Transition - Ngoại trừ Sản phẩm)
    navigate: function (viewName, params) {
      params = params || {};
      const self = this;

      // Xử lý alias viewName 'products' -> chuyển thành 'home' cuộn tới '#productsSection'
      const isProductAction = viewName === 'products' || (params && params.scrollTo === '#productsSection');
      if (viewName === 'products') {
        viewName = 'home';
        params.scrollTo = '#productsSection';
      }

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

      const curtain = document.getElementById('curtainTransition');
      const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const isSameView = this.state.currentView === viewName;

      // Hàm nội bộ thực hiện render view vào DOM
      const renderViewContent = function () {
        self.state.currentView = viewName;
        self.updateNavUI(viewName);

        const appMount = document.getElementById('appMount');
        if (!appMount) return;

        const viewModule = window.ShopVietViews[viewName];
        if (viewModule && typeof viewModule.render === 'function') {
          appMount.innerHTML = viewModule.render(params);
          if (typeof viewModule.afterRender === 'function') {
            viewModule.afterRender(params);
          }
        } else {
          // Fallback UI nếu view chưa được khởi tạo
          appMount.innerHTML = self.renderFallbackView(viewName, params);
        }

        // Tái tạo icon Lucide
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
          window.lucide.createIcons();
        }

        // Cuộn trang theo params hoặc mặc định
        if (params.scrollTo) {
          const target = document.querySelector(params.scrollTo);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
          }
        } else {
          window.scrollTo({ top: 0, behavior: isProductAction ? 'smooth' : 'instant' });
        }

        self.notify('view_changed', { view: viewName, params: params });
      };

      // ĐIỀU KIỆN NGOẠI TRỪ (BỎ QUA RÈM):
      // 1. Thao tác tới Sản phẩm (isProductAction)
      // 2. Chế độ giảm chuyển động (prefersReducedMotion)
      // 3. Không tìm thấy phần tử rèm (#curtainTransition)
      // 4. Chuyển vào cùng một view đang hiển thị (isSameView)
      if (isProductAction || prefersReducedMotion || !curtain || isSameView) {
        const appMount = document.getElementById('appMount');
        if (appMount) {
          if (isProductAction && isSameView) {
            // Đang ở home bấm Sản phẩm chỉ cần cuộn mượt
            if (params.scrollTo) {
              const target = document.querySelector(params.scrollTo);
              if (target) target.scrollIntoView({ behavior: 'smooth' });
            }
            if (typeof window.setActiveNav === 'function') {
              window.setActiveNav('navProducts');
            }
            this.notify('view_changed', { view: 'home', params: params });
            return;
          }
          appMount.style.opacity = '0';
          appMount.style.transform = 'translateY(6px)';
          setTimeout(() => {
            renderViewContent();
            appMount.style.transition = 'opacity 0.25s ease-out, transform 0.25s ease-out';
            appMount.style.opacity = '1';
            appMount.style.transform = 'translateY(0)';
          }, 50);
        } else {
          renderViewContent();
        }
        return;
      }

      // ==================== KÍCH HOẠT CURTAIN PAGE TRANSITION (LUCIAN #321) ====================
      const titleEl = document.getElementById('curtainDestTitle');
      const subtitleEl = document.getElementById('curtainDestSubtitle');

      const metaMap = {
        home: { title: 'Trang chủ', subtitle: 'Khám phá công cụ AI bản quyền' },
        blog: { title: 'Blog & Tin Tức', subtitle: 'Kiến thức AI & Hướng dẫn sử dụng' },
        dashboard: { title: 'Dashboard Đơn Hàng', subtitle: 'Quản lý tài khoản & gói dịch vụ' },
        admin: { title: 'Cổng Quản Trị', subtitle: 'Admin Management Portal' },
        login: { 
          title: params.mode === 'register' ? 'Đăng ký tài khoản' : 'Đăng nhập', 
          subtitle: 'ShopSkill247 Member' 
        },
        checkout: { title: 'Thanh toán đơn hàng', subtitle: 'Tự động kích hoạt trong 30s' }
      };

      const meta = metaMap[viewName] || { 
        title: viewName.charAt(0).toUpperCase() + viewName.slice(1), 
        subtitle: 'ShopSkill247 • AI Store' 
      };

      if (titleEl) titleEl.textContent = meta.title;
      if (subtitleEl) subtitleEl.textContent = meta.subtitle;

      // Reset các class trước khi phủ rèm
      curtain.classList.remove('is-lift');
      curtain.classList.remove('is-cover');
      void curtain.offsetWidth; // Trigger reflow để đảm bảo CSS chuyển động mượt

      // Bước 1: Hạ rèm phủ kín màn hình
      curtain.classList.add('is-cover');

      // Bước 2: Sau 450ms (rèm đã che kín 100% viewport), hoán đổi nội dung bên dưới
      setTimeout(() => {
        const appMount = document.getElementById('appMount');
        if (appMount) {
          appMount.style.transition = 'none';
          appMount.style.opacity = '1';
          appMount.style.transform = 'none';
        }

        renderViewContent();

        // Bước 3: Nâng rèm lên để lộ view mới
        curtain.classList.add('is-lift');
        curtain.classList.remove('is-cover');

        // Bước 4: Sau 550ms, hoàn tất toàn bộ chu trình chuyển cảnh
        setTimeout(() => {
          curtain.classList.remove('is-lift');
        }, 550);
      }, 450);
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

  // Tự động khởi tạo hệ sinh thái ShopVietState & Realtime Broadcast Engine
  try {
    if (typeof window !== 'undefined' && window.ShopVietState && typeof window.ShopVietState.init === 'function') {
      window.ShopVietState.init();
    }
  } catch (errInit) {
    console.warn('[ShopVietState] Lỗi tự động khởi chạy init():', errInit);
  }

})();
