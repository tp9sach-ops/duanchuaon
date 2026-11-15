# PHIÊN 181 — Bàn giao (danh sách 3 việc điều khiển: MỤC 1 XONG = dời Túi đồ lên góc phải-trên)

> Repo: https://github.com/tp9sach-ops/duanchuaon (nhánh `main`). Gp nói tiếng Việt: trả lời NGẮN GỌN, DỄ HIỂU, làm TỪNG MỤC, xong đẩy GitHub, báo, chờ "tiếp tục". Đọc `PROMPT.md` → `HANDOFF.md` (đầu file) → `docs/PHIEN180.md` → file này. Chỉ xem chỗ cần thiết, việc nào đã làm rồi thì bỏ qua.

## Quy tắc làm việc (chép nguyên văn)
"For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff."
Gp muốn: sau MỖI phiên làm việc luôn gửi prompt bàn giao chi tiết (file .md) để phiên sau dù không có trí nhớ vẫn làm đúng 100%.

## Yêu cầu của Gp (2026-11-15, gửi kèm ảnh chụp màn hình máy tính bảng, trang baocaonoibo.io.vn)
Làm TỪNG MỤC, bắt đầu từ 1, xong đẩy GitHub rồi báo để tiếp tục:
1. **Túi đồ dời lên cạnh bên phải, gần góc trên. Chừa chỗ cho các nút chiêu.** → ĐÃ LÀM (phiên này).
2. **Các nút chiêu hệ phái có nhưng KHÔNG BẤM ĐƯỢC, KHÔNG CÓ HÌNH ẢNH, không dùng được chiêu.** → CHƯA LÀM (xem "Việc kế" bên dưới, đã tìm sẵn nguyên nhân).
3. **Thêm nút CÀI ĐẶT chỉnh to/nhỏ các nút bấm** (Gp thấy game rất khó điều khiển). → CHƯA LÀM.

## Đã làm phiên này (mục 1)
| File | Thay đổi |
|---|---|
| `js/ui/menuLogic.js` | `TOP_ICONS` thêm `{ id: 'tui', label: 'Túi đồ', icon: 'bag', status: 'ready', action: 'bag' }` ở ĐẦU cụm tròn phải-trên (cạnh Đèn, Báo tin, Quà, Thư, Câu cá, Chia sẻ, Trợ giúp). Bấm → `press()` trong `hudMenu.js` đã có sẵn nhánh `bag` (ngoài nhà: `LGT.bag.open()`, trong nhà: `LGT.furni.openBag()`). |
| `js/ui/dock.js` | `refresh()` lọc bỏ nút `tui`: `dockButtons(c).filter((b) => b.id !== 'tui')` → cụm phải-dưới KHÔNG còn nút "Túi hồ lô"; ô T3 (hàng trên cùng, cột phải) để trống chừa chỗ cho nút chiêu. Phím **B** vẫn mở Túi đồ (thêm nhánh `e.code === 'KeyB'` trong bộ nghe phím). Logic thuần `js/world/dock.js` (`dockButtons` vẫn trả `tui`) GIỮ NGUYÊN để không phá 20+ test. |
| `tests/menu.test.mjs` | Thêm 1 test: nút Túi đồ ở cụm phải-trên (đứng đầu), `pressResult` = bag, dock.js lọc `tui` + còn phím B. |
| `sw.js` | `VERSION` `dgt-v171` → `dgt-v172` (bắt buộc để máy người chơi tải bản mới). |

Test đã chạy xanh: menu(11), dock(22), tutorial, classclash, compact, hud, fishing, farmui, coach. KHÔNG chạy cả `npm test` (rất dài); chưa nhìn bằng mắt trên máy thật.
Lưu ý: `HANDOFF.md` (175 KB) KHÔNG được thêm dòng "Cập nhật Phiên 181" vì quá lớn để sửa qua API — phiên sau nếu có quyền git thì thêm dòng đầu file trỏ tới file này.

## Việc kế (MỤC 2 — đã tìm ra nguyên nhân, chưa sửa)
**Vì sao nút chiêu (`#hs-bar`, `js/ui/heSkill.js`) không bấm được:** `css/hud.css` đặt `.hud{pointer-events:none}`; `pointer-events` được KẾ THỪA xuống con. Các nút `.hud-tl>*`, `.hm>*`, `.dk-b` đều có `pointer-events:auto` riêng, nhưng `#hs-bar` (và `#hs-pm`; `#hs-tip` chỉ là tooltip nên để none) KHÔNG có → mọi cú chạm xuyên qua nút. Sửa: thêm vào chuỗi CSS trong `heSkill.js` `#hs-bar{pointer-events:auto}` `#hs-pm{pointer-events:auto}` `.hs-b{pointer-events:auto}`. (Đã tìm: không file css nào nhắc `hs-bar`.)
**Vì sao "không có hình":** `drawIcon()` vẽ nền tròn opacity chỉ 0.22 + chữ viết tắt (LC, CN, HH) → rất mờ trên nền tối. Cần biểu tượng rõ hơn (nền đặc theo màu Hệ, viền, họa tiết to, chữ tên chiêu dưới nút).
**Cũng nên kiểm:** `cast()` cần `LGT.farm.skillReady()` (phải có quái gần) — khi không có quái chỉ hiện toast; chiêu hỗ trợ (`heSo = 0`) hiện "sắp có" → Gp thấy "không dùng được" có thể do chính điều này; nên báo rõ hơn hoặc làm hiệu ứng thật. Nút Cấp 30/Cấp 60 (ô 4, Tuyệt Học) là khóa theo cấp — đúng thiết kế.
Vị trí: `paint()` đặt `#hs-bar` ngay trên cụm dock (`bottom = innerHeight - dock.top + 8`, `right` theo dock), tối đa 3 nút/hàng (`max-width:182px`).

## Việc kế sau đó (MỤC 3)
Nút Cài đặt chỉnh cỡ nút: hiện `BOTTOM_MENU` có mục `caidat` ('Cài đặt', status `soon`) trong `js/ui/menuLogic.js`; đã có hệ thống ẩn/hiện HUD `js/ui/compact.js` + `compactLogic.js` + `css/compact.css` (lớp `body.ui-h-*`) và biến `--hud-s` trong `css/responsive.css` (cỡ HUD) — nên tận dụng, thêm thanh trượt "Cỡ nút" (lưu `localStorage` `lgt.*` để đồng bộ tài khoản), áp cho dock `.dk` (`--dk-a/--dk-m/--dk-s`), thanh chiêu `.hs-b` (54 px cố định), cụm tròn `.hm-ic`. Bấm `Cài đặt` ở menu mở bảng này.

## Quy trình mỗi phiên
Đọc file này → làm đúng 1 mục → chạy test liên quan → bump `sw.js` → viết `docs/PHIEN18x.md` → đẩy GitHub (nhánh `main`) → báo ngắn gọn cho Gp → chờ "tiếp tục".
