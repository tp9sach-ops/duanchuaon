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
Câu hỏi mở cho ptg: giá từng loại nhà/đất, số công đức mỗi hoạt động, người chơi ở lô nào có hàng xóm hay chỉ một mình, nhà có cho người khác tham quan không.

## Việc còn dang dở khác (từ các phiên trước)
- Phiên 32 Bước 3–4 phần hình ảnh (bình tưới, cây lớn), Phiên 4 khinh công 8 bậc + parkour, Phiên 5 thả cá/bơi, Phiên 6 cấp/danh hiệu/bảng xếp hạng, Phiên 7 tiệm thời trang, Phiên 8 phương tiện, Phiên 9 MoMo, Phiên 10 QA cuối.
- Âm thanh theo mùa; gộp HANDOFF/PROMPT Phiên 26–33; xóa `phien26.patch` ở gốc khi ptg đồng ý; `PHIEN31.md`/`PHIEN33.md` ở gốc là bản lẻ (bản chuẩn trong docs/).
- Chưa đo FPS điện thoại thật; chưa chụp ngày mưa.
