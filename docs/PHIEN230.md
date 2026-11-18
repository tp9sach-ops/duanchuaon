# Phiên 230 — Mục 2: CHỔI (50 lá bồ đề, Điện Máy Lam Sen)

Mục 1 (Gậy dạy chó) đã xong từ Phiên 224/227, không làm lại.

## Đã làm
- Luật: `js/world/items.js` (BROOM, buyBroom, `choi`), `loadout.js` (HOLDS `choi`, cưỡi ×1,25), `gearSync.js` (cầm = `c`, cưỡi = `u`), `board.js` (`returnPose('choi')`: phi lên 3,2 m trong 0,6 s → lơ lửng 0,25 s → hạ êm 1,1 s xuống tay).
- Đập chổi + gió: `js/world/broomMath.js` (thuần, có test), `js/ui/broomFx.js`. Đòn 3: chổi phình to giơ lên rồi đập; 57 mảnh lá/cát/đá tung lên theo seed. Mỗi đòn: gió nhẹ thổi lên từ phía sau. Sát thương KHÔNG thêm (đòn 3 vẫn ×1,5 + lan như cũ); chổi không có +1%.
- Hình: `js/ui/broomMesh.js` + `js/data/broomGlb.js` (571 KB, nạp lười); `weaponKit.js` có `choi`.
- Tiếng: `LGT.sfx.broom(step)` (quét lá, xột xoạt, đòn 3 thêm bịch + lá xào xạc). Chổi/gậy cầm thì bỏ tiếng ném đá (`LGT.items.weaponSfx`).
- Nối: items (cửa hàng, mua, onHit), ui/board (cưỡi), remoteGear (người khác), bag, room (gói `c`, `broomFx`), combatShare/combatLink (hành động `q`, `sendBroom`).
- Tests: `tests/broom230.test.mjs` (đăng ký trong package.json); sửa `gearsync.test.mjs` (khoá `broom`). sw VERSION → dgt-v216.

## CHƯA kiểm bằng mắt trên máy thật
Kích thước/hướng cầm chổi (BROOM_SCALE 1,3), độ cao/tốc độ đập, độ to đầu chổi (BROOM.head 2,6), số mảnh bay, độ êm lúc hạ xuống tay — đều là số TẠM. Sync online chưa thử với 2 máy.
