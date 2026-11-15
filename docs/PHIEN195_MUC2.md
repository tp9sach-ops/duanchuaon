# PHIÊN 195 — Mục 2: NÚT CHIÊU TRONG KHU LUYỆN TẬP KHÔNG BẤM ĐƯỢC

> Repo `main`. ptg: trả lời NGẮN GỌN, làm TỪNG MỤC, xong đẩy GitHub rồi báo, chờ "tiếp tục".
> Quy tắc bàn giao (chép nguyên văn): "For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff."

## Đã có từ trước (bỏ qua)
Mục 1 (biểu tượng chiêu, Phiên 194–195 — xem docs/PHIEN195.md). Phiên 190–193: chiêu + Đánh thường dùng được khi không có quái, cung tròn chiêu, nút ⚙ chỉnh cỡ.

## Nguyên nhân (tìm bằng cách chạy heSkill.js trong jsdom với LGT giả)
`js/ui/heSkill.js` vẽ nút + chọn id chiêu theo HỆ CỦA NGƯỜI CHƠI (`LGT.he`), nhưng khu luyện (`js/ui/luyenChieu.js`) tập theo HỆ CHỌN Ở BỒ ĐOÀN (`LGT.luyenChieu.he`) và `castById(id)` chỉ tìm trong danh sách của Hệ đó. Người chơi Hệ Kim vào luyện Hệ Hỏa → nút hiện chiêu Kim, bấm gọi `kim_1`… không có trong danh sách Hỏa → `castById` trả false, nút chỉ rung. Chưa có Hệ (`rt` rỗng) thì thanh chiêu còn bị ẩn hẳn dù đang ở khu luyện.

## Phiên này (chỉ sửa `js/ui/heSkill.js`)
- `zoneHe()` = Hệ đang tập khi `inLuyen()`; `skillShown(slot)` lấy chiêu theo Hệ đó (ô 4: Pháp Môn đã chọn nếu thuộc Hệ đó, không thì Pháp Môn đầu).
- `cast()`: kiểm `inLuyen()` TRƯỚC `if (!rt)`; `paint()`: hiện thanh chiêu khi `rt || inLuyen()`; màu viền nút và biểu tượng ô 4 theo Hệ đang tập (`hz`); `rt` rỗng không gây lỗi; giữ-nhấn xem thông tin (`showTip`) cũng theo Hệ đang tập.
- `tests/heskillui.test.mjs`: thêm test Phiên 195; sửa test cung tròn lỗi thời từ Phiên 193 (gọi `arcPoints(..., 58)` — tham số `m` đường kính nút hàng đáy; đây là lỗi test, code runtime đã truyền `m`).
- `sw.js` = `dgt-v183`.

## Kiểm thử
jsdom giả LGT: người chơi Kim vào luyện Hỏa → 5 nút chiêu Hỏa, bấm gọi `hoa_1,hoa_2,hoa_3,hoa_liethoa_4,hoa_tuyet` (trước sửa: gọi `kim_*` → sai); người chơi chưa có Hệ vào luyện Thủy → đủ 5 nút Thủy; cùng Hệ vẫn đúng. `heskillui/luyenchieu/btnscale/skills/combatskills` 40/40 đạt, `tests/smoke.mjs` đạt. CHƯA thử trên điện thoại thật (không có WebGL/màn cảm ứng ở môi trường AI).

## ptg kiểm
Tải lại cứng → vào khu luyện bằng bồ đoàn (thử chọn Hệ KHÁC Hệ của mình) → bấm từng nút chiêu + Đánh thường. Nếu vẫn không bấm được, báo: nút nào, máy gì, có thấy toast không (nghi thêm: lớp UI khác chặn cú chạm).

## Việc kế
3. Nút khinh công: góc quay đi theo, bấm lướt, bay từ từ rồi hạ — chưa giống mô tả. 4. Đánh thường lao tới mục tiêu trong tầm ngắn → combo 3 đòn khác nhau (đòn 3 sát thương lan, quái dính thì đánh lại). 5. Chiêu: bấm rồi lướt ngón tay chọn hướng. 6. Không có quái vẫn dùng chiêu + đánh thường nhưng không gây sát thương.
