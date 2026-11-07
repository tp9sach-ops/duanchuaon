# PHIÊN 45 — Việc 3b (+3d dạng chữ): bảng Câu cá — mua/sửa quả cầu, thả cầu, thu cá, phóng sinh, ao cá — BÀN GIAO

> after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

**Người dùng (ptg = Giang):** nói tiếng Việt, không rành kỹ thuật → trả lời NGẮN, DỄ HIỂU. Yêu cầu 07/11 (nhắc lại ở Phiên 45): (1) nhiệm vụ phải liên tục + cho người chơi biết việc kế tiếp; (2) hoàn tất quả cầu, cá, thả cá phóng sinh. Làm TỪNG VIỆC MỘT, đẩy GitHub; không đẩy được thì gửi zip để ptg tải lên; ptg nhắn "tiếp tục" mới làm việc kế.
**Repo:** https://github.com/tp9sach-ops/loinhuan.github.io (`main`, lúc đọc `afbff38`). Đọc theo thứ tự: `PROMPT.md` → `docs/PHIEN41.md` (luật đã chốt) → `docs/PHIEN44.md` → file này. `HANDOFF.md` ở gốc đã cũ (chỉ tới Phiên 36).

## Hiện trạng đã kiểm ở Phiên 45
- **Việc 1 (nhiệm vụ liên tục): ĐÃ XONG từ Phiên 43** (`js/world/nextGoal.js`, thẻ "Việc kế tiếp" luôn hiện, nút Dẫn đường). Không làm lại. Chỉ còn: thêm nhiệm vụ câu cá/phóng sinh vào `QUESTS` + `CHAIN` (việc 3e).
- **Việc 2 (quả cầu/cá/phóng sinh):** 3a bộ não (Phiên 44) → **3b + 3d dạng chữ (Phiên 45, file này)** → còn 3c (cảnh 3D) và 3e (nhiệm vụ).

## ĐÃ LÀM (Phiên 45) — giao diện chữ chơi được từ đầu đến cuối
- MỚI `js/ui/fishing.js` (`initFishing(hud, {toast})` → `LGT.fishing = {open(tab), close, state, session}`): bảng 3 tab. **Thả cầu**: quăng (trừ 1 độ bền) → chữ báo "bóng cá… cá rỉa… hoa sen nở BẤM NGAY" → nút **Bấm!** (đổi màu khi hoa sen hiện) → được cá thì hiện **Thu cá** / **Phóng sinh**. **Quả cầu**: 5 cầu (giá, bền, may, hoa sen), Mua/Chọn/Sửa bằng lá (`LGT.merit.spendLa`). **Ao cá**: cá đã thu, nút Phóng sinh từng con. Nút nổi **Câu cá** hiện khi đứng gần nước (`nearWater` + không ở trong nhà). Lưu `localStorage['lgt.fish']`. Chữ hiển thị chỉ qua `textContent`.
- Phóng sinh gọi `LGT.merit.reward('phongsinh', releaseSen(fish))` (trần 10 lần/ngày; hết trần vẫn thả được, chỉ không cộng sen).
- SỬA `js/world/fishing.js`: thêm `phaseText`, `outcomeText`, `orbBrief`. SỬA `js/ui/menuLogic.js`: nút **Câu cá** (id `cauca`, action `fish`) THAY nút "Yêu thích" (chưa có chức năng) ở cụm phải-trên; `pressResult` nhận `fish`. SỬA `js/ui/hudMenu.js`: icon `fish`, `initFishing`, bấm nút → `LGT.fishing.open('cast')`. MỚI `css/fishing.css` (+ link trong `index.html`). `sw.js` → `dgt-v52`. Thêm 3 test vào `tests/fishing.test.mjs`.
- Đã kiểm: `npm test` (xem số ở cuối), và chạy giao diện bằng **jsdom** (ngoài repo) cả kịch bản: mua cầu, thả, bấm đúng lúc, bấm sớm, hết giờ, Thu cá, Phóng sinh ngay, phóng sinh trong ao, cầu nứt → sửa 6 lá, xa nước thì không thả được, đóng bảng giữa chừng. **CHƯA thử trên trình duyệt thật / điện thoại thật** (ptg xem: nút Câu cá ở cụm phải-trên có hiện không, nút nổi có che nút khác không).

## GIẢ ĐỊNH ptg chưa duyệt (dễ đổi ở `js/world/fishing.js`)
Xem `docs/PHIEN44.md` (độ bền 20/30/45/70/100; may 1/1,4/2/3/4,5; cửa sổ hoa sen 0,5→0,9 giây; sửa = 1/5 giá; thưởng phóng sinh 1–3 hạt sen, trần 10 lần/ngày; ao tối đa 30). Thêm: khi đóng bảng giữa lúc đang câu thì mất lượt (độ bền đã trừ). Chưa có cầu miễn phí khởi đầu (cầu rẻ nhất 30 lá = 300 hạt sen) — HỎI ptg có muốn tặng 1 cầu gỗ không.

## CÁC VIỆC KẾ (mỗi việc xong báo ptg, chờ "tiếp tục")
- **3c — Cảnh 3D câu cá:** MỚI `js/scene/fishing.js`: quả cầu bay ra mặt nước, phao/vòng sóng, bóng cá lướt ở giây 4, rỉa làm phao nhún, hoa sen hiện đúng cửa sổ `orb.cua`; đọc `LGT.fishing.session` (phase, water) để vẽ (không cần sửa logic); nối `js/scene/index.js`. Nhớ `prefers-reduced-motion`, PERF (bậc ≥ 3 giảm hiệu ứng). Vị trí nước: `FISH_WATERS` trong `js/world/fishing.js`.
- **3e — Nhiệm vụ + hướng dẫn:** thêm `'cau'`, `'phongsinh'` vào `EVENT_TYPES` (`js/world/quests.js`); thêm vào `QUESTS` ví dụ `m-cau` (câu được cá đầu tiên), `m-phongsinh` (phóng sinh lần đầu), `n-phongsinh` (hằng ngày); thêm vào `CHAIN` (`js/world/nextGoal.js`); gọi `LGT.act('cau')` / `LGT.act('phongsinh')` trong `js/ui/fishing.js` (chỗ `finish()` khi `outcome==='got'` và chỗ phóng sinh); sửa chủ đề "Phóng sinh" trong `js/world/tutorial.js` từ "sắp có" thành thật; cập nhật test đếm nhiệm vụ (`tests/quests.test.mjs`, `tests/nextgoal.test.mjs`, `tests/tutorial.test.mjs` nếu đếm cứng). Tùy ý: "Suối Trong" (~ -111,100, r4.6) bằng `addWater` trong `js/world/outside.js`.
- Lưu ý cũ: `js/world/minimap.js` dòng ~70 vẽ hồ cá ở `x: 56` trong khi `KOI.x = 60` (lệch 4 m) — chưa sửa.

## Quy trình đẩy GitHub
Sandbox clone được repo nhưng thường 403 khi ghi → giao zip `cap-nhat-phien45-viec3b.zip` (đúng đường dẫn, trùng tên ghi đè). Sau khi ptg tải lên: `git clone` + `npm test`.

## File thay đổi phiên này
js/ui/fishing.js (mới), css/fishing.css (mới), js/world/fishing.js, js/ui/menuLogic.js, js/ui/hudMenu.js, index.html, sw.js, tests/fishing.test.mjs, docs/PHIEN45.md (mới)
