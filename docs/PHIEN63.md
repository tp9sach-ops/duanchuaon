# PHIÊN 63 — Hệ thống SỨC MẠNH: khiêng và ném vật nặng — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

**Yêu cầu (ptg, 2026-11-08):** "Khi công đức, luyện thân cao thì khiêng được thứ nặng tương ứng để ném, có thể ném người chơi." Trả lời câu hỏi Phiên 62: (1) **không đồng ý vẫn bị khiêng lên ném nếu cấp và sức mạnh của người đó nhỏ hơn**; (2) kỹ năng chiến đấu = **ném đá, dùng thương để tiếp cận đánh**; hết máu thì **hồi sinh tại cửa chùa** (dành cho việc yêu quái, Phiên 64). Phiên này làm việc 2 (sức mạnh + khiêng/ném VẬT). Đọc: PROMPT.md → KE_HOACH_TONG.md → PHIEN62.md → file này.

## ĐÃ LÀM
- `js/world/strength.js` (MỚI, logic thuần, có test): `strengthOf({level, khinh, sen})` = cấp×6 + bậc Khinh thân×10 + √(tổng hạt sen từng kiếm)×2 (cấp 1 mới vào = 6; tối đa cấp 10 + bậc 8 + 1000 sen ≈ 203); `tierOf` (Tay yếu / Khỏe khoắn ≥20 / Lực sĩ ≥45 / Dũng sĩ ≥80 / Kim cương lực ≥120); `carryLimit(str)` = 8 + 1,6×str kg; `strengthNeeded(kg)`; `throwRange(str, kg)` (nhẹ + mạnh → xa, 2–40 m, không khiêng nổi → 0); `landing()` (đi từng 0,5 m, dừng trước vật cản/nước); `createCarry()` (vật khiêng, bay vòng cung, tự về chỗ cũ sau 90 giây).
- 8 vật khiêng, chỗ đặt đã kiểm đi được/không chồng nhau: Thùng gỗ 6 kg (sân chùa) · Bó củi 12 (đường làng) · Bao gạo 25 (chợ) · Chum sành 45 (chợ) · Tảng đá nhỏ 70 (bãi rừng) · Đá cảnh hồ cá 90 · Tảng đá lớn 120 (bãi thác) · Khúc gỗ lim 200 (bãi rừng, cần sức ≥ 121). Cấp 1 khiêng được thùng và củi; muốn lim phải cày công đức + luyện thân.
- `canGrab(a, b)` — **luật ptg**: người kia phải có cấp VÀ sức mạnh đều NHỎ HƠN (nghiêm ngặt) mình; thêm điều kiện mình khiêng nổi 55 kg (sức ≥ 30). Không cần họ đồng ý. Trả lý do `level` / `strength` / `weight`.
- `js/scene/carry.js` (MỚI): vẽ vật (hộp/trụ/đá), vật đang khiêng nằm trên đầu nhân vật, vật bay vòng cung, vòng sáng dưới vật gần nhất; nối vào `js/scene/index.js`.
- `js/ui/carry.js` (MỚI): `LGT.carry` / `LGT.strength`; gần vật (≤ 2,2 m) → nút **Khiêng**; đang khiêng → **Ném** (to) + **Đặt xuống**; vật quá nặng → thông báo cần sức mạnh bao nhiêu / bạn có bao nhiêu; vào nhà hoặc ngồi khi đang khiêng → tự đặt xuống. Nút thêm vào cụm góc phải-dưới (`js/world/dock.js`, `js/ui/dock.js`) kèm bong bóng chỉ chỗ một lần. Túi đồ có dòng "Sức mạnh: N · danh hiệu · khiêng tối đa X kg".
- Tests: `tests/strength.test.mjs` (8 test mới), `tests/dock.test.mjs` +1 và sửa 1. `sw.js` = `dgt-v68`. `npm test`: **678/678** (Node 22).

## CHƯA LÀM (phần "ném NGƯỜI CHƠI") — vì sao
- Người chơi khác hiện chỉ là hình ảnh nhận qua máy chủ (Apps Script, thăm dò chậm: `js/net/roomClient.js`). Muốn ném thật phải: (a) gửi sự kiện "bị khiêng/ném" lên phòng, (b) máy NẠN NHÂN nhận và tự dịch chuyển vị trí của chính nó (máy nào cũng chỉ tin vị trí do chính nó gửi), (c) gửi kèm cấp + sức mạnh để so sánh `canGrab`. Cần sửa `gas/Code.gs` (không chạy thử được trong môi trường này, 403 tới script.google.com) và `engines/room.js` → rủi ro cao, chưa làm. Luật `canGrab` và `landing` đã sẵn sàng và có test để nối vào.
- **Rủi ro cần ptg cân nhắc trước khi mở cho người thật:** luật cho phép người mạnh ném người yếu không cần đồng ý → người mới (cấp thấp) dễ bị người cũ quấy rầy liên tục. Đề xuất giữ luật của ptg nhưng thêm: không ném khi nạn nhân đang trong sân chùa/chánh điện/đang ngồi thiền, hồi chiêu 10 giây cho mỗi cặp, và người bị ném rơi an toàn (không mất gì). Chờ ptg duyệt.
- Chưa làm chậm bước đi khi khiêng nặng; chưa có âm thanh/hoạt cảnh ôm vật (nhân vật chỉ đội vật trên đầu); chưa nhìn bằng mắt vị trí các vật trong cảnh thật.

## CHƯA KIỂM (cần ptg xem trên trang thật)
Hình dáng/độ lớn các vật, vòng sáng, ném đi đâu theo hướng nhìn của nhân vật (đọc `avatar.group.rotation.y`), nút Khiêng/Ném trên điện thoại có che gì không. Node 20 chưa chạy.

## VIỆC KẾ (mỗi việc xong báo, chờ "tiếp tục")
1. **Yêu quái mỗi tháng một lần** (Phiên 64): đá / nước / lửa; kỹ năng chiến đấu = **ném đá** (dùng vật khiêng sẵn có + đá nhặt) và **thương** (tiếp cận đánh gần); máu người chơi, hết máu → hồi sinh tại cửa chùa (Tam quan); xuất hiện một lần/tháng theo lịch thật (lưu `lgt.yq`), tấn công làng; thu phục thưởng lá bồ đề + điểm cấp + cộng sức mạnh. Còn cần ptg chốt: máu/sát thương/độ dài trận, thưởng cụ thể (bao nhiêu lá), có cho người chơi cùng đánh không (đa người qua máy chủ — khó như ném người).
2. Ném người chơi qua mạng (xem trên) sau khi ptg duyệt biện pháp chống quấy rối.
3. "Người không rành vẫn chơi được" (còn lại): nút Dẫn đường nhấp nháy cho nhiệm vụ mới, nhãn chữ cho nút góc trên, màn hướng dẫn lần đầu.
4. Còn mở: sông + hồ, kiến trúc thêm, Suối Trong, trang Tu tập/NPC trong Lộ trình, kết quả phép 8 `chan-doan.html` (PHIEN55).
