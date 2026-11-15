# Phiên 170 — sửa tạo nhân vật bị kẹt + chờ máy chủ quá lâu + tặng hạt sen không nhận được

## A. Tạo nhân vật bị kẹt / chờ lâu
Hiện tượng: màn "Tạo nhân vật" báo `blocked · acctCreate | 0KB | https://tp9sach-ops.github.io | khung | Failed to fetch | khung: không phản hồi`.
→ Cả đường `fetch` lẫn đường form+iframe (Phiên 55) đều không nhận được phản hồi từ Apps Script (`config.js → apiUrl`). Đây là lỗi CẤU HÌNH MÁY CHỦ, không phải lỗi logic web (test chạy thật `gas/Accounts.gs` đều đạt — xem PHIEN54).

Đã sửa (phía web):
- `js/ui/accountGate.js` → `doCreate`: lỗi thuộc nhóm sự cố máy chủ (`isNetworkError`) → hiện giải thích 2,5 giây rồi TỰ vào chùa chơi tạm (`enterWorld` vẫn lưu tên/màu/kiểu đầu). Lần mở sau `entryMode` = `claim` để đặt mật khẩu. Lỗi người chơi sửa được (trùng tên, mật khẩu ngắn…) vẫn ở lại màn tạo.
- `js/api.js`: thăm dò no-cors 8s → 3s (`PROBE_MS`), khung dự phòng 12s → 8s (`FRAME_FALLBACK_MS`). Tổng chờ khi máy chủ bị chặn từ ~20s còn ~11s (+2,5s hiện thông báo).

VIỆC GP PHẢI LÀM Ở APPS SCRIPT: Authorize, Deploy → Manage deployments → Edit → New version, Who has access = Anyone; mở thử URL `/exec` trong tab ẩn danh.

## B. Tặng hạt sen bằng `adminSetSen` nhưng nhân vật không nhận được
Nguyên nhân: `adminSetSen` sửa thẳng bản lưu và tăng `rev`. Người chơi gần như luôn có thay đổi chưa lưu (vị trí, đồng hồ, bộ đếm ngày…) hoặc đang mở game → lúc mở trang `pull()` thấy "máy chủ có bản mới" + "máy này có thay đổi chưa lưu" = XUNG ĐỘT (không tự ghi đè, hiện băng chọn). Game đang mở thì `push` bị `stale`. Nếu người chơi chọn "Giữ bản máy này" hoặc game lưu đè (force) thì số sen cũ ghi đè lại số sen vừa tặng. Ví hạt sen còn được giữ trong bộ nhớ của game (`hudMenu.js` → `wallet`) nên sửa localStorage khi đang chơi cũng bị ghi đè.

Cách mới (không phụ thuộc rev, không bao giờ xung đột):
- `gas/Accounts.gs`: cột N `grants` (JSON `[{id, sen, t}]`, tối đa 10) nằm NGOÀI bản lưu. `adminGiveSen(name, sen, aid?)` chỉ thêm một quà vào đó (CỘNG THÊM, không phải đặt tổng). `acctLoad_` / `acctSave_` (kể cả khi `stale`) gắn `grants` vào phản hồi nếu có. Đã bỏ `adminSetSen` / `chayDoiSen`; chạy `chayTangSen()` (sửa tên + số sen trong hàm).
- `js/net/accountClient.js`: tham số `grant(list)`; `pull()` và `push()` giao quà SAU khi đã nhận/ghi bản lưu của máy chủ (cộng trước thì `applySave` xóa mất).
- `js/net/account.js` → `applyGrants`: mỗi `id` chỉ cộng 1 lần (danh sách `lgt.grantDone`, khóa `lgt.*` nên đi cùng bản lưu cùng với ví → luôn khớp). Game đang chạy cộng qua `LGT.addMerit` (ví trong bộ nhớ + localStorage + bảng xếp hạng cùng cập nhật); chưa chạy thì ghi thẳng `lgt.wallet`.
- `tests/grant.test.mjs`: test mới.

CẦN LÀM: dán lại `gas/Accounts.gs` vào Apps Script rồi Deploy → New version. Không cần thêm cột thủ công (hàm tự nới sheet nếu thiếu).

## Chưa kiểm
Sandbox AI không chạy được test Node và không gọi được script.google.com → chưa chạy thử thật. Chạy `npm test` trước khi tin.
