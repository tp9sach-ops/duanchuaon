# Phiên 202 — MỤC 2 (hiệu ứng 3D V2): HỎA

> Repo `main`. Kế hoạch: docs/KE_HOACH_HIEU_UNG_3D_V2.md. Mục 1 (nền shader, Phiên 201) đã có trên repo nên bỏ qua.

## Yêu cầu của ptg (2026-11-16)
Hiệu ứng kỹ năng hiện là ô vuông màu, chán, không giống thật. Muốn 3D, như thật, hoành tráng; lửa như lửa thật, băng như băng thật…; trừ Thủy, các Hệ khác có bộ chiêu quá giống nhau, không liên quan đến Hệ. Làm từng mục, xong đẩy GitHub rồi báo, chờ "tiếp tục".

## Đã làm
- `js/world/hoaFxMath.js` (toán thuần, có test): ánh xạ id → kiểu hình, số khối/hạt theo bậc máy, hàm chuyển động rồng lửa, mưa thiên thạch, sen nở, hơi thở rồng.
- `js/scene/fxHoa.js`: `taoHoa(o)` cùng giao diện `taoLua` (`{group, update(t, after, than, gong, pz)}`), dựng bằng khối lửa shader + khói + hạt tròn mềm + vũng sáng của Mục 1. 6 chữ ký: sao chổi (hoa_1), áo lửa (hoa_2), rồng lửa nhiều đốt (hoa_3), mưa thiên thạch (hoa_liethoa_4), hơi thở rồng (hoa_hoalong_4), sen lửa 9 cánh (hoa_tuyet).
- `js/scene/chieuFx.js`: Hệ hỏa gọi `taoHoa({...o2, id})`; chiêu lạ hoặc lỗi dựng → quay về `taoLua` cũ (fxLua.js giữ nguyên, không xóa).
- `fx-hoa.html` + `js/fxPreviewHoa.js`: trang xem thử, chọn chiêu + bậc máy, thanh tốc độ (quay chậm để ngắm), hiện lỗi shader màu đỏ.
- `tests/hoafx.test.mjs` (6 test) đã vào `npm test`; `sw.js` VERSION `dgt-v189`.

## Quyết định / giả định (số TẠM)
- Hơi thở rồng: dùng cùng khối lửa nhưng xoay nằm ngang, to ở miệng, thon dần ra xa (khối lửa gốc thon dần lên ngọn); lõi trắng nóng ở miệng.
- Mưa thiên thạch gói trong 0,97 s vì vòng đời hiệu ứng chiêu ≈ 0,95 s (hằng LIFE trong chieuFx.js). Mục 8 sẽ kéo dài nếu cần.
- Lõi sáng, quầng, tia sao, vùng cảnh báo, decal nền, tàn dư, âm thanh vẫn là mã cũ của chieuFx (Sprite quầng) — chưa đổi, thuộc các mục sau (10, 11).
- Cỡ điểm hạt giả định FOV 50° (`pxHat`).

## Chưa kiểm được
- Hình ảnh thật + biên dịch shader (không có WebGL trong môi trường AI). ptg mở https://tp9sach-ops.github.io/duanchuaon/fx-hoa.html (Ctrl+F5 để bỏ bộ nhớ đệm), chọn từng chiêu và chụp màn hình; chữ đỏ = shader lỗi. Nếu shader lỗi trong game, hiệu ứng Hỏa có thể biến mất (shader hỏng không ném lỗi JS nên không tự quay về lối cũ).
- `npm test` đầy đủ chưa chạy ở phiên này (môi trường AI không có mạng/Node ở đây); `tests/hoafx.test.mjs` viết theo hợp đồng của `hoaFxMath.js` nhưng chưa chạy. Cần chạy `npm test` trên máy hoặc đợi workflow Pages.

## Mục kế
Mục 3: Thủy (tinh thể băng thật, nước/sóng có bọt). Chờ ptg nói "tiếp tục" và gửi ảnh chụp fx-hoa.html để chỉnh Hỏa trước nếu cần.

## QUY TẮC BÀN GIAO (nguyên văn)
> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff
