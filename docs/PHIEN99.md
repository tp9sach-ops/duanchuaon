# PHIÊN 99 — Nhân vật chibi từ mô hình GLB có xương — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Đọc: PROMPT.md → HANDOFF.md (đầu file) → docs/PHIEN98.md (kế hoạch GDD v2) → file này. Nguồn mã thật: repo `tp9sach-ops/duanchuaon`, nhánh `main`.

## Yêu cầu Gp (2026-11-11)
Gửi 3 mô hình `chibi_base.glb`, `chibi_base_body.glb`, `low_poly_chibi_base.glb`: đổi hình nhân vật game và các thao tác di chuyển, cầm nắm, chiến đấu dựa trên mô hình 3D; khung xương chuyển động mượt, chân thật, không lag.

## Phát hiện về 3 file GLB (đã đo bằng mã)
- Cả ba là **thân trần tư thế chữ T, MỘT lưới duy nhất, KHÔNG có xương (skin) và KHÔNG có hoạt ảnh**, không có texture (chỉ 1 vật liệu).
- `low_poly_chibi_base`: 700 đỉnh, Y lên, mặt +z. `chibi_base`: 7.223 đỉnh, Y lên, mặt +z. `chibi_base_body`: 20.244 đỉnh, **Z lên** (đầu ở +z), nặng gấp ~29 lần bản low-poly → CHƯA dùng.
- Hai file đầu cùng tỉ lệ (hông 0,22 · vai 0,45 · cổ 0,515 chiều cao). Chân rất ngắn (0,22 chiều cao) nên bước chân dùng góc lớn hơn nhân vật cũ.
- Vì không có xương sẵn, mã TỰ GẮN bộ xương và tự tính trọng số da từ vị trí đỉnh.

## Đã làm
| File | Nội dung |
|---|---|
| `js/world/chibiRig.js` (mới, thuần) | Mốc tỉ lệ, `skinOf` (trọng số da), `zoneOf` (vùng màu: da/áo/tay áo/quần/giày), `armTarget/armAngle`, `chibiPose` (poseFor → góc 7 xương, gồm vung côn, giơ tay khiêng, ném, nhặt) |
| `js/scene/chibiBody.js` (mới) | Nạp GLB (`loadChibi`), chuẩn hóa cao 1,5 m, `prepareChibi`, `buildChibi` (SkinnedMesh + 7 Bone, màu đỉnh theo vùng), `applyChibiPose` |
| `js/world/avatarChibi.js` (mới) | Nhân vật mới, cùng giao diện cũ + `setHold(bool)`, `act('throw'\|'grab')`. Mặt/râu/tóc búi/hào quang gắn xương đầu; áo polo 9 Sạch = vùng màu + cổ áo + logo ngực/lưng; cà sa NPC gắn xương hông; côn gắn xương tay phải |
| `js/world/avatar.js` | `createAvatar` chọn thân GLB nếu đã nạp, không thì giữ nguyên thân dựng khối (`createProcAvatar`); xuất các hàm dùng chung |
| `js/main.js` | Nạp GLB trước khi dựng cảnh (chờ tối đa 4 s) để mọi nhân vật/NPC/người chơi khác dùng chung |
| `js/world/world.js`, `js/ui/carry.js`, `js/scene/carry.js` | Đang khiêng vật → giơ hai tay; nhặt → cúi nhặt; ném → vung tay phải; vật khiêng hạ từ 2,05 m xuống 1,85 m |
| `assets/models/chibi/chibi-low.glb`, `chibi-mid.glb` | Bản sao 2 file GLB (low_poly_chibi_base, chibi_base) |
| `tests/chibirig.test.mjs`, `tests/sim/*` | 9 test mới; sim thêm bản giả GLTFLoader + lớp three còn thiếu |
| `sw.js` | `dgt-v106` |

Công tắc URL: `?chibi=off` (về nhân vật dựng khối), `?chibi=mid` (mô hình 7.000 đỉnh).

## Kiểm
- `npm test`: **869 tổng, 865 đạt, 4 đỏ có sẵn (#322, #328, #355, #767) — không do phiên này**.
- Dựng THẬT bằng three.js 0.160.1 trong Node: tải GLB, gắn xương, đặt tư thế rồi xuất đỉnh sau skin và vẽ ảnh: đứng, đi (2 nhịp), ngồi, gõ mõ, lạy, vung côn (nâng/chém), giơ tay khiêng, ném đều biến dạng đúng, không rách ở hông/vai/cổ. Nhân vật đủ bộ (mặt, tóc búi, râu bạc, cà sa) khớp đầu.
- Chi phí: 60 nhân vật dựng 232 ms; cập nhật xương ~2,7 µs mỗi nhân vật mỗi khung (CPU); mỗi nhân vật 4.188 đỉnh.
- **CHƯA xem trong trình duyệt thật** (cảnh + ánh sáng + điện thoại thật). Chưa đo FPS thật khi đông người.

## Gp phải làm
1. Tải các file trong `cap-nhat-phien99.zip` lên repo đúng đường dẫn (trùng tên thì ghi đè). Phiên này KHÔNG đẩy được lên GitHub (không có quyền ghi). **Hai file GLB là nhị phân nên phải tải lên bằng "Add file → Upload files"**. Thiếu GLB thì game vẫn chạy bằng nhân vật dựng khối cũ.
2. Mở game, thử: đi, ngồi thiền, gõ mõ, lạy, "Chém khí", khiêng/ném đá. Báo chỗ nào xấu/lệch (ghi rõ tư thế nào, góc nào).
3. Xác nhận nguồn + giấy phép của 3 file chibi (không có tên tác giả trong file) rồi bổ sung `THIRD_PARTY.md`.

## Giới hạn / chưa làm
- Thân trần không có tóc/quần áo riêng: áo, quần, giày chỉ là TÔ MÀU theo vùng trên lưới (trong lúc ngồi, vùng áo/quần theo đúng xương). Kiểu quần áo khác nhau (váy, áo dài…) chưa có.
- Tay ngắn (0,37 m): giơ tay khiêng không chạm tới vật (vật nằm trên đầu 1,85 m). Có thể cần hạ vật thêm hoặc kéo dài tay.
- Hai chân là một khối ngắn, không có đầu gối: bước đi chỉ xoay quanh hông. Chưa có chân tiếp đất (IK) nên khi chạy nhanh có thể trượt chân nhẹ.
- Người chơi khác: chỉ đồng bộ state/speed qua mạng, chưa đồng bộ `setHold`/`act` (khiêng, ném, vung côn của người khác chưa thấy).
- Chưa thêm động tác: nhảy, bơi, câu cá, đấm/đá (mới có vung côn, ném, nhặt, giơ tay khiêng). Chưa có hoạt ảnh chuyển trạng thái (đứng→ngồi) riêng, hiện dựa vào làm mượt `sit`.
- `chibi_base_body.glb` chưa dùng (Z lên, 20.000 đỉnh).
- Chưa tối ưu: dùng chung lưới + vật liệu giữa các nhân vật (hiện mỗi người một bản sao; chấp nhận được tới ~50 người).

## VIỆC KẾ (từng mục, xong báo, chờ Gp "tiếp tục")
1. Sau khi Gp thử trong game thật: chỉnh tư thế/màu/mặt theo phản hồi.
2. Động tác còn thiếu: bơi (khớp `js/world/swim.js`), câu cá (`fishing.js`), nhảy, đồng bộ `setHold/act` cho người chơi khác (`js/net/roomClient.js`).
3. Đo FPS khi đông người (50+) trên điện thoại; nếu cần gộp lưới/dùng chung vật liệu hoặc hạ chất lượng theo thiết bị.
4. Tiếp tục kế hoạch GDD v2 (`docs/KE_HOACH_GDD_V2.md`, bước G0.1 …) và 4 test đỏ có sẵn.

## Prompt khởi động cho phiên sau (dán nguyên)
> Đọc PROMPT.md → HANDOFF.md (đầu file) → docs/PHIEN99.md. Repo `tp9sach-ops/duanchuaon`. Phiên 99 đã đưa nhân vật chibi từ GLB có bộ xương tự gắn (`js/world/chibiRig.js`, `js/scene/chibiBody.js`, `js/world/avatarChibi.js`). Kiểm repo đã có `assets/models/chibi/chibi-low.glb` chưa (nếu chưa, nhắc Gp tải bản zip lên). Gp báo kết quả thử trong game → chỉnh theo phản hồi (VIỆC KẾ 1). Làm một mục, `npm test` (4 test đỏ có sẵn #322, #328, #355, #767), đẩy GitHub (không đẩy được thì gửi zip), cập nhật PROMPT.md mục 7 + HANDOFF.md + docs/PHIEN100.md, gửi bàn giao, rồi CHỜ Gp nói "tiếp tục".
