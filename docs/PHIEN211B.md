# Phiên 211 (phần B) — THỔ 3D nối vào game + nền đất nứt tỏa tia (theo gói hiệu ứng tham khảo)

> Repo `https://github.com/tp9sach-ops/duanchuaon` nhánh `main`. Đọc thêm `docs/PHIEN211.md` (Bước 1: Túi hồ lô đỏ, kế hoạch chi tiết, công cụ chụp ảnh) và `docs/KE_HOACH_HIEU_UNG_3D_V2.md`.
> Yêu cầu của ptg (2026-11-16): xem lại repo, việc đã làm thì bỏ qua; làm tiếp Phiên 211, tham khảo và làm GIỐNG file hiệu ứng tham khảo (gói Unity "100 Special Skills Effects Pack v24.9"); làm từng bước, xong đẩy GitHub rồi báo.

## Đã xem gói tham khảo (chỉ để học hình dạng, KHÔNG chép tài nguyên vào repo)
- Là gói Unity (.unitypackage ~390 MB): ~388 prefab hiệu ứng hạt, 112 ảnh (khói, nổ, vòng sóng, vết nứt `Crack*.png`, nhiễu), 27 mô hình đơn giản (vòng, trụ, sóng, bão…). KHÔNG có khối đá hay núi. Phong cách: hạt có ảnh + vết nứt nền tỏa tia + vòng sóng xung kích + khói bụi. Hiệu ứng Thổ gần nhất: MagmaStrike/MagmaField, GroundScatter, PlanetStone.
- Gói là tài sản trả phí: KHÔNG đưa ảnh/mô hình của gói lên repo (để tác phẩm không vướng bản quyền). Chỉ vẽ lại ý tưởng bằng canvas/shader tự viết (xem `THIRD_PARTY.md` nếu cần ghi nguồn).

## Đã làm (Thổ — MỤC 6)
1. (commit 1/2 trước đó) `js/world/thoFxMath.js`, `js/scene/fxTho.js`, `fx-tho.html`, `js/fxPreviewTho.js`.
2. `js/world/thoNut.js` (MỚI): toán thuần nền nứt tỏa tia (thời điểm, cỡ, các nhánh nứt cố định theo seed).
3. `js/scene/fxTho.js` (SỬA): vẽ nền nứt = 2 lớp (tối để thấy ban ngày + sáng cam đang nóng) cho `tho_1`, `tho_hukhong_4`, `tho_tuyet`; bỏ ở máy yếu; cửa sổ hiển thị 1,75 s → 2,3 s.
4. `js/scene/chieuFx.js` (SỬA, +3/−1 dòng): `import { taoTho }` + nhánh `p.he === 'tho'` gọi `taoTho({ ...o2, id })` → **Thổ đã NỐI vào game thật** (lỗi dựng → bị nuốt, game vẫn chạy).
5. `tests/thofx.test.mjs` (MỚI, 9 test) + thêm vào `npm test` (`package.json`). `sw.js` VERSION `dgt-v196` → `dgt-v197`.

## Đã kiểm / CHƯA kiểm (nói thật)
- Đã chạy: `node --test tests/thofx.test.mjs` → 9/9 đạt; `node --check` các file JS đã sửa đều đạt. Commit nối `chieuFx.js` đúng +3/−1 dòng (không sửa nhầm chỗ khác).
- CHƯA chạy `npm test` đầy đủ (máy AI phiên này không có mạng để git clone) → phiên sau PHẢI chạy `npm test` (kỳ vọng 1348 + 9 đạt) trước khi làm tiếp. CHƯA chụp ảnh WebGL (phiên này thiếu three.js + mạng): chạy `tools/fx-shot.cjs` cho `tho_1 tho_2 tho_3 tho_daidia_4 tho_hukhong_4 tho_tuyet` và NHÌN ảnh trước khi nói "xong".
- Ghi chú: commit đầu của phiên 2/2 (`thoNut.js` + test) có dòng ghi chú liệt kê nhiều hơn số file thật sự đẩy lúc đó; các file còn lại đến trong 3 commit ngay sau. Kết quả cuối đầy đủ.

## Việc kế (Bước tiếp)
- Chụp ảnh 6 chiêu Thổ bằng `tools/fx-shot.cjs`, sửa số tạm (cỡ/màu/độ sáng) cho đến khi thấy rõ khối đá + nền nứt.
- Sau đó làm MỤC 4 KIM theo `docs/KE_HOACH_HIEU_UNG_3D_V2.md` ("Kế hoạch chi tiết mục 4"), rồi Mộc (mục 5), rồi mục 7–8, rồi sửa rồng lửa (mục 12).

## PROMPT BÀN GIAO CHO PHIÊN SAU (dán nguyên văn)
```
Dự án DIỆU GIANG TỰ — repo https://github.com/tp9sach-ops/duanchuaon (main). Đọc PROMPT.md rồi docs/PHIEN211.md, docs/PHIEN211B.md và docs/KE_HOACH_HIEU_UNG_3D_V2.md. Chỉ đọc chỗ cần; việc đã làm thì bỏ qua; cập nhật KHÔNG được gây lỗi (git clone repo rồi `setsid nohup npm test > /tmp/t.log 2>&1 < /dev/null &`, đợi dòng "# fail"; ~5 phút). Đẩy GitHub bằng công cụ github push_files (đẩy ĐỦ file cả nhóm trong một lần, rồi kiểm get_commit xem đúng số file). ptg nói tiếng Việt, không rành kỹ thuật: trả lời ngắn gọn, dễ hiểu; làm Từng MỤC; khi sửa code đưa đoạn "tìm" đầy đủ rồi code thay thế đầy đủ; sau MỖI câu trả lời đính kèm file bàn giao .md mới.
GÓI THAM KHẢO: ptg đã gửi gói Unity "100 Special Skills Effects Pack v24.9" làm mẫu để làm hiệu ứng GIỐNG (nền nứt tỏa tia, vòng sóng xung kích, khói bụi). Chỉ học hình dạng, không chép ảnh/mô hình vào repo.
Tình hình: Thổ 3D đã nối vào game (Phiên 211 phần B). Việc phiên này: (1) `npm test` đầy đủ + chụp ảnh 6 chiêu Thổ bằng tools/fx-shot.cjs và nhìn, sửa cho đẹp; (2) xong thì MỤC 4 KIM. Xong: tƒÉng sw.js VERSION (hiện dgt-v197), thêm docs/PHIEN<N>.md có prompt bàn giao như file này, đẩy GitHub, báo ptg, chờ "tiếp tục".
```

## QUY TẮC BÀN GIAO (nguyên văn)
> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff
