# PHIÊN 89 — Câu cá: hoa sen trên đầu, ném cầu thẳng trước mặt, cá văng lên tay; Ném NPC — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Đọc: PROMPT.md → PHIEN88.md → file này. **Nguồn mã thật hiện tại: repo `tp9sach-ops/duanchuaon`** (ptg báo 2026-11-10; Phiên 88). Repo cũ `loinhuan.github.io` chỉ tới Phiên ~64 → không dùng nữa (PROMPT.md mục 1 vẫn ghi repo cũ — cần ptg xác nhận địa chỉ trang mới).

## Yêu cầu ptg (2026-11-08) → đã làm
1. **Cá cắn mồi, bấm được → hoa sen hiện trên đầu nhân vật, rung, cửa sổ 0,8 giây.** `js/scene/fishing.js`: `headLotus` (hoa + quầng sáng) nảy lên, rung mạnh (đứng yên nếu "giảm chuyển động"), điện thoại rung 0,8 s. **Cửa sổ bấm**: `cua` của 5 cầu từ 0,5–0,9 → **0,8 / 0,9 / 1,0 / 1,1 / 1,2 giây** (cầu gỗ = 0,8; vẫn tăng dần theo cầu). *Cách hiểu "rung tăng lên 0.8s" là của mình — nếu ptg muốn khác (vd. mọi cầu đều 0,8) thì sửa `ORBS` trong `js/world/fishing.js`.*
2. **Luôn ném cầu thẳng trước mặt.** `castTarget(player, water, ry)` (`js/world/fishingView.js`): rơi cách người `THROW_AHEAD` = 4,2 m theo hướng nhìn, nếu ra ngoài nước thì kéo vào mép nước (vẫn cùng phía trước). `js/ui/fishing.js begin()`: nếu mặt nước lệch > ~50° so với hướng nhìn thì nhân vật **quay mặt về phía nước** rồi mới ném; lưu `sess.ry`. `LGT.world` có thêm `facing` (đọc) và `face(ry)`.
3. **Cá câu được văng lên tay.** `js/scene/fishing.js`: cá 3D (dùng `makeFish` — nay export từ `js/scene/pondFish.js`; kiểu dáng theo loài, cỡ lớn dài 1,5×, hiếm 1,1×) bay vòng cung từ chỗ câu về tay, xoay, rồi cầm trước ngực quẫy đuôi tới khi "Thu cá" / "Phóng sinh". `LGT.fishing.caught` (getter mới).
4. **Gần NPC → ném được NPC.** `js/world/npcThrow.js` (thuần, 8 test): NPC trong 2,2 m; ném thẳng trước mặt (quay mặt về NPC nếu lệch), tầm ≥ 3 m, mạnh hơn → xa hơn (`throwRange`, tối đa 40 m, dừng trước vật cản); KHÔNG ném khi đứng/NPC trong khuôn viên chùa; hồi chiêu 10 s mỗi NPC; không mất hạt sen. NPC bay (cao 2,6 m, xoay) → ngồi 3,5 s → tự đi về chỗ cũ. `js/scene/npc.js` (`LGT.npcCtl` = `entities()`/`launch(id,to)`), `js/ui/npcThrow.js` (`LGT.npcThrow`), nút "Ném NPC" 🧑‍🌾 trong cụm nút (`js/world/dock.js`, `js/ui/dock.js`; nhường "Ném người" nếu có người chơi gần). Khởi tạo trong `js/ui/hudMenu.js`. `LGT.act('nemnpc')` đã gọi nhưng CHƯA có nhiệm vụ nào dùng.

## Kiểm
- `npm test` **805/805** (Node 22), gồm `tests/npcthrow.test.mjs` 8 test và các test câu cá cập nhật.
- Chromium thật (giả lập): hoa sen hồng + quầng sáng hiện trên đầu; cá koi cầm ở tay; NPC "Cô Lan bán hoa" bay → ngồi → đi về (đo vị trí theo thời gian). Phiên câu thật không chụp được trong WebGL phần mềm (cửa sổ 0,8 s ngắn hơn một khung chụp) → hoa/cá được kiểm bằng phiên GIẢ. Chưa thử trên điện thoại thật.

## CHƯA LÀM / CHỜ PTG
- Nhiệm vụ cho "Ném NPC" (nếu muốn); hiệu ứng/ âm thanh lúc bị ném; chữ nhãn loài/cỡ cá nổi trên tay (hiện chỉ có hình + thông báo).
- Cầu thả có thể rơi ngay sau lưng vật cản nếu người đứng sát mép; chưa chặn cú ném qua tường nước.
- Việc kế từ PHIEN88 vẫn giữ: room.js đổi phòng theo zone; kiến trúc thêm (chờ ptg chọn); GAS Donations; THIET_KE_CHIEU_SAU mục 6.
- Việc cũ ở repo kia (Phiên 64: ăn mừng nhiệm vụ, sửa rừng thông) đã có sẵn trong repo này.
