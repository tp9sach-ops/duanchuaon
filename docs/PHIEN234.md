# Phiên 234 — Chổi: mục 2 (đầu chổi đập + cơn gió lốc) và mục 3 (chổi phát sáng)

Yêu cầu (ptg): mục 1 dép lào đã làm ở Phiên 233 → bỏ qua. Làm tiếp: **đòn 3 đầu chổi đập (không phải cán) + 3 cơn gió lốc thổi ra; đánh 9 cái xuất hiện cơn lốc TO từ sau nhân vật đi tới, trúng quái gây sát thương.**

## Mục 2 — XONG
- **Sửa hướng chổi khi đập** (`js/ui/broomFx.js`): trước đây `broom.rotation.x = Math.PI` lật chổi nên CÁN đập xuống đất (mô hình GLB và chổi khối đều có đầu rơm ở −y; đã đo lại bằng three.js). Giờ không lật; đáy đầu rơm đặt đúng điểm đập (lún 5 cm), cán chổng lên trời.
- **Cơn lốc** — logic thuần `js/world/tornadoMath.js` (có test), hình `js/ui/tornadoFx.js` (phễu 7 vòng trụ mờ quay + lá bay xoáy + bụi chân), sát thương `js/ui/tornadoHit.js` (cùng đường với rồng hồng: `LGT.farm.remoteHit` + `claimKill`, yêu quái hằng tháng qua `LGT.yq.ramHit`).
  - Đòn 3 (và 6): 3 lốc nhỏ tỏa quạt từ chỗ đầu chổi đập, bắt đầu khi đầu chổi chạm đất.
  - Đòn 9: thêm 1 lốc TO xuất phát SAU LƯNG nhân vật 3,5 m, đi xuyên qua người rồi tiến về phía trước.
  - Đếm đòn: `countBroomHit` (đòn 1 sau đòn 3 trọn → sang chuỗi mới; nghỉ > 2,5 s → đếm lại).
- **Đồng bộ online**: gói `q` (đập chổi) thêm trường thứ 5 `w` (0/1/2); `w = 0` vẫn đúng 4 trường như cũ (bản cũ đọc được). Người khác thấy lốc nhưng KHÔNG gây sát thương lần hai (chỉ máy người đánh trừ máu).
- Nối: `items.js` (đếm + `onTornadoHit`), `combatShare.js`, `combatLink.js`. Test: `tests/tornado234.test.mjs` (đăng ký package.json). sw → dgt-v219.
- Số TẠM (chờ ptg chơi thử rồi chỉnh) — `TORN` trong tornadoMath.js: lốc nhỏ 5,5 m/s, sống 1,5 s, sát thương 0,5 × đánh thường, tối đa 2 lần/quái; lốc to 6,5 m/s, sống 2,6 s, tầm 2,4 m, sát thương 1,0 ×, tối đa 4 lần/quái. Sát thương sẽ chỉnh ở mục 5 (chổi 3%, gậy như ý 5%, gậy dạy chó 4%, lốc spam lan nhiều hơn).
- CHƯA nhìn bằng mắt trên máy thật; CHƯA thử đồng bộ 2 máy.

## Mục 3 — XONG: chổi phát sáng cả cây xanh lá nhạt
- `js/ui/broomMesh.js`: màu `BROOM_GLOW` 0xa8f0a0; chất liệu chổi khối + GLB đặt emissive (`glowMaterial`, làm một lần/chất liệu); 5 đốm sáng cộng sáng (additive) dọc từ đầu rơm tới cán, thở nhẹ theo `pulseBroom` (sáng hơn khi đánh/bay). Áp cho chổi cầm, cưỡi, túi đồ và cú đập khổng lồ (quầng mờ theo chổi, hủy khi xong). Test: `tests/broomglow234.test.mjs`. sw → dgt-v220. CHƯA nhìn bằng mắt (độ sáng 0,45 / quầng 0,6 là số TẠM).

## Còn lại: mục 4 (hiệu ứng lá/rơm/bụi) → mục 5 (sát thương %).
