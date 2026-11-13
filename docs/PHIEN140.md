# Phiên 140 — Sửa lỗi "vào giao lưu không có nút đánh thường và kỹ năng" (xong mục 1 của danh sách 3 mục 13/11)

Quy tắc ptg (chép nguyên văn): For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff.

## Danh sách 3 mục ptg giao ngày 13/11 (làm từng mục, xong mục nào đẩy GitHub mục đó rồi báo để ptg nói "tiếp tục")
1. ✅ **Sửa lỗi khi vào giao lưu (Võ đài) không có nút Đánh thường và các kỹ năng** — XONG ở Phiên 140 (xem dưới).
2. ⏳ **Triển khai phó bản** (ý ptg, chép đủ để phiên sau không phải hỏi lại): đi đến các địa điểm sẽ gặp NPC; chọn phó bản → tới khu rừng hoặc kiến trúc khác toàn quái và thử thách. Quái theo cấp độ; sau khi thu phục quái xong, quái HỒI SINH mạnh hơn và TO hơn quái trước (trâu hơn, sát thương cao hơn theo từng lượt). Sau **9 lượt hồi sinh** xuất hiện **boss chính** to hơn, mạnh hơn; thu phục hoàn tất thì RƠI NHIỀU VẬT PHẨM. Khi vào phó bản thì hiển thị RIÊNG, không nằm trong map chính. Khi trở về map chính, phó bản đã chinh phục sẽ MẠNH HƠN ở lần quay lại sau.
3. ⏳ **Mảnh ghép boss → linh thú**: thu phục boss chính của phó bản thì người chơi có trong túi **hồ lô** một mảnh ghép yêu quái đó; chinh phục 3 lần được 3 mảnh; bấm chức năng "ghép" thì boss đó vào hồ lô làm **linh thú**; người chơi gọi ra, CƯỠI và dùng boss chiến đấu. Kỹ năng của boss TƯƠNG TÁC với người chơi: boss có hồi máu → hồi máu cho người chơi; hồi chiêu → hồi chiêu cho người chơi; tạo giáp → giáp cho người chơi; trói chân / làm chậm / đóng băng / hất tung → tác dụng lên các quái khác.

## Mục 1 — NGUYÊN NHÂN GỐC và cách sửa
**Triệu chứng:** vào Võ đài giao lưu (js/ui/duel.js) thanh 4 nút Đánh thường J / Chém khí K / Thiết đầu công L / Hộ thân U không thấy đâu.

**Nguyên nhân (đo bằng Chromium thật, không phải đoán):** `css/donate.css` có quy tắc `.cd { position:absolute; left:50%; top:max(64px,…); transform:translateX(-50%); z-index:8; … }` — đó là khung **công đức** (`js/ui/donate.js` đặt `class="cd"`). Võ đài lại dùng **chính tên class `cd`** để làm mờ nút khi hồi chiêu / chưa vào trận (`btns[k].classList.toggle('cd', cd > 0 || eng.phase !== 'fight')`). Mọi lúc ở pha chờ đối thủ / đếm ngược / hồi chiêu, cả 4 nút bị gắn `cd` → bị `position:absolute; top:64px` hất ra khỏi thanh (thanh co về 0×0), **chồng lên nhau ở cùng một toạ độ và nằm DƯỚI đáy màn hình** (đo được: cả 4 nút cùng `[164, 830, 62, 62]` trên màn 390×780).

**Cùng lỗi ở cụm nút chính (dock):** `js/ui/dock.js` cũng bật class `cd` khi nút hồi chiêu; `.dk-b{position:relative}` thắng `position` nhưng `top:64px` của `.cd` vẫn làm nút Đánh thường/Thương/Chém khí/Thiết đầu công **lệch xuống 64 px** mỗi lúc hồi chiêu. Đã sửa luôn.

**Sửa (đổi tên class, không đụng khung công đức):**
- `js/ui/duel.js`: `cd` → `dl-cd` (CSS `.dl-btn.dl-cd{opacity:.45}` và `classList.toggle('dl-cd', …)`).
- `js/ui/dock.js` + `css/dock.css`: `cd` → `on-cd` (`.dk-b.on-cd::after{opacity:1}`).
- `js/ui/yeuquai.js`: `here()` thêm `mapAvailable(LGT.zones)` (nhập từ `js/world/minimap.js`) → yêu quái hằng tháng CHỈ ở zone hub. Trước đó, khi đang trong Võ đài mà có yêu quái hoạt động, cụm nút chính hiện thêm Đánh thường/Thương/Chém khí (đánh yêu quái ở hub) chen với 4 nút của Võ đài. Giờ trong Võ đài cụm nút chính chỉ còn **Nhảy + Túi đồ** (Nhảy vẫn dùng để lướt né chiêu).
- `sw.js`: `dgt-v137` → `dgt-v138`.

## Kiểm chứng
- `npm test`: **1081/1081 xanh** (chạy thật). Thêm `tests/classclash.test.mjs` (3 test, đã nối vào `package.json`): quét mọi `classList.toggle/add('…')` trong `js/ui/*.js` và báo lỗi nếu class đó trùng một quy tắc `.tên{position:absolute|fixed}` trong `css/*.css`; khi bỏ bản sửa thì test này **đỏ đúng 2 chỗ** (`dock.js`, `duel.js`) — đã thử.
- **Chromium thật** (WebGL phần mềm, 390×780): `tools/shot/e2e-vodai.cjs` (MỚI, có trong README của `tools/shot`) giả một lời mời giao lưu, bấm Chấp nhận, vào Võ đài, rồi kiểm: đủ 4 nút · nằm trong màn hình · bấm trúng (không bị lớp khác đè) · 4 chỗ khác nhau (x = 56, 128, 200, 272) · cụm nút chính = `nhay,tui` · không lỗi script → **7/7 đạt**. Trước khi sửa: cả 4 nút cùng toạ độ, `top` 830 > chiều cao màn 780.
- Ảnh chụp lúc Võ đài đang ở pha "chờ đối thủ": 4 nút hiện ở đáy màn hình (đang mờ vì chưa đánh được — đúng thiết kế).

## CHƯA kiểm (nói thẳng)
- Chưa thử bằng **hai máy thật** qua Firebase/Apps Script (môi trường AI không có): chỉ giả gói mời. Pha đánh thật (nút sáng lên, hồi chiêu hiện số, đỡ/né) chưa thấy bằng mắt — nhưng bố cục và class đã đúng.
- Nút trong Võ đài rộng 62 px, chữ "Đánh thường" xuống 2 dòng trong nút; nếu ptg thấy chật thì chỉnh `.dl-btn` (js/ui/duel.js, dòng CSS gần đầu file).
- Trên màn rất hẹp (< 340 px) thanh 4 nút (4×62 + 3×10 = 278 px) vẫn vừa nhưng sát mép; chưa có máy thật để thử.

## Việc kế: MỤC 2 — phó bản (từ bước 4c; 4a + 4b đã xong ở Phiên 139)
Trạng thái phó bản (chi tiết ở `docs/PHIEN139.md`, `docs/PHIEN138.md`):
- 4a ✅ lõi logic: `js/data/dungeons.js` (4 phó bản `rungmoc`, `hangkim`, `hothuy`, `thaptho`; 9 lượt; hệ số TẠM) + `js/world/dungeon.js` (`loadDungeon`, `enter`, `onKill`, `leave`, `waveMobs`, `mobStats`, `rewardFor`, `clearFactor`, `waveFactor`) + `tests/dungeon.test.mjs`.
- 4b ✅ zone + cảnh 3D riêng: `js/world/zoneDungeon.js`, `js/scene/dungeon.js`, `js/ui/dungeonZones.js` → `LGT.dungeonZones = { enter(id), leave(), inside }` (CHƯA nhìn bằng mắt). Phó bản KHÔNG hiện trong map chính (zone riêng `pb-<id>`).
- **4c ⏳ (làm tiếp):** NPC ở các địa điểm + bảng chọn phó bản → gọi `LGT.dungeonZones.enter(id)`; đổi điểm quay về `tu-pho-ban` ở hub sang chỗ NPC. Dùng cơ chế NPC có sẵn (`js/world/npc*`, `js/scene/npc*`, test `tests/npc.test.mjs`) và cách Võ đài đăng ký zone (`js/world/zoneRuntime.js`, `js/world/zoneVoDai.js`, `js/ui/zoneGate.js`).
- **4d ⏳:** đặt quái thật trong zone phó bản (`mobSpot`), nối `dungeon.enter/onKill/leave`, `LGT.addXp`/`settleKill`, lưu `lgt.dungeon` (lượt đã chinh phục), hiển thị lượt/boss, rơi vật phẩm khi boss gục; nhớ: trong zone phó bản yêu quái hằng tháng và quái bãi rừng không hoạt động (`mapAvailable` đã chặn yêu quái; `farm.js` đã dùng `mapAvailable`).
- Mục 3 (mảnh ghép → linh thú hồ lô) làm SAU khi mục 2 xong.

## Prompt khởi động cho phiên mới (dán nguyên văn)
> Đọc `docs/PHIEN140.md`, `docs/PHIEN139.md`, `docs/PHIEN138.md`. Chỉ xem các chỗ cần sửa, không đọc hết repo, cập nhật không lỗi. Mục 1 (lỗi nút Võ đài) đã xong. Làm MỤC 2 — phó bản — từ bước 4c (NPC + bảng chọn phó bản, gọi `LGT.dungeonZones.enter(id)`; lõi `js/world/dungeon.js` và zone 4b đã xong), rồi 4d (quái trong zone, lưu `lgt.dungeon`, thưởng); sau đó mục 3 (mảnh ghép boss → linh thú trong hồ lô, cưỡi, kỹ năng boss tương tác). Làm TỪNG BƯỚC NHỎ, `npm test` phải xanh, nhìn giao diện bằng `tools/shot` khi có thể, đẩy GitHub rồi báo; cuối phiên viết `docs/PHIEN141.md` kèm prompt bàn giao và chép nguyên văn quy tắc bàn giao ở trên.
