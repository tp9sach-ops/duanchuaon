# PHIÊN 41 — Nội thất (bước 1 + 2) và các luật ptg đã chốt (BÀN GIAO)

> after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

**Người dùng (ptg = Giang):** nói tiếng Việt, không rành kỹ thuật → trả lời NGẮN, DỄ HIỂU, TỪNG VIỆC NHỎ. Sau mỗi việc: đẩy GitHub; không đẩy được thì gửi file rồi CHỜ ptg bấm "tiếp tục". Sửa code: đưa đoạn "tìm" đầy đủ + code thay thế đầy đủ.
**Repo:** tp9sach-ops/loinhuan.github.io, `main` @ `cd2af31` (Phiên 40). Đọc `PROMPT.md` + `docs/PHIEN3x/4x.md` trước. `npm test` hiện **542/542** (Node 22).
**GitHub:** sandbox KHÔNG đẩy được (thiếu tài khoản). Gửi file, ptg tải lên tay (trùng đường dẫn thì ghi đè). Sandbox có thể reset giữa các lượt: file chưa được ptg tải lên có thể MẤT → luôn gửi file ngay trong lượt.

## 1. Luật ptg đã chốt (07/11)
1. Số món nội thất tối đa theo cấp nhà: **10/18/26/36** (`MAX_PLACED`).
2. Giá 50 món: **50 → 100000 lá bồ đề** (đã đặt theo thang nhân đều, món "to/sang" đắt hơn).
3. Quả cầu gieo duyên: **5 loại, giá 30 → 1000 lá bồ đề**; **không giới hạn thả mỗi ngày**; cầu hư (nứt) thì tốn lá để sửa.
4. Nhà ban đầu **trống hẳn** (đã làm ở bước 2).
5. Công đức (hạt sen) thêm từ: **lạy Phật, cúng, thắp nhang**; mỗi việc tối đa **10 lần/ngày** (chống cộng dồn). Hiện `merit.js` chỉ có trần thiền (`DAILY_CAP={thien:10}`) → cần thêm nguồn `lay`, `cung`, `nhang` cùng trần 10.
6. "Thiết lập chỗ đổi lá bồ đề": CHƯA rõ ý. Hiện đã có: Thầy Tri khách đổi 10 hạt sen = 1 lá (`js/ui/merit.js`). Cần hỏi ptg: muốn thêm nút/điểm đổi ở đâu (menu? cạnh số lá?) hay đổi tỉ lệ?

## 2. Đã làm
- Bước 1: `js/world/furniture.js` — 50 món (`FURNITURE`), `buyItem`, `placeItem`, `pickUp`, `canPlace` (lý do: unknown/full/out/door/overlap), `loadFurni`, `freeCount`, `footprint`, `toFurniture`. Dữ liệu lưu: `{v, owned:{id:n}, placed:[{uid,id,x,z,rot}], seq}`; rot 0..3 = 90°. Món đặc không đè món đặc, không chặn lối vào cửa (|x|≤0,8, cách tường cửa ≤1,5 m); thảm/đèn/ghế/cây đè được.
- Bước 2: `js/world/interior.js` — `ROOMS[].furniture = []` (xóa BASE0/BASE1/EXTRA2/LV3); `furnitureRects(lv, placed=[])` và `registerRoom(lv, placed=[])` nhận món đã đặt (dùng `rw/rd` đã xoay). Thêm 1 test nhà trống vào `tests/interior.test.mjs`.
- `package.json` thêm `tests/furniture.test.mjs`. `tests/furniture.test.mjs` 7 test.
- CHƯA: cảnh 3D vẽ món đặt, nút Shop/Túi đồ, lưu `localStorage`, sw.js VERSION (đang `dgt-v46`, nên tăng khi giao bản có giao diện).

## 3. File phải tải lên (trùng tên ghi đè)
`js/world/furniture.js` (mới) · `js/world/interior.js` (sửa) · `tests/furniture.test.mjs` (mới) · `tests/interior.test.mjs` (sửa) · `package.json` (sửa) · `docs/PHIEN41.md` (mới).

## 4. Các bước tiếp (mỗi bước xong báo, chờ "tiếp tục")
- **Bước 3:** `js/scene/interior.js` vẽ món đặt theo `kind` (có sẵn: rug, bed, table, lamp, crate, shelf, wardrobe, tvunit, sofa, chair, stairs, plant; CẦN THÊM: stool, bench, floorlamp, lantern, statue, altar, tank). Dòng ~137 duyệt `r.furniture` → đổi sang danh sách món đã đặt truyền vào `show(lv, placed)`. Ghế có `uid` tự xoay theo `ry`.
- **Bước 4:** giao diện Shop + Túi đồ + chế độ "Sửa nhà" (nút `tuido`, `cuahang` ở `js/ui/menuLogic.js` đang `status:'soon'`; hàm `pressResult` cần kind mới); lưu `localStorage['lgt.furni']`; nút `js/ui/house.js` gọi `registerRoom(lv, placed)`.
- **Bước 5:** công đức lạy/cúng/nhang (mục 1.5) trong `merit.js` + test; hỏi ptg mục 1.6.
- **Bước 6+:** `gainLa` (merit.js; lá nhận trực tiếp, không tính vào `spent`); `js/world/fishing.js` (logic thuần: quăng → 4 s bóng cá → rỉa → cắn → hoa sen 0,5 s → thu; 5 loại cầu 30–1000 lá, độ bền, sửa cầu); cảnh 3D câu cá; ao cá riêng (ban đầu trống; cá/rùa/ba ba/mực; lớn/nhỏ, hiếm/thường); nút Thu cá. Nước để câu: hồ cá `KOI` (60,10,r8), ao chùa `POND` (0,14), hồ thác `THAC.pool` (106,104,r7); đề xuất thêm "Suối Trong" (~ -111,100, r4.6) bằng `addWater` trong `js/world/outside.js`.
