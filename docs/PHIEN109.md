# PHIÊN 109 — GDD v2: G2.1 Ngũ Hành logic thuần — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Đọc: PROMPT.md → docs/PHIEN108.md → file này → docs/KE_HOACH_GDD_V2.md. Chỉ đọc file cần thiết.

## Yêu cầu của ptg (2026-11-11, sau Phiên 108)
"Tiếp tục những cập nhật từng bước theo GDD v2 để cập nhật skill, vật phẩm, cách chơi, kỹ năng chiến đấu, thêm quái cố định ở các bãi rừng để nhân vật farm tăng công đức. Chỉ xem chỗ cần thiết." → làm đúng MỘT mục kế tiếp theo kế hoạch: G2.1.

## Đã làm (G2.1, đã đẩy lên `main`)
- `js/data/elements.js`: bảng `HE_KHAC` (Kim→Mộc→Thổ→Thủy→Hỏa→Kim), `HE_SINH` (Kim→Thủy→Mộc→Hỏa→Thổ→Kim), `HE_LIST`, `HE_NAME`, `ELEMENT_CFG` (TẠM: +5%/người, tối đa +10%, tầm 10 m, Hội Tụ +10%). Tất cả đóng băng.
- `js/world/elements.js` (logic thuần): `normHe`, `heName`, `heKhac`, `heBiKhac`, `heSinh`, `heSinhRa`, `relation(atk, def)` → 'loi'|'bat'|'thuong' (đưa thẳng vào `damageOf({rel})` của combat.js), `kHeOf`, `sinhBonus({he, allies:[{he, dist}]})`, `isHoiTu(hes)`, `hoiTuBonus(hes)`. Hệ lạ/chưa chọn → 'thuong', 0, không ném lỗi.
- `tests/elements.test.mjs` (9 test): bảng 5×5 đủ (5 loi, 5 bat, 15 thuong, đối xứng), vòng khắc/sinh, chiều ngược khớp GDD 5.3 và 10.3, K_hệ nối damageOf (100 → 130 / 80 / 100), tương sinh (trần 10%, đúng 10 m tính, 10,01 m không), Hội Tụ, đầu vào lạ.
- `package.json`: thêm `tests/elements.test.mjs` vào `npm test`. `npm test` trên bản clone: 958/958 đạt (số tổng tăng hơn 936 ghi ở Phiên 108 vì repo đã có thêm test sau đó).

## Chưa làm / lưu ý
- Logic này CHƯA nối vào game (chưa có Hệ của người chơi hay của quái; Hệ vào ở G2.4 Lễ Khai Ngộ và dữ liệu quái G2.2/G3). Không đổi gì ở giao diện, `sw.js` không cần tăng VERSION.
- **Dòng G2.1 trong `docs/KE_HOACH_GDD_V2.md` CHƯA đánh dấu XONG** (cần tải lại nguyên file lớn): việc đầu tiên phiên sau là sửa ô Trạng thái của G2.1 thành `XONG (Phiên 109)`.
- Vẫn tồn từ Phiên 98: thêm dòng nhật ký vào `PROMPT.md` mục 7.
- Cảnh báo đặt tên: `js/world/skills.js` hiện là Khinh Thân (nhảy), KHÔNG phải bộ máy kỹ năng chiến đấu. Kế hoạch G2.3 ghi `js/world/skills.js` → nên dùng tên khác (đề xuất `js/world/skillEngine.js`) để khỏi đè Khinh Thân. Chờ ptg duyệt.
- Giả định TẠM cần ptg duyệt: các con số +5%/+10%/10 m/Hội Tụ 10%; mỗi đồng đội đếm một lần kể cả cùng Hệ; Hội Tụ tính theo toàn nhóm, không theo khoảng cách.
- Chưa chơi thử Phiên 107–108 trên trình duyệt thật (Tự Động Hàng Yêu, quái bãi rừng). Nếu ptg báo lỗi thì sửa trước.

## VIỆC KẾ (một mục, chờ "tiếp tục")
**G2.2** dữ liệu 15 skill gốc + 10 Skill 4 + 5 Tuyệt Học (`js/data/skills.js` → đề xuất đổi tên `js/data/combatSkills.js` vì `skills.js` ở `js/world` đã là Khinh Thân; test tự kiểm: đủ trường, hồi chiêu > 0, mỗi Hệ đủ 3 skill) → G2.3 bộ máy hồi chiêu + Tâm Ấn → G2.4 Lễ Khai Ngộ.
Với yêu cầu "thêm quái cố định để farm công đức": bãi rừng đã có quái (G3.6, Phiên 106–107). Thêm quái / vùng mới nằm ở G3.6 mở rộng và G4.1–G4.2, làm khi ptg chọn (có thể làm trước G2.2 nếu ptg muốn).

## Prompt khởi động cho phiên sau (dán nguyên)
> Đọc PROMPT.md → docs/PHIEN108.md → docs/PHIEN109.md → docs/KE_HOACH_GDD_V2.md. Repo `tp9sach-ops/duanchuaon`. Đã XONG: G0.1, G0.3, G0.5, G1.1–G1.4, G3.6, G1.6a, Tự Động Hàng Yêu, G2.1. Chạy `npm test` trước, sửa test đỏ nếu có. Việc đầu: đánh dấu G2.1 XONG trong KE_HOACH_GDD_V2.md. Làm MỘT mục theo lời ptg (mặc định G2.2), gửi bàn giao docs/PHIEN110.md, rồi CHỜ ptg nói "tiếp tục". Chỉ đọc những file cần thiết.
