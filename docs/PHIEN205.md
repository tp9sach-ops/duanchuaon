# Phiên 205 — Mục 2 (đánh thường lao tới + combo 3 đòn + lướt chiêu): rà lại, vá phần còn thiếu #1 = yêu quái hằng tháng

> Repo `main` (sau Phiên 204 = commit `a0942b6`). ptg nói "tiếp tục" sau khi mục 1 xong. Quy tắc: làm từng mục nhỏ, xong đẩy GitHub rồi báo, chờ "tiếp tục".

## Rà lại: phần nào ĐÃ CÓ (Phiên 198, bỏ qua — đừng làm lại)
- `js/world/basicCombo.js` (`planTap`, `nextStep`, `stepMul`, `splashTargets`, `BASIC`): bấm Đánh thường xa tầm đâm nhưng trong tầm lao (8 m) → LAO tới sát quái; bấm tiếp → chuỗi 3 đòn (chém trái→phải, phải→trái, xoay 360° — `js/world/combo.js`), đòn 3 ×1,5 và SÁT THƯƠNG LAN 70% trong 4,2 m; quái dính đòn thì đánh trả (`farmCombat.js`); không có quái vẫn vung (không sát thương).
- `js/world/aimSwipe.js` + `js/ui/heSkill.js`: bấm giữ nút chiêu rồi LƯỚT ≥ 22px → tung chiêu; chiêu định hướng (đường/nón) bay theo hướng lướt, chỉ trúng quái trong vùng báo; lướt vào chỗ trống vẫn tung, không sát thương.
- Nối trong `js/ui/farm.js` (quái bãi rừng) — `stone()` dùng `planTap` + `rush` + `advanceChain`.
- Test: `tests/basiccombo.test.mjs`, `tests/aimswipe.test.mjs`.

## Phiên này làm (1 mục nhỏ)
- Chỗ HỔNG tìm thấy: Đánh thường vào **yêu quái hằng tháng** (`js/ui/yeuquai.js stone()`) chỉ đánh khi đã đứng sát, KHÔNG lao tới, KHÔNG nhân theo đòn trong chuỗi.
- Sửa: `yeuquai.stone()` dùng `planTap` (xa → báo, trong tầm lao → `LGT.farm.rushPoint(boss, body)`, trong tầm đâm → đánh) và sát thương nhân `stepMul(LGT.farm.chainStep())` (đòn 3 ×1,5). `js/ui/farm.js`: tách `rushPoint(m, body)` khỏi `rush(m)` và xuất `rushPoint`, `chainStep` trong `LGT.farm`. Chuỗi đòn dùng CHUNG với quái bãi rừng.
- File: sửa `js/ui/yeuquai.js`, `js/ui/farm.js`, `package.json` (thêm test vào `npm test`), `sw.js` (`dgt-v191`); thêm `tests/yqbasic.test.mjs`, `docs/PHIEN205.md`.
- `npm test`: 1313/1313 đạt (trước: 1310).

## CHƯA làm (đề xuất mục kế, hỏi ptg ưu tiên)
1. **Khu luyện tập / Võ đài / giao lưu** (`js/ui/luyenChieu.js basic()`, `js/ui/duel.js`): Đánh thường ở đó chưa lao tới và chưa theo chuỗi 3 đòn (chỉ `combatPose.strike` + trúng mộc nhân trong 4,5 m). ptg từng yêu cầu giao lưu võ thuật dùng chung nút đánh + combo.
2. Lướt chiêu chưa kiểm khi đối thủ là yêu quái hằng tháng / người chơi khác trong võ đài (`LGT.farm.skillHitDir` chỉ biết quái bãi rừng).
3. Chưa xem bằng mắt (không có WebGL trong môi trường AI): ptg thử đánh thường vào yêu quái từ xa ~5–8 m (`?yq=da` vào địa chỉ trang) — phải lao tới rồi bấm tiếp ra đòn 1, 2, 3 (đòn 3 đau hơn).
4. Lưu ý: `package.json` chưa liệt kê `tests/thuyfx*.test.mjs` của Phiên 203 (không phải do phiên này) — kiểm xem có cần thêm vào `npm test`.

## PROMPT BÀN GIAO CHO PHIÊN SAU (dán nguyên văn)
```
Dự án DIỆU GIANG TỰ — repo https://github.com/tp9sach-ops/duanchuaon (main). Đọc PROMPT.md, rồi docs/PHIEN205.md (và bản PHIEN mới nhất nếu có). Chỉ đọc chỗ cần; việc đã làm thì bỏ qua; cập nhật KHÔNG được gây lỗi (npm test chạy ~5 phút: chạy nền `setsid nohup npm test > /tmp/t.log 2>&1 < /dev/null &`, đợi dòng "# fail").
Đã xong: mục 1 (nút ⚙ dưới bản đồ, Phiên 204); mục 2 phần quái bãi rừng (Phiên 198) + yêu quái hằng tháng lao tới/chuỗi 3 đòn (Phiên 205).
Việc phiên này (hỏi ptg nếu chưa rõ ưu tiên): làm Đánh thường ở KHU LUYỆN TẬP / VÕ ĐÀI / GIAO LƯU dùng chung lao tới + chuỗi 3 đòn (đòn 3 lan) + lướt chiêu định hướng; không có đối thủ vẫn dùng được nhưng không sát thương. Tái dùng js/world/basicCombo.js, js/world/aimSwipe.js, LGT.farm.rushPoint/chainStep. Xong: tăng VERSION sw.js, thêm docs/PHIEN<N>.md có prompt bàn giao như file này, đẩy GitHub (trùng tên ghi đè), báo ptg, chờ "tiếp tục".
```

## QUY TẮC BÀN GIAO (nguyên văn)
> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff
