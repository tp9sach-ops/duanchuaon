# Phiên 220 — Mục 1: mọi người chơi thấy chiến đấu của nhau

## Vấn đề
Quái bãi rừng sinh riêng trên từng máy (`js/world/spawn.js`) và mạng chỉ gửi vị trí / tư thế đi / đồ → người chơi không thấy đòn đánh, chiêu, hiệu ứng, âm thanh, quái đang bị đánh, máu quái, động tác quái của nhau.

## Cách làm
Thêm một kênh riêng **`/combat/{uid}`** trên Firebase (TÁCH khỏi `/players`, nên luật cũ chưa có nhánh này cũng không làm ai biến mất). Gói = `{ t, r (phòng), a (hành động), m (quái đang đánh) }`, chuỗi chỉ gồm `[A-Za-z0-9_.,;:-]`.

- `js/world/combatShare.js` (thuần, có test): mã hóa gói; hộp gửi (điều tiết ≤ ~8 lần/giây, 3 giây báo còn đây khi đang có quái); hộp nhận (không phát lại đòn cũ, bỏ trùng theo số thứ tự); **bóng quái** (nội suy, mộ chống dựng lại, hết hạn 6 giây).
- `js/net/combatLink.js` (keo, có test với đồ giả):
  - PHÁT: bọc `avatar.cast`, `avatar.swing` (mọi đường tung chiêu/vung đòn) và `LGT.hitReact.onHit` (mọi lần trúng quái); mỗi 100 ms đọc quái mình đang đánh (`m.eng`, ≤ 40 m).
  - NHẬN: cùng phòng/zone thì người khác thấy nhân vật bạn làm tư thế chiêu + hiệu ứng 3D chiêu (bộ `createChieuFx` riêng, không rung màn hình của mình), vệt chém + tiếng; bóng quái (bộ `buildFarm()` riêng) có thanh máu, vòng đỏ báo đòn, tư thế/tiếng/hiệu ứng khi bị trúng (`LGT.hitReact.onHit` trên bóng quái).
- `js/net/firebaseTransport.js`: `sendCombat(pkt)`, `combat()`; bị luật từ chối → `combatBlocked` (thôi gửi, in một dòng nhắc, đi lại vẫn bình thường); `onDisconnect` + `close()` xóa gói của mình.
- `js/net/room.js`: khởi tạo `createCombatLink` (tải lười, lỗi thì chơi như cũ); lấy nhân vật 3D người khác theo id qua cặp `xform`/`applyGear`; Võ đài KHÔNG phát ra kênh này (đã có kênh gói riêng `#dg…`).
- `firebase/database.rules.json`: thêm nhánh `combat` (`a` ≤ 600, `m` ≤ 800, `r` ≤ 40 ký tự, `$other` false).

## BẮT BUỘC (ptg làm một lần)
Dán lại **`firebase/database.rules.json`** vào Firebase Console → Realtime Database → Rules → **Publish**. Chưa làm thì kênh bị từ chối (console có cảnh báo) và người khác chưa thấy đòn/quái của bạn.

## Giới hạn đã biết
- Chỉ chạy khi đang dùng Firebase (rớt xuống Apps Script thì không có đồng bộ chiến đấu).
- Bóng quái chỉ để XEM: không đánh trúng được, không trừ máu thật; máu do người đang đánh con đó quyết định. Quái người khác đánh không tự đuổi/đánh MÌNH.
- Yêu quái hằng tháng (`js/ui/yeuquai.js`) chưa nằm trong lần này.
- Chưa nhìn bằng mắt (môi trường AI không có WebGL): vệt chém / hiệu ứng / bóng quái của người khác cần playtest 2 trình duyệt.
- Hiệu ứng, âm thanh, tư thế khi NGƯỜI CHƠI bị đánh trúng = mục 3 (chưa làm).

## Test
`tests/combatshare.test.mjs` (13 test, thêm vào `npm test`): mã hóa, hộp gửi/nhận, bóng quái, keo nối, Firebase `/combat`, khớp luật.

sw.js: dgt-v207.
