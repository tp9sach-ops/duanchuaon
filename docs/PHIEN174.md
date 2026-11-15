# PHIÊN 174 — Bàn giao (prompt "chiêu thức 3D chuyên nghiệp": mục 6 — kẻ địch trúng đòn + trạng thái nhìn thấy được)

> Repo: https://github.com/tp9sach-ops/duanchuaon (nhánh `main`). Gp nói tiếng Việt: trả lời NGẮN GỌN, DỄ HIỂU, làm TỪNG MỤC, xong đẩy GitHub, báo, chờ "tiếp tục". Đọc thêm `docs/PHIEN173.md`, `docs/PHIEN172.md`, `docs/PHIEN171.md`, `docs/PHIEN168.md` (danh sách 11 mục).

## Quy tắc làm việc (chép nguyên văn)
"For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff."

## Hiện trạng 11 mục "Nộp theo thứ tự" (prompt chiêu thức 3D, mục 14)
1. Thẻ chiêu + dòng thời gian ms — XONG (167). 2. Bảng màu + phác thảo — XONG (168). 3. Hoạt ảnh 4 khung — XONG mã + nối nhân vật (171; thiếu clip, xương áo/đai/tóc). 4. VFX sáu lớp — XONG (172; chưa nhìn bằng mắt). 5. Kho âm thanh + giấy phép — XONG tiếng hiệu ứng (173); CHƯA có giọng hô nhân vật (cần người thu).
6. **Hoạt ảnh trúng đòn + trạng thái kẻ địch — XONG phiên này (logic + dựng hình + nối khu Luyện chiêu); xem dưới.**
7. Clip 5 giây ở ba cảnh — cần mắt người. 8. File JSON số liệu — chưa. **MỤC KẾ TIẾP: 9** (điều khiển + camera: mục 10, 10A, 11 — nối `onShake`/`onHitStop` vào camera thật; Tuyệt học đóng khung chậm). 10. 12 combo + 5 tình huống khắc chế — chưa. 11. Báo cáo cân bằng — chưa.

## Mục 6 — đã làm gì
- `js/world/chieuTrung.js` (logic thuần): `MUC` ba mức (nhẹ: giật 80–120 ms, số trắng · vừa: lùi 0,3–0,8 m, khựng 40–60 ms, số vàng · nặng: lùi 1–3 m/ngã, khựng 80–120 ms, rung, sóng chấn, âm nặng, số đỏ); `mucTrung` (chiêu 4/tuyệt học/chí mạng/kết liễu = nặng, đòn nhỏ = nhẹ, còn lại vừa); `huongTrung` (trước/sau/trái/phải/trên không; vector giật NGƯỢC hướng đòn); `phanUngTrung` (kế hoạch giật + lùi + khựng + khóa hoạt ảnh `trung-<mức>-<hướng>` = 15 bộ; boss ×0,3 lực đẩy và không ngã; lơ lửng lùi ≤ 0,35 m + xoay nhẹ); `chatLieuKeDich(idQuái)` (da thịt/kim loại/đá — để truyền cho `chieuFx.cast({chatLieu})` tiếng trúng) và `coKeDich`; `TRANG_THAI` bảy trạng thái (thiêu đốt, choáng, hất tung, trói chân, làm chậm, đóng băng 0,2 s phủ từ chân lên, mờ mắt) mỗi cái dấu hiệu + biểu tượng + màu riêng; `dongHoTrangThai` (vòng đếm ngược dưới chân, chỉ khống chế) + `hienKhang` (chữ "kháng" mờ dần theo cửa sổ 8 s của luật lõi) + `bieuTuongThanhMau`; `kieuSo`/`soNay` (số nảy parabol, phóng 120% rồi co, luôn ≥ 1,7 m trên chân); `hieuUngPhanUng` (5 phản ứng của luật lõi, 0,5 s + chữ nổi); `hieuUngChet` (tan theo Hệ chiêu kết liễu); `vongGiapPha` + `giayKhongCheBoss`; `trangThaiTuChieu(fx)` (khóa `fx` của chiêu → trạng thái, cắt theo trần luật lõi).
- `js/scene/chieuTrungFx.js` (dựng three.js): `createChieuTrungFx(scene, {getTier, onShake, onHitStop})` → `hit(target, {ax, az, id, damage, muc?, chiMang?, ketLieu?, nho?, trenKhong?})`, `phanUng(target, heA, heB)`, `status(target, loai, giay)`, `clear/dispose`. Mục tiêu = `{ g: Object3D, ry, co:'thuong'|'elite'|'boss', dai }`. Gồm giật/lùi/nghiêng-ngã rồi về chỗ cũ, tia lóe, sóng chấn (bỏ ở bậc `yeu`), số sát thương bằng Sprite canvas, aura + biểu tượng chữ + vòng đếm ngược (cung tròn co dần). Mọi lỗi bị nuốt.
- Nối: `js/scene/luyen.js` thêm `target(i)`; `js/ui/luyenChieu.js` dùng `ctfx.hit` + trạng thái của chiêu lên mộc nhân (số sát thương = số mẫu `r.dmg`), chưa có thì quay về nháy cũ `hooks.hit`. `sw.js` = `dgt-v166`; `package.json` thêm `tests/chieutrung.test.mjs` (11 test).
- Kiểm dựng hình bằng three.js thật (không WebGL, giả lập khung hình, script tạm không đưa vào repo): 3 bậc máy × (4 kiểu trúng, 7 trạng thái, phản ứng Hệ, boss, dispose giữa chừng) → vật thể về chỗ cũ, scene dọn sạch, khựng tối đa 100 ms.

## Chưa làm / cố ý để lại
- CHƯA nhìn bằng mắt: cỡ tia lóe/aura/chữ, độ nghiêng ngã, vị trí số là số TẠM; Gp vào Luyện chiêu đánh mộc nhân rồi báo cái nào xấu/lệch để chỉnh ở `chieuTrungFx.js` / `chieuTrung.js`.
- Mới nối vào MỘC NHÂN ở Luyện chiêu. CHƯA nối vào quái thật (`js/scene/yeuquai.js`, `farm.js`), võ đài (`voDai.js`) và người chơi khác: cần mỗi nơi cung cấp `target` (Object3D + `co` + `dai`) và gọi `hit`/`status`; truyền `chatLieu: chatLieuKeDich(idQuái)` vào `cfx.cast`.
- Hoạt ảnh trúng riêng 15 bộ mới là KHÓA + giật/nghiêng chung theo hướng (mộc nhân là khối cứng); quái/nhân vật có xương cần ánh xạ khóa `trung-*` sang clip thật.
- Hất tung chưa có chiêu nào khai báo trong `fx`, nên chưa có chiêu thực sự gọi `status(...,'hatTung')`; chữ "kháng" và đồng hồ mới có hàm logic, chưa vẽ ("kháng" cần nơi giữ bộ đếm khống chế — `createKhang` trong `luatChien.js`).
- Khựng hình/rung màn: `onHitStop`/`onShake` của `ctfx` còn là callback rỗng ở Luyện chiêu; nối vào camera ở mục 9.
- Ngưỡng báo trước 0,4/0,8 s (treo từ Phiên 167) chưa quyết. Phiên 170: Gp phải dán lại `gas/Accounts.gs` vào Apps Script, Deploy → New version. Giọng hô nhân vật: Gp thu hoặc cung cấp file có giấy phép rõ.

## Kiểm
`npm test`: 1211 đạt, 0 lỗi (trước khi sửa: 1193; thêm 11 test chieutrung + các test chiêu đã có). Chạy mất ~3,5 phút nên cần chạy nền.

## Prompt bàn giao (dán vào phiên mới)
Bạn tiếp tục dự án Diệu Giang Tự (https://github.com/tp9sach-ops/duanchuaon, nhánh main). Quy tắc: For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff. Đọc docs/PHIEN174.md (và 173, 172, 171), clone repo, chạy `npm test` (mất vài phút; chạy nền kèm timeout). Khi Gp nói "tiếp tục": làm mục 9 của prompt chiêu thức 3D (điều khiển + camera: mục 10 nút/cử chỉ/bộ đệm lệnh/nhắm, mục 10A nhảy + Khinh Thân + kiến trúc đứng lên được, mục 11 camera theo vai/khóa mục tiêu/đẩy gần theo chiêu/khựng hình/rung có công tắc giảm chuyển động; nối `onShake`/`onHitStop` của `chieuFx` và `chieuTrungFx`); hỏi Gp chuyện ngưỡng 0,4/0,8 s và việc thu giọng hô. Xong thì chạy test, viết docs/PHIEN175.md, đẩy main, báo Gp và chờ "tiếp tục".
