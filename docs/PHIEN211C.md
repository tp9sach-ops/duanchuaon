# Phiên 211 (phần C) — KIỂM TRA Thổ 3D (không đổi mã game)

> Repo `https://github.com/tp9sach-ops/duanchuaon` nhánh `main`. Đọc sau `docs/PHIEN211B.md`.

## Kết quả kiểm (làm thật, 2026-11-16)
- `npm test` đầy đủ trên bản main mới nhất (commit 0a06db4): **1357 test, 1357 đạt, 0 lỗi** (khớp kỳ vọng 1348 + 9).
- Chụp ảnh WebGL 6 chiêu Thổ bằng `tools/fx-shot.cjs` (three@0.160.1 cài ngoài repo): `tho_1 tho_2 tho_3 tho_daidia_4 tho_hukhong_4 tho_tuyet` → **không lỗi shader/trang**.
- Đã NHÌN ảnh `tho_1` (gai đá tối + hạt vàng + vết nứt cam tỏa tia dưới đất), `tho_daidia_4` (vòng hạt vàng + nền nứt dạng lưới), `tho_tuyet` (chỉ thấy nền nứt + vòng cam ở thời điểm chụp 0,38 s sau lúc phát; khối chính hiện muộn hơn).
- Ảnh `tho_2`, `tho_3`, `tho_hukhong_4` đã chụp nhưng CHƯA xem kỹ.

## Chưa làm / nhận xét
- Vết nứt còn mảnh và mờ so với gói mẫu (gói mẫu nứt đậm, sáng hơn). Có thể tăng `lineWidth` trong `nutTexture()` (`js/scene/fxTho.js`, dòng ~44) nếu ptg thấy chưa đủ rõ trong game thật.
- Không đổi mã nên không tăng `sw.js` VERSION (vẫn `dgt-v197`).

## Việc kế
- MỤC 4 KIM theo `docs/KE_HOACH_HIEU_UNG_3D_V2.md`, rồi Mộc (mục 5), mục 7–8, sửa rồng lửa (mục 12).

## PROMPT BÀN GIAO CHO PHIÊN SAU (dán nguyên văn)
```
Dự án DIỆU GIANG TỰ — repo https://github.com/tp9sach-ops/duanchuaon (main). Đọc PROMPT.md rồi docs/PHIEN211B.md, docs/PHIEN211C.md và docs/KE_HOACH_HIEU_UNG_3D_V2.md. Chỉ đọc chỗ cần; việc đã làm thì bỏ qua; cập nhật KHÔNG được gây lỗi (git clone repo, chạy `npm test` nền, đợi "# fail"). ptg nói tiếng Việt, trả lời ngắn gọn dễ hiểu; làm từng MỤC; sửa code bằng find-and-replace (đoạn "tìm" đầy đủ + code thay thế đầy đủ); sau mỗi câu trả lời đính kèm file bàn giao .md.
GÓI THAM KHẢO: Unity "100 Special Skills Effects Pack v24.9" — chỉ học hình dạng (nền nứt tỏa tia, vòng sóng xung kích, khói bụi), KHÔNG chép ảnh/mô hình vào repo.
Tình hình: Thổ 3D đã nối vào game và đã kiểm (npm test 1357 đạt; ảnh WebGL không lỗi). Việc phiên này: MỤC 4 KIM. Xong: tăng sw.js VERSION (hiện dgt-v197), thêm docs/PHIEN<N>.md có prompt bàn giao như file này, đẩy GitHub, báo ptg, chờ "tiếp tục".
```

## QUY TẮC BÀN GIAO (nguyên văn)
> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff
