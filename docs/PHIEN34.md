# PHIÊN 34 — Sửa nhiệm vụ "Tưới cây bồ đề" (có trong bảng Nhiệm vụ, dẫn đường được, tưới + thiền chạy thật) (BÀN GIAO)

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

**Nền:** repo `tp9sach-ops/loinhuan.github.io` `main` @ `b5a066b`. Đầu phiên đã bỏ bản làm dở cục bộ (chu kỳ ngày đêm Phiên 23 của sandbox cũ) vì repo đã có `js/world/daycycle.js` từ lâu; bản cũ lưu ở `git stash` của sandbox, không đẩy.

## Yêu cầu của ptg (07/11)
1. Nhiệm vụ tưới cây bồ đề không có trong bảng nhiệm vụ và không dẫn đường được → SỬA (làm trước, XONG phần mã + test).
2. Tính năng xây nhà bằng công đức/lá bồ đề → GHI VÀO KẾ HOẠCH (bên dưới), chưa làm.

## Đã làm (việc 1)
- Nguyên nhân: cốt truyện (Phiên 32) chỉ có thẻ mục tiêu nhỏ; bảng Nhiệm vụ và dẫn đường chỉ biết `QUESTS`; và CHƯA có nút tưới / đếm thiền nên bước tưới không thể hoàn thành.
- `js/world/story.js`: `STORY_QUESTS` (5 id `s-meet, s-abbot, s-water1, s-meditate, s-water2`), `isStoryQuest`, `storyRows(story)` → {q,cur,need,done,locked}.
- `js/world/questGuide.js`: `planGuide` nhận id cốt truyện (`ctx.story`); tưới cây = đi tới `WATER_SPOT` (-30.6,-16) rồi nút `tuoicay` nhấp nháy; thiền = vào chánh điện + nút Thiền; gặp chú tiểu/trụ trì = dẫn tới NPC; bước chưa tới nói rõ phải làm bước nào trước. Tách `buildPlan` dùng chung.
- `js/ui/quest.js`: nhóm "Cốt truyện · Chăm sóc cây bồ đề" đầu bảng, có nút Dẫn đường; `LGT.quests.redraw()`.
- `js/ui/story.js`: dưới thẻ mục tiêu có nút "Dẫn đường" và "Tưới cây" ("Đi tới cây" khi còn xa; rót 1,6 giây rồi `apply({type:'water'})`, hồi chiêu 3,5 giây); đếm giờ thiền mỗi 0,5 giây khi `LGT.world.mode==='meditate'` và tab đang mở (logic chặn 2 giây/lần).
- `js/ui/guide.js`: truyền `story`, làm sáng nút `.st-water`. CSS: `css/story.css` (.st-wrap/.st-act/.st-btn), `css/quest.css` (.locked). `sw.js` `dgt-v34`.
- `tests/questGuide.test.mjs` +4 test. `npm test`: **477/477 đạt** (Node 22).

## CHƯA kiểm / CHƯA làm của việc 1
- CHƯA mở trình duyệt thật (sandbox không có three.js cục bộ và không cài được gói): chưa nhìn vị trí nút trên điện thoại, chưa thử bấm thật. Cần thử: bảng Nhiệm vụ → Dẫn đường "Tưới cây bồ đề cổ" → nhân vật đi tới cây → bấm Tưới cây.
- Chưa có tư thế nhân vật cầm bình / giọt nước, cây bồ đề chưa lớn lên theo `treeScale` (xem PHIEN32.md mục Bước 3), chưa có hiệu ứng/âm thanh khi cây lớn.
- Chưa mở "Khinh thân bậc 1" thành nút kỹ năng (Phiên 4 master prompt).

## KẾ HOẠCH TIẾP THEO — Việc 2: Xây nhà bằng công đức (ptg yêu cầu 07/11)
Ý của ptg: ngồi thiền, làm nhiệm vụ… được công đức; đủ 100 công đức → gặp NPC đổi lấy **lá bồ đề**; lá bồ đề dùng mua vật phẩm và **mua đất**; người chơi chọn một khu đất → mua xong được cấp **nhà trống thô sơ**; có thể nâng/mua 1 trong 4 loại nhà theo giá tăng dần (cần tích đủ lá hoặc nạp tiền): **nhà lầu → nhà có hoa viên → nhà hồ bơi / villa**; rồi mua nội thất, cây cối, đồ dùng thật phong phú để trang trí (càng nhiều món càng tốt để sáng tạo).
Đề xuất chia bước (mỗi bước xong báo rồi chờ "tiếp tục"):
1. Kinh tế: `js/world/merit.js` (logic thuần + test): công đức (nguồn: thiền, nhiệm vụ, tụng kinh…), quy đổi 100 công đức = 1 lá bồ đề (số TẠM), ví lá bồ đề, chống lặp/gian lận cục bộ. NPC đổi lá (chọn/đặt NPC mới). Cần ptg chốt: công đức khác "hạt sen" hiện có thế nào, hay thay luôn hạt sen?
2. Đất: bản đồ các lô đất (khu trống gần làng, tránh cửa hàng/đường), chọn lô trên bản đồ, giá theo lô, lưu sở hữu.
3. Nhà: 4 loại (trống thô sơ cấp ban đầu; nhà lầu; nhà hoa viên; nhà hồ bơi/villa) — mô hình three.js, va chạm, cửa vào, nâng cấp.
4. Nội thất/đồ trang trí: danh mục lớn (giường, bàn ghế, tủ, đèn, tranh, cây cảnh, hồ cá, đồ bếp…), chế độ đặt/xoay/xóa đồ, lưới đặt, giới hạn số lượng, lưu bố trí.
5. Nạp tiền: chỉ làm cùng Phiên 9 (MoMo xác minh phía máy chủ) — KHÔNG tin client; trước đó chỉ dùng lá bồ đề kiếm được.
6. Đồng bộ lên máy chủ (Apps Script) để không sửa localStorage ăn gian; hiện mọi số liệu chỉ ở máy người chơi.
## QUYẾT ĐỊNH CỦA PTG (07/11, trả lời các câu hỏi mở) — ĐÂY LÀ LUẬT CHỐT, các số "đề xuất" bên dưới là TẠM chờ ptg duyệt
- **Quy đổi:** công đức = **hạt sen** hiện có (`wallet.sen`, không tạo đơn vị mới). **10 hạt sen = 1 lá bồ đề** (NPC đổi). Lá bồ đề dùng mua đất, nhà, đồ.
- **Đất:** **100 lá bồ đề** mua một lô. Mua xong được **TẶNG nhà trống thô sơ** (không tốn thêm).
- **Các loại nhà khác:** ptg để tôi tự đặt giá cho game thú vị, người chơi phải cày (bảng đề xuất dưới).
- **Tham quan:** cho người khác vào xem nhà. **Mở tiệc mời người vào** (chủ nhà bật "tiệc", người khác thấy và vào).
- **Xóm:** hàng xóm cạnh nhau, **tối đa 10 nhà / xóm**; nhà thứ 11 mở **xóm mới** (xóm 2, 3…). Người ở xóm 1 muốn xem nhà xóm 2 phải **gặp NPC "bác khu phố"** để đổi xóm.

## Đề xuất kinh tế (TẠM — chờ ptg duyệt/chỉnh)
Thu nhập hiện tại của hạt sen rất thấp (nhiệm vụ ngày ≈ 6 sen/ngày; chuỗi cốt truyện 9 sen) nên 100 lá = 1000 sen sẽ mất hàng trăm ngày nếu giữ nguyên. Vì vậy phải THÊM nguồn sen cho hợp lý (có trần mỗi ngày để cày có nhịp, không cày vô hạn): ngồi thiền (+1 sen mỗi 3 phút, tối đa ~10/ngày), tưới cây bồ đề hằng ngày, tụng kinh/lạy/thắp hương hằng ngày, hoa sen vàng, nhiệm vụ hành trình, sự kiện tiệc. Mục tiêu nhịp chơi: người chăm chỉ ≈ 50 sen/ngày = 5 lá/ngày.
| Mục | Giá (lá bồ đề) | ≈ ngày cày (5 lá/ngày) |
|---|---|---|
| Đất 1 lô + nhà trống thô sơ (tặng) | 100 | ~20 |
| Nâng cấp lên Nhà lầu | 150 | ~30 |
| Nâng cấp lên Nhà hoa viên | 400 | ~80 |
| Nâng cấp lên Villa hồ bơi | 900 | ~180 |
| Nội thất/đồ nhỏ (ghế, bình, chậu cây) | 1–10 | |
| Đồ vừa (giường, bàn, tủ, đèn đẹp, cây cảnh lớn) | 10–60 | |
| Đồ lớn/hiếm (hồ cá, đài phun nước, bộ sofa, tượng, cổng đẹp) | 80–300 | |
(Nâng cấp tính chênh lệch; bán lại đồ được hoàn 50%. Nạp tiền chỉ để đẩy nhanh và chỉ làm cùng MoMo xác minh phía máy chủ ở Phiên 9.)

## Thiết kế kỹ thuật cho xóm / tham quan / tiệc (ghi để không quên)
- Một "xóm" = 10 lô đất cố định trên bản đồ; có nhiều xóm thì CÙNG khu đất đó, nội dung đổi theo `xomId` (không dựng thêm 10 lô mỗi xóm). Lô nào đã có chủ thì hiện nhà người đó; lô trống thì hiện bảng "Đất trống".
- Người chơi mua đất → hệ thống gán vào xóm còn chỗ ít số nhất (xóm 1 đủ 10 thì sang xóm 2…); người chơi chọn lô còn trống TRONG xóm của mình.
- NPC "bác khu phố" (mới): đổi xóm đang XEM (xem nhà xóm khác, không đổi xóm của mình).
- Lưu nhà/đồ/bố trí và sổ xóm ở máy chủ (Apps Script `gas/` hoặc Firebase `firebase/database.rules.json` đã có sẵn). Khách vào xem nhận bản chụp bố trí chỉ-đọc (không sửa được). Tiệc: chủ nhà bật cờ "đang tiệc" có hẹn giờ; danh sách tiệc hiện ở NPC bác khu phố; có hiện người đang ở trong nhà hay không phụ thuộc phòng thời gian thực đã có (Phiên 18 "nhiều phòng") — cần kiểm lại khi làm.
- Chống gian lận: mọi trừ/cộng lá, mua đất, nâng nhà phải xác nhận phía máy chủ (ví hiện chỉ ở localStorage → sửa được).

## Thứ tự làm đã chốt lại (mỗi bước xong báo, chờ "tiếp tục")
1. `js/world/merit.js` (thuần + test): 10 sen → 1 lá, ví lá, nguồn sen có trần ngày, chống lặp. NPC đổi lá.
2. Lô đất + xóm (10/xóm, gán xóm, chọn lô, mua 100 lá, tặng nhà trống), NPC bác khu phố đổi xóm xem.
3. Mô hình 4 loại nhà + va chạm + nâng cấp.
4. Danh mục nội thất lớn + chế độ đặt/xoay/xóa + lưu.
5. Tham quan nhà người khác (chỉ đọc) + mở tiệc.
6. Máy chủ xác nhận + nạp tiền (cùng Phiên 9).

## Việc còn dang dở khác (từ các phiên trước)
- Phiên 32 Bước 3–4 phần hình ảnh (bình tưới, cây lớn), Phiên 4 khinh công 8 bậc + parkour, Phiên 5 thả cá/bơi, Phiên 6 cấp/danh hiệu/bảng xếp hạng, Phiên 7 tiệm thời trang, Phiên 8 phương tiện, Phiên 9 MoMo, Phiên 10 QA cuối.
- Âm thanh theo mùa; gộp HANDOFF/PROMPT Phiên 26–33; xóa `phien26.patch` ở gốc khi ptg đồng ý; `PHIEN31.md`/`PHIEN33.md` ở gốc là bản lẻ (bản chuẩn trong docs/).
- Chưa đo FPS điện thoại thật; chưa chụp ngày mưa.
