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

## Phiên 118 — Bước 2/3: mở rộng đất trống trong rừng, dời bãi quái, bụi cỏ um tùm, quái ngủ
Yêu cầu ptg (12/11): chỗ có cây/đất trống mà không đến được → mở rộng cho đi tới; quái nằm NGỦ trong bụi cỏ cây; chỉ khi bị đánh mới tấn công lại.
- `js/world/outside.js` OUT_WALKS thêm 4 vùng đi bộ: `loi-rung-dong` (x50–56, z108–121) + `rung-sau-dong` (x36–68, z120–142) nối đường mòn thác; `loi-rung-tay` (x−64…−58, z93–105) + `rung-sau-tay` (x−78…−46, z104–130) nối đường mòn rừng. Cây rừng tự chừa (inWalk margin 3); hàng cây dọc đường (z 97.5 Tây, z 112 Đông) được bỏ ở đoạn lối vào (`js/scene/outside.js`).
- `js/data/monsters.js`: `duongMon` (Kim) dời vào `rung-sau-dong`, tên "Rừng Sâu Phía Đông"; `hoThac` (Thủy) dời vào `rung-sau-tay`, tên "Rừng Sâu Phía Tây"; avoid rỗng. Id giữ nguyên. `biaRungThong` (Mộc) CHƯA dời (vẫn ở bãi rừng thông có miếu/cổ thụ/Hồ Rừng) — chờ ptg. Đường mòn và bãi dưới thác + Đại Phật không còn quái.
- `js/scene/outside.js`: `buildDeepWoods` — bụi rậm (InstancedMesh), cỏ cao, cây tối bao quanh, sương xám trong hai khoảng; không vẽ nền đất đường mòn cho `rung-sau-*` (để cỏ). `js/scene/farm.js`: quái chưa nổi giận (`!m.eng`) vẽ NẰM THẤP, thở chậm; bị đánh thì đứng dậy.
- Test: `tests/hothac.test.mjs` viết lại (vùng trong khoảng trống, không sát cảnh đẹp/sông, zoneAt); sửa tọa độ ở `outside.test.mjs`, `spawn.test.mjs`, `monsterattack.test.mjs`. 978/978. `sw.js` dgt-v111.
- Kiểm trình duyệt headless (Chromium + three cục bộ): game tải không lỗi trang, dịch tới (52,126) và (−60,110) được, quái hiện 24 con ban đêm (`?dem=1`), thấy bụi/cỏ trong khoảng trống. Chưa xem kỹ từng góc/điện thoại; hộp "Tạo nhân vật" che màn hình nên ảnh chụp chưa đầy đủ.
- Lưu ý: quái vẫn CHỈ hiện ban đêm (Phiên 117). Nếu ptg muốn quái ngủ thấy được cả ban ngày trong bụi (chỉ bị đánh mới dậy) → bỏ `nightOnly` trong `js/data/monsters.js`.
- Việc kế: dời nốt `biaRungThong`; thêm boss to (G4.1); ao nhỏ cho bãi Thủy; chụp ảnh điện thoại; kiểm quái không đứng kẹt dưới gốc cây (cây trang trí không chặn).
