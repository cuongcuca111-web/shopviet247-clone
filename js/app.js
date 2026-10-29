/**
 * Shopviet247 - Main Application Entrypoint
 * Thiết lập các Event Listener, khởi tạo Header, phím tắt và Router
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  console.log('[Shopviet247] Khởi tạo Shell ứng dụng SaaS Clean...');

  // 1. Nạp trạng thái từ LocalStorage & Khởi động Theme
  const state = window.ShopVietState.load();

  // 2. Lắng nghe các nút trên Header
  setupHeaderEvents();

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
  });

  console.log('[Shopviet247] Ứng dụng đã sẵn sàng hoạt động!');
});

/**
 * Thiết lập các sự kiện trên Header
 */
function setupHeaderEvents() {
  const brandLogoLink = document.getElementById('brandLogoLink');
  const navHome = document.getElementById('navHome');
  const navProducts = document.getElementById('navProducts');
  const navBlog = document.getElementById('navBlog');
  const navSupport = document.getElementById('navSupport');
  const searchTriggerBtn = document.getElementById('searchTriggerBtn');
  const cartBtn = document.getElementById('cartBtn');
  const langToggleBtn = document.getElementById('langToggleBtn');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const dashboardBtn = document.getElementById('dashboardBtn');

  // Click Logo -> Về Home
  if (brandLogoLink) {
    brandLogoLink.addEventListener('click', function (e) {
      e.preventDefault();
      window.ShopVietState.navigate('home');
    });
  }

  // Click "Trang chủ"
  if (navHome) {
    navHome.addEventListener('click', function (e) {
      e.preventDefault();
      window.ShopVietState.navigate('home');
    });
  }

  // Click "Sản phẩm" -> Cuộn tới danh mục sản phẩm
  if (navProducts) {
    navProducts.addEventListener('click', function (e) {
      e.preventDefault();
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
      window.ShopVietState.showToast('Chuyên mục Tin tức & Thủ thuật AI đang được biên soạn!', 'info');
    });
  }

  // Click "Liên hệ & Hỗ trợ"
  if (navSupport) {
    navSupport.addEventListener('click', function (e) {
      e.preventDefault();
      window.ShopVietState.showToast('CSKH Zalo 24/7: 0987.654.321 | Hỗ trợ kích hoạt siêu tốc', 'info');
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
}

/**
 * Thiết lập phím tắt
 */
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', function (e) {
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
  }
};
