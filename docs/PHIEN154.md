# PHIÊN 154 — Bàn giao (2026-11-14)

> Dán nguyên file này vào đầu phiên mới. Phiên mới KHÔNG cần nhớ gì khác.
> Repo: https://github.com/tp9sach-ops/duanchuaon (nhánh `main`). Người dùng (ptg/Tg) nói tiếng Việt.

## Quy tắc làm việc (ptg yêu cầu)
- Làm TỪNG MỤC theo thứ tự, xong mỗi mục chạy test, đẩy GitHub, báo ptg rồi mới làm mục sau. Chỉ đọc chỗ cần sửa (HANDOFF.md 170 KB, đừng đọc cả). Việc đã làm thì bỏ qua.
- Sửa mã có sẵn dưới dạng tìm-và-thay; cuối mỗi phiên luôn viết `docs/PHIEN<n>.md` bàn giao chi tiết. Không báo test đạt nếu chưa chạy.

## Danh sách 7 mục ptg giao ngày 2026-11-14
1. **Sửa lỗi ngồi bồ đoàn Hỏa — XONG ở Phiên 153** (xem dưới).
2. **XONG ở Phiên 154** — Vật phẩm **nón** mua ở **điện máy** (Nhân viên Điện Máy Lam Sen, `js/scene/dienmay.js`): giá **400 lá bồ đề**; mua xong mang vào thì nhân vật **đội nón** và **tăng giáp 3%**. Ptg đã gửi model `japanese_hat_jingasa.glb` (nón jingasa) cho phiên chat; nếu file không có trong repo, hỏi ptg gửi lại rồi đặt vào `assets/` (xem `THIRD_PARTY.md` để ghi nguồn/giấy phép).
3. Sửa **lỗi hiển thị Túi hồ lô** (UI túi: ô vật phẩm bị cắt chữ "T h.", "G ậ", "V á" xuống dòng từng chữ, tab "Tất cả/Đang cầm/Tiền/Câu cá/Nội thiết/Khác" bị che/chồng thanh Sinh Lực, thanh cuộn ngang; ảnh chụp ở phiên chat). Xem `js/ui/` (bag) + `css/`, test `tests/bag.test.mjs`.
4. Đổi **ngọc hồi máu → "Bánh sầu riêng 3 vị"** và **ngọc dịch chuyển → "Bánh sầu riêng pho mai than tre"**, mua ở **tiệm bánh sầu riêng 9 Sạch** (cần xem tiệm đã có chưa; cảnh tiệm kiểu `js/scene/store9sach.js`). Giữ cơ chế/giá trị cũ của ngọc, chỉ đổi tên, hình và nơi bán; dữ liệu cũ đã lưu phải còn dùng được (di chuyển id).
5. **Hệ thống chiêu thức** (thiết kế theo GDD v2; xem `js/world/skills.js`, `skillCatalog.js`, `skillEngine.js`, `luyenChieu.js`, `combo.js`).
6. **Phó bản**: đi tới địa điểm gặp NPC → chọn vào phó bản → sang khu riêng (không nằm trong map chính) toàn quái và thử thách. Quái theo cấp; thu phục xong quái **hồi sinh mạnh hơn, to hơn, trâu hơn, sát thương cao hơn** theo từng lượt; **sau 9 lượt hồi sinh thì boss chính** xuất hiện (to, mạnh hơn); thu phục boss xong rơi nhiều vật phẩm. Quay về map chính, phó bản đã chinh phục **lần sau vào sẽ mạnh hơn**. Đã có sẵn nền: `js/world/dungeon.js`, `zoneDungeon.js`, `zones.js`, `DUNGEON_NPCS` trong `js/world/npc.js` (4 phó bản: rungmoc, hangkim, hothuy, thaptho), `js/data/dungeons.js`, `js/ui/dungeonPanel.js` → kiểm xem đã làm tới đâu trước khi làm.
7. **Linh thú từ boss phó bản**: thu phục boss chính → túi hồ lô có **mảnh ghép** yêu quái đó; đủ **3 mảnh** (chinh phục 3 lần) → bấm "Ghép" thì có boss đó làm **linh thú** trong túi; gọi ra, **cưỡi**, dùng chiến đấu. Kỹ năng boss tương tác với người chơi: hồi máu → hồi máu cho người chơi; hồi chiêu → hồi chiêu cho người chơi; tạo giáp cho người chơi; còn trói chân/làm chậm/đóng băng/hất tung → tác động lên quái khác.

## Phiên 154 — mục 2: Nón Jingasa (XONG mã + test)
- **Logic** (`js/world/items.js`): `HAT` (id `non`, 400 lá, giáp 0,03), `buyHat`, `toggleHat`, `hatWorn`, `armorMul` (=0,97 khi đội), `afterArmor(dmg, st)` (làm tròn, tối thiểu 1, dmg lạ → 0). `loadItems` thêm `hat`, `hatOn` (bản lưu cũ không có → chưa mua; đã mua mà thiếu `hatOn` → đang đội).
- **Cửa hàng** (`js/ui/items.js`, cùng cửa hàng bán Gậy như ý ở Điện Máy): dòng "Nón Jingasa" giá 400 lá → mua xong TỰ ĐỘI; sau đó nút đổi thành Cất nón / Đội nón. `LGT.items.armorMul()` và `LGT.items.afterArmor(d)` được xuất ra.
- **Giáp thật**: `js/ui/farmCombat.js` dòng `ev.k === 'strike'` gọi `LGT.items.afterArmor(ev.dmg)` trước `vit.take`. (Chỉ có 1 chỗ quái đánh người chơi trong `js/ui/`; nếu phó bản/boss sau này thêm chỗ trừ máu mới thì cũng phải gọi `afterArmor`.)
- **Hình**: `js/ui/hatMesh.js` (`buildHat`, `HAT_POS` = số TẠM), mô hình GLB rút gọn nhúng base64 ở `js/data/hatGlb.js` (~8 KB, sinh bằng `tools/optimize-hat.mjs` từ file 13 MB ptg gửi; bỏ dây cằm). `js/world/avatarChibi.js` thêm `headHost` + `setHat(on)` (ẩn búi tóc khi đội nón). Lỗi nạp GLB thì giữ nón khối.
- **Giấy phép**: mô hình là SKETCHFAB Standard (không phải CC) — đã ghi cảnh báo ở `THIRD_PARTY.md`; ptg tự quyết trước khi công bố rộng.
- **Test**: `tests/items.test.mjs` +5 test (mua/đội/cất/đọc bản lưu/afterArmor/GLB nhúng hợp lệ). Sửa `tests/luyenchieu.test.mjs` (chỗ đứng Hỏa x=12,6 sau Phiên 153; đây là test đỏ do Phiên 153 để sót). `sw.js` = `dgt-v146`.
- **CHƯA nhìn bằng mắt**: vị trí/kích thước nón trên đầu (`HAT_POS`, `HAT_DIAM` trong `hatMesh.js`) có thể phải chỉnh; kiểm cả nhân vật nữ/tóc khác. Đã kiểm trong Node: GLB nạp được, vành rộng 1,0, cao 0,34, gốc ở y=0.
- **Ptg cần làm**: mở game, mua nón ở Điện Máy, xem nón có đội đúng đầu không; báo để chỉnh.

## Việc tiếp theo
Làm **mục 3** (sửa hiển thị Túi hồ lô: ô vật phẩm bị cắt chữ "T h.", "G ậ", "V á"; tab bị chồng thanh Sinh Lực; thanh cuộn ngang) → 4 → 5 → 6 → 7.

## Prompt khởi động phiên mới
"Đọc docs/PHIEN154.md trong https://github.com/tp9sach-ops/duanchuaon rồi làm mục 3 (chỉ đọc chỗ cần sửa), test, đẩy GitHub, viết docs/PHIEN155.md và báo tôi."
