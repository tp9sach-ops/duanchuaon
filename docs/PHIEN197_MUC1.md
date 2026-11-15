# Phiên 197 (hoàn tất đợt 5–6/6) — MỤC 1: KHINH CÔNG (nhảy gồng lực, đạp gió, camera bám độ cao)

Trạng thái: XONG phần nối dây. Chưa nhìn bằng mắt trên máy ptg — mọi con số là quy ước tạm (`tam: true`), chờ ptg thử rồi chỉnh.

## Đã có từ đợt 1–4 (không làm lại)
- `js/world/charge.js` (gồng lực, vòng tròn, dáng nhún), `js/world/glide.js` (đạp gió `boostSpeed`, `boostK`, `boostGap`), `js/world/skills.js` (độ cao bậc 1–8 = 2,0 → 15 m; `flyPlan(lv, indoor, apex)`; `leapPlan(..., frac)`), `css/dock.css` (vòng tròn `--jump-ring`), `js/ui/dock.js` (nút Nhảy giữ/thả gọi `LGT.skill.press/release`).

## Làm trong đợt 5–6
- `js/ui/skill.js`: `press()` / `release()`; Space keydown = press, keyup = release; mất tiêu điểm cửa sổ = hủy gồng.
  - Trên mặt đất: ấn giữ → gồng (vòng tròn nở, thân nhún, sau 0,15 s đứng yên); thả → nhảy cao `độ cao bậc × chargeFrac` (bấm nhẹ 35%, giữ 1,2 s = 100%).
  - Trên không chưa bay: bấm → bay lướt (hạ chậm theo độ cao thật `jump.apex`).
  - Đang bay: bấm tiếp → ĐẠP GIÓ (`flight.boost()`): xung 80% theo hướng đang bay (cần/phím bẻ hướng), cách nhau ≥ 0,35 s, lặp đến khi chạm đất.
  - Vừa chạm đất (≤ 0,6 s) bấm → lướt né ngắn như Phiên 139 (không gồng).
  - Gọi `LGT.skill.jump()` không tham số (Enter trên nút) = nhảy vừa 60%.
- `js/world/world.js`: `LGT.world.setAirY(y)`; camera cộng độ cao nhảy (`airSm`, bám lên nhanh k=20, xuống êm k=9), lùi ra tối đa +50% khi lên cao; `LGT.jumpCharging` → khóa đi lại lúc gồng.
- Test sửa theo độ cao mới: `tests/skills.test.mjs` (bậc 1 = 2,0 m; trong nhà chặn 1,6 m), `tests/glide.test.mjs` (bay tối đa < 6 s; regex `flight = null`).
- `sw.js` = `dgt-v186`.

## Việc kế
- Mục 2: Đánh thường lao tới mục tiêu + combo 3 đòn (đòn 3 sát thương lan, quái dính đánh lại); chiêu trong phái bấm + lướt tay theo hướng; không có quái vẫn dùng chiêu/đánh nhưng không gây sát thương.
- `npm test`: 1280/1281 qua; `fireflies.test.mjs` "không đứng yên: sau 20 s" thỉnh thoảng đỏ (ngẫu nhiên, chạy riêng thì xanh, có từ trước).
