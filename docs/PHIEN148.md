# Phiên 148 — Mục 2 (danh sách 14/11, bản 4 mục): bồ đoàn Hỏa / Lễ Khai Ngộ / Tu Vi / chuyển tab không đứng

Quy tắc ptg (chép nguyên văn): For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff.

## Yêu cầu ptg (danh sách 4 mục ngày 14/11, làm tuần tự, xong mục nào đẩy GitHub rồi báo, chờ "tiếp tục")
Repo: https://github.com/tp9sach-ops/duanchuaon (nhánh main). Chỉ xem chỗ cần sửa, không đọc hết repo. Cập nhật không được gây lỗi.
1. Tự động đánh: hết máu không dừng, về cổng chùa → XONG (docs/PHIEN147.md, js/ui/farmCombat.js).
2. Bồ đoàn Hỏa không ngồi được (cấp 10 là gia nhập phái); Tu Vi hiển thị ở đâu; chuyển tab game không đứng → XONG phần code (phiên này, xem dưới), CHỜ ptg thử trên máy thật.
3. Phó bản (NPC → khu riêng, quái hồi sinh mạnh/to hơn, 9 lượt → boss, rơi đồ, phó bản đã chinh phục mạnh hơn) → CHƯA LÀM, tiếp từ bước 4d docs/PHIEN140.md (xem thêm docs/PHIEN139.md, js/world/zoneDungeon.js, js/world/dungeon.js, js/ui/dungeonZones.js, js/ui/dungeonPanel.js).
4. Linh thú từ mảnh ghép boss (3 mảnh → ghép → túi hồ lô → gọi/cưỡi/chiến đấu, kỹ năng boss tương tác với người chơi và quái) → CHƯA LÀM.

## Mục 2 — nguyên nhân thật và cách sửa (commit 3a981c8, CHỈ file js/main.js)
Nguyên nhân: Phiên 143 báo đã nối nhưng `js/main.js` trên main KHÔNG còn các dòng nối (có lần upload "Add files via upload" ghi đè lại bản cũ). Hai test của Phiên 143 trong tests/bgtick.test.mjs đã FAIL từ đó (test 3 và 4); sau sửa `npm test` = 1095/1095 xanh.
1. Bồ đoàn Hỏa "không ngồi được": `initKhaiNgo` (js/ui/khaiNgo.js) và `initHeSkill` (js/ui/heSkill.js) không được gọi ở đâu cả → ngồi vào bồ đoàn không hiện bảng Lễ Khai Ngộ, không có thanh chiêu. Sửa: trong main.js, ngay sau `initCompact()`, nạp động hai module rồi gọi `hs.initHeSkill(hudEl, { toast })` TRƯỚC `kn.initKhaiNgo({ toast })` (heSkill đặt `LGT.capHieuDung`, khaiNgo dùng cấp hiệu dụng = max(Tu Vi, cấp công hạnh) nên thấy "Cấp 10" là gia nhập phái được). hudEl = `document.getElementById('hud')`.
2. Chuyển tab thì nhân vật đứng: vòng vẽ `frame()` trong js/scene/index.js có `requestAnimationFrame` và `if (!running) return;` → tab ẩn thì `world.update` KHÔNG chạy (nhân vật không đi, `dash` lao vào quái không tiến). farm.js/farmCombat.js đã dùng bgTick nhưng phần di chuyển thì không. Sửa: trong main.js đăng ký `bgTick.on(...)`: khi `document.hidden` (và không freeCam, không đang chiếu intro) gọi `created.world.update(dt)` chia nhỏ từng bước 0,05 s, tối đa 2 s mỗi nhịp, để không xuyên tường. Không vẽ 3D khi tab ẩn (tiết kiệm pin), chỉ chạy logic.
3. Tu Vi hiển thị: đã có sẵn (Phiên 143) ở js/ui/hud.js — thanh tròn "☯ Tu Vi N · x/y" ngay dưới thẻ nhân vật góc trái-trên (id #tuvi-chip), cập nhật mỗi 0,5 s từ `LGT.farm.tuviInfo`. Cấp "công hạnh" (thanh Cấp trong thẻ) KHÁC với Tu Vi (từ thu phục quái). Chưa xác nhận bằng mắt là chip không bị che bởi js/ui/compact.js.

## Cách ptg thử (trình duyệt thật)
- Vào chánh điện, ngồi vào bồ đoàn Hỏa = bồ đoàn thứ 4 từ trái ở hàng SÁT BÀN THỜ (bên phải lối giữa, sát lối giữa nhất). id `bd04`, x=3,6, z=-41 (js/world/heSeats.js: Kim bd01, Mộc bd02, Thủy bd03, Hỏa bd04, Thổ bd05). Dưới cấp 10: toast "Cần cấp 10 để gia nhập phái…". Từ cấp 10: bảng "Bồ đoàn Hệ Hỏa" với nút Dùng thử / Chọn Hệ này / Đứng dậy; chọn xong có thanh chiêu 3 ô phía trên cụm nút góc phải-dưới, phím 6, 7, 8.
- Bật Tự động hàng yêu, chuyển sang tab khác 30 giây, quay lại: Tu Vi/kinh nghiệm phải tăng, nhân vật đã di chuyển/đánh.

## CHƯA kiểm / còn thiếu
- Chưa thử bằng trình duyệt thật. Safari/iOS có thể đóng băng Web Worker khi tab ẩn → khi đó vẫn đứng. Đóng hẳn tab/trình duyệt thì JavaScript dừng hẳn, không thể chạy tiếp.
- Vòng lặp khác chưa chuyển sang bgTick: js/ui/yeuquai.js (setInterval 50 ms), khaiNgo (setInterval 400 ms, ở tab ẩn chỉ ~1 lần/giây nhưng đủ dùng), animation của NPC/quái (chỉ vẽ khi tab hiện).
- `world.update` khi tab ẩn không gọi `camStep` riêng nhưng update() gọi sẵn camStep nên camera vẫn cập nhật (vô hại).
- Nếu ptg báo "vẫn không ngồi được" dù đã có bảng: kiểm `LGT.world.mode` có thuộc ['sit','meditate'] khi ngồi (js/ui/khaiNgo.js hằng SIT) và `heAt(w.pos)` (HE_SEAT_NEAR = 0,9 m).
- Dòng nhật ký Phiên 145–148 trong PROMPT.md mục 7 chưa thêm (file ~74 KB).
- Không đổi js/sw.js (khác sw.js gốc); sw.js gốc network-first nên không cần tăng VERSION.

## Việc kế
Mục 3: phó bản từ bước 4d (docs/PHIEN140.md): quái thật trong zone phó bản, nối dungeon.enter/onKill/leave, lưu `lgt.dungeon`, hiển thị lượt/boss, rơi vật phẩm, phó bản đã chinh phục mạnh hơn khi quay lại. Làm TỪNG bước nhỏ, `npm test` xanh, đẩy GitHub rồi báo. Sau đó mục 4.

## Prompt khởi động phiên mới
> Đọc docs/PHIEN148.md, docs/PHIEN140.md, docs/PHIEN139.md. Chỉ xem chỗ cần sửa. Mục 1, 2 xong (chờ ptg thử). Làm mục 3 (phó bản) từ bước 4d, từng bước nhỏ, npm test xanh, đẩy GitHub rồi báo; cuối phiên viết docs/PHIEN149.md kèm prompt và chép nguyên văn quy tắc ptg ở đầu file này. Nếu clone được repo (git clone https://github.com/tp9sach-ops/duanchuaon) thì grep/chạy test cục bộ; đẩy file qua công cụ GitHub (gh token có thể hết hạn).
