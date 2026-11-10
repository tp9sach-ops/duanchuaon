# PHIÊN 92 — Mục 1/3: VÁN TRƯỢT (mua ở Điện Máy, đứng lên ván đi nhanh gấp đôi) — BÀN GIAO

Đọc: PROMPT.md → PHIEN91.md → file này. Nguồn mã thật: repo `tp9sach-ops/duanchuaon`, nhánh `main`.

## Yêu cầu Gp (2026-11-10)
Ba việc, **làm TỪNG MỤC, xong mục nào đẩy GitHub rồi chờ Gp bấm "tiếp tục"**:
1. **Ván trượt**: mua ở Điện Máy Lam Sen, nhân vật đứng lên ván, tốc độ di chuyển nhanh gấp đôi. ← **XONG (phiên này)**
2. **Túi đồ dạng ô có hình vật phẩm** (như các game khác), bỏ kiểu chữ dọc. ← việc kế
3. **Thêm cá vào game** (Gp gửi 3 mô hình: `fish.glb` 0,46 MB, `shiny_fish.glb` 18,3 MB, `pa_shark.glb` 2,4 MB — chưa vào repo; `shiny_fish.glb` rất nặng, cần giảm trước khi dùng).

## Đã làm (mục 1)
- `js/world/board.js` (mới, logic thuần, có test): `BOARD = { gia: 100 hạt sen, mul: 2 }`, `loadBoard`, `buyBoard`, `toggleBoard`, `boardSpeedMul`, `canRide`.
- `js/ui/board.js` (mới): `LGT.board = { own, on, speedMul, shop(), toggle(), status() }`. Ván 3D (mặt cam, 2 vạch xanh, 4 bánh) gắn vào `avatar.group`, nhân vật được nâng 0,1 m khi đứng trên ván. Tự xuống ván khi vào nhà / bơi / bị khiêng / mở bảng. Trạng thái "đã mua" lưu `localStorage['lgt.board']`; mở lại game thì đứng dưới đất.
- **Mua**: nói chuyện với **Nhân viên Điện Máy Lam Sen** (`nvdienmay`, `js/ui/npc.js`) → hộp xác nhận "Mua ván trượt 100 hạt sen?" → trừ bằng `LGT.spendSen`, mua xong tự đứng lên ván.
- **Tốc độ ×2**: `js/world/world.js` nhân thêm `LGT.board.speedMul` (cùng chỗ với `LGT.swim.speedMul`); trên ván nhân vật giữ tư thế đứng (không bước chân).
- **Nút** `vantruot` 🛹 "Lên ván / Xuống ván" trong cụm nút góc phải-dưới (`js/world/dock.js`, `js/ui/dock.js`), chỉ hiện khi đã có ván và đang ở ngoài nhà. Túi đồ có thêm dòng "Ván trượt".
- `sw.js` = `dgt-v98`; `tests/board.test.mjs` (7 bài) đã thêm vào `npm test`.

## Kiểm
- `npm test`: 830/831. Bài đỏ duy nhất là `tests/landpool.test.mjs` ("kích thước hồ khớp mô hình 3D") — **đỏ sẵn từ trước phiên này** (đã thử trên bản gốc), do chuỗi trong `js/scene/land.js` không còn khớp; không liên quan ván trượt.
- Một lỗi thật do test bắt được trong lúc làm (`isObj` trả `null` thay vì `false`) đã sửa.
- **CHƯA xem bằng mắt / chưa chạy trên máy thật** (môi trường này không tải được three.js): kích thước ván, độ nâng 0,1 m, vị trí bánh là số đoán, cần Gp nhìn thử.

## Giới hạn đã biết
- Người chơi khác **chưa thấy** ván của mình (chưa đồng bộ qua mạng); tốc độ ×2 chỉ ở máy mình, nhưng vị trí vẫn gửi như cũ nên họ thấy mình chạy nhanh.
- Giá 100 hạt sen và hệ số ×2 là quy ước, chờ Gp duyệt. Nhảy/Thiết đầu công không đổi theo ván.

## Prompt khởi động cho phiên sau (dán nguyên)
> Đọc PROMPT.md → HANDOFF.md (đầu file) → docs/PHIEN92.md. Repo `tp9sach-ops/duanchuaon`. Mục 1 (ván trượt) đã xong và đã đẩy GitHub. Gp bấm "tiếp tục" → làm **mục 2: Túi đồ dạng ô có hình vật phẩm** (xem `js/ui/bag.js`, `js/world/dock.js` `bagSections`, `js/ui/furni.js` túi đồ trong nhà). Làm một mục, `npm test`, đẩy GitHub, viết docs/PHIEN93.md, rồi CHỜ Gp nói "tiếp tục" mới sang mục 3 (cá).
