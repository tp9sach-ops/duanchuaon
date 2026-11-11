# PHIÊN 101 — GDD v2: chốt G0 (đối chiếu bổ sung, G0.5), phát hiện mâu thuẫn "nạp tiền → sức mạnh" — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Đọc: PROMPT.md → docs/PHIEN99.md → docs/PHIEN100.md → docs/GDD_v2_DOICHIEU.md (mục 8) → docs/KE_HOACH_GDD_V2.md → file này.

## Yêu cầu
ptg: "hãy làm theo gdd v2". Theo `docs/KE_HOACH_GDD_V2.md`, bước đầu là G0.

## Đã làm (không đổi mã, không đổi test)
- Phát hiện `docs/GDD_v2_DOICHIEU.md` (G0.1) đã có từ Phiên 99; chỉ bảng tiến độ trong kế hoạch chưa cập nhật. (Sai sót nhỏ của phiên này: lỡ viết đè lên file đó rồi đã khôi phục từ git; bản repo được giữ nguyên, chỉ thêm mục 8.)
- G0.3 XONG (Phiên 100), G0.5 XONG (grep thật): ghi trong `docs/GDD_v2_DOICHIEU.md` mục 6 và 8; `docs/KE_HOACH_GDD_V2.md` đánh dấu G0.1, G0.3.
- Kiểm thêm: boss chung qua **GAS `gas/Yq.gs`** (không phải Firebase); ZONE đã nối một phần; **nạp tiền thật tăng sức mạnh qua `√hạt sen` trong `strengthOf`** (trái GDD mục 13).

## Gp phải làm
1. Tải `cap-nhat-phien101.zip` (docs/GDD_v2_DOICHIEU.md, docs/KE_HOACH_GDD_V2.md, docs/PHIEN101.md) lên repo, trùng tên ghi đè.
2. Trả lời G0.2 (10 câu GDD mục 16) + câu 11–16 trong `docs/GDD_v2_DOICHIEU.md` (mục 7 và 8); có thể nói "mặc định cả".
3. Đặc biệt: bỏ `√sen` khỏi `strengthOf` (câu 15)?

## VIỆC KẾ (một mục, chờ "tiếp tục")
1. Nếu ptg đồng ý câu 15: sửa `strengthOf` + `tests/strength.test.mjs`, `npm test`.
2. Rồi G1.1 (`js/data/stats.js`, `js/world/stats.js`, `tests/stats.test.mjs`).

## Prompt khởi động cho phiên sau (dán nguyên)
> Đọc PROMPT.md → docs/PHIEN99.md → docs/PHIEN100.md → docs/PHIEN101.md → docs/GDD_v2_DOICHIEU.md → docs/KE_HOACH_GDD_V2.md. Repo `tp9sach-ops/duanchuaon`. G0.1, G0.3, G0.5 đã XONG. Lấy câu trả lời của ptg cho G0.2/G0.4 và câu 11–16. Làm MỘT mục, `npm test`, gửi bàn giao docs/PHIEN102.md, rồi CHỜ ptg nói "tiếp tục".
