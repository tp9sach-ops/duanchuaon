# Phiên 115 — Quái bãi rừng đánh trả khi người chơi đánh/thu phục

## Quy tắc người dùng (chép nguyên văn)
For the 9 Sạch monthly-archive project (and any long multi-session build): after EVERY reply, attach an updated handoff .md so a fresh session with no memory can continue exactly and in detail; if there isn't room to finish everything, send the handoff first; copy this rule verbatim into every handoff.

## Đã làm
- `js/data/monsterAI.js`: `ATTACK_CFG`, `VITALS_CFG` (đóng băng, TẠM — cần ptg duyệt số).
- `js/world/monsterAttack.js` (thuần logic): `walkable`, `provoke`, `calm`, `strikeDamage` (tối đa 35% Sinh Lực/đòn), `stepMonster` (đuổi trong vùng → gồng 0,7 s → trúng/né), `createVitals` (Sinh Lực theo Tu Vi, bất tử ngắn, tự hồi sau 6 s yên).
- `js/ui/farmCombat.js`: nối vào `LGT.farmView.mons`; quái nổi giận khi Oán Khí giảm (bị đánh); gồng chiêu = `m.flash`; thanh `.fm-hp`; kiệt sức → `RESPAWN` cửa chùa, không mất đồ/cấp; auto-hunt dừng khi Sinh Lực < 30%. Gắn trong `js/ui/hudMenu.js` (try/catch). CSS cuối `css/farm.css`.
- `tests/monsterattack.test.mjs` (13 test) đã thêm vào `npm test`; `sw.js` VERSION dgt-v108.

## Kiểm chứng
- 13/13 test mới đạt. Toàn bộ `npm test`: 976/976 sau khi gộp với bản mới nhất trên GitHub (lỗi dock "Tự động" ở bản cũ đã được sửa phía upstream).
- CHƯA chơi thử trên trình duyệt thật, chưa có test DOM cho `farmCombat.js`.

## Việc tiếp
- Sửa nút "Tự động" trong dock.js (nối toggleAuto) nếu ptg đồng ý; test DOM cho farmCombat; chụp ảnh điện thoại; G2.5 thanh kỹ năng; `LGT.he` nối vào engine; tutorial "ba vùng"; PROMPT.md mục 7 (Phiên 98, 109–115); thêm quái Đồi Bảo Tháp.

## Phiên 116 (nhỏ)
- `js/world/tutorial.js`: lời hướng dẫn sửa thành "ba vùng luyện" (thêm Hồ Thác) và bỏ câu "quái không đánh trả", thay bằng lời về gồng/né/Sinh Lực/kiệt sức. `tests/tutorial.test.mjs` 6/6.

## Phiên 117 — Bước 1/3 của yêu cầu "dời bãi quái, cây cỏ um tùm, chừa chỗ check-in"
Yêu cầu ptg (12/11): dời bãi quái ra chỗ đất trống, thêm cây + cỏ um tùm u ám; nơi thác có Phật và các cảnh đẹp phải thông thoáng, không quái để chụp hình check-in; quái chỉ hiện BAN ĐÊM trong game hoặc là boss to.
- XONG (bước 1): `FARM_ZONES.*.nightOnly = true`, `FARM_CFG.nightAt = 0.55` (`js/data/monsters.js`); `zoneOpen(zoneId, night)` trong `js/world/spawn.js`; `js/ui/farm.js` bỏ qua vùng đóng (trạng thái bộ sinh giữ nguyên); đọc `LGT.night` (cùng ngưỡng 0.55 như `isNight` ở `js/ui.js`). Lời báo "Chưa có quái" nói rõ chỉ hiện khi tối. Test: `tests/spawn.test.mjs` (+1), `tests/farmui.test.mjs` (+1, đặt `LGT.night = 1` cho các test cũ). 978/978.
- CHƯA (bước 2): DỜI vùng quái khỏi Hồ Thác Đại Phật (`hoThac`, bãi dưới thác `bai-thac` x 84–112, z 86–122) và khỏi đường mòn/lối đi; chọn đất trống mới (cần thêm vùng đi bộ trong `OUT_WALKS`, `js/world/outside.js`, và cập nhật `rects/avoid` ở `js/data/monsters.js`; `tests/hothac.test.mjs` sẽ cần sửa). Đường chính phải thông thoáng, quái chỉ ở bãi riêng.
- CHƯA (bước 3): thêm cây + cỏ dày, không khí u ám (sương/tối) quanh bãi quái mới ở `js/scene/outside.js` (344 dòng) hoặc `js/scene/farm.js`.
- CHƯA: boss to ban ngày (G4.1: Lão Mộc Tinh, Sơn Cước Đầu Mục) — hiện chưa có boss nên ban ngày không có gì để đánh ở bãi rừng.
- Câu hỏi cần ptg: bãi quái mới đặt ở đâu (gợi ý: đất trống phía tây xa hơn bãi rừng thông hiện tại, hoặc phía bắc đường mòn)? Cả ba vùng đều đêm-mới-hiện hay riêng vùng nào ban ngày vẫn có?
