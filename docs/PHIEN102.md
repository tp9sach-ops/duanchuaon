# PHIÊN 102 — GDD v2: G1.1 (chỉ số Công / Thủ / Sinh Lực theo Tu Vi) — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Đọc: PROMPT.md → docs/PHIEN99.md → docs/PHIEN100.md → docs/PHIEN101.md → docs/GDD_v2_DOICHIEU.md (mục 8) → docs/KE_HOACH_GDD_V2.md → file này.

## Yêu cầu của ptg (phiên này)
1. Đẩy `cap-nhat-phien101.zip` lên repo `tp9sach-ops/duanchuaon`.
2. Chỉ xem chỗ cần thiết; tiếp tục từng bước theo GDD v2: hệ thống skill, vật phẩm, cách chơi, kỹ năng chiến đấu, quái cố định ở các bãi rừng để nhân vật farm tăng công đức.

## Đã làm
- Đẩy 3 file của zip lên `main`: `docs/PHIEN101.md` (mới), `docs/GDD_v2_DOICHIEU.md` (thêm mục 8), `docs/KE_HOACH_GDD_V2.md` (G0.1, G0.3 đánh dấu XONG).
- **G1.1 XONG** (một mục, không đụng giao diện, không đụng mã cũ):
  - `js/data/stats.js`: `STATS_CFG` (đóng băng, `tam: true`). Công = 10 + 3×(Tu Vi−1); Thủ = 5 + 2×(Tu Vi−1); Sinh Lực = 120 + 25×(Tu Vi−1); Tu Vi kẹp 1..150. **Mọi số là TẠM**, ptg duyệt ở G8.1.
  - `js/world/stats.js`: `clampTuVi`, `congOf`, `thuOf`, `sinhLucOf`, `statsOf` (logic thuần).
  - `tests/stats.test.mjs`: 6 test (mốc cấp 1/10/30/60/150 có đáp án tay, tăng nghiêm ngặt 1..150, đầu vào lạ, hàm thuần). Đã thêm vào script `test` trong `package.json`.
- Cố ý KHÔNG dùng `strengthOf` (vì `√hạt sen` cho phép nạp tiền tăng sức mạnh, câu 15 chưa được ptg trả lời). Không sửa `strengthOf`, không sửa test cũ.

## Kiểm tra đã chạy / CHƯA chạy (nói thật)
- Đã chạy cục bộ: `node --test tests/stats.test.mjs` → 6/6 đạt; `node --check` cho 2 file mới; quét chữ Hán và tên cũ (Linh Quang/Giang, Kage) theo `tests/smoke.mjs` → sạch.
- **CHƯA chạy `npm test` toàn bộ (869 test)**: phiên này không clone được repo (không có mạng cho bash). Phiên sau, nếu có `git clone`, chạy `npm test` trước khi làm tiếp. File mới độc lập, không import file cũ nên rủi ro thấp.
- `docs/KE_HOACH_GDD_V2.md`: cột Trạng thái của G1.1 **chưa** sửa thành `XONG (Phiên 102)`. Việc đầu của phiên sau.

## Việc kế (MỘT mục, chờ ptg nói "tiếp tục")
1. Sửa trạng thái G1.1 trong `docs/KE_HOACH_GDD_V2.md`.
2. **G1.2**: đường cong Tu Vi (EXP lên cấp kế = 30 × n^1,6; hàm tính cấp từ EXP; mốc cấp 10 ≈ 1.200, 30 ≈ 6.900, 60 ≈ 21.000, 90 ≈ 40.000, 120 ≈ 64.000, 150 ≈ 91.000) trong `js/world/stats.js` hoặc `levels.js`, kèm test. Lưu ý: các mốc trong GDD là tổng EXP tích lũy hay EXP của riêng cấp đó phải tự kiểm bằng công thức rồi ghi rõ trong test (đừng đoán).
3. Sau đó G1.3 (công thức sát thương), G1.4 (nguồn Tu Vi), G1.5 (lưu GAS), G1.6 (HUD + Dã Mèo Rừng).

## Lộ trình tới mục tiêu "quái cố định ở bãi rừng để farm công đức" (theo KE_HOACH_GDD_V2)
- G1.6(a): đổi nhãn máu boss thành Oán Khí + khung mục tiêu. G1.6(b): quái thường Dã Mèo Rừng (cấp 3) sinh cục bộ.
- G3.6: hai vùng đầu (Bìa Rừng Thông 3–20, Đường Mòn Đông–Tây 12–25), tối đa ~12 con, hồi sinh 30–60 giây, `js/world/spawn.js` + `js/data/monsters.js`.
- G3.4: Điểm Công Đức riêng (không tiêu, dùng cho xếp hạng/danh hiệu) từ thu phục + thanh tẩy ở Quy Y Viện. Hạt sen/Tu Vi từ hàng yêu ở G1.4.
- G2.x: skill/Hệ; G3.5 và G5–G6: vật phẩm (Linh Ấn, Huyền Tinh, trứng, Thần Khí). Chỉ thêm vật phẩm khi hệ thống dùng đến.

## Câu hỏi còn treo cho ptg (đều có mặc định, nói "mặc định cả" là đủ)
G0.2 (10 câu GDD mục 16), G0.4 (làm CÁ trước hay sau G1; mặc định: sau), câu 11–16 trong `docs/GDD_v2_DOICHIEU.md`. Đặc biệt **câu 15: bỏ `√hạt sen` khỏi `strengthOf`?** (mặc định: bỏ; sẽ sửa `strengthOf` + `tests/strength.test.mjs`).

## Prompt khởi động cho phiên sau (dán nguyên)
> Đọc PROMPT.md → docs/PHIEN99.md → docs/PHIEN100.md → docs/PHIEN101.md → docs/PHIEN102.md → docs/GDD_v2_DOICHIEU.md → docs/KE_HOACH_GDD_V2.md. Repo `tp9sach-ops/duanchuaon`. G0.1, G0.3, G0.5, G1.1 đã XONG. Chạy `npm test` trước (phiên 102 chưa chạy được bộ đầy đủ). Sửa trạng thái G1.1 trong KE_HOACH, rồi làm MỘT mục (G1.2), `npm test`, gửi bàn giao docs/PHIEN103.md, rồi CHỜ ptg nói "tiếp tục". Chỉ đọc những file cần thiết.
