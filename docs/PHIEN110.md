# PHIÊN 110 — GDD v2: G2.2 dữ liệu kỹ năng chiến đấu — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Đọc: PROMPT.md → docs/PHIEN109.md → file này → docs/KE_HOACH_GDD_V2.md. Chỉ đọc file cần thiết.

## Yêu cầu của ptg (2026-11-11, sau Phiên 109)
"tiếp tục" → làm đúng MỘT mục kế tiếp: G2.2.

## Đã làm (G2.2, đã đẩy lên `main`)
- `js/data/combatSkills.js`: 30 kỹ năng = 15 skill gốc (ô 1 cấp 10, ô 2 cấp 14, ô 3 cấp 20) + 10 Skill 4 (cấp 30, gắn Pháp Môn) + 5 Tuyệt Học (cấp 60, tiêu 5 Tâm Ấn, hồi 60 giây); 10 Pháp Môn (`PHAP_MON`); `SKILL_CAP`. Tất cả đóng băng sâu. Trường: id, he, slot, ten, cap, cd, heSo (1,5 = 150%), fx (hiệu ứng thô: dur giây, r mét, pct 0..1), phapMon, tamAn, tamSo.
- `js/world/skillCatalog.js` (logic thuần): `skillById`, `skillsOfHe`, `skillFor(he, slot, phapMon)` (ô 4 cần Pháp Môn đúng Hệ), `phapMonById`, `phapMonOfHe`, `capOfSlot`, `slotsUnlocked(tuvi)` (mở khóa đúng mốc 10/14/20/30/60).
- `tests/combatskills.test.mjs` (10 test): đủ số lượng, mỗi Hệ đủ 6 ô, trường bắt buộc, id/tên không trùng, cd > 0, cấp đúng ô, Pháp Môn cùng Hệ, đối chiếu ~40 con số với GDD, đầu vào lạ. `package.json` đã thêm test này.
- Tên file đã đổi khỏi kế hoạch ban đầu (kế hoạch ghi `js/data/skills.js`): dùng `combatSkills.js` / `skillCatalog.js` vì `js/world/skills.js` là Khinh Thân. Bộ máy G2.3 nên đặt `js/world/skillEngine.js`.

## Số liệu GDD không nêu, tôi đặt tạm (cần ptg duyệt)
- **Hư Không Trận (Thổ, ô 3)**: GDD chỉ ghi "sát thương liên tục" không có % → đặt 0,5×Công/giây trong `fx.vung.hePerSec` (đánh dấu `tamSo`).
- **Vạn Độc Quy Tâm (Mộc, ô 3)**: "mòn 5%/s" → lưu `fx.mon.pctPerSec = 0.05`, chưa quyết 5% của gì (Oán Khí tối đa hay hệ số Công). G2.3 phải chốt khi viết bộ máy.
- **Độc Vụ Lan Tỏa (Mộc, Skill 4)**: GDD chỉ nói độc lan sang quái trong 5 m, không có số sát thương riêng.
- Skill buff / khống chế để `heSo = 0` (không gây sát thương trực tiếp); các hiệu ứng (choáng, chậm, độc, khiên, hồi) là SỐ LIỆU THÔ, bộ máy áp dụng ở G2.3.

## Chưa làm / lưu ý
- Chưa nối vào game và giao diện. Chưa có Hệ của người chơi (G2.4).
- **Dòng G2.1 và G2.2 trong `docs/KE_HOACH_GDD_V2.md` CHƯA đánh dấu XONG** (file lớn, tải lại nguyên file qua công cụ dễ lỗi). Việc đầu phiên sau: sửa ô Trạng thái của G2.1 thành `XONG (Phiên 109)` và G2.2 thành `XONG (Phiên 110)`.
- Vẫn tồn từ Phiên 98: thêm dòng nhật ký vào `PROMPT.md` mục 7.
- Chưa chơi thử Phiên 107–108 trên trình duyệt thật (quái bãi rừng, Tự Động Hàng Yêu).
- `npm test` đã chạy trên bản clone cục bộ: toàn bộ đạt (số đếm khác repo vì clone cục bộ chưa gồm các commit upload mới nhất). Bản thật trên GitHub được tải lại để chạy lại sau khi đẩy.

## VIỆC KẾ (một mục, chờ "tiếp tục")
**G2.3** bộ máy kỹ năng `js/world/skillEngine.js`: hồi chiêu, Tâm Ấn (+1 mỗi đòn trúng, tối đa 5, Tuyệt Học tiêu 5), cấp skill 1–10 (+6% hệ số mỗi cấp, tối đa = Tu Vi ÷ 10, kẹp 10), test hồi chiêu / Tâm Ấn / trần cấp. Chốt trước: "mòn 5%/s" của Vạn Độc Quy Tâm tính theo gì.
Sau đó G2.4 Lễ Khai Ngộ (chọn Hệ, ngồi bồ đoàn; hỏi ptg cách ngồi/bấm hiện có).
Yêu cầu "thêm quái cố định để farm công đức" vẫn chờ ptg chọn: thêm quái / vùng nằm ở G3.6 mở rộng và G4.1–G4.2.

## Prompt khởi động cho phiên sau (dán nguyên)
> Đọc PROMPT.md → docs/PHIEN109.md → docs/PHIEN110.md → docs/KE_HOACH_GDD_V2.md. Repo `tp9sach-ops/duanchuaon`. Đã XONG: G0.1, G0.3, G0.5, G1.1–G1.4, G3.6, G1.6a, Tự Động Hàng Yêu, G2.1, G2.2. Chạy `npm test` trước, sửa test đỏ nếu có. Việc đầu: đánh dấu G2.1 và G2.2 XONG trong KE_HOACH_GDD_V2.md. Làm MỘT mục theo lời ptg (mặc định G2.3), gửi bàn giao docs/PHIEN111.md, rồi CHỜ ptg nói "tiếp tục". Chỉ đọc những file cần thiết.
