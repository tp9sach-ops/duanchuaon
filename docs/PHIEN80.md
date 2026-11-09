# PHIÊN 80 — Thùng công đức ở chánh điện (quét QR MoMo / số tài khoản sao chép / nhận hạt sen trong 24 giờ) — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Đọc: PROMPT.md → KE_HOACH_TONG.md → PHIEN79.md → file này.

## Bối cảnh
Gp gửi 2 ảnh QR (VietinBank 108002706141 và MoMo VietQR) và yêu cầu: làm **thùng công đức ở chánh điện** có **2 cách**: (1) bấm → quét mã QR, **ưu tiên MoMo**; (2) bấm → hiện số tài khoản để **sao chép** chuyển tiền. **Donate xong người chơi nhận hạt sen trong 24 giờ.** Rồi "làm tiếp các phần còn lại" — theo quy tắc dự án (PROMPT.md mục 3) vẫn làm TỪNG MỤC NHỎ MỘT; phiên này là mục "thùng công đức", các mục còn lại ghi ở "Việc kế".
Kiểm repo đầu phiên: `main` @ `10ed5f3` (Phiên 79), `npm test` 743/743. Chưa có mã donate nào trước đó (KE_HOACH_TONG 6.3 "MoMo — chờ ptg" và 7.3 "Mua công đức" còn trống).

## ĐÃ LÀM
- **Cảnh 3D:** `js/scene/thungcongduc.js` — hòm sơn son viền vàng, khe bỏ tiền, biển "CÔNG ĐỨC" (canvas), nụ sen vàng, bệ đá, quầng sáng thở nhẹ. Đặt trong `chanh.group` (`js/scene/index.js`), cập nhật trong vòng lặp cùng `chanh.update`.
- **Thế giới:** `js/world/donate.js` — `DONATE_BOX` {x -9.8, z -23.3} (bên trái lối giữa, sau hàng cột mặt tiền, ngoài thảm bồ đoàn), `DONATE_SPOT` (điểm bấm kiểu NPC: id `congduc`, đứng ở z -20.2 trên hiên, r 2.2), vật cản (addRect). `js/world/spots.js` thêm vào `ALL_SPOTS` (KHÔNG vào `SPOTS` nên không thành chương/nhãn nổi). `js/main.js` `onArrive`: `isDonateSpot(id)` → `LGT.onDonate()`.
- **Giao diện:** `js/ui/donate.js` + `css/donate.css` (gắn trong `hudMenu.js` qua `initDonate`). Bấm thùng (hoặc `LGT.onDonate()`) → bảng: nút **Quét mã QR** (tab MoMo mặc định, tab VietinBank, nút "Lưu ảnh QR về máy" cho người dùng điện thoại) và nút **Số tài khoản** (4 dòng có nút "Sao chép": ngân hàng, số TK, chủ TK, nội dung chuyển khoản `DGT`+6 ký tự riêng từng người). Dưới cùng: các nút số tiền nhanh + ô số tiền (gõ 50000 / 50k / 1tr) + lời hồi hướng + **"Tôi đã chuyển"** → gửi `donClaim`. Có danh sách "Công đức của bạn" (Chờ duyệt / Đã duyệt · +N hạt sen / Chưa khớp sao kê).
- **Ảnh QR:** `assets/qr-momo.jpg`, `assets/qr-vietinbank.jpg` (cắt từ 2 ảnh Gp gửi; đã kiểm bằng OpenCV vẫn quét ra). **Ảnh MoMo có avatar của Gp ở giữa mã** (do MoMo tự chèn) — muốn bỏ thì thay file cùng tên.
- **Logic thuần:** `js/engines/donate.js` — `DONATE_TARGET` (thông tin nhận tiền công khai), `DON` (hằng số), `formatVnd`, `senFor` (**1.000đ = 1 hạt sen**, tối thiểu 10.000đ, tối đa 50.000.000đ/lần, trần 50.000 sen/khoản), `parseAmount`, `donateCode`, `cleanNote`, `buildClaim`, `creditApproved` (mỗi khoản cộng đúng 1 lần), `donateError`.
- **Máy chủ (GAS):** `gas/Donations.gs` + `Code.gs` (SHEETS.Donations, route `donClaim` / `donCheck` / `donAck`, `setup()` gắn danh sách chọn cho cột trangThai). Luồng 3 bước để không mất công đức khi rớt mạng: `donCheck` trả khoản đã duyệt chưa nhận → game cộng sen + nhớ id (`lgt.donDone`) → `donAck` đánh dấu `daNhan=TRUE`.
- **Tự cộng hạt sen:** `refresh()` chạy khi mở bảng và 9 giây sau khi vào game (chỉ khi máy này từng báo chuyển tiền: `lgt.donMade`). `lgt.donDone`/`lgt.donMade` nằm trong khóa `lgt.*` nên theo tài khoản sang máy khác; `userKey` cũng thuộc khóa nhận dạng đồng bộ.
- **Test mới:** `tests/donate.test.mjs` (9), `tests/donateworld.test.mjs` (6), `tests/donategas.test.mjs` (4, chạy CHÍNH `Donations.gs` trong `vm` với Sheet giả). `package.json` đã thêm 3 file. `sw.js` = `dgt-v86`.
- Chụp ảnh kiểm bằng Chromium (WebGL phần mềm): thấy thùng ở chánh điện; bảng QR MoMo (desktop); bảng số tài khoản + form (điện thoại 412 px).

## GP PHẢI LÀM (bắt buộc để hạt sen thật chạy)
1. **Cập nhật GAS:** dán `gas/Donations.gs` làm file mới, thay `gas/Code.gs` bằng bản mới, chạy lại `setup()` MỘT lần (tạo sheet `Donations` + danh sách chọn), rồi **Deploy → Manage deployments → Edit → New version** (URL `/exec` giữ nguyên).
2. **Duyệt hằng ngày (cam kết 24 giờ):** mở sheet `Donations`; đối chiếu sao kê MoMo/VietinBank (so số tiền + nội dung `DGT…` hoặc giờ chuyển); đổi cột **trangThai** từ `cho` → `ok` (khớp) hoặc `tuchoi` (không khớp). Nếu tiền thực nhận khác số khai: ghi số thật vào **soTienXN**. Muốn tặng số hạt sen riêng: ghi vào cột **sen** (trống = tự tính 1.000đ = 1 hạt). Không cần làm gì thêm — game tự cộng khi người chơi vào.
3. **Duyệt tỉ lệ quy đổi** (1.000đ = 1 hạt sen là con số TẠM tôi đặt, Gp chưa chốt). Đổi ở HAI chỗ phải giống nhau: `js/engines/donate.js` (`DON.SEN_PER_1000`) và `gas/Donations.gs` (`DON_SEN_PER_1000`); `donateworld.test.mjs` canh hai chỗ lệch nhau.

## Giới hạn / lưu ý trung thực
- **Chưa thử với GAS thật** và chưa quét QR ngoài đời (môi trường AI không có). Logic GAS đã chạy trong `vm`; QR đã giải mã bằng OpenCV.
- **Chưa tự động đối soát ngân hàng**: việc duyệt là thủ công. Muốn tự động cần dịch vụ webhook (SePay/Casso) + tài khoản của Gp — chưa làm, hỏi Gp nếu muốn.
- QR MoMo là mã tĩnh (không kèm số tiền/nội dung) nên "nội dung chuyển khoản" chỉ ghi được khi chuyển qua số tài khoản VietinBank; với MoMo, Gp đối chiếu bằng số tiền + giờ. Mã MoMo không có số điện thoại để hiển thị (MoMo chỉ đưa mã ví dạng `PSP…`), nên cách 2 hiển thị số VietinBank.
- Người chơi có thể khai số tiền không đúng; hạt sen chỉ cộng sau khi Gp duyệt, nên không bị lợi dụng. Ví hạt sen vẫn ở máy người chơi (như mọi nguồn khác; máy chủ xác nhận làm ở bước cuối — PHIEN34).
- Không ghi số tài khoản/QR vào bộ nhớ AI (số tài khoản chỉ nằm trong mã nguồn công khai Gp yêu cầu hiển thị).

## Việc kế (làm TỪNG MỤC, chờ Gp nói "tiếp tục")
1. Xếp hạng ("Bảng vàng") — KE_HOACH_TONG 5.4 / 7.3; có thể đặt "Bảng tri ân" liệt kê người cúng dường (hỏi Gp có muốn công khai tên không).
2. Bơi–lặn (5.3).
3. Chỗ "ao riêng" (giả định Hồ Rừng, chờ Gp duyệt); Gp thử 2 điện thoại (yêu quái chung, ném người).
4. Hai file lạc `js/PROMPT.md`, `js/sw.js` (chưa xóa, đang chờ Gp trả lời).
