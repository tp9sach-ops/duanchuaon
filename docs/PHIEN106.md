# PHIÊN 106 — GDD v2: G3.6 (quái cố định ở hai vùng đầu, logic thuần) — BÀN GIAO

> For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff

Đọc: PROMPT.md → docs/PHIEN105.md → file này → docs/KE_HOACH_GDD_V2.md (mục G1, G3). Chỉ đọc file cần thiết.

## Vì sao làm G3.6 trước G1.5
ptg nói "đưa quái lên" (2026-11-11): muốn có quái cố định ở bãi rừng để nhân vật farm tăng công đức. Làm phần LOGIC THUẦN trước (giống cách G1.1–G1.4), chưa nối cảnh 3D / giao diện / lưu.

## Đã làm (G3.6 phần logic XONG)
- `js/data/monsters.js` (TẠM): 4 loại quái theo GDD mục 8: Dã Mèo Rừng (cấp 3, Mộc), Rêu Tinh (10, Mộc, tinh anh), Đạo Tặc Sơn Cước (15, Kim), Cướp Đường (22, Kim, tinh anh). Oán Khí tối đa = (30 + 12×cấp) × (tinh anh ×3): Dã Mèo = 66, Rêu Tinh = 450. Hồi sinh: thường 30–60 s, tinh anh 300 s (đúng GDD). Mỗi vùng tối đa 12 con (1 tinh anh + 11 thường). Rơi Hạt Sen (TẠM): thường 50% × 1–2 hạt, tinh anh 100% × 3–6 hạt.
- Hai vùng (hình chữ nhật nằm TRỌN trong `OUT_WALKS` của `js/world/outside.js`, lề ≥ 1 m, tránh miếu, cổ thụ, Hồ Rừng + thủy tạ): **Bìa Rừng Thông** (bãi rừng x −117..−91, z 73..107 và đường mòn x −90..−72, z 85..93) và **Đường Mòn Đông–Tây** (x −66..−18, z 85..93 và x 20..80, z 100..108).
- `js/world/spawn.js` (không DOM, không `Math.random`, không đọc đồng hồ; truyền `rng` và `dt`): `zoneAt`, `oanKhiMaxOf`, `monsterStats`, `pickPoint`, `createSpawner`, `tickSpawner` (dt kẹp ≤ 5 s mỗi lần gọi), `hitMonster` (trừ Oán Khí, tối thiểu 1, về 0 = thu phục + hẹn hồi sinh + quà rơi), `rollDrops`, `nearestMonster`. Sửa `sp` tại chỗ.
- `tests/spawn.test.mjs` (14 test) đã đăng ký trong `package.json`: dữ liệu khớp GDD; vùng nằm trong lối đi và không chồng nhau; đặt sẵn đủ cap, không chồng quái, cách người chơi; hồi sinh 30–60 s / 300 s; không vượt cap sau 4000 lượt ngẫu nhiên; đánh/thu phục; quà rơi; farm thử nối `nguonTuVi.award`.

## Kiểm tra (nói thật)
- Chạy cục bộ 14/14 test `spawn` + 10/10 `nguontuvi`, nhưng trên bản sao tối thiểu: `outside.js`, `river.js`, `yeuquai.js` là BẢN THAY THẾ chỉ chép các số cần dùng (OUT_WALKS gồm 4 vùng: duong-thac, duong-rung, bai-rung, duong-thap; MIEU, CO_THU, LAKE, THUY_TA; hàm rngSeed). Khi chạy trên repo thật, test import `outside.js` thật (kéo `layout.js`, `land.js`, như `tests/outside.test.mjs` đã làm). CHƯA chạy `npm test` đầy đủ trên repo thật: phiên sau chạy ngay và xem `tests/spawn.test.mjs` trước.
- Điểm có thể đỏ trên repo thật: kiểm "vùng nằm trọn trong OUT_WALKS" (nếu số thật của OUT_WALKS khác bản chép).
- KHÔNG đụng mã cũ, cảnh 3D, giao diện.

## Giả định cần ptg duyệt (đều TẠM)
1. Quái nào là "tinh anh": GDD mục 8 ghi chung "Quái thường / tinh anh". Đã chọn Rêu Tinh và Cướp Đường là tinh anh.
2. Khoảng trống cấp: Bìa Rừng Thông chỉ có quái cấp 3 và 10 (GDD không ghi quái khác), Đường Mòn chỉ có cấp 15 và 22. Người cấp 12–14 ở rừng và cấp 5–9 ở đường mòn sẽ thấy ít lựa chọn; EXP quái yếu còn bị giảm (nguonTuVi). Có thể thêm loại quái hoặc cho mỗi loại một khoảng cấp.
3. Hạt Sen rơi: số trên chưa đối chiếu giới hạn hạt sen/ngày của `js/world/merit.js` (CHƯA đọc). Phải đọc `merit.js` trước khi nối `drops.hatSen` vào ví, kẻo lệch kinh tế.
4. Điểm Công Đức riêng (GDD mục 13: không tiêu, dùng cho xếp hạng) chưa có; "công đức" ở đây = Hạt Sen + Tu Vi. Điểm Công Đức làm ở G3.4.
5. NPC dân làng đi bộ (`WALKERS` d5: z=104, x 16..90; d6: z=89, x −16..−92) đi xuyên Đường Mòn: quái và NPC không va nhau (chỉ để nhìn).

## VIỆC KẾ (một mục, chờ "tiếp tục")
Đề xuất **G1.6a**: nối quái vào game để THẤY và ĐÁNH được:
- Cảnh 3D: dựng quái từ `sp.mons` (xem cách `js/scene/yeuquai.js` dựng boss; mô hình tạm = khối/đơn giản, dùng lại pool). Khung mục tiêu + thanh Oán Khí (tên, cấp, Hệ).
- Đánh: dùng Ném đá (`stoneDamage`) và Thương (`spearDamage`) đã có làm sát thương lên `hitMonster`; sức mạnh lấy từ `strengthOf` hoặc `congOf` (câu 15 của GDD_v2_DOICHIEU chưa chốt: mặc định bỏ √hạt sen).
- Nối `award('hangYeu')` (EXP) và `drops.hatSen` (sau khi đọc `merit.js`).
- Cần thêm: lưu `exp` + state nguồn Tu Vi (G1.5). Có thể làm G1.5 trước nếu ptg muốn không mất tiến trình.
- Cần xem trước: `js/main.js`/`js/ui/yeuquai.js` (cách nối boss vào vòng lặp), `js/scene/yeuquai.js`, `js/ui/dock.js` (nút đánh), `js/world/merit.js`. Hỏi ptg ảnh chụp giao diện nếu thêm nút.

## Nợ còn lại
- Cột Trạng thái trong `docs/KE_HOACH_GDD_V2.md` chưa sửa: G1.1 → `XONG (Phiên 102)`, G1.2 → `XONG (Phiên 103)`, G1.3 → `XONG (Phiên 104)`, G1.4 → `XONG (Phiên 105, logic thuần)`, G3.6 → `XONG (Phiên 106, logic thuần; chưa nối cảnh)`.
- Câu hỏi treo cho ptg: G0.2, G0.4, câu 11–16 (docs/GDD_v2_DOICHIEU.md).

## Prompt khởi động cho phiên sau (dán nguyên)
> Đọc PROMPT.md → docs/PHIEN105.md → docs/PHIEN106.md → docs/KE_HOACH_GDD_V2.md. Repo `tp9sach-ops/duanchuaon`. G0.1, G0.3, G0.5, G1.1–G1.4 và G3.6 (logic thuần) đã XONG; chạy `npm test` trước, sửa test đỏ nếu có. Làm MỘT mục (G1.6a: nối quái cố định vào cảnh, đánh được, có thanh Oán Khí), gửi bàn giao docs/PHIEN107.md, rồi CHỜ ptg nói "tiếp tục". Chỉ đọc những file cần thiết.
