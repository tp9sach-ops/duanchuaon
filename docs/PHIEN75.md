# PHIÊN 75 — Kiến trúc thêm: Nhà Thủy tạ Hồ Rừng (mục 2/3) — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Đọc: PROMPT.md → KE_HOACH_TONG.md → PHIEN74.md → file này.

## ĐÃ LÀM
- `js/world/river.js`: `THUY_TA` — sàn gỗ 4,4×4,4 m nhô ra giữa Hồ Rừng (cao 0,4), lối gỗ rộng 2 m từ bờ Đông, 4 trụ mái (vật cản tròn r0,25). Sàn + lối gỗ đăng ký làm "cầu" của hồ nên đi được trên mặt nước; phần nước còn lại vẫn chặn.
- `js/scene/river.js` (`buildThuyTa`): sàn + lối gỗ, 4 trụ sơn đỏ, thành thấp 3 phía (chừa phía Đông), xà ngang, mái ngói bốn góc (hình chóp), nút nóc, đèn lồng, ghế dài.
- Nơi mới **'thuyta' — Thủy tạ Hồ Rừng** (`PLACES`, r3,2): nhiệm vụ `v-thuyta` (10 điểm + 1 hạt sen) trong chương c4 "Ra làng", Lộ trình (hướng dẫn chỉ đường + biểu tượng 🏮), nhãn bản đồ nhỏ "Thủy tạ", điểm Dẫn đường `PLACE_STAND` giữa sàn.
- Tests: `tests/river.test.mjs` +1 (đi từ bờ ra giữa sàn, trụ chặn, mép sàn là nước, 'đã ghé'), sửa 1 (điểm nước hồ). `npm test` **736/736**. `sw.js` = `dgt-v81`.

## CHƯA KIỂM — cần ptg nhìn máy thật
Hình dáng thủy tạ (mái, màu, tỷ lệ so với hồ/người) chưa nhìn bằng mắt (không có WebGL ở đây). Chỉnh trong `js/scene/river.js`.

## VIỆC KẾ
**Suối Trong** (mục 3/3): nơi câu thứ 4 (`FISH_WATERS` trong `js/world/fishing.js`, loài cá riêng, `js/world/fishingView.js`, giá/kho cá), + cá 3D trong ao riêng; gợi ý đặt suối bên bãi rừng/thác, dùng lại sông hoặc suối nhỏ mới. Rồi: Tu tập/NPC trong Lộ trình, Xếp hạng, bơi–lặn; ptg thử 2 điện thoại (yêu quái chung, ném người).
