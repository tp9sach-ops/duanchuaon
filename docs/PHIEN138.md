# Phiên 138 — danh sách 5 mục 2026-11-13: mục 1 xong + bỏ mọi trần kinh nghiệm; rà trạng thái mục 2–3

Quy tắc ptg (chép nguyên văn): For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff.

## Danh sách 5 mục ptg giao (làm lần lượt, xong mục nào đẩy GitHub mục đó, báo ptg để "tiếp tục")
1. ✅ Thu phục quái hay câu cá phóng sinh đều được tăng kinh nghiệm để thăng cấp. (Phiên 138)
2. ✅ Mở rộng toàn map: sát vách núi, rừng cây đều có quái; càng sâu càng nguy hiểm. (ĐÃ CÓ từ Phiên 131–132, xem `docs/PHIEN132.md`: 8 vùng, 4 vùng sâu ở bốn góc, cấp 72–140, máu ×1,5/×2,2, công ×1,25/×1,5)
3. ✅ Hạt sen KHÔNG ảnh hưởng sức mạnh. (ĐÃ CÓ từ Phiên 133, xem `docs/PHIEN133.md`; còn 3 điểm chờ ptg quyết)
4. ⏳ **Phó bản** — VIỆC KẾ TIẾP (chưa làm gì).
5. ⏳ Mảnh ghép boss → linh thú trong hồ lô.

## Yêu cầu bổ sung (Phiên 138, 13/11): "cho phép mức trần kinh nghiệm không giới hạn trần"
Diễn giải của phiên này (chưa hỏi lại ptg): bỏ MỌI trần kinh nghiệm đang có:
- **Cấp công hạnh (thanh "Cấp")** trước đây dừng ở cấp 10 (1800 điểm). Nay KHÔNG giới hạn: 10 cấp đầu giữ nguyên bảng `LEVELS`; từ cấp 11 mỗi cấp cần thêm `500 + 100 × k` điểm so với cấp trước (cấp 11 = 2400, cấp 12 = 3100, cấp 13 = 3900…). Danh hiệu từ cấp 11 giữ "Trưởng lão cư sĩ". File mới `js/world/levelCurve.js` (`xpForLevel`, `levelAtXp`); `levelOf` trong `js/world/quests.js` dùng nó, `xp1` KHÔNG còn `null`. Điểm lưu vẫn kẹp kỹ thuật 1e9 (~ cấp 4480).
- **Trần Tu Vi theo ngày** của hàng yêu (30 lần) và thu phục yêu quái hằng tháng (3 lần) → `NGUON_CFG.tranNgay = { hangYeu: Infinity, boss: Infinity }` (`js/data/nguon.js`). Mọi lần thu phục đều có Tu Vi. `expLeft(...)` trả `Infinity`.
- Giữ nguyên (KHÔNG phải kinh nghiệm): trần HẠT SEN mỗi ngày (100), trần 10 lần/ngày hạt sen phóng sinh, trần 5 lần/ngày/loại của HOẠT ĐỘNG CHÙA (thiền/tụng/lạy — nguồn Tu Vi `hoatDong`, chưa nối gameplay), giới hạn 60 phút tự động hàng yêu/ngày, Tu Vi tối đa 150 (`js/data/stats.js`, GDD).

## Mục 1 (đã làm ở Phiên 138)
- `js/ui/farm.js`: `const xp = killXp(mon);` — mỗi lần thu phục quái luôn cộng kinh nghiệm cấp độ.
- `js/world/xpThuong.js` (mới): `releaseXp(fish)` = 2, +2 loài hiếm, +1 cỡ lớn (2..5). `js/ui/fishing.js`: `rewardRelease(sen, fish)` gọi `LGT.addXp(releaseXp(fish))` cho cả cá vừa câu lẫn cá trong ao; toast "Phóng sinh: +N kinh nghiệm".
- Yêu quái hằng tháng đã cộng kinh nghiệm từ trước (`rewardFor`: 60/100 điểm, cần đánh ≥ 5% máu).

## Test đã sửa/thêm (CHƯA chạy được trong môi trường AI: không có bản sao repo, shell không có mạng → ptg/phiên sau chạy `npm test`)
- `tests/xpthuong.test.mjs` (mới, có trong `npm test`): releaseXp, không còn trần Tu Vi/ngày, cấp không giới hạn (mốc 1800/2400/3100), đường cong đơn điệu + hàm ngược, nối dây giao diện (kiểm nội dung mã nguồn).
- `tests/farm.test.mjs`: 3 test trần Tu Vi/ngày viết lại thành "không còn trần" (hạt sen vẫn có trần).
- `tests/quests.test.mjs`: test cấp độ bỏ `levelOf(1e9).lv === LEVELS.length` và `xp1 === null`.
- NẾU `npm test` đỏ ở chỗ khác: tìm test nào còn giả định cấp tối đa 10 (`levelOf(...).xp1 === null`, `LEVELS.length` là cấp cuối) hoặc trần `NGUON_CFG.tranNgay` hữu hạn — chưa rà hết vì công cụ tìm mã của GitHub không dùng được trong phiên này. File dùng `levelOf`/`xp1`: `js/ui/quest.js` (đã tự xử lý xp1 khác null), `js/ui/profile.js`, `js/ui/summary.js`, `js/world/journey.js`, `js/world/nextGoal.js`, `js/world/rank.js` (buildScore kẹp lv 1..999).

## Ảnh hưởng cần biết
- Cấp không giới hạn → `strengthOf` (level × 6) cũng tăng không giới hạn theo cấp (đúng ý "sức mạnh từ cấp độ"); `maxHp`/`hitDamage` của yêu quái hằng tháng kẹp cấp ở 99.
- `levelReward(lv) = lv × 2` hạt sen mỗi lần lên cấp: không có trần, lên cấp cao thưởng nhiều sen hơn (kinh tế sen → lá → đất). Nếu thấy lạm phát, đặt trần thưởng trong `levelReward`.
- Thanh "Cấp" nay chỉ tiến, không bao giờ đầy 100% rồi dừng.

## Việc kế: MỤC 4 — PHÓ BẢN
Ý ptg: đến địa điểm → gặp NPC → chọn vào phó bản (rừng/kiến trúc toàn quái + thử thách), hiển thị RIÊNG không nằm trong map chính (dùng cơ chế zone như Võ đài: `js/world/zones.js`, `zoneRuntime.js`, `zoneVoDai.js`, `js/scene/voDai.js`, `js/ui/zoneGate.js`). Quái thu phục xong HỒI SINH mạnh hơn + to hơn theo từng lượt; sau 9 lượt hồi sinh xuất hiện BOSS CHÍNH to/mạnh hơn; thu phục xong rơi nhiều vật phẩm; phó bản đã chinh phục → lần sau quay lại mạnh hơn.
Hướng làm gợi ý: (a) lõi logic thuần `js/world/dungeon.js` (định nghĩa phó bản, lượt 1–9, hệ số theo lượt + số lần đã chinh phục, boss, quà rơi, lưu `lgt.dungeon`) + test, dùng `oanKhiMaxOf`/`monsterStats` của `spawn.js`; (b) zone + cảnh 3D riêng; (c) NPC + bảng chọn phó bản; (d) nối `LGT.addXp`/`settleKill`.

## Prompt khởi động cho phiên mới (dán nguyên văn)
> Đọc `HANDOFF.md` (đầu file), `docs/PHIEN138.md`, `docs/PHIEN132.md`, `docs/PHIEN133.md`. Chỉ xem các chỗ cần sửa, không đọc hết repo. Mục 1–3 đã xong; kinh nghiệm không còn trần (Phiên 138). Làm MỤC 4: phó bản (xem phần "Việc kế" trong `docs/PHIEN138.md`), từng bước nhỏ, `npm test` phải xanh, đẩy GitHub rồi báo; cuối phiên viết `docs/PHIEN139.md` kèm prompt bàn giao và chép nguyên văn quy tắc bàn giao ở trên.
