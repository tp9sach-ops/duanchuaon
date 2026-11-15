# Phiên 201 — MỤC 1 (hiệu ứng 3D V2): NỀN TẢNG SHADER

> Repo `main`. Kế hoạch đầy đủ: docs/KE_HOACH_HIEU_UNG_3D_V2.md (12 mục).

## Đã làm
- `js/world/fxGlsl.js`: GLSL dạng chuỗi (nhiễu fbm, bảng màu lửa theo nhiệt độ + bản CPU `mauLuaCPU`, shader khối lửa, khói, hạt tròn mềm, vũng sáng).
- `js/scene/fxShader.js`: `taoLuaMesh, taoKhoiMesh, taoHatPoints, taoVungMesh, capNhatThoiGian, huyFx`.
- `fx-preview.html` + `js/fxPreview.js`: trang xem thử (xoay/zoom, thanh chỉnh nhiệt độ/độ đục/số hạt, hiện lỗi shader màu đỏ, đo khung/giây).
- `tests/fxshader.test.mjs` (8 test, đã vào `npm test`).

## Quyết định / giả định
- CHƯA nối vào chieuFx.js (tránh làm hỏng hiệu ứng đang chạy). Hiệu ứng trong game CHƯA đổi; mục 2 trở đi nối dần từng Hệ.
- Không dùng đèn động; khói/hạt cộng sáng hoặc trộn alpha, không ghi độ sâu.

## Chưa kiểm được
- Hình ảnh thật và biên dịch shader (không có WebGL). ptg mở https://tp9sach-ops.github.io/duanchuaon/fx-preview.html (Ctrl+F5), chụp màn hình: chữ đỏ = shader lỗi.
- `npm test` đầy đủ chưa chạy ở phiên này; chỉ chạy riêng tests/fxshader.test.mjs (8/8 xanh) bản máy cục bộ. Bản đã đẩy lên GitHub đối chiếu bằng đọc lại, chưa tải về chạy.

## Phát hiện
- Phiên 200 mục 1 chỉ đẩy 2/4 commit (tài liệu nói nhiều hơn thực tế). Repo vẫn nhất quán, không đổi gì.

## Mục kế
Mục 2: Hỏa (nối khối lửa shader vào chieuFx, 6 chiêu theo chữ ký). Chờ ptg nói "tiếp tục" và phản hồi ảnh chụp trang xem thử.

## QUY TẮC BÀN GIAO (nguyên văn)
> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff
