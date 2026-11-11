# PHIÊN 103 — GDD v2: G1.2 (đường cong Tu Vi) — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Đọc: PROMPT.md → docs/PHIEN101.md → docs/PHIEN102.md → file này → docs/KE_HOACH_GDD_V2.md (mục G1). Chỉ đọc file cần thiết.

## Yêu cầu
ptg nói "tiếp tục" → làm MỘT mục kế: G1.2.

## Đã làm (G1.2 XONG)
- `js/data/stats.js`: thêm `EXP_CFG = { tam: true, heSo: 30, mu: 1.6 }` (đóng băng).
- `js/world/stats.js`: thêm `expToNext(n)` (EXP để lên từ cấp n lên n+1 = round(30×n^1,6); cấp 150 → 0), `expCurve(n)` (công thức thô, để đối chiếu mốc), `totalExpFor(tv)` (tổng EXP tích lũy để ĐẠT cấp tv; cấp 1 = 0), `levelFromExp(exp)`, `expRemaining(exp)`, `progressOf(exp)` → `{tuvi, into, need, pct}`. Tu Vi của người chơi nên lưu dưới dạng TỔNG EXP; cấp tính từ đó.
- `tests/stats.test.mjs`: thêm 6 test (tổng 12). Chạy cục bộ `node --test tests/stats.test.mjs` → 12/12 đạt; `node --check` đạt.

## Phát hiện quan trọng cho G8.1 (cân bằng)
- Mốc GDD "cấp 10 ≈ 1.200 / 30 ≈ 6.900 / 60 ≈ 21.000 / 90 ≈ 40.000 / 120 ≈ 64.000 / 150 ≈ 91.000" là EXP của RIÊNG một cấp (n = 10, 30...), KHÔNG phải tổng tích lũy. Đã kiểm: khớp trong 1%.
- Tổng tích lũy theo cùng công thức: đạt cấp 10 = 4.012 EXP; cấp 30 = 76.488; cấp 60 = 474.100; cấp 150 ≈ 5,2 triệu. Mục tiêu giờ chơi của GDD (cấp 10 ≈ 1 giờ, 30 ≈ 8 giờ, 60 ≈ 35 giờ, 150 ≈ 250 giờ) kéo theo tốc độ kiếm EXP phải tăng mạnh theo cấp (khoảng 1.200 EXP/giờ ở đầu → vài chục nghìn EXP/giờ về sau). Cần chọn: giữ công thức và chỉnh EXP mỗi quái, hoặc đổi `heSo`/`mu`. Hỏi ptg ở G8.1; đừng tự đổi.

## Kiểm tra
- Chưa chạy `npm test` đầy đủ (không clone được repo; bash không có mạng). File mới/sửa chỉ import lẫn nhau (`js/data/stats.js`, `js/world/stats.js`), không đụng mã cũ.
- Nợ nhỏ: cột Trạng thái G1.1, G1.2 trong `docs/KE_HOACH_GDD_V2.md` vẫn "chưa" → sửa thành `XONG (Phiên 102)` / `XONG (Phiên 103)` đầu phiên sau (nếu có `git clone`, sửa bằng một lệnh sed).

## VIỆC KẾ (một mục, chờ "tiếp tục")
- **G1.3**: công thức sát thương: `Công × hệ số skill × (1 + cường hóa) × K_hệ × 100 ÷ (100 + Thủ)`, chí mạng ×1,5. File `js/world/combat.js` + `tests/combat.test.mjs` (đăng ký test vào `package.json`). Dùng `congOf`/`thuOf` từ `js/world/stats.js`. KHÔNG đổi kết quả `stoneDamage`, `spearDamage`, `khiDamage`, `dashDamage` (xem docs/GDD_v2_DOICHIEU.md mục 5); thêm test chứng minh. Cần xem nhanh các hàm đó trong `js/world/yeuquai.js`, `conKhi.js`, `thietDau.js` trước khi viết.
- Sau đó G1.4 (nguồn Tu Vi), G1.5 (lưu GAS), G1.6 (HUD + Oán Khí + Dã Mèo Rừng).

## Câu hỏi còn treo cho ptg (mặc định có sẵn)
G0.2, G0.4, câu 11–16 (xem docs/GDD_v2_DOICHIEU.md), đặc biệt câu 15: bỏ `√hạt sen` khỏi `strengthOf` (nạp tiền không tăng sức mạnh) — mặc định: bỏ.

## Prompt khởi động cho phiên sau (dán nguyên)
> Đọc PROMPT.md → docs/PHIEN101.md → docs/PHIEN102.md → docs/PHIEN103.md → docs/KE_HOACH_GDD_V2.md. Repo `tp9sach-ops/duanchuaon`. G0.1, G0.3, G0.5, G1.1, G1.2 đã XONG (cột Trạng thái trong KE_HOACH cần cập nhật). Chạy `npm test` nếu có thể. Làm MỘT mục (G1.3), gửi bàn giao docs/PHIEN104.md, rồi CHỜ ptg nói "tiếp tục". Chỉ đọc những file cần thiết.
