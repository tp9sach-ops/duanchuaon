# Phiên 221 — Mục 1: hạt sen thưởng cố định (thu phục +1, phóng sinh +2)

## Yêu cầu (Giang, 18/11/2026)
"Thu phục 1 con yêu quái được 1 sen, câu cá phóng sinh được 2 sen, cộng ngay vào số sen hiện có."

## Đã làm
- `js/world/senThuong.js` (MỚI, thuần): `SEN_THU_PHUC = 1`, `SEN_PHONG_SINH = 2`, `quaThuPhuc()` → `{ hatSen: 1 }`.
- **Quái bãi rừng** (`js/ui/farm.js`, hàm `reward`): `settleKill(..., quaThuPhuc(), ...)` thay cho quà rơi ngẫu nhiên `r.drops` (trước: 50% × 1–3, tinh anh 100% × 5–8). Mọi con (thường, tinh anh, boss vùng) = đúng 1 hạt sen. `reward` cũng là đường của `claimKill` (Phiên 222: mình là người đòn cuối trên quái người khác) nên trường hợp đó cũng +1. Cộng ngay bằng `LGT.addMerit` (số sen trên HUD đổi liền).
- **Yêu quái hằng tháng** (`js/ui/yeuquai.js`, hàm `defeat`): +1 hạt sen qua `LGT.addMerit`, chỉ khi đóng góp đủ `MIN_SHARE` (cùng điều kiện nhận điểm/sức mạnh); thông báo ghi thêm "+1 hạt sen".
- **Phóng sinh** (`js/world/fishing.js`, `releaseSen`): cố định 2 hạt sen mọi loài/cỡ (trước 1–3). `releaseCaught`/`releaseFish`/thẻ cá (`fishCard.js`) đều gọi `releaseSen` nên tự đúng.
- Chữ hướng dẫn (`js/world/tutorial.js`) sửa theo luật mới.
- Test: `tests/senthuong.test.mjs` (MỚI, 6 test, đã trong `npm test`); sửa `tests/fishing.test.mjs` (1–3 → 2). `sw.js` = `dgt-v219`.

## GIỮ NGUYÊN (chưa đổi, cần Giang quyết)
- Trần hạt sen từ hàng yêu bãi rừng: `FARM_CFG.senCapNgay` = 100 hạt/ngày (quá 100 con vẫn được Tu Vi + kinh nghiệm, không thêm sen).
- Trần phóng sinh: 10 lần có thưởng/ngày (`ACT_CAP.phongsinh`, `js/world/merit.js`).
- Phó bản (`js/world/dungeon.js`): chỉ thưởng sen khi chinh phục boss, KHÔNG đổi.

## Chưa kiểm
- Chưa chơi trên trình duyệt thật (môi trường AI không có WebGL): cần xem số hạt sen trên HUD nhảy ngay sau khi thu phục / phóng sinh.

## Lưu ý khi đẩy
- Repo đang được nhiều phiên sửa cùng lúc (đến Phiên 234). Phiên này đã đối chiếu lại bản mới nhất trước khi đẩy từng file; toàn bộ `npm test` đạt trên bản gốc (1385/1385) trước khi hợp với các phiên sau.
