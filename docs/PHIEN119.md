# Phiên 119 — Tư thế chiến đấu theo clip mẫu

## Quy tắc người dùng (chép nguyên văn)
For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff.

## Yêu cầu ptg (12/11)
Làm lại tư thế di chuyển, đi đứng, đánh, dùng skill, đánh thường như trong clip (game 3D hành động: thế sẵn sàng khom người, chạy nghiêng, chém quét vòng cung có vệt sáng, xoay người chém 360°, bổ cao), rồi đẩy lên GitHub. Chỉ xem chỗ cần thiết, cập nhật không lỗi.

## Đã làm
- `js/world/combo.js` (logic thuần, test): `KINDS` (ngang, nguoc, xoay, khi — mốc [giây, arm, lean, yaw, lunge]), `CHAIN` ngang→nguoc→xoay, `nextKind(prev, gap)` (CHAIN_GAP 0,6 s), `comboPose`, `comboEnd`, `hitAt`, `SLASH` (số liệu vệt chém), `applyStance(q, s, {walk, sit, busy, hold})` (thế sẵn sàng đè lên kết quả `chibiPose`, tính lại hông để chân không lún đất; KHÔNG sửa `chibiRig.js`).
- `js/world/avatarChibi.js`: `swing(arg)` — không đối số = đánh thường tự nối chuỗi; số (skill Chém khí gọi `swing(SWING_S)`) = kiểu `khi`; chuỗi = đúng kiểu; trả về tên kiểu. `setStance(bool)`. Áp `rig.rotation.y` (xoay thân) + `rig.position.z` (lao tới) theo `swing.yaw/lunge`. Proc avatar (`avatar.js`) không đổi: `swing()` của nó trả undefined nên `combatPose` bỏ qua vệt.
- `js/ui/combatPose.js`: mỗi 40 ms đọc `LGT.yq.status()` + `LGT.farm.status()`; hồi chiêu Thương/Ném đá nhảy lên = vừa ra đòn (kể cả Tự Động Hàng Yêu) → quay mặt mục tiêu, `avatar.swing()` + vệt chém / `avatar.act('throw')`; đang giao chiến → `avatar.setStance(true)` (giữ 4,5 s sau đòn cuối, hoặc khi có yêu quái / quái trong tầm). KHÔNG sửa logic đánh. Gắn trong `js/ui/thietDau.js` (try/catch, cạnh `initConKhi`).
- `js/scene/slashFx.js`: vệt chém sáng additive (cung hình thoi, đầu sáng đuôi mờ), 4 ô tái dùng, bám `LGT.world.pos`, gắn vào `LGT.scene`.
- `tests/combo.test.mjs` (7 test) thêm vào `npm test`.

## Kiểm chứng
- 7/7 test mới đạt cục bộ (dùng bản rút gọn `chibiRig.js` + `conKhi.js` giả để chạy ngoài repo; CHƯA chạy `npm test` đầy đủ trên repo thật, CHƯA chơi thử trên trình duyệt/điện thoại).
- Diff commit `0235db5` kiểm lại: `avatarChibi.js` chỉ đổi đúng các dòng nêu trên; `thietDau.js` +2 dòng.

## Số liệu TẠM (cần ptg duyệt)
Thời lượng/góc từng đòn, CHAIN_GAP 0,6 s, STANCE_HOLD 4,5 s, tầm/độ rộng vệt chém. Chưa đổi sát thương hay hồi chiêu (đòn Thương vẫn theo `SPEAR.cd`, `spearDamage`).

## Chưa làm / việc kế
- Chạy `npm test` toàn bộ + chơi thử: xem chân có lún/lơ lửng ở thế sẵn sàng, vệt chém có đúng hướng khi quái ở bên cạnh.
- Quái chưa bị hất lùi / không có số sát thương bay như clip (cần API `LGT.farm.hurt/nudge`); thanh combo vàng; camera sau lưng gần hơn khi giao chiến.
- Chưa tư thế riêng cho Thiết đầu công (dash) và ném đá ngoài `act('throw')` có sẵn.
- Tiếng/độ rung theo nhịp từng đòn (hit-stop) chưa làm.
