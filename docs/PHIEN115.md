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
