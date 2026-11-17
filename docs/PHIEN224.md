# Phiên 224 — Mục 1: GẬY DẠY CHÓ (Điện Máy Lam Sen, 150 lá bồ đề) — XONG, chờ ptg chơi thử

## Yêu cầu của ptg (2026-11-17)
Mục 1: vật phẩm mới ở Điện Máy, **150 lá bồ đề**: +1% sát thương; **đòn đánh thường thứ 3 "thương to gấp 3 lần"** + **con chó sói đầu to hình khí màu vàng vồ ra**; **ánh sáng chớp đều màu vàng ở 2 đầu**; khi cưỡi mà thu về tay thì **gậy xoay 3 vòng trên không rồi về tay**; **đánh nghe tiếng gỗ**. (ptg gọi là "gậy tre"; đã đổi tên hiển thị thành **Gậy dạy chó**, id nội bộ vẫn là `tre`.)
Mục 2 (CHỔI, 50 lá) làm SAU khi ptg nói "tiếp tục" — xem HANDOFF dưới.

## Quy ước TẠM (ptg chỉnh được)
- "Thương to gấp 3 lần" = **sát thương đòn 3 = 3 × đòn thường** (`BAMBOO.hit3 = 3`, thay hệ số 1,5 mặc định của đòn 3). Quái lan (splash) vẫn theo `BASIC.splashPct` của dmg mới.
- Cưỡi Gậy dạy chó: giống Gậy như ý (×1,25 tốc độ), hai đầu chớp vàng đều, vệt sáng vàng; thu về tay = nhấc lên cao, xoay 3 vòng (1,2 s) rồi hạ nhẹ xuống tay.
- Sói khí vàng: sống 1,15 s (hiện → phóng → ngoạm → tan), vồ xa 3,2–9 m tới mục tiêu (6 m nếu không có quái), tối đa 2 con cùng lúc (người khác: 6). Đầu to gấp `HEAD_BIG` = 1,9 lần.
- Tiếng gỗ: tổng hợp WebAudio `LGT.sfx.wood(step)` (đòn 1/2 gọn, đòn 3 nặng + dư âm). Cầm gậy thì KHÔNG phát tiếng ném đá cũ.

## Đã làm (mỗi file đẩy GitHub ngay, commit "Phiên 224 (mục 1, file N/n)")
| File | Việc |
|---|---|
| js/world/items.js | BAMBOO (150 lá, dmg 1.01, hit3 3), buyBamboo, finisherMul, trường `tre` |
| js/world/loadout.js | `tre` vào HOLDS (4 món), MOUNT_MUL, ownedMap, rideLabel |
| js/world/gearSync.js | chữ `b` = cầm, `t` = cưỡi Gậy dạy chó |
| js/world/board.js | `returnPose(t, id)`: id `tre` xoay 3 vòng + `lift` |
| js/world/wolfMath.js | chuyển động sói (WOLF, wolfRange, headingTo, wolfPose) |
| js/data/bambooGlb.js | mô hình nén ~18 KB nhúng base64 |
| js/ui/bambooMesh.js | hình gậy khối + GLB + chớp vàng đều + `buildBambooMount` |
| js/ui/weaponKit.js | bảng KIT `nhuy` / `tre` (build, load, pulse, scale, color) |
| js/ui/wolfFx.js | hình + vẽ sói khí vàng đầu to; sói của mình tự phát ra mạng |
| js/ui/sfx.js | `LGT.sfx.wood(step)` tiếng gỗ tổng hợp |
| js/ui/items.js | cửa hàng (150 lá, tự cầm), cầm tay/đeo lưng theo KIT, +1%, `onHit(step, target)` (tiếng gỗ + sói đòn 3), `finisherMul()`, `bambooOn` |
| js/ui/board.js | cưỡi Gậy dạy chó (chớp vàng + vệt), thu về tay xoay 3 vòng |
| js/ui/remoteGear.js, js/net/room.js | người khác thấy cầm / đeo lưng / cưỡi (`bamboo` trong gói `i`) |
| js/ui/bag.js | Túi đồ: ô "Gậy dạy chó", ảnh 3D, xem trước trên nhân vật |
| js/ui/farm.js, js/ui/yeuquai.js | `stepMulFor` (đòn 3 ×3), `weaponFx` → `LGT.items.onHit`, bỏ tiếng ném đá khi cầm gậy |
| js/world/combatShare.js, js/net/combatLink.js, js/net/room.js | ĐỒNG BỘ sói khí: hành động `w` (hướng + tầm vồ), `sendWolf` / `playWolf` (đúng QUY_TAC_DONG_BO) |
| tests | sửa 5 test đỏ (HOLDS 4 món, `tre`/`bamboo`), thêm test Gậy dạy chó (items, loadout, gearsync), `wolffx`, `wolfsync224`; đăng ký vào `npm test` |
| sw.js | `dgt-v210` |

Kết quả `npm test`: **1425 test, tất cả xanh** (1 test flypose đã sửa cho hook `wood`).

## CHƯA nhìn bằng mắt (môi trường AI không có WebGL) — ptg xem giúp
1. Gậy dạy chó trên tay / sau lưng: kích thước (`BAMBOO_SCALE` 1,4), hướng GLB (có thể ngược đầu).
2. Sói khí: kích thước, độ sáng, đầu to (`HEAD_BIG`, `WOLF.scale`), tầm vồ.
3. Chớp vàng hai đầu đều, vệt vàng khi cưỡi bay.
4. Thu về tay xoay 3 vòng (`TRE_SPIN_S`, `TRE_LIFT` trong js/world/board.js).
5. Tiếng gỗ (`sfx.wood`): to / nhỏ, có hợp không.

## VIỆC KẾ — Mục 2: CHỔI (50 lá bồ đề, mua ở Điện Máy) — làm khi ptg nói "tiếp tục"
Yêu cầu: đòn 3 = **đập chổi**: đầu chổi to lên đập xuống, **lá / cát / đá bay lên**; đánh có **gió nhẹ thổi lên từ phía sau**; **tiếng quét lá và xột xoạt** của chổi; **cưỡi chổi** thu về thì **phi lên cao rồi nhẹ nhàng hạ xuống tay**.
Cách làm (theo đúng khuôn Gậy dạy chó, mỗi file đẩy ngay): world/items.js (BROOM, buyBroom, `choi`) → loadout.js (HOLDS thêm `choi`) → gearSync.js (chữ mới, vd `o`/`u` — kiểm chữ chưa dùng) → world/board.js returnPose id `choi` (bay lên cao, hạ nhẹ) → nén `broom.glb` (7 MB → ≤ 1,5 MB, nhúng base64 như bambooGlb.js; script nén ở HANDOFF_gay-tre.md) → ui/broomMesh.js + weaponKit `choi` → ui/broomFx.js (đập chổi, lá/cát/đá bay, gió sau lưng) → sfx tổng hợp `sweep`/`xotxoat` → nối items/board/remoteGear/bag/room/farm/yeuquai + đồng bộ online (hành động mạng mới) + test + THIRD_PARTY (đã có KargaEntiti CC-BY-4.0).
