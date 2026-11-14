# Phiên 159 — Điều khiển chuột máy tính (mục 1 của danh sách 2 mục 14/11) — XONG mã + test

> Dán nguyên file này vào đầu phiên mới. Repo: https://github.com/tp9sach-ops/duanchuaon (nhánh `main`). Người dùng (ptg/Gp) nói tiếng Việt. Đọc thêm `PROMPT.md` mục 7 và `HANDOFF.md` (cuối file) trước, kiểm mã thật, chạy `npm test` (mong đợi **1139/1139**, chạy lâu ~2–4 phút → đặt timeout lớn).

## Quy tắc làm việc (chép nguyên văn)
"For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff."
- Làm TỪNG MỤC, xong chạy test, đẩy `main`, báo, chờ ptg nói "tiếp tục". Chỉ đọc chỗ cần sửa; việc nào đã làm rồi thì bỏ qua; cập nhật không lỗi. Không báo test đạt nếu chưa chạy.

## Danh sách 2 mục ptg giao ngày 14/11 (chơi trên máy tính)
1. ✅ **Di chuyển bằng CHUỘT PHẢI; chọn mục tiêu đánh bằng bấm CHUỘT PHẢI 2 LẦN vào mục tiêu** — XONG ở Phiên 159 (bên dưới).
2. ⏳ **Phím chiêu thức:** `Q` = đánh thường (kể cả khi ở trạng thái bình thường, bấm Q vẫn đánh thường được); `W`, `E`, `R`, rồi `1`, `2`, `3`, `4`, … là thứ tự các chiêu thức. (CHƯA làm — việc kế tiếp, xem "Gợi ý cho mục 2".)

## Mục 1 — đã làm gì
- **File mới `js/world/mouseTarget.js`** (logic thuần, có test): `createDoubleClick({ms=380,px=30})` → `.hit(x,y,t)` (true nếu là lần bấm THỨ HAI trong 380 ms và 30 px; sau một "đúp" thì quên để lần ba không tính tiếp), `rayToSegment(o,u,a,v)` (khoảng cách tia ↔ đoạn thẳng), `monsterVolume(m)` (vùng chạm rộng hơn thân thật: thường h1,9/r0,85; tinh anh 2,7/1,2; boss 3,4/1,7), `pickMonster(origin,dir,mons,{reach})` (con GẦN CAMERA nhất mà tia chạm), `LOCK_RANGE = 36` m.
- **`js/world/world.js`** (khối chuột/cảm ứng trên canvas): pointerdown nhớ `btn` + `mouse`; thêm `contextmenu → preventDefault`; hàm `onClick(cx,cy,d)`:
  - **Cảm ứng/bút** (`pointerType !== 'mouse'`): bấm = đi như cũ (compact.js vẫn gửi sự kiện kéo ảo kiểu `touch` nên camera điện thoại không đổi).
  - **Chuột PHẢI**: bấm = đi tới đó (tìm đường như cũ). Bấm lần 2 trong 380 ms/30 px: gọi `LGT.farm.pickAt(origin, dir)`; trúng quái thì khóa, trượt thì coi như bấm đi bình thường.
  - **Chuột TRÁI**: KHÔNG còn đi trên đất; chỉ còn chạm chương/bồ đoàn (`pickGround(cx,cy,false)`). Kéo (trái hoặc phải) > 8 px = xoay camera như cũ; cuộn = zoom như cũ.
- **`js/ui/farm.js`**: biến `lockUid`; `target()` ưu tiên quái đã khóa nếu còn trong `view.mons` và cách ≤ 36 m, ngược lại tự bỏ khóa và về chọn quái gần nhất (≤ 18 m) như cũ. Vì `aim()` (Đánh thường, Thương), `skillReady/skillHit` (chiêu phái, heSkill.js), `status()` đều gọi `target()` nên **mọi đòn tự nhắm quái đã khóa**; `view.target` = quái khóa nên thanh Oán Khí và vòng sáng ở `js/scene/farm.js` tự chuyển theo. API mới: `LGT.farm.pickAt(origin,dir)` → `{ok,ten,uid}|{ok:false,reason}`, `LGT.farm.unlock()`, `LGT.farm.locked`. Phím **Esc** (khi không mở bảng nào) bỏ khóa. Toast "Đã chọn mục tiêu: <tên>".
- `js/world/coach.js` lời hướng dẫn "Đi lại" nói rõ chuột phải / bấm chuột phải 2 lần / điện thoại chạm.
- `sw.js` VERSION → `dgt-v159`.
- Test: `tests/mousetarget.test.mjs` (4 test, đã vào `npm test`) + 1 test mới cuối `tests/farmui.test.mjs` (khóa → `view.target` đổi theo, trượt không khóa, `unlock`, đi xa tự bỏ khóa). **`npm test` 1139/1139.**

## Chưa làm / lưu ý
- **CHƯA nhìn bằng mắt** (môi trường AI không có WebGL/chuột thật): ptg cần thử trên máy tính — chuột phải đi, chuột phải 2 lần vào quái (thấy toast "Đã chọn mục tiêu" + thanh Oán Khí chuyển sang con đó), Esc bỏ khóa. Nếu bấm đúp chuột phải khó trúng: tăng `r` trong `monsterVolume` hoặc `DOUBLE_MS` trong `mouseTarget.js`.
- **Yêu quái hằng tháng** (`LGT.yq`, `bossOn()`) vẫn đi đường riêng (`target()` trả null khi có yêu quái hằng tháng) — KHÔNG khóa được bằng chuột phải; chưa hỏi ptg có muốn khóa cả yêu quái hằng tháng/boss phó bản không.
- **Tự động hàng yêu** (`autoStep` trong farm.js) vẫn tự chọn quái GẦN NHẤT riêng, không theo quái đã khóa (chưa được yêu cầu).
- Chuột giữa (nút 1) không làm gì. Ở chế độ chỉnh sửa nhà (`js/ui/editmode.js`) chuột trái vẫn kéo đồ như cũ (nó bắt sự kiện ở pha capture).

## Gợi ý cho mục 2 (phím chiêu) — đã đọc sẵn hiện trạng, phiên sau KHÔNG cần đọc lại từ đầu
- Hiện có: `js/world/dock.js` `SLOT_CODES = { A:Digit1/Numpad1, B:Digit2, E:Digit3, D:Digit4, F:Digit5, T3:KeyB }` — phím 1–5 gắn với Ô nút trong cụm góc phải-dưới (nút ở từng ô ĐỔI theo ngữ cảnh: câu cá, khiêng, đánh quái…); xử lý ở `js/ui/dock.js` (listener `keydown`, dòng "Phím tắt trên máy tính"). Nút **Đánh thường** có id `da` (hàm `stone()` ở `js/ui/farm.js`, hồi chiêu `STONE.cd`), **Thương** id `thuong` (`spear()`), xuất hiện ở `dockButtons()` khi `k.farm`/`k.yq` có quái.
- `js/ui/heSkill.js`: 3 chiêu của phái (ô 1,2,3) phím `Digit6/7/8` (`KEYS`); `cast(slot)` dùng `LGT.farm.skillHit`. `js/ui/skill.js`: Space = Nhảy. `js/ui/duel.js` (Võ đài): J/K/L/U. `js/ui/dungeonPanel.js`, `js/ui/practice.js`, `js/ui/fishing.js` cũng có keydown riêng (tránh đụng phím).
- **Phím mới ptg muốn:** Q = đánh thường LUÔN dùng được (cả khi dock không hiện nút `da` vì chưa có quái trong tầm — khi đó nên toast "Chưa có quái nào gần" thay vì im lặng; đang khiêng/câu cá/bơi thì bỏ qua); W, E, R, 1, 2, 3, 4… = thứ tự các chiêu thức. **Xung đột cần xử lý:** W/E/… đang là phím ĐI (`moveKeyOf`: W/A/S/D = đi!) → hỏi/quyết định: W đi lên nên KHÔNG thể vừa là chiêu vừa là đi; phương án đề xuất: khi chuột phải đã là cách đi chính thì cho ptg chọn (a) vẫn giữ A/S/D/W đi và chỉ dùng Q,E,R + 1–4 cho chiêu, hoặc (b) tắt WASD đi trên máy có chuột và dùng W cho chiêu. **PHẢI hỏi ptg trước khi gỡ WASD** (Phiên 129 mới làm WASD = mũi tên theo yêu cầu của ptg). Mũi tên ↑←↓→ vẫn đi được dù WASD đổi.
- Gom ánh xạ phím về MỘT bảng (hàm thuần có test, ví dụ `js/world/keymap.js`: `chieuKeyOf(e)` → `'da' | 'chieu1'… `) rồi cho `dock.js`/`heSkill.js` dùng chung để không đụng nhau; cập nhật nhãn phím trên nút (hiện chữ ở `.hs-k` và nhãn `.kb` của dock) và lời hướng dẫn (`coach.js`, `tutorial.js`).
- Thứ tự chiêu = đánh thường (Q) rồi các chiêu của phái theo ô (`skillFor(he, slot)` ở `js/world/skillCatalog.js`: hiện 3 ô; `combatSkills.js` có nhiều chiêu hơn, `CHIEU_4HE` có 30 chiêu nhưng CHƯA nối vào chiến đấu — xem docs/PHIEN158.md).

## Prompt bàn giao (dán vào phiên mới)
Bạn tiếp tục dự án Diệu Giang Tự (https://github.com/tp9sach-ops/duanchuaon, nhánh main). Quy tắc: For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff. Đọc docs/PHIEN159.md, PROMPT.md mục 7, cuối HANDOFF.md; clone repo, chạy `npm test` (mong đợi 1139/1139). Việc kế tiếp = MỤC 2 của danh sách 14/11: phím Q = đánh thường (luôn dùng được), W/E/R rồi 1/2/3/4… = thứ tự các chiêu thức — xem mục "Gợi ý cho mục 2" (có xung đột W = đi; phải hỏi ptg trước khi gỡ WASD). Làm xong chạy test, cập nhật HANDOFF.md + PROMPT.md mục 7 + docs/PHIEN160.md, đẩy main, báo ptg và chờ "tiếp tục".
