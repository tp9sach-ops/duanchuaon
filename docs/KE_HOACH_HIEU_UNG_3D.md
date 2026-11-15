# KẾ HOẠCH HIỆU ỨNG KỸ NĂNG 3D "NHƯ THẬT" (lập Phiên 177)

> Mục tiêu của Gp: hiệu ứng chiêu hết "ô vuông màu", phải 3D, mượt, giống thật, hoành tráng — lửa như lửa thật (màu, độ lan tỏa), băng như băng thật…
> Làm TỪNG MỤC, xong mục nào đẩy GitHub, báo, chờ "tiếp tục". Số liệu hiện là số TẠM, chưa nhìn bằng mắt (môi trường AI không có WebGL) → Gp thử trong Luyện chiêu rồi báo để chỉnh.

## Hiện trạng (đã làm trước, bỏ qua)
- Phiên 165–173: 30 chiêu, sáu lớp (lõi, thân, quầng+vệt, hạt 3 cỡ, decal nền, tàn dư), âm thanh, vùng cảnh báo. Phiên 174: kẻ địch trúng đòn. Phiên 175: rung/khựng camera. **Phiên 176: kết cấu mềm `fxTex.js`** (hạt tròn, quầng, khói, vệt, sóng chấn, tia sao) → hết hạt vuông.
- Còn thiếu: lớp 2 "thân năng lượng" CHƯA được vẽ; hạt của mọi Hệ vẫn chỉ là chấm tròn → nhìn vẫn như "chấm màu", chưa ra hình lửa/băng/sét/lá/đá.

## Nguyên tắc chung cho mọi mục
1. Mỗi Hệ có **bộ vật thể riêng** (không dùng chung chấm tròn): hình dạng đặc trưng + chuyển động đặc trưng + màu đổi theo "tuổi".
2. Cộng sáng (additive) cho thứ phát sáng; trộn thường (khói, bụi, đá) cho thứ không phát sáng → có chiều sâu thật.
3. Mỗi vật thể **sống một vòng** (sinh → lớn → tắt) với pha ngẫu nhiên cố định → không bao giờ "đều tăm tắp".
4. Ba bậc máy: yếu = ít vật thể, bỏ khói/tàn/vũng sáng; vừa; cao = nhiều + chi tiết. Trần nhẹ cho điện thoại, KHÔNG đèn động.
5. Logic số tách khỏi phần vẽ (`js/world/<hệ>.js` thuần + test; `js/scene/fx<Hệ>.js` vẽ). Lỗi vẽ bị nuốt, game vẫn chạy.
6. Mỗi mục: viết logic + test → nối vào `chieuFx.js` → chạy test → nâng `sw.js` → viết `docs/PHIENxxx.md` → đẩy `main` → báo Gp.

## Các mục (làm theo thứ tự)

### Mục 1 — LỬA THẬT (Hệ hỏa, 6 chiêu)  ← **XONG ở Phiên 177**
Mô tả: lửa thật là nhiều **lưỡi lửa hình giọt** chồng nhau, mỗi lưỡi: sinh ở gốc (trắng vàng nóng) → bốc lên, thon dần → cam → đỏ sẫm → mờ; đung đưa và nhấp nháy khác pha nhau; phía trên có **khói đen mỏng**; xung quanh **tàn lửa** bay lên rồi tắt; mặt đất có **vũng sáng cam** nhấp nháy.
- Kết cấu lưỡi lửa vẽ bằng canvas: đốm đỏ ngoài → cam → vàng → lõi trắng, 3 kiểu khác nhau, mũi nhọn lên.
- Quả cầu lửa (chiêu bay `tia`): đầu cháy to + đuôi lửa rải dọc đường bay nhỏ dần.
- Cột lửa bùng (`no`), lốc lửa xoáy quanh người (`xoay`), mưa sao băng lửa rơi rồi cháy tại chỗ (`mua`).
- Lúc gồng: vài lưỡi lửa nhỏ bốc ở người, to dần theo độ sáng lõi.
- Số lưỡi/khói/tàn: yếu 6/0/0 · vừa 14/5/24 · cao 26/9/48.
- File: `js/world/lua.js` (+ `tests/lua.test.mjs`), `js/scene/fxLua.js`, nối ở `js/scene/chieuFx.js`.

### Mục 2 — BĂNG THẬT (Hệ thủy: thuy_1, thuy_3, thuy_huyenbang_4 dùng băng; thuy_2, thuy_camlo_4, thuy_tuyet là nước)  ← **XONG ở Phiên 180**
Mô tả: **tinh thể băng 3D** (lăng trụ sáu cạnh nhọn đầu, vật liệu trong mờ ánh xanh, viền sáng), mọc từ mặt đất theo hàng/gai, vỡ thành mảnh khi hết hiệu lực; sương lạnh trôi sát đất; hơi thở trắng; mặt đất đóng băng loang dần (decal phản chiếu); mảnh băng vỡ bay tung kèm lấp lánh.
- Nước (3 chiêu còn lại): cột nước/sóng cuộn (lưới dải uốn), giọt nước rơi bắn tóe, vòng sóng loang, bọt trắng.

**Đã làm (Phiên 180):** `js/world/bang.js` (logic thuần + `tests/bang.test.mjs` 9 test) + `js/scene/fxBang.js` (vẽ), nối ở `chieuFx.js` lớp 2 (`p.he === 'thuy'`, `p.loai` 'bang' → băng, 'nuoc' → nước).
- BĂNG (thuy_1, thuy_3, huyền băng): tinh thể 3D lăng trụ sáu cạnh nhọn đầu (3 tỉ lệ), trong mờ ánh xanh + lõi sáng + viền sáng; mọc từ đất nhanh (vọt nhẹ rồi hạ), đứng, rồi VỠ thành mảnh đa diện (InstancedMesh) bay tung rơi xuống; chiêu bay (tia) có mũi băng xoay ở đầu + gai mọc dọc đường đi; sương lạnh; mặt đất đóng băng loang (nhánh bông tuyết); lấp lánh sao ở ngọn; lúc gồng 3 tinh thể nhỏ xoay quanh người.
- NƯỚC (thuy_2, cam lồ, tuyết): chiêu nổ = 1–3 sóng vành mép cuộn (mặt tròn xoay) + vòng sóng loang trên nền + cột nước bùng lên rồi sập + giọt nước bắn tóe (InstancedMesh) + bọt trắng; chiêu xoay = 2–4 dải nước xoắn ốc (ống 3D) quanh người; kết cấu dòng chảy cuộn liên tục; lúc gồng 3 quầng nước xoay.
- Số vật thể yếu/vừa/cao: tinh thể 5/12/22 · mảnh 0/18/36 · giọt 0/24/48 · sương 0/5/9 · bọt 0/4/7; máy yếu bỏ sương/mảnh/giọt/bọt/mặt đóng băng.

### Mục 3 — KIM LOẠI / SÉT (Hệ kim, 6 chiêu)
Mô tả: **vệt chém hình lưỡi liềm** thon (dải cong, sáng giữa mờ mép), tia lóe kim loại, mảnh kim loại xoay lấp lánh, tia sét/điện chạy zích zắc (dải gấp khúc phát sáng, nhấp nháy), vết cắt trên nền.

### Mục 4 — MỘC (Hệ mộc, 6 chiêu)
Mô tả: **lá 3D** (mảnh phẳng cong, xoay tự do khi bay), dây leo mọc từ đất (ống cong dần dài ra), bào tử phát sáng xanh trôi chậm, hoa nở; khói/sương xanh.

### Mục 5 — THỔ (Hệ thổ, 6 chiêu)
Mô tả: **tảng đá 3D** (khối đa diện méo, đổ bóng) trồi lên/rơi xuống/bắn văng, bụi đất cuộn dày (khói nâu), nứt nền lan tỏa (decal vết nứt), rung nền.

### Mục 6 — HÀO QUANG & PHẢN ỨNG GIỮA HỆ
Mô tả: quầng sáng "bloom" thật cho lõi chiêu, phản ứng giữa Hệ (hơi nước khi lửa gặp băng, nổ khi lửa gặp mộc…) có hiệu ứng riêng, hiệu ứng trúng đòn theo Hệ (`chieuTrungFx.js`: tia lóe/sóng chấn đổi theo Hệ thay vì cầu vàng chung).

### Mục 7 — CHỈNH THEO MẮT + TỐI ƯU
Mô tả: Gp xem từng Hệ, báo cỡ/độ sáng/độ dày; chỉnh số; đo FPS điện thoại; gộp Sprite thành InstancedMesh nếu cần; công tắc "hiệu ứng nhẹ" trong Cài đặt.
