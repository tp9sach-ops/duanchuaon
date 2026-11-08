# PHIÊN 74 — Sông + hồ (mục 1/3 của "sông hồ, kiến trúc thêm, suối trong") — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Đọc: PROMPT.md → KE_HOACH_TONG.md → PHIEN59.md (danh sách ưu tiên cảnh) → file này.

## Bối cảnh
ptg (09/11): "Sông hồ, kiến trúc thêm, Suối Trong". Làm TỪNG MỤC: phiên này xong **sông + hồ**; kế tiếp **kiến trúc thêm**, rồi **Suối Trong** (nơi câu thứ 4). Chờ "tiếp tục".

## ĐÃ LÀM
- `js/world/river.js` (MỚI, thuần): **Sông Thác** (`RIVER`: 8 điểm, nửa rộng 1,7 m) chảy ra từ mép hồ chân thác về Tây-Nam, qua góc bãi thác rồi ra rừng (phần xa chỉ để ngắm, nằm ngoài vùng đi bộ); nước = chuỗi hình tròn cách ≤ 1,4 m trong `layout.WATERS` (chặn người). **Cầu đá** `RIVER.bridge` {x 94–98,6, z 114,4–117,8, y 0,45} là chỗ DUY NHẤT qua sông (gắn vào `WATERS` nên `groundY` cho độ cao mặt cầu). **Hồ Rừng** `LAKE` (-112,102) r4,5 trong bãi rừng thông. `registerRiver()` gọi từ `registerOutside()`. Có `smooth` (Chaikin) và `ribbonStrip` (dải 2·hw) dùng chung với cảnh 3D.
- `js/scene/river.js` (MỚI): mặt nước xanh + bờ đá + vệt sáng, đá rải bờ, cầu đá (mặt, thành, 4 trụ), Hồ Rừng (viền đá, lá sen). Gắn vào `buildOutside()` (`js/scene/outside.js`).
- `js/world/minimap.js`: bản đồ nhỏ vẽ cả sông và Hồ Rừng.
- Dời **Tảng đá lớn** (`dalon`, 120 kg) từ (96,114) sang (88,112) vì chỗ cũ rơi xuống lòng sông (`js/world/strength.js`).
- Tests: `tests/river.test.mjs` (6): không khe nước, nối mép hồ thác, giữa sông bị chặn, đi thẳng qua cầu được, độ cao mặt cầu, đầu cầu không vướng tảng đá, Hồ Rừng đi tới mép được; sửa test bản đồ nhỏ (nước > 3). `npm test` **735/735**. `sw.js` = `dgt-v80`.

## CHƯA KIỂM — cần ptg nhìn trên máy thật
- Hình dáng sông/hồ/cầu **chưa nhìn bằng mắt** (không có three.js/WebGL ở đây; chỉ kiểm hình học thuần + cú pháp). Có thể cần chỉnh màu, độ cao nước (0,15) so với nền, bờ đá, tỷ lệ cầu trong `js/scene/river.js`.
- Cầu đá chỉ là hộp phẳng (không vòm). Chưa có câu cá ở sông/hồ (mục Suối Trong kế tiếp sẽ thêm nước câu).
- Phần sông xa (ngoài vùng đi bộ) có thể bị cây/núi che hoặc lệch nền.

## VIỆC KẾ
1. **Kiến trúc thêm** — hỏi ptg chọn loại (cầu đá/cổng tam quan thứ hai, tháp chuông/bảo tháp trên đồi, nhà thủy tạ trên hồ…) nếu chưa nói; gợi ý mặc định: nhà thủy tạ bên Hồ Rừng.
2. **Suối Trong**: nơi câu thứ 4 (`FISH_WATERS` trong `js/world/fishing.js`, loài cá riêng, `js/world/fishingView.js`), có thể dùng chính sông này hoặc suối mới; + cá 3D trong ao riêng.
3. Tu tập/NPC trong Lộ trình, Xếp hạng, bơi–lặn; ptg thử 2 điện thoại (yêu quái chung, ném người).
