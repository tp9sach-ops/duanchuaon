# PHIÊN 78 — Lộ trình thêm trang Tu tập + Dân làng — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Đọc: PROMPT.md → KE_HOACH_TONG.md → PHIEN73.md → file này.

## ĐÃ LÀM
- `js/world/journey.js`: **trang 6 "Tu tập"** (`pageTuTap`): 8 ô — thắp nhang, lạy Phật, tụng kinh, ngồi thiền, lần tràng hạt, thả đèn nguyện, nhận lộc hoa sen vàng, đổi lá bồ đề; ô xong khi tổng số lần (`prog.tot[key]`) > 0, hiện "Đã làm N nén/lạy/thời…", mỗi ô có `quest` để nút "Dẫn đường" chỉ tới nơi. **Trang 7 "Dân làng"** (`pageNguoi`): mọi NPC có hội thoại (không tính điểm cảnh như giếng, thác); tên ẩn "Người chưa quen" tới khi đã trò chuyện (`prog.seen.npc`); ghi người đó ở trong chùa / ngoài làng / khu nhà ở. Hai trang vào `buildJourney` (tổng 7 trang; thanh tab cuộn ngang).
- Tests: journey +1, sửa 1 (7 trang). `npm test` **742/742**. `sw.js` = `dgt-v84`.

## CHƯA KIỂM
Chưa nhìn bằng mắt thanh tab 7 trang trên điện thoại (có `overflow-x:auto`). Ô "Dân làng" chỉ dẫn chung, chưa có nút dẫn thẳng tới từng người (`quest: null`) — có thể thêm bằng `LGT.guide` theo NPC.

## VIỆC KẾ
Xếp hạng ("Bảng vàng"), bơi–lặn; điểm Dẫn đường + nhiệm vụ cho Suối Trong; chỗ "ao riêng" (đã giả định Hồ Rừng, chờ ptg duyệt); ptg thử 2 điện thoại (yêu quái chung, ném người).
