/**
 * Shopviet247 - Main Application Entrypoint
 * Thiết lập các Event Listener, khởi tạo Header, phím tắt và Router
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  console.log('[Shopviet247] Khởi tạo Shell ứng dụng SaaS Clean...');

  // 1. Nạp trạng thái từ LocalStorage & Khởi động Theme
  const state = window.ShopVietState.load();

  // 2. Lắng nghe các nút trên Header & Render trạng thái Auth Dynamic
  setupHeaderEvents();
  updateHeaderAuthUI();

  // 3. Lắng nghe phím tắt toàn cục (Ctrl+K, Esc)
  setupKeyboardShortcuts();

  // 4. Kích hoạt Router tại view ban đầu
  const initialView = state.currentView || 'home';
  window.ShopVietState.navigate(initialView);

  // 5. Khởi tạo Icons Lucide
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }

  // 6. Đăng ký state subscription để đồng bộ UI
  window.ShopVietState.subscribe(function (event, payload) {
    if (event === 'cart_updated') {
      window.ShopVietState.updateCartBadge();
    }
    if (event === 'user_login' || event === 'user_logout' || event === 'view_changed') {
      updateHeaderAuthUI();
    }
    if (event === 'view_changed' && payload) {
      if (payload.view === 'blog') {
        setActiveNav('navBlog');
      } else if (payload.view === 'home') {
        if (payload.params && payload.params.scrollTo === '#productsSection') {
          setActiveNav('navProducts');
        } else {
          setActiveNav('navHome');
        }
      } else {
        setActiveNav(null);
      }
    }
  });

  console.log('[Shopviet247] Ứng dụng đã sẵn sàng hoạt động!');
});

/**
 * Quản lý trạng thái Active Tab dạng Viên Thuốc Đen (Floating Pill)
 * @param {string|null} activeId - 'navHome' | 'navProducts' | 'navBlog' | 'navSupport'
 */
function setActiveNav(activeId) {
  const navIds = ['navHome', 'navProducts', 'navBlog', 'navSupport'];
  const activeClasses = ['bg-slate-900', 'text-white', 'shadow-sm', 'dark:bg-white', 'dark:text-slate-900'];
  const inactiveClasses = ['text-slate-600', 'dark:text-slate-300', 'hover:text-slate-900', 'dark:hover:text-white', 'hover:bg-slate-200/60', 'dark:hover:bg-slate-800/60'];

  navIds.forEach(function (id) {
    const btn = document.getElementById(id);
    if (!btn) return;

    if (id === activeId) {
      inactiveClasses.forEach(function (cls) { btn.classList.remove(cls); });
      activeClasses.forEach(function (cls) { btn.classList.add(cls); });
    } else {
      activeClasses.forEach(function (cls) { btn.classList.remove(cls); });
      inactiveClasses.forEach(function (cls) { btn.classList.add(cls); });
    }
  });
}
window.setActiveNav = setActiveNav;

/**
 * Thiết lập các sự kiện trên Header
 */
function setupHeaderEvents() {
  const brandLogoLink = document.getElementById('brandLogoLink');
  const navHome = document.getElementById('navHome');
  const navProducts = document.getElementById('navProducts');
  const navBlog = document.getElementById('navBlog');
  const navSupport = document.getElementById('navSupport');
  const searchTriggerBtn = document.getElementById('header-search-btn') || document.getElementById('searchTriggerBtn');
  const cartBtn = document.getElementById('cartBtn');
  const langToggleBtn = document.getElementById('header-lang-btn') || document.getElementById('langToggleBtn');
  const themeToggleBtn = document.getElementById('headerThemeToggle') || document.getElementById('themeToggleBtn');
  const dashboardBtn = document.getElementById('header-dashboard-link') || document.getElementById('dashboardBtn');

  // Click Logo -> Về Home
  if (brandLogoLink) {
    brandLogoLink.addEventListener('click', function (e) {
      e.preventDefault();
      setActiveNav('navHome');
      window.ShopVietState.navigate('home');
    });
  }

  // Click "Trang chủ"
  if (navHome) {
    navHome.addEventListener('click', function (e) {
      e.preventDefault();
      setActiveNav('navHome');
      window.ShopVietState.navigate('home');
    });
  }

  // Click "Sản phẩm" -> Cuộn tới danh mục sản phẩm
  if (navProducts) {
    navProducts.addEventListener('click', function (e) {
      e.preventDefault();
      setActiveNav('navProducts');
      if (window.ShopVietState.state.currentView !== 'home') {
        window.ShopVietState.navigate('home', { scrollTo: '#productsSection' });
      } else {
        const sec = document.getElementById('productsSection');
        if (sec) sec.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // Click "Blog"
  if (navBlog) {
    navBlog.addEventListener('click', function (e) {
      e.preventDefault();
      setActiveNav('navBlog');
      window.ShopVietState.navigate('blog');
    });
  }

  // Click "Liên hệ & Hỗ trợ" -> Mở trực tiếp Zalo CSKH 0868668809
  if (navSupport) {
    navSupport.addEventListener('click', function (e) {
      e.preventDefault();
      setActiveNav('navSupport');
      window.open('https://zalo.me/0868668809', '_blank');
    });
  }

  // Click Tìm kiếm
  if (searchTriggerBtn) {
    searchTriggerBtn.addEventListener('click', function (e) {
      e.preventDefault();
      triggerQuickSearch();
    });
  }

  // Click Giỏ hàng -> Mở trang Checkout
  if (cartBtn) {
    cartBtn.addEventListener('click', function (e) {
      e.preventDefault();
      window.ShopVietState.navigate('checkout');
    });
  }

  // Click Đổi ngôn ngữ
  if (langToggleBtn) {
    langToggleBtn.addEventListener('click', function (e) {
      e.preventDefault();
      window.ShopVietState.toggleLang();
    });
  }

  // Click Đổi Theme Sáng / Tối
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', function (e) {
      e.preventDefault();
      window.ShopVietState.toggleTheme();
    });
  }

  // Click Dashboard
  if (dashboardBtn) {
    dashboardBtn.addEventListener('click', function (e) {
      e.preventDefault();
      window.ShopVietState.navigate('dashboard');
    });
  }

  // Click Cổng Quản Trị Bí Mật (Header & Footer) - Phân quyền chỉ minhcuong111aaa@gmail.com
  const adminPortalHeaderBtn = document.getElementById('adminPortalHeaderBtn');
  const adminPortalFooterBtn = document.getElementById('adminPortalFooterBtn');
  
  function handleAdminClick(e) {
    e.preventDefault();
    const isAdmin = window.ShopVietState && typeof window.ShopVietState.isAdmin === 'function'
      ? window.ShopVietState.isAdmin()
      : false;
    if (!isAdmin) {
      if (window.ShopVietState && typeof window.ShopVietState.showToast === 'function') {
        window.ShopVietState.showToast('Truy cập bị từ chối: Cổng quản trị chỉ dành riêng cho tài khoản minhcuong111aaa@gmail.com!', 'error');
      }
      return;
    }
    if (window.ShopVietViews && window.ShopVietViews.admin) {
      window.ShopVietViews.admin.open();
    }
  }

  if (adminPortalHeaderBtn) {
    adminPortalHeaderBtn.addEventListener('click', handleAdminClick);
  }
  if (adminPortalFooterBtn) {
    adminPortalFooterBtn.addEventListener('click', handleAdminClick);
  }
}

/**
 * Thiết lập phím tắt
 */
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', function (e) {
    // Ctrl + Shift + A hoặc Cmd + Shift + A -> Mở Portal Admin Bí Mật (Bảo mật: Chỉ minhcuong111aaa@gmail.com)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      const isAdmin = window.ShopVietState && typeof window.ShopVietState.isAdmin === 'function'
        ? window.ShopVietState.isAdmin()
        : false;
      if (!isAdmin) {
        if (window.ShopVietState && typeof window.ShopVietState.showToast === 'function') {
          window.ShopVietState.showToast('Truy cập bị từ chối: Cổng quản trị chỉ dành riêng cho tài khoản minhcuong111aaa@gmail.com!', 'error');
        }
        return;
      }
      if (window.ShopVietViews && window.ShopVietViews.admin) {
        window.ShopVietViews.admin.open();
      }
      return;
    }

    // Ctrl + K hoặc Cmd + K -> Mở tìm kiếm
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      triggerQuickSearch();
    }

    // Phím Escape -> Đóng modal nếu đang mở
    if (e.key === 'Escape') {
      const modalMount = document.getElementById('modalMount');
      if (modalMount && modalMount.innerHTML.trim() !== '') {
        modalMount.innerHTML = '';
      }
      const adminMount = document.getElementById('adminMount');
      if (adminMount && adminMount.innerHTML.trim() !== '') {
        adminMount.innerHTML = '';
      }
    }
  });
}

/**
 * Mở hộp tìm kiếm nhanh
 */
function triggerQuickSearch() {
  const modalMount = document.getElementById('modalMount');
  if (!modalMount) return;

  modalMount.innerHTML = `
    <div id="quickSearchBackdrop" class="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-start justify-center pt-20 px-4 animate-fade-in" onclick="if(event.target === this) this.parentElement.innerHTML = ''">
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-slide-up">
        
        <!-- Search Input Bar -->
        <div class="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input 
            type="text" 
            id="searchInputBox" 
            placeholder="Tìm kiếm công cụ AI, Cursor, Gemini, ChatGPT..." 
            class="flex-1 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none text-base"
            autocomplete="off"
            autofocus
          >
          <span class="text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded-lg">ESC để thoát</span>
        </div>

        <!-- Quick Tags -->
        <div class="p-4 bg-slate-50/50 dark:bg-slate-950/50 flex flex-wrap gap-2 text-xs">
          <span class="text-slate-400 self-center font-medium mr-1">Gợi ý hot:</span>
          <button class="search-tag-chip px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-medium hover:bg-indigo-100 transition">Gemini 18T</button>
          <button class="search-tag-chip px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-medium hover:bg-indigo-100 transition">Cursor Pro</button>
          <button class="search-tag-chip px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-medium hover:bg-indigo-100 transition">ChatGPT Plus</button>
          <button class="search-tag-chip px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-medium hover:bg-indigo-100 transition">API Sonnet</button>
        </div>

        <!-- Search Results List -->
        <div id="searchResultsContainer" class="max-h-80 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/60">
          <div class="p-6 text-center text-slate-400 text-sm">
            Nhập tên công cụ bạn muốn tìm kiếm...
          </div>
        </div>

      </div>
    </div>
  `;

  const input = document.getElementById('searchInputBox');
  const resultsContainer = document.getElementById('searchResultsContainer');
  const tagChips = document.querySelectorAll('.search-tag-chip');

  if (input) {
    input.focus();
    input.addEventListener('input', function (e) {
      renderSearchResults(e.target.value.trim(), resultsContainer);
    });
  }

  tagChips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      if (input) {
        input.value = chip.textContent;
        renderSearchResults(chip.textContent, resultsContainer);
      }
    });
  });
}

/**
 * Hiển thị kết quả tìm kiếm tức thì
 */
function renderSearchResults(keyword, container) {
  if (!container) return;
  if (!keyword) {
    container.innerHTML = '<div class="p-6 text-center text-slate-400 text-sm">Nhập tên công cụ bạn muốn tìm kiếm...</div>';
    return;
  }

  const prods = window.ShopVietData ? window.ShopVietData.products : [];
  const lower = keyword.toLowerCase();
  const matched = prods.filter(function (p) {
    return p.name.toLowerCase().includes(lower) || p.desc.toLowerCase().includes(lower) || p.tag.toLowerCase().includes(lower);
  });

  if (matched.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center text-slate-400 space-y-2">
        <p class="text-sm">Không tìm thấy sản phẩm nào khớp với "<strong>${keyword}</strong>"</p>
        <p class="text-xs text-slate-500">Thử tìm với từ khóa: Cursor, Gemini, Claude, Canva, Capcut...</p>
      </div>
    `;
    return;
  }

  container.innerHTML = matched.map(function (p) {
    return `
      <div class="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition group" onclick="ShopVietApp.selectSearchedProduct('${p.id}')">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center p-2 shrink-0">
            ${window.ShopVietData ? window.ShopVietData.getBrandIcon(p.iconType) : ''}
          </div>
          <div>
            <h5 class="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">${p.name}</h5>
            <span class="text-xs text-slate-500">${p.tag} • Còn ${p.stock} slot</span>
          </div>
        </div>
        <div class="text-right shrink-0">
          <span class="text-sm font-bold text-indigo-600 dark:text-indigo-400">${window.ShopVietState.formatCurrency(p.price)}</span>
        </div>
      </div>
    `;
  }).join('');
}

// Namespace phương thức bổ trợ toàn cục
window.ShopVietApp = {
  selectSearchedProduct: function (productId) {
    const modalMount = document.getElementById('modalMount');
    if (modalMount) modalMount.innerHTML = '';

    if (window.ShopVietViews && window.ShopVietViews.modal && typeof window.ShopVietViews.modal.openQuickBuy === 'function') {
      window.ShopVietViews.modal.openQuickBuy(productId);
    } else {
      window.ShopVietState.addToCart(productId, 1);
      window.ShopVietState.navigate('checkout');
    }
  },
  updateHeaderAuthUI: updateHeaderAuthUI
};

/**
 * Cập nhật Header Dynamic Profile / Đăng nhập theo trạng thái thực tế của người dùng
 */
function updateHeaderAuthUI() {
  const container = document.getElementById('headerAuthContainer');
  if (!container) return;

  const user = window.ShopVietState.state.user;
  const isLoggedIn = user && user.isLoggedIn === true;
  const isAdminUser = Boolean(window.ShopVietState && typeof window.ShopVietState.isAdmin === 'function' && window.ShopVietState.isAdmin());

  // Cập nhật ẩn/hiển thị cổng Portal Admin trên Header và Footer (Chỉ minhcuong111aaa@gmail.com)
  const adminHeaderBtn = document.getElementById('adminPortalHeaderBtn');
  if (adminHeaderBtn) {
    if (isAdminUser) {
      adminHeaderBtn.classList.remove('hidden');
    } else {
      adminHeaderBtn.classList.add('hidden');
    }
  }
  const adminFooterBtn = document.getElementById('adminPortalFooterBtn');
  if (adminFooterBtn) {
    if (isAdminUser) {
      adminFooterBtn.classList.remove('hidden');
    } else {
      adminFooterBtn.classList.add('hidden');
    }
  }

  if (!isLoggedIn) {
    // ==================== TRẠNG THÁI 1: CHƯA ĐĂNG NHẬP ====================
    // Nút "Đăng nhập" nền đen bo góc tròn chuẩn SaaS
    container.innerHTML = `
      <button id="headerLoginBtn" type="button" class="bg-slate-900 hover:bg-slate-800 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded-xl px-4 py-2 flex items-center gap-2 text-xs sm:text-sm font-semibold shadow-sm transition-all duration-200 cursor-pointer active:scale-95 select-none">
        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>
        </svg>
        <span>Đăng nhập</span>
      </button>
    `;

    const loginBtn = document.getElementById('headerLoginBtn');
    if (loginBtn) {
      loginBtn.addEventListener('click', function (e) {
        e.preventDefault();
        window.ShopVietState.navigate('login');
      });
    }
  } else {
    // ==================== TRẠNG THÁI 2: ĐÃ ĐĂNG NHẬP ====================
    // Avatar tròn mang ký tự đầu (Chữ "C" nền xanh Indigo như Ảnh 1) + Tên người dùng + Nút Dashboard / Dropdown Menu
    const displayName = user.name || 'Minh Cường';
    const email = user.email || 'minhcuong.dev@gmail.com';
    const avatarChar = (user.avatar && user.avatar.length <= 2) ? user.avatar : displayName.charAt(0).toUpperCase();

    container.innerHTML = `
      <div class="relative flex items-center gap-2">
        <!-- Nút User Profile Badge (Click mở Dropdown) -->
        <button id="headerUserMenuBtn" type="button" class="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all cursor-pointer group shadow-2xs">
          <!-- Avatar tròn chữ cái đầu (VD: C hoặc VH) -->
          <div class="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs ring-2 ring-white/50 dark:ring-slate-800">
            ${avatarChar}
          </div>
          <!-- Tên người dùng -->
          <span class="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 max-w-[90px] sm:max-w-[130px] truncate select-none">
            ${displayName}
          </span>
          <!-- Mũi tên Dropdown -->
          <svg id="userMenuChevron" class="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6"/>
          </svg>
        </button>

        <!-- Dropdown Menu Tài Khoản Thông Minh -->
        <div id="headerUserDropdown" class="hidden absolute right-0 top-full mt-2 w-60 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl py-2 z-50 animate-slide-up">
          
          <!-- Thông tin User tóm tắt -->
          <div class="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800/80">
            <div class="flex items-center gap-2 mb-1">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Firebase Cloud Synced</span>
            </div>
            <p class="text-xs font-bold text-slate-900 dark:text-white truncate">${displayName}</p>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 truncate">${email}</p>
          </div>

          <!-- Các chức năng Menu -->
          <div class="py-1 text-xs">
            <button id="dropdownProfileBtn" type="button" class="w-full px-4 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2.5 transition-colors cursor-pointer">
              <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span>Trang cá nhân</span>
            </button>

            <button id="dropdownOrdersBtn" type="button" class="w-full px-4 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2.5 transition-colors cursor-pointer">
              <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                <path d="M3 6h18"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              <span>Đơn hàng của tôi</span>
            </button>

            ${isAdminUser ? `
            <button id="dropdownAdminBtn" type="button" class="w-full px-4 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2.5 transition-colors cursor-pointer">
              <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
              <span>Portal Admin</span>
            </button>
            ` : ''}
          </div>

          <!-- Đăng xuất -->
          <div class="pt-1 border-t border-slate-100 dark:border-slate-800/80">
            <button id="dropdownLogoutBtn" type="button" class="w-full px-4 py-2 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 font-medium transition-colors cursor-pointer">
              <svg class="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" x2="9" y1="12" y2="12"/>
              </svg>
              <span>Đăng xuất</span>
            </button>
          </div>

        </div>
      </div>
    `;

    // Gắn sự kiện các nút
    const userMenuBtn = document.getElementById('headerUserMenuBtn');
    const userDropdown = document.getElementById('headerUserDropdown');
    const chevron = document.getElementById('userMenuChevron');
    const quickDashboardBtn = document.getElementById('headerDashboardQuickBtn');

    if (userMenuBtn && userDropdown) {
      userMenuBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        const isHidden = userDropdown.classList.contains('hidden');
        if (isHidden) {
          userDropdown.classList.remove('hidden');
          if (chevron) chevron.style.transform = 'rotate(180deg)';
        } else {
          userDropdown.classList.add('hidden');
          if (chevron) chevron.style.transform = 'rotate(0deg)';
        }
      });
    }

    if (quickDashboardBtn) {
      quickDashboardBtn.addEventListener('click', function (e) {
        e.preventDefault();
        window.ShopVietState.navigate('dashboard');
      });
    }

    // Các mục bên trong Dropdown
    const profileBtn = document.getElementById('dropdownProfileBtn');
    const ordersBtn = document.getElementById('dropdownOrdersBtn');
    const adminBtn = document.getElementById('dropdownAdminBtn');
    const logoutBtn = document.getElementById('dropdownLogoutBtn');

    if (profileBtn) {
      profileBtn.addEventListener('click', function () {
        if (userDropdown) userDropdown.classList.add('hidden');
        window.ShopVietState.navigate('dashboard', { tab: 'profile' });
      });
    }

    if (ordersBtn) {
      ordersBtn.addEventListener('click', function () {
        if (userDropdown) userDropdown.classList.add('hidden');
        window.ShopVietState.navigate('dashboard', { tab: 'orders' });
      });
    }

    if (adminBtn) {
      adminBtn.addEventListener('click', function () {
        if (userDropdown) userDropdown.classList.add('hidden');
        if (window.ShopVietViews && window.ShopVietViews.admin) {
          window.ShopVietState.navigate('admin');
        } else {
          window.ShopVietState.navigate('dashboard', { tab: 'overview' });
        }
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        if (userDropdown) userDropdown.classList.add('hidden');
        window.ShopVietState.logout();
      });
    }

    // Lắng nghe click ngoài document để đóng dropdown
    document.addEventListener('click', function (e) {
      if (userDropdown && !userDropdown.classList.contains('hidden')) {
        if (!container.contains(e.target)) {
          userDropdown.classList.add('hidden');
          if (chevron) chevron.style.transform = 'rotate(0deg)';
        }
      }
    });
  }

  // Tái tạo icon nếu có
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}
