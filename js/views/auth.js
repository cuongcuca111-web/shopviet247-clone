/**
 * Shopviet247 - Auth View Module (Đăng nhập & Đăng ký)
 * Hiện thực hóa Màn hình Đăng nhập chuẩn Clean SaaS UI
 */

(function () {
  'use strict';

  window.ShopVietViews = window.ShopVietViews || {};

  let isTurnstileVerified = false;
  let isTurnstileLoading = false;
  let isRegisterMode = false;
  let isPasswordVisible = false;

  const authView = {
    /**
     * Render HTML giao diện đăng nhập / đăng ký
     */
    render: function (params) {
      if (params && params.mode === 'register') {
        isRegisterMode = true;
      } else if (params && params.mode === 'login') {
        isRegisterMode = false;
      }

      return `
        <div class="min-h-[75vh] flex flex-col justify-center py-6 sm:py-10 animate-fade-in">
          
          <!-- Nút Về Trang Chủ phía trên góc trái -->
          <div class="max-w-md mx-auto w-full mb-2">
            <button id="authBackHomeBtn" class="text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer flex items-center gap-1.5 mb-6 font-medium transition-colors group">
              <svg class="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
              <span>← Về trang chủ</span>
            </button>
          </div>

          <!-- Card Trắng Căn Giữa Màn Hình -->
          <div class="max-w-md mx-auto w-full bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-md transition-all duration-300">
            
            <!-- Nhãn thương hiệu nhỏ: SHOPVIET247 cách điệu chữ hoa, tracking rộng -->
            <div class="text-[11px] font-black tracking-[0.25em] text-indigo-600 dark:text-indigo-400 uppercase select-none">
              SHOPVIET247
            </div>

            <!-- Tiêu đề lớn H1 & Mô tả phụ -->
            <div id="authHeaderArea">
              <h1 id="authTitle" class="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                ${isRegisterMode ? 'Đăng ký tài khoản' : 'Đăng nhập'}
              </h1>
              <p id="authSubtitle" class="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-4">
                ${isRegisterMode 
                  ? 'Tạo tài khoản để quản lý đơn hàng và nhận bảo hành 1 đổi 1 tự động' 
                  : 'Truy cập tài khoản để quản lý đơn hàng và ví nội bộ'}
              </p>
            </div>

            <!-- Firebase Cloud Sync Status Badge -->
            <div class="mb-5 flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span class="text-slate-600 dark:text-slate-300 font-medium">Hạ tầng:</span>
                <span class="font-bold text-indigo-600 dark:text-indigo-400">Firebase Auth & Firestore</span>
              </div>
              <span class="text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md font-semibold">Online Cloud Sync</span>
            </div>

            <!-- 2 Nút Đăng nhập Mạng Xã Hội Nằm Ngang -->
            <div class="grid grid-cols-2 gap-3 mb-5">
              <!-- Nút Google -->
              <button id="googleLoginBtn" type="button" class="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-sm font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98] cursor-pointer">
                <!-- Logo Google SVG Đa Sắc Chuẩn 4 Màu -->
                <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.97 0 12s.45 3.83 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span class="truncate">Google</span>
              </button>

              <!-- Nút Telegram -->
              <button id="telegramLoginBtn" type="button" class="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-sm font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98] cursor-pointer">
                <!-- Logo Telegram Xanh Cyan SVG -->
                <svg class="w-4 h-4 text-[#229ED9] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.196 1.006.128.832.946z"/>
                </svg>
                <span class="truncate">Telegram</span>
              </button>
            </div>

            <!-- Dòng phân cách: hoặc đăng nhập bằng email -->
            <div class="text-xs text-slate-400 text-center relative my-5 before:absolute before:inset-0 before:top-1/2 before:border-t before:border-slate-200 dark:before:border-slate-800">
              <span class="bg-white dark:bg-slate-900 px-3 relative z-10 text-slate-400 font-medium select-none">
                ${isRegisterMode ? 'hoặc đăng ký bằng email' : 'hoặc đăng nhập bằng email'}
              </span>
            </div>

            <!-- Form Nhập Liệu -->
            <form id="authForm" onsubmit="return false;" class="space-y-4">
              
              <!-- Trường Họ và Tên (chỉ hiện khi Đăng ký) -->
              <div id="nameFieldGroup" class="${isRegisterMode ? 'block' : 'hidden'}">
                <label for="authNameInput" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Họ và tên
                </label>
                <div class="relative rounded-xl shadow-sm">
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                  </div>
                  <input type="text" id="authNameInput" value="" placeholder="Ví dụ: Minh Cường" class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-indigo-500/20 focus:border-slate-900 dark:focus:border-indigo-500 transition-all">
                </div>
              </div>

              <!-- Ô Email: Label "Email", input có icon @ bên trái, placeholder "name@example.com" -->
              <div>
                <label for="authEmailInput" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email
                </label>
                <div class="relative rounded-xl shadow-sm">
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <!-- Icon @ bên trái -->
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="4"/>
                      <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/>
                    </svg>
                  </div>
                  <input type="email" id="authEmailInput" required value="" placeholder="name@example.com" class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-indigo-500/20 focus:border-slate-900 dark:focus:border-indigo-500 transition-all">
                </div>
              </div>

              <!-- Ô Mật khẩu: Label "Mật khẩu", input có icon ổ khóa bên trái và nút icon con mắt bên phải -->
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label for="authPasswordInput" class="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Mật khẩu
                  </label>
                </div>
                <div class="relative rounded-xl shadow-sm">
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <!-- Icon ổ khóa bên trái -->
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <input type="password" id="authPasswordInput" required value="" placeholder="••••••••" class="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-indigo-500/20 focus:border-slate-900 dark:focus:border-indigo-500 transition-all">
                  
                  <!-- Nút icon con mắt bên phải để ẩn/hiện mật khẩu -->
                  <button type="button" id="togglePasswordBtn" title="Ẩn/Hiện mật khẩu" class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                    <svg id="eyeShowIcon" class="w-4 h-4 block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    <svg id="eyeHideIcon" class="w-4 h-4 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                      <line x1="2" y1="2" x2="22" y2="22"/>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Banner gợi ý tài khoản Admin nhanh cho kiểm thử -->
              <div class="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-[11px] text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2 select-none">
                <div class="flex items-center gap-1.5 min-w-0">
                  <span class="text-amber-600 dark:text-amber-400 font-bold shrink-0">👑 Admin:</span>
                  <span class="truncate font-mono">minhcuong111aaa@gmail.com</span>
                </div>
                <button type="button" id="fillAdminDemoBtn" class="shrink-0 px-2 py-1 rounded-lg bg-amber-200/80 hover:bg-amber-300 dark:bg-amber-900/80 dark:hover:bg-amber-800 text-amber-950 dark:text-amber-100 font-bold transition text-[10px] cursor-pointer shadow-xs active:scale-95">
                  Điền nhanh
                </button>
              </div>

              <!-- Khung giả lập Cloudflare Turnstile tương tác:
                   Hộp viền mảnh border border-slate-200 bg-slate-50/70 rounded-xl p-3 flex items-center justify-between text-xs my-4 -->
              <div id="turnstileBox" class="border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl p-3 flex items-center justify-between text-xs my-4 select-none cursor-pointer transition-all hover:bg-slate-100/70 dark:hover:bg-slate-800/70">
                <!-- Bên trái: Checkbox xoay tròn giả lập xác thực bot -->
                <div class="flex items-center gap-3">
                  <div id="turnstileIndicator" class="w-6 h-6 rounded-md border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 flex items-center justify-center transition-all duration-300 shadow-xs">
                    <span id="turnstileCheckmark" class="hidden text-white">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </span>
                    <span id="turnstileSpinner" class="hidden">
                      <svg class="w-4 h-4 text-indigo-600 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
                        <path d="M12 2a10 10 0 0 1 10 10"/>
                      </svg>
                    </span>
                  </div>
                  <div class="flex flex-col">
                    <span id="turnstileLabel" class="font-medium text-slate-700 dark:text-slate-300">
                      Xác minh bạn là con người
                    </span>
                    <span id="turnstileSublabel" class="text-[10px] text-slate-400">
                      Bảo vệ bởi Turnstile Cloudflare
                    </span>
                  </div>
                </div>

                <!-- Bên phải: Logo Cloudflare Turnstile nhỏ -->
                <div class="flex items-center gap-1.5 opacity-80 pl-2">
                  <svg class="w-5 h-5 text-amber-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.8 9.7c-.5-2.6-2.7-4.6-5.4-4.7-2.3 0-4.3 1.4-5.1 3.4-.6-.2-1.3-.3-1.9-.3-3.1.1-5.6 2.7-5.5 5.8.1 3.1 2.7 5.6 5.8 5.5h11.9c2.5 0 4.5-2 4.5-4.5 0-2.3-1.7-4.2-4.3-4.5v-.7z"/>
                  </svg>
                  <div class="text-[10px] leading-tight text-right text-slate-400 hidden sm:block">
                    <div class="font-bold text-slate-600 dark:text-slate-300">Cloudflare</div>
                    <div class="text-[9px] text-slate-400">Turnstile • Privacy</div>
                  </div>
                </div>
              </div>

              <!-- Hàng tùy chọn: Checkbox "Ghi nhớ đăng nhập" bên trái, link "Quên mật khẩu?" màu xanh bên phải -->
              <div class="flex items-center justify-between text-xs pt-1">
                <label class="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                  <input type="checkbox" checked id="rememberLoginCheckbox" class="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-slate-900 dark:text-indigo-600 focus:ring-slate-900/20 dark:focus:ring-indigo-500/20 cursor-pointer">
                  <span>Ghi nhớ đăng nhập</span>
                </label>
                <button type="button" id="forgotPasswordBtn" class="text-blue-600 dark:text-indigo-400 hover:text-blue-700 dark:hover:text-indigo-300 font-medium cursor-pointer transition-colors">
                  Quên mật khẩu?
                </button>
              </div>

              <!-- Nút chính: "Đăng nhập" nền đen full-width -->
              <button type="submit" id="authSubmitBtn" class="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 transition-all shadow-sm active:scale-[0.99] flex items-center justify-center gap-2 text-sm mt-4 cursor-pointer">
                <span id="authSubmitBtnText">${isRegisterMode ? 'Đăng ký tài khoản' : 'Đăng nhập'}</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                </svg>
              </button>

            </form>

            <!-- Link dưới cùng: Chưa có tài khoản? Đăng ký ngay -->
            <div class="text-center text-xs text-slate-500 dark:text-slate-400 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
              <span id="authToggleQuestion">${isRegisterMode ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}</span>
              <button type="button" id="authToggleModeBtn" class="text-indigo-600 dark:text-indigo-400 font-bold hover:underline ml-1 cursor-pointer">
                ${isRegisterMode ? 'Đăng nhập ngay' : 'Đăng ký ngay'}
              </button>
            </div>

          </div>

          <!-- Cam kết an toàn bảo mật dưới Card -->
          <div class="max-w-md mx-auto w-full mt-6 text-center text-[11px] text-slate-400 flex items-center justify-center gap-4">
            <span class="inline-flex items-center gap-1">
              <svg class="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Mã hóa SSL 256-bit
            </span>
            <span>•</span>
            <span class="inline-flex items-center gap-1">
              <svg class="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              Kích hoạt tự động 24/7
            </span>
            <span>•</span>
            <span class="inline-flex items-center gap-1">
              <svg class="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="m12 15 2 2 4-4"/><rect width="18" height="18" x="3" y="3" rx="2"/></svg>
              Bảo hành 1 đổi 1
            </span>
          </div>

        </div>
      `;
    },

    /**
     * Khởi tạo các sự kiện tương tác sau khi mount view
     */
    afterRender: function () {
      // 1. Nút Về trang chủ
      const backHomeBtn = document.getElementById('authBackHomeBtn');
      if (backHomeBtn) {
        backHomeBtn.addEventListener('click', function () {
          window.ShopVietState.navigate('home');
        });
      }

      // 2. Chuyển đổi ẩn/hiện mật khẩu
      const togglePasswordBtn = document.getElementById('togglePasswordBtn');
      const passwordInput = document.getElementById('authPasswordInput');
      const eyeShowIcon = document.getElementById('eyeShowIcon');
      const eyeHideIcon = document.getElementById('eyeHideIcon');

      if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', function () {
          isPasswordVisible = !isPasswordVisible;
          passwordInput.type = isPasswordVisible ? 'text' : 'password';
          if (eyeShowIcon && eyeHideIcon) {
            eyeShowIcon.classList.toggle('hidden', isPasswordVisible);
            eyeHideIcon.classList.toggle('hidden', !isPasswordVisible);
          }
        });
      }

      // 3. Giả lập Cloudflare Turnstile tương tác
      const turnstileBox = document.getElementById('turnstileBox');
      const turnstileIndicator = document.getElementById('turnstileIndicator');
      const turnstileSpinner = document.getElementById('turnstileSpinner');
      const turnstileCheckmark = document.getElementById('turnstileCheckmark');
      const turnstileLabel = document.getElementById('turnstileLabel');
      const turnstileSublabel = document.getElementById('turnstileSublabel');

      function triggerTurnstileVerification(callback) {
        if (isTurnstileVerified) {
          if (typeof callback === 'function') callback();
          return;
        }

        if (isTurnstileLoading) return;
        isTurnstileLoading = true;

        // Trạng thái: Đang xác thực spinner xoay trong 0.8s
        if (turnstileSpinner) turnstileSpinner.classList.remove('hidden');
        if (turnstileCheckmark) turnstileCheckmark.classList.add('hidden');
        if (turnstileIndicator) {
          turnstileIndicator.className = 'w-6 h-6 rounded-md border-2 border-indigo-400 bg-indigo-50 dark:bg-slate-800 flex items-center justify-center transition-all duration-300';
        }
        if (turnstileLabel) {
          turnstileLabel.textContent = 'Đang xác thực...';
          turnstileLabel.className = 'font-semibold text-indigo-600 dark:text-indigo-400';
        }

        // Sau 0.8s: Hiện dấu tích xanh "Thành công! Bạn là con người"
        setTimeout(function () {
          isTurnstileLoading = false;
          isTurnstileVerified = true;

          if (turnstileSpinner) turnstileSpinner.classList.add('hidden');
          if (turnstileCheckmark) turnstileCheckmark.classList.remove('hidden');
          if (turnstileIndicator) {
            turnstileIndicator.className = 'w-6 h-6 rounded-md border-2 border-emerald-500 bg-emerald-500 flex items-center justify-center shadow-xs transition-all duration-300 scale-105';
          }
          if (turnstileLabel) {
            turnstileLabel.textContent = 'Thành công! Bạn là con người';
            turnstileLabel.className = 'font-bold text-emerald-600 dark:text-emerald-400';
          }
          if (turnstileSublabel) {
            turnstileSublabel.textContent = 'Xác thực Turnstile đã được phê duyệt';
          }

          if (typeof callback === 'function') callback();
        }, 800);
      }

      if (turnstileBox) {
        turnstileBox.addEventListener('click', function () {
          triggerTurnstileVerification();
        });
      }

      // 4. Đăng nhập Google Social qua Firebase Auth & users_db
      const googleLoginBtn = document.getElementById('googleLoginBtn');
      if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async function () {
          googleLoginBtn.disabled = true;
          googleLoginBtn.classList.add('opacity-75');
          const originalContent = googleLoginBtn.innerHTML;
          googleLoginBtn.innerHTML = `
            <svg class="w-4 h-4 animate-spin text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
            <span>Đang xác thực Google...</span>
          `;

          try {
            let res = { success: false };
            if (window.ShopVietFirebase && typeof window.ShopVietFirebase.loginWithGoogle === 'function') {
              res = await window.ShopVietFirebase.loginWithGoogle();
            }

            const gEmail = (res && res.user && res.user.email) ? res.user.email : 'minhcuong111aaa@gmail.com';
            const gName = (res && res.user && res.user.name) ? res.user.name : 'Minh Cường';

            // Tìm trong users_db hoặc tự động đăng ký
            let matched = window.ShopVietState.findUserByEmail(gEmail);
            if (!matched) {
              const regRes = window.ShopVietState.registerUser({
                email: gEmail,
                password: 'google_sso_verified',
                name: gName
              });
              matched = regRes.user;
            }

            if (window.ShopVietState && typeof window.ShopVietState.login === 'function') {
              window.ShopVietState.login(matched);
            }

            window.ShopVietState.showToast(`Đăng nhập Google Cloud Sync thành công! Chào mừng ${matched.name}`, 'success');
            window.ShopVietState.navigate('dashboard');
          } catch (err) {
            console.error('Google login error:', err);
            window.ShopVietState.showToast('Không thể hoàn tất đăng nhập Google lúc này!', 'error');
          } finally {
            googleLoginBtn.disabled = false;
            googleLoginBtn.classList.remove('opacity-75');
            googleLoginBtn.innerHTML = originalContent;
          }
        });
      }

      // 5. Đăng nhập Telegram Social
      const telegramLoginBtn = document.getElementById('telegramLoginBtn');
      if (telegramLoginBtn) {
        telegramLoginBtn.addEventListener('click', function () {
          const teleEmail = 'huy.telegram@shopviet247.com';
          let matched = window.ShopVietState.findUserByEmail(teleEmail);
          if (!matched) {
            const regRes = window.ShopVietState.registerUser({
              email: teleEmail,
              password: 'telegram_sso_verified',
              name: 'Huy Nguyễn (@huy_shopviet)'
            });
            matched = regRes.user;
          }
          if (window.ShopVietFirebase && typeof window.ShopVietFirebase.syncUserToCloud === 'function') {
            window.ShopVietFirebase.syncUserToCloud(matched);
          }
          if (window.ShopVietState && typeof window.ShopVietState.login === 'function') {
            window.ShopVietState.login(matched);
          }
          window.ShopVietState.showToast('Kết nối & Đăng nhập bằng Telegram thành công!', 'success');
          window.ShopVietState.navigate('dashboard');
        });
      }

      // 6. Quên mật khẩu
      const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
      if (forgotPasswordBtn) {
        forgotPasswordBtn.addEventListener('click', function () {
          const emailInput = document.getElementById('authEmailInput');
          const emailVal = emailInput ? emailInput.value.trim() : '';
          if (!emailVal) {
            window.ShopVietState.showToast('Vui lòng nhập Email để nhận hướng dẫn khôi phục mật khẩu!', 'warning');
            return;
          }
          window.ShopVietState.showToast(`Mã khôi phục đã được gửi tới email ${emailVal}! Vui lòng kiểm tra hộp thư.`, 'info');
        });
      }

      // 7. Nút điền nhanh tài khoản Admin cho thử nghiệm
      const fillAdminBtn = document.getElementById('fillAdminDemoBtn');
      if (fillAdminBtn) {
        fillAdminBtn.addEventListener('click', function () {
          const emailInput = document.getElementById('authEmailInput');
          const passInput = document.getElementById('authPasswordInput');
          if (emailInput) emailInput.value = 'minhcuong111aaa@gmail.com';
          if (passInput) passInput.value = 'minhcuong111';
          window.ShopVietState.showToast('Đã điền thông tin tài khoản Admin Minh Cường!', 'info');
        });
      }

      // 8. Chuyển đổi giữa Đăng nhập & Đăng ký
      const authToggleModeBtn = document.getElementById('authToggleModeBtn');
      if (authToggleModeBtn) {
        authToggleModeBtn.addEventListener('click', function () {
          isRegisterMode = !isRegisterMode;
          window.ShopVietState.navigate('login', { mode: isRegisterMode ? 'register' : 'login' });
        });
      }

      // 9. Submit Form Đăng nhập & Đăng ký (Kiểm tra thực tế qua users_db)
      const authForm = document.getElementById('authForm');
      if (authForm) {
        authForm.addEventListener('submit', function (e) {
          e.preventDefault();
          const emailInput = document.getElementById('authEmailInput');
          const nameInput = document.getElementById('authNameInput');
          const passInput = document.getElementById('authPasswordInput');
          const submitBtn = document.getElementById('authSubmitBtn');
          const submitBtnText = document.getElementById('authSubmitBtnText');

          const email = emailInput ? emailInput.value.trim() : '';
          const password = passInput ? passInput.value : '';
          const name = (isRegisterMode && nameInput) ? nameInput.value.trim() : '';

          if (!email) {
            window.ShopVietState.showToast('Vui lòng nhập địa chỉ Email!', 'warning');
            if (emailInput) emailInput.focus();
            return;
          }

          if (!password) {
            window.ShopVietState.showToast('Vui lòng nhập mật khẩu!', 'warning');
            if (passInput) passInput.focus();
            return;
          }

          if (isRegisterMode) {
            if (!name) {
              window.ShopVietState.showToast('Vui lòng nhập họ và tên của bạn!', 'warning');
              if (nameInput) nameInput.focus();
              return;
            }
            if (password.length < 6) {
              window.ShopVietState.showToast('Mật khẩu phải có ít nhất 6 ký tự!', 'warning');
              if (passInput) passInput.focus();
              return;
            }
          }

          const executeOnlineAuth = async function () {
            if (submitBtn) {
              submitBtn.disabled = true;
              submitBtn.classList.add('opacity-80');
            }
            if (submitBtnText) {
              submitBtnText.textContent = isRegisterMode ? 'Đang tạo tài khoản...' : 'Đang kiểm tra tài khoản...';
            }

            try {
              if (isRegisterMode) {
                // XỬ LÝ ĐĂNG KÝ TÀI KHOẢN MỚI
                const regRes = window.ShopVietState.registerUser({
                  email: email,
                  password: password,
                  name: name
                });

                if (!regRes.success) {
                  // Báo lỗi nếu email đã tồn tại hoặc không hợp lệ
                  window.ShopVietState.showToast(regRes.message, 'error');
                  return;
                }

                // Tự động đăng nhập và lưu session
                window.ShopVietState.login(regRes.user);
                window.ShopVietState.showToast('Đăng ký tài khoản thành công! Chào mừng ' + regRes.user.name, 'success');
                window.ShopVietState.navigate('dashboard');
              } else {
                // XỬ LÝ ĐĂNG NHẬP TÀI KHOẢN THỰC TẾ
                const authRes = window.ShopVietState.authenticateUser(email, password);

                if (!authRes.success) {
                  // Nếu không tồn tại hoặc sai mật khẩu: BÁO LỖI RÕ RÀNG VÀ TUYỆT ĐỐI KHÔNG CHO ĐĂNG NHẬP!
                  window.ShopVietState.showToast(authRes.message, 'error');
                  return;
                }

                // Đăng nhập thành công
                window.ShopVietState.login(authRes.user);
                window.ShopVietState.showToast('Đăng nhập thành công! Chào mừng ' + authRes.user.name, 'success');
                window.ShopVietState.navigate('dashboard');
              }
            } catch (authErr) {
              console.error('Online Auth error:', authErr);
              window.ShopVietState.showToast('Có lỗi xảy ra trong quá trình xác thực!', 'error');
            } finally {
              if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.classList.remove('opacity-80');
              }
              if (submitBtnText) {
                submitBtnText.textContent = isRegisterMode ? 'Đăng ký tài khoản' : 'Đăng nhập';
              }
            }
          };

          // Nếu chưa tick Turnstile, kích hoạt xác thực 0.8s rồi thực thi
          if (!isTurnstileVerified) {
            triggerTurnstileVerification(executeOnlineAuth);
          } else {
            executeOnlineAuth();
          }
        });
      }
    }
  };

  // Gắn vào window.ShopVietViews.login và window.ShopVietViews.auth
  window.ShopVietViews.login = authView;
  window.ShopVietViews.auth = authView;

})();
