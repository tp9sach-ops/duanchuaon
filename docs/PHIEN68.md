# PHIÊN 68 — Nút "Dẫn đường" nhấp nháy cho việc mới và cho người mới — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Đọc: PROMPT.md → KE_HOACH_TONG.md → PHIEN65.md → PHIEN66.md → PHIEN67.md → file này.

## Bối cảnh
Gp bảo xem lại repo, đọc kỹ, hiểu rõ phần còn thiếu, làm tiếp và đẩy GitHub. Kiểm repo thật: `main` @ `f6012ed` (Phiên 67), `npm test` **705/705** (Node 22), mọi file test đều có trong `package.json`, `sw.js` = `dgt-v72`, bộ quét bí mật chỉ thấy khóa web Firebase trong `js/config.js` (công khai theo thiết kế, được bảo vệ bằng `firebase/database.rules.json`; không phải bí mật).
Tài liệu lệch mã (đã sửa ở phiên này): `PROMPT.md` mục 7 dừng ở Phiên 54, `HANDOFF.md` đầu file nói "Phiên 54"; thực tế mã đã tới Phiên 67.

## Chọn đúng MỘT mục nhỏ (quy tắc: làm từng mục, báo, chờ "tiếp tục")
Trong yêu cầu 08/11 của Gp: "nhiệm vụ/kỹ năng mới phải có hướng dẫn chỉ đúng chỗ bấm; người chưa rành vẫn hiểu và chơi được". PHIEN66 còn ghi 3 việc dở: (a) nút Dẫn đường nhấp nháy cho nhiệm vụ mới; (b) nhãn chữ cho nút tròn góc phải-trên; (c) màn hướng dẫn lần đầu 3 bước. Phiên này làm **(a)**: nhỏ, an toàn, kiểm được bằng test + DOM giả.

## ĐÃ LÀM
- `js/world/goPulse.js` (mới, logic thuần): `shouldPulse({hasButton, kind, until, used, now})`, `pulseUntil`, `readUsed`, `PULSE_MS = 20000`, `USED_KEY = 'lgt.gdUsed'`. Luật: nút nhấp nháy khi **(1)** việc mới vừa hiện trong lúc chơi → 20 giây rồi tắt; **(2)** người chưa từng bấm "Dẫn đường" → nhấp nháy tới khi bấm lần đầu (nhớ ở `localStorage lgt.gdUsed`). Việc "Tu tập tự do" (`kind:'free'`) không nhấp nháy.
- `js/ui/story.js`: nối vào thẻ "Việc kế tiếp" (dùng lại lớp `gd-hl` sẵn có trong `css/guide.css`, đã tôn trọng `prefers-reduced-motion`). Bấm nút → tắt nhấp nháy + ghi nhớ.
- `tests/gopulse.test.mjs` (4 test), `package.json`, `sw.js` = `dgt-v73`.
- Kiểm hành vi bằng jsdom (cài ngoài repo, KHÔNG thêm vào repo): người mới → nhấp nháy; bấm → tắt + `lgt.gdUsed='1'`; xong bước cốt truyện đầu (`talk` `chutieu`) → việc mới `s-abbot` → nhấp nháy lại.

## CHƯA KIỂM / RỦI RO
- Chưa nhìn bằng mắt trên trình duyệt thật/điện thoại (không tải được three.js trong môi trường này). Vòng sáng `gd-hl` lan 12 px; nếu bị cắt bởi `overflow` của cụm nút thì chỉnh trong `css/guide.css`.
- Người đã từng bấm "Dẫn đường" ở bản cũ sẽ vẫn thấy nhấp nháy lần đầu sau bản này (vì chưa có cờ `lgt.gdUsed`), tắt ngay khi bấm một lần.

## CHƯA LÀM (theo thứ tự đề xuất, mỗi việc xong báo, chờ "tiếp tục")
1. (b) Nhãn chữ cho các nút tròn góc phải-trên (hiện chỉ biểu tượng + tooltip). Chờ Gp thử điện thoại để nói chỗ nào khó hiểu nhất.
2. (c) Màn hướng dẫn lần đầu 3 bước có mũi tên (cân nhắc: dễ phình giao diện).
3. **Chơi chung qua mạng** (máu yêu quái chung, nhặt lá tranh nhau, ném người chơi khác bằng `throwCheck`): bước lớn, cần sửa `gas/Code.gs` + `engines/room.js` + `js/net/roomClient.js`; không thử được GAS ở môi trường AI → làm ở phiên riêng, Gp đồng ý trước (Gp tự sửa thư mục `gas`).
4. Gp thử `?yq=lua&yd=cao` trên điện thoại rồi cho ý kiến độ khó; các việc mở ở PHIEN65/66 (sông + hồ, kiến trúc, Suối Trong, Tu tập/NPC trong Lộ trình, kết quả phép 8 `chan-doan.html`, Xếp hạng, bơi–lặn).

## ĐẨY GITHUB
Môi trường AI không có thông tin đăng nhập GitHub (`git push` hỏi Username) nên phiên này **giao file để Gp tải lên tay** (đúng đường dẫn, trùng tên ghi đè): `js/world/goPulse.js` (mới), `tests/gopulse.test.mjs` (mới), `docs/PHIEN68.md` (mới), `js/ui/story.js`, `package.json`, `sw.js`, `PROMPT.md`, `HANDOFF.md`, `README.md`, `docs/KE_HOACH_TONG.md`. Hoặc cấp quyền Contents: Read and write cho tích hợp GitHub rồi bảo phiên sau đẩy.

## PROMPT KHỞI ĐỘNG PHIÊN SAU (dán nguyên văn)
```
Dự án DIỆU GIANG TỰ. Repo: https://github.com/tp9sach-ops/loinhuan.github.io
Đọc PROMPT.md → docs/KE_HOACH_TONG.md → docs/PHIEN65.md → PHIEN66.md → PHIEN67.md → PHIEN68.md. Clone repo, chạy npm test (kỳ vọng 709/709 nếu đã tải bản Phiên 68 lên), so với tài liệu; mã thật luôn đúng hơn tài liệu.
Làm TỪNG MỤC NHỎ MỘT, xong thì đẩy GitHub (trùng tên ghi đè), báo, rồi CHỜ tôi nói "tiếp tục". Việc đầu: nhãn chữ cho các nút tròn góc phải-trên (PHIEN68 mục "Chưa làm" 1), trừ khi tôi nói việc khác.
Cuối phiên: cập nhật PROMPT.md mục 7 + docs/PHIENxx.md (chép nguyên văn quy tắc bàn giao), npm test, và gửi prompt bàn giao chi tiết.
```
