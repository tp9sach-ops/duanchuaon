# PHIÊN 165 — Bàn giao (Bản 2 chiêu thức: mục 6 — hiệu ứng, âm thanh, bản giảm cho 30 chiêu; XONG mã + test, CHƯA nhìn bằng mắt)

> Dán nguyên file này vào đầu phiên mới. Repo: https://github.com/tp9sach-ops/duanchuaon (nhánh `main`). Người dùng (ptg) nói tiếng Việt, không rành kỹ thuật: trả lời NGẮN GỌN, DỄ HIỂU, làm TừNG PHIÊN/TừNG MỤC. Đọc thêm `docs/PHIEN158.md`, `docs/PHIEN163.md`, `docs/PHIEN164.md`.

## Quy tắc làm việc (chép nguyên văn)
"For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff."
- Làm từng mục, xong chạy test, đẩy `main`, báo, chờ "tiếp tục". Việc đã làm thì bỏ qua. Chỉ đọc chỗ cần sửa. Không báo test đạt nếu chưa chạy. Khi sửa code: đưa đoạn "tìm" đầy đủ rồi code thay thế đầy đủ.

## Mục 6 — làm gì
Lần làm trước (phiên chat trước) bị mất vì chưa đẩy lên GitHub; phiên này làm lại từ đầu, kiểm bằng `npm test` = **1152/1152 đạt** (có 7 test mới).
1. `js/data/chieuFx.js` (dữ liệu thuần, số TẠM): `CHIEU_FX[id]` cho đủ 30 chiêu: kiểu bay hạt (`tia|no|xoay|mua|hut`), loại hạt, số hạt bậc "vừa", vệt, quầng sáng, rung, khựng đòn (ms), tiếng `am {gong, phat, trung}`. `FX_COLOR` (2 tông/Hệ), `FX_LOAI`, `HAT_TOI_DA = {yeu:150, vua:300, cao:800}`. Tiếng CHỈ dùng cue CÓ SẴN trong `js/world/sfx.js` (không thêm file âm thanh).
2. `js/world/chieuFxPlan.js` (logic thuần): `tierOf(perfLevel)` (0-1 cao, 2-3 vừa, 4-5 yếu), `lapKeHoach(id, tier)`, `trongHinh`, `hopBao`, `vienDiem`, `hoaVanDoan`. Hoa văn đúng Hệ: Kim vạch chéo, Mộc lá, Thủy gợn sóng, Thổ ô vuông, Hỏa sọc nhọn; viền đỏ ngà (gây hại) / xanh nhạt (có lợi). **Bản giảm:** yếu = nửa số hạt (trần 150), bỏ vệt/quầng sáng/rung/khựng, hoa văn thưa nhưng vẫn còn viền + hoa văn; vừa = giữ rung, bỏ khựng; cao = đầy đủ (×2,2 hạt, trần 800).
3. `js/scene/chieuFx.js`: `createChieuFx(scene, {getTier, onShake, onHitStop, play})` → `cast(id, {x,z,ry,tx,tz})` (trả kế hoạch hoặc null), `clear()`, `active`, `dispose()`. Vùng cảnh báo (viền + hoa văn) hiện suốt lúc gồng rồi mờ; hạt là một `Points` (cộng sáng, không đèn động); vệt + quầng sáng là mặt phẳng cộng sáng. Đã chạy thử bằng three.js thật ở Node (30 chiêu × 3 bậc đều dựng và dọn sạch, không rò rỉ).
4. `js/ui/luyenChieu.js`: Võ đường luyện chiêu gọi `cfx.cast` khi bấm chiêu (có hiệu ứng mới thì bỏ vòng/luồng khí cũ; lỗi thì tự dùng hiệu ứng cũ); `dispose` dọn `cfx`. Bậc máy lấy từ `LGT.perfLevel`.
5. `tests/chieufx.test.mjs` (7 test) đã vào `npm test` trong package.json.

## Chưa làm / lưu ý
- **CHƯA nhìn bằng mắt** (môi trường AI không có WebGL). ptg vào Võ đường luyện chiêu thử: thấy vùng viền + hoa văn lúc gồng, hạt lúc phát, nghe tiếng. Màu/cỡ hạt/độ sáng là số TẠM, báo chiêu nào xấu để chỉnh trong `js/data/chieuFx.js`.
- `onShake` (rung màn hình) và `onHitStop` (khựng đòn) hiện là hàm rỗng: chưa có móc camera. Muốn có thì nối trong `luyenChieu.js` khi tạo `createChieuFx` (rung camera ở `js/scene/index.js`).
- Chưa nối vào chiến đấu thật (`heSkill.js`, `farm.js`, Võ đài `js/ui/duel.js`) và gói tin mạng chưa gửi `skillId + t0` — hiện chỉ chạy ở Võ đường luyện chiêu.
- Âm thanh còn dùng lại cue cũ nên nhiều chiêu nghe giống nhau; muốn tiếng riêng từng Hệ cần file âm thanh mới (nhớ ghi nguồn/giấy phép vào `THIRD_PARTY.md`).
- Phiên 164 ghi: `duel.test.mjs` và `duelcontrols.test.mjs` chưa nằm trong `npm test`.
- `sw.js` chưa đổi VERSION (file mới sẽ được tải khi cache hết hạn; nếu máy cũ không thấy hiệu ứng thì tăng VERSION).

## Việc tiếp theo (Bản 2 mục 7)
7. Hệ thống trang bị (`js/data/gear.js`, `js/world/gear.js`, test). 8. 12 combo mẫu + 5 tình huống khắc chế. 9. Kịch bản cân bằng. **Lưu ý:** `docs/PHIEN164.md` nói lộ trình mới của ptg có "mục 2" = vật phẩm tiệm Kim Hoàng (ngọc hồi máu 100 lá, ngọc dịch chuyển 200, ván trượt 100; gậy như ý 400 lá ở điện máy) — hỏi ptg làm cái nào trước.

## Prompt bàn giao (dán vào phiên mới)
Bạn tiếp tục dự án Diệu Giang Tự (https://github.com/tp9sach-ops/duanchuaon, nhánh main). Quy tắc: For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff. Đọc docs/PHIEN165.md và PHIEN164.md, clone repo, chạy `npm test` (mong đợi 1152/1152). Hỏi ptg làm tiếp mục 7 Bản 2 (trang bị) hay mục 2 lộ trình mới (vật phẩm tiệm Kim Hoàng). Xong thì chạy test, viết docs/PHIEN166.md, đẩy main, báo ptg và chờ "tiếp tục".
