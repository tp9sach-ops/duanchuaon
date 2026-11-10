# PHIÊN 93 — Mục 2/3: TÚI ĐỒ DẠNG Ô CÓ HÌNH VẬT PHẨM — BÀN GIAO

Đọc: PROMPT.md → PHIEN92.md → file này. Nguồn mã thật: repo `tp9sach-ops/duanchuaon`, nhánh `main`.

## Yêu cầu Gp (2026-11-10)
1. Ván trượt — XONG (PHIEN92.md). 2. **Túi đồ hiện hình ảnh vật phẩm, dạng ô như các game khác, không dạng chữ dọc.** ← **XONG (phiên này)**. 3. **Thêm cá vào game** ← việc kế (Gp đã gửi 3 file glb: `fish.glb` 0,46 MB, `shiny_fish.glb` 18,3 MB, `pa_shark.glb` 2,4 MB; chưa có trong repo).

## Đã làm
- `js/world/dock.js`: `bagSections` mỗi hàng thêm `ic: { k, c }` (loại hình + màu) và `n` (số lượng); hàng chưa có đồ là `trong: true` (chỉ là lời gợi ý). Thêm `BAG_ICON_KINDS` (28 loại: sen, la, orb, fish, turtle, squid, power, wing, house, board + 18 loại nội thất của `FURNITURE.kind`). Quả cầu có màu theo loại; cá/rùa/mực có màu theo loài (loài hiếm màu vàng).
- `js/ui/bagIcons.js` (mới): `icon({k,c})` vẽ SVG 48×48 bằng `createElementNS` (không tải ảnh, không innerHTML); loại lạ → ô dấu hỏi.
- `js/ui/bag.js` (viết lại): lưới 4 cột, mỗi vật phẩm một ô (hình + tên + số lượng ở góc), ô trống lấp cho đủ hàng, bấm ô → dòng chi tiết dính ở đáy bảng. Mục chưa có đồ hiện lời gợi ý dưới lưới.
- `js/ui/furni.js`: túi đồ trong nhà (tab Túi đồ · sửa nhà), mục "Chưa đặt" có hình món đồ ở đầu mỗi dòng. Danh sách "Đã đặt trong nhà" giữ nguyên.
- `css/dock.css`: kiểu lưới ô (`.bg-grid`, `.bg-cell`, `.bg-n`, `.bg-nm`, `.bg-detail`...).
- `sw.js` = `dgt-v99`. Test mới `tests/bag.test.mjs` (4 bài, đã thêm vào `npm test`); `tests/dock.test.mjs` sửa 1 chỗ cho khớp trường mới.

## Kiểm
- `npm test`: 834/835. Bài đỏ duy nhất là `tests/landpool.test.mjs` — **đỏ sẵn từ trước** (đã thử trên bản gốc), không liên quan.
- **Đã xem bằng mắt** trong Chromium không đầu: dựng bảng với đủ 73 vật phẩm (cầu, 15 loài cá/rùa/mực, nội thất) ở khổ điện thoại 430 px — hình đúng, số lượng đúng, không lỗi console. Sửa 1 lỗi hình hoa sen bị cắt cánh.
- **CHƯA chạy trong game thật** (không tải được three.js ở môi trường này): chưa thấy bảng trên nền cảnh 3D, chưa thử chạm trên điện thoại thật.

## Giới hạn đã biết
- Hình là vẽ bằng SVG đơn giản (không phải ảnh chụp mô hình 3D). Muốn đẹp hơn: dùng ảnh chụp từ khung xem 3D `js/ui/preview.js` (cửa hàng nội thất đã có), làm ở phiên sau nếu Gp muốn.
- Bảng túi đồ chưa có sắp xếp/lọc; Túi đồ trong nhà vẫn là danh sách có nút Đặt/Cất (cần thao tác, nên chưa chuyển sang ô).

## Prompt khởi động cho phiên sau (dán nguyên)
> Đọc PROMPT.md → HANDOFF.md (đầu file) → docs/PHIEN93.md. Repo `tp9sach-ops/duanchuaon`. Mục 1 (ván trượt) và 2 (túi đồ dạng ô) đã xong, đã đẩy GitHub. Gp bấm "tiếp tục" → làm **mục 3: thêm cá vào game** từ 3 file glb Gp gửi (`fish.glb`, `shiny_fish.glb` 18 MB cần giảm, `pa_shark.glb`); xem `js/scene/fishing.js`, `js/scene/pondFish.js`, `js/scene/glbprops.js`, `js/world/pondFish.js`. Làm xong `npm test`, đẩy GitHub, viết docs/PHIEN94.md.
