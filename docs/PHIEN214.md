# Phiên 214 — MỤC 1 (đợt 3): NỐI "quái bị trúng chiêu" vào game

> Repo `https://github.com/tp9sach-ops/duanchuaon` nhánh `main`. Đọc sau `docs/PHIEN213_TOAN_MAN_HINH.md`.
> Yêu cầu ptg (2026-11-17): xem lại repo, việc đã làm thì bỏ qua; làm từng mục, xong đẩy GitHub rồi báo. Danh sách 7 mục: 1) hiệu ứng/âm thanh/hình ảnh/tư thế mục tiêu bị chiêu trúng · 2) dùng chiêu tốn mana · 3) hiệu ứng/âm thanh/tư thế khi (người chơi) bị đánh trúng · 4) kiến trúc nhìn thấy được đều đứng lên được, không lún · 5) bầu trời không vật cản thì bay qua được · 6) đồ họa/đòn đánh/chiêu/tầm đánh của yêu quái · 7) người chơi ảo (lệnh `/nguoichoiao`, chỉ người gõ thấy tin).

## Phát hiện
Phiên 213 đã viết đủ bộ phản ứng trúng chiêu (`js/world/hitReact.js` logic thuần, `js/ui/hitReact.js` điều phối, `js/scene/chieuTrungFx.js` hình dựng, `js/scene/farm.js` vẽ tư thế `m.rx`, `js/ui/farm.js` gọi `LGT.hitReact.onHit`) **nhưng `initHitReact()` KHÔNG ai gọi** → `LGT.hitReact` luôn `undefined` → trong game quái trúng chiêu không giật/ngã, không tiếng trúng, không tia lóe/số. Ngoài ra `tests/hitreact.test.mjs` được nhắc trong đầu file nhưng chưa tồn tại.

## Đã làm
1. `js/main.js`: thêm `import('./ui/hitReact.js').then((m) => m.initHitReact())` cạnh `initBtnScale` (nạp lười, lỗi thì chỉ cảnh báo, game vẫn chạy).
2. `tests/hitreact.test.mjs` (MỚI, 7 test: kế hoạch trúng, bị đẩy ra xa kẻ đánh, mức nặng ngã hơn, boss không ngã, chất liệu âm, ngân sách hiệu ứng nhiều quái, kiểm "đã nối" trong main.js/farm.js/scene/farm.js) + thêm vào `npm test`.
3. Sửa 2 test đỏ có sẵn do Phiên 213 đổi code mà test còn kiểm chuỗi cũ: `tests/aimswipe.test.mjs` (`skillHitDir(..., hinh, sk.id)`, `pickAllInDir`) và `tests/basiccombo.test.mjs` (`around.forEach((m, k) => hit(m.uid ...`). Chỉ sửa biểu thức kiểm, không sửa code game.
4. `sw.js` VERSION `dgt-v200` → `dgt-v201`.

## Đã kiểm / CHƯA kiểm (nói thật)
- `npm test` đầy đủ (trước khi sửa 2 test cũ): 1377 test, 1375 đạt, 2 đỏ (chính là 2 test cũ ở mục 3). Sau khi sửa chạy lại riêng `aimswipe + basiccombo + hitreact`: 18/18 đạt. CHƯA chạy lại toàn bộ lần nữa sau khi sửa (chỉ đổi biểu thức kiểm trong 2 test).
- `node --check` các file sửa: sạch. File đã đẩy lên GitHub đã so từng byte với bản local: giống hệt.
- CHƯA nhìn bằng mắt trong game thật (môi trường AI không có WebGL/chuột): ptg cần thử đánh quái bằng chiêu (nhất là chiêu vùng trúng nhiều quái) và xem quái giật/ngã, nghe tiếng, thấy tia + số.
- Các con số (giật, lùi, ngã) vẫn là TẠM.

## Việc kế
- Mục 2: dùng chiêu tốn mana (tìm "mana"/"chân khí" trong `js/ui/farm.js`, `js/world/skillEngine.js`, `js/ui/heSkill.js` — `rt.tryCast` là chỗ chặn khi thiếu).
- Mục 3 → 7 theo thứ tự danh sách trên.

## PROMPT BÀN GIAO CHO PHIÊN SAU (dán nguyên văn)
```
Dự án DIỆU GIANG TỰ — repo https://github.com/tp9sach-ops/duanchuaon (main). Đọc PROMPT.md rồi docs/PHIEN214.md. Chỉ đọc chỗ cần; việc đã làm thì bỏ qua; cập nhật KHÔNG được gây lỗi (git clone repo, `setsid nohup npm test > /tmp/t.log 2>&1 < /dev/null &`, đợi "# fail"; ~5 phút). Đẩy GitHub bằng công cụ github push_files (đẩy ĐỦ file cả nhóm trong một lần), rồi tải lại từ raw.githubusercontent.com để so từng byte. ptg nói tiếng Việt, không rành kỹ thuật: trả lời ngắn gọn dễ hiểu; làm từng MỤC; sửa code bằng find-and-replace.
Tình hình: Mục 1 (quái trúng chiêu) đã nối xong ở Phiên 214. Việc phiên này: Mục 2 (chiêu tốn mana). Xong: tăng sw.js VERSION (hiện dgt-v201), thêm docs/PHIEN<N>.md có prompt bàn giao như file này, đẩy GitHub, báo ptg, chờ "tiếp tục".
```

## QUY TẮC BÀN GIAO (nguyên văn)
> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff
