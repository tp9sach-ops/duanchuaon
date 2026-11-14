# PHIÊN 166 — Bàn giao (Lộ trình 14/11, mục 1: người khác THẤY đồ mình mua/dùng; XONG mã + test, CHƯA nhìn bằng mắt)

> Dán nguyên file này vào đầu phiên mới. Repo: https://github.com/tp9sach-ops/duanchuaon (nhánh `main`). Người dùng (ptg / Giang) nói tiếng Việt, không rành kỹ thuật: trả lời NGẮN GỌN, DỄ HIỂU, làm TỪNG MỤC. Đọc thêm `docs/PHIEN165.md`. (Lưu ý: `docs/PHIEN167.md`, `PHIEN168.md` là của mạch chiêu thức 3D làm song song; phiên kế tiếp dùng số 169 trở lên.)

## Quy tắc làm việc (chép nguyên văn)
"For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff."
- Làm từng mục, xong chạy test, đẩy `main`, báo, chờ "tiếp tục". Việc đã làm thì bỏ qua. Chỉ đọc chỗ cần sửa. Không báo test đạt nếu chưa chạy.

## Lỗi đã sửa
Người chơi mua + dùng vật phẩm (Gậy như ý, Nón Jingasa, cưỡi thương/gậy/ván, Bánh sầu riêng 3 vị / pho mai than tre) thì CHỈ máy mình thấy. Nguyên nhân: gói tin đa người chỉ có `{id,n,c,h,x,y,z,r,s}`, còn đồ được vẽ bằng cách bọc `LGT.world.avatar` của chính mình (js/ui/items.js, js/ui/board.js) — nhân vật người khác (js/net/room.js → createAvatar) không có gì.

## Cách làm
- **Gói tin thêm trường `i`** = chuỗi a-z, 1–8 ký tự, CHỈ gửi khi có đồ (rỗng thì không có khóa → gói tin cũ y nguyên). Bảng chữ: `n` cầm Gậy như ý · `k` đội Nón · `p` cưỡi Thương · `q` cưỡi Gậy · `v` lướt Ván · `h` Bánh 3 vị còn hạn · `d` Bánh pho mai than tre còn hạn. Logic thuần: `js/world/gearSync.js` (`encodeGear/decodeGear/cleanGear`).
- Đường đi: `js/net/room.js` (`selfGear()` tính từ `LGT.items.state` + `LGT.loadout.weapon` + `LGT.board.status()`; KHÔNG sửa `js/ui/items.js`) → `getSelf().i` → `roomClient` gửi `i` → `engines/room.js` (`cleanPlayer`, `createRemotes`) giữ/nội suy → `roomClient.frame` gọi `deps.applyGear(av, tok, dt)` → `js/ui/remoteGear.js` (`createGearView().apply/drop`) vẽ: gậy như ý đeo lưng + trên tay (thay cây côn mặc định), nón (`headHost`, `setHat`), cưỡi thương/gậy/ván dưới chân + nâng người (dùng lại `buildSpearMount/buildStaffMount/buildProcBoard` + `FLY_LIFT/FLY_BOB/VBOB/VBASE`, nay `export` từ `js/ui/board.js`), vòng sáng dưới chân (xanh lá = Bánh 3 vị, xanh trời lớn = Bánh pho mai than tre). `drop` dọn hết khi người đó rời / đổi áo.
- Các đường truyền đều mang `i`: `firebaseTransport.js`, `bridge.js` (Firebase↔Apps Script), `createLocalTransport` (tab cùng trình duyệt), `gas/Room.gs` (`roomGear_`, lưu + trả `i`).
- **Firebase tự lùi:** nếu luật Firebase CHƯA cập nhật thì ghi có `i` sẽ bị từ chối (`$other: false`). `firebaseTransport.js` bắt lỗi đó, đặt `gearBlocked`, gửi lại KHÔNG kèm `i` (người chơi không biến mất) và `console.warn` đúng một lần. Khi đã cập nhật luật thì cần tải lại trang để gửi `i` trở lại.
- `sw.js` VERSION `dgt-v162` → `dgt-v163` (buộc máy cũ lấy file mới).

## VIỆC PTG PHẢI LÀM THỦ CÔNG (không có trong mã)
1. **Firebase Console → Realtime Database → Rules**: dán lại nội dung `firebase/database.rules.json` (mới thêm khóa `"i"`) rồi **Publish**. Chưa làm thì người khác CHƯA thấy đồ trên đường Firebase (game vẫn chạy bình thường).
2. **Apps Script** (nếu dùng đường dự phòng): chép `gas/Room.gs` mới → Deploy → Manage deployments → Edit → **New version** (URL /exec giữ nguyên).

## Test
`tests/gearsync.test.mjs` (12 test, đã vào `npm test`): mã hóa/giải mã, làm sạch, `cleanPlayer`/`createRemotes` mang `i`, Firebase ghi/không ghi `i` + tự lùi khi luật từ chối, `Room.gs` trong vm, luật JSON, bridge, kênh cục bộ, `roomClient` (gửi `i`, gọi `applyGear`/`dropGear`, lỗi vẽ đồ không làm hỏng đồng bộ). Ngoài repo đã chạy thử `remoteGear.js` với three.js 0.160.1 thật ở Node (avatar giả): bật/tắt gậy, nón, cưỡi gậy/ván/thương (độ cao ≈0,46 / 0,14 / 0,44), 2 vòng bánh, cất đồ về 0, `drop` trả số node về mức ban đầu. `npm test` toàn bộ: 1164 test, 1163 đạt; 1 lỗi là `tests/fireflies.test.mjs` "không đứng yên: sau 20 s mỗi con đã di chuyển" — test dùng Math.random nên thỉnh thoảng trượt (~10% số lần chạy), không liên quan phiên này; chạy lại là đạt. Sau khi gộp lại với nhánh mới nhất (có PHIEN167/168), chạy lại 76 test liên quan (gearsync, room, transport, bridge, board, bag): đạt.

## CHƯA làm / lưu ý
- **CHƯA nhìn bằng mắt** (không có WebGL). ptg thử bằng 2 máy/2 tab: máy A mua gậy/nón/ván/bánh rồi cưỡi, máy B phải thấy. Số vị trí/độ sáng là số của đồ mình đã có.
- Chưa đồng bộ: vòng sáng lan + rồng hồng khi đánh gậy (cần gói tin "đang vung"), ván GLB 3D (người khác thấy ván khối), thế chiến đấu của người khác (nên cây gậy trên tay hầu như ẩn, thấy gậy đeo lưng), thương cưỡi hạ xuống/bay về tay khi vào trận.
- Người chơi mới vào: nếu hồ lô / lưng không có (`backHost` null, ví dụ thân không phải chibi) thì chỉ thấy phần nón/cưỡi/vòng sáng.

## Việc tiếp theo (lộ trình 14/11, mục 2…)
Hỏi ptg: sau khi thử mục 1 ổn, làm mục kế tiếp trong lộ trình (xem PHIEN164/165 và memory của ptg).

## Prompt bàn giao (dán vào phiên mới)
Bạn tiếp tục dự án Diệu Giang Tự (https://github.com/tp9sach-ops/duanchuaon, nhánh main). Quy tắc: For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff. Đọc docs/PHIEN166.md, clone repo, chạy `npm test`. Hỏi ptg đã thử mục 1 (người khác thấy đồ) chưa và làm mục kế tiếp. Xong thì chạy test, viết docs/PHIEN169.md, đẩy main, báo ptg và chờ "tiếp tục".
