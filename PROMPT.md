# PROMPT RIÊNG CỦA DỰ ÁN — DIỆU GIANG TỰ

> File này là **prompt riêng của dự án**, nằm ngay trong repo. Mọi phiên làm việc đọc nó **ĐẦU TIÊN**, rồi mới đọc `HANDOFF.md` (trạng thái chi tiết).
> **Tự động ghi:** khi ptg đưa yêu cầu hoặc quy tắc mới, phiên làm việc tự thêm vào mục 7 của file này và đẩy lên GitHub, không cần ptg nhắc.
> **Khi các nguồn mâu thuẫn:** yêu cầu mới nhất của ptg > file này > `HANDOFF.md` > `docs/KE_HOACH.md`. Về trạng thái mã thì **mã thật trong repo luôn đúng hơn mọi tài liệu** (đã từng có file nằm trong repo mà HANDOFF không ghi).

## 1. Thông tin cố định

| Mục | Giá trị |
|---|---|
| Dự án | DIỆU GIANG TỰ — chùa Việt 3D; đang cải tạo thành "chùa online": nhập tên → thành nhân vật, đi bộ trong chùa, nhiều người cùng vào, chat |
| Repo | https://github.com/tp9sach-ops/duanchuaon (nhánh `main`) — ptg xác nhận 2026-11-10: đổi từ `loinhuan.github.io` sang repo này |
| Địa chỉ trang | https://tp9sach-ops.github.io/duanchuaon/ — suy từ tên repo (GitHub Pages), ptg chưa gửi lại địa chỉ thật |
| Chủ dự án | ptg = Phan Trường Giang (gọi là Giang). Nói tiếng Việt thường ngày, **không cần biết tên file hay kỹ thuật** |
| Front-end | Trang tĩnh `index.html` + ES modules, three.js ghim phiên bản, chạy trên GitHub Pages |
| Backend | Google Apps Script (Web App trả JSON) chỉ để lưu Sheet, cache, gọi AI. Khóa API chỉ ở Script Properties, **không bao giờ vào repo** |
| Kiểm tra | `npm test` (chỉ cần Node, không cài gói). Chạy thử: `python3 -m http.server 8080` |
| Quy ước mã | Chú thích tiếng Việt, tên hàm/biến tiếng Anh. Các quy ước khác: `HANDOFF.md` mục 8 ("Quy ước kỹ thuật phải giữ") |

## 2. PROMPT CHỦ (nguyên văn từ ptg)

```
Bạn là kỹ sư front-end WebGL + chuyên gia văn hóa tâm linh. Xây web "DIỆU GIANG TỰ" (chùa Việt, đêm trên núi)
deploy trên GitHub Pages, backend nhẹ bằng Google Apps Script (Web App, trả JSON).

KIẾN TRÚC
- Front-end tĩnh: index.html + ES modules (cây thư mục tôi đưa). three.js ghim phiên bản, font tự host
  (subset Vietnamese + latin-ext). Không dùng framework nặng.
- Mọi tính toán (lịch Âm, can chi, bói ngày, tử vi, bát tự, thần số, hoàng đạo, thiên văn) chạy ở client.
- GAS chỉ làm: lưu Sheet (Profiles, Readings, Incense, Prayers, Logs), cache, gọi AI vision. Khóa API chỉ ở Script Properties.
- Client gọi GAS bằng fetch POST Content-Type text/plain (tránh preflight). Mọi lệnh gọi có timeout, retry, trạng thái loading,
  và app vẫn chạy được khi API lỗi.
- Có service worker/PWA, PERF governor, prefers-reduced-motion, fallback không WebGL, ưu tiên mobile.
- Thêm workflow GitHub Actions: chạy test rồi deploy Pages.

PHONG CÁCH: tam quan, mái đầu đao, gác chuông, bồ đề, ao sen, trăng vàng, sao, sương; nền #06070d, vàng #d9b25f,
đỏ chu sa #c8322b (nhấn nhẹ), ngọc #4aa58a. Cơ chế camera rail + scroll như trang Kage.
NỘI DUNG: tham khảo/giải trí/văn hóa, văn phong gợi mở, không hù dọa; mỗi kết luận có "dấu vết suy luận";
ảnh tay/mặt xin đồng ý, phân tích xong xóa, không lưu.
CÁCH LÀM: mỗi giai đoạn đưa code đầy đủ từng file, đường dẫn file, lệnh chạy thử, test mẫu có đáp án. Chỉ trả lời "đã hiểu".
```

Dòng cuối "Chỉ trả lời 'đã hiểu'" chỉ áp dụng khi dán prompt chủ ở đầu một cuộc trò chuyện hoàn toàn mới. Khi đã vào làm việc thật thì theo mục 3 và mục 6.

**Cập nhật định hướng (Phiên 8, 2026-11-02) — ghi đè phần "camera rail + scroll" ở trên khi mâu thuẫn:**
- Cải tạo thành "chùa online" kiểu https://s1.niemphat.online/: nhập tên → thành nhân vật; nhiều người cùng vào, thấy nhau, chat; **đi bộ** trong chùa (không cuộn trang).
- Cảnh có hoa viên, sảnh, chánh điện. Mỗi chức năng của web (lịch/bói ngày, hồ sơ, thần số/hoàng đạo, Bát tự, Tử vi, hành tinh, Lá bùa, chỉ tay/nhân tướng, tường nguyện…) là **một chỗ để đi tới và bấm vào vật/nhân vật 3D** để ra kết quả.
- Thêm: ngồi thiền, gõ mõ, đếm chuỗi 108, công đức, thắp nhang.
- **Chùa Việt dựng riêng bằng code; file GLB để sau** (GLB Lukang Longshan là cả khu phố quét 3D, không đi bộ được; nếu dùng sau thì chỉ làm cảnh xa; giấy phép CC BY-NC-SA 4.0 cần ghi nguồn và không dùng thương mại).
- **Đa người chơi lưu bằng Google Apps Script** (GAS không realtime: đồng bộ bằng thăm dò 1–2 giây, nội suy vị trí cho đỡ giật).
- **Bám giao diện s1.niemphat.online (yêu cầu 2026-11-02, Phiên 12b):** ptg muốn "tham khảo lại trang đó để làm cho giống". AI **chưa xem được trang** (robots chặn) → danh sách việc cần ptg cung cấp và các điểm đã biết nằm ở **mục 9**; Phiên 13 làm giao diện theo mục 9. **Cập nhật Phiên 12c (2026-11-02): ptg đã gửi 10 ảnh chụp tham chiếu (lưu ở `docs/tham-chieu/`); mục 9 đã viết lại thành đặc tả chi tiết; Phiên 13 chia 13a/13b/13c.**

## 3. QUY TRÌNH PHIÊN LÀM VIỆC (bắt buộc)

### 3.1 Chia phiên
- Việc lớn chia thành **nhiều phiên; mỗi phiên làm một bước** vừa sức, xong trọn vẹn: chạy được, test đạt.
- Kế hoạch phiên ở mục 6. Phiên nào thấy quá lớn thì tách (ví dụ 12a/12b) và ghi lý do vào mục 7.
- Nếu không đủ chỗ hoặc thời gian để xong bước: **dừng ở điểm an toàn** (mã vẫn chạy, test đạt), đẩy lên GitHub, và **gửi bàn giao trước** (mục 3.4).

### 3.2 Đầu phiên (làm theo thứ tự)
1. Đọc `PROMPT.md` (file này), rồi `HANDOFF.md` (mục 2, 7, 8, 12).
2. Nếu có công cụ bộ nhớ: đọc ghi chú dự án (chỉ để tham khảo; nguồn chính là `HANDOFF.md`).
3. Kiểm repo thật (clone hoặc đọc qua công cụ GitHub), chạy `npm test`, so với `HANDOFF.md`. Mọi chỗ lệch ghi vào `HANDOFF.md` mục 12.
4. Nói với ptg 3–5 dòng: phiên này làm bước nào, "Xong khi" là gì (mục 6).

### 3.3 Trong phiên
- Điều tra trước khi sửa. Không bịa yêu cầu hay kiến trúc. Cần đoạn mã hoặc thông tin thì **hỏi ptg, không đoán**.
- Không nói "đã chạy / đã qua" nếu chưa chạy. Nói rõ phần nào môi trường không kiểm được (mạng, điện thoại thật, GAS thật).
- Phần logic phải có test (thêm hoặc cập nhật). Đổi giao diện thì chụp ảnh kiểm (`HANDOFF.md` mục 11).
- Yêu cầu hoặc quyết định mới của ptg → **ghi ngay vào mục 7 của file này** (tự động).
- **Khi ptg bảo "làm giống trang X" mà AI không xem được trang đó** (robots chặn, đăng nhập, không có mạng): nói thẳng là chưa xem được, **không đoán giao diện**, xin ảnh chụp màn hình/mô tả, và chỉ làm theo những gì ptg đã nói rõ (mục 2 "Cập nhật định hướng" và mục 9). Khi **đã có ảnh chụp từ ptg** thì ảnh là nguồn sự thật cho bố cục/cơ chế (`docs/tham-chieu/`); chi tiết ảnh không cho thấy thì ghi "chưa biết" và hỏi ptg, không đoán. Phiên 12b: `s1.niemphat.online` bị chặn robot (`web_fetch` trả ROBOTS_DISALLOWED).

### 3.4 Cuối phiên — BÀN GIAO BẮT BUỘC
Phiên chưa kết thúc cho tới khi đủ 5 việc:
1. Cập nhật `HANDOFF.md` theo mục 4, **đủ chi tiết để phiên sau, dù không biết gì, vẫn làm đúng và cụ thể**.
2. `npm test` đạt (ghi số test thật).
3. Đẩy lên GitHub (mục 3.5).
4. Ghi vào bộ nhớ (mục 3.6).
5. Đính kèm `HANDOFF.md` đã cập nhật trong câu trả lời cuối, kèm tóm tắt tối đa 10 dòng: đã xong gì, chưa xong gì, ptg cần làm gì, phiên sau làm gì.

Quy tắc ở mục 5 vẫn áp dụng: sau **mỗi** câu trả lời đính kèm `HANDOFF.md` cập nhật; thiếu chỗ thì gửi bàn giao trước.

### 3.5 Đẩy GitHub
- Đẩy **tất cả** file đã làm lên `main` của repo. **Trùng đường dẫn thì ghi đè**; file không đổi thì giữ nguyên (chỉ commit file khác).
- Không xóa file đã có, trừ khi ptg yêu cầu hoặc là file lạc/trùng đã ghi rõ trong `HANDOFF.md`.
- Trước khi đẩy: `npm test` đạt; quét bí mật (khóa API, token không được lọt vào repo).
- Thông điệp commit: `Phiên N (bước X): mô tả ngắn`. Ghi mã commit vào `HANDOFF.md`.
- Sau khi đẩy: đọc lại từ GitHub, đối chiếu nội dung với bản vừa viết.
- Nếu bị 403 hoặc không có quyền ghi: nói rõ, giao tệp/zip để ptg tải lên tay, ghi lý do vào `HANDOFF.md`.
- Workflow Pages chạy test rồi deploy. Nếu xem được Actions mà đỏ thì sửa trước khi kết thúc phiên.

### 3.6 Bộ nhớ
- Cuối mỗi phiên ghi vào bộ nhớ (nếu công cụ khả dụng): số phiên vừa xong, mã commit, việc tiếp theo, vài quyết định/quy ước chính, và trỏ tới `PROMPT.md` + `HANDOFF.md` trên GitHub.
- Một số môi trường chặn ghi bộ nhớ (ví dụ cuộc trò chuyện đã dùng kết nối GitHub). Khi bị chặn: **nói thẳng với ptg là chưa ghi được**, không giả vờ đã ghi. Lúc đó `HANDOFF.md` trên GitHub là bản bàn giao chính.
- Trong claude.ai chat (có công cụ bộ nhớ): ghi/cập nhật file `/areas/loinhuan-project.md` (số phiên vừa xong, mã commit, việc tiếp theo, trỏ tới `PROMPT.md` + `HANDOFF.md`). Phiên 9b đã tạo file này; các phiên sau **cập nhật** nó, không tạo file mới.
- Không ghi khóa API, mật khẩu, số thẻ, giấy tờ.

## 4. MẪU BÀN GIAO — thông tin PHẢI có và đặt ở đâu trong `HANDOFF.md`

| Thông tin | Đặt ở |
|---|---|
| Quy tắc bàn giao nguyên văn (mục 5 dưới đây) | Mục 0 |
| Bảng trạng thái từng hạng mục: xong / dở / chưa; số test thật; mã commit | Mục 2 |
| Phiên N: ngày, ptg yêu cầu gì (ngắn, sát nguyên văn), đã làm gì | Mục 7 (mới nhất ở trên cùng) |
| File thêm / sửa / xóa trong phiên: đường dẫn + 1 dòng mô tả | Mục 7 |
| Quyết định + lý do + quy ước mới (đánh dấu cái nào **cần ptg duyệt**) | Mục 7 và mục 8 |
| Chưa kiểm được / rủi ro / lỗi đã biết | Mục 7 |
| Việc ptg cần làm (nếu có) | Mục 8 |
| Phiên sau: tên bước, việc theo thứ tự, "Xong khi", file sẽ động tới, lệnh chạy thử | Mục 8 và `PROMPT.md` mục 6 |
| Trạng thái repo thực tế và các chỗ lệch tài liệu | Mục 12 |
| Prompt khởi động phiên sau | Mục 10 |

**Phép thử cuối:** một người chưa từng thấy dự án, chỉ có `PROMPT.md` + `HANDOFF.md`, có làm tiếp đúng và không phải hỏi lại những điều đã được quyết không? Nếu không, bàn giao chưa đủ.

## 5. QUY TẮC BÀN GIAO (nguyên văn — chép vào mọi bản bàn giao)

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Diễn giải thực hành: sau MỖI câu trả lời, đính kèm `HANDOFF.md` đã cập nhật; nếu không đủ chỗ làm hết thì gửi bàn giao TRƯỚC; luôn chép nguyên văn quy tắc này vào bản bàn giao mới.

## 6. KẾ HOẠCH PHIÊN (đề xuất — ptg có thể đổi; phiên nào xong thì đánh dấu và ghi vào mục 7)

Cải tạo thành chùa online đi bộ. Mỗi dòng là **một phiên**. Việc nào ptg phải làm song song nằm ở `HANDOFF.md` mục 8.

| Phiên | Bước | Làm gì | Xong khi |
|---|---|---|---|
| 8 (bước 1) | Nền | Bố cục + va chạm (`js/world/layout.js`), ảnh tượng Phật, 8 test bố cục | **ĐÃ XONG** (commit `0132cca`) |
| 9 (+9b) | Prompt | Viết `PROMPT.md`, bổ sung quy trình/bàn giao, rà repo thật, ghi mục 12 (Phiên 9 viết; Phiên 9b bổ sung nhưng **vẫn chưa đẩy được**, 403) | **ĐÃ XONG** — trạng thái đẩy lên GitHub: xem `HANDOFF.md` mục 7 (Phiên 9b) |
| 10 | 0 + 1 | Rà các file chưa ghi trong HANDOFF và chốt giữ/bỏ; làm `js/world/avatar.js` (+ `avatarLogic.js`) | **ĐÃ XONG** (Phiên 10; đã đẩy GitHub chưa: xem `HANDOFF.md` mục 12) |
| 11 | 2 | Hoa viên, đèn đá, ghế, Nhà Tổ, Nhà Khách + va chạm khớp `layout.js`; biển 'DIỆU GIANG TỰ' | **ĐÃ XONG** (Phiên 11; đẩy GitHub: xem `HANDOFF.md` mục 12) |
| 12a | 3 (một nửa) | `js/world/world.js` + `worldLogic.js`: camera góc nhìn thứ ba, bấm-để-đi / WASD / joystick cảm ứng, nhân vật trong cảnh thật | **ĐÃ XONG** (Phiên 12a) |
| 12b | 3 (nửa còn lại) | Hotspot có điểm đứng + bán kính (đi tới rồi mới mở); bấm vào vật 3D (tượng Phật, lư hương, chuông, Nhà Tổ...) mở **panel** chứa các `<section>` cũ; điểm sáng cũ bỏ hoặc đổi nghĩa | **ĐÃ XONG** (Phiên 12b): `js/world/spots.js` + `path.js`; 174 test; trình duyệt thật: cả 6 chương mở sau khi nhân vật tới nơi. **Chưa thử điện thoại thật** (xem `HANDOFF.md` mục 7) |
| 13a | 4a | **Vào cửa:** màn hình nhập tên + chọn dáng (6 màu áo; đầu trọc / tóc búi), ghi `localStorage` `lgt.name`, `lgt.color`; bỏ rail/cuộn trang; **bỏ chữ giới thiệu "Nơi tĩnh lặng..." và thanh menu cũ đè lên cảnh**; chip người chơi góc trái-trên (avatar nhỏ + tên + "Hạt sen · bậc N" + vòng cấp); dòng tên địa điểm + nút **Vào chánh điện / Ra sân ngắm cảnh** + "N đang online"; nút zoom +/− bên trái; giữ fallback `.no-webgl`; sửa `tests/smoke.mjs` (bỏ kiểm số CAM = số `data-cam`). Bám `PROMPT.md` mục 9 | **ĐÃ XONG** (Phiên 13a; đã đẩy GitHub chưa: xem `HANDOFF.md` mục 7). Chip + zoom + nút chánh điện + online làm đủ; **bỏ rail/cuộn trang không cần làm thêm** (đã không cuộn từ 12a); hàng chương dạng viên trên điện thoại GIỮ tạm tới 13b |
| 13b | 4b | **Khung HUD theo ảnh mẫu (mục 9.4):** thanh menu dưới 9 nút, lưới 6 nút hành động góc phải-dưới, cụm nút phải-trên (hạt sen, ngọc, thông báo, quà, thư, tim, chia sẻ, trợ giúp), toast gợi ý giữa-trên, panel "kính tối viền vàng"; di động: menu dọc bên phải. Nút chưa có tính năng thì **mờ + nhãn "sắp có"**, không giả vờ chạy. "Bản đồ chùa" = danh sách 6 điểm đến cũ (gọi `LGT.world.goTo`); 6 chương cũ (lịch/bói ngày, hồ sơ, Bát tự, Tử vi, hành tinh, Lá bùa...) vẫn mở qua hotspot | Mọi nút hiện đúng chỗ ở desktop + di động (có ảnh chụp); không nút nào chết im — **ĐÃ XONG** (Phiên 13b, 195 test; chưa chụp trên cảnh 3D thật, xem `HANDOFF.md` mục 7) |
| 13c | 4c | *(tùy chọn, **cần ptg duyệt** — mục 9.3)* Cảnh **ban ngày** như mẫu: trời xanh, sân gạch xám, cây low-poly; giữ chế độ đêm làm lựa chọn. Chỉ làm nếu ptg đồng ý | ptg xem ảnh và duyệt — **ĐÃ LÀM SỚM** trong Phiên 13c-sớm (cảnh ban ngày mặc định, `?dem=1` về đêm); ptg vẫn nên xem và duyệt |
| 14a | 5a | **Chánh điện kiểu mẫu (mục 9.5a):** lưới bồ đoàn tròn trên thảm đỏ viền vàng; nhân vật bấm đệm để ngồi / "Đứng dậy"; Lạy Phật (chắp tay → lạy → đứng); Thiền (ngồi + hào quang); hai bảng hai bên tượng ("Bảng vàng", "Mua công đức" — chỉ khung, nội dung phiên sau); nút Vào chánh điện/Ra sân đã nối thật | Ngồi, lạy, đứng, thiền chạy trên desktop + di động; test logic đạt — **ĐÃ XONG mã** (Phiên 14a, 209 test; chưa xem trên cảnh 3D thật; hai bảng bên tượng chưa làm) |
| 14b | 5b | **Tràng hạt + Tụng kinh (mục 9.5b–c):** màn chuỗi 108 hạt 3D, đếm "N / 108", nút quay lại; tụng kinh chọn 5 bài (Niệm Phật, Bát Nhã Tâm Kinh, Chú Vãng Sanh, Chú Đại Bi, Kệ Hồi Hướng), lời kinh 3 dòng chạy (dòng hiện tại sáng), mõ gõ nhịp (Web Audio); **lời kinh phải là văn bản công cộng, ptg duyệt** | Hai hoạt động chạy, đếm đúng, cộng công đức; test logic đạt — **ĐÃ XONG mã** (Phiên 14b, 217 test; lời kinh và công đức là giá trị tạm, cần ptg duyệt; chưa xem trên cảnh 3D thật) |
| 14c | 5c | **Đèn nguyện + Dâng lễ (mục 9.6):** panel Đèn nguyện (tab Chùa này / Tất cả chùa / Hoạt động; lời nguyện + tên + thời gian + số ngọn; nút "Thả đèn nguyện"), thắp nhang 1/3/9 + dâng lễ; hoa sen vàng phát sáng trong sân để nhận lộc; toast gợi ý; hạt sen tăng khi làm hoạt động (`window.LGT.addMerit`, nối `js/ui/temple.js`). Lưu cục bộ trước | Thả đèn, thắp nhang, nhặt hoa sen chạy; test đạt — **ĐÃ XONG mã** (Phiên 14c, 229 test; hoa sen vàng chưa xem trên cảnh 3D thật) |
| 15a | 6a | **Đa người, lõi:** `gas/Room.gs` + `case 'sync'` trong `gas/Code.gs` (CacheService + LockService, hết hạn ~12 giây, kiểm tra chuỗi), `js/net/room.js` (thăm dò 1,5–2 giây, nội suy vị trí/tư thế/hoạt động), BroadcastChannel khi chạy cục bộ; giới hạn ~30 người hiển thị | Hai tab thấy nhau đi và ngồi; test Node bằng `vm` với dịch vụ giả đạt; **chưa thử GAS thật** thì ghi rõ |
| 15b | 6b | **Đa người, xã hội (mục 9.7):** chat + bong bóng trên đầu, "N đang online" thật, nhiều "chùa" (phòng) và chọn chùa, NPC Trụ trì ("chạm để thưa chuyện"), đèn nguyện chung qua GAS (có lọc như `Prayers.gs`) | Hai tab chat được; đổi chùa được; test đạt |
| 16 | 7 | **Tiến trình (mục 9.8) — phạm vi do ptg chốt trước:** hạt sen/bậc/cấp, nhiệm vụ ngày, túi đồ, xếp hạng ("Bảng vàng"), thiền phái. Làm mức đơn giản, lưu Sheet qua GAS; không làm cửa hàng tiền thật | ptg duyệt phạm vi; phần làm xong chạy + test đạt |
| 17 | 8 | Hoàn thiện: tăng `VERSION` trong `sw.js`, ảnh chụp desktop/mobile, cập nhật `README.md` + mục 2/8, dọn file thừa; tùy chọn: GLB cảnh xa nếu ptg gửi file | `npm test` đạt; Pages deploy xanh; bàn giao đầy đủ |

Việc ptg làm song song (không chặn các phiên trên): bật Pages (Settings → Pages → Source: GitHub Actions); triển khai GAS và dán URL `/exec` vào `js/config.js`; đối chiếu các bảng `canDoiChieu` (`HANDOFF.md` mục 8, B0–B2).

## 7. NHẬT KÝ YÊU CẦU & QUYẾT ĐỊNH CỦA PTG (tự động ghi — chỉ thêm, mới nhất ở dưới)

- **2026-10-31:** tên chùa là **Diệu Giang Tự**; cảnh phải sáng, đồ họa đẹp; đổi hết chữ sang tiếng Việt; làm tiếp các giai đoạn; sửa xong thì đưa lên GitHub, file trùng tên thì ghi đè, file không đổi giữ nguyên.
- **2026-11-02 (Phiên 8):** cải tạo thành chùa online kiểu niemphat.online (xem mục 2, phần "Cập nhật định hướng"); chùa Việt dựng bằng code, GLB để sau; đa người bằng Google Apps Script.
- **2026-11-02 (Phiên 9):** ptg yêu cầu: (a) xem repo rồi xem prompt và bổ sung vào prompt; (b) chia nhiều phiên làm từng bước phù hợp; (c) sau mỗi phiên bắt buộc gửi bàn giao chi tiết cho phiên sau **và ghi vào bộ nhớ**, để phiên sau dù không biết gì vẫn làm đúng, cụ thể, không mất thời gian; (d) làm xong thì đưa tất cả lên repo, trùng tên thì ghi đè; (e) tất cả tự động ghi vào prompt riêng của dự án. → Đã đưa vào mục 3–6 của file này.
- **2026-11-02 (Phiên 9b):** ptg gửi lại đúng yêu cầu của Phiên 9 (xem repo, xem prompt, bổ sung vào prompt; chia nhiều phiên làm từng bước; sau mỗi phiên bắt buộc bàn giao chi tiết và ghi bộ nhớ; xong thì đẩy tất cả lên repo, trùng tên ghi đè; tất cả tự ghi vào prompt riêng của dự án) kèm `PROMPT.md`, `HANDOFF.md`, `cap-nhat-phien9.zip`. Nhận định: nội dung yêu cầu đã nằm đủ trong mục 3–6 từ Phiên 9, nên Phiên 9b chỉ (a) kiểm repo thật (`main` @ `0132cca`, chưa có `PROMPT.md`), (b) bổ sung nhỏ vào prompt (mục 3.6 và mục 6, mục 7), (c) thử đưa 4 file lên GitHub (**403, chưa đẩy được**, giao zip để ptg tải lên tay), (d) ghi bộ nhớ (đã ghi). **Chưa làm mã giao diện**; bước kế vẫn là **Phiên 10** (bước 0 + 1) theo bảng mục 6; không đánh số lại.

- **2026-11-02 (Phiên 10):** ptg nói "tiếp tục" → làm bước 0 + 1 theo mục 6. Không có yêu cầu mới.

- **2026-11-02 (Phiên 11):** ptg nói "tiếp tục" → làm bước 2 theo mục 6. Không có yêu cầu mới.

- **2026-11-02 (Phiên 12a):** ptg nói "tiếp tục". Tách Phiên 12 thành 12a (đi lại + nhân vật) và 12b (hotspot + panel) vì bước này quá lớn; 12a xong trọn vẹn, chạy được trên trang thật.

- **2026-11-02 (Phiên 12b):** ptg gửi lại đúng yêu cầu quy trình như Phiên 9 (xem repo `tp9sach-ops/loinhuan.github.io`, xem prompt rồi **thêm vào prompt**; chia nhiều phiên làm từng bước; sau mỗi phiên **bắt buộc** gửi bàn giao chi tiết **và ghi bộ nhớ** để phiên sau dù không biết gì vẫn làm được cụ thể, chi tiết; xong thì đẩy TẤT CẢ lên repo, trùng tên ghi đè; tất cả tự ghi vào prompt riêng của dự án) kèm `PROMPT.md`, `HANDOFF.md`, `cap-nhat-phien12a.zip` và ảnh `di-bo-phien12a.png` (ảnh chụp trang hiện tại: nhân vật 'Khách' đứng ở Tam quan, chữ giới thiệu và menu cũ vẫn đè lên cảnh). **Yêu cầu MỚI:** "hãy tham khảo lại trang https://s1.niemphat.online/ để làm cho giống". → Đã ghi vào mục 2 và mục 9 (AI chưa xem được trang mẫu, xem 3.3). Các yêu cầu quy trình đã nằm đủ trong mục 3–6 từ Phiên 9 nên chỉ bổ sung điểm mới (3.3, mục 9). Phiên làm: **12b** (đi tới chương rồi mới mở bảng, tìm đường) theo mục 6. Repo `main` lúc kiểm vẫn `0132cca`.

- **2026-11-02 (Phiên 12c — chỉ prompt/bàn giao, KHÔNG đổi mã):** ptg gửi lại đúng yêu cầu quy trình (xem repo `tp9sach-ops/loinhuan.github.io`, xem prompt rồi **thêm vào prompt**; chia nhiều phiên làm từng bước; sau mỗi phiên **bắt buộc** bàn giao chi tiết **và ghi bộ nhớ** để phiên sau dù không biết gì vẫn làm được cụ thể, chi tiết) kèm `PROMPT.md`, `HANDOFF.md`, `cap-nhat-phien12b.zip` và **10 ảnh chụp**; **yêu cầu MỚI:** "hãy tham khảo dự án chùa online đang hot gần đây (người Hàn làm) để làm cho giống". → (a) 10 ảnh lưu vào `docs/tham-chieu/` (có README mô tả từng ảnh); (b) **mục 9 viết lại hoàn toàn** thành đặc tả giao diện/cơ chế từ ảnh; (c) **mục 6 chia lại Phiên 13–17** (13a/13b/13c, 14a/14b/14c, 15a/15b, 16, 17) bám đặc tả; (d) HANDOFF cập nhật. Các yêu cầu quy trình đã nằm đủ trong mục 3–6 nên không thêm quy tắc mới. **Repo thật lúc kiểm (đọc trang GitHub):** thư mục gốc vẫn **không có `PROMPT.md`** (có `HANDOFF.md`, `README.md`, `index.html`, `manifest.webmanifest`, `package.json`, `robots.txt`, `sitemap.xml`, `sw.js`, thư mục `.github/workflows`, `assets`, `css`, `docs`, `gas`, `js`, `tests`); trang hiện "62 Commits" (mã commit mới nhất **không đọc được**: GitHub chặn truy cập tự động vào trang commits và cây thư mục `js`). Nghĩa là Phiên 9–12b **rất có thể vẫn chưa lên repo** (chưa xác nhận được `js/world/`). Phiên sau phải `git clone` + `npm test` để biết chắc.

- **2026-11-02 (Phiên 13a):** ptg nói "tiếp tục và tham khảo dự án chùa online đang hot (người Hàn làm) để làm cho giống, hình ảnh tham khảo trong github". Đã xem 10 ảnh trong `docs/thamchieu/` (ref-04, ref-05 đối chiếu bố cục) và bám `PROMPT.md` mục 9.2–9.4. Lưu ý: ptg đã tự tải mã Phiên 9–12b lên repo; repo là **bản chuẩn** (có `js/world/path.js`, 174 test), bản làm song song trong chat trước bị bỏ.

- **2026-11-03 (Phiên O1):** ptg đưa repo `hoangminhon/olongvien` và nói "custom từ game này để hoàn thiện dự án". Đã đánh giá, lập mục 10, làm O1 (Kinh Dịch + xăm thơ). Cũng trong chat này: nhân vật chibi v2 + cảnh ban ngày (xem HANDOFF mục 7, Phiên 13c-sớm).

- **2026-11-03 (Phiên 13b):** ptg nói "hãy tiếp tục và up lên github giúp tôi, nếu trùng thì ghi đè" kèm PROMPT/HANDOFF/zip 13c-O1. Không có yêu cầu mới ngoài quy trình. Đã đẩy được lên GitHub (commit `4633a55` rồi 13b); làm khung HUD (mục 9.4).

- **2026-11-03 (Phiên 14a):** ptg nói "tiếp tục". Không có yêu cầu mới. Làm bước 14a (bồ đoàn, ngồi, lạy, thiền) + O3.

- **2026-11-04 (Phiên 14c):** ptg nói "đọc lại trang github xem file bàn giao và tiếp tục" kèm HANDOFF + zip 14b (ptg đã tự tải 14b lên repo). Không có yêu cầu mới. Làm bước 14c (Đèn nguyện, Dâng lễ, hoa sen vàng).
- **2026-11-04 (Phiên 14d):** ptg gửi 2 ảnh áo polo 9 Sạch (thân vàng, tay + cổ xanh lá, logo ngực trái và logo lớn ở lưng) và yêu cầu: tiếp tục, thiết kế nhân vật mặc chiếc áo này, và CHỈ gửi các file cần thay/thêm để tải lên GitHub. Đã làm kiểu "Đồng phục 9 Sạch" (màu áo `9sach`); chi tiết ở `HANDOFF.md` mục 7. **Quy tắc giao file (mới, ghi nhận):** cuối mỗi phiên chỉ giao các file đã đổi/thêm (đúng đường dẫn, trùng tên ghi đè), không giao cả dự án.
- **2026-11-04 (Phiên 14f):** ptg gửi 9 file GLB cây + `landscape.js`/`layout.js`/test và nói "đọc PROMPT.md rồi HANDOFF.md, rồi tiếp tục các bước còn lại" (Bước 1 test landscape, 2 cảnh 3D landscape nối `index.js`, 3 GLB cây, 4 NPC, 5 sàn gỗ + `buddha.webp` + đế sen). Đã xong Bước 3 (cây GLB đã tối ưu, `js/scene/glbprops.js`); Bước 4–5 chưa. Quy ước mới: GLB đưa vào dự án phải qua `tools/optimize-glb.mjs` (nhẹ, cao 1 đơn vị, gốc ở đáy) và phải ghi nguồn/giấy phép ở `THIRD_PARTY.md`.

- **2026-11-05 (Phiên 18):** ptg nhắc các việc "chưa làm" (tự giảm cảnh khi máy yếu; nhiều phòng và chọn chùa; túi đồ, cửa hàng, xếp hạng; mô hình con trâu của Bé Tí), nói "tiếp tục", bảo xem lại repo vì **đã đổi cách lưu trữ trên Firebase và phân tích**, làm nốt cho hoàn thiện và chính xác, **đẩy lên GitHub (trùng tên ghi đè)**. **QUY TẮC MỚI (tự ghi): làm TỪNG MỤC NHỎ MỘT → đẩy lên GitHub → báo ptg → CHỜ ptg đồng ý rồi mới làm mục kế.** Mục 1 (PERF) đã làm; GitHub 403 nên giao zip. Chi tiết: `HANDOFF.md` mục 7.
- **2026-11-05 (Phiên 19):** ptg yêu cầu chèn Cửa hàng 9 Sạch giống ảnh khai trương, địa chỉ 124 Mậu Thân, ghi "Chi nhánh Cần Thơ", không để ngày. Đã làm (xem HANDOFF mục 7).

- **2026-11-06 — MASTER PROMPT "Nâng cấp Diệu Giang Tự thành game thế giới mở 3D"** (ptg gửi file đính kèm, 22 mục; bản đầy đủ nằm trong lịch sử trò chuyện, tóm tắt): vai đội ngũ game; không phá tính năng cũ; âm thanh/nhạc nền tự thử phát khi tải trang, mặc định bật, có lời mời khi bị chặn, thanh âm lượng nhạc và hiệu ứng, ghi nhớ; bốn mùa + ngày đêm + đom đóm + đèn nhà; mưa 3 cấp + sấm; mở rộng bản đồ (nhà trong rừng, vách đá Đại Phật + thác, hồ cá); **ba cửa hàng thương hiệu riêng biệt, không đặt cạnh nhau: Thế Giới Di Động, Điện Máy Xanh, PNJ**; cốt truyện (chú tiểu, trụ trì, cây bồ đề, 8 dấu ấn), nhiệm vụ tưới cây + thiền 3 phút, 8 bậc khinh công, parkour, phóng sinh/bơi/lặn, cửa hàng thời trang, xe, cấp độ/danh hiệu, MoMo (chỉ khi có tài khoản thương mại, không giả giao dịch), Lá Bồ Đề; chia 10 phiên (1 thế giới, 2 bản đồ, 3 cốt truyện, 4 kỹ năng, 5 bơi, 6 cấp độ, 7 thời trang, 8 xe, 9 thanh toán, 10 hoàn thiện); mỗi phiên cập nhật PROMPT/HANDOFF, `npm test`, đẩy GitHub, đọc lại để xác minh. **Chỉ dẫn kèm theo:** lấy ý tưởng phù hợp dự án hiện tại, thêm cốt truyện, nhiệm vụ, chiều sâu; **làm bước nhạc khi tải trang trước, rồi CHỜ ptg báo "tiếp tục" mới làm cửa hàng TGDD.** Mâu thuẫn với bản cũ: master prompt nói "đúng 8 cảnh giới khinh công" còn hệ nhiệm vụ/cấp 10 bậc của Phiên 17 vẫn giữ song song; "Nhà 3D trong kho lưu trữ" hiểu là nhà trong rừng.
- 2026-11-06 (Phiên 23): ptg bảo xem lại repo kỹ rồi làm tiếp. Làm Bước 1 của Phiên 1 master prompt = chu kỳ ngày đêm (`js/world/daycycle.js`; `?gio=`; mặc định 9h, 24 phút/ngày). Chờ ptg báo "tiếp tục" mới làm mục nhỏ kế (bốn mùa → mưa → đèn lồng/đồng hồ → đom đóm). Bàn giao ở HANDOFF mục 7.
- 2026-11-06 (Phiên 24): ptg báo "tiếp tục" → làm bốn mùa (`js/world/season.js`, `?mua=`, mặc định theo tháng thật). Mục kế (chờ "tiếp tục"): mưa + sấm + thời tiết ngẫu nhiên. Bàn giao ở HANDOFF mục 7.
- 2026-11-06 (Phiên 25): ptg bảo xem lại repo kỹ, phân tích, hiểu rõ rồi "làm tiếp tục" (kèm lại master prompt) → làm MƯA + SẤM CHỚP + THỜI TIẾT NGẪU NHIÊN (`js/world/weather.js`, `?troi=0..3`). Mục kế (chờ "tiếp tục"): NPC dù/áo mưa + trú mưa, rồi đèn lồng + đồng hồ HUD, đom đóm/trẻ cầm lồng đèn. Bàn giao ở HANDOFF mục 7.


- **Phiên 26–31 (ghi ở Phiên 31):** (gộp ở Phiên 31 — chi tiết trong docs/HANDOFF-PHIEN-26/27/28.md, docs/PHIEN29.md, PHIEN30.md, PHIEN31.md)
  - **26:** giờ game dùng chung (24 phút thật = 24 giờ game) + cầu nối Firebase↔Apps Script (js/net/bridge.js). **27:** thời tiết dùng chung. **28:** NPC che dù/tìm chỗ trú mưa (js/world/shelter.js), sửa bóng răng cưa. **29:** va chạm theo thân người (bodyBlocked). **30:** đèn lồng + biển cửa hàng sáng theo giờ, chip đồng hồ HUD.
- **31:** đom đóm tự nhiên theo 6 vùng (js/world/fireflies.js); trẻ cầm lồng đèn d7–d9 (js/world/lantern.js, scene/npc.js); âm thanh theo mùa/môi trường + tiếng ve mùa hạ (js/ui/soundLogic.js SEASON_MIX, ui.js); responsive mọi điện thoại gồm Z Fold, iPhone, thanh công cụ dưới của Safari/Chrome (js/ui/viewportLogic.js, viewport.js, css/responsive.css, nạp SAU CÙNG); camera không xuyên tường (worldLogic.clipCamDist + layout.solidAt); thêm tests/clocklabel.test.mjs (trước đó package.json gọi mà file thiếu).
- Test: `npm test` 452/452 (Node 22) cuối Phiên 31. Service worker VERSION dgt-v27. GitHub tích hợp chỉ ĐỌC: ptg tải file lên tay.
- Chưa kiểm bằng mắt/thiết bị thật: toàn bộ giao diện Phiên 31 (responsive, lồng đèn, đom đóm, tiếng ve, camera). Xem docs/PHIEN31.md.
- **32 (bước 1/4 của Phiên 3 master prompt):** logic cốt truyện chương 1 (js/world/story.js: meet→abbot→water1→meditate→water2→done, hội thoại, hồi chiêu tưới, giờ thiền 180 giây, mở Khinh thân bậc 1) + NPC Chú tiểu Minh ở cổng chùa (js/world/npc.js, id `chutieu`) + tests/story.test.mjs (10 test). **Bước 2 XONG** (js/ui/story.js: hộp thoại nhiều trang + thẻ mục tiêu, đã kiểm Chromium desktop+điện thoại; sw dgt-v29); **CHƯA làm** bình tưới, nút tưới, bộ đếm thiền, cây lớn lên (Bước 3–4) — xem docs/PHIEN32.md để làm Bước 2–4. Test thực tế: `npm test` 447/447 (trước phiên: 437/437; số 452 ghi ở Phiên 31 là sai lệch). sw.js dgt-v28.

- 2026-11-07 (Phiên 34): ptg báo nhiệm vụ tưới cây bồ đề không có trong bảng và không dẫn đường → đã sửa. ptg yêu cầu hệ thống xây nhà: 100 công đức → lá bồ đề → mua đất → nhà thô sơ → 4 loại nhà (nhà lầu, hoa viên, hồ bơi/villa) → mua nội thất thật nhiều. GHI KẾ HOẠCH, chưa làm: `docs/PHIEN34.md`.
- 2026-11-07 (ptg chốt luật xây nhà): hạt sen = công đức, **10 hạt sen = 1 lá bồ đề**; **100 lá = 1 lô đất, tặng nhà trống**; giá nhà khác do AI đề xuất (cần cày); cho khách tham quan + mở tiệc; **tối đa 10 nhà/xóm**, nhà thứ 11 sang xóm mới; muốn xem xóm khác phải gặp **NPC bác khu phố** đổi xóm. Chi tiết + bảng giá tạm: `docs/PHIEN34.md`.
- 2026-11-07 (Phiên 38, kiểm tra tổng + kế hoạch — KHÔNG đổi mã): ptg bảo kiểm lại toàn bộ GitHub xem có lỗi gì và lên kế hoạch xử lý mọi việc còn lại. Kết quả: `npm test` 516/516 trên Node 22, nhưng **CI sẽ đỏ trên Node 20** (package.json gọi `tests/viewport.test.mjs` chưa từng tồn tại); `pages.yml` không chép `sw.js`/`manifest`/`robots`/`sitemap` vào bản phát hành; `js/ui/ui.js` là bản mới của `js/ui.js` bị tải nhầm chỗ (trong nhà vẫn có tiếng mưa); vị trí trong nhà (400,400) bị gửi lên mạng vượt giới hạn ±200. Docs 2b/2c đã được sửa cho đúng thực tế (đã có trong repo, sw `dgt-v44`). Kế hoạch A1→A2→A3→B1→B2(3d-2d)→C→D→E→F và câu hỏi cho ptg: `docs/PHIEN38.md` mục 2–4. **Quy tắc giữ nguyên: làm từng mục nhỏ, xong báo, chờ "tiếp tục".**
- 2026-11-07 (Phiên 39): ptg yêu cầu (1) bản đồ mini hiển thị mọi vị trí + NPC, (2) cập nhật nhiệm vụ/dẫn đường/hướng dẫn để người chơi nắm cách chơi, mua, đổi lá, xây dựng, phóng sinh; làm xong đẩy GitHub. Đã làm bản đồ mini + lớn (phím M), sổ tay “?”, gợi ý việc kế tiếp, 3 nhiệm vụ mới, vá CI (L1 `tests/viewport.test.mjs`, L2 `pages.yml`). **Phóng sinh chưa có tính năng** (sổ tay ghi “sắp có”; cần ptg chốt luật). Chi tiết: `docs/PHIEN39.md`.

- **2026-11-07 (Phiên 53):** Gp yêu cầu (gửi 2 lần): đăng nhập bằng **tên + mật khẩu** để mọi máy vào đúng nhân vật và giữ dữ liệu game đã chơi; **nhân vật tạo từ trước phải nhập thêm mật khẩu khi vào**; **cảnh báo, không cho tạo khi tên + mật khẩu đã trùng trên hệ thống**; nơi lưu tài khoản là **GAS**. → Đã làm (mã + 631 test + 16 kịch bản trình duyệt + 4 điện thoại). **Gp cần dán `gas/Accounts.gs` + `gas/Code.gs` vào Apps Script rồi Deploy bản mới** (xem `docs/PHIEN53.md`). Chưa có đổi/quên mật khẩu.

- **2026-11-08 (Phiên 54):** ptg báo lỗi đăng nhập: màn "Đặt mật khẩu cho nhân vật" hiện "Chưa kết nối được máy chủ" (chụp trên baocaonoibo.io.vn). Đã phân loại lỗi trong `js/api.js` (network/blocked/bad_response), hiện mã lỗi trên màn vào cửa, kéo dài chờ lệnh tài khoản 30s; nguyên nhân gốc nhiều khả năng là Apps Script chưa cập nhật/Authorize (xem `docs/PHIEN54.md`). Quy tắc: làm từng mục một, cuối phiên gửi prompt bàn giao.

- **2026-11-08 (Phiên 55–67, ghi bù ở Phiên 68 — chi tiết trong `docs/PHIEN55.md` … `PHIEN67.md`):** 55 đường dự phòng đăng nhập (form + khung) · 56–57 câu cá, Cầu Gỗ 50 hạt sen, tab Lộ trình · 58 dọn repo · 59 Đại Phật khắc vách đá · 60 nhiệm vụ 7 chương · 61 rừng thông dày · **62** Gp yêu cầu: giao diện điện thoại dễ thao tác, kỹ năng/thả cầu/thu cầu/thu phục cá là nút góc phải-dưới, nhiệm vụ/kỹ năng mới phải chỉ đúng chỗ bấm, túi đồ xem được khi ở ngoài nhà, người chưa rành vẫn chơi được → làm cụm nút + bong bóng chỉ chỗ · **63** sức mạnh (công đức + luyện thân) → khiêng/ném vật nặng, ném được cả người chơi · **65** Gp chốt: không ném người trong chùa, hồi chiêu 10 giây mỗi cặp, người bị ném rơi an toàn không mất gì, ném người khác −1 công đức; yêu quái hằng tháng gồng chiêu rồi đánh diện rộng, nhiều người đánh chung, rơi lá bồ đề ai nhanh tay nhặt, kỹ năng chiến đấu = ném đá + thương, hết máu hồi sinh ở cửa chùa, thu phục thưởng lá bồ đề + điểm cấp + sức mạnh · 66 sổ tay `?` cập nhật · **67** Gp: "3h là trung, 20h là cao … các nút tự thiết kế cho khỏi vướng" → 2 khung giờ yêu quái + nút chiến đấu gọn. Phần **chơi chung qua mạng** (máu yêu quái chung, nhặt lá tranh nhau, ném người) CHƯA làm.
- **2026-11-08 (Phiên 68):** Gp bảo xem lại repo, đọc kỹ, hiểu phần còn thiếu, làm tiếp và đẩy GitHub. Kiểm: `main` @ `f6012ed`, 705/705. Làm 1 mục nhỏ: nút "Dẫn đường" nhấp nháy cho việc mới + cho người mới (`js/world/goPulse.js`, `docs/PHIEN68.md`). Môi trường AI không có quyền đẩy GitHub → giao file để Gp tải lên tay. **Quy tắc giữ nguyên:** làm từng mục nhỏ, xong báo, chờ "tiếp tục"; cuối mỗi phiên gửi prompt bàn giao chi tiết cho phiên sau không có ngữ cảnh.

- **2026-11-08 (Phiên 69):** Gp bảo xem lại repo, đọc kỹ, hiểu phần còn thiếu, làm tiếp. Kiểm repo thật: `main` @ `3ed3ba0` (Gp đã tải đủ 10 file Phiên 68), 709/709. Làm 1 mục nhỏ: chữ nhãn dưới các nút tròn góc phải-trên (`captionOf` trong `js/ui/menuLogic.js`, `.hm-ic-tx` trong `css/hudmenu.css`; điện thoại nhấn giữ nút để báo tên), `docs/PHIEN69.md`. **Quy tắc giữ nguyên:** làm từng mục nhỏ, xong báo, chờ "tiếp tục"; cuối mỗi phiên cập nhật mục này + `docs/PHIENxx.md` và gửi prompt bàn giao chi tiết.

- **2026-11-09 (Phiên 70):** Gp nói "tiếp tục". Làm 1 mục nhỏ: màn hướng dẫn lần đầu 3 bước có mũi tên (`js/world/coach.js` logic + `tests/coach.test.mjs`, `js/ui/coach.js`, `css/coach.css`, nối ở `hudMenu.js`; chỉ người mới thấy, bỏ qua được, nhớ `lgt.coach`), `docs/PHIEN70.md`. **Quy tắc giữ nguyên:** làm từng mục nhỏ, xong báo, chờ "tiếp tục"; cuối mỗi phiên cập nhật mục này + `docs/PHIENxx.md` và gửi prompt bàn giao chi tiết.

- **2026-11-09 (Phiên 80):** Gp gửi ảnh QR VietinBank + MoMo và yêu cầu: **thùng công đức ở chánh điện** có 2 cách (bấm → quét QR, **ưu tiên MoMo**; bấm → hiện số tài khoản để sao chép); **donate xong nhận hạt sen trong 24 giờ**; rồi làm tiếp phần còn lại. Làm 1 mục: thùng công đức (`js/scene/thungcongduc.js`, `js/world/donate.js`, `js/engines/donate.js`, `js/ui/donate.js`, `css/donate.css`, `gas/Donations.gs`, `assets/qr-*.jpg`, `docs/PHIEN80.md`). Quy ước TẠM tôi đặt, Gp chưa chốt: 1.000đ = 1 hạt sen, tối thiểu 10.000đ, duyệt thủ công trong sheet Donations. **Quy tắc giữ nguyên:** làm từng mục nhỏ, xong báo, chờ Gp nói "tiếp tục".

## 8. PROMPT KHỞI ĐỘNG PHIÊN MỚI (dán nguyên văn)

```
Dự án DIỆU GIANG TỰ. Repo: https://github.com/tp9sach-ops/duanchuaon
Đọc PROMPT.md rồi HANDOFF.md trong repo trước. Kiểm repo thật, chạy npm test, rồi làm đúng "bước" của phiên này
theo PROMPT.md mục 6 (tôi không nói bước nào thì làm bước kế tiếp chưa xong).
Tôi nói tiếng Việt thường ngày, không cần biết tên file. Cần đoạn mã nào thì hỏi tôi, không đoán. Làm từng bước, xong trọn vẹn.
Cuối phiên BẮT BUỘC: cập nhật HANDOFF.md chi tiết (chép nguyên văn quy tắc mục 5), npm test, đẩy TẤT CẢ lên GitHub
(trùng tên thì ghi đè), ghi bộ nhớ (nếu bị chặn thì nói thẳng), rồi đính kèm HANDOFF.md và tóm tắt.
Yêu cầu mới của tôi tự ghi vào PROMPT.md mục 7.
```

## 9. ĐẶC TẢ GIAO DIỆN "CHÙA ONLINE" (viết lại ở Phiên 12c từ 10 ảnh chụp của ptg; cập nhật khi ptg gửi thêm)

### 9.0 Nguồn và nguyên tắc
- **Nguồn:** ảnh trong `docs/tham-chieu/` (README ở đó mô tả từng ảnh). Gồm: ứng dụng gốc của người Hàn (ref-01; chữ Hàn: 합장 중 = đang chắp tay, 절하기 = lạy, 염주 = chuỗi hạt, 돌아가기 = quay lại) và bản tiếng Việt `niemphat.online` (ref-02…09). `ref-10` là **bản hiện tại của mình**, để so sánh.
- AI **vẫn chưa mở được trang** `s1.niemphat.online` (robots chặn). Mọi thứ dưới đây là **những gì nhìn thấy trong ảnh**. Chỗ ảnh không cho thấy → ghi ở 9.10 là "chưa biết", **hỏi ptg, không đoán**. Con số (giá, thời gian, mức cấp...) **không có trong ảnh thì không bịa**; đặt giá trị tạm trong một file cấu hình và ghi "tạm" vào bàn giao.
- **Ranh giới:** bắt chước **bố cục, cơ chế chơi, cảm giác**. **Không** chép hình, mô hình, âm thanh, chữ nguyên văn hay tên thương hiệu của trang mẫu; mọi thứ dựng bằng code riêng, giữ tên **Diệu Giang Tự**. Lời kinh chỉ dùng văn bản công cộng (ptg duyệt).

### 9.1 Vòng chơi (cái hồn của mẫu)
Nhập tên → thành nhân vật chibi → đi trong sân chùa (cây, gạch, cổng) → bấm **Vào chánh điện** → ngồi vào bồ đoàn trong hàng cùng nhiều người → làm các hoạt động (lạy, tràng hạt, tụng kinh, thiền, dâng lễ, thả đèn nguyện) → được hạt sen/công đức, lên bậc → quay ra sân nhặt hoa sen vàng, đi chùa khác. Điểm hấp dẫn: **thấy người khác cùng ngồi, tên nổi trên đầu, cùng tụng.**

### 9.2 Nhân vật (ref-01, 03, 05, 07, 08, 09)
- Dáng chibi: **đầu tròn to, không có cổ rõ, thân nhỏ**, áo dài kiểu thầy tu/phật tử nhiều màu (xanh lam, vàng nâu, xám/trắng, nâu); có **dải vàng chéo vai** và **chuỗi hạt quanh cổ**; một số có **tóc đen/búi** (nữ/cư sĩ), phần lớn đầu trọc màu da cam nâu. Tay chắp trước ngực khi đứng/ngồi.
- **Nhãn trên đầu:** tên + dòng nhỏ danh hiệu ("Phật tử"; ở chùa đông có thêm "Cấp N"). Người chơi của mình có **mũi tên vàng ▼ lơ lửng** trên đầu.
- **Hào quang** (vòng sáng trắng-vàng quanh đầu) khi đang thiền/tụng (ref-08, 07).
- **Bong bóng/nhãn trò chuyện** nổi (ref-01: "chào bằng chắp tay"; ref-03: "Trụ trì · chạm để thưa chuyện").
- Hiện có sẵn `js/world/avatar.js` (Phiên 10): đã có tên, màu, bong bóng, tư thế `idle/walk/sit/mo/bow`. Việc cần thêm: **đầu to hơn/dáng chibi hơn, dải vai, chuỗi hạt cổ, hào quang, mũi tên ▼, danh hiệu + cấp, tư thế "chắp tay" và "lạy"**.

### 9.3 Cảnh (ref-04…09)
- **Sân ngoài:** ban ngày, trời xanh, mây; nền **gạch xám lát lớn**; **cây low-poly** (tán xanh khối, thân nâu); tường gạch thấp; cổng/chánh điện đỏ mái cong ở phía xa; núi xa. Cột đèn lồng đỏ hai bên.
- **Chánh điện:** nền gỗ tối; **lưới bồ đoàn tròn nâu (có múi như bí ngô) đặt trên thảm đỏ viền vàng**, xếp hàng đều, khoảng cách rộng; ở cuối là **bàn thờ nhiều bậc có nến, bình hoa ngọc, lư hương nhang, tượng Phật lớn**; **hai bảng** hai bên ("Bảng vàng", "Mua công đức"); cột đỏ; đèn lồng đỏ; ánh sáng ấm, bóng đổ chéo.
- **Hôm nay mình đang là CẢNH ĐÊM** (nền `#06070d`). Mẫu là **ban ngày** ở sân; chánh điện ấm tối. ptg từng yêu cầu "cảnh phải sáng" → đề xuất **Phiên 13c: sân ban ngày, chánh điện ấm**, giữ đêm làm lựa chọn. **Cần ptg duyệt** (đây là đổi hướng thị giác).
- Mẫu có **nhiều chùa** (tên như "Chùa Lam Độ", "Chùa Nhật Trụ", "Động Hương Sơn", "Miếu Bà Thất Sơn") và **nhiều máy chủ** (ref-08: "Hiện đã có 4 máy chủ"). Mỗi chùa có số "N đang online".

### 9.4 HUD — vị trí từng thứ (ref-04, 05, 08)
**Desktop (ref-05):**
- **Trái-trên:** chip người chơi (avatar tròn, tên, dòng "Hạt sen · bậc N", thanh tiến độ mảnh, **huy hiệu tròn vàng số cấp** bên phải). Ngay dưới: **tên chùa** (chữ lớn, trắng) → nút **"Vào chánh điện"** (viền vàng) và nút phụ **"Công quả"** → chấm xanh "N đang online".
- **Trái-giữa:** hai nút tròn **+ / −** (zoom).
- **Giữa-trên:** **toast gợi ý** nền tối bo tròn có icon, ví dụ "Đi tới gần hoa sen vàng phát sáng trong sân để nhận lộc"; ngoài ra **banner thông báo** "Chùa vừa được nâng cấp... [Tải lại]" (tương đương: ta có `sw.js VERSION`).
- **Phải-trên:** nút mũi tên mở/thu gọn; **số hoa sen** (icon hoa sen + số), **số ngọc** (icon kim cương + số); hàng nút tròn nhỏ: danh sách, quà, thư, tim, chia sẻ, trợ giúp "?" (có chấm đỏ báo).
- **Phải-giữa:** **panel Đèn nguyện** (xem 9.6).
- **Phải-dưới:** **lưới 3×2 nút vuông bo góc** nền tối viền vàng nhạt: **Lạy Phật, Tràng hạt, Tụng kinh / Thiền, Dâng lễ, Linh thú** (Linh thú **mờ/khóa**).
- **Dưới giữa:** **thanh menu ngang 9 nút** (icon + nhãn): **Nhiệm vụ, Túi đồ, Cửa hàng, Cộng đồng, Xếp hạng, Bản đồ chùa, Thiền phái, Góp ý, Cài đặt** (một nút có chấm xanh báo).
**Di động (ref-04, 08):** chip + tên chùa + nút ở trái-trên; **menu dọc bên phải** (cùng 9 mục, chỉ icon); lưới hành động phải-dưới nhưng nhỏ hơn; nút lớn **"Đứng dậy"** màu vàng đặc ngay trên lưới khi đang ngồi; dòng **buff** dưới tên chùa (ví dụ "tăng trầm +20% · 4 phút"); thanh tiêu đề trình duyệt không bị che.
**Phong cách vật liệu UI:** nền **đen nâu trong suốt/kính mờ (blur)**, **viền vàng mảnh**, chữ trắng ngà, nhấn vàng `#e0b85a`-ish, nút chính **vàng đặc chữ nâu đậm**, bo góc lớn. Trùng hợp với bảng màu Diệu Giang Tự (vàng `#d9b25f`, nền tối) → **giữ màu của mình**, đổi **hình dạng/bố cục** theo mẫu.

### 9.5 Hoạt động
**a) Lạy Phật / ngồi / đứng (ref-01, 07, 08):** nút "Lạy Phật" → nhân vật chắp tay rồi cúi lạy (ref-01 có chữ "đang chắp tay" ở nút, và bong bóng "chào bằng chắp tay"). Ngồi vào bồ đoàn bằng cách bấm đệm hoặc đi tới; khi ngồi có nút **"Đứng dậy"**. Ngồi **Thiền**: có hào quang và buff (ví dụ tăng trầm).
**b) Tràng hạt (ref-01, 03):** màn chuỗi hạt gỗ **108 hạt** (vòng dọc, hạt tròn vân gỗ vàng nhạt, hạt cái to hơn), đếm **"N / 108"** ở góc, nút **quay lại**; trong cảnh chùa, chuỗi hạt 3D hiện ngay **trước nhân vật** khi đang lần hạt (ref-03) kèm nhãn "chuỗi". Mỗi chạm/gạt = một hạt.
**c) Tụng kinh (ref-02):** hàng nút chọn bài (**Niệm Phật, Bát Nhã Tâm Kinh, Chú Vãng Sanh, Chú Đại Bi, Kệ Hồi Hướng**), bài đang chọn **nền vàng đặc**; dòng mô tả dưới (ví dụ "... 84 câu"); **lời kinh 3 dòng**: dòng hiện tại **to đậm vàng**, dòng sau mờ hơn (kiểu karaoke); **nút mõ** tròn nâu ở giữa-dưới để gõ nhịp; ở góc có chữ "Tự tá..." (cắt, **chưa rõ nghĩa**, có thể "Tự tụng/Tự động" — **hỏi ptg**). Người khác cùng ngồi **tụng cùng lúc**.
**d) Dâng lễ, Linh thú:** nút có trong lưới; **chưa thấy ảnh nội dung** → 9.10. Linh thú đang khóa.
**e) Công quả:** nút ở trái-trên sân (việc làm lấy công đức); **chưa thấy nội dung** → 9.10.
**f) Hoa sen vàng:** vật phát sáng trong sân, **đi tới gần để nhận lộc** (+hạt sen).

### 9.6 Đèn nguyện (ref-05)
Panel phải, tiêu đề **"Đèn nguyện"** + dòng "30 ngọn đèn đang sáng" + nút đóng ✕. **Ba tab:** *Chùa này / Tất cả chùa / Hoạt động*. Mỗi thẻ: **lời nguyện in nghiêng** trong ngoặc kép, **tên người** (vàng), **thời gian** ("4 phút trước") và bên phải **huy hiệu ngọn lửa + số** (số ngọn đã thắp/ủng hộ). Cuối panel nút lớn vàng đặc **"Thả đèn nguyện"** (icon đèn). Trong dự án đã có tường nguyện (`js/ui/temple.js`, `gas/Prayers.gs`, lọc link/email/số điện thoại, ≤120 ký tự) → **tái dùng**, đổi hình thức thành panel này.

### 9.7 Xã hội & nhiều chùa
- Số "N đang online" cho **từng chùa**; chọn chùa trong **Bản đồ chùa** hoặc **Cộng đồng**; "máy chủ" = nhóm phòng (ở ta: nhiều **phòng GAS**, mỗi phòng giới hạn ~30 người hiển thị).
- **Chat**: bong bóng trên đầu (đã có trong `avatar.js`); NPC **Trụ trì** "chạm để thưa chuyện"; bảng **"Chạm để xem duyên"** gần chánh điện (ref-03) — đề xuất nối với **Lá bùa/Thần số** của mình (**cần ptg duyệt**).
- **Cộng đồng, Xếp hạng, Thiền phái** (nhóm/phái): có menu, **ảnh không cho thấy nội dung** → 9.10.

### 9.8 Tiến trình & kinh tế (chỉ những gì thấy)
Có: **hạt sen** (tiền tệ chính, ví dụ 135/400), **ngọc** (tiền thứ hai, 0), **bậc** ("Hạt sen · bậc 1…4") và **cấp** (huy hiệu số; chùa đông thấy "Cấp 25"), **buff** có thời gian, **Nhiệm vụ, Túi đồ, Cửa hàng** ("Mua công đức" là bảng ở chánh điện). **Không có số liệu về cách lên bậc, giá, hạn buff** → 9.10. Phiên 16 chỉ làm sau khi ptg chốt phạm vi.

### 9.9 Ánh xạ sang chức năng sẵn có của Diệu Giang Tự
| Chức năng cũ | Chỗ trong thế giới | Ghi chú |
|---|---|---|
| Hôm nay (lịch/bói ngày) | Tam quan (đã có điểm đến) | giữ |
| Vận trình | bờ ao sen | giữ |
| Lá số (Bát tự/Tử vi/thần số/hoàng đạo/hành tinh) | Nhà Tổ | giữ |
| Tướng số (chỉ tay/nhân tướng) | gác chuông | giữ |
| Chùa online (nhang, mõ, 108, xăm, tường nguyện) | chánh điện | **tách thành các hoạt động 14a–14c**; panel cũ chỉ còn xin xăm |
| Lá bùa (tổng hợp) | lư hương; có thể thêm "Chạm để xem duyên" | giữ |
Các nút menu dưới (Nhiệm vụ, Túi đồ, Cửa hàng, Xếp hạng, Thiền phái...) **chưa có chức năng** → mờ + "sắp có" cho tới khi làm.

### 9.10 CHƯA BIẾT — phải hỏi ptg (không đoán)
1. Nội dung màn **Dâng lễ**, **Công quả**, **Linh thú**, **Cửa hàng**, **Túi đồ**, **Nhiệm vụ**, **Xếp hạng**, **Thiền phái**, **Cộng đồng**: ptg chụp thêm ảnh hoặc nói muốn làm tới đâu.
2. Chữ "Tự tá..." ở góc màn tụng kinh là gì?
3. Cách lên **bậc/cấp**, mỗi hoạt động cho bao nhiêu hạt sen, buff "tăng trầm" là gì, ngọc kiếm thế nào?
4. Có **tiền thật / mua ngọc** không? (Mặc định của ta: **KHÔNG** làm thanh toán.)
5. Lời kinh 5 bài: dùng văn bản nào (ptg duyệt)? Có **âm thanh tụng/nhạc nền** không? (cần file có giấy phép; mặc định chỉ có tiếng mõ/chuông tổng hợp).
6. **Ban ngày hay đêm** (13c)? Có đổi bảng màu không? (mặc định: giữ vàng `#d9b25f` + nền tối cho UI; đổi cảnh sang ban ngày nếu duyệt).
7. Có làm **nhiều chùa** ngay, hay chỉ một chùa Diệu Giang Tự có nhiều phòng?
8. Chọn kiểu nhân vật: giữ **6 màu áo**; thêm **tóc búi** và **đầu trọc** (mặc định: có cả hai)?
9. Thanh menu dưới: số nút nhiều quá cho điện thoại — chấp nhận **menu dọc bên phải** như mẫu?

### 9.11 Việc ptg làm để Phiên 13 chạy ngay (không chặn nếu chưa làm — dùng mặc định)
- **Quan trọng nhất:** tải `cap-nhat-phien12c.zip` lên repo (Add file → Upload files, kéo MỌI file trong zip, giữ thư mục, trùng tên ghi đè) hoặc cấp quyền Contents: Read and write cho tích hợp GitHub. Hiện repo **chưa có `PROMPT.md`**.
- Trả lời 9.10 (có thể trả lời "mặc định" cho từng câu).
- Chụp thêm ảnh các màn còn thiếu (Dâng lễ, Công quả, Cửa hàng, Nhiệm vụ, Xếp hạng, Thiền phái, màn nhập tên đầu tiên — **ảnh màn nhập tên/chọn nhân vật chưa có**).

## 10. Tài nguyên tái sử dụng từ "Ô Long Viện" (MIT) — thêm 2026-11-03

Nguồn: https://github.com/hoangminhon/olongvien (tác giả Kent Juno, MIT). ptg gửi để "custom từ game này hoàn thiện dự án". Đó là chánh điện 2.5D + bộ công cụ LIVE TikTok, khác kiến trúc với Diệu Giang Tự (thế giới 3D đi bộ), nên CHỈ lấy phần dùng được, ghi nguồn ở `THIRD_PARTY.md` và đầu file. **Luôn giữ thông báo MIT. KHÔNG chép số tài khoản ủng hộ trong README gốc.**

| Mục | Lấy gì | Trạng thái |
|---|---|---|
| O1 | 64 quẻ Kinh Dịch (`iching.mjs`) + 36 thẻ xăm thơ (`xam.mjs`) → `js/engines/iching.js`, `xam36.js`; UI "Gieo quẻ Kinh Dịch" trong chương Chùa online (`js/ui/temple.js`, `css/iching.css`) | **XONG** (Phiên O1) |
| O2 | Thư viện nhạc `assets/music/library.json` + `audio-player.js` (nhạc thiền, tụng kinh) thay/bổ sung nút Âm thanh | CHƯA. Chỉ dùng 3 tệp có giấy phép rõ: `placid-ambient.ogg`, `spiritual-ambient.ogg` (CC BY 4.0, MusicLFiles) và `chu-lang-nghiem-trich-doan.ogg` (CC BY-SA 3.0); phải hiện ghi công. `music1.mp3`/`music2.mp3` tạo bằng Gemini (giấy phép không rõ) → hỏi ptg trước khi dùng |
| O3 | Ý tưởng bồ đoàn: hàng bồ đoàn trong chánh điện, nhân vật đi tới ngồi tụng kinh (đã có trạng thái `sit`/`mo` và hào quang trong `avatar.js`) | CHƯA. Làm cùng Phiên 14 (nút Thiền / Tụng kinh): thêm `CUSHIONS` vào `placements.js` + test tới được |
| O4 | Biểu tượng hương / chuông / mõ / hoa sen / cuộn giấy (`fx_*.webp`) làm icon lưới nút hành động | CHƯA, ẢNH DO AI TẠO (Google Flow): điều khoản thương mại chưa rõ → mặc định tự vẽ icon SVG; chỉ dùng ảnh gốc nếu ptg đồng ý |
| O5 | Nhân vật 2D, nền `hall`, atlas | KHÔNG lấy (khác phong cách chibi 3D đã chọn) |
| O6 | Máy chủ LIVE TikTok (Node, `piratetok-live-js`, giọng đọc Edge/Google) | KHÔNG lấy (không thuộc web tĩnh này; thư viện không chính thức của TikTok). Chỉ làm nếu ptg yêu cầu riêng một bản LIVE |

**Mẫu dùng lại ý hay (đã chép logic, nhớ khi làm tiếp):** gieo quẻ và rút xăm nhận chủ đề (tài lộc, tình duyên, công danh, sức khỏe) qua `detectTopic`; mọi hàm rút nhận tham số `rng` để test; dữ liệu tự kiểm lúc nạp (ném lỗi nếu thiếu quẻ/thiếu luận giải).
- **2026-11-05 (Phiên 14e/14g/15b):** ptg gửi bàn giao 15a rồi yêu cầu: vẽ lại `assets/buddha.webp`; thiết kế lại chùa theo ảnh tham chiếu — sàn gỗ có đổ bóng chân thật, chánh điện rộng chứa nhiều người, hoa viên rộng nhiều khu/hoạt động; rồi "làm tiếp các phần còn lại" ("Tiếp tục" ×3). Đã làm: tượng Phật, chánh điện 39×26 m, sàn gỗ + đổ bóng, 48 bồ đoàn, NPC (3), khung trò chuyện; gộp với cảnh quan 14f. Còn: nhiều phòng, PERF bóng, Phiên 16–17. Chi tiết: HANDOFF mục 7.
- **2026-11-05 (Phiên 17 sớm):** ptg yêu cầu: Thầy Trụ trì mặc áo cà sa, có râu; có nhiệm vụ cho người chơi thăng cấp; thêm hoạt động, rừng núi, thác, đường phố, dân làng ngoài chùa; rồi "xem lại GitHub, làm tiếp các công đoạn còn lại để hoàn thiện và chính xác". Đã làm: cà sa + râu; 15 nhiệm vụ + 10 cấp (quests.js, ui/quest.js); khu ngoài chùa (outside.js); 6 dân làng, 8 hoạt động, 7 người đi lại. Chi tiết: HANDOFF mục 7.
- 2026-11-07 (Phiên 40): ptg bảo xem repo kỹ, phân tích, làm tiếp phần còn thiếu. Làm A3 + B1 của kế hoạch Phiên 38: sửa L3 (`js/ui.js` đúng bản, xóa `js/ui/ui.js`) và L4 (`netPos` trong `js/world/interior.js`, dùng ở `js/net/room.js`). npm test 534/534 trên Node 22 và 20, sw dgt-v46. Chi tiết: `docs/PHIEN40.md`.
- 2026-11-07 (Phiên 43): ptg yêu cầu 3 việc, làm lần lượt: (1) trong nhà có nút Chỉnh sửa, bấm vào đồ để dời/xoay bằng chuột; (2) hoàn tất nhiệm vụ liên tục + cho người chơi biết việc tiếp theo; (3) hoàn tất quả cầu, cá, thả cá phóng sinh. Việc 1 đã làm (`js/ui/editmode.js`). Việc 2 đã làm (`js/world/nextGoal.js`: thẻ "Việc kế tiếp" không bao giờ trống). Chi tiết: `docs/PHIEN43_BAN_GIAO.md`.
- 2026-11-07 (Phiên 44): ptg yêu cầu hoàn tất quả cầu, cá, thả cá phóng sinh (việc 3 của Phiên 43). Làm 3a: bộ não `js/world/fishing.js` + 14 test (572 test). Chi tiết: `docs/PHIEN44.md`.
- 2026-11-07 (Phiên 45): 3b + 3d dạng chữ: bảng Câu cá `js/ui/fishing.js`, nút `cauca` cụm phải-trên, `css/fishing.css`. Chi tiết: `docs/PHIEN53.md`. ptg thêm file `docs/PORMT TỔNG` (prompt tổng, nhắc tới `docs/KE_HOACH_TONG.md`).
- 2026-11-07 (Phiên 46): ptg bảo xem repo kỹ, phân tích, làm tiếp phần còn thiếu. Phát hiện 3 file Phiên 45 tải nhầm vào `js/` (đúng là `js/ui/`) làm giao diện Câu cá không chạy và 2 test đỏ → đã chuyển đúng chỗ, 575/575 đạt. Tạo `docs/KE_HOACH_TONG.md` (đối chiếu mã thật). Việc kế: 1.4 nhiệm vụ câu cá/phóng sinh, rồi 1.2 cảnh 3D. Chi tiết: `docs/PHIEN46.md`.
- 2026-11-07 (Phiên 47): ptg bảo xem repo kỹ, phân tích, làm tiếp phần còn thiếu. Làm mục 1.4 (nhiệm vụ `m-cau`/`m-phongsinh`/`n-phongsinh`, dẫn đường, sổ tay Phóng sinh viết lại, `LGT.act('cau'|'phongsinh')`) + sửa bản đồ hồ cá x 56→60. npm test 578/578, sw dgt-v53. Việc kế: 1.2 cảnh 3D câu cá. Chi tiết: `docs/PHIEN47.md`.
- 2026-11-07 (Phiên 48): ptg nói "tiếp tục và đẩy phiên mới lên github". Làm mục 1.2 (cảnh 3D câu cá: `js/scene/fishing.js` + `js/world/fishingView.js`), xóa 3 file lạc trong `js/`. npm test 584/584, sw dgt-v54. Việc kế: 1.5 reward Lạy Phật, 2.2, rồi giai đoạn 3. Chi tiết: `docs/PHIEN48.md`.
- 2026-11-07 (Phiên 49): ptg bảo xem repo kỹ, phân tích, hiểu rõ rồi làm tiếp phần còn thiếu. Repo thật đã ở Phiên 48 (`HANDOFF.md` gốc đã cũ; đọc `docs/KE_HOACH_TONG.md` + `docs/PHIEN48.md`). Làm mục 1.5 (Lạy Phật cộng hạt sen). Việc kế: 2.2 rồi giai đoạn 3. Chi tiết: `docs/PHIEN49.md`.
- 2026-11-07 (Phiên 50): ptg nói "tiếp tục". Làm mục 2.2 (chạy test nhiều lần: 585/585 ba lần, không lỗi thoáng qua). Việc kế: giai đoạn 3 (hỏi ptg trước khi nâng hình trong phòng / duyệt thiết kế Vipassana). Chi tiết: `docs/PHIEN50.md`.
- 2026-11-07 (Phiên 51): ptg nói "tiếp tục". Làm mục 4.3: nhiệm vụ nội thất đầu tiên (`m-noithat`). sw dgt-v56. Việc kế: giai đoạn 3 cần ptg duyệt (nâng hình trong phòng, Vipassana) hoặc 4.2 Khinh thân bậc 1. Chi tiết: `docs/PHIEN51.md`.
- 2026-11-07 (Phiên 52): ptg nói "tiếp tục". Làm mục 4.2: nhiệm vụ Thử Khinh thân (`m-khinhthan`, nhảy 3 lần). sw dgt-v57. Việc kế cần ptg duyệt hướng: 3.2, 3.4, 4.1; hoặc 5.x game thế giới mở. Chi tiết: `docs/PHIEN52.md`.
- 2026-11-08 (Phiên 55): ptg/Gp báo lỗi `blocked` ở màn đặt mật khẩu → thêm đường dự phòng gửi bằng form + khung ẩn (`js/api.js` `callViaFrame`, `gas/Code.gs`, `chan-doan.html` phép 8). Chờ ptg cài lại Code.gs và báo kết quả phép 8. Chi tiết: `docs/PHIEN55.md`.
- 2026-11-08 (Phiên 56): ptg bảo "tiếp tục hoàn thiện tính năng câu cá" → phím Cách/Enter để bấm thu cá, thu cầu khi rời mặt nước. Chi tiết: `docs/PHIEN56.md`.
- 2026-11-08 (Phiên 57): ptg yêu cầu cầu gỗ bán 50 hạt sen, làm xong chỗ bán cầu, bảng nhiệm vụ có trang "Lộ trình" (ô hình, chưa trải nghiệm hiện dấu ?: khinh công 8 bậc, khám phá, gieo duyên–phóng sinh, đất–nhà–nội thất–tiệc). "Mời tiệc" = sắp có (game chưa có tiệc). Chi tiết: `docs/PHIEN57.md`.
- 2026-11-08 (Phiên 58): ptg bảo đọc kỹ repo (nhiều thay đổi), phân tích, làm tiếp phần còn thiếu. Kiểm thật: `npm test` 657/657 (Node 22); mọi import trong `js/` đều khớp file; chỉ `landscape.js` ở gốc (file lạc) có import gãy. Sửa `pages.yml` để bản deploy có `chan-doan.html` (trước đó trang chẩn đoán của Phiên 54–55 sẽ 404 khi Pages chạy bằng GitHub Actions). Cập nhật nhật ký này (thiếu Phiên 55–57). Chi tiết: `docs/PHIEN58.md`.
- 2026-11-08 (Phiên 59): ptg trả lời: (1) lỗi đăng nhập đã xử lý xong; (2) "Mời tiệc" để sau; (3) thêm trang "Tu tập" + "NPC" vào Lộ trình; (4) cầu gỗ bán 50 hạt sen (giữ nguyên, KHÔNG tặng người mới), thêm "Suối Trong" làm nơi câu thứ 4 và hình 3D cá trong ao riêng; (5) xóa file lạc → ĐÃ XÓA (`phien26.patch`, `PHIEN31.md`, `PHIEN33.md`, `landscape.js` gốc, hai bản `PHIEN42_BAN_GIAO (2)/(3).md`); (6) sau đó làm Xếp hạng và bơi–lặn. **ƯU TIÊN TRƯỚC HẾT: thêm kiến trúc, khu rừng thông, Phật khắc trên vách đá, sông hồ.** Đã làm mục đầu: Đại Phật khắc vách đá cạnh thác (`js/scene/daiphat.js`, `DAI_PHAT` trong `js/world/outside.js`, nơi `daiphat` trong PLACES). Chi tiết + thứ tự việc kế: `docs/PHIEN59.md`.
- 2026-11-08 (Phiên 60): ptg: "Tiếp tục" + làm lại bộ nhiệm vụ để dẫn dắt người chơi khám phá hết mọi thứ (người mới không biết làm gì trước). Đã làm: 7 chương (`js/world/chapters.js`), +12 nhiệm vụ ghé nơi, dẫn đường tự động, thẻ/bảng nhiệm vụ theo chương. **Quy tắc mới: nơi mới thêm vào PLACES phải có nhiệm vụ `v-<id>` + PLACE_STAND + chương.** Chi tiết: `docs/PHIEN60.md`. Việc kế (rừng thông, sông hồ, kiến trúc…) giữ nguyên ở `docs/PHIEN59.md`.
- 2026-11-08 (Phiên 61): ptg "Tiếp tục" → rừng thông dày (`buildPineWoods` trong `js/scene/outside.js`: 340 thông, đá rêu, dương xỉ, đèn đá, sương). Việc kế: sông + hồ, kiến trúc. Chi tiết: `docs/PHIEN61.md`.
- 2026-11-08 (Phiên 64): ptg báo "cây rừng thông chưa có" + xin hiệu ứng/âm thanh khi xong nhiệm vụ → gốc lỗi: PERF mức 5 ẩn hết cây (nay giảm mật độ `forestDensity`); thêm ăn mừng nhiệm vụ (`js/world/celebrate.js`, `js/ui/celebrate.js`, `css/celebrate.css`). sw `dgt-v69`. Xem docs/PHIEN64.md.

- 2026-11-09 (Phiên 81): ptg bảo xem lại repo, đọc kỹ, làm tiếp theo "prompt chiều sâu" + "prompt tổng" và đẩy GitHub. Làm hạ tầng ZONE ở mức lõi logic (va chạm theo zone trong `js/world/layout.js`, `js/world/zones.js`, `tests/zones.test.mjs`); chưa nối vào game. `npm test` 775/775. Chi tiết: `docs/PHIEN81.md`. **Quy tắc giữ nguyên:** làm từng mục nhỏ, xong báo, chờ "tiếp tục".
- 2026-11-09 (Phiên 82): ptg nói "tiếp tục và làm các kiến trúc" → làm Bảo tháp 7 tầng trên đồi (`js/scene/baothap.js`, `BAO_THAP` + 2 vùng đi bộ trong `js/world/outside.js`, nhiệm vụ `v-baothap`). `npm test` 776/776. Chi tiết: `docs/PHIEN82.md`. Cầu đá / cổng tam quan thứ hai: chờ ptg chọn.
- 2026-11-10 (Phiên 89): ptg đổi nguồn mã sang repo `tp9sach-ops/duanchuaon`. Làm 4 yêu cầu câu cá 2026-11-08: hoa sen trên đầu + rung 0,8 s (cửa sổ cầu gỗ 0,8 s), ném cầu thẳng trước mặt, cá văng lên tay, ném NPC (nút Ném NPC). sw `dgt-v95`. Xem docs/PHIEN89.md.
- 2026-11-10 (Phiên 90): ptg chốt đổi sang repo `duanchuaon`; ném NPC chỉ để vui; yêu cầu mới THIẾT ĐẦU CÔNG (Khinh thân bậc ≥ 4: sau khi nhảy bấm nút để lao đầu một quãng ngắn, đâm yêu quái gây sát thương, bậc càng cao càng xa/đau). sw `dgt-v96`. Xem docs/PHIEN90.md.
