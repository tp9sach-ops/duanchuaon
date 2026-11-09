// Bảy CHƯƠNG của hành trình (Phiên 60): người chơi luôn biết "đang ở chương nào, việc kế tiếp là gì, còn bao nhiêu để xong chương".
// LOGIC THUẦN (có test: tests/chapters.test.mjs). Thứ tự id trong mỗi chương = thứ tự làm (đi từ gần tới xa, việc cần lá bồ đề để sau).
// Chương 1 là cốt truyện chăm cây bồ đề (js/world/story.js), không có id nhiệm vụ. Mọi nhiệm vụ trong quests.js phải thuộc đúng MỘT chương (test kiểm).
export const CHAPTERS = [
  { id: 'c1', ten: 'Làm quen', mo: 'Gặp chú tiểu, thầy Trụ trì, tưới và ngồi thiền bên cây bồ đề.', ids: [] },
  { id: 'c2', ten: 'Dạo trong chùa', mo: 'Đi hết các nơi trong khuôn viên chùa; thử bay lên bằng Khinh thân.', ids: ['v-chanhdien', 'm-loc', 'v-quanam', 'v-nhato', 'v-vuonthien', 'v-trathat', 'v-gacchuong', 'v-hoca', 'm-khinhthan'] },
  { id: 'c3', ten: 'Tu tập', mo: 'Dâng hương, lạy Phật, thả đèn nguyện, tụng kinh, lần tràng hạt, ngồi thiền.', ids: ['n-nhang', 'n-lay', 'm-den', 'n-kinh', 'm-niem', 'n-thien'] },
  { id: 'c4', ten: 'Ra làng', mo: 'Dạo đường làng, các cửa hàng, chợ, rừng thông, thác nước, Đại Phật vách đá và Thủy tạ bên Hồ Rừng.', ids: ['m-lang', 'v-dienmaylamsen', 'v-didongsenvang', 'v-cho', 'v-kimhoanngoclan', 'm-npc', 'm-rung', 'm-thac', 'v-daiphat', 'v-suoitrong', 'v-thuyta', 'm-dao'] },
  { id: 'c5', ten: 'Gieo duyên', mo: 'Mua quả cầu, câu cá, thả về nước (phóng sinh).', ids: ['m-cau', 'm-phongsinh', 'n-phongsinh'] },
  { id: 'c6', ten: 'An cư', mo: 'Đổi lá bồ đề, mua đất, nâng nhà, bày nội thất.', ids: ['m-doila', 'm-muadat', 'm-nangnha', 'm-noithat'] },
  { id: 'c7', ten: 'Trường kỳ', mo: 'Công phu bền bỉ: nhiều nén hương, nhiều thời kinh, kết thêm bạn đạo.', ids: ['m-nhang', 'm-kinh', 'n-npc'] },
];
/** Thứ tự làm của mọi nhiệm vụ (sau cốt truyện). */
export const CHAIN = CHAPTERS.flatMap((c) => c.ids);
/** Chương chứa nhiệm vụ `id` (đối tượng + số thứ tự n từ 1), hoặc null. */
export function chapterOf(id) { const i = CHAPTERS.findIndex((c) => c.ids.includes(id)); return i < 0 ? null : { n: i + 1, total: CHAPTERS.length, ...CHAPTERS[i] }; }
/** Tiến độ chương theo bảng trạng thái questStatus(): { n, total, ten, mo, done, of }. Chương 1 (cốt truyện) tính theo `storyDone`/`storyOf` nếu có. */
export function chapterProgress(chapter, status, story = null) {
  const rows = chapter.ids.map((id) => status.find((r) => r.q.id === id)).filter(Boolean);
  if (!chapter.ids.length && story) return { n: 1, total: CHAPTERS.length, ten: chapter.ten, mo: chapter.mo, done: story.done, of: story.of };
  return { n: CHAPTERS.findIndex((c) => c.id === chapter.id) + 1, total: CHAPTERS.length, ten: chapter.ten, mo: chapter.mo, done: rows.filter((r) => r.done).length, of: rows.length };
}
