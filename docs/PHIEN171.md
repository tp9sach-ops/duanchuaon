# PHIÊN 171 — Bàn giao (prompt "chiêu thức 3D chuyên nghiệp": mục 3 — hoạt ảnh nhân vật 4 khung, nối vào game)

> Repo: https://github.com/tp9sach-ops/duanchuaon (nhánh `main`). Người dùng (Gp) nói tiếng Việt: trả lời NGẮN GỌN, DỄ HIỂU, làm TỪNG MỤC, xong đẩy GitHub, báo, chờ "tiếp tục". Đọc thêm `docs/PHIEN168.md` (danh sách 11 mục nộp), `docs/PHIEN170.md`.

## Quy tắc làm việc (chép nguyên văn)
"For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff."

## Hiện trạng 11 mục "Nộp theo thứ tự" (prompt chiêu thức 3D, mục 14)
1. Thẻ chiêu + dòng thời gian ms — XONG (Phiên 167).
2. Bảng màu + phác thảo hình — XONG (Phiên 168; chưa nối vào cảnh 3D).
3. **Hoạt ảnh nhân vật 4 khung — XONG phần mã phiên này (xem dưới); còn thiếu: clip quay (cần mắt người) và xương áo/đai/tóc.**
4. VFX theo lớp + số hạt + bản giảm — có mã (`chieuFx.js`, `chieuFxPlan.js`, `scene/chieuFx.js`); thiếu lõi sáng, ribbon trail, decal nền, tàn dư; rung/khựng chưa nối camera. **MỤC KẾ TIẾP.**
5. Kho âm thanh + giấy phép — chưa.
6. Hoạt ảnh trúng đòn + trạng thái kẻ địch — chưa.
7. Clip 5 giây ở ba cảnh — cần mắt người.
8. File JSON số liệu — chưa.
9. Điều khiển + camera (mục 10, 10A, 11) — chưa.
10. 12 combo mẫu + 5 tình huống khắc chế — chưa.
11. Báo cáo cân bằng — chưa.

## Phiên này đã làm gì (mục 3)
Kiểm repo: `js/world/chieuPose4.js` (bốn khung gồng/phát/TRÚNG/HỒI + `theoDa` áo/đai/tóc + `theTuThe` thẻ tư thế) và `tests/chieupose4.test.mjs` ĐÃ CÓ từ trước nhưng (a) test CHƯA đăng ký vào `npm test`, (b) `avatarChibi.js` vẫn dùng `castSample` ba khung nên khung trúng/hồi không hiện trong game. Đã sửa:
- `js/world/avatarChibi.js`: `castSample` → `castSample4` (cùng dạng kết quả `{phase,k,w,...khung}`, pha mới `trung`/`hoi`; tổng thời gian chiêu không đổi nên `luyenChieu.js` và `chieuTimeline.js` không bị ảnh hưởng).
- `package.json`: thêm `tests/chieupose4.test.mjs` vào `npm test`.
- `tests/chieupose4.test.mjs`: thêm 1 test chốt việc nối (6 test).

## Chưa làm / cố ý để lại
- Theo đà (áo/đai/tóc bay): hàm `theoDa(id,t)` có sẵn và có test nhưng `chibiRig` chưa có xương áo/đai/tóc nên chưa hiện. Khi có xương thì chỉ cần đọc `theoDa`.
- Clip quay bản hoạt ảnh: AI không quay được; cần Gp nhìn bằng mắt rồi chỉnh `HOLD_MS`, `VUOT`, `NGHI`, `THEO_DA` (số TẠM) ở `chieuPose4.js`.
- Điều còn treo từ Phiên 167: prompt đòi báo trước ≥ 0,4 s / 0,8 s, mã đang dùng 0,25 / 0,5 s → 9 chiêu gây hại không đạt ngưỡng mới. Cần Gp quyết giữ hay kéo dài gồng (`gong` ở `js/data/chieuNguHanh.js`, `chieuHoa.js`, rồi `node tools/chieuThoiGian.mjs > docs/CHIEU_THOI_GIAN.md`).
- Phiên 170 (không phải mạch chiêu): Gp phải dán lại `gas/Accounts.gs` vào Apps Script, Deploy → New version.

## Kiểm
Trước khi sửa: `npm test` 1179 đạt, 0 lỗi (clone `main` @ `770234e`, Node 22). Kết quả sau sửa ghi ở báo cáo cuối phiên.

## Prompt bàn giao (dán vào phiên mới)
Bạn tiếp tục dự án Diệu Giang Tự (https://github.com/tp9sach-ops/duanchuaon, nhánh main). Quy tắc: For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff. Đọc docs/PHIEN171.md (và 168), clone repo, chạy `npm test`. Khi Gp nói "tiếp tục": làm mục 4 của prompt chiêu thức 3D (VFX 6 lớp: lõi sáng, ribbon trail, decal nền, tàn dư; lấy màu từ `mauChieu(id)` trong `js/data/chieuMau.js`); hỏi Gp chuyện ngưỡng 0,4/0,8 s. Xong thì chạy test, viết docs/PHIEN172.md, đẩy main, báo Gp và chờ "tiếp tục".
