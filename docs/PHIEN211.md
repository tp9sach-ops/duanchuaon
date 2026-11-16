# Phiên 211 — Bước 1: Túi hồ lô ĐỎ + kế hoạch hiệu ứng 3D chi tiết + công cụ CHỤP ẢNH hiệu ứng

> Repo `https://github.com/tp9sach-ops/duanchuaon` nhánh `main` (đầu phiên: sau Phiên 210). Yêu cầu của ptg (2026-11-16): xem lại repo, việc nào đã làm thì bỏ qua, cập nhật KHÔNG lỗi; hiệu ứng chiêu hiện là "ô vuông màu" → muốn 3D, như thật, hoành tráng (lửa như lửa thật, băng như băng thật…); lập lại kế hoạch mô tả chi tiết; chiêu đem đánh quái không thấy hiệu ứng; Túi hồ lô dưới dấu ?, màu đỏ, tên "Túi hồ lô" (không phải "Túi đồ"), hình hồ lô đỏ; LÀM TỪNG MỤC, bắt đầu từ 1, xong đẩy GitHub rồi báo, chờ "tiếp tục".

## Đã kiểm lại repo (việc đã làm thì bỏ qua)
- Hiệu ứng đánh quái thật: ĐÃ nối từ Phiên 185 (`js/ui/heSkill.js` → `createChieuFx` qua `fxCast`, đọc quái từ `LGT.farmView`). Không làm lại.
- Hỏa 3D (Phiên 202), Thủy 3D (Phiên 203): đã có. Kim, Mộc, Thổ: CHƯA (mục 4–6 của `docs/KE_HOACH_HIEU_UNG_3D_V2.md`).
- Túi hồ lô: Phiên 186 đã đặt chỗ (hàng riêng `#hm-bagrow` dưới cụm có dấu ?), đổi tên, vẽ hồ lô — NHƯNG **không có luật CSS nào** (`.hm-bag` không tồn tại) nên nút vẫn vàng như các nút khác. Đây là lỗi thật duy nhất tìm thấy ở phần này.

## Đã làm (Bước 1)
1. `css/hudmenu.css`: thêm `.hm-bagrow`, `.hm-ic.hm-bag` (nền đỏ, viền sáng đỏ, bóng đỏ; hồ lô 23 px tô đậm), hover/focus sáng đỏ; máy rộng ≥ 900 px: `padding-bottom:12px` cho hàng + chữ "Túi hồ lô" màu hồng nhạt (không đè nút Kỹ năng bên dưới).
2. `tests/menu.test.mjs`: thêm kiểm CSS có luật đỏ + hàng riêng.
3. `sw.js` VERSION `dgt-v195` → `dgt-v196`.
4. `docs/KE_HOACH_HIEU_UNG_3D_V2.md`: cập nhật trạng thái (2b Túi hồ lô xong, 3 Thủy xong), thêm phần "Cập nhật Phiên 211" = ảnh hiện trạng + kế hoạch CHI TIẾT từng chiêu cho Kim / Mộc / Thổ + mục 7 (phản ứng trúng đòn) + mục 8 (đồng bộ thời gian) + thứ tự làm.
5. `tools/fx-harness.html` + `tools/fx-shot.cjs`: công cụ chụp ảnh hiệu ứng (xem dưới).

## PHÁT HIỆN QUAN TRỌNG — AI CÓ NHÌN ĐƯỢC WebGL
Các phiên cũ ghi "không có WebGL ở môi trường AI" là SAI. Chromium + Playwright cài sẵn chạy WebGL bằng SwiftShader (chậm ~15–25 khung/s nhưng chụp ảnh được). Cách làm (đã chạy thật ở Phiên 211):
```
mkdir -p $S/three && cd $S/three && npm init -y && npm i three@0.160.1       # chỉ lấy file three; không đụng package.json repo
cd <repo> && (python3 -m http.server 8765 --bind 127.0.0.1 &)
NODE_PATH=$(npm root -g) node tools/fx-shot.cjs $S/three <thu-muc-ra> kim_1 moc_tuyet tho_1   # → <ra>/fx_<id>.png (chụp ngay sau lúc phát, bậc máy "cao")
```
Trang xem thử `fx-hoa.html`, `fx-thuy.html` mở được cùng cách (chặn mọi mạng ngoài, route `cdn.jsdelivr.net/npm/three@0.160.1/**` → file local); đã thấy dòng "Shader biên dịch ổn" của fx-hoa.html. Vào GAME THẬT (index.html) chạy được tới màn đăng nhập nhưng KHÔNG vào được HUD (đăng nhập cần máy chủ Apps Script, mạng bị chặn) → kiểm HUD bằng trang dựng riêng với đúng CSS.
Mẹo: `page.evaluate(() => document.querySelector('.intro-skip').click())` để bỏ cảnh mở đầu.

## Ảnh đã nhìn (Phiên 211)
- Hỏa: sen lửa (hoa_tuyet) đẹp; **rồng lửa (hoa_3) nhìn như chuỗi quả cầu trắng + nón, không liền thân** → sửa ở bước riêng (mục 12 / Bước 5).
- Kim/Mộc/Thổ (qua `createChieuFx`): chỉ là đám chấm sáng + vòng kẻ trên đất, không có khối 3D; `tho_tuyet` gần như trống. Đúng phàn nàn của ptg.
- Cụm nút phải-trên dựng riêng bằng CSS mới: Túi hồ lô đỏ, hình hồ lô, tên "Túi hồ lô", dưới hàng dấu ?, trên nút Kỹ năng.

## Đã kiểm
- `npm test`: **1348/1348 đạt** (chạy sau khi sửa CSS lần 1). Chạy lại lần 2 sau chỉnh cỡ hồ lô + thêm `tools/*`: **1348/1348 đạt**.

## Chưa kiểm / lưu ý
- HUD trong game thật (đăng nhập) chưa nhìn trực tiếp; chỉ nhìn cụm dựng riêng. ptg Ctrl+F5 rồi báo nếu nút đè/lệch ở điện thoại.
- Nút "Túi đồ" ở thanh menu dưới (`BOTTOM_MENU`, id `tuido`) GIỮ NGUYÊN tên (có test khóa nhãn 9 nút). Nếu ptg muốn đổi luôn thành "Túi hồ lô" thì phải sửa `js/ui/menuLogic.js` + `tests/menu.test.mjs` dòng 8 + vài chữ trong sổ tay/nhiệm vụ.
- Mọi số cỡ/độ sáng hiệu ứng vẫn là số TẠM.

## Mục kế (Bước 2): MỤC 4 — KIM
Làm theo "Kế hoạch chi tiết mục 4" trong `docs/KE_HOACH_HIEU_UNG_3D_V2.md`: `js/world/kimFxMath.js`, `js/world/fxGlslKim.js`, `js/scene/fxKimV2.js` (hoặc thay hẳn fxKim.js, giữ bản cũ làm dự phòng), `fx-kim.html`, `js/fxPreviewKim.js`, `tests/kimfx.test.mjs` (thêm vào `npm test`), nối `chieuFx.js` (nhánh Kim thử bộ mới trước, lỗi → `taoKim` cũ), tăng `sw.js` VERSION (hiện `dgt-v196`). TỰ CHỤP ẢNH 6 chiêu Kim (`tools/fx-shot.cjs`) và nhìn trước khi đẩy; sửa tới khi có khối kim loại rõ, không phải đám chấm sáng.

## PROMPT BÀN GIAO CHO PHIÊN SAU (dán nguyên văn)
```
Dự án DIỆU GIANG TỰ — repo https://github.com/tp9sach-ops/duanchuaon (main). Đọc PROMPT.md rồi docs/PHIEN211.md và docs/KE_HOACH_HIEU_UNG_3D_V2.md (phần "Cập nhật Phiên 211"). Chỉ đọc chỗ cần; việc đã làm thì bỏ qua; cập nhật KHÔNG được gây lỗi (git clone repo rồi `setsid nohup npm test > /tmp/t.log 2>&1 < /dev/null &`, đợi dòng "# fail"; ~5 phút). Đẩy GitHub bằng công cụ github push_files. ptg nói tiếng Việt, không rành kỹ thuật: trả lời ngắn gọn, dễ hiểu; làm TỪNG MỤC; khi sửa code đưa đoạn "tìm" đầy đủ rồi code thay thế đầy đủ; sau MỖI câu trả lời đính kèm file bàn giao .md mới (xem quy tắc nguyên văn ở cuối file này).
QUAN TRỌNG: AI CÓ nhìn được WebGL (Chromium SwiftShader) — dùng tools/fx-shot.cjs để chụp ảnh hiệu ứng và xem bằng công cụ Read trước khi đẩy (cách chạy ở docs/PHIEN211.md).
Tình hình: Bước 1 (Túi hồ lô đỏ + kế hoạch chi tiết + công cụ chụp ảnh) xong. Việc phiên này: Bước 2 = MỤC 4 KIM theo kế hoạch chi tiết. Xong: chụp ảnh nhìn, `npm test`, tăng sw.js VERSION, thêm docs/PHIEN<N>.md có prompt bàn giao như file này, đẩy GitHub, báo ptg, chờ "tiếp tục".
```

## QUY TẮC BÀN GIAO (nguyên văn)
> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff
