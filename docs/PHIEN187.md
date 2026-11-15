# PHIÊN 187 — Bàn giao (Mục 1/4: thiết kế lại cụm nút chiêu cho dễ bấm, có hình, dùng được)

> Repo: https://github.com/tp9sach-ops/duanchuaon (nhánh `main`). Gp nói tiếng Việt: trả lời NGẮN GỌN, làm TỪNG MỤC, xong đẩy GitHub, báo, chờ "tiếp tục". Đọc `PROMPT.md` → `HANDOFF.md` (đầu file) → file này.

## Yêu cầu của Gp (2026-11-15) — 4 mục, làm lần lượt
1. **(PHIÊN NÀY — XONG)** Nút chiêu hệ phái có nhưng không bấm được, không có hình, không dùng được chiêu → thiết kế lại cụm nút chiêu / đánh thường cho dễ thao tác.
2. Thêm nút CÀI ĐẶT chỉnh lớn/nhỏ các nút bấm (cỡ nút) — CHƯA LÀM.
3. Vào khu luyện tập: các chiêu là NÚT luôn, không phải khung bảng (`#lc-panel` trong `js/ui/luyenChieu.js`) — CHƯA LÀM.
4. Game khó điều khiển → rà lại thao tác tổng thể — CHƯA LÀM.

## Đã làm (Mục 1)
| File | Thay đổi |
|---|---|
| `js/world/chieuInfo.js` | Thêm `glyphOf(id)` + `GLYPHS`: mỗi chiêu ra 1 hình theo việc nó làm — hoi, an, khien, toc, khoa, lao, tia, vung, chem. |
| `js/ui/heSkill.js` | Nút vẽ HÌNH thật (SVG 2 lớp: viền đen + nét trắng, `GLYPH_D`, `drawGlyphIcon`) thay hai chữ cái. Nút to theo `--hs-s = var(--btn-k,1) × clamp(64px,11vmin,92px)` (trước 60px cố định), viền 3px, khoảng cách 12px. Số GIÂY hồi chiêu to giữa nút (`.hs-cdn`), ổ khóa 🔒 + icon mờ khi chưa mở (`.hs-lock`), ô 4 chưa chọn Pháp Môn có hình "chọn" thay vì ô trống. Nút bấm xuống bị nhún (`:active`). |
| `js/ui/heSkill.js` + `js/ui/luyenChieu.js` | **Ở khu luyện tập nút chiêu dùng được thật**: trước đây `cast()` đòi quái bãi rừng nên báo "Chưa có quái" và không ra chiêu. Giờ `inLuyen()` → `LGT.luyenChieu.castById(id)` tung lên mộc nhân, không khóa cấp, hồi chiêu ngắn; ô 4 chưa chọn thì tập Pháp Môn đầu của Hệ. `LGT.luyenChieu` có thêm `castById`, `cdOf`. |
| `tests/chieuinfo.test.mjs`, `tests/heskillui.test.mjs` (mới, đã vào `npm test`) | Test hình cho 30 chiêu; test nối dây (hình, `--btn-k`, `pointer-events`, luồng khu luyện). |
| `sw.js` | `dgt-v175` → `dgt-v176` (Phiên 186 bước 2 do phiên khác đã dùng v175). |

`npm test`: 1253/1253 đạt (Node 22).

## Chuẩn bị cho Mục 2
Cỡ nút đã đi qua biến CSS `--btn-k` (mặc định 1) trong `#hs-bar`. Mục 2: đặt `--btn-k` trên `:root` từ `localStorage['lgt.btnScale']` (0.7–1.6), thêm nút ⚙ + thanh trượt; cũng cho `.dk` (js/ui/dock.js, css/dock.css dùng `--dk-a/--dk-m/--dk-s`) và nút trong khu luyện nhân với `--btn-k`.

## Chưa nhìn bằng mắt
Môi trường AI không có WebGL/trình duyệt: hình SVG, cỡ, vị trí chưa xem thực tế. Gp mở game, thử nút chiêu ở bãi rừng + khu luyện, rồi báo "to/nhỏ, che gì, hình nào khó nhìn". Nếu máy vẫn bản cũ: tải lại cứng để nhận `dgt-v176`.

## Việc kế
Khi Gp nói "tiếp tục" → Mục 2 (cài đặt cỡ nút). Cập nhật `PROMPT.md` mục 7 / `HANDOFF.md` đầu file thêm dòng Phiên 187 trỏ tới file này (hai file rất lớn).
