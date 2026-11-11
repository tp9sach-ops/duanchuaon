# PHIÊN 96 — Mảnh chuông Đá: Túi đồ + hiệu ứng ở vách Đại Phật — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Đọc: PROMPT.md → HANDOFF.md (đầu file) → PHIEN95.md → file này. Nguồn mã thật: repo `tp9sach-ops/duanchuaon`, nhánh `main`.

## Yêu cầu Gp
"Tiếp tục" → làm mục 1 trong "VIỆC KẾ" của PHIEN95.md (mảnh chuông Đá trong Túi đồ + hiệu ứng sáng ở vách Đại Phật).

## Đã làm
- **Túi đồ** có mục mới **"Mảnh chuông Diệu Giang"** (cuối danh sách): 3 ô Đá / Nước / Lửa. Chưa có → ô xám mờ, n=0, lời gợi ý ("tìm ở vách Đại Phật…", "sẽ mở ở chương sau"); đã có Đá → ô màu đá. Mã: `js/world/dock.js` (`bagSections` nhận `ctx.bell = {da,nuoc,lua}`, thêm loại hình `bell` vào `BAG_ICON_KINDS`), `js/ui/bagIcons.js` (hình chuông SVG), `js/ui/bag.js` (truyền `LGT.story.state2.shards`).
- **Cảnh 3D**: `js/scene/daiphat.js` thêm mảnh chuông đá lơ lửng, tỏa sáng nhịp thở + vòng sáng xoay, đặt trước chân vách (`manh-chuong-da`); `root.userData.tickShard(t, on)` gọi mỗi khung từ `outside.update` (`js/scene/outside.js`). Chỉ hiện khi chương 2 đang ở bước `cliff` hoặc `report`. Không thêm đèn (không tốn hiệu năng); dùng RingGeometry vì test `daiphat.test.mjs` cấm `TorusGeometry`.
- Test: `tests/bag.test.mjs` +1 bài; `tests/dock.test.mjs` cập nhật danh sách mục Túi đồ (mục mới ở cuối). `sw.js` = `dgt-v104`.

## Kiểm
- Đã dựng cảnh Đại Phật THẬT bằng three.js 0.160.1 (tải qua npm) trong Chromium (SwiftShader) và chụp ảnh: mảnh chuông hiện đúng chỗ, tắt/bật đúng; 4 ô chuông (đá, chưa có, nước, lửa) vẽ đúng. Không lỗi console.
- `npm test`: **859 tổng, 855 đạt, 4 đỏ có sẵn (nay đánh số #313, #319, #346, #757) — không do phiên này**.
- **CHƯA xem trong game thật** (toàn cảnh cùng ánh sáng/ngày đêm, điện thoại thật). Mảnh chuông chưa phản ứng khi người chơi bước lại gần (hiện chỉ báo khi đứng trong vùng Đại Phật).

## Giới hạn
- Mảnh Nước/Lửa chỉ là ô mờ "sắp có" cho tới khi làm chương 3, 4. Dữ liệu vẫn lưu cục bộ (`lgt.story2`).
- Trạng thái "đã có Đá" không đồng bộ Sheet/GAS.

## VIỆC KẾ (từng mục, xong báo, chờ Gp "tiếp tục")
1. **Chương 3 "mảnh Nước"** theo `docs/THIET_KE_CHIEU_SAU.md`: dùng hệ thống câu cá / bơi lặn có sẵn (`js/world/fishing.js`, `swim.js`); nối yêu quái hằng tháng cùng loại với mảnh (`js/world/yeuquai.js`, `YQ_ORDER = da/nuoc/lua`). Cần Gp chọn: mảnh Nước đạt bằng câu một con cá đặc biệt, bơi lặn lấy ngọc, hay hạ yêu quái Nước.
2. Việc tồn: kỹ năng cầm côn chém khí (Gp thử `js/world/conKhi.js`), độ mượt/lag (Phiên 91 mục 3), `gas/Throw.gs` Gp cập nhật Apps Script, 4 test đỏ có sẵn.

## Prompt khởi động cho phiên sau (dán nguyên)
> Đọc PROMPT.md → HANDOFF.md (đầu file) → docs/PHIEN96.md. Repo `tp9sach-ops/duanchuaon`. Chương 2 "Mảnh chuông Đá" đã xong hẳn (logic + túi đồ + hiệu ứng vách Đại Phật) và đã đẩy GitHub. Gp bấm "tiếp tục" → hỏi Gp chọn cách lấy mảnh Nước (xem VIỆC KẾ 1) rồi làm chương 3. Làm một mục, `npm test` (4 test đỏ có sẵn #312, #318, #345, #756), đẩy GitHub, cập nhật PROMPT.md mục 7 + HANDOFF.md + docs/PHIEN97.md, gửi bàn giao, rồi CHỜ Gp nói "tiếp tục".
