# PHIÊN 40 — Sửa L3 (tiếng mưa trong nhà) + L4 (vị trí trong nhà gửi lên mạng) (BÀN GIAO)

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

**Nền:** `main` @ `f81e180` (đọc thật bằng `git clone` 07/11/2026). `npm test` **534/534 đạt trên Node 22 VÀ Node 20** (trước phiên: 533). `sw.js` VERSION = `dgt-v46`.
**Cách làm (ptg):** từng mục nhỏ → giao/đẩy file → báo → chờ "tiếp tục". Bản chuẩn của tài liệu: `PROMPT.md` + `docs/PHIEN3x/4x.md` (HANDOFF.md ở gốc đã cũ, chỉ tới Phiên 14a).

## 1. ptg yêu cầu
"Xem repo, đọc kỹ, phân tích, hiểu rõ, thực hiện tiếp những thứ còn thiếu." → đã đọc PROMPT.md, PHIEN34/38/39, README, cây thư mục, 30 commit gần nhất, rồi làm đúng thứ tự kế hoạch của Phiên 38: **A3 → B1**.

## 2. Hiện trạng đã xác minh (không suy đoán)
- Nhánh: `main`, `am-thanh-nen`. 30 commit gần nhất: ptg tải tay nhiều file ngày 07/11 (đổi tên `sw (n).js` → `sw.js`), Claude commit Phiên 39 (`51003ec`, `f81e180`).
- Phiên 39 đã có: bản đồ mini/lớn (phím M), sổ tay "?", gợi ý việc kế tiếp, 3 nhiệm vụ đổi lá/mua đất/nâng nhà, vá CI (L1, L2).
- Lỗi còn lại trước phiên này: **L3** (`js/ui.js` là bản cũ, bản đúng nằm nhầm ở `js/ui/ui.js`), **L4** (vị trí trong phòng (400,400) bị gửi lên mạng).

## 3. Đã làm
- **A3 / L3:** `js/ui.js` thay bằng nội dung `js/ui/ui.js` (khác đúng 1 dòng: tiếng mưa tắt khi `LGT.inHouse`). `js/ui/ui.js` đã bị xóa khỏi bản làm việc (xem mục 5 nếu GitHub không cho xóa).
- **B1 / L4:** thêm `netPos(land, p)` vào `js/world/interior.js`; `js/net/room.js` (`getSelf`) dùng nó: đang ở trong phòng thì gửi **vị trí trước cửa nhà** (`exitPlan`, tư thế `idle`, hướng nhìn ra đường), luôn trong ±200. Ở ngoài giữ nguyên. Chọn "đứng ở cửa nhà" (mặc định của Phiên 38 mục 4 câu 4); nếu ptg muốn **ẩn hẳn** khi ở trong nhà thì đổi `getSelf` trả `null` khi `LGT.inHouse`.
- `tests/interior.test.mjs` +1 test (`netPos`). `sw.js` → `dgt-v46`.

## 4. File thay đổi (đường dẫn repo, trùng tên ghi đè)
Sửa: `js/ui.js`, `js/net/room.js`, `js/world/interior.js`, `tests/interior.test.mjs`, `sw.js`, `PROMPT.md` (1 dòng mục 7).
Mới: `docs/PHIEN40.md`.
Xóa: `js/ui/ui.js`.

## 5. Chưa kiểm được / còn lại (nói thật)
- Chưa mở Chromium/điện thoại thật: chưa nghe thử "trong nhà hết tiếng mưa", chưa thấy hai tab thấy nhau khi một người vào nhà (logic đã có test, chưa thử Firebase/GAS thật).
- Còn file lạc ở gốc, ptg xóa tay khi đồng ý: `landscape.js` (bản cũ), `phien26.patch`, `PHIEN31.md`, `PHIEN33.md` (bản chuẩn trong `docs/`).
- **Chưa làm:** B2 (3d-2d: chạy Chromium chụp 4 cấp nhà, kiểm nút "Vào nhà" trên điện thoại), phóng sinh (cần ptg chốt luật), C nội thất, D tham quan + tiệc (+ nhánh `houses/` Firebase), E máy chủ xác nhận giao dịch lá, F các việc cũ (bình tưới + cây bồ đề lớn, khinh công, bơi/thả cá, cấp/xếp hạng, thời trang, xe, MoMo, đo FPS).

## 6. Câu hỏi cho ptg (chưa trả lời; mặc định ghi sau mỗi câu)
1. **Phóng sinh** ở Hồ cá: mỗi lần thả tốn gì? được mấy hạt sen? trần mỗi ngày? (mặc định đề xuất: thả 1 cá = 1 lượt, +1 hạt sen, tối đa 10/ngày).
2. **Nội thất** (mục C): ~30 món đầu, chạm chọn ô, giới hạn 20/40/60/80 món theo cấp nhà — đồng ý không?
3. Pages Source đang là "GitHub Actions" hay "từ nhánh main"? Tab Actions xanh hay đỏ?
4. Cho phép xóa 4 file lạc ở gốc không?

## 7. Phiên sau (từng mục, chờ "tiếp tục")
Đề xuất: B2 (chụp 4 cấp nhà trong Chromium) → phóng sinh (khi có luật) → C nội thất → D tham quan/tiệc → E máy chủ xác nhận → F.

## Prompt bàn giao (dán nguyên văn vào phiên mới)
```
Dự án DIỆU GIANG TỰ. Repo: https://github.com/tp9sach-ops/loinhuan.github.io
Đọc PROMPT.md, rồi docs/PHIEN40.md (mới nhất), docs/PHIEN38.md (kế hoạch B2–F), docs/PHIEN39.md. HANDOFF.md ở gốc đã cũ.
Phiên 40 xong: L3 (js/ui.js đúng bản, tiếng mưa tắt trong nhà), L4 (netPos: trong nhà gửi vị trí cửa nhà lên mạng). npm test 534/534 trên Node 22 và 20. sw dgt-v46.
Chưa làm: B2 (Chromium chụp 4 cấp nhà), phóng sinh (chưa có luật), C nội thất, D tham quan/tiệc, E máy chủ xác nhận, F.
Làm TỪNG MỤC NHỎ, xong giao/đẩy file đúng đường dẫn (trùng tên ghi đè), báo, chờ tôi nói "tiếp tục". git clone repo, sửa, chạy npm test trên Node 22 VÀ Node 20 (npx -y -p node@20 -- npm test).
Tôi nói tiếng Việt thường ngày. Cuối mỗi mục: viết lại prompt bàn giao này + đính kèm docs/PHIEN40.md đã cập nhật.
```
