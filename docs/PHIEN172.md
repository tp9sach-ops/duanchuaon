# PHIÊN 172 — Bàn giao (prompt "chiêu thức 3D chuyên nghiệp": mục 4 — VFX sáu lớp, nối vào cảnh 3D)

> Repo: https://github.com/tp9sach-ops/duanchuaon (nhánh `main`). Gp nói tiếng Việt: trả lời NGẮN GỌN, DỄ HIỂU, làm TỪNG MỤC, xong đẩy GitHub, báo, chờ "tiếp tục". Đọc thêm `docs/PHIEN171.md` (danh sách 11 mục), `docs/PHIEN168.md`.

## Quy tắc làm việc (chép nguyên văn)
"For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff."

## Hiện trạng 11 mục "Nộp theo thứ tự" (prompt chiêu thức 3D, mục 14)
1. Thẻ chiêu + dòng thời gian ms — XONG (167).
2. Bảng màu + phác thảo — XONG (168). Nay ĐÃ nối vào cảnh qua mục 4.
3. Hoạt ảnh 4 khung — XONG mã + nối nhân vật (171); thiếu clip + xương áo/đai/tóc.
4. **VFX theo lớp — XONG phiên này (xem dưới); thiếu: bản giảm "6 bậc" chi tiết hơn 3 bậc hiện có, rung/khựng chưa nối camera (mục 9), chưa nhìn bằng mắt.**
5. Kho âm thanh + giấy phép — chưa. **MỤC KẾ TIẾP (hoặc mục 6 nếu Gp muốn).**
6. Hoạt ảnh trúng đòn + trạng thái kẻ địch — chưa (nên làm sớm: mọi chiêu cần).
7. Clip 5 giây ở ba cảnh — cần mắt người.
8. File JSON số liệu — chưa.
9. Điều khiển + camera (mục 10, 10A, 11) — chưa.
10. 12 combo mẫu + 5 tình huống khắc chế — chưa.
11. Báo cáo cân bằng — chưa.

## Mục 4 — đã làm gì
- `js/world/chieuLop.js` (logic thuần): `lapLop(id, tier)` trả kế hoạch SÁU LỚP: `loi` (lõi sáng, bắt đầu từ lúc gồng, "thở" 3/5/8% theo vai chiêu) · `than` (thân năng lượng) · `quang` (quầng cộng sáng + vệt) · `hat` (chia 3 cỡ: lớn chậm 20% / vừa 40% / nhỏ nhanh 40%, `chiaHat`, `CO_HAT`) · `moiTruong` (decal nền tan 3–5 s theo độ rung, kiểu theo Hệ: kim vết cắt, mộc dây leo, thủy băng, thổ nứt, hỏa cháy; sóng chấn chỉ máy mạnh + chiêu rung ≥ 0,4) · `tanDu` (khói/tro/sương/bụi, bắt đầu khi hết hiệu lực 0,9 s, tan 1–2 s). Mỗi lớp có thời điểm + đường cong độ sáng riêng (`cuong`, `doSangLop`). Màu từ `mauChieu(id)`: lõi = lõi trắng ngà, thân = màu chủ, quầng = màu sáng, decal = nền, hạt = chủ/sáng/lõi + màu bổ sung ≤ 10% số hạt. `lopPhuRong` đảm bảo ≤ 2 lớp trong suốt phủ rộng chồng nhau (fill-rate).
- Bản giảm (bậc `yeu`): bỏ quầng, vệt, decal, sóng chấn; nửa tàn dư; lõi/thân/hạt/tàn dư vẫn còn. `vua`: đủ 6 lớp, không sóng chấn. `cao`: đủ + sóng chấn.
- `js/scene/chieuFx.js`: dựng đủ 6 lớp (lõi = quả cầu cộng sáng bay theo đầu chiêu `tia`; hạt = 3 `Points` khác cỡ/tốc độ; vệt = ribbon thon dần, hẹp dần theo thời gian; decal = đĩa nền + hoa văn Hệ + (máy mạnh) vòng sóng chấn nở ra; tàn dư = `Points` bay lên chậm). Hạt tan xong thì `job.n = 0` để không chiếm trần số hạt của chiêu sau. `FX_COLOR` không còn dùng ở cảnh (vẫn ở dữ liệu cho test cũ).
- `tests/chieulop.test.mjs` (8 test, đã vào `npm test`). `sw.js` `dgt-v163` → `dgt-v164` để máy người chơi tải bản mới.
- Kiểm cảnh bằng three.js thật (không WebGL, chỉ dựng đối tượng + giả lập khung hình): 30 chiêu × 3 bậc máy = 90 lần `cast`, đều dựng được, chạy 7 s giả lập, tự dọn sạch (0 job, scene rỗng).

## Chưa làm / cố ý để lại
- CHƯA nhìn bằng mắt (môi trường AI không có WebGL): cỡ lõi (`co`), độ mờ, độ dài decal… là số TẠM; Gp xem thử trong game (Luyện chiêu với mộc nhân) rồi báo chiêu nào xấu để chỉnh ở `chieuLop.js` / `chieuFx.js`.
- Tuyệt học "hoành tráng gấp ba": đổi ánh sáng cảnh 1–2 s, nhịp hít vào toàn màn hình, đóng khung chậm 0,2–0,4 s — thuộc camera/mục 9, chưa làm.
- Rung màn hình + khựng đòn: `onShake`/`onHitStop` vẫn là callback rỗng mặc định nếu nơi gọi không truyền (`luyenChieu.js` chỉ truyền `getTier`); nối vào camera ở mục 9.
- Ngưỡng báo trước 0,4/0,8 s (treo từ Phiên 167): chưa quyết.
- Phiên 170: Gp phải dán lại `gas/Accounts.gs` vào Apps Script rồi Deploy → New version.

## Kiểm
`npm test` ghi ở báo cáo cuối phiên (trước khi sửa: 1185 đạt).

## Prompt bàn giao (dán vào phiên mới)
Bạn tiếp tục dự án Diệu Giang Tự (https://github.com/tp9sach-ops/duanchuaon, nhánh main). Quy tắc: For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff. Đọc docs/PHIEN172.md (và 171), clone repo, chạy `npm test`. Khi Gp nói "tiếp tục": làm mục 5 của prompt chiêu thức 3D (kho âm thanh + giấy phép: ba lớp tiếng gồng/phát/trúng + dư âm, tiếng hô theo cấp, dùng cue có sẵn trong js/world/sfx.js, mỗi tiếng ≤ 100 KB, ghi nguồn/giấy phép) hoặc mục 6 nếu Gp muốn; hỏi Gp chuyện ngưỡng 0,4/0,8 s. Xong thì chạy test, viết docs/PHIEN173.md, đẩy main, báo Gp và chờ "tiếp tục".
