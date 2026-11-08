# PHIÊN 71 — Yêu quái đánh CHUNG qua Apps Script (máu chung + tranh nhặt lá) — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Đọc: PROMPT.md → KE_HOACH_TONG.md → PHIEN67.md → file này.

## ĐÃ LÀM
- **Máy chủ `gas/Yq.gs` (MỚI) + `case 'yq'` trong `gas/Code.gs`**: mỗi key (vd `2026-11-cao`) có trạng thái riêng trong CacheService (6 giờ). Máu chung = tổng sát thương mọi người (mỗi người gửi TỔNG của mình, chỉ tăng, tối đa +600 mỗi lượt → gửi lại không tính đôi, chống gian). Hết máu → máy chủ cấp `seed` + chỗ rơi `at` (người kết liễu đầu tiên); túi lá nhận theo "ai gửi xin trước thắng", mỗi túi một người.
- **`js/world/yqCoop.js` (MỚI, thuần, có test)**: `buildReq`, `applyServer` (máu chung, trừ phần chưa gửi cho mượt, báo bị người khác kết liễu), `lootFromServer` (cùng seed → mọi máy dựng đúng cùng các túi, id giống nhau), `leavesGranted`.
- **`js/ui/yeuquai.js`**: khi có apiUrl và không phải chế độ thử `?yq=` → đánh chung: đòn đánh chỉ cộng vào tổng gửi lên (máy không tự kết liễu), 2,5 giây hỏi máy chủ một lần; máy chủ báo hết máu thì mọi người nhận thưởng theo phần công; chạm túi lá → xin máy chủ, được mới cộng lá, thua thì báo "có người nhanh tay hơn". Lỗi mạng: giữ túi chờ gửi lại; không có apiUrl: đánh một mình như cũ.
- Tests: `tests/yqcoop.test.mjs` (6) chạy NGUYÊN FILE `gas/Yq.gs` trong máy ảo Node với CacheService/LockService giả. `npm test` **721/721**. `sw.js` = `dgt-v77`.

## PTG PHẢI LÀM
Dán `gas/Yq.gs` (file mới) và `gas/Code.gs` (thêm 1 dòng case 'yq') vào Apps Script → Deploy → Manage deployments → Edit → New version. Chưa làm thì game vẫn chạy nhưng yêu quái không chung máu (máy chủ trả lỗi → mỗi máy thấy máu riêng, máu có thể giật khi kết nối lại).

## CHƯA LÀM / LƯU Ý
- Chưa thử trên Apps Script thật (không có mạng ở môi trường này) — ptg thử với 2 điện thoại vào khung 15:00 hoặc 20:00.
- **Ném người chơi khác qua mạng** (bước kế tiếp): dùng `throwCheck`, hồi chiêu 10 giây, −1 hạt sen; cần thêm "hộp thư bị ném" trong Room.gs / transport.
- Mỗi máy vẫn tự mô phỏng chuyển động + vùng đỏ của yêu quái (không đồng bộ vị trí) nên hai người có thể thấy yêu quái ở chỗ hơi khác nhau.
- Người vào muộn khi máy chủ đã báo hết máu: nhận 0 thưởng (phần công < MIN_SHARE) nhưng vẫn tranh nhặt lá còn lại.
