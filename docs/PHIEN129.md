# Phiên 129 — Mục 1: game chạy trong khung (iframe) hiển thị đủ, không mất khúc

## Quy tắc người dùng (chép nguyên văn)
For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff.

## Yêu cầu ptg (12/11) — làm TỪNG MỤC, xong mục nào đẩy GitHub rồi báo, chờ "tiếp tục"
1. Sửa để chạy trong khung web game vẫn hiển thị đủ, không mất khúc, mọi dòng điện thoại. ← PHIÊN NÀY
2. Quái rừng phải tấn công khi người chơi đánh. Đêm quái tràn ra ngoài; ngày quái nằm trong bụi rừng; tăng số quái cả ngày lẫn đêm.
3. Mở rộng toàn map (sát vách núi, rừng cây) đều có quái; càng sâu/xa càng nguy hiểm: cấp cao, máu trâu, sát thương lớn.
4. Hạt sen KHÔNG ảnh hưởng sức mạnh; sức mạnh đến từ kinh nghiệm/cấp độ, kỹ năng, cách cộng chiêu, đồ, vật phẩm.

## Đã làm (mục 1)
- `js/ui/viewportLogic.js`: thêm `frameClip(innerH, rect)`; `viewportState` nhận thêm `frame` → ghi `--vv-top`, thu `--vvh` về đúng vùng khung đang nhìn thấy, `data-frame`. Bàn phím ảo mở thì bỏ qua.
- `js/ui/viewport.js`: `watchFrame()` — chỉ chạy khi `window.self !== window.top`; đặt `data-embedded=true`; đo vùng nhìn thấy bằng IntersectionObserver (sentinel fixed, 101 ngưỡng; hoạt động cả khi trang cha khác tên miền). Tuỳ chọn: trang cha gửi `postMessage({dgt:'frame', top, bottom})` (toạ độ trong khung).
- `css/responsive.css`: `.hud,.enter{top:var(--vv-top,0px)}` (đã có height = --vvh).
- `tests/viewport.test.mjs`: +2 test. `npm test` đầy đủ: 1039 test, 1039 đạt.
- `sw.js`: dgt-v130 → dgt-v131.

## Chưa kiểm được
- Chưa mở bằng trình duyệt/điện thoại thật, chưa thử trong khung thật (Google Sites / trang khung). IntersectionObserver trong iframe khác tên miền: theo chuẩn trả `intersectionRect` theo toạ độ của khung; cần ptg thử trên iPhone Safari + Android Chrome.
- Nếu ptg có trang khung riêng: cho đường dẫn/mã trang khung (cần `height:100%` / `100dvh`, `allow="fullscreen"`), có thể thêm đoạn gửi postMessage chính xác hơn.
- Chưa chạy lại test sau khi đẩy lên GitHub bằng bản clone mới (đã chạy trên bản clone cục bộ trước khi đẩy).

## Việc kế: mục 2 (quái tấn công khi bị đánh; ngày/đêm; tăng số lượng) — file liên quan: `js/world/monsterAttack.js`, `yeuquai.js`, `spawn.js`, `daycycle.js`, `combat.js`; test `monsterattack/yeuquai/spawn/daycycle`.
