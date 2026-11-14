# PHIÊN 153 — Bàn giao (2026-11-14)

> Dán nguyên file này vào đầu phiên mới. Phiên mới KHÔNG cần nhớ gì khác: mọi yêu cầu còn lại nằm ở đây.
> Repo: https://github.com/tp9sach-ops/duanchuaon (nhánh `main`). Người dùng nói tiếng Việt, giao việc bằng ngôn ngữ tự nhiên.

## Quy tắc làm việc (ptg yêu cầu)
- Làm TỪNG MỤC theo thứ tự, xong mỗi mục thì chạy test, đẩy GitHub, báo ptg rồi mới làm mục sau.
- Chỉ đọc những chỗ cần thiết để sửa/cập nhật không lỗi; KHÔNG đọc hết repo (HANDOFF.md 170 KB, đừng đọc cả file).
- Việc đã làm rồi thì bỏ qua. Cuối mỗi phiên luôn viết file bàn giao `.md` mới (`docs/PHIEN<n>.md`) để phiên sau làm đúng 100% dù không có trí nhớ.
- Không bịa yêu cầu/kiến trúc; không báo test đạt nếu chưa chạy. Có thể clone repo và chạy `node --test tests/<file>.mjs` (Node 22).

## Danh sách 7 mục ptg giao ngày 2026-11-14
1. **Sửa lỗi ngồi bồ đoàn Hỏa — XONG ở Phiên 153** (xem dưới).
2. Vật phẩm **nón** mua ở **điện máy** (Nhân viên Điện Máy Lam Sen, `js/scene/dienmay.js`): giá **400 lá bồ đề**; mua xong mang vào thì nhân vật **đội nón** và **tăng giáp 3%**. Ptg đã gửi model `japanese_hat_jingasa.glb` (nón jingasa) cho phiên chat; nếu file không có trong repo, hỏi ptg gửi lại rồi đặt vào `assets/` (xem `THIRD_PARTY.md` để ghi nguồn/giấy phép).
3. Sửa **lỗi hiển thị Túi hồ lô** (UI túi: ô vật phẩm bị cắt chữ "T h.", "G ậ", "V á" xuống dòng từng chữ, tab "Tất cả/Đang cầm/Tiền/Câu cá/Nội thiết/Khác" bị che/chồng thanh Sinh Lực, thanh cuộn ngang; ảnh chụp ở phiên chat). Xem `js/ui/` (bag) + `css/`, test `tests/bag.test.mjs`.
4. Đổi **ngọc hồi máu → "Bánh sầu riêng 3 vị"** và **ngọc dịch chuyển → "Bánh sầu riêng pho mai than tre"**, mua ở **tiệm bánh sầu riêng 9 Sạch** (cần xem tiệm đã có chưa; cảnh tiệm kiểu `js/scene/store9sach.js`). Giữ cơ chế/giá trị cũ của ngọc, chỉ đổi tên, hình và nơi bán; dữ liệu cũ đã lưu phải còn dùng được (di chuyển id).
5. **Hệ thống chiêu thức** (thiết kế theo GDD v2; xem `js/world/skills.js`, `skillCatalog.js`, `skillEngine.js`, `luyenChieu.js`, `combo.js`).
6. **Phó bản**: đi tới địa điểm gặp NPC → chọn vào phó bản → sang khu riêng (không nằm trong map chính) toàn quái và thử thách. Quái theo cấp; thu phục xong quái **hồi sinh mạnh hơn, to hơn, trâu hơn, sát thương cao hơn** theo từng lượt; **sau 9 lượt hồi sinh thì boss chính** xuất hiện (to, mạnh hơn); thu phục boss xong rơi nhiều vật phẩm. Quay về map chính, phó bản đã chinh phục **lần sau vào sẽ mạnh hơn**. Đã có sẵn nền: `js/world/dungeon.js`, `zoneDungeon.js`, `zones.js`, `DUNGEON_NPCS` trong `js/world/npc.js` (4 phó bản: rungmoc, hangkim, hothuy, thaptho), `js/data/dungeons.js`, `js/ui/dungeonPanel.js` → kiểm xem đã làm tới đâu trước khi làm.
7. **Linh thú từ boss phó bản**: thu phục boss chính → túi hồ lô có **mảnh ghép** yêu quái đó; đủ **3 mảnh** (chinh phục 3 lần) → bấm "Ghép" thì có boss đó làm **linh thú** trong túi; gọi ra, **cưỡi**, dùng chiến đấu. Kỹ năng boss tương tác với người chơi: hồi máu → hồi máu cho người chơi; hồi chiêu → hồi chiêu cho người chơi; tạo giáp cho người chơi; còn trói chân/làm chậm/đóng băng/hất tung → tác động lên quái khác.

## Phiên 153 — mục 1 (XONG)
- **Nguyên nhân (đã kiểm bằng code):** bồ đoàn Hỏa là `bd04` (x=3,6; z=−41), cách thầy Trụ trì (x=2,6; z=−40,6; vòng chặn r=0,5) chỉ ~1,08 m. `path.js` chừa lề 0,7 m quanh vật cản (0,5+0,7=1,2 m) nên `free()` = false → không có đường tới chỗ ngồi. Trong 48 bồ đoàn chỉ `bd04` bị vậy.
- **Sửa:** `js/world/heSeats.js` → `HE_SEAT_ID.hoa` từ `'bd04'` sang `'bd07'` (hàng 0, cột 7, x=12,6; z=−41 = góc phải sát bàn thờ). Cảnh 3D (`js/scene/boduon.js`) và mọi logic lấy vị trí/màu từ `HE_SEAT_ID` nên tự đi theo; không chỗ nào khác ghi cứng `bd04`.
- **Test:** `tests/hesseats.test.mjs` thêm 1 test (cả 5 bồ đoàn Hệ phải `free()`, Hỏa là bồ đoàn phải nhất). Đã chạy: hesseats, seats, npc, placements, layout, path, hequest, elements, khaingo, farm đều đạt.
- **Còn lại (không thuộc yêu cầu, chưa sửa):** `bd04` giờ là bồ đoàn thường nhưng vẫn kẹt sát thầy Trụ trì. Nếu ptg than, dời thầy Trụ trì (`TEMPLE_NPCS.truru` trong `js/world/npc.js`, nhớ `stand` + `tests/npc.test.mjs`) hoặc bỏ bd04 khỏi lưới.
- Chưa mở game thật để nhìn bằng mắt: cần ptg bấm thử ngồi vào bồ đoàn Hỏa (góc phải hàng gần bàn thờ).

## Việc tiếp theo
Làm **mục 2 (nón 400 lá bồ đề, +3% giáp)**, rồi 3 → 4 → 5 → 6 → 7. Mỗi mục: đọc đúng file liên quan → sửa → test → đẩy `main` → báo ptg.
