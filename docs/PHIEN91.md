# PHIÊN 91 — Mục 1/3: KHIÊNG người chơi 2 giây rồi NÉM — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Đọc: PROMPT.md → PHIEN90.md → file này. Nguồn mã thật: repo `tp9sach-ops/duanchuaon`, nhánh `main`.

## Yêu cầu Gp (2026-11-10, 13:57)
Ba việc, **làm TỪNG MỤC, xong mục nào đẩy GitHub rồi chờ Gp bấm "tiếp tục"** mới làm mục kế:
1. **Ném người chơi: cho phép KHIÊNG người chơi trong 2 giây rồi ném đi** — hiện tại chưa khiêng được, chỉ ném. ← **PHIÊN NÀY LÀM MỤC NÀY.**
2. Xem lại thao tác thêm kỹ năng **đánh tay cầm côn, chém ra khí** (chưa làm).
3. Xem lại **độ mượt + cách di chuyển/dùng kỹ năng**: hiện rất lag, di chuyển khó, khó thao tác (chưa làm).

## Cách hiểu của mình (nếu sai Gp bảo)
- "Khiêng 2 giây rồi ném" = bấm **Khiêng người** → nhấc người đó lên vai → có **tối đa 2 giây**; bấm **Ném** là ném ngay (thẳng trước mặt), **không bấm thì hết 2 giây tự ném** (người bị khiêng không bị giữ lâu). Có nút **Thả xuống** để đặt họ xuống, không mất hạt sen.
- Luật giữ nguyên (Gp chốt 08/11): chỉ khiêng/ném người **cấp VÀ sức mạnh nhỏ hơn mình**; mình phải nhấc nổi 55 kg; **không khiêng/ném trong chùa**; không khiêng người đang thiền; **hồi chiêu 10 giây mỗi cặp** (tính từ lúc khiêng); người bị ném **rơi an toàn, không mất gì**; người ném **−1 hạt sen** (trừ khi ném thành công, thả xuống thì không mất).

## Đã làm
**Luồng mới:** `Khiêng người` (có người ở gần, nút trong cụm nút góc phải-dưới) → `Ném` (to, sáng) + `Thả xuống`, dòng chữ "Đang khiêng X · tự ném sau N giây".
- **Máy khách người khiêng** (`js/ui/throwPlayer.js`, viết lại): `grab()` / `throw()` / `drop()`; hiện người đó nằm trên vai NGAY (không chờ mạng), máy chủ xác nhận sau; hết 2 giây tự ném; vào nhà/mở bảng/ngồi thiền → tự thả. Luật chung dùng `js/world/throwNet.js` (`HOLD_MS = 2000`, `planGrab`, `planHeldThrow`, `holdLeft`, `heldInfo`, lý do mới `held / busy / nothold`).
- **Máy chủ** (`gas/Throw.gs`, viết lại): 3 lệnh trong action `thr`: `g:1` khiêng (kiểm luật + cự ly ≤ 6 m + hồi chiêu, đánh dấu người kia "đang bị khiêng" tối đa 2 s + 2,5 s dự phòng mạng chậm), `{lx,lz}` ném (CHỈ khi mình đang khiêng đúng người đó, còn hạn), `rl:1` thả. Người bị khiêng nhận `held:{f,n,ms}` ở lượt thăm dò; quá hạn tự thả (phòng người khiêng mất mạng). Sửa luôn lỗi cũ: lý do `invalid` chưa được trả về.
- **Người bị khiêng** (máy họ): `LGT.heldBy` = mã người khiêng; nhân vật **đứng yên, nằm vắt ngang vai** và bám theo người khiêng (`LGT.world.hold(...)` mới trong `js/world/world.js`); bị khóa đi/nhảy (`js/ui/skill.js`) và ẩn cụm nút; bị ném → dịch tới điểm rơi (đường cũ). Thăm dò **dày hơn (1 s thay 2,5 s)** khi có người đứng gần ≤ 9 m để biết sớm (Apps Script không realtime).
- **Hình** (`js/net/roomClient.js`, `js/net/room.js`): `LGT.room.hold(id)` đặt người đó trên vai mình (nằm vắt); `LGT.room.toss(id, to)` cho họ **bay vòng cung** tới điểm rơi (giống vật khiêng), rồi vị trí thật từ mạng tiếp quản.
- **Nút** (`js/world/dock.js`, `js/ui/dock.js`): `khiengnguoi` (🤲), `nemnguoi` (🙌 "Ném"), `thanguoi` (⬇️ "Thả xuống"); khiêng/ném người là nút **phản xạ nhanh** (bấm xuống là chạy) vì cửa sổ chỉ 2 giây. Lời chỉ chỗ bấm mới cho `khiengnguoi`.
- `sw.js` = `dgt-v97`.

## ⚠️ GP PHẢI LÀM (bắt buộc, nếu không nút Khiêng người sẽ báo lỗi)
**Cập nhật Apps Script:** mở dự án Apps Script → dán lại nội dung `gas/Throw.gs` mới (thay file `Throw.gs` cũ) → **Deploy → Manage deployments → Edit → New version** (URL `/exec` giữ nguyên). Chưa cập nhật thì bấm Khiêng người sẽ hiện "Máy chủ chưa cập nhật tính năng khiêng người". (Các file `.gs` khác không đổi.)

## Kiểm
- `npm test`: **824/824** (Node 22; trước phiên là 812). Test mới: `tests/khiengnguoi.test.mjs` (5 bài, chạy NGUYÊN `throwPlayer.js` của HAI máy + NGUYÊN `Throw.gs` trong máy ảo: khiêng → người kia biết/bám vai → tự ném sau 2 s → rơi đúng điểm, −1 hạt sen; ném sớm; thả xuống; từ chối (cấp bằng, hết sen, xa, trong chùa); hồi chiêu). `tests/throwNet.test.mjs` (+6 bài, 6 bài cũ chuyển sang luồng khiêng-rồi-ném), `tests/dock.test.mjs`, `tests/room.test.mjs` (+1: roomClient hold/toss). Đã thử PHÁ code cố ý (tắt tự ném, tắt thông báo bị khiêng) → test đỏ đúng chỗ, rồi khôi phục.
- **CHƯA xem bằng mắt / chưa thử hai máy thật:** môi trường này không tải được three.js và không gọi được Apps Script thật. Tư thế "nằm vắt vai" (xoay 1,3 rad) và độ cao 2,05 m trên vai là số đoán, cần Gp nhìn thử.

## Giới hạn đã biết
- Apps Script không realtime: người bị khiêng chỉ biết mình bị khiêng sau **≤ ~1 giây** (thăm dò dày) → chỉ còn khoảng 1 giây thấy mình trên vai trước khi bị ném; cú ném tới ở lượt thăm dò kế. Muốn mượt thật phải chuyển đường `thr` sang Firebase (phiên riêng, Gp duyệt).
- Người thứ ba thấy người bị khiêng bám vai người khiêng theo dữ liệu vị trí (trễ ~1–2 s) — chưa có đồng bộ riêng.
- Người đứng gần vẫn thấy nút "Khiêng người" trong lúc người kia còn đang bay trên không (máy chủ sẽ từ chối bằng "hồi chiêu").
- Con số (2 giây, độ cao vai, thăm dò 1 s, dự phòng 2,5 s) là QUY ƯỚC TẠM, chờ Gp duyệt.

## VIỆC KẾ (làm từng mục, xong báo, chờ Gp "tiếp tục")
2. **Kỹ năng "cầm côn, chém ra khí"** (mục 2 của Gp): chưa điều tra. Cần đọc `js/world/yeuquai.js` / `js/ui/yeuquai.js` (kỹ năng chiến đấu hiện có: ném đá, thương, thiết đầu công `js/world/thietDau.js`) rồi thiết kế kỹ năng tầm xa "khí kiếm" (nút mới trong `js/world/dock.js`, hồi chiêu, sát thương, hiệu ứng 3D). Hỏi Gp nếu cần: "côn" là côn nhị khúc hay gậy dài? khí chém bay thẳng hay vòng cung?
3. **Độ mượt + thao tác** (mục 3): đo `perf` (`js/scene/perfLogic.js`, `tests/perf.test.mjs`), xem vòng lặp `setInterval 120 ms` của `js/ui/dock.js` (gọi `status()` của mọi hệ mỗi 120 ms + `fit()` đo layout), các `setInterval` khác, độ lag chạm/joystick (`js/world/world.js`), số vật/đổ bóng; có thể thêm chế độ "mượt" tự giảm đồ họa. **Đo trước, sửa sau; báo số đo trước/sau.**

## Prompt khởi động cho phiên sau (dán nguyên)
> Đọc PROMPT.md → HANDOFF.md (đầu file) → docs/PHIEN91.md. Repo `tp9sach-ops/duanchuaon`. Mục 1 (khiêng người 2 giây) đã xong và đã đẩy GitHub. Gp bấm "tiếp tục" → làm **mục 2: kỹ năng cầm côn chém ra khí** (xem "VIỆC KẾ" trong PHIEN91.md). Làm một mục, `npm test`, đẩy GitHub, cập nhật PROMPT/HANDOFF/docs, gửi bàn giao, rồi CHỜ Gp nói "tiếp tục" mới sang mục 3.
