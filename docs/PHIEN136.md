# Phiên 136 — Mục 1 của danh sách 8 mục: sửa THU CÁ cho đúng clip (bóng cá, cá nhấp, cá dính, góc quay, thẻ cá)

## Quy tắc người dùng (chép nguyên văn)
For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff.

## Danh sách 8 mục của ptg (làm LẦN LƯỢT, xong mỗi mục thì đẩy GitHub rồi báo ptg để tiếp)
1. Sửa thu cá cho đúng clip: hình ảnh, góc quay, thu phục cá, cách cá nhấp, bóng cá. **← ĐÃ LÀM (phiên này), chờ ptg xem thật**
2. Đổi VÁN TRƯỢT thành CƯỠI CÂY THƯƠNG TO BAY để di chuyển. Khi đánh nhau: thương bay xoay một vòng rồi về tay nhân vật; đánh nhau thì KHÔNG cưỡi thương được.
3. Chỉ NGƯỜI CHƠI đeo hồ lô; NPC không có hồ lô.
4. Giao lưu võ thuật: gửi lời mời, người kia chấp nhận → load sang map khác = võ đài (khu luyện tập sân chùa); hai bên dùng kỹ năng đánh nhau, hết máu là thua, thắng/thua không ảnh hưởng gì; có thể gọi boss nếu có; tính điểm theo cách chơi, di chuyển, tung chiêu chính xác, độ hợp lý.
5. Mở rộng toàn map (sát vách núi, rừng cây) đều có quái; càng sâu càng nguy hiểm (cấp, máu, sát thương cao hơn).
6. Hạt sen KHÔNG ảnh hưởng sức mạnh; sức mạnh đến từ kinh nghiệm/cấp độ, kỹ năng, cách cộng chiêu, đồ, vật phẩm. (Phiên 133 đã bỏ số hạng sen khỏi `strengthOf` — kiểm lại cho đủ.)
7. Phó bản: tới địa điểm gặp NPC → chọn vào phó bản (khu rừng/kiến trúc toàn quái + thử thách), hiển thị riêng không nằm trong map chính. Quái thu phục xong hồi sinh mạnh hơn + to hơn theo cấp; sau 9 lượt hồi sinh xuất hiện BOSS CHÍNH to/mạnh hơn; thu phục xong rơi nhiều vật phẩm. Về map chính, phó bản đã chinh phục lần sau quay lại sẽ mạnh hơn.
8. Thu phục boss chính phó bản → trong túi hồ lô có MẢNH GHÉP yêu quái đó; đủ 3 mảnh → bấm “Ghép” → boss thành LINH THÚ trong hồ lô: gọi ra, cưỡi, chiến đấu cùng; kỹ năng boss tương tác với người chơi (hồi máu, hồi chiêu, tạo giáp) và với quái khác (trói chân, làm chậm, đóng bƒÉng, hất tung).

## Đã làm ở mục 1 (đều đã ĐẨY lên `main`, test 1048/1048 đạt)
Yêu cầu bổ sung trước đó của ptg: **“thu cá” chứ không phải “câu cá”, KHÔNG cầm cần; PC đi bằng A D W S (đã có sẵn trong `world.js`).**

| Việc | Cách làm | File |
|---|---|---|
| Ném cầu bằng TAY | động tác `throw` có sẵn; quả cầu rời tay (`handTip`) sau `THROW_RELEASE` = 0,3 s | `js/world/fishPose.js`, `js/ui/fishing.js`, `js/scene/fishing.js` |
| Bóng cá | hình con cá + VIỀN SÁNG (additive); bơi THẲNG vào, LAO chạm cầu mỗi lần rỉa rồi lùi ra, đầu cá quay theo hướng bơi; KHÔNG lượn vòng nữa (`fishShadow` trả thêm `face`, `yaw`) | `js/world/fishingView.js`, `js/scene/fishing.js` |
| Cá DÍNH | bóng cá giãy mạnh và bị KÉO dần về phía người, cầu chìm nhấp nhô, hai vòng sóng liên tục; dấu “!” cam trên đầu | `js/scene/fishing.js` |
| Cá lên | nước tung ở chỗ cá bị kéo; cá bay lên tay, to ×1,7; nhân vật GIƠ CÁ bằng hai tay (`act('show')`) | `scene/fishing.js`, `fishPose.js`, `avatarChibi.js` |
| Góc quay | `LGT.world.shot('cast'|'show'|'')`: chờ cá = nâng cao, nhân vật bên trái, nước phía trên-phải; cầm cá = cận cảnh trước mặt; đi xa 1,2 m thì tự về | `js/world/fishShot.js`, `js/world/world.js` |
| Thẻ cá | tên, MỚI, cỡ cm, kỷ lục (+“Kỷ lục mới”), biến thể, hạt sen; nút Thu cá / Phóng sinh; kỷ lục lưu `localStorage['lgt.fishrec']` | `js/world/fishCard.js`, `js/ui/fishing.js`, `css/fishing.css` |
| HUD | `body.fishing` ẩn `.hm-grid/.hm-bar/.hm-stand/#goto-hint` (giữ joystick); nút “Bấm!” là nút lớn duy nhất khi chờ cá (dock có sẵn) | `css/fishing.css` |
| Lỗi đã sửa | một dòng `st.to = castTarget(...)` bị nuốt vào chú thích trong bản đầu — đã sửa trước khi đẩy | `js/scene/fishing.js` |

## CÒN LẠI của mục 1 (chưa làm / chưa kiểm bằng mắt)
- **Chưa xem trên trình duyệt thật**: góc camera, tay giơ cá, viền bóng cá, dấu “!”, thẻ cá trên điện thoại nhỏ. Nếu ptg báo còn lệch so với clip: chỉnh `SHOTS` (fishShot.js: dyaw/pitch/dist), `OUT/NEAR/FAR` (fishShadow), `fishShape()` (hình bóng cá), vị trí “!” (`+2.75` trong scene/fishing.js).
- Chữ “câu cá” cũ còn ở `js/world/dock.js` (tooltip nút thả cầu, tiêu đề túi đồ “Quả cầu câu cá”) và được `tests/dock.test.mjs` #224 kiểm — đổi cả hai cùng lúc.
- Túi đồ kiểu clip (bảng cam toàn màn hình, tab biểu tượng, lưới 6 cột, nút X đỏ) và bố cục nút/joystick (4 mũi tên tam giác, nút nhảy lớn + 3 nút nhỏ) — CHƯA làm.
- Thời gian rỉa/cắn (`js/world/fishing.js`) giữ nguyên để không đổi cân bằng; clip chờ lâu hơn (~20 s).

## Việc kế: MỤC 2 (ván trượt → cưỡi cây thương bay)
Xem `js/ui/board.js` / `js/world/board*.js` (Phiên 92, `LGT.board`, `speedMul` ×2, nút `vantruot`) — đổi nhân vật đứng trên ván thành cưỡi thương (dùng chung cây côn/thương có sẵn ở `avatarChibi.js`), khóa cưỡi khi đang chiến đấu (`setStance`/skill), khi đánh: thương bay xoay 1 vòng rồi về tay. Chỉ đọc chỗ cần sửa.

## Ghi chú kỹ thuật
- Các phiên song song của ptg (129–135) đã đẩy thêm lên `main`; trước khi sửa tiếp phải `git pull` (hoặc đọc lại file từ GitHub), vì không có token để `git push` trong sandbox — đẩy bằng công cụ GitHub (`push_files`) cần gửi TOÀN BỘ nội dung file, nên sau khi đẩy phải so lại với `raw.githubusercontent.com`.
- `HANDOFF.md` quá lớn để đẩy qua công cụ: chưa thêm dòng “Cập nhật Phiên 136”; ptg/phiên sau thêm 1 dòng trỏ tới `docs/PHIEN128.md` + `docs/PHIEN136.md`.
