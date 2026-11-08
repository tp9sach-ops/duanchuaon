# PHIÊN 72 — Ném người chơi khác qua mạng — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Đọc: PROMPT.md → KE_HOACH_TONG.md → PHIEN67.md → PHIEN71.md → file này.

## ĐÃ LÀM
- **`gas/Throw.gs` (MỚI) + `case 'thr'` trong `gas/Code.gs`**: mỗi máy gọi ~2,5 giây/lần để báo cấp, sức mạnh, vị trí, đang rảnh hay không; máy chủ giữ sổ người chơi 15 giây. Khi ném: kiểm lại luật của ptg (cấp VÀ sức mạnh người kia nhỏ hơn, nhấc nổi 55 kg, không ném trong khuôn viên chùa (cả người ném lẫn người bị ném lẫn điểm rơi), không ném người đang ngồi/thiền, hồi chiêu 10 giây MỖI CẶP, cự ly ≤ 6 m, điểm rơi trong tầm ném). Người bị ném nhận "hộp thư" một lần và được dời tới điểm rơi, rơi an toàn không mất gì.
- **`js/world/throwNet.js` (MỚI, thuần)**: tìm người gần nhất, lập cú ném (kiểm chùa/hồi chiêu ở máy mình, tính điểm rơi tránh vật cản), câu chữ lý do dễ hiểu.
- **`js/ui/throwPlayer.js` (MỚI)**: nút "Ném người" (dock, sau Khiêng; ẩn khi đang đánh yêu quái hoặc đang khiêng vật); ném xong trừ 1 hạt sen (cần còn ≥ 1); nhận cú ném thì tự dịch chuyển + báo tên người ném. `LGT.room` có thêm `id/players()/count/name()`; `roomClient` có `players()`, `pageId`.
- Tests: `tests/throwNet.test.mjs` (6) chạy NGUYÊN FILE `gas/Throw.gs` trong máy ảo Node và đối chiếu kết luận với `throwCheck` máy khách trên lưới ca; dock +1. `npm test` **728/728**. `sw.js` = `dgt-v78`.

## PTG PHẢI LÀM
Dán `gas/Throw.gs` (mới) + `gas/Code.gs` (thêm dòng case 'thr') vào Apps Script → Deploy → Manage deployments → Edit → New version (cùng lúc với `gas/Yq.gs` của Phiên 71 nếu chưa dán). Chưa dán thì nút Ném người báo "Chưa kết nối được".

## LƯU Ý / CHƯA LÀM
- Chưa thử trên Apps Script thật, chưa thấy bằng mắt (không có mạng/WebGL ở đây) — ptg thử bằng 2 điện thoại ngoài chùa (một người cấp cao hơn).
- Cấp/sức mạnh người kia máy mình không biết → máy chủ phán; bị từ chối thì báo lý do ("Cấp của người đó không nhỏ hơn bạn…").
- Người ở trong nhà riêng: vị trí báo lên máy chủ là chỗ thật trong nhà (ngoài ±200 bị kẹp) — chưa xử lý riêng; ném người trong nhà bị chặn vì `usable()` (đang ở nhà thì không dùng).
- Còn lại: nút Dẫn đường nhấp nháy; sông + hồ; chỉnh số yêu quái theo cảm nhận ptg (`?yq=lua&yd=cao`).
