# PHIÊN 53 — TÀI KHOẢN NHÂN VẬT (tên + mật khẩu, đăng nhập mọi máy, lưu dữ liệu game lên GAS) — BÀN GIAO

> Ghi chú đánh số: phiên này làm song song với các Phiên 45–52 (câu cá, khinh công…); khi ghép vào `main` mình đánh số **53**, `docs/PHIEN45.md` là của phiên Câu cá. `sw.js` = `dgt-v58`. Câu hỏi "Firebase hay Google Sheet" ở `docs/PHIEN52.md` mục VIỆC KẾ đã có đáp án từ Gp: **GAS (Google Sheet)**.

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

**Người dùng (Gp / ptg):** nói tiếng Việt, không rành kỹ thuật → trả lời NGẮN, DỄ HIỂU. **Yêu cầu 07/11 (gửi 2 lần):** "khi vào bấm tên và mật khẩu đăng nhập đúng thì bất cứ máy nào cũng vào được đúng nhân vật của mình và lưu trữ dữ liệu game đã chơi; các nhân vật đã tạo trước thì khi vào sẽ yêu cầu nhập thêm mật khẩu; cảnh báo không cho tạo khi tên nhân vật và mật khẩu bị trùng trên hệ thống đã có rồi; nơi lưu tài khoản là GAS."
**Repo:** https://github.com/tp9sach-ops/loinhuan.github.io (`main`). Đọc theo thứ tự: `PROMPT.md` → `docs/PHIEN41.md` (luật đã chốt) → `docs/PHIEN44.md` → file này. `npm test` phải đạt **608/608** (572 cũ + 36 mới `tests/account.test.mjs`).

## ⚠ VIỆC GP PHẢI LÀM TRƯỚC KHI TÍNH NĂNG CHẠY THẬT (máy chủ GAS chưa được cập nhật!)
Mã web đã có, nhưng **GAS thật (`apiUrl` trong `js/config.js`) vẫn là bản cũ** nên chưa có tài khoản. Cách làm (không cần chạy `setup()` lại, sheet `Accounts` tự tạo ở lần gọi đầu):
1. Mở dự án Apps Script đang dùng cho chùa → **tạo file mới `Accounts.gs`**, dán nguyên nội dung `gas/Accounts.gs` trong repo.
2. Mở `Code.gs` trong Apps Script → thay bằng nội dung `gas/Code.gs` trong repo (thêm sheet `Accounts` vào `SHEETS` và 5 `case` mới trong `doPost`: `acctCreate`, `acctLogin`, `acctLoad`, `acctSave`, `acctLogout`). (Hoặc chỉ thêm đúng 2 phần đó vào bản đang chạy.)
3. **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy.** (URL `/exec` giữ nguyên, không phải sửa `config.js`.) Lần đầu có thể phải bấm "Authorize" lại.
4. Thử: mở web → màn vào cửa hiện "Tạo nhân vật" có ô mật khẩu. Tạo 1 nhân vật → trong Google Sheet dự án xuất hiện tab **Accounts** có 1 hàng.
**Nếu chưa làm bước 1–3 mà đã đẩy web:** người chơi KHÔNG bị khóa — máy chủ cũ trả `unknown_action`, giao diện báo "Máy chủ gặp lỗi" và hiện nút **"Chơi tạm (chưa lưu tài khoản)"** (đã có test).

## ĐÃ LÀM — thiết kế
**Một tài khoản = (tên nhân vật + mật khẩu).** Tên không phân biệt hoa/thường/khoảng trắng thừa; mật khẩu 6–64 ký tự, phân biệt hoa/thường. Cùng tên + cùng mật khẩu → "đã có trên hệ thống" (không tạo được). Cùng tên khác mật khẩu → là nhân vật khác (theo đúng yêu cầu: chỉ chặn khi CẢ HAI trùng).
**Bảo mật:** mật khẩu thật KHÔNG rời máy. Trình duyệt tính `key = PBKDF2-SHA256(mật khẩu, muối = "lgt-acct-v1|"+tên chuẩn hóa, 60.000 vòng)` rồi gửi `key`; GAS chỉ lưu `sha256("lgt-acct-v1|"+key)` (cột `accKey`). Token đăng nhập của từng máy cũng chỉ lưu dạng băm. Chống đoán mật khẩu: sai ≥ 15 lần/15 phút theo TÊN thì khóa (cả khi nhập đúng); báo trùng khi tạo cũng tính như một lần sai.
**Dữ liệu lưu:** MỌI khóa `localStorage` bắt đầu `lgt.` đều được đồng bộ (khóa mới của phiên sau tự đi theo), TRỪ cài đặt thiết bị: `lgt.acct, lgt.perf, lgt.sound, lgt.vol, lgt.vfx, lgt.mm, lgt.tut, lgt.khinhHint` (danh sách `DEVICE_KEYS` ở `js/engines/account.js` PHẢI GIỐNG `ACCT_DEVICE_KEYS` ở `gas/Accounts.gs` — có test so khớp). **Khóa `lgt.userKey` cũng đồng bộ** nên hồ sơ ngày sinh/điểm (lưu theo userKey trong GAS) đi theo nhân vật sang máy khác. Bản lưu ≤ 150.000 ký tự, chia 4 ô × 45.000 (giới hạn ô Google Sheet là 50.000).
**Chống mất dữ liệu khi 2 máy cùng chơi:** mỗi lần lưu tăng `rev`; máy gửi kèm `base` = rev nó biết; lệch → `stale`, KHÔNG ghi đè; giao diện hiện băng "Nhân vật vừa được lưu từ máy khác… giữ bản nào?" (Dùng bản từ máy kia / Giữ bản máy này). Gửi lại đúng lần lưu (mất phản hồi mạng) nhận ra qua `sid`, không báo stale oan.
**Tự động lưu:** mỗi 15 giây kiểm tra, có thay đổi + cách lần lưu trước ≥ 45 giây thì đẩy; **ẩn tab / rời trang thì lưu ngay** (`fetch keepalive`, gói < 60KB). Mở trang thì kéo bản mới nhất (nếu máy này không có thay đổi chưa lưu thì nhận luôn, có thì báo xung đột).
**Các màn ở cửa chùa (`MODE_UI` ở `js/engines/account.js`):** `new` (máy mới: tên + mật khẩu + nhập lại + màu/kiểu đầu), `claim` (**nhân vật đã tạo từ trước trên máy, chưa có mật khẩu → bắt đặt mật khẩu**, giữ nguyên dữ liệu đang có và đẩy lên tài khoản), `login` (tên + mật khẩu; đúng thì thay dữ liệu máy bằng dữ liệu tài khoản, tải lại trang và TỰ vào chùa), `back` (đã đăng nhập: "Chào mừng trở lại", có "Không phải bạn? Đăng xuất"), `offline` (chưa cấu hình `apiUrl` → như cũ). Đăng nhập trên máy đang có dữ liệu chơi chưa gắn tài khoản → hỏi xác nhận trước khi thay. Đăng xuất xóa dữ liệu game khỏi máy (giữ cài đặt thiết bị); còn thay đổi chưa lưu mà mất mạng → hỏi lại.
**Lỗi máy chủ KHÔNG khóa người chơi:** chỉ các mã `USER_ERRORS` (sai mật khẩu, trùng, bị khóa tạm, nhập sai…) chặn cửa; mọi mã khác (`network`, `timeout`, `http_5xx`, `unknown_action`…) → báo lỗi + nút "Chơi tạm".

## FILE (mới/sửa)
- MỚI `gas/Accounts.gs` (backend: sheet `Accounts` cột `aid|accKey|name|ngayTao|lanDangNhap|tokens|rev|sid|capNhat|d1..d4`); SỬA `gas/Code.gs` (SHEETS + 5 case).
- MỚI `js/engines/account.js` (logic thuần: luật tên/mật khẩu, PBKDF2, gói/mở bản lưu, chế độ màn vào cửa, thông báo lỗi). MỚI `js/net/accountClient.js` (tạo/đăng nhập/kéo/đẩy/đăng xuất + `createAutoSync`, mọi phụ thuộc truyền vào nên test Node được). MỚI `js/net/account.js` (nối thật: `initAccount()`; **KHÔNG được tự tạo `window.LGT`** — `scene/index.js` chỉ gắn hàm mặc định khi LGT chưa tồn tại; client gắn vào `LGT.account` SAU khi cảnh dựng xong qua `attach()`). MỚI `js/ui/accountGate.js` (DOM màn vào cửa + băng xung đột).
- SỬA `js/ui/hud.js` (màn vào cửa mới, `enterWorld`, bật tự lưu), `js/main.js` (`initAccount()` sớm; chờ `acct.ready` tối đa 4,5 giây TRƯỚC khi dựng cảnh để dữ liệu từ tài khoản xuống trước khi các phần của game đọc localStorage), `js/api.js` (`opts.keepalive`), `index.html` + MỚI `css/account.css` (nạp trước `responsive.css`; có luật đẩy "lời mời bật nhạc" `#sound-invite` lên đầu màn hình khi màn vào cửa mở trên điện thoại — nó từng đè lên nút gửi), `sw.js` (`dgt-v52`), `package.json` (thêm `tests/account.test.mjs`).
- MỚI `tests/account.test.mjs` (36 test: logic thuần; **chạy THẬT `gas/Code.gs`+`Storage.gs`+`Accounts.gs` trong `vm`** với Sheet/Cache/Lock giả — Sheet giả mô phỏng việc Google tự đổi chuỗi số thành số và giới hạn 50.000 ký tự/ô; kịch bản nhiều máy, xung đột, mất phản hồi, token, chống đoán mật khẩu). MỚI `tools/shot/e2e-account.cjs` + `e2e-account-mobile.cjs` (xem `tools/shot/README.md`).

## KIỂM TRA ĐÃ CHẠY (nói thật)
- `npm test` **631/631** (trên bản đã ghép với `main` tới Phiên 52; riêng `tests/account.test.mjs` = 36 test).
- Trình duyệt thật (Chromium + game thật + `Accounts.gs` trong vm thay GAS; chạy lại trên bản đã ghép với `main`): **16/16** kịch bản (máy mới → tạo; mật khẩu ngắn/không khớp bị chặn; tạo "Minh An" thành công; Sheet không chứa mật khẩu; tự lưu khi rời trang; **máy B đăng nhập sai bị từ chối, đúng thì vào thẳng chùa với đúng nhân vật + dữ liệu "sen 777"**; **máy C tạo trùng tên+mật khẩu bị chặn, không tạo hàng mới; cùng tên khác mật khẩu thì tạo được**; **máy D nhân vật cũ phải đặt mật khẩu, dữ liệu cũ giữ nguyên**) và **4/4** trên điện thoại 390×780 và 360×640 (thẻ gọn trong màn hình, chạm trúng nút gửi, mất mạng → báo lỗi + "Chơi tạm" vào được).
- Đã xem ảnh chụp giao diện desktop và điện thoại. 
- **CHƯA chạy với GAS thật** (sandbox AI không gọi được `script.google.com`): Gp cần làm 4 bước ở đầu file rồi thử tạo/đăng nhập thật 2 máy. Có thể có khác biệt nhỏ giữa Sheet thật và Sheet giả (quota, tốc độ). **Chưa đo kích thước bản lưu thật của một người chơi lâu năm** — nếu gần 150.000 ký tự thì app báo `too_big`; hãy đo `JSON.stringify(localStorage)` ở máy đã chơi nhiều.
- Màn 360×640: thẻ cuộn trong màn hình nhỏ; lời mời bật nhạc nằm đè nhẹ phần tiêu đề thẻ (vô hại).

## GIẢ ĐỊNH TÔI TỰ CHỌN (Gp chưa duyệt — dễ đổi ở 1 chỗ)
1. Mật khẩu ≥ 6 ký tự; **chưa có "quên mật khẩu"/"đổi mật khẩu"** (màn tạo có ghi "Hãy nhớ kỹ mật khẩu"). Quản trị chỉ có thể xóa hàng trong tab `Accounts` (người chơi phải tạo lại, mất dữ liệu).
2. Tối đa **8 máy** đăng nhập cùng lúc cho một nhân vật (máy cũ nhất bị đăng xuất khi có máy thứ 9).
3. Khóa tạm 15 phút sau 15 lần sai theo TÊN (kẻ xấu có thể cố tình khóa một tên; chấp nhận được ở quy mô này).
4. Đăng nhập thay TOÀN BỘ dữ liệu game trên máy bằng dữ liệu tài khoản (không trộn). Đăng xuất xóa dữ liệu game trên máy.
5. Vào chùa kiểu khách ("Chơi tạm") vẫn được khi máy chủ lỗi — người chơi có thể dùng tên bất kỳ ở chế độ này (như trước khi có tài khoản).

## VIỆC TIẾP (mỗi việc một lượt, chờ Gp nói "tiếp tục")
1. **Gp cập nhật GAS + thử 2 máy thật** (đầu file). Báo kết quả để sửa nếu có lệch.
2. Đổi mật khẩu (`acctChangePassword`: gửi key cũ + key mới, đổi `accKey`, thu hồi token máy khác) và/hoặc cách quản trị đặt lại.
3. Nối với đa người (`gas/Room.gs`): hiện tên trong phòng là tên người chơi tự gõ, chưa gắn với tài khoản — có thể cho người đã đăng nhập dùng tên khóa theo tài khoản để không ai mạo danh.
4. `saveScore` (hudMenu) vẫn gửi theo `userKey`: vì `userKey` giờ đi theo tài khoản nên bảng xếp hạng/hồ sơ đồng bộ đúng; kiểm lại bằng Sheet thật.
5. Đo dung lượng bản lưu người chơi lâu năm; nếu lớn thì nén (LZ/gzip bằng `CompressionStream`) trước khi chia ô.

## Quy tắc phiên sau
Đọc `PROMPT.md` + file này; kiểm mã thật; chạy `npm test`; làm TỪNG MỤC NHỎ, đẩy GitHub, báo ngắn, chờ "tiếp tục"; cuối phiên cập nhật `HANDOFF.md`, `PROMPT.md` mục 7 và gửi bàn giao.
