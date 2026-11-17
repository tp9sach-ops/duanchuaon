# Phiên 222 — Mọi người chơi thấy nhau (giai đoạn 2): máu quái dùng chung, bay lướt / lao, hiệu ứng tức thì

## Đã làm
- **combatLink gắn lại avatar** mỗi khi world.js dựng nhân vật mới (WeakSet) → hết lỗi "không thấy đòn đánh của nhau". Gửi tức thì (flush setTimeout 0), nhịp gửi 80 ms, tick 40 ms.
- **Máu quái dùng chung**: đánh vào *bóng quái* (quái người khác đang đánh) → `LGT.farm` gọi `combatLink.sendDamage` (action `d`); chủ quái trừ máu THẬT bằng `LGT.farm.remoteHit`. Có đoán trước máu để thấy tức thì.
- **Last-hit**: chủ quái báo `k` (quái chết, người đòn cuối); chỉ người đòn cuối gọi `LGT.farm.claimKill` nhận thưởng, chủ quái KHÔNG nhận khi người khác kết liễu.
- **Bay lướt / lao (thiết đầu công)**: action `f` (g=lướt, d=lao đầu cúi, r=lao chạy, n=hết) + độ nghiêng. `roomClient.frame` hỏi `deps.poseOf(id)` (room.js nối `LGT.combatLink.poseOf`) để vẽ đúng tư thế.
- Hiệu ứng trúng đòn ghi cả người đánh (`by`) để tư thế/tiếng bị đánh đúng hướng.
- Test: `combatshare222.test.mjs` (6), `farmshared222.test.mjs` (3); sửa regex tĩnh `aimswipe` / `basiccombo` cho `allMons()`. sw `dgt-v208`. Đăng ký thêm `combatshare.test.mjs` (Phiên 220) vào `npm test`.

## Việc ptg cần làm
- Luật Firebase nhánh `/combat` đã có trong `firebase/database.rules.json` (Phiên 220) — nếu chưa dán lên Firebase Console → Rules → Publish thì dán lại.
- Chơi thử bằng 2 trình duyệt (cùng zone): xem đòn, chiêu, máu quái chung, bay/lao.

## Còn lại
Đồng bộ các hoạt động khác (ném/bê, câu cá, ngồi…), hiệu ứng/âm thanh/tư thế khi người chơi bị đánh (mục 3), kiến trúc đứng được, bay qua trời trống, yêu quái (6), người chơi ảo `/nguoichoiao` (7).
