# PHIÊN 35 — Xây nhà, BƯỚC 1/6: đổi hạt sen lấy lá bồ đề (BÀN GIAO)

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

**Nền:** `main` sau Phiên 34 (`3b55fec`). Luật và kế hoạch 6 bước: `docs/PHIEN34.md` (mục "QUYẾT ĐỊNH CỦA PTG").

## Đã làm
- `js/world/merit.js` (logic thuần, test `tests/merit.test.mjs`): `SEN_PER_LA=10`, `LAND_LA=100`; `exchange(leaf, sen, n)`, `maxLa`, `loadLeaf` (dữ liệu hỏng/sửa tay được chỉnh lại), `lifetimeSen(sen, leaf)` = sen còn + đã đổi; `addMeditation(leaf, dt, now)`: ngồi thiền 180 giây thật = 1 hạt sen, trần 10 hạt/ngày, mỗi lần cộng ≤ 2 giây.
- `js/ui/merit.js` + `css/merit.css`: thẻ "N lá" cạnh hạt sen; bảng "Đổi lá bồ đề" (đổi 1 / 5 / tối đa); lưu `localStorage['lgt.la']`; thưởng hạt sen khi `LGT.world.mode==='meditate'` và tab đang mở. `LGT.merit = { open, close, leaf, spent }`.
- `js/ui/hudMenu.js`: `spendMerit(n)` trừ hạt sen; `pushScore` gửi TỔNG sen từng kiếm (sen còn + đã đổi) để đổi lá không làm tụt bảng xếp hạng và máy chủ không "trả lại" sen đã tiêu (nếu không sẽ sinh sen vô hạn).
- `js/ui/npc.js`: thưa chuyện với **Thầy Tri khách** (`trikhach`, Nhà Khách) sẽ mở bảng đổi lá (không thêm NPC mới để khỏi làm hỏng test vị trí/chỉ số NPC). Muốn NPC riêng thì làm ở bước 2 cùng bác khu phố.
- `index.html` nạp `css/merit.css`; `tests/smoke.mjs`, `package.json`, `sw.js` `dgt-v35`. `npm test`: **484/484 đạt**.

## CHƯA kiểm / giới hạn
- CHƯA mở trình duyệt thật (không có three.js cục bộ): chưa nhìn bảng/thẻ trên điện thoại; test nối giao diện chỉ kiểm bằng đọc mã nguồn.
- Ví chỉ ở máy người chơi nên sửa localStorage được (xác nhận máy chủ làm ở bước 6). Sen từ nguồn khác (tưới cây hằng ngày, tụng kinh...) mới có thiền; nguồn còn lại thêm dần.
- Chưa dùng lá để mua gì (đất là bước 2).

## Việc kế (chờ ptg "tiếp tục")
Bước 2: lô đất + xóm 10 nhà + mua đất 100 lá + tặng nhà trống + NPC bác khu phố đổi xóm xem. Xem `docs/PHIEN34.md`.
