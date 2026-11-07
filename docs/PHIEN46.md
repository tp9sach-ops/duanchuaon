# PHIÊN 46 — Rà soát toàn repo + sửa lỗi tải nhầm thư mục (giao diện Câu cá chưa chạy được) — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

**Người dùng (ptg = Giang):** nói tiếng Việt, không rành kỹ thuật → trả lời NGẮN, DỄ HIỂU, làm TỪNG MỤC, xong báo, chờ "tiếp tục". Yêu cầu Phiên 46: "xem repo kỹ, phân tích, hiểu rõ, làm tiếp những thứ còn thiếu".
**Repo:** https://github.com/tp9sach-ops/loinhuan.github.io (`main`, lúc đọc `1c8998b`). Đọc theo thứ tự: `PROMPT.md` → `docs/KE_HOACH_TONG.md` (MỚI) → file này → `docs/PHIEN45.md`, `PHIEN44.md`, `PHIEN41.md`. `HANDOFF.md` gốc đã cũ.

## Phát hiện (đã kiểm bằng mã thật)
1. **Lỗi chính:** lượt tải lên cuối của Phiên 45 (commit `1f4f3b3`) đặt 3 file SAI thư mục: `js/fishing.js`, `js/hudMenu.js`, `js/menuLogic.js` (đúng ra là `js/ui/...`). Hậu quả: `js/ui/fishing.js` không tồn tại; `js/ui/hudMenu.js` và `js/ui/menuLogic.js` vẫn là bản CŨ (không có nút Câu cá, không gọi `initFishing`); trong bản để sai chỗ, `import '../world/fishing.js'` trỏ ra ngoài `js/` nên hỏng. → **Trong game không có gì về Câu cá**, và `npm test` đỏ 2 test (#16 ENOENT `js/ui/fishing.js`, #17 thiếu nút `cauca`) → CI Pages sẽ đỏ.
2. `docs/KE_HOACH_TONG.md` (mà `docs/PORMT TỔNG` nhắc) chưa tồn tại → đã tạo ở phiên này, đã đối chiếu trạng thái từng mục với mã thật.
3. `PROMPT.md` mục 7 chỉ ghi tới Phiên 43 → đã bổ sung Phiên 44–46.
4. Còn lỗi nhỏ: `js/world/minimap.js` dòng 70 vẽ hồ cá `x: 56` (đúng `KOI.x = 60`).
5. Chưa có: cảnh 3D câu cá (3c), nhiệm vụ câu cá/phóng sinh (3e), `LGT.act('cau'|'phongsinh')`, reward 'lay'.

## ĐÃ LÀM (Phiên 46)
- Chuyển về đúng chỗ (nội dung giữ nguyên, không sửa dòng nào): `js/fishing.js` → `js/ui/fishing.js` (MỚI); `js/hudMenu.js` → `js/ui/hudMenu.js` (ghi đè bản cũ); `js/menuLogic.js` → `js/ui/menuLogic.js` (ghi đè bản cũ). **Xóa 3 file lạc ở `js/`** (`js/fishing.js`, `js/hudMenu.js`, `js/menuLogic.js`).
- Kiểm dây nối: `hudMenu.js` import + gọi `initFishing(hud,{toast})`, nhánh `fish` mở `LGT.fishing.open('cast')`; `menuLogic.js` có nút `cauca` + `pressResult` trả `fish`; `css/fishing.css` đã link trong index.html; API được gọi đều có thật (`LGT.merit.spendLa/reward/leaf.la`, `LGT.world.pos`, `LGT.inHouse`).
- `npm test`: **575/575 đạt (Node 22)** sau khi chuyển file (trước đó 2 test đỏ). Node 20 chưa chạy lại.
- MỚI `docs/KE_HOACH_TONG.md`, MỚI `docs/PHIEN46.md`, SỬA `PROMPT.md` (mục 7).

## CHƯA KIỂM ĐƯỢC
- Giao diện Câu cá trên trình duyệt thật/điện thoại thật (không có WebGL ở đây; chỉ có test logic + kiểm nhập đúng hàm). ptg xem: nút Câu cá có hiện ở cụm phải-trên, nút nổi có che nút khác không, bấm Thả/Bấm!/Thu cá/Phóng sinh có chạy.
- `sw.js` đang `dgt-v52` (đã tăng ở Phiên 45); khi ptg tải bản mới có thể cần tải lại cứng 1 lần.
- Đẩy GitHub: xem mục dưới.

## GIẢ ĐỊNH ptg chưa duyệt (giữ nguyên từ Phiên 44/45)
Độ bền 20/30/45/70/100; may 1/1,4/2/3/4,5; cửa sổ hoa sen 0,5→0,9 s; sửa = 1/5 giá; phóng sinh +1..3 hạt sen, trần 10 lần/ngày; ao tối đa 30; không có cầu miễn phí (cầu rẻ nhất 30 lá = 300 hạt sen). Hỏi ptg có tặng 1 cầu gỗ không.

## VIỆC KẾ (mỗi việc xong báo, chờ "tiếp tục") — theo docs/KE_HOACH_TONG.md
1. **1.4 (3e) Nhiệm vụ + hướng dẫn câu cá/phóng sinh** (nhỏ, nên làm ngay vì làm cho người chơi biết cách chơi).
2. **1.2 (3c) Cảnh 3D câu cá** `js/scene/fishing.js`.
3. 1.5 reward Lạy Phật; 2.1 sửa minimap x:56→60; 2.2 chạy test nhiều lần.
Quy tắc: logic có test; đổi giao diện thì tăng `VERSION` trong `sw.js`; quét bí mật; đẩy GitHub; viết `docs/PHIEN47.md`.

## Quy trình đẩy GitHub
Công cụ GitHub trong sandbox thường chỉ đọc/403 khi ghi → giao zip `cap-nhat-phien46.zip` (đúng đường dẫn, trùng tên ghi đè). **ptg nhớ XÓA TAY 3 file lạc nếu chúng còn trên GitHub: `js/fishing.js`, `js/hudMenu.js`, `js/menuLogic.js`** (zip chỉ ghi đè/thêm, không xóa được).

## File thay đổi phiên này
js/ui/fishing.js (mới, = nội dung js/fishing.js cũ), js/ui/hudMenu.js (ghi đè), js/ui/menuLogic.js (ghi đè), docs/KE_HOACH_TONG.md (mới), docs/PHIEN46.md (mới), PROMPT.md (thêm mục 7). XÓA: js/fishing.js, js/hudMenu.js, js/menuLogic.js.
