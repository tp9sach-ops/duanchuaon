# Phiên 210 — Hiệu ứng chiêu thức "hoành tráng": MỤC 1 = rà soát (chỉ đọc, KHÔNG sửa mã)

> Repo `main` (đầu phiên: sau Phiên 209). Yêu cầu của ptg (2026-11-16): xem lại repo duanchuaon, việc nào làm rồi thì bỏ qua, cập nhật KHÔNG lỗi; làm lại hiệu ứng chiêu thức cho đẹp và hoành tráng; làm TỪNG MỤC từ mục 1, xong đẩy GitHub rồi báo, chờ "tiếp tục".
> Phiên này CHỈ ĐỌC MÃ + viết tài liệu → KHÔNG tăng `sw.js` VERSION, KHÔNG chạy lại `npm test` (lần gần nhất: Phiên 208, 1348/1348 đạt).

## QUYẾT ĐỊNH VỀ GÓI "100 Special Skills Effects Pack v24.9" (ptg gửi zip)
- Gói là `.unitypackage` (~570 MB giải nén). README trong zip ghi rõ do trang unityassetcollection.com chia sẻ lại (asset trả phí của Unity Asset Store, không có giấy phép phát tán).
- KHÔNG đẩy gói lên GitHub (repo công khai, chạy GitHub Pages). KHÔNG giải nén, KHÔNG sao chép hình/shader/thông số/prefab từ gói, kể cả viết lại bằng code ("làm giống 100%" cũng không làm).
- Cách làm đã thống nhất với ptg: TỰ DỰNG hiệu ứng bằng code (đúng mặc định "chỉ code" của Phiên 209), lấy MỨC CHẤT LƯỢNG (nhiều lớp, hoành tráng) làm tham chiếu, thiết kế/màu/cách dựng là của riêng game. Nếu ptg muốn đúng gu → mô tả bằng lời từng chiêu (vd "chiêu Lửa: cột lửa xoáy, tia lửa bay lên, mặt đất nứt cháy đỏ").
- Đừng đề xuất lại việc đẩy gói / làm giống 100% ở các phiên sau.

## Đã đọc kỹ (nội dung)
`docs/PHIEN209.md`, `js/world/chieuFxPlan.js`, `js/data/chieuFx.js`, `js/world/chieuLop.js`, `js/scene/chieuFx.js`. Chỉ biết tên + cỡ: các file còn lại trong `js/scene` (fxHoa 13 KB, fxBang 20 KB, fxKim 11,5 KB, fxLua 9 KB, fxThuy 14,6 KB, fxShader, fxTex, chieuTrungFx 10 KB, slashFx, soulFx, yqModels…) và `js/world/{chieuTrung,chieuPose*,hoaFxMath,thuyFxMath,fxGlsl*}.js`.

## Hiện trạng hiệu ứng 30 chiêu (5 Hệ × 6 chiêu)
Mỗi Hệ (Kim, Mộc, Thủy, Thổ, Hỏa) có 6 chiêu: 3 chiêu thường, 2 chiêu 4, 1 tuyệt học (id dạng `kim_1`, `hoa_liethoa_4`, `moc_tuyet`…). Đường ống đã có SÁU LỚP (`chieuLop.js` + `scene/chieuFx.js`): 1 lõi sáng · 2 thân năng lượng · 3 quầng + vệt · 4 hạt 3 cỡ · 5 decal nền + sóng chấn · 6 tàn dư; vùng cảnh báo (viền + hoa văn) luôn hiện; 3 bậc máy (yếu/vừa/cao) theo `perfLevel`; trần hạt 150/300/800; không dùng đèn động.

| Hệ | Lớp 2 "thân" (vật thể 3D riêng) | Nhận xét |
| --- | --- | --- |
| Hỏa (6 chiêu) | CÓ: `fxHoa.js` (lửa khối shader, 6 chữ ký riêng, Phiên 202) + `fxLua.js` dự phòng | Tốt nhất hiện nay |
| Thủy (6) | CÓ: `fxBang.js` (băng + nước) cho loại `bang`/`nuoc` | Đã nối Phiên 183 |
| Kim (6) | CÓ: `fxKim.js` (kim loại + sét) cho loại `kim` | Đã nối Phiên 183 |
| Mộc (6) | KHÔNG (lớp thân = null) | Chỉ còn hạt lá/sương + quầng + decal "dây leo" → thiếu hoành tráng |
| Thổ (6) | KHÔNG (lớp thân = null) | Chỉ còn hạt đá + decal "nứt" → thiếu hoành tráng |

Các điểm yếu khác ghi nhận:
1. 12/30 chiêu (Mộc, Thổ) không có vật thể 3D riêng.
2. Mọi số liệu hiệu ứng là số TẠM, CHƯA AI nhìn bằng mắt (môi trường AI không có WebGL) → cần ptg mở game xem và báo bằng lời.
3. Chỉ 5 kiểu bay hạt chung (`tia`, `no`, `xoay`, `mua`, `hut`); chiêu cùng kiểu trông na ná nhau.
4. Chưa có hiệu ứng "chuyển cảnh" cho tuyệt học (tối nền, camera ép, vòng sáng lan khắp màn) ngoài rung/khựng/FOV của `camFeel.js`.
5. Hiệu ứng lúc TRÚNG nằm ở `chieuTrungFx.js` (chưa đọc) — chưa đánh giá.

## LỘ TRÌNH ĐỀ XUẤT (mỗi dòng 1 phiên nhỏ, xong thì chờ "tiếp tục")
- MỤC 2: Hệ Thổ — viết `js/scene/fxTho.js` (thân: cột đá trồi, sóng nứt nền, bụi cuộn, mảnh đá bay), nối vào `scene/chieuFx.js` giống cách đã nối `taoKim`/`taoBang`; có đường lui (lỗi → bỏ lớp thân, game vẫn chạy); thêm test logic thuần nếu có phần tính toán.
- MỤC 3: Hệ Mộc — `js/scene/fxMoc.js` (dây leo trồi, hoa nở, bào tử, lá xoáy).
- MỤC 4: nâng tuyệt học cả 5 Hệ (khoảnh khắc "đỉnh": vòng sáng lan, ép camera, tối nền ngắn, bật sáng).
- MỤC 5: đối chiếu hiệu ứng TRÚNG (`chieuTrungFx.js`) + thêm biến thể kiểu bay để chiêu cùng Hệ không giống nhau.
- MỤC 6: chỉnh số theo phản hồi của ptg sau khi xem bằng mắt; tối ưu máy yếu.
- Mỗi phiên: grep trùng tên/id trước; tăng `sw.js` VERSION khi sửa mã; chạy `npm test` (~5 phút, chờ dòng "# fail"); đẩy bằng github push_files; viết `docs/PHIEN<N>.md` kèm prompt bàn giao.

## PROMPT BÀN GIAO CHO PHIÊN SAU (dán nguyên văn)
```
Dự án DIỆU GIANG TỰ — repo https://github.com/tp9sach-ops/duanchuaon (main). Đọc PROMPT.md, rồi docs/PHIEN210.md (và bản PHIEN mới nhất nếu có). Chỉ đọc chỗ cần; việc đã làm thì bỏ qua; cập nhật KHÔNG được gây lỗi (git clone repo rồi `setsid nohup npm test > /tmp/t.log 2>&1 < /dev/null &`, đợi dòng "# fail"; ~5 phút). Đẩy GitHub bằng công cụ github push_files (không có git credential trong container). ptg nói tiếng Việt, không rành kỹ thuật: trả lời ngắn gọn, dễ hiểu; làm TỪNG MỤC; khi sửa code đưa đoạn "tìm" đầy đủ rồi code thay thế đầy đủ.
Tình hình: ptg muốn hiệu ứng chiêu thức "đẹp và hoành tráng". Gói Unity "100 Special Skills Effects Pack" ptg gửi là hàng chia sẻ lại không giấy phép: KHÔNG đẩy lên GitHub, KHÔNG dùng/sao chép nội dung của nó; chỉ tự dựng bằng code, lấy mức chất lượng làm tham chiếu (xem docs/PHIEN210.md). MỤC 1 (rà soát) đã xong. Việc phiên này: làm MỤC 2 = Hệ Thổ, viết js/scene/fxTho.js (thân 3D riêng cho 6 chiêu Thổ), nối vào js/scene/chieuFx.js theo mẫu taoKim/taoBang (có đường lui khi lỗi), tăng VERSION sw.js, chạy npm test (phải đạt hết), thêm docs/PHIEN211.md có prompt bàn giao như file này, đẩy GitHub, báo ptg, chờ "tiếp tục". Nhắc ptg: hiệu ứng CHƯA ai nhìn bằng mắt, nhờ ptg mở game xem và báo lại bằng lời.
```

## QUY TẮC BÀN GIAO (nguyên văn)
> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff
