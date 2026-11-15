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

---
# PHIÊN 188 — Mục 2/4 xong: nút ⚙ Cỡ nút
- `js/world/btnScale.js` (logic + `tests/btnscale.test.mjs`), `js/ui/btnScale.js` (nút ⚙ cạnh các nút zoom bên trái + hộp thanh trượt 70–160%, lưu `lgt.btnScale`, đặt `--btn-k` trên `:root`), `js/main.js` nạp, `css/dock.css` `.dk{transform:scale(var(--btn-k))}` (cụm phải-dưới), cụm chiêu đã dùng `--btn-k` từ Mục 1. `sw.js` = `dgt-v177`.
- Chưa nhìn bằng mắt: vị trí ⚙ (left:184px, ngay trên joystick) có thể đè nút zoom khác ở vài máy → báo Gp.
## HÀNG ĐỢI (Gp giao 2026-11-15 18:42, làm sau Mục 3, 4)
5. **Đánh thường + combo:** bấm Đánh thường → LAO tới mục tiêu trong phạm vi ngắn; bấm tiếp → combo 3 đòn, 3 hoạt ảnh khác nhau; đòn 3 có sát thương LAN; quái dính lan thì ĐÁNH TRẢ.
6. **Chiêu định hướng:** nhấn vào nút chiêu rồi LƯỚT ngón tay → chiêu bay theo hướng lướt (chiêu không định hướng thì tung như cũ).
7. **Không có quái vẫn dùng được:** chiêu và đánh thường vẫn tung (hoạt ảnh/hiệu ứng) nhưng không gây sát thương ai. (Hiện `cast()` ở `heSkill.js` chặn bằng `LGT.farm.skillReady()`; nút Đánh thường ở `js/ui/farm.js`/`LGT.yq.stone`.)

---
# PHIÊN 189 — Mục 3/4 xong + dời nút Kỹ năng + bỏ nhãn Q/W/E
- **Khu luyện tập = nút tròn to có hình** (`js/ui/luyenChieu.js`): bỏ `#lc-panel`; hàng nút `#lc-pad` (phải-dưới, 3 cột, cỡ `--btn-k × clamp(72px,13vmin,108px)`), tên dưới nút, số giây hồi chiêu giữa nút; thanh nhỏ `#lc-top` (tên Hệ + "Về bồ đoàn") giữa-trên. Bấm xuống là ra chiêu. Thanh chiêu ngoài (`#hs-bar`) tự ẩn trong khu luyện (`!inLuyen()` ở heSkill.js) để không trùng.
- `js/ui/skillIcon.js` (mới): `GLYPH_D` + `drawGlyphIcon` tách từ heSkill.js dùng chung.
- **Nút Kỹ năng (Khinh thân) dời** từ cụm phải-dưới lên `#hm-skillrow` NGAY DƯỚI Túi hồ lô (`js/ui/hudMenu.js`, `css/hudmenu.css`, `menuLogic.js` thêm action `kynang`); `dock.js` lọc bỏ 'kynang' (logic dock + test giữ nguyên). Chỉ hiện khi Khinh thân ≥ 1, nhấp nháy khi đủ điều kiện luyện.
- **Bỏ chữ phím Q/W/E/T/Y** trên nút chiêu và nhãn phím ở cụm dock (phím tắt vẫn chạy).
- `sw.js` = `dgt-v178`. `npm test` 1257/1257. CHƯA nhìn bằng mắt.
- Việc kế: Mục 4 (rà điều khiển tổng thể) → rồi hàng đợi 5–7 ở trên.
