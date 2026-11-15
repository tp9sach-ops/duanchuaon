# PHIÊN 177 — Bàn giao (kế hoạch hiệu ứng 3D như thật: mục 1 LỬA THẬT xong)

> Repo: https://github.com/tp9sach-ops/duanchuaon (nhánh `main`). Gp nói tiếng Việt: trả lời NGẮN GỌN, DỄ HIỂU, làm TỪNG MỤC, xong đẩy GitHub, báo, chờ "tiếp tục". Đọc `docs/KE_HOACH_HIEU_UNG_3D.md` (kế hoạch 7 mục) và `docs/PHIEN175.md`.

## Quy tắc làm việc (chép nguyên văn)
"For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff."

## Yêu cầu của Gp
Hiệu ứng kỹ năng hiện toàn "ô vuông màu", nhìn chán, không giống thật. Muốn 3D, mượt, như thật, hoành tráng: lửa như lửa thật (màu, độ lan tỏa), băng như băng thật… Lập kế hoạch chi tiết rồi làm từng mục, xong đẩy GitHub rồi báo.

## Đã làm phiên này (mục 1 — lửa thật, Hệ hỏa)
- `js/world/lua.js` (logic thuần): `lapLua` (số lưỡi/khói/tàn theo bậc máy), `ngonLua` (vòng đời lưỡi lửa: sinh → bốc lên → thon → nguội màu trắng→cam→đỏ → tắt), `khoiLua`, `tanLua`, `viTriLua` (4 kiểu bay: tia = quả cầu lửa + đuôi, no = cột lửa, xoay = lốc lửa, mua = sao băng lửa rơi rồi cháy), `dungLua(he)`.
- `js/scene/fxLua.js` (vẽ): `taoLua({tier,mode,co,reach,R2,zD})` → `{group, update(t, after, than, gong, pz)}`. Lưỡi lửa = Sprite cộng sáng với kết cấu canvas hình giọt (3 kiểu), khói = Sprite đen xám mờ, tàn lửa = Points tròn mềm nhấp nháy, vũng sáng cam trên nền (bỏ ở máy yếu).
- `js/scene/chieuFx.js`: nối lửa vào lớp 2 "thân" cho chiêu Hệ hỏa (3 chỗ: import, tạo sau 3 sprite quầng, gọi `lua.update` mỗi khung). Các lớp cũ (lõi, quầng, hạt, vệt, decal, tàn dư) giữ nguyên.
- `tests/lua.test.mjs` (12 test) thêm vào `npm test`; `sw.js` = `dgt-v168`.
- Đã chạy: 54 test liên quan (chieufx, chieulop, chieutrung, chieupose, chieuhoa, lua) đạt 0 lỗi; chạy `taoLua.update` 3 bậc máy × 4 kiểu bay với three giả: không lỗi, không NaN. CHƯA chạy toàn bộ `npm test` (~3,5 phút). CHƯA nhìn bằng mắt.

## Chưa làm / cần Gp xem
- Cỡ lưỡi lửa (`kichCo` 1,6–2,3 m), độ sáng, độ dày khói, số tàn là số TẠM: Gp vào Luyện chiêu thử 6 chiêu hỏa rồi báo "to/nhỏ/sáng/tối quá".
- Lõi cầu trắng + quầng cũ vẫn còn cùng lửa mới; nếu nhìn thấy dư trắng thì giảm ở mục 7.
- Mục 2–7 trong kế hoạch: CHƯA làm. Việc kế: **Mục 2 — băng thật** (và nước).
- Còn treo từ trước (PHIEN175): mục 10A Khinh Thân cấp 8, mục 10 nút/cử chỉ, công tắc giảm chuyển động.

## Prompt bàn giao (dán vào phiên mới)
Bạn tiếp tục dự án Diệu Giang Tự (https://github.com/tp9sach-ops/duanchuaon, nhánh main). Quy tắc: For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff. Đọc docs/PHIEN177.md và docs/KE_HOACH_HIEU_UNG_3D.md. Khi Gp nói "tiếp tục": làm Mục 2 (băng thật + nước, Hệ thủy) theo kế hoạch: logic thuần js/world/bang.js + test, vẽ js/scene/fxBang.js, nối chieuFx.js (lớp 2, p.he === 'thuy'), chạy test, nâng sw.js, viết docs/PHIEN178.md, đẩy main, báo Gp, chờ "tiếp tục".
