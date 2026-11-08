# PHIÊN 57 — Cầu gỗ 50 hạt sen + quầy cầu hoàn chỉnh + Lộ trình (ô hình, dấu "?") — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

**Yêu cầu (ptg, 2026-11-08):** "Cầu gỗ mua 50 hạt sen. Làm cho xong chỗ bán cầu. Bảng nhiệm vụ hiển thị các trang gồm các ô hình = lộ trình + điểm thú vị trong game; cái nào chưa trải nghiệm hiện dấu ?. VD: khinh công 8 bậc (cách đạt từng bậc), khám phá (những chỗ cần khám phá), gieo duyên–phóng sinh (mua cầu, thu phục cá, phóng sinh, sưu tầm cá), mua đất, xây nhà, nội thất, mời tiệc." Đọc theo thứ tự: PROMPT.md → docs/KE_HOACH_TONG.md → docs/PHIEN55.md (đăng nhập `blocked` còn chờ ptg thử phép 8) → PHIEN56.md → file này.

## ĐÃ LÀM
**1. Cầu gỗ = 50 hạt sen (không còn là lá)** — `js/world/fishing.js`
- `ORBS[].don`: `'sen'` (chỉ Cầu Gỗ, gia 50) hoặc `'la'` (4 cầu còn lại, giá lá giữ nguyên 100/250/600/1000). Sửa cầu = 1/5 giá cùng đơn vị: gỗ 10 hạt sen, đá 20 lá...
- `buyOrb(st, bal, id)` / `repairOrb(st, bal, id)`: `bal` là `{la, sen}` (số trần = lá, cách cũ → cầu gỗ báo `poor`). Kết quả có thêm `don`. Mới: `orbCurrency`, `balanceFor`, `priceText`.
- Sổ sưu tầm loài `st.dex = {idLoài: số lần}`: `keepFish`, `releaseCaught`, `noteCaught(st, fish)` ghi; `loadFish` lọc loài lạ/số âm; dữ liệu cũ không có `dex` vẫn đọc được.
**2. Quầy cầu** — `js/ui/fishing.js`, `js/ui/hudMenu.js`
- `LGT.spendSen = spendMerit` (trừ hạt sen). Tab "Quả cầu" hiện cả hạt sen lẫn lá bồ đề; nút "Mua 50 hạt sen" / "Mua 100 lá"; nút Sửa theo đúng đơn vị; chưa có cầu thì tab "Thả cầu" có lối tắt "Mua Cầu Gỗ Bồ Đề — 50 hạt sen".
**3. Lộ trình** — `js/world/journey.js` (logic thuần), `js/ui/journey.js` (giao diện, không innerHTML), `js/ui/quest.js` (2 tab "Nhiệm vụ | Lộ trình"), `css/quest.css`
- 4 trang: **Khinh công** (8 bậc, cách đạt từng bậc: cấp + hạt sen từ `skills.js`, bậc kế có nút mở bảng Khinh thân), **Khám phá** (15 nơi trong `PLACES`; chưa ghé = "?" tên ẩn "Nơi chưa biết", chạm xem gợi ý đường đi; Thác/Rừng/Làng có nút Dẫn đường), **Gieo duyên** (mua cầu, thu phục cá, phóng sinh, ao riêng, 4 cầu lá, 13 loài trong sổ sưu tầm), **Đất · Nhà · Tiệc** (đổi lá, mua đất, 3 cấp nhà, mua/bày nội thất, "Mời tiệc" = **Sắp có**, vì game CHƯA có tính năng tiệc — không tự bịa).
- Ô xong = hiện biểu tượng; chưa = "?"; chạm ô → bảng chi tiết các bước + nút "Dẫn đường"/"Mở ngay".
**4. Kiểm thử:** `tests/journey.test.mjs` (6 test, đã thêm vào `package.json`), `tests/fishing.test.mjs` cập nhật (giá/tiền tệ/sổ loài), `tests/fishingview.test.mjs` sửa lệnh mua. `sw.js` = `dgt-v63`. `npm test`: **657/657** (Node 22).

## CHƯA KIỂM (cần ptg xem trang thật)
- Hình dáng bảng Lộ trình trên điện thoại (lưới 92 px/ô, tab trang cuộn ngang); biểu tượng emoji có hiện đủ trên máy ptg.
- Giá hạt sen: người mới có 50 hạt sen chưa? (số hạt sen khởi đầu phụ thuộc ví; chưa đối chiếu với thu nhập thật.)
- Node 20 chưa chạy. Apps Script thật không chạy được trong môi trường này.

## CẦN PTG QUYẾT
1. "Mời tiệc" làm thế nào (mời bạn bè vào nhà qua phòng Firebase?) — hiện chỉ là ô "Sắp có".
2. Thêm trang "Tu tập" (nhang, tụng kinh, thiền, đèn nguyện, tràng hạt) và trang "NPC" vào Lộ trình không?
3. Còn mở từ PHIÊN 56: tặng cầu gỗ cho người mới? Suối Trong làm nơi câu thứ 4? Hình 3D cá trong ao riêng?
4. Kết quả phép 8 của `chan-doan.html` + cài lại Code.gs (PHIÊN 55).

## VIỆC KẾ (mỗi việc xong báo, chờ "tiếp tục")
Theo trả lời của ptg ở "CẦN PTG QUYẾT"; rồi các mục mở ở docs/KE_HOACH_TONG.md.
