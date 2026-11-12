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

## Phiên 119 — Bước 3: dời nốt bãi Mộc (biaRungThong) vào đất trống phía Bắc
- `js/world/outside.js`: thêm `loi-rung-bac` (x−64…−58, z77–85) + `rung-sau-bac` (x−78…−46, z50–78) nối đường mòn rừng. `js/scene/outside.js`: hàng thông z≈80.5 chừa lối, bỏ 1 đèn đá ở lối (x≈−59), `buildDeepWoods` phủ cả khoảng Bắc.
- `js/data/monsters.js`: `biaRungThong` → "Rừng Sâu Phía Bắc", rect x−76.5…−47.5, z51.5…76.5, avoid rỗng. Bãi rừng thông cũ (miếu, cổ thụ, Hồ Rừng, thủy tạ) và đường mòn, bãi thác: KHÔNG còn quái. `js/world/tutorial.js` mô tả lại vị trí ba vùng.
- Test: sửa tọa độ ở `farmui`, `monsterattack`, `spawn`. 1009/1010; còn `tests/combo.test.mjs` ("mọi kiểu đòn…", nhảy tay @0.18) lỗi CÓ SẴN từ upstream Phiên 120 (đã xác nhận bằng stash, không do phần này). `fireflies.test` thỉnh thoảng chập chờn (ngẫu nhiên), chạy lại thì đạt. `sw.js` dgt-v114.
- Tin nhắn ptg 12/11 14:31 bị cụt: "…phục quái, đều có thể tăng thêm kinh nghiệm" → cần hỏi lại: muốn mọi hành động (thu phục quái, nhặt vật, chụp hình check-in, đi tới cảnh đẹp…) cộng thêm Tu Vi/kinh nghiệm? Chưa làm.

## Phiên 122 — Mọi cách thu phục đều cộng Tu Vi, số nhỏ, có trần mỗi ngày (ptg 12/11 15:13)
- `js/data/nguon.js`: `tranNgay: { hangYeu: 30, boss: 3 }` (TẠM). `js/world/farm.js`: bộ đếm `cnt { day, hangYeu, boss }` (lưu cùng `lgt.farm`, sang ngày VN reset, dữ liệu hỏng bị kẹp), `expLeft`, `settleKill` hết trần → 0 Tu Vi (`expCapped`; hạt sen vẫn theo trần riêng 100/ngày), `settleBoss` (nguồn boss, 15% cấp kế/lần, 3 lần/ngày).
- `js/ui/farm.js`: toast khi hết trần Tu Vi hàng yêu (1 lần/ngày); `LGT.farm.grantBoss()`. `js/ui/yeuquai.js`: thu phục yêu quái hằng tháng (đóng góp đủ, `rw.xp`) gọi `grantBoss()` — trước đây chỉ cộng điểm cũ `LGT.addXp`, không cộng Tu Vi.
- Mọi đường đánh quái bãi rừng (ném đá, thương, tự động) đều qua `reward → settleKill` nên đều cộng Tu Vi; chưa có cơ chế "thuần phục" riêng trong game.
- Test: `tests/farm.test.mjs` viết lại (trần 30 + boss), `tests/farmui.test.mjs` (+1). 1011 test, chỉ còn `combo.test.mjs` lỗi có sẵn từ upstream. `sw.js` dgt-v115.
- Cần ptg duyệt: 30 lần/ngày (≈60% một cấp), boss 3 lần/ngày × 15%.

## Phiên 123 — BOSS VÙNG (G4.1 phần local)
- `js/data/monsters.js`: 3 boss — Lão Mộc Tinh (20, Mộc, bãi Bắc), Sơn Cước Đầu Mục (25, Kim, bãi Đông), Thủy Mẫu Hồ Thác (45, Thủy, bãi Tây); `elite:false, boss:true`; vùng có `boss: '<id>'`; `MON_CFG.bossMul = 8` (Oán Khí = (30+12·cấp)×8, vd 2160); `RESPAWN_CFG.boss = [2700,2700]` (45 phút). Hạt sen rơi 12–30 (vẫn bị trần 100/ngày). Tất cả TẠM.
- `js/world/spawn.js`: boss nằm NGOÀI cap/eliteMax của vùng, tối đa 1 con/vùng, hẹn giờ hồi sinh riêng (`timers[].boss`); `monsterStats().boss`. `js/world/monsterAttack.js`: boss đánh theo bộ số tinh anh. `js/world/farm.js` `settleKill`: boss → nguồn 'boss' (15% cấp kế, trần 3/ngày, chung bộ đếm `cnt.boss` với thu phục yêu quái hằng tháng), không ăn vào trần hàng yêu.
- `js/ui/farm.js`: boss HIỆN CẢ BAN NGÀY (quái thường vẫn chỉ ban đêm), nằm ngủ; thân to 1,8 m, nhãn "Boss vùng". `js/scene/farm.js`: boss vẽ to ×1,7, vòng Hệ như tinh anh.
- Test: `spawn.test` (+1, sửa đếm cap loại boss), `farm.test` (+1), `farmui.test` (ban ngày còn boss). `sw.js` dgt-v116.
- GIỚI HẠN / việc kế: boss sinh LOCAL theo từng người, CHƯA chung phòng qua Firebase (GDD: "boss vùng dùng chung cả phòng"); CHƯA có vòng đỏ báo hiệu dưới đất (chỉ gồng chiêu như quái thường); chưa có rơi Linh Ấn/Huyền Tinh (chờ hệ vật phẩm); chưa chơi thử trình duyệt. Đồi Bảo Tháp (Thổ) và boss Thạch Linh Hộ Tháp chưa có vùng.

## Phiên 124 — Vòng đỏ báo đòn
- `js/scene/farm.js`: mỗi ô quái có đĩa đỏ `danger` (CircleGeometry) hiện khi `m.wind > 0` (đang gồng): bán kính = `ATTACK_CFG.reach[loại] × missSlack` (đúng vùng trúng đòn của `stepMonster`), lớn dần 35%→100% và đậm dần theo tiến độ gồng (0,7 s). Hết gồng mà đứng ngoài đĩa = né được (trùng logic `miss`). Áp dụng cho MỌI quái, boss có đĩa to hơn vì tầm tinh anh.
- Kiểm: game tải không lỗi trang (Chromium giả lập, three cục bộ); boss Lão Mộc Tinh hiện trong bãi Bắc. CHƯA thấy được vòng đỏ trong ảnh chụp (hộp "Tạo nhân vật" + camera sát bụi che; dịch tới `LGT.world.teleport` không đổi góc nhìn) → ptg cần xem thật trong game. Không có test tự động cho phần vẽ.
- Việc kế: boss dùng chung qua Firebase; rơi Linh Ấn/Huyền Tinh; hai chiêu riêng của boss (hiện chỉ một kiểu đòn); G2.5 thanh kỹ năng; Đồi Bảo Tháp.
