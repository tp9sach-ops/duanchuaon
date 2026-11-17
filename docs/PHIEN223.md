# Phiên 223 — Mọi người thấy nhau (giai đoạn 3): rồng hồng Gậy như ý, thế chuẩn bị trước khi đánh, cú nhảy

## Yêu cầu của ptg (2026-11-17)
1. Hiệu ứng **rồng hồng** của người dùng Gậy như ý chưa thấy (người khác không thấy).
2. **Tư thế trước khi đánh** chưa thấy (người khác chỉ thấy khi vung đòn).
3. **Người khác nhảy lên** mình chưa thấy.
4. **QUY TẮC CỐ ĐỊNH:** đây là game online — MỌI thứ ptg xây (hiệu ứng, tư thế, nhảy, đánh, kỹ năng, vật phẩm...) phải **đồng bộ để tất cả người chơi thấy nhau**. Ghi ở PROMPT.md mục 6b + mục 7.

## Nguyên nhân tìm thấy
- Rồng (`js/ui/dragonFx.js`) chỉ được sinh quanh nhân vật CỦA MÌNH (`items.js` → `onNormalHit`), không có gì phát đi → người khác không bao giờ thấy.
- Thế sẵn sàng chiến đấu (`setStance`) của người khác chỉ bật ở `playSwing`/`playCast` (sau khi họ đã vung) → không thấy tư thế TRƯỚC khi đánh.
- Cú nhảy: vị trí gửi tối đa 4 lần/giây (`SEND_MIN_MS` 250 ms) + tick mỗi ~250 ms + độ cao nội suy chậm (hệ số 8) → cú nhảy ngắn bị bóp phẳng / không thấy.

## Đã làm
- **combatShare.js:** tư thế `f` thêm chế độ `s` (đứng thế chiến đấu); hành động mới `r` (rồng hồng: `seq,r,ry`).
- **combatLink.js:** phát `s` khi `LGT.combatPose.stance`; nhận `s` → `markStance` NGAY, nhận `n` → hạ thế (trừ khi vừa vung đòn ≤ 1,2 s); `sendDragon(ry)`; nhận `r` → `dragonFx.spawn(pos, ry, track)` với `track` = vị trí SỐNG của avatar người đó (rồng bay theo họ); `poseOf` trả null cho `s`; `frame()` cập nhật rồng người khác.
- **dragonFx.js:** `createDragonFx(scene, max)`, `spawn(center, ry, track)` — mỗi con rồng có thể bám một vị trí riêng.
- **dragonFx.js `spawn`:** rồng của MÌNH (không có `track`) tự gọi `LGT.combatLink.sendDragon(ry)` → không phải sửa `items.js`; rồng của người khác (có `track`) không phát lại.
- **room.js:** dựng bộ rồng riêng cho người khác (tối đa 6 con) truyền vào combatLink.
- **Nhảy:** `firebaseTransport.js` gửi mỗi 80 ms khi trên không (`SEND_AIR_MS`, gồm cả lần chạm đất); `roomClient.js` tick ≤ `ROOM_CFG.airPollMs` (80 ms) khi mình đang trên không (chỉ đường truyền nhanh; Apps Script giữ nhịp cũ); `engines/room.js` độ cao bám nhanh (hệ số 22 khi lệch > 0,12 m).
- Test mới `tests/sync223.test.mjs` (7). `npm test` 1415/1415. `sw.js` = `dgt-v209`.

## CHƯA kiểm / rủi ro
- Chưa nhìn bằng mắt trên máy thật (môi trường AI không có WebGL/2 trình duyệt): cần ptg mở 2 máy cùng khu: (a) A cầm Gậy như ý đánh thường 3 đòn → B thấy rồng hồng quanh A; (b) A đi gần quái → B thấy A khom thế sẵn sàng trước khi A vung đòn; (c) A nhảy / bay lướt → B thấy A bay lên hạ xuống mượt.
- Không cần dán lại luật Firebase (không đổi trường; chỉ thêm ký tự trong chuỗi `a` của /combat).
- Tư thế "nhảy" của người khác chỉ là độ cao thật (y); chưa có hoạt ảnh co chân riêng cho cú nhảy thường (người khác thấy người nhấc lên hạ xuống). Bay lướt đã có tư thế riêng (Phiên 222).
- Ghi chú còn lại từ Phiên 222: hiệu ứng/âm thanh/tư thế khi người chơi bị đánh (mục 3), kiến trúc đứng được, bay qua trời trống, yêu quái (6), người chơi ảo `/nguoichoiao` (7); đồng bộ hoạt động khác (ném/bê, câu cá, ngồi...).

## Mục tiếp theo (chờ ptg báo "tiếp tục")
Theo yêu cầu 2026-11-16 đợt 2: (1) hiệu ứng/âm thanh/tư thế của MỤC TIÊU khi bị trúng chiêu → KIỂM TRA mọi hiệu ứng mới cũng đồng bộ cho người khác thấy.

## Prompt bàn giao cho phiên sau (không có trí nhớ vẫn làm đúng)
Đọc PROMPT.md (mục 6b: QUY TẮC ĐỒNG BỘ ONLINE) rồi docs/PHIEN223.md. Repo https://github.com/tp9sach-ops/duanchuaon, nhánh main, `npm test` phải đạt. Làm TỪNG MỤC, xong đẩy GitHub rồi báo ptg. Mọi thứ mới (hiệu ứng, tư thế, âm thanh, vật phẩm) phải đồng bộ cho người chơi khác thấy: dùng kênh /combat (js/world/combatShare.js: thêm hành động mới + js/net/combatLink.js phát/nhận) hoặc /players (vị trí, trạng thái, `i` vật phẩm). Mã thật trong repo đúng hơn tài liệu.
