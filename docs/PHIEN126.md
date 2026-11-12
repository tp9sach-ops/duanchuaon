# Phiên 126 — Múa côn, hồ lô, hồn quái bay vào hồ lô, thanh máu/mana trên đầu

## Quy tắc người dùng (chép nguyên văn)
For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff.

## Yêu cầu ptg (12/11, gốc)
Làm lại tư thế di chuyển, đi đứng, đánh, dùng skill, đánh thường như trong clip. Thêm: (1) thương BỎ MŨI NHỌN, cầm ở GIỮA, múa chiêu theo combo khi ấn nút đánh nhiều lần; (2) BỎ NÉM ĐÁ → chuyển thành đánh thường; (3) các chiêu còn lại KHÁC NHAU THEO HỆ PHÁI; (4) trên PC điều khiển bằng A D W S; (5) nhân vật có THANH MÁU + MANA trên đầu khi đánh quái; (6) bấm TỰ ĐỘNG đánh: nhân vật LAO VÀO quái trong bán kính nhất định để đánh, QUÁI TRÂU HƠN, SÁT THƯƠNG CAO HƠN; (7) nhân vật ĐEO HỒ LÔ ở eo; đánh quái xong quái KHÔNG biến mất mà BAY VÀO HỒ LÔ; (8) rồi đẩy lên GitHub.

## Lưu ý phiên bản
Nhiều phiên Claude Code chạy song song nên SỐ PHIÊN TRÙNG (đã có hai “Phiên 119”: tư thế chiến đấu và dời bãi quái Mộc). Phiên này đặt 126. TRƯỚC KHI SỬA một file: tải bản mới nhất từ `main` (phiên khác có thể đã sửa — ví dụ Phiên 120 đã thêm `weaponVisible` và sửa `armR` trong `combo.js`).

## Đã làm (commit fb0e6c9, 19e1193, 3b69971)
- `js/world/combo.js`: thêm đòn `mua` (múa côn: xoay hai vòng chong chóng trước người), chuỗi nay 4 đòn `mua → ngang → nguoc → xoay`; mốc thứ 7 của `keys` = `spin` (rad, mốc cuối bội 2π); `comboPose` trả thêm `spin`; `xoay` 360° cũng xoay côn 2 vòng. `SLASH` không đổi (múa côn không có vệt ngang).
- `js/world/avatarChibi.js`: côn BỎ MŨI NHỌN (xóa mũi thương + tua của Phiên 120), cán đối xứng 1,5 m nắm đúng giữa; `staff.rotation` thứ tự YXZ, xoay `y` = `pose.spin` (giả định trục y của bàn tay là trục ngang khi tay đưa ngang trước → côn quay trong mặt phẳng dọc; CHƯA xem trên màn hình); HỒ LÔ gắn `B.hips` (0,21; 0,05) ở eo trái (không có ở NPC cà sa); API mới `gourdPos()`, `pulseGourd()`, `setBars(hp 0..1|null, mp 0..1)` (sprite 192×48 ở y = 1,9 dưới tên).
- `js/world/soul.js` + `tests/soul.test.mjs`: `orbPos/orbScale/soulColor/diffMons/killed` (logic thuần). `js/scene/soulFx.js`: đốm hồn additive + đuôi, 6 ô.
- `js/ui/combatPose.js`: quái biến mất khỏi `LGT.farmView.mons` ngay sau khi ra đòn (≤ 2,5 s, ≤ 32 m) → thả hồn bay vào hồ lô (màu theo Hệ); Thương VÀ Ném đá đều hiện thành đòn đánh thường (chuỗi múa); thanh trên đầu: Sinh Lực lấy `LGT.farmCombat.hp/max`, Chân khí là bộ đếm TẠM trong `combatPose` (Chém khí −1 lần 30, hồi 5/giây, CHƯA chặn skill khi hết).
- `package.json`: thêm `tests/soul.test.mjs`.

## Kiểm chứng
- 13/13 test (combo + soul) đạt cục bộ trên bản rút gọn `chibiRig.js`/`conKhi.js` giả. CHƯA chạy `npm test` đầy đủ, CHƯA chơi thử trên trình duyệt/điện thoại.
- Diff commit 3b69971 đã đối chiếu: chỉ đổi đúng các dòng nêu trên.

## CHƯA LÀM (thứ tự đề xuất, mỗi phiên một mục)
1. A D W S trên PC: CHƯA KIỂM TRA xem `js/world/world.js`/`hud` đã có phím chưa (phải đọc trước khi sửa).
2. Bỏ Ném đá thật sự: `js/world/dock.js` (`dockButtons`) + `js/ui/dock.js` (ACT.da) + `ui/yeuquai.js` / `ui/farm.js` `stone()`; hiện chỉ đổi hình ảnh, logic ném đá (tầm xa 18 m, sát thương `stoneDamage`) vẫn còn. Cần quyết định đánh thường là cận chiến (tầm ngắn) hay vẫn tầm xa.
3. Tự động đánh LAO VÀO quái trong bán kính R (cần quyết định R) + quái trâu hơn/sát thương cao hơn: sửa `js/ui/farm.js` (`autoStep`, dùng `world.dash`/`move`), `js/world/autoHunt.js`, `js/data/monsters.js` / `js/data/monsterAI.js` (số liệu TẠM, đừng đổi khi chưa chốt với ptg).
4. Chiêu theo HỆ PHÁI (mỗi hệ một bộ chiêu, tư thế + vệt màu riêng): cần ptg nêu rõ có bao nhiêu hệ phái, tên, mỗi hệ dùng vũ khí/chiêu gì (xem `js/world/elements.js`, `heSeats.js`, `skillCatalog.js`, `nguonTuVi.js`, `LGT.he`). Cách làm gợi ý: thêm bảng `KINDS/CHAIN/SLASH` theo hệ trong `combo.js`, `avatar.swing()` nhận hệ.
5. Thanh Chân khí thật (tiêu hao + hồi + chặn skill) — cần quy định trong GDD.
6. Quái hiện biến mất NGAY rồi mới có đốm hồn bay (chưa là chính thân quái thu nhỏ bay vào): muốn thế cần sửa `js/scene/farm.js` + `js/ui/farm.js` (giữ quái chết vài trăm ms rồi co lại). Boss (`LGT.yq`) chưa có hồn bay.
7. Quái hất lùi, số sát thương bay, số combo vàng, camera gần khi giao chiến, hit-stop, vệt chong chóng của đòn múa.

## Số liệu TẠM cần ptg duyệt
Thời lượng/góc từng đòn (múa 0,8 s, ngang/ngược 0,74 s, xoay 1,1 s), CHAIN_GAP 0,6 s, STANCE_HOLD 4,5 s, kích thước/vị trí hồ lô, cán côn 1,5 m, thời gian hồn bay 0,9 s, điều kiện "quái bị hạ" (biến mất trong 2,5 s sau đòn, ≤ 32 m).
