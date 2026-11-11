# PHIÊN 111 — GDD v2: G2.3 bộ máy kỹ năng — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Đọc: PROMPT.md → docs/PHIEN110.md → file này → docs/KE_HOACH_GDD_V2.md. Chỉ đọc file cần thiết.

## Yêu cầu của ptg (2026-11-11, sau Phiên 110)
"tiếp tục" → làm đúng MỘT mục kế tiếp: G2.3.

## Đã làm (G2.3, đã đẩy lên `main`)
- `js/data/skillCfg.js`: `SKILL_LV` (TẠM): tối đa cấp 10, +6% hệ số mỗi cấp, trần cấp = Tu Vi ÷ 10, Tâm Ấn tối đa 5, +1 mỗi đòn trúng. Đóng băng.
- `js/world/skillEngine.js` (logic thuần, `now` là giây do người gọi đưa vào): `skillLevelCap(tuvi)`, `levelMult(lv)` (cấp 1 = hệ số GDD gốc; cấp n = gốc × (1 + 0,06 × (n − 1)), cấp 10 = ×1,54), `effectiveHeSo(skill, lv)`, `canUpgradeLevel(lv, tuvi)`, và `createSkillRuntime({he, phapMon, tuvi})` với `setHe`, `setTuVi`, `setLevel` (kẹp theo trần Tu Vi, không hạ cấp), `onHit(n)` (Tâm Ấn), `cooldownLeft(id, now)`, `tryCast(slot, now)`, `unlockedSlots()`.
- `tryCast` trả `{ok:false, reason}` với reason = `khong-co` | `chua-mo` (+need) | `hoi-chieu` (+left) | `tam-an` (+have, need); thành công trả `{ok:true, skill, level, heSo (đã nhân cấp), cdUntil}`, bắt đầu hồi chiêu, Tuyệt Học trừ 5 Tâm Ấn. Thứ tự kiểm: không có → chưa mở → hồi chiêu → Tâm Ấn (thất bại không trừ Tâm Ấn).
- Đổi sang Hệ KHÁC → kỹ năng về cấp 1 và xóa hồi chiêu (GDD 5.6 Tái Khai Ngộ); cùng Hệ chỉ đổi Pháp Môn thì giữ cấp.
- `tests/skillengine.test.mjs` (12 test) đã thêm vào `npm test`. Chạy toàn bộ trên bản clone mới: 979/979 đạt (trước khi đẩy).

## Giả định TẠM cần ptg duyệt
1. Cấp 1 dùng đúng số GDD; +6% tính từ cấp 2 trở đi (công thức 1 + 0,06 × (cấp − 1)). Nếu ptg muốn cấp 1 đã là +6% thì sửa `levelMult`.
2. Skill dùng thường KHÔNG tạo Tâm Ấn (chỉ đòn đánh thường trúng mới +1); skill thường không tiêu Tâm Ấn.
3. Tu Vi giảm thì cấp dùng thật bị kẹp theo trần mới, cấp đã nâng vẫn được giữ.

## Chưa làm / lưu ý
- Chưa có chi phí nâng cấp skill ("điểm dùng skill + hạt sen", GDD 6.4) và chưa lưu/nạp trạng thái kỹ năng (cấp, Tâm Ấn, Pháp Môn) vào `localStorage` hay tài khoản. Chưa áp dụng hiệu ứng (choáng, độc, khiên, hồi...) và chưa nối giao diện / sát thương: `tryCast` mới chỉ trả hệ số, người gọi tự gọi `damageOf` (js/world/combat.js) và quan hệ Hệ (js/world/elements.js).
- Còn treo từ Phiên 110: Vạn Độc Quy Tâm "mòn 5%/s" tính theo gì (Oán Khí tối đa hay Công) — chốt khi làm bước áp dụng hiệu ứng, không chặn G2.4.
- **Dòng G2.1, G2.2, G2.3 trong `docs/KE_HOACH_GDD_V2.md` CHƯA đánh dấu XONG** (file lớn, tải lại nguyên file qua công cụ dễ hỏng). Việc đầu tiên phiên sau: sửa ô Trạng thái của G2.1 → `XONG (Phiên 109)`, G2.2 → `XONG (Phiên 110)`, G2.3 → `XONG (Phiên 111)`.
- Vẫn tồn từ Phiên 98: thêm dòng nhật ký vào `PROMPT.md` mục 7. Vẫn chưa chơi thử Phiên 107–108 trên trình duyệt thật.
- `sw.js` chưa cần tăng VERSION (chưa có file nào mới được game nạp).

## VIỆC KẾ (một mục, chờ "tiếp tục")
**G2.4** Lễ Khai Ngộ cấp 10: ngồi vào bồ đoàn chánh điện để chọn Hệ, 60 giây dùng thử Skill 1, rồi xác nhận. Đây là mục đầu tiên đụng vào mã game thật, nên CẦN xem trước: hệ thống bồ đoàn/ghế ngồi (`js/world/seats.js`, `js/world/world.js`), cách lưu trạng thái người chơi (`lgt.*` trong localStorage, khóa tự đồng bộ tài khoản), và cổng cấp Tu Vi (`js/world/stats.js`, `js/world/nguonTuVi.js`). Làm theo từng bước: (a) logic thuần `js/world/khaiNgo.js` + test (điều kiện đủ cấp 10, chọn Hệ, thời gian dùng thử, lưu Hệ); (b) nối bồ đoàn và giao diện. Hỏi ptg đoạn mã cần xem nếu không đọc được từ repo; không đoán.
Sau G2.4: G2.5 thanh skill 5 ô (cần ảnh chụp giao diện điện thoại hiện tại để không chồng nút), G2.6 hiệu ứng nhẹ, G2.7 mở khóa theo cấp + nhiệm vụ Hệ Phái.
Yêu cầu "thêm quái cố định để farm công đức" vẫn chờ ptg chọn: nằm ở G3.6 mở rộng và G4.1–G4.2.

## Prompt khởi động cho phiên sau (dán nguyên)
> Đọc PROMPT.md → docs/PHIEN110.md → docs/PHIEN111.md → docs/KE_HOACH_GDD_V2.md. Repo `tp9sach-ops/duanchuaon`. Đã XONG: G0.1, G0.3, G0.5, G1.1–G1.4, G3.6, G1.6a, Tự Động Hàng Yêu, G2.1, G2.2, G2.3. Chạy `npm test` trước, sửa test đỏ nếu có. Việc đầu: đánh dấu G2.1–G2.3 XONG trong KE_HOACH_GDD_V2.md. Làm MỘT mục theo lời ptg (mặc định G2.4, bước (a) logic thuần trước), gửi bàn giao docs/PHIEN112.md, rồi CHỜ ptg nói "tiếp tục". Chỉ đọc những file cần thiết.
