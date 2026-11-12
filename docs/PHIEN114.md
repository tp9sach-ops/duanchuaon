# PHIÊN 114 — GDD v2: quái cố định vùng thứ ba "Hồ Thác Đại Phật" (farm công đức) — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Đọc: PROMPT.md → docs/PHIEN113.md → file này → docs/KE_HOACH_GDD_V2.md. Chỉ đọc file cần thiết.

## Yêu cầu của ptg (2026-11-11, Phiên 114)
"Tiếp tục" những cập nhật từng bước theo GDD v2 (skill, vật phẩm, cách chơi, kỹ năng chiến đấu, thêm quái cố định ở các bãi rừng để farm công đức), rồi đẩy lên GitHub. G2.5 (thanh skill 5 ô) đang chờ ảnh chụp giao diện điện thoại nên phiên này làm MỘT mục khác: thêm vùng quái Hồ Thác Đại Phật (việc kế đã ghi ở Phiên 113).

## Đã làm
- `js/data/monsters.js`: thêm 2 quái `thuyquy` (Thủy Quỷ Hồ Thác, cấp 28, Thủy, thường, rơi 1–3 hạt sen với xác suất 0,5) và `lyngu` (Lý Ngư Tinh, cấp 38, Thủy, TINH ANH, rơi chắc 5–8 hạt sen). Thêm vùng `hoThac` (Hồ Thác Đại Phật, cấp 25–45, Hệ Thủy, cap 12, 1 tinh anh). Tên, cấp, Hệ đúng bảng GDD mục 8; số hạt sen rơi là TẠM.
- Vùng `hoThac`: 1 hình chữ nhật x 85–111, z 87–121 (nằm trong `bai-thac` của OUT_WALKS, chừa lề 1 m, không chồng Đường Mòn). `avoid` (hình tròn tránh): hồ thác (tâm 106,104, r 10, đã chừa lề vì hồ bơi được), đình nghỉ chân, 4 đá lớn, bậc đá + hai đèn trước Đại Phật (tâm 111,5/117, r 6, phủ cả chỗ đứng ngắm).
- `js/scene/farm.js`: thêm màu thanh Oán Khí Hệ Thủy (xanh dương), `HEIGHT` cho 2 quái, mô hình khối tạm: Thủy Quỷ (thân nước trong, tay dài, cỏ nước trên đầu) và Lý Ngư Tinh (cá chép lớn đứng, vảy cam, vây xanh, râu). Chưa nhìn thử trên trình duyệt thật.
- `tests/hothac.test.mjs` (4 test, đã thêm vào `npm test`): dữ liệu đúng GDD, avoid che hồ/đình/đá/bậc đá/đèn/chỗ đứng ngắm, `zoneAt`, thả quái 6 hạt giống không con nào đứng trong hồ hay trên bậc đá, hai vùng sát nhau cùng hiện ≤ 26 (bể vẽ). Các test có sẵn (`spawn`, `farm`, `farmui`) tự quét thêm vùng mới vì dùng `ZONE_IDS`. `npm test` 1003/1003 trên Node 22 (trước phiên: 999).
- Không cần sửa logic: `spawn.js`, `ui/farm.js` đọc `FARM_ZONES` nên vùng mới tự chạy (hồi sinh, trần 100 hạt sen/ngày, Tự Động Hàng Yêu đều dùng chung).

## Giả định TẠM cần ptg duyệt
1. Lý Ngư Tinh là tinh anh (GDD không chỉ rõ con nào; giữ quy ước "con sau là tinh anh" như hai vùng trước).
2. Hạt sen rơi: thường 50% × 1–3, tinh anh 100% × 5–8 (nhỉnh hơn vùng trước vì cấp cao). Mọi nguồn vẫn bị trần `FARM_CFG.senCapNgay` = 100 hạt/ngày (= 10 lá bồ đề).
3. Vùng chỉ phủ bãi dưới thác, chưa phủ đoạn đường mòn cuối (x 81–84) vì sát Đường Mòn.
4. Boss Thủy Mẫu Hồ Thác (cấp 45) KHÔNG nằm ở đây, là việc của G4.1.
5. Màu và hình mô hình chỉ là khối tạm, chờ GLB/hoạ sĩ.

## Chưa làm / lưu ý
- (ĐÃ SỬA Phiên 116) `js/world/tutorial.js` từng ghi "hai vùng luyện" (chỉ nhắc Bìa Rừng Thông và Đường Mòn). Phiên sau sửa thành ba vùng, thêm "${FARM_ZONES.hoThac.ten} (bãi dưới thác, quái cấp ${MONSTERS.thuyquy.lv}–${MONSTERS.lyngu.lv})" và chạy `tests/tutorial.test.mjs`. Chưa làm vì file 17 KB, tải lại nguyên file qua công cụ dễ hỏng.
- `docs/KE_HOACH_GDD_V2.md`: chưa đánh dấu G2.4 "(b) XONG (Phiên 113)" và chưa ghi vùng Hồ Thác XONG (Phiên 114). Phiên sau sửa cả hai.
- `FARM_CFG` comment ở `js/data/monsters.js` về `maxVisible` vẫn nói "hai vùng sát nhau" (đúng: tối đa hai vùng cùng nằm trong nearMargin 40 m).
- Chưa chơi thử trên trình duyệt thật (vùng Hồ Thác, mô hình 3D, bảng chọn Hệ Phiên 113).
- `PROMPT.md` mục 7 chưa có dòng Phiên 109–114.
- Từ Phiên 113: `LGT.he` mới chỉ được ghi; chưa có engine đánh quái đọc `lgt:he`.

## VIỆC KẾ (một mục, chờ "tiếp tục")
Một trong ba (ptg chọn, mặc định a):
a. Sửa nốt hai file tài liệu ở "Chưa làm" (tutorial.js + KE_HOACH) rồi **G2.5** thanh skill 5 ô: cần ảnh chụp giao diện điện thoại hiện tại để không chồng cụm nút phải-dưới; đọc `LGT.he` / sự kiện `lgt:he` để tạo `createSkillRuntime`.
b. Vùng quái kế: Đồi Bảo Tháp (Hệ Thổ, cấp 40–65, Thạch Tinh Khổng Lồ 45 đi cùng 3 quái nhỏ, Hộ Tháp Thạch Nhân 58). Sân Bảo Tháp trong OUT_WALKS: `san-thap` x 50–74, z 68–93; tháp BAO_THAP tâm (62,79) r 3,5; `duong-thap` x 59–65, z 92–100. Lưu ý "đi cùng 3 quái nhỏ" cần thiết kế thêm (chưa có trong spawner).
c. G4.1 boss vùng (Lão Mộc Tinh, Sơn Cước Đầu Mục, Thủy Mẫu) chung phòng qua Firebase: việc lớn, cần ptg duyệt cách làm.

## Prompt khởi động cho phiên sau (dán nguyên)
> Đọc PROMPT.md → docs/PHIEN113.md → docs/PHIEN114.md → docs/KE_HOACH_GDD_V2.md. Repo `tp9sach-ops/duanchuaon`. Đã XONG: G0.1, G0.3, G0.5, G1.1–G1.4, G3.6, G1.6a, Tự Động Hàng Yêu, G2.1–G2.3, G2.4(a), G2.4(b), vùng quái Hồ Thác Đại Phật. Chạy `npm test` trước (mong đợi 1003/1003), sửa test đỏ nếu có. Làm MỘT mục theo lời ptg (mặc định: sửa tutorial.js "ba vùng luyện" + đánh dấu KE_HOACH, rồi hỏi ptg ảnh chụp giao diện điện thoại để làm G2.5), gửi bàn giao docs/PHIEN115.md, rồi CHỜ ptg nói "tiếp tục". Chỉ đọc những file cần thiết.
