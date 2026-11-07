# PHIÊN 44 — Việc 3a: quả cầu gieo duyên + câu cá + phóng sinh (LOGIC THUẦN) — BÀN GIAO

> after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

**Người dùng (ptg = Giang):** nói tiếng Việt, không rành kỹ thuật → trả lời NGẮN, DỄ HIỂU. Yêu cầu 07/11: "hoàn tất quả cầu, cá, thả cá phóng sinh; làm TỪNG VIỆC MỘT, đẩy GitHub; không đẩy được thì gửi zip để ptg tải lên; ptg nhắn 'tiếp tục' mới làm việc kế". Phong cách ptg: hành động ngay, không hỏi từng bước; sửa mã kiểu "tìm và thay" hoặc gửi cả file/zip.
**Repo:** https://github.com/tp9sach-ops/loinhuan.github.io (`main`, lúc đọc `8c4e85f`). Đọc theo thứ tự: `PROMPT.md` → `docs/PHIEN41.md` (luật đã chốt) → `docs/PHIEN43_BAN_GIAO.md` → file này. `HANDOFF.md` ở gốc đã cũ (chỉ tới Phiên 14a/36). `npm test` phải đạt trước khi giao.

## Quy ước từ ptg (đã chốt, KHÔNG đổi nếu ptg chưa nói)
- Quả cầu gieo duyên: **5 loại, giá 30 → 1000 lá bồ đề**; **KHÔNG giới hạn số lần thả mỗi ngày**; cầu nứt thì **tốn lá để sửa**.
- Nhịp câu: quăng → 4 giây bóng cá → rỉa → cắn → hoa sen hiện 0,5 giây → bấm để thu.
- Ao cá riêng ban đầu trống; có cá/rùa/ba ba/mực, lớn/nhỏ, hiếm/thường; có nút **Thu cá**.
- Nước câu: hồ cá `KOI` (60,10,r8), ao sen `POND` (0,14,r10.6), hồ thác `THAC.pool` (106,104,r7.5).

## GIẢ ĐỊNH TÔI TỰ CHỌN (ptg chưa duyệt — nói rõ khi báo ptg, dễ đổi ở 1 chỗ)
1. "Quả cầu" = quả cầu quăng xuống nước để gieo duyên với cá (phao/cần). Nếu ptg nói khác → chỉ đổi giao diện/cảnh, logic vẫn dùng được.
2. Độ bền cầu (số lần quăng trước khi nứt) 20/30/45/70/100; hệ số may loài hiếm 1/1,4/2/3/4,5; cửa sổ hoa sen 0,5/0,6/0,7/0,8/0,9 giây (cầu càng tốt càng dễ bấm); giá sửa = 1/5 giá (6/20/50/120/200 lá). Giá 5 cầu: 30/100/250/600/1000.
3. Phóng sinh: +1 hạt sen, +1 nếu loài hiếm, +1 nếu cỡ lớn (1–3); trần **10 lần/ngày** (nguồn `phongsinh` trong `ACT_CAP`, mặc định đề xuất ở Phiên 40, chưa chốt). Hết trần vẫn cho thả nhưng không cộng sen.
4. Ao riêng chứa tối đa 30 con (`POND_MAX`). Không có cầu miễn phí khởi đầu (cầu rẻ nhất 30 lá = 300 hạt sen: khá nặng cho người mới; hỏi ptg có muốn tặng 1 cầu gỗ không).
5. Chưa dùng `gainLa` (PHIEN41 có nhắc): không cần cho tới khi ptg muốn thưởng LÁ. Nếu làm: thêm trường `gained` vào `emptyLeaf`/`loadLeaf`, bất biến mới `spent ≥ 10 × max(0, la − gained)`; nếu cộng lá trực tiếp mà không ghi `gained` thì `loadLeaf` sẽ tự đội `spent` lên (làm sai điểm xếp hạng).

## ĐÃ LÀM (việc 3a) — `npm test` 572/572 đạt, thêm 14 test
- MỚI `js/world/fishing.js` (logic thuần, không DOM/three.js). API (đã có test):
  - Dữ liệu: `ORBS` (id: go, da, ngoc, luuly, kim; trường gia, ben, may, cua), `orbById`, `repairCost`, `SPECIES` (13 loài: cá/rùa/ba ba/mực × thường/hiếm), `speciesById`, `FISH_WATERS` (hoca, aosen, hothac), `waterById`, `nearWater(x,z,margin=3.2)` (nước gần nhất mà người đứng cách mép ≤ margin), `POND_MAX=30`, `T_SHADOW=4`.
  - Trạng thái: `emptyFish()`, `loadFish(raw)` (chịu dữ liệu hỏng). Dạng: `{v:1, orbs:{idCầu: độBềnCònLại}, sel, pond:[{uid,sp,lon}], seq, stat:{cast,got,rel}}`. Khóa lưu đề xuất: `localStorage['lgt.fish']`.
  - Cầu: `buyOrb(st, la, id)`, `selectOrb(st, id)`, `repairOrb(st, la, id)` (chỉ sửa khi độ bền = 0), `currentOrb(st)` → `{orb, dur, cracked}`|null; `rareChance(orb)`, `bigChance(orb)`, `rollCatch(orb, rng)`. Hàm mua/sửa trả `cost`; **nơi gọi tự trừ lá bằng `LGT.merit.spendLa(cost)`** khi `ok`.
  - Câu: `startCast(st, waterId, rng)` → `{ok, reason:''|'nowater'|'noorb'|'cracked', state (độ bền −1, stat.cast +1), sess}`. `sess = {water, orb, t, phase:'wait'|'shadow'|'nibble'|'lotus'|'over', tShadow, nibbles[], tBite, tEnd, fish, over, outcome:null|'got'|'early'|'late'}`. Mỗi khung gọi `s = tick(s, dt)` (dt bị chặn ≤ 0,25 s); khi người chơi bấm gọi `s = tap(s)`. `outcome==='got'` → `s.fish = {sp, lon}`. `early` = bấm sớm (cá giật mình), `late` = hết cửa sổ hoa sen.
  - Sau khi câu được: `keepFish(st, fish)` (nút Thu cá; `reason:'full'` nếu đủ 30) | `releaseCaught(st, fish)` (thả ngay con vừa câu) | trong ao: `releaseFish(st, uid)`; thưởng: `releaseSen(fish)`; tiện ích `fishLabel`, `pondSummary`, `noteCaught`.
- SỬA `js/world/merit.js`: `ACT_CAP` thêm `phongsinh: 10` (+ chú thích). SỬA `js/ui/merit.js`: nhãn `phongsinh: 'Phóng sinh'`. Dùng: `LGT.merit.reward('phongsinh', releaseSen(fish))`.
- SỬA `package.json` (thêm `tests/fishing.test.mjs`). MỚI `tests/fishing.test.mjs`. MỚI `docs/PHIEN44.md`.
- **Chưa có gì nhìn thấy được trong game** (3a chỉ là bộ não). sw.js chưa đổi (vẫn `dgt-v51`).

## CÁC VIỆC KẾ (mỗi việc xong báo ptg, chờ "tiếp tục")
- **3b — Cửa hàng quả cầu + nút Thả cầu (giao diện, chưa cảnh 3D):** MỚI `js/ui/fishing.js` + `css/fishing.css`. Bảng "Quả cầu gieo duyên": 5 cầu (giá, độ bền, may, nút Mua/Chọn/Sửa), mua/sửa gọi `LGT.merit.spendLa`; lưu `lgt.fish`; nút **Thả cầu** hiện khi `nearWater(x,z)` ≠ null (đọc vị trí người chơi từ `LGT.world`, xem `js/world/world.js`). Nối vào menu: xem `js/ui/menuLogic.js` + `js/ui/hudMenu.js` (cách `bag`/`shop` đã nối), `index.html` (link css), `sw.js` → `dgt-v52`. Kiểm bằng DOM giả trong Node như phiên 43 (không có WebGL).
- **3c — Cảnh 3D câu cá:** MỚI `js/scene/fishing.js` (quả cầu bay ra mặt nước, phao/vòng sóng, bóng cá lướt ở giây 4, rỉa làm phao nhún, hoa sen hiện đúng cửa sổ `orb.cua`); nối `js/scene/index.js` (khung hình gọi `tick`, bấm/phím cách gọi `tap`). Nhớ `prefers-reduced-motion`, PERF (bậc ≥ 3 giảm hiệu ứng).
- **3d — Ao cá riêng + Thu cá + Phóng sinh:** bảng "Ao cá" liệt kê `pond`, nút Thu cá / Phóng sinh, báo công đức qua `LGT.merit.reward`. Sau khi câu xong hiện 2 nút: **Thu cá** / **Phóng sinh**.
- **3e — Nhiệm vụ + hướng dẫn:** thêm `'cau'`, `'phongsinh'` vào `EVENT_TYPES` (`js/world/quests.js`); thêm vào `QUESTS` ví dụ `m-cau` (câu được con cá đầu tiên), `m-phongsinh` (thả cá lần đầu), `n-phongsinh` (hằng ngày); thêm vào `CHAIN` (`js/world/nextGoal.js`); sửa chủ đề "Phóng sinh" trong `js/world/tutorial.js` từ "sắp có" thành thật; cập nhật test đếm nhiệm vụ (`tests/quests.test.mjs`, `tests/nextgoal.test.mjs`, `tests/tutorial.test.mjs` nếu có đếm cứng). Thêm "Suối Trong" (~ -111,100, r4.6) bằng `addWater` trong `js/world/outside.js` nếu ptg muốn.

## Lưu ý đã thấy
- `js/world/minimap.js` dòng 70 vẽ hồ cá ở `x: 56` trong khi `KOI.x = 60` (lệch 4 m) — chưa sửa, nên kiểm.
- Sandbox clone được repo nhưng thường KHÔNG đẩy được (thiếu quyền ghi) → gửi zip, ptg tải lên đúng đường dẫn (trùng tên ghi đè). Phiên 44 đã thử `create_or_update_file` lên `main`: **403 Resource not accessible by integration** (không có quyền ghi) → giao bằng zip `cap-nhat-phien44-viec3a.zip`, ptg tải lên tay.
- Lần đầu `npm test` từng có 1 test lỗi thoáng qua (Phiên 43), chạy lại thì đạt; chưa rõ test nào.

## File thay đổi phiên này
js/world/fishing.js (mới), js/world/merit.js, js/ui/merit.js, tests/fishing.test.mjs (mới), package.json, docs/PHIEN44.md (mới)
