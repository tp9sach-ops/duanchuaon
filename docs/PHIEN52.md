# PHIÊN 52 — Nút Chỉnh sửa nhà + Khinh thân bậc 2–8 — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

**Người dùng (ptg = Giang):** tiếng Việt, không rành kỹ thuật → trả lời NGẮN, DỄ HIỂU, làm TỪNG MỤC. **Yêu cầu Phiên 52:** làm nút chỉnh sửa, rồi khinh công bậc 2–8, rồi đưa lên GitHub.

## Thứ tự đọc
`PROMPT.md` (mục 7) → `docs/KE_HOACH_TONG.md` → `docs/PHIEN52.md` (file này) → `PHIEN51.md`. `HANDOFF.md` gốc đã cũ (dừng ở Phiên 14a).

## Đã làm
1. **Nút "Chỉnh sửa" trong nhà.** Mở trang thật bằng Chromium (máy tính 1280×720 và điện thoại 390×760): nút ĐÃ hiện đúng khi vào nhà, không bị che. Nên không tìm được lỗi hiển thị; nguyên nhân người dùng không thấy có thể là: nút nằm giữa màn hình ngay trên cửa, không có gợi ý, hoặc bản cũ còn trong bộ nhớ đệm. Đã làm nó dễ thấy hơn: vào nhà thì hiện thông báo "Bấm nút Chỉnh sửa ở giữa màn hình…" và nút nhấp nháy 9 giây (tôn trọng reduced-motion). Sửa `js/ui/editmode.js`, `css/furni.css`. Tăng `sw.js` lên `dgt-v58` để buộc tải bản mới.
2. **Khinh thân bậc 2–8.** Logic thuần trong `js/world/skills.js`: `KHINH_YEU_CAU` (cấp + hạt sen cho từng bậc), `KHINH_TEN` (Nhất Diệp … Bát Thiên), `trainPlan`, `loadKhinh`, `khinhBac`, `jumpHeightAt` (trong nhà chặn ở 1,6 m để không nhảy xuyên trần). Giao diện `js/ui/skill.js`: chip "Khinh thân n/8" (có ✦ khi đủ điều kiện luyện) mở bảng "Luyện Khinh thân" liệt kê 8 bậc, nút "Luyện lên bậc kế (−N hạt sen)". Bậc đã luyện lưu ở `localStorage['lgt.khinh']` = `{v:1,bac:n}`; bậc 1 vẫn do cốt truyện mở (phải xong mới tính phần đã luyện). `js/ui/hudMenu.js` truyền `getSen`, `spendSen` cho `initSkill`.

| Bậc | Cao (m) | Cấp cần | Hạt sen |
|---|---|---|---|
| 2 | 1,6 | 2 | 10 |
| 3 | 2,2 | 3 | 25 |
| 4 | 2,9 | 4 | 50 |
| 5 | 3,7 | 5 | 90 |
| 6 | 4,6 | 6 | 150 |
| 7 | 5,6 | 8 | 250 |
| 8 | 6,8 | 10 | 400 |

**Tất cả con số trên là QUY ƯỚC TẠM, chờ ptg duyệt.**

## Đã kiểm
`tests/skills.test.mjs` +5 test. Chạy trang thật trong Chromium: vào nhà thấy nút; chip + bảng hiện đúng; thiếu cấp thì nút khóa và nói rõ; đủ cấp + sen thì luyện lên bậc 2, trừ sen, lưu `lgt.khinh`; bố cục điện thoại ổn.

## CHƯA kiểm / rủi ro
- Chưa thử bằng tay trên máy thật: nhảy ở bậc cao (camera có theo kịp không), nhảy trong nhà có bị chặn 1,6 m đúng không.
- Chưa có nhiệm vụ riêng cho việc luyện bậc (không thêm vào QUESTS để khỏi đổi các test đếm cứng).
- Dữ liệu `lgt.khinh` mới ở máy người chơi (chưa đồng bộ máy chủ; chờ tính năng tài khoản).

## VIỆC KẾ
1. **Tài khoản tên + mật khẩu** (đồng bộ mọi `lgt.*`, báo trùng, nhân vật cũ đặt mật khẩu) — cần ptg chốt Firebase hay Google Sheet.
2. 3.2, 3.4, 4.1 chờ ptg duyệt. 2.3 ptg xóa tay file lạc.
Quy tắc: logic có test; đổi giao diện thì tăng `VERSION` trong `sw.js`; `npm test`; viết `docs/PHIEN53.md`.
