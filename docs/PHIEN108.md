# PHIÊN 108 — GDD v2: G4.6 (phần Tự Động Hàng Yêu) cho quái bãi rừng — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Đọc: PROMPT.md → docs/PHIEN107.md → file này → docs/KE_HOACH_GDD_V2.md. Chỉ đọc file cần thiết.

## Yêu cầu của ptg (2026-11-11, sau Phiên 107)
"Tiếp tục và bổ sung thêm tính năng tự động đánh quái." → làm đúng "Tự Động Hàng Yêu" của GDD v2 mục 12 (tự xoay skill trong tầm 15 m, dừng khi mở bảng hoặc rời tab, tối đa 60 phút/ngày — TẠM; câu 7 mặc định "có").

## Đã làm
- `js/data/monsters.js`: `FARM_CFG.autoRange` 15 m, `autoSecNgay` 3600 s (TẠM).
- `js/world/autoHunt.js` + `tests/autohunt.test.mjs` (logic thuần): `loadAuto`/`emptyAuto`/`autoLeft`/`addAutoTime` (trần 60 phút/ngày giờ VN, kẹp 5 s/nhịp) và `nextAction` (gần → Thương, xa → Ném đá, ngoài 15 m hoặc hồi chiêu → không làm gì).
- `js/ui/farm.js`: `LGT.farm.toggleAuto()`; mỗi nhịp tự chọn quái GẦN NHẤT và gọi `spear()`/`stone()` (dùng lại hồi chiêu và sát thương Phiên 107). KHÔNG tự đi. Tự dừng khi: mở bảng (`LGT.panelOpen`), rời tab (`document.hidden`), bị khiêng/không ở chế độ đi, vào nhà/ra khỏi hub, có yêu quái hằng tháng, hết 60 phút. Chỉ tính giờ khi đang chạy; lưu `localStorage['lgt.farmauto']` ({day, secs}, mỗi 5 s và khi dừng; khóa `lgt.*` tự đồng bộ tài khoản).
- Nút "Tự động" (🔁) ở cụm nút phải-dưới, hiện cùng Ném đá/Thương khi có quái gần; đang chạy đổi thành "Dừng đánh" (nhấp nháy), dòng chữ nhỏ ghi số phút còn lại; có lời chỉ chỗ bấm một lần (`HINTS.tudong`). `js/world/dock.js`, `js/ui/dock.js`. Dòng `ACT.da`/`ACT.thuong` vẫn nguyên.
- Test: `tests/farmui.test.mjs` (+2: tự thu phục quái, mở bảng thì dừng, lưu giờ; không bật khi có boss), `tests/dock.test.mjs` (+1). `npm test` 936/936.

## Giả định cần ptg duyệt (TẠM)
1. 60 phút/ngày, tầm 15 m (GDD). Tự động không nhặt gì thêm, không đi đến quái: nếu không có quái trong 15 m thì đứng yên (vẫn tốn giờ).
2. Thưởng khi tự động GIỐNG tự đánh (cùng EXP, hạt sen và trần 100 sen/ngày). Chưa giảm thưởng khi tự động; nếu ptg thấy quá lợi thì thêm hệ số.
3. Mỗi lần thu phục vẫn hiện toast (có thể dày khi tự động); chưa gộp thông báo.
4. Rời tab thì dừng hẳn (không tự bật lại khi quay về): người chơi bấm "Tự động" lại.
5. Chưa chơi thử trên trình duyệt thật (như Phiên 107).

## Gp phải làm
Vào bãi rừng, đứng trong tầm 15 m của quái, bấm "Tự động", xem nhân vật có tự ném đá/đâm thương không; thử mở menu (phải dừng) và chuyển tab (phải dừng). Báo lỗi nếu nút chồng nhau trên điện thoại.

## VIỆC KẾ (một mục, chờ "tiếp tục")
**G2.1** Ngũ Hành logic thuần (`js/world/elements.js`, test bảng khắc/sinh 5×5: khắc ×1,3 / bị khắc ×0,8, sinh +5%/người tối đa +10%, Hội Tụ +10%) → G2.2 dữ liệu 15 skill gốc → G2.3 bộ máy hồi chiêu + Tâm Ấn. Khi ptg báo lỗi chơi thử thì sửa lỗi trước.

## Prompt khởi động cho phiên sau (dán nguyên)
> Đọc PROMPT.md → docs/PHIEN107.md → docs/PHIEN108.md → docs/KE_HOACH_GDD_V2.md. Repo `tp9sach-ops/duanchuaon`. Đã XONG: G0.1, G0.3, G0.5, G1.1–G1.4, G3.6, G1.6a (quái bãi rừng, thưởng Tu Vi + hạt sen, trần 100 sen/ngày) và Tự Động Hàng Yêu (60 phút/ngày, 15 m). Chạy `npm test` trước, sửa test đỏ nếu có. Làm MỘT mục theo lời ptg (mặc định G2.1: Ngũ Hành logic thuần + test), gửi bàn giao docs/PHIEN109.md, rồi CHỜ ptg nói "tiếp tục". Chỉ đọc những file cần thiết.
