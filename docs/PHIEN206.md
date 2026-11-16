# Phiên 206 — Mục 2 (khu luyện tập): Đánh thường LAO TỚI mộc nhân + chuỗi 3 đòn (đòn 3 lan)

> Repo `main` (đầu phiên: `a03bd1a`, Phiên 205). ptg gửi lại cùng yêu cầu 2 mục (2026-11-16 11:17) và dặn "việc nào đã làm thì bỏ qua". Quy tắc giữ nguyên: làm từng mục, xong đẩy GitHub rồi báo, chờ ptg nói "tiếp tục".

## Rà lại: ĐÃ CÓ, bỏ qua (đừng làm lại)
- Mục 1 — nút ⚙ "Cỡ nút bấm" dưới bản đồ nhỏ trên điện thoại: Phiên 204 (`js/ui/btnScale.js`, `js/world/btnScale.js`).
- Mục 2 — quái bãi rừng: lao tới + chuỗi 3 đòn + đòn 3 lan + quái đánh trả + lướt tay tung chiêu định hướng + không có quái vẫn đánh/dùng chiêu (không sát thương): Phiên 198/190 (`js/world/basicCombo.js`, `js/world/aimSwipe.js`, `js/ui/farm.js`, `js/ui/heSkill.js`).
- Mục 2 — yêu quái hằng tháng: lao tới + chuỗi 3 đòn: Phiên 205 (`js/ui/yeuquai.js`).

## Phiên này làm (1 mục nhỏ)
- Chỗ hổng: Đánh thường ở KHU LUYỆN TẬP (`js/ui/luyenChieu.js basic()`) chỉ múa côn + nháy mộc nhân trong 4,5 m — không lao tới, không theo chuỗi 3 đòn.
- Sửa: logic thuần mới `js/world/luyenBasic.js` (`nearestOf`, `planBasic`, `hitsFor`) dùng lại `planTap`, `splashTargets`, `stepMul`, `BASIC` của `basicCombo.js` và `rushTarget` của `autoHunt.js`.
  - Đánh thường: mộc nhân trong 4,5 m (tính tới tâm) → ra đòn; xa hơn nhưng trong tầm lao (`BASIC.dashRange` = 8 m tính từ mép) → `W.dash` lao tới (chưa ra đòn, chống bấm dồn `BASIC.dashCd`); quá xa / không có mộc nhân → vung không khí, không chạm gì.
  - Chuỗi 3 đòn: lấy đòn thứ mấy từ `LGT.farm.chainStep()` (cùng chuỗi với hoạt ảnh `combatPose`/`avatar.swing`). Đòn 3 nháy thêm MỌI mộc nhân trong `BASIC.splashR` (4,2 m) quanh người chơi.
  - Thương: không lao; trong tầm thì chạm mộc nhân chính, ngoài tầm vung không khí; không lan.
  - Mộc nhân vẫn KHÔNG có sát thương thật (chỉ nháy `hooks.hit`).
- File: thêm `js/world/luyenBasic.js`, `tests/luyenbasic.test.mjs`, `docs/PHIEN206.md`; sửa `js/ui/luyenChieu.js` (chỉ `basic()` + 2 dòng import + dòng chú thích đầu file), `package.json` (thêm `tests/luyenbasic.test.mjs` vào `npm test`), `sw.js` (`dgt-v192`).

## CHƯA kiểm được (môi trường AI không chạy được repo, không có WebGL)
- CHƯA chạy `npm test` — phiên này không có bản repo để chạy (không có mạng/cài đặt). Test mới `tests/luyenbasic.test.mjs` đã được tính tay nhưng CHƯA chạy; phiên sau/ptg chạy `npm test` (~5 phút) trước khi tin.
- CHƯA xem bằng mắt: vào Võ đường luyện chiêu (bồ đoàn → "Luyện tập chiêu"), đứng xa mộc nhân ~6–10 m bấm Đánh thường → phải lao tới; bấm tiếp ra đòn 1, 2, 3 (đòn 3 làm cả ba mộc nhân nháy nếu đứng giữa).
- `W.dash` ở khu luyện tập không kiểm va chạm (`rushTarget` không truyền `isBlocked`); sàn luyện trống nên chấp nhận được, ptg báo nếu thấy xuyên vật.
- `package.json` vẫn chưa liệt kê `tests/thuyfx*.test.mjs` của Phiên 203 (không phải phiên này).

## MỤC KẾ (chưa làm; hỏi ptg ưu tiên)
1. **Lướt tay tung chiêu ở khu luyện tập**: `js/ui/heSkill.js cast()` khi `inLuyen()` gọi `luyenCast(slot)` và BỎ `swipe` → chiêu định hướng luôn bay về mộc nhân gần nhất. Cần: truyền `swipeDir(...)` xuống `LGT.luyenChieu.castById(id, { ry })`; trong `luyenChieu.cast(i, aim)` dùng `aim.ry` làm hướng, chỉ nháy mộc nhân trong vùng báo (`pickInDir` của `aimSwipe.js`), lướt vào chỗ trống vẫn tung nhưng không mộc nhân nào nháy.
2. **Võ đài / giao lưu** (`js/ui/duel.js`): Đánh thường + lướt chiêu dùng chung với người chơi khác — chưa đọc file này.

## PROMPT BÀN GIAO CHO PHIÊN SAU (dán nguyên văn)
```
Dự án DIỆU GIANG TỰ — repo https://github.com/tp9sach-ops/duanchuaon (main). Đọc PROMPT.md, rồi docs/PHIEN206.md (và bản PHIEN mới nhất nếu có). Chỉ đọc chỗ cần; việc đã làm thì bỏ qua; cập nhật KHÔNG được gây lỗi (npm test chạy ~5 phút: chạy nền `setsid nohup npm test > /tmp/t.log 2>&1 < /dev/null &`, đợi dòng "# fail"). ĐẦU TIÊN chạy npm test để xác nhận Phiên 206 (chưa được chạy).
Đã xong: mục 1 (nút ⚙ dưới bản đồ, Phiên 204); mục 2 quái bãi rừng (Phiên 198), yêu quái hằng tháng (Phiên 205), Đánh thường ở khu luyện tập lao tới + chuỗi 3 đòn (Phiên 206).
Việc phiên này (hỏi ptg nếu chưa rõ ưu tiên): (1) lướt tay tung chiêu định hướng ở KHU LUYỆN TẬP (heSkill.js truyền swipe → luyenChieu.castById/cast dùng hướng lướt, pickInDir chọn mộc nhân trong vùng báo); (2) Võ đài / giao lưu (js/ui/duel.js) dùng chung Đánh thường lao tới + chuỗi 3 đòn + lướt chiêu; không có đối thủ vẫn dùng được nhưng không sát thương. Tái dùng js/world/basicCombo.js, js/world/aimSwipe.js, js/world/luyenBasic.js, LGT.farm.rushPoint/chainStep. Xong: tăng VERSION sw.js, thêm docs/PHIEN<N>.md có prompt bàn giao như file này, đẩy GitHub (trùng tên ghi đè), báo ptg, chờ "tiếp tục".
```

## QUY TẮC BÀN GIAO (nguyên văn)
> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff
