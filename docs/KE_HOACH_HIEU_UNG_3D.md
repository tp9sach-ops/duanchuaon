# Kế hoạch thiết kế lại hiệu ứng chiêu thức 3D (Phiên 185 →)

Mục tiêu của ptg: hiệu ứng chiêu thức phải **3D, mượt, nhìn như thật, hoành tráng** — lửa như lửa thật (màu theo nhiệt độ, lan tỏa, bốc khói, tàn lửa), băng như băng thật (trong mờ, nứt, phản chiếu), v.v. — hết cảm giác "ô vuông màu". Chiêu đem ra đánh quái phải thấy hiệu ứng. Nút Túi hồ lô phải đúng chỗ, đúng tên, đúng hình.

## Kết quả kiểm lại repo (15/11, main sau Phiên 184)

- `js/scene/chieuFx.js` đã có đủ 6 lớp (lõi, thân, quầng + vệt, hạt 3 cỡ, decal nền, tàn dư) và bộ vẽ riêng: Hỏa `fxLua.js`, Thủy `fxBang.js` (băng + nước), Kim `fxKim.js` (kim loại + sét). **Hệ Mộc và Hệ Thổ chưa có bộ "thân" riêng** (chỉ có hạt + quầng chung) → nhìn trơ nhất.
- **Nguyên nhân "đánh quái không thấy hiệu ứng"**: `createChieuFx` chỉ được gọi ở `js/ui/luyenChieu.js` (Võ đường luyện chiêu). `js/ui/heSkill.js` (nút chiêu ngoài bãi rừng) chỉ gọi `avatar.cast` = tư thế nhân vật, không dựng hiệu ứng. → **Bước 1 (đã làm).**
- Mọi con số cỡ/độ sáng hiện là TẠM, chưa ai nhìn bằng mắt (môi trường AI không có WebGL). Vì vậy mỗi bước đều cần ptg thử rồi báo "to/nhỏ, sáng/tối, dày/thưa".

## Nguyên tắc đồ họa chung (áp dụng cho mọi Hệ)

1. **Không dùng mặt vuông phẳng.** Mọi thứ là sprite/mesh có **kết cấu mềm (alpha mịn)** hoặc **shader nhiễu**, hòa trộn cộng sáng (additive) cho thứ phát sáng, hòa trộn thường cho khói/bụi/đá.
2. **Shader nhiễu fbm (nhiều tầng nhiễu)** cho lửa/khói/năng lượng: màu đi theo nhiệt độ (lõi trắng ngà → vàng → cam → đỏ sẫm → khói đen), mép lưỡi lửa bị "ăn" theo nhiễu nên rách và uốn như lửa thật; chuyển động nhiễu đi lên + xoáy nhẹ.
3. **Bloom giả bằng quầng cộng sáng** (không dùng đèn động — rẻ cho điện thoại): quầng lớn mờ + quầng nhỏ sáng + tia sao lúc bùng nổ.
4. **Biến dạng nhiệt/sóng chấn** cho chiêu mạnh: vòng sóng giãn nở trên nền, bụi bay theo.
5. **Chiều sâu & kích thước thật:** hiệu ứng có thể tích (nhiều lớp sprite chồng ở các độ cao khác nhau, hạt có phối cảnh), bám đúng chiều cao thân người + đầu quái, đổ "vũng sáng" lên nền.
6. **Ba bậc máy** (cao / vừa / yếu) giữ nguyên: máy yếu bớt lớp + bớt hạt nhưng vẫn đúng hình dáng và màu.
7. Mọi lỗi dựng đều nuốt: hỏng hiệu ứng thì game vẫn chạy (đã có).
8. **Trang xem thử riêng** (`fx-preview.html`, ở Bước 3) để ptg mở lên, chọn chiêu, xoay camera, xem từng hiệu ứng một mình — đỡ phải vào game đánh quái mới thấy.

## Mô tả chi tiết hình ảnh từng Hệ

### Hỏa — lửa thật
- **Lưỡi lửa**: 3–5 lớp sprite shader nhiễu chồng lệch pha, cao thấp bất định, mép rách; lõi trắng ngà rộng ~15 %, giữa vàng cam, ngoài đỏ sẫm trong suốt dần. Lan tỏa: đường kính tăng theo thời gian, ngọn uốn theo "gió" của chiêu.
- **Khói**: sprite xám đen mềm, nở to dần khi bay lên, tan 1–2 s sau khi lửa tắt.
- **Tàn lửa / tia lửa**: hạt nhỏ sáng cam, bay theo quỹ đạo cong, nhấp nháy, rơi tắt.
- **Vũng sáng nền**: quầng cam cộng sáng trên mặt đất + vết cháy sẫm ở decal, tan 3–5 s.
- **Biến thể theo chiêu**: tia lửa dài (phun), cầu lửa (nổ lan), cột lửa xoáy (xoay), mưa lửa (rơi), hút (cuốn vào).

### Thủy — nước và băng
- **Băng**: mảnh tinh thể nhiều mặt (mesh vật lý, trong mờ, độ đục theo độ dày, viền sáng xanh nhạt), nứt rạn khi trúng, "hơi lạnh" trắng xanh bốc dưới đất, bụi băng lấp lánh bay; chiêu mạnh mọc gai băng từ nền lên.
- **Nước**: dải nước mượt có phản chiếu mờ, bọt trắng ở mép, giọt bắn tóe, sóng tròn lan trên nền; vòi nước xoáy có độ sâu màu (xanh đậm lõi → xanh ngọc mép).

### Kim — kim loại và sét
- **Kim loại**: lưỡi/ánh kiếm bạc có vệt sáng chạy dọc (anisotropic giả), tia lóe trắng khi chém, hoa lửa kim loại; mảnh vụn kim loại văng ra rơi có tiếng.
- **Sét**: tia sét gấp khúc đa nhánh (nhánh con sinh theo ngẫu nhiên), lõi trắng + viền tím xanh cộng sáng, nháy màn hình rất ngắn, vết cháy xám trên nền.

### Mộc — gỗ, dây leo, lá
- Dây leo/gai gỗ mọc từ nền lên (mesh dạng ống uốn, vỏ nâu xanh có gân), lá bay xoáy theo hạt, nảy mầm/hoa nở khi chiêu hồi máu, phấn xanh lấp lánh; độc thì sương xanh đục.

### Thổ — đá và bụi
- Đá nhọn/khối đá mọc từ nền (mesh đá có mặt cắt phẳng + nhiễu bề mặt), mảnh đá vỡ văng và rơi nảy, bụi vàng nâu bốc lên dày rồi lắng, nền nứt toác (decal vết nứt phát sáng nhẹ ở chiêu mạnh), sóng chấn làm rung màn.

## Các bước thực hiện (làm từng bước, xong đẩy GitHub rồi báo)

| # | Việc | Trạng thái |
|---|---|---|
| 1 | **Nối hiệu ứng vào đánh quái thật**: `heSkill.js` quay mặt về quái đang nhắm, làm tư thế, dựng `createChieuFx` tại người + quái (đọc từ `LGT.farmView`). Nạp lười, lỗi thì chiêu vẫn đánh. | ĐÃ LÀM (Phiên 185) |
| 2 | **Túi hồ lô**: nút đặt ngay DƯỚI dấu `?` (Trợ giúp) ở cụm phải-trên; màu đỏ; đổi tên "Túi đồ" → "Túi hồ lô"; biểu tượng hồ lô đỏ (SVG) thay hình túi. Sửa `menuLogic.js`, `hudMenu.js`, `css/hudmenu.css`, `tests/menu.test.mjs`. | CHỜ |
| 3 | **Nền tảng đồ họa dùng chung**: thư viện shader nhiễu fbm, kết cấu mềm mới (lưỡi lửa, khói, tinh thể), sprite nhiều lớp có thể tích, + trang xem thử `fx-preview.html`. | CHỜ |
| 4 | **Hỏa** — lửa thật (viết lại `fxLua.js` trên nền Bước 3). | CHỜ |
| 5 | **Thủy** — băng thật + nước thật (viết lại `fxBang.js`). | CHỜ |
| 6 | **Kim** — kim loại + sét thật (viết lại `fxKim.js`). | CHỜ |
| 7 | **Mộc** — bộ "thân" mới (`fxMoc.js`: dây leo, lá, hoa, độc). | CHỜ |
| 8 | **Thổ** — bộ "thân" mới (`fxTho.js`: đá, bụi, nứt nền, sóng chấn). | CHỜ |
| 9 | **Phản ứng trúng đòn trên quái bãi rừng**: giật lùi, cháy/đóng băng/chảy máu độc, số sát thương nổi (nối `chieuTrungFx.js` vào quái thật, hiện chỉ có ở mộc nhân Võ đường). | CHỜ |
| 10 | **Đồng bộ thời điểm**: sát thương + hiệu ứng trúng + rung/khựng đúng lúc khung "phát" của tư thế (hiện sát thương tính ngay lúc bấm). | CHỜ |
| 11 | **Chiêu hỗ trợ + Tuyệt học hoành tráng** (khiên, hồi sinh, ẩn thân, tuyệt học: vòng pháp trận, cột sáng, camera đẩy). | CHỜ |
| 12 | **Chỉnh theo máy + kiểm**: bậc máy yếu, đo số hạt/khung hình, chỉnh số theo phản hồi của ptg. | CHỜ |

## Việc ptg cần làm sau mỗi bước
Mở game (Ctrl+F5 / xóa cache), thử chiêu ngoài bãi rừng (và Võ đường luyện chiêu), báo lại: chiêu nào còn xấu, to/nhỏ, sáng/tối, dày/thưa, có giật không (máy nào). Sau đó nói "tiếp tục" để sang bước kế.
