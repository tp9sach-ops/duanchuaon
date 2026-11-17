# QUY TẮC ĐỒNG BỘ ONLINE (ptg, 2026-11-17) — áp dụng cho MỌI phiên

> Tương đương mục 6b của PROMPT.md (PROMPT.md quá lớn để đẩy qua công cụ ở phiên 223; phiên sau có công cụ git đầy đủ thì chép mục này vào PROMPT.md mục 6b và thêm dòng nhật ký mục 7).

Dự án là **game online**: **mọi thứ ptg xây (hiệu ứng, tư thế, nhảy/bay, đánh, kỹ năng/chiêu, vật phẩm, âm thanh...) phải ĐỒNG BỘ để TẤT CẢ người chơi thấy nhau.**

Khi làm một tính năng mới, phiên làm việc phải:
1. Quyết định phát gì qua mạng: kênh `/combat` (`js/world/combatShare.js` + `js/net/combatLink.js`) hoặc `/players` (`js/engines/room.js` + `js/net/firebaseTransport.js`).
2. Vẽ lại được trên máy người nhận (bám avatar của người đó, không chỉ nhân vật của mình).
3. Có test.
4. Ghi vào bàn giao cái gì đã đồng bộ / chưa.

Tính năng chỉ chạy ở máy mình là CHƯA XONG.

**Nhật ký:** 2026-11-17 (Phiên 223) — ptg yêu cầu rồng hồng của Gậy như ý, tư thế TRƯỚC khi đánh, và cú nhảy của người khác phải thấy được; làm từng mục, xong đẩy GitHub rồi báo. Chi tiết: `docs/PHIEN223.md`.
