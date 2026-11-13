# Phiên 138 — Mục 1 (danh sách 5 mục 2026-11-13): kinh nghiệm khi thu phục quái và phóng sinh

## Danh sách 5 mục ptg giao (làm lần lượt, xong mục nào đẩy GitHub mục đó, chờ "tiếp tục")
1. ✅ Thu phục quái hay câu cá phóng sinh đều được tăng kinh nghiệm để thăng cấp. (Phiên 138, tài liệu này)
2. Mở rộng toàn map: sát vách núi, mọi rừng cây đều có quái; càng sâu xa càng nguy hiểm (cấp cao, máu trâu, sát thương lớn).
3. Hạt sen KHÔNG ảnh hưởng sức mạnh; sức mạnh đến từ kinh nghiệm/cấp độ, kỹ năng, cách cộng chiêu, đồ, vật phẩm.
4. Phó bản: đến địa điểm → gặp NPC → chọn phó bản → vào khu riêng (không nằm trong map chính) toàn quái và thử thách; quái thu phục xong hồi sinh mạnh hơn và to hơn; sau 9 lượt hồi sinh xuất hiện boss chính (to, mạnh hơn), thu phục xong rơi nhiều vật phẩm; phó bản đã chinh phục sẽ mạnh hơn ở lần quay lại.
5. Boss chính phó bản → mảnh ghép yêu quái trong túi hồ lô; đủ 3 mảnh ghép thành linh thú (gọi ra, cưỡi, chiến đấu); kỹ năng boss tương tác với người chơi (hồi máu, hồi chiêu, tạo giáp) và với quái khác (trói chân, làm chậm, đóng băng, hất tung).
(Mục 2–5 trùng với mục 3–6 của docs/ROADMAP-6-MUC.md; mục 2 giao lưu võ đài của roadmap đã xong ở Phiên 137.)

## ĐÃ LÀM (Phiên 138)
- Hiện trạng trước khi sửa: hạ quái bãi rừng chỉ cộng kinh nghiệm cấp độ khi lần đó còn Tu Vi trong trần ngày (30 lần/ngày quái thường, 3 lần/ngày boss) nên hết trần là không lên cấp nữa; phóng sinh chỉ có kinh nghiệm qua nhiệm vụ (một lần "Phóng sinh lần đầu" + một lần mỗi ngày), các lần thả khác không có.
- `js/ui/farm.js`: `const xp = killXp(mon);` — MỖI lần thu phục quái đều cộng kinh nghiệm cấp độ (`LGT.addXp`), không còn phụ thuộc trần Tu Vi. Trần ngày vẫn áp cho Tu Vi và hạt sen như cũ (không đổi).
- `js/world/xpThuong.js` (mới, logic thuần): `releaseXp(fish)` = 2, +2 nếu loài hiếm, +1 nếu cỡ lớn (2..5).
- `js/ui/fishing.js`: `rewardRelease(sen, fish)` — mỗi lần phóng sinh (con vừa câu và con trong ao cá) gọi `LGT.addXp(releaseXp(fish))`, báo "+N kinh nghiệm" sau thông báo hạt sen. Hạt sen vẫn theo trần 10 lần/ngày (không đổi); kinh nghiệm không có trần ngày. Lên cấp thì hiệu ứng ăn mừng + thưởng hạt sen như cũ (do `LGT.addXp`).
- Yêu quái hằng tháng đã cộng kinh nghiệm từ trước (`rewardFor`: 60 / 100 điểm, cần đánh ≥ 5% máu) — không đổi.
- `tests/xpthuong.test.mjs` (mới, thêm vào `npm test`): giá trị releaseXp, đầu vào hỏng, 15 lần phóng sinh = cấp 2, killXp còn ≥ 1 sau khi hết trần Tu Vi, và nối dây giao diện (kiểm nội dung mã nguồn).

## CHƯA LÀM / CẦN CHÚ Ý
- Chưa chạy được `npm test` và chưa thử trên trình duyệt trong môi trường AI (không có bản sao repo, không có mạng cho shell) — cần chạy `npm test` và chơi thử: hạ quái (thấy "+N kinh nghiệm" kể cả sau 30 lần), phóng sinh cá (thấy "Phóng sinh: +N kinh nghiệm").
- Con số TẠM chờ ptg duyệt: releaseXp 2..5; killXp (đã có từ Phiên 134: 1 + 0,4 × cấp quái, tối đa 12, tinh anh ×2, boss ×5).
- Chưa có trần kinh nghiệm theo ngày cho hạ quái/phóng sinh: giới hạn thực tế là tốc độ quái hồi sinh, 60 phút tự động hàng yêu/ngày, và việc câu tốn độ bền quả cầu. Nếu thấy cày quá nhanh, thêm trần ngày (cần lưu bộ đếm).
- Thanh "Cấp" hiện chỉ có 10 bậc (ngưỡng tối đa 1800 điểm, js/world/quests.js LEVELS). Khi làm mục 2–3 (quái sâu cấp cao, sức mạnh từ cấp độ) nên mở rộng số bậc.

## Mục kế: 2 (mở rộng map: sát vách núi, mọi rừng cây đều có quái, càng sâu càng mạnh)
