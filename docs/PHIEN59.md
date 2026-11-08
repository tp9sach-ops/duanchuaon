# PHIÊN 59 — Dọn file lạc + Đại Phật khắc vách đá (mục đầu của "ưu tiên cảnh") — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

**Đọc theo thứ tự:** PROMPT.md (mục 7 cuối) → docs/KE_HOACH_TONG.md → docs/PHIEN58.md → file này.

## Trả lời của ptg (2026-11-08)
1. Đăng nhập: đã xử lý xong. 2. Mời tiệc: để sau. 3. Thêm trang "Tu tập" + "NPC" vào Lộ trình: CÓ. 4. Cầu gỗ giữ 50 hạt sen (không tặng); thêm "Suối Trong" làm nơi câu thứ 4; thêm hình 3D cá trong ao riêng. 5. Xóa file không cần thiết: ĐỒNG Ý. 6. Làm Xếp hạng, bơi–lặn.
**ƯU TIÊN TRƯỚC HẾT:** thêm kiến trúc, khu rừng thông, Phật khắc trên vách đá, sông hồ.

## ĐÃ LÀM
- **Xóa 6 file lạc** (đã kiểm không nơi nào import): `phien26.patch`, `PHIEN31.md`, `PHIEN33.md`, `landscape.js` (gốc; bản đúng là `js/world/landscape.js` + `js/scene/landscape.js`), `docs/PHIEN42_BAN_GIAO (2).md`, `(3).md`. `HANDOFF.md` gốc đã cũ, giữ để tra.
- **Đại Phật khắc vách đá** (Đông, cạnh thác):
  - `js/world/outside.js`: `DAI_PHAT` {face 113.6, z 117, h 16, w 11, bậc đá `bac` (rect chặn x110–113.7, z113–121), 2 đèn đá, `stand` (108.7,120.9)}; nơi mới `daiphat` trong `PLACES`; đăng ký vật cản trong `registerOutside`.
  - `js/scene/daiphat.js` (MỚI): ngách vòm đá sẫm cắm sâu vào vách, đài sen, Phật ngồi thiền (chân, thân, vai, tay, đầu, bướu, tai), hào quang vàng sáng hơn về đêm (`nightGlow`), bậc đá + 2 đèn đá. Dựng bằng hình khối, không GLB/ảnh bản quyền. Nối ở `js/scene/outside.js` (`group.add(buildDaiPhat())`).
  - Nơi mới được ghi ở `js/world/journey.js` (gợi ý + biểu tượng 🗿), `js/world/questGuide.js` (`PLACE_STAND`), `js/world/minimap.js` (nhãn "Đại Phật").
  - `tests/outside.test.mjs`: +1 test (đi tới được, bậc/đèn chặn, nằm ngoài vùng đi bộ, cách dải thác). `sw.js` = `dgt-v64`.
- `npm test`: **658/658** (Node 22). Dựng thử mô hình bằng three trong Node: 46 mesh, khung bao x109.7–117, y0–16, z111–123 (không lỗi).

## CHƯA KIỂM (cần ptg xem trên trang thật)
- **Hình dáng Đại Phật chưa nhìn bằng mắt** (tỷ lệ, màu đá, hào quang, ngách có khớp vách thác lồi lõm không; có bị cây/đá che không). Nếu xấu: chỉnh trong `js/scene/daiphat.js`.
- Số liệu vị trí (z 117) chọn để tránh dải thác (z 104, rộng 6,4 m) và hồ (r 7,5) — chưa nhìn góc camera.
- Node 20 chưa chạy.

## VIỆC KẾ (thứ tự ưu tiên của ptg; MỖI VIỆC xong báo, chờ "tiếp tục")
1. **Rừng thông**: dày, đẹp hơn (hiện `buildForest` trong `js/scene/outside.js` chỉ có nón 2 tầng instanced; bãi rừng + cổ thụ + miếu ở `buildForestGlade`). Gợi ý: thông nhiều tầng, sương, đá phủ rêu, đường mòn có đèn đá, tiếng gió/chim (kiểm `js/ui/soundLogic.js`).
2. **Sông + hồ**: một dòng sông chảy từ hồ chân thác (`THAC.pool`) ra xa (cần `addWater` trong `js/world/layout.js` + cầu đá nếu cắt đường), thêm hồ trong rừng. Nhớ cập nhật `js/world/minimap.js` (`waters`).
3. **Thêm kiến trúc**: ví dụ cầu đá/cổng tam quan thứ hai, tháp chuông/bảo tháp trên đồi, nhà thủy tạ trên hồ — hỏi ptg loại nào nếu chưa rõ.
4. Suối Trong (nơi câu thứ 4, `addWater` + `WATERS` câu cá) + cá 3D ao riêng; trang "Tu tập" + "NPC" trong Lộ trình (`js/world/journey.js`, `js/ui/journey.js`).
5. Xếp hạng ("Bảng vàng"), bơi–lặn (5.3, 5.4 trong KE_HOACH_TONG).
Quy tắc giữ nguyên: mỗi mục `npm test` đạt → đẩy GitHub → báo ptg → chờ "tiếp tục". Môi trường AI đẩy GitHub bằng `mcp__claude-code-remote__add_repo` (access push) rồi `git push` từ bản clone.
