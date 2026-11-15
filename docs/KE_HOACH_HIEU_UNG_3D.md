# KẾ HOẠCH HIỆU ỨNG KỸ NĂNG 3D "NHƯ THẬT" (lập Phiên 177, đính chính + viết lại chi tiết Mục 4–7 ở Phiên 183)

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

### Mục 2 — BĂNG THẬT (Hệ thủy: thuy_1, thuy_3, thuy_huyenbang_4 dùng băng; thuy_2, thuy_camlo_4, thuy_tuyet là nước)  ← **Mã viết ở Phiên 180; NỐI VÀO GAME ở Phiên 183** (trước đó `chieuFx.js` chưa gọi `taoBang` nên trong game chưa hiện)
Mô tả: **tinh thể băng 3D** (lăng trụ sáu cạnh nhọn đầu, vật liệu trong mờ ánh xanh, viền sáng), mọc từ mặt đất theo hàng/gai, vỡ thành mảnh khi hết hiệu lực; sương lạnh trôi sát đất; hơi thở trắng; mặt đất đóng băng loang dần (decal phản chiếu); mảnh băng vỡ bay tung kèm lấp lánh.
- Nước (3 chiêu còn lại): cột nước/sóng cuộn (lưới dải uốn), giọt nước rơi bắn tóe, vòng sóng loang, bọt trắng.

**Đã làm (Phiên 180):** `js/world/bang.js` (logic thuần + `tests/bang.test.mjs` 9 test) + `js/scene/fxBang.js` (vẽ), nối ở `chieuFx.js` lớp 2 (`p.he === 'thuy'`, `p.loai` 'bang' → băng, 'nuoc' → nước).
- BĂNG (thuy_1, thuy_3, huyền băng): tinh thể 3D lăng trụ sáu cạnh nhọn đầu (3 tỉ lệ), trong mờ ánh xanh + lõi sáng + viền sáng; mọc từ đất nhanh (vọt nhẹ rồi hạ), đứng, rồi VỠ thành mảnh đa diện (InstancedMesh) bay tung rơi xuống; chiêu bay (tia) có mũi băng xoay ở đầu + gai mọc dọc đường đi; sương lạnh; mặt đất đóng băng loang (nhánh bông tuyết); lấp lánh sao ở ngọn; lúc gồng 3 tinh thể nhỏ xoay quanh người.
- NƯỚC (thuy_2, cam lồ, tuyết): chiêu nổ = 1–3 sóng vành mép cuộn (mặt tròn xoay) + vòng sóng loang trên nền + cột nước bùng lên rồi sập + giọt nước bắn tóe (InstancedMesh) + bọt trắng; chiêu xoay = 2–4 dải nước xoắn ốc (ống 3D) quanh người; kết cấu dòng chảy cuộn liên tục; lúc gồng 3 quầng nước xoay.
- Số vật thể yếu/vừa/cao: tinh thể 5/12/22 · mảnh 0/18/36 · giọt 0/24/48 · sương 0/5/9 · bọt 0/4/7; máy yếu bỏ sương/mảnh/giọt/bọt/mặt đóng băng.

### Mục 3 — KIM LOẠI / SÉT (Hệ kim, 6 chiêu)  ← **Mã viết ở Phiên 181; NỐI VÀO GAME ở Phiên 183**
Đã có: `js/world/kim.js` (+ `tests/kim.test.mjs`), `js/scene/fxKim.js`: vệt chém lưỡi liềm (bay/vòng/tỏa), mảnh kim loại xoay lật + tia lóe, tia sét zích zắc 2 lớp (viền xanh + lõi trắng), vết cắt trên nền. Số vật thể yếu/vừa/cao: liềm 1/3/5 · mảnh 0/10/22 · sét 0/2/4 · lóe 0/5/10.

> **Phát hiện Phiên 183:** các tài liệu Phiên 180–181 ghi Băng/Kim "đã nối", nhưng mã thật `chieuFx.js` chỉ gọi `taoLua`. Đã nối `taoBang` (thủy: băng + nước) và `taoKim` (kim) và thêm test chống quên nối (`tests/kim.test.mjs`, test cuối). Sau Phiên 183: **18/30 chiêu có lớp thân thật** (lửa 6 · băng/nước 6 · kim/sét 6); còn **12 chiêu** (Mộc 6, Thổ 6) vẫn chỉ có hạt + quầng.

### Mục 4 — MỘC (Hệ mộc, 6 chiêu)  ← **KẾ TIẾP**
Chiêu: `moc_1` (tia, lá) · `moc_2` (xoay, lá) · `moc_3` (nổ, sương) · `moc_uminh_4` (nổ, sương) · `moc_anthan_4` (xoay, lá) · `moc_tuyet` (xoay, lá, tuyệt học).
Mô tả hình ảnh (cái phải NHÌN THẤY):
- **Lá 3D thật:** mảnh phẳng cong nhẹ (lưới 2×6 đỉnh, gân giữa sáng, mép răng cưa bằng kết cấu), 3 kiểu (lá thon · lá tròn · lá kim), xanh ngọc → xanh lá → vàng úa theo "tuổi", **xoay lật tự do 3 trục** khi bay, rơi lắc lư như lá thật (lắc ngang theo sin), một số lá cháy sáng viền (bắt ánh).
- **Dây leo mọc từ đất:** ống cong (TubeGeometry, đổi bán kính thon dần) dài ra theo thời gian như mọc thật, có xoắn, mọc **gai nhỏ + chồi lá non** dọc thân; chiêu xoay thì dây quấn xoắn ốc quanh người; chiêu tia thì mọc thành hàng dọc đường đi; hết hiệu lực héo rụt về đất.
- **Hoa nở:** 3–5 bông ở ngọn dây (cánh hoa = 5–6 mảnh tròn xếp quạt, nở từ nụ ra trong ~0,3 s), cộng sáng nhẹ ở nhụy.
- **Bào tử phát sáng:** chấm tròn mềm xanh lục-vàng trôi chậm hướng lên, nhấp nháy lệch pha (cộng sáng).
- **Sương xanh** cho 2 chiêu `suong` (`moc_3`, `moc_uminh_4`): lớp khói mềm xanh nhạt lan sát đất + bào tử dày hơn, không có dây.
- **Nền:** decal cỏ/rêu loang (vòng chồi cỏ nhỏ) tan dần.
Số vật thể yếu/vừa/cao (đề xuất): lá 8/22/40 · dây 0/3/6 · hoa 0/4/8 · bào tử 0/20/40 · sương 0/5/9; máy yếu bỏ dây/hoa/sương/nền.
Việc làm: `js/world/moc.js` (logic thuần: lapMoc, laMoc, dayMoc, hoaMoc, baoTuMoc, suongMoc, nenMoc) + `tests/moc.test.mjs` → `js/scene/fxMoc.js` (vẽ, `taoMoc`) → nối ở `chieuFx.js` (`p.he === 'moc'`) → sửa test nối dây → nâng `sw.js` → `docs/PHIEN184.md` → đẩy GitHub.

### Mục 5 — THỔ (Hệ thổ, 6 chiêu)
Chiêu: `tho_1` (tia) · `tho_2` (xoay) · `tho_3` (hút) · `tho_daidia_4` (xoay) · `tho_hukhong_4` (hút) · `tho_tuyet` (mưa); tất cả loại `da`.
- **Tảng đá 3D:** khối đa diện méo (IcosahedronGeometry bị nắn đỉnh ngẫu nhiên, flat shading), vật liệu đá xám nâu có đổ sáng; **trồi từ đất** (vọt lên rồi lún nhẹ), **rơi** (mưa đá, đập đất bật nảy 1 lần rồi nằm), **bắn văng** khi vỡ; mảnh vụn nhỏ cùng loại.
- **Bụi đất cuộn:** khói nâu trộn thường (không cộng sáng) dày, cuộn lên theo vòng, lắng dần.
- **Nứt nền:** decal nhánh nứt tỏa từ tâm (kết cấu nhánh như băng nhưng đen-nâu, viền sáng cam mờ ở chiêu mạnh), loang ra rồi mờ.
- **Chiêu hút** (`tho_3`, `tho_hukhong_4`): đá + bụi bị hút xoáy vào tâm, tâm sáng sẫm (vòng "hố").
- Số vật thể yếu/vừa/cao (đề xuất): tảng 4/10/18 · mảnh 0/16/32 · bụi 0/6/10.
- Việc làm giống Mục 4: `js/world/tho.js` + test → `js/scene/fxTho.js` → nối `p.he === 'tho'` → test → `docs/PHIEN185.md`.

### Mục 6 — HÀO QUANG & PHẢN ỨNG GIỮA HỆ
- **Bloom thật** cho lõi chiêu (nếu máy cao: một lớp quầng phụ co giãn theo độ sáng; không dùng hậu kỳ nặng).
- **Phản ứng Hệ** (hơi nước khi lửa gặp băng, nổ khi lửa gặp mộc…): hiệu ứng riêng ngắn, cần luật do Gp chốt (hiện chưa có luật phản ứng trong `skillEngine.js`) → **hỏi Gp trước khi làm**.
- **Hiệu ứng trúng đòn theo Hệ** (`chieuTrungFx.js`): thay cầu vàng chung bằng tia lóe/mảnh đặc trưng (lửa bùng, băng vỡ, sét giật, lá xoáy, đá văng).

### Mục 7 — CHỈNH THEO MẮT + TỐI ƯU
- Gp mở Luyện chiêu xem từng Hệ, báo "to/nhỏ, sáng/tối, dày/thưa" → chỉnh số trong `js/world/<hệ>.js`.
- Đo FPS điện thoại thật; gộp Sprite thành InstancedMesh nếu cần; công tắc "Hiệu ứng nhẹ" trong Cài đặt (ăn khớp việc Cài đặt chỉnh cỡ nút ở Phiên 181 mục 3).
- **Môi trường AI không có WebGL/GPU** → mọi số cỡ/độ sáng của Mục 1–5 vẫn là số TẠM; chỉ Gp nhìn bằng mắt mới chốt được.
