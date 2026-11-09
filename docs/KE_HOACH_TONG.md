# KẾ HOẠCH TỔNG — DIỆU GIANG TỰ (tạo ở Phiên 46 từ "docs/PORMT TỔNG")

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Cách dùng: làm mục [ ] đầu tiên, xong báo ptg, CHỜ "tiếp tục". Luật chi tiết ở `docs/PORMT TỔNG` mục 3–4. Trạng thái đã đối chiếu với MÃ THẬT (main sau Phiên 46).

## Giai đoạn 0 — Kiểm trạng thái
[x] 0.1 Đã làm ở Phiên 46: clone repo, `npm test` 575/575 (Node 22). Node 20 CHƯA chạy lại ở Phiên 46 (phiên 40 đã đạt trên cả hai). Kết quả các mục "CHƯA RÕ" ghi trực tiếp bên dưới.

## Giai đoạn 1 — Câu cá, quả cầu, phóng sinh
[x] 1.1 (3b) Bảng Câu cá + mua/chọn/sửa cầu: `js/ui/fishing.js`, `css/fishing.css`, nút `cauca` ở cụm phải-trên. Phiên 45 viết; **Phiên 46 sửa lỗi tải nhầm thư mục** (xem docs/PHIEN46.md).
[x] 1.2 (3c) ĐÃ LÀM Ở PHIÊN 48 (xem docs/PHIEN48.md; CHƯA nhìn trên trình duyệt thật). Cảnh 3D câu cá `js/scene/fishing.js` (cầu bay, vòng sóng, bóng cá giây 4, phao nhún, hoa sen đúng cửa sổ `orb.cua`); đọc `LGT.fishing.session`; nối `js/scene/index.js`; tôn trọng reduced-motion + PERF. CHƯA có file.
[x] 1.3 (3d dạng chữ) Thu cá / Phóng sinh / Ao cá: nằm trong `js/ui/fishing.js`. (Hình 3D của ao cá riêng: chưa, không bắt buộc.)
[x] 1.4 (3e) ĐÃ LÀM Ở PHIÊN 47 (xem docs/PHIEN47.md). Nhiệm vụ + hướng dẫn: `'cau'`, `'phongsinh'` vào `EVENT_TYPES` (quests.js), QUESTS `m-cau`/`m-phongsinh`/`n-phongsinh`, CHAIN (nextGoal.js), gọi `LGT.act('cau')`/`LGT.act('phongsinh')` trong ui/fishing.js, sửa `js/world/tutorial.js` dòng ~44 "Phóng sinh — sắp có" thành thật, cập nhật test đếm cứng. Hiện KHÔNG có chỗ nào gọi act câu cá/phóng sinh.
[x] 1.5 ĐÃ LÀM Ở PHIÊN 49 (xem docs/PHIEN49.md): bấm Lạy Phật trong chánh điện → `LGT.merit.reward('lay', DEN_MERIT.lay)` (1 hạt sen/lần, trần 10 lần/ngày; số 1 là GIÁ TRỊ TẠM, ptg chưa chốt). CHƯA nhìn trên trình duyệt thật.

## Giai đoạn 2 — Dọn lỗi nhỏ
[x] 2.1 ĐÃ SỬA Ở PHIÊN 47: `js/world/minimap.js` hồ cá `x: 56` → `x: 60` (= `KOI.x`).
[x] 2.2 Test lỗi thoáng qua (Phiên 43 gặp 1 lần). Phiên 49–50 chạy thêm 3 lần liên tiếp: 585/585 đạt cả 3, không thấy lỗi thoáng qua (Node 22; Node 20 chưa chạy). Nếu gặp lại thì ghi tên test đỏ.
[x] 2.3 ĐÃ XÓA Ở PHIÊN 59 (ptg đồng ý). Danh sách cũ: (3 file `js/fishing.js`, `js/hudMenu.js`, `js/menuLogic.js` đã được Phiên 48 xóa) `phien26.patch`, `PHIEN31.md`, `PHIEN33.md`, `landscape.js` (gốc), `docs/PHIEN42_BAN_GIAO (2).md`, `docs/PHIEN42_BAN_GIAO (3).md`. `HANDOFF.md` gốc đã cũ (chỉ giữ để tra). Đã hết file lạc `js/fishing.js`, `js/hudMenu.js`, `js/menuLogic.js` (Phiên 46 chuyển đúng chỗ).

## Giai đoạn 3 — Nhà và nội thất
[ ] 3.1 Thử Chromium: vào/ra 4 cấp nhà, nút #house-btn không che menu điện thoại, camera trong phòng. (ptg thử trên máy thật.)
[ ] 3.2 Nâng hình PHẦN TRONG PHÒNG (shell() trong js/scene/interior.js) — HỎI ptg trước.
[x] 3.3 Xoay vật phẩm bằng kéo chuột trong khung xem 3D: ĐÃ CÓ (`js/ui/preview.js` có pointerdown/drag).
[ ] 3.4 Nhiệm vụ Tâm trí Vipassana — thiết kế ở `docs/PHIEN42_BAN_GIAO (5).md` (file này KHÔNG còn trong repo; chỉ còn bản (2),(3)). XIN ptg duyệt thiết kế trước khi viết mã.

## Giai đoạn 4 — Cốt truyện và nhiệm vụ
[ ] 4.1 Chương 2 cốt truyện — HỎI ptg ý chính.
[ ] 4.2 Nhiệm vụ "thử Khinh thân bậc 1" (cần nhận biết nhảy; `js/ui/skill.js`, `js/world/skills.js`).
[x] 4.3 ĐÃ LÀM Ở PHIÊN 51 (xem docs/PHIEN51.md): nhiệm vụ `m-noithat` “Đặt món nội thất đầu tiên” (sự kiện `noithat` phát từ `js/ui/furni.js` khi đặt thêm món; có dẫn đường Cửa hàng → Túi đồ; vào CHAIN sau `m-nangnha`). CHƯA thử trên trình duyệt thật.

## Giai đoạn 5 — Game thế giới mở (Master Prompt)
[x] 5.1 Nhạc nền thử phát khi tải trang + lời mời + thanh âm lượng + ghi nhớ: ĐÃ CÓ (`js/ui/soundLogic.js`, `initSound` ở main.js; Phiên 31).
[x] 5.2 Khinh công bậc 2–8: ĐÃ LÀM Ở PHIÊN 52 (xem docs/PHIEN52.md): luyện bằng cấp độ + hạt sen qua bảng "Luyện Khinh thân". Chưa có parkour (không bắt buộc). CHƯA thử trên máy thật.
[ ] 5.3 Bơi, lặn: CHƯA có.
[~] 5.4 Cấp độ + nhiệm vụ: có (quests.js, 10 cấp). Xếp hạng/"Bảng vàng"/"Mua công đức": nút Xếp hạng còn "sắp có".
[~] 5.5 Thời trang: có đồng phục 9 Sạch (Phiên 14d); chưa có cửa hàng thời trang.
[ ] 5.6 Xe: CHƯA có.
[~] 5.7 Bản đồ: có khu ngoài chùa, thác, hồ cá, rừng (Phiên 17+); "nhà trong rừng"/"vách đá Đại Phật" chưa kiểm kỹ.
[~] 5.8 Ba cửa hàng: đã có `didong.js`, `dienmay.js` ("Điện Máy Lam Sen"), `kimhoan.js`, `store9sach.js`, `tachhoa.js` dựng bằng mã, tên gọi riêng. Cần hỏi ptg: có đủ 3 cửa hàng theo master prompt chưa (TGDD/ĐMX/PNJ hay tên riêng).

## Giai đoạn 6 — Xã hội và máy chủ
[ ] 6.1 Tham quan nhà người khác + tiệc + lưu nhà lên Firebase: CHƯA có (không thấy `houses/` trong firebase/database.rules.json hay mã).
[ ] 6.2 Máy chủ xác nhận lá/đất/nâng nhà: CHƯA có.
[x] 6.3 Thùng công đức (QR MoMo/VietinBank + sao chép số tài khoản + hạt sen sau khi Gp duyệt trong 24 giờ): ĐÃ LÀM Ở PHIÊN 80 (docs/PHIEN80.md). Không dùng cổng thanh toán thương mại; duyệt thủ công trong sheet Donations. CẦN Gp cập nhật GAS + duyệt tỉ lệ 1.000đ = 1 hạt sen.

## Giai đoạn 7 — Tồn đọng cũ
[ ] 7.1 Nhạc thư viện O2 (3 tệp CC rõ giấy phép + ghi công).
[ ] 7.2 Icon SVG tự vẽ cho lưới nút (một phần đã có trong hudMenu.js `P`).
[ ] 7.3 Hai bảng cạnh tượng Phật (Bảng vàng, Mua công đức).
[ ] 7.4 Tử vi/hành tinh còn thiếu — khi ptg yêu cầu.

## Giai đoạn 8 — Hoàn thiện
[ ] 8.1 PERF/FPS máy yếu, ảnh ngày mưa, responsive điện thoại thật.
[ ] 8.2 QA cuối: test xanh Node 20+22, Pages xanh, README, dọn file thừa.

## Ghi chú Phiên 55
- Tài khoản nhân vật (Phiên 53–55): lỗi `blocked` ở màn đặt mật khẩu đang chờ Gp thử đường dự phòng form+khung (docs/PHIEN55.md). `npm test` 647/647.

- Câu cá (Phiên 56): thêm phím Cách/Enter để bấm + thu cầu khi rời mặt nước (docs/PHIEN56.md). Đang chờ ptg quyết: tặng cầu gỗ cho người mới? thêm Suối Trong? `npm test` 650/650.
- Phiên 57: Cầu Gỗ bán 50 hạt sen (cầu khác vẫn bằng lá), quầy cầu hiển thị cả hai loại tiền, sổ sưu tầm loài cá; bảng Nhiệm vụ có tab "Lộ trình" (4 trang ô hình + dấu ?: Khinh công / Khám phá / Gieo duyên / Đất-Nhà-Tiệc; "Mời tiệc" = sắp có). docs/PHIEN57.md. `npm test` 657/657.

- Phiên 58: kiểm lại repo thật (657/657, import khớp), `pages.yml` chép thêm `chan-doan.html`, bổ sung nhật ký PROMPT.md. Các việc còn lại đều cần ptg quyết (xem docs/PHIEN58.md). Mục 2.3 (file lạc) vẫn chờ ptg.
- Phiên 59 (ƯU TIÊN CẢNH): đã có Đại Phật khắc vách đá. Còn: rừng thông dày/đẹp hơn, sông + hồ, thêm kiến trúc; rồi Suối Trong + cá 3D ao riêng, trang Tu tập/NPC trong Lộ trình, Xếp hạng, bơi–lặn. docs/PHIEN59.md.
- Phiên 60: nhiệm vụ làm lại thành 7 chương dẫn đi hết mọi nơi (docs/PHIEN60.md). npm test 662/662.
- Phiên 61: rừng thông dày (docs/PHIEN61.md). Còn: sông + hồ, kiến trúc, Suối Trong + cá 3D, Tu tập/NPC trong Lộ trình, Xếp hạng, bơi–lặn.
- Phiên 62: cụm nút thao tác góc phải-dưới cho điện thoại (Nhảy/Kỹ năng/Thả cầu/Bấm!/Thu cá/Phóng sinh/Túi đồ) + bong bóng chỉ chỗ bấm một lần + Túi đồ xem được khi ở ngoài nhà (docs/PHIEN62.md). `npm test` 669/669. Chờ ptg quyết thiết kế SỨC MẠNH (khiêng/ném) và YÊU QUÁI hằng tháng.
- Phiên 63: hệ thống SỨC MẠNH (cấp + luyện thân + công đức) → khiêng và ném 8 vật nặng (thùng → khúc gỗ lim 200 kg), nút Khiêng/Ném/Đặt xuống trong cụm góc phải-dưới; luật `canGrab` (cấp VÀ sức mạnh nhỏ hơn thì bị khiêng được, không cần đồng ý) đã có logic + test nhưng CHƯA nối mạng (docs/PHIEN63.md). Kế: yêu quái hằng tháng (ném đá + thương, hồi sinh ở cửa chùa). `npm test` 678/678.
- Phiên 65: yêu quái hằng tháng (Đá/Nước/Lửa, 20:00 ngày cố định mỗi tháng; thử bằng ?yq=da|nuoc|lua), gồng chiêu diện rộng, máu theo cấp, hồi sinh cửa chùa, rơi lá bồ đề, thưởng điểm + sức mạnh; luật ném người (không ném trong chùa/đang thiền, hồi chiêu 10 s, -1 hạt sen) viết xong chưa nối mạng; cụm nút điện thoại tự co không đè menu, nút Nhảy luôn hiện. docs/PHIEN65.md. `npm test` 701/701. Nhiều người đánh chung qua máy chủ CHƯA làm.
- Phiên 66: sổ tay `?` cập nhật: sửa chữ cũ sai (cầu gỗ 50 hạt sen, nội thất đã dùng được) + 4 chủ đề mới (nút góc phải-dưới, sức mạnh/khiêng/ném, yêu quái hằng tháng, lộ trình). docs/PHIEN66.md. `npm test` 702/702.

- Phiên 67: yêu quái 2 khung giờ (03:00 trung bình, 20:00 cao) + nút chiến đấu gọn. docs/PHIEN67.md. `npm test` 705/705.
- Phiên 68: nút "Dẫn đường" nhấp nháy cho việc mới và cho người mới (js/world/goPulse.js). Còn: nhãn chữ nút góc phải-trên, màn hướng dẫn 3 bước, chơi chung qua mạng. docs/PHIEN68.md. `npm test` 709/709.

- Phiên 69: chữ nhãn dưới nút tròn góc phải-trên (máy tính hiện sẵn; điện thoại nhấn giữ báo tên). Còn: màn hướng dẫn 3 bước, chơi chung qua mạng. docs/PHIEN69.md. `npm test` 710/710.

- Phiên 70: màn hướng dẫn lần đầu 3 bước có mũi tên (js/world/coach.js, js/ui/coach.js, css/coach.css). Còn: chơi chung qua mạng + việc chờ Gp thử máy thật. docs/PHIEN70.md. `npm test` 715/715.

## Việc của ptg
- Tải bản Phiên 46 lên GitHub (nếu chưa), mở trang thật và thử: nút "Câu cá" cụm phải-trên, nút nổi "Câu cá" khi đứng sát nước, mua cầu, thả, bấm khi hoa sen nở, thu cá, phóng sinh.
- Trả lời: "quả cầu" có đúng là cầu quăng xuống nước? Có tặng 1 cầu gỗ cho người mới? Duyệt số tạm câu cá (xem PHIEN44.md).
- Pages: Settings → Pages → Source = "GitHub Actions"?

- Phiên 81: hạ tầng ZONE — lõi logic xong (va chạm theo zone, ZoneManager, 13 test), CHƯA nối vào game (docs/PHIEN81.md). `npm test` 775/775.
- Phiên 82: kiến trúc thêm — Bảo tháp 7 tầng trên đồi (đường mòn thác, phía Bắc), nhiệm vụ `v-baothap` (docs/PHIEN82.md). Chưa nhìn trên trình duyệt thật. `npm test` 776/776.
