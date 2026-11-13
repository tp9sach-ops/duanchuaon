# PHIÊN 132 — hoàn thiện mục 1: mở rộng map sát vách núi, càng sâu càng nguy hiểm (2026-11-13)

Quy tắc ptg (chép nguyên văn): For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff.

## Yêu cầu của ptg (13/11, làm tuần tự từng mục, xong mục nào đẩy GitHub rồi báo)
1. Mở rộng toàn map: sát vách núi, các rừng cây, chỗ nào cũng có quái; nơi càng sâu xa quái càng nguy hiểm (cấp cao hơn, máu trâu hơn, sát thương cao hơn). → **XONG** (Phiên 131 làm dữ liệu/logic, phiên 132 hoàn thiện).
2. Hạt sen KHÔNG ảnh hưởng sức mạnh; sức mạnh đến từ EXP/cấp, kỹ năng, cách cộng chiêu, đồ, vật phẩm. → **CHƯA LÀM — là việc kế tiếp.**

## Hiện trạng mục 1 (đối chiếu mã, không đoán)
- 8 vùng luyện (`FARM_ZONES` trong `js/data/monsters.js`): 4 vùng gần (`biaRungThong` 3–20, `duongMon` 12–25, `hoThac` 25–45, `doiBaoThap` 40–65, giữ số cũ) + 4 vùng sâu ở bốn góc sát vách núi: `vachTayBac` 72–95, `vachDongBac` 85–105 (độ sâu 2: máu ×1,5, công ×1,25), `vachTayNam` 100–120, `vachDongNam` 115–140 (độ sâu 3: máu ×2,2, công ×1,5). Mỗi vùng 1 quái thường + 1 tinh anh + 1 boss.
- Khoảng đất + lối 6 m: `js/world/outside.js` (`rung-sau-vach-*`, `loi-vach-*`), đi tới được từ đường làng (test BFS). Cảnh bụi/cỏ/cây/sương: `buildDeepWoods` trong `js/scene/outside.js`.
- Công thức: `oanKhiMaxOf` nhân `mul.hp`, `monsterStats.cong` nhân `mul.atk` (`js/world/spawn.js`).
- Cấp người chơi tối đa là 150 (Tu Vi 1..150, `js/data/stats.js`), nên cấp quái 72–140 nằm trong tầm.

## Phiên này làm thêm (sửa chỗ còn lệch sau Phiên 131)
- `js/world/minimap.js`: `WORLD_BOX` x −125…122 → **−140…140**. Lý do: vùng sâu tới x ±136, người đứng ở góc bị vẽ kẹp vào mép bản đồ.
- `js/world/tutorial.js` (chủ đề `hangyeu`, bước đầu): "bốn vùng luyện" → "tám vùng luyện, bốn vùng gần là…", thêm câu nhắc bốn vùng sâu, dải cấp 72–140 (đọc từ `FARM_ZONES`, không gắn cứng số), lời khuyên luyện đủ Tu Vi rồi hãy tới.
- `tests/vungsau.test.mjs` +1 test: mọi vùng luyện nằm trong khung bản đồ; hướng dẫn nhắc 8 vùng và dải cấp.
- `sw.js` VERSION = `dgt-v134`. `npm test` 1045 pass / 0 fail.

## Chưa làm / cần ptg quyết (không tự đổi vì ảnh hưởng cân bằng)
- **Thứ tự "sâu" của 4 vùng gần không đơn điệu theo khoảng cách từ cổng chùa:** `duongMon` xa ~110 m nhưng cấp 12–25; `hoThac` ~104 m cấp 25–45; `doiBaoThap` chỉ ~61 m nhưng cấp 40–65 (xếp theo hệ Ngũ hành/GDD, có từ trước). Bốn vùng góc thì đúng quy luật (xa hơn → mạnh hơn). Nếu ptg muốn đúng tuyệt đối "xa là mạnh", phải dời cấp của 4 vùng gần (kéo theo sửa `zones`, `spawn`, `hothac`, `farm*` test và EXP).
- Mọi con số (`mul`, dải cấp, cap 16/28) là TẠM, chờ ptg duyệt sau khi chơi thử.
- Chưa nhìn bằng mắt trong game (môi trường headless trước nay không nạp được `LGT`; cách dựng ở HANDOFF mục 11, server `python -m http.server 8765` chạy từ thư mục repo).
- Loại quái mới còn dùng chung mô hình dự phòng (giống Cướp Đường), chưa có mô hình riêng.
- Hai khoảng "bãi rừng thông" (`bai-rung`, có miếu + cổ thụ) và "bãi thác" (Đại Phật) cố ý KHÔNG có quái (điểm chụp hình, Phiên 119); khu chùa phía bắc (z<32) cũng không đụng.

## Việc kế tiếp (mục 2): hạt sen không ảnh hưởng sức mạnh
Hướng làm gợi ý (chưa làm):
1. Rà `js/world/strength.js` (`strengthOf` có thành phần √hạt sen) và mọi nơi gọi nó, `LGT.strength`, bảng xếp hạng (`rank`), công thức sát thương (`js/world/combat*.js`, `monsterAttack.js`), `js/world/stats.js` (đã cố ý KHÔNG dùng `strengthOf`, xem chú thích đầu file).
2. Chỉ giữ nguồn sức mạnh: EXP/cấp (Tu Vi), kỹ năng, cách cộng chiêu (combo), đồ, vật phẩm.
3. Hạt sen vẫn là công đức/tiền tệ chùa, chỉ không cộng vào sức mạnh; sửa chữ hướng dẫn nếu có chỗ nói sen tăng sức.
4. Thêm test: đổi số hạt sen thật lớn/nhỏ mà `strength`, sát thương, xếp hạng KHÔNG đổi.

## Prompt khởi động cho phiên mới (dán nguyên văn)
> Đọc `HANDOFF.md` mục "Phiên 130–132" và `docs/PHIEN132.md`. Chỉ xem các chỗ cần sửa, không đọc hết repo. Mục 1 (mở rộng map, càng sâu càng nguy hiểm) đã xong; hãy làm mục 2: hạt sen KHÔNG ảnh hưởng sức mạnh, sức mạnh đến từ EXP/cấp, kỹ năng, cách cộng chiêu, đồ, vật phẩm. Cập nhật không lỗi (`npm test` phải xanh), thêm test độc lập với sen, đẩy GitHub rồi báo; cuối phiên gửi bản bàn giao chi tiết và chép nguyên văn quy tắc bàn giao ở trên.
