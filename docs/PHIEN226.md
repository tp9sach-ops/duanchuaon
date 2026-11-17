# Phiên 226 — Mục 4: KIẾN TRÚC ĐỨNG ĐƯỢC + BẦU TRỜI BAY QUA — XONG mã, chờ ptg chơi thử

## Yêu cầu của ptg (2026-11-17, đợt "4 / 6 / 7")
- Mục 4: mọi kiến trúc nhìn thấy được đều bay lên / đứng lên được, không bị lún; bầu trời không vật cản thì bay qua được.
- Mục 6 (CHƯA làm): đồ họa, hình ảnh, đòn đánh, chiêu thức, phạm vi đánh, chiêu đánh của yêu quái.
- Mục 7 (CHƯA làm): người chơi ảo như người thật (tỷ thí, nhiệm vụ, câu cá, xây nhà, luyện cấp, đánh quái, học chiêu, phó bản, lá bồ đề); số lượng theo lệnh `/nguoichoiao` (mỗi lần nhắn thêm 1 người); tên ngẫu nhiên tự nhiên như người thật; tin nhắn bắt đầu bằng `/` chỉ người gõ thấy.
- Làm từng mục, xong đẩy GitHub rồi báo; việc nào làm rồi thì bỏ qua (Phiên 200/202 đã làm đứng trên nhà/đá/cây/tượng/tháp).

## Đã kiểm repo thật trước khi sửa
Phiên 200/202 đã có `top` (mặt đứng) cho nhà, đá, cây, tượng, tháp, cửa hàng. Còn thiếu: 54 vật tròn + 4 vật chữ nhật CHƯA có `top` (cột chính điện, nghê đá, cột cờ, trụ đèn, bàn thờ, bia rùa, bệ tượng, thành bậc, đồ trang trí 5 cửa hàng) nên chặn MỌI độ cao; và ĐỊA HÌNH (ranh giới/núi, ao sen, hồ, tường chính điện) cũng chặn mọi độ cao nên bay cao vẫn không qua được.

## Đã làm
| File | Việc |
|---|---|
| js/world/layout.js | Thêm `SKY` {water 0,35 · ridge 7 · wall 10,5 · limit 400}; `terrainTop(x,z)` (mặt đứng của địa hình chặn) + `terrainBlocked(x,z,feetH)`; `floorAt` tính cả mặt đứng địa hình; `blocked`/`bodyBlocked`/RING truyền `feetH`; `canStep`/`bodyBlocked`: chân cao ≥ sàn chính điện thì nhảy thẳng lên/xuống nền. Zone khác hub giữ nguyên (chặn mọi độ cao). Vùng đi bộ đăng ký ở xa (phòng trong nhà) vẫn đi được; chỉ NGOÀI mép thế giới (±400 m) mới chặn hết |
| js/world/standTops.js | Gắn `top` cho cột chính điện (đỉnh cột), nghê đá, cột cờ, trụ đèn, bàn thờ, đỉnh hương, bia rùa, thành bậc, bệ tượng, đồ cửa hàng; LƯỚI AN TOÀN: vật nào còn thiếu thì tự đặt `top` theo bán kính (`autoTop = true`) nên không còn vật nào chặn mọi độ cao |
| tests/sky225.test.mjs | 8 test: mọi vật có mặt đứng; cột; núi; ao; tường; nền chính điện; lao/lướt qua núi; thân người không kẹt. Đã đăng ký vào `npm test` |
| package.json, sw.js | thêm test; sw `dgt-v211` |

`npm test`: **1433/1433 xanh** (Node 22).

## Quy ước TẠM (ptg chỉnh được ở `SKY` trong layout.js + bảng trong standTops.js)
- Chân ở độ cao ≥ mặt đứng − 0,05 m thì bay/đi QUA PHÍA TRÊN và đáp xuống ĐỨNG (không lún). Thấp hơn vẫn bị chặn (không xuyên).
- Núi/vách ranh giới coi như có đỉnh cao 7 m (ai lên tới 7 m thì bay qua và đứng được trên đó); ao sen/hồ không bơi: mặt lá sen cao 0,35 m; mái tường chính điện cao 10,5 m.
- Ngoài mép thế giới ±400 m vẫn chặn.
- "Hạn chế đứng lên" trong yêu cầu được hiểu là hạn chế LÚN/XUYÊN (nếu ptg muốn nghĩa khác thì báo).

## CHƯA nhìn bằng mắt (không có WebGL trong môi trường AI) — ptg xem giúp
1. Bay lên đỉnh cột chính điện, bia, trụ đèn, đồ cửa hàng: chân có chạm đúng mặt, không lún/không lơ lửng?
2. Bay qua ao sen/hồ: đáp xuống đứng trên mặt lá sen có ổn không?
3. Núi/vách biên: độ cao 7 m có hợp với núi nhìn thấy không (núi cao hơn thì tăng `SKY.ridge`).
4. Ngoài mép bản đồ đứng trên "mặt núi" 7 m có thấy trống không (cân nhắc tường vô hình/giới hạn nhỏ hơn 400).

## Chưa làm / phiên sau
- Zone phó bản/vườn thử: vật cản thêm bằng `addToZone` chưa có `top` (giữ hành vi cũ: chặn mọi độ cao).
- Mục 6 (yêu quái) rồi mục 7 (người chơi ảo + lệnh `/nguoichoiao`, tin nhắn `/` chỉ người gõ thấy).
- HANDOFF.md và PROMPT.md mục 7 CHƯA ghi dòng Phiên 226 (hai file quá lớn để đẩy qua công cụ GitHub): phiên sau thêm 1 dòng trỏ tới file này.

## PROMPT BÀN GIAO CHO PHIÊN SAU (dán nguyên văn)
```
Repo: https://github.com/tp9sach-ops/duanchuaon (nhánh main). Đọc PROMPT.md rồi HANDOFF.md rồi docs/PHIEN226.md (mới nhất; số phiên không hoàn toàn tăng dần theo lịch sử commit, mã thật trong repo luôn đúng hơn tài liệu).
Việc: làm tiếp yêu cầu "4 / 6 / 7" của ptg (2026-11-17). Mục 4 ĐÃ XONG (Phiên 226) — bỏ qua trừ khi ptg báo lỗi đứng/bay.
Mục 6: nâng đồ họa, hình ảnh, đòn đánh, chiêu thức, phạm vi đánh của yêu quái (js/ui/yeuquai.js, js/world/monsterAttack.js, js/world/yqFx.js, js/ui/yqFx*; mọi hành động phải đồng bộ mạng theo docs/QUY_TAC_DONG_BO.md để người chơi khác cùng thấy).
Mục 7: người chơi ảo như người thật (tỷ thí duel, nhiệm vụ, câu cá, xây nhà, luyện cấp, đánh quái, học chiêu, phó bản, lá bồ đề); lệnh /nguoichoiao thêm 1 người ảo mỗi lần gõ; tên ngẫu nhiên tự nhiên kiểu người Việt (không để lộ là bot); tin nhắn bắt đầu bằng "/" chỉ người gõ thấy (không gửi lên mạng, không hiện cho người khác).
Quy tắc: chỉ xem chỗ cần sửa; làm từng mục, mỗi mục xong chạy npm test, đẩy GitHub rồi báo ptg; không bịa, phần không kiểm được (WebGL, điện thoại thật, GAS thật) nói rõ; sau mỗi phiên luôn gửi prompt bàn giao chi tiết như thế này.
```
