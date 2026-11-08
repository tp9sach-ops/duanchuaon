# PHIÊN 60 — Làm lại bộ nhiệm vụ: 7 chương dẫn người chơi khám phá hết mọi thứ — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

**Yêu cầu (ptg, 2026-11-08):** "Tiếp tục. Và làm lại 1 việc nhỏ là làm lại bộ nhiệm vụ sao dẫn dắt người chơi có thể khám phá hết tất cả mọi thứ, hiện tại người chơi vào không biết làm cái gì trước." Đọc: PROMPT.md → KE_HOACH_TONG.md → PHIEN59.md → file này.

## Vì sao người chơi bị lạc (đã đọc mã)
- Sau cốt truyện chương 1, thứ tự việc (`CHAIN`) bắt đầu bằng việc hằng ngày ("Thắp nén nhang") rồi nhảy lung tung; chỉ có 3 nơi (làng, thác, rừng) có nhiệm vụ ghé riêng; sân/chánh điện/nhà tổ/trà thất/vườn thiền/gác chuông/hồ cá/Quan Âm/chợ/3 cửa hàng/Đại Phật không có nhiệm vụ nên không bao giờ được dẫn tới.
- Bảng nhiệm vụ là danh sách phẳng 25 dòng, không rõ làm gì trước.

## ĐÃ LÀM
1. `js/world/chapters.js` (MỚI): 7 chương, thứ tự làm = thứ tự đi: 1 Làm quen (cốt truyện) → 2 Dạo trong chùa → 3 Tu tập → 4 Ra làng → 5 Gieo duyên → 6 An cư → 7 Trường kỳ. `CHAIN` nay lấy từ đây (nextGoal.js vẫn export `CHAIN`). Hàm `chapterOf`, `chapterProgress`.
2. `js/world/quests.js`: +12 nhiệm vụ "ghé nơi" `v-<id>` (chánh điện, Quan Âm, Nhà Tổ, vườn thiền, trà thất, gác chuông, hồ cá, chợ, Điện Máy Lam Sen, Di Động Sen Vàng, Kim Hoàn Ngọc Lan, Đại Phật) — mỗi cái xp 12 + 1 hạt sen (GIÁ TRỊ TẠM, ptg chưa duyệt). Tổng 37 nhiệm vụ.
3. `js/world/questGuide.js`: nhiệm vụ `visit:<id>` tự có bước dẫn đường (`visitSteps`): tới chỗ đứng `PLACE_STAND`, nơi ngoài chùa đi qua Tam quan ra làng trước.
4. `js/world/nextGoal.js`: thẻ "Việc kế tiếp" ghi rõ chương, ví dụ "Chương 2 · Dạo trong chùa · 3/9" (kể cả chương 1 cốt truyện); kết quả có `chapter {n,total,ten,done,of}`.
5. `js/ui/quest.js` + `css/quest.css`: bảng Nhiệm vụ chia theo chương (tiêu đề + mô tả + x/y), việc kế tiếp có dấu ▶ + nền vàng, việc hằng ngày có nhãn "hằng ngày", chương xong thì mờ; `js/ui/story.js` đặt `LGT.nextGoalId` để bảng biết việc kế tiếp.
6. `js/world/journey.js`: `PLACE_QUEST` có đủ 12 nơi mới (nút "Dẫn đường" trong Lộ trình).
7. `tests/chapters.test.mjs` (MỚI, 4 test, trong `npm test`): mọi nhiệm vụ thuộc đúng 1 chương; mọi nơi trong PLACES có nhiệm vụ ghé + chỗ đứng đi tới được + dẫn đường; ghé đúng nơi thì xong; đi hết chuỗi qua cả 6 chương. `tests/nextgoal.test.mjs` cập nhật (việc đầu sau cốt truyện là `v-chanhdien`, vòng lặp 90). `sw.js` = `dgt-v65`.
- `npm test`: **662/662** (Node 22).

## LƯU Ý
- Người chơi cũ đã ghé nhiều nơi: các nhiệm vụ `v-` sẽ tự hoàn thành ở sự kiện kế tiếp (nhận xp/sen một lần).
- Nơi mới thêm vào PLACES sau này PHẢI có: nhiệm vụ `v-<id>` + chỗ đứng trong `PLACE_STAND` + id trong chương (test chapters sẽ đỏ nếu thiếu).
- Cửa hàng 9 Sạch và Tách Hoa chưa nằm trong PLACES nên chưa có nhiệm vụ ghé (có thể thêm).

## CHƯA KIỂM BẰNG MẮT
Bảng Nhiệm vụ chia chương trên điện thoại (độ dài, cuộn), thẻ "Việc kế tiếp" với nhãn chương dài trên màn nhỏ, đường dẫn tới từng nơi mới trong game thật. Node 20 chưa chạy.

## CẦN PTG DUYỆT
Thứ tự chương, thưởng 12 điểm/1 sen cho mỗi nơi ghé, và có muốn thêm chương/nhiệm vụ cho Đại Phật, rừng, sông hồ mới sau này không.
