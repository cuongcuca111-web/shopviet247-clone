/**
 * ==============================================================================
 * SHOPSKILL247 PROPRIETARY CLOSED-SOURCE SECURITY SHIELD
 * Bản quyền độc quyền (C) 2026 ShopSkill247. All Rights Reserved.
 * ==============================================================================
 * Lá chắn an ninh bảo vệ mã nguồn, chống soi code, chặn F12/Ctrl+U/Chuột phải
 * và bảo vệ toàn vẹn tài sản số của chủ sở hữu.
 */
(function() {
  'use strict';

  // Biến kiểm soát trạng thái debug dành riêng cho Admin
  let isShieldUnlocked = false;

  // Kiểm tra quyền Admin đã lưu
  try {
    if (localStorage.getItem('shopviet_dev_unlocked') === 'true') {
      isShieldUnlocked = true;
    }
  } catch (e) {}

  // 1. Hiển thị thông báo Toast cảnh báo bản quyền
  let lastToastTime = 0;
  function showShieldToast(msg) {
    const now = Date.now();
    if (now - lastToastTime < 2500) return; // Chống spam toast
    lastToastTime = now;

    let toast = document.getElementById('shopviet-shield-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'shopviet-shield-toast';
      toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        background: rgba(15, 23, 42, 0.95);
        color: #f8fafc;
        border: 1px solid rgba(239, 68, 68, 0.4);
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(239, 68, 68, 0.2);
        padding: 10px 18px;
        border-radius: 9999px;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 13px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
        z-index: 999999;
        pointer-events: none;
        opacity: 0;
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      `;
      document.body ? document.body.appendChild(toast) : document.documentElement.appendChild(toast);
    }

    toast.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
      <span>${msg}</span>
    `;

    // Hiệu ứng hiện
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    // Tự biến mất sau 2.2s
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
    }, 2200);
  }

  // 2. Chặn chuột phải (Context Menu)
  document.addEventListener('contextmenu', function(e) {
    if (isShieldUnlocked) return;
    // Cho phép nhập liệu trong input/textarea
    const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea' || (e.target && e.target.isContentEditable)) {
      return;
    }
    e.preventDefault();
    showShieldToast('Bản quyền độc quyền ShopSkill247. Chuột phải đã bị khóa.');
  }, true);

  // 3. Chặn phím tắt DevTools và xem nguồn
  document.addEventListener('keydown', function(e) {
    // Phím tắt bí mật dành riêng cho Admin để mở khóa: Ctrl + Alt + Shift + K
    if (e.ctrlKey && e.altKey && e.shiftKey && (e.key === 'K' || e.key === 'k')) {
      e.preventDefault();
      isShieldUnlocked = !isShieldUnlocked;
      try {
        localStorage.setItem('shopviet_dev_unlocked', isShieldUnlocked ? 'true' : 'false');
      } catch (err) {}
      showShieldToast(isShieldUnlocked ? '🔓 Chế độ Admin DevTools đã MỞ KHÓA' : '🔒 Đã KÍCH HOẠT LẠI Lá chắn Bảo Mật');
      return;
    }

    if (isShieldUnlocked) return;

    // F12
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      showShieldToast('F12 DevTools đã bị vô hiệu hóa.');
      return false;
    }

    // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (Chrome/Firefox/Edge)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c' || e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) {
      e.preventDefault();
      e.stopPropagation();
      showShieldToast('Công cụ phát triển DevTools đã bị chặn.');
      return false;
    }

    // Ctrl+U (Xem mã nguồn - View Source)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'U' || e.key === 'u' || e.keyCode === 85)) {
      e.preventDefault();
      e.stopPropagation();
      showShieldToast('Chức năng xem mã nguồn đã bị vô hiệu hóa.');
      return false;
    }

    // Ctrl+S (Lưu toàn bộ trang - Save Page)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'S' || e.key === 's' || e.keyCode === 83)) {
      const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
      if (tag !== 'input' && tag !== 'textarea') {
        e.preventDefault();
        e.stopPropagation();
        showShieldToast('Thao tác lưu trang đã bị khóa.');
        return false;
      }
    }
  }, true);

  // 4. Biểu ngữ cảnh báo pháp lý độc quyền trong Console
  function printSecurityBanner() {
    const titleStyle = 'color: #ef4444; font-size: 20px; font-weight: 900; text-shadow: 1px 1px 2px #000; padding: 4px 0;';
    const subStyle = 'color: #f59e0b; font-size: 13px; font-weight: 600; line-height: 1.6;';
    const noteStyle = 'color: #94a3b8; font-size: 11px; font-style: italic;';

    console.clear();
    console.log('%c⚠️ DỪNG LẠI! HỆ THỐNG MÃ NGUỒN ĐÓNG ĐỘC QUYỀN SHOPSKILL247', titleStyle);
    console.log('%cToàn bộ mã nguồn, cấu trúc dữ liệu và logic thanh toán thuộc quyền sở hữu trí tuệ của ShopSkill247 (Minh Cường).\nMọi hành vi sao chép, trích xuất dữ liệu, can thiệp mã nguồn hoặc đảo ngược kỹ thuật đều vi phạm pháp luật sở hữu trí tuệ.', subStyle);
    console.log('%c(Dành cho Quản trị viên: Nhấn Ctrl + Alt + Shift + K trên trang để bật/tắt chế độ debug)', noteStyle);
  }

  // Khởi chạy biểu ngữ
  try {
    printSecurityBanner();
  } catch (e) {}

  // 5. Cung cấp API mở khóa cho Admin trên cửa sổ Window
  window.ShopSkillSecurity = {
    isLocked: () => !isShieldUnlocked,
    unlock: (secretKey) => {
      if (secretKey === 'cuongcuca111' || localStorage.getItem('shopviet_admin_session')) {
        isShieldUnlocked = true;
        try { localStorage.setItem('shopviet_dev_unlocked', 'true'); } catch (e) {}
        console.log('%c[ShopSkill247 Security] Đã mở khóa bảo vệ dành cho Admin.', 'color: #10b981; font-weight: bold;');
        return true;
      }
      return false;
    },
    lock: () => {
      isShieldUnlocked = false;
      try { localStorage.setItem('shopviet_dev_unlocked', 'false'); } catch (e) {}
      printSecurityBanner();
    }
  };
})();
