# Phiên 144 — Mục 1 (danh sách 13/11 lần 3): đồ đang cầm / cưỡi — Thương · Gậy như ý · Ván trượt

Quy tắc ptg (chép nguyên văn): For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff.

## Yêu cầu ptg (4 mục, làm tuần tự, xong mục nào đẩy GitHub rồi báo)
1. Vật phẩm: Ngọc hồi máu 100 lá (hồi máu ×5, 10 phút), Ngọc dịch chuyển 200 lá (hết máu hồi sinh ngay tại chỗ, 20 phút), Ván trượt 100 lá (hình 3D như ảnh ptg gửi, nhanh hơn thường 0,5 lần), Gậy như ý ở Điện Máy 400 lá (hình như ảnh, sáng, đánh có hiệu ứng lan, +1% sát thương). MẶC ĐỊNH cầm/cưỡi THƯƠNG; mua gậy thì đánh + cưỡi bằng gậy (hai đầu phát sáng chớp chớp khi cầm và khi đánh, bay đẹp hơn); mua ván thì cưỡi ván (ván KHÔNG phải vũ khí, không đánh được); chọn đồ cầm trong Túi đồ.
2. Tu Vi / bồ đoàn Hỏa / chạy nền khi chuyển tab → ĐÃ làm ở Phiên 143 (chưa thử trình duyệt thật).
3. Phó bản (NPC → khu riêng, quái hồi sinh mạnh/to hơn, 9 lượt → boss, rơi đồ, phó bản đã chinh phục mạnh hơn lần sau) → việc kế, từ bước 4d của docs/PHIEN140.md.
4. Mảnh ghép boss → hồ lô → ghép linh thú → gọi/cưỡi, kỹ năng boss tương tác → sau mục 3.

## Đã có từ trước (KHÔNG làm lại): `js/world/items.js` + `js/ui/items.js` (Ngọc hồi máu/dịch chuyển, Gậy như ý, +1%, hồi sinh tại chỗ, hạn dùng theo giờ thật), `js/world/board.js` (ván ×1,5), cửa hàng Kim Hoàn Ngọc Lan / Điện Máy Lam Sen. Số liệu đúng yêu cầu, test đạt.

## Phiên này làm gì (mục 1)
- `js/world/loadout.js` (LOGIC THUẦN) + `tests/loadout.test.mjs` (8 test): `HOLDS` thuong/nhuy/van; chỉ ván `weapon:false`; `chooseHold`, `weaponFor` (cầm ván → đánh bằng vũ khí cầm gần nhất), `mountOf`, `mountMul` (`MOUNT_MUL`: ván 1,5; thương/gậy 1,25 — SỐ TẠM), `rideLabel`.
- `js/ui/loadout.js`: `LGT.loadout = { hold, weapon, mount, owned(), choose(id), refresh(prefer) }`, lưu `lgt.loadout`. Khởi tạo từ `initBoard`. Mua gậy/ván xong tự cầm món đó (`refresh`).
- `js/scene/gear.js` (MỚI, three.js): `buildStaff` (gậy, mỗi đầu có quầng + lõi sáng riêng), `flickerStaff(staff,t,swinging,riding)` (chớp lệch nhịp, đánh thì chớp mạnh/nở to), `buildSpearMount` (thương cưỡi: cán gỗ, lá thương bạc, tua đỏ, quầng xanh), `buildStaffMount`, `buildBoardMesh` (ván đẹp hơn: thân bo tròn, 2 đầu cong, vạch vàng, trục + 4 bánh có moay-ơ, quầng sáng dưới ván). Đã chạy thử dựng mô hình bằng Node + three 0.160 (không lỗi, kích thước hợp lý).
- `js/ui/items.js`: gậy chỉ hiện trên tay khi ĐANG CẦM gậy (đổi về thương thì hiện lại cây côn mặc định); chớp sáng hai đầu; vòng sáng lan khi đánh (3 vòng vàng + 1 vòng cam); +1% chỉ khi cầm gậy.
- `js/ui/board.js` viết lại thân: nút cưỡi dùng đồ đang cầm; thương/gậy cưỡi có chao nhẹ + VỆT SÁNG phía sau; vào trận thì đồ cưỡi bay về tay (giữ hiệu ứng cũ); cầm ván mà vào trận → toast "Ván không phải vũ khí — bạn đánh bằng …".
- `js/world/dock.js`: nút cưỡi hiện cho MỌI người ngoài nhà (mặc định "Cưỡi thương"); nhãn Cưỡi thương / Cưỡi gậy / Lướt ván / Xuống / Xuống ván. `tests/board.test.mjs`, `tests/dock.test.mjs` cập nhật theo.
- `js/ui/bag.js` + `bagIcons.js` (icon `spear`, `staff`) + `css/dock.css`: mục "Đang cầm" đầu Túi đồ (3 ô, ô đang cầm viền vàng + nhãn "Đang cầm"; ô chưa có mờ).
- `package.json` thêm `tests/loadout.test.mjs`; `sw.js` = dgt-v144. `npm test` 1094/1094 (Node 22).

## Quyết định tôi TỰ đặt — ptg duyệt/chỉnh
1. Tốc độ cưỡi thương/gậy ×1,25 (ván giữ ×1,5 như yêu cầu). Muốn khác → sửa `MOUNT_MUL` trong `js/world/loadout.js`.
2. Cầm ván + vào trận: không chặn đánh (sẽ làm hỏng auto-hunt) mà tự dùng vũ khí cầm gần nhất; ván không bao giờ là thứ đánh.
3. Cây thương mặc định trên tay vẫn là cây côn cũ của nhân vật (không đổi mô hình tay); chỉ thương CƯỠI có mũi lá.
4. Mua gậy/ván xong tự cầm món đó.

## CHƯA kiểm / còn thiếu
- ptg nói có gửi ảnh gậy như ý + ván trượt nhưng cuộc trò chuyện này KHÔNG có ảnh → hình dựng theo mô tả chung (gậy đỏ hai đầu đồng sáng; ván cam bánh trắng). Có ảnh thì chỉnh lại màu/kiểu trong `js/scene/gear.js`.
- Chưa nhìn bằng mắt trên trình duyệt thật (gậy trên tay chibi, thương/gậy cưỡi, vệt sáng, ô Đang cầm). Người chơi khác chưa thấy đồ cầm/cưỡi của mình (chưa đồng bộ mạng).
- Chưa có ảnh/hiệu ứng riêng khi đổi đồ cầm (chỉ toast).
- Dòng nhật ký Phiên 144 trong `PROMPT.md` mục 7 CHƯA đẩy lên (file 74 KB, chỉ có công cụ ghi cả file): phiên sau thêm tay một dòng: "2026-11-13 (Phiên 144): đồ cầm/cưỡi Thương·Gậy như ý·Ván, xem docs/PHIEN144.md".

## Việc kế
Mục 2 danh sách 13/11 (Phó bản) từ bước 4d của docs/PHIEN140.md (xem docs/PHIEN143.md), rồi mục 3 (linh thú). Mỗi mục: làm nhỏ, npm test xanh, đẩy GitHub, báo ptg, chờ "tiếp tục".

## Prompt khởi động phiên mới
> Đọc docs/PHIEN144.md, docs/PHIEN143.md, docs/PHIEN140.md. Chỉ xem chỗ cần sửa. Mục 1 (đồ cầm/cưỡi) xong, chờ ptg xem ảnh thật. Làm phó bản từ bước 4d, từng bước nhỏ, npm test xanh, đẩy GitHub rồi báo; cuối phiên viết docs/PHIEN145.md kèm prompt và chép nguyên văn quy tắc ptg ở đầu file này.
