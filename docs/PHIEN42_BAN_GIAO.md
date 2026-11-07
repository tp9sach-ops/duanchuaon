# PHIÊN 42 — Bàn giao (đọc hết file này rồi mới làm)

> after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

**Người dùng (ptg = Giang):** nói tiếng Việt, không rành kỹ thuật → trả lời NGẮN, DỄ HIỂU, LÀM TỪNG VIỆC NHỎ MỘT, xong chờ ptg bấm "tiếp tục". Sửa code: đưa đoạn "tìm" đầy đủ + code thay thế đầy đủ, hoặc gửi cả file.
**Repo:** https://github.com/tp9sach-ops/loinhuan.github.io (nhánh `main`, commit mới nhất lúc đọc: `7b83d52`). Đọc `PROMPT.md`, `HANDOFF.md`, `docs/PHIEN41.md` trước. Sandbox clone được repo nhưng KHÔNG đẩy lên được → gửi file, ptg tải lên tay (trùng đường dẫn thì ghi đè).

## Việc 1 (XONG): 4 file ptg gửi lưu ở đâu
| File ptg gửi | Đường dẫn trong repo (ghi đè) |
|---|---|
| `merit (1).js` (logic thuần, có `claimAct`, `ACT_CAP`) | `js/world/merit.js` |
| `merit.js` (giao diện, có `reward`) | `js/ui/merit.js` |
| `den.js` (nhang/đèn dùng `LGT.merit.reward`) | `js/ui/den.js` |
| `merit_test.mjs` | `tests/merit.test.mjs` |

Tình trạng: 4 file này là bản **Phiên 41 bước 5** (công đức lạy/cúng/nhang, trần 10 lần/ngày mỗi loại). Repo hiện vẫn là bản cũ (grep `claimAct|ACT_CAP` = 0 trong cả 4 file) → ptg CHƯA tải lên. `tests/merit.test.mjs` đã có trong `package.json`, không cần thêm. `sw.js` đang `dgt-v47` → khi giao bản có giao diện nên tăng lên `dgt-v48`.
Còn thiếu sau khi tải: nguồn `lay` (Lạy Phật) chưa nối — `menuLogic.js` có mục `lay` (action `bow`) nhưng chưa nơi nào gọi `LGT.merit.reward('lay', n)`. Nhang (`den.js`) và đèn (`den.js`) đã gọi.

## Danh sách việc ptg yêu cầu (làm lần lượt, mỗi lần 1 việc)
1. ✔ Các file lưu ở đâu (bảng trên).
2. ✔ XONG (chờ ptg tải lên + xem thử): không gian nhà rộng gấp 3 lần. Đã hiểu là DIỆN TÍCH ×3 (mỗi chiều ×√3): lv0 9,7×8,3 · lv1/2 11,8×9,7 · lv3 14,9×10,4 (cũ 5,6×4,8 / 6,8×5,6 / 8,6×6,0), trần cao thêm 0,3–0,4 m, thêm 2 cửa sổ, đèn tỏa xa hơn. Nếu ptg muốn mỗi chiều gấp 3 thì phải sửa `isInterior` (±12) và `pad`. File: `js/world/interior.js`, `js/scene/interior.js`, `tests/furniture.test.mjs` (sửa test sofa vì phòng rộng chứa nhiều hơn), `sw.js` → `dgt-v48`. `npm test` 546/546 chạy lại sau sửa chỉ 2 file test liên quan (21/21). Chưa xem trên trình duyệt thật. Gốc cũ: vào nhà rồi → không gian rộng gấp 3 lần hiện tại (xem `js/world/interior.js` `ROOMS`, `js/scene/interior.js`, nhớ cập nhật va chạm `registerRoom`, `canPlace` trong `js/world/furniture.js`).
3. Vào nhà rồi → cửa tự đóng; chỉ khi đi tới cánh cửa mới hiện lối ra ngoài (`js/ui/house.js`).
4. Xem ảnh/hình vật phẩm trước khi mua (`js/ui/furni.js`, bảng Cửa hàng).
5. Nâng cấp hình ngôi nhà cho chi tiết, đẹp hơn (`js/scene/interior.js` và ngoại thất nhà).
6. Bấm vào vật phẩm → xoay bằng cách di chuột (xem trước 3D trong cửa hàng; có thể cả khi đặt trong nhà).
7. Thiết kế "Nhiệm vụ Tâm trí" Vipassana khi nhân vật ngồi thiền (thiền hiện chỉ cộng hạt sen: 3 phút = 1 hạt, tối đa 10/ngày, trong `js/ui/merit.js` + `js/world/merit.js`). Cần 3 phần: (a) cơ chế tương tác nhỏ trên bàn phím, (b) 3–4 câu lời dạy của Thầy (hơi thở tự nhiên, ghi nhận đau/mỏi không xua đuổi, vô thường Anicca), (c) phần thưởng sau 30 giây/1 phút. ptg gửi mẫu còn ô trống: thể loại game = thế giới mở 3D Phật giáo (Diệu Giang Tự), nhân vật = người chơi (khách vào chùa) — phiên sau hỏi ptg xác nhận nếu cần.

## Luật ptg đã chốt (07/11)
Số món nội thất tối đa theo cấp nhà 10/18/26/36; 10 hạt sen = 1 lá bồ đề; 100 lá = 1 lô đất; công đức từ thiền/lạy/cúng/nhang, mỗi nguồn trần theo ngày; nhà ban đầu trống. Chi tiết: `docs/PHIEN41.md`.

## Việc kế tiếp
Chờ ptg bấm "tiếp tục" → làm **việc 3** (cửa tự đóng khi vào nhà; chỉ hiện lối ra khi đi tới cánh cửa; xem `js/ui/house.js`, `atDoor`, `houseAction`, nút "Ra ngoài", cánh cửa trong `shell()` của `js/scene/interior.js`). Trước khi sửa: đọc `js/world/interior.js`, `js/scene/interior.js`, `js/ui/house.js`, `tests/interior.test.mjs`; chạy `npm test` (Node 22); không đoán, đọc code thật.
