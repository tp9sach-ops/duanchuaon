# KẾ HOẠCH HIỆU ỨNG CHIÊU 3D — BẢN V2 (Phiên 201, cập nhật Phiên 202)

> Thay thế docs/KE_HOACH_HIEU_UNG_3D.md. Lý do (ptg, 2026-11-16): hiệu ứng hiện tại là "ô vuông màu" (Sprite canvas phẳng), không giống thật; trừ Thủy, các Hệ còn lại có bộ chiêu quá giống nhau và không liên quan đến Hệ.

## Hiện trạng (đã kiểm mã thật)
- Đã có: nối dây chiêu → chieuFx (heSkill.js, luyenChieu.js), 30 chiêu × 5 kiểu (tia/nổ/xoáy/mưa/hút) × loại (lửa/băng/lá/đá/kim/nước/sương).
- "Thân" chiêu: Hỏa nay dùng khối shader (fxHoa.js, Phiên 202); Thủy băng/nước (fxBang.js) và Kim (fxKim.js) vẫn là Sprite phẳng. Mộc, Thổ chưa có thân (`lua = null`).
- Nền shader/nhiễu đã có từ Phiên 201 (fxGlsl.js, fxShader.js).

## Nguyên tắc
1. KHỐI có thể tích + shader nhiễu fbm theo từng điểm ảnh, không dùng ô vuông/Sprite phẳng.
2. Màu theo vật lý (lửa: than→đỏ→cam→vàng→trắng; băng: trong, khúc xạ, viền sáng; …).
3. Mỗi chiêu có CHỮ KÝ HÌNH ẢNH riêng, đúng Hệ (bảng dưới).
4. Không đèn động; hạt tròn mềm; tôn trọng PERF/giảm chuyển động; máy yếu giảm số hạt.
5. Mỗi mục: nối vào game + trang xem thử để ptg chụp màn hình phản hồi. Không nối khi chưa có nền.

## 12 mục
1. [x] Nền tảng: GLSL (nhiễu, bảng màu lửa), vật liệu shader (khối lửa, khói, hạt, vũng sáng), trang xem thử fx-preview.html, test. (Phiên 201)
2. [x] Hỏa: khối shader trong chieuFx, 6 chiêu theo chữ ký: `js/scene/fxHoa.js` + `js/world/hoaFxMath.js` + `tests/hoafx.test.mjs`; trang xem thử `fx-hoa.html`. (Phiên 202; **CHƯA nhìn bằng mắt** — chờ ptg chụp màn hình trang fx-hoa.html và cảnh trong game)
2b. [x] Túi hồ lô ĐỎ dưới dấu ? — chỉ còn thiếu luật màu CSS (Phiên 186 đã đặt chỗ/đổi tên/vẽ hồ lô nhưng KHÔNG có `.hm-bag`); đã thêm trong `css/hudmenu.css` (Phiên 211), có test, sw dgt-v196. Đã nhìn bằng mắt (dựng riêng cụm nút bằng đúng CSS).
3. [x] Thủy: tinh thể băng thật + nước/sóng có bọt: `js/scene/fxThuy.js`, `js/world/thuyFxMath.js`, `js/world/fxGlslThuy.js`, `fx-thuy.html`, `tests/thuyfx.test.mjs` (Phiên 203; CHƯA nhìn kỹ — xem mục "Nhìn thật" dưới).
4. [ ] Kim: kiếm khí, tấm kim loại, sét, tượng Kim Cang.  ← **MỤC KẾ TIẾP** (chi tiết ở phần "Kế hoạch chi tiết mục 4–8" cuối file)
5. [ ] Mộc: tạo fxMoc.js (mũi tên gỗ, lá, hoa, sương độc, lốc lá, cây ánh sáng).
6. [ ] Thổ: tạo fxTho.js (gai đá, khiên nham, hố trọng lực, giáp đá, nứt đất, núi rơi).
7. [ ] Phản ứng trúng đòn trên quái (cháy, đóng băng, trói, nứt, điện giật).
8. [ ] Đồng bộ thời gian chiêu ↔ hiệu ứng ↔ rung màn hình (kể cả kéo dài mưa thiên thạch quá 0,95 s nếu cần).
9. [ ] Chiêu hỗ trợ + màn Tuyệt Học (điện ảnh).
10. [ ] Hậu kỳ (bloom nhẹ, mờ chuyển động) nếu máy mạnh.
11. [ ] Tối ưu máy yếu (giảm hạt, bỏ fbm tầng cao).
12. [ ] Chỉnh theo phản hồi của ptg.

## Chữ ký hình ảnh 30 chiêu
### Hỏa (đã dựng mã ở Phiên 202)
- hoa_1 Liệt Hỏa Chưởng: cầu lửa sao chổi (đầu to, đuôi thon kéo dài, tia lửa rơi, khói đen sau) · hoa_2 Cuồng Long Phẫn Nộ: áo choàng lửa (vòng lưỡi lửa xoay quanh người) · hoa_3 Hỏa Long Xuất Hải: rồng lửa nhiều đốt uốn lượn, hai sừng lửa · hoa_liethoa_4 Bạo Liệt Hỏa Vũ: mưa thiên thạch rơi chéo, chạm đất bùng cột lửa · hoa_hoalong_4 Long Tức Trảm: hơi thở rồng (tia trắng nóng, cháy sém đất) · hoa_tuyet Liên Hoa Hỏa Thế: sen lửa 9 cánh nở.
### Thủy
- Giáo tinh thể băng · Giọt nước ngọc lơ lửng trong bong bóng · Thảm băng lan có gai · Hào quang xanh lục + sen nước · Xích băng · Sóng thần có bọt.
### Kim
- Nhát chém trăng khuyết bạc · Tấm khiên lục giác xoay · Kỵ binh vàng xung phong · Tượng Kim Cang hộ vệ · Đại kiếm sét xanh nện đất nứt · Kim Cang pháp tướng khổng lồ + vòng ấn.
### Mộc
- Ba mũi tên gỗ phát sáng có bào tử · Áo lá ẩn thân · Sương thơm + hoa nở · Sương độc dày · Lốc lá lướt tới · Cây ánh sáng nghìn lá.
### Thổ
- Gai đá thành hàng · Khiên nham nứt vỡ · Hố trọng lực hút đá · Giáp đá cho đồng đội · Mạch đất nứt phát sáng kéo quái · Núi rơi + sóng xung kích + rung màn hình.

## Chưa kiểm được (môi trường AI không có WebGL)
Mọi hình ảnh và việc biên dịch shader. Trang fx-preview.html (nền) và fx-hoa.html (6 chiêu Hỏa) hiện chữ đỏ nếu shader lỗi; ptg chụp màn hình gửi lại.

---

## Cập nhật Phiên 211 — NHÌN THẬT được rồi + kế hoạch chi tiết mục 4–8

### Phát hiện quan trọng: môi trường AI CÓ chạy được WebGL
Các phiên 165–210 ghi "không có WebGL ở môi trường AI" là SAI: Chromium có sẵn + Playwright chạy WebGL bằng bộ vẽ phần mềm (SwiftShader) với cờ `--use-angle=swiftshader --use-gl=angle --enable-unsafe-swiftshader --ignore-gpu-blocklist`. Chậm (~15–25 khung/s) nhưng đủ để CHỤP ẢNH hiệu ứng thật và bắt lỗi biên dịch shader. Công cụ: `tools/fx-harness.html` + `tools/fx-shot.cjs` (cách chạy ở docs/PHIEN211.md). Từ nay MỖI mục hiệu ứng phải tự chụp ảnh và nhìn trước khi đẩy.

### Ảnh chụp hiện trạng (Phiên 211, bậc máy "cao", ngay sau lúc phát)
- **Hỏa** (fx-hoa.html): shader biên dịch ổn. Sen lửa (hoa_tuyet) ĐẸP, lửa 9 cánh có lõi trắng nóng, tàn lửa, vũng sáng. **Rồng lửa (hoa_3) chưa ổn**: nhìn như chuỗi quả cầu trắng gắn nón, KHÔNG liền thành thân rồng — cần nối các đốt thành thân liên tục (ruy-băng shader) ở mục 12.
- **Kim / Mộc / Thổ** (chạy thật qua `createChieuFx`): chỉ là ĐÁM CHẤM SÁNG trắng/xanh/vàng + vòng lưới kẻ trên đất, KHÔNG có khối 3D nào. Đúng điều ptg phàn nàn ("ô vuông màu, chán, không giống thật"). Thổ Tuyệt (tho_tuyet) gần như chỉ có vòng kẻ trên đất, không có núi/đá.
- Nút Túi hồ lô: đỏ, hình hồ lô, tên "Túi hồ lô", nằm ngay dưới cụm có dấu ? (ảnh chụp).

### Quy ước chung cho Kim / Mộc / Thổ (làm theo mẫu fxHoa.js / fxThuy.js)
Mỗi Hệ = 3 file: `js/world/<he>FxMath.js` (toán thuần + `kieu<He>(id)` + `dem<He>(kieu, tier)`, có test Node), `js/world/fxGlsl<He>.js` (chuỗi GLSL, không import three), `js/scene/fx<He>.js` (`tao<He>(o)` trả `{group, update(t, after, than, gong, pz)}`, null nếu id lạ), + trang `fx-<he>.html` + `js/fxPreview<He>.js` + nối vào `chieuFx.js` (có nhánh dự phòng về bộ cũ) + test vào `npm test` + tăng `sw.js` VERSION. Chụp ảnh từng chiêu ở 3 bậc máy trước khi đẩy.

### MỤC 4 — KIM (6 chiêu): kim loại thật, ánh thép, sét
Vật liệu kim loại bằng shader: pháp tuyến phẳng từng mặt, phản chiếu giả (dải sáng chạy dọc theo góc nhìn — kiểu thép phay), viền Fresnel trắng bạc, màu nền thép xanh lạnh → bạc → trắng ở sống lưỡi. Hoa lửa kim loại (hạt cam–trắng, quỹ đạo cong ngắn) khi chạm. Không có bloom thừa: kim loại phải CÓ KHỐI, chỉ lưỡi và tia sét mới phát sáng.
- **kim_1 Nhát chém trăng khuyết bạc**: lưỡi cung ~120° dày ở giữa nhọn hai đầu (mesh cung tính theo tham số, không phải sprite), sống lưỡi trắng, vệt mờ bạc kéo sau, bay thẳng phía trước, xoay nhẹ quanh trục dọc; khi trúng: tia lóe trắng + 6–10 mảnh kim loại văng.
- **kim_2 Tấm khiên lục giác xoay**: lục giác thép dày có viền vàng nhạt + họa tiết rãnh, lơ lửng trước người, xoay chậm; 2 vòng tấm nhỏ hơn quay ngược chiều; mặt khiên gợn sáng mỗi khi "hấp thụ"; hạt vàng nhỏ quanh viền.
- **kim_3 Kỵ binh vàng xung phong**: 5–7 bóng kỵ sĩ (khối đơn giản có giáo) phát sáng vàng, mờ dần ở đuôi, lao thẳng theo hàng chữ V; bụi vàng + sao chớp dưới móng; sóng xung kích nhẹ ở đầu.
- **kim_kimcang_4 Tượng Kim Cang hộ vệ**: tượng khối (thân, vai, đầu, hai tay chắp/giơ chày) cao ~2,5 m, thép vàng nhám, hiện dần từ nền lên trong vòng ấn tròn; hào quang tròn sau lưng; đứng giữ chỗ suốt hiệu lực.
- **kim_thietky_4 Đại kiếm sét xanh**: thanh đại kiếm dài ~4 m nện từ trên xuống, sét xanh tím phân nhánh quanh thân kiếm (tia gấp khúc đa nhánh, lõi trắng viền xanh), chạm đất: nền nứt tỏa tia + sóng xung kích + hoa lửa.
- **kim_tuyet Kim Cang pháp tướng**: pháp tướng khổng lồ ~8 m hiện sau người (bán trong suốt, ánh vàng), vòng ấn xoay tầng, cột sáng, mưa lá vàng; màn điện ảnh ở mục 9.
Số/hình tạm; chụp ảnh chỉnh: tỷ lệ, độ bóng, độ sáng lưỡi.

### MỤC 5 — MỘC (6 chiêu): gỗ, lá, hoa, bào tử
Vật liệu: vỏ gỗ nâu xanh có vân (nhiễu kéo dọc), lá = mặt phẳng cong có gân (alpha cắt theo hình lá, nhìn thấy hai mặt, rung theo gió), hoa = cánh nhiều lớp, bào tử = hạt tròn mềm xanh vàng nhấp nháy. Màu: xanh lục thẫm → xanh non → vàng nhạt ở đầu mầm. Sương độc: khối khói xanh ngả vàng đục.
- **moc_1 Ba mũi tên gỗ**: 3 mũi tên (thân gỗ, đầu nhọn, 3 cánh lá làm lông) bay chụm rồi xòe nhẹ, phát sáng xanh ở đầu, rải bào tử; cắm vào mục tiêu → nảy chồi.
- **moc_2 Áo lá ẩn thân**: 30–60 chiếc lá xoay quanh người thành vỏ kén, rồi hòa vào nền (người mờ đi) — lá lấp lánh, rơi lại dần.
- **moc_uminh_4 Sương thơm + hoa nở**: sương trắng xanh nhẹ lan tròn, hoa sen/hoa dại nở ra từ nền (cánh mở theo thời gian), phấn vàng bay lên; vùng hồi máu sáng dịu.
- **moc_anthan_4 Sương độc dày**: khối sương xanh đục nhiều lớp cuộn chậm, bọt khí nổi, dây leo gai nhỏ mọc từ nền; mép sương rách theo nhiễu.
- **moc_3 Lốc lá lướt tới**: xoáy trụ nằm ngang gồm trăm lá xoay theo xoắn ốc, thu hẹp ở gốc, nở ở đầu, quét thẳng; lá bay tách ra hai bên.
- **moc_tuyet Cây ánh sáng nghìn lá**: thân cây to mọc từ nền (ống gỗ uốn có vân), cành tỏa, tán lá phát sáng nở dần; hạt sáng rơi như mưa; vùng tròn chữa lành.

### MỤC 6 — THỔ (6 chiêu): đá, nham thạch, bụi, nứt đất
Vật liệu: đá = khối đa diện méo (icosahedron/lăng trụ đã bóp ngẫu nhiên), pháp tuyến phẳng từng mặt, nhiễu bề mặt tối–sáng, mép hơi sáng; nham thạch = đá tối có vết nứt phát sáng cam đỏ nhấp nháy. Bụi: sprite khói nâu vàng nở to chậm, lắng. Mọi chiêu rung màn hình mạnh hơn các Hệ khác.
- **tho_1 Gai đá thành hàng**: 5–9 gai đá nhọn trồi từ nền theo đường thẳng (xa mọc muộn), nghiêng ngẫu nhiên, đá vụn văng, bụi bốc theo từng gai.
- **tho_2 Khiên nham nứt vỡ**: tấm nham thạch cong trước người, vết nứt phát sáng cam, vỡ từng mảng văng ra khi trúng đòn.
- **tho_3 Hố trọng lực hút đá**: hố đen tròn trên nền, viền đá, đá nhỏ bay xoáy lên rồi bị hút vào, bụi cuộn xoáy, méo nhẹ hình nền.
- **tho_daidia_4 Giáp đá cho đồng đội**: các mảng đá bám quanh người xếp thành giáp, rạn sáng vàng nâu, rụng bụi.
- **tho_hukhong_4 Mạch đất nứt kéo quái**: vết nứt dài phát sáng cam–vàng chạy thẳng, hai bên đá trồi lên, vòng hút nhỏ ở đầu kéo quái.
- **tho_tuyet Núi rơi**: một khối núi đá lớn (~5 m, nhiều mặt, đỉnh có tuyết/nham) từ trời rơi chéo, đuôi bụi + lửa ma sát; chạm đất: sóng xung kích tròn, nền nứt tỏa tia, đá văng xa, bụi bốc cao; rung màn hình lớn.

### MỤC 7 — PHẢN ỨNG TRÚNG ĐÒN TRÊN QUÁI
Hiện chỉ có mộc nhân ở Võ đường (`chieuTrungFx.js`). Nối vào quái bãi rừng thật (đọc `LGT.farmView.mons`): Hỏa = lửa bám người quái + khói đen 1,5 s; Thủy = băng phủ dần thành lớp tinh thể, quái chậm lại; Kim = vệt chém sáng + hoa lửa; Mộc = dây leo quấn + bào tử; Thổ = đá vụn bắn + nứt nền dưới chân; kèm số sát thương nổi 600 ms và giật lùi nhẹ.

### MỤC 8 — ĐỒNG BỘ THỜI GIAN
Sát thương hiện tính NGAY lúc bấm; hiệu ứng "phát" sau thời gian gồng. Cần: sát thương + rung màn + khựng + tiếng trúng đúng thời điểm hiệu ứng chạm quái (`g0 + khoảng cách/tốc độ bay`). Mưa thiên thạch (LIFE 0,95 s) kéo dài khi cần.

### Thứ tự làm (mỗi bước xong: chụp ảnh nhìn, `npm test`, đẩy GitHub, báo ptg, chờ "tiếp tục")
Bước 2 = mục 4 Kim → Bước 3 = mục 5 Mộc → Bước 4 = mục 6 Thổ → Bước 5 = sửa rồng lửa (hoa_3) liền thân → Bước 6 = mục 7 → Bước 7 = mục 8 → Bước 8 = mục 9–12.
