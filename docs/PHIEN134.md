# PHIÊN 134 (2026-11-13) — Mục 1: đánh quái chưa tăng kinh nghiệm

## Nguyên nhân (đã rà mã)
- `js/ui/farm.js` → `reward()` khi hạ quái chỉ cộng **Tu Vi** (`settleKill`, mỗi lần 4% EXP cấp kế, trần 30 lần/ngày) và hạt sen. KHÔNG cộng **kinh nghiệm cấp độ** (công hạnh, `LGT.addXp`) — chính là thanh "Cấp" ở thẻ nhân vật/Nhiệm vụ nên người chơi thấy không tăng.
- Ghi chú: chỉ nút Đánh thường/Thương (`stone`/`spear`) gây sát thương lên quái bãi rừng; skill khác (Chém khí `conKhi.js`, `thietDau`...) CHƯA đánh được quái bãi rừng — để mục sau xử lý cùng "kỹ năng/cộng chiêu".

## Đã sửa
- `js/world/farm.js`: thêm `killXp(mon)` = `min(12, round(1 + 0,4×lv))`, tinh anh ×2, boss vùng ×5 (luôn ≥ 1).
- `js/ui/farm.js` `reward()`: nếu lần hạ đó còn Tu Vi trong trần ngày (`s.expGain > 0`) thì `LGT.addXp(killXp(mon))` + toast "+N kinh nghiệm". Lên cấp do `LGT.addXp` tự ăn mừng.
- `tests/farm.test.mjs` +1 test `killXp`. `sw.js` = `dgt-v136`. `npm test` 1047/1047.
- Số liệu TẠM, chờ ptg duyệt/cân bằng sau khi chơi thử.
- `HANDOFF.md` (173 KB) CHƯA thêm dòng "Phiên 134" vì quá lớn để đẩy qua công cụ; phiên sau thêm dòng đầu file: "Cập nhật Phiên 134: MỤC 1 XONG — ĐỌC `docs/PHIEN134.md`".

## Việc kế tiếp (theo thứ tự ptg giao)
2. Nhạc nền mất khi vào game (phải tự bật từ đoạn demo đầu).
3. Mở rộng toàn map (sát vách núi, rừng cây đều có quái; càng sâu càng mạnh) — Phiên 131–132 đã làm 4 vùng sâu, rà lại phần còn thiếu.
4. Sen không ảnh hưởng sức mạnh — Phiên 133 đã xong, còn 3 điểm chờ ptg quyết (`docs/PHIEN133.md`).
5. Phó bản (NPC → khu riêng, quái hồi sinh mạnh/to hơn qua 9 lượt, boss chính, phó bản đã chinh phục mạnh hơn khi quay lại).
6. Mảnh ghép boss → ghép linh thú trong hồ lô, cưỡi, kỹ năng boss tương tác với người chơi/quái.

## Prompt khởi động cho phiên mới (dán nguyên văn)
> Đọc `HANDOFF.md` (đầu file), `docs/PHIEN134.md`, rồi chỉ xem các chỗ cần sửa, không đọc hết repo. Mục 1 (đánh quái tăng kinh nghiệm) đã xong ở Phiên 134. Làm tiếp MỤC 2: nhạc nền khi vào game bị mất — phải tự bật từ đoạn demo đầu (tìm trong `js/ui/sound.js`, `js/ui/introUi.js`, `js/ui/soundLogic.js`; chú ý chính sách autoplay của trình duyệt: chỉ phát sau cử chỉ người dùng đầu tiên, nhớ nối từ nút bắt đầu/demo). Làm từng mục một, `npm test` phải xanh, đẩy GitHub rồi báo; cuối phiên viết `docs/PHIEN135.md` kèm prompt bàn giao chi tiết và chép nguyên văn quy tắc này để phiên sau (không biết gì) vẫn làm đúng.
