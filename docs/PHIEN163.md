# PHIÊN 163 — Bàn giao (Bản 2 chiêu thức: mục 5 — tư thế 30 chiêu, XONG mã; chưa nhìn bằng mắt)

> Dán nguyên file này vào đầu phiên mới. Repo: https://github.com/tp9sach-ops/duanchuaon (nhánh `main`). Người dùng nói tiếng Việt. Đọc thêm `docs/PHIEN156.md`, `PHIEN157.md`, `PHIEN158.md`.

## Quy tắc làm việc (chép nguyên văn)
"For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff."
- Làm từng mục, xong đẩy `main`, báo, chờ "tiếp tục". Việc đã làm thì bỏ qua. Chỉ đọc chỗ cần sửa. Không báo test đạt nếu chưa chạy.

## LƯU Ý ĐÁNH SỐ PHIÊN
Ba commit đầu của mục 5 ghi nhãn "Phiên 159" (commit 4428ce8, 7fdd13e, 97c6619), nhưng `docs/PHIEN159.md` là của phiên khác (điều khiển chuột). Hai việc không liên quan nhau. File này dùng số 163 (docs đã có tới PHIEN162).

## Mục 5 — tư thế 30 chiêu (Bản 2 mục 4–5)
1. `js/world/chieuPose.js` (logic thuần): `POSE[id] = { gong, phat, thu }` cho đủ 30 chiêu; mỗi khung `{P, T, sp, lT, lP, h, lift}` (P/T = tay phải/trái [fwd,out,flex,adduct], sp = thân, lT/lP = chân [đùi, gối], h = gợi ý dạng đùi, lift = nhấc người). Khung phát = mã Phát của Bản 2 mục 5. API: `hasCast`, `castTimeline(id)` → `{gong, phat, thu, tong}` (gồng = `chieuOf(id).gong`, thu = hậu động kẹp 0,25–0,8 s, phát = bảng `PHAT`, mặc định 0,2 s), `castSample(id, t)` → khung + `phase` + trọng số hòa `w` (hàm thuần của skillId + t, để máy đối thủ vẽ cùng tư thế chỉ cần nhận `skillId` + `t0`), `framePose(f)` (góc xương; `hipsDrop` tính lại từ `legPoints` nên bàn chân luôn chạm đất), `applyCast(q, f)` (hòa lên kết quả `chibiPose`).
2. `tests/chieupose.test.mjs` (10 test, đã vào `npm test`): đủ 30 chiêu × 3 khung, lịch khớp thẻ chiêu, liên tục từng 10 ms, khuỷu ≤ 2,6 / gối ≤ 2,4 rad, bàn chân chạm đất ±1 cm, tay không chui xuống đất, tay không xuyên thân, gồng khác phát, mã Phát khớp Bản 2, hòa tư thế.
3. `js/world/avatarChibi.js`: `avatar.cast(skillId)` → tổng số giây (0 nếu chiêu lạ); `avatar.casting`. Trong lúc thi triển: tắt thế sẵn sàng, ngắt đòn đang vung, chiêu nhảy (`hoa_hoalong_4`) nhấc người 0,8 m.
4. `js/ui/luyenChieu.js` (commit này): bấm chiêu ở Võ đường luyện chiêu → quay về mộc nhân gần nhất (chiêu hỗ trợ giữ hướng) + `avatar.cast`; luồng khí và nháy mộc nhân chờ tới giữa khung phát.

## Chưa làm / lưu ý
- **CHƯA nhìn bằng mắt** (không có WebGL). Mọi số tư thế là gợi ý ban đầu, chiều khớp mới kiểm bằng `limbPoints`/`legPoints`. Ptg vào Võ đường luyện chiêu thử từng chiêu, báo chiêu nào hình bóng sai để chỉnh số trong `POSE`.
- **Chưa chạy toàn bộ `npm test`** trong phiên làm mục 5; 10 test tư thế chạy trên bản sao cục bộ với dữ liệu gồng/hậu động chép từ thẻ chiêu. Chạy lại trên repo thật trước khi dựa vào. Phiên 159 (chuột) ghi 3 test lỗi sẵn trên main (dân làng, cửa hàng 9 Sạch, chỗ trú), commit mới nhất đã sửa chỗ trú.
- Chưa nối vào chiến đấu thật (`heSkill.js`, `farm.js`): chiêu ngoài Võ đường luyện chiêu chưa gọi `avatar.cast`. Gói tin mạng chưa gửi `skillId + t0`.
- Phiên chuột đổi phím chiêu: Q/W/E = 3 chiêu của phái, R = Thương; WASD không còn là phím đi.
- Lệch nhỏ khỏi Bản 2: Mê Vụ Lan Tỏa gồng 0,5 s (Bản 2 ghi 0,4 s) — ghi ở PHIEN158, chờ ptg duyệt.

## Việc tiếp theo (Bản 2 mục 7)
6. Hiệu ứng + âm thanh 30 chiêu, kèm bản giảm cho máy yếu (≤ 300 hạt điện thoại, 800 máy mạnh; vùng cảnh báo có viền + hoa văn theo Hệ). 7. Trang bị (`gear.js`). 8. 12 combo mẫu + 5 tình huống khắc chế. 9. Kịch bản cân bằng.

## Prompt bàn giao (dán vào phiên mới)
Bạn tiếp tục dự án Diệu Giang Tự (https://github.com/tp9sach-ops/duanchuaon, nhánh main). Quy tắc: For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff. Đọc docs/PHIEN163.md và PHIEN158.md, clone repo, chạy `npm test`. Việc kế tiếp = mục 6 Bản 2 (hiệu ứng + âm thanh + bản giảm cho 30 chiêu). Xong thì chạy test, viết docs/PHIEN164.md, đẩy main, báo ptg và chờ "tiếp tục".
