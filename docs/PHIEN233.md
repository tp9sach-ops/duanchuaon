# Phiên 233 — Chổi: làm theo 6 mục, từng mục một

Nguồn yêu cầu (ptg): 1 sửa chổi bị mờ · 2 dép lào khi dùng chổi · 3 đòn 3 đập bằng ĐẦU chổi + 3 cơn gió lốc, đánh 9 cái ra cơn lốc to từ sau lưng đi tới gây sát thương · 4 chổi phát sáng cả cây xanh lá nhạt · 5 hiệu ứng lá/rơm/bụi · 6 sát thương chổi 3%, gậy như ý 5%, gậy dạy chó 4% (chổi có lốc lan nhiều hơn).

## Mục 1 — XONG: chổi bị mờ
- Nguyên nhân: `js/ui/broomFx.js` hạ `opacity` trên `root.traverse(...)`, nhưng `root.clone(true)` của GLB chổi DÙNG CHUNG chất liệu với chổi cầm tay/cưỡi → sau đòn 3 cây chổi cầm tay bị mờ (có lúc tàng hình).
- Sửa: mỗi cú đập clone chất liệu RIÊNG (`ownMaterials`), chỉ chỉnh opacity bản riêng, hủy khi xong (`disposeSlam`). Chất liệu dùng chung không bị đụng.
- Test: `tests/broom233.test.mjs` (đã đăng ký package.json). npm test: 1468/1468 đạt. sw VERSION → dgt-v218.
- CHƯA nhìn bằng mắt trên máy thật.

## Mục 2 — XONG: đôi dép lào khi dùng chổi
- Mới: `js/ui/slipperMesh.js` (đế xanh lá, quai chữ V + núm kẹp ngón màu trắng; gắn vào xương `footL`/`footR`, tìm theo tên nên KHÔNG phải sửa `avatarChibi.js`).
- Người chơi: `js/ui/items.js` (`broomOn()` → mang, đổi vũ khí → tháo; chỗ nhớ gắn theo từng nhân vật `av.__slip`). Người khác: `js/ui/remoteGear.js` (cờ chổi `c` hoặc cưỡi `u` → mang; `drop()` → tháo). Không thêm gói mạng.
- Test: thêm vào `tests/broom233.test.mjs` (kiểm đấu nối). Kích thước/vị trí dép là số TẠM (`SLIPPER`), CHƯA nhìn bằng mắt trên máy thật.

## Còn lại (làm tiếp theo thứ tự): mục 3 → 6.
