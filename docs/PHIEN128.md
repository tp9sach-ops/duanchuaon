# Phiên 128 — THU CÁ theo clip mẫu (KHÔNG cần câu): ném cầu bằng tay, bóng cá rỉa, cá dính, giơ cá + thẻ cá, góc camera

## Quy tắc người dùng (chép nguyên văn)
For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff.

## Yêu cầu ptg (12/11)
Đọc lại repo, chỉ xem chỗ cần sửa, cập nhật không lỗi. Làm game giống clip: động tác thả cầu, bóng cá, cá rỉa quả cầu, cá dính, góc camera, cầm cá, túi đồ + cách mở + khung đồ, đi đứng di chuyển, góc độ nút bấm. **Đổi: không phải “câu cá” mà là “thu cá”, KHÔNG cầm cần.** PC điều khiển A D W S. Sau đó đẩy GitHub.

## Đã làm
| Mục | Việc | File |
|---|---|---|
| 1 | Ném cầu BẰNG TAY: động tác `throw` có sẵn, cầu rời tay (`handTip`) sau `THROW_RELEASE` = 0,3 s | `js/world/fishPose.js`, `js/ui/fishing.js`, `js/scene/fishing.js` |
| 2 | Bóng cá hình con cá có VIỀN SÁNG; cá DÍNH giãy ngay chỗ cầu, cầu nhún chìm; dấu “!” cam trên đầu; nước tung khi cá lên; cá giơ trước ngực to ×1,7 | `js/scene/fishing.js` |
| 3 | Giơ cá bằng hai tay (`act('show')`, `showPose`) | `js/world/fishPose.js`, `js/world/avatarChibi.js` (ACT_S.show) |
| 4 | Camera: `LGT.world.shot('cast'|'show'|'')` — chờ cá: nâng cao, nhân vật bên trái, nước phía trên-phải; cầm cá: cận cảnh trước mặt; đi xa 1,2 m thì tự về | `js/world/fishShot.js`, `js/world/world.js` (camStep) |
| 5 | THẺ CÁ: tên, MỚI, cỡ cm, kỷ lục cao nhất (+ “Kỷ lục mới”), biến thể, hạt sen phóng sinh, nút Thu cá / Phóng sinh. Kỷ lục lưu `localStorage['lgt.fishrec']` (không đổi dữ liệu ao cá) | `js/world/fishCard.js`, `js/ui/fishing.js`, `css/fishing.css` |
| 6 | `body.fishing` ẩn `.hm-grid/.hm-bar/.hm-stand/#goto-hint` (giữ joystick) | `css/fishing.css` |
| 7 | Chữ hiển thị “câu cá” → “thu cá” trong bảng/thẻ ở `js/ui/fishing.js`. **Còn chữ “câu cá” cũ** ở `js/world/dock.js` (tooltip nút thả cầu, tiêu đề túi đồ “Quả cầu câu cá”, được test `tests/dock.test.mjs` #224 kiểm) — đổi cả hai cùng lúc ở phiên sau. | `js/ui/fishing.js` |
| 8 | A D W S: ĐÃ CÓ SẴN (`KEYMAP` trong `js/world/world.js`, mũi tên + Shift chạy); bị chặn chỉ khi mở bảng (`LGT.panelOpen`). Không sửa. | — |
| 9 | Test mới `tests/fishpose.test.mjs` (8 test) đã thêm vào `npm test`; `sw.js` = `dgt-v128` | `tests/`, `package.json`, `sw.js` |

## CHƯA làm (VIỆC KẾ)
1. **Túi đồ kiểu clip**: bảng cam toàn màn hình, hàng tab biểu tượng ở trên, lưới thẻ 6 cột có số đếm, nút đóng X đỏ; mở bằng ba lô đỏ ở mép phải (`js/ui/bag.js` + css). Hiện vẫn là hộp thoại cũ.
2. **Nút bấm / joystick**: joystick có 4 mũi tên tam giác; cụm phải = nút mũi tên lớn (nhảy) + 3 nút nhỏ; khi thu cá chỉ còn 1 nút tròn (nút “Bấm!”). Chưa chỉnh.
3. Chưa xem bằng trình duyệt thật: góc camera, tay giơ cá, viền bóng cá, dấu “!”, thẻ cá trên điện thoại nhỏ.
4. Mũi tên cam chỉ đường trên mặt đất (clip) chưa làm.

## Lưu ý kỹ thuật
- `fishing.js` (world) KHÔNG đổi. `rollSizeCm` chỉ để hiển thị; cá trong ao vẫn `{sp, lon}`.
- Kết quả test: chạy `npm test` đầy đủ trên mã Phiên 128 → 1030 test, 1029 đạt, 1 đỏ là #224 (test dock kiểm chữ “Quả cầu câu cá” mà bản đầu đã đổi). Sau đó hoàn tác chữ ở dock; chạy lại `tests/dock.test.mjs` + `tests/fishpose.test.mjs` → 30/30 đạt. Chưa chạy lại TOÀN BỘ sau hoàn tác. Test đỏ #164 (combo) của trước phiên này không còn đỏ.
- Chưa xem bằng trình duyệt thật; chưa cập nhật `HANDOFF.md` (quá lớn để đẩy qua công cụ) — thêm 1 dòng “Cập nhật Phiên 128 … đọc docs/PHIEN128.md” lên đầu HANDOFF.md ở phiên sau.
