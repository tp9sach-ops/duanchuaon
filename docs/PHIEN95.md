# PHIÊN 95 — Chương 2 cốt truyện "Mảnh chuông Đá" — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Đọc: PROMPT.md → HANDOFF.md (đầu file) → PHIEN94.md → file này. Nguồn mã thật: repo `tp9sach-ops/duanchuaon`, nhánh `main`.

## Yêu cầu Gp (2026-11-10)
Xem repo (có nhiều thay đổi, chỉ đọc chỗ cần), xem lại prompt + cốt truyện để **xây nhiệm vụ khớp cốt truyện**, đóng vai lập trình game chuyên nghiệp làm game chỉnh chu, thu hút hơn. Gp bấm "tiếp tục" → làm **một mục nhỏ** (đúng quy tắc dự án).

## Phát hiện khi rà soát
- Cốt truyện đã duyệt (docs/THIET_KE_CHIEU_SAU.md mục 1): **Đại hồng chung vỡ 3 mảnh Đá/Nước/Lửa; 3 yêu quái hằng tháng là tam độc**. Nhưng **chương 1 chưa hề nhắc tới chuông** và **chương 2–5 chưa có**; 40+ nhiệm vụ còn lại chủ yếu là "ghé nơi" và việc hằng ngày, không gắn cốt truyện.
- Cốt truyện đóng ở bước `done` của chương 1, sau đó người chơi chỉ chạy chuỗi nhiệm vụ rời rạc.

## Đã làm (mục 1: chương 2 "Mảnh chuông Đá")
Chuỗi: **Thầy Trụ trì kể chuyện chuông → hỏi Ông Ba gốc đa → luyện Khinh thân bậc 2 → tới chân vách Đại Phật → báo thầy → nhận mảnh chuông Đá**. Dùng hệ thống SẴN CÓ (NPC, Khinh thân, Đại Phật vách đá), không thêm cảnh 3D.
- `js/world/story2.js` (MỚI, logic thuần): máy trạng thái `hear → elder → train → cliff → report → fin`, sự kiện `talk / khinh / at`, hội thoại 2 NPC theo bước (kể cả lời nhắc khi chưa tới bước), thưởng tạm (10/15/30/40/80 điểm; 1/1/3/3/8 hạt sen), `STORY2_QUESTS` (id `s2-…`), `story2Rows`, `active2`. Chỉ chạy sau chương 1.
- `js/world/nextGoal.js`: nhận `state.story2` + `state.bac`; xong chương 1 thì việc chính = chương 2 (nhãn "Cốt truyện · Chương 2 · Mảnh chuông Đá · n/5"). Thiếu `story2` → hành vi cũ (test cũ không đổi).
- `js/world/questGuide.js`: dẫn đường cho `s2-…` (đi tới NPC / qua làng / ngã ba thác / chân vách Đại Phật), bước chưa tới bị khóa.
- `js/ui/story.js`: trạng thái chương 2 lưu `localStorage 'lgt.story2'`; hộp thoại dùng chung với chương 1; mỗi 0,5 s tự phát hiện **đủ bậc Khinh thân** và **đã tới Đại Phật** (`placesAt`) rồi tiến bước; `LGT.story.state2`, `LGT.story.bac`.
- `js/ui/quest.js`: nhóm "Chương 2 · Mảnh chuông Đá" trong bảng Nhiệm vụ (nút Dẫn đường). `js/ui/guide.js`: truyền `story2`, `bac` cho dẫn đường.
- `js/world/story.js`: 3 câu thoại chương 1 nhắc tới "đại hồng chung vỡ" và hẹn thầy kể chuyện chiếc chuông (không đổi số trang → test chương 1 giữ nguyên).
- `tests/story2.test.mjs` (MỚI, 10 bài, đã thêm vào `npm test`); `sw.js` = `dgt-v103`.

## Kiểm
- `npm test`: **858 tổng, 854 đạt, 4 đỏ — cả 4 đỏ SẴN TỪ TRƯỚC, không do phiên này**: journey "4 trang…" (#312), tutorial "chủ đề mới…" (#756), journey/sức mạnh-yêu quái (#318), landpool "kích thước hồ" (#345). Phiên 94 đã ghi nhận nhóm lỗi này.
- **Đã chạy bằng trình duyệt thật** (Chromium, trang thử tạm đóng vai game, KHÔNG có three.js): đi hết 5 bước từ đầu tới nhận mảnh Đá, đúng thưởng, đúng nhãn thẻ mục tiêu, sau chương 2 thẻ trở về chuỗi hành trình, không lỗi JS.
- **CHƯA xem trong game thật** (môi trường không tải được three.js): chưa thấy hộp thoại/thẻ trên cảnh 3D, chưa thử điện thoại, chưa đi bộ thật tới vách Đại Phật.

## Giới hạn / quyết định cần Gp duyệt
- Số điểm thưởng, bậc 2, tên bước, lời thoại là **quy ước tạm**.
- Mảnh chuông Đá mới chỉ là cờ `shards.da` trong `lgt.story2` (chưa hiện trong túi đồ, chưa đồng bộ Sheet/GAS, sửa localStorage là gian lận được).
- Ông Ba gốc đa (có sẵn) đóng vai "người giữ chuông" tạm; thiết kế gốc có nhân vật "Cụ giữ chuông" riêng, nếu Gp muốn thì thêm NPC mới.
- Chưa có hình ảnh "mảnh chuông" tại vách đá (hiện chỉ báo bằng lời và thông báo khi đứng ở chân vách).

## VIỆC KẾ (từng mục, xong báo, chờ Gp "tiếp tục")
1. Hiện **mảnh chuông Đá** trong Túi đồ + hiệu ứng sáng trên vách Đại Phật khi tới bước `cliff` (`js/scene/daiphat.js`, `js/world/bag…`/`dock.js bagSections`).
2. Chương 3 "mảnh Nước" (câu cá, bơi/lặn, hồ/vịnh) và chương 4 "mảnh Lửa" (thiền) theo `docs/THIET_KE_CHIEU_SAU.md`; nối yêu quái hằng tháng Đá/Nước/Lửa với mảnh chuông (hạ yêu quái cùng loại → thưởng mảnh).
3. Việc tồn từ Phiên 91–94: kỹ năng cầm côn chém khí (đã có `conKhi.js`, cần Gp thử), độ mượt/lag (mục 3 của Phiên 91), 4 test đỏ có sẵn, `gas/Throw.gs` cần Gp cập nhật Apps Script.

## Prompt khởi động cho phiên sau (dán nguyên)
> Đọc PROMPT.md → HANDOFF.md (đầu file) → docs/PHIEN95.md. Repo `tp9sach-ops/duanchuaon`. Chương 2 "Mảnh chuông Đá" (js/world/story2.js) đã xong và đã đẩy GitHub. Gp bấm "tiếp tục" → làm **mục 1 trong "VIỆC KẾ"** của PHIEN95.md (mảnh chuông trong túi đồ + hiệu ứng ở vách Đại Phật). Làm một mục, `npm test` (4 test đỏ có sẵn: #312, #318, #345, #756 — đừng nhầm là lỗi mới), đẩy GitHub, cập nhật PROMPT.md mục 7 + HANDOFF.md + docs/PHIEN96.md, gửi bàn giao, rồi CHỜ Gp nói "tiếp tục".
