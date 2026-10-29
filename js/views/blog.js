/**
 * Shopviet247 - Phân Hệ Blog & Cẩm Nang Công Nghệ AI Tương Tác
 * Cung cấp tin tức, so sánh công cụ AI, hướng dẫn kích hoạt bản quyền và thủ thuật Developer
 */

window.ShopVietViews = window.ShopVietViews || {};

window.ShopVietViews.blog = (function () {
  'use strict';

  // Khóa LocalStorage
  const LIKED_POSTS_KEY = 'shopviet_liked_posts';
  const POST_LIKES_COUNT_KEY = 'shopviet_post_likes_count';

  // Dữ liệu bài viết thực tế & chất lượng cao
  const BLOG_POSTS = [
    {
      id: 1,
      title: 'Hướng Dẫn Kích Hoạt Antigravity & Gemini Pro 18 Tháng Nhanh Gọn',
      category: 'guide',
      categoryName: 'Hướng dẫn kích hoạt',
      author: 'Minh Cường',
      authorRole: 'Founder Shopviet247',
      date: '28/03/2026',
      readTime: '4 phút',
      initialLikes: 142,
      badgeColor: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-800/50',
      gradient: 'from-indigo-600 via-indigo-700 to-purple-800',
      summary: 'Quy trình 3 bước kích hoạt gói Google Antigravity 2.0 và Gemini Advanced 18 tháng chính chủ, bảo toàn dung lượng Google One 2TB cùng quyền truy cập mô hình Gemini 3.8 Flash High & Ultra.',
      content: `
        <div class="space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed">
          <p class="text-base font-medium text-slate-800 dark:text-slate-200 leading-normal">
            Google Antigravity 2.0 và Gemini Advanced đang là tâm điểm chú ý của cộng đồng AI Developer toàn cầu. Với việc tích hợp sâu vào quy trình Agentic Coding và cấp kèm gói Google One 2TB dung lượng Drive, đây là công cụ không thể thiếu trong năm 2026.
          </p>

          <div class="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/40">
            <h4 class="text-sm font-bold text-indigo-900 dark:text-indigo-200 mb-1 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400"></span>
              Đặc quyền gói Gemini Pro 18 Tháng tại Shopviet247:
            </h4>
            <ul class="text-xs sm:text-sm text-indigo-800/90 dark:text-indigo-300/90 list-disc list-inside space-y-1">
              <li>Nâng cấp trực tiếp trên chính email Gmail cá nhân của bạn, không lo mất dữ liệu.</li>
              <li>Miễn phí 2TB Google One lưu trữ hình ảnh, backup điện thoại và Google Drive.</li>
              <li>Mở khóa toàn bộ Gemini Live giọng nói siêu mượt và Workspace Gemini trong Docs/Sheets.</li>
              <li>Bảo hành toàn diện 1 đổi 1 suốt 18 tháng sử dụng liên tục.</li>
            </ul>
          </div>

          <h3 class="text-lg font-bold text-slate-900 dark:text-white pt-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            Bước 1: Chuẩn bị tài khoản Google cá nhân
          </h3>
          <p>
            Đảm bảo tài khoản Gmail của bạn hiện không nằm trong một nhóm Family (Google Gia đình) khác có quản trị viên. Nếu có, vui lòng tạm thời rời nhóm cũ để sẵn sàng nhận lời mời tham gia gói bản quyền Enterprise.
          </p>

          <h3 class="text-lg font-bold text-slate-900 dark:text-white pt-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            Bước 2: Đặt đơn và nhận kích hoạt tự động sau 5 giây
          </h3>
          <p>
            Tại Shopviet247, bạn chỉ cần chọn sản phẩm <strong>Gemini Advanced & Antigravity 18T</strong>, nhập địa chỉ email cần nâng cấp và quét mã VietQR thanh toán. Hệ thống Bot AI của Shopviet247 sẽ tự động gửi email xác nhận bản quyền sau đúng 5 giây.
          </p>

          <h3 class="text-lg font-bold text-slate-900 dark:text-white pt-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            Bước 3: Xác nhận trong Google One & Đăng nhập Antigravity IDE
          </h3>
          <p>
            Sau khi mở email thư mời từ Google, bấm <em>"Chấp nhận lời mời"</em>. Dung lượng Google Drive của bạn sẽ lập tức nhảy lên 2TB. Tiếp theo, mở Antigravity IDE hoặc truy cập gemini.google.com để bắt đầu trải nghiệm toàn bộ sức mạnh mô hình Gemini 3.8 mới nhất!
          </p>

          <div class="mt-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 text-xs sm:text-sm">
            <strong>Mẹo quan trọng:</strong> Nếu bạn gặp thông báo vùng quốc gia không tương thích, chỉ cần kiểm tra lại địa chỉ thanh toán trong pay.google.com và chuyển về khu vực Việt Nam là sẽ hoàn tất mượt mà.
          </div>
        </div>
      `
    },
    {
      id: 2,
      title: 'So Sánh Chi Tiết Cursor Pro vs Claude 3.5 Sonnet: Đâu Là Lựa Chọn Tối Ưu Cho Developer?',
      category: 'compare',
      categoryName: 'So sánh AI',
      author: 'Minh Cường',
      authorRole: 'Founder Shopviet247',
      date: '26/03/2026',
      readTime: '6 phút',
      initialLikes: 98,
      badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/50',
      gradient: 'from-blue-600 via-indigo-600 to-sky-700',
      summary: 'Phân tích hiệu suất lập trình thực chiến giữa Cursor Pro (tích hợp sâu Composer, Agentic Tab) và API Claude 3.5 Sonnet / Opus. Chi phí, tốc độ phản hồi và benchmark dự án lớn.',
      content: `
        <div class="space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed">
          <p class="text-base font-medium text-slate-800 dark:text-slate-200">
            Cuộc chiến giữa các công cụ hỗ trợ lập trình bằng AI đang nóng hơn bao giờ hết. Rất nhiều lập trình viên phân vân giữa việc mua tài khoản Cursor Pro hay mua Token API Claude 3.5 Sonnet. Bài viết này sẽ phân tích chi tiết dựa trên kinh nghiệm thực chiến code dự án thực tế.
          </p>

          <div class="overflow-x-auto my-4">
            <table class="w-full text-left text-xs sm:text-sm border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <thead class="bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white font-bold">
                <tr>
                  <th class="p-3 border-b border-slate-200 dark:border-slate-800">Tiêu chí</th>
                  <th class="p-3 border-b border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400">Cursor Pro (500 Fast Req)</th>
                  <th class="p-3 border-b border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400">Claude 3.5 Sonnet API</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60">
                <tr>
                  <td class="p-3 font-semibold text-slate-900 dark:text-white">Trải nghiệm IDE</td>
                  <td class="p-3">Tuyệt đối mượt (Tích hợp sâu VS Code, Tab AI gợi ý từng dòng)</td>
                  <td class="p-3">Phải dùng qua plugin bên thứ 3 (Continue, Cline, Roo Code)</td>
                </tr>
                <tr>
                  <td class="p-3 font-semibold text-slate-900 dark:text-white">Composer đa tệp</td>
                  <td class="p-3">Tự động sửa cùng lúc 10-20 tệp, review diff trực quan</td>
                  <td class="p-3">Cần cấu hình Agent phức tạp, dễ bị lặp tool call</td>
                </tr>
                <tr>
                  <td class="p-3 font-semibold text-slate-900 dark:text-white">Đọc hiểu Repo lớn</td>
                  <td class="p-3">Index toàn bộ codebase tự động với Embeddings Vector</td>
                  <td class="p-3">Tốn token ngữ cảnh rất lớn cho mỗi lần request</td>
                </tr>
                <tr>
                  <td class="p-3 font-semibold text-slate-900 dark:text-white">Chi phí bản quyền</td>
                  <td class="p-3 text-emerald-600 font-bold">Tiết kiệm vượt trội khi mua gói 1 tháng/1 năm tại Shopviet247</td>
                  <td class="p-3">Đắt đỏ nếu dự án lớn (dễ bị đốt 50$-100$/tuần)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 class="text-lg font-bold text-slate-900 dark:text-white pt-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            Lời khuyên cho Developer:
          </h3>
          <p>
            Nếu bạn là Fullstack Developer, Frontend hoặc Mobile Engineer cần tốc độ sinh code nhanh và tự động cập nhật cả project, <strong>Cursor Pro</strong> là lựa chọn số 1 không có đối thủ. Bạn chỉ cần tập trung vào ý tưởng, Cursor sẽ hoàn thành phần còn lại.
          </p>
        </div>
      `
    },
    {
      id: 3,
      title: 'Cách Sử Dụng ChatGPT Plus & O1 Private Hiệu Quả Nhất 2026',
      category: 'tips',
      categoryName: 'Thủ thuật Dev',
      author: 'Minh Cường',
      authorRole: 'Founder Shopviet247',
      date: '22/03/2026',
      readTime: '5 phút',
      initialLikes: 75,
      badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/50',
      gradient: 'from-emerald-600 via-teal-600 to-cyan-700',
      summary: 'Khai thác tối đa sức mạnh mô hình suy luận sâu OpenAI O1 Pro và ChatGPT Plus trong nghiên cứu dữ liệu, viết tài liệu kỹ thuật và giải toán học - thuật toán phức tạp.',
      content: `
        <div class="space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed">
          <p class="text-base font-medium text-slate-800 dark:text-slate-200">
            Dòng mô hình OpenAI O1 (O1-preview, O1-mini và O1-pro) mang lại bước nhảy vọt về khả năng "suy nghĩ trước khi trả lời" (Chain of Thought). Để tận dụng hết giá trị của gói ChatGPT Plus Private, bạn cần nắm rõ 3 nguyên tắc sau.
          </p>

          <h3 class="text-lg font-bold text-slate-900 dark:text-white pt-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            1. Không mớm giải pháp - Hãy cung cấp ràng buộc (Constraints)
          </h3>
          <p>
            Khác với GPT-4o, mô hình O1 giải quyết bài toán tốt nhất khi bạn chỉ nêu mục tiêu đầu ra và các ràng buộc cứng (ví dụ: thời gian chạy O(n), không dùng thư viện ngoài, tương thích Node 18+). O1 sẽ tự động thử nghiệm nhiều giải thuật trong chuỗi suy luận nội bộ để tìm ra phương án tối ưu nhất.
          </p>

          <h3 class="text-lg font-bold text-slate-900 dark:text-white pt-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            2. Sử dụng tài khoản Private tại Shopviet247 để bảo vệ dữ liệu
          </h3>
          <p>
            Khi mua tài khoản dùng chung giá rẻ trôi nổi, lịch sử chat và ý tưởng dự án của bạn có nguy cơ bị lộ cho người khác. Tại Shopviet247, chúng tôi cung cấp gói <strong>ChatGPT Plus Private 1 người dùng</strong> riêng biệt, bảo toàn lịch sử và quyền riêng tư 100%.
          </p>
        </div>
      `
    },
    {
      id: 4,
      title: 'Bí Quyết Nâng Cấp Canva Pro & CapCut Pro Bản Quyền Tiết Kiệm 80%',
      category: 'design',
      categoryName: 'Đồ họa & Video',
      author: 'Minh Cường',
      authorRole: 'Founder Shopviet247',
      date: '18/03/2026',
      readTime: '3 phút',
      initialLikes: 64,
      badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/50',
      gradient: 'from-amber-500 via-rose-600 to-red-600',
      summary: 'Hướng dẫn nâng cấp Canva Pro gói Edu/Brand và Capcut Pro PC vĩnh viễn trên chính tài khoản cá nhân, mở khóa toàn bộ kho hiệu ứng video 4K, AI Video Upscale và Brand Kit.',
      content: `
        <div class="space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed">
          <p class="text-base font-medium text-slate-800 dark:text-slate-200">
            Nhu cầu làm video ngắn TikTok, Reels và thiết kế banner quảng cáo ngày càng bùng nổ. Thay vì phải trả hàng triệu đồng mỗi năm trực tiếp cho nhà phát hành, bạn hoàn toàn có thể sở hữu bản quyền chính hãng với chi phí tiết kiệm đến 80% tại Shopviet247.
          </p>

          <h3 class="text-lg font-bold text-slate-900 dark:text-white pt-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            Đặc quyền Canva Pro Mail Chính Chủ:
          </h3>
          <p>
            Bạn không cần đổi tài khoản, các thiết kế cũ vẫn giữ nguyên vẹn. Hệ thống sẽ cấp quyền Pro mở khóa kho ảnh 100+ triệu hình chất lượng cao, tính năng Magic Eraser xóa vật thể bằng AI, đổi kích thước thiết kế một chạm và tải file PNG trong suốt không nền.
          </p>

          <h3 class="text-lg font-bold text-slate-900 dark:text-white pt-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            Capcut Pro PC / Mobile Vĩnh Viễn:
          </h3>
          <p>
            Mở khóa đầy đủ bộ lọc màu điện ảnh Hollywood, khử rung video AI, tự động tạo phụ đề thông minh không lỗi font tiếng Việt và xuất video 4K 60FPS sắc nét không watermark.
          </p>
        </div>
      `
    }
  ];

  // Helper lấy lượt thích hiện tại
  function getLikesData() {
    let liked = {};
    let counts = {};
    try {
      liked = JSON.parse(localStorage.getItem(LIKED_POSTS_KEY)) || {};
      counts = JSON.parse(localStorage.getItem(POST_LIKES_COUNT_KEY)) || {};
    } catch (e) {
      liked = {};
      counts = {};
    }
    return { liked, counts };
  }

  function getPostLikes(postId) {
    const { counts } = getLikesData();
    if (typeof counts[postId] === 'number') {
      return counts[postId];
    }
    const post = BLOG_POSTS.find(p => p.id === Number(postId));
    return post ? post.initialLikes : 0;
  }

  function isPostLiked(postId) {
    const { liked } = getLikesData();
    return Boolean(liked[postId]);
  }

  // Trạng thái tìm kiếm & filter hiện tại
  let currentCategory = 'all';
  let searchKeyword = '';

  return {
    /**
     * Render Giao diện Phân Hệ Blog
     */
    render: function (params) {
      const activeCat = (params && params.category) || currentCategory || 'all';
      currentCategory = activeCat;

      return `
        <div id="blogViewContainer" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10 animate-fade-in">
          
          <!-- Hero Banner Header -->
          <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-10 lg:p-12 shadow-xl border border-slate-800/80">
            <!-- Background Decorative Blobs -->
            <div class="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div class="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>

            <div class="relative z-10 max-w-3xl space-y-4">
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
                <svg class="w-3.5 h-3.5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                Shopviet247 Knowledge Hub
              </div>
              <h1 class="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Cẩm Nang & Tin Tức <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-indigo-200">Công Nghệ AI</span>
              </h1>
              <p class="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
                Khám phá các hướng dẫn kích hoạt bản quyền, so sánh chuyên sâu các mô hình trí tuệ nhân tạo hàng đầu, và bí quyết tối ưu hóa quy trình làm việc cho Developer & Creator.
              </p>

              <!-- Thanh tìm kiếm bài viết tức thì -->
              <div class="pt-2 max-w-xl">
                <div class="relative flex items-center">
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                  </div>
                  <input
                    type="text"
                    id="blogSearchInput"
                    placeholder="Tìm kiếm bài viết (Cursor, Gemini 18T, ChatGPT, Capcut...)"
                    value="${searchKeyword}"
                    class="w-full pl-10 pr-24 py-3 bg-white/10 dark:bg-slate-800/80 backdrop-blur-md text-white placeholder-slate-400 text-sm rounded-2xl border border-white/15 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition shadow-inner"
                  />
                  <div class="absolute right-2 flex items-center">
                    <button
                      id="clearBlogSearchBtn"
                      class="${searchKeyword ? '' : 'hidden'} px-2 py-1 text-xs text-slate-400 hover:text-white"
                      title="Xóa tìm kiếm"
                    >
                      ✕
                    </button>
                    <span class="text-[11px] font-semibold bg-white/10 text-slate-300 px-2 py-1 rounded-lg pointer-events-none">
                      Tức thì
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Thanh Lọc Danh Mục Dạng Tabs Viên Thuốc (Filter Pills) -->
          <div class="flex items-center justify-between flex-wrap gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div class="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none w-full sm:w-auto" id="blogCategoryPills">
              <button data-cat="all" class="blog-cat-btn rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${currentCategory === 'all' ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'}">
                Tất cả (${BLOG_POSTS.length})
              </button>
              <button data-cat="guide" class="blog-cat-btn rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${currentCategory === 'guide' ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'}">
                Hướng dẫn kích hoạt
              </button>
              <button data-cat="compare" class="blog-cat-btn rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${currentCategory === 'compare' ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'}">
                So sánh AI
              </button>
              <button data-cat="tips" class="blog-cat-btn rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${currentCategory === 'tips' ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'}">
                Thủ thuật Dev
              </button>
              <button data-cat="design" class="blog-cat-btn rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${currentCategory === 'design' ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'}">
                Đồ họa & Video
              </button>
            </div>

            <div class="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Hiển thị <span id="blogCountDisplay" class="font-bold text-slate-900 dark:text-white">...</span> bài viết
            </div>
          </div>

          <!-- Lưới Danh Sách Bài Viết (Grid Cards) -->
          <div id="blogGridContainer" class="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            <!-- Dynamic Cards nạp qua JS -->
          </div>

        </div>
      `;
    },

    /**
     * Sau khi gắn vào DOM, khởi tạo các tương tác và sự kiện
     */
    afterRender: function () {
      const self = this;
      self.renderCards();

      // Sự kiện Tìm kiếm tức thì
      const searchInput = document.getElementById('blogSearchInput');
      const clearBtn = document.getElementById('clearBlogSearchBtn');

      if (searchInput) {
        searchInput.addEventListener('input', function (e) {
          searchKeyword = e.target.value.trim().toLowerCase();
          if (clearBtn) {
            if (searchKeyword) {
              clearBtn.classList.remove('hidden');
            } else {
              clearBtn.classList.add('hidden');
            }
          }
          self.renderCards();
        });
      }

      if (clearBtn) {
        clearBtn.addEventListener('click', function () {
          if (searchInput) {
            searchInput.value = '';
            searchKeyword = '';
            clearBtn.classList.add('hidden');
            self.renderCards();
            searchInput.focus();
          }
        });
      }

      // Sự kiện Chuyển Tabs Danh mục
      const catBtns = document.querySelectorAll('.blog-cat-btn');
      catBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          const cat = btn.getAttribute('data-cat');
          currentCategory = cat;

          // Cập nhật giao diện tabs viên thuốc
          catBtns.forEach(function (b) {
            if (b.getAttribute('data-cat') === cat) {
              b.className = 'blog-cat-btn rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900';
            } else {
              b.className = 'blog-cat-btn rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800';
            }
          });

          self.renderCards();
        });
      });
    },

    /**
     * Lọc và Render các thẻ Card bài viết
     */
    renderCards: function () {
      const self = this;
      const container = document.getElementById('blogGridContainer');
      const countDisplay = document.getElementById('blogCountDisplay');
      if (!container) return;

      // Lọc theo danh mục và từ khóa
      let filtered = BLOG_POSTS.filter(function (post) {
        const matchCat = (currentCategory === 'all') || (post.category === currentCategory);
        const matchSearch = (!searchKeyword) ||
          post.title.toLowerCase().includes(searchKeyword) ||
          post.summary.toLowerCase().includes(searchKeyword) ||
          post.categoryName.toLowerCase().includes(searchKeyword);
        return matchCat && matchSearch;
      });

      if (countDisplay) {
        countDisplay.textContent = filtered.length;
      }

      if (filtered.length === 0) {
        container.innerHTML = `
          <div class="col-span-full py-16 text-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
            <div class="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white">Không tìm thấy bài viết phù hợp</h3>
            <p class="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
              Không có bài viết nào khớp với từ khóa "<strong>${searchKeyword}</strong>". Vui lòng thử tìm kiếm với các từ khóa khác.
            </p>
          </div>
        `;
        return;
      }

      const cardsHtml = filtered.map(function (post) {
        const likes = getPostLikes(post.id);
        const liked = isPostLiked(post.id);

        return `
          <article class="blog-card flex flex-col justify-between bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-sm hover:shadow-xl hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition-all duration-300 group">
            
            <!-- Card Header & Decorative Banner -->
            <div class="relative h-44 bg-gradient-to-br ${post.gradient} p-6 flex flex-col justify-between overflow-hidden">
              <div class="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>
              
              <div class="flex items-center justify-between relative z-10">
                <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/90 text-slate-900 backdrop-blur-sm shadow-xs">
                  ${post.categoryName}
                </span>
                <span class="text-xs font-medium text-white/90 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  ${post.readTime}
                </span>
              </div>

              <!-- Tiêu đề lớn trong Cover -->
              <div class="relative z-10">
                <span class="text-[11px] font-semibold text-white/70 uppercase tracking-wider block mb-1">Cẩm nang Shopviet247</span>
                <h3 class="text-lg sm:text-xl font-extrabold text-white line-clamp-2 drop-shadow-xs group-hover:text-indigo-100 transition-colors">
                  ${post.title}
                </h3>
              </div>
            </div>

            <!-- Card Body Content -->
            <div class="p-6 flex-1 flex flex-col justify-between space-y-4">
              <p class="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                ${post.summary}
              </p>

              <!-- Footer Metadata & Interactive Actions -->
              <div class="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
                
                <!-- Author & Date -->
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    MC
                  </div>
                  <div class="flex flex-col">
                    <span class="text-xs font-bold text-slate-900 dark:text-white leading-none">${post.author}</span>
                    <span class="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">${post.date}</span>
                  </div>
                </div>

                <!-- Action Cluster: Like Button & Read More -->
                <div class="flex items-center gap-2">
                  <!-- Like Button Thả Tim Tương Tác -->
                  <button
                    data-post-id="${post.id}"
                    class="blog-like-btn flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      liked
                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/80'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700'
                    }"
                    title="${liked ? 'Bỏ thích bài viết' : 'Thả tim bài viết'}"
                  >
                    <svg class="w-4 h-4 transition-transform duration-200 ${liked ? 'fill-rose-600 scale-110' : 'fill-none'}" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span class="like-counter">${likes}</span>
                  </button>

                  <!-- Đọc tiếp Button -->
                  <button
                    data-open-post="${post.id}"
                    class="blog-read-btn inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold hover:bg-indigo-600 dark:hover:bg-slate-200 transition-colors shadow-xs cursor-pointer"
                  >
                    <span>Đọc tiếp</span>
                    <svg class="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </button>
                </div>

              </div>
            </div>

          </article>
        `;
      }).join('');

      container.innerHTML = cardsHtml;

      // Gắn sự kiện cho các nút Like và Đọc tiếp
      container.querySelectorAll('.blog-like-btn').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          const postId = Number(btn.getAttribute('data-post-id'));
          self.toggleLike(postId, btn);
        });
      });

      container.querySelectorAll('.blog-read-btn').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          const postId = Number(btn.getAttribute('data-open-post'));
          self.openPost(postId);
        });
      });
    },

    /**
     * Xử lý Thả Tim (Like) tương tác tức thì
     */
    toggleLike: function (postId, buttonEl) {
      let { liked, counts } = getLikesData();
      const isLiked = Boolean(liked[postId]);
      let currentLikes = getPostLikes(postId);

      if (isLiked) {
        // Hủy thích
        liked[postId] = false;
        currentLikes = Math.max(0, currentLikes - 1);
      } else {
        // Thích
        liked[postId] = true;
        currentLikes += 1;
      }

      counts[postId] = currentLikes;

      try {
        localStorage.setItem(LIKED_POSTS_KEY, JSON.stringify(liked));
        localStorage.setItem(POST_LIKES_COUNT_KEY, JSON.stringify(counts));
      } catch (e) {
        console.warn('[Blog] Không thể lưu like vào localStorage:', e);
      }

      // Cập nhật DOM của nút bấm
      if (buttonEl) {
        const isNowLiked = liked[postId];
        const counter = buttonEl.querySelector('.like-counter');
        const heartSvg = buttonEl.querySelector('svg');

        if (counter) counter.textContent = currentLikes;

        if (isNowLiked) {
          buttonEl.className = 'blog-like-btn flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/80';
          if (heartSvg) {
            heartSvg.setAttribute('class', 'w-4 h-4 transition-transform duration-200 fill-rose-600 scale-110 animate-bounce');
            setTimeout(() => heartSvg.classList.remove('animate-bounce'), 500);
          }
        } else {
          buttonEl.className = 'blog-like-btn flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700';
          if (heartSvg) {
            heartSvg.setAttribute('class', 'w-4 h-4 transition-transform duration-200 fill-none');
          }
        }
      }

      // Nếu modal đang mở, đồng bộ cả trong modal
      const modalLikeBtn = document.getElementById(`modalLikeBtn_${postId}`);
      if (modalLikeBtn) {
        const isNowLiked = liked[postId];
        const counter = modalLikeBtn.querySelector('.like-counter');
        const heartSvg = modalLikeBtn.querySelector('svg');
        if (counter) counter.textContent = currentLikes;
        if (isNowLiked) {
          modalLikeBtn.className = 'flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800/80 cursor-pointer';
          if (heartSvg) heartSvg.setAttribute('class', 'w-4 h-4 fill-rose-600 scale-110');
        } else {
          modalLikeBtn.className = 'flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600 cursor-pointer';
          if (heartSvg) heartSvg.setAttribute('class', 'w-4 h-4 fill-none');
        }
      }
    },

    /**
     * Mở Modal Xem Chi Tiết Toàn Bộ Bài Viết
     */
    openPost: function (postId) {
      const self = this;
      const post = BLOG_POSTS.find(p => p.id === Number(postId));
      if (!post) return;

      const modalMount = document.getElementById('modalMount');
      if (!modalMount) return;

      const likes = getPostLikes(post.id);
      const liked = isPostLiked(post.id);

      modalMount.innerHTML = `
        <div id="blogDetailModalBackdrop" class="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
          
          <div class="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
            
            <!-- Modal Header Banner -->
            <div class="relative bg-gradient-to-r ${post.gradient} text-white p-6 sm:p-8 shrink-0 overflow-hidden">
              <div class="absolute -right-8 -top-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

              <!-- Close Button -->
              <button
                id="closeBlogModalBtn"
                class="absolute top-4 right-4 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors cursor-pointer"
                title="Đóng cửa sổ"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>

              <div class="space-y-3 max-w-xl">
                <div class="flex items-center gap-2">
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/90 text-slate-900 backdrop-blur-sm">
                    ${post.categoryName}
                  </span>
                  <span class="text-xs text-white/80 flex items-center gap-1">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    ${post.readTime} đọc
                  </span>
                </div>
                <h2 class="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white leading-tight">
                  ${post.title}
                </h2>
                <div class="flex items-center gap-3 pt-1">
                  <div class="w-7 h-7 rounded-full bg-white/20 text-white font-bold text-xs flex items-center justify-center border border-white/30">
                    MC
                  </div>
                  <div class="text-xs text-white/90">
                    <span class="font-bold">${post.author}</span> • <span>${post.date}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Modal Content Scrollable -->
            <div class="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
              ${post.content}
            </div>

            <!-- Modal Footer Actions -->
            <div class="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 flex items-center justify-between gap-4 shrink-0">
              
              <!-- Like Action trong Modal -->
              <button
                id="modalLikeBtn_${post.id}"
                class="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                  liked
                    ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800/80'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600'
                }"
              >
                <svg class="w-4 h-4 ${liked ? 'fill-rose-600 scale-110' : 'fill-none'}" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>Hữu ích: <strong class="like-counter">${likes}</strong> lượt thích</span>
              </button>

              <div class="flex items-center gap-2">
                <!-- Nút Chia sẻ -->
                <button
                  id="shareBlogModalBtn"
                  class="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                  <span>Chia sẻ</span>
                </button>

                <!-- Nút Đóng -->
                <button
                  id="closeBlogModalBtnBottom"
                  class="px-5 py-2 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold hover:bg-indigo-600 dark:hover:bg-slate-200 transition cursor-pointer"
                >
                  Đóng
                </button>
              </div>

            </div>

          </div>

        </div>
      `;

      // Xử lý đóng modal
      const backdrop = document.getElementById('blogDetailModalBackdrop');
      const closeBtnTop = document.getElementById('closeBlogModalBtn');
      const closeBtnBottom = document.getElementById('closeBlogModalBtnBottom');
      const modalLikeBtn = document.getElementById(`modalLikeBtn_${post.id}`);
      const shareBtn = document.getElementById('shareBlogModalBtn');

      function closeModal() {
        if (modalMount) modalMount.innerHTML = '';
      }

      if (backdrop) {
        backdrop.addEventListener('click', function (e) {
          if (e.target === backdrop) closeModal();
        });
      }

      if (closeBtnTop) closeBtnTop.addEventListener('click', closeModal);
      if (closeBtnBottom) closeBtnBottom.addEventListener('click', closeModal);

      if (modalLikeBtn) {
        modalLikeBtn.addEventListener('click', function () {
          // Tìm thẻ button like ở ngoài card nếu có
          const cardLikeBtn = document.querySelector(`.blog-like-btn[data-post-id="${post.id}"]`);
          self.toggleLike(post.id, cardLikeBtn);
        });
      }

      if (shareBtn) {
        shareBtn.addEventListener('click', function () {
          const shareUrl = window.location.origin + window.location.pathname + '#blog?id=' + post.id;
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(shareUrl).then(function () {
              shareBtn.innerHTML = `
                <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                <span class="text-emerald-600 dark:text-emerald-400 font-bold">Đã chép link!</span>
              `;
              setTimeout(() => {
                shareBtn.innerHTML = `
                  <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                  <span>Chia sẻ</span>
                `;
              }, 2000);
            }).catch(function () {
              window.ShopVietState.showToast('Đã lưu đường dẫn bài viết: ' + post.title, 'success');
            });
          } else {
            window.ShopVietState.showToast('Đã lưu đường dẫn bài viết: ' + post.title, 'success');
          }
        });
      }
    }
  };
})();
