# Phiên 212 — MỤC 4 KIM, đợt 1/2: Kim 3D (kim_1, kim_2, kim_3) nối vào game

> Repo `https://github.com/tp9sach-ops/duanchuaon` nhánh `main`. Đọc sau `docs/PHIEN211B.md`, `docs/PHIEN211C.md`.
> Yêu cầu của ptg (2026-11-16): xem lại repo, việc đã làm thì bỏ qua; làm tiếp theo gói hiệu ứng tham khảo; làm từng mục, xong đẩy GitHub rồi báo; "tiếp tục".

## Đã làm
1. `js/world/kimFxMath.js` (MỚI): toán thuần Kim 3D — kiểu theo id (`kim_1 liem_bac`, `kim_2 khien_luc`, `kim_3 ky_binh`), số vật thể theo bậc máy, chuyển động lưỡi chém / mảnh văng / khiên / tấm nhỏ / kỵ sĩ chữ V / bụi.
2. `js/scene/fxKimThan.js` (MỚI): vẽ khối 3D — lưỡi trăng khuyết ép khối có vát cạnh + viền sáng bạc + vệt; khiên lục giác thép viền vàng + 6 tấm nhỏ quay ngược chiều + gợn sáng; 3–7 kỵ sĩ vàng (thân ngựa, người, giáo) hàng chữ V, bụi vàng, sóng chấn. Chiêu chưa làm (`kim_kimcang_4`, `kim_thietky_4`, `kim_tuyet`) → trả null.
3. `js/scene/chieuFx.js` (SỬA, +4 dòng): `import { taoKimThan }`, biến `kim3`, dựng cạnh bộ cũ `taoKim` (sét/mảnh/vệt vẫn chạy), gọi `kim3.update`. Dựng lỗi → bị nuốt, game vẫn chạy.
4. `fx-kim.html` + `js/fxPreviewKim.js` (MỚI): trang xem thử 3 chiêu, chọn bậc máy.
5. `tests/kimfx.test.mjs` (MỚI, 7 test) + thêm vào `npm test`. `sw.js` VERSION `dgt-v197` → `dgt-v198`.

## Đã kiểm / CHƯA kiểm (nói thật)
- `npm test` đầy đủ: **1364 test, 1364 đạt, 0 lỗi** (1357 + 7).
- Chụp ảnh WebGL `kim_1 kim_2 kim_3` bằng `tools/fx-shot.cjs`: không lỗi shader. Đã NHÌN ảnh: lưỡi cung thép viền sáng thấy rõ ở khoảng 0,12 s sau phát; khiên lục giác viền vàng thấy rõ; kỵ binh thấy rõ hàng kỵ sĩ vàng có giáo.
- CHƯA làm: chụp ở bậc máy "yếu" và "vừa" (mới chụp bậc mặc định của harness); chưa xem trong game thật trên điện thoại.
- Nhận xét: lưỡi chém còn nhỏ và hơi mảnh, dễ bị chói khi trúng (chớp trắng); khiên + tấm nhỏ nên to hơn nữa nếu ptg thấy chưa đủ; kỵ sĩ còn khối vuông (sẽ mịn hơn nếu cần). Vật liệu thép dùng MeshStandardMaterial (game chưa có bản đồ phản chiếu) nên chưa "bóng gương" như kế hoạch (shader phản chiếu giả để dành nếu ptg muốn).

## Việc kế (đợt 2/2 của Mục 4)
- `kim_kimcang_4` Tượng Kim Cang hộ vệ · `kim_thietky_4` Đại kiếm sét xanh (nền nứt tỏa tia dùng lại `js/world/thoNut.js`) · `kim_tuyet` Kim Cang pháp tướng. Thêm vào `KIM3_KIEU` (kimFxMath.js), `CO_SO`, `fxKimThan.js`, `tests/kimfx.test.mjs` (đang kỳ vọng 3 kiểu; sửa số này), `fx-kim.html`.
- Sau đó Mộc (mục 5), mục 7–8, sửa rồng lửa (mục 12).

## PROMPT BÀN GIAO CHO PHIÊN SAU (dán nguyên văn)
```
Dự án DIỆU GIANG TỰ — repo https://github.com/tp9sach-ops/duanchuaon (main). Đọc PROMPT.md rồi docs/PHIEN212.md và docs/KE_HOACH_HIEU_UNG_3D_V2.md (phần "MỤC 4 — KIM"). Chỉ đọc chỗ cần; việc đã làm thì bỏ qua; cập nhật KHÔNG được gây lỗi (git clone repo, `setsid nohup npm test > /tmp/t.log 2>&1 < /dev/null &`, đợi "# fail"; ~5 phút). Đẩy GitHub bằng công cụ github push_files (đẩy ĐỦ file cả nhóm trong một lần). ptg nói tiếng Việt, không rành kỹ thuật: trả lời ngắn gọn dễ hiểu; làm từng MỤC; sửa code bằng find-and-replace; sau mỗi câu trả lời đính kèm file bàn giao .md mới.
GÓI THAM KHẢO: Unity "100 Special Skills Effects Pack v24.9" — chỉ học hình dạng (nền nứt tỏa tia, vòng sóng xung kích, khói bụi), KHÔNG chép ảnh/mô hình vào repo.
Chụp ảnh: cài three@0.160.1 ngoài repo, `python3 -m http.server 8765 --bind 127.0.0.1 &`, `NODE_PATH=$(npm root -g) node tools/fx-shot.cjs <thư mục three> <thư mục ra> kim_1 ...` rồi NHÌN ảnh (chụp 0,38 s sau phát; muốn sớm hơn sửa số 0.38 trong bản sao của fx-shot.cjs).
Tình hình: Kim 3D đợt 1 (kim_1, kim_2, kim_3) đã nối vào game, npm test 1364 đạt. Việc phiên này: Kim đợt 2 (kim_kimcang_4, kim_thietky_4, kim_tuyet). Xong: tăng sw.js VERSION (hiện dgt-v198), thêm docs/PHIEN<N>.md có prompt bàn giao như file này, đẩy GitHub, báo ptg, chờ "tiếp tục".
```

## QUY TẮC BÀN GIAO (nguyên văn)
> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff
