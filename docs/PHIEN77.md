# PHIÊN 77 — Cá 3D bơi trong ao cá riêng — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Đọc: PROMPT.md → KE_HOACH_TONG.md → PHIEN74.md → PHIEN76.md → file này.

## QUYẾT ĐỊNH (ptg chưa nói rõ "ao riêng" ở đâu — GIẢ ĐỊNH CẦN DUYỆT)
Ao cá riêng = **Hồ Rừng** (bãi rừng thông, có Thủy tạ). Mỗi người chơi tự thấy ĐÀN CÁ MÌNH ĐÃ "THU CÁ" bơi ở đó (đọc `LGT.fishing.state.pond`, vẽ trên máy mình, không gửi mạng). Nếu ptg muốn ao nằm trong sân nhà đã mua (js/scene/land.js) thì chuyển `LAKE` thành toạ độ sân nhà — logic `js/world/pondFish.js` nhận `lake` làm tham số.

## ĐÃ LÀM
- `js/world/pondFish.js` (MỚI, thuần): `fishLook` (kiểu dáng/màu theo loài; cỡ lớn dài ×1,5; hiếm ×1,1), `fishPose` (đường bơi elip quanh tâm hồ suy từ uid → ổn định giữa các lần mở game; cá bơi giữa nước, rùa/ba ba sát đáy, mực lửng lơ; luôn trong hồ, dưới mặt nước), `shownFish` (tối đa 30, bỏ dữ liệu hỏng).
- `js/scene/pondFish.js` (MỚI): vẽ cá (thân + đuôi + vây lưng), rùa/ba ba (mai + đầu + 4 chân), mực (nón + vây + 4 tua), đuôi vẫy; dựng lại đàn khi danh sách đổi, mỗi khung chỉ dời vị trí. Gắn trong `js/scene/index.js` (`pondFish.update(t)`). Sổ tay nhắc "cá bơi thật trong Hồ Rừng".
- Tests: `tests/pondfish.test.mjs` (4; 30 con × 6 loài × 400 thời điểm đều ở trong hồ, dưới mặt nước). `npm test` **741 test**; 1 test CŨ `tests/fireflies.test.mjs` ("không đứng yên: sau 20 s…") rớt MỘT lần vì dùng số ngẫu nhiên (chạy lại 6/6 đều qua, cũng qua khi bỏ thay đổi của phiên này) → test dễ chập chờn, không liên quan cá. `sw.js` = `dgt-v83`.

## CHƯA KIỂM — cần ptg nhìn máy thật
Hình dáng cá/rùa/mực, kích thước so với hồ, màu; cá có bị lún xuống đáy/nhô lên mặt nước không (`WATER_TOP` 0,14, nước ở `js/scene/river.js`). Chỉnh ở `js/scene/pondFish.js` / `js/world/pondFish.js`.

## VIỆC KẾ
Trang Tu tập + NPC trong Lộ trình, Xếp hạng ("Bảng vàng"), bơi–lặn; điểm Dẫn đường + nhiệm vụ cho Suối Trong; ptg thử 2 điện thoại (yêu quái chung, ném người).
