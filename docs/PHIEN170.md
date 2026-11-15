# Phiên 170 — sửa tạo nhân vật bị kẹt + chờ máy chủ quá lâu

## Hiện tượng (ảnh người dùng gửi)
Màn "Tạo nhân vật" báo: `blocked · acctCreate | 0KB | https://tp9sach-ops.github.io | khung | Failed to fetch | khung: không phản hồi`.
→ Cả đường `fetch` lẫn đường form+iframe (Phiên 55) đều không nhận được phản hồi từ Apps Script (`config.js → apiUrl`). Đây là lỗi CẤU HÌNH MÁY CHỦ, không phải lỗi logic web (test chạy thật `gas/Accounts.gs` đều đạt — xem PHIEN54).

## Đã sửa (phía web)
- `js/ui/accountGate.js` → `doCreate`: khi lỗi thuộc nhóm sự cố máy chủ (`isNetworkError`: blocked, bad_response, network, timeout, http_*, unknown_action…), hiện giải thích 2,5 giây rồi TỰ vào chùa ở chế độ chơi tạm (`enterWorld` vẫn lưu tên/màu áo/kiểu đầu vào máy). Lần mở sau, `entryMode` = `claim` ("Đặt mật khẩu cho nhân vật") để lưu lên máy chủ khi đã sẵn sàng. Lỗi người chơi tự sửa được (trùng tên, mật khẩu ngắn…) vẫn ở lại màn tạo.
- `js/api.js`: thăm dò no-cors 8s → 3s (`PROBE_MS`), khung dự phòng 12s → 8s (`FRAME_FALLBACK_MS`). Lúc máy chủ bị chặn, tổng chờ từ ~20s còn ~11s (+2,5s hiện thông báo).

## VIỆC GP PHẢI LÀM Ở APPS SCRIPT (web không tự sửa được)
1. Mở dự án Apps Script của chùa → đảm bảo có `Accounts.gs` và `Code.gs` bản mới nhất trong repo (`gas/`).
2. Chạy thử một hàm bất kỳ trong trình soạn thảo → bấm **Review permissions / Authorize**.
3. **Deploy → Manage deployments → ✏️ Edit → Version: New version**; mục **Who has access = Anyone**; Execute as = Me → Deploy.
4. Mở thẳng URL `/exec` trên trình duyệt (không đăng nhập Google): phải thấy JSON/chữ của script, không phải trang đăng nhập Google.
5. Thử lại tạo nhân vật; trong Sheet phải có tab `Accounts` thêm 1 hàng.

## Chưa kiểm
Sandbox AI không gọi được script.google.com và không chạy được test Node → các sửa trên chưa chạy thử thật. Cần mở trang, thử tạo nhân vật khi máy chủ còn lỗi (phải tự vào chùa sau ~13s) và khi máy chủ đã sửa (phải tạo bình thường).
