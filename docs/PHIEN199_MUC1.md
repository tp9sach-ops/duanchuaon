# Phiên 199 — MỤC 1: KHINH CÔNG (rà lại toàn bộ, vá camera bám độ cao)

> Repo `main`. ptg: trả lời NGẮN GỌN, làm TỪNG MỤC, xong đẩy GitHub rồi báo, chờ "tiếp tục".

## Rà lại theo từng yêu cầu của ptg (đã có từ Phiên 196–197 → bỏ qua, không làm lại)
- Bay lướt từ từ, rơi chậm, đệm hạ cánh: `js/world/glide.js` + `createJump.glide` (`js/world/skills.js`).
- Bấm Nhảy nhiều lần khi đang bay = đạp gió theo hướng đang di chuyển tới khi chạm đất: `flight.boost()` trong `js/ui/skill.js` (cách nhau ≥ 0,35 s).
- Độ cao các bậc nâng lên 2,0 → 15 m (`KHINH_THAN_CAO`); muốn cao tối đa phải ấn giữ 1,2 s (`CHARGE_CFG.full`); bấm nhẹ chỉ 35%.
- Đứng gồng nhún + vòng tròn nhỏ trong nút nở đúng bằng khung nút = hết tầm: `js/world/charge.js`, `css/dock.css` (`--jump-ring`).
- Camera tự xoay ra sau lưng theo hướng bay (`followYaw`), mở góc nhìn nhẹ, cộng độ cao nhảy.

## Lỗi tìm thấy + vá (Phiên này)
- Camera làm mượt độ cao bằng `damp(airSm, airY, 20, dt)` nên khi nhân vật lao lên vận tốc vy luôn bị tụt sau vy/20 mét (bậc 8: ~1,1 m) → nhân vật trồi lên khỏi giữa khung.
- Vá: `camAirTarget(y, vy)` (`js/world/glide.js`) cộng trước phần dẫn vy/`camUpK` khi đang LÊN; `js/ui/skill.js` gọi `W.setAirY(camAirTarget(y, jump.air ? jump.vy : 0))`. Mô phỏng: tụt từ > 0,8 m xuống < 0,35 m. Đang xuống không đổi (camera hạ êm). KHÔNG sửa `world.js`.
- `FLY_CFG.camUpK = 20` phải trùng hằng số 20 trong `world.js camStep` (test `tests/camair.test.mjs` canh).
- `sw.js` = `dgt-v187`. `npm test` 1295/1295 (thêm `tests/camair.test.mjs`; sửa regex `W.setAirY` trong `tests/charge.test.mjs`).

## ptg kiểm (CHƯA nhìn bằng mắt — không có WebGL trong môi trường AI)
Tải lại cứng (Ctrl+F5 / xóa cache PWA). Giữ nút Nhảy: vòng tròn nở, nhân vật nhún; thả ra: bay cao theo thời gian giữ; bấm Nhảy thêm giữa không trung: lướt rồi đạp gió. Nếu vẫn thấy sai, báo CỤ THỂ: (a) lúc nào nhân vật ra khỏi khung (lên/lúc lướt/lúc hạ), (b) máy tính hay điện thoại, (c) bậc khinh thân.

## Việc kế
Mục 2: Đánh thường lao tới mục tiêu tầm ngắn → combo 3 đòn khác nhau (đòn 3 sát thương lan, quái dính thì đánh lại); chiêu phái bấm + lướt ngón tay theo hướng; không có quái vẫn dùng chiêu/đánh thường nhưng không gây sát thương. (Đã có `js/world/aimSwipe.js`, `tests/basiccombo.test.mjs`, `tests/aimswipe.test.mjs` từ Phiên 198 — kiểm trước khi làm lại.)
