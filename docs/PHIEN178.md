# PHIÊN 178 — Bàn giao (vừa đi vừa bấm chiêu / bấm cưỡi thương–ván)

> Repo: https://github.com/tp9sach-ops/duanchuaon (nhánh `main`). Gp nói tiếng Việt: trả lời NGẮN GỌN, DỄ HIỂU, làm TỪNG MỤC, xong đẩy GitHub, báo, chờ "tiếp tục". Đọc thêm `docs/PHIEN177.md` và `docs/KE_HOACH_HIEU_UNG_3D.md`.

## Quy tắc làm việc (chép nguyên văn)
"For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff."

## Yêu cầu của Gp
Cho phép VỪA DI CHUYỂN vẫn bấm được các chiêu; và vừa di chuyển vừa bấm cưỡi thương / cưỡi ván vẫn được.

## Nguyên nhân tìm thấy
- Điện thoại: cần đi (`#joy`) giữ bằng một ngón; nút cưỡi (`vantruot`) và nhiều nút khác trong `js/ui/dock.js` chạy ở sự kiện `click`, mà trình duyệt điện thoại hay KHÔNG sinh `click` khi đang có ngón khác chạm → bấm không ăn. Chỉ vài nút "nhanh" (Nhảy, Thương, Chém khí…) dùng `pointerdown`.
- Nút chiêu phái (`js/ui/heSkill.js`, Q/W/E) chạy ở `pointerup`, nhưng bị hủy khi ngón trượt khỏi nút (`pointerleave`) → lúc vừa chạy vừa bấm dễ trượt nên mất cú bấm.
- Cờ `skipClick` dùng chung cho mọi nút → nút khác có thể bị nuốt một lần bấm.
- Bàn phím: đi = mũi tên (W/A/S/D không phải phím đi, Q/W/E = chiêu) nên giữ mũi tên + bấm Q/W/E/B không xung đột trong code.

## Đã làm
- `js/ui/dock.js`: thêm vào danh sách bấm-xuống-là-chạy (`FAST`): `vantruot` (cưỡi thương/gậy/lướt ván), `lan`, `tudong`, `khieng`, `nem`, `ha`, `nemyq`, `nemnpc`, `thanguoi`, `cast`, `thu`, `phong`. KHÔNG thêm `kynang` và `tui` (mở bảng: bảng hiện dưới ngón sẽ nhận nhầm cú nhả). Cờ chống bấm đúp (pointerdown + click) giờ riêng từng nút, hết 700 ms thì thôi.
- `js/ui/heSkill.js`: nút chiêu giữ con trỏ bằng `setPointerCapture`, bỏ `pointerleave` → ngón trượt nhẹ vẫn tính là bấm.
- `sw.js` = `dgt-v169`. Test liên quan (dock, board, skills, worldlogic, luyenchieu) đạt.

## Chưa làm / cần Gp thử và báo
- CHƯA thử trên điện thoại thật (không có thiết bị ở môi trường AI). Gp thử: giữ cần đi + bấm Q/W/E; giữ cần đi + bấm nút Cưỡi thương / Lướt ván.
- Luật cũ còn nguyên (`js/ui/board.js`): ĐANG GIAO CHIẾN (vừa ra đòn ≤ 4,5 giây, hoặc có quái đang đánh mình/tự động đánh) thì KHÔNG cưỡi được và đang cưỡi sẽ tự xuống. Nếu bấm cưỡi lúc đang đánh quái vẫn báo "không cưỡi được" thì là luật này, không phải lỗi cảm ứng: hỏi Gp có muốn nới luật (cho cưỡi khi chạy trốn) không.
- Chiêu phái vẫn cần có quái trong tầm (`LGT.farm.skillReady`), không có quái thì báo "không có quái" — đúng thiết kế.
- Kế hoạch hiệu ứng 3D: mục 1 (lửa) xong; việc kế = Mục 2 băng + nước.

## Prompt bàn giao (dán vào phiên mới)
Bạn tiếp tục dự án Diệu Giang Tự (https://github.com/tp9sach-ops/duanchuaon, nhánh main). Quy tắc: For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff. Đọc docs/PHIEN178.md, docs/PHIEN177.md, docs/KE_HOACH_HIEU_UNG_3D.md. Khi Gp nói "tiếp tục": làm Mục 2 (băng thật + nước, Hệ thủy): logic thuần js/world/bang.js + test, vẽ js/scene/fxBang.js, nối js/scene/chieuFx.js (p.he === 'thuy'), chạy test, nâng sw.js, viết docs/PHIEN179.md, đẩy main, báo Gp, chờ "tiếp tục".
